import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CircuitSpec } from '../diagram/adapters/circuitikz/circuitSpec';

function createSpec(): CircuitSpec {
    return {
        circuitKind: 'cmos-inverter',
        title: 'CMOS Inverter',
        goldenReferenceId: 'cmos-inverter-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'vin', 'vout', 'shared_gate', 'shared_drain'],
        components: [
            { id: 'MP', type: 'pmos', label: '$M_P$', terminals: { S: 'VDD', G: 'shared_gate', D: 'shared_drain' } },
            { id: 'MN', type: 'nmos', label: '$M_N$', terminals: { D: 'shared_drain', G: 'shared_gate', S: 'GND' } }
        ],
        connections: [
            { from: 'VDD', to: 'MP.S' },
            { from: 'MP.D', to: 'MN.D' },
            { from: 'MN.S', to: 'GND' },
            { from: 'vin', to: 'MP.G' },
            { from: 'vin', to: 'MN.G' },
            { from: 'MP.D', to: 'vout' },
            { from: 'MN.D', to: 'vout' }
        ],
        layoutHints: {
            inputSide: 'left',
            outputSide: 'right',
            routingStyle: 'orthogonal'
        }
    };
}

describe('circuitikz export CLI', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const scriptPath = path.join(repoRoot, 'scripts', 'export-circuitikz.js');

    test('is exposed through package scripts', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        expect(packageJson.scripts['diagram:export-circuitikz']).toBe('node scripts/export-circuitikz.js');
    });

    test('exports circuitikz LaTeX from a BOM-prefixed CircuitSpec file', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        fs.writeFileSync(specPath, `\uFEFF${JSON.stringify(createSpec(), null, 2)}`, 'utf8');

        try {
            const stdout = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            const result = JSON.parse(stdout);
            expect(result).toEqual(expect.objectContaining({
                circuitKind: 'cmos-inverter',
                goldenReferenceId: 'cmos-inverter-v1',
                outputPath,
                componentCount: 2,
                connectionCount: 7
            }));

            const tex = fs.readFileSync(outputPath, 'utf8');
            expect(tex).toContain('\\usepackage{circuitikz}');
            expect(tex).toContain('node[pmos, anchor=S] (MP) {$M_P$}');
            expect(tex).toContain('node[nmos, anchor=D] (MN) {$M_N$}');
            expect(tex).toContain('node[right]{$v_{out}$};');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('fails before writing output for invalid topology', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-invalid-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const spec = createSpec();
        spec.connections = spec.connections.filter(connection => connection.from !== 'MP.D' || connection.to !== 'MN.D');
        fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('CMOS inverter requires MP.D and MN.D');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('fails before writing output when the input JSON is not an object', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-malformed-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        fs.writeFileSync(specPath, 'null', 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('CircuitSpec JSON must be an object.');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('uses topology reference to reject repair candidates that add electrical connections', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-topology-ref-'));
        const referencePath = path.join(tempRoot, 'reference.json');
        const candidatePath = path.join(tempRoot, 'candidate.json');
        const outputPath = path.join(tempRoot, 'candidate.tex');
        const candidate = createSpec();
        candidate.connections = [
            ...candidate.connections,
            { from: 'VDD', to: 'MN.D', label: 'invalid repair short' }
        ];
        fs.writeFileSync(referencePath, JSON.stringify(createSpec(), null, 2), 'utf8');
        fs.writeFileSync(candidatePath, JSON.stringify(candidate, null, 2), 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', candidatePath,
                    '--output', outputPath,
                    '--topology-reference', referencePath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('Circuit topology drift detected');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('writes compile-log diagnostics and exits nonzero when the log contains LaTeX errors', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-diagnostics-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const compileLogPath = path.join(tempRoot, 'circuit.log');
        const diagnosticsPath = path.join(tempRoot, 'diagnostics.json');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');
        fs.writeFileSync(
            compileLogPath,
            "! LaTeX Error: File `circuitikz.sty' not found.\n! Undefined control sequence.\nl.12 \\badwire\n",
            'utf8'
        );

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-log', compileLogPath,
                    '--diagnostics-output', diagnosticsPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(fs.existsSync(outputPath)).toBe(true);
            expect(fs.existsSync(diagnosticsPath)).toBe(true);
            expect(result.stderr).toContain('2 error(s), 0 warning(s)');

            const stdout = JSON.parse(result.stdout);
            expect(stdout.compileDiagnostics).toEqual(expect.objectContaining({
                ok: false,
                summary: '2 error(s), 0 warning(s)'
            }));

            const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));
            expect(diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'missing-package',
                    message: 'Missing LaTeX package: circuitikz.sty'
                }),
                expect.objectContaining({
                    kind: 'undefined-control-sequence',
                    advice: expect.stringContaining('unsupported macro')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('rejects compile args without an explicit compile executable', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-compile-args-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-arg', '{tex}'
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('--compile-arg requires --compile-executable.');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('rejects compile-log and compile-executable in the same invocation', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-compile-mode-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const compileLogPath = path.join(tempRoot, 'circuit.log');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');
        fs.writeFileSync(compileLogPath, 'Output written on circuit.pdf (1 page).\n', 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-log', compileLogPath,
                    '--compile-executable', process.execPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('--compile-log and --compile-executable cannot be used together.');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('runs an explicit compile executable without shell resolution and reports generated log diagnostics', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-compile-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const pdfPath = path.join(tempRoot, 'circuit.pdf');
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        const argsPath = path.join(tempRoot, 'compile-args.json');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify([process.argv[1], ...args]), 'utf8');
const texPath = args[args.indexOf('--tex') + 1];
const outputDirectory = args[args.indexOf('--out') + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), 'Overfull \\\\hbox (12.0pt too wide) in paragraph at lines 10--12\\n', 'utf8');
fs.writeFileSync(path.join(outputDirectory, jobName + '.pdf'), 'pdf bytes', 'utf8');
`,
            'utf8'
        );

        try {
            const stdout = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-executable', process.execPath,
                    '--compile-arg', compilerPath,
                    '--compile-arg', '--tex',
                    '--compile-arg', '{tex}',
                    '--compile-arg', '--out',
                    '--compile-arg', '{outputDir}',
                    '--expected-artifact', '{outputDir}/{jobName}.pdf'
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            const result = JSON.parse(stdout);
            expect(result.compileExecution).toEqual(expect.objectContaining({
                executable: process.execPath,
                exitCode: 0,
                signal: null,
                timedOut: false,
                logPath: path.join(tempRoot, 'circuit.log')
            }));
            expect(result.compileExecution.renderSmoke).toEqual({
                expectedArtifactPath: pdfPath,
                artifactExists: true,
                artifactSizeBytes: 9,
                nonEmptyArtifact: true,
                artifactKind: 'opaque',
                diagnostics: []
            });
            expect(result.compileDiagnostics).toEqual(expect.objectContaining({
                ok: true,
                summary: '0 error(s), 1 warning(s)'
            }));
            expect(JSON.parse(fs.readFileSync(argsPath, 'utf8'))).toEqual([
                compilerPath,
                '--tex',
                outputPath,
                '--out',
                tempRoot
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('fails active compile smoke when the expected render artifact is missing', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-missing-artifact-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const diagnosticsPath = path.join(tempRoot, 'diagnostics.json');
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');
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
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-executable', process.execPath,
                    '--compile-arg', compilerPath,
                    '--compile-arg', '--tex',
                    '--compile-arg', '{tex}',
                    '--compile-arg', '--out',
                    '--compile-arg', '{outputDir}',
                    '--expected-artifact', '{outputDir}/{jobName}.pdf',
                    '--diagnostics-output', diagnosticsPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stderr).toContain('1 error(s), 0 warning(s)');

            const stdout = JSON.parse(result.stdout);
            expect(stdout.compileExecution.renderSmoke).toEqual({
                expectedArtifactPath: path.join(tempRoot, 'circuit.pdf'),
                artifactExists: false,
                artifactSizeBytes: 0,
                nonEmptyArtifact: false,
                artifactKind: 'opaque',
                diagnostics: [
                    expect.objectContaining({
                        kind: 'render-artifact-missing'
                    })
                ]
            });
            expect(stdout.compileDiagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-artifact-missing'
                })
            ]);

            const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));
            expect(diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-artifact-missing'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('fails active compile smoke when an SVG artifact is missing required text', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-cli-svg-smoke-'));
        const specPath = path.join(tempRoot, 'circuit.json');
        const outputPath = path.join(tempRoot, 'circuit.tex');
        const diagnosticsPath = path.join(tempRoot, 'diagnostics.json');
        const compilerPath = path.join(tempRoot, 'fake-compiler.js');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const texPath = args[args.indexOf('--tex') + 1];
const outputDirectory = args[args.indexOf('--out') + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), 'Output written on circuit.svg (1 page).\\n', 'utf8');
fs.writeFileSync(path.join(outputDirectory, jobName + '.svg'), '<svg viewBox="0 0 100 80"><path d="M0 0H10"/></svg>', 'utf8');
`,
            'utf8'
        );

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--output', outputPath,
                    '--compile-executable', process.execPath,
                    '--compile-arg', compilerPath,
                    '--compile-arg', '--tex',
                    '--compile-arg', '{tex}',
                    '--compile-arg', '--out',
                    '--compile-arg', '{outputDir}',
                    '--expected-artifact', '{outputDir}/{jobName}.svg',
                    '--expected-svg-text', 'v_{out}',
                    '--diagnostics-output', diagnosticsPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stderr).toContain('1 error(s), 0 warning(s)');

            const stdout = JSON.parse(result.stdout);
            expect(stdout.compileExecution.renderSmoke).toEqual(expect.objectContaining({
                expectedArtifactPath: path.join(tempRoot, 'circuit.svg'),
                artifactKind: 'svg',
                svg: expect.objectContaining({
                    viewBox: [0, 0, 100, 80],
                    visibleElementCount: 1,
                    expectedText: [{
                        text: 'v_{out}',
                        present: false
                    }]
                })
            }));
            expect(stdout.compileDiagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-missing'
                })
            ]);

            const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));
            expect(diagnostics.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-missing'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);
});
