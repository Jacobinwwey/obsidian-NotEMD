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

    test('normalizes platform separators before matching candidate directories', () => {
        const source = fs.readFileSync(scriptPath, 'utf8');

        expect(source).toContain(".split(path.sep).join('/')");
    });

    test('does not treat an empty name state field as visible UI copy', () => {
        const source = fs.readFileSync(scriptPath, 'utf8');

        expect(source).toContain("{ kind: 'name-prop', regex: /\\bname:\\s*(['\"`])(?!\\1)/ }");
    });
});
