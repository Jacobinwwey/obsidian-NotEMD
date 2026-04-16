import * as fs from 'fs';
import * as path from 'path';

function walkMarkdownFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walkMarkdownFiles(fullPath);
        }

        return entry.name.endsWith('.md') ? [fullPath] : [];
    });
}

function hasPairedLanguageVariant(relativePath: string, repoRoot: string): boolean {
    const fileName = path.basename(relativePath);
    const dirName = path.dirname(relativePath);
    const absoluteDir = path.join(repoRoot, dirName);

    const pairedCandidates = new Set<string>();

    if (fileName.endsWith('_zh.md')) {
        pairedCandidates.add(fileName.replace(/_zh\.md$/, '.md'));
        pairedCandidates.add(fileName.replace(/_zh\.md$/, '.en.md'));
    } else if (fileName.endsWith('.zh-CN.md')) {
        pairedCandidates.add(fileName.replace(/\.zh-CN\.md$/, '.md'));
        pairedCandidates.add(fileName.replace(/\.zh-CN\.md$/, '.en.md'));
    } else if (fileName.endsWith('.en.md')) {
        pairedCandidates.add(fileName.replace(/\.en\.md$/, '.md'));
        pairedCandidates.add(fileName.replace(/\.en\.md$/, '.zh-CN.md'));
    } else if (fileName.endsWith('.md')) {
        const stem = fileName.slice(0, -3);
        pairedCandidates.add(`${stem}_zh.md`);
        pairedCandidates.add(`${stem}.zh-CN.md`);
        pairedCandidates.add(`${stem}.en.md`);
    }

    for (const candidate of pairedCandidates) {
        if (fs.existsSync(path.join(absoluteDir, candidate))) {
            return true;
        }
    }

    return false;
}

describe('docs bilingual support contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const markdownDocs = [
        path.join(repoRoot, 'README.md'),
        path.join(repoRoot, 'README_zh.md'),
        ...walkMarkdownFiles(path.join(repoRoot, 'docs'))
    ].sort();

    test.each(markdownDocs.map((absolutePath) => path.relative(repoRoot, absolutePath)))(
        '%s provides English and Chinese documentation coverage',
        (relativePath) => {
            const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
            const hasLanguagePair = hasPairedLanguageVariant(relativePath, repoRoot);

            expect(hasLanguagePair).toBe(true);
            expect(content.includes('## English Summary')).toBe(false);
            expect(content.includes('## 中文摘要')).toBe(false);
            expect(content.includes('## English') && content.includes('## 中文')).toBe(false);
        }
    );
});
