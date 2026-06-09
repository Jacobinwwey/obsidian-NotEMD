import * as fs from 'fs';
import * as path from 'path';

describe('docs hub contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const docsHub = fs.readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf8');
    const docsHubZh = fs.readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf8');

    test('docs hub keeps the local kb decision record discoverable in both languages', () => {
        expect(docsHub).toContain(
            '[Local KB Retrieval Decision And Quality Truth](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md)'
        );
        expect(docsHubZh).toContain(
            '[Local KB Retrieval 方案决策与质量真值](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md)'
        );
    });
});
