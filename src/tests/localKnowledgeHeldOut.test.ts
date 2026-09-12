import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import { App, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';
import { buildLocalKnowledgeBaseRetriever } from '../localKnowledgeBase';

interface Corpus {
    schemaVersion: number;
    provenance: string;
    defaultPaths: string;
    files: Array<{ path: string; markdown: string }>;
    queries: Array<{ id: string; query: string; relevantPaths: string[]; family: string; currentFilePath?: string }>;
}

function percentiles(samples: number[]) {
    const sorted = [...samples].sort((a, b) => a - b);
    return { p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1] };
}

test('evaluates the frozen held-out corpus without turning quality judgments into passing assertions', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'fixtures/local-knowledge-held-out.json'), 'utf8');
    const corpus = JSON.parse(source) as Corpus;
    const notes = corpus.files.map(note => ({ ...note, file: Object.assign(new TFile(), {
        path: note.path, basename: path.posix.basename(note.path, '.md'), extension: 'md'
    }) }));
    let enumerationMs = 0;
    let readMs = 0;
    const app = { vault: {
        getFiles: () => { const start = performance.now(); const files = notes.map(note => note.file); enumerationMs += performance.now() - start; return files; },
        read: async (file: TFile) => { const start = performance.now(); const text = notes.find(note => note.file === file)!.markdown; readMs += performance.now() - start; return text; }
    } } as unknown as App;
    const settings = { ...DEFAULT_SETTINGS, enableLocalKnowledgeRetrieval: true,
        localKnowledgeBasePaths: corpus.defaultPaths, localKnowledgeExcludeCurrentFile: true };
    const buildTimes = [];
    const heapBefore = process.memoryUsage().heapUsed;
    let retriever;
    for (let sample = 0; sample < 20; sample++) {
        const start = performance.now();
        retriever = await buildLocalKnowledgeBaseRetriever(app, settings);
        buildTimes.push(performance.now() - start);
    }
    expect(retriever).not.toBeNull();
    const cases = [];
    for (const topK of [1, 3]) {
        for (const query of corpus.queries) {
            const times = [];
            let details;
            for (let sample = 0; sample < 20; sample++) {
                const start = performance.now();
                details = retriever!.buildContextDetails(query.query, { topK, slidingWindowSize: 0,
                    maxSnippetChars: 450, currentFilePath: query.currentFilePath });
                times.push(performance.now() - start);
            }
            const selected = details!.sourcePaths;
            const relevantCount = selected.filter(file => query.relevantPaths.includes(file)).length;
            expect(selected).not.toContain('Private/Unselected.md');
            if (query.currentFilePath) expect(selected).not.toContain(query.currentFilePath);
            expect(details!.returnedHitCount).toBeLessThanOrEqual(topK);
            expect(details!.contextBlocks.every(block => block.excerptCharCount <= 450)).toBe(true);
            cases.push({ id: query.id, family: query.family, topK, relevantPaths: query.relevantPaths,
                sourcePaths: selected, sourceRecall: query.relevantPaths.length ? relevantCount / query.relevantPaths.length : null,
                sourcePrecision: selected.length ? relevantCount / selected.length : null,
                falsePositiveSources: selected.filter(file => !query.relevantPaths.includes(file)),
                contextChars: details!.contextCharCount, queryMs: percentiles(times) });
        }
    }
    const report = { schemaVersion: 1, corpusSha256: createHash('sha256').update(source).digest('hex'),
        provenance: corpus.provenance, runtime: process.version, platform: process.platform,
        measurements: 'In-memory offline corpus, 20 builds and 20 queries per case. Read time is fixture lookup, not Vault or disk I/O. Heap delta is uncollected, not retained memory. Character count is the context-cost metric; no provider-token count is claimed.',
        fileCount: notes.length, queryCount: corpus.queries.length, buildMs: percentiles(buildTimes),
        meanEnumerationMs: enumerationMs / 20, meanFixtureReadMs: readMs / 20,
        meanParseAndIndexMs: (buildTimes.reduce((sum, value) => sum + value, 0) - enumerationMs - readMs) / 20,
        uncollectedHeapDeltaBytes: process.memoryUsage().heapUsed - heapBefore, cases };
    const output = path.resolve('.cache/verification/local-knowledge-held-out.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    expect(corpus.schemaVersion).toBe(1);
    expect(new Set(corpus.queries.map(query => query.id)).size).toBe(corpus.queries.length);
});
