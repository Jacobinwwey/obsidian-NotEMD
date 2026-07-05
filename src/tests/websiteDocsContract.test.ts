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
            expect(content).toContain('--compile-log');
            expect(content).toContain('--diagnostics-output');
            expect(content).toContain('--compile-executable');
            expect(content).toContain('--compile-arg');
            expect(content).toContain('--expected-artifact');
            expect(content).toContain('shell: false');
            expect(content).toContain('compileExecution');
            expect(content).toContain('compileExecution.renderSmoke');
            expect(content).toContain('circuitikz.sty');
            expect(content).toContain('Golden Reference Template');
            expect(content).toContain('TikZJax Render');
            expect(content).toContain('\\usepackage{circuitikz}');
            expect(content).toContain('pmos');
            expect(content).toContain('nmos');
            expect(content).toContain('npm run diagram:export-artifact');
            expect(content).toContain('npm run diagram:export-circuitikz');
        }
    });

    test('zh-CN scope publishes the Advanced sidebar pages used by intro', () => {
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
