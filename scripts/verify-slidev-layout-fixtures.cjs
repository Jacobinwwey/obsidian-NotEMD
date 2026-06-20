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
        `Fixtures: ${FIXTURE_IDS.join(', ')}`,
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
        ['Mermaid preservation', 'source fence', 'exact fence content', 'prepared deck markdown', 'do not rewrite one source diagram into multiple diagrams', 'manual review is explicit', 'mermaid fences are byte-stable'],
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
        ['Manual review boundary', 'MermaidSourcePreservationRegressionFingerprint0123456789 should never cause the workflow to split one source Mermaid graph into several generated diagrams.', 'Expose source-preserved-fit-review or manual-review while keeping every original Mermaid fence byte-stable.', 'mermaidFit summary', 'maintainer'],
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

function createCustomSingleSurfaceComponentStressDeck() {
    return [
        '---',
        'theme: default',
        'mdc: true',
        '---',
        '',
        '# Custom Single Surface Component Stress',
        '',
        '---',
        'layout: surface-shell',
        '---',
        '',
        '<div style="width: 1480px; height: 500px; border: 1px solid #475569; padding: 24px; display: grid; grid-template-columns: repeat(4, 330px); gap: 22px; background: #f8fafc; color: #0f172a;">',
        '  <section style="border-left: 5px solid #0f766e; padding-left: 16px;">',
        '    <h2 style="font-size: 30px; margin: 0 0 16px;">Surface</h2>',
        '    <p style="font-size: 20px; line-height: 1.35;">Single surface regression fingerprint keeps a custom layout surface as one transformable component.</p>',
        '  </section>',
        '  <section style="border-left: 5px solid #2563eb; padding-left: 16px;">',
        '    <h2 style="font-size: 30px; margin: 0 0 16px;">Owner</h2>',
        '    <p style="font-size: 20px; line-height: 1.35;">There are no named slot markers here, so the workflow must not depend on slot owner attribution.</p>',
        '  </section>',
        '  <section style="border-left: 5px solid #b45309; padding-left: 16px;">',
        '    <h2 style="font-size: 30px; margin: 0 0 16px;">Patch</h2>',
        '    <p style="font-size: 20px; line-height: 1.35;">The acceptable repair is a measured local Transform around the raw component surface.</p>',
        '  </section>',
        '  <section style="border-left: 5px solid #7c3aed; padding-left: 16px;">',
        '    <h2 style="font-size: 30px; margin: 0 0 16px;">Gate</h2>',
        '    <p style="font-size: 20px; line-height: 1.35;">Whole-slide zoom remains a regression because it shrinks the custom shell together with the content.</p>',
        '  </section>',
        '</div>',
        '',
    ].join('\n');
}

function createCompetingSlotZonesStressDeck() {
    return [
        '---',
        'theme: default',
        'mdc: true',
        '---',
        '',
        '# Competing Slot Zones Stress',
        '',
        '---',
        'layout: dual-rail',
        '---',
        '',
        '::summary::',
        '',
        '<div style="width: 760px; height: 430px; border: 1px solid #0f766e; padding: 18px; display: grid; grid-template-columns: repeat(3, 220px); gap: 16px; background: #ecfdf5; color: #064e3b;">',
        '  <section style="border-left: 4px solid #0f766e; padding-left: 12px;">',
        '    <h3 style="font-size: 23px; margin: 0 0 10px;">Queue</h3>',
        '    <p style="font-size: 17px; line-height: 1.35;">Summary rail card one intentionally exceeds the named slot owner width before convergence.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #2563eb; padding-left: 12px;">',
        '    <h3 style="font-size: 23px; margin: 0 0 10px;">Budget</h3>',
        '    <p style="font-size: 17px; line-height: 1.35;">Summary rail card two must be locally transformed without changing the peer slot.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #b45309; padding-left: 12px;">',
        '    <h3 style="font-size: 23px; margin: 0 0 10px;">Signal</h3>',
        '    <p style="font-size: 17px; line-height: 1.35;">The verifier should see this as one component surface, not prose to split.</p>',
        '  </section>',
        '</div>',
        '',
        '::details::',
        '',
        '<div style="width: 820px; height: 450px; border: 1px solid #4338ca; padding: 18px; display: grid; grid-template-columns: repeat(4, 185px); gap: 14px; background: #eef2ff; color: #312e81;">',
        '  <section style="border-left: 4px solid #4338ca; padding-left: 12px;">',
        '    <h3 style="font-size: 22px; margin: 0 0 10px;">Audit</h3>',
        '    <p style="font-size: 16px; line-height: 1.35;">Details rail card one independently overflows its named slot owner.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #0f766e; padding-left: 12px;">',
        '    <h3 style="font-size: 22px; margin: 0 0 10px;">Patch</h3>',
        '    <p style="font-size: 16px; line-height: 1.35;">Details rail card two needs its own measured Transform.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #b45309; padding-left: 12px;">',
        '    <h3 style="font-size: 22px; margin: 0 0 10px;">Replay</h3>',
        '    <p style="font-size: 16px; line-height: 1.35;">The final deck must not pick only one winner from two valid zones.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #be123c; padding-left: 12px;">',
        '    <h3 style="font-size: 22px; margin: 0 0 10px;">Gate</h3>',
        '    <p style="font-size: 16px; line-height: 1.35;">Whole-slide zoom is a regression here because both slots expose local owners.</p>',
        '  </section>',
        '</div>',
        '',
    ].join('\n');
}

function createMixedMermaidProseStressDeck() {
    return [
        '---',
        'theme: default',
        'mdc: true',
        '---',
        '',
        '# Mixed Mermaid Prose Stress',
        '',
        '---',
        'zoom: 0.42',
        '---',
        '',
        '## Runtime Shape',
        '',
        '```mermaid',
        'flowchart LR',
        '  Source[Source note] --> Skill[Full skill references]',
        '  Skill --> Deck[Prepared deck]',
        '  Deck --> Browser[Rendered audit]',
        '  Browser --> Standalone[Native standalone]',
        '```',
        '',
        'The export path must keep this prose readable without shrinking it together with the diagram.',
        '',
        '- Preserve the source Mermaid fence as one fence.',
        '- Move prose onto a readable slide if the diagram needs source-preserved fit.',
        '- Do not solve this mixed slide by keeping low whole-slide zoom on prose.',
        '',
    ].join('\n');
}

function createMediaNestedSlotStressDeck() {
    const ultraWideHeader = [
        'Capability',
        'Trigger',
        'Boundary',
        'Evidence',
        'Fallback',
        'User surface',
        'Owner',
        'Replay command',
        'Regression risk',
        'Gate',
    ];
    const ultraWideRows = [
        ['Image asset audit', 'Markdown image is present', 'Image layout must stay visible', 'wide-schematic.svg', 'Do not hide export assets', 'standalone HTML', 'source preparer', 'verify media fixture', 'broken relative asset path', 'native standalone'],
        ['Nested slot audit', 'Component content overflows a named slot', 'Only the overflowing slot is transformed', 'data-notemd-slot-zone', 'Do not shrink the whole slide', 'layout audit', 'patcher', 'verify slot fixture', 'wrong slot attribution', 'no low font'],
        ['Wide table audit', 'Ten-column table is too wide', 'Split columns or records structurally', 'final deck markdown', 'Do not rely on low zoom', 'maintainer report', 'table splitter', 'verify table fixture', 'cramped table text', 'no hard overflow'],
        ['Mixed source audit', 'Mermaid appears beside prose', 'Mermaid fence remains byte-stable', 'mermaid fence comparison', 'Separate prose before low zoom', 'deck markdown', 'source-preserved fit', 'verify mixed fixture', 'prose made unreadable', 'no mixed low zoom'],
    ];
    const ultraWideTable = [
        `| ${ultraWideHeader.join(' | ')} |`,
        `| ${ultraWideHeader.map(() => '---').join(' | ')} |`,
        ...ultraWideRows.map(row => `| ${row.join(' | ')} |`),
    ];

    return [
        '---',
        'theme: default',
        'mdc: true',
        '---',
        '',
        '# Media Nested Slot Stress',
        '',
        '---',
        'layout: image-right',
        '---',
        '',
        '# Visual Asset',
        '',
        'A real Markdown image should remain a visible source asset in the standalone export path.',
        '',
        '![Wide schematic](./wide-schematic.svg)',
        '',
        '---',
        'layout: two-cols-header',
        '---',
        '',
        '# Nested Slot Component',
        '',
        '::left::',
        '',
        ':::info',
        '<div style="width: 1180px; height: 430px; border: 1px solid #64748b; padding: 22px; display: grid; grid-template-columns: repeat(4, 265px); gap: 18px; background: #f8fafc; color: #0f172a;">',
        '  <section style="border-left: 4px solid #0f766e; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Source</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">Nested slot content keeps ownership markers while the measured Transform targets only this overflowing zone.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #2563eb; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Audit</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">The right column should not inherit a whole-slide zoom just because the left component is too wide.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #b45309; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Patch</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">Local Transform is acceptable here because the component is one visual surface, not table or prose.</p>',
        '  </section>',
        '  <section style="border-left: 4px solid #7c3aed; padding-left: 14px;">',
        '    <h3 style="font-size: 24px; margin: 0 0 12px;">Evidence</h3>',
        '    <p style="font-size: 18px; line-height: 1.35;">The exported deck must retain the slot owner wrapper and avoid low effective font after convergence.</p>',
        '  </section>',
        '</div>',
        ':::',
        '',
        '::right::',
        '',
        '- Right-side prose remains ordinary readable text.',
        '- Nested directive syntax stays inside the left slot.',
        '- No whole-slide low zoom should be introduced for this component.',
        '',
        '---',
        '',
        '## Ultra Wide Contract Matrix',
        '',
        ...ultraWideTable,
        '',
    ].join('\n');
}

function createBackgroundCrossAssetStressDeck() {
    return [
        '---',
        'theme: default',
        'mdc: true',
        'background: ./assets/deck-background.svg',
        'favicon: ./assets/favicon.svg?cache=fixture',
        '---',
        '',
        '# Background Asset Stress',
        '',
        'This deck keeps local frontmatter assets beside a source file that lives in a nested directory.',
        '<link rel="stylesheet" href="./assets/local-theme.css">',
        '',
        '---',
        'background: url("./assets/section-background.svg")',
        'class: text-white',
        '---',
        '',
        '# Section Backdrop',
        '',
        '- Frontmatter background references must survive prepared workspace isolation.',
        '- The export must not depend on the original source directory after preparation.',
        '- This slide intentionally avoids Mermaid so no diagram-preservation rule is involved.',
        '',
        '---',
        'layout: image-right',
        'image: ./assets/hero.svg',
        '---',
        '',
        '# Image Frontmatter',
        '',
        'The `image` frontmatter path is a local source-relative asset, not a remote URL.',
        '',
        '---',
        '',
        '# Local Media Assets',
        '',
        '<video controls poster="./assets/poster.svg" style="width: 62%; max-height: 260px;">',
        '  <source src="./media/clip.mp4" type="video/mp4">',
        '  <track kind="captions" src="./media/captions.vtt" srclang="en" label="English">',
        '</video>',
        '',
        '<audio controls>',
        '  <source src="./media/narration.mp3" type="audio/mpeg">',
        '</audio>',
        '',
    ].join('\n');
}

function createWideSchematicSvg() {
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="560" viewBox="0 0 1440 560" role="img" aria-label="Wide schematic">',
        '  <rect width="1440" height="560" fill="#f8fafc"/>',
        '  <g font-family="Inter, Arial, sans-serif" font-size="34" fill="#0f172a">',
        '    <text x="60" y="86">Source</text>',
        '    <text x="410" y="86">Prepare</text>',
        '    <text x="775" y="86">Audit</text>',
        '    <text x="1110" y="86">Standalone</text>',
        '  </g>',
        '  <g fill="none" stroke="#2563eb" stroke-width="8">',
        '    <rect x="50" y="130" width="260" height="190" rx="18"/>',
        '    <rect x="400" y="130" width="260" height="190" rx="18"/>',
        '    <rect x="750" y="130" width="260" height="190" rx="18"/>',
        '    <rect x="1100" y="130" width="260" height="190" rx="18"/>',
        '    <path d="M310 225 H400 M660 225 H750 M1010 225 H1100" stroke="#0f766e"/>',
        '  </g>',
        '  <g font-family="Inter, Arial, sans-serif" font-size="24" fill="#334155">',
        '    <text x="90" y="235">Markdown</text>',
        '    <text x="430" y="235">Slidev deck</text>',
        '    <text x="790" y="235">Browser check</text>',
        '    <text x="1135" y="235">HTML file</text>',
        '  </g>',
        '</svg>',
        '',
    ].join('\n');
}

function createFixtureSvg(label, fill = '#f8fafc', accent = '#2563eb') {
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="${label}">`,
        `  <rect width="1280" height="720" fill="${fill}"/>`,
        `  <rect x="86" y="96" width="1108" height="528" rx="32" fill="none" stroke="${accent}" stroke-width="12"/>`,
        `  <text x="140" y="210" font-family="Inter, Arial, sans-serif" font-size="64" fill="#0f172a">${label}</text>`,
        `  <text x="140" y="300" font-family="Inter, Arial, sans-serif" font-size="34" fill="#334155">source-relative asset copied into prepared workspace</text>`,
        '</svg>',
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
    {
        id: 'custom-single-surface-component-stress',
        sourcePath: 'custom-single-surface-component-stress.md',
        sourceMarkdown: createCustomSingleSurfaceComponentStressDeck(),
        files: [
            {
                path: 'layouts/surface-shell.vue',
                content: [
                    '<template>',
                    '  <main class="notemd-surface-shell">',
                    '    <slot />',
                    '  </main>',
                    '</template>',
                    '',
                    '<style>',
                    '.notemd-surface-shell {',
                    '  height: 100%;',
                    '  padding: 56px 64px;',
                    '  overflow: hidden;',
                    '}',
                    '</style>',
                ].join('\n'),
            },
        ],
        expectPatch: true,
        expectSingleSurfaceTransform: true,
        expectNoWholeSlideZoom: true,
        expectedLayout: 'surface-shell',
        expectedMermaidBlocks: 0,
    },
    {
        id: 'competing-slot-zones-stress',
        sourcePath: 'competing-slot-zones-stress.md',
        sourceMarkdown: createCompetingSlotZonesStressDeck(),
        files: [
            {
                path: 'layouts/dual-rail.vue',
                content: [
                    '<template>',
                    '  <div class="notemd-dual-rail">',
                    '    <section class="notemd-dual-rail__summary">',
                    '      <slot name="summary" />',
                    '    </section>',
                    '    <section class="notemd-dual-rail__details">',
                    '      <slot name="details" />',
                    '    </section>',
                    '  </div>',
                    '</template>',
                    '',
                    '<style>',
                    '.notemd-dual-rail {',
                    '  display: grid;',
                    '  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);',
                    '  gap: 28px;',
                    '  height: 100%;',
                    '  padding: 58px 64px;',
                    '}',
                    '.notemd-dual-rail__summary,',
                    '.notemd-dual-rail__details {',
                    '  min-width: 0;',
                    '  overflow: hidden;',
                    '  border: 1px solid #cbd5e1;',
                    '  border-radius: 8px;',
                    '  padding: 18px;',
                    '}',
                    '</style>',
                ].join('\n'),
            },
        ],
        expectPatch: true,
        expectedOwnerZones: ['summary', 'details'],
        expectedMinSlideCount: 3,
        expectNoWholeSlideZoom: true,
        expectedMermaidBlocks: 0,
    },
    {
        id: 'mixed-mermaid-prose-stress',
        sourcePath: 'mixed-mermaid-prose-stress.md',
        sourceMarkdown: createMixedMermaidProseStressDeck(),
        expectPatch: true,
        expectMixedMermaidSeparation: true,
        expectedMermaidBlocks: 1,
    },
    {
        id: 'media-nested-slot-stress',
        sourcePath: 'media-nested-slot-stress.md',
        sourceMarkdown: createMediaNestedSlotStressDeck(),
        files: [
            { path: 'wide-schematic.svg', content: createWideSchematicSvg() },
        ],
        expectPatch: true,
        expectTransform: true,
        expectImageReference: true,
        expectUltraWideTableSplit: true,
        expectedMermaidBlocks: 0,
    },
    {
        id: 'background-cross-asset-stress',
        sourcePath: 'decks/background-cross-asset-stress.md',
        sourceMarkdown: createBackgroundCrossAssetStressDeck(),
        files: [
            { path: 'decks/assets/deck-background.svg', content: createFixtureSvg('Deck background', '#e0f2fe', '#0369a1') },
            { path: 'decks/assets/section-background.svg', content: createFixtureSvg('Section background', '#0f172a', '#22d3ee') },
            { path: 'decks/assets/hero.svg', content: createFixtureSvg('Hero image', '#ecfdf5', '#047857') },
            { path: 'decks/assets/favicon.svg', content: createFixtureSvg('Favicon', '#f8fafc', '#7c3aed') },
            { path: 'decks/assets/poster.svg', content: createFixtureSvg('Video poster', '#eef2ff', '#4f46e5') },
            {
                path: 'decks/assets/local-theme.css',
                content: [
                    '@import "./imported-theme.css";',
                    '@import "../../outside.css";',
                    '@font-face { font-family: FixtureTheme; src: url("./theme-font.woff2") format("woff2"); }',
                    '.themed-backdrop { background-image: url("../media/theme-pattern.svg"); }',
                    '.bad-backdrop { background-image: url("../../outside.svg"); }',
                ].join('\n'),
            },
            {
                path: 'decks/assets/imported-theme.css',
                content: [
                    '@font-face { font-family: FixtureImported; src: url("./imported-font.woff2") format("woff2"); }',
                    '.imported-backdrop { background-image: url("../media/imported-pattern.svg"); }',
                ].join('\n'),
            },
            { path: 'decks/assets/theme-font.woff2', content: 'fake font payload' },
            { path: 'decks/assets/imported-font.woff2', content: 'fake imported font payload' },
            { path: 'decks/media/theme-pattern.svg', content: createFixtureSvg('Theme pattern', '#fefce8', '#ca8a04') },
            { path: 'decks/media/imported-pattern.svg', content: createFixtureSvg('Imported theme pattern', '#ecfeff', '#0891b2') },
            { path: 'decks/media/clip.mp4', content: 'fake video payload' },
            { path: 'decks/media/captions.vtt', content: 'WEBVTT\n\n00:00.000 --> 00:01.000\nFixture captions\n' },
            { path: 'decks/media/narration.mp3', content: 'fake audio payload' },
            { path: 'outside.svg', content: createFixtureSvg('Outside rejected', '#fee2e2', '#dc2626') },
            { path: 'outside.css', content: 'body{}' },
        ],
        expectFrontmatterAssets: true,
        expectedCopiedAssets: [
            'assets/deck-background.svg',
            'assets/section-background.svg',
            'assets/hero.svg',
            'assets/favicon.svg',
            'assets/poster.svg',
            'assets/local-theme.css',
            'assets/imported-theme.css',
            'assets/theme-font.woff2',
            'assets/imported-font.woff2',
            'media/theme-pattern.svg',
            'media/imported-pattern.svg',
            'media/clip.mp4',
            'media/captions.vtt',
            'media/narration.mp3',
        ],
        expectedExportAssets: [
            'assets/deck-background.svg',
            'assets/section-background.svg',
            'assets/hero.svg',
            'assets/favicon.svg',
            'assets/poster.svg',
            'assets/local-theme.css',
            'assets/imported-theme.css',
            'assets/theme-font.woff2',
            'assets/imported-font.woff2',
            'media/theme-pattern.svg',
            'media/imported-pattern.svg',
            'media/clip.mp4',
            'media/captions.vtt',
            'media/narration.mp3',
        ],
        expectedMermaidBlocks: 0,
    },
];

const FIXTURE_IDS = FIXTURES.map(fixture => fixture.id);

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

    const sourceMermaidFences = extractMermaidFenceBlocks(sourceMarkdown);
    const sourceMermaidBlocks = sourceMermaidFences.length;
    assert(report.deck?.mermaidBlocks === sourceMermaidBlocks, `${fixture.id}: source/exported Mermaid fence count changed`);
    if (typeof fixture.expectedMermaidBlocks === 'number') {
        assert(sourceMermaidBlocks === fixture.expectedMermaidBlocks, `${fixture.id}: fixture source Mermaid count changed`);
    }

    const deckMarkdown = fs.readFileSync(report.deck.path, 'utf8');
    assertMermaidFencesUnchanged(fixture.id, sourceMermaidFences, extractMermaidFenceBlocks(deckMarkdown));
    assertLowZoomOnlyTargetsMermaid(fixture.id, deckMarkdown);
    if (fixture.expectRecordList) {
        assert(deckMarkdown.includes('- Risk: Provider retry cascade'), `${fixture.id}: long table did not converge to record-list fallback`);
        assert(!deckMarkdown.includes('| Risk | Impact | Mitigation |'), `${fixture.id}: long-cell table header survived instead of record-list fallback`);
    }
    if (fixture.expectCodeSplit) {
        assert(countFenceOpeners(deckMarkdown, 'ts') > 1, `${fixture.id}: TypeScript code fixture did not split into multiple fences`);
    }
    if (fixture.expectTransform) {
        if (!fixture.expectedTransformZones) {
            assert(deckMarkdown.includes('data-notemd-slot-zone="left"'), `${fixture.id}: slot owner wrapper was not preserved`);
        }
        assert(deckMarkdown.includes('<Transform :scale='), `${fixture.id}: component-heavy slot was not wrapped in a measured Transform`);
    }
    if (fixture.expectSingleSurfaceTransform) {
        assert(deckMarkdown.includes('<Transform :scale='), `${fixture.id}: single component surface was not wrapped in a measured Transform`);
        assert(!deckMarkdown.includes('data-notemd-slot-zone='), `${fixture.id}: single component surface should not require slot owner wrappers`);
        assert(deckMarkdown.includes('Single surface regression fingerprint'), `${fixture.id}: single component surface content disappeared`);
    }
    if (fixture.expectedLayout) {
        assert(deckMarkdown.includes(`layout: ${fixture.expectedLayout}`), `${fixture.id}: expected layout ${fixture.expectedLayout} did not survive convergence`);
    }
    if (fixture.expectedTransformZones) {
        for (const zoneName of fixture.expectedTransformZones) {
            assert(deckMarkdown.includes(`data-notemd-slot-zone="${zoneName}"`), `${fixture.id}: ${zoneName} slot owner wrapper was not preserved`);
            assert(
                new RegExp(`::${escapeRegExp(zoneName)}::\\s*\\n\\s*<Transform :scale=`, 'm').test(deckMarkdown),
                `${fixture.id}: ${zoneName} slot was not wrapped in a measured Transform`
            );
        }
        assert(
            countTransformWrappers(deckMarkdown) >= fixture.expectedTransformZones.length,
            `${fixture.id}: expected at least ${fixture.expectedTransformZones.length} local Transform wrappers`
        );
    }
    if (fixture.expectedOwnerZones) {
        for (const zoneName of fixture.expectedOwnerZones) {
            assert(deckMarkdown.includes(`data-notemd-slot-zone="${zoneName}"`), `${fixture.id}: ${zoneName} slot owner wrapper was not preserved`);
        }
    }
    if (fixture.expectedMinSlideCount) {
        assert(
            splitDeckSlides(deckMarkdown).length >= fixture.expectedMinSlideCount,
            `${fixture.id}: expected at least ${fixture.expectedMinSlideCount} slides after convergence`
        );
    }
    if (fixture.expectNoWholeSlideZoom) {
        assert(!/^zoom:\s*[0-9.]+$/im.test(deckMarkdown), `${fixture.id}: whole-slide zoom was introduced instead of local slot transforms`);
    }
    if (fixture.expectMixedMermaidSeparation) {
        assert(splitDeckSlides(deckMarkdown).length > splitDeckSlides(sourceMarkdown).length, `${fixture.id}: mixed Mermaid/prose slide was not separated`);
        assert(deckMarkdown.includes('The export path must keep this prose readable'), `${fixture.id}: prose content disappeared during mixed Mermaid separation`);
        assert(deckMarkdown.includes('Source[Source note] --> Skill[Full skill references]'), `${fixture.id}: source Mermaid content changed during mixed separation`);
        assert(countMermaidBlocks(deckMarkdown) === countMermaidBlocks(sourceMarkdown), `${fixture.id}: source Mermaid fence count changed during mixed Mermaid separation`);
        assert(!deckMarkdown.includes('zoom: 0.42'), `${fixture.id}: mixed Mermaid/prose low zoom survived after convergence`);
    }
    if (fixture.expectImageReference) {
        assert(deckMarkdown.includes('wide-schematic.svg'), `${fixture.id}: Markdown image reference did not survive deck convergence`);
    }
    if (fixture.expectFrontmatterAssets) {
        assert(deckMarkdown.includes('background: ./assets/deck-background.svg'), `${fixture.id}: deck background frontmatter reference did not survive`);
        assert(deckMarkdown.includes('background: url("./assets/section-background.svg")'), `${fixture.id}: slide background frontmatter reference did not survive`);
        assert(deckMarkdown.includes('image: ./assets/hero.svg'), `${fixture.id}: image frontmatter reference did not survive`);
    }
    if (fixture.expectedCopiedAssets) {
        const preparedDeckDirectory = path.dirname(report.deck.path);
        for (const relativeAssetPath of fixture.expectedCopiedAssets) {
            assert(fs.existsSync(path.join(preparedDeckDirectory, relativeAssetPath)), `${fixture.id}: prepared workspace is missing ${relativeAssetPath}`);
        }
        assert(!fs.existsSync(path.join(preparedDeckDirectory, 'outside.svg')), `${fixture.id}: prepared workspace copied an out-of-scope asset`);
        assert(!fs.existsSync(path.join(preparedDeckDirectory, 'outside.css')), `${fixture.id}: prepared workspace copied an out-of-scope imported stylesheet`);
        assertNoRejectedCssReferences(fixture.id, preparedDeckDirectory, 'prepared workspace');
    }
    if (fixture.expectedExportAssets) {
        const outputDirectory = fs.statSync(report.output.path).isDirectory()
            ? report.output.path
            : path.dirname(report.output.path);
        for (const relativeAssetPath of fixture.expectedExportAssets) {
            assert(fs.existsSync(path.join(outputDirectory, relativeAssetPath)), `${fixture.id}: final export is missing ${relativeAssetPath}`);
        }
        assert(!fs.existsSync(path.join(outputDirectory, 'outside.svg')), `${fixture.id}: final export copied an out-of-scope asset`);
        assert(!fs.existsSync(path.join(outputDirectory, 'outside.css')), `${fixture.id}: final export copied an out-of-scope imported stylesheet`);
        assertNoRejectedCssReferences(fixture.id, outputDirectory, 'final export');
    }
    if (fixture.expectUltraWideTableSplit) {
        assert(!deckMarkdown.includes('| Capability | Trigger | Boundary | Evidence | Fallback | User surface | Owner | Replay command | Regression risk | Gate |'), `${fixture.id}: ultra-wide table survived unsplit`);
        assert((deckMarkdown.match(/Ultra Wide Contract Matrix/g) || []).length > 1, `${fixture.id}: ultra-wide table did not produce continuation slides`);
    }
}

function assertNoRejectedCssReferences(fixtureId, directoryPath, label) {
    for (const cssFilePath of listCssFiles(directoryPath)) {
        const cssText = fs.readFileSync(cssFilePath, 'utf8');
        assert(!cssText.includes('outside.css'), `${fixtureId}: ${label} CSS still references outside.css in ${path.relative(directoryPath, cssFilePath)}`);
        assert(!cssText.includes('outside.svg'), `${fixtureId}: ${label} CSS still references outside.svg in ${path.relative(directoryPath, cssFilePath)}`);
    }
}

function countTransformWrappers(deckMarkdown) {
    return (deckMarkdown.match(/<Transform :scale=/g) || []).length;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listCssFiles(directoryPath) {
    const files = [];
    const pending = [directoryPath];
    while (pending.length > 0) {
        const current = pending.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const entryPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                pending.push(entryPath);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith('.css')) {
                files.push(entryPath);
            }
        }
    }
    return files;
}

function assertLowZoomOnlyTargetsMermaid(fixtureId, deckMarkdown) {
    const slides = splitDeckSlides(deckMarkdown);
    slides.forEach((slide, index) => {
        const zoom = readSlideZoom(slide);
        if (zoom === null || zoom >= LOW_ZOOM_FLOOR_FOR_PRIMARY_CONTENT) {
            return;
        }
        const hasMermaid = /```mermaid/i.test(slide);
        const slideLines = extractSlideBodyLines(slide);
        const hasPrimaryNonMermaid = containsMarkdownTableOutsideFence(slideLines) || containsNonMermaidFence(slideLines);
        assert(
            hasMermaid && !hasPrimaryNonMermaid && !containsPrimaryNonMermaidContentOutsideFence(slideLines),
            `${fixtureId}: slide ${index + 1} uses low zoom ${zoom} outside Mermaid-only content`
        );
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

function containsPrimaryNonMermaidContentOutsideFence(lines) {
    let skippedHeading = false;
    return hasOutsideFenceLine(lines, line => {
        const trimmed = line.trim();
        if (!trimmed || /^<!--.*-->$/.test(trimmed)) {
            return false;
        }
        if (!skippedHeading && /^#{1,6}\s+\S/.test(trimmed)) {
            skippedHeading = true;
            return false;
        }
        return true;
    });
}

function extractSlideBodyLines(slideMarkdown) {
    const lines = slideMarkdown.split(/\r?\n/);
    const firstContentLine = lines.findIndex(line => line.trim().length > 0);
    if (firstContentLine < 0) {
        return [];
    }

    if (lines[firstContentLine].trim() === '---') {
        const closingIndex = lines.findIndex((line, index) => index > firstContentLine && line.trim() === '---');
        return closingIndex > firstContentLine ? lines.slice(closingIndex + 1) : lines;
    }

    if (/^[A-Za-z][\w-]*\s*:/.test(lines[firstContentLine].trim())) {
        const closingIndex = lines.findIndex((line, index) => index > firstContentLine && line.trim() === '---');
        return closingIndex > firstContentLine ? lines.slice(closingIndex + 1) : lines;
    }

    return lines;
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
    return extractMermaidFenceBlocks(markdown).length;
}

function countFenceOpeners(markdown, language) {
    const pattern = new RegExp('```\\s*' + language + '(?:\\s|\\n|$)', 'gi');
    return (markdown.match(pattern) || []).length;
}

function assertMermaidFencesUnchanged(fixtureId, sourceFences, deckFences) {
    assert(deckFences.length === sourceFences.length, `${fixtureId}: exported Mermaid fence count changed`);
    for (let index = 0; index < sourceFences.length; index++) {
        assert(
            deckFences[index] === sourceFences[index],
            `${fixtureId}: Mermaid fence ${index + 1} changed; source Mermaid diagrams must stay byte-stable`
        );
    }
}

function extractMermaidFenceBlocks(markdown) {
    const lines = markdown.split(/\r?\n/);
    const fences = [];
    let activeFence = null;

    for (const line of lines) {
        if (!activeFence) {
            const openingMatch = line.trim().match(/^(```+|~~~+)\s*mermaid(?:\s+\{[^}]+\})?\s*$/i);
            if (openingMatch) {
                activeFence = {
                    marker: openingMatch[1],
                    lines: [line],
                };
            }
            continue;
        }

        activeFence.lines.push(line);
        if (isClosingFenceLine(line, activeFence.marker)) {
            fences.push(activeFence.lines.join('\n'));
            activeFence = null;
        }
    }

    return fences;
}

function isClosingFenceLine(line, openingMarker) {
    const markerCharacter = openingMarker[0];
    const markerCount = openingMarker.length;
    const escapedMarker = escapeRegExp(markerCharacter);
    return new RegExp(`^${escapedMarker}{${markerCount},}\\s*$`).test(line.trim());
}

function copyFixtureEvidence(archiveRoot, fixture, report, sourcePath) {
    const fixtureArchive = path.join(path.resolve(archiveRoot), fixture.id);
    fs.rmSync(fixtureArchive, { recursive: true, force: true });
    fs.mkdirSync(fixtureArchive, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(fixtureArchive, path.basename(sourcePath)));
    fs.writeFileSync(path.join(fixtureArchive, 'report.json'), JSON.stringify(report, null, 2));
    if (report.deck?.path && fs.existsSync(report.deck.path)) {
        fs.copyFileSync(report.deck.path, path.join(fixtureArchive, path.basename(report.deck.path)));
        fs.cpSync(path.dirname(report.deck.path), path.join(fixtureArchive, 'prepared-deck'), {
            recursive: true,
            filter: sourcePath => !sourcePath.split(path.sep).includes('node_modules'),
        });
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
            for (const file of fixture.files ?? []) {
                const targetFile = path.join(vaultRoot, file.path);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true });
                fs.writeFileSync(targetFile, file.content, 'utf8');
            }
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
