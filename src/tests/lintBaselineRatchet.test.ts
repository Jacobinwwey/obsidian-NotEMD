import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const { parseDiffHunks, mapBaselineLine, compareLintDiagnostics, parseChangedPaths, checkLintRegressions } = createRequire(__filename)('../../scripts/check-lint-regressions.js');

const diagnostic = (line: number, message = "'unused' is assigned a value but never used.") => ({
    ruleId: '@typescript-eslint/no-unused-vars', severity: 2, line, column: 7, message
});

describe('lint regression ratchet', () => {
    test('maps unchanged diagnostics past inserted lines without forgiving diagnostics on new lines', () => {
        const hunks = parseDiffHunks('@@ -3,0 +4,2 @@\n+new line\n+new line\n');
        expect(mapBaselineLine(3, hunks)).toBe(3);
        expect(mapBaselineLine(4, hunks)).toBeNull();
        expect(mapBaselineLine(5, hunks)).toBeNull();
        expect(mapBaselineLine(6, hunks)).toBe(4);
        expect(compareLintDiagnostics([diagnostic(10)], [diagnostic(12)], hunks)).toEqual([]);
        expect(compareLintDiagnostics([], [diagnostic(4)], hunks)).toEqual([diagnostic(4)]);
    });

    test('maps deletion boundaries without shifting the preceding unchanged line', () => {
        const hunks = parseDiffHunks('@@ -4,2 +3,0 @@\n-old\n-old\n');
        expect(mapBaselineLine(3, hunks)).toBe(3);
        expect(mapBaselineLine(4, hunks)).toBe(6);
    });

    test('does not trade removed debt for a new error elsewhere', () => {
        const baseline = [diagnostic(2)];
        const current = [diagnostic(20, "'different' is assigned a value but never used.")];
        expect(compareLintDiagnostics(baseline, current, [])).toEqual(current);
    });

    test('requires errors on changed lines to be fixed even when the same old message existed', () => {
        const hunks = parseDiffHunks('@@ -2 +2 @@\n-const old = 1;\n+const old = 2;\n');
        expect(compareLintDiagnostics([diagnostic(2)], [diagnostic(2)], hunks)).toEqual([diagnostic(2)]);
    });

    test('detects newly unused unchanged declarations after a caller is removed', () => {
        const hunks = parseDiffHunks('@@ -12 +11,0 @@\n-call();\n');
        expect(compareLintDiagnostics([], [diagnostic(2)], hunks)).toEqual([diagnostic(2)]);
    });

    test('enforces correctness warnings without forcing a global style cleanup', () => {
        const style = { ...diagnostic(1), severity: 1, ruleId: '@typescript-eslint/no-explicit-any' };
        const correctness = { ...diagnostic(2), severity: 1, ruleId: 'no-unsafe-finally' };
        expect(compareLintDiagnostics([], [style, correctness], [])).toEqual([correctness]);
    });

    test('parses NUL-delimited renames, additions and deletions including spaces', () => {
        expect(parseChangedPaths('R100\0src/old name.ts\0src/new name.ts\0A\0src/added.ts\0D\0src/deleted.ts\0'))
            .toEqual([
                { path: 'src/new name.ts', baselinePath: 'src/old name.ts' },
                { path: 'src/added.ts', baselinePath: null }
            ]);
    });

    test('fails closed for malformed diagnostics or diff metadata', () => {
        expect(() => compareLintDiagnostics([], [{ line: 2 }], [])).toThrow(/diagnostic/i);
        expect(() => parseDiffHunks('@@ invalid @@')).toThrow(/hunk/i);
        expect(() => parseChangedPaths('R100\0src/old.ts\0')).toThrow(/status|path/i);
    });

    test('matches existing errors one-to-one instead of forgiving duplicate new diagnostics', () => {
        expect(compareLintDiagnostics([diagnostic(2)], [diagnostic(2), diagnostic(2)], [])).toEqual([diagnostic(2)]);
    });

    test('checks a real Git rename and fails closed for lint configuration and invalid refs', async () => {
        const cache = path.resolve('.cache');
        fs.mkdirSync(cache, { recursive: true });
        const cwd = fs.mkdtempSync(path.join(cache, 'lint-ratchet-test-'));
        if (path.dirname(cwd) !== cache) throw new Error('Unexpected lint fixture path');
        const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
        const run = () => checkLintRegressions({ cwd, baseRef: 'HEAD', reportPath: path.join(cwd, 'report.json') });
        try {
            fs.writeFileSync(path.join(cwd, '.eslintrc'), fs.readFileSync('.eslintrc'));
            fs.writeFileSync(path.join(cwd, 'old name.ts'), 'const unused = 1;\nexport const kept = 2;\n');
            git('init', '--quiet');
            git('add', '.');
            git('-c', 'user.name=Lint test', '-c', 'user.email=lint@example.invalid', 'commit', '--quiet', '-m', 'baseline');
            git('mv', 'old name.ts', 'new name.ts');
            fs.writeFileSync(path.join(cwd, 'new name.ts'), '// inserted\nconst unused = 1;\nexport const kept = 2;\n');
            expect((await run()).regressions).toBe(0);
            fs.writeFileSync(path.join(cwd, 'new name.ts'), '// inserted\nexport const kept = 2;\nconst newDebt = 3;\n');
            expect((await run()).regressions).toBe(1);
            fs.writeFileSync(path.join(cwd, '.eslintrc'), '{ broken');
            await expect(run()).rejects.toThrow();
            const failed = spawnSync(process.execPath, [path.resolve('scripts/check-lint-regressions.js'), '--base-ref', 'not-a-real-ref'],
                { cwd, encoding: 'utf8', windowsHide: true });
            expect(failed.status).toBe(1);
            expect(failed.stderr).toContain('Lint ratchet failed');
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    }, 20000);
});
