import * as fs from 'fs';
import * as path from 'path';

const matter = require('../../website/node_modules/gray-matter');

type PublishedDocumentationLocale = {
    locale: string;
    htmlLang: string;
    englishName: string;
};

function loadPublishedLocaleContract(websiteRoot: string): {
    documentationLocales: PublishedDocumentationLocale[];
    languageScopeSentence: string;
} {
    const sourcePath = path.join(websiteRoot, 'src', 'lib', 'publishedLocales.mjs');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const runnableSource = source
        .replace(/\bexport const\b/g, 'const')
        .replace(/\bexport function\b/g, 'function');
    return new Function(`
        ${runnableSource}
        return {
            documentationLocales: publishedDocumentationLocales,
            languageScopeSentence: publishedLanguageScopeSentence(),
        };
    `)();
}

function markdownHeadings(content: string): string[] {
    const headings: string[] = [];
    let inFence = false;

    for (const line of content.split(/\r?\n/)) {
        if (line.trim().startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (inFence || !/^#{1,6} /.test(line)) {
            continue;
        }
        headings.push(line.replace(/^#+\s+/, '').trim());
    }

    return headings;
}

function markdownHeadingLevels(content: string): number[] {
    const levels: number[] = [];
    let inFence = false;

    for (const line of content.split(/\r?\n/)) {
        if (line.trim().startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (inFence) {
            continue;
        }
        const match = line.match(/^(#{1,6})\s+/);
        if (match) {
            levels.push(match[1].length);
        }
    }

    return levels;
}

function expectNoTrailingWhitespace(content: string, context: string): void {
    if (/[ \t]+$/m.test(content)) {
        throw new Error(`${context} contains trailing whitespace`);
    }
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
    const publishedLocaleContract = loadPublishedLocaleContract(websiteRoot);
    const localizedLocales = publishedLocaleContract.documentationLocales.map(({ locale }) => locale);
    const localizedFillerMarkers = [
        '这一部分解释产品行为',
        '這一部分說明產品行為',
        '製品の挙動',
        'comportement produit',
        'Produktverhalten',
        'comportamiento del producto',
        '제품 동작',
    ];
    const placeholderPollutionPattern = /NMDPH|NMDSEGMENT|@@\d+@@/;

    function listMdxFiles(root: string): string[] {
        return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
            const entryPath = path.join(root, entry.name);
            if (entry.isDirectory()) {
                return listMdxFiles(entryPath);
            }
            return entry.name.endsWith('.mdx') ? [entryPath] : [];
        });
    }

    function sourceDocPaths(): string[] {
        const docsRoot = path.join(websiteRoot, 'docs');
        return listMdxFiles(docsRoot)
            .map(filePath => path.relative(docsRoot, filePath).replace(/\\/g, '/'))
            .sort();
    }

    test('intro pages keep English and zh-CN content surfaces one-to-one', () => {
        expect(markdownHeadings(chineseIntro)).toHaveLength(markdownHeadings(englishIntro).length);

        expect(englishIntro).toContain('Diagram Capability Direction');
        expect(chineseIntro).toMatch(/图表.*方向/);
        expect(englishIntro).toContain('Notemd vs Other Obsidian AI Plugins');
        expect(chineseIntro).toContain('Notemd 与其他 Obsidian AI 插件对比');

        for (const content of [englishIntro, chineseIntro]) {
            expect(content).toContain('DiagramSpec');
            expect(content).toContain('circuitikz');
            expect(content).toContain('TikZJax');
            expect(content).toContain('Draw.io');
            expect(content).toContain('Drawnix');
        }
    });

    test('diagram pages document circuitikz as a constrained prototype in both languages', () => {
        expect(markdownHeadings(chineseDiagrams)).toHaveLength(markdownHeadings(englishDiagrams).length);
        expect(englishDiagrams).toContain('Current circuitikz Prototype');
        expect(chineseDiagrams).toMatch(/当前.*circuitikz.*原型/);

        const sharedDiagramContractTerms = [
            'circuitikz',
            'TikZJax',
            'CircuitSpec',
            'common-source-amplifier',
            'cmos-inverter-v1',
            'cmos-buffer',
            'cmos-buffer-v1',
            'cmos-transmission-gate',
            'cmos-transmission-gate-v1',
            'cmos-nand2',
            'cmos-nand2-v1',
            'cmos-nor2',
            'cmos-nor2-v1',
            'layoutHints.inputSide',
            'layoutHints.outputSide',
            '--compile-log',
            '--diagnostics-output',
            '--compile-executable',
            '--compile-arg',
            '--expected-artifact',
            '--expected-svg-text',
            '--topology-reference',
            '--repair-brief-output',
            '--repair-brief',
            'notemd.circuitikz.repair-brief.v1',
            'repairPrompt',
            'diagnosticFocus',
            'acceptanceCriteria',
            'topology-preserving-circuitikz-repair',
            'repairAcceptance',
            'notemd.circuitikz.repair-acceptance.v1',
            'readyForVisualAcceptance',
            'remainingChecks',
            '--repair-acceptance-output',
            'shell: false',
            'RenderArtifact.diagnostics',
            '.tex',
            '.tikz',
            '.drawio',
            '.drawnix',
            'Draw.io',
            'Drawnix',
            'mxfile',
            'mxGraphModel',
            'type: "drawnix"',
            'elements',
            'diagrams.net',
            'compileExecution',
            'compileExecution.renderSmoke',
            'render-svg-text-missing',
            'render-svg-text-path-only',
            'aria-label',
            '<title>',
            '<desc>',
            'render-svg-out-of-bounds',
            'render-svg-text-overlap',
            'render-svg-label-overlap',
            'render-svg-path-glyph-overlap',
            'pathOnlyGlyphUseCount',
            'A/a',
            'C/S/Q/T',
            '<use href="#...">',
            'polyline',
            'polygon',
            'tspan',
            'text-anchor',
            'render-png-blank',
            'render-png-foreground-dense',
            'render-png-foreground-too-small',
            'render-png-content-clipped',
            'foregroundBounds',
            'foregroundDensity',
            'circuitikz.sty',
            'Golden Reference',
            'TikZJax Render',
            '\\usepackage{circuitikz}',
            'pmos',
            'nmos',
            'npm run diagram:export-artifact',
            'npm run diagram:export-circuitikz',
            'npm run diagram:smoke-circuitikz',
            'docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json',
            'docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json',
            'docs/maintainer/fixtures/circuitikz/cmos-buffer-v1.json',
            'docs/maintainer/fixtures/circuitikz/cmos-transmission-gate-v1.json',
            'docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json',
            'docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json',
        ];

        for (const content of [englishDiagrams, chineseDiagrams]) {
            for (const term of sharedDiagramContractTerms) {
                expect(content).toContain(term);
            }
        }

        for (const englishPhrase of [
            'port placement',
            'TikZ path syntax',
            'runaway arguments',
            'diagnostic summary',
            'error/warning/info',
            'diagnostics-aware history entries',
            'source-only',
            'circuitikz source-only',
            'source-only preview boundary',
            'whiteboard host',
            'artifact diagnostics',
            'accessibility metadata',
            'transform-aware geometry',
            'label-vs-drawing',
            'path-only glyph placement',
            'path-only glyph overlap',
            'SVG number grammar',
            'leading-dot decimals',
            'explicit plus signs',
            'stroke-width-aware SVG bounds',
            'label overlap checks',
            'exact arc bounds',
            'exact Bezier curve bounds',
            'topology-preserving repair',
        ]) {
            expect(englishDiagrams).toContain(englishPhrase);
        }

        for (const chineseSemanticMarker of [
            '仅源代码',
            '拓扑',
            '诊断',
            '黄金参考',
            '保持拓扑结构',
        ]) {
            expect(chineseDiagrams).toContain(chineseSemanticMarker);
        }
    });

    test('published locale metadata covers the README and UI locale documentation matrix', () => {
        expect(localizedLocales).toEqual([
            'zh-CN',
            'zh-Hant',
            'zh-TW',
            'ja',
            'fr',
            'de',
            'es',
            'ko',
            'it',
            'pt',
            'pt-BR',
            'ru',
            'ar',
            'fa',
            'hi',
            'bn',
            'nl',
            'sv',
            'fi',
            'da',
            'no',
            'pl',
            'tr',
            'he',
            'th',
            'el',
            'cs',
            'hu',
            'ro',
            'uk',
            'vi',
            'id',
            'ms',
        ]);
        expect(publishedLocaleContract.languageScopeSentence)
            .toContain('Traditional Chinese for Taiwan');
        expect(publishedLocaleContract.languageScopeSentence)
            .toContain('Brazilian Portuguese');
        expect(publishedLocaleContract.languageScopeSentence)
            .toContain('Malay');
    });

    test('all published documentation locales mirror the English docs route set', () => {
        const expectedSourceDocs = sourceDocPaths();

        for (const locale of localizedLocales) {
            const localeRoot = path.join(
                websiteRoot,
                'i18n',
                locale,
                'docusaurus-plugin-content-docs',
                'current'
            );
            const actualSourceDocs = listMdxFiles(localeRoot)
                .map(filePath => path.relative(localeRoot, filePath).replace(/\\/g, '/'))
                .sort();
            expect(actualSourceDocs).toEqual(expectedSourceDocs);
        }
    });

    test('all localized docs mirror English heading structure without generated filler or placeholder leakage', () => {
        const docsRoot = path.join(websiteRoot, 'docs');

        for (const sourcePath of sourceDocPaths()) {
            const englishContent = fs.readFileSync(path.join(docsRoot, sourcePath), 'utf8');
            const expectedHeadingLevels = markdownHeadingLevels(englishContent);
            expectNoTrailingWhitespace(englishContent, `English source doc ${sourcePath}`);

            for (const locale of localizedLocales) {
                const localizedPath = path.join(
                    websiteRoot,
                    'i18n',
                    locale,
                    'docusaurus-plugin-content-docs',
                    'current',
                    sourcePath
                );
                const localizedContent = fs.readFileSync(localizedPath, 'utf8');

                expect(() => matter(localizedContent)).not.toThrow();
                expect(markdownHeadingLevels(localizedContent)).toEqual(expectedHeadingLevels);
                expect(localizedContent).not.toMatch(placeholderPollutionPattern);
                expectNoTrailingWhitespace(localizedContent, `${locale} source doc ${sourcePath}`);
                for (const marker of localizedFillerMarkers) {
                    expect(localizedContent).not.toContain(marker);
                }
            }
        }
    });

    test('zh-CN scope publishes the full docs route set and localized sidebar labels', () => {
        expect(chineseDocsPluginMessages['sidebar.tutorialSidebar.category.Advanced'].message)
            .toBe('高级');
        expect(chineseDocsPluginMessages['sidebar.tutorialSidebar.category.Getting Started'].message)
            .toBe('入门');

        for (const sourcePath of sourceDocPaths()) {
            const routePath = `/docs/${sourcePath.replace(/\.mdx$/, '')}`;
            expect(fs.existsSync(
                path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current', sourcePath)
            )).toBe(true);
            expect(publishedLanguageScope).toContain(`path: '${routePath}'`);
            expect(publishedLanguageScope).toContain(`sourcePath: '${sourcePath}'`);
        }
    });

    test('zh-CN visible titles and headings do not keep stale English documentation labels', () => {
        const staleHeadingMarkers = [
            /^title:\s+(Getting Started|Quick Start|Configuration|LLM Providers|Advanced)$/m,
            /^#{1,4}\s+(Getting Started|Intent Detection|Usage|Generate a Diagram|Preview a Diagram)$/m,
            /^#{1,4}\s+(Rendering Backends|Provider Categories|Cloud Providers|Local Providers)$/m,
            /^#{1,4}\s+(API Call Architecture|Transport Layers|Retry Logic|Response Caching|Model Discovery)$/m,
            /^#{1,4}\s+(Current Progress And Next Phases|Golden Reference Prompt Shape|Endpoint And Authentication)$/m,
        ];

        const zhRoot = path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current');
        for (const filePath of listMdxFiles(zhRoot)) {
            const content = fs.readFileSync(filePath, 'utf8');
            for (const marker of staleHeadingMarkers) {
                expect(content).not.toMatch(marker);
            }
        }
    });

    test('non-Chinese website locales do not reuse Simplified Chinese Docusaurus chrome', () => {
        const simplifiedChineseChromeMarkers = [
            '编辑此页',
            '最后更新于',
            '下一页',
            '上一页',
            '搜索',
            '跳到主要内容',
            '复制成功',
            '回到顶部',
        ];

        for (const locale of localizedLocales.filter(locale => locale !== 'zh-CN')) {
            const codeJsonPath = path.join(websiteRoot, 'i18n', locale, 'code.json');
            expect(fs.existsSync(codeJsonPath)).toBe(true);
            const codeJson = fs.readFileSync(codeJsonPath, 'utf8');
            for (const marker of simplifiedChineseChromeMarkers) {
                expect(codeJson).not.toContain(marker);
            }
        }
    });
});
