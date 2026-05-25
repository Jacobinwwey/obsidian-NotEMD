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
        updateActiveTasks: jest.fn(),
        updateApiLiveness: jest.fn()
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
            batchTranslationCompleted: 'Translated {count} files',
            failedTranslateFileWithMessage: 'Translation failed: {message}',
            translatedFileSavedTo: 'Translated file saved to {path}',
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
            noEligibleMarkdownFilesFoundExcluding: `No eligible '.md' files found in "{folderPath}" (excluding '{completeFolder}').`,
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
                if (actionId === 'batch-extract-original-text') {
                    return 'Batch extract original text';
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
            ensureConceptNotePathConfiguredForActions: jest.fn().mockResolvedValue(true),
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
        const generateImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic.md',
            title: 'Topic',
            researchEnabled: false,
            researchContextUsed: false,
            localKnowledgeContextUsed: false,
            localKnowledgeRetrieval: {
                indexedFileCount: 0,
                indexedSectionCount: 0,
                matchedSectionCount: 0,
                returnedHitCount: 0,
                expandedSectionCount: 0,
                sourcePaths: [],
                usedSlidingWindowSize: 0,
                requestedTopK: 0,
                indexBuildMs: 0,
                queryMs: 0,
                contextCharCount: 0,
                excludeCurrentFileApplied: false,
                excludedCurrentFileHitCount: 0
            },
            modified: true
        });
        const { runGenerateContentForTitleCommandWithHost } = loadModule();

        const result = await runGenerateContentForTitleCommandWithHost(host, file, reporter, generateImpl);

        expect(host.setBusy).toHaveBeenNthCalledWith(1, true);
        expect(generateImpl).toHaveBeenCalledWith(host.getApp(), mockSettings, file, reporter);
        expect(host.maybeAutoFixMermaidForFile).toHaveBeenCalledWith(file, reporter, 'generate from title');
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Generate from title', 100);
        expect(host.showNotice).toHaveBeenCalledWith('Generated Topic.md');
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(host.setBusy).toHaveBeenLastCalledWith(false);
        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic.md',
            title: 'Topic',
            researchEnabled: false,
            researchContextUsed: false,
            localKnowledgeContextUsed: false,
            localKnowledgeRetrieval: {
                indexedFileCount: 0,
                indexedSectionCount: 0,
                matchedSectionCount: 0,
                returnedHitCount: 0,
                expandedSectionCount: 0,
                sourcePaths: [],
                usedSlidingWindowSize: 0,
                requestedTopK: 0,
                indexBuildMs: 0,
                queryMs: 0,
                contextCharCount: 0,
                excludeCurrentFileApplied: false,
                excludedCurrentFileHitCount: 0
            },
            modified: true
        });
        expect(getBusy()).toBe(false);
    });

    test('process command stops early when concept note path guard redirects to settings', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.ensureConceptNotePathConfiguredForActions.mockResolvedValue(false);
        host.getActiveFile.mockImplementation(() => ({
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        } as any));
        const processImpl = jest.fn();
        const { runProcessWithNotemdCommandWithHost } = loadModule();

        const result = await runProcessWithNotemdCommandWithHost(host, reporter, processImpl);

        expect(host.ensureConceptNotePathConfiguredForActions).toHaveBeenCalledWith(['Process file']);
        expect(processImpl).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    test('batch generate command uses interactive folder-task selection profile when available', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false,
            folderTaskIncludeSubfoldersMode: 'legacy',
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-drafts',
                    name: 'Draft notes',
                    folderPathHint: 'Notes/Drafts',
                    includeSubfoldersMode: 'exclude',
                    fileFilterMode: 'glob',
                    fileFilterPattern: 'draft-*',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: true,
                    fileFilterInvert: false
                }
            ]
        });
        const getFolderTaskSelection = jest.fn().mockResolvedValue({
            folderPath: 'Notes',
            fileSelectionOverride: {
                profileId: 'profile-drafts'
            }
        });
        Object.assign(host, { getFolderTaskSelection });
        const batchGenerateImpl = jest.fn().mockResolvedValue({
            sourceFolderPath: 'Notes',
            completeFolderPath: 'Notes_complete',
            completeFolderCreated: true,
            processedFileCount: 0,
            generatedCount: 0,
            movedCount: 0,
            cancelled: false,
            fileResults: [],
            errors: []
        });
        const { runBatchGenerateContentForTitlesCommandWithHost } = loadModule();

        await runBatchGenerateContentForTitlesCommandWithHost(host, reporter, undefined, batchGenerateImpl);

        expect(getFolderTaskSelection).toHaveBeenCalledWith('batch-generate-from-titles', undefined);
        expect(host.getFolderSelection).not.toHaveBeenCalled();
        const passedSettings = batchGenerateImpl.mock.calls[0][1];
        expect(passedSettings.folderTaskIncludeSubfoldersMode).toBe('exclude');
        expect(passedSettings.folderTaskFileFilterMode).toBe('glob');
        expect(passedSettings.folderTaskFileFilterPattern).toBe('draft-*');
        expect(passedSettings.folderTaskFileFilterTarget).toBe('basename');
        expect(passedSettings.folderTaskFileFilterCaseSensitive).toBe(true);
    });

    test('batch extract original text command processes folder files', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getFolderSelection.mockResolvedValue('Notes');
        host.getFolderByPath.mockReturnValue({ path: 'Notes' } as any);
        host.getFiles.mockReturnValue([
            { name: 'A.md', basename: 'A', path: 'Notes/A.md', extension: 'md' } as any,
            { name: 'B.txt', basename: 'B', path: 'Notes/B.txt', extension: 'txt' } as any
        ]);

        const extractImpl = jest.fn()
            .mockResolvedValueOnce({
                sourcePath: 'Notes/A.md',
                outputPath: 'Notes/A_Extracted.md',
                outputDirectory: 'Notes',
                outputSuffix: '_Extracted',
                questionCount: 1,
                mergedMode: false
            })
            .mockResolvedValueOnce({
                sourcePath: 'Notes/B.txt',
                outputPath: 'Notes/B_Extracted.md',
                outputDirectory: 'Notes',
                outputSuffix: '_Extracted',
                questionCount: 1,
                mergedMode: false
            });

        const { runBatchExtractOriginalTextCommandWithHost } = loadModule();
        const result = await runBatchExtractOriginalTextCommandWithHost(host, reporter, extractImpl);

        expect(extractImpl).toHaveBeenCalledTimes(2);
        expect(result).toEqual(expect.objectContaining({
            folderPath: 'Notes',
            processedFileCount: 2,
            extractedCount: 2,
            cancelled: false
        }));
    });

    test('batch extract original text command supports folder path override and selection overrides', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false
        });
        host.getFolderByPath.mockReturnValue({ path: 'Notes' } as any);
        host.getFiles.mockReturnValue([
            { name: 'A.md', basename: 'A', path: 'Notes/A.md', extension: 'md' } as any,
            { name: 'B.md', basename: 'B', path: 'Notes/B.md', extension: 'md' } as any
        ]);

        const extractImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/A.md',
            outputPath: 'Notes/A_Extracted.md',
            outputDirectory: 'Notes',
            outputSuffix: '_Extracted',
            questionCount: 1,
            mergedMode: false
        });

        const { runBatchExtractOriginalTextCommandWithHost } = loadModule();
        const result = await runBatchExtractOriginalTextCommandWithHost(
            host,
            reporter,
            extractImpl,
            {
                folderPathOverride: 'Notes',
                fileSelectionOverride: {
                    fileFilterMode: 'contains',
                    fileFilterPattern: 'A',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: true
                }
            }
        );

        expect(host.getFolderSelection).not.toHaveBeenCalled();
        expect(extractImpl).toHaveBeenCalledTimes(1);
        expect(extractImpl.mock.calls[0][2].path).toBe('Notes/A.md');
        expect(result).toEqual(expect.objectContaining({
            folderPath: 'Notes',
            processedFileCount: 1,
            extractedCount: 1,
            cancelled: false
        }));
    });

    test('batch extract original text command does not mutate host settings when overrides are provided', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        const baseSettings = {
            ...mockSettings,
            folderTaskFileFilterMode: 'none' as const,
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath' as const,
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false
        };
        host.getSettings.mockReturnValue(baseSettings);
        host.getFolderByPath.mockReturnValue({ path: 'Notes' } as any);
        host.getFiles.mockReturnValue([
            { name: 'A.md', basename: 'A', path: 'Notes/A.md', extension: 'md' } as any
        ]);
        const extractImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/A.md',
            outputPath: 'Notes/A_Extracted.md',
            outputDirectory: 'Notes',
            outputSuffix: '_Extracted',
            questionCount: 1,
            mergedMode: false
        });
        const { runBatchExtractOriginalTextCommandWithHost } = loadModule();

        await runBatchExtractOriginalTextCommandWithHost(
            host,
            reporter,
            extractImpl,
            {
                folderPathOverride: 'Notes',
                fileSelectionOverride: {
                    fileFilterMode: 'glob',
                    fileFilterPattern: '**/*.md'
                }
            }
        );

        expect(baseSettings.folderTaskFileFilterMode).toBe('none');
        expect(baseSettings.folderTaskFileFilterPattern).toBe('');
        expect(baseSettings.folderTaskFileFilterTarget).toBe('relativePath');
        expect(baseSettings.folderTaskFileFilterCaseSensitive).toBe(false);
        expect(baseSettings.folderTaskFileFilterInvert).toBe(false);
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
        const processFileImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            requestedOutputFolderPath: 'Processed',
            outputFolderPath: 'Processed',
            outputFolderCreated: false,
            usedCustomOutputFolder: true,
            outputPath: 'Processed/Topic_processed.md',
            created: true,
            overwritten: false,
            movedOriginalFile: false,
            moveOriginalFile: false,
            chunkCount: 1,
            conceptCount: 2,
            conceptNoteFolderPath: 'Concepts',
            removedCodeFences: false
        });
        const { runProcessWithNotemdCommandWithHost } = loadModule();

        const result = await runProcessWithNotemdCommandWithHost(host, reporter, processFileImpl);

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
        expect(result).toEqual(expect.objectContaining({
            outputPath: 'Processed/Topic_processed.md',
            conceptCount: 2,
            created: true
        }));
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
        const translateImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Notes/Topic.md',
            targetLanguage: 'en',
            requestedOutputFolderPath: 'Translations',
            outputFolderPath: 'Translations',
            outputFolderCreated: false,
            usedFallbackOutputFolder: false,
            outputPath: 'Translations/Topic_en.md',
            created: true,
            overwritten: false,
            openedInWorkspace: true,
            chunkCount: 1
        });
        const { runTranslateFileCommandWithHost } = loadModule();

        const result = await runTranslateFileCommandWithHost(host, file, undefined, reporter, translateImpl);

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
        expect(host.showNotice).toHaveBeenCalledWith('Translated file saved to Translations/Topic_en.md');
        expect(reporter.updateStatus).toHaveBeenCalledWith('Done Translate file', 100);
        expect(result).toEqual(expect.objectContaining({
            outputPath: 'Translations/Topic_en.md',
            openedInWorkspace: true
        }));
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
        const batchTranslateImpl = jest.fn().mockResolvedValue({
            folderPath: 'Concepts',
            requestedOutputFolderPath: 'Translations',
            outputFolderPath: 'Translations',
            outputFolderCreated: false,
            targetLanguage: 'en',
            processedFileCount: 1,
            translatedCount: 1,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Concepts/Topic.md',
                    targetLanguage: 'en',
                    requestedOutputFolderPath: 'Translations',
                    outputFolderPath: 'Translations',
                    outputFolderCreated: false,
                    usedFallbackOutputFolder: false,
                    outputPath: 'Translations/Topic_en.md',
                    created: true,
                    overwritten: false,
                    openedInWorkspace: false,
                    chunkCount: 1
                }
            ],
            errors: []
        });
        const { runBatchTranslateFolderCommandWithHost } = loadModule();

        const result = await runBatchTranslateFolderCommandWithHost(host, reporter, undefined, batchTranslateImpl);

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
        expect(host.showNotice).toHaveBeenCalledWith('Translated 1 files', 5000);
        expect(result).toEqual(expect.objectContaining({
            translatedCount: 1,
            fileResults: expect.any(Array)
        }));
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

    test('batch extract concepts command forwards API liveness events from per-file reporters in parallel mode', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Concepts/Topic.md',
            extension: 'md'
        });
        host.getSettings.mockReturnValue({
            ...mockSettings,
            enableBatchParallelism: true,
            batchConcurrency: 2,
            batchSize: 10
        });
        host.getFolderSelection.mockResolvedValue('Concepts');
        host.getFolderByPath.mockReturnValue(Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        }));
        host.getFiles.mockReturnValue([file]);
        const extractImpl = jest.fn().mockImplementation(async (_app, _runtime, _file, fileReporter: ProgressReporter) => {
            fileReporter.updateApiLiveness?.({ phase: 'request-start', providerName: 'OpenAI', requestId: 'req-openai-1' });
            fileReporter.updateApiLiveness?.({
                phase: 'response-headers',
                providerName: 'OpenAI',
                requestId: 'req-openai-1',
                transport: 'desktop-http-stream'
            });
            fileReporter.updateApiLiveness?.({
                phase: 'response-chunk',
                providerName: 'OpenAI',
                requestId: 'req-openai-1',
                transport: 'desktop-http-stream'
            });
            fileReporter.updateApiLiveness?.({ phase: 'request-complete', providerName: 'OpenAI', requestId: 'req-openai-1' });
            return new Set(['Alpha']);
        });
        const createNotesImpl = jest.fn().mockResolvedValue(undefined);
        const { runBatchExtractConceptsForFolderCommandWithHost } = loadModule();

        await runBatchExtractConceptsForFolderCommandWithHost(host, reporter, extractImpl, createNotesImpl);

        expect(reporter.updateApiLiveness).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'request-start',
            providerName: 'OpenAI',
            requestId: 'req-openai-1'
        }));
        expect(reporter.updateApiLiveness).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'response-headers',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            transport: 'desktop-http-stream'
        }));
        expect(reporter.updateApiLiveness).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'response-chunk',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            transport: 'desktop-http-stream'
        }));
        expect(reporter.updateApiLiveness).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'request-complete',
            providerName: 'OpenAI',
            requestId: 'req-openai-1'
        }));
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

    test('process folder command applies configured folder-task file filters', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            folderTaskFileFilterMode: 'contains',
            folderTaskFileFilterPattern: 'A',
            folderTaskFileFilterTarget: 'basename',
            folderTaskFileFilterCaseSensitive: true
        });
        host.getFolderByPath.mockReturnValue(Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        }));
        host.getFiles.mockReturnValue([
            { name: 'A.md', basename: 'A', path: 'Concepts/A.md', extension: 'md' } as any,
            { name: 'B.md', basename: 'B', path: 'Concepts/B.md', extension: 'md' } as any
        ]);
        const processImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Concepts/A.md',
            requestedOutputFolderPath: 'Concepts',
            outputFolderPath: 'Concepts',
            outputFolderCreated: false,
            usedCustomOutputFolder: false,
            outputPath: 'Concepts/A_processed.md',
            created: true,
            overwritten: false,
            movedOriginalFile: false,
            moveOriginalFile: false,
            chunkCount: 1,
            conceptCount: 0,
            conceptNoteFolderPath: '',
            removedCodeFences: false
        });
        const { runProcessFolderWithNotemdCommandWithHost } = loadModule();

        const result = await runProcessFolderWithNotemdCommandWithHost(host, reporter, 'Concepts', processImpl);

        expect(processImpl).toHaveBeenCalledTimes(1);
        expect(processImpl.mock.calls[0][2].path).toBe('Concepts/A.md');
        expect(result).toEqual(expect.objectContaining({
            processedFileCount: 1,
            savedCount: 1
        }));
    });

    test('process folder command allows per-operation file selection overrides', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false
        });
        host.getFolderByPath.mockReturnValue(Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        }));
        host.getFiles.mockReturnValue([
            { name: 'A.md', basename: 'A', path: 'Concepts/A.md', extension: 'md' } as any,
            { name: 'B.md', basename: 'B', path: 'Concepts/B.md', extension: 'md' } as any
        ]);
        const processImpl = jest.fn().mockResolvedValue({
            sourcePath: 'Concepts/A.md',
            requestedOutputFolderPath: 'Concepts',
            outputFolderPath: 'Concepts',
            outputFolderCreated: false,
            usedCustomOutputFolder: false,
            outputPath: 'Concepts/A_processed.md',
            created: true,
            overwritten: false,
            movedOriginalFile: false,
            moveOriginalFile: false,
            chunkCount: 1,
            conceptCount: 0,
            conceptNoteFolderPath: '',
            removedCodeFences: false
        });
        const { runProcessFolderWithNotemdCommandWithHost } = loadModule();

        const result = await runProcessFolderWithNotemdCommandWithHost(
            host,
            reporter,
            'Concepts',
            processImpl,
            {
                fileFilterMode: 'contains',
                fileFilterPattern: 'A',
                fileFilterTarget: 'basename',
                fileFilterCaseSensitive: true
            }
        );

        expect(processImpl).toHaveBeenCalledTimes(1);
        expect(processImpl.mock.calls[0][2].path).toBe('Concepts/A.md');
        expect(result).toEqual(expect.objectContaining({
            processedFileCount: 1,
            savedCount: 1
        }));
    });

    test('batch translate command passes per-operation selection overrides without mutating host settings', async () => {
        const reporter = createReporter();
        const { host } = createHost(reporter);
        const folder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });
        host.getFolderSelection.mockResolvedValue('Concepts');
        host.getFolderByPath.mockReturnValue(folder);
        host.getSettings.mockReturnValue({
            ...mockSettings,
            folderTaskIncludeSubfoldersMode: 'legacy'
        });
        const batchTranslateImpl = jest.fn().mockResolvedValue({
            folderPath: 'Concepts',
            requestedOutputFolderPath: 'Translations',
            outputFolderPath: 'Translations',
            outputFolderCreated: false,
            targetLanguage: 'en',
            processedFileCount: 0,
            translatedCount: 0,
            cancelled: false,
            fileResults: [],
            errors: []
        });
        const { runBatchTranslateFolderCommandWithHost } = loadModule();

        await runBatchTranslateFolderCommandWithHost(
            host,
            reporter,
            undefined,
            batchTranslateImpl,
            {
                includeSubfoldersMode: 'include'
            }
        );

        expect(batchTranslateImpl).toHaveBeenCalledTimes(1);
        const passedSettings = batchTranslateImpl.mock.calls[0][1];
        expect(passedSettings.folderTaskIncludeSubfoldersMode).toBe('include');
        expect(host.getSettings().folderTaskIncludeSubfoldersMode).toBe('legacy');
    });

    test('batch generate command returns resolved folders and reuses shared reporter cleanup', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const batchGenerateImpl = jest.fn().mockResolvedValue({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete',
            completeFolderCreated: true,
            processedFileCount: 2,
            generatedCount: 2,
            movedCount: 2,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Concepts/A.md',
                    outputPath: 'Concepts/A.md',
                    title: 'A',
                    researchEnabled: false,
                    researchContextUsed: false,
                    localKnowledgeContextUsed: false,
                    localKnowledgeRetrieval: {
                        indexedFileCount: 0,
                        indexedSectionCount: 0,
                        matchedSectionCount: 0,
                        returnedHitCount: 0,
                        expandedSectionCount: 0,
                        sourcePaths: [],
                        usedSlidingWindowSize: 0,
                        requestedTopK: 0,
                        indexBuildMs: 0,
                        queryMs: 0,
                        contextCharCount: 0,
                        excludeCurrentFileApplied: false,
                        excludedCurrentFileHitCount: 0
                    },
                    modified: true,
                    completeDestinationPath: 'Concepts_complete/A.md',
                    movedToCompleteFolder: true,
                    skippedMoveBecauseDestinationExists: false,
                    skippedMoveBecauseSourceMissing: false
                }
            ],
            errors: []
        });
        const { runBatchGenerateContentForTitlesCommandWithHost } = loadModule();

        const result = await runBatchGenerateContentForTitlesCommandWithHost(
            host,
            reporter,
            'Concepts',
            batchGenerateImpl
        );

        expect(batchGenerateImpl).toHaveBeenCalledWith(host.getApp(), host.getSettings(), 'Concepts', reporter);
        expect(host.maybeAutoFixMermaidForFolder).toHaveBeenCalledWith(
            'Concepts_complete',
            reporter,
            'batch generate from titles'
        );
        expect(host.showNotice).toHaveBeenCalledWith('Generated content in Concepts', 5000);
        expect(host.completeReporter).toHaveBeenCalledWith(reporter);
        expect(result).toEqual({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete',
            completeFolderCreated: true,
            processedFileCount: 2,
            generatedCount: 2,
            movedCount: 2,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Concepts/A.md',
                    outputPath: 'Concepts/A.md',
                    title: 'A',
                    researchEnabled: false,
                    researchContextUsed: false,
                    localKnowledgeContextUsed: false,
                    localKnowledgeRetrieval: {
                        indexedFileCount: 0,
                        indexedSectionCount: 0,
                        matchedSectionCount: 0,
                        returnedHitCount: 0,
                        expandedSectionCount: 0,
                        sourcePaths: [],
                        usedSlidingWindowSize: 0,
                        requestedTopK: 0,
                        indexBuildMs: 0,
                        queryMs: 0,
                        contextCharCount: 0,
                        excludeCurrentFileApplied: false,
                        excludedCurrentFileHitCount: 0
                    },
                    modified: true,
                    completeDestinationPath: 'Concepts_complete/A.md',
                    movedToCompleteFolder: true,
                    skippedMoveBecauseDestinationExists: false,
                    skippedMoveBecauseSourceMissing: false
                }
            ],
            errors: []
        });
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });

    test('batch generate command does not report success when no eligible files exist', async () => {
        const reporter = createReporter();
        const { host, getBusy } = createHost(reporter);
        const batchGenerateImpl = jest.fn().mockResolvedValue({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete',
            completeFolderCreated: false,
            processedFileCount: 0,
            generatedCount: 0,
            movedCount: 0,
            cancelled: false,
            fileResults: [],
            errors: []
        });
        const { runBatchGenerateContentForTitlesCommandWithHost } = loadModule();

        const result = await runBatchGenerateContentForTitlesCommandWithHost(
            host,
            reporter,
            'Concepts',
            batchGenerateImpl
        );

        expect(host.showNotice).toHaveBeenCalledWith("No eligible '.md' files found in \"Concepts\" (excluding 'Concepts_complete').");
        expect(host.maybeAutoFixMermaidForFolder).not.toHaveBeenCalled();
        expect(host.completeReporter).not.toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
            processedFileCount: 0,
            generatedCount: 0
        }));
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(getBusy()).toBe(false);
    });
});
