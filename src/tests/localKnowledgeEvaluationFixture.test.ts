import * as fs from 'fs';
import * as path from 'path';
import { TFile } from 'obsidian';
import { buildLocalKnowledgeBaseRetriever, inspectLocalKnowledgeRetrieval } from '../localKnowledgeBase';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

interface FixtureFile {
    path: string;
    markdown: string;
}

interface EvaluationCase {
    id: string;
    query: string;
    expectedSourcePaths: string[];
    configuredKnowledgePaths?: string;
    currentFilePath?: string;
    topK: number;
    slidingWindowSize: number;
    maxSnippetChars: number;
    minExpectedPathRecall: number;
    minReturnedHitCount: number;
    minMatchedSectionCount?: number;
    minExpandedSectionCount?: number;
    minExcludedCurrentFileHitCount?: number;
    expectContextAbsent?: boolean;
    expectEllipsis?: boolean;
    expectedContextFragments?: string[];
}

const FIXTURE_FILES: FixtureFile[] = [
    {
        path: 'Knowledge/Deep Learning.md',
        markdown: [
            '# Deep Learning',
            'Foundation overview for modern neural networks.',
            '',
            '## Attention',
            'Attention mechanisms help transformer models focus on relevant tokens.',
            '',
            '## Training',
            'Gradient descent and scaling laws shape model quality.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Transformers.md',
        markdown: [
            '# Transformers',
            'Transformers replaced many recurrent bottlenecks.',
            '',
            '## Architecture',
            'Transformer blocks rely on attention, feed-forward layers, and residual paths.',
            '',
            '## Deployment',
            'Inference deployment requires batching, caching, and latency control.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Diagram Platform.md',
        markdown: [
            '# Diagram Platform',
            'The rendering platform has multiple layers.',
            '',
            '## Retrieval',
            'Sliding window retrieval keeps adjacent sections together for diagram generation.',
            '',
            '## Evaluation',
            'RAGPerf measures end-to-end latency and throughput for retrieval systems.',
            '',
            '## Packaging',
            'Single-entry packaging keeps runtime truth narrow and auditable.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Scoped/CLI Surface.md',
        markdown: [
            '# CLI Surface',
            'Repo-local maintainer automation stays intentionally bounded.',
            '',
            '## Inspect',
            'The local-knowledge.inspect helper exposes effective path resolution, candidate file paths, raw formatted context, and query derivation for maintainers debugging task-scoped retrieval behavior.',
            '',
            '## Safety',
            'This introspection surface must not be overclaimed as a public CLI contract.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Exact.md',
        markdown: [
            '# Exact',
            'Exact file path knowledge.',
            '',
            '## Match',
            'Exact file path knowledge is useful when maintainers want to compare folder scopes against one explicitly pinned note.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Noisy/Runtime Boundaries.md',
        markdown: [
            '# Runtime Boundaries',
            'Mixed corpus retrieval should stay focused when override paths contain duplicates, extra whitespace, and file/folder entries together.',
            '',
            '## Noise Control',
            'Noisy vaults can include attachments, blank searchable notes, and unrelated folders without changing task-scoped local knowledge retrieval.',
            '',
            '## Evidence',
            'The bounded offline fixture proves local knowledge quality with duplicate override paths, non-Markdown distractions, and empty-section candidates.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Noisy/Blank.md',
        markdown: [
            '```ts',
            'const hidden = true;',
            '```'
        ].join('\n')
    },
    {
        path: 'Knowledge/Noisy/Attachment.pdf',
        markdown: 'This attachment-like file must not be indexed by local knowledge retrieval.'
    },
    {
        path: 'Knowledge/Showcase/Chapter Split TOC.md',
        markdown: [
            '---',
            'title: Chapter Split TOC Showcase',
            '---',
            '# Chapter Split + TOC',
            'Release-facing documentation should stay searchable as a realistic local knowledge source, not only as synthetic maintainer prose.',
            '',
            '## Managed Artifacts',
            'Chapter split writes chapter files, a TOC file, and a manifest near the source note so automation can inspect the complete managed artifact set.',
            '',
            '## Guarded Reruns',
            'Guarded reruns refuse to overwrite manually edited managed artifacts and keep stale generated files scoped to the recorded manifest.',
            '',
            '## Stable TOC Targets',
            'Repeated nested headings receive stable block refs, so TOC targets remain deterministic across reruns and showcase docs.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Showcase/Provider Model Discovery.md',
        markdown: [
            '# Provider Model Discovery',
            'Provider model discovery belongs to a separate maintenance lane and should not satisfy chapter split retrieval queries.'
        ].join('\n')
    },
    {
        path: 'Archive/Noisy/Runtime Boundaries.md',
        markdown: [
            '# Runtime Boundaries',
            'This unrelated folder should not appear when the knowledge path is scoped to Knowledge/Noisy.'
        ].join('\n')
    },
    {
        path: 'Docs/Diagram Platform.md',
        markdown: [
            '# Diagram Platform',
            'This source note asks for a diagram about retrieval architecture.',
            '',
            '## Retrieval',
            'Sliding window retrieval and runtime truth should both appear in the derived query.'
        ].join('\n')
    }
];

const KNOWLEDGE_FIXTURE_FILE_COUNT = FIXTURE_FILES.filter(file => file.path.startsWith('Knowledge/')).length;

const EVALUATION_CASES: EvaluationCase[] = [
    {
        id: 'cross-file-attention',
        query: 'transformer attention',
        currentFilePath: 'Knowledge/Transformers.md',
        expectedSourcePaths: ['Knowledge/Deep Learning.md'],
        topK: 2,
        slidingWindowSize: 0,
        maxSnippetChars: 220,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        expectedContextFragments: ['Attention mechanisms help transformer models focus on relevant tokens.']
    },
    {
        id: 'sliding-window-adjacency',
        query: 'sliding window retrieval',
        expectedSourcePaths: ['Knowledge/Diagram Platform.md'],
        topK: 1,
        slidingWindowSize: 1,
        maxSnippetChars: 500,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minExpandedSectionCount: 3,
        expectedContextFragments: [
            'The rendering platform has multiple layers.',
            'Sliding window retrieval keeps adjacent sections together for diagram generation.',
            'RAGPerf measures end-to-end latency and throughput for retrieval systems.'
        ]
    },
    {
        id: 'packaging-truth',
        query: 'single-entry packaging runtime truth',
        expectedSourcePaths: ['Knowledge/Diagram Platform.md'],
        topK: 1,
        slidingWindowSize: 0,
        maxSnippetChars: 240,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        expectedContextFragments: ['Single-entry packaging keeps runtime truth narrow and auditable.']
    },
    {
        id: 'prefix-query-retrieval',
        query: 'retriev',
        expectedSourcePaths: ['Knowledge/Diagram Platform.md'],
        topK: 1,
        slidingWindowSize: 0,
        maxSnippetChars: 240,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        expectedContextFragments: ['Sliding window retrieval keeps adjacent sections together for diagram generation.']
    },
    {
        id: 'exclude-current-file-only-hit',
        query: 'feed-forward residual batching caching',
        currentFilePath: 'Knowledge/Transformers.md',
        expectedSourcePaths: [],
        topK: 2,
        slidingWindowSize: 0,
        maxSnippetChars: 220,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 0,
        minMatchedSectionCount: 1,
        minExcludedCurrentFileHitCount: 1,
        expectContextAbsent: true
    },
    {
        id: 'inspect-helper-bounded-surface',
        query: 'effective path resolution query derivation candidate file paths',
        expectedSourcePaths: ['Knowledge/Scoped/CLI Surface.md'],
        topK: 1,
        slidingWindowSize: 0,
        maxSnippetChars: 80,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        expectEllipsis: true,
        expectedContextFragments: ['CLI Surface']
    },
    {
        id: 'task-scoped-batch-file-match',
        query: 'exact file path knowledge',
        configuredKnowledgePaths: 'Knowledge/Exact.md\nKnowledge/Scoped',
        expectedSourcePaths: ['Knowledge/Exact.md'],
        topK: 1,
        slidingWindowSize: 0,
        maxSnippetChars: 220,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        expectedContextFragments: ['Exact file path knowledge.']
    },
    {
        id: 'task-scoped-research-breadcrumb-match',
        query: 'task-scoped retrieval behavior',
        configuredKnowledgePaths: 'Knowledge/Scoped',
        expectedSourcePaths: ['Knowledge/Scoped/CLI Surface.md'],
        topK: 1,
        slidingWindowSize: 0,
        maxSnippetChars: 220,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        expectedContextFragments: ['task-scoped retrieval behavior']
    },
    {
        id: 'noisy-mixed-corpus-override-scope',
        query: 'duplicate override non-Markdown distractions empty-section candidates',
        configuredKnowledgePaths: ' Knowledge/Noisy \nKnowledge/Noisy/Runtime Boundaries.md\nknowledge/noisy\n',
        expectedSourcePaths: ['Knowledge/Noisy/Runtime Boundaries.md'],
        topK: 2,
        slidingWindowSize: 1,
        maxSnippetChars: 460,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        minExpandedSectionCount: 2,
        expectedContextFragments: [
            'Mixed corpus retrieval should stay focused when override paths contain duplicates',
            'non-Markdown distractions',
            'empty-section candidates'
        ]
    },
    {
        id: 'real-note-chapter-split-showcase',
        query: 'chapter split TOC front matter managed artifact block refs guarded reruns showcase docs',
        configuredKnowledgePaths: 'Knowledge/Showcase\nKnowledge/Scoped',
        expectedSourcePaths: ['Knowledge/Showcase/Chapter Split TOC.md'],
        topK: 1,
        slidingWindowSize: 1,
        maxSnippetChars: 620,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        minExpandedSectionCount: 2,
        expectedContextFragments: [
            'complete managed artifact set',
            'Guarded reruns refuse to overwrite manually edited managed artifacts',
            'stable block refs'
        ]
    }
];

function createFile(pathValue: string): TFile {
    const name = pathValue.split('/').pop() || pathValue;
    const extension = name.split('.').pop() || 'md';
    return Object.assign(new (TFile as any)(), {
        path: pathValue,
        name,
        extension,
        basename: name.replace(/\.[^.]+$/, ''),
        parent: { path: pathValue.split('/').slice(0, -1).join('/') || '/' }
    });
}

function configureFixtureVault(): void {
    const files = FIXTURE_FILES.map(file => createFile(file.path));
    const markdownByPath = new Map(FIXTURE_FILES.map(file => [file.path, file.markdown]));

    (mockApp.vault.getFiles as jest.Mock).mockReturnValue(files);
    (mockApp.vault.read as jest.Mock).mockImplementation(async (file: TFile) => {
        return markdownByPath.get(file.path) || '# Missing\n';
    });
}

function computeExpectedPathRecall(actualPaths: string[], expectedPaths: string[]): number {
    if (expectedPaths.length === 0) {
        return 1;
    }

    const actual = new Set(actualPaths);
    const matched = expectedPaths.filter(expectedPath => actual.has(expectedPath)).length;
    return matched / expectedPaths.length;
}

describe('local knowledge offline evaluation fixture', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const capabilityMatrixPath = path.join(repoRoot, 'docs', 'maintainer', 'notemd-cli-capability-matrix.md');
    const capabilityMatrixZhPath = path.join(repoRoot, 'docs', 'maintainer', 'notemd-cli-capability-matrix.zh-CN.md');
    const postRecoveryAuditPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-25-post-bounded-recovery-audit-and-next-level-direction.md'
    );
    const postRecoveryAuditZhPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-25-post-bounded-recovery-audit-and-next-level-direction.zh-CN.md'
    );
    const unifiedMatrixPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-20-unified-follow-through-matrix.md'
    );
    const unifiedMatrixZhPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-20-unified-follow-through-matrix.zh-CN.md'
    );

    beforeEach(() => {
        jest.clearAllMocks();
        configureFixtureVault();
    });

    test('registers a dedicated offline verification entrypoint and documents it', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const documentationSurfaces = [
            capabilityMatrixPath,
            capabilityMatrixZhPath,
            postRecoveryAuditPath,
            postRecoveryAuditZhPath,
            unifiedMatrixPath,
            unifiedMatrixZhPath
        ].map(filePath => fs.readFileSync(filePath, 'utf8'));

        expect(packageJson.scripts['verify:local-kb-fixtures'])
            .toBe('jest --runInBand src/tests/localKnowledgeEvaluationFixture.test.ts');

        for (const documentation of documentationSurfaces) {
            expect(documentation).toContain('verify:local-kb-fixtures');
        }
    });

    test('keeps the offline fixture cases above minimum retrieval thresholds', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeTopK: 3,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 500,
            localKnowledgeExcludeCurrentFile: true
        };

        const retriever = await buildLocalKnowledgeBaseRetriever(mockApp as any, settings);
        expect(retriever).not.toBeNull();

        const recalls: number[] = [];

        for (const evaluationCase of EVALUATION_CASES) {
            const retrieverSettings = {
                ...settings,
                ...(evaluationCase.configuredKnowledgePaths
                    ? { localKnowledgeBasePaths: evaluationCase.configuredKnowledgePaths }
                    : {})
            };
            const scopedRetriever = await buildLocalKnowledgeBaseRetriever(mockApp as any, retrieverSettings);
            expect(scopedRetriever).not.toBeNull();
            const details = retriever!.buildContextDetails(evaluationCase.query, {
                currentFilePath: evaluationCase.currentFilePath,
                topK: evaluationCase.topK,
                slidingWindowSize: evaluationCase.slidingWindowSize,
                maxSnippetChars: evaluationCase.maxSnippetChars
            });
            const effectiveDetails = evaluationCase.configuredKnowledgePaths
                ? scopedRetriever!.buildContextDetails(evaluationCase.query, {
                    currentFilePath: evaluationCase.currentFilePath,
                    topK: evaluationCase.topK,
                    slidingWindowSize: evaluationCase.slidingWindowSize,
                    maxSnippetChars: evaluationCase.maxSnippetChars
                })
                : details;

            const recall = computeExpectedPathRecall(effectiveDetails.sourcePaths, evaluationCase.expectedSourcePaths);
            recalls.push(recall);

            expect(recall).toBeGreaterThanOrEqual(evaluationCase.minExpectedPathRecall);
            expect(effectiveDetails.returnedHitCount).toBeGreaterThanOrEqual(evaluationCase.minReturnedHitCount);
            expect(effectiveDetails.matchedSectionCount).toBeGreaterThanOrEqual(evaluationCase.minMatchedSectionCount ?? 0);
            expect(effectiveDetails.expandedSectionCount).toBeGreaterThanOrEqual(evaluationCase.minExpandedSectionCount ?? 0);
            expect(effectiveDetails.excludedCurrentFileHitCount).toBeGreaterThanOrEqual(
                evaluationCase.minExcludedCurrentFileHitCount ?? 0
            );
            expect(effectiveDetails.indexedFileCount).toBeGreaterThanOrEqual(1);
            expect(effectiveDetails.indexedSectionCount).toBeGreaterThanOrEqual(1);
            expect(effectiveDetails.indexBuildMs).toBeGreaterThanOrEqual(0);
            expect(effectiveDetails.queryMs).toBeGreaterThanOrEqual(0);

            if (evaluationCase.expectContextAbsent) {
                expect(effectiveDetails.context).toBeNull();
                expect(effectiveDetails.contextCharCount).toBe(0);
                expect(effectiveDetails.contextBlocks).toEqual([]);
            } else {
                expect(effectiveDetails.contextCharCount).toBeGreaterThan(0);
                expect(effectiveDetails.contextBlocks.length).toBeGreaterThan(0);
            }

            if (evaluationCase.expectEllipsis) {
                expect(effectiveDetails.context).toContain('…');
                expect(effectiveDetails.contextBlocks.some(block => block.excerptWasTruncated)).toBe(true);
            }

            for (const expectedPath of evaluationCase.expectedSourcePaths) {
                expect(effectiveDetails.sourcePaths).toContain(expectedPath);
            }

            for (const expectedFragment of evaluationCase.expectedContextFragments || []) {
                expect(effectiveDetails.context).toContain(expectedFragment);
            }
        }

        const averageRecall = recalls.reduce((sum, value) => sum + value, 0) / recalls.length;
        expect(averageRecall).toBeGreaterThanOrEqual(0.95);
    });

    test('keeps the maintainer inspect seam aligned with mixed file-folder path scopes and derived diagram queries', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Transformers.md\nKnowledge/Scoped',
            localKnowledgeDiagramGenerationPaths: 'Knowledge/Diagram Platform.md\nKnowledge/Scoped',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 180,
            localKnowledgeExcludeCurrentFile: true,
            enableLocalKnowledgeForGenerateTitle: true,
            enableLocalKnowledgeForDiagramGeneration: true
        };

        const titleInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/CLI Surface.md'
            }
        );
        const diagramInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'diagramGeneration',
                sourcePath: 'Docs/Diagram Platform.md'
            }
        );

        expect(titleInspect.effectivePathSource).toBe('task-specific');
        expect(titleInspect.queryDerivation).toBe('basename');
        expect(titleInspect.queryDiagnostics).toEqual({
            derivedBasename: 'CLI Surface',
            strippedSourceCharsUsed: 0,
            cautions: []
        });
        expect(titleInspect.query).toBe('CLI Surface');
        expect(titleInspect.candidateFilePaths).toEqual([
            'Knowledge/Transformers.md',
            'Knowledge/Scoped/CLI Surface.md'
        ]);
        expect(titleInspect.retrieverBuildStatus).toBe('ready');
        expect(titleInspect.retrieval.sourcePaths).toContain('Knowledge/Scoped/CLI Surface.md');

        expect(diagramInspect.effectivePathSource).toBe('task-specific');
        expect(diagramInspect.queryDerivation).toBe('diagram-source');
        expect(diagramInspect.queryDiagnostics).toEqual(expect.objectContaining({
            derivedBasename: 'Diagram Platform',
            cautions: []
        }));
        expect(diagramInspect.queryDiagnostics.strippedSourceCharsUsed).toBeGreaterThan(0);
        expect(diagramInspect.queryDiagnostics.strippedSourceCharsUsed).toBeLessThanOrEqual(1200);
        expect(diagramInspect.query).toContain('Diagram Platform');
        expect(diagramInspect.query).toContain('Sliding window retrieval and runtime truth should both appear in the derived query.');
        expect(diagramInspect.candidateFilePaths).toEqual([
            'Knowledge/Diagram Platform.md',
            'Knowledge/Scoped/CLI Surface.md'
        ]);
        expect(diagramInspect.retrieverBuildStatus).toBe('ready');
        expect(diagramInspect.retrieval.sourcePaths).toContain('Knowledge/Diagram Platform.md');
    });

    test('inspect supports temporary knowledge-path override arrays for maintainer-side task tuning', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge/Transformers.md',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Transformers.md',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 160,
            localKnowledgeExcludeCurrentFile: true,
            enableLocalKnowledgeForGenerateTitle: true
        };

        const inspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'generateTitle',
                sourcePath: 'Docs/CLI Surface.md',
                knowledgePaths: ['Knowledge/Scoped', 'Knowledge/Scoped']
            }
        );

        expect(inspect.effectivePathSource).toBe('override');
        expect(inspect.effectiveConfiguredPaths).toEqual(['Knowledge/Scoped']);
        expect(inspect.candidateFilePaths).toEqual(['Knowledge/Scoped/CLI Surface.md']);
        expect(inspect.retrieval.sourcePaths).toEqual(['Knowledge/Scoped/CLI Surface.md']);
    });

    test('inspect keeps batch-title and research task scopes explicit through basename and explicit query derivation', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge/Exact.md\nKnowledge/Scoped',
            localKnowledgeBatchGenerateFromTitlesPaths: 'Knowledge/Exact.md\nKnowledge/Scoped',
            localKnowledgeResearchSummarizePaths: 'Knowledge/Scoped',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 180,
            localKnowledgeExcludeCurrentFile: true,
            enableLocalKnowledgeForBatchGenerateFromTitles: true,
            enableLocalKnowledgeForResearchSummarize: true
        };

        const batchInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'batchGenerateFromTitles',
                sourcePath: 'Docs/CLI Surface.md'
            }
        );
        const researchInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'researchSummarize',
                query: 'task-scoped retrieval behavior'
            }
        );

        expect(batchInspect.taskScope).toBe('batchGenerateFromTitles');
        expect(batchInspect.queryDerivation).toBe('basename');
        expect(batchInspect.queryDiagnostics).toEqual({
            derivedBasename: 'CLI Surface',
            strippedSourceCharsUsed: 0,
            cautions: []
        });
        expect(batchInspect.query).toBe('CLI Surface');
        expect(batchInspect.effectivePathSource).toBe('task-specific');
        expect(batchInspect.candidateFilePaths).toEqual(expect.arrayContaining([
            'Knowledge/Exact.md',
            'Knowledge/Scoped/CLI Surface.md'
        ]));
        expect(batchInspect.candidateFilePaths).toHaveLength(2);
        expect(batchInspect.retrieval.sourcePaths).toContain('Knowledge/Scoped/CLI Surface.md');

        expect(researchInspect.taskScope).toBe('researchSummarize');
        expect(researchInspect.queryDerivation).toBe('explicit');
        expect(researchInspect.queryDiagnostics).toEqual({
            derivedBasename: null,
            strippedSourceCharsUsed: 0,
            cautions: []
        });
        expect(researchInspect.query).toBe('task-scoped retrieval behavior');
        expect(researchInspect.effectivePathSource).toBe('task-specific');
        expect(researchInspect.candidateFilePaths).toEqual(['Knowledge/Scoped/CLI Surface.md']);
        expect(researchInspect.retrieval.sourcePaths).toEqual(['Knowledge/Scoped/CLI Surface.md']);
    });

    test('inspect failure states remain explainable through retrieverBuildStatus without widening behavior', async () => {
        const noPathsResult = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            {
                ...mockSettings,
                enableLocalKnowledgeRetrieval: true,
                enableLocalKnowledgeForResearchSummarize: true,
                localKnowledgeBasePaths: '',
                localKnowledgeResearchSummarizePaths: ''
            } as any,
            {
                taskScope: 'researchSummarize',
                query: 'missing path coverage'
            }
        );

        expect(noPathsResult.retrieverBuildStatus).toBe('no-paths');
        expect(noPathsResult.retrieverCreated).toBe(false);
        expect(noPathsResult.candidateFilePaths).toEqual([]);
        expect(noPathsResult.context).toBeNull();
        expect(noPathsResult.retrieval.returnedHitCount).toBe(0);
    });
});
