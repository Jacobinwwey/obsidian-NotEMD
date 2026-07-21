import * as fs from 'fs';
import * as path from 'path';

describe('README footer structure', () => {
    test('keeps Friendly Links outside the Star History HTML block', () => {
        const repoRoot = path.join(__dirname, '..', '..');
        const source = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');

        expect(source).toMatch(
            /<\/a>\r?\n\r?\n## Friendly Links\r?\n\r?\n\[Linux DO：学AI，上L站！\]\(https:\/\/linux\.do\/\)/
        );
        expect(source).not.toContain('#### Friendly Links');
        expect(source).not.toContain('codex-text-link://');
    });
});
