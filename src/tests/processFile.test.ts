import { TFile, TFolder } from 'obsidian';
import { processFile } from '../fileUtils';
import { NotemdSettings, ProgressReporter } from '../types';
import * as llmUtils from '../llmUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

// Mock Progress Reporter
const mockReporter: ProgressReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() { return false; },
    activeTasks: 0,
    updateActiveTasks: jest.fn(),
    abortController: new AbortController(),
};

describe('processFile', () => {
    let settings: NotemdSettings;
    let mockFile: TFile;

    beforeEach(() => {
        jest.clearAllMocks();

        settings = mockSettings;

        mockFile = {
            path: 'test.md',
            name: 'test.md',
            basename: 'test',
            parent: { path: '/' }
        } as TFile;

        (mockApp.vault.read as jest.Mock).mockResolvedValue('This is a test file about AI and machine learning.');
    });

    it('should process a file and save the processed file', async () => {
        const llmResponse = 'This is a test file about [[AI]] and [[machine learning]].';
        jest.spyOn(llmUtils, 'callDeepSeekAPI').mockResolvedValue(llmResponse);

        await processFile(mockApp, settings, mockFile, mockReporter, { value: null });

        expect(mockApp.vault.read).toHaveBeenCalledWith(mockFile);
        expect(llmUtils.callDeepSeekAPI).toHaveBeenCalled();
        expect(mockApp.vault.create).toHaveBeenCalledWith('test_processed.md', llmResponse);
    });

    it('should create concept notes for extracted concepts', async () => {
        const llmResponse = 'This is a test file about [[AI]] and [[machine learning]].';
        jest.spyOn(llmUtils, 'callDeepSeekAPI').mockResolvedValue(llmResponse);

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Concepts') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'Concepts', children: [] });
                return folder;
            }
            return null;
        });

        await processFile(mockApp, settings, mockFile, mockReporter, { value: null });

        expect(mockApp.vault.create).toHaveBeenCalledWith('Concepts/AI.md', '# AI\n\n## Linked From\n- [[test]]');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Concepts/machine learning.md', '# machine learning\n\n## Linked From\n- [[test]]');
    });
});
