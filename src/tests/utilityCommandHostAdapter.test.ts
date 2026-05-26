import { TFile } from 'obsidian';
import * as fileUtils from '../fileUtils';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

const ADVANCED_FILE_SELECTION_SETTINGS = {
    enableDeveloperMode: true,
    enableAdvancedFileSelectionProfiles: true
} as const;

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
            duplicateTermsCheckConsole: 'Found {count} potential duplicate terms. Check console.',
            duplicateCheckError: 'Error checking duplicates: {message}',
            noActiveMarkdownFileSelected: 'No active Markdown file selected.',
            noActiveTextFileSelected: "No active '.md' or '.txt' file selected.",
            duplicateCheckRemoveError: 'Duplicate cleanup failed: {message}',
            noPotentialDuplicateConceptNotesFound: 'No potential duplicate concept notes found.',
            duplicateDeletionCancelled: 'Duplicate deletion cancelled.',
            deletionCompleteSummary: 'Deletion complete. Deleted {deleted} of {total} identified files. Encountered {errors} errors.',
            noMarkdownFilesFoundInSelectedFolder: 'No markdown files found in selected folder: {folderPath}',
            batchMermaidFixFinishedWithErrors: 'Mermaid fix finished with {count} errors after {modifiedCount} fixes',
            batchMermaidFixSuccess: 'Fixed Mermaid in {modifiedCount} files',
            batchMermaidFixError: 'Batch Mermaid fix failed: {message}',
            chapterSplitSuccess: 'Chapter split complete. Created {count} chapter notes and TOC: {tocPath}',
            chapterSplitError: 'Chapter split failed: {message}',
            fileEmpty: 'File is empty.',
            formulaFixSuccess: 'Fixed formulas in {file}',
            formulaFixNotNeeded: 'No formula fixes needed for {file}',
            genericError: 'Generic error: {message}',
            batchFormulaFixFinishedWithErrors: 'Formula fix finished with {count} errors after {modifiedCount} fixes',
            batchFormulaFixSuccess: 'Fixed formulas in {modifiedCount} files'
        },
        errorModal: {
            titles: {
                duplicateCheckRemove: 'Duplicate Cleanup Error',
                batchMermaidFix: 'Batch Mermaid Fix Error',
                chapterSplit: 'Chapter Split Error'
            }
        }
    };
}

function createHost(reporter: ProgressReporter, initiallyBusy = false) {
    let busy = initiallyBusy;

    return {
        host: {
            getApp: jest.fn(() => ({ vault: {}, workspace: {} })),
            getActiveFile: jest.fn(() => null),
            readFile: jest.fn().mockResolvedValue(''),
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => createUiStrings()),
            getActionLabel: jest.fn((actionId: string) => {
                switch (actionId) {
                    case 'check-remove-duplicate-concepts':
                        return 'Duplicate cleanup';
                    case 'batch-mermaid-fix':
                        return 'Batch Mermaid fix';
                    case 'split-note-by-chapters':
                        return 'Split note by chapters';
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
            confirmConceptDeletion: jest.fn().mockResolvedValue(true),
            logInfo: jest.fn(),
            logError: jest.fn(),
            openErrorModal: jest.fn(),
            saveErrorLog: jest.fn().mockResolvedValue(undefined),
            completeReporter: jest.fn(),
            finalizeReporter: jest.fn()
        },
        getBusy: () => busy
    };
}

function createConceptDedupeResult(overrides?: Partial<fileUtils.ConceptDedupeResult>): fileUtils.ConceptDedupeResult {
    return {
        conceptFolderPath: 'Concepts',
        duplicateCheckScopeMode: 'vault',
        conceptNoteCount: 2,
        comparedNoteCount: 3,
        candidateCount: 0,
        deletionRequested: false,
        deletionConfirmed: false,
        removedCount: 0,
        cancelled: false,
        candidates: [],
        fileResults: [],
        errors: [],
        ...overrides
    };
}

function createBatchMermaidFixResult(overrides?: Partial<fileUtils.BatchMermaidFixResult>): fileUtils.BatchMermaidFixResult {
    return {
        folderPath: 'Concepts',
        processedFileCount: 1,
        modifiedCount: 1,
        movedErrorFileCount: 0,
        remainingErrorFileCount: 0,
        reportPath: '',
        reportCreated: false,
        cancelled: false,
        fileResults: [],
        errors: [],
        ...overrides
    };
}

describe('utility command host adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('duplicate cleanup command delegates through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const duplicateImpl = jest.fn().mockResolvedValue(createConceptDedupeResult({
            candidateCount: 1,
            deletionRequested: true,
            deletionConfirmed: false,
            cancelled: true,
            candidates: [
                {
                    path: 'Concepts/Alpha.md',
                    reason: 'Exact Match',
                    counterparts: ['Notes/Alpha.md']
                }
            ]
        }));
        const { runCheckAndRemoveDuplicateConceptNotesCommandWithHost } = loadModule();

        const result = await runCheckAndRemoveDuplicateConceptNotesCommandWithHost(host, reporter, duplicateImpl);

        expect(duplicateImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            reporter,
            expect.objectContaining({
                confirmDeletion: expect.any(Function)
            })
        );
        expect(host.showNotice).toHaveBeenCalledWith('Duplicate deletion cancelled.');
        expect(host.updateStatusBar).toHaveBeenCalledWith('Done Duplicate cleanup');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual(expect.objectContaining({
            candidateCount: 1,
            cancelled: true
        }));
        expect(getBusy()).toBe(false);
    });

    test('check duplicates current command reads active file and reports duplicate summary through extracted host flow', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        host.getActiveFile = jest.fn(() => file);
        host.readFile = jest.fn().mockResolvedValue('alpha alpha beta');
        host.logInfo = jest.fn();

        const duplicateSpy = jest.spyOn(fileUtils, 'findDuplicates').mockReturnValue(new Set(['alpha']));
        const { runCheckDuplicatesCurrentCommandWithHost } = loadModule();

        const result = await runCheckDuplicatesCurrentCommandWithHost(host as any, reporter);

        expect(host.readFile).toHaveBeenCalledWith(file);
        expect(duplicateSpy).toHaveBeenCalledWith('alpha alpha beta');
        expect(host.showNotice).toHaveBeenCalledWith('Found 1 potential duplicate terms. Check console.');
        expect(host.logInfo).toHaveBeenCalledWith('Potential duplicates in Topic.md:', ['alpha']);
        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            duplicateCount: 1,
            duplicates: ['alpha']
        });
    });

    test('check duplicates current command accepts pdf input when relaxed input mode is enabled', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.pdf',
            basename: 'Topic',
            path: 'Notes/Topic.pdf',
            extension: 'pdf'
        });
        host.getActiveFile = jest.fn(() => file);
        host.getSettings = jest.fn(() => ({
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        }));
        host.readFile = jest.fn().mockResolvedValue('alpha alpha beta');
        host.logInfo = jest.fn();

        const duplicateSpy = jest.spyOn(fileUtils, 'findDuplicates').mockReturnValue(new Set(['alpha']));
        const { runCheckDuplicatesCurrentCommandWithHost } = loadModule();

        const result = await runCheckDuplicatesCurrentCommandWithHost(host as any, reporter);

        expect(host.readFile).toHaveBeenCalledWith(file);
        expect(duplicateSpy).toHaveBeenCalledWith('alpha alpha beta');
        expect(result).toEqual({
            sourcePath: 'Notes/Topic.pdf',
            duplicateCount: 1,
            duplicates: ['alpha']
        });
    });

    test('batch mermaid fix command resolves folder and reports success through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Concepts');
        const batchFixImpl = jest.fn().mockResolvedValue(createBatchMermaidFixResult({
            folderPath: 'Concepts',
            modifiedCount: 2,
            processedFileCount: 2
        }));
        const { runBatchMermaidFixCommandWithHost } = loadModule();

        const result = await runBatchMermaidFixCommandWithHost(host, reporter, undefined, batchFixImpl);

        expect(batchFixImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), 'Concepts', reporter);
        expect(host.showNotice).toHaveBeenCalledWith('Fixed Mermaid in 2 files', 5000);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual(expect.objectContaining({
            folderPath: 'Concepts',
            modifiedCount: 2,
            processedFileCount: 2
        }));
        expect(getBusy()).toBe(false);
    });

    test('batch mermaid fix command reports host-owned no-files notice from structured result', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Concepts');
        const batchFixImpl = jest.fn().mockResolvedValue(createBatchMermaidFixResult({
            folderPath: 'Concepts',
            processedFileCount: 0,
            modifiedCount: 0
        }));
        const { runBatchMermaidFixCommandWithHost } = loadModule();

        const result = await runBatchMermaidFixCommandWithHost(host, reporter, undefined, batchFixImpl);

        expect(host.showNotice).toHaveBeenCalledWith('No markdown files found in selected folder: Concepts');
        expect(result).toEqual(expect.objectContaining({
            folderPath: 'Concepts',
            processedFileCount: 0
        }));
        expect(getBusy()).toBe(false);
    });

    test('batch mermaid fix command passes per-operation selection overrides without mutating host settings', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Concepts');
        host.getSettings.mockReturnValue({
            ...mockSettings,
            ...ADVANCED_FILE_SELECTION_SETTINGS,
            folderTaskFileFilterMode: 'none',
            folderTaskIncludeSubfoldersMode: 'legacy'
        });
        const batchFixImpl = jest.fn().mockResolvedValue(createBatchMermaidFixResult({
            folderPath: 'Concepts',
            processedFileCount: 1,
            modifiedCount: 1
        }));
        const { runBatchMermaidFixCommandWithHost } = loadModule();

        await runBatchMermaidFixCommandWithHost(
            host,
            reporter,
            undefined,
            batchFixImpl,
            {
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'contains',
                fileFilterPattern: 'Topic'
            }
        );

        const passedSettings = batchFixImpl.mock.calls[0][1];
        expect(passedSettings.folderTaskIncludeSubfoldersMode).toBe('exclude');
        expect(passedSettings.folderTaskFileFilterMode).toBe('contains');
        expect(passedSettings.folderTaskFileFilterPattern).toBe('Topic');
        expect(host.getSettings().folderTaskIncludeSubfoldersMode).toBe('legacy');
        expect(host.getSettings().folderTaskFileFilterMode).toBe('none');
    });

    test('batch mermaid fix command uses interactive folder-task selection profile when available', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            ...ADVANCED_FILE_SELECTION_SETTINGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-formulas',
                    name: 'Concept basename filter',
                    folderPathHint: 'Concepts',
                    includeSubfoldersMode: 'exclude',
                    fileFilterMode: 'contains',
                    fileFilterPattern: 'Concept',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: false,
                    fileFilterInvert: false
                }
            ]
        });
        const getFolderTaskSelection = jest.fn().mockResolvedValue({
            folderPath: 'Concepts',
            fileSelectionOverride: {
                profileId: 'profile-formulas'
            }
        });
        Object.assign(host, { getFolderTaskSelection });
        const batchFixImpl = jest.fn().mockResolvedValue(createBatchMermaidFixResult({
            folderPath: 'Concepts',
            processedFileCount: 1,
            modifiedCount: 1
        }));
        const { runBatchMermaidFixCommandWithHost } = loadModule();

        await runBatchMermaidFixCommandWithHost(host, reporter, undefined, batchFixImpl);

        expect(getFolderTaskSelection).toHaveBeenCalledWith('batch-mermaid-fix', undefined);
        expect(host.getFolderSelection).not.toHaveBeenCalled();
        const passedSettings = batchFixImpl.mock.calls[0][1];
        expect(passedSettings.folderTaskIncludeSubfoldersMode).toBe('exclude');
        expect(passedSettings.folderTaskFileFilterMode).toBe('contains');
        expect(passedSettings.folderTaskFileFilterPattern).toBe('Concept');
        expect(passedSettings.folderTaskFileFilterTarget).toBe('basename');
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
        const fixImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic.md',
            modified: true,
            replacementCount: 2
        });
        const { runFixFormulaFormatsCommandWithHost } = loadModule();

        const result = await runFixFormulaFormatsCommandWithHost(host, file, reporter, fixImpl);

        expect(fixImpl).toHaveBeenCalledWith(host.getApp(), file, reporter);
        expect(host.showNotice).toHaveBeenCalledWith('Fixed formulas in Topic.md');
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Fix formulas', 100);
        expect(result).toEqual(expect.objectContaining({
            modified: true,
            replacementCount: 2
        }));
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('split note by chapters command delegates through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        host.getActiveFile = jest.fn(() => file);
        host.readFile = jest.fn().mockResolvedValue('# Topic\n\n## One');
        const splitImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            requestedSplitHeadingLevel: 'auto',
            chapterNotePaths: ['Notes/topic_chapters/01-one.md'],
            managedArtifactPaths: [
                'Notes/topic_chapters/Topic_TOC.md',
                'Notes/topic_chapters/.notemd-chapter-split.json',
                'Notes/topic_chapters/01-one.md'
            ],
            outputFolderPath: 'Notes/topic_chapters',
            tocPath: 'Notes/topic_chapters/Topic_TOC.md',
            manifestPath: 'Notes/topic_chapters/.notemd-chapter-split.json',
            splitLevel: 2,
            chapters: [
                {
                    title: 'One',
                    outputPath: 'Notes/topic_chapters/01-one.md',
                    markdown: '## One',
                    breadcrumb: ['Topic', 'One'],
                    nestedHeadings: []
                }
            ],
            tocMetadata: {
                sourcePath: 'Notes/Topic.md',
                sourceBasename: 'Topic',
                requestedSplitHeadingLevel: 'auto',
                resolvedSplitHeadingLevel: 2,
                chapterCount: 1,
                managedArtifactCount: 3,
                outputFolderPath: 'Notes/topic_chapters',
                tocPath: 'Notes/topic_chapters/Topic_TOC.md',
                manifestPath: 'Notes/topic_chapters/.notemd-chapter-split.json',
                chapterTitles: ['One'],
                chapterNotePaths: ['Notes/topic_chapters/01-one.md']
            },
            tocMarkdown: '---\nnotemdGenerated: true\n---\n# Topic TOC',
            chapterCount: 1,
            removedStaleFileCount: 0,
            removedStalePaths: []
        });
        const { runSplitNoteByChaptersCommandWithHost } = loadModule();

        const result = await runSplitNoteByChaptersCommandWithHost(host, reporter, splitImpl);

        expect(splitImpl).toHaveBeenCalledWith(host.getApp(), file, reporter, {
            splitHeadingLevel: host.getSettings().chapterSplitHeadingLevel
        });
        expect(host.showNotice).toHaveBeenCalledWith(
            'Chapter split complete. Created 1 chapter notes and TOC: Notes/topic_chapters/Topic_TOC.md'
        );
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Split note by chapters', 100);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual(expect.objectContaining({
            outputFolderPath: 'Notes/topic_chapters',
            chapterCount: 1
        }));
        expect(getBusy()).toBe(false);
    });

    test('split note by chapters command surfaces guarded-overwrite conflicts through the host error path', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        host.getActiveFile = jest.fn(() => file);
        host.readFile = jest.fn().mockResolvedValue('# Topic\n\n## One');
        const splitImpl = jest.fn().mockRejectedValue(
            new Error('Refusing to overwrite manually edited chapter split artifacts: Notes/topic_chapters/01-one.md')
        );
        const { runSplitNoteByChaptersCommandWithHost } = loadModule();

        const result = await runSplitNoteByChaptersCommandWithHost(host, reporter, splitImpl);

        expect(result).toBeNull();
        expect(host.showNotice).toHaveBeenCalledWith(
            'Chapter split failed: Refusing to overwrite manually edited chapter split artifacts: Notes/topic_chapters/01-one.md'
        );
        expect(host.failReporterAction).toHaveBeenCalledWith(
            reporter,
            'Refusing to overwrite manually edited chapter split artifacts: Notes/topic_chapters/01-one.md'
        );
        expect(host.openErrorModal).toHaveBeenCalledWith(
            'Chapter Split Error',
            expect.stringContaining(
                'Error: Refusing to overwrite manually edited chapter split artifacts: Notes/topic_chapters/01-one.md'
            )
        );
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch formula fix command resolves folder and reports success through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Notes');
        const batchFixImpl = jest.fn().mockResolvedValue({
            folderPath: 'Notes',
            processedFileCount: 3,
            modifiedCount: 3,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Notes/A.md',
                    outputPath: 'Notes/A.md',
                    modified: true,
                    replacementCount: 1
                }
            ],
            errors: []
        });
        const { runBatchFixFormulaFormatsCommandWithHost } = loadModule();

        const result = await runBatchFixFormulaFormatsCommandWithHost(host, reporter, batchFixImpl);

        expect(batchFixImpl).toHaveBeenCalledWith(host.getApp(), 'Notes', reporter, host.getSettings());
        expect(host.showNotice).toHaveBeenCalledWith('Fixed formulas in 3 files');
        expect(result).toEqual(expect.objectContaining({
            modifiedCount: 3,
            fileResults: expect.any(Array)
        }));
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch formula fix command supports folder path override and selection overrides', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            ...ADVANCED_FILE_SELECTION_SETTINGS
        });
        const batchFixImpl = jest.fn().mockResolvedValue({
            folderPath: 'Notes',
            processedFileCount: 1,
            modifiedCount: 1,
            cancelled: false,
            fileResults: [],
            errors: []
        });
        const { runBatchFixFormulaFormatsCommandWithHost } = loadModule();

        await runBatchFixFormulaFormatsCommandWithHost(
            host,
            reporter,
            batchFixImpl,
            {
                folderPathOverride: 'Notes',
                fileSelectionOverride: {
                    fileFilterMode: 'glob',
                    fileFilterPattern: '**/*.md'
                }
            }
        );

        expect(host.getFolderSelection).not.toHaveBeenCalled();
        expect(batchFixImpl).toHaveBeenCalledWith(
            host.getApp(),
            'Notes',
            reporter,
            expect.objectContaining({
                folderTaskFileFilterMode: 'glob',
                folderTaskFileFilterPattern: '**/*.md'
            })
        );
    });
});
