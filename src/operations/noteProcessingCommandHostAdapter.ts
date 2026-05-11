import { App, Editor, MarkdownView, TFile, TFolder } from 'obsidian';
import { BatchProgressStore } from '../batchProgressStore';
import {
    BatchGenerateContentForTitlesResult,
    BatchProcessFolderResult,
    batchGenerateContentForTitles,
    ConceptExtractionPluginContext,
    createConceptNotes,
    extractConceptsFromFile,
    GenerateContentForTitleResult,
    processFile,
    generateContentForTitle,
    ProcessFileResult
} from '../fileUtils';
import {
    BatchExtractOriginalTextResult,
    ExtractOriginalTextPluginContext,
    ExtractOriginalTextResult,
    extractOriginalText
} from '../extractOriginalText';
import { formatI18n } from '../i18n';
import { researchAndSummarize } from '../searchUtils';
import { BatchTranslateFolderResult, batchTranslateFolder, TranslateFileResult, translateFile } from '../translate';
import { normalizeNameForFilePath } from '../utils';
import { chunkArray, createConcurrentProcessor, delay } from '../utils';
import { NotemdSettings, ProgressReporter, TaskKey } from '../types';
import { SidebarActionId } from '../workflowButtons';
import { applyFolderTaskSelectionOverride, FolderTaskFileSelectionOverride, selectFolderTaskFiles } from '../folderTaskFileSelector';

export interface NoteProcessingPluginRuntime extends ConceptExtractionPluginContext, ExtractOriginalTextPluginContext {}

export interface NoteProcessingCommandUiStrings {
    commands: {
        extractConceptsAndGenerateTitles: string;
        createWikiLinkAndGenerateNoteFromSelection: string;
    };
    notices: {
        notemdBusy: string;
        noActiveFile: string;
        noTopicFound: string;
        selectValidWord: string;
        setConceptNoteFolder: string;
        generatedContentForWord: string;
        genericError: string;
        batchTranslationFailedWithMessage: string;
        batchTranslationCompleted: string;
        failedTranslateFileWithMessage: string;
        translatedFileSavedTo: string;
        processingComplete: string;
        processingError: string;
        batchProcessingCancelled: string;
        noMarkdownOrTextFilesFoundSelectedFolder: string;
        batchProcessingFinishedWithErrors: string;
        batchProcessingSuccess: string;
        batchProcessingError: string;
        conceptExtractionSuccess: string;
        noConceptsFoundToExtract: string;
        conceptExtractionError: string;
        batchExtractionCancelled: string;
        batchExtractionFinishedWithErrors: string;
        batchExtractionSuccess: string;
        batchExtractionError: string;
        genericErrorSeeConsoleForDetails: string;
        batchGenerationCancelled: string;
        batchGenerationFinishedWithErrors: string;
        batchGenerationSuccess: string;
        batchGenerationError: string;
        noEligibleMarkdownFilesFoundExcluding: string;
        contentGenerationSuccess: string;
        contentGenerationError: string;
        researchError: string;
        extractionCompleteSavedTo: string;
        batchExtractOriginalTextCancelled?: string;
        batchExtractOriginalTextFinishedWithErrors?: string;
        batchExtractOriginalTextSuccess?: string;
        batchExtractOriginalTextError?: string;
    };
    sidebar: {
        status: {
            processingStopped: string;
        };
    };
    errorModal: {
        titles: {
            contentGeneration: string;
            research: string;
            processing: string;
            batchProcessing: string;
            batchTranslation: string;
            translation: string;
            conceptExtraction: string;
            batchConceptExtraction: string;
            extraction: string;
            generic: string;
            batchGeneration: string;
        };
    };
}

export interface NoteProcessingCommandHost {
    getApp: () => App;
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getPluginRuntime: () => NoteProcessingPluginRuntime;
    getActiveFile: () => TFile | null;
    getFileByPath: (path: string) => TFile | null;
    getFolderByPath: (path: string) => TFolder | null;
    getFiles: () => TFile[];
    getFolderSelection: () => Promise<string | null>;
    getTaskLanguageCode: (task: Extract<TaskKey, 'translate'>) => string;
    resolveCompleteFolderPath: (sourceFolderPath: string) => string | null;
    getStepStatusText: (current: number, total: number, label: string) => string;
    currentProcessingFileBasename: { value: string | null };
    getBatchProgressStore: () => Pick<BatchProgressStore, 'start' | 'markCompleted'>;
    getUiStrings: () => NoteProcessingCommandUiStrings;
    getActionLabel: (actionId: SidebarActionId) => string;
    getReporter: () => ProgressReporter;
    isBusy: () => boolean;
    setBusy: (busy: boolean) => void;
    startReporterAction: (reporter: ProgressReporter, label: string) => void;
    failReporterAction: (reporter: ProgressReporter, message: string) => string;
    updateStatusBar: (message: string) => void;
    getRunningActionText: (label: string) => string;
    getActionCompleteText: (label: string) => string;
    ensureConceptNotePathConfiguredForActions: (actionLabels: string[]) => Promise<boolean>;
    showNotice: (message: string, duration?: number) => void;
    logError: (message: string, details: string) => void;
    openErrorModal: (title: string, details: string) => void;
    saveErrorLog: (error: unknown, reporter: ProgressReporter) => Promise<void>;
    maybeAutoFixMermaidForFile: (file: TFile, reporter: ProgressReporter, reason: string) => Promise<void>;
    maybeAutoFixMermaidForFolder: (folderPath: string | null, reporter: ProgressReporter, reason: string) => Promise<void>;
    appendVaultLog: (path: string, content: string) => Promise<void>;
    completeReporter: (reporter: ProgressReporter) => void;
    finalizeReporter: (reporter: ProgressReporter) => void;
}

export interface FolderTaskCommandSelectionOptions {
    folderPathOverride?: string;
    fileSelectionOverride?: FolderTaskFileSelectionOverride;
}

function actionRequiresConceptNotePath(actionId: SidebarActionId): boolean {
    return actionId === 'process-current-add-links'
        || actionId === 'process-folder-add-links'
        || actionId === 'extract-concepts-current'
        || actionId === 'extract-concepts-folder';
}

async function ensureConceptNotePathIfNeeded(
    host: NoteProcessingCommandHost,
    actionIds: SidebarActionId[]
): Promise<boolean> {
    const relevantActions = actionIds.filter(actionRequiresConceptNotePath);
    if (relevantActions.length === 0) {
        return true;
    }

    const labels = relevantActions.map(actionId => host.getActionLabel(actionId));
    return host.ensureConceptNotePathConfiguredForActions(labels);
}

function normalizeError(
    error: unknown,
    fallbackMessage: string
): { errorMessage: string; errorDetails: string } {
    if (error instanceof Error) {
        return {
            errorMessage: error.message,
            errorDetails: error.stack || error.message
        };
    }

    return {
        errorMessage: fallbackMessage,
        errorDetails: String(error)
    };
}

function isCancellationError(errorMessage: string): boolean {
    return errorMessage.includes('cancelled by user');
}

async function runBusyReporterCommandWithHost(
    host: NoteProcessingCommandHost,
    actionLabel: string,
    reporter: ProgressReporter | undefined,
    run: (useReporter: ProgressReporter) => Promise<void>
): Promise<void> {
    if (host.isBusy()) {
        host.showNotice(host.getUiStrings().notices.notemdBusy);
        return;
    }

    const useReporter = reporter || host.getReporter();
    host.setBusy(true);
    host.startReporterAction(useReporter, actionLabel);

    try {
        await run(useReporter);
    } finally {
        host.finalizeReporter(useReporter);
        host.setBusy(false);
    }
}

function getConceptNoteOptions(settings: NotemdSettings): { disableBacklink: boolean; minimalTemplate: boolean } {
    return {
        disableBacklink: !settings.extractConceptsAddBacklink,
        minimalTemplate: settings.extractConceptsMinimalTemplate
    };
}

async function runExtractConceptsCommandCoreWithHost(
    host: NoteProcessingCommandHost,
    useReporter: ProgressReporter,
    extractConceptsFromFileImpl: typeof extractConceptsFromFile = extractConceptsFromFile,
    createConceptNotesImpl: typeof createConceptNotes = createConceptNotes
): Promise<void> {
    let uiStrings = host.getUiStrings();
    const actionLabel = host.getActionLabel('extract-concepts-current');

    await host.loadSettings();
    uiStrings = host.getUiStrings();

    const activeFile = host.getActiveFile();
    if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
        throw new Error("No active '.md' or '.txt' file to extract concepts from.");
    }

    host.updateStatusBar(host.getRunningActionText(`${actionLabel}: ${activeFile.name}`));

    const concepts = await extractConceptsFromFileImpl(
        host.getApp(),
        host.getPluginRuntime(),
        activeFile,
        useReporter
    );

    if (concepts.size > 0) {
        useReporter.log(`Found ${concepts.size} concepts. Creating concept notes...`);
        await createConceptNotesImpl(
            host.getApp(),
            host.getSettings(),
            concepts,
            activeFile.basename,
            getConceptNoteOptions(host.getSettings())
        );
        useReporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
        host.showNotice(formatI18n(uiStrings.notices.conceptExtractionSuccess, { count: concepts.size }));
        return;
    }

    useReporter.updateStatus(uiStrings.notices.noConceptsFoundToExtract, 100);
    host.showNotice(uiStrings.notices.noConceptsFoundToExtract);
}

async function runBatchGenerateContentForTitlesCommandCoreWithHost(
    host: NoteProcessingCommandHost,
    useReporter: ProgressReporter,
    folderPathOverride?: string,
    batchGenerateContentForTitlesImpl: typeof batchGenerateContentForTitles = batchGenerateContentForTitles,
    fileSelectionOverride?: FolderTaskFileSelectionOverride
): Promise<BatchGenerateContentForTitlesResult | null> {
    let uiStrings = host.getUiStrings();
    const actionLabel = host.getActionLabel('batch-generate-from-titles');
    let commandResult: BatchGenerateContentForTitlesResult | null = null;

    await host.loadSettings();
    uiStrings = host.getUiStrings();
    const effectiveSettings = applyFolderTaskSelectionOverride(host.getSettings(), fileSelectionOverride);
    const folderPath = folderPathOverride ?? await host.getFolderSelection();
    if (!folderPath) {
        useReporter.log(uiStrings.notices.batchGenerationCancelled);
        useReporter.updateStatus(uiStrings.notices.batchGenerationCancelled, -1);
        throw new Error(uiStrings.notices.batchGenerationCancelled);
    }

    host.updateStatusBar(host.getRunningActionText(actionLabel));
    useReporter.log(host.getRunningActionText(actionLabel));

    commandResult = await batchGenerateContentForTitlesImpl(
        host.getApp(),
        effectiveSettings,
        folderPath,
        useReporter
    );

    if (!commandResult) {
        return null;
    }

    if (commandResult.processedFileCount === 0) {
        const message = formatI18n(uiStrings.notices.noEligibleMarkdownFilesFoundExcluding, {
            folderPath,
            completeFolder: commandResult.completeFolderPath.split('/').pop() || commandResult.completeFolderPath
        });
        useReporter.log(message);
        useReporter.updateStatus(message, 100);
        host.updateStatusBar(message);
        host.showNotice(message);
        return commandResult;
    }

    if (commandResult.generatedCount > 0) {
        await host.maybeAutoFixMermaidForFolder(
            commandResult.completeFolderPath,
            useReporter,
            'batch generate from titles'
        );
    }

    if (useReporter.cancelled || commandResult.cancelled) {
        host.updateStatusBar(uiStrings.notices.batchGenerationCancelled);
        host.showNotice(uiStrings.notices.batchGenerationCancelled);
        return commandResult;
    }

    if (commandResult.errors.length > 0) {
        const errorSummary = formatI18n(uiStrings.notices.batchGenerationFinishedWithErrors, {
            count: commandResult.errors.length
        });
        useReporter.log(`⚠️ ${errorSummary}`);
        useReporter.updateStatus(errorSummary, -1);
        host.updateStatusBar(errorSummary);
        host.showNotice(errorSummary, 10000);
    } else {
        const completeText = host.getActionCompleteText(actionLabel);
        useReporter.updateStatus(completeText, 100);
        host.updateStatusBar(completeText);
        host.showNotice(formatI18n(uiStrings.notices.batchGenerationSuccess, {
            folderPath
        }), 5000);
        host.completeReporter(useReporter);
    }

    return commandResult;
}

export async function runBatchTranslateFolderCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    folder?: TFolder,
    batchTranslateFolderImpl: typeof batchTranslateFolder = batchTranslateFolder,
    fileSelectionOverride?: FolderTaskFileSelectionOverride
): Promise<BatchTranslateFolderResult | null> {
    const actionLabel = host.getActionLabel('batch-translate-folder');
    let commandResult: BatchTranslateFolderResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const effectiveSettings = applyFolderTaskSelectionOverride(host.getSettings(), fileSelectionOverride);
            let targetFolder = folder;
            if (!targetFolder) {
                const folderPath = await host.getFolderSelection();
                if (!folderPath) {
                    throw new Error('Folder selection cancelled.');
                }
                const selectedFolder = host.getFolderByPath(folderPath);
                if (!selectedFolder) {
                    throw new Error('Invalid folder selected.');
                }
                targetFolder = selectedFolder;
            }

            const translateLanguage = host.getTaskLanguageCode('translate');
            commandResult = await batchTranslateFolderImpl(
                host.getApp(),
                effectiveSettings,
                targetFolder,
                translateLanguage,
                { reporter: useReporter }
            );

            if (!commandResult || useReporter.cancelled || commandResult.cancelled) {
                return;
            }

            if (commandResult.processedFileCount === 0) {
                const message = formatI18n(uiStrings.notices.noMarkdownOrTextFilesFoundSelectedFolder, {
                    folderPath: targetFolder.path
                });
                useReporter.log(message);
                useReporter.updateStatus(message, -1);
                host.showNotice(message);
                return;
            }

            if (commandResult.translatedCount > 0) {
                await host.maybeAutoFixMermaidForFolder(
                    commandResult.outputFolderPath,
                    useReporter,
                    'batch translate folder'
                );
            }

            if (commandResult.errors.length > 0) {
                const errorSummary = formatI18n(uiStrings.notices.batchProcessingFinishedWithErrors, {
                    count: commandResult.errors.length
                });
                useReporter.log(`⚠️ ${errorSummary}`);
                useReporter.updateStatus(errorSummary, -1);
                host.updateStatusBar(errorSummary);
                host.showNotice(errorSummary, 10000);
            } else {
                const completeText = host.getActionCompleteText(actionLabel);
                useReporter.updateStatus(completeText, 100);
                host.updateStatusBar(completeText);
                host.showNotice(formatI18n(uiStrings.notices.batchTranslationCompleted, {
                    count: commandResult.translatedCount
                }), 5000);
                host.completeReporter(useReporter);
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during batch translation.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(uiStrings.notices.batchTranslationFailedWithMessage, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.batchTranslation, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runTranslateFileCommandWithHost(
    host: NoteProcessingCommandHost,
    file: TFile,
    signal?: AbortSignal,
    reporter?: ProgressReporter,
    translateFileImpl: typeof translateFile = translateFile
): Promise<TranslateFileResult | null> {
    const actionLabel = host.getActionLabel('translate-current-file');
    let commandResult: TranslateFileResult | null = null;

    await runBusyReporterCommandWithHost(
        host,
        `${actionLabel}: ${file.name}`,
        reporter,
        async (useReporter) => {
            let uiStrings = host.getUiStrings();

            try {
                await host.loadSettings();
                uiStrings = host.getUiStrings();
                const translateLanguage = host.getTaskLanguageCode('translate');
                commandResult = await translateFileImpl(
                    host.getApp(),
                    host.getSettings(),
                    file,
                    translateLanguage,
                    useReporter,
                    true,
                    signal
                );

                if (commandResult && host.getSettings().autoMermaidFixAfterGenerate) {
                    const outputFile = host.getFileByPath(commandResult.outputPath);
                    if (outputFile) {
                        await host.maybeAutoFixMermaidForFile(outputFile, useReporter, 'translate current file');
                    }
                }

                if (commandResult) {
                    host.showNotice(formatI18n(uiStrings.notices.translatedFileSavedTo, {
                        path: commandResult.outputPath
                    }));
                }
                const completeText = host.getActionCompleteText(actionLabel);
                host.updateStatusBar(completeText);
                useReporter.log('Translation complete.');
                useReporter.updateStatus(completeText, 100);
                host.completeReporter(useReporter);
            } catch (error: unknown) {
                const { errorMessage, errorDetails } = normalizeError(
                    error,
                    'An unknown error occurred during translation.'
                );

                if (!isCancellationError(errorMessage)) {
                    host.logError('Translation Error:', errorDetails);
                    host.showNotice(formatI18n(uiStrings.notices.failedTranslateFileWithMessage, {
                        message: errorMessage
                    }), 10000);
                    host.openErrorModal(uiStrings.errorModal.titles.translation, errorDetails);
                    await host.saveErrorLog(error, useReporter);
                }

                useReporter.log(`Error: ${errorMessage}`);
                host.failReporterAction(useReporter, errorMessage);
            }
        }
    );

    return commandResult;
}

export async function runExtractConceptsCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    extractConceptsFromFileImpl: typeof extractConceptsFromFile = extractConceptsFromFile,
    createConceptNotesImpl: typeof createConceptNotes = createConceptNotes
): Promise<void> {
    const actionLabel = host.getActionLabel('extract-concepts-current');

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        try {
            if (!(await ensureConceptNotePathIfNeeded(host, ['extract-concepts-current']))) {
                return;
            }
            await runExtractConceptsCommandCoreWithHost(
                host,
                useReporter,
                extractConceptsFromFileImpl,
                createConceptNotesImpl
            );
            host.completeReporter(useReporter);
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during concept extraction.'
            );
            const uiStrings = host.getUiStrings();

            if (!isCancellationError(errorMessage)) {
                host.showNotice(formatI18n(uiStrings.notices.conceptExtractionError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.conceptExtraction, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });
}

export async function runBatchExtractConceptsForFolderCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    extractConceptsFromFileImpl: typeof extractConceptsFromFile = extractConceptsFromFile,
    createConceptNotesImpl: typeof createConceptNotes = createConceptNotes,
    options: FolderTaskCommandSelectionOptions = {}
): Promise<void> {
    const actionLabel = host.getActionLabel('extract-concepts-folder');

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            if (!(await ensureConceptNotePathIfNeeded(host, ['extract-concepts-folder']))) {
                return;
            }
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const settings = host.getSettings();
            const effectiveSettings = applyFolderTaskSelectionOverride(settings, options.fileSelectionOverride);
            const folderPath = options.folderPathOverride ?? await host.getFolderSelection();
            if (!folderPath) {
                throw new Error('Folder selection cancelled.');
            }

            const folder = host.getFolderByPath(folderPath);
            if (!folder) {
                throw new Error(`Invalid folder selected: ${folderPath}`);
            }

            const files = selectFolderTaskFiles({
                taskKind: 'extract-concepts-folder',
                folderPath,
                files: host.getFiles(),
                allowedExtensions: ['md', 'txt'],
                settings: effectiveSettings
            });

            if (files.length === 0) {
                const noFilesMessage = formatI18n(uiStrings.notices.noMarkdownOrTextFilesFoundSelectedFolder, {
                    folderPath
                });
                host.showNotice(noFilesMessage);
                host.completeReporter(useReporter);
                return;
            }

            host.updateStatusBar(host.getRunningActionText(actionLabel));
            useReporter.log(host.getRunningActionText(actionLabel));
            const errors: Array<{ file: string; message: string }> = [];
            let totalConcepts = 0;

            if (!settings.enableBatchParallelism || settings.batchConcurrency <= 1) {
                for (let index = 0; index < files.length; index++) {
                    const file = files[index];
                    if (useReporter.cancelled) {
                        host.showNotice(uiStrings.notices.batchExtractionCancelled);
                        break;
                    }

                    const progress = Math.floor((index / files.length) * 100);
                    useReporter.updateStatus(host.getStepStatusText(index + 1, files.length, file.name), progress);

                    try {
                        const concepts = await extractConceptsFromFileImpl(
                            host.getApp(),
                            host.getPluginRuntime(),
                            file,
                            useReporter
                        );
                        if (concepts.size > 0) {
                            totalConcepts += concepts.size;
                            await createConceptNotesImpl(
                                host.getApp(),
                                settings,
                                concepts,
                                file.basename,
                                getConceptNoteOptions(settings)
                            );
                        }
                    } catch (fileError: unknown) {
                        const message = fileError instanceof Error ? fileError.message : String(fileError);
                        errors.push({ file: file.name, message });
                        useReporter.log(`❌ Error processing ${file.name}: ${message}`);
                        if (message.includes('cancelled by user')) {
                            break;
                        }
                    }
                }
            } else {
                const concurrency = Math.min(settings.batchConcurrency, 20);
                const processor = createConcurrentProcessor(concurrency, settings.apiCallIntervalMs, useReporter);
                const fileBatches = chunkArray(files, settings.batchSize);
                let processedCount = 0;

                for (let batchIndex = 0; batchIndex < fileBatches.length; batchIndex++) {
                    const batch = fileBatches[batchIndex];
                    useReporter.log(`Processing batch ${batchIndex + 1}/${fileBatches.length} (${batch.length} files)`);
                    if (useReporter.cancelled) {
                        break;
                    }

                    const tasks = batch.map(file => async () => {
                        const fileProgressReporter: ProgressReporter = {
                            log: (message: string) => useReporter.log(`[${file.name}] ${message}`),
                            updateStatus: (message: string, percentage?: number) => {
                                if (percentage !== undefined) {
                                    const overallProgress = Math.floor(((processedCount + (percentage / 100)) / files.length) * 100);
                                    useReporter.updateStatus(
                                        host.getStepStatusText(processedCount, files.length, `${file.name}: ${message}`),
                                        overallProgress
                                    );
                                } else {
                                    useReporter.updateStatus(
                                        host.getStepStatusText(processedCount, files.length, `${file.name}: ${message}`)
                                    );
                                }
                            },
                            cancelled: useReporter.cancelled,
                            requestCancel: () => useReporter.requestCancel(),
                            clearDisplay: () => undefined,
                            abortController: useReporter.abortController,
                            activeTasks: useReporter.activeTasks,
                            updateActiveTasks: (delta: number) => useReporter.updateActiveTasks(delta)
                        };

                        try {
                            const concepts = await extractConceptsFromFileImpl(
                                host.getApp(),
                                host.getPluginRuntime(),
                                file,
                                fileProgressReporter
                            );
                            if (concepts.size > 0) {
                                totalConcepts += concepts.size;
                                await createConceptNotesImpl(
                                    host.getApp(),
                                    settings,
                                    concepts,
                                    file.basename,
                                    getConceptNoteOptions(settings)
                                );
                            }
                            return { file, success: true };
                        } catch (error: unknown) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                            return { file, success: false, error };
                        }
                    });

                    const results = await processor(tasks);
                    processedCount += batch.length;

                    results.forEach(result => {
                        const typedResult = result as { success: boolean; file: TFile; error?: unknown };
                        if (!typedResult.success && typedResult.error) {
                            const errorMessage = typedResult.error instanceof Error
                                ? typedResult.error.message
                                : String(typedResult.error);
                            errors.push({ file: typedResult.file.name, message: errorMessage });
                        }
                    });

                    if (useReporter.cancelled) {
                        useReporter.log('Cancellation requested, stopping batch processing.');
                        break;
                    }

                    if (settings.batchInterDelayMs > 0 && batchIndex < fileBatches.length - 1) {
                        useReporter.log(`Delaying for ${settings.batchInterDelayMs}ms before next batch...`);
                        await delay(settings.batchInterDelayMs);
                    }
                }
            }

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(uiStrings.notices.batchExtractionFinishedWithErrors, {
                        count: errors.length
                    });
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    host.showNotice(errorSummary, 10000);
                } else {
                    const successMessage = formatI18n(uiStrings.notices.batchExtractionSuccess, {
                        concepts: totalConcepts,
                        files: files.length
                    });
                    useReporter.updateStatus(successMessage, 100);
                    host.showNotice(successMessage);
                    host.completeReporter(useReporter);
                }
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during batch extraction.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(uiStrings.notices.batchExtractionError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.batchConceptExtraction, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Batch Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });
}

export async function runExtractConceptsAndGenerateTitlesCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    extractConceptsFromFileImpl: typeof extractConceptsFromFile = extractConceptsFromFile,
    createConceptNotesImpl: typeof createConceptNotes = createConceptNotes,
    batchGenerateContentForTitlesImpl: typeof batchGenerateContentForTitles = batchGenerateContentForTitles
): Promise<void> {
    const commandLabel = host.getUiStrings().commands.extractConceptsAndGenerateTitles;

    await runBusyReporterCommandWithHost(host, commandLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            if (!(await ensureConceptNotePathIfNeeded(host, ['extract-concepts-current']))) {
                return;
            }
            await runExtractConceptsCommandCoreWithHost(
                host,
                useReporter,
                extractConceptsFromFileImpl,
                createConceptNotesImpl
            );

            await host.loadSettings();
            uiStrings = host.getUiStrings();
            if (host.getSettings().useCustomConceptNoteFolder && host.getSettings().conceptNoteFolder) {
                const conceptFolderPath = host.getSettings().conceptNoteFolder;
                const conceptFolder = host.getFolderByPath(conceptFolderPath);
                if (!conceptFolder) {
                    throw new Error('Concept note folder not found.');
                }

                await runBatchGenerateContentForTitlesCommandCoreWithHost(
                    host,
                    useReporter,
                    conceptFolderPath,
                    batchGenerateContentForTitlesImpl
                );
            } else {
                throw new Error('Concept note folder not set.');
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during the process.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(uiStrings.notices.genericErrorSeeConsoleForDetails, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.generic, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });
}

export async function runExtractOriginalTextCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    extractOriginalTextImpl: typeof extractOriginalText = extractOriginalText
): Promise<ExtractOriginalTextResult | null> {
    const actionLabel = host.getActionLabel('extract-original-text');
    let commandResult: ExtractOriginalTextResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const activeFile = host.getActiveFile();
            if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            commandResult = await extractOriginalTextImpl(host.getApp(), host.getPluginRuntime(), activeFile, useReporter);
            if (commandResult && !useReporter.cancelled) {
                useReporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
                host.showNotice(formatI18n(uiStrings.notices.extractionCompleteSavedTo, {
                    path: commandResult.outputPath
                }));
                host.completeReporter(useReporter);
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during extraction.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(uiStrings.notices.genericErrorSeeConsoleForDetails, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.extraction, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runBatchExtractOriginalTextCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    extractOriginalTextImpl: typeof extractOriginalText = extractOriginalText,
    options: FolderTaskCommandSelectionOptions = {}
): Promise<BatchExtractOriginalTextResult | null> {
    const actionLabel = host.getActionLabel('batch-extract-original-text');
    let commandResult: BatchExtractOriginalTextResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const effectiveSettings = applyFolderTaskSelectionOverride(host.getSettings(), options.fileSelectionOverride);
            const folderPath = options.folderPathOverride ?? await host.getFolderSelection();
            if (!folderPath) {
                const cancelledMessage = uiStrings.notices.batchExtractOriginalTextCancelled || uiStrings.notices.batchProcessingCancelled;
                useReporter.log(cancelledMessage);
                useReporter.updateStatus(cancelledMessage, -1);
                throw new Error(cancelledMessage);
            }

            const folder = host.getFolderByPath(folderPath);
            if (!folder) {
                throw new Error(`Invalid folder selected: ${folderPath}`);
            }

            const files = selectFolderTaskFiles({
                taskKind: 'batch-extract-original-text',
                folderPath,
                files: host.getFiles(),
                allowedExtensions: ['md', 'txt'],
                settings: effectiveSettings
            });

            commandResult = {
                folderPath,
                processedFileCount: files.length,
                extractedCount: 0,
                cancelled: false,
                fileResults: [],
                errors: []
            };

            if (files.length === 0) {
                const noFilesMessage = formatI18n(uiStrings.notices.noMarkdownOrTextFilesFoundSelectedFolder, {
                    folderPath
                });
                useReporter.log(noFilesMessage);
                useReporter.updateStatus(noFilesMessage, 100);
                host.showNotice(noFilesMessage);
                host.completeReporter(useReporter);
                return;
            }

            host.updateStatusBar(host.getRunningActionText(actionLabel));
            useReporter.log(host.getRunningActionText(actionLabel));

            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                if (useReporter.cancelled) {
                    break;
                }

                const progress = Math.floor((index / files.length) * 100);
                useReporter.updateStatus(host.getStepStatusText(index + 1, files.length, file.name), progress);

                try {
                    const result = await extractOriginalTextImpl(host.getApp(), host.getPluginRuntime(), file, useReporter);
                    if (result) {
                        commandResult.fileResults.push(result);
                        commandResult.extractedCount += 1;
                    }
                } catch (fileError: unknown) {
                    const message = fileError instanceof Error ? fileError.message : String(fileError);
                    commandResult.errors.push({ file: file.name, message });
                    useReporter.log(`❌ Error extracting from ${file.name}: ${message}`);
                    if (message.includes('cancelled by user')) {
                        break;
                    }
                }
            }

            commandResult.cancelled = useReporter.cancelled;

            if (!useReporter.cancelled) {
                if (commandResult.errors.length > 0) {
                    const errorSummary = formatI18n(
                        uiStrings.notices.batchExtractOriginalTextFinishedWithErrors || uiStrings.notices.batchProcessingFinishedWithErrors,
                        { count: commandResult.errors.length }
                    );
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    host.showNotice(errorSummary, 10000);
                } else {
                    const successMessage = formatI18n(
                        uiStrings.notices.batchExtractOriginalTextSuccess || uiStrings.notices.batchProcessingSuccess,
                        { count: commandResult.extractedCount }
                    );
                    useReporter.updateStatus(successMessage, 100);
                    host.showNotice(successMessage);
                    host.completeReporter(useReporter);
                }
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(
                error,
                'An unknown error occurred during batch extraction of original text.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(
                    uiStrings.notices.batchExtractOriginalTextError || uiStrings.notices.genericErrorSeeConsoleForDetails,
                    { message: errorMessage }
                ), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.extraction, errorMessage);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Batch Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runGenerateContentForTitleCommandWithHost(
    host: NoteProcessingCommandHost,
    file: TFile,
    reporter?: ProgressReporter,
    generateContentForTitleImpl: typeof generateContentForTitle = generateContentForTitle
): Promise<GenerateContentForTitleResult | null> {
    const actionLabel = host.getActionLabel('generate-from-title');
    let commandResult: GenerateContentForTitleResult | null = null;

    await runBusyReporterCommandWithHost(
        host,
        `${actionLabel}: ${file.name}`,
        reporter,
        async (useReporter) => {
            let uiStrings = host.getUiStrings();

            try {
                await host.loadSettings();
                uiStrings = host.getUiStrings();
                commandResult = await generateContentForTitleImpl(host.getApp(), host.getSettings(), file, useReporter);
                await host.maybeAutoFixMermaidForFile(file, useReporter, 'generate from title');

                const completeText = host.getActionCompleteText(actionLabel);
                host.updateStatusBar(completeText);
                useReporter.updateStatus(completeText, 100);
                host.showNotice(formatI18n(uiStrings.notices.contentGenerationSuccess, {
                    file: file.name
                }));
                host.completeReporter(useReporter);
            } catch (error: unknown) {
                const { errorMessage, errorDetails } = normalizeError(
                    error,
                    'An unknown error occurred during content generation.'
                );

                if (!isCancellationError(errorMessage)) {
                    host.logError(`Error generating content for ${file.name}:`, errorDetails);
                    host.showNotice(formatI18n(uiStrings.notices.contentGenerationError, {
                        message: errorMessage
                    }), 10000);
                    host.openErrorModal(uiStrings.errorModal.titles.contentGeneration, errorDetails);
                    await host.saveErrorLog(error, useReporter);
                }

                useReporter.log(`Error generating content for ${file.name}: ${errorMessage}`);
                host.failReporterAction(useReporter, errorMessage);
            }
        }
    );

    return commandResult;
}

export async function runCreateWikiLinkAndGenerateFromSelectionCommandWithHost(
    host: NoteProcessingCommandHost,
    editor: Editor,
    view: MarkdownView,
    reporter?: ProgressReporter,
    createConceptNotesImpl: typeof createConceptNotes = createConceptNotes,
    generateContentForTitleImpl: typeof generateContentForTitle = generateContentForTitle,
    normalizeNameForFilePathImpl: typeof normalizeNameForFilePath = normalizeNameForFilePath
): Promise<{ notePath: string; word: string; created: boolean } | null> {
    const actionLabel = host.getUiStrings().commands.createWikiLinkAndGenerateNoteFromSelection;
    let commandResult: { notePath: string; word: string; created: boolean } | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();
        const word = editor.getSelection().trim();

        if (!word || word.length < 2) {
            host.showNotice(uiStrings.notices.selectValidWord);
            return;
        }

        editor.replaceSelection(`[[${word}]]`);
        await host.loadSettings();
        uiStrings = host.getUiStrings();

        if (!host.getSettings().useCustomConceptNoteFolder || !host.getSettings().conceptNoteFolder) {
            host.showNotice(uiStrings.notices.setConceptNoteFolder);
            return;
        }

        const safeName = normalizeNameForFilePathImpl(word);
        const notePath = `${host.getSettings().conceptNoteFolder}/${safeName}.md`;

        try {
            let newFile = host.getFileByPath(notePath);
            let created = false;

            if (newFile) {
                await createConceptNotesImpl(
                    host.getApp(),
                    host.getSettings(),
                    new Set([word]),
                    view.file?.basename || null,
                    { disableBacklink: false }
                );
                useReporter.log(`Updated existing note: ${notePath}`);
            } else {
                await createConceptNotesImpl(
                    host.getApp(),
                    host.getSettings(),
                    new Set([word]),
                    view.file?.basename || null,
                    { minimalTemplate: false }
                );
                newFile = host.getFileByPath(notePath);
                if (!newFile) {
                    throw new Error('Failed to create note.');
                }
                created = true;
                useReporter.log(`Created blank note: ${notePath}`);
            }

            await generateContentForTitleImpl(host.getApp(), host.getSettings(), newFile, useReporter);
            await host.maybeAutoFixMermaidForFile(newFile, useReporter, 'create wiki-link and generate');

            const completeText = host.getActionCompleteText(actionLabel);
            host.updateStatusBar(completeText);
            useReporter.updateStatus(completeText, 100);
            host.showNotice(formatI18n(uiStrings.notices.generatedContentForWord, { word }));
            host.completeReporter(useReporter);

            commandResult = {
                notePath,
                word,
                created
            };
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during concept note generation.'
            );
            const message = formatI18n(uiStrings.notices.genericError, { message: errorMessage });
            host.logError('Create wiki-link and generate error:', errorDetails);
            host.showNotice(message);
            useReporter.log(message);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runResearchAndSummarizeCommandWithHost(
    host: NoteProcessingCommandHost,
    editor: Editor,
    view: MarkdownView,
    reporter?: ProgressReporter,
    researchAndSummarizeImpl: typeof researchAndSummarize = researchAndSummarize
): Promise<void> {
    const actionLabel = host.getActionLabel('research-and-summarize');

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();
        const activeFile = view.file;

        if (!activeFile) {
            host.showNotice(uiStrings.notices.noActiveFile);
            return;
        }

        const selectedText = editor.getSelection();
        const topic = selectedText ? selectedText.trim() : activeFile.basename;
        if (!topic) {
            host.showNotice(uiStrings.notices.noTopicFound);
            return;
        }

        host.updateStatusBar(host.getRunningActionText(`${actionLabel}: ${topic}`));
        useReporter.log(`Starting research for topic: "${topic}"`);

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            await researchAndSummarizeImpl(host.getApp(), host.getSettings(), editor, view, useReporter);

            if (activeFile instanceof TFile) {
                await host.maybeAutoFixMermaidForFile(activeFile, useReporter, 'research & summarize');
            }

            if (!useReporter.cancelled) {
                host.updateStatusBar(host.getActionCompleteText(actionLabel));
            } else {
                host.updateStatusBar(uiStrings.sidebar.status.processingStopped);
            }
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during research.'
            );

            if (!isCancellationError(errorMessage)) {
                host.logError(`Error researching "${topic}":`, errorDetails);
                host.showNotice(formatI18n(uiStrings.notices.researchError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.research, errorDetails);
                await host.saveErrorLog(error, useReporter);
            }

            if (!useReporter.cancelled) {
                useReporter.log(`Error: ${errorMessage}`);
                host.failReporterAction(useReporter, errorMessage);
            }
        }
    });
}

export async function runBatchGenerateContentForTitlesCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    folderPathOverride?: string,
    batchGenerateContentForTitlesImpl: typeof batchGenerateContentForTitles = batchGenerateContentForTitles,
    fileSelectionOverride?: FolderTaskFileSelectionOverride
): Promise<BatchGenerateContentForTitlesResult | null> {
    const actionLabel = host.getActionLabel('batch-generate-from-titles');
    let commandResult: BatchGenerateContentForTitlesResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            commandResult = await runBatchGenerateContentForTitlesCommandCoreWithHost(
                host,
                useReporter,
                folderPathOverride,
                batchGenerateContentForTitlesImpl,
                fileSelectionOverride
            );
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during batch generation.'
            );

            if (!errorMessage.includes('cancelled')) {
                host.logError('Notemd Batch Generation Error:', errorDetails);
                host.showNotice(formatI18n(uiStrings.notices.batchGenerationError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.batchGeneration, errorDetails);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Batch Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runProcessWithNotemdCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    processFileImpl: typeof processFile = processFile
): Promise<ProcessFileResult | null> {
    const actionLabel = host.getActionLabel('process-current-add-links');
    let commandResult: ProcessFileResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            if (!(await ensureConceptNotePathIfNeeded(host, ['process-current-add-links']))) {
                return;
            }
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const activeFile = host.getActiveFile();
            if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            host.updateStatusBar(host.getRunningActionText(`${actionLabel}: ${activeFile.name}`));
            commandResult = await processFileImpl(
                host.getApp(),
                host.getSettings(),
                activeFile,
                useReporter,
                host.currentProcessingFileBasename
            );

            if (commandResult && host.getSettings().autoMermaidFixAfterGenerate) {
                const outputFile = host.getFileByPath(commandResult.outputPath);
                if (outputFile) {
                    await host.maybeAutoFixMermaidForFile(outputFile, useReporter, 'process current file');
                } else {
                    useReporter.log(`Skipped Mermaid auto-fix: output file not found at ${commandResult.outputPath}`);
                }
            }

            const completeText = host.getActionCompleteText(actionLabel);
            host.updateStatusBar(completeText);
            useReporter.updateStatus(completeText, 100);
            host.showNotice(uiStrings.notices.processingComplete);
            host.completeReporter(useReporter);
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during processing.'
            );
            host.logError('Notemd Processing Error:', errorDetails);

            if (!isCancellationError(errorMessage)) {
                host.showNotice(formatI18n(uiStrings.notices.processingError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.processing, errorDetails);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runProcessFolderWithNotemdCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    folderPathOverride?: string,
    processFileImpl: typeof processFile = processFile,
    fileSelectionOverride?: FolderTaskFileSelectionOverride
): Promise<BatchProcessFolderResult | null> {
    const actionLabel = host.getActionLabel('process-folder-add-links');
    let commandResult: BatchProcessFolderResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            if (!(await ensureConceptNotePathIfNeeded(host, ['process-folder-add-links']))) {
                return;
            }
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const settings = host.getSettings();
            const effectiveSettings = applyFolderTaskSelectionOverride(settings, fileSelectionOverride);
            const folderPath = folderPathOverride ?? await host.getFolderSelection();
            if (!folderPath) {
                useReporter.log(uiStrings.notices.batchProcessingCancelled);
                useReporter.updateStatus(uiStrings.notices.batchProcessingCancelled, -1);
                throw new Error(uiStrings.notices.batchProcessingCancelled);
            }

            const folder = host.getFolderByPath(folderPath);
            if (!folder) {
                throw new Error(`Invalid folder selected: ${folderPath}`);
            }

            const files = selectFolderTaskFiles({
                taskKind: 'process-folder-add-links',
                folderPath,
                files: host.getFiles(),
                allowedExtensions: ['md', 'txt'],
                settings: effectiveSettings
            });

            const batchCommandResult: BatchProcessFolderResult = {
                folderPath,
                processedFileCount: files.length,
                savedCount: 0,
                cancelled: false,
                fileResults: [],
                errors: []
            };
            commandResult = batchCommandResult;

            if (files.length === 0) {
                const noFilesMessage = formatI18n(uiStrings.notices.noMarkdownOrTextFilesFoundSelectedFolder, {
                    folderPath
                });
                host.showNotice(noFilesMessage);
                useReporter.log(noFilesMessage);
                useReporter.updateStatus(noFilesMessage, 100);
                host.completeReporter(useReporter);
                return;
            }

            host.updateStatusBar(host.getRunningActionText(actionLabel));
            useReporter.log(host.getRunningActionText(actionLabel));
            const batchId = `process-folder-${Date.now()}`;
            const progressStore = host.getBatchProgressStore();
            progressStore.start(batchId, 'process-folder', folderPath, files);

            if (!settings.enableBatchParallelism || settings.batchConcurrency <= 1) {
                for (let index = 0; index < files.length; index++) {
                    const file = files[index];
                    if (useReporter.cancelled) {
                        host.showNotice(uiStrings.notices.batchProcessingCancelled);
                        host.updateStatusBar(uiStrings.notices.batchProcessingCancelled);
                        useReporter.updateStatus(uiStrings.notices.batchProcessingCancelled, -1);
                        break;
                    }

                    const progress = Math.floor((index / files.length) * 100);
                    useReporter.updateStatus(host.getStepStatusText(index + 1, files.length, file.name), progress);

                    try {
                        const fileResult = await processFileImpl(
                            host.getApp(),
                            settings,
                            file,
                            useReporter,
                            host.currentProcessingFileBasename
                        );
                        batchCommandResult.fileResults.push(fileResult);
                        batchCommandResult.savedCount += 1;
                        progressStore.markCompleted(file.path);
                    } catch (fileError: unknown) {
                        const message = fileError instanceof Error ? fileError.message : String(fileError);
                        const stack = fileError instanceof Error ? fileError.stack : undefined;
                        const errorMessage = `Error processing ${file.name}: ${message}`;
                        host.logError(errorMessage, stack || String(fileError));
                        useReporter.log(`❌ ${errorMessage}`);
                        batchCommandResult.errors.push({ file: file.name, message });

                        const timestamp = new Date().toISOString();
                        const logEntry = `[${timestamp}] Error processing ${file.path}:\nMessage: ${message}\nStack Trace:\n${stack || fileError}\n\n`;
                        try {
                            await host.appendVaultLog('error_processing_filename.log', logEntry);
                        } catch (logError: unknown) {
                            host.logError('Failed to write to error log:', String(logError));
                            useReporter.log('⚠️ Failed to write error details to log file.');
                        }

                        if (message.includes('cancelled by user')) {
                            break;
                        }
                    }
                }
            } else {
                const concurrency = Math.min(settings.batchConcurrency, 20);
                const processor = createConcurrentProcessor(concurrency, settings.apiCallIntervalMs, useReporter);
                const fileBatches = chunkArray(files, settings.batchSize);
                let processedCount = 0;

                for (let batchIndex = 0; batchIndex < fileBatches.length; batchIndex++) {
                    const batch = fileBatches[batchIndex];
                    useReporter.log(`Processing batch ${batchIndex + 1}/${fileBatches.length} (${batch.length} files)`);
                    if (useReporter.cancelled) {
                        break;
                    }

                    const tasks = batch.map(file => async () => {
                        const fileProgressReporter: ProgressReporter = {
                            log: (message: string) => useReporter.log(`[${file.name}] ${message}`),
                            updateStatus: (message: string, percentage?: number) => {
                                if (percentage !== undefined) {
                                    const overallProgress = Math.floor(((processedCount + (percentage / 100)) / files.length) * 100);
                                    useReporter.updateStatus(
                                        host.getStepStatusText(processedCount, files.length, `${file.name}: ${message}`),
                                        overallProgress
                                    );
                                } else {
                                    useReporter.updateStatus(
                                        host.getStepStatusText(processedCount, files.length, `${file.name}: ${message}`)
                                    );
                                }
                            },
                            cancelled: useReporter.cancelled,
                            requestCancel: () => useReporter.requestCancel(),
                            clearDisplay: () => undefined,
                            abortController: useReporter.abortController,
                            activeTasks: useReporter.activeTasks,
                            updateActiveTasks: (delta: number) => useReporter.updateActiveTasks(delta)
                        };

                        try {
                            const fileResult = await processFileImpl(
                                host.getApp(),
                                settings,
                                file,
                                fileProgressReporter,
                                host.currentProcessingFileBasename
                            );
                            return { file, success: true, result: fileResult };
                        } catch (fileError: unknown) {
                            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
                            fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                            return { file, success: false, error: fileError };
                        }
                    });

                    const results = await processor(tasks);
                    processedCount += batch.length;

                    results.forEach(result => {
                        const typedResult = result as {
                            success: boolean;
                            file: TFile;
                            error?: unknown;
                            result?: ProcessFileResult;
                        };
                        if (typedResult.success && typedResult.result) {
                            batchCommandResult.fileResults.push(typedResult.result);
                            batchCommandResult.savedCount += 1;
                            progressStore.markCompleted(typedResult.file.path);
                            return;
                        }

                        if (!typedResult.success && typedResult.error) {
                            const errorMessage = typedResult.error instanceof Error
                                ? typedResult.error.message
                                : String(typedResult.error);
                            batchCommandResult.errors.push({ file: typedResult.file.name, message: errorMessage });
                        }
                    });

                    if (useReporter.cancelled) {
                        useReporter.log('Cancellation requested, stopping batch processing.');
                        break;
                    }

                    if (settings.batchInterDelayMs > 0 && batchIndex < fileBatches.length - 1) {
                        useReporter.log(`Delaying for ${settings.batchInterDelayMs}ms before next batch...`);
                        await delay(settings.batchInterDelayMs);
                    }
                }
            }

            if (!useReporter.cancelled && batchCommandResult.savedCount > 0) {
                const mermaidFixTargetFolder = (settings.useCustomProcessedFileFolder && settings.processedFileFolder)
                    ? settings.processedFileFolder
                    : folderPath;
                await host.maybeAutoFixMermaidForFolder(mermaidFixTargetFolder, useReporter, 'process folder');
            }

            if (!useReporter.cancelled) {
                if (commandResult.errors.length > 0) {
                    const errorSummary = formatI18n(uiStrings.notices.batchProcessingFinishedWithErrors, {
                        count: commandResult.errors.length
                    });
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    host.updateStatusBar(errorSummary);
                    host.showNotice(errorSummary, 10000);
                } else {
                    const completeText = host.getActionCompleteText(actionLabel);
                    useReporter.updateStatus(completeText, 100);
                    host.updateStatusBar(completeText);
                    host.showNotice(formatI18n(uiStrings.notices.batchProcessingSuccess, {
                        count: commandResult.savedCount
                    }), 5000);
                    host.completeReporter(useReporter);
                }
            }

            if (commandResult) {
                commandResult.cancelled = useReporter.cancelled;
            }
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during batch processing.'
            );
            host.logError('Notemd Batch Processing Error:', errorDetails);

            if (!errorMessage.includes('cancelled')) {
                host.showNotice(formatI18n(uiStrings.notices.batchProcessingError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.batchProcessing, errorDetails);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Batch Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}
