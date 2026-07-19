import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { gzipSync, strToU8, zipSync } from 'fflate';
import type { ManagedTectonicArtifact } from '../latexEnvironment/managedTectonicDistribution';

type InstallerApi = {
    downloadManagedRuntimeArchive: (input: {
        artifact: ManagedTectonicArtifact;
        destinationPath: string;
        signal?: AbortSignal;
        fetchImpl?: (url: string, init: Record<string, unknown>) => Promise<any>;
        nodeRequestImpl?: (...args: any[]) => any;
        nodeHttpsTimeouts?: {
            responseHeadersMs: number;
            bodyInactivityMs: number;
            totalMs: number;
        };
        onProgress?: (progress: { phase: string; receivedBytes?: number; totalBytes?: number }) => void;
    }) => Promise<void>;
    extractManagedTectonicExecutable: (archiveBytes: Uint8Array, artifact: ManagedTectonicArtifact) => Uint8Array;
    installManagedTectonic: (input: {
        artifact: ManagedTectonicArtifact;
        runtimeRoot: string;
        platform: NodeJS.Platform;
        architecture: string;
        signal?: AbortSignal;
        fetchImpl?: (url: string, init: Record<string, unknown>) => Promise<any>;
        onProgress?: (progress: { phase: string; detail?: string; receivedBytes?: number; totalBytes?: number }) => void;
        verifyExecutable?: (executablePath: string, signal?: AbortSignal) => Promise<{ ok: boolean; message: string }>;
    }) => Promise<{ status: 'installed' | 'cancelled' | 'failed'; executablePath?: string; message: string }>;
};

type ActivationApi = {
    withManagedTectonicLock: <T>(
        runtimeRoot: string,
        operation: () => Promise<T>,
        signal?: AbortSignal
    ) => Promise<T>;
    clearStaleManagedTectonicLock: (runtimeRoot: string) => {
        status: 'cleared' | 'absent' | 'active' | 'changed' | 'unsafe';
        message: string;
    };
};

function loadInstallerApi(): Partial<InstallerApi> {
    try {
        return require('../latexEnvironment/managedTectonicInstaller') as InstallerApi;
    } catch {
        return {};
    }
}

function loadActivationApi(): Partial<ActivationApi> {
    try {
        return require('../latexEnvironment/managedTectonicActivation') as ActivationApi;
    } catch {
        return {};
    }
}

function createArtifact(bytes: Uint8Array, overrides: Partial<ManagedTectonicArtifact> = {}): ManagedTectonicArtifact {
    return {
        archiveFormat: 'zip',
        compressedBytes: bytes.byteLength,
        executableName: 'tectonic.exe',
        sha256: createHash('sha256').update(bytes).digest('hex'),
        url: 'https://github.com/notemd/fake-tectonic.zip',
        ...overrides
    };
}

function responseFor(bytes: Uint8Array): any {
    let consumed = false;
    return {
        ok: true,
        status: 200,
        url: 'https://github.com/notemd/fake-tectonic.zip',
        headers: { get: (name: string) => name.toLowerCase() === 'content-length' ? String(bytes.byteLength) : null },
        body: {
            getReader: () => ({
                read: async () => {
                    if (consumed) return { done: true, value: undefined };
                    consumed = true;
                    return { done: false, value: bytes };
                }
            })
        }
    };
}

function tarEntry(name: string, body: Uint8Array, type = '0'): Uint8Array {
    const blockSize = 512;
    const header = new Uint8Array(blockSize);
    header.set(strToU8(name).subarray(0, 100), 0);
    const size = body.byteLength.toString(8).padStart(11, '0');
    header.set(strToU8(`${size}\0`), 124);
    header[156] = type.charCodeAt(0);
    const paddedBody = new Uint8Array(Math.ceil(body.byteLength / blockSize) * blockSize);
    paddedBody.set(body);
    const entry = new Uint8Array(header.byteLength + paddedBody.byteLength);
    entry.set(header);
    entry.set(paddedBody, header.byteLength);
    return entry;
}

function tarGzip(entries: Uint8Array[]): Uint8Array {
    const size = entries.reduce((total, entry) => total + entry.byteLength, 0) + 1024;
    const tar = new Uint8Array(size);
    let offset = 0;
    for (const entry of entries) {
        tar.set(entry, offset);
        offset += entry.byteLength;
    }
    return gzipSync(tar);
}

describe('managed Tectonic installer', () => {
    let runtimeRoot: string;

    beforeEach(() => {
        runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-managed-tectonic-test-'));
    });

    afterEach(() => {
        fs.rmSync(runtimeRoot, { recursive: true, force: true });
    });

    test('streams a pinned archive with byte progress and rejects an unapproved redirect', async () => {
        const api = loadInstallerApi();
        const bytes = strToU8('archive');
        const artifact = createArtifact(bytes);
        const progress: number[] = [];
        const destinationPath = path.join(runtimeRoot, 'runtime.partial');

        expect(api.downloadManagedRuntimeArchive).toBeDefined();
        if (!api.downloadManagedRuntimeArchive) return;

        await api.downloadManagedRuntimeArchive({
            artifact,
            destinationPath,
            fetchImpl: jest.fn(async () => responseFor(bytes)),
            onProgress: event => progress.push(event.receivedBytes ?? 0)
        });

        expect(fs.readFileSync(destinationPath)).toEqual(Buffer.from(bytes));
        expect(progress).toContain(bytes.byteLength);

        const redirectFetch = jest.fn(async () => ({
            ok: false,
            status: 302,
            url: artifact.url,
            headers: { get: (name: string) => name.toLowerCase() === 'location' ? 'https://example.com/runtime.zip' : null },
            body: null
        }));
        await expect(api.downloadManagedRuntimeArchive?.({
            artifact,
            destinationPath,
            fetchImpl: redirectFetch
        })).rejects.toThrow(/approved|allowlist|host/i);
    });

    test('uses Node HTTPS by default instead of renderer fetch', async () => {
        const api = loadInstallerApi();
        const bytes = strToU8('node-https-archive');
        const artifact = createArtifact(bytes);
        const destinationPath = path.join(runtimeRoot, 'node-https.partial');
        const previousFetch = globalThis.fetch;
        const rendererFetch = jest.fn(async () => { throw new Error('renderer fetch blocked by CORS'); });
        globalThis.fetch = rendererFetch as typeof fetch;
        const nodeRequestImpl = jest.fn((_url: URL, _options: Record<string, unknown>, callback: (response: any) => void) => {
            const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error?: Error) => void };
            request.end = () => {
                const response = Readable.from([Buffer.from(bytes)]) as Readable & {
                    statusCode: number;
                    headers: Record<string, string>;
                };
                response.statusCode = 200;
                response.headers = { 'content-length': String(bytes.byteLength) };
                callback(response);
            };
            request.destroy = error => { if (error) request.emit('error', error); };
            return request;
        });

        try {
            await api.downloadManagedRuntimeArchive?.({
                artifact,
                destinationPath,
                nodeRequestImpl
            });
        } finally {
            globalThis.fetch = previousFetch;
        }

        expect(fs.readFileSync(destinationPath)).toEqual(Buffer.from(bytes));
        expect(nodeRequestImpl).toHaveBeenCalledTimes(1);
        expect(rendererFetch).not.toHaveBeenCalled();
    });

    test('times out a Node HTTPS request that never returns response headers', async () => {
        jest.useFakeTimers();
        const api = loadInstallerApi();
        const controller = new AbortController();
        const destinationPath = path.join(runtimeRoot, 'stalled-headers.partial');
        const requestDestroy = jest.fn();
        const nodeRequestImpl = jest.fn(() => {
            const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error?: Error) => void };
            request.end = jest.fn();
            request.destroy = error => {
                requestDestroy(error);
                if (error) request.emit('error', error);
            };
            return request;
        });
        let downloadPromise: Promise<void> | undefined;
        let failurePromise: Promise<unknown> | undefined;

        try {
            downloadPromise = api.downloadManagedRuntimeArchive?.({
                artifact: createArtifact(strToU8('header-timeout')),
                destinationPath,
                signal: controller.signal,
                nodeRequestImpl,
                nodeHttpsTimeouts: {
                    responseHeadersMs: 25,
                    bodyInactivityMs: 100,
                    totalMs: 200
                }
            });

            expect(downloadPromise).toBeDefined();
            failurePromise = downloadPromise?.catch(error => error);
            await jest.advanceTimersByTimeAsync(25);
            expect(requestDestroy).toHaveBeenCalledWith(expect.objectContaining({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'response-headers',
                timeoutMs: 25
            }));
            await expect(failurePromise).resolves.toMatchObject({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'response-headers',
                timeoutMs: 25
            });
            expect(fs.existsSync(destinationPath)).toBe(false);
        } finally {
            controller.abort();
            await downloadPromise?.catch(() => undefined);
            await failurePromise;
            jest.useRealTimers();
        }
    });

    test('times out an inactive Node HTTPS response body and removes the partial archive', async () => {
        jest.useFakeTimers();
        const api = loadInstallerApi();
        const controller = new AbortController();
        const bytes = strToU8('body-inactivity-timeout');
        const destinationPath = path.join(runtimeRoot, 'stalled-body.partial');
        let sentFirstChunk = false;
        const response = new Readable({
            read() {
                if (sentFirstChunk) return;
                sentFirstChunk = true;
                this.push(Buffer.from(bytes.subarray(0, 4)));
            }
        }) as Readable & { statusCode: number; headers: Record<string, string> };
        response.statusCode = 200;
        response.headers = { 'content-length': String(bytes.byteLength) };
        const responseDestroy = jest.spyOn(response, 'destroy');
        const nodeRequestImpl = jest.fn((_url: URL, _options: Record<string, unknown>, callback: (message: any) => void) => {
            const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error?: Error) => void };
            request.end = () => callback(response);
            request.destroy = error => { if (error) request.emit('error', error); };
            return request;
        });
        let firstChunkWritten!: () => void;
        const firstChunkProgress = new Promise<void>(resolve => { firstChunkWritten = resolve; });
        let downloadPromise: Promise<void> | undefined;
        let failurePromise: Promise<unknown> | undefined;

        try {
            downloadPromise = api.downloadManagedRuntimeArchive?.({
                artifact: createArtifact(bytes),
                destinationPath,
                signal: controller.signal,
                nodeRequestImpl,
                nodeHttpsTimeouts: {
                    responseHeadersMs: 100,
                    bodyInactivityMs: 25,
                    totalMs: 200
                },
                onProgress: () => firstChunkWritten()
            });

            expect(downloadPromise).toBeDefined();
            failurePromise = downloadPromise?.catch(error => error);
            await firstChunkProgress;
            await jest.advanceTimersByTimeAsync(25);
            expect(responseDestroy).toHaveBeenCalledWith(expect.objectContaining({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'body-inactivity',
                timeoutMs: 25
            }));
            await expect(failurePromise).resolves.toMatchObject({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'body-inactivity',
                timeoutMs: 25
            });
            expect(fs.existsSync(destinationPath)).toBe(false);
        } finally {
            controller.abort();
            await downloadPromise?.catch(() => undefined);
            await failurePromise;
            jest.useRealTimers();
        }
    });

    test('enforces a total Node HTTPS download timeout and removes the partial archive', async () => {
        jest.useFakeTimers();
        const api = loadInstallerApi();
        const controller = new AbortController();
        const bytes = strToU8('total-download-timeout');
        const destinationPath = path.join(runtimeRoot, 'total-timeout.partial');
        let sentFirstChunk = false;
        const response = new Readable({
            read() {
                if (sentFirstChunk) return;
                sentFirstChunk = true;
                this.push(Buffer.from(bytes.subarray(0, 4)));
            }
        }) as Readable & { statusCode: number; headers: Record<string, string> };
        response.statusCode = 200;
        response.headers = { 'content-length': String(bytes.byteLength) };
        const responseDestroy = jest.spyOn(response, 'destroy');
        const nodeRequestImpl = jest.fn((_url: URL, _options: Record<string, unknown>, callback: (message: any) => void) => {
            const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error?: Error) => void };
            request.end = () => callback(response);
            request.destroy = error => { if (error) request.emit('error', error); };
            return request;
        });
        let firstChunkWritten!: () => void;
        const firstChunkProgress = new Promise<void>(resolve => { firstChunkWritten = resolve; });
        let downloadPromise: Promise<void> | undefined;
        let failurePromise: Promise<unknown> | undefined;

        try {
            downloadPromise = api.downloadManagedRuntimeArchive?.({
                artifact: createArtifact(bytes),
                destinationPath,
                signal: controller.signal,
                nodeRequestImpl,
                nodeHttpsTimeouts: {
                    responseHeadersMs: 100,
                    bodyInactivityMs: 100,
                    totalMs: 25
                },
                onProgress: () => firstChunkWritten()
            });

            expect(downloadPromise).toBeDefined();
            failurePromise = downloadPromise?.catch(error => error);
            await firstChunkProgress;
            await jest.advanceTimersByTimeAsync(25);
            expect(responseDestroy).toHaveBeenCalledWith(expect.objectContaining({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'total',
                timeoutMs: 25
            }));
            await expect(failurePromise).resolves.toMatchObject({
                name: 'ManagedRuntimeDownloadTimeoutError',
                phase: 'total',
                timeoutMs: 25
            });
            expect(fs.existsSync(destinationPath)).toBe(false);
        } finally {
            controller.abort();
            await downloadPromise?.catch(() => undefined);
            await failurePromise;
            jest.useRealTimers();
        }
    });

    test('extracts only the expected executable and rejects traversal entries', () => {
        const api = loadInstallerApi();
        const executable = strToU8('tectonic-binary');
        const archive = zipSync({ 'release/tectonic.exe': executable });
        const artifact = createArtifact(archive);

        expect(api.extractManagedTectonicExecutable).toBeDefined();
        if (!api.extractManagedTectonicExecutable) return;

        expect(api.extractManagedTectonicExecutable(archive, artifact)).toEqual(executable);

        const traversalArchive = zipSync({ '../tectonic.exe': executable });
        expect(() => api.extractManagedTectonicExecutable?.(traversalArchive, createArtifact(traversalArchive))).toThrow(/unsafe|traversal|archive/i);
    });

    test('accepts safe PAX tar metadata and rejects tar links', () => {
        const api = loadInstallerApi();
        const executable = strToU8('tectonic-musl-binary');
        const paxBody = strToU8('25 path=release/tectonic\n');
        const archive = tarGzip([
            tarEntry('PaxHeaders/tectonic', paxBody, 'x'),
            tarEntry('release/tectonic', executable)
        ]);
        const artifact = createArtifact(archive, {
            archiveFormat: 'tar-gz',
            executableName: 'tectonic'
        });

        expect(api.extractManagedTectonicExecutable?.(archive, artifact)).toEqual(executable);

        const linkedArchive = tarGzip([tarEntry('release/tectonic', new Uint8Array(), '2')]);
        expect(() => api.extractManagedTectonicExecutable?.(linkedArchive, createArtifact(linkedArchive, {
            archiveFormat: 'tar-gz',
            executableName: 'tectonic'
        }))).toThrow(/links are not allowed/i);
    });

    test('removes a partial archive when cancellation arrives between streamed chunks', async () => {
        const api = loadInstallerApi();
        const controller = new AbortController();
        const bytes = strToU8('two-stream-chunks');
        const destinationPath = path.join(runtimeRoot, 'cancelled.partial');
        let reads = 0;
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            status: 200,
            url: 'https://github.com/notemd/fake-tectonic.zip',
            headers: { get: (name: string) => name.toLowerCase() === 'content-length' ? String(bytes.byteLength) : null },
            body: {
                getReader: () => ({
                    read: async () => {
                        reads += 1;
                        if (reads === 1) {
                            controller.abort();
                            return { done: false, value: bytes.subarray(0, 4) };
                        }
                        return { done: false, value: bytes.subarray(4) };
                    }
                })
            }
        }));

        await expect(api.downloadManagedRuntimeArchive?.({
            artifact: createArtifact(bytes),
            destinationPath,
            signal: controller.signal,
            fetchImpl
        })).rejects.toMatchObject({ name: 'AbortError' });
        expect(fs.existsSync(destinationPath)).toBe(false);
        expect(reads).toBe(1);
    });

    test('verifies, smoke-checks, and atomically activates the managed executable', async () => {
        const api = loadInstallerApi();
        const archive = zipSync({ 'tectonic.exe': strToU8('verified-runtime') });
        const artifact = createArtifact(archive);
        const phases: string[] = [];
        const verifyExecutable = jest.fn(async (executablePath: string, _signal?: AbortSignal) => ({
            ok: fs.existsSync(executablePath),
            message: 'CircuitikZ smoke passed'
        }));

        expect(api.installManagedTectonic).toBeDefined();
        if (!api.installManagedTectonic) return;

        const result = await api.installManagedTectonic({
            artifact,
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(archive)),
            verifyExecutable,
            onProgress: progress => phases.push(progress.phase)
        });

        expect(result).toEqual(expect.objectContaining({ status: 'installed' }));
        expect(fs.readFileSync(result?.executablePath as string, 'utf8')).toBe('verified-runtime');
        expect(verifyExecutable).toHaveBeenCalledTimes(1);
        expect(verifyExecutable.mock.calls[0][0]).not.toBe(result?.executablePath);
        expect(verifyExecutable.mock.calls[0][0]).toMatch(/\.staging-.*tectonic\.exe$/);
        expect(verifyExecutable.mock.calls[0][1]).toBeUndefined();
        expect(phases).toEqual(expect.arrayContaining(['download', 'checksum', 'extract', 'smoke', 'activate', 'complete']));
        expect(fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json'))).toBe(true);
        const ownershipPath = path.join(path.dirname(result?.executablePath as string), '.notemd-managed-runtime.json');
        expect(JSON.parse(fs.readFileSync(ownershipPath, 'utf8'))).toEqual(expect.objectContaining({
            executablePath: result?.executablePath,
            executableSha256: createHash('sha256').update('verified-runtime').digest('hex')
        }));
        expect(fs.readdirSync(runtimeRoot).some(name => name.startsWith('.staging-'))).toBe(false);
    });

    test('cleans staging and preserves an existing runtime after checksum failure or cancellation', async () => {
        const api = loadInstallerApi();
        const existingDirectory = path.join(runtimeRoot, 'tectonic-0.16.9', 'win32-x64');
        fs.mkdirSync(existingDirectory, { recursive: true });
        const existingExecutable = path.join(existingDirectory, 'tectonic.exe');
        fs.writeFileSync(existingExecutable, 'previous-runtime');
        const archive = zipSync({ 'tectonic.exe': strToU8('replacement') });
        const artifact = createArtifact(archive, { sha256: '0'.repeat(64) });

        expect(api.installManagedTectonic).toBeDefined();
        if (!api.installManagedTectonic) return;

        const failed = await api.installManagedTectonic({
            artifact,
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(archive)),
            verifyExecutable: jest.fn()
        });

        expect(failed?.status).toBe('failed');
        expect(fs.readFileSync(existingExecutable, 'utf8')).toBe('previous-runtime');
        expect(fs.readdirSync(runtimeRoot).some(name => name.startsWith('.staging-'))).toBe(false);

        const controller = new AbortController();
        controller.abort();
        const cancelled = await api.installManagedTectonic({
            artifact: createArtifact(archive),
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            signal: controller.signal,
            fetchImpl: jest.fn(),
            verifyExecutable: jest.fn()
        });
        expect(cancelled?.status).toBe('cancelled');
        expect(fs.readFileSync(existingExecutable, 'utf8')).toBe('previous-runtime');
    });

    test('serializes concurrent installs and activates immutable digest-qualified runtimes', async () => {
        const api = loadInstallerApi();
        const firstArchive = zipSync({ 'tectonic.exe': strToU8('first-runtime') });
        const secondArchive = zipSync({ 'tectonic.exe': strToU8('second-runtime') });
        let activeVerifications = 0;
        let maximumActiveVerifications = 0;
        const verifyExecutable = async () => {
            activeVerifications += 1;
            maximumActiveVerifications = Math.max(maximumActiveVerifications, activeVerifications);
            await new Promise(resolve => setTimeout(resolve, 25));
            activeVerifications -= 1;
            return { ok: true, message: 'CircuitikZ smoke passed' };
        };

        expect(api.installManagedTectonic).toBeDefined();
        if (!api.installManagedTectonic) return;

        const [first, second] = await Promise.all([
            api.installManagedTectonic({
                artifact: createArtifact(firstArchive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(firstArchive)),
                verifyExecutable
            }),
            api.installManagedTectonic({
                artifact: createArtifact(secondArchive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(secondArchive)),
                verifyExecutable
            })
        ]);

        expect(first.status).toBe('installed');
        expect(second.status).toBe('installed');
        expect(maximumActiveVerifications).toBe(1);
        expect(first.executablePath).not.toBe(second.executablePath);
        expect(first.executablePath).toContain(createArtifact(firstArchive).sha256.slice(0, 16));
        expect(second.executablePath).toContain(createArtifact(secondArchive).sha256.slice(0, 16));
    });

    test('does not activate a corrupted preseeded digest-qualified target', async () => {
        const api = loadInstallerApi();
        const executableBytes = strToU8('verified-runtime');
        const archive = zipSync({ 'tectonic.exe': executableBytes });
        const artifact = createArtifact(archive);
        const preseededExecutable = path.join(
            runtimeRoot,
            `tectonic-0.16.9-${artifact.sha256}`,
            'win32-x64',
            'tectonic.exe'
        );
        fs.mkdirSync(path.dirname(preseededExecutable), { recursive: true });
        fs.writeFileSync(preseededExecutable, 'corrupted-preseed');

        const installed = await api.installManagedTectonic?.({
            artifact,
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(archive)),
            verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
        });

        expect(installed).toEqual(expect.objectContaining({ status: 'installed' }));
        expect(installed?.executablePath).not.toBe(preseededExecutable);
        expect(fs.readFileSync(installed?.executablePath as string)).toEqual(Buffer.from(executableBytes));
        expect(fs.readFileSync(preseededExecutable, 'utf8')).toBe('corrupted-preseed');
    });

    test('does not adopt an unowned same-byte target or overwrite its user files', async () => {
        const api = loadInstallerApi();
        const executableBytes = strToU8('same-byte-runtime');
        const archive = zipSync({ 'tectonic.exe': executableBytes });
        const artifact = createArtifact(archive);
        const preseededDirectory = path.join(
            runtimeRoot,
            `tectonic-0.16.9-${artifact.sha256}`,
            'win32-x64'
        );
        const preseededExecutable = path.join(preseededDirectory, 'tectonic.exe');
        const userFile = path.join(preseededDirectory, 'user-notes.txt');
        fs.mkdirSync(preseededDirectory, { recursive: true });
        fs.writeFileSync(preseededExecutable, executableBytes);
        fs.writeFileSync(userFile, 'preserve me');

        const installed = await api.installManagedTectonic?.({
            artifact,
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(archive)),
            verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
        });

        expect(installed).toEqual(expect.objectContaining({ status: 'installed' }));
        expect(installed?.executablePath).not.toBe(preseededExecutable);
        expect(fs.readFileSync(preseededExecutable)).toEqual(Buffer.from(executableBytes));
        expect(fs.readFileSync(userFile, 'utf8')).toBe('preserve me');
        expect(fs.existsSync(path.join(preseededDirectory, '.notemd-managed-runtime.json'))).toBe(false);
    });

    test('does not reuse an owned POSIX target whose executable lacks execute permission', async () => {
        const api = loadInstallerApi();
        const executableBytes = strToU8('posix-runtime');
        const archive = zipSync({ tectonic: executableBytes });
        const artifact = createArtifact(archive, { executableName: 'tectonic' });
        const ownedDirectory = path.join(
            runtimeRoot,
            `tectonic-0.16.9-${artifact.sha256}`,
            'linux-x64'
        );
        const ownedExecutable = path.join(ownedDirectory, 'tectonic');
        fs.mkdirSync(ownedDirectory, { recursive: true });
        fs.writeFileSync(ownedExecutable, executableBytes);
        fs.writeFileSync(path.join(ownedDirectory, '.notemd-managed-runtime.json'), JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: 'linux',
            architecture: 'x64',
            executablePath: ownedExecutable,
            archiveUrl: artifact.url,
            sha256: artifact.sha256,
            executableSha256: createHash('sha256').update(executableBytes).digest('hex'),
            installedAt: new Date().toISOString()
        }));
        const accessSync = fs.accessSync;
        const access = jest.spyOn(fs, 'accessSync').mockImplementation((candidate, mode) => {
            if (String(candidate) === ownedExecutable && mode === fs.constants.X_OK) {
                throw Object.assign(new Error('not executable'), { code: 'EACCES' });
            }
            return accessSync(candidate, mode);
        });

        try {
            const installed = await api.installManagedTectonic?.({
                artifact,
                runtimeRoot,
                platform: 'linux',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(archive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
            });

            expect(installed).toEqual(expect.objectContaining({ status: 'installed' }));
            expect(installed?.executablePath).not.toBe(ownedExecutable);
            expect(fs.readFileSync(ownedExecutable)).toEqual(Buffer.from(executableBytes));
        } finally {
            access.mockRestore();
        }
    });

    test('registers the legacy active pointer target before replacing the pointer', async () => {
        const api = loadInstallerApi();
        const legacyExecutable = path.join(runtimeRoot, 'legacy-release', 'win32-x64', 'tectonic.exe');
        fs.mkdirSync(path.dirname(legacyExecutable), { recursive: true });
        fs.writeFileSync(legacyExecutable, 'legacy-runtime');
        fs.writeFileSync(path.join(runtimeRoot, 'managed-runtime.json'), JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.8',
            platform: 'win32',
            architecture: 'x64',
            executablePath: legacyExecutable,
            archiveUrl: 'https://github.com/notemd/legacy.zip',
            sha256: '5'.repeat(64),
            installedAt: new Date().toISOString()
        }));
        const archive = zipSync({ 'tectonic.exe': strToU8('replacement-runtime') });

        const installed = await api.installManagedTectonic?.({
            artifact: createArtifact(archive),
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(archive)),
            verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
        });

        expect(installed).toEqual(expect.objectContaining({ status: 'installed' }));
        expect(JSON.parse(fs.readFileSync(
            path.join(path.dirname(legacyExecutable), '.notemd-managed-runtime.json'),
            'utf8'
        ))).toEqual(expect.objectContaining({
            executablePath: legacyExecutable,
            executableSha256: createHash('sha256').update('legacy-runtime').digest('hex')
        }));
    });

    test('preserves the last active manifest when pointer replacement fails', async () => {
        const api = loadInstallerApi();
        const firstArchive = zipSync({ 'tectonic.exe': strToU8('last-valid-runtime') });
        const secondArchive = zipSync({ 'tectonic.exe': strToU8('failed-runtime') });
        expect(api.installManagedTectonic).toBeDefined();
        if (!api.installManagedTectonic) return;

        const first = await api.installManagedTectonic({
            artifact: createArtifact(firstArchive),
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(firstArchive)),
            verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
        });
        const manifestPath = path.join(runtimeRoot, 'managed-runtime.json');
        const lastValidManifest = fs.readFileSync(manifestPath, 'utf8');
        const renameSync = fs.renameSync;
        const rename = jest.spyOn(fs, 'renameSync').mockImplementation((source, destination) => {
            if (String(source).endsWith('managed-runtime.json.new') && String(destination).endsWith('managed-runtime.json')) {
                throw new Error('injected pointer replacement failure');
            }
            return renameSync(source, destination);
        });

        try {
            const failed = await api.installManagedTectonic({
                artifact: createArtifact(secondArchive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(secondArchive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
            });

            expect(failed).toEqual(expect.objectContaining({
                status: 'failed',
                message: expect.stringContaining('injected pointer replacement failure')
            }));
            expect(fs.readFileSync(manifestPath, 'utf8')).toBe(lastValidManifest);
            expect(fs.readFileSync(first.executablePath as string, 'utf8')).toBe('last-valid-runtime');
        } finally {
            rename.mockRestore();
        }
    });

    test('does not report activation failure after the new pointer committed and old-pointer cleanup fails', async () => {
        const api = loadInstallerApi();
        const firstArchive = zipSync({ 'tectonic.exe': strToU8('first-runtime') });
        const secondArchive = zipSync({ 'tectonic.exe': strToU8('second-runtime') });
        await api.installManagedTectonic?.({
            artifact: createArtifact(firstArchive),
            runtimeRoot,
            platform: 'win32',
            architecture: 'x64',
            fetchImpl: jest.fn(async () => responseFor(firstArchive)),
            verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
        });
        const activePath = path.join(runtimeRoot, 'managed-runtime.json');
        const previousPath = path.join(runtimeRoot, 'managed-runtime.json.previous');
        const rmSync = fs.rmSync;
        const remove = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
            if (
                String(target) === previousPath
                && fs.existsSync(activePath)
                && fs.existsSync(previousPath)
            ) {
                throw new Error('injected committed-pointer cleanup failure');
            }
            return rmSync(target, options);
        });

        const cleanupDetails: string[] = [];
        try {
            const installed = await api.installManagedTectonic?.({
                artifact: createArtifact(secondArchive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(secondArchive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' }),
                onProgress: progress => {
                    if (progress.phase === 'cleanup' && progress.detail) cleanupDetails.push(progress.detail);
                }
            });

            expect(installed).toEqual(expect.objectContaining({ status: 'installed' }));
            expect(JSON.parse(fs.readFileSync(activePath, 'utf8')).executablePath).toBe(installed?.executablePath);
            expect(cleanupDetails.join('\n')).toContain('injected committed-pointer cleanup failure');
        } finally {
            remove.mockRestore();
        }
    });

    test('cancels promptly while waiting for the managed-runtime lock without starting a duplicate operation', async () => {
        const api = loadActivationApi();
        expect(api.withManagedTectonicLock).toBeDefined();
        if (!api.withManagedTectonicLock) return;

        let releaseFirst!: () => void;
        let firstAcquired!: () => void;
        const firstAcquiredPromise = new Promise<void>(resolve => { firstAcquired = resolve; });
        const releaseFirstPromise = new Promise<void>(resolve => { releaseFirst = resolve; });
        const first = api.withManagedTectonicLock(runtimeRoot, async () => {
            firstAcquired();
            await releaseFirstPromise;
        });
        await firstAcquiredPromise;

        const controller = new AbortController();
        const duplicateOperation = jest.fn(async () => undefined);
        const second = api.withManagedTectonicLock(runtimeRoot, duplicateOperation, controller.signal);
        controller.abort();

        try {
            const outcome = await Promise.race([
                second.then(() => 'completed', error => error instanceof Error ? error.name : String(error)),
                new Promise<string>(resolve => setTimeout(() => resolve('still-waiting'), 100))
            ]);
            expect(outcome).toBe('AbortError');
            expect(duplicateOperation).not.toHaveBeenCalled();
        } finally {
            releaseFirst();
            await first;
            await second.catch(() => undefined);
        }
    });

    test('fails safely when a stale-lock check races with a replacement live owner', async () => {
        const api = loadActivationApi();
        expect(api.withManagedTectonicLock).toBeDefined();
        if (!api.withManagedTectonicLock) return;

        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        const ownerPath = path.join(lockPath, 'owner.json');
        fs.mkdirSync(lockPath);
        fs.writeFileSync(ownerPath, JSON.stringify({ pid: 999_999_999, token: 'stale-owner' }));
        const replacementOwner = { pid: process.pid, token: 'replacement-live-owner' };
        const kill = jest.spyOn(process, 'kill').mockImplementationOnce((() => {
            fs.writeFileSync(ownerPath, JSON.stringify(replacementOwner));
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);
        const operation = jest.fn(async () => undefined);

        try {
            await expect(api.withManagedTectonicLock(runtimeRoot, operation)).rejects.toThrow(/stale|lock/i);
            expect(operation).not.toHaveBeenCalled();
            expect(JSON.parse(fs.readFileSync(ownerPath, 'utf8'))).toEqual(replacementOwner);
        } finally {
            kill.mockRestore();
        }
    });

    test('explicitly clears a stable dead-owner lock and permits a retry', async () => {
        const api = loadActivationApi();
        expect(api.clearStaleManagedTectonicLock).toBeDefined();
        if (!api.clearStaleManagedTectonicLock || !api.withManagedTectonicLock) return;
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        fs.mkdirSync(lockPath);
        fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({ pid: 999_999_999, token: 'dead-owner' }));
        const kill = jest.spyOn(process, 'kill').mockImplementation((() => {
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);

        try {
            expect(api.clearStaleManagedTectonicLock(runtimeRoot)).toEqual(expect.objectContaining({ status: 'cleared' }));
            expect(fs.existsSync(lockPath)).toBe(false);
            await expect(api.withManagedTectonicLock(runtimeRoot, async () => 'retried')).resolves.toBe('retried');
        } finally {
            kill.mockRestore();
        }
    });

    test('explicit stale cleanup preserves a replacement owner observed after claiming cleanup', () => {
        const api = loadActivationApi();
        expect(api.clearStaleManagedTectonicLock).toBeDefined();
        if (!api.clearStaleManagedTectonicLock) return;
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        const ownerPath = path.join(lockPath, 'owner.json');
        fs.mkdirSync(lockPath);
        fs.writeFileSync(ownerPath, JSON.stringify({ pid: 999_999_999, token: 'dead-owner' }));
        const replacementOwner = { pid: process.pid, token: 'replacement-owner' };
        const readFileSync = fs.readFileSync;
        let ownerReads = 0;
        const read = jest.spyOn(fs, 'readFileSync').mockImplementation((candidate, options) => {
            if (String(candidate) === ownerPath) {
                ownerReads += 1;
                if (ownerReads === 2) fs.writeFileSync(ownerPath, JSON.stringify(replacementOwner));
            }
            return readFileSync(candidate, options as any);
        });
        const kill = jest.spyOn(process, 'kill').mockImplementation(((pid: number) => {
            if (pid === replacementOwner.pid) return true;
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);

        try {
            expect(api.clearStaleManagedTectonicLock(runtimeRoot)).toEqual(expect.objectContaining({ status: 'changed' }));
            expect(JSON.parse(fs.readFileSync(ownerPath, 'utf8'))).toEqual(replacementOwner);
        } finally {
            read.mockRestore();
            kill.mockRestore();
        }
    });

    test('explicit stale cleanup preserves a replacement lock swapped in at the final commit boundary', () => {
        const api = loadActivationApi();
        expect(api.clearStaleManagedTectonicLock).toBeDefined();
        if (!api.clearStaleManagedTectonicLock) return;
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        const displacedPath = path.join(runtimeRoot, '.displaced-stale-lock');
        const ownerPath = path.join(lockPath, 'owner.json');
        fs.mkdirSync(lockPath);
        fs.writeFileSync(ownerPath, JSON.stringify({ pid: 999_999_999, token: 'dead-owner' }));
        const replacementOwner = { pid: process.pid, token: 'replacement-at-commit' };
        const renameSync = fs.renameSync;
        let injected = false;
        const rename = jest.spyOn(fs, 'renameSync').mockImplementation((source, destination) => {
            if (!injected && String(source) === lockPath) {
                injected = true;
                renameSync(lockPath, displacedPath);
                fs.mkdirSync(lockPath);
                fs.writeFileSync(ownerPath, JSON.stringify(replacementOwner));
            }
            return renameSync(source, destination);
        });
        const kill = jest.spyOn(process, 'kill').mockImplementation(((pid: number) => {
            if (pid === replacementOwner.pid) return true;
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);

        try {
            expect(api.clearStaleManagedTectonicLock(runtimeRoot)).not.toEqual(expect.objectContaining({ status: 'cleared' }));
            expect(JSON.parse(fs.readFileSync(ownerPath, 'utf8'))).toEqual(replacementOwner);
        } finally {
            rename.mockRestore();
            kill.mockRestore();
        }
    });

    test('does not strand the stale-cleanup contender claim when claim recording fails', () => {
        const api = loadActivationApi();
        expect(api.clearStaleManagedTectonicLock).toBeDefined();
        if (!api.clearStaleManagedTectonicLock) return;
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        const claimPath = path.join(lockPath, '.stale-cleanup-claim.json');
        fs.mkdirSync(lockPath);
        fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({ pid: 999_999_999, token: 'dead-owner' }));
        const writeFileSync = fs.writeFileSync;
        const write = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, contents, options) => {
            if (typeof target === 'number') throw new Error('injected cleanup claim write failure');
            return writeFileSync(target, contents, options as any);
        });
        const kill = jest.spyOn(process, 'kill').mockImplementation((() => {
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);

        try {
            expect(api.clearStaleManagedTectonicLock(runtimeRoot)).toEqual(expect.objectContaining({ status: 'unsafe' }));
            expect(fs.existsSync(claimPath)).toBe(false);
            expect(fs.existsSync(lockPath)).toBe(true);
        } finally {
            write.mockRestore();
            kill.mockRestore();
        }
    });

    test('reports staging cleanup failure without changing a committed install to failed', async () => {
        const api = loadInstallerApi();
        const archive = zipSync({ 'tectonic.exe': strToU8('staging-cleanup-runtime') });
        const cleanupDetails: string[] = [];
        const rmSync = fs.rmSync;
        const remove = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
            if (String(target).includes('.staging-') && fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json'))) {
                throw new Error('injected staging cleanup failure');
            }
            return rmSync(target, options);
        });

        try {
            await expect(api.installManagedTectonic?.({
                artifact: createArtifact(archive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(archive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' }),
                onProgress: progress => {
                    if (progress.phase === 'cleanup' && progress.detail) cleanupDetails.push(progress.detail);
                }
            })).resolves.toEqual(expect.objectContaining({ status: 'installed' }));
            expect(cleanupDetails.join('\n')).toContain('injected staging cleanup failure');
        } finally {
            remove.mockRestore();
        }
    });

    test('reports lock-release cleanup failure without changing a committed install to failed', async () => {
        const api = loadInstallerApi();
        const archive = zipSync({ 'tectonic.exe': strToU8('lock-cleanup-runtime') });
        const cleanupDetails: string[] = [];
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        const rmSync = fs.rmSync;
        const remove = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
            if (String(target) === lockPath && fs.existsSync(path.join(lockPath, 'owner.json'))) {
                throw new Error('injected lock release failure');
            }
            return rmSync(target, options);
        });

        try {
            await expect(api.installManagedTectonic?.({
                artifact: createArtifact(archive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(archive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' }),
                onProgress: progress => {
                    if (progress.phase === 'cleanup' && progress.detail) cleanupDetails.push(progress.detail);
                }
            })).resolves.toEqual(expect.objectContaining({ status: 'installed' }));
            expect(cleanupDetails.join('\n')).toContain('injected lock release failure');
        } finally {
            remove.mockRestore();
        }
    });

    test('does not strand the filesystem lock when lock ownership cannot be recorded', async () => {
        const api = loadInstallerApi();
        const archive = zipSync({ 'tectonic.exe': strToU8('runtime') });
        const writeFileSync = fs.writeFileSync;
        const write = jest.spyOn(fs, 'writeFileSync').mockImplementation((file, contents, options) => {
            if (String(file).endsWith(path.join('.managed-runtime.lock', 'owner.json'))) {
                throw new Error('injected lock owner write failure');
            }
            return writeFileSync(file, contents, options as any);
        });

        try {
            const failed = await api.installManagedTectonic?.({
                artifact: createArtifact(archive),
                runtimeRoot,
                platform: 'win32',
                architecture: 'x64',
                fetchImpl: jest.fn(async () => responseFor(archive)),
                verifyExecutable: async () => ({ ok: true, message: 'CircuitikZ smoke passed' })
            });

            expect(failed).toEqual(expect.objectContaining({
                status: 'failed',
                message: expect.stringContaining('injected lock owner write failure')
            }));
            expect(fs.existsSync(path.join(runtimeRoot, '.managed-runtime.lock'))).toBe(false);
        } finally {
            write.mockRestore();
        }
    });
});
