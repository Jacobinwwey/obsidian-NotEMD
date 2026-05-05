import { TFile } from 'obsidian';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

function loadModule() {
    return require('../operations/utilityCommandHostAdapter');
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
        common: {
            cancel: 'Cancel'
        },
        notices: {
            notemdBusy: 'Notemd busy',
            duplicateCheckRemoveError: 'Duplicate cleanup failed: {message}',
            batchMermaidFixFinishedWithErrors: 'Mermaid fix finished with {count} errors after {modifiedCount} fixes',
            batchMermaidFixSuccess: 'Fixed Mermaid in {modifiedCount} files',
            batchMermaidFixError: 'Batch Mermaid fix failed: {message}',
            formulaFixSuccess: 'Fixed formulas in {file}',
            formulaFixNotNeeded: 'No formula fixes needed for {file}',
            genericError: 'Generic error: {message}',
            batchFormulaFixFinishedWithErrors: 'Formula fix finished with {count} errors after {modifiedCount} fixes',
            batchFormulaFixSuccess: 'Fixed formulas in {modifiedCount} files'
        },
        errorModal: {
            titles: {
                duplicateCheckRemove: 'Duplicate Cleanup Error',
                batchMermaidFix: 'Batch Mermaid Fix Error'
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
                switch (actionId) {
                    case 'check-remove-duplicate-concepts':
                        return 'Duplicate cleanup';
                    case 'batch-mermaid-fix':
                        return 'Batch Mermaid fix';
                    case 'fix-formula-current':
                        return 'Fix formulas';
                    case 'batch-fix-formula':
                        return 'Batch fix formulas';
                    default:
                        return actionId;
                }
            }),
            getReporter: jest.fn(() => reporter),
            getFolderSelection: jest.fn().mockResolvedValue(null),
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
            completeReporter: jest.fn(),
            finalizeReporter: jest.fn()
        },
        getBusy: () => busy
    };
}

describe('utility command host adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('duplicate cleanup command delegates through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const duplicateImpl = jest.fn().mockResolvedValue(undefined);
        const { runCheckAndRemoveDuplicateConceptNotesCommandWithHost } = loadModule();

        await runCheckAndRemoveDuplicateConceptNotesCommandWithHost(host, reporter, duplicateImpl);

        expect(duplicateImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), reporter);
        expect(host.updateStatusBar).toHaveBeenCalledWith('Done Duplicate cleanup');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch mermaid fix command resolves folder and reports success through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Concepts');
        const batchFixImpl = jest.fn().mockResolvedValue({ errors: [], modifiedCount: 2 });
        const { runBatchMermaidFixCommandWithHost } = loadModule();

        const result = await runBatchMermaidFixCommandWithHost(host, reporter, undefined, batchFixImpl);

        expect(batchFixImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), 'Concepts', reporter);
        expect(host.showNotice).toHaveBeenCalledWith('Fixed Mermaid in 2 files', 5000);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual({ folderPath: 'Concepts', modifiedCount: 2 });
        expect(getBusy()).toBe(false);
    });

    test('fix formula command delegates through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        const fixImpl = jest.fn().mockResolvedValue(true);
        const { runFixFormulaFormatsCommandWithHost } = loadModule();

        await runFixFormulaFormatsCommandWithHost(host, file, reporter, fixImpl);

        expect(fixImpl).toHaveBeenCalledWith(host.getApp(), file, reporter);
        expect(host.showNotice).toHaveBeenCalledWith('Fixed formulas in Topic.md');
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Fix formulas', 100);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch formula fix command resolves folder and reports success through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Notes');
        const batchFixImpl = jest.fn().mockResolvedValue({ modifiedCount: 3, errors: [] });
        const { runBatchFixFormulaFormatsCommandWithHost } = loadModule();

        await runBatchFixFormulaFormatsCommandWithHost(host, reporter, batchFixImpl);

        expect(batchFixImpl).toHaveBeenCalledWith(host.getApp(), 'Notes', reporter);
        expect(host.showNotice).toHaveBeenCalledWith('Fixed formulas in 3 files');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });
});
