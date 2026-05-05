import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as fileUtils from '../fileUtils';
import * as searchUtils from '../searchUtils';

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

describe('note processing command surface', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
            .mockResolvedValue(undefined);
        const utilitySpy = jest
            .spyOn(fileUtils, 'generateContentForTitle')
            .mockResolvedValue(undefined);

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
});
