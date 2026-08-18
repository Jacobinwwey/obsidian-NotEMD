#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const consumerHarnessPath = path.join(repoRoot, 'scripts', 'test-drawnix-plait-consumer.mjs');

function parseArgs(argv) {
    const args = {};
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === '--input') {
            args.input = argv[++index];
        } else if (token === '--help' || token === '-h') {
            args.help = true;
        } else {
            throw new Error(`Unknown argument: ${token}`);
        }
    }
    return args;
}

function printUsage() {
    process.stdout.write([
        'Drawnix consumer gate',
        '',
        'Usage:',
        '  node scripts/run-drawnix-consumer-gate.mjs',
        '  node scripts/run-drawnix-consumer-gate.mjs --input <artifact.drawnix>',
        '',
        'Without --input, the gate builds the production architecture fixture in a temporary directory.',
        ''
    ].join('\n'));
}

function createProductionFixture() {
    const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'notemd-drawnix-consumer-gate-'));
    const bundlePath = path.join(temporaryDirectory, 'fixture.cjs');
    const artifactPath = path.join(temporaryDirectory, 'architecture.drawnix');
    const entrySource = `
        import { DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE } from './src/diagram/examples/drawnixKnowledgeMapExamples';
        import { buildDrawnixMindMapProjection } from './src/diagram/adapters/drawnix/drawnixMindMapProjection';
        import {
            exportDrawnixMindMapProjection,
            stringifyDrawnixMindMapExportedData,
            validateDrawnixMindMapExportedData
        } from './src/diagram/adapters/drawnix/drawnixExporter';

        export function writeFixture(outputPath) {
            const projection = buildDrawnixMindMapProjection(DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE);
            const artifact = exportDrawnixMindMapProjection(projection);
            const errors = validateDrawnixMindMapExportedData(artifact);
            if (errors.length > 0) {
                throw new Error(errors.join('; '));
            }
            require('node:fs').writeFileSync(outputPath, stringifyDrawnixMindMapExportedData(artifact), 'utf8');
        }
    `;

    buildSync({
        bundle: true,
        format: 'cjs',
        platform: 'node',
        target: 'node18',
        outfile: bundlePath,
        logLevel: 'silent',
        stdin: {
            contents: entrySource,
            resolveDir: repoRoot,
            sourcefile: 'drawnix-consumer-gate-fixture.ts'
        }
    });

    // The bundle is generated at runtime so the gate consumes the same fixture as production code.
    const fixtureModule = require(bundlePath);
    fixtureModule.writeFixture(artifactPath);
    return { temporaryDirectory, artifactPath };
}

function readConsumerReport(artifactPath) {
    const stdout = execFileSync(process.execPath, [consumerHarnessPath, artifactPath], {
        cwd: repoRoot,
        encoding: 'utf8'
    });
    const report = JSON.parse(stdout);
    if (!Array.isArray(report.nodeIds) || report.nodeIds.length === 0) {
        throw new Error('Drawnix consumer report contains no recognized mind-map nodes.');
    }
    if (!Array.isArray(report.rootIds) || report.rootIds.length !== 1) {
        throw new Error('Drawnix consumer report must contain exactly one filename-rooted document root.');
    }
    if (!Array.isArray(report.relations) || report.relations.length === 0) {
        throw new Error('Drawnix consumer report contains no native cross-branch relations.');
    }
    return report;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        return;
    }

    let temporaryDirectory;
    let artifactPath = args.input ? path.resolve(repoRoot, args.input) : undefined;
    try {
        if (!artifactPath) {
            ({ temporaryDirectory, artifactPath } = createProductionFixture());
        }
        const report = readConsumerReport(artifactPath);
        process.stdout.write(`${JSON.stringify({
            status: 'passed',
            consumer: 'plait-public-api',
            artifactPath,
            generatedProductionFixture: !args.input,
            nodeCount: report.nodeIds.length,
            rootCount: report.rootIds.length,
            relationCount: report.relations.length
        }, null, 2)}\n`);
    } finally {
        if (temporaryDirectory) {
            rmSync(temporaryDirectory, { recursive: true, force: true });
        }
    }
}

try {
    main();
} catch (error) {
    process.stderr.write(`Drawnix consumer gate failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
}
