import { ChildProcess, spawn } from 'child_process';

const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;
const TERMINATION_GRACE_MS = 250;

export interface DesktopCommand {
    executable: string;
    args: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs: number;
    maxOutputBytes?: number;
}

export interface DesktopCommandProgress {
    stream: 'stdout' | 'stderr';
    text: string;
}

export interface DesktopCommandExit {
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    cancelled: boolean;
    stdout: string;
    stderr: string;
    errorMessage?: string;
}

export interface DesktopCommandOptions {
    signal?: AbortSignal;
    onProgress?: (progress: DesktopCommandProgress) => void;
}

function appendBounded(previous: Buffer, chunk: Buffer, maximumBytes: number): Buffer {
    const combined = Buffer.concat([previous, chunk]);
    if (combined.length <= maximumBytes) {
        return combined;
    }
    return combined.subarray(combined.length - maximumBytes);
}

function terminateProcessTree(child: ChildProcess): void {
    if (!child.pid) {
        child.kill();
        return;
    }

    if (process.platform === 'win32') {
        const terminator = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
            shell: false,
            windowsHide: true,
            stdio: 'ignore'
        });
        terminator.on('error', () => child.kill());
        return;
    }

    try {
        process.kill(-child.pid, 'SIGTERM');
    } catch {
        child.kill('SIGTERM');
    }
}

export function runDesktopCommand(
    command: DesktopCommand,
    options: DesktopCommandOptions = {}
): Promise<DesktopCommandExit> {
    if (options.signal?.aborted) {
        return Promise.resolve({
            exitCode: null,
            signal: null,
            timedOut: false,
            cancelled: true,
            stdout: '',
            stderr: ''
        });
    }

    return new Promise(resolve => {
        const maximumBytes = Math.max(1, command.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES);
        let stdout: Buffer = Buffer.alloc(0);
        let stderr: Buffer = Buffer.alloc(0);
        let timedOut = false;
        let cancelled = false;
        let spawnError: Error | undefined;
        let settled = false;
        let terminationCause: 'cancelled' | 'timeout' | undefined;
        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
        let forceKillTimer: ReturnType<typeof setTimeout> | undefined;
        let pendingExit: { exitCode: number | null; signal: NodeJS.Signals | null } | undefined;

        const child = spawn(command.executable, command.args, {
            cwd: command.cwd,
            env: command.env ? { ...process.env, ...command.env } : process.env,
            shell: false,
            windowsHide: true,
            detached: process.platform !== 'win32',
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const resolveExit = (exitCode: number | null, signal: NodeJS.Signals | null): void => {
            if (settled) return;
            settled = true;
            if (timeoutTimer) clearTimeout(timeoutTimer);
            if (forceKillTimer) clearTimeout(forceKillTimer);
            options.signal?.removeEventListener('abort', cancel);
            resolve({
                exitCode,
                signal,
                timedOut,
                cancelled,
                stdout: stdout.toString('utf8'),
                stderr: stderr.toString('utf8'),
                ...(spawnError ? { errorMessage: spawnError.message } : {})
            });
        };

        const finish = (exitCode: number | null, signal: NodeJS.Signals | null): void => {
            if (process.platform !== 'win32' && terminationCause && forceKillTimer) {
                pendingExit = { exitCode, signal };
                if (timeoutTimer) clearTimeout(timeoutTimer);
                options.signal?.removeEventListener('abort', cancel);
                return;
            }
            resolveExit(exitCode, signal);
        };

        const requestTermination = (cause: 'cancelled' | 'timeout'): void => {
            if (settled || terminationCause) return;
            terminationCause = cause;
            cancelled = cause === 'cancelled';
            timedOut = cause === 'timeout';
            if (timeoutTimer) clearTimeout(timeoutTimer);
            options.signal?.removeEventListener('abort', cancel);
            terminateProcessTree(child);
            forceKillTimer = setTimeout(() => {
                if (settled) return;
                forceKillTimer = undefined;
                try {
                    if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
                    else child.kill('SIGKILL');
                } catch {
                    child.kill('SIGKILL');
                }
                if (pendingExit) resolveExit(pendingExit.exitCode, pendingExit.signal);
            }, TERMINATION_GRACE_MS);
        };

        const cancel = (): void => {
            requestTermination('cancelled');
        };

        child.stdout?.on('data', (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            stdout = appendBounded(stdout, buffer, maximumBytes);
            options.onProgress?.({ stream: 'stdout', text: buffer.toString('utf8') });
        });
        child.stderr?.on('data', (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            stderr = appendBounded(stderr, buffer, maximumBytes);
            options.onProgress?.({ stream: 'stderr', text: buffer.toString('utf8') });
        });
        child.on('error', error => {
            spawnError = error;
            finish(null, null);
        });
        child.on('close', (exitCode, signal) => finish(exitCode, signal));

        timeoutTimer = setTimeout(() => {
            requestTermination('timeout');
        }, Math.max(1, command.timeoutMs));
        options.signal?.addEventListener('abort', cancel, { once: true });
    });
}
