import * as fs from 'fs';
import * as path from 'path';
import { TFile } from 'obsidian';
import { buildLocalKnowledgeBaseRetriever, inspectLocalKnowledgeRetrieval } from '../localKnowledgeBase';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');

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

type MaintainerOperationHelp = Record<string, {
    summary: string;
    required: string[];
    optional: string[];
    exampleInput?: string;
    additionalExamples?: string[];
}>;

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
        path: 'Knowledge/Projects/Batch Title Drafting.md',
        markdown: [
            '# Batch Title Drafting',
            'Batch title generation should retrieve local project notes when drafts depend on saved vault knowledge.',
            '',
            '## Source Selection',
            'Cross-folder local knowledge scopes let maintainers combine project folders with pinned architecture references for title-based generation.',
            '',
            '## Stability',
            'The task should keep existing output behavior when no relevant local knowledge context is returned.'
        ].join('\n')
    },
    {
        path: 'Knowledge/Research/RAG Evaluation Notes.md',
        markdown: [
            '# RAG Evaluation Notes',
            'Stage-C retrieval quality should be judged through real note and query diversity, not only feature-existence checks.',
            '',
            '## Quality Signals',
            'Evaluation should track recall proxy, precision pressure, noisy corpus behavior, latency telemetry, and explainability for task-scoped local knowledge retrieval.',
            '',
            '## Constraints',
            'The shipped retriever remains local-only, server-free, cloud-free, and GPU-free while using the plugin runtime.'
        ].join('\n')
    },
    {
        path: 'References/Architecture/Local KB Task Contracts.md',
        markdown: [
            '# Local KB Task Contracts',
            'Task-scoped retrieval contracts should stay explicit for generate-title, batch-title, research, and diagram lanes.',
            '',
            '## Cross Folder Inputs',
            'A single task can inspect mixed knowledge paths across project folders and reference folders without mutating saved settings.',
            '',
            '## Diagnostics',
            'Maintainer inspect output should expose effective paths, query diagnostics, source paths, context blocks, and retrieval timing.'
        ].join('\n')
    },
    {
        path: 'References/Architecture/Navigation Index.md',
        markdown: [
            '# Navigation Index',
            'This file is intentionally generic. It should not be enough by itself to prove healthy retrieval for a navigation-like source basename.'
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
    },
    {
        path: 'Docs/index.zh-CN.md',
        markdown: [
            '# Index',
            'Navigation hub for the docs vault.',
            '',
            '## Local Knowledge',
            'The index points to local knowledge task contracts but is still a low-signal source name.'
        ].join('\n')
    },
    {
        path: 'brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md',
        markdown: [
            '# Mainline Progress Audit',
            'This roadmap note tracks the next-level direction for current main.',
            '',
            '## Local KB',
            'Real-note query diversity beyond the chapter-split showcase matters because Stage-C should prove broader docs-vault retrieval quality.',
            '',
            '## Direction',
            'Maintainers can combine brainstorm and maintainer folders as cross-folder knowledge paths for batch-title and research inspection.'
        ].join('\n')
    },
    {
        path: 'brainstorms/2026-05-29-stage-c-quality-follow-through.md',
        markdown: [
            '# Stage-C Quality Follow-Through',
            'This note extends the mainline progress audit with more retrieval-specific detail.',
            '',
            '## Diversity',
            'Real-note query diversity beyond the chapter-split showcase should remain part of the Stage-C proof surface.',
            '',
            '## Batch Titles',
            'Batch title inspection against brainstorm notes should still find cross-folder operator guidance after current-file exclusion removes the source note itself.'
        ].join('\n')
    },
    {
        path: 'maintainer/CLI Surface.md',
        markdown: [
            '# CLI Surface',
            'Maintainer guidance for bounded automation surfaces.',
            '',
            '## Retrieval',
            'Task-scoped retrieval behavior, query diagnostics, and effective path resolution remain maintainer-only inspect concerns.',
            '',
            '## Chapter Split',
            'Chapter split TOC managed artifacts and guarded reruns should stay diagnosable from the maintainer docs surface.'
        ].join('\n')
    },
    {
        path: 'chapter-split-toc.md',
        markdown: [
            '# Chapter Split + TOC Extraction',
            'Release-facing chapter split showcase documentation.',
            '',
            '## Managed Artifacts',
            'Chapter split TOC managed artifacts expose deterministic front matter and stable block refs.',
            '',
            '## Guarded Reruns',
            'Guarded reruns keep manually edited chapter artifacts from being silently overwritten.'
        ].join('\n')
    },
    {
        path: 'chapter-split-toc.zh-CN.md',
        markdown: [
            '# 章节拆分 + TOC 提取',
            '中文的 chapter split showcase 文档。',
            '',
            '## Managed Artifacts',
            '章节拆分会生成 TOC、manifest 与章节文件，并保持 deterministic metadata。',
            '',
            '## Guarded Reruns',
            'guarded reruns 不会静默覆盖手动改过的生成产物。'
        ].join('\n')
    },
    {
        path: 'superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md',
        markdown: [
            '# Diagram Rendering Platform Roadmap',
            'Superpowers planning notes for diagram rendering.',
            '',
            '## Diagram Platform',
            'The roadmap reinforces diagram platform retrieval, packaging truth, and rendering architecture decisions.',
            '',
            '## Runtime Truth',
            'Sliding window retrieval and runtime truth belong together when maintainers inspect diagram-generation context.'
        ].join('\n')
    },
    {
        path: 'index.zh-CN.md',
        markdown: [
            '# Index',
            'Docs vault navigation hub at the root path.',
            '',
            '## Local Knowledge',
            'The root index note is still a low-signal navigation source, so inspect should expose a caution while retrieval stays healthy.'
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
    },
    {
        id: 'cross-folder-task-contracts',
        query: 'task scoped retrieval contracts mixed knowledge paths query diagnostics timing',
        configuredKnowledgePaths: 'Knowledge/Projects\nReferences/Architecture',
        expectedSourcePaths: ['References/Architecture/Local KB Task Contracts.md'],
        topK: 2,
        slidingWindowSize: 1,
        maxSnippetChars: 700,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        minExpandedSectionCount: 2,
        expectedContextFragments: [
            'Task-scoped retrieval contracts should stay explicit',
            'mixed knowledge paths across project folders and reference folders',
            'Maintainer inspect output should expose effective paths'
        ]
    },
    {
        id: 'real-note-rag-quality-evaluation',
        query: 'real note query diversity recall proxy precision latency telemetry explainability',
        configuredKnowledgePaths: 'Knowledge/Research\nKnowledge/Showcase',
        expectedSourcePaths: ['Knowledge/Research/RAG Evaluation Notes.md'],
        topK: 1,
        slidingWindowSize: 1,
        maxSnippetChars: 640,
        minExpectedPathRecall: 1,
        minReturnedHitCount: 1,
        minMatchedSectionCount: 1,
        minExpandedSectionCount: 2,
        expectedContextFragments: [
            'real note and query diversity',
            'recall proxy, precision pressure, noisy corpus behavior, latency telemetry',
            'local-only, server-free, cloud-free, and GPU-free'
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

        expect(documentationSurfaces.some(documentation => documentation.includes('real-note/query diversity beyond the chapter-split showcase')))
            .toBe(true);
        expect(documentationSurfaces.some(documentation => documentation.includes('chapter-split showcase 之外的真实 note/query 多样性')))
            .toBe(true);
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

    test('inspect keeps cross-folder real-note task scopes explicit without mutating saved settings', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'Knowledge/Showcase',
            localKnowledgeBatchGenerateFromTitlesPaths: 'Knowledge/Projects',
            localKnowledgeTopK: 3,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 260,
            localKnowledgeExcludeCurrentFile: true,
            enableLocalKnowledgeForBatchGenerateFromTitles: true
        };

        const inspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'batchGenerateFromTitles',
                sourcePath: 'Roadmaps/Local KB Task Contracts.md',
                knowledgePaths: [
                    'Knowledge/Projects',
                    'References/Architecture',
                    'Knowledge/Showcase/Provider Model Discovery.md'
                ]
            }
        );

        expect(inspect.effectivePathSource).toBe('override');
        expect(inspect.queryDerivation).toBe('basename');
        expect(inspect.queryDiagnostics).toEqual({
            derivedBasename: 'Local KB Task Contracts',
            strippedSourceCharsUsed: 0,
            cautions: []
        });
        expect(inspect.effectiveConfiguredPaths).toEqual([
            'Knowledge/Projects',
            'References/Architecture',
            'Knowledge/Showcase/Provider Model Discovery.md'
        ]);
        expect(inspect.candidateFilePaths).toEqual([
            'Knowledge/Showcase/Provider Model Discovery.md',
            'Knowledge/Projects/Batch Title Drafting.md',
            'References/Architecture/Local KB Task Contracts.md',
            'References/Architecture/Navigation Index.md'
        ]);
        expect(inspect.retrieverBuildStatus).toBe('ready');
        expect(inspect.retrieval.sourcePaths).toContain('References/Architecture/Local KB Task Contracts.md');
        expect(inspect.context).toContain('Task-scoped retrieval contracts should stay explicit');
    });

    test('inspect surfaces navigation-source cautions while preserving retrieval diagnostics', async () => {
        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            localKnowledgeBasePaths: 'References/Architecture\nKnowledge/Research',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 0,
            localKnowledgeMaxSnippetChars: 220,
            localKnowledgeExcludeCurrentFile: true,
            enableLocalKnowledgeForBatchGenerateFromTitles: true,
            enableLocalKnowledgeForDiagramGeneration: true
        };

        const basenameInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'batchGenerateFromTitles',
                sourcePath: 'Docs/index.zh-CN.md'
            }
        );
        const diagramInspect = await inspectLocalKnowledgeRetrieval(
            mockApp as any,
            settings,
            {
                taskScope: 'diagramGeneration',
                sourcePath: 'Docs/index.zh-CN.md'
            }
        );

        expect(basenameInspect.query).toBe('index.zh-CN');
        expect(basenameInspect.queryDiagnostics).toEqual({
            derivedBasename: 'index.zh-CN',
            strippedSourceCharsUsed: 0,
            cautions: ['generic-navigation-basename']
        });
        expect(basenameInspect.retrieverBuildStatus).toBe('ready');
        expect(basenameInspect.candidateFilePaths).toEqual([
            'Knowledge/Research/RAG Evaluation Notes.md',
            'References/Architecture/Local KB Task Contracts.md',
            'References/Architecture/Navigation Index.md'
        ]);

        expect(diagramInspect.query).toContain('index.zh-CN');
        expect(diagramInspect.query).toContain('The index points to local knowledge task contracts');
        expect(diagramInspect.queryDiagnostics).toEqual({
            derivedBasename: 'index.zh-CN',
            strippedSourceCharsUsed: expect.any(Number),
            cautions: ['diagram-source-built-from-navigation-like-note']
        });
        expect(diagramInspect.queryDiagnostics.strippedSourceCharsUsed).toBeGreaterThan(0);
        expect(diagramInspect.retrieverBuildStatus).toBe('ready');
        expect(diagramInspect.retrieval.sourcePaths).toContain('References/Architecture/Local KB Task Contracts.md');
    });

    test('shared maintainer local-knowledge examples stay healthy against the runtime inspect fixture', async () => {
        const help = OPERATION_HELP as MaintainerOperationHelp;
        const examples = [
            help['local-knowledge.inspect'].exampleInput,
            ...(help['local-knowledge.inspect'].additionalExamples || [])
        ].filter((value): value is string => Boolean(value));

        const settings = {
            ...mockSettings,
            enableLocalKnowledgeRetrieval: true,
            enableLocalKnowledgeForGenerateTitle: true,
            enableLocalKnowledgeForBatchGenerateFromTitles: true,
            enableLocalKnowledgeForResearchSummarize: true,
            enableLocalKnowledgeForDiagramGeneration: true,
            localKnowledgeBasePaths: 'Knowledge',
            localKnowledgeGenerateTitlePaths: 'Knowledge/Scoped',
            localKnowledgeBatchGenerateFromTitlesPaths: 'Knowledge/Projects',
            localKnowledgeResearchSummarizePaths: 'Knowledge/Scoped',
            localKnowledgeDiagramGenerationPaths: 'Knowledge/Diagram Platform.md\nKnowledge/Scoped',
            localKnowledgeTopK: 2,
            localKnowledgeSlidingWindowSize: 1,
            localKnowledgeMaxSnippetChars: 220,
            localKnowledgeExcludeCurrentFile: true
        };

        const results = await Promise.all(
            examples.map((exampleInput) =>
                inspectLocalKnowledgeRetrieval(
                    mockApp as any,
                    settings,
                    JSON.parse(exampleInput)
                )
            )
        );

        expect(results).toHaveLength(examples.length);

        const [
            minimalDiagram,
            batchIndex,
            researchScoped,
            chapterSplitShowcase,
            researchCrossFolder,
            batchCrossFolder,
            diagramCrossFolder
        ] = results;

        expect(minimalDiagram.queryDerivation).toBe('diagram-source');
        expect(minimalDiagram.retrieverBuildStatus).toBe('ready');
        expect(minimalDiagram.retrieval.returnedHitCount).toBeGreaterThanOrEqual(1);
        expect(minimalDiagram.retrieval.sourcePaths).toEqual(
            expect.arrayContaining([
                'maintainer/CLI Surface.md',
                'superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md'
            ])
        );

        expect(batchIndex.queryDerivation).toBe('basename');
        expect(batchIndex.queryDiagnostics.cautions).toContain('generic-navigation-basename');
        expect(batchIndex.retrieverBuildStatus).toBe('ready');

        expect(researchScoped.queryDerivation).toBe('explicit');
        expect(researchScoped.retrieval.sourcePaths).toEqual(['maintainer/CLI Surface.md']);

        expect(chapterSplitShowcase.queryDerivation).toBe('explicit');
        expect(chapterSplitShowcase.retrieval.sourcePaths).toEqual(
            expect.arrayContaining(['chapter-split-toc.md', 'chapter-split-toc.zh-CN.md'])
        );
        expect(chapterSplitShowcase.retrieval.returnedHitCount).toBeGreaterThanOrEqual(1);

        expect(researchCrossFolder.queryDerivation).toBe('explicit');
        expect(researchCrossFolder.effectivePathSource).toBe('override');
        expect(researchCrossFolder.effectiveConfiguredPaths).toEqual(['brainstorms', 'maintainer']);
        expect(researchCrossFolder.retrieverBuildStatus).toBe('ready');
        expect(researchCrossFolder.retrieval.returnedHitCount).toBeGreaterThanOrEqual(1);
        expect(researchCrossFolder.retrieval.sourcePaths).toEqual(
            expect.arrayContaining(['brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md'])
        );
        expect(researchCrossFolder.candidateFilePaths).toEqual(
            expect.arrayContaining([
                'brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md',
                'brainstorms/2026-05-29-stage-c-quality-follow-through.md',
                'maintainer/CLI Surface.md'
            ])
        );

        expect(batchCrossFolder.queryDerivation).toBe('basename');
        expect(batchCrossFolder.effectivePathSource).toBe('override');
        expect(batchCrossFolder.effectiveConfiguredPaths).toEqual(['brainstorms', 'maintainer']);
        expect(batchCrossFolder.retrieverBuildStatus).toBe('ready');
        expect(batchCrossFolder.retrieval.returnedHitCount).toBeGreaterThanOrEqual(1);
        expect(batchCrossFolder.retrieval.sourcePaths).toEqual(
            expect.arrayContaining(['brainstorms/2026-05-29-stage-c-quality-follow-through.md'])
        );
        expect(batchCrossFolder.candidateFilePaths).toEqual(
            expect.arrayContaining([
                'brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md',
                'brainstorms/2026-05-29-stage-c-quality-follow-through.md',
                'maintainer/CLI Surface.md'
            ])
        );

        expect(diagramCrossFolder.queryDerivation).toBe('diagram-source');
        expect(diagramCrossFolder.effectivePathSource).toBe('override');
        expect(diagramCrossFolder.effectiveConfiguredPaths).toEqual(['brainstorms', 'maintainer']);
        expect(diagramCrossFolder.queryDiagnostics.cautions).toContain('diagram-source-built-from-navigation-like-note');
        expect(diagramCrossFolder.retrieverBuildStatus).toBe('ready');
        expect(diagramCrossFolder.retrieval.returnedHitCount).toBeGreaterThanOrEqual(1);
        expect(diagramCrossFolder.retrieval.sourcePaths).toEqual(
            expect.arrayContaining(['maintainer/CLI Surface.md'])
        );
        expect(diagramCrossFolder.candidateFilePaths).toEqual(
            expect.arrayContaining([
                'brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md',
                'brainstorms/2026-05-29-stage-c-quality-follow-through.md',
                'maintainer/CLI Surface.md'
            ])
        );
    });
});
