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

    test('diagram pages explain diagram types, editable sources, and visual exports in both languages', () => {
        expect(markdownHeadings(chineseDiagrams)).toHaveLength(markdownHeadings(englishDiagrams).length);
        expect(englishDiagrams).toContain('Understand the three choices');
        expect(chineseDiagrams).toContain('理解三个不同选择');

        for (const content of [englishDiagrams, chineseDiagrams]) {
            for (const term of ['Draw.io', 'Drawnix', 'CircuitikZ', '.drawio', '.drawnix', '.tex', 'SVG', 'PNG', 'PDF']) {
                expect(content).toContain(term);
            }
            for (const maintainerOnlyTerm of [
                'preferredDiagramRenderTarget',
                'cmos-inverter-v1',
                '--compile-executable',
                'Golden Reference Prompt Shape',
                'RenderArtifact.diagnostics',
                'layoutHints.inputSide',
            ]) {
                expect(content).not.toContain(maintainerOnlyTerm);
            }
        }

        expect(englishDiagrams).toContain('Draw.io and Drawnix are **source formats**, not diagram types.');
        expect(englishDiagrams).toContain('Current CircuitikZ support is intentionally constrained.');
        expect(englishDiagrams).toContain('Save source file');
        expect(chineseDiagrams).toContain('Draw.io 和 Drawnix 是**源格式**，不是图表类型。');
        expect(chineseDiagrams).toContain('当前 CircuitikZ 支持有意保持受约束范围。');
        expect(chineseDiagrams).toContain('保存源文件');
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
