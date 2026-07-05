import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    CircuitikzCompileDiagnostic,
    CircuitikzCompileDiagnosticReport,
    diagnoseCircuitikzCompileLog
} from './circuitikzDiagnostics';
import {
    CircuitikzRenderSmokeReport,
    inspectCircuitikzRenderArtifact
} from './circuitikzRenderSmoke';

export interface CircuitikzCompileRequest {
    executable: string;
    args: string[];
    texPath: string;
    outputDirectory: string;
    expectedArtifactPath?: string;
    expectedSvgText?: string[];
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
    renderSmoke?: CircuitikzRenderSmokeReport;
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

function summarizeDiagnostics(diagnostics: CircuitikzCompileDiagnostic[]): string {
    const errors = diagnostics.filter(diagnostic => diagnostic.severity === 'error').length;
    const warnings = diagnostics.filter(diagnostic => diagnostic.severity === 'warning').length;
    return `${errors} error(s), ${warnings} warning(s)`;
}

function mergeRenderSmokeDiagnostic(
    diagnostics: CircuitikzCompileDiagnosticReport,
    smokeReport: CircuitikzRenderSmokeReport | undefined
): CircuitikzCompileDiagnosticReport {
    if (!smokeReport) {
        return diagnostics;
    }

    if (smokeReport.diagnostics.length === 0) {
        return diagnostics;
    }

    const mergedDiagnostics = [...diagnostics.diagnostics, ...smokeReport.diagnostics];
    return {
        ok: false,
        summary: summarizeDiagnostics(mergedDiagnostics),
        diagnostics: mergedDiagnostics
    };
}

export function runCircuitikzCompile(request: CircuitikzCompileRequest): CircuitikzCompileExecution {
    const outputDirectory = path.resolve(request.outputDirectory);
    const texPath = path.resolve(request.texPath);
    fs.mkdirSync(outputDirectory, { recursive: true });

    const args = request.args.map(arg => expandCompileArg(arg, texPath, outputDirectory));
    const expectedArtifactPath = request.expectedArtifactPath
        ? path.resolve(outputDirectory, expandCompileArg(request.expectedArtifactPath, texPath, outputDirectory))
        : undefined;
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
    const parsedDiagnostics = execution.error
        ? buildProcessFailureReport(execution.error.message)
        : diagnoseCircuitikzCompileLog(diagnosticSource);
    const renderSmoke = expectedArtifactPath
        ? inspectCircuitikzRenderArtifact({
            expectedArtifactPath,
            expectedSvgText: request.expectedSvgText
        })
        : undefined;
    const diagnostics = mergeRenderSmokeDiagnostic(parsedDiagnostics, renderSmoke);

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
        renderSmoke,
        diagnostics
    };
}
