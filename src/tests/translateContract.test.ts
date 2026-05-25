import { Notice, TFile, TFolder } from 'obsidian';
import * as llmUtils from '../llmUtils';
import { batchTranslateFolder, translateFile } from '../translate';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
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

describe('translate contract', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('translateFile returns a structured result and leaves success notice to the host layer', async () => {
        const file = {
            path: 'Notes/Topic.md',
            basename: 'Topic',
            name: 'Topic.md',
            parent: { path: 'Notes' }
        } as TFile;
        const settings = {
            ...mockSettings,
            useCustomTranslationSavePath: true,
            translationSavePath: 'Translations'
        };

        (mockApp.vault.read as jest.Mock).mockResolvedValue('Reference content');
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Translations') {
                return null;
            }
            if (path === 'Translations/Topic_en.md') {
                return null;
            }
            return null;
        });
        (mockApp.vault.createFolder as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('Translated content');

        const result = await translateFile(mockApp, settings, file, 'en', reporter, false);

        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            targetLanguage: 'en',
            requestedOutputFolderPath: 'Translations',
            outputFolderPath: 'Translations',
            outputFolderCreated: true,
            usedFallbackOutputFolder: false,
            outputPath: 'Translations/Topic_en.md',
            created: true,
            overwritten: false,
            openedInWorkspace: false,
            chunkCount: 1
        });
        expect(mockApp.vault.createFolder).toHaveBeenCalledWith('Translations');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Translations/Topic_en.md', 'Translated content');
        expect(Notice).not.toHaveBeenCalled();
    });

    test('batchTranslateFolder returns structured batch results and leaves notices to the host layer', async () => {
        const file = Object.assign(new (TFile as any)(), {
            path: 'Notes/Topic.md',
            basename: 'Topic',
            name: 'Topic.md',
            extension: 'md',
            parent: { path: 'Notes' }
        });
        const nestedFile = Object.assign(new (TFile as any)(), {
            path: 'Notes/Sub/Nested.md',
            basename: 'Nested',
            name: 'Nested.md',
            extension: 'md',
            parent: { path: 'Notes/Sub' }
        });
        const folder = Object.assign(new (TFolder as any)(), {
            path: 'Notes',
            name: 'Notes',
            children: [file, nestedFile]
        });

        (mockApp.vault.read as jest.Mock).mockResolvedValue('Reference content');
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([file, nestedFile]);
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Notes/Topic_en.md') {
                return null;
            }
            if (path === 'Notes/Nested_en.md') {
                return null;
            }
            return null;
        });
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('Translated content');

        const result = await batchTranslateFolder(mockApp, mockSettings, folder, 'en', { reporter });

        expect(result).toEqual({
            folderPath: 'Notes',
            requestedOutputFolderPath: 'Notes',
            outputFolderPath: 'Notes',
            outputFolderCreated: false,
            targetLanguage: 'en',
            processedFileCount: 1,
            translatedCount: 1,
            cancelled: false,
            fileResults: [
                {
                    sourcePath: 'Notes/Topic.md',
                    targetLanguage: 'en',
                    requestedOutputFolderPath: 'Notes',
                    outputFolderPath: 'Notes',
                    outputFolderCreated: false,
                    usedFallbackOutputFolder: false,
                    outputPath: 'Notes/Topic_en.md',
                    created: true,
                    overwritten: false,
                    openedInWorkspace: false,
                    chunkCount: 1
                }
            ],
            errors: []
        });
        expect(Notice).not.toHaveBeenCalled();
    });

    test('batchTranslateFolder can include subfolders when explicitly configured', async () => {
        const file = Object.assign(new (TFile as any)(), {
            path: 'Notes/Topic.md',
            basename: 'Topic',
            name: 'Topic.md',
            extension: 'md',
            parent: { path: 'Notes' }
        });
        const nestedFile = Object.assign(new (TFile as any)(), {
            path: 'Notes/Sub/Nested.md',
            basename: 'Nested',
            name: 'Nested.md',
            extension: 'md',
            parent: { path: 'Notes/Sub' }
        });
        const folder = Object.assign(new (TFolder as any)(), {
            path: 'Notes',
            name: 'Notes',
            children: [file, nestedFile]
        });
        const settings = {
            ...mockSettings,
            folderTaskIncludeSubfoldersMode: 'include' as const
        };

        (mockApp.vault.read as jest.Mock).mockResolvedValue('Reference content');
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([file, nestedFile]);
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Notes/Topic_en.md' || path === 'Notes/Sub/Nested_en.md') {
                return null;
            }
            return null;
        });
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('Translated content');

        const result = await batchTranslateFolder(mockApp, settings, folder, 'en', { reporter });

        expect(result.processedFileCount).toBe(2);
        expect(result.translatedCount).toBe(2);
        expect(result.fileResults.map(item => item.sourcePath)).toEqual([
            'Notes/Topic.md',
            'Notes/Sub/Nested.md'
        ]);
    });
});
