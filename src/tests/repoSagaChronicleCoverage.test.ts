import * as fs from 'fs';
import * as path from 'path';

const ROOT_README_PATTERN = /^README(?:_([^.]+))?\.md$/i;

function readRootReadmes(repoRoot: string): Array<{ fileName: string; locale: string }> {
    return fs
        .readdirSync(repoRoot)
        .filter((entry) => ROOT_README_PATTERN.test(entry))
        .map((fileName) => ({
            fileName,
            locale: fileName.match(ROOT_README_PATTERN)?.[1] ?? 'en'
        }))
        .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

describe('repo-saga chronicle coverage', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const scriptPath = path.join(repoRoot, 'scripts', 'repo-saga', 'update-quarterly-saga.mjs');
    const outputDir = path.join(repoRoot, 'docs', 'repo-saga');

    test('keeps a localized chronicle SVG for every root README locale', () => {
        const readmes = readRootReadmes(repoRoot);

        expect(readmes.length).toBeGreaterThan(1);
        expect(fs.existsSync(path.join(outputDir, 'notemd-development-history.svg'))).toBe(true);

        for (const readme of readmes) {
            const readmePath = path.join(repoRoot, readme.fileName);
            const svgRelativePath = `./docs/repo-saga/notemd-development-history.${readme.locale}.svg`;
            const svgAbsolutePath = path.join(outputDir, `notemd-development-history.${readme.locale}.svg`);
            const source = fs.readFileSync(readmePath, 'utf8');

            expect(source).toContain('<!-- repo-chronicle:start -->');
            expect(source).toContain('<!-- repo-chronicle:end -->');
            expect(source).toContain(svgRelativePath);
            expect(fs.existsSync(svgAbsolutePath)).toBe(true);
        }
    });

    test('sync script stays aligned with the upstream locale overlay and quarter granularity', () => {
        const source = fs.readFileSync(scriptPath, 'utf8');

        expect(source).toContain('packages/renderer/src/manual-locales.ts');
        expect(source).toContain('"feat/timeline-granularity"');
        expect(source).toContain('"feat-locale-i18n"');
        expect(source).toContain('"--granularity"');
        expect(source).toContain('"quarter"');
        expect(source).toContain('repoRoot.split(path.sep).join("/")');
        expect(source).toContain('recloneSourceRepo(source);');
        expect(source).toContain('assertWithinRepoSagaCacheRoot');
        expect(source).toContain('non-fast-forward or stale local state');
        expect(source).toContain('let lastError = null;');
        expect(source).toContain('trying next fallback');
        expect(source).toContain('Could not execute repo-saga build command');
    });
});
