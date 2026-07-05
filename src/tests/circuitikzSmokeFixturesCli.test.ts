import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('circuitikz smoke fixtures CLI', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const scriptPath = path.join(repoRoot, 'scripts', 'run-circuitikz-smoke-fixtures.js');
    const fixtureDirectory = path.join(repoRoot, 'docs', 'maintainer', 'fixtures', 'circuitikz');

    test('is exposed through package scripts', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        expect(packageJson.scripts['diagram:smoke-circuitikz']).toBe('node scripts/run-circuitikz-smoke-fixtures.js');
    });

    test('keeps maintainer fixtures for both supported golden circuit families', () => {
        const fixtureNames = fs.readdirSync(fixtureDirectory)
            .filter(fileName => fileName.endsWith('.json'))
            .sort();

        expect(fixtureNames).toEqual([
            'cmos-inverter-v1.json',
            'common-source-nmos-v1.json'
        ]);

        for (const fixtureName of fixtureNames) {
            const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, fixtureName), 'utf8'));
            expect(fixture.style.package).toBe('circuitikz');
            expect(fixture.style.voltageConvention).toBe('american voltages');
        }
    });

    test('runs every golden fixture through explicit shell-free renderer arguments', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-smoke-fixtures-'));
        const outputDirectory = path.join(tempRoot, 'out');
        const compilerPath = path.join(tempRoot, 'fake-renderer.js');
        const invocationsPath = path.join(tempRoot, 'invocations.jsonl');
        fs.writeFileSync(
            compilerPath,
            `
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const texPath = args[args.indexOf('--tex') + 1];
const outputDirectory = args[args.indexOf('--out') + 1];
const jobName = path.basename(texPath, path.extname(texPath));
fs.appendFileSync(${JSON.stringify(invocationsPath)}, JSON.stringify([process.argv[1], ...args]) + '\\n', 'utf8');
fs.writeFileSync(path.join(outputDirectory, jobName + '.log'), 'Output written on ' + jobName + '.svg (1 page).\\n', 'utf8');
fs.writeFileSync(
  path.join(outputDirectory, jobName + '.svg'),
  '<svg viewBox="0 0 160 100"><text>v_{in}</text><text>v_{out}</text><path d="M0 0H12"/></svg>',
  'utf8'
);
`,
            'utf8'
        );

        try {
            const stdout = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--fixture-dir', fixtureDirectory,
                    '--output-dir', outputDirectory,
                    '--compile-executable', process.execPath,
                    '--compile-arg', compilerPath,
                    '--compile-arg', '--tex',
                    '--compile-arg', '{tex}',
                    '--compile-arg', '--out',
                    '--compile-arg', '{outputDir}',
                    '--expected-artifact', '{outputDir}/{jobName}.svg',
                    '--expected-svg-text', 'v_{in}',
                    '--expected-svg-text', 'v_{out}'
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            const report = JSON.parse(stdout);
            expect(report).toEqual(expect.objectContaining({
                ok: true,
                fixtureCount: 2,
                outputDirectory
            }));
            expect(report.fixtures.map((fixture: any) => fixture.name).sort()).toEqual([
                'cmos-inverter-v1',
                'common-source-nmos-v1'
            ]);

            for (const fixture of report.fixtures) {
                expect(fs.existsSync(path.join(outputDirectory, `${fixture.name}.tex`))).toBe(true);
                expect(fixture.compileDiagnostics).toEqual(expect.objectContaining({
                    ok: true
                }));
                expect(fixture.compileExecution.renderSmoke).toEqual(expect.objectContaining({
                    artifactKind: 'svg',
                    nonEmptyArtifact: true,
                    diagnostics: []
                }));
            }

            const invocations = fs.readFileSync(invocationsPath, 'utf8')
                .trim()
                .split(/\r?\n/)
                .map(line => JSON.parse(line));
            expect(invocations).toHaveLength(2);
            for (const invocation of invocations) {
                expect(invocation[0]).toBe(compilerPath);
                expect(invocation).toContain('--tex');
                expect(invocation).toContain('--out');
            }
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);
});
