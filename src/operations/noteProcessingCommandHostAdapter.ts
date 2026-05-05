import { App, Editor, MarkdownView, TFile } from 'obsidian';
import { formatI18n } from '../i18n';
import { generateContentForTitle } from '../fileUtils';
import { researchAndSummarize } from '../searchUtils';
import { NotemdSettings, ProgressReporter } from '../types';
import { SidebarActionId } from '../workflowButtons';

export interface NoteProcessingCommandUiStrings {
    notices: {
        notemdBusy: string;
        noActiveFile: string;
        noTopicFound: string;
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
        };
    };
}

export interface NoteProcessingCommandHost {
    getApp: () => App;
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
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
