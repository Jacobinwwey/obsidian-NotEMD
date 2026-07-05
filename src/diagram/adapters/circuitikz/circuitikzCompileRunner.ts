import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    CircuitikzCompileDiagnosticReport,
    diagnoseCircuitikzCompileLog
} from './circuitikzDiagnostics';

export interface CircuitikzCompileRequest {
    executable: string;
    args: string[];
    texPath: string;
    outputDirectory: string;
    timeoutMs?: number;
}

export interface CircuitikzCompileExecution {
    executable: string;
    args: string[];
    cwd: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    stdout: string;
    stderr: string;
    logPath?: string;
    diagnostics: CircuitikzCompileDiagnosticReport;
}

function expandCompileArg(arg: string, texPath: string, outputDirectory: string): string {
    const jobName = path.basename(texPath, path.extname(texPath));
    return arg
        .replace(/\{tex\}/g, texPath)
        .replace(/\{outputDir\}/g, outputDirectory)
        .replace(/\{jobName\}/g, jobName);
}

function resolveLogPath(texPath: string, outputDirectory: string): string | undefined {
    const jobName = path.basename(texPath, path.extname(texPath));
    const candidate = path.join(outputDirectory, `${jobName}.log`);
    return fs.existsSync(candidate) ? candidate : undefined;
}

function buildProcessFailureReport(message: string): CircuitikzCompileDiagnosticReport {
    return {
        ok: false,
        summary: '1 error(s), 0 warning(s)',
        diagnostics: [{
            severity: 'error',
            kind: 'compile-process-error',
            message,
            excerpt: message,
            advice: 'Check the renderer executable path and arguments. The circuitikz runner uses direct process execution without a shell.'
        }]
    };
}

function isProcessTimeout(error: Error | undefined): boolean {
    return Boolean(error && (error as NodeJS.ErrnoException).code === 'ETIMEDOUT');
}

export function runCircuitikzCompile(request: CircuitikzCompileRequest): CircuitikzCompileExecution {
    const outputDirectory = path.resolve(request.outputDirectory);
    const texPath = path.resolve(request.texPath);
    fs.mkdirSync(outputDirectory, { recursive: true });

    const args = request.args.map(arg => expandCompileArg(arg, texPath, outputDirectory));
    const execution = spawnSync(request.executable, args, {
        cwd: outputDirectory,
        encoding: 'utf8',
        shell: false,
        timeout: request.timeoutMs ?? 30000
    });
    const stdout = execution.stdout ?? '';
    const stderr = execution.stderr ?? '';
    const logPath = resolveLogPath(texPath, outputDirectory);
    const diagnosticSource = logPath ? fs.readFileSync(logPath, 'utf8').replace(/^\uFEFF/, '') : `${stdout}\n${stderr}`;
    const diagnostics = execution.error
        ? buildProcessFailureReport(execution.error.message)
        : diagnoseCircuitikzCompileLog(diagnosticSource);

    return {
        executable: request.executable,
        args,
        cwd: outputDirectory,
        exitCode: execution.status,
        signal: execution.signal,
        timedOut: isProcessTimeout(execution.error),
        stdout,
        stderr,
        logPath,
        diagnostics
    };
}
