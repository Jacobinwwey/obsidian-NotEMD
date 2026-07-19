type DesktopProcessApi = {
    runDesktopCommand: (
        command: {
            executable: string;
            args: string[];
            cwd?: string;
            timeoutMs: number;
            maxOutputBytes?: number;
        },
        options?: {
            signal?: AbortSignal;
            onProgress?: (event: { stream: 'stdout' | 'stderr'; text: string }) => void;
        }
    ) => Promise<{
        cancelled: boolean;
        errorMessage?: string;
        exitCode: number | null;
        signal: NodeJS.Signals | null;
        stderr: string;
        stdout: string;
        timedOut: boolean;
    }>;
};

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';

function loadDesktopProcessApi(): Partial<DesktopProcessApi> {
    try {
        return require('../platform/desktopProcess') as DesktopProcessApi;
    } catch {
        return {};
    }
}

describe('desktop direct process execution', () => {
    test('streams and captures output without shell interpretation', async () => {
        const api = loadDesktopProcessApi();
        const progress: string[] = [];

        const result = await api.runDesktopCommand?.({
            executable: process.execPath,
            args: ['-e', 'process.stdout.write(process.argv[1]); process.stderr.write("warn")', 'literal-$()-&'],
            timeoutMs: 5_000
        }, {
            onProgress: event => progress.push(`${event.stream}:${event.text}`)
        });

        expect(result).toEqual(expect.objectContaining({
            cancelled: false,
            exitCode: 0,
            stderr: 'warn',
            stdout: 'literal-$()-&',
            timedOut: false
        }));
        expect(progress.join('')).toContain('stdout:literal-$()-&');
        expect(progress.join('')).toContain('stderr:warn');
    });

    test('distinguishes timeout from user cancellation', async () => {
        const api = loadDesktopProcessApi();
        const timedOut = await api.runDesktopCommand?.({
            executable: process.execPath,
            args: ['-e', 'setInterval(() => {}, 1000)'],
            timeoutMs: 40
        });
        const controller = new AbortController();
        const cancelledPromise = api.runDesktopCommand?.({
            executable: process.execPath,
            args: ['-e', 'setInterval(() => {}, 1000)'],
            timeoutMs: 5_000
        }, { signal: controller.signal });
        setTimeout(() => controller.abort(), 30);
        const cancelled = await cancelledPromise;

        expect(timedOut).toEqual(expect.objectContaining({ timedOut: true, cancelled: false }));
        expect(cancelled).toEqual(expect.objectContaining({ timedOut: false, cancelled: true }));
    });

    test('bounds captured output while preserving the latest process state', async () => {
        const api = loadDesktopProcessApi();

        const result = await api.runDesktopCommand?.({
            executable: process.execPath,
            args: ['-e', 'process.stdout.write("a".repeat(128))'],
            timeoutMs: 5_000,
            maxOutputBytes: 32
        });

        expect(result?.exitCode).toBe(0);
        expect(Buffer.byteLength(result?.stdout ?? '', 'utf8')).toBeLessThanOrEqual(32);
    });

    test('returns a structured spawn failure for a missing executable', async () => {
        const api = loadDesktopProcessApi();

        const result = await api.runDesktopCommand?.({
            executable: `notemd-missing-command-${Date.now()}`,
            args: [],
            timeoutMs: 1_000
        });

        expect(result).toEqual(expect.objectContaining({
            cancelled: false,
            exitCode: null,
            timedOut: false
        }));
        expect(result?.errorMessage).toMatch(/ENOENT|not found|cannot find/i);
    });

    test('escalates a POSIX process group after the leader closes during cancellation', async () => {
        jest.useFakeTimers();
        const originalPlatform = process.platform;
        const processKill = jest.spyOn(process, 'kill').mockImplementation((pid, signal) => {
            if (signal === 'SIGTERM') {
                queueMicrotask(() => child.emit('close', null, 'SIGTERM'));
            }
            return true;
        });
        const child = Object.assign(new EventEmitter(), {
            pid: 4242,
            stdout: new PassThrough(),
            stderr: new PassThrough(),
            kill: jest.fn()
        });

        try {
            Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
            jest.resetModules();
            jest.doMock('child_process', () => ({ spawn: jest.fn(() => child) }));
            const api = require('../platform/desktopProcess') as DesktopProcessApi;
            const controller = new AbortController();
            const command = api.runDesktopCommand({
                executable: '/tmp/notemd-leader',
                args: [],
                timeoutMs: 5_000
            }, { signal: controller.signal });

            controller.abort();
            await Promise.resolve();
            jest.advanceTimersByTime(250);
            await command;

            expect(processKill).toHaveBeenCalledWith(-4242, 'SIGTERM');
            expect(processKill).toHaveBeenCalledWith(-4242, 'SIGKILL');
        } finally {
            jest.dontMock('child_process');
            jest.resetModules();
            processKill.mockRestore();
            Object.defineProperty(process, 'platform', { configurable: true, value: originalPlatform });
            jest.useRealTimers();
        }
    });

    test('preserves cancellation as the first termination cause near the command timeout', async () => {
        jest.useFakeTimers();
        const originalPlatform = process.platform;
        const child = Object.assign(new EventEmitter(), {
            pid: 4343,
            stdout: new PassThrough(),
            stderr: new PassThrough(),
            kill: jest.fn()
        });
        const processKill = jest.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
            if (signal === 'SIGKILL') queueMicrotask(() => child.emit('close', null, 'SIGKILL'));
            return true;
        });

        try {
            Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
            jest.resetModules();
            jest.doMock('child_process', () => ({ spawn: jest.fn(() => child) }));
            const api = require('../platform/desktopProcess') as DesktopProcessApi;
            const controller = new AbortController();
            const command = api.runDesktopCommand({
                executable: '/tmp/notemd-near-timeout',
                args: [],
                timeoutMs: 100
            }, { signal: controller.signal });

            jest.advanceTimersByTime(90);
            controller.abort();
            await Promise.resolve();
            jest.advanceTimersByTime(260);
            const result = await command;

            expect(result).toEqual(expect.objectContaining({ cancelled: true, timedOut: false }));
            expect(processKill.mock.calls.filter(([, signal]) => signal === 'SIGTERM')).toHaveLength(1);
            expect(processKill.mock.calls.filter(([, signal]) => signal === 'SIGKILL')).toHaveLength(1);
        } finally {
            jest.dontMock('child_process');
            jest.resetModules();
            processKill.mockRestore();
            Object.defineProperty(process, 'platform', { configurable: true, value: originalPlatform });
            jest.useRealTimers();
        }
    });

    (process.platform === 'win32' ? test.skip : test)(
        'kills a POSIX descendant that ignores SIGTERM after its leader exits',
        async () => {
            const api = loadDesktopProcessApi();
            const controller = new AbortController();
            let descendantPid: number | undefined;
            const processExists = (pid: number): boolean => {
                try {
                    process.kill(pid, 0);
                    return true;
                } catch (error) {
                    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
                }
            };

            try {
                const command = api.runDesktopCommand?.({
                    executable: process.execPath,
                    args: [
                        '-e',
                        [
                            "const { spawn } = require('child_process');",
                            "const child = spawn(process.execPath, ['-e', 'process.on(\\\"SIGTERM\\\", () => {}); setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
                            "process.stdout.write(String(child.pid) + '\\n');",
                            "process.on('SIGTERM', () => process.exit(0));",
                            'setInterval(() => {}, 1000);'
                        ].join(' ')
                    ],
                    timeoutMs: 5_000
                }, {
                    signal: controller.signal,
                    onProgress: event => {
                        const parsed = Number(event.text.trim());
                        if (event.stream === 'stdout' && Number.isInteger(parsed) && parsed > 0) {
                            descendantPid = parsed;
                            controller.abort();
                        }
                    }
                });
                const result = await command;

                expect(result).toEqual(expect.objectContaining({ cancelled: true, timedOut: false }));
                expect(descendantPid).toEqual(expect.any(Number));
                if (!descendantPid) return;
                for (let attempt = 0; attempt < 20 && processExists(descendantPid); attempt++) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                expect(processExists(descendantPid)).toBe(false);
            } finally {
                if (descendantPid && processExists(descendantPid)) {
                    try {
                        process.kill(descendantPid, 'SIGKILL');
                    } catch (error) {
                        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
                    }
                }
            }
        },
        10_000
    );
});
