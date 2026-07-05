import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runCircuitikzCompile } from '../diagram/adapters/circuitikz/circuitikzCompileRunner';

describe('circuitikz compile runner', () => {
    test('runs a renderer command without a shell and parses the generated log', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd circuitikz runner '));
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        const texPath = path.join(tempRoot, 'cmos inverter.tex');
        const pdfPath = path.join(tempRoot, 'cmos inverter.pdf');
        const argsPath = path.join(tempRoot, 'compiler-args.json');
        fs.writeFileSync(texPath, '\\begin{document}\\end{document}\n', 'utf8');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify([process.argv[1], ...args]), 'utf8');
const texIndex = args.indexOf('--tex');
const outIndex = args.indexOf('--out');
const texPath = args[texIndex + 1];
const outputDirectory = args[outIndex + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), 'Output written on circuit.pdf (1 page).\\n', 'utf8');
fs.writeFileSync(path.join(outputDirectory, jobName + '.pdf'), 'pdf bytes', 'utf8');
process.stdout.write('fake compiler complete\\n');
`,
            'utf8'
        );

        try {
            const result = runCircuitikzCompile({
                executable: process.execPath,
                args: [compilerPath, '--tex', '{tex}', '--out', '{outputDir}'],
                texPath,
                outputDirectory: tempRoot,
                expectedArtifactPath: '{outputDir}/{jobName}.pdf'
            });

            expect(result).toEqual(expect.objectContaining({
                executable: process.execPath,
                exitCode: 0,
                signal: null,
                timedOut: false,
                logPath: path.join(tempRoot, 'cmos inverter.log'),
                diagnostics: {
                    ok: true,
                    summary: '0 error(s), 0 warning(s)',
                    diagnostics: []
                },
                renderSmoke: {
                    expectedArtifactPath: pdfPath,
                    artifactExists: true,
                    artifactSizeBytes: 9,
                    nonEmptyArtifact: true
                }
            }));
            expect(result.args).toEqual([compilerPath, '--tex', texPath, '--out', tempRoot]);
            expect(JSON.parse(fs.readFileSync(argsPath, 'utf8'))).toEqual(result.args);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('returns non-ok diagnostics when the expected render artifact is missing', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-runner-missing-artifact-'));
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        const texPath = path.join(tempRoot, 'missing-output.tex');
        fs.writeFileSync(texPath, '\\begin{document}\\end{document}\n', 'utf8');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const texPath = args[args.indexOf('--tex') + 1];
const outputDirectory = args[args.indexOf('--out') + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), 'Output written on circuit.pdf (1 page).\\n', 'utf8');
`,
            'utf8'
        );

        try {
            const result = runCircuitikzCompile({
                executable: process.execPath,
                args: [compilerPath, '--tex', '{tex}', '--out', '{outputDir}'],
                texPath,
                outputDirectory: tempRoot,
                expectedArtifactPath: '{outputDir}/{jobName}.pdf'
            });

            expect(result.renderSmoke).toEqual({
                expectedArtifactPath: path.join(tempRoot, 'missing-output.pdf'),
                artifactExists: false,
                artifactSizeBytes: 0,
                nonEmptyArtifact: false
            });
            expect(result.diagnostics.ok).toBe(false);
            expect(result.diagnostics.summary).toBe('1 error(s), 0 warning(s)');
            expect(result.diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-artifact-missing',
                    message: 'Expected circuitikz render artifact was not created.'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('returns non-ok diagnostics when renderer output contains compile errors', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-runner-error-'));
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        const texPath = path.join(tempRoot, 'broken.tex');
        fs.writeFileSync(texPath, '\\badwire\n', 'utf8');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const texPath = args[args.indexOf('--tex') + 1];
const outputDirectory = args[args.indexOf('--out') + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), ${JSON.stringify("! LaTeX Error: File `circuitikz.sty' not found.\n")}, 'utf8');
process.exit(1);
`,
            'utf8'
        );

        try {
            const result = runCircuitikzCompile({
                executable: process.execPath,
                args: [compilerPath, '--tex', '{tex}', '--out', '{outputDir}'],
                texPath,
                outputDirectory: tempRoot
            });

            expect(result.exitCode).toBe(1);
            expect(result.diagnostics.ok).toBe(false);
            expect(result.diagnostics.summary).toBe('1 error(s), 0 warning(s)');
            expect(result.diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'missing-package',
                    message: 'Missing LaTeX package: circuitikz.sty'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports renderer timeouts as process errors', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-runner-timeout-'));
        const compilerPath = path.join(tempRoot, 'slow-compiler.js');
        const texPath = path.join(tempRoot, 'slow.tex');
        fs.writeFileSync(texPath, '\\begin{document}\\end{document}\n', 'utf8');
        fs.writeFileSync(
            compilerPath,
            'setTimeout(() => {}, 1000);\n',
            'utf8'
        );

        try {
            const result = runCircuitikzCompile({
                executable: process.execPath,
                args: [compilerPath],
                texPath,
                outputDirectory: tempRoot,
                timeoutMs: 10
            });

            expect(result.timedOut).toBe(true);
            expect(result.diagnostics.ok).toBe(false);
            expect(result.diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'compile-process-error'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
