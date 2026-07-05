import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const englishDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawio-export-visual-regression.md');
const chineseDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawio-export-visual-regression.zh-CN.md');

describe('draw.io export documentation contract', () => {
    test('documents local-only visual regression and exporter limitations in both languages', () => {
        const english = fs.readFileSync(englishDocPath, 'utf8');
        const chinese = fs.readFileSync(chineseDocPath, 'utf8');

        for (const doc of [english, chinese]) {
            expect(doc).toContain('draw.io');
            expect(doc).toContain('diagrams.net Desktop');
            expect(doc).toContain('not a normal CI dependency');
            expect(doc).toContain('Supported primitives');
            expect(doc).toContain('Unsupported');
            expect(doc).toContain('visible label');
            expect(doc).toContain('data-drawio-type');
            expect(doc).toContain('editable-html-svg');
        }
    });
});
