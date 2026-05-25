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
        const context = retriever?.buildContext('transformer attention', {
            currentFilePath: 'Knowledge/Transformers.md',
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });

        expect(retriever).not.toBeNull();
        expect(retriever?.indexedFileCount).toBe(2);
        expect(retriever?.indexedSectionCount).toBeGreaterThanOrEqual(2);
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
        const context = retriever?.buildContext('sliding window retrieval', {
            topK: settings.localKnowledgeTopK,
            slidingWindowSize: settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: settings.localKnowledgeMaxSnippetChars
        });

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
});
