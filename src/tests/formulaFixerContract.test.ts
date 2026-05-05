import { TFile, TFolder } from 'obsidian';
import { batchFixFormulaFormatsInFolder, fixFormulaFormatsInFile } from '../formulaFixer';
import { mockApp } from './__mocks__/app';
import { ProgressReporter } from '../types';

const reporter: ProgressReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() {
        return false;
    },
    activeTasks: 0,
    updateActiveTasks: jest.fn(),
    abortController: new AbortController()
};

describe('formula fixer contract', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fixFormulaFormatsInFile returns a structured file result', async () => {
        const file = Object.assign(new (TFile as any)(), {
            path: 'Notes/Topic.md',
            basename: 'Topic',
            name: 'Topic.md',
            extension: 'md'
        });

        (mockApp.vault.read as jest.Mock).mockResolvedValue('$\nE = mc^2\n$');
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);

        const result = await fixFormulaFormatsInFile(mockApp, file, reporter);

        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic.md',
            modified: true,
            replacementCount: 2
        });
        expect(mockApp.vault.modify).toHaveBeenCalledWith(file, '$$\nE = mc^2\n$$');
    });

    test('batchFixFormulaFormatsInFolder returns structured batch results', async () => {
        const folder = Object.assign(new (TFolder as any)(), {
            path: 'Notes',
            name: 'Notes'
        });
        const fileA = Object.assign(new (TFile as any)(), {
            path: 'Notes/A.md',
            basename: 'A',
            name: 'A.md',
            extension: 'md'
        });
        const fileB = Object.assign(new (TFile as any)(), {
            path: 'Notes/B.txt',
            basename: 'B',
            name: 'B.txt',
            extension: 'txt'
        });

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Notes') {
                return folder;
            }
            return null;
        });
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([fileA, fileB]);
        (mockApp.vault.read as jest.Mock).mockImplementation((file: TFile) => {
            if (file.path === 'Notes/A.md') {
                return Promise.resolve('$\nvalue\n$');
            }
            return Promise.resolve('plain text');
        });
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);

        const result = await batchFixFormulaFormatsInFolder(mockApp, 'Notes', reporter);

        expect(result).toEqual({
            folderPath: 'Notes',
            processedFileCount: 2,
            modifiedCount: 1,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Notes/A.md',
                    outputPath: 'Notes/A.md',
                    modified: true,
                    replacementCount: 2
                },
                {
                    sourcePath: 'Notes/B.txt',
                    outputPath: 'Notes/B.txt',
                    modified: false,
                    replacementCount: 0
                }
            ],
            errors: []
        });
    });
});
