import * as fs from 'fs';
import * as path from 'path';

describe('circuitikz export docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const englishDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'maintainer', 'circuitikz-export-prototype.md'),
        'utf8'
    );
    const chineseDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'maintainer', 'circuitikz-export-prototype.zh-CN.md'),
        'utf8'
    );
    const progressDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-07-04-diagram-reference-integration-and-figure-generation-plan.md'),
        'utf8'
    );
    const progressDocZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md'),
        'utf8'
    );
    const roadmapDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'maintainer', 'circuitikz-figure-generation-roadmap.md'),
        'utf8'
    );
    const roadmapDocZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'maintainer', 'circuitikz-figure-generation-roadmap.zh-CN.md'),
        'utf8'
    );

    test('documents the CLI contract, supported families, and explicit non-goals in both languages', () => {
        for (const doc of [englishDoc, chineseDoc]) {
            expect(doc).toContain('scripts/export-circuitikz.js');
            expect(doc).toContain('scripts/run-circuitikz-smoke-fixtures.js');
            expect(doc).toContain('npm run diagram:export-circuitikz');
            expect(doc).toContain('npm run diagram:smoke-circuitikz');
            expect(doc).toContain('CircuitSpec');
            expect(doc).toContain('common-source-amplifier');
            expect(doc).toContain('common-source-nmos-v1');
            expect(doc).toContain('cmos-inverter');
            expect(doc).toContain('cmos-inverter-v1');
            expect(doc).toContain('cmos-nand2');
            expect(doc).toContain('cmos-nand2-v1');
            expect(doc).toContain('cmos-nor2');
            expect(doc).toContain('cmos-nor2-v1');
            expect(doc).toContain('layoutHints.inputSide');
            expect(doc).toContain('layoutHints.outputSide');
            expect(doc).toContain('port placement');
            expect(doc).toContain('docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json');
            expect(doc).toContain('docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json');
            expect(doc).toContain('docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json');
            expect(doc).toContain('docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json');
            expect(doc).toContain('UTF-8');
            expect(doc).toContain('BOM');
            expect(doc).toContain('--compile-log');
            expect(doc).toContain('--diagnostics-output');
            expect(doc).toContain('--compile-executable');
            expect(doc).toContain('--compile-arg');
            expect(doc).toContain('--expected-artifact');
            expect(doc).toContain('--expected-svg-text');
            expect(doc).toContain('--topology-reference');
            expect(doc).toContain('--repair-brief-output');
            expect(doc).toContain('--repair-brief');
            expect(doc).toContain('notemd.circuitikz.repair-brief.v1');
            expect(doc).toContain('repairPrompt');
            expect(doc).toContain('diagnosticFocus');
            expect(doc).toContain('acceptanceCriteria');
            expect(doc).toContain('topology-preserving-circuitikz-repair');
            expect(doc).toContain('repairAcceptance');
            expect(doc).toContain('notemd.circuitikz.repair-acceptance.v1');
            expect(doc).toContain('readyForVisualAcceptance');
            expect(doc).toContain('remainingChecks');
            expect(doc).toContain('--repair-acceptance-output');
            expect(doc).toContain('compileExecution.renderSmoke');
            expect(doc).toContain('createCircuitTopologySignature');
            expect(doc).toContain('assertCircuitTopologyUnchanged');
            expect(doc).toContain('render-artifact-missing');
            expect(doc).toContain('render-svg-text-missing');
            expect(doc).toContain('render-svg-text-path-only');
            expect(doc).toContain('accessibility metadata');
            expect(doc).toContain('aria-label');
            expect(doc).toContain('<title>');
            expect(doc).toContain('<desc>');
            expect(doc).toContain('render-svg-out-of-bounds');
            expect(doc).toContain('render-svg-text-overlap');
            expect(doc).toContain('render-svg-label-overlap');
            expect(doc).toContain('render-svg-path-glyph-overlap');
            expect(doc).toContain('label-vs-drawing');
            expect(doc).toContain('transform-aware geometry');
            expect(doc).toContain('pathOnlyGlyphUseCount');
            expect(doc).toContain('path-only glyph placement');
            expect(doc).toContain('accessibility metadata');
            expect(doc).toContain('aria-label');
            expect(doc).toContain('<title>');
            expect(doc).toContain('<desc>');
            expect(doc).toContain('path-only glyph overlap');
            expect(doc).toContain('SVG number grammar');
            expect(doc).toContain('leading-dot decimals');
            expect(doc).toContain('explicit plus signs');
            expect(doc).toContain('stroke-width-aware SVG bounds');
            expect(doc).toContain('label overlap checks');
            expect(doc).toContain('exact arc bounds');
            expect(doc).toContain('A/a arc extrema');
            expect(doc).toContain('exact Bezier curve bounds');
            expect(doc).toContain('C/S/Q/T curve extrema');
            expect(doc).toContain('<use href="#...">');
            expect(doc).toContain('polyline');
            expect(doc).toContain('polygon');
            expect(doc).toContain('tspan');
            expect(doc).toContain('text-anchor');
            expect(doc).toContain('render-png-blank');
            expect(doc).toContain('render-png-foreground-dense');
            expect(doc).toContain('render-png-content-clipped');
            expect(doc).toContain('foregroundBounds');
            expect(doc).toContain('foregroundDensity');
            expect(doc).toContain('circuitikzDiagnostics.ts');
            expect(doc).toContain('circuitikzCompileRunner.ts');
            expect(doc).toContain('circuitikzRenderSmoke.ts');
            expect(doc).toContain('src/tests/circuitikzExporter.test.ts');
            expect(doc).toContain('src/tests/circuitikzCompileDiagnostics.test.ts');
            expect(doc).toContain('src/tests/circuitikzRenderSmoke.test.ts');
            expect(doc).toContain('src/tests/circuitikzCompileRunner.test.ts');
            expect(doc).toContain('src/tests/circuitikzExportCli.test.ts');
            expect(doc).toContain('src/tests/circuitikzSmokeFixturesCli.test.ts');
        }

        expect(englishDoc).toContain('This is not a generic TikZ generator.');
        expect(chineseDoc).toContain('这不是通用 TikZ 生成器。');
    });

    test('records Phase F implementation status in the bilingual progress plan', () => {
        for (const doc of [progressDoc, progressDocZh]) {
            expect(doc).toContain('Phase F');
            expect(doc).toContain('CircuitSpec -> circuitikz');
            expect(doc).toContain('cmos-nand2');
            expect(doc).toContain('cmos-nand2-v1');
            expect(doc).toContain('cmos-nor2');
            expect(doc).toContain('cmos-nor2-v1');
            expect(doc).toContain('layoutHints.inputSide');
            expect(doc).toContain('layoutHints.outputSide');
            expect(doc).toContain('port placement');
            expect(doc).toContain('scripts/export-circuitikz.js');
            expect(doc).toContain('scripts/run-circuitikz-smoke-fixtures.js');
            expect(doc).toContain('npm run diagram:export-circuitikz');
            expect(doc).toContain('npm run diagram:smoke-circuitikz');
            expect(doc).toContain('src/tests/circuitikzExporter.test.ts');
            expect(doc).toContain('src/tests/circuitikzCompileDiagnostics.test.ts');
            expect(doc).toContain('src/tests/circuitikzRenderSmoke.test.ts');
            expect(doc).toContain('src/tests/circuitikzCompileRunner.test.ts');
            expect(doc).toContain('src/tests/circuitikzExportCli.test.ts');
            expect(doc).toContain('src/tests/diagramPreview.test.ts');
            expect(doc).toContain('src/tests/circuitikzSmokeFixturesCli.test.ts');
            expect(doc).toContain('compile-log diagnostics');
            expect(doc).toContain('shell-free compile execution');
            expect(doc).toContain('topology-preserving repair');
            expect(doc).toContain('--topology-reference');
            expect(doc).toContain('--repair-brief-output');
            expect(doc).toContain('--repair-brief');
            expect(doc).toContain('notemd.circuitikz.repair-brief.v1');
            expect(doc).toContain('repairPrompt');
            expect(doc).toContain('diagnosticFocus');
            expect(doc).toContain('acceptanceCriteria');
            expect(doc).toContain('topology-preserving-circuitikz-repair');
            expect(doc).toContain('repairAcceptance');
            expect(doc).toContain('notemd.circuitikz.repair-acceptance.v1');
            expect(doc).toContain('readyForVisualAcceptance');
            expect(doc).toContain('remainingChecks');
            expect(doc).toContain('--repair-acceptance-output');
            expect(doc).toContain('render-smoke artifact');
            expect(doc).toContain('maintainer fixture');
            expect(doc).toContain('--expected-svg-text');
            expect(doc).toContain('PNG');
            expect(doc).toContain('render-png-foreground-dense');
            expect(doc).toContain('render-png-content-clipped');
            expect(doc).toContain('foregroundBounds');
            expect(doc).toContain('foregroundDensity');
            expect(doc).toContain('bounded');
            expect(doc).toContain('text-overlap');
            expect(doc).toContain('render-svg-label-overlap');
            expect(doc).toContain('render-svg-path-glyph-overlap');
            expect(doc).toContain('label-vs-drawing');
            expect(doc).toContain('transform-aware geometry');
            expect(doc).toContain('path-only glyph placement');
            expect(doc).toContain('path-only glyph overlap');
            expect(doc).toContain('SVG number grammar');
            expect(doc).toContain('leading-dot decimals');
            expect(doc).toContain('explicit plus signs');
            expect(doc).toContain('stroke-width-aware SVG bounds');
            expect(doc).toContain('label overlap checks');
            expect(doc).toContain('exact arc bounds');
            expect(doc).toContain('A/a arc extrema');
            expect(doc).toContain('exact Bezier curve bounds');
            expect(doc).toContain('C/S/Q/T curve extrema');
            expect(doc).toContain('polyline');
            expect(doc).toContain('polygon');
            expect(doc).toContain('tspan');
            expect(doc).toContain('text-anchor');
            expect(doc).toContain('RenderArtifact.diagnostics');
            expect(doc).toContain('diagnostic summary');
            expect(doc).toContain('src/rendering/diagnostics.ts');
            expect(doc).toContain('source-only preview fallback');
            expect(doc).toContain('DiagramPreviewModal.ts');
            expect(doc).toContain('src/tests/renderArtifactDiagnostics.test.ts');
            expect(doc).toContain('TikZJax/LaTeX');
            expect(doc).toContain('screenshot');
        }

        expect(progressDoc).toContain('Current Architecture Progress Audit');
        expect(progressDoc).toContain('Keep model output semantic instead of free-form renderer text');
        expect(progressDoc).toContain('Make renderer execution cross-platform');
        expect(progressDoc).toContain('Verify circuit output before visual repair');

        expect(progressDocZh).toContain('当前架构推进审计');
        expect(progressDocZh).toContain('保持模型输出为语义层');
        expect(progressDocZh).toContain('renderer 执行必须跨平台');
        expect(progressDocZh).toContain('视觉修复前必须先验证电路输出');
    });

    test('records SVG exact arc smoke coverage in the bilingual roadmap', () => {
        for (const doc of [roadmapDoc, roadmapDocZh]) {
            expect(doc).toContain('circuitikzRenderSmoke.ts');
            expect(doc).toContain('circuitikzRepairBrief.ts');
            expect(doc).toContain('cmos-nand2');
            expect(doc).toContain('cmos-nand2-v1');
            expect(doc).toContain('cmos-nor2');
            expect(doc).toContain('cmos-nor2-v1');
            expect(doc).toContain('layoutHints.inputSide');
            expect(doc).toContain('layoutHints.outputSide');
            expect(doc).toContain('port placement');
            expect(doc).toContain('--repair-brief-output');
            expect(doc).toContain('--repair-brief');
            expect(doc).toContain('notemd.circuitikz.repair-brief.v1');
            expect(doc).toContain('repairPrompt');
            expect(doc).toContain('diagnosticFocus');
            expect(doc).toContain('acceptanceCriteria');
            expect(doc).toContain('topology-preserving-circuitikz-repair');
            expect(doc).toContain('repairAcceptance');
            expect(doc).toContain('notemd.circuitikz.repair-acceptance.v1');
            expect(doc).toContain('readyForVisualAcceptance');
            expect(doc).toContain('remainingChecks');
            expect(doc).toContain('--repair-acceptance-output');
            expect(doc).toContain('SVG number grammar');
            expect(doc).toContain('leading-dot decimals');
            expect(doc).toContain('explicit plus signs');
            expect(doc).toContain('exact arc bounds');
            expect(doc).toContain('A/a arc extrema');
            expect(doc).toContain('exact Bezier curve bounds');
            expect(doc).toContain('C/S/Q/T curve extrema');
            expect(doc).toContain('stroke-width-aware SVG bounds');
            expect(doc).toContain('label overlap checks');
            expect(doc).toContain('path-only glyph overlap diagnostics');
            expect(doc).toContain('accessibility metadata');
            expect(doc).toContain('aria-label');
            expect(doc).toContain('<title>');
            expect(doc).toContain('<desc>');
            expect(doc).toContain('polyline');
            expect(doc).toContain('polygon');
            expect(doc).toContain('positioned `tspan` label geometry');
            expect(doc).toContain('text-anchor');
        }
    });
});
