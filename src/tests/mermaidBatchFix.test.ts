import { batchFixMermaidSyntaxInFolder } from '../fileUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import { TFolder, TFile } from 'obsidian';
import mermaid from 'mermaid';

// Mock mermaid
jest.mock('mermaid', () => ({
    __esModule: true,
    default: {
        parse: jest.fn()
    }
}));

describe('batchFixMermaidSyntaxInFolder', () => {
    let mockReporter: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReporter = {
            log: jest.fn(),
            updateStatus: jest.fn(),
            cancelled: false
        };
        // Reset mermaid.parse behavior
        (mermaid.parse as jest.Mock).mockImplementation(async (text) => {
            if (text.includes('Invalid')) {
                throw new Error('Parse error');
            }
            return true;
        });
    });

    test('should skip processing if Mermaid is valid', async () => {
        const folderPath = 'TestFolder';
        const fileContent = "```mermaid\ngraph TD\nA-->B;\n```";
        
        // Mock Vault
        const mockFile = {
            path: 'TestFolder/valid.md',
            name: 'valid.md',
            basename: 'valid',
            extension: 'md',
            parent: { path: 'TestFolder' }
        } as unknown as TFile;

        const mockFolder = new TFolder();
        (mockFolder as any).path = folderPath;
        mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(mockFolder);

        mockApp.vault.getMarkdownFiles = jest.fn().mockReturnValue([mockFile]);
        mockApp.vault.read = jest.fn().mockResolvedValue(fileContent);
        mockApp.vault.modify = jest.fn();

        await batchFixMermaidSyntaxInFolder(mockApp, mockSettings, folderPath, mockReporter);

        // Expect validateContent to have been called (implied by execution flow)
        // Expect NO modification because it's valid
        expect(mockApp.vault.modify).not.toHaveBeenCalled();
        expect(mockReporter.log).toHaveBeenCalledWith(expect.stringContaining('No Mermaid errors'));
    });

    test('should process file if Mermaid is invalid', async () => {
        const folderPath = 'TestFolder';
        const fileContent = "```mermaid\ngraph TD\nA-->Invalid;\n```"; // "Invalid" triggers mock error
        const fixedContent = "```mermaid\ngraph TD\nA-->Invalid;\n```"; // dummy content

        // Invalid: ```mermaid ( ... unclosed
        const invalidButFixable = "```mermaid\ngraph TD\nA-->B\n"; // Missing closer
        
        // Mock mermaid to fail on this
        (mermaid.parse as jest.Mock).mockImplementation(async (text) => {
            if (text.includes('A-->B')) { // Fails on this specific text
                throw new Error('Unclosed block');
            }
            return true;
        });

        const mockFile = {
            path: 'TestFolder/invalid.md',
            name: 'invalid.md',
            basename: 'invalid',
            extension: 'md',
            parent: { path: 'TestFolder' }
        } as unknown as TFile;

        const mockFolder = new TFolder();
        (mockFolder as any).path = folderPath;
        mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(mockFolder);

        mockApp.vault.getMarkdownFiles = jest.fn().mockReturnValue([mockFile]);
        mockApp.vault.read = jest.fn().mockResolvedValue(invalidButFixable);
        mockApp.vault.modify = jest.fn();

        await batchFixMermaidSyntaxInFolder(mockApp, mockSettings, folderPath, mockReporter);

        // It should have detected error -> called fixMermaidSyntaxInFile -> called modify
        expect(mockApp.vault.modify).toHaveBeenCalled();
        expect(mockReporter.log).toHaveBeenCalledWith(expect.stringContaining('Detected 1 Mermaid errors'));
    });
});
