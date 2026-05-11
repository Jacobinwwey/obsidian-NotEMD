import { App, TFile } from 'obsidian';
import {
    BatchMermaidFixResult,
    batchFixMermaidSyntaxInFolder,
    ConceptDedupeCandidate,
    ConceptDedupeResult,
    findDuplicates,
    checkAndRemoveDuplicateConceptNotes
} from '../fileUtils';
import {
    batchFixFormulaFormatsInFolder,
    BatchFormulaFixResult,
    FormulaFixFileResult,
    fixFormulaFormatsInFile
} from '../formulaFixer';
import { applyFolderTaskSelectionOverride, FolderTaskFileSelectionOverride } from '../folderTaskFileSelector';
import { formatI18n } from '../i18n';
import { NotemdSettings, ProgressReporter } from '../types';
import { SidebarActionId } from '../workflowButtons';

export interface UtilityCommandUiStrings {
    common: {
        cancel: string;
    };
    notices: {
        notemdBusy: string;
        duplicateTermsCheckConsole: string;
        duplicateCheckError: string;
        noActiveTextFileSelected: string;
        duplicateCheckRemoveError: string;
        noPotentialDuplicateConceptNotesFound: string;
        duplicateDeletionCancelled: string;
        deletionCompleteSummary: string;
        noMarkdownFilesFoundInSelectedFolder: string;
        batchMermaidFixFinishedWithErrors: string;
        batchMermaidFixSuccess: string;
        batchMermaidFixError: string;
        formulaFixSuccess: string;
        formulaFixNotNeeded: string;
        genericError: string;
        batchFormulaFixFinishedWithErrors: string;
        batchFormulaFixSuccess: string;
    };
    errorModal: {
        titles: {
            duplicateCheckRemove: string;
            batchMermaidFix: string;
        };
    };
}

export interface UtilityCommandHost {
    getApp: () => App;
    getActiveFile: () => TFile | null;
    readFile: (file: TFile) => Promise<string>;
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getUiStrings: () => UtilityCommandUiStrings;
    getActionLabel: (actionId: SidebarActionId) => string;
    getReporter: () => ProgressReporter;
    getFolderSelection: () => Promise<string | null>;
    isBusy: () => boolean;
    setBusy: (busy: boolean) => void;
    startReporterAction: (reporter: ProgressReporter, label: string) => void;
    failReporterAction: (reporter: ProgressReporter, message: string) => string;
    updateStatusBar: (message: string) => void;
    getRunningActionText: (label: string) => string;
    getActionCompleteText: (label: string) => string;
    showNotice: (message: string, duration?: number) => void;
    confirmConceptDeletion: (reportList: ConceptDedupeCandidate[], uiLocale: string) => Promise<boolean>;
    logInfo: (message: string, details?: unknown) => void;
    logError: (message: string, details: string) => void;
    openErrorModal: (title: string, details: string) => void;
    saveErrorLog: (error: unknown, reporter: ProgressReporter) => Promise<void>;
    completeReporter: (reporter: ProgressReporter) => void;
    finalizeReporter: (reporter: ProgressReporter) => void;
}

export interface UtilityFolderTaskCommandOptions {
    folderPathOverride?: string;
    fileSelectionOverride?: FolderTaskFileSelectionOverride;
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
    return errorMessage.toLowerCase().includes('cancel');
}

async function runBusyReporterCommandWithHost(
    host: UtilityCommandHost,
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

export async function runCheckAndRemoveDuplicateConceptNotesCommandWithHost(
    host: UtilityCommandHost,
    reporter?: ProgressReporter,
    checkAndRemoveDuplicateConceptNotesImpl: typeof checkAndRemoveDuplicateConceptNotes = checkAndRemoveDuplicateConceptNotes
): Promise<ConceptDedupeResult | null> {
    const actionLabel = host.getActionLabel('check-remove-duplicate-concepts');
    let commandResult: ConceptDedupeResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();
        useReporter.log(host.getRunningActionText(actionLabel));

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            commandResult = await checkAndRemoveDuplicateConceptNotesImpl(
                host.getApp(),
                host.getSettings(),
                useReporter,
                {
                    confirmDeletion: (reportList, uiLocale) => host.confirmConceptDeletion(reportList, uiLocale)
                }
            );

            if (commandResult.candidateCount === 0) {
                host.showNotice(uiStrings.notices.noPotentialDuplicateConceptNotesFound);
            } else if (commandResult.cancelled && !commandResult.deletionConfirmed) {
                host.showNotice(uiStrings.notices.duplicateDeletionCancelled);
            } else {
                host.showNotice(formatI18n(uiStrings.notices.deletionCompleteSummary, {
                    deleted: commandResult.removedCount,
                    total: commandResult.candidateCount,
                    errors: commandResult.errors.length
                }));
            }

            host.updateStatusBar(host.getActionCompleteText(actionLabel));
            host.completeReporter(useReporter);
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during duplicate check.'
            );
            host.logError('Error checking/removing duplicate concept notes:', errorDetails);
            host.showNotice(formatI18n(uiStrings.notices.duplicateCheckRemoveError, {
                message: errorMessage
            }), 10000);
            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
            host.openErrorModal(uiStrings.errorModal.titles.duplicateCheckRemove, errorDetails);
        }
    });

    return commandResult;
}

export async function runCheckDuplicatesCurrentCommandWithHost(
    host: UtilityCommandHost,
    reporter?: ProgressReporter,
    findDuplicatesImpl: typeof findDuplicates = findDuplicates
): Promise<{ sourcePath: string; duplicateCount: number; duplicates: string[] } | null> {
    const uiStrings = host.getUiStrings();
    const activeFile = host.getActiveFile();

    if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
        host.showNotice(uiStrings.notices.noActiveTextFileSelected);
        return null;
    }

    try {
        const content = await host.readFile(activeFile);
        const duplicates = Array.from(findDuplicatesImpl(content));
        const message = formatI18n(uiStrings.notices.duplicateTermsCheckConsole, {
            count: duplicates.length
        });

        reporter?.log(message);
        host.showNotice(message);

        if (duplicates.length > 0) {
            const summary = `Potential duplicates in ${activeFile.name}:`;
            reporter?.log(`Potential duplicates: ${duplicates.join(', ')}`);
            host.logInfo(summary, duplicates);
        }

        return {
            sourcePath: activeFile.path,
            duplicateCount: duplicates.length,
            duplicates
        };
    } catch (error: unknown) {
        const { errorMessage, errorDetails } = normalizeError(
            error,
            'An unknown error occurred while checking duplicates.'
        );
        reporter?.log(`Error: ${errorMessage}`);
        host.showNotice(formatI18n(uiStrings.notices.duplicateCheckError, { message: errorMessage }));
        host.logError('Error checking duplicates:', errorDetails);
        return null;
    }
}

export async function runBatchMermaidFixCommandWithHost(
    host: UtilityCommandHost,
    reporter?: ProgressReporter,
    folderPathOverride?: string,
    batchFixMermaidSyntaxInFolderImpl: typeof batchFixMermaidSyntaxInFolder = batchFixMermaidSyntaxInFolder,
    fileSelectionOverride?: FolderTaskFileSelectionOverride
): Promise<BatchMermaidFixResult | null> {
    const actionLabel = host.getActionLabel('batch-mermaid-fix');
    let commandResult: BatchMermaidFixResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const effectiveSettings = applyFolderTaskSelectionOverride(host.getSettings(), fileSelectionOverride);
            const folderPath = folderPathOverride ?? await host.getFolderSelection();
            if (!folderPath) {
                const cancelledMessage = uiStrings.common.cancel;
                useReporter.log(cancelledMessage);
                useReporter.updateStatus(cancelledMessage, -1);
                throw new Error(cancelledMessage);
            }

            host.updateStatusBar(host.getRunningActionText(actionLabel));
            useReporter.log(host.getRunningActionText(actionLabel));

            commandResult = await batchFixMermaidSyntaxInFolderImpl(
                host.getApp(),
                effectiveSettings,
                folderPath,
                useReporter
            );

            if (!useReporter.cancelled && commandResult) {
                if (commandResult.processedFileCount === 0) {
                    const message = formatI18n(uiStrings.notices.noMarkdownFilesFoundInSelectedFolder, { folderPath });
                    useReporter.log(message);
                    useReporter.updateStatus(message, 100);
                    host.updateStatusBar(message);
                    host.showNotice(message);
                    host.completeReporter(useReporter);
                } else if (commandResult.errors.length > 0 || commandResult.remainingErrorFileCount > 0) {
                    const issueCount = commandResult.errors.length + commandResult.remainingErrorFileCount;
                    const errorSummary = formatI18n(uiStrings.notices.batchMermaidFixFinishedWithErrors, {
                        count: issueCount,
                        modifiedCount: commandResult.modifiedCount
                    });
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    host.updateStatusBar(errorSummary);
                    host.showNotice(errorSummary, 10000);
                } else {
                    const finalMessage = formatI18n(uiStrings.notices.batchMermaidFixSuccess, {
                        modifiedCount: commandResult.modifiedCount
                    });
                    useReporter.updateStatus(finalMessage, 100);
                    host.updateStatusBar(host.getActionCompleteText(actionLabel));
                    host.showNotice(finalMessage, 5000);
                    host.completeReporter(useReporter);
                }
            }
        } catch (error: unknown) {
            const { errorMessage, errorDetails } = normalizeError(
                error,
                'An unknown error occurred during batch Mermaid fix.'
            );

            if (!isCancellationError(errorMessage)) {
                host.logError('Notemd Batch Mermaid Fix Error:', errorDetails);
                host.showNotice(formatI18n(uiStrings.notices.batchMermaidFixError, {
                    message: errorMessage
                }), 10000);
                host.openErrorModal(uiStrings.errorModal.titles.batchMermaidFix, errorDetails);
                await host.saveErrorLog(error, useReporter);
            }

            useReporter.log(`Batch Fix Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
        }
    });

    return commandResult;
}

export async function runFixFormulaFormatsCommandWithHost(
    host: UtilityCommandHost,
    file: TFile,
    reporter?: ProgressReporter,
    fixFormulaFormatsInFileImpl: typeof fixFormulaFormatsInFile = fixFormulaFormatsInFile
): Promise<FormulaFixFileResult | null> {
    const actionLabel = host.getActionLabel('fix-formula-current');
    let commandResult: FormulaFixFileResult | null = null;

    await runBusyReporterCommandWithHost(host, `${actionLabel}: ${file.name}`, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            commandResult = await fixFormulaFormatsInFileImpl(host.getApp(), file, useReporter);

            if (commandResult.modified) {
                const message = formatI18n(uiStrings.notices.formulaFixSuccess, { file: file.name });
                useReporter.log(`✅ ${message}`);
                host.showNotice(message);
            } else {
                const message = formatI18n(uiStrings.notices.formulaFixNotNeeded, { file: file.name });
                useReporter.log(message);
                host.showNotice(message);
            }

            useReporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
            host.updateStatusBar(host.getActionCompleteText(actionLabel));
            host.completeReporter(useReporter);
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(error, 'An unknown error occurred.');
            useReporter.log(`Error: ${errorMessage}`);
            host.failReporterAction(useReporter, errorMessage);
            host.showNotice(formatI18n(uiStrings.notices.genericError, { message: errorMessage }));
            await host.saveErrorLog(error, useReporter);
        }
    });

    return commandResult;
}

export async function runBatchFixFormulaFormatsCommandWithHost(
    host: UtilityCommandHost,
    reporter?: ProgressReporter,
    batchFixFormulaFormatsInFolderImpl: typeof batchFixFormulaFormatsInFolder = batchFixFormulaFormatsInFolder,
    options: UtilityFolderTaskCommandOptions = {}
): Promise<BatchFormulaFixResult | null> {
    const actionLabel = host.getActionLabel('batch-fix-formula');
    let commandResult: BatchFormulaFixResult | null = null;

    await runBusyReporterCommandWithHost(host, actionLabel, reporter, async (useReporter) => {
        let uiStrings = host.getUiStrings();

        try {
            await host.loadSettings();
            uiStrings = host.getUiStrings();
            const effectiveSettings = applyFolderTaskSelectionOverride(host.getSettings(), options.fileSelectionOverride);
            const folderPath = options.folderPathOverride ?? await host.getFolderSelection();
            if (!folderPath) {
                const cancelledMessage = uiStrings.common.cancel;
                useReporter.log(cancelledMessage);
                useReporter.updateStatus(cancelledMessage, -1);
                throw new Error(cancelledMessage);
            }

            commandResult = await batchFixFormulaFormatsInFolderImpl(
                host.getApp(),
                folderPath,
                useReporter,
                effectiveSettings
            );

            if (!useReporter.cancelled && commandResult) {
                if (commandResult.errors.length > 0) {
                    const message = formatI18n(uiStrings.notices.batchFormulaFixFinishedWithErrors, {
                        count: commandResult.errors.length,
                        modifiedCount: commandResult.modifiedCount
                    });
                    useReporter.log(message);
                    useReporter.updateStatus(message, -1);
                    host.showNotice(message);
                } else {
                    const message = formatI18n(uiStrings.notices.batchFormulaFixSuccess, {
                        modifiedCount: commandResult.modifiedCount
                    });
                    useReporter.log(message);
                    useReporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
                    host.updateStatusBar(host.getActionCompleteText(actionLabel));
                    host.showNotice(message);
                    host.completeReporter(useReporter);
                }
            }
        } catch (error: unknown) {
            const { errorMessage } = normalizeError(error, 'An unknown error occurred.');
            if (!isCancellationError(errorMessage)) {
                useReporter.log(`Error: ${errorMessage}`);
                host.failReporterAction(useReporter, errorMessage);
                host.showNotice(formatI18n(uiStrings.notices.genericError, { message: errorMessage }));
                await host.saveErrorLog(error, useReporter);
            }
        }
    });

    return commandResult;
}
