import { App, TFile, TFolder } from 'obsidian';
import { NotemdSettings, ProgressReporter } from '../types';
import { batchGenerateContentForTitles } from '../fileUtils';
import { DEFAULT_SETTINGS } from '../constants';

// Mock dependencies
jest.mock('../llmUtils', () => ({
    callDeepSeekAPI: jest.fn().mockResolvedValue('processed content'),
}));

jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    delay: jest.fn().mockResolvedValue(undefined),
}));

const mockApp = {
    vault: {
        getAbstractFileByPath: jest.fn(),
        getMarkdownFiles: jest.fn(),
        createFolder: jest.fn(),
        rename: jest.fn(),
        adapter: {
            exists: jest.fn(),
            stat: jest.fn(),
        }
    },
} as unknown as App;

const mockProgressReporter: ProgressReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() { return false; },
    abortController: new AbortController(),
    activeTasks: 0,
    updateActiveTasks: jest.fn(),
};

describe('batchGenerateContentForTitles', () => {
    let settings: NotemdSettings;

    beforeEach(() => {
        settings = { ...DEFAULT_SETTINGS };
        jest.clearAllMocks();
    });

    it('should process files in parallel when enabled', async () => {
        settings.enableBatchParallelism = true;
        settings.batchConcurrency = 2;
        settings.batchSize = 2;

        const files = [
            { path: 'folder/file1.md', name: 'file1.md' },
            { path: 'folder/file2.md', name: 'file2.md' },
        ] as TFile[];

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'folder') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(files);
        (mockApp.vault.adapter.exists as jest.Mock).mockResolvedValue(false);

        await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        expect(mockProgressReporter.log).toHaveBeenCalledWith('Processing batch 1/1 (2 files)');
        expect(mockProgressReporter.updateActiveTasks).toHaveBeenCalledTimes(4); // 2 tasks, each call increments and decrements
    });

    it('should process files serially when disabled', async () => {
        settings.enableBatchParallelism = false;

        const files = [
            { path: 'folder/file1.md', name: 'file1.md' },
            { path: 'folder/file2.md', name: 'file2.md' },
        ] as TFile[];

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'folder') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(files);
        (mockApp.vault.adapter.exists as jest.Mock).mockResolvedValue(false);

        await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        expect(mockProgressReporter.updateStatus).toHaveBeenCalledWith('Generating 1/2: file1.md', 0);
        expect(mockProgressReporter.updateStatus).toHaveBeenCalledWith('Generating 2/2: file2.md', 50);
    });
});
