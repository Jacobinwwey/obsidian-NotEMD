import * as fs from 'fs';
import * as path from 'path';

describe('acknowledgments docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const marker = '<!-- notemd-acknowledgments -->';
    const rootLicenseTarget = './LICENSE';
    const websiteLicenseTarget = 'https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/LICENSE';
    const canonicalUrls = [
        'https://github.com/cloudy-liu/cloudy-tech-diagrams-skill',
        'https://github.com/plait-board/drawnix',
        'https://www.diagrams.net/',
        'https://github.com/teee32/repo-saga',
        'https://github.com/mermaid-js/mermaid',
        'https://vega.github.io/vega-lite/',
        'https://github.com/slidevjs/slidev',
        'https://github.com/circuitikz/circuitikz',
        'https://github.com/tectonic-typesetting/tectonic',
        'https://docusaurus.io',
    ];

    function rootReadmePaths(): string[] {
        return fs.readdirSync(repoRoot)
            .filter((fileName) => /^README(?:_[A-Za-z-]+(?:_[A-Za-z-]+)?)?\.md$/.test(fileName))
            .map((fileName) => path.join(repoRoot, fileName))
            .sort();
    }

    function publishedLocales(): string[] {
        const localeSource = fs.readFileSync(
            path.join(repoRoot, 'website', 'src', 'lib', 'publishedLocales.mjs'),
            'utf8',
        );

        return [...localeSource.matchAll(/locale:\s*'([^']+)'/g)].map(([, locale]) => locale);
    }

    function websiteIntroPath(locale: string): string {
        if (locale === 'en') {
            return path.join(repoRoot, 'website', 'docs', 'intro.mdx');
        }

        return path.join(
            repoRoot,
            'website',
            'i18n',
            locale,
            'docusaurus-plugin-content-docs',
            'current',
            'intro.mdx',
        );
    }

    function countOccurrences(content: string, value: string): number {
        return content.split(value).length - 1;
    }

    function acknowledgmentsSection(content: string): string {
        const sectionStart = content.indexOf(marker);
        const headingStart = content.indexOf('\n## ', sectionStart + marker.length);
        const nextHeading = content.indexOf('\n## ', headingStart + 1);

        return content.slice(sectionStart, nextHeading === -1 ? content.length : nextHeading);
    }

    function expectAcknowledgments(content: string, licenseTarget: string): void {
        expect(content).toContain(marker);
        expect(countOccurrences(content, marker)).toBe(1);
        for (const url of canonicalUrls) {
            expect(content).toContain(url);
        }
        expect(acknowledgmentsSection(content)).toContain(licenseTarget);
    }

    test('root multilingual READMEs keep acknowledgments before contributing guidance', () => {
        const readmePaths = rootReadmePaths();
        expect(readmePaths).toHaveLength(31);

        for (const readmePath of readmePaths) {
            const content = fs.readFileSync(readmePath, 'utf8');
            expectAcknowledgments(content, rootLicenseTarget);
            expect(content.indexOf(marker)).toBeLessThan(content.indexOf('./docs/maintainer/release-workflow'));
        }
    });

    test('published website intros keep acknowledgments before open-source contribution guidance', () => {
        const introPaths = publishedLocales().map(websiteIntroPath);
        expect(introPaths).toHaveLength(34);

        for (const introPath of introPaths) {
            const content = fs.readFileSync(introPath, 'utf8');
            expectAcknowledgments(content, websiteLicenseTarget);
            expect(content.indexOf(marker)).toBeLessThan(
                content.indexOf('https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/CONTRIBUTING.md'),
            );
        }
    });

    test('English acknowledgments state the project-boundary terms clearly', () => {
        const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
        const websiteIntro = fs.readFileSync(path.join(repoRoot, 'website', 'docs', 'intro.mdx'), 'utf8');

        for (const content of [readme, websiteIntro]) {
            expect(content).toContain('does not imply endorsement, affiliation, bundled code, or a claim of code reuse');
            expect(content).toContain('Notemd is independently maintained');
        }
    });
});
