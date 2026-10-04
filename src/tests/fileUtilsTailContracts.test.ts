import { TFile, TFolder } from 'obsidian';
import { batchFixMermaidSyntaxInFolder, checkAndRemoveDuplicateConceptNotes } from '../fileUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

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

describe('fileUtils tail contracts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('batch mermaid fix returns structured no-file result for an empty folder', async () => {
        const reporter = createReporter();
        const folder = Object.assign(new (TFolder as any)(), {
            path: 'Concepts',
            name: 'Concepts'
        });

        mockApp.vault.getAbstractFileByPath = jest.fn((path: string) => path === 'Concepts' ? folder : null);
        mockApp.vault.getMarkdownFiles = jest.fn(() => []);

        const result = await batchFixMermaidSyntaxInFolder(mockApp, mockSettings, 'Concepts', reporter);

        expect(result).toEqual({
            folderPath: 'Concepts',
            processedFileCount: 0,
            modifiedCount: 0,
            movedErrorFileCount: 0,
            remainingErrorFileCount: 0,
            reportPath: '',
            reportCreated: false,
            cancelled: false,
            fileResults: [],
            errors: []
        });
    });

    test('duplicate cleanup returns structured cancelled result when deletion is declined', async () => {
        const reporter = createReporter();
        const conceptFolder = Object.assign(new (TFolder as any)(), {
            path: 'Concepts',
            name: 'Concepts'
        });
        const conceptNote = Object.assign(new (TFile as any)(), {
            path: 'Concepts/Alpha.md',
            basename: 'Alpha',
            name: 'Alpha.md'
        });
        const normalNote = Object.assign(new (TFile as any)(), {
            path: 'Notes/Alpha.md',
            basename: 'Alpha',
            name: 'Alpha.md'
        });

        mockApp.vault.getAbstractFileByPath = jest.fn((path: string) => {
            if (path === 'Concepts') return conceptFolder;
            return null;
        });
        mockApp.vault.getMarkdownFiles = jest.fn(() => [conceptNote, normalNote]);
        mockApp.vault.trash = jest.fn().mockResolvedValue(undefined);

        const result = await checkAndRemoveDuplicateConceptNotes(
            mockApp,
            mockSettings,
            reporter,
            {
                confirmDeletion: jest.fn().mockResolvedValue(false)
            }
        );

        expect(result).toEqual(expect.objectContaining({
            conceptFolderPath: 'Concepts',
            candidateCount: 1,
            deletionRequested: true,
            deletionConfirmed: false,
            removedCount: 0,
            cancelled: true,
            candidates: [
                expect.objectContaining({
                    path: 'Concepts/Alpha.md',
                    reason: 'Exact Match'
                })
            ]
        }));
        expect(mockApp.vault.trash).not.toHaveBeenCalled();
        expect(mockApp.fileManager.trashFile).not.toHaveBeenCalled();
    });
    test('confirmed duplicate deletion respects the Vault trash preference through FileManager', async () => {
        const folder = Object.assign(new (TFolder as any)(), { path: 'Concepts', name: 'Concepts' });
        const duplicate = Object.assign(new (TFile as any)(), { path: 'Concepts/Alpha.md', basename: 'Alpha', name: 'Alpha.md' });
        const note = Object.assign(new (TFile as any)(), { path: 'Notes/Alpha.md', basename: 'Alpha', name: 'Alpha.md' });
        mockApp.vault.getAbstractFileByPath = jest.fn(path => path === 'Concepts' ? folder : path === duplicate.path ? duplicate : null);
        mockApp.vault.getMarkdownFiles = jest.fn(() => [duplicate, note]);
        const result = await checkAndRemoveDuplicateConceptNotes(mockApp, mockSettings, createReporter(), { confirmDeletion: jest.fn().mockResolvedValue(true) });
        expect(mockApp.fileManager.trashFile).toHaveBeenCalledWith(duplicate);
        expect(mockApp.vault.trash).not.toHaveBeenCalled();
        expect(result.removedCount).toBe(1);
    });
});
