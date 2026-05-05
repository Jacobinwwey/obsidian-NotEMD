import { TFile, TFolder } from 'obsidian';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

function loadModule() {
    return require('../operations/noteProcessingCommandHostAdapter');
}

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

function createUiStrings() {
    return {
        notices: {
            notemdBusy: 'Notemd busy',
            noActiveFile: 'No active file',
            noTopicFound: 'No topic found',
            processingComplete: 'Processing complete',
            processingError: 'Processing failed: {message}',
            batchProcessingCancelled: 'Batch cancelled',
            noMarkdownOrTextFilesFoundSelectedFolder: 'No markdown files in {folderPath}',
            batchProcessingFinishedWithErrors: 'Batch finished with {count} errors',
            batchProcessingSuccess: 'Processed {count} files',
            batchProcessingError: 'Batch processing failed: {message}',
            batchGenerationCancelled: 'Batch generation cancelled',
            batchGenerationFinishedWithErrors: 'Batch generation finished with {count} errors',
            batchGenerationSuccess: 'Generated content in {folderPath}',
            batchGenerationError: 'Batch generation failed: {message}',
            contentGenerationSuccess: 'Generated {file}',
            contentGenerationError: 'Content generation failed: {message}',
            researchError: 'Research failed: {message}'
        },
        sidebar: {
            status: {
                processingStopped: 'Processing stopped'
            }
        },
        errorModal: {
            titles: {
                contentGeneration: 'Content Generation Error',
                research: 'Research Error',
                processing: 'Processing Error',
                batchProcessing: 'Batch Processing Error',
                batchGeneration: 'Batch Generation Error'
            }
        }
    };
}

function createHost(reporter: ProgressReporter, initiallyBusy = false) {
    let busy = initiallyBusy;
    const batchProgressStore = {
        start: jest.fn(),
        markCompleted: jest.fn()
    };

    return {
        host: {
            getApp: jest.fn(() => ({ vault: {}, workspace: {} })),
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getActiveFile: jest.fn(() => null),
            getFileByPath: jest.fn(() => null),
            getFolderByPath: jest.fn(() => null),
            getFiles: jest.fn(() => []),
            getFolderSelection: jest.fn().mockResolvedValue(null),
            getStepStatusText: jest.fn((current: number, total: number, label: string) => `${current}/${total} ${label}`),
            currentProcessingFileBasename: { value: null },
            getBatchProgressStore: jest.fn(() => batchProgressStore),
            resolveCompleteFolderPath: jest.fn(() => 'Concepts_complete'),
            getUiStrings: jest.fn(() => createUiStrings()),
            getActionLabel: jest.fn((actionId: string) => {
                if (actionId === 'process-current-add-links') {
                    return 'Process file';
                }
                if (actionId === 'process-folder-add-links') {
                    return 'Process folder';
                }
                if (actionId === 'generate-from-title') {
                    return 'Generate from title';
                }
                if (actionId === 'batch-generate-from-titles') {
                    return 'Batch generate';
                }
                if (actionId === 'research-and-summarize') {
                    return 'Research & summarize';
                }
                return actionId;
            }),
            getReporter: jest.fn(() => reporter),
            isBusy: jest.fn(() => busy),
            setBusy: jest.fn((value: boolean) => {
                busy = value;
            }),
            startReporterAction: jest.fn(),
            failReporterAction: jest.fn((useReporter: ProgressReporter, message: string) => {
                useReporter.updateStatus(`Failed: ${message}`, -1);
                return `Failed: ${message}`;
            }),
            updateStatusBar: jest.fn(),
            getRunningActionText: jest.fn((label: string) => `Running ${label}`),
            getActionCompleteText: jest.fn((label: string) => `Done ${label}`),
            showNotice: jest.fn(),
            logError: jest.fn(),
            openErrorModal: jest.fn(),
            saveErrorLog: jest.fn().mockResolvedValue(undefined),
            maybeAutoFixMermaidForFile: jest.fn().mockResolvedValue(undefined),
            maybeAutoFixMermaidForFolder: jest.fn().mockResolvedValue(undefined),
            appendVaultLog: jest.fn().mockResolvedValue(undefined),
            completeReporter: jest.fn(),
            finalizeReporter: jest.fn()
        },
        getBatchProgressStore: () => batchProgressStore,
        getBusy: () => busy
    };
}

describe('note processing command host adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('generate from title command runs shared host orchestration and completes reporter cleanup', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md'
        };
        const generateImpl = jest.fn().mockResolvedValue(undefined);
        const { runGenerateContentForTitleCommandWithHost } = loadModule();

        await runGenerateContentForTitleCommandWithHost(host, file, reporter, generateImpl);

        expect(host.setBusy).toHaveBeenNthCalledWith(1, true);
        expect(generateImpl).toHaveBeenCalledWith(host.getApp(), mockSettings, file, reporter);
        expect(host.maybeAutoFixMermaidForFile).toHaveBeenCalledWith(file, reporter, 'generate from title');
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Generate from title', 100);
        expect(host.showNotice).toHaveBeenCalledWith('Generated Topic.md');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(host.setBusy).toHaveBeenLastCalledWith(false);
        expect(getBusy()).toBe(false);
    });

    test('generate from title command exits early when plugin is already busy', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter, true);
        const generateImpl = jest.fn();
        const { runGenerateContentForTitleCommandWithHost } = loadModule();

        await runGenerateContentForTitleCommandWithHost(host, {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md'
        }, reporter, generateImpl);

        expect(host.showNotice).toHaveBeenCalledWith('Notemd busy');
        expect(generateImpl).not.toHaveBeenCalled();
        expect(host.startReporterAction).not.toHaveBeenCalled();
        expect(host.finalizeReporter).not.toHaveBeenCalled();
    });

    test('research command reports missing active file and still finalizes reporter lifecycle', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const researchImpl = jest.fn();
        const { runResearchAndSummarizeCommandWithHost } = loadModule();

        await runResearchAndSummarizeCommandWithHost(
            host,
            { getSelection: jest.fn(() => 'Topic') },
            { file: null },
            reporter,
            researchImpl
        );

        expect(host.showNotice).toHaveBeenCalledWith('No active file');
        expect(host.loadSettings).not.toHaveBeenCalled();
        expect(researchImpl).not.toHaveBeenCalled();
        expect(host.completeReporter).not.toHaveBeenCalled();
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(host.setBusy).toHaveBeenLastCalledWith(false);
        expect(getBusy()).toBe(false);
    });

    test('process current command reuses host orchestration and auto-fixes generated output file', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const activeFile = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        const outputFile = Object.assign(new (TFile as any)(), {
            name: 'Topic_processed.md',
            basename: 'Topic_processed',
            path: 'Processed/Topic_processed.md',
            extension: 'md'
        });
        host.getActiveFile.mockReturnValue(activeFile);
        host.getFileByPath.mockReturnValue(outputFile);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            autoMermaidFixAfterGenerate: true
        });
        const processFileImpl = jest.fn().mockResolvedValue('Processed/Topic_processed.md');
        const { runProcessWithNotemdCommandWithHost } = loadModule();

        await runProcessWithNotemdCommandWithHost(host, reporter, processFileImpl);

        expect(processFileImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            activeFile,
            reporter,
            host.currentProcessingFileBasename
        );
        expect(host.maybeAutoFixMermaidForFile).toHaveBeenCalledWith(outputFile, reporter, 'process current file');
        expect(host.showNotice).toHaveBeenCalledWith('Processing complete');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('process folder command reports empty folders through shared host cleanup path', async () => {
        const reporter = createReporter();
        const { host, getBusy, getBatchProgressStore } = createHost(reporter);
        const folder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });
        host.getFolderByPath.mockReturnValue(folder);
        host.getFiles.mockReturnValue([]);
        const { runProcessFolderWithNotemdCommandWithHost } = loadModule();

        await runProcessFolderWithNotemdCommandWithHost(host, reporter, 'Concepts');

        expect(host.showNotice).toHaveBeenCalledWith('No markdown files in Concepts');
        expect(reporter.updateStatus).toHaveBeenCalledWith('No markdown files in Concepts', 100);
        expect(getBatchProgressStore().start).not.toHaveBeenCalled();
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch generate command returns resolved folders and reuses shared reporter cleanup', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const batchGenerateImpl = jest.fn().mockResolvedValue({ errors: [] });
        const { runBatchGenerateContentForTitlesCommandWithHost } = loadModule();

        const result = await runBatchGenerateContentForTitlesCommandWithHost(
            host,
            reporter,
            'Concepts',
            batchGenerateImpl
        );

        expect(batchGenerateImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), 'Concepts', reporter);
        expect(host.resolveCompleteFolderPath).toHaveBeenCalledWith('Concepts');
        expect(host.maybeAutoFixMermaidForFolder).toHaveBeenCalledWith(
            'Concepts_complete',
            reporter,
            'batch generate from titles'
        );
        expect(host.showNotice).toHaveBeenCalledWith('Generated content in Concepts', 5000);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete'
        });
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });
});
