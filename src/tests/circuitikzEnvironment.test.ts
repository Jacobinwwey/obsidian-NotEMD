import * as fs from 'fs';
import * as path from 'path';

type Candidate = {
    kind: 'tectonic' | 'pdflatex';
    source: 'custom' | 'managed' | 'system';
    executable: string;
};

type EnvironmentApi = {
    buildCircuitikzCompileCommand: (candidate: Candidate, texPath: string, outputDirectory: string, timeoutMs: number) => {
        executable: string;
        args: string[];
        cwd: string;
        timeoutMs: number;
    };
    createCircuitikzCompilerCandidates: (input: {
        preference: 'auto' | 'managed' | 'system' | 'custom';
        customCompilerKind?: 'tectonic' | 'pdflatex';
        customCompilerPath?: string;
        managedExecutablePath?: string;
        systemTectonicPath?: string;
        systemPdflatexPath?: string;
    }) => Candidate[];
    verifyCircuitikzGoldenFixtures: (input: {
        candidate: Candidate;
        timeoutMs?: number;
        runCommand?: (command: { executable: string; args: string[]; cwd?: string; timeoutMs: number }) => Promise<{
            cancelled: boolean;
            exitCode: number | null;
            signal: NodeJS.Signals | null;
            stderr: string;
            stdout: string;
            timedOut: boolean;
        }>;
    }) => Promise<{
        ok: boolean;
        fixtures: Array<{ name: string; status: 'ready' | 'failed'; message?: string }>;
    }>;
    probeCircuitikzEnvironment: (input: {
        isDesktop: boolean;
        candidates: Candidate[];
        timeoutMs?: number;
        runCommand?: (command: { executable: string; args: string[]; cwd?: string; timeoutMs: number }) => Promise<{
            cancelled: boolean;
            exitCode: number | null;
            signal: NodeJS.Signals | null;
            stderr: string;
            stdout: string;
            timedOut: boolean;
        }>;
    }) => Promise<{
        status: 'ready' | 'missing' | 'incomplete' | 'unsupported';
        selected?: Candidate;
        capabilities: {
            compileDiagnostics: boolean;
            nativePdf: boolean;
            repairAcceptance: boolean;
        };
        attempts: Array<{ candidate: Candidate; status: 'ready' | 'missing' | 'incomplete' }>;
    }>;
};

function loadEnvironmentApi(): Partial<EnvironmentApi> {
    try {
        return require('../diagram/adapters/circuitikz/circuitikzEnvironment') as EnvironmentApi;
    } catch {
        return {};
    }
}

describe('CircuitikZ native environment', () => {
    const managedTectonic: Candidate = { kind: 'tectonic', source: 'managed', executable: 'E:/managed/tectonic.exe' };
    const systemPdflatex: Candidate = { kind: 'pdflatex', source: 'system', executable: 'pdflatex' };

    test('builds shell-free untrusted compiler invocations', () => {
        const api = loadEnvironmentApi();

        expect(api.buildCircuitikzCompileCommand?.(managedTectonic, 'E:/work/smoke.tex', 'E:/work/out', 60_000)).toEqual({
            executable: 'E:/managed/tectonic.exe',
            args: ['-X', 'compile', '--untrusted', '--keep-logs', '--outdir', 'E:/work/out', 'E:/work/smoke.tex'],
            cwd: 'E:/work/out',
            timeoutMs: 60_000
        });
        expect(api.buildCircuitikzCompileCommand?.(systemPdflatex, 'E:/work/smoke.tex', 'E:/work/out', 60_000)).toEqual({
            executable: 'pdflatex',
            args: ['-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', '-output-directory=E:/work/out', 'E:/work/smoke.tex'],
            cwd: 'E:/work/out',
            timeoutMs: 60_000
        });
    });

    test('orders explicit preferences without mixing custom and system modes', () => {
        const api = loadEnvironmentApi();
        const allPaths = {
            managedExecutablePath: 'E:/managed/tectonic.exe',
            systemTectonicPath: 'C:/tools/tectonic.exe',
            systemPdflatexPath: 'C:/tex/pdflatex.exe'
        };

        expect(api.createCircuitikzCompilerCandidates?.({ preference: 'auto', ...allPaths })).toEqual([
            { kind: 'tectonic', source: 'managed', executable: 'E:/managed/tectonic.exe' },
            { kind: 'tectonic', source: 'system', executable: 'C:/tools/tectonic.exe' },
            { kind: 'pdflatex', source: 'system', executable: 'C:/tex/pdflatex.exe' }
        ]);
        expect(api.createCircuitikzCompilerCandidates?.({
            preference: 'custom',
            customCompilerKind: 'pdflatex',
            customCompilerPath: 'D:/TinyTeX/bin/windows/pdflatex.exe',
            ...allPaths
        })).toEqual([
            { kind: 'pdflatex', source: 'custom', executable: 'D:/TinyTeX/bin/windows/pdflatex.exe' }
        ]);
        expect(api.createCircuitikzCompilerCandidates?.({ preference: 'managed', ...allPaths })).toEqual([
            { kind: 'tectonic', source: 'managed', executable: 'E:/managed/tectonic.exe' }
        ]);
    });

    test('keeps mobile dependency-free and does not run native commands', async () => {
        const api = loadEnvironmentApi();
        const runCommand = jest.fn();

        const report = await api.probeCircuitikzEnvironment?.({
            isDesktop: false,
            candidates: [systemPdflatex],
            runCommand
        });

        expect(report).toEqual(expect.objectContaining({
            status: 'unsupported',
            capabilities: { compileDiagnostics: false, nativePdf: false, repairAcceptance: false }
        }));
        expect(runCommand).not.toHaveBeenCalled();
    });

    test('falls back after an incomplete managed compiler and accepts fresh PDF smoke evidence', async () => {
        const api = loadEnvironmentApi();
        const runCommand = jest.fn(async (command: { executable: string; args: string[]; cwd?: string }) => {
            if (command.args.includes('--version')) {
                return { exitCode: 0, signal: null, timedOut: false, cancelled: false, stdout: 'version', stderr: '' };
            }
            if (command.executable.includes('managed')) {
                return { exitCode: 1, signal: null, timedOut: false, cancelled: false, stdout: '', stderr: 'package download failed' };
            }
            const texPath = command.args[command.args.length - 1];
            const pdfPath = path.join(command.cwd as string, `${path.basename(texPath, '.tex')}.pdf`);
            fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.4\nnotemd smoke'));
            return { exitCode: 0, signal: null, timedOut: false, cancelled: false, stdout: 'compiled', stderr: '' };
        });

        const report = await api.probeCircuitikzEnvironment?.({
            isDesktop: true,
            candidates: [managedTectonic, systemPdflatex],
            runCommand
        });

        expect(report).toEqual(expect.objectContaining({
            status: 'ready',
            selected: systemPdflatex,
            capabilities: { compileDiagnostics: true, nativePdf: true, repairAcceptance: true }
        }));
        expect(report?.attempts).toEqual([
            expect.objectContaining({ candidate: managedTectonic, status: 'incomplete' }),
            expect.objectContaining({ candidate: systemPdflatex, status: 'ready' })
        ]);
    });

    test('smoke-compiles all six deterministic golden circuit fixtures', async () => {
        const api = loadEnvironmentApi();
        const runCommand = jest.fn(async (command: { args: string[]; cwd?: string }) => {
            const texPath = command.args[command.args.length - 1];
            const pdfPath = path.join(command.cwd as string, `${path.basename(texPath, '.tex')}.pdf`);
            fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.4\nnotemd golden smoke'));
            return { exitCode: 0, signal: null, timedOut: false, cancelled: false, stdout: 'compiled', stderr: '' };
        });

        const result = await api.verifyCircuitikzGoldenFixtures?.({
            candidate: managedTectonic,
            timeoutMs: 60_000,
            runCommand
        });

        expect(result?.ok).toBe(true);
        expect(result?.fixtures.map(fixture => fixture.name)).toEqual([
            'cmos-inverter',
            'common-source-amplifier',
            'cmos-buffer',
            'cmos-transmission-gate',
            'cmos-nand2',
            'cmos-nor2'
        ]);
        expect(runCommand).toHaveBeenCalledTimes(6);
    });
});
