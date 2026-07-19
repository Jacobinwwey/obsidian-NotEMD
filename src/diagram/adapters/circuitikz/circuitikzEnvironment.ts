import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DesktopCommand, DesktopCommandExit, runDesktopCommand } from '../../../platform/desktopProcess';
import { exportCircuitSpecToCircuitikz } from './circuitikzExporter';
import { resolveCircuitTemplateFromMarkdown } from './circuitTemplateCatalog';

export type CircuitikzCompilerKind = 'tectonic' | 'pdflatex';
export type CircuitikzCompilerSource = 'custom' | 'managed' | 'system';
export type CircuitikzCompilerPreference = 'auto' | 'managed' | 'system' | 'custom';

export interface CircuitikzCompilerCandidate {
    kind: CircuitikzCompilerKind;
    source: CircuitikzCompilerSource;
    executable: string;
}

export interface CircuitikzEnvironmentAttempt {
    candidate: CircuitikzCompilerCandidate;
    status: 'ready' | 'missing' | 'incomplete';
    version?: string;
    message?: string;
}

export interface CircuitikzEnvironmentCapabilities {
    compileDiagnostics: boolean;
    nativePdf: boolean;
    repairAcceptance: boolean;
}

export interface CircuitikzEnvironmentReport {
    status: 'ready' | 'missing' | 'incomplete' | 'unsupported';
    selected?: CircuitikzCompilerCandidate;
    capabilities: CircuitikzEnvironmentCapabilities;
    attempts: CircuitikzEnvironmentAttempt[];
}

type CommandRunner = (command: DesktopCommand) => Promise<DesktopCommandExit>;

const DEFAULT_COMPILE_TIMEOUT_MS = 120_000;
const SMOKE_JOB_NAME = 'notemd-circuitikz-smoke';
const EMPTY_CAPABILITIES: CircuitikzEnvironmentCapabilities = {
    compileDiagnostics: false,
    nativePdf: false,
    repairAcceptance: false
};

const CIRCUITIKZ_SMOKE_TEX = String.raw`\documentclass[border=8pt]{standalone}
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american voltages, line width=0.5pt, font=\small]
\draw (3,5) node[vcc]{$V_{DD}$} to[R, l=$R_D$] (3,3);
\draw (3,3) to[short, *-o] (5,3) node[right]{$v_{out}$};
\draw (3,3) to[short] (3,2.2) node[nmos, anchor=D] (M1) {$M_1$};
\draw (M1.S) to[short] (3,0.5) node[ground]{};
\draw (M1.G) to[short, -o] (0.8,2.2) node[left]{$v_{in}$};
\end{circuitikz}
\end{document}
`;

const GOLDEN_FIXTURE_REQUESTS = [
    { name: 'cmos-inverter', markdown: 'CMOS inverter' },
    { name: 'common-source-amplifier', markdown: 'common-source NMOS amplifier' },
    { name: 'cmos-buffer', markdown: 'CMOS buffer' },
    { name: 'cmos-transmission-gate', markdown: 'CMOS transmission gate' },
    { name: 'cmos-nand2', markdown: 'CMOS NAND2' },
    { name: 'cmos-nor2', markdown: 'CMOS NOR2' }
] as const;

export interface CircuitikzGoldenFixtureResult {
    name: string;
    status: 'ready' | 'failed';
    message?: string;
}

async function compileSmokeSource(input: {
    candidate: CircuitikzCompilerCandidate;
    name: string;
    source: string;
    workspace: string;
    timeoutMs: number;
    runCommand: CommandRunner;
}): Promise<CircuitikzGoldenFixtureResult> {
    const texPath = path.join(input.workspace, `${input.name}.tex`);
    const pdfPath = path.join(input.workspace, `${input.name}.pdf`);
    const logPath = path.join(input.workspace, `${input.name}.log`);
    fs.writeFileSync(texPath, input.source, 'utf8');
    fs.rmSync(pdfPath, { force: true });
    fs.rmSync(logPath, { force: true });
    const execution = await input.runCommand(
        buildCircuitikzCompileCommand(input.candidate, texPath, input.workspace, input.timeoutMs)
    );
    const pdfReady = execution.exitCode === 0
        && fs.existsSync(pdfPath)
        && fs.statSync(pdfPath).size > 0;
    return pdfReady
        ? { name: input.name, status: 'ready' }
        : { name: input.name, status: 'failed', message: summarizeCommandFailure(execution) };
}

export async function verifyCircuitikzGoldenFixtures(input: {
    candidate: CircuitikzCompilerCandidate;
    timeoutMs?: number;
    runCommand?: CommandRunner;
}): Promise<{ ok: boolean; fixtures: CircuitikzGoldenFixtureResult[] }> {
    const runCommand = input.runCommand ?? runDesktopCommand;
    const timeoutMs = Math.max(1, input.timeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS);
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-golden-'));
    const fixtures: CircuitikzGoldenFixtureResult[] = [];
    try {
        for (const fixture of GOLDEN_FIXTURE_REQUESTS) {
            const spec = resolveCircuitTemplateFromMarkdown(fixture.markdown);
            if (!spec) {
                fixtures.push({ name: fixture.name, status: 'failed', message: 'Deterministic fixture template is unavailable.' });
                continue;
            }
            fixtures.push(await compileSmokeSource({
                candidate: input.candidate,
                name: fixture.name,
                source: exportCircuitSpecToCircuitikz(spec),
                workspace,
                timeoutMs,
                runCommand
            }));
        }
        return {
            ok: fixtures.length === GOLDEN_FIXTURE_REQUESTS.length
                && fixtures.every(fixture => fixture.status === 'ready'),
            fixtures
        };
    } finally {
        fs.rmSync(workspace, { recursive: true, force: true });
    }
}

export function buildCircuitikzCompileCommand(
    candidate: CircuitikzCompilerCandidate,
    texPath: string,
    outputDirectory: string,
    timeoutMs: number
): DesktopCommand {
    if (candidate.kind === 'tectonic') {
        return {
            executable: candidate.executable,
            args: ['-X', 'compile', '--untrusted', '--keep-logs', '--outdir', outputDirectory, texPath],
            cwd: outputDirectory,
            timeoutMs
        };
    }
    return {
        executable: candidate.executable,
        args: [
            '-no-shell-escape',
            '-interaction=nonstopmode',
            '-halt-on-error',
            `-output-directory=${outputDirectory}`,
            texPath
        ],
        cwd: outputDirectory,
        timeoutMs
    };
}

export function createCircuitikzCompilerCandidates(input: {
    preference: CircuitikzCompilerPreference;
    customCompilerKind?: CircuitikzCompilerKind;
    customCompilerPath?: string;
    managedExecutablePath?: string;
    systemTectonicPath?: string;
    systemPdflatexPath?: string;
}): CircuitikzCompilerCandidate[] {
    const customPath = input.customCompilerPath?.trim();
    const managedPath = input.managedExecutablePath?.trim();
    const systemTectonicPath = input.systemTectonicPath?.trim();
    const systemPdflatexPath = input.systemPdflatexPath?.trim();

    if (input.preference === 'custom') {
        return customPath && input.customCompilerKind
            ? [{ kind: input.customCompilerKind, source: 'custom', executable: customPath }]
            : [];
    }
    if (input.preference === 'managed') {
        return managedPath
            ? [{ kind: 'tectonic', source: 'managed', executable: managedPath }]
            : [];
    }

    const candidates: CircuitikzCompilerCandidate[] = [];
    if (input.preference === 'auto' && managedPath) {
        candidates.push({ kind: 'tectonic', source: 'managed', executable: managedPath });
    }
    if (systemTectonicPath) {
        candidates.push({ kind: 'tectonic', source: 'system', executable: systemTectonicPath });
    }
    if (systemPdflatexPath) {
        candidates.push({ kind: 'pdflatex', source: 'system', executable: systemPdflatexPath });
    }
    return candidates;
}

function summarizeCommandFailure(execution: DesktopCommandExit): string {
    if (execution.cancelled) return 'Cancelled by the user.';
    if (execution.timedOut) return 'Compiler timed out.';
    return execution.stderr.trim() || execution.stdout.trim() || execution.errorMessage || 'Compiler command failed.';
}

export async function probeCircuitikzEnvironment(input: {
    isDesktop: boolean;
    candidates: CircuitikzCompilerCandidate[];
    timeoutMs?: number;
    runCommand?: CommandRunner;
}): Promise<CircuitikzEnvironmentReport> {
    if (!input.isDesktop) {
        return { status: 'unsupported', capabilities: { ...EMPTY_CAPABILITIES }, attempts: [] };
    }
    if (input.candidates.length === 0) {
        return { status: 'missing', capabilities: { ...EMPTY_CAPABILITIES }, attempts: [] };
    }

    const runCommand = input.runCommand ?? runDesktopCommand;
    const timeoutMs = Math.max(1, input.timeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS);
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-'));
    const texPath = path.join(workspace, `${SMOKE_JOB_NAME}.tex`);
    const pdfPath = path.join(workspace, `${SMOKE_JOB_NAME}.pdf`);
    const logPath = path.join(workspace, `${SMOKE_JOB_NAME}.log`);
    const attempts: CircuitikzEnvironmentAttempt[] = [];
    fs.writeFileSync(texPath, CIRCUITIKZ_SMOKE_TEX, 'utf8');

    try {
        for (const candidate of input.candidates) {
            const versionExecution = await runCommand({
                executable: candidate.executable,
                args: ['--version'],
                cwd: workspace,
                timeoutMs: Math.min(timeoutMs, 15_000)
            });
            if (versionExecution.exitCode !== 0 || versionExecution.cancelled || versionExecution.timedOut) {
                attempts.push({
                    candidate,
                    status: 'missing',
                    message: summarizeCommandFailure(versionExecution)
                });
                continue;
            }

            fs.rmSync(pdfPath, { force: true });
            fs.rmSync(logPath, { force: true });
            const compileExecution = await runCommand(
                buildCircuitikzCompileCommand(candidate, texPath, workspace, timeoutMs)
            );
            const pdfReady = compileExecution.exitCode === 0
                && fs.existsSync(pdfPath)
                && fs.statSync(pdfPath).size > 0;
            const version = (versionExecution.stdout || versionExecution.stderr).trim();
            if (!pdfReady) {
                attempts.push({
                    candidate,
                    status: 'incomplete',
                    version,
                    message: summarizeCommandFailure(compileExecution)
                });
                continue;
            }

            attempts.push({ candidate, status: 'ready', version });
            return {
                status: 'ready',
                selected: candidate,
                capabilities: {
                    compileDiagnostics: true,
                    nativePdf: true,
                    repairAcceptance: true
                },
                attempts
            };
        }

        return {
            status: attempts.some(attempt => attempt.status === 'incomplete') ? 'incomplete' : 'missing',
            capabilities: { ...EMPTY_CAPABILITIES },
            attempts
        };
    } finally {
        fs.rmSync(workspace, { recursive: true, force: true });
    }
}
