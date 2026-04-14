import * as fs from 'fs';
import * as path from 'path';

describe('hardcoded UI audit script configuration', () => {
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'audit-hardcoded-ui-strings.js');

    test('does not whitelist provider summary or task-name template literals', () => {
        const source = fs.readFileSync(scriptPath, 'utf8');

        expect(source).not.toContain('/task\\.name/');
        expect(source).not.toContain('/definition\\.description/');
        expect(source).not.toContain('/definition\\.setupHint/');
    });
});
