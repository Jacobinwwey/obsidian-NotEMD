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
        commands: {
            extractConceptsAndGenerateTitles: 'Extract concepts and generate titles',
            createWikiLinkAndGenerateNoteFromSelection: 'Create Wiki-Link & Generate Note from Selection'
        },
        notices: {
            notemdBusy: 'Notemd busy',
            noActiveFile: 'No active file',
            noTopicFound: 'No topic found',
            selectValidWord: 'Select a valid word (2+ chars).',
            setConceptNoteFolder: 'Set Concept Note Folder in settings.',
            generatedContentForWord: 'Generated content for [[{word}]]!',
            genericError: 'Error: {message}',
            batchTranslationFailedWithMessage: 'Batch translation failed: {message}',
            failedTranslateFileWithMessage: 'Translation failed: {message}',
            processingComplete: 'Processing complete',
            processingError: 'Processing failed: {message}',
            batchProcessingCancelled: 'Batch cancelled',
            noMarkdownOrTextFilesFoundSelectedFolder: 'No markdown files in {folderPath}',
            batchProcessingFinishedWithErrors: 'Batch finished with {count} errors',
            batchProcessingSuccess: 'Processed {count} files',
            batchProcessingError: 'Batch processing failed: {message}',
            conceptExtractionSuccess: 'Extracted {count} concepts',
            noConceptsFoundToExtract: 'No concepts found',
            conceptExtractionError: 'Concept extraction failed: {message}',
            batchExtractionCancelled: 'Batch extraction cancelled',
            batchExtractionFinishedWithErrors: 'Batch extraction finished with {count} errors',
            batchExtractionSuccess: 'Extracted {concepts} concepts from {files} files',
            batchExtractionError: 'Batch extraction failed: {message}',
            genericErrorSeeConsoleForDetails: 'Generic error: {message}',
            batchGenerationCancelled: 'Batch generation cancelled',
            batchGenerationFinishedWithErrors: 'Batch generation finished with {count} errors',
            batchGenerationSuccess: 'Generated content in {folderPath}',
            batchGenerationError: 'Batch generation failed: {message}',
            contentGenerationSuccess: 'Generated {file}',
            contentGenerationError: 'Content generation failed: {message}',
            researchError: 'Research failed: {message}',
            extractionCompleteSavedTo: 'Extraction complete. Saved to {path}'
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
                batchTranslation: 'Batch Translation Error',
                translation: 'Translation Error',
                conceptExtraction: 'Concept Extraction Error',
                batchConceptExtraction: 'Batch Concept Extraction Error',
                extraction: 'Extraction Error',
                generic: 'Generic Error',
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
    const pluginRuntime = {
        settings: mockSettings,
        getProviderAndModelForTask: jest.fn(() => ({
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model
        })),
        getPromptForTask: jest.fn(() => 'prompt')
    };

    return {
        host: {
            getApp: jest.fn(() => ({ vault: {}, workspace: {} })),
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getPluginRuntime: jest.fn(() => pluginRuntime),
            getActiveFile: jest.fn(() => null),
            getFileByPath: jest.fn((_path: string): TFile | null => null),
            getFolderByPath: jest.fn((_path: string): TFolder | null => null),
            getFiles: jest.fn((): TFile[] => []),
            getFolderSelection: jest.fn().mockResolvedValue(null),
            getTaskLanguageCode: jest.fn(() => 'en'),
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
                if (actionId === 'translate-current-file') {
                    return 'Translate file';
                }
                if (actionId === 'batch-translate-folder') {
                    return 'Batch translate';
                }
                if (actionId === 'extract-concepts-current') {
                    return 'Extract concepts';
                }
                if (actionId === 'extract-concepts-folder') {
                    return 'Extract folder concepts';
                }
                if (actionId === 'extract-original-text') {
                    return 'Extract original text';
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

    test('create wiki-link and generate command reuses host orchestration and writes generated note path', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const editor = {
            getSelection: jest.fn(() => 'Alpha'),
            replaceSelection: jest.fn()
        } as any;
        const view = {
            file: {
                basename: 'Topic'
            }
        } as any;
        const createdFile = Object.assign(new (TFile as any)(), {
            name: 'Alpha.md',
            basename: 'Alpha',
            path: 'Concepts/Alpha.md',
            extension: 'md'
        });
        host.getSettings.mockReturnValue({
            ...mockSettings,
            useCustomConceptNoteFolder: true,
            conceptNoteFolder: 'Concepts'
        });
        host.getFileByPath
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(createdFile);
        const createNotesImpl = jest.fn().mockResolvedValue(undefined);
        const generateImpl = jest.fn().mockResolvedValue(undefined);
        const { runCreateWikiLinkAndGenerateFromSelectionCommandWithHost } = loadModule();

        const result = await runCreateWikiLinkAndGenerateFromSelectionCommandWithHost(
            host,
            editor,
            view,
            reporter,
            createNotesImpl,
            generateImpl
        );

        expect(editor.replaceSelection).toHaveBeenCalledWith('[[Alpha]]');
        expect(createNotesImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            new Set(['Alpha']),
            'Topic',
            { minimalTemplate: false }
        );
        expect(generateImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), createdFile, reporter);
        expect(host.maybeAutoFixMermaidForFile).toHaveBeenCalledWith(createdFile, reporter, 'create wiki-link and generate');
        expect(host.showNotice).toHaveBeenCalledWith('Generated content for [[Alpha]]!');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual({
            notePath: 'Concepts/Alpha.md',
            word: 'Alpha',
            created: true
        });
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

    test('translate file command reuses shared host orchestration and auto-fixes translated output', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        const translatedFile = Object.assign(new (TFile as any)(), {
            name: 'Topic_en.md',
            basename: 'Topic_en',
            path: 'Translations/Topic_en.md',
            extension: 'md'
        });
        host.getSettings.mockReturnValue({
            ...mockSettings,
            autoMermaidFixAfterGenerate: true
        });
        host.getFileByPath.mockReturnValue(translatedFile);
        const translateImpl = jest.fn().mockResolvedValue('Translations/Topic_en.md');
        const { runTranslateFileCommandWithHost } = loadModule();

        await runTranslateFileCommandWithHost(host, file, undefined, reporter, translateImpl);

        expect(host.setBusy).toHaveBeenNthCalledWith(1, true);
        expect(translateImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            file,
            'en',
            reporter,
            true,
            undefined
        );
        expect(host.maybeAutoFixMermaidForFile).toHaveBeenCalledWith(
            translatedFile,
            reporter,
            'translate current file'
        );
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Translate file', 100);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch translate command resolves selected folder and reuses host cleanup path', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const folder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });
        host.getFolderSelection.mockResolvedValue('Concepts');
        host.getFolderByPath.mockReturnValue(folder);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            useCustomTranslationSavePath: true,
            translationSavePath: 'Translations'
        });
        const batchTranslateImpl = jest.fn().mockResolvedValue(undefined);
        const { runBatchTranslateFolderCommandWithHost } = loadModule();

        await runBatchTranslateFolderCommandWithHost(host, reporter, undefined, batchTranslateImpl);

        expect(batchTranslateImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            folder,
            'en',
            expect.objectContaining({
                reporter
            })
        );
        expect(host.maybeAutoFixMermaidForFolder).toHaveBeenCalledWith(
            'Translations',
            reporter,
            'batch translate folder'
        );
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('extract concepts command creates concept notes through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const activeFile = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        host.getActiveFile.mockReturnValue(activeFile);
        const extractImpl = jest.fn().mockResolvedValue(new Set(['Alpha', 'Beta']));
        const createNotesImpl = jest.fn().mockResolvedValue(undefined);
        const { runExtractConceptsCommandWithHost } = loadModule();

        await runExtractConceptsCommandWithHost(host, reporter, extractImpl, createNotesImpl);

        expect(extractImpl).toHaveBeenCalledWith(host.getApp(), host.getPluginRuntime(), activeFile, reporter);
        expect(createNotesImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            new Set(['Alpha', 'Beta']),
            'Topic',
            { disableBacklink: true, minimalTemplate: true }
        );
        expect(host.showNotice).toHaveBeenCalledWith('Extracted 2 concepts');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch extract concepts command aggregates per-file concepts and completes reporter', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Concepts/Topic.md',
            extension: 'md'
        });
        host.getFolderSelection.mockResolvedValue('Concepts');
        host.getFolderByPath.mockReturnValue(Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        }));
        host.getFiles.mockReturnValue([file]);
        const extractImpl = jest.fn().mockResolvedValue(new Set(['Alpha']));
        const createNotesImpl = jest.fn().mockResolvedValue(undefined);
        const { runBatchExtractConceptsForFolderCommandWithHost } = loadModule();

        await runBatchExtractConceptsForFolderCommandWithHost(host, reporter, extractImpl, createNotesImpl);

        expect(extractImpl).toHaveBeenCalledWith(host.getApp(), host.getPluginRuntime(), file, reporter);
        expect(createNotesImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getSettings(),
            new Set(['Alpha']),
            'Topic',
            { disableBacklink: true, minimalTemplate: true }
        );
        expect(host.showNotice).toHaveBeenCalledWith('Extracted 1 concepts from 1 files');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('extract original text command delegates through extracted host flow', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const activeFile = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        host.getActiveFile.mockReturnValue(activeFile);
        const extractOriginalImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic_Extracted.md',
            outputDirectory: 'Notes',
            outputSuffix: '_Extracted',
            questionCount: 1,
            mergedMode: false
        });
        const { runExtractOriginalTextCommandWithHost } = loadModule();

        const result = await runExtractOriginalTextCommandWithHost(host, reporter, extractOriginalImpl);

        expect(extractOriginalImpl).toHaveBeenCalledWith(
            host.getApp(),
            host.getPluginRuntime(),
            activeFile,
            reporter
        );
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Extract original text', 100);
        expect(host.showNotice).toHaveBeenCalledWith('Extraction complete. Saved to Notes/Topic_Extracted.md');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic_Extracted.md',
            outputDirectory: 'Notes',
            outputSuffix: '_Extracted',
            questionCount: 1,
            mergedMode: false
        });
        expect(getBusy()).toBe(false);
    });

    test('extract concepts and generate titles command reuses extracted flows without tripping busy guard', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const activeFile = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        const conceptFolder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });
        host.getActiveFile.mockReturnValue(activeFile);
        host.getFolderByPath.mockImplementation((path: string) => path === 'Concepts' ? conceptFolder : null);
        const extractImpl = jest.fn().mockResolvedValue(new Set(['Alpha']));
        const createNotesImpl = jest.fn().mockResolvedValue(undefined);
        const batchGenerateImpl = jest.fn().mockResolvedValue({ errors: [] });
        const { runExtractConceptsAndGenerateTitlesCommandWithHost } = loadModule();

        await runExtractConceptsAndGenerateTitlesCommandWithHost(
            host,
            reporter,
            extractImpl,
            createNotesImpl,
            batchGenerateImpl
        );

        expect(extractImpl).toHaveBeenCalledWith(host.getApp(), host.getPluginRuntime(), activeFile, reporter);
        expect(batchGenerateImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), 'Concepts', reporter);
        expect(host.showNotice).not.toHaveBeenCalledWith('Notemd busy');
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
