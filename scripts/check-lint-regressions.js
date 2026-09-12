'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Style warnings remain visible in the report. Correctness warnings ratchet with errors.
const correctnessWarnings = new Set([
    'no-unsafe-finally', 'no-unsafe-optional-chaining', 'no-unreachable',
    'no-unreachable-loop', 'no-promise-executor-return', 'require-atomic-updates',
    '@typescript-eslint/no-floating-promises', '@typescript-eslint/no-misused-promises',
    '@typescript-eslint/await-thenable'
]);

function parseDiffHunks(diff) {
    const hunks = [];
    for (const line of diff.split('\n')) {
        if (!line.startsWith('@@')) continue;
        const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?:.*)$/.exec(line);
        if (!match) throw new Error(`Malformed diff hunk: ${line}`);
        const hunk = {
            oldStart: Number(match[1]), oldCount: Number(match[2] ?? 1),
            newStart: Number(match[3]), newCount: Number(match[4] ?? 1)
        };
        if (!Object.values(hunk).every(Number.isSafeInteger)) throw new Error('Invalid diff hunk coordinates');
        const previous = hunks[hunks.length - 1];
        if (previous && (hunk.oldStart < previous.oldStart + previous.oldCount
            || hunk.newStart < previous.newStart + previous.newCount)) {
            throw new Error('Overlapping or unordered diff hunks');
        }
        hunks.push(hunk);
    }
    return hunks;
}

function mapBaselineLine(line, hunks) {
    let offset = 0;
    for (const hunk of hunks) {
        // A zero-length new range names the line BEFORE a deletion, unlike a replacement.
        const firstChangedLine = hunk.newStart + (hunk.newCount === 0 ? 1 : 0);
        if (line < firstChangedLine) break;
        if (hunk.newCount > 0 && line < hunk.newStart + hunk.newCount) return null;
        offset += hunk.oldCount - hunk.newCount;
    }
    return line + offset;
}

function validateDiagnostics(messages) {
    if (!Array.isArray(messages)) throw new Error('Expected an array of lint diagnostics');
    for (const entry of messages) {
        if (!entry || ![1, 2].includes(entry.severity) || typeof entry.message !== 'string'
            || !(entry.ruleId === null || typeof entry.ruleId === 'string')
            || !Number.isSafeInteger(entry.line) || entry.line < 1
            || !Number.isSafeInteger(entry.column) || entry.column < 1) {
            throw new Error('Malformed lint diagnostic');
        }
    }
}

function diagnosticKey(entry, line) {
    return JSON.stringify([entry.ruleId, entry.severity, entry.message, line, entry.column]);
}

function compareLintDiagnostics(baseline, current, hunks) {
    validateDiagnostics(baseline);
    validateDiagnostics(current);
    const available = new Map();
    for (const entry of baseline) {
        const key = diagnosticKey(entry, entry.line);
        available.set(key, (available.get(key) ?? 0) + 1);
    }
    return current.filter(entry => {
        if (entry.severity !== 2 && !correctnessWarnings.has(entry.ruleId)) return false;
        const oldLine = mapBaselineLine(entry.line, hunks);
        if (oldLine === null) return true;
        const key = diagnosticKey(entry, oldLine);
        const remaining = available.get(key) ?? 0;
        if (remaining === 0) return true;
        available.set(key, remaining - 1);
        return false;
    });
}

function parseChangedPaths(output) {
    if (output === '') return [];
    if (!output.endsWith('\0')) throw new Error('Unterminated Git name-status output');
    const fields = output.slice(0, -1).split('\0');
    const paths = [];
    const takePath = () => {
        const name = fields.shift();
        if (!name) throw new Error('Missing path in Git name-status output');
        return name;
    };
    while (fields.length > 0) {
        const status = fields.shift();
        if (!/^(?:[MADT]|[RC]\d{1,3})$/.test(status)) throw new Error(`Unsupported Git status: ${status}`);
        const original = takePath();
        const renamed = /^[RC]/.test(status);
        const destination = renamed ? takePath() : original;
        if (status !== 'D') paths.push({ path: destination, baselinePath: status === 'A' ? null : original });
    }
    return paths;
}

async function checkLintRegressions({ cwd, baseRef, reportPath }) {
    const git = args => execFileSync('git', args, {
        cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024
    });
    const commit = git(['rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`]).trim();
    const baseline = git(['merge-base', commit, 'HEAD']).trim();
    const changed = parseChangedPaths(git(['diff', '--name-status', '-z', '--find-renames', baseline, '--']));
    for (const file of git(['ls-files', '--others', '--exclude-standard', '-z', '--', '*.ts']).split('\0').filter(Boolean)) {
        changed.push({ path: file, baselinePath: null });
    }
    const { ESLint } = require('eslint');
    const eslint = new ESLint({ cwd });
    const files = [];
    for (const change of changed) {
        if (!change.path.endsWith('.ts')) continue;
        const filePath = path.resolve(cwd, change.path);
        if (await eslint.isPathIgnored(filePath)) continue;
        const source = fs.readFileSync(filePath, 'utf8');
        const oldSource = change.baselinePath === null ? '' : git(['show', `${baseline}:${change.baselinePath}`]);
        const [oldReport, newReport] = await Promise.all([
            eslint.lintText(oldSource, { filePath }), eslint.lintText(source, { filePath })
        ]);
        if (oldReport.length !== 1 || newReport.length !== 1) throw new Error(`Missing lint report for ${change.path}`);
        const hunks = change.baselinePath === null
            ? [{ oldStart: 0, oldCount: 0, newStart: 1, newCount: source.split('\n').length }]
            : parseDiffHunks(git(['diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--unified=0',
                baseline, '--', change.baselinePath, ...(change.path === change.baselinePath ? [] : [change.path])]));
        const regressions = compareLintDiagnostics(oldReport[0].messages, newReport[0].messages, hunks);
        files.push({ path: change.path, baselinePath: change.baselinePath, regressions,
            baselineDiagnostics: oldReport[0].messages, currentDiagnostics: newReport[0].messages });
    }
    const report = { baseline, baseRef, checkedFiles: files.length,
        regressions: files.reduce((sum, file) => sum + file.regressions.length, 0), files };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    return report;
}

async function main() {
    const args = process.argv.slice(2);
    let baseRef = process.env.NOTEMD_LINT_BASE_REF || 'origin/main';
    let reportPath = '.cache/verification/lint-regressions.json';
    while (args.length > 0) {
        const flag = args.shift();
        const value = args.shift();
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
        if (flag === '--base-ref') baseRef = value;
        else if (flag === '--report') reportPath = value;
        else throw new Error(`Unknown argument: ${flag}`);
    }
    if (/^0+$/.test(baseRef)) baseRef = 'origin/main'; // First push of a feature branch.
    const report = await checkLintRegressions({ cwd: process.cwd(), baseRef, reportPath: path.resolve(reportPath) });
    for (const file of report.files) {
        for (const entry of file.regressions) {
            console.error(`${file.path}:${entry.line}:${entry.column} ${entry.ruleId ?? 'parser'} ${entry.message}`);
        }
    }
    console.log(`Lint ratchet: ${report.checkedFiles} changed TypeScript files, ${report.regressions} regressions (base ${report.baseline.slice(0, 12)}).`);
    if (report.regressions > 0) process.exitCode = 1;
}

if (require.main === module) main().catch(error => {
    console.error(`Lint ratchet failed: ${error.message}`);
    process.exitCode = 1;
});

module.exports = { parseDiffHunks, mapBaselineLine, compareLintDiagnostics, parseChangedPaths, checkLintRegressions };
