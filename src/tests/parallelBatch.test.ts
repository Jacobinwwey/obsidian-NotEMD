import { App, TFile, TFolder } from 'obsidian';
import { NotemdSettings, ProgressReporter } from '../types';
import { batchGenerateContentForTitles } from '../fileUtils';
import { DEFAULT_SETTINGS } from '../constants';
import { formatI18n, getI18nStrings } from '../i18n';
import { callLLM } from '../llmUtils';
import * as localKnowledgeBase from '../localKnowledgeBase';

// Mock dependencies
jest.mock('../llmUtils', () => ({
    callLLM: jest.fn().mockResolvedValue('processed content'),
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
        modify: jest.fn(),
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
                Object.assign(folder, { path: 'folder', name: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(files);
        (mockApp.vault.adapter.exists as jest.Mock).mockImplementation(async (path: string) => {
            if (path === 'folder_complete') return false;
            if (path === 'folder_complete/file1.md' || path === 'folder_complete/file2.md') return false;
            if (path === 'folder/file1.md' || path === 'folder/file2.md') return true;
            return false;
        });

        const result = await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        expect(mockProgressReporter.log).toHaveBeenCalledWith('Processing batch 1/1 (2 files)');
        expect(mockProgressReporter.updateActiveTasks).toHaveBeenCalledTimes(4); // 2 tasks, each call increments and decrements
        expect(result).toEqual(expect.objectContaining({
            sourceFolderPath: 'folder',
            completeFolderPath: 'folder_complete',
            completeFolderCreated: true,
            processedFileCount: 2,
            generatedCount: 2,
            movedCount: 2,
            cancelled: false,
            fileResults: expect.arrayContaining([
                expect.objectContaining({
                    sourcePath: 'folder/file1.md',
                    outputPath: 'folder/file1.md',
                    completeDestinationPath: 'folder_complete/file1.md',
                    movedToCompleteFolder: true,
                    modified: true
                })
            ]),
            errors: []
        }));
    });

    it('should process files serially when disabled', async () => {
        settings.enableBatchParallelism = false;
        settings.uiLocale = 'en';

        const files = [
            { path: 'folder/file1.md', name: 'file1.md' },
            { path: 'folder/file2.md', name: 'file2.md' },
        ] as TFile[];

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'folder') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'folder', name: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(files);
        (mockApp.vault.adapter.exists as jest.Mock).mockImplementation(async (path: string) => {
            if (path === 'folder_complete') return false;
            if (path === 'folder_complete/file1.md' || path === 'folder_complete/file2.md') return false;
            if (path === 'folder/file1.md' || path === 'folder/file2.md') return true;
            return false;
        });

        const result = await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        const i18n = getI18nStrings({ uiLocale: settings.uiLocale });
        const firstStepStatus = formatI18n(i18n.sidebar.status.stepLabel, {
            current: 1,
            total: 2,
            label: `${i18n.sidebar.actions.batchGenerateFromTitles.label}: file1.md`,
        });
        const secondStepStatus = formatI18n(i18n.sidebar.status.stepLabel, {
            current: 2,
            total: 2,
            label: `${i18n.sidebar.actions.batchGenerateFromTitles.label}: file2.md`,
        });

        expect(mockProgressReporter.updateStatus).toHaveBeenCalledWith(firstStepStatus, 0);
        expect(mockProgressReporter.updateStatus).toHaveBeenCalledWith(secondStepStatus, 50);
        expect(result).toEqual(expect.objectContaining({
            sourceFolderPath: 'folder',
            completeFolderPath: 'folder_complete',
            completeFolderCreated: true,
            processedFileCount: 2,
            generatedCount: 2,
            movedCount: 2,
            cancelled: false,
            fileResults: expect.arrayContaining([
                expect.objectContaining({
                    sourcePath: 'folder/file2.md',
                    outputPath: 'folder/file2.md',
                    completeDestinationPath: 'folder_complete/file2.md',
                    movedToCompleteFolder: true,
                    modified: true
                })
            ]),
            errors: []
        }));
    });

    it('should return a non-success batch result when no eligible files exist', async () => {
        settings.enableBatchParallelism = false;
        settings.uiLocale = 'en';

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'folder') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'folder', name: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([]);

        const result = await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        expect(result).toEqual({
            sourceFolderPath: 'folder',
            completeFolderPath: 'folder_complete',
            completeFolderCreated: false,
            processedFileCount: 0,
            generatedCount: 0,
            movedCount: 0,
            cancelled: false,
            fileResults: [],
            errors: []
        });
    });

    it('builds the batch-title local knowledge retriever once and propagates retrieval summaries into file results', async () => {
        settings.enableBatchParallelism = false;
        settings.enableLocalKnowledgeRetrieval = true;
        settings.enableLocalKnowledgeForBatchGenerateFromTitles = true;
        settings.localKnowledgeTopK = 2;
        settings.localKnowledgeSlidingWindowSize = 1;
        settings.localKnowledgeMaxSnippetChars = 160;

        const files = [
            { path: 'folder/file1.md', name: 'file1.md', basename: 'file1' },
            { path: 'folder/file2.md', name: 'file2.md', basename: 'file2' },
        ] as TFile[];

        const buildContextDetails = jest.fn((query: string) => ({
            query,
            context: `Path: Knowledge/${query}.md\nExcerpt: Local context for ${query}.`,
            indexedFileCount: 2,
            indexedSectionCount: 4,
            matchedSectionCount: 1,
            returnedHitCount: 1,
            expandedSectionCount: 1,
            sourcePaths: [`Knowledge/${query}.md`],
            usedSlidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            requestedTopK: settings.localKnowledgeTopK,
            indexBuildMs: 9,
            queryMs: 3,
            contextCharCount: 44,
            excludeCurrentFileApplied: true,
            excludedCurrentFileHitCount: 0,
            contextBlocks: []
        }));
        const buildRetrieverSpy = jest
            .spyOn(localKnowledgeBase, 'buildLocalKnowledgeBaseRetriever')
            .mockResolvedValue({
                indexedFileCount: 2,
                indexedSectionCount: 4,
                buildContextDetails
            } as any);

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'folder') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'folder', name: 'folder', children: [] });
                return folder;
            }
            return null;
        });
        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(files);
        (mockApp.vault.adapter.exists as jest.Mock).mockImplementation(async (path: string) => {
            if (path === 'folder_complete') return false;
            if (path === 'folder_complete/file1.md' || path === 'folder_complete/file2.md') return false;
            if (path === 'folder/file1.md' || path === 'folder/file2.md') return true;
            return false;
        });

        const result = await batchGenerateContentForTitles(mockApp, settings, 'folder', mockProgressReporter);

        expect(buildRetrieverSpy).toHaveBeenCalledWith(
            mockApp,
            settings,
            mockProgressReporter,
            'batchGenerateFromTitles'
        );
        expect(buildContextDetails).toHaveBeenCalledWith(
            'file1',
            expect.objectContaining({
                currentFilePath: 'folder/file1.md',
                topK: settings.localKnowledgeTopK,
                slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
                maxSnippetChars: settings.localKnowledgeMaxSnippetChars
            })
        );
        expect(buildContextDetails).toHaveBeenCalledWith(
            'file2',
            expect.objectContaining({
                currentFilePath: 'folder/file2.md'
            })
        );
        expect(callLLM).toHaveBeenCalledWith(
            expect.anything(),
            '',
            expect.stringContaining('Local context for file1.'),
            settings,
            mockProgressReporter,
            expect.any(String)
        );
        expect(result).toEqual(expect.objectContaining({
            generatedCount: 2,
            movedCount: 2,
            fileResults: expect.arrayContaining([
                expect.objectContaining({
                    sourcePath: 'folder/file1.md',
                    title: 'file1',
                    localKnowledgeContextUsed: true,
                    localKnowledgeRetrieval: expect.objectContaining({
                        indexedFileCount: 2,
                        indexedSectionCount: 4,
                        matchedSectionCount: 1,
                        returnedHitCount: 1,
                        sourcePaths: ['Knowledge/file1.md'],
                        indexBuildMs: 9,
                        queryMs: 3,
                        contextCharCount: 44
                    })
                }),
                expect.objectContaining({
                    sourcePath: 'folder/file2.md',
                    title: 'file2',
                    localKnowledgeContextUsed: true,
                    localKnowledgeRetrieval: expect.objectContaining({
                        sourcePaths: ['Knowledge/file2.md']
                    })
                })
            ])
        }));

        buildRetrieverSpy.mockRestore();
    });
});
