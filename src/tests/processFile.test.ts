import { TFile, TFolder } from 'obsidian';
import { processFile } from '../fileUtils';
import { NotemdSettings, ProgressReporter } from '../types';
import * as llmUtils from '../llmUtils';
import { mockApp, mockVault } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

// Mock Progress Reporter
const mockReporter: ProgressReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() { return false; }
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

        mockVault.read.mockResolvedValue('This is a test file about AI and machine learning.');
    });

    it('should process a file and save the processed file', async () => {
        const llmResponse = 'This is a test file about [[AI]] and [[machine learning]].';
        jest.spyOn(llmUtils, 'callDeepSeekAPI').mockResolvedValue(llmResponse);

        await processFile(mockApp, settings, mockFile, mockReporter, { value: null });

        expect(mockVault.read).toHaveBeenCalledWith(mockFile);
        expect(llmUtils.callDeepSeekAPI).toHaveBeenCalled();
        expect(mockVault.create).toHaveBeenCalledWith('test_processed.md', llmResponse);
    });

    it('should create concept notes for extracted concepts', async () => {
        const llmResponse = 'This is a test file about [[AI]] and [[machine learning]].';
        jest.spyOn(llmUtils, 'callDeepSeekAPI').mockResolvedValue(llmResponse);

        mockVault.getAbstractFileByPath.mockImplementation((path) => {
            if (path === 'Concepts') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'Concepts', children: [] });
                return folder;
            }
            return null;
        });

        await processFile(mockApp, settings, mockFile, mockReporter, { value: null });

        expect(mockVault.create).toHaveBeenCalledWith('Concepts/AI.md', '# AI');
        expect(mockVault.create).toHaveBeenCalledWith('Concepts/machine learning.md', '# machine learning');
    });
});
