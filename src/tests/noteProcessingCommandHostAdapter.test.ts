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
                research: 'Research Error'
            }
        }
    };
}

function createHost(reporter: ProgressReporter, initiallyBusy = false) {
    let busy = initiallyBusy;

    return {
        host: {
            getApp: jest.fn(() => ({ vault: {}, workspace: {} })),
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => createUiStrings()),
            getActionLabel: jest.fn((actionId: string) => {
                if (actionId === 'generate-from-title') {
                    return 'Generate from title';
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
            completeReporter: jest.fn(),
            finalizeReporter: jest.fn()
        },
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
});
