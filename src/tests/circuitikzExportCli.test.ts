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
});
