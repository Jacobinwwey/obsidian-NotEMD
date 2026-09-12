#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const { build } = require('esbuild');

const repository = path.resolve(__dirname, '..');
const outputDirectory = path.join(repository, '.cache/verification');
const corpusPath = path.join(repository, 'src/tests/fixtures/local-knowledge-held-out.json');
const hashText = source => createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');

function distribution(samples) {
    const sorted = [...samples].sort((a, b) => a - b);
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return { count: samples.length, min: sorted[0], max: sorted[sorted.length - 1], mean,
        p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
        standardDeviation: Math.sqrt(samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length) };
}

async function collectedHeapBytes() {
    // Let completed async builds release their stack roots before measuring reachability.
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
    global.gc();
    return process.memoryUsage().heapUsed;
}

async function main() {
    if (process.argv.length !== 2 || typeof global.gc !== 'function') {
        throw new Error('Run npm run benchmark:local-kb (a fresh Node process with --expose-gc; no arguments).');
    }
    fs.mkdirSync(outputDirectory, { recursive: true });
    const runtimePath = path.join(outputDirectory, 'local-knowledge-benchmark-runtime.cjs');
    await build({ entryPoints: [path.join(repository, 'src/localKnowledgeBase.ts')], outfile: runtimePath,
        bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent',
        plugins: [{ name: 'unused-host-imports', setup(build) {
            // Elide unused UI imports only; a used host API still fails in this headless process.
            build.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', external: true, sideEffects: false }));
        } }] });
    const { buildLocalKnowledgeBaseRetriever } = require(runtimePath);
    const source = fs.readFileSync(corpusPath, 'utf8').replace(/\r\n/g, '\n');
    const corpus = JSON.parse(source);
    const notes = corpus.files.map(note => ({ path: note.path, extension: 'md', basename: path.posix.basename(note.path, '.md') }));
    const markdownByPath = new Map(corpus.files.map(note => [note.path, note.markdown]));
    let enumerationMs = 0;
    let fixtureReadMs = 0;
    const app = { vault: {
        getFiles() {
            const start = performance.now();
            const files = notes.slice();
            enumerationMs += performance.now() - start;
            return files;
        },
        async read(file) {
            const start = performance.now();
            const markdown = markdownByPath.get(file.path);
            fixtureReadMs += performance.now() - start;
            return markdown;
        }
    } };
    // No task override is supplied: these are the complete inputs read by the core builder.
    const settings = { enableLocalKnowledgeRetrieval: true, localKnowledgeBasePaths: corpus.defaultPaths,
        localKnowledgeExcludeCurrentFile: true };
    const buildRetriever = () => buildLocalKnowledgeBaseRetriever(app, settings);
    const warmupBuilds = 20;
    for (let index = 0; index < warmupBuilds; index++) await buildRetriever();

    const buildSamples = [];
    let retriever;
    for (let sample = 0; sample < 50; sample++) {
        enumerationMs = 0;
        fixtureReadMs = 0;
        const start = performance.now();
        retriever = await buildRetriever();
        const totalMs = performance.now() - start;
        buildSamples.push({ totalMs, enumerationMs, fixtureReadMs,
            parseIndexAndBookkeepingMs: totalMs - enumerationMs - fixtureReadMs });
    }
    if (!retriever) throw new Error('The frozen corpus did not produce a retriever');
    const indexedFileCount = retriever.indexedFileCount;
    const indexedSectionCount = retriever.indexedSectionCount;
    const querySamples = { 1: [], 3: [] };
    const queryCases = [1, 3].flatMap(topK => corpus.queries.map(query => ({ query, topK, times: [], contextChars: 0,
        options: { topK, slidingWindowSize: 0, maxSnippetChars: 450, currentFilePath: query.currentFilePath } })));
    for (let warmup = 0; warmup < 20; warmup++) {
        for (const item of queryCases) retriever.buildContextDetails(item.query.query, item.options);
    }
    await collectedHeapBytes();
    for (let sample = 0; sample < 50; sample++) {
        const orderedCases = sample % 2 === 0 ? queryCases : [...queryCases].reverse();
        for (const item of orderedCases) {
            const start = performance.now();
            const context = retriever.buildContextDetails(item.query.query, item.options);
            item.times.push(performance.now() - start);
            item.contextChars = context.contextCharCount;
        }
    }
    const queries = queryCases.map(item => {
        querySamples[item.topK].push(...item.times);
        return { id: item.query.id, topK: item.topK, contextChars: item.contextChars, queryMs: distribution(item.times) };
    });
    retriever = null;

    async function measureRetention(copies) {
        const baselineBytes = await collectedHeapBytes();
        let liveRetrievers = [];
        for (let copy = 0; copy < copies; copy++) liveRetrievers.push(await buildRetriever());
        const liveBytes = await collectedHeapBytes();
        // Read after GC so the optimizer cannot discard the intended live roots early.
        const liveSections = liveRetrievers.reduce((sum, entry) => sum + entry.indexedSectionCount, 0);
        if (liveSections !== indexedSectionCount * copies) throw new Error('Unexpected live retriever count');
        liveRetrievers = null;
        const releasedBytes = await collectedHeapBytes();
        return { copies, baselineBytes, liveBytes, releasedBytes, retainedDeltaBytes: liveBytes - baselineBytes,
            retainedPerCopyBytes: (liveBytes - baselineBytes) / copies, releasedDeltaBytes: releasedBytes - baselineBytes };
    }
    await measureRetention(1);
    const retainedHeap = [];
    for (const copies of [1, 64]) {
        const samples = [];
        for (let sample = 0; sample < 5; sample++) samples.push(await measureRetention(copies));
        retainedHeap.push({ copies, samples, retainedDeltaBytes: distribution(samples.map(sample => sample.retainedDeltaBytes)),
            retainedPerCopyBytes: distribution(samples.map(sample => sample.retainedPerCopyBytes)),
            releasedDeltaBytes: distribution(samples.map(sample => sample.releasedDeltaBytes)) });
    }
    const report = {
        schemaVersion: 1, measuredAt: new Date().toISOString(),
        sourceRevision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8', windowsHide: true }).trim(),
        sourceState: 'The revision is Git HEAD at measurement time; normalized source hashes identify the measured working-tree code.',
        sourceHashes: Object.fromEntries(['src/localKnowledgeBase.ts', 'src/markdownSectionUtils.ts', 'src/utils.ts', 'scripts/benchmark-local-knowledge.cjs']
            .map(file => [file, hashText(fs.readFileSync(path.join(repository, file), 'utf8'))])),
        corpusSha256: hashText(source), corpusHashNormalization: 'UTF-8 with LF source line endings',
        corpusFiles: corpus.files.length, corpusQueries: corpus.queries.length, indexedFileCount, indexedSectionCount,
        environment: { node: process.version, v8: process.versions.v8, platform: process.platform, architecture: process.arch,
            osRelease: os.release(), cpu: os.cpus()[0].model, ramBytes: os.totalmem(), esbuild: require('esbuild').version,
            miniSearch: JSON.parse(fs.readFileSync(path.join(repository, 'node_modules/minisearch/package.json'), 'utf8')).version },
        method: {
            warmupBuilds, measuredBuilds: 50, warmupQueriesPerCase: 20, measuredQueriesPerCase: 50,
            queryOrder: 'Alternating forward/reversed case order after warming both Top-K settings; a full GC precedes timed queries.',
            io: 'In-memory corpus reads; real Vault enumeration/read timings remain a separate host measurement.',
            heap: 'Fresh process, warmed runtime/corpus held constant, two explicit full GC calls after an event-loop turn at each baseline/live/released boundary. Five rounds each for one and 64 live retrievers.',
            scope: 'Marginal retained V8 heap over a shared corpus/module baseline. Per-copy values from 64 copies amplify the signal; negative/noisy deltas are retained. Excludes Obsidian UI, disk cache, provider tokenization and process RSS. No leak-free or large-Vault scaling claim.'
        },
        build: { samples: buildSamples, totalMs: distribution(buildSamples.map(sample => sample.totalMs)),
            enumerationMs: distribution(buildSamples.map(sample => sample.enumerationMs)),
            fixtureReadMs: distribution(buildSamples.map(sample => sample.fixtureReadMs)),
            parseIndexAndBookkeepingMs: distribution(buildSamples.map(sample => sample.parseIndexAndBookkeepingMs)) },
        queryMsByTopK: Object.fromEntries([1, 3].map(topK => [topK, distribution(querySamples[topK])])), queries, retainedHeap
    };
    const reportPath = path.join(outputDirectory, 'local-knowledge-cost.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ reportPath, indexedFileCount, indexedSectionCount, buildMs: report.build.totalMs,
        queryMsByTopK: report.queryMsByTopK, retainedHeap: retainedHeap.map(({ copies, retainedPerCopyBytes, releasedDeltaBytes }) =>
            ({ copies, retainedPerCopyBytes, releasedDeltaBytes })) }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
