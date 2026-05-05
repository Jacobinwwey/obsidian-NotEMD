import { App, TFile, TFolder } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { getProviderForTask, getModelForTask, splitContent, createConcurrentProcessor } from './utils';
import { callLLM, handleApiError } from './llmUtils';
import { getSystemPrompt } from './promptUtils';
import { resolveLanguageDisplayName } from './i18n/languageContext';
import { formatI18n, getI18nStrings } from './i18n';

export interface TranslateFileResult {
    sourcePath: string;
    targetLanguage: string;
    requestedOutputFolderPath: string;
    outputFolderPath: string;
    outputFolderCreated: boolean;
    usedFallbackOutputFolder: boolean;
    outputPath: string;
    created: boolean;
    overwritten: boolean;
    openedInWorkspace: boolean;
    chunkCount: number;
}

export interface BatchTranslateFolderOptions {
    reporter?: ProgressReporter;
}

export interface BatchTranslateFolderResult {
    folderPath: string;
    requestedOutputFolderPath: string;
    outputFolderPath: string;
    outputFolderCreated: boolean;
    targetLanguage: string;
    processedFileCount: number;
    translatedCount: number;
    cancelled: boolean;
    fileResults: TranslateFileResult[];
    errors: Array<{ file: string; message: string }>;
}

function createNoopReporter(): ProgressReporter {
    return {
        log: () => undefined,
        updateStatus: () => undefined,
        requestCancel: () => undefined,
        clearDisplay: () => undefined,
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: () => undefined
    };
}

async function resolveTranslationOutputFolder(
    app: App,
    settings: NotemdSettings,
    sourceParentPath: string | null | undefined
): Promise<{
    requestedOutputFolderPath: string;
    outputFolderPath: string;
    outputFolderCreated: boolean;
    usedFallbackOutputFolder: boolean;
}> {
    const fallbackOutputFolderPath = sourceParentPath || '/';
    const requestedOutputFolderPath = (settings.useCustomTranslationSavePath && settings.translationSavePath)
        ? settings.translationSavePath
        : fallbackOutputFolderPath;
    let outputFolderPath = requestedOutputFolderPath;
    let outputFolderCreated = false;
    let usedFallbackOutputFolder = false;

    if (settings.useCustomTranslationSavePath && settings.translationSavePath) {
        const existingFolder = app.vault.getAbstractFileByPath(outputFolderPath);
        if (!existingFolder) {
            try {
                await app.vault.createFolder(outputFolderPath);
                outputFolderCreated = true;
            } catch (error) {
                console.error(`Error creating translation folder at ${outputFolderPath}:`, error);
                outputFolderPath = fallbackOutputFolderPath;
                usedFallbackOutputFolder = true;
            }
        }
    }

    return {
        requestedOutputFolderPath,
        outputFolderPath,
        outputFolderCreated,
        usedFallbackOutputFolder
    };
}

export async function batchTranslateFolder(
	app: App,
	settings: NotemdSettings,
	folder: TFolder,
    targetLanguage: string,
    options: BatchTranslateFolderOptions = {}
): Promise<BatchTranslateFolderResult> {
	const files = folder.children.filter(
		(file): file is TFile => file instanceof TFile && file.extension === 'md'
	);
    const result: BatchTranslateFolderResult = {
        folderPath: folder.path,
        requestedOutputFolderPath: (settings.useCustomTranslationSavePath && settings.translationSavePath)
            ? settings.translationSavePath
            : folder.path,
        outputFolderPath: (settings.useCustomTranslationSavePath && settings.translationSavePath)
            ? settings.translationSavePath
            : folder.path,
        outputFolderCreated: false,
        targetLanguage,
        processedFileCount: files.length,
        translatedCount: 0,
        cancelled: false,
        fileResults: [],
        errors: []
    };

	if (files.length === 0) {
		return result;
	}

	const progressReporter = options.reporter ?? createNoopReporter();

	const processFile = async (file: TFile) => {
		try {
			const fileResult = await translateFile(app, settings, file, targetLanguage, progressReporter, false);
            if (!fileResult) {
                return;
            }
			progressReporter.log(`Successfully translated ${file.name}`);
            result.fileResults.push(fileResult);
            result.outputFolderPath = fileResult.outputFolderPath;
            result.outputFolderCreated = result.outputFolderCreated || fileResult.outputFolderCreated;
            result.translatedCount += 1;
		} catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push({ file: file.name, message: errorMessage });
			progressReporter.log(`Failed to translate ${file.name}: ${errorMessage}`);
		}
	};

	const concurrentProcessor = createConcurrentProcessor(
		settings.batchConcurrency,
        settings.apiCallIntervalMs,
		progressReporter
	);

    const tasks = files.map(file => () => processFile(file));
	await concurrentProcessor(tasks);
    result.cancelled = progressReporter.cancelled;

    return result;
}


export async function translateFile(
    app: App,
    settings: NotemdSettings,
    file: TFile,
    targetLanguage: string,
    progressReporter: ProgressReporter,
    openFile = false, // Default to false
    signal?: AbortSignal
): Promise<TranslateFileResult | null> {
    const i18n = getI18nStrings({ uiLocale: settings.uiLocale });
    const fileContent = await app.vault.read(file);
    if (!fileContent) {
        throw new Error(i18n.notices.fileEmpty);
    }

    const provider = getProviderForTask('translate', settings);

    if (!provider) {
        throw new Error(i18n.notices.noTranslationProviderConfigured);
    }
    const model = getModelForTask('translate', provider, settings);

    const promptLanguageName = resolveLanguageDisplayName(settings, targetLanguage);
    const prompt = getSystemPrompt(settings, 'translate', {
        LANGUAGE: promptLanguageName,
        TEXT: fileContent,
    });

    try {
        const chunks = splitContent(fileContent, settings);
        const totalChunks = chunks.length;
        let translatedChunks: string[] = [];

        for (let i = 0; i < totalChunks; i++) {
            if (signal?.aborted) {
                throw new Error('Translation cancelled by user.');
            }

            const chunk = chunks[i];
            const chunkProgress = Math.floor(((i) / totalChunks) * 100);
            progressReporter.updateStatus(
                formatI18n(i18n.sidebar.status.stepLabel, {
                    current: i + 1,
                    total: totalChunks,
                    label: i18n.sidebar.actions.translateCurrentFile.label
                }),
                chunkProgress
            );
            progressReporter.log(`Translating chunk ${i + 1}/${totalChunks}...`);

            const translatedChunk = await callLLM(provider, prompt, chunk, settings, progressReporter, model, signal);
            translatedChunks.push(translatedChunk);
        }

        const translatedText = translatedChunks.join('\n\n');
        const outputFolder = await resolveTranslationOutputFolder(app, settings, file.parent?.path);
        const savePath = outputFolder.outputFolderPath;

        const suffix = settings.useCustomTranslationSuffix ? settings.translationCustomSuffix : `_${targetLanguage}`;
        const fileName = `${file.basename}${suffix}.md`;
        
        // Handle root path correctly
        const fullPath = savePath === '/' || savePath === '' ? fileName : `${savePath}/${fileName}`;

        const existingFile = app.vault.getAbstractFileByPath(fullPath);
        const overwritten = Boolean(existingFile);
        const created = !existingFile;
        if (existingFile) {
            await app.vault.modify(existingFile as TFile, translatedText);
        } else {
            await app.vault.create(fullPath, translatedText);
        }
        
        let openedInWorkspace = false;
        if (openFile) {
            const newFile = app.vault.getAbstractFileByPath(fullPath);
            if (newFile instanceof TFile) {
                await app.workspace.getLeaf(true).openFile(newFile);
                openedInWorkspace = true;
            }
        }

        return {
            sourcePath: file.path,
            targetLanguage,
            requestedOutputFolderPath: outputFolder.requestedOutputFolderPath,
            outputFolderPath: outputFolder.outputFolderPath,
            outputFolderCreated: outputFolder.outputFolderCreated,
            usedFallbackOutputFolder: outputFolder.usedFallbackOutputFolder,
            outputPath: fullPath,
            created,
            overwritten,
            openedInWorkspace,
            chunkCount: totalChunks
        };
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            progressReporter.log('Translation cancelled by user.');
            progressReporter.updateStatus(i18n.sidebar.status.cancelling, -1);
            throw new Error('Translation cancelled by user.'); // Re-throw for main.ts to catch
        }
        
        // Use handleApiError for consistent debugging (it might throw, which is fine as we want to re-throw anyway)
        try {
            handleApiError('Translate', error, progressReporter, settings.enableApiErrorDebugMode);
        } catch (e) {
            // handleApiError throws a formatted error. 
            // We log it and let it propagate or re-throw original if needed.
            console.error('Translation Error:', error);
            throw e; // Throw the formatted error from handleApiError
        }
    }
}
