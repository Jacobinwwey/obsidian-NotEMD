import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..', '..');

function getReadmeMdVersion(): string {
    const content = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const match = content.match(/\*Notemd v(\d+\.\d+\.\d+)/);
    if (!match) throw new Error('Version not found in README.md');
    return match[1];
}

function getReadmeMdSponsorLink(): string {
    const content = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const starMatch = content.match(/\[.*Give a Star.*\]\((https:\/\/github\.com\/[^)]+)\)/);
    const coffeeMatch = content.match(/\[.*Buy Me a Coffee.*\]\((https:\/\/ko-fi\.com\/[^)]+)\)/);
    if (!starMatch || !coffeeMatch) throw new Error('Sponsor links not found in README.md');
    return `${starMatch[1]}|${coffeeMatch[1]}`;
}

describe('README i18n alignment', () => {
    const expectedVersion = getReadmeMdVersion();
    const expectedSponsorLinks = getReadmeMdSponsorLink();

    const i18nReadmes = fs.readdirSync(repoRoot)
        .filter(f => f.startsWith('README_') && f.endsWith('.md'))
        .sort();

    test.each(i18nReadmes)('%s version matches README.md (%s)', (filename) => {
        const content = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
        expect(content).toContain(expectedVersion);
    });

    test.each(i18nReadmes)('%s has sponsor line', (filename) => {
        const content = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
        expect(content).toMatch(/Give a Star on GitHub|给 GitHub 加星|給 GitHub 加星|ko-fi\.com\/jacobinwwey/);
    });

    test.each(i18nReadmes)('%s has ko-fi link', (filename) => {
        const content = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
        expect(content).toContain('https://ko-fi.com/jacobinwwey');
    });

    test.each(i18nReadmes)('%s has GitHub repo link in sponsor', (filename) => {
        const content = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
        expect(content).toMatch(/https:\/\/github\.com\/Jacobinwwey\/obsidian-NotEMD/);
    });

    test('all README files count >= 31', () => {
        expect(i18nReadmes.length).toBeGreaterThanOrEqual(30);
    });
});
