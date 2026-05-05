import NotemdPlugin from '../main';
import { TFile, TFolder } from 'obsidian';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as fileUtils from '../fileUtils';
import * as searchUtils from '../searchUtils';
import * as translateUtils from '../translate';
import * as extractOriginalTextModule from '../extractOriginalText';
import * as formulaFixer from '../formulaFixer';

function createManifest() {
    return {
        id: 'notemd-test',
        name: 'Notemd Test',
        version: '0.0.1',
        author: 'Test',
        description: 'Test plugin',
        isDesktopOnly: false,
        minAppVersion: '1.0.0'
    };
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

function createPlugin(): NotemdPlugin {
    const plugin = new NotemdPlugin(mockApp, createManifest() as any);
    plugin.app = mockApp;
    (plugin as any).manifest = createManifest();
    plugin.settings = {
        ...mockSettings,
        _firstLaunch: false
    };
    plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
    plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
    plugin.registerView = jest.fn();
    plugin.registerEvent = jest.fn();
    plugin.addRibbonIcon = jest.fn(() => ({ setAttribute: jest.fn() } as any)) as any;
    plugin.addStatusBarItem = jest.fn(() => ({ setText: jest.fn(), empty: jest.fn() } as any)) as any;
    plugin.addSettingTab = jest.fn();
    return plugin;
}

function createGenerateContentResult(overrides?: Partial<fileUtils.GenerateContentForTitleResult>): fileUtils.GenerateContentForTitleResult {
    return {
        sourcePath: 'Notes/Topic.md',
        outputPath: 'Notes/Topic.md',
        title: 'Topic',
        researchEnabled: false,
        researchContextUsed: false,
        modified: true,
        ...overrides
    };
}

describe('note processing command surface', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('registers extract original text as a real command for hotkey and command-palette parity', async () => {
        const plugin = createPlugin();
        plugin.registerExtensions = jest.fn();
        const addCommandSpy = jest.fn();
        (plugin as any).addCommand = addCommandSpy;

        await plugin.onload();

        const ids = addCommandSpy.mock.calls.map((call: any[]) => call[0]?.id);
        expect(ids).toContain('extract-original-text');
        expect(ids).toContain('create-wiki-link-and-generate-from-selection');
    });

    test('generate from title command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const file = {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md'
        } as any;

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runGenerateContentForTitleCommandWithHost')
            .mockResolvedValue(null);
        const utilitySpy = jest
            .spyOn(fileUtils, 'generateContentForTitle')
            .mockResolvedValue(createGenerateContentResult());

        await (plugin as any).generateContentForTitleCommand(file, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getApp: expect.any(Function),
            loadSettings: expect.any(Function),
            getSettings: expect.any(Function),
            getUiStrings: expect.any(Function),
            getActionLabel: expect.any(Function),
            getReporter: expect.any(Function),
            isBusy: expect.any(Function),
            setBusy: expect.any(Function),
            startReporterAction: expect.any(Function),
            failReporterAction: expect.any(Function),
            updateStatusBar: expect.any(Function),
            getRunningActionText: expect.any(Function),
            getActionCompleteText: expect.any(Function),
            showNotice: expect.any(Function),
            logError: expect.any(Function),
            openErrorModal: expect.any(Function),
            saveErrorLog: expect.any(Function),
            maybeAutoFixMermaidForFile: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), file, reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('research command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const editor = {
            getSelection: jest.fn(() => 'Topic')
        } as any;
        const view = {
            file: {
                name: 'Topic.md',
                basename: 'Topic',
                path: 'Notes/Topic.md'
            }
        } as any;

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runResearchAndSummarizeCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(searchUtils, 'researchAndSummarize')
            .mockResolvedValue(undefined);

        await (plugin as any).researchAndSummarizeCommand(editor, view, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getApp: expect.any(Function),
            loadSettings: expect.any(Function),
            getSettings: expect.any(Function),
            getUiStrings: expect.any(Function),
            getActionLabel: expect.any(Function),
            getReporter: expect.any(Function),
            isBusy: expect.any(Function),
            setBusy: expect.any(Function),
            startReporterAction: expect.any(Function),
            failReporterAction: expect.any(Function),
            updateStatusBar: expect.any(Function),
            getRunningActionText: expect.any(Function),
            getActionCompleteText: expect.any(Function),
            showNotice: expect.any(Function),
            logError: expect.any(Function),
            openErrorModal: expect.any(Function),
            saveErrorLog: expect.any(Function),
            maybeAutoFixMermaidForFile: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), editor, view, reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('create wiki-link and generate command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const editor = {
            getSelection: jest.fn(() => 'Alpha'),
            replaceSelection: jest.fn()
        } as any;
        const view = {
            file: {
                basename: 'Topic',
                path: 'Notes/Topic.md'
            }
        } as any;

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runCreateWikiLinkAndGenerateFromSelectionCommandWithHost')
            .mockResolvedValue({
                notePath: 'Concepts/Alpha.md',
                word: 'Alpha',
                created: true
            });
        const createNotesSpy = jest
            .spyOn(fileUtils, 'createConceptNotes')
            .mockResolvedValue(undefined);
        const generateSpy = jest
            .spyOn(fileUtils, 'generateContentForTitle')
            .mockResolvedValue(createGenerateContentResult({
                sourcePath: 'Concepts/Alpha.md',
                outputPath: 'Concepts/Alpha.md',
                title: 'Alpha'
            }));

        const result = await (plugin as any).createWikiLinkAndGenerateFromSelectionCommand(editor, view, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getApp: expect.any(Function),
            loadSettings: expect.any(Function),
            getSettings: expect.any(Function),
            getUiStrings: expect.any(Function),
            getFileByPath: expect.any(Function),
            getReporter: expect.any(Function),
            isBusy: expect.any(Function),
            setBusy: expect.any(Function),
            startReporterAction: expect.any(Function),
            failReporterAction: expect.any(Function),
            updateStatusBar: expect.any(Function),
            getActionCompleteText: expect.any(Function),
            showNotice: expect.any(Function),
            logError: expect.any(Function),
            openErrorModal: expect.any(Function),
            saveErrorLog: expect.any(Function),
            maybeAutoFixMermaidForFile: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), editor, view, reporter);
        expect(result).toEqual({
            notePath: 'Concepts/Alpha.md',
            word: 'Alpha',
            created: true
        });
        expect(createNotesSpy).not.toHaveBeenCalled();
        expect(generateSpy).not.toHaveBeenCalled();
    });

    test('process current command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const activeFile = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(activeFile);

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runProcessWithNotemdCommandWithHost')
            .mockResolvedValue({
                sourcePath: 'Notes/Topic.md',
                requestedOutputFolderPath: 'Notes',
                outputFolderPath: 'Notes',
                outputFolderCreated: false,
                usedCustomOutputFolder: false,
                outputPath: 'Notes/Topic_processed.md',
                created: true,
                overwritten: false,
                movedOriginalFile: false,
                moveOriginalFile: false,
                chunkCount: 1,
                conceptCount: 2,
                conceptNoteFolderPath: 'Concepts',
                removedCodeFences: false
            });
        const utilitySpy = jest
            .spyOn(fileUtils, 'processFile')
            .mockResolvedValue({
                sourcePath: 'Notes/Topic.md',
                requestedOutputFolderPath: 'Notes',
                outputFolderPath: 'Notes',
                outputFolderCreated: false,
                usedCustomOutputFolder: false,
                outputPath: 'Notes/Topic_processed.md',
                created: true,
                overwritten: false,
                movedOriginalFile: false,
                moveOriginalFile: false,
                chunkCount: 1,
                conceptCount: 2,
                conceptNoteFolderPath: 'Concepts',
                removedCodeFences: false
            });

        const result = await (plugin as any).processWithNotemdCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getActiveFile: expect.any(Function),
            getFileByPath: expect.any(Function),
            currentProcessingFileBasename: expect.any(Object),
            maybeAutoFixMermaidForFile: expect.any(Function),
            completeReporter: expect.any(Function)
        }), reporter);
        expect(result).toEqual(expect.objectContaining({
            outputPath: 'Notes/Topic_processed.md',
            conceptCount: 2
        }));
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('process folder command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const folder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Concepts/Topic.md',
            extension: 'md'
        });
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Concepts') {
                return folder;
            }
            return null;
        });
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([file]);

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runProcessFolderWithNotemdCommandWithHost')
            .mockResolvedValue({
                folderPath: 'Concepts',
                processedFileCount: 1,
                savedCount: 1,
                cancelled: false,
                fileResults: [
                    {
                        sourcePath: 'Concepts/Topic.md',
                        requestedOutputFolderPath: 'Concepts',
                        outputFolderPath: 'Concepts',
                        outputFolderCreated: false,
                        usedCustomOutputFolder: false,
                        outputPath: 'Concepts/Topic_processed.md',
                        created: true,
                        overwritten: false,
                        movedOriginalFile: false,
                        moveOriginalFile: false,
                        chunkCount: 1,
                        conceptCount: 2,
                        conceptNoteFolderPath: 'Concepts',
                        removedCodeFences: false
                    }
                ],
                errors: []
            });
        const utilitySpy = jest
            .spyOn(fileUtils, 'processFile')
            .mockResolvedValue({
                sourcePath: 'Concepts/Topic.md',
                requestedOutputFolderPath: 'Concepts',
                outputFolderPath: 'Concepts',
                outputFolderCreated: false,
                usedCustomOutputFolder: false,
                outputPath: 'Concepts/Topic_processed.md',
                created: true,
                overwritten: false,
                movedOriginalFile: false,
                moveOriginalFile: false,
                chunkCount: 1,
                conceptCount: 2,
                conceptNoteFolderPath: 'Concepts',
                removedCodeFences: false
            });

        const result = await (plugin as any).processFolderWithNotemdCommand(reporter, 'Concepts');

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getFolderByPath: expect.any(Function),
            getFiles: expect.any(Function),
            getFolderSelection: expect.any(Function),
            getBatchProgressStore: expect.any(Function),
            maybeAutoFixMermaidForFolder: expect.any(Function),
            appendVaultLog: expect.any(Function)
        }), reporter, 'Concepts');
        expect(result).toEqual(expect.objectContaining({
            processedFileCount: 1,
            savedCount: 1,
            fileResults: expect.any(Array)
        }));
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('batch generate command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runBatchGenerateContentForTitlesCommandWithHost')
            .mockResolvedValue({
                sourceFolderPath: 'Concepts',
                completeFolderPath: 'Concepts_complete',
                completeFolderCreated: true,
                processedFileCount: 1,
                generatedCount: 1,
                movedCount: 1,
                cancelled: false,
                fileResults: [],
                errors: []
            });
        const utilitySpy = jest
            .spyOn(fileUtils, 'batchGenerateContentForTitles')
            .mockResolvedValue({
                sourceFolderPath: 'Concepts',
                completeFolderPath: 'Concepts_complete',
                completeFolderCreated: true,
                processedFileCount: 1,
                generatedCount: 1,
                movedCount: 1,
                cancelled: false,
                fileResults: [],
                errors: []
            });

        const result = await (plugin as any).batchGenerateContentForTitlesCommand(reporter, 'Concepts');

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getFolderSelection: expect.any(Function),
            resolveCompleteFolderPath: expect.any(Function),
            maybeAutoFixMermaidForFolder: expect.any(Function),
            completeReporter: expect.any(Function)
        }), reporter, 'Concepts');
        expect(result).toEqual({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete',
            completeFolderCreated: true,
            processedFileCount: 1,
            generatedCount: 1,
            movedCount: 1,
            cancelled: false,
            fileResults: [],
            errors: []
        });
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('translate current file command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runTranslateFileCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(translateUtils, 'translateFile')
            .mockResolvedValue({
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

        await (plugin as any).translateFileCommand(file, reporter.abortController?.signal, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getTaskLanguageCode: expect.any(Function),
            getPluginRuntime: expect.any(Function),
            maybeAutoFixMermaidForFile: expect.any(Function)
        }), file, reporter.abortController?.signal, reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('batch translate folder command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const folder = Object.assign(new (TFolder as any)(), {
            name: 'Concepts',
            path: 'Concepts'
        });

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runBatchTranslateFolderCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(translateUtils, 'batchTranslateFolder')
            .mockResolvedValue({
                folderPath: 'Concepts',
                requestedOutputFolderPath: 'Concepts',
                outputFolderPath: 'Concepts',
                outputFolderCreated: false,
                targetLanguage: 'en',
                processedFileCount: 1,
                translatedCount: 1,
                cancelled: false,
                fileResults: [
                    {
                        sourcePath: 'Concepts/Topic.md',
                        targetLanguage: 'en',
                        requestedOutputFolderPath: 'Concepts',
                        outputFolderPath: 'Concepts',
                        outputFolderCreated: false,
                        usedFallbackOutputFolder: false,
                        outputPath: 'Concepts/Topic_en.md',
                        created: true,
                        overwritten: false,
                        openedInWorkspace: false,
                        chunkCount: 1
                    }
                ],
                errors: []
            });

        await (plugin as any).batchTranslateFolderCommand(folder, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getTaskLanguageCode: expect.any(Function),
            getFolderByPath: expect.any(Function),
            maybeAutoFixMermaidForFolder: expect.any(Function)
        }), reporter, folder);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('extract current concepts command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runExtractConceptsCommandWithHost')
            .mockResolvedValue(undefined);
        const extractSpy = jest
            .spyOn(fileUtils, 'extractConceptsFromFile')
            .mockResolvedValue(new Set());

        await (plugin as any).extractConceptsCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getActiveFile: expect.any(Function),
            getPluginRuntime: expect.any(Function),
            completeReporter: expect.any(Function)
        }), reporter);
        expect(extractSpy).not.toHaveBeenCalled();
    });

    test('batch extract concepts command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runBatchExtractConceptsForFolderCommandWithHost')
            .mockResolvedValue(undefined);
        const extractSpy = jest
            .spyOn(fileUtils, 'extractConceptsFromFile')
            .mockResolvedValue(new Set());

        await (plugin as any).batchExtractConceptsForFolderCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getFolderSelection: expect.any(Function),
            getFiles: expect.any(Function),
            getPluginRuntime: expect.any(Function)
        }), reporter);
        expect(extractSpy).not.toHaveBeenCalled();
    });

    test('extract concepts and generate titles command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runExtractConceptsAndGenerateTitlesCommandWithHost')
            .mockResolvedValue(undefined);
        const extractSpy = jest
            .spyOn(fileUtils, 'extractConceptsFromFile')
            .mockResolvedValue(new Set());

        await (plugin as any).extractConceptsAndGenerateTitlesCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getPluginRuntime: expect.any(Function),
            getFolderByPath: expect.any(Function),
            getActionLabel: expect.any(Function)
        }), reporter);
        expect(extractSpy).not.toHaveBeenCalled();
    });

    test('extract original text command delegates to extracted note-processing host adapter', async () => {
        const noteProcessingCommandHostAdapter = require('../operations/noteProcessingCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(noteProcessingCommandHostAdapter, 'runExtractOriginalTextCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(extractOriginalTextModule, 'extractOriginalText')
            .mockResolvedValue({
                sourcePath: 'Notes/Topic.md',
                outputPath: 'Notes/Topic_Extracted.md',
                outputDirectory: 'Notes',
                outputSuffix: '_Extracted',
                questionCount: 1,
                mergedMode: false
            });

        await (plugin as any).extractOriginalTextCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getActiveFile: expect.any(Function),
            getPluginRuntime: expect.any(Function)
        }), reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('duplicate cleanup command delegates to extracted utility host adapter', async () => {
        const utilityCommandHostAdapter = require('../operations/utilityCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(utilityCommandHostAdapter, 'runCheckAndRemoveDuplicateConceptNotesCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(fileUtils, 'checkAndRemoveDuplicateConceptNotes')
            .mockResolvedValue(undefined);

        await (plugin as any).checkAndRemoveDuplicateConceptNotesCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getApp: expect.any(Function),
            loadSettings: expect.any(Function),
            getSettings: expect.any(Function),
            getUiStrings: expect.any(Function),
            getActionLabel: expect.any(Function),
            getReporter: expect.any(Function),
            isBusy: expect.any(Function),
            setBusy: expect.any(Function),
            startReporterAction: expect.any(Function),
            failReporterAction: expect.any(Function),
            updateStatusBar: expect.any(Function),
            getRunningActionText: expect.any(Function),
            getActionCompleteText: expect.any(Function),
            showNotice: expect.any(Function),
            logError: expect.any(Function),
            openErrorModal: expect.any(Function),
            saveErrorLog: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('check duplicates current command delegates to extracted utility host adapter', async () => {
        const utilityCommandHostAdapter = require('../operations/utilityCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(utilityCommandHostAdapter, 'runCheckDuplicatesCurrentCommandWithHost')
            .mockResolvedValue({
                sourcePath: 'Notes/Topic.md',
                duplicateCount: 1,
                duplicates: ['alpha']
            });
        const utilitySpy = jest
            .spyOn(fileUtils, 'findDuplicates')
            .mockReturnValue(new Set(['alpha']));

        const result = await (plugin as any).checkDuplicatesCurrentCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getActiveFile: expect.any(Function),
            readFile: expect.any(Function),
            getUiStrings: expect.any(Function),
            showNotice: expect.any(Function),
            logInfo: expect.any(Function)
        }), reporter);
        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            duplicateCount: 1,
            duplicates: ['alpha']
        });
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('batch mermaid fix command delegates to extracted utility host adapter', async () => {
        const utilityCommandHostAdapter = require('../operations/utilityCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(utilityCommandHostAdapter, 'runBatchMermaidFixCommandWithHost')
            .mockResolvedValue({ folderPath: 'Concepts', modifiedCount: 2 });
        const utilitySpy = jest
            .spyOn(fileUtils, 'batchFixMermaidSyntaxInFolder')
            .mockResolvedValue({ errors: [], modifiedCount: 2 });

        const result = await (plugin as any).batchMermaidFixCommand(reporter, 'Concepts');

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getFolderSelection: expect.any(Function),
            getActionLabel: expect.any(Function),
            showNotice: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), reporter, 'Concepts');
        expect(result).toEqual({ folderPath: 'Concepts', modifiedCount: 2 });
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('fix formula command delegates to extracted utility host adapter', async () => {
        const utilityCommandHostAdapter = require('../operations/utilityCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();
        const file = Object.assign(new (TFile as any)(), {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            extension: 'md'
        });

        const hostSpy = jest
            .spyOn(utilityCommandHostAdapter, 'runFixFormulaFormatsCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(formulaFixer, 'fixFormulaFormatsInFile')
            .mockResolvedValue({
                sourcePath: 'Notes/Topic.md',
                outputPath: 'Notes/Topic.md',
                modified: true,
                replacementCount: 2
            });

        await (plugin as any).fixFormulaFormatsCommand(file, reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getApp: expect.any(Function),
            getActionLabel: expect.any(Function),
            showNotice: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), file, reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });

    test('batch formula fix command delegates to extracted utility host adapter', async () => {
        const utilityCommandHostAdapter = require('../operations/utilityCommandHostAdapter');
        const plugin = createPlugin();
        const reporter = createReporter();

        const hostSpy = jest
            .spyOn(utilityCommandHostAdapter, 'runBatchFixFormulaFormatsCommandWithHost')
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(formulaFixer, 'batchFixFormulaFormatsInFolder')
            .mockResolvedValue({
                folderPath: 'Notes',
                processedFileCount: 1,
                modifiedCount: 1,
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

        await (plugin as any).batchFixFormulaFormatsCommand(reporter);

        expect(hostSpy).toHaveBeenCalledWith(expect.objectContaining({
            getFolderSelection: expect.any(Function),
            getActionLabel: expect.any(Function),
            showNotice: expect.any(Function),
            completeReporter: expect.any(Function),
            finalizeReporter: expect.any(Function)
        }), reporter);
        expect(utilitySpy).not.toHaveBeenCalled();
    });
});
