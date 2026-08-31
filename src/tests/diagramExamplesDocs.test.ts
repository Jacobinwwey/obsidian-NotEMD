import * as fs from 'fs';
import * as path from 'path';

const { loadExecutableDiagramExampleSummaries } = require('../../scripts/lib/diagram-examples-catalog') as {
    loadExecutableDiagramExampleSummaries: (repoRoot: string) => Promise<Array<{ typeId: string }>>;
};

describe('diagram examples documentation contract', () => {
    const repoRoot = process.cwd();
    const docsRoot = path.join(repoRoot, 'docs');

    test('provides bilingual README pages linking every executable type', async () => {
        const summaries = await loadExecutableDiagramExampleSummaries(repoRoot);
        const englishPath = path.join(docsRoot, 'diagram-examples', 'README.md');
        const chinesePath = path.join(docsRoot, 'diagram-examples', 'README.zh-CN.md');
        expect(fs.existsSync(englishPath)).toBe(true);
        expect(fs.existsSync(chinesePath)).toBe(true);

        const english = fs.readFileSync(englishPath, 'utf8');
        const chinese = fs.readFileSync(chinesePath, 'utf8');
        expect(english).toContain('./manifest.json');
        expect(chinese).toContain('./manifest.json');
        for (const summary of summaries) {
            expect(english).toContain(`./${summary.typeId}/`);
            expect(chinese).toContain(`./${summary.typeId}/`);
            const chineseInput = fs.readFileSync(
                path.join(docsRoot, 'diagram-examples', summary.typeId, 'input.zh-CN.md'),
                'utf8'
            );
            expect(chineseInput).not.toContain('Inspect this evidence first');
            expect(chineseInput).toContain('优先检查这条证据：');
        }
        expect(english).toContain('real-vault evidence');
        expect(chinese).toContain('真实 Vault 实测证据');
    });

    test('exposes the evidence tree from both index pages and VitePress navigation', () => {
        const englishIndex = fs.readFileSync(path.join(docsRoot, 'index.md'), 'utf8');
        const chineseIndex = fs.readFileSync(path.join(docsRoot, 'index.zh-CN.md'), 'utf8');
        const config = fs.readFileSync(path.join(docsRoot, '.vitepress', 'config.mts'), 'utf8');
        expect(englishIndex).toContain('./diagram-examples/README.md');
        expect(chineseIndex).toContain('./diagram-examples/README.zh-CN.md');
        expect(config).toContain("/diagram-examples/README");
        expect(config).toContain("/diagram-examples/README.zh-CN");
    });
});
