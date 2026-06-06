import { TFile } from 'obsidian';
import { buildLocalKnowledgeBaseRetriever, inspectLocalKnowledgeRetrieval } from '../localKnowledgeBase';
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

    test('inspects task-scoped retrieval with derived basename query and effective path metadata even when settings are disabled', async () => {
        const source = createFile('Docs/Architecture.md');
        const exact = createFile('Knowledge/Exact.md');
        const scoped = createFile('Knowledge/Scoped/Architecture.md');
        const excluded = createFile('Knowledge/Other.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, exact, scoped, excluded]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/Architecture.md':
                    return '# Architecture\nSource note title only.';
                case 'Knowledge/Exact.md':
                    return '# Exact\nExact file path knowledge.';
                case 'Knowledge/Scoped/Architecture.md':
                    return '# Architecture\nScoped folder architecture knowledge.';
                default:
                    return '# Other\nOther knowledge.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: false,
            enableLocalKnowledgeForGenerateTitle: false,
            localKnowledgeBasePaths: 'Knowledge/Shared.md',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Exact.md\nKnowledge/Scoped',
            localKnowledgeTopK: 4,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 220,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/Architecture.md'
            }
        );

        expect(result.globalEnabled).toBe(false);
        expect(result.taskEnabled).toBe(false);
        expect(result.effectivePathSource).toBe('task-specific');
        expect(result.effectiveConfiguredPaths).toEqual(['Knowledge/Exact.md', 'Knowledge/Scoped']);
        expect(result.query).toBe('Architecture');
        expect(result.queryDerivation).toBe('basename');
        expect(result.queryDiagnostics).toEqual({
            derivedBasename: 'Architecture',
            strippedSourceCharsUsed: 0,
            cautions: []
        });
        expect(result.sourcePath).toBe('Docs/Architecture.md');
        expect(result.currentFilePath).toBe('Docs/Architecture.md');
        expect(result.retrievalOptions).toEqual({
            topK: 4,
            slidingWindowSize: 1,
            maxSnippetChars: 220,
            excludeCurrentFile: true
        });
        expect(result.retrieverBuildStatus).toBe('ready');
        expect(result.retrieverCreated).toBe(true);
        expect(result.candidateFilePaths).toEqual(['Knowledge/Exact.md', 'Knowledge/Scoped/Architecture.md']);
        expect(result.retrieval.sourcePaths).toContain('Knowledge/Scoped/Architecture.md');
        expect(result.contextBlocks).toHaveLength(1);
        expect(result.contextBlocks[0]).toEqual(expect.objectContaining({
            index: 1,
            path: 'Knowledge/Scoped/Architecture.md',
            heading: 'Architecture',
            breadcrumb: 'Architecture',
            excerptWasTruncated: false
        }));
        expect(result.context).toContain('Knowledge/Scoped/Architecture.md');
        expect(result.context).not.toContain('Knowledge/Other.md');
    });

    test('inspect supports temporary knowledge-path overrides without mutating task settings', async () => {
        const source = createFile('Docs/Architecture.md');
        const defaultKnowledge = createFile('Knowledge/Default.md');
        const scoped = createFile('Knowledge/Scoped/Architecture.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, defaultKnowledge, scoped]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/Architecture.md':
                    return '# Architecture\nSource note title only.';
                case 'Knowledge/Default.md':
                    return '# Default\nDefault knowledge only.';
                default:
                    return '# Architecture\nScoped folder architecture knowledge.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForGenerateTitle: true,
            localKnowledgeBasePaths: 'Knowledge/Default.md',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Default.md',
            localKnowledgeTopK: 4,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 220,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/Architecture.md',
                knowledgePaths: ['Knowledge/Scoped', ' Knowledge/Scoped ']
            }
        );

        expect(result.effectivePathSource).toBe('override');
        expect(result.effectiveConfiguredPaths).toEqual(['Knowledge/Scoped']);
        expect(result.candidateFilePaths).toEqual(['Knowledge/Scoped/Architecture.md']);
        expect(result.retrieval.sourcePaths).toEqual(['Knowledge/Scoped/Architecture.md']);
        expect(result.context).toContain('Knowledge/Scoped/Architecture.md');
        expect(result.context).not.toContain('Knowledge/Default.md');
    });

    test('inspects diagram retrieval with derived source-markdown query when query is omitted', async () => {
        const source = createFile('Docs/Diagram Platform.md');
        const knowledge = createFile('Knowledge/Diagram Platform.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, knowledge]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/Diagram Platform.md':
                    return '# Diagram Platform\n## Retrieval\nSliding window retrieval keeps adjacent sections together.';
                default:
                    return '# Diagram Platform\n## Packaging\nSingle-entry packaging keeps runtime truth narrow.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForDiagramGeneration: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 1,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 260,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'diagramGeneration',
                sourcePath: 'Docs/Diagram Platform.md'
            }
        );

        expect(result.taskScope).toBe('diagramGeneration');
        expect(result.queryDerivation).toBe('diagram-source');
        expect(result.queryDiagnostics).toEqual(expect.objectContaining({
            derivedBasename: 'Diagram Platform',
            cautions: []
        }));
        expect(result.queryDiagnostics.strippedSourceCharsUsed).toBeGreaterThan(0);
        expect(result.queryDiagnostics.strippedSourceCharsUsed).toBeLessThanOrEqual(1200);
        expect(result.query).toContain('Diagram Platform');
        expect(result.query).toContain('Sliding window retrieval keeps adjacent sections together.');
        expect(result.sourcePath).toBe('Docs/Diagram Platform.md');
        expect(result.currentFilePath).toBe('Docs/Diagram Platform.md');
        expect(result.candidateFilePaths).toEqual(['Knowledge/Diagram Platform.md']);
        expect(result.retrieverBuildStatus).toBe('ready');
        expect(result.contextBlocks).toHaveLength(1);
        expect(result.contextBlocks[0]).toEqual(expect.objectContaining({
            index: 1,
            path: 'Knowledge/Diagram Platform.md',
            heading: 'Diagram Platform',
            breadcrumb: 'Diagram Platform'
        }));
    });

    test('inspect exposes structured blocks that reflect truncation and headings', async () => {
        const knowledge = createFile('Knowledge/Architecture.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([knowledge]);
        (mockApp.vault.read as jest.Mock).mockResolvedValue(
            '# Diagram Platform\n'
            + 'Platform overview.\n\n'
            + '## Retrieval\n'
            + 'Sliding window retrieval keeps adjacent sections together with enough detail to force snippet truncation.'
        );

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForResearchSummarize: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 1,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 40,
            localKnowledgeExcludeCurrentFile: false
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'researchSummarize',
                query: 'sliding window retrieval'
            }
        );

        expect(result.contextBlocks).toHaveLength(1);
        expect(result.contextBlocks[0]).toEqual(expect.objectContaining({
            index: 1,
            path: 'Knowledge/Architecture.md',
            heading: 'Retrieval',
            breadcrumb: 'Diagram Platform > Retrieval',
            excerptWasTruncated: true
        }));
        expect(result.contextBlocks[0].excerptCharCount).toBeLessThanOrEqual(40);
        expect(result.contextBlocks[0].excerpt).toContain('…');
        expect(result.context).toContain('Heading: Retrieval');
    });

    test('inspect reports no-paths status with empty retrieval details when no effective knowledge paths are configured', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForResearchSummarize: true,
            localKnowledgeBasePaths: '',
            localKnowledgeResearchSummarizePaths: '',
            localKnowledgeTopK: 3,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 120,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'researchSummarize',
                query: 'missing path coverage'
            }
        );

        expect(result.retrieverBuildStatus).toBe('no-paths');
        expect(result.retrieverCreated).toBe(false);
        expect(result.effectivePathSource).toBe('default');
        expect(result.effectiveConfiguredPaths).toEqual([]);
        expect(result.candidateFilePaths).toEqual([]);
        expect(result.context).toBeNull();
        expect(result.contextBlocks).toEqual([]);
        expect(result.retrieval).toEqual(expect.objectContaining({
            query: 'missing path coverage',
            indexedFileCount: 0,
            indexedSectionCount: 0,
            matchedSectionCount: 0,
            returnedHitCount: 0,
            expandedSectionCount: 0,
            sourcePaths: [],
            context: null,
            contextBlocks: [],
            contextCharCount: 0,
            excludeCurrentFileApplied: false,
            excludedCurrentFileHitCount: 0
        }));
    });

    test('inspect marks low-signal navigation basenames in query diagnostics without changing the derived basename query', async () => {
        const source = createFile('Docs/index.zh-CN.md');
        const knowledge = createFile('Knowledge/Indexing.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, knowledge]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/index.zh-CN.md':
                    return '# Index\nNavigation note.';
                default:
                    return '# Indexing\nIndexing notes.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForBatchGenerateFromTitles: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeBatchGenerateFromTitlesPaths: 'Knowledge',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 160,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'batchGenerateFromTitles',
                sourcePath: 'Docs/index.zh-CN.md'
            }
        );

        expect(result.query).toBe('index.zh-CN');
        expect(result.queryDerivation).toBe('basename');
        expect(result.queryDiagnostics).toEqual({
            derivedBasename: 'index.zh-CN',
            strippedSourceCharsUsed: 0,
            cautions: ['generic-navigation-basename']
        });
    });

    test('inspect marks navigation-like diagram sources in query diagnostics', async () => {
        const source = createFile('Docs/index.zh-CN.md');
        const knowledge = createFile('Knowledge/Roadmap.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, knowledge]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/index.zh-CN.md':
                    return '# Index\n## Roadmap\nThis note links to roadmap and release workflow pages.';
                default:
                    return '# Roadmap\nRelease workflow and roadmap notes.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForDiagramGeneration: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 1,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 180,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'diagramGeneration',
                sourcePath: 'Docs/index.zh-CN.md'
            }
        );

        expect(result.queryDerivation).toBe('diagram-source');
        expect(result.query).toContain('index.zh-CN');
        expect(result.queryDiagnostics).toEqual(expect.objectContaining({
            derivedBasename: 'index.zh-CN',
            cautions: ['diagram-source-built-from-navigation-like-note']
        }));
        expect(result.queryDiagnostics.strippedSourceCharsUsed).toBeGreaterThan(0);
        expect(result.queryDiagnostics.strippedSourceCharsUsed).toBeLessThanOrEqual(1200);
    });

    test('inspect reports no-candidate-files status when effective paths resolve but no eligible files match', async () => {
        const source = createFile('Docs/Architecture.md');
        const unrelated = createFile('Elsewhere/Other.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, unrelated]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/Architecture.md':
                    return '# Architecture\nSource note title only.';
                default:
                    return '# Other\nOther knowledge.';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForGenerateTitle: true,
            localKnowledgeBasePaths: 'Knowledge/Missing',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Missing',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 140,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/Architecture.md'
            }
        );

        expect(result.query).toBe('Architecture');
        expect(result.queryDerivation).toBe('basename');
        expect(result.retrieverBuildStatus).toBe('no-candidate-files');
        expect(result.retrieverCreated).toBe(false);
        expect(result.effectiveConfiguredPaths).toEqual(['Knowledge/Missing']);
        expect(result.candidateFilePaths).toEqual([]);
        expect(result.retrieval).toEqual(expect.objectContaining({
            query: 'Architecture',
            indexedFileCount: 0,
            indexedSectionCount: 0,
            matchedSectionCount: 0,
            returnedHitCount: 0,
            sourcePaths: [],
            context: null
        }));
    });

    test('inspect reports no-retrievable-sections status when candidate files exist but all searchable content is empty', async () => {
        const source = createFile('Docs/Architecture.md');
        const blankKnowledge = createFile('Knowledge/Blank.md');

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([source, blankKnowledge]);
        (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
            switch (file.path) {
                case 'Docs/Architecture.md':
                    return '# Architecture\nSource note title only.';
                default:
                    return '```ts\nconst hidden = true;\n```\n';
            }
        });

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForGenerateTitle: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeGenerateTitlePaths: 'Knowledge',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 140,
            localKnowledgeExcludeCurrentFile: true
        } as any;

        const result = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/Architecture.md'
            }
        );

        expect(result.retrieverBuildStatus).toBe('no-retrievable-sections');
        expect(result.retrieverCreated).toBe(false);
        expect(result.candidateFilePaths).toEqual(['Knowledge/Blank.md']);
        expect(result.retrieval).toEqual(expect.objectContaining({
            query: 'Architecture',
            indexedFileCount: 1,
            indexedSectionCount: 0,
            matchedSectionCount: 0,
            returnedHitCount: 0,
            sourcePaths: [],
            context: null
        }));
    });
});
