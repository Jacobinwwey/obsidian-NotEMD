import * as fs from 'fs';
import * as path from 'path';

function markdownHeadings(content: string): string[] {
    return content
        .split(/\r?\n/)
        .filter(line => /^#{1,3} /.test(line))
        .map(line => line.replace(/^#+\s+/, '').trim());
}

describe('website documentation contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const websiteRoot = path.join(repoRoot, 'website');
    const englishIntro = fs.readFileSync(path.join(websiteRoot, 'docs', 'intro.mdx'), 'utf8');
    const chineseIntro = fs.readFileSync(
        path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current', 'intro.mdx'),
        'utf8'
    );
    const englishDiagrams = fs.readFileSync(path.join(websiteRoot, 'docs', 'features', 'diagrams.mdx'), 'utf8');
    const chineseDiagrams = fs.readFileSync(
        path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current', 'features', 'diagrams.mdx'),
        'utf8'
    );
    const publishedLanguageScope = fs.readFileSync(
        path.join(websiteRoot, 'src', 'lib', 'publishedLanguageScopeData.mjs'),
        'utf8'
    );
    const chineseDocsPluginMessages = JSON.parse(fs.readFileSync(
        path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current.json'),
        'utf8'
    ));

    test('intro pages keep English and zh-CN content surfaces one-to-one', () => {
        expect(markdownHeadings(chineseIntro)).toHaveLength(markdownHeadings(englishIntro).length);

        expect(englishIntro).toContain('Diagram Capability Direction');
        expect(chineseIntro).toContain('图表能力方向');

        for (const content of [englishIntro, chineseIntro]) {
            expect(content).toContain('DiagramSpec');
            expect(content).toContain('circuitikz');
            expect(content).toContain('TikZJax');
            expect(content).toContain('Draw.io');
            expect(content).toContain('Drawnix');
            expect(content).toContain('source-only');
            expect(content).toContain('Notemd vs Other Obsidian AI Plugins');
        }
    });

    test('diagram pages document circuitikz as a constrained prototype in both languages', () => {
        expect(markdownHeadings(chineseDiagrams)).toHaveLength(markdownHeadings(englishDiagrams).length);
        expect(englishDiagrams).toContain('Current circuitikz Prototype');
        expect(chineseDiagrams).toContain('当前 circuitikz 原型');

        for (const content of [englishDiagrams, chineseDiagrams]) {
            expect(content).toContain('circuitikz / TikZJax Direction');
            expect(content).toContain('Golden Reference Prompt Shape');
            expect(content).toContain('Current Progress And Next Phases');
            expect(content).toContain('CircuitSpec');
            expect(content).toContain('common-source-amplifier');
            expect(content).toContain('cmos-inverter-v1');
            expect(content).toContain('cmos-buffer');
            expect(content).toContain('cmos-buffer-v1');
            expect(content).toContain('cmos-transmission-gate');
            expect(content).toContain('cmos-transmission-gate-v1');
            expect(content).toContain('cmos-nand2');
            expect(content).toContain('cmos-nand2-v1');
            expect(content).toContain('cmos-nor2');
            expect(content).toContain('cmos-nor2-v1');
            expect(content).toContain('layoutHints.inputSide');
            expect(content).toContain('layoutHints.outputSide');
            expect(content).toContain('port placement');
            expect(content).toContain('--compile-log');
            expect(content).toContain('--diagnostics-output');
            expect(content).toContain('TikZ path syntax');
            expect(content).toContain('runaway arguments');
            expect(content).toContain('--compile-executable');
            expect(content).toContain('--compile-arg');
            expect(content).toContain('--expected-artifact');
            expect(content).toContain('--expected-svg-text');
            expect(content).toContain('--topology-reference');
            expect(content).toContain('--repair-brief-output');
            expect(content).toContain('--repair-brief');
            expect(content).toContain('notemd.circuitikz.repair-brief.v1');
            expect(content).toContain('repairPrompt');
            expect(content).toContain('diagnosticFocus');
            expect(content).toContain('acceptanceCriteria');
            expect(content).toContain('topology-preserving-circuitikz-repair');
            expect(content).toContain('repairAcceptance');
            expect(content).toContain('notemd.circuitikz.repair-acceptance.v1');
            expect(content).toContain('readyForVisualAcceptance');
            expect(content).toContain('remainingChecks');
            expect(content).toContain('--repair-acceptance-output');
            expect(content).toContain('shell: false');
            expect(content).toContain('RenderArtifact.diagnostics');
            expect(content).toContain('diagnostic summary');
            expect(content).toContain('error/warning/info');
            expect(content).toContain('diagnostics-aware history entries');
            expect(content).toContain('source-only');
            expect(content).toContain('.tex');
            expect(content).toContain('.tikz');
            expect(content).toContain('circuitikz source-only');
            expect(content).toContain('.drawio');
            expect(content).toContain('.drawnix');
            expect(content).toContain('Draw.io');
            expect(content).toContain('Drawnix');
            expect(content).toContain('source-only preview boundary');
            expect(content).toContain('mxfile');
            expect(content).toContain('mxGraphModel');
            expect(content).toContain('type: "drawnix"');
            expect(content).toContain('elements');
            expect(content).toContain('diagrams.net');
            expect(content).toContain('whiteboard host');
            expect(content).toContain('artifact diagnostics');
            expect(content).toContain('compileExecution');
            expect(content).toContain('compileExecution.renderSmoke');
            expect(content).toContain('render-svg-text-missing');
            expect(content).toContain('render-svg-text-path-only');
            expect(content).toContain('accessibility metadata');
            expect(content).toContain('aria-label');
            expect(content).toContain('<title>');
            expect(content).toContain('<desc>');
            expect(content).toContain('render-svg-out-of-bounds');
            expect(content).toContain('render-svg-text-overlap');
            expect(content).toContain('render-svg-label-overlap');
            expect(content).toContain('render-svg-path-glyph-overlap');
            expect(content).toContain('label-vs-drawing');
            expect(content).toContain('transform-aware geometry');
            expect(content).toContain('pathOnlyGlyphUseCount');
            expect(content).toContain('path-only glyph placement');
            expect(content).toContain('path-only glyph overlap');
            expect(content).toContain('SVG number grammar');
            expect(content).toContain('leading-dot decimals');
            expect(content).toContain('explicit plus signs');
            expect(content).toContain('stroke-width-aware SVG bounds');
            expect(content).toContain('label overlap checks');
            expect(content).toContain('exact arc bounds');
            expect(content).toContain('A/a arc extrema');
            expect(content).toContain('exact Bezier curve bounds');
            expect(content).toContain('C/S/Q/T curve extrema');
            expect(content).toContain('<use href="#...">');
            expect(content).toContain('polyline');
            expect(content).toContain('polygon');
            expect(content).toContain('tspan');
            expect(content).toContain('text-anchor');
            expect(content).toContain('render-png-blank');
            expect(content).toContain('render-png-foreground-dense');
            expect(content).toContain('render-png-foreground-too-small');
            expect(content).toContain('render-png-content-clipped');
            expect(content).toContain('foregroundBounds');
            expect(content).toContain('foregroundDensity');
            expect(content).toContain('circuitikz.sty');
            expect(content).toContain('Golden Reference Template');
            expect(content).toContain('TikZJax Render');
            expect(content).toContain('\\usepackage{circuitikz}');
            expect(content).toContain('pmos');
            expect(content).toContain('nmos');
            expect(content).toContain('npm run diagram:export-artifact');
            expect(content).toContain('npm run diagram:export-circuitikz');
            expect(content).toContain('npm run diagram:smoke-circuitikz');
            expect(content).toContain('topology-preserving repair');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/cmos-buffer-v1.json');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/cmos-transmission-gate-v1.json');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json');
            expect(content).toContain('docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json');
        }
    });

    test('zh-CN scope publishes the Advanced sidebar pages used by intro', () => {
        expect(chineseDocsPluginMessages['sidebar.tutorialSidebar.category.Advanced'].message)
            .toContain('Advanced');

        for (const [sourcePath, routePath] of [
            ['advanced/custom-prompts.mdx', '/docs/advanced/custom-prompts'],
            ['advanced/batch-processing.mdx', '/docs/advanced/batch-processing'],
            ['advanced/troubleshooting.mdx', '/docs/advanced/troubleshooting']
        ]) {
            expect(fs.existsSync(
                path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current', sourcePath)
            )).toBe(true);
            expect(publishedLanguageScope).toContain(`path: '${routePath}'`);
            expect(publishedLanguageScope).toContain(`sourcePath: '${sourcePath}'`);
        }
    });
});
