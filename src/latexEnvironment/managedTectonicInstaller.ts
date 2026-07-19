import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import type { ClientRequest, IncomingMessage } from 'http';
import { request as httpsRequest, RequestOptions } from 'https';
import * as path from 'path';
import { gunzipSync, unzipSync } from 'fflate';
import { probeCircuitikzEnvironment } from '../diagram/adapters/circuitikz/circuitikzEnvironment';
import { runDesktopCommand } from '../platform/desktopProcess';
import {
    isSafeManagedArchiveEntry,
    MANAGED_TECTONIC_VERSION,
    ManagedTectonicArtifact
} from './managedTectonicDistribution';
import {
    activateManagedTectonic,
    ManagedTectonicManifest,
    resolveManagedTectonicTargetDirectory,
    withManagedTectonicLock
} from './managedTectonicActivation';

const ALLOWED_DOWNLOAD_HOSTS = new Set([
    'github.com',
    'objects.githubusercontent.com',
    'release-assets.githubusercontent.com'
]);
const MAX_REDIRECTS = 5;
const TAR_BLOCK_BYTES = 512;

export interface ManagedRuntimeDownloadTimeouts {
    responseHeadersMs: number;
    bodyInactivityMs: number;
    totalMs: number;
}

export const DEFAULT_MANAGED_RUNTIME_DOWNLOAD_TIMEOUTS: Readonly<ManagedRuntimeDownloadTimeouts> = Object.freeze({
    responseHeadersMs: 30_000,
    bodyInactivityMs: 30_000,
    totalMs: 10 * 60_000
});

export type ManagedRuntimeDownloadTimeoutPhase = 'response-headers' | 'body-inactivity' | 'total';

export class ManagedRuntimeDownloadTimeoutError extends Error {
    readonly name = 'ManagedRuntimeDownloadTimeoutError';

    constructor(
        readonly phase: ManagedRuntimeDownloadTimeoutPhase,
        readonly timeoutMs: number
    ) {
        super(`Managed runtime download timed out during ${phase} after ${timeoutMs} ms.`);
    }
}

export interface ManagedTectonicInstallProgress {
    phase: 'download' | 'checksum' | 'extract' | 'smoke' | 'activate' | 'complete' | 'cleanup';
    detail?: string;
    receivedBytes?: number;
    totalBytes?: number;
}

type FetchImplementation = (url: string, init: Record<string, unknown>) => Promise<any>;
type NodeHttpsRequestImplementation = (
    url: URL,
    options: RequestOptions,
    callback: (response: IncomingMessage) => void
) => ClientRequest;

function createAbortError(): Error {
    return Object.assign(new Error('Managed runtime download cancelled.'), { name: 'AbortError' });
}

function downloadAbortReason(signal: AbortSignal | undefined): Error {
    const reason = signal?.reason;
    return reason instanceof ManagedRuntimeDownloadTimeoutError ? reason : createAbortError();
}

function resolveManagedRuntimeDownloadTimeouts(
    timeouts: ManagedRuntimeDownloadTimeouts | undefined
): Readonly<ManagedRuntimeDownloadTimeouts> {
    const resolved = timeouts ?? DEFAULT_MANAGED_RUNTIME_DOWNLOAD_TIMEOUTS;
    for (const [name, durationMs] of Object.entries(resolved)) {
        if (!Number.isFinite(durationMs) || durationMs <= 0) {
            throw new RangeError(`Managed runtime download timeout ${name} must be a positive finite duration.`);
        }
    }
    return resolved;
}

function assertApprovedDownloadUrl(url: URL): void {
    if (url.protocol !== 'https:' || !ALLOWED_DOWNLOAD_HOSTS.has(url.hostname.toLowerCase())) {
        throw new Error(`Managed runtime download host is not approved: ${url.hostname || url.href}`);
    }
}

function isRedirectStatus(status: number): boolean {
    return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function openApprovedResponse(
    initialUrl: string,
    signal: AbortSignal | undefined,
    fetchImpl: FetchImplementation
): Promise<any> {
    let currentUrl = new URL(initialUrl);
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
        assertApprovedDownloadUrl(currentUrl);
        const response = await fetchImpl(currentUrl.href, { method: 'GET', redirect: 'manual', signal });
        if (!isRedirectStatus(response.status)) {
            if (!response.ok) throw new Error(`Managed runtime download failed with HTTP ${response.status}.`);
            return response;
        }
        const location = response.headers?.get?.('location');
        if (!location) throw new Error('Managed runtime redirect did not include a location.');
        currentUrl = new URL(location, currentUrl);
    }
    throw new Error(`Managed runtime download exceeded ${MAX_REDIRECTS} redirects.`);
}

function openApprovedNodeResponse(
    currentUrl: URL,
    signal: AbortSignal | undefined,
    requestImpl: NodeHttpsRequestImplementation,
    responseHeadersTimeoutMs: number,
    redirectCount = 0
): Promise<IncomingMessage> {
    if (signal?.aborted) return Promise.reject(downloadAbortReason(signal));
    if (redirectCount > MAX_REDIRECTS) {
        return Promise.reject(new Error(`Managed runtime download exceeded ${MAX_REDIRECTS} redirects.`));
    }
    assertApprovedDownloadUrl(currentUrl);

    return new Promise((resolve, reject) => {
        let settled = false;
        let request: ClientRequest;
        let responseHeadersTimer: ReturnType<typeof setTimeout> | undefined;
        const cleanup = (): void => {
            if (responseHeadersTimer) clearTimeout(responseHeadersTimer);
            signal?.removeEventListener('abort', cancel);
        };
        const rejectOnce = (error: Error): void => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };
        const cancel = (): void => {
            const error = downloadAbortReason(signal);
            request.destroy(error);
            rejectOnce(error);
        };

        try {
            request = requestImpl(currentUrl, {
                method: 'GET',
                headers: { 'User-Agent': 'Notemd managed Tectonic installer' }
            }, response => {
                if (settled) {
                    response.destroy();
                    return;
                }
                const status = response.statusCode ?? 0;
                if (isRedirectStatus(status)) {
                    const location = response.headers.location;
                    response.resume();
                    if (!location) {
                        rejectOnce(new Error('Managed runtime redirect did not include a location.'));
                        return;
                    }
                    settled = true;
                    cleanup();
                    const nextUrl = new URL(location, currentUrl);
                    void openApprovedNodeResponse(
                        nextUrl,
                        signal,
                        requestImpl,
                        responseHeadersTimeoutMs,
                        redirectCount + 1
                    ).then(resolve, reject);
                    return;
                }
                if (status < 200 || status >= 300) {
                    response.resume();
                    rejectOnce(new Error(`Managed runtime download failed with HTTP ${status}.`));
                    return;
                }
                settled = true;
                cleanup();
                resolve(response);
            });
        } catch (error) {
            rejectOnce(error instanceof Error ? error : new Error(String(error)));
            return;
        }
        request.once('error', rejectOnce);
        signal?.addEventListener('abort', cancel, { once: true });
        responseHeadersTimer = setTimeout(() => {
            const error = new ManagedRuntimeDownloadTimeoutError('response-headers', responseHeadersTimeoutMs);
            request.destroy(error);
            rejectOnce(error);
        }, responseHeadersTimeoutMs);
        request.end();
    });
}

async function downloadManagedRuntimeArchiveWithNodeHttps(input: {
    artifact: ManagedTectonicArtifact;
    destinationPath: string;
    signal?: AbortSignal;
    nodeRequestImpl?: NodeHttpsRequestImplementation;
    nodeHttpsTimeouts?: ManagedRuntimeDownloadTimeouts;
    onProgress?: (progress: ManagedTectonicInstallProgress) => void;
}): Promise<void> {
    const timeouts = resolveManagedRuntimeDownloadTimeouts(input.nodeHttpsTimeouts);
    const operationController = new AbortController();
    const cancelForCaller = (): void => operationController.abort(createAbortError());
    input.signal?.addEventListener('abort', cancelForCaller, { once: true });
    const totalTimer = setTimeout(() => {
        operationController.abort(new ManagedRuntimeDownloadTimeoutError('total', timeouts.totalMs));
    }, timeouts.totalMs);
    let response: IncomingMessage | undefined;
    let file: fs.promises.FileHandle | undefined;
    let receivedBytes = 0;
    let failed = false;
    let downloadError: unknown;
    const cancelResponse = (): void => {
        response?.destroy(downloadAbortReason(operationController.signal));
    };
    try {
        response = await openApprovedNodeResponse(
            new URL(input.artifact.url),
            operationController.signal,
            input.nodeRequestImpl ?? httpsRequest,
            timeouts.responseHeadersMs
        );
        operationController.signal.addEventListener('abort', cancelResponse, { once: true });
        if (operationController.signal.aborted) throw downloadAbortReason(operationController.signal);

        const declaredLength = Number(response.headers['content-length'] ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > input.artifact.compressedBytes) {
            throw new Error(`Managed runtime archive exceeds the pinned size (${declaredLength} bytes).`);
        }

        file = await fs.promises.open(input.destinationPath, 'w');
        if (operationController.signal.aborted) throw downloadAbortReason(operationController.signal);
        const chunks = response[Symbol.asyncIterator]();
        while (true) {
            const inactivityError = new ManagedRuntimeDownloadTimeoutError('body-inactivity', timeouts.bodyInactivityMs);
            const inactivityTimer = setTimeout(() => response?.destroy(inactivityError), timeouts.bodyInactivityMs);
            let nextChunk: IteratorResult<any>;
            try {
                nextChunk = await chunks.next();
            } finally {
                clearTimeout(inactivityTimer);
            }
            if (nextChunk.done) break;
            if (operationController.signal.aborted) throw downloadAbortReason(operationController.signal);
            const chunk = nextChunk.value;
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            receivedBytes += bytes.length;
            if (receivedBytes > input.artifact.compressedBytes) {
                throw new Error('Managed runtime archive exceeded the pinned byte size while downloading.');
            }
            await file.write(bytes);
            input.onProgress?.({
                phase: 'download',
                receivedBytes,
                totalBytes: input.artifact.compressedBytes
            });
        }
    } catch (error) {
        failed = true;
        downloadError = error;
    } finally {
        clearTimeout(totalTimer);
        input.signal?.removeEventListener('abort', cancelForCaller);
        operationController.signal.removeEventListener('abort', cancelResponse);
        if (failed) response?.destroy();
        if (file) {
            try {
                await file.close();
            } catch (error) {
                if (!failed) {
                    failed = true;
                    downloadError = error;
                }
            }
        }
        if (failed || receivedBytes !== input.artifact.compressedBytes) {
            fs.rmSync(input.destinationPath, { force: true });
        }
    }
    if (failed) throw downloadError;
    if (receivedBytes !== input.artifact.compressedBytes) {
        throw new Error(`Managed runtime archive size mismatch: expected ${input.artifact.compressedBytes}, received ${receivedBytes}.`);
    }
}

export async function downloadManagedRuntimeArchive(input: {
    artifact: ManagedTectonicArtifact;
    destinationPath: string;
    signal?: AbortSignal;
    fetchImpl?: FetchImplementation;
    nodeRequestImpl?: NodeHttpsRequestImplementation;
    nodeHttpsTimeouts?: ManagedRuntimeDownloadTimeouts;
    onProgress?: (progress: ManagedTectonicInstallProgress) => void;
}): Promise<void> {
    if (input.signal?.aborted) throw createAbortError();
    fs.mkdirSync(path.dirname(input.destinationPath), { recursive: true });

    if (!input.fetchImpl) {
        await downloadManagedRuntimeArchiveWithNodeHttps(input);
        return;
    }

    const response = await openApprovedResponse(input.artifact.url, input.signal, input.fetchImpl);
    const declaredLength = Number(response.headers?.get?.('content-length') ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > input.artifact.compressedBytes) {
        throw new Error(`Managed runtime archive exceeds the pinned size (${declaredLength} bytes).`);
    }
    if (!response.body?.getReader) throw new Error('Managed runtime response body is not streamable.');

    const file = await fs.promises.open(input.destinationPath, 'w');
    let receivedBytes = 0;
    try {
        const reader = response.body.getReader();
        while (true) {
            if (input.signal?.aborted) throw createAbortError();
            const chunk = await reader.read();
            if (chunk.done) break;
            const bytes = Buffer.from(chunk.value);
            receivedBytes += bytes.length;
            if (receivedBytes > input.artifact.compressedBytes) {
                throw new Error('Managed runtime archive exceeded the pinned byte size while downloading.');
            }
            await file.write(bytes);
            input.onProgress?.({
                phase: 'download',
                receivedBytes,
                totalBytes: input.artifact.compressedBytes
            });
        }
    } catch (error) {
        await file.close();
        fs.rmSync(input.destinationPath, { force: true });
        throw error;
    }
    await file.close();
    if (receivedBytes !== input.artifact.compressedBytes) {
        fs.rmSync(input.destinationPath, { force: true });
        throw new Error(`Managed runtime archive size mismatch: expected ${input.artifact.compressedBytes}, received ${receivedBytes}.`);
    }
}

function decodeTarString(bytes: Uint8Array): string {
    const zero = bytes.indexOf(0);
    return Buffer.from(zero >= 0 ? bytes.subarray(0, zero) : bytes).toString('utf8').trim();
}

function parseTarSize(bytes: Uint8Array): number {
    const raw = decodeTarString(bytes).replace(/\0/g, '').trim();
    return raw ? parseInt(raw, 8) : 0;
}

function extractExecutableFromTar(archiveBytes: Uint8Array, executableName: string): Uint8Array {
    const tarBytes = gunzipSync(archiveBytes);
    let offset = 0;
    let executable: Uint8Array | null = null;
    while (offset + TAR_BLOCK_BYTES <= tarBytes.length) {
        const header = tarBytes.subarray(offset, offset + TAR_BLOCK_BYTES);
        if (header.every(byte => byte === 0)) break;
        const name = decodeTarString(header.subarray(0, 100));
        const prefix = decodeTarString(header.subarray(345, 500));
        const entryName = prefix ? `${prefix}/${name}` : name;
        if (!isSafeManagedArchiveEntry(entryName)) throw new Error(`Unsafe managed runtime archive entry: ${entryName}`);
        const size = parseTarSize(header.subarray(124, 136));
        const type = String.fromCharCode(header[156] || 0);
        if (type === '1' || type === '2') throw new Error(`Managed runtime archive links are not allowed: ${entryName}`);
        const bodyStart = offset + TAR_BLOCK_BYTES;
        const bodyEnd = bodyStart + size;
        if (bodyEnd > tarBytes.length) throw new Error(`Managed runtime tar entry is truncated: ${entryName}`);
        if ((type === '\0' || type === '0') && path.posix.basename(entryName.replace(/\\/g, '/')) === executableName) {
            if (executable) throw new Error(`Managed runtime archive contains multiple ${executableName} files.`);
            executable = tarBytes.slice(bodyStart, bodyEnd);
        }
        offset = bodyStart + Math.ceil(size / TAR_BLOCK_BYTES) * TAR_BLOCK_BYTES;
    }
    if (!executable) throw new Error(`Managed runtime archive does not contain ${executableName}.`);
    return executable;
}

export function extractManagedTectonicExecutable(
    archiveBytes: Uint8Array,
    artifact: ManagedTectonicArtifact
): Uint8Array {
    if (artifact.archiveFormat === 'tar-gz') {
        return extractExecutableFromTar(archiveBytes, artifact.executableName);
    }

    const entries = unzipSync(archiveBytes);
    let executable: Uint8Array | null = null;
    for (const [entryName, bytes] of Object.entries(entries)) {
        if (!isSafeManagedArchiveEntry(entryName)) throw new Error(`Unsafe managed runtime archive entry: ${entryName}`);
        if (path.posix.basename(entryName.replace(/\\/g, '/')) !== artifact.executableName) continue;
        if (executable) throw new Error(`Managed runtime archive contains multiple ${artifact.executableName} files.`);
        executable = bytes;
    }
    if (!executable) throw new Error(`Managed runtime archive does not contain ${artifact.executableName}.`);
    return executable;
}

async function sha256File(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    await new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('error', reject);
        stream.on('end', resolve);
    });
    return hash.digest('hex');
}

function stagingName(): string {
    return `.staging-${Date.now()}-${randomBytes(4).toString('hex')}`;
}

async function verifyManagedExecutable(executablePath: string, signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const report = await probeCircuitikzEnvironment({
        isDesktop: true,
        candidates: [{ kind: 'tectonic', source: 'managed', executable: executablePath }],
        runCommand: command => runDesktopCommand(command, { signal })
    });
    return {
        ok: report.status === 'ready',
        message: report.attempts[0]?.message || (report.status === 'ready' ? 'CircuitikZ smoke passed.' : 'CircuitikZ smoke failed.')
    };
}

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
    return Boolean(signal?.aborted || (error instanceof Error && error.name === 'AbortError'));
}

type InstallManagedTectonicInput = {
    artifact: ManagedTectonicArtifact;
    runtimeRoot: string;
    platform: NodeJS.Platform;
    architecture: string;
    signal?: AbortSignal;
    fetchImpl?: FetchImplementation;
    onProgress?: (progress: ManagedTectonicInstallProgress) => void;
    verifyExecutable?: (executablePath: string, signal?: AbortSignal) => Promise<{ ok: boolean; message: string }>;
};

async function installManagedTectonicUnlocked(input: InstallManagedTectonicInput): Promise<{
    status: 'installed' | 'cancelled' | 'failed';
    executablePath?: string;
    message: string;
}> {
    if (input.signal?.aborted) return { status: 'cancelled', message: 'Installation cancelled.' };
    fs.mkdirSync(input.runtimeRoot, { recursive: true });
    const stagingRoot = path.join(input.runtimeRoot, stagingName());
    const stagingInstallDirectory = path.join(stagingRoot, 'install');
    const archivePath = path.join(stagingRoot, 'runtime.partial');
    const stagingExecutablePath = path.join(stagingInstallDirectory, input.artifact.executableName);
    const canonicalTargetDirectory = path.join(
        input.runtimeRoot,
        `tectonic-${MANAGED_TECTONIC_VERSION}-${input.artifact.sha256.toLowerCase()}`,
        `${input.platform}-${input.architecture}`
    );

    try {
        fs.mkdirSync(stagingInstallDirectory, { recursive: true });
        input.onProgress?.({ phase: 'download', detail: 'Downloading the pinned Tectonic archive.' });
        await downloadManagedRuntimeArchive({
            artifact: input.artifact,
            destinationPath: archivePath,
            signal: input.signal,
            fetchImpl: input.fetchImpl,
            onProgress: input.onProgress
        });
        input.onProgress?.({ phase: 'checksum', detail: 'Verifying SHA-256.' });
        const digest = await sha256File(archivePath);
        if (digest !== input.artifact.sha256.toLowerCase()) {
            throw new Error(`Managed runtime checksum mismatch: expected ${input.artifact.sha256}, received ${digest}.`);
        }

        input.onProgress?.({ phase: 'extract', detail: 'Extracting the verified executable.' });
        const executableBytes = extractManagedTectonicExecutable(fs.readFileSync(archivePath), input.artifact);
        fs.writeFileSync(stagingExecutablePath, executableBytes);
        if (input.platform !== 'win32') fs.chmodSync(stagingExecutablePath, 0o755);
        const executableDigest = await sha256File(stagingExecutablePath);

        input.onProgress?.({ phase: 'smoke', detail: 'Compiling the deterministic CircuitikZ smoke fixture.' });
        const verification = await (input.verifyExecutable ?? verifyManagedExecutable)(stagingExecutablePath, input.signal);
        if (input.signal?.aborted) return { status: 'cancelled', message: 'Installation cancelled.' };
        if (!verification.ok) throw new Error(verification.message);

        input.onProgress?.({ phase: 'activate', detail: 'Activating the verified runtime.' });
        const targetDirectory = resolveManagedTectonicTargetDirectory({
            runtimeRoot: input.runtimeRoot,
            canonicalTargetDirectory,
            executableDigest,
            platform: input.platform,
            architecture: input.architecture
        });
        const targetExecutablePath = path.join(targetDirectory, input.artifact.executableName);
        const manifest: ManagedTectonicManifest = {
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: MANAGED_TECTONIC_VERSION,
            platform: input.platform,
            architecture: input.architecture,
            executablePath: targetExecutablePath,
            archiveUrl: input.artifact.url,
            sha256: input.artifact.sha256,
            executableSha256: executableDigest,
            installedAt: new Date().toISOString()
        };
        activateManagedTectonic({
            runtimeRoot: input.runtimeRoot,
            stagingInstallDirectory,
            targetDirectory,
            manifest,
            onCleanupDiagnostic: detail => input.onProgress?.({ phase: 'cleanup', detail })
        });

        input.onProgress?.({ phase: 'complete', detail: verification.message });
        return { status: 'installed', executablePath: targetExecutablePath, message: verification.message };
    } catch (error) {
        if (isAbortError(error, input.signal)) return { status: 'cancelled', message: 'Installation cancelled.' };
        return { status: 'failed', message: error instanceof Error ? error.message : String(error) };
    } finally {
        input.onProgress?.({ phase: 'cleanup', detail: 'Cleaning temporary installation files.' });
        try {
            fs.rmSync(stagingRoot, { recursive: true, force: true });
        } catch (cleanupError) {
            input.onProgress?.({
                phase: 'cleanup',
                detail: `Managed runtime staging cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
            });
        }
    }
}

export async function installManagedTectonic(input: InstallManagedTectonicInput): Promise<{
    status: 'installed' | 'cancelled' | 'failed';
    executablePath?: string;
    message: string;
}> {
    if (input.signal?.aborted) return { status: 'cancelled', message: 'Installation cancelled.' };
    try {
        return await withManagedTectonicLock(
            input.runtimeRoot,
            () => installManagedTectonicUnlocked(input),
            input.signal,
            detail => input.onProgress?.({ phase: 'cleanup', detail })
        );
    } catch (error) {
        if (isAbortError(error, input.signal)) return { status: 'cancelled', message: 'Installation cancelled.' };
        return { status: 'failed', message: error instanceof Error ? error.message : String(error) };
    }
}
