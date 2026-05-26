import { TFile } from 'obsidian';
import { buildLocalKnowledgeBaseRetriever } from '../localKnowledgeBase';
import { mockSettings } from './__mocks__/settings';
import { mockApp } from './__mocks__/app';

function createFile(path: string): TFile {
    const name = path.split('/').pop() || path;
    const extension = name.split('.').pop() || 'md';
    return Object.assign(new (TFile as any)(), {
        path,
        name,
        extension,
        basename: name.replace(/\.[^.]+$/, ''),
        parent: { path: path.split('/').slice(0, -1).join('/') || '/' }
    });
}

describe('localKnowledgeBase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('indexes configured local knowledge files and excludes the current file from results', async () => {
        const deepLearning = createFile('Knowledge/Deep Learning.md');
        const transformer = createFile('Knowledge/Transformers.md');
        const unrelated = createFile('Scratch/Loose.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([deepLearning, transformer, unrelated]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Knowledge/Deep Learning.md':
                    return '# Deep Learning\n## Attention\nAttention mechanisms support transformer architectures.';
                case 'Knowledge/Transformers.md':
                    return '# Transformers\n## Architecture\nTransformer attention replaced recurrent bottlenecks.';
                default:
                    return '# Loose\nNothing relevant here.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 140,
            localKnowledgeExcludeCurrentFile: true
        };

        const retriever = await buildLocalKnowledgeBaseRetriever(mockApp as any, settings);
        const details = retriever?.buildContextDetails('transformer attention', {
            currentFilePath: 'Knowledge/Transformers.md',
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });
        const context = details?.context;

        expect(retriever).not.toBeNull();
        expect(retriever?.indexedFileCount).toBe(2);
        expect(retriever?.indexedSectionCount).toBeGreaterThanOrEqual(2);
        expect(details?.matchedSectionCount).toBeGreaterThanOrEqual(1);
        expect(details?.returnedHitCount).toBe(1);
        expect(details?.expandedSectionCount).toBeGreaterThanOrEqual(1);
        expect(details?.requestedTopK).toBe(2);
        expect(details?.usedSlidingWindowSize).toBe(0);
        expect(details?.indexBuildMs).toBeGreaterThanOrEqual(0);
        expect(details?.queryMs).toBeGreaterThanOrEqual(0);
        expect(details?.contextCharCount).toBeGreaterThan(0);
        expect(details?.excludeCurrentFileApplied).toBe(true);
        expect(details?.excludedCurrentFileHitCount).toBeGreaterThanOrEqual(1);
        expect(details?.sourcePaths).toEqual(['Knowledge/Deep Learning.md']);
        expect(context).toContain('Knowledge/Deep Learning.md');
        expect(context).not.toContain('Knowledge/Transformers.md');
        expect(context).not.toContain('Scratch/Loose.md');
    });

    test('expands matched sections with adjacent context when sliding window is enabled', async () => {
        const architecture = createFile('Knowledge/Architecture.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([architecture]);
        (mockApp.vault.read as jest.Mock).mockResolvedValue(
            '# Diagram Platform\n' +
            'Platform overview.\n\n' +
            '## Retrieval\n' +
            'Sliding window retrieval keeps adjacent sections together.\n\n' +
            '## Evaluation\n' +
            'RAGPerf measures end-to-end latency and throughput.\n'
        );

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 1,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 400,
            localKnowledgeExcludeCurrentFile: false
        };

        const retriever = await buildLocalKnowledgeBaseRetriever(mockApp as any, settings);
        const details = retriever?.buildContextDetails('sliding window retrieval', {
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });
        const context = details?.context;

        expect(details?.returnedHitCount).toBe(1);
        expect(details?.expandedSectionCount).toBe(3);
        expect(details?.sourcePaths).toEqual(['Knowledge/Architecture.md']);
        expect(details?.usedSlidingWindowSize).toBe(1);
        expect(details?.indexBuildMs).toBeGreaterThanOrEqual(0);
        expect(details?.queryMs).toBeGreaterThanOrEqual(0);
        expect(details?.contextCharCount).toBe(context?.length ?? 0);
        expect(context).toContain('Platform overview.');
        expect(context).toContain('Sliding window retrieval keeps adjacent sections together.');
        expect(context).toContain('RAGPerf measures end-to-end latency and throughput.');
    });

    test('returns null when retrieval is enabled but no local knowledge paths are configured', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: ''
        };

        const retriever = await buildLocalKnowledgeBaseRetriever(mockApp as any, settings);

        expect(retriever).toBeNull();
    });

    test('uses task-specific knowledge paths when provided and supports exact file plus folder entries', async () => {
        const shared = createFile('Knowledge/Shared.md');
        const exact = createFile('Knowledge/Exact.md');
        const folderMatch = createFile('Knowledge/Scoped/Architecture.md');
        const excluded = createFile('Knowledge/Other.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([shared, exact, folderMatch, excluded]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Knowledge/Shared.md':
                    return '# Shared\nShared global knowledge.';
                case 'Knowledge/Exact.md':
                    return '# Exact\nExact file path knowledge.';
                case 'Knowledge/Scoped/Architecture.md':
                    return '# Architecture\nScoped folder knowledge.';
                default:
                    return '# Other\nOther knowledge.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge/Shared.md',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Exact.md\nKnowledge/Scoped',
            localKnowledgeTopK: 5,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 200
        } as any;

        const retriever = await (buildLocalKnowledgeBaseRetriever as any)(
            mockApp as any,
            settings,
            undefined,
            'generateTitle'
        );
        const details = retriever?.buildContextDetails('knowledge', {
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });

        expect(retriever).not.toBeNull();
        expect(retriever?.indexedFileCount).toBe(2);
        expect(details?.sourcePaths).toEqual(
            expect.arrayContaining(['Knowledge/Exact.md', 'Knowledge/Scoped/Architecture.md'])
        );
        expect(details?.sourcePaths).not.toContain('Knowledge/Shared.md');
        expect(details?.sourcePaths).not.toContain('Knowledge/Other.md');
    });

    test('falls back to default knowledge paths when task-specific override is blank', async () => {
        const shared = createFile('Knowledge/Shared.md');
        const scoped = createFile('Knowledge/Scoped/Architecture.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([shared, scoped]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Knowledge/Shared.md':
                    return '# Shared\nShared global knowledge.';
                default:
                    return '# Architecture\nScoped folder knowledge.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge/Shared.md',
            localKnowledgeGenerateTitlePaths: '',
            localKnowledgeTopK: 5,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 200
        } as any;

        const retriever = await (buildLocalKnowledgeBaseRetriever as any)(
            mockApp as any,
            settings,
            undefined,
            'generateTitle'
        );
        const details = retriever?.buildContextDetails('shared', {
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });

        expect(retriever).not.toBeNull();
        expect(retriever?.indexedFileCount).toBe(1);
        expect(details?.sourcePaths).toEqual(['Knowledge/Shared.md']);
    });
});
