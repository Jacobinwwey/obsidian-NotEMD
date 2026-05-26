import * as fs from 'fs';
import * as path from 'path';
import { TFile } from 'obsidian';
import { buildLocalKnowledgeBaseRetriever } from '../localKnowledgeBase';
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
    }
];

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
            const details = retriever!.buildContextDetails(evaluationCase.query, {
                currentFilePath: evaluationCase.currentFilePath,
                topK: evaluationCase.topK,
                slidingWindowSize: evaluationCase.slidingWindowSize,
                maxSnippetChars: evaluationCase.maxSnippetChars
            });

            const recall = computeExpectedPathRecall(details.sourcePaths, evaluationCase.expectedSourcePaths);
            recalls.push(recall);

            expect(recall).toBeGreaterThanOrEqual(evaluationCase.minExpectedPathRecall);
            expect(details.returnedHitCount).toBeGreaterThanOrEqual(evaluationCase.minReturnedHitCount);
            expect(details.matchedSectionCount).toBeGreaterThanOrEqual(evaluationCase.minMatchedSectionCount ?? 0);
            expect(details.expandedSectionCount).toBeGreaterThanOrEqual(evaluationCase.minExpandedSectionCount ?? 0);
            expect(details.excludedCurrentFileHitCount).toBeGreaterThanOrEqual(
                evaluationCase.minExcludedCurrentFileHitCount ?? 0
            );
            expect(details.indexedFileCount).toBe(FIXTURE_FILES.length);
            expect(details.indexedSectionCount).toBeGreaterThanOrEqual(FIXTURE_FILES.length);
            expect(details.indexBuildMs).toBeGreaterThanOrEqual(0);
            expect(details.queryMs).toBeGreaterThanOrEqual(0);

            if (evaluationCase.expectContextAbsent) {
                expect(details.context).toBeNull();
                expect(details.contextCharCount).toBe(0);
            } else {
                expect(details.contextCharCount).toBeGreaterThan(0);
            }

            for (const expectedPath of evaluationCase.expectedSourcePaths) {
                expect(details.sourcePaths).toContain(expectedPath);
            }

            for (const expectedFragment of evaluationCase.expectedContextFragments || []) {
                expect(details.context).toContain(expectedFragment);
            }
        }

        const averageRecall = recalls.reduce((sum, value) => sum + value, 0) / recalls.length;
        expect(averageRecall).toBeGreaterThanOrEqual(0.95);
    });
});
