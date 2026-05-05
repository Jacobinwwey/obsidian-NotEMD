import { App, Editor, MarkdownView, TFile, TFolder } from 'obsidian';
import { BatchProgressStore } from '../batchProgressStore';
import { processFile, generateContentForTitle } from '../fileUtils';
import { formatI18n } from '../i18n';
import { researchAndSummarize } from '../searchUtils';
import { chunkArray, createConcurrentProcessor, delay } from '../utils';
import { NotemdSettings, ProgressReporter } from '../types';
import { SidebarActionId } from '../workflowButtons';

export interface NoteProcessingCommandUiStrings {
    notices: {
        notemdBusy: string;
        noActiveFile: string;
        noTopicFound: string;
        processingComplete: string;
        processingError: string;
        batchProcessingCancelled: string;
        noMarkdownOrTextFilesFoundSelectedFolder: string;
        batchProcessingFinishedWithErrors: string;
        batchProcessingSuccess: string;
        batchProcessingError: string;
        contentGenerationSuccess: string;
        contentGenerationError: string;
        researchError: string;
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
        };
    };
}

export interface NoteProcessingCommandHost {
    getApp: () => App;
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getActiveFile: () => TFile | null;
    getFileByPath: (path: string) => TFile | null;
    getFolderByPath: (path: string) => TFolder | null;
    getFiles: () => TFile[];
    getFolderSelection: () => Promise<string | null>;
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

export async function runGenerateContentForTitleCommandWithHost(
    host: NoteProcessingCommandHost,
    file: TFile,
    reporter?: ProgressReporter,
    generateContentForTitleImpl: typeof generateContentForTitle = generateContentForTitle
): Promise<void> {
    const actionLabel = host.getActionLabel('generate-from-title');

    await runBusyReporterCommandWithHost(
        host,
        `${actionLabel}: ${file.name}`,
        reporter,
        async (useReporter) => {
            let uiStrings = host.getUiStrings();

            try {
                await host.loadSettings();
                uiStrings = host.getUiStrings();
                await generateContentForTitleImpl(host.getApp(), host.getSettings(), file, useReporter);
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

export async function runProcessWithNotemdCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    processFileImpl: typeof processFile = processFile
): Promise<void> {
    const actionLabel = host.getActionLabel('process-current-add-links');

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const activeFile = host.getActiveFile();
            if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            host.updateStatusBar(host.getRunningActionText(`${actionLabel}: ${activeFile.name}`));
            const outputPath = await processFileImpl(
                host.getApp(),
                host.getSettings(),
                activeFile,
                useReporter,
                host.currentProcessingFileBasename
            );

            if (outputPath && host.getSettings().autoMermaidFixAfterGenerate) {
                const outputFile = host.getFileByPath(outputPath);
                if (outputFile) {
                    await host.maybeAutoFixMermaidForFile(outputFile, useReporter, 'process current file');
                } else {
                    useReporter.log(`Skipped Mermaid auto-fix: output file not found at ${outputPath}`);
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
}

export async function runProcessFolderWithNotemdCommandWithHost(
    host: NoteProcessingCommandHost,
    reporter?: ProgressReporter,
    folderPathOverride?: string,
    processFileImpl: typeof processFile = processFile
): Promise<void> {
    const actionLabel = host.getActionLabel('process-folder-add-links');

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const settings = host.getSettings();
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

            const files = host.getFiles().filter(file =>
                (file.extension === 'md' || file.extension === 'txt') &&
                (file.path === folderPath || file.path.startsWith(folderPath === '/' ? '' : `${folderPath}/`))
            );

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
            const errors: Array<{ file: string; message: string }> = [];

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
                        await processFileImpl(
                            host.getApp(),
                            settings,
                            file,
                            useReporter,
                            host.currentProcessingFileBasename
                        );
                        progressStore.markCompleted(file.path);
                    } catch (fileError: unknown) {
                        const message = fileError instanceof Error ? fileError.message : String(fileError);
                        const stack = fileError instanceof Error ? fileError.stack : undefined;
                        const errorMessage = `Error processing ${file.name}: ${message}`;
                        host.logError(errorMessage, stack || String(fileError));
                        useReporter.log(`❌ ${errorMessage}`);
                        errors.push({ file: file.name, message });

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
                            await processFileImpl(
                                host.getApp(),
                                settings,
                                file,
                                fileProgressReporter,
                                host.currentProcessingFileBasename
                            );
                            return { file, success: true };
                        } catch (fileError: unknown) {
                            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
                            fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                            return { file, success: false, error: fileError };
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
                const mermaidFixTargetFolder = (settings.useCustomProcessedFileFolder && settings.processedFileFolder)
                    ? settings.processedFileFolder
                    : folderPath;
                await host.maybeAutoFixMermaidForFolder(mermaidFixTargetFolder, useReporter, 'process folder');
            }

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(uiStrings.notices.batchProcessingFinishedWithErrors, {
                        count: errors.length
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
                        count: files.length
                    }), 5000);
                    host.completeReporter(useReporter);
                }
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
}
