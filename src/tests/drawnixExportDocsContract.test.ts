import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const englishDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawnix-export-spike.md');
const chineseDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawnix-export-spike.zh-CN.md');

describe('drawnix export spike documentation contract', () => {
    test('records supported subset, dependency decision, and manual import evidence boundary in both languages', () => {
        const english = fs.readFileSync(englishDocPath, 'utf8');
        const chinese = fs.readFileSync(chineseDocPath, 'utf8');

        for (const doc of [english, chinese]) {
            expect(doc).toContain('DrawnixExportedData');
            expect(doc).toContain('type/version/source/elements/viewport/theme');
            expect(doc).toContain('geometry');
            expect(doc).toContain('arrow-line');
            expect(doc).toContain('no Plait dependency');
            expect(doc).toContain('manual open/import');
            expect(doc).toContain('localforage');
            expect(doc).toContain('.drawnix');
        }
    });
});
