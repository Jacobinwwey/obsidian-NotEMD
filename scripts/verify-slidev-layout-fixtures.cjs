#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 300000;
const LOW_ZOOM_FLOOR_FOR_PRIMARY_CONTENT = 0.72;

class VerifierProcessError extends Error {
    constructor(status, report, stderr) {
        super(`Verifier failed with exit ${status}:\n${summarizeReportFailure(report)}\n${stderr}`);
        this.name = 'VerifierProcessError';
        this.status = status;
        this.report = report;
        this.stderr = stderr;
    }
}

function parseArgs(argv) {
    const args = {
        archive: null,
        fixture: null,
        json: false,
        keep: false,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        workRoot: null,
    };

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--archive' && argv[index + 1]) {
            args.archive = argv[++index];
        } else if (arg === '--fixture' && argv[index + 1]) {
            args.fixture = argv[++index];
        } else if (arg === '--json') {
            args.json = true;
        } else if (arg === '--keep') {
            args.keep = true;
        } else if (arg === '--timeout-ms' && argv[index + 1]) {
            args.timeoutMs = Number(argv[++index]);
        } else if (arg === '--work-root' && argv[index + 1]) {
            args.workRoot = argv[++index];
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
        throw new Error('--timeout-ms must be a positive number');
    }

    return args;
}

function printHelp() {
    console.log([
        'Usage: node scripts/verify-slidev-layout-fixtures.cjs [options]',
        '',
        'Options:',
        '  --archive <path>      Preserve fixture reports/decks/exports under this directory',
        '  --fixture <id>        Run one fixture id instead of the full suite',
        '  --keep                Keep the generated temporary vault',
        '  --json                Print machine-readable summary only',
        '  --timeout-ms <ms>     Per-fixture verifier timeout, default: 300000',
        '  --work-root <path>    Temporary work root, default: ~/.cache/notemd-slidev-layout-fixtures',
        '  --help                Print this usage text',
        '',
        'Fixtures: source-layout-stress, slot-component-stress',
    ].join('\n'));
}

function createSourceLayoutStressMarkdown() {
    const flowLines = [
        'graph TD',
        '  Start[Source Markdown Note] --> Skill[Full Slidev Skill Context]',
        '  Skill --> Plan[Deterministic Layout Budget]',
        '  Plan --> Deck[Prepared Slidev Deck]',
    ];
    for (let index = 1; index <= 16; index++) {
        flowLines.push(`  Deck --> F${index}[Fit checkpoint ${index}]`);
        flowLines.push(`  F${index} --> A${index}[Audit signal ${index}]`);
    }

    const sequenceLines = [
        'sequenceDiagram',
        '  participant User',
        '  participant NoteMD',
        '  participant Slidev',
        '  participant Browser',
    ];
    for (let index = 1; index <= 8; index++) {
        sequenceLines.push(`  User->>NoteMD: export request ${index}`);
        sequenceLines.push(`  NoteMD->>Slidev: build pass ${index}`);
        sequenceLines.push(`  Slidev->>Browser: render slide ${index}`);
        sequenceLines.push(`  Browser-->>NoteMD: measurement ${index}`);
    }

    const wideRows = [
        ['Standalone HTML', 'native bundle', 'loader bindings', 'index-standalone.html', 'fail closed when loader binding is missing', 'operator can open file directly', 'actualMode equals standalone'],
        ['Layout convergence', 'rendered audit', 'DOM geometry', 'layoutAuditSummary', 'retry when table or code overflows', 'progress log shows patch pass', 'hardOverflowCount stays zero'],
        ['Generated artifacts', 'maintainer review', 'visible export output', 'docs/export or archive', 'never hide generated files with gitignore', 'human can inspect deck markdown', 'ignoredOutputs stays empty'],
        ['Mermaid preservation', 'source fence', 'diagram block count', 'prepared deck markdown', 'do not rewrite one source diagram into multiple diagrams', 'manual review is explicit', 'mermaid block count is stable'],
    ];
    const wideTable = [
        '| Capability | Trigger | Invariant | Evidence artifact | Failure handling | User-visible surface | Audit signal |',
        '| --- | --- | --- | --- | --- | --- | --- |',
        ...wideRows.map(row => `| ${row.join(' | ')} |`),
    ];

    const longRows = [
        ['Provider retry cascade', 'StandaloneLoaderRegressionFingerprint0123456789 pushes one dense row past normal table width and makes the row unreadable before the final audit can judge the deck.', 'Convert the row into key-value record-list bullets so every field wraps independently and remains readable without shrinking the whole slide.', 'layout-fixture-report.json', 'export workflow'],
        ['Export artifact drift', 'PreparedDeckWorkspaceMirrorRegressionFingerprint0123456789 can leave a stale support file beside the copied deck when the source is already a Slidev workspace.', 'Recreate the prepared workspace and mirror support entries before every export verification run.', 'prepared-working-copy', 'source preparer'],
        ['Dense note section', 'LongTableCellReadabilityRegressionFingerprint0123456789 mixes failure reason, operator action, and evidence path into one oversized cell.', 'Prefer record-list slides over low zoom for long-cell tables because each row is a separate presentation record.', 'rendered measurement', 'layout audit'],
        ['Manual review boundary', 'MermaidSourcePreservationRegressionFingerprint0123456789 should never cause the workflow to split one source Mermaid graph into several generated diagrams.', 'Expose source-preserved-fit-review or manual-review while keeping the original Mermaid fence count unchanged.', 'mermaidFit summary', 'maintainer'],
    ];
    const longTable = [
        '| Risk | Impact | Mitigation | Evidence | Owner |',
        '| --- | --- | --- | --- | --- |',
        ...longRows.map(row => `| ${row.join(' | ')} |`),
    ];

    const codeLines = [
        'type ExportStep = {',
        '  id: string;',
        '  evidencePath: string;',
        '  status: "pending" | "running" | "passed" | "failed";',
        '};',
        '',
    ];
    for (let index = 1; index <= 10; index++) {
        codeLines.push(`export function verifyStage${index}(steps: ExportStep[]): ExportStep[] {`);
        codeLines.push(`  const stageId = "stage-${index}";`);
        codeLines.push('  return steps.map(step => ({');
        codeLines.push('    ...step,');
        codeLines.push(`    status: step.id === stageId ? "passed" : step.status,`);
        codeLines.push('  }));');
        codeLines.push('}');
        codeLines.push('');
    }

    return [
        '# Slidev Layout Full Deck Fixture',
        '',
        '## Large Flowchart',
        '',
        '```mermaid',
        ...flowLines,
        '```',
        '',
        '## Long Sequence',
        '',
        '```mermaid',
        ...sequenceLines,
        '```',
        '',
        '## Wide Table Stress',
        '',
        ...wideTable,
        '',
        '## Long Table Stress',
        '',
        ...longTable,
        '',
        '## Dense Mixed Table And Code Stress',
        '',
        'The source section intentionally combines a compact status table and a long TypeScript block. The deterministic preparation and rendered convergence path must avoid solving this by shrinking the primary table or code below the readable floor.',
        '',
        '| Step | Owner | Done |',
        '| --- | --- | --- |',
        '| prepare | source workflow | yes |',
        '| converge | layout audit | yes |',
        '',
        '```ts',
        ...codeLines,
        '```',
        '',
    ].join('\n');
}

function createSlotComponentStressDeck() {
    return [
        '---',
        'theme: default',
        'mdc: true',
        '---',
        '',
        '# Slot Component Stress',
        '',
        '---',
        'layout: two-cols-header',
        '---',
        '',
        '# Fit',
        '',
        '::left::',
        '',
        '<div style="width: 1120px; height: 420px; border: 1px solid #64748b; padding: 22px; display: grid; grid-template-columns: repeat(3, 320px); gap: 18px; background: #f8fafc; color: #0f172a;">',
        '  <section style="border-left: 4px solid #0f766e; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Environment</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">Native standalone, local Slidev fork, full skill references, and visible generated artifacts must all be checked together.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #2563eb; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Layout</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">Component-heavy slot content should receive a measured Transform instead of a fixed zoom chosen by hand.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #b45309; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Evidence</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">The prepared working copy must show the owner wrapper and the converged deck should show the local Transform.</p>',
        '  </section>',
        '</div>',
        '',
        '::right::',
        '',
        '- The right column stays small enough to remain unchanged.',
        '- The left column intentionally overflows the slot owner before convergence.',
        '- The accepted fix is a measured local Transform on that slot content.',
        '',
    ].join('\n');
}

const FIXTURES = [
    {
        id: 'source-layout-stress',
        sourcePath: 'layout-stress.md',
        sourceMarkdown: createSourceLayoutStressMarkdown(),
        expectSkillReferences: true,
        expectPatch: true,
        expectRecordList: true,
        expectCodeSplit: true,
        expectedMermaidBlocks: 2,
    },
    {
        id: 'slot-component-stress',
        sourcePath: 'slot-component-stress.md',
        sourceMarkdown: createSlotComponentStressDeck(),
        expectPatch: true,
        expectTransform: true,
        expectedMermaidBlocks: 0,
    },
];

function resolveFixtures(filterId) {
    if (!filterId) {
        return FIXTURES;
    }
    const fixture = FIXTURES.find(candidate => candidate.id === filterId);
    if (!fixture) {
        throw new Error(`Unknown fixture ${filterId}`);
    }
    return [fixture];
}

function resolveWorkRoot(args) {
    if (args.workRoot) {
        return path.resolve(args.workRoot);
    }
    return path.join(os.homedir(), '.cache', 'notemd-slidev-layout-fixtures');
}

function runVerifier(repoRoot, vaultRoot, sourcePath, timeoutMs) {
    const processTimeoutMs = Math.max(timeoutMs * 3, timeoutMs + 120000);
    const result = childProcess.spawnSync(process.execPath, [
        'scripts/verify-slidev-export-workflow.cjs',
        '--vault', vaultRoot,
        '--source', sourcePath,
        '--format', 'html',
        '--html-mode', 'standalone',
        '--require-native-standalone',
        '--timeout-ms', String(timeoutMs),
        '--no-screenshots',
        '--json',
    ], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: processTimeoutMs,
    });

    if (result.error) {
        throw result.error;
    }

    let report = null;
    try {
        report = JSON.parse(result.stdout);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Verifier did not return JSON (${message}). stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    }

    if (result.status !== 0) {
        throw new VerifierProcessError(result.status, report, result.stderr);
    }

    return report;
}

function summarizeReportFailure(report) {
    return JSON.stringify({
        ok: report?.ok,
        actualMode: report?.htmlExport?.actualMode,
        standalonePassed: report?.standaloneGate?.passed,
        ignoredOutputs: report?.ignoredOutputs,
        summary: report?.layoutAuditSummary,
        checks: report?.playwright?.filter(check => check.failed),
        findings: report?.layoutAudit
            ?.filter(audit => audit.findings?.length)
            .map(audit => ({
                slide: audit.slide,
                elementKinds: audit.elementKinds,
                findings: audit.findings,
                mermaidFit: audit.mermaidFit || null,
            })),
    }, null, 2);
}

function assertFixtureReport(fixture, report, sourceMarkdown) {
    assert(report.ok === true, `${fixture.id}: verifier report was not ok\n${summarizeReportFailure(report)}`);
    assert(report.htmlExport?.actualMode === 'standalone', `${fixture.id}: expected native standalone mode`);
    assert(report.htmlExport?.requiresLocalServer === false, `${fixture.id}: standalone output should not require a local server`);
    assert(report.standaloneGate?.passed === true, `${fixture.id}: standalone gate did not pass`);
    assert(Array.isArray(report.ignoredOutputs) && report.ignoredOutputs.length === 0, `${fixture.id}: generated outputs must stay visible to Git`);

    const summary = report.layoutAuditSummary || {};
    assert(summary.hardOverflowCount === 0, `${fixture.id}: hard overflow remained after convergence`);
    assert(summary.lowEffectiveFontCount === 0, `${fixture.id}: low effective font remained after convergence`);
    assert(summary.qualityMarginWarningCount === 0, `${fixture.id}: quality margin warning remained after convergence`);
    assert(summary.lowContentUtilizationCount === 0, `${fixture.id}: low content utilization remained after convergence`);
    if (fixture.expectPatch) {
        assert(summary.postPatchCount > 0, `${fixture.id}: expected at least one rendered patch pass`);
    }
    if (fixture.expectSkillReferences) {
        assert(report.slideSource?.skillRootPath, `${fixture.id}: expected full Slidev skill root to be loaded`);
        assert(report.slideSource?.skillReferenceCount > 0, `${fixture.id}: expected Slidev skill references to be loaded`);
    }

    const sourceMermaidBlocks = countMermaidBlocks(sourceMarkdown);
    assert(report.deck?.mermaidBlocks === sourceMermaidBlocks, `${fixture.id}: source/exported Mermaid block count changed`);
    if (typeof fixture.expectedMermaidBlocks === 'number') {
        assert(sourceMermaidBlocks === fixture.expectedMermaidBlocks, `${fixture.id}: fixture source Mermaid count changed`);
    }

    const deckMarkdown = fs.readFileSync(report.deck.path, 'utf8');
    assertLowZoomOnlyTargetsMermaid(fixture.id, deckMarkdown);
    if (fixture.expectRecordList) {
        assert(deckMarkdown.includes('- Risk: Provider retry cascade'), `${fixture.id}: long table did not converge to record-list fallback`);
        assert(!deckMarkdown.includes('| Risk | Impact | Mitigation |'), `${fixture.id}: long-cell table header survived instead of record-list fallback`);
    }
    if (fixture.expectCodeSplit) {
        assert(countFenceOpeners(deckMarkdown, 'ts') > 1, `${fixture.id}: TypeScript code fixture did not split into multiple fences`);
    }
    if (fixture.expectTransform) {
        assert(deckMarkdown.includes('data-notemd-slot-zone="left"'), `${fixture.id}: slot owner wrapper was not preserved`);
        assert(deckMarkdown.includes('<Transform :scale='), `${fixture.id}: component-heavy slot was not wrapped in a measured Transform`);
    }
}

function assertLowZoomOnlyTargetsMermaid(fixtureId, deckMarkdown) {
    const slides = splitDeckSlides(deckMarkdown);
    slides.forEach((slide, index) => {
        const zoom = readSlideZoom(slide);
        if (zoom === null || zoom >= LOW_ZOOM_FLOOR_FOR_PRIMARY_CONTENT) {
            return;
        }
        const hasMermaid = /```mermaid/i.test(slide);
        const slideLines = slide.split(/\r?\n/);
        const hasPrimaryNonMermaid = containsMarkdownTableOutsideFence(slideLines) || containsNonMermaidFence(slideLines);
        assert(hasMermaid && !hasPrimaryNonMermaid, `${fixtureId}: slide ${index + 1} uses low zoom ${zoom} outside Mermaid-only content`);
    });
}

function readSlideZoom(slideMarkdown) {
    const match = slideMarkdown.match(/(^|\n)zoom:\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (!match) {
        return null;
    }
    const value = Number(match[2]);
    return Number.isFinite(value) ? value : null;
}

function splitDeckSlides(deckMarkdown) {
    const lines = deckMarkdown.split(/\r?\n/);
    const slides = [];
    let current = [];
    let fence = null;
    let inHeadmatter = false;
    let headmatterClosed = false;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const trimmed = line.trim();
        const fenceMarker = trimmed.match(/^(```+|~~~+)/)?.[1] || null;
        if (fenceMarker) {
            fence = fence ? null : fenceMarker.slice(0, 3);
        }
        if (!headmatterClosed && index === 0 && trimmed === '---') {
            inHeadmatter = true;
            current.push(line);
            continue;
        }
        if (inHeadmatter && trimmed === '---') {
            inHeadmatter = false;
            headmatterClosed = true;
            current.push(line);
            continue;
        }
        if (!fence && headmatterClosed && trimmed === '---' && !isFrontmatterClosingBoundary(current)) {
            slides.push(current.join('\n').trim());
            current = [];
            continue;
        }
        current.push(line);
    }
    if (current.join('\n').trim()) {
        slides.push(current.join('\n').trim());
    }
    return slides;
}

function isFrontmatterClosingBoundary(lines) {
    const firstContentLine = lines.findIndex(line => line.trim().length > 0);
    if (firstContentLine < 0 || !/^[A-Za-z][\w-]*\s*:/.test(lines[firstContentLine].trim())) {
        return false;
    }

    for (let index = firstContentLine; index < lines.length; index++) {
        const line = lines[index].trim();
        if (!line) {
            continue;
        }
        if (line.startsWith('#') || line.startsWith('```') || line.startsWith(':::') || /^::[\w-]+::$/.test(line)) {
            return false;
        }
    }

    return true;
}

function containsNonMermaidFence(lines) {
    return containsFenceMatching(lines, info => !/^mermaid(?:\s+\{[^}]+\})?\s*$/i.test(info));
}

function containsFenceMatching(lines, predicate) {
    let activeFenceMarker = null;

    for (const line of lines) {
        const trimmed = line.trim();
        const openingMatch = trimmed.match(/^(```+|~~~+)(.*)$/);
        if (!activeFenceMarker && openingMatch) {
            if (predicate(openingMatch[2].trim())) {
                return true;
            }
            activeFenceMarker = openingMatch[1][0] === '~' ? '~~~' : '```';
            continue;
        }
        if (activeFenceMarker && new RegExp(`^${escapeRegExp(activeFenceMarker)}+\\s*$`).test(trimmed)) {
            activeFenceMarker = null;
        }
    }

    return false;
}

function containsMarkdownTableOutsideFence(lines) {
    return hasOutsideFenceLine(lines, line => {
        const trimmed = line.trim();
        return trimmed.length > 0
            && trimmed.includes('|')
            && !trimmed.startsWith('```')
            && !trimmed.startsWith('~~~')
            && !trimmed.startsWith('#');
    });
}

function hasOutsideFenceLine(lines, predicate) {
    let activeFenceMarker = null;

    for (const line of lines) {
        const trimmed = line.trim();
        const openingMatch = trimmed.match(/^(```+|~~~+)(.*)$/);
        if (!activeFenceMarker && openingMatch) {
            activeFenceMarker = openingMatch[1][0] === '~' ? '~~~' : '```';
            continue;
        }
        if (activeFenceMarker) {
            if (new RegExp(`^${escapeRegExp(activeFenceMarker)}+\\s*$`).test(trimmed)) {
                activeFenceMarker = null;
            }
            continue;
        }
        if (predicate(line)) {
            return true;
        }
    }

    return false;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMermaidBlocks(markdown) {
    return (markdown.match(/```mermaid/gi) || []).length;
}

function countFenceOpeners(markdown, language) {
    const pattern = new RegExp('```\\s*' + language + '(?:\\s|\\n|$)', 'gi');
    return (markdown.match(pattern) || []).length;
}

function copyFixtureEvidence(archiveRoot, fixture, report, sourcePath) {
    const fixtureArchive = path.join(path.resolve(archiveRoot), fixture.id);
    fs.rmSync(fixtureArchive, { recursive: true, force: true });
    fs.mkdirSync(fixtureArchive, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(fixtureArchive, path.basename(sourcePath)));
    fs.writeFileSync(path.join(fixtureArchive, 'report.json'), JSON.stringify(report, null, 2));
    if (report.deck?.path && fs.existsSync(report.deck.path)) {
        fs.copyFileSync(report.deck.path, path.join(fixtureArchive, path.basename(report.deck.path)));
    }
    if (report.output?.path && fs.existsSync(report.output.path)) {
        const exportDirectory = fs.statSync(report.output.path).isDirectory()
            ? report.output.path
            : path.dirname(report.output.path);
        fs.cpSync(exportDirectory, path.join(fixtureArchive, 'export'), { recursive: true });
    }
}

function writeFixtureReportArtifact(runRoot, fixture, report) {
    const fixtureRoot = path.join(runRoot, fixture.id);
    fs.mkdirSync(fixtureRoot, { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'report.json'), JSON.stringify(report, null, 2));
}

function reportFromError(error) {
    return error && typeof error === 'object' && error.report ? error.report : null;
}

function linkSlidevRuntimeDependencies(repoRoot, vaultRoot) {
    const candidates = [
        path.join(repoRoot, 'docs', 'node_modules'),
        path.join(repoRoot, 'node_modules'),
        path.join(os.homedir(), 'slidev', 'node_modules'),
    ];
    const sourceNodeModules = candidates.find(candidate => fs.existsSync(candidate));
    if (!sourceNodeModules) {
        return;
    }

    const targetNodeModules = path.join(vaultRoot, 'node_modules');
    if (fs.existsSync(targetNodeModules)) {
        return;
    }

    try {
        fs.symlinkSync(sourceNodeModules, targetNodeModules, 'dir');
    } catch {
        fs.cpSync(sourceNodeModules, targetNodeModules, { recursive: true });
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const repoRoot = path.resolve(__dirname, '..');
    const fixtures = resolveFixtures(args.fixture);
    const workRoot = resolveWorkRoot(args);
    fs.mkdirSync(workRoot, { recursive: true });
    const runRoot = fs.mkdtempSync(path.join(workRoot, 'run-'));
    const results = [];

    try {
        for (const fixture of fixtures) {
            const vaultRoot = path.join(runRoot, fixture.id, 'vault');
            fs.mkdirSync(vaultRoot, { recursive: true });
            linkSlidevRuntimeDependencies(repoRoot, vaultRoot);
            const sourcePath = path.join(vaultRoot, fixture.sourcePath);
            fs.writeFileSync(sourcePath, fixture.sourceMarkdown, 'utf8');

            let report = null;
            try {
                report = runVerifier(repoRoot, vaultRoot, fixture.sourcePath, args.timeoutMs);
                writeFixtureReportArtifact(runRoot, fixture, report);
                assertFixtureReport(fixture, report, fixture.sourceMarkdown);
                if (args.archive) {
                    copyFixtureEvidence(args.archive, fixture, report, sourcePath);
                }
            } catch (error) {
                report = report || reportFromError(error);
                if (report) {
                    writeFixtureReportArtifact(runRoot, fixture, report);
                    if (args.archive) {
                        copyFixtureEvidence(args.archive, fixture, report, sourcePath);
                    }
                }
                throw error;
            }
            results.push({
                id: fixture.id,
                ok: true,
                sourcePath,
                outputPath: report.output.path,
                deckPath: report.deck.path,
                slidev: report.environment.slidev.version,
                skillRootPath: report.slideSource.skillRootPath || null,
                skillReferenceCount: report.slideSource.skillReferenceCount || 0,
                layoutAuditSummary: report.layoutAuditSummary,
            });
        }

        const summary = {
            ok: true,
            runRoot,
            archive: args.archive ? path.resolve(args.archive) : null,
            fixtures: results,
        };
        if (args.json) {
            console.log(JSON.stringify(summary, null, 2));
        } else {
            console.log('Slidev layout fixture verification passed.');
            for (const result of results) {
                console.log(`- ${result.id}: ${result.layoutAuditSummary.slideCount} slides, ${result.layoutAuditSummary.postPatchCount} patch passes, ${result.outputPath}`);
            }
            if (args.archive) {
                console.log(`Evidence archived at ${path.resolve(args.archive)}`);
            }
            if (args.keep) {
                console.log(`Temporary vault kept at ${runRoot}`);
            }
        }
    } finally {
        if (!args.keep) {
            fs.rmSync(runRoot, { recursive: true, force: true });
        }
    }
}

main().catch(error => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
