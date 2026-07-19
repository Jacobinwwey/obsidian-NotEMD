import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ACTIVE_MANIFEST_NAME = 'managed-runtime.json';
const PENDING_MANIFEST_NAME = `${ACTIVE_MANIFEST_NAME}.new`;
const PREVIOUS_MANIFEST_NAME = `${ACTIVE_MANIFEST_NAME}.previous`;
const INSTALL_OWNERSHIP_MANIFEST_NAME = '.notemd-managed-runtime.json';
const INSTALL_LOCK_NAME = '.managed-runtime.lock';
const STALE_LOCK_CLAIM_NAME = '.stale-cleanup-claim.json';
const LOCK_RETRY_MS = 25;
const LOCK_WAIT_TIMEOUT_MS = 30_000;
const STALE_LOCK_AGE_MS = 5 * 60_000;

export interface ManagedTectonicManifest {
    schemaVersion: 'notemd.managed-latex-runtime.v1';
    runtime: 'tectonic';
    version: string;
    platform: NodeJS.Platform;
    architecture: string;
    executablePath: string;
    archiveUrl: string;
    sha256: string;
    executableSha256?: string;
    installedAt: string;
}

function manifestPath(runtimeRoot: string, name: string): string {
    return path.join(runtimeRoot, name);
}

function isLexicallyWithinRuntimeRoot(runtimeRoot: string, candidate: string): boolean {
    const relative = path.relative(path.resolve(runtimeRoot), path.resolve(candidate));
    return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

export function managedRuntimeContainsExistingPath(runtimeRoot: string, candidate: string): boolean {
    if (!isLexicallyWithinRuntimeRoot(runtimeRoot, candidate)) return false;
    try {
        const canonicalRoot = fs.realpathSync(runtimeRoot);
        const canonicalCandidate = fs.realpathSync(candidate);
        const relative = path.relative(canonicalRoot, canonicalCandidate);
        return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    } catch {
        // A missing or inaccessible path cannot establish containment for ownership or deletion.
        return false;
    }
}

function readValidManifest(
    runtimeRoot: string,
    candidatePath: string,
    isExecutable: (candidate: string) => boolean,
    platform?: NodeJS.Platform,
    architecture?: string
): ManagedTectonicManifest | null {
    try {
        const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8')) as Partial<ManagedTectonicManifest>;
        if (
            candidate.schemaVersion !== 'notemd.managed-latex-runtime.v1'
            || candidate.runtime !== 'tectonic'
            || (platform !== undefined && candidate.platform !== platform)
            || (architecture !== undefined && candidate.architecture !== architecture)
            || typeof candidate.version !== 'string'
            || typeof candidate.platform !== 'string'
            || typeof candidate.architecture !== 'string'
            || typeof candidate.executablePath !== 'string'
            || !managedRuntimeContainsExistingPath(runtimeRoot, candidate.executablePath)
            || typeof candidate.archiveUrl !== 'string'
            || typeof candidate.sha256 !== 'string'
            || !/^[a-f0-9]{64}$/i.test(candidate.sha256)
            || (candidate.executableSha256 !== undefined && !/^[a-f0-9]{64}$/i.test(candidate.executableSha256))
            || typeof candidate.installedAt !== 'string'
            || !isExecutable(candidate.executablePath)
        ) {
            return null;
        }
        return candidate as ManagedTectonicManifest;
    } catch {
        // Missing, malformed, or incomplete manifests are invalid ownership evidence.
        return null;
    }
}

export function recoverActiveManagedTectonic(input: {
    runtimeRoot: string;
    platform: NodeJS.Platform;
    architecture: string;
    isExecutable: (candidate: string) => boolean;
}): ManagedTectonicManifest | null {
    const activePath = manifestPath(input.runtimeRoot, ACTIVE_MANIFEST_NAME);
    const pendingPath = manifestPath(input.runtimeRoot, PENDING_MANIFEST_NAME);
    const previousPath = manifestPath(input.runtimeRoot, PREVIOUS_MANIFEST_NAME);
    const active = readValidManifest(
        input.runtimeRoot,
        activePath,
        input.isExecutable,
        input.platform,
        input.architecture
    );
    if (active) return active;

    const previous = readValidManifest(
        input.runtimeRoot,
        previousPath,
        input.isExecutable,
        input.platform,
        input.architecture
    );
    if (previous) return previous;

    const pending = readValidManifest(
        input.runtimeRoot,
        pendingPath,
        input.isExecutable,
        input.platform,
        input.architecture
    );
    return pending;
}

function defaultManagedExecutableCheck(candidate: string): boolean {
    try {
        return fs.lstatSync(candidate).isFile();
    } catch {
        // An inaccessible path cannot prove an installed executable exists.
        return false;
    }
}

function isManagedExecutableForPlatform(candidate: string, platform: NodeJS.Platform): boolean {
    if (!defaultManagedExecutableCheck(candidate)) return false;
    if (platform === 'win32') return true;
    try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
    } catch {
        // POSIX managed runtimes are unusable and cannot prove ownership without execute permission.
        return false;
    }
}

function readOwnedManifest(runtimeRoot: string, candidatePath: string): ManagedTectonicManifest | null {
    const manifest = readValidManifest(runtimeRoot, candidatePath, defaultManagedExecutableCheck);
    if (!manifest || !isManagedExecutableForPlatform(manifest.executablePath, manifest.platform)) return null;
    return manifest;
}

function sha256FileSync(filePath: string): string {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ownershipManifestPath(installDirectory: string): string {
    return path.join(installDirectory, INSTALL_OWNERSHIP_MANIFEST_NAME);
}

function manifestOwnsInstallDirectory(
    runtimeRoot: string,
    manifest: ManagedTectonicManifest,
    installDirectory: string,
    executableDigest?: string,
    platform?: NodeJS.Platform,
    architecture?: string
): boolean {
    if (path.dirname(path.resolve(manifest.executablePath)) !== path.resolve(installDirectory)) return false;
    if (platform !== undefined && manifest.platform !== platform) return false;
    if (architecture !== undefined && manifest.architecture !== architecture) return false;
    if (!managedRuntimeContainsExistingPath(runtimeRoot, manifest.executablePath)) return false;
    if (!isManagedExecutableForPlatform(manifest.executablePath, manifest.platform)) return false;
    if (executableDigest !== undefined && sha256FileSync(manifest.executablePath) !== executableDigest) return false;
    return true;
}

function installDirectoryHasOwnershipProof(input: {
    runtimeRoot: string;
    installDirectory: string;
    executableDigest: string;
    platform: NodeJS.Platform;
    architecture: string;
}): boolean {
    const ownership = readOwnedManifest(input.runtimeRoot, ownershipManifestPath(input.installDirectory));
    if (
        ownership?.executableSha256?.toLowerCase() === input.executableDigest
        && manifestOwnsInstallDirectory(
            input.runtimeRoot,
            ownership,
            input.installDirectory,
            input.executableDigest,
            input.platform,
            input.architecture
        )
    ) {
        return true;
    }

    for (const name of [ACTIVE_MANIFEST_NAME, PENDING_MANIFEST_NAME, PREVIOUS_MANIFEST_NAME]) {
        const pointer = readOwnedManifest(input.runtimeRoot, manifestPath(input.runtimeRoot, name));
        if (pointer && manifestOwnsInstallDirectory(
            input.runtimeRoot,
            pointer,
            input.installDirectory,
            input.executableDigest,
            input.platform,
            input.architecture
        )) {
            return true;
        }
    }
    return false;
}

export function resolveManagedTectonicTargetDirectory(input: {
    runtimeRoot: string;
    canonicalTargetDirectory: string;
    executableDigest: string;
    platform: NodeJS.Platform;
    architecture: string;
}): string {
    if (!fs.existsSync(input.canonicalTargetDirectory)) return input.canonicalTargetDirectory;
    if (installDirectoryHasOwnershipProof({
        runtimeRoot: input.runtimeRoot,
        installDirectory: input.canonicalTargetDirectory,
        executableDigest: input.executableDigest,
        platform: input.platform,
        architecture: input.architecture
    })) {
        return input.canonicalTargetDirectory;
    }

    const canonicalReleaseDirectory = path.dirname(input.canonicalTargetDirectory);
    const platformDirectoryName = path.basename(input.canonicalTargetDirectory);
    const collisionReleaseDirectory = `${canonicalReleaseDirectory}-exec-${input.executableDigest}`;
    while (true) {
        const uniqueTargetDirectory = path.join(
            `${collisionReleaseDirectory}-${randomBytes(8).toString('hex')}`,
            platformDirectoryName
        );
        if (!fs.existsSync(uniqueTargetDirectory)) return uniqueTargetDirectory;
    }
}

export function findOwnedManagedTectonicInstallDirectories(runtimeRoot: string): string[] {
    const ownedDirectories = new Set<string>();
    for (const name of [ACTIVE_MANIFEST_NAME, PENDING_MANIFEST_NAME, PREVIOUS_MANIFEST_NAME]) {
        const manifest = readOwnedManifest(runtimeRoot, manifestPath(runtimeRoot, name));
        if (manifest) ownedDirectories.add(path.dirname(path.resolve(manifest.executablePath)));
    }

    let releaseEntries: fs.Dirent[];
    try {
        releaseEntries = fs.readdirSync(runtimeRoot, { withFileTypes: true });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
    }
    for (const releaseEntry of releaseEntries) {
        if (!releaseEntry.isDirectory()) continue;
        const releaseDirectory = path.join(runtimeRoot, releaseEntry.name);
        for (const platformEntry of fs.readdirSync(releaseDirectory, { withFileTypes: true })) {
            if (!platformEntry.isDirectory()) continue;
            const installDirectory = path.join(releaseDirectory, platformEntry.name);
            const manifest = readOwnedManifest(runtimeRoot, ownershipManifestPath(installDirectory));
            if (!manifest?.executableSha256) continue;
            if (!manifestOwnsInstallDirectory(runtimeRoot, manifest, installDirectory)) continue;
            const executableDigest = sha256FileSync(manifest.executablePath);
            if (executableDigest !== manifest.executableSha256.toLowerCase()) continue;
            ownedDirectories.add(path.resolve(installDirectory));
        }
    }

    return [...ownedDirectories];
}

function writeFileDurably(filePath: string, contents: string): void {
    const descriptor = fs.openSync(filePath, 'w');
    try {
        fs.writeFileSync(descriptor, contents, 'utf8');
        fs.fsyncSync(descriptor);
    } finally {
        fs.closeSync(descriptor);
    }
}

function registerPointerOwnedInstall(manifest: ManagedTectonicManifest): void {
    const ownershipManifest: ManagedTectonicManifest = {
        ...manifest,
        executableSha256: sha256FileSync(manifest.executablePath)
    };
    writeFileDurably(
        ownershipManifestPath(path.dirname(manifest.executablePath)),
        `${JSON.stringify(ownershipManifest, null, 2)}\n`
    );
}

function normalizeManagedTectonicPointers(runtimeRoot: string): void {
    const activePath = manifestPath(runtimeRoot, ACTIVE_MANIFEST_NAME);
    const pendingPath = manifestPath(runtimeRoot, PENDING_MANIFEST_NAME);
    const previousPath = manifestPath(runtimeRoot, PREVIOUS_MANIFEST_NAME);
    const active = readOwnedManifest(runtimeRoot, activePath);
    const previous = readOwnedManifest(runtimeRoot, previousPath);
    const pending = readOwnedManifest(runtimeRoot, pendingPath);

    for (const manifest of [active, previous, pending]) {
        if (manifest) registerPointerOwnedInstall(manifest);
    }
    if (active) {
        fs.rmSync(pendingPath, { force: true });
        fs.rmSync(previousPath, { force: true });
        return;
    }
    if (previous) {
        fs.rmSync(activePath, { force: true });
        fs.renameSync(previousPath, activePath);
        fs.rmSync(pendingPath, { force: true });
        return;
    }
    if (pending) {
        fs.rmSync(activePath, { force: true });
        fs.renameSync(pendingPath, activePath);
        fs.rmSync(previousPath, { force: true });
        return;
    }
    fs.rmSync(activePath, { force: true });
    fs.rmSync(pendingPath, { force: true });
    fs.rmSync(previousPath, { force: true });
}

export function activateManagedTectonic(input: {
    runtimeRoot: string;
    stagingInstallDirectory: string;
    targetDirectory: string;
    manifest: ManagedTectonicManifest;
    onCleanupDiagnostic?: (message: string) => void;
}): void {
    const activePath = manifestPath(input.runtimeRoot, ACTIVE_MANIFEST_NAME);
    const pendingPath = manifestPath(input.runtimeRoot, PENDING_MANIFEST_NAME);
    const previousPath = manifestPath(input.runtimeRoot, PREVIOUS_MANIFEST_NAME);
    const ownershipContents = `${JSON.stringify(input.manifest, null, 2)}\n`;

    normalizeManagedTectonicPointers(input.runtimeRoot);

    if (!fs.existsSync(input.targetDirectory)) {
        writeFileDurably(
            path.join(input.stagingInstallDirectory, INSTALL_OWNERSHIP_MANIFEST_NAME),
            ownershipContents
        );
        fs.mkdirSync(path.dirname(input.targetDirectory), { recursive: true });
        fs.renameSync(input.stagingInstallDirectory, input.targetDirectory);
    } else {
        if (!input.manifest.executableSha256 || !installDirectoryHasOwnershipProof({
            runtimeRoot: input.runtimeRoot,
            installDirectory: input.targetDirectory,
            executableDigest: input.manifest.executableSha256,
            platform: input.manifest.platform,
            architecture: input.manifest.architecture
        })) {
            throw new Error('Managed runtime activation target exists without valid Notemd ownership.');
        }
        writeFileDurably(
            path.join(input.targetDirectory, INSTALL_OWNERSHIP_MANIFEST_NAME),
            ownershipContents
        );
    }
    writeFileDurably(pendingPath, `${JSON.stringify(input.manifest, null, 2)}\n`);
    fs.rmSync(previousPath, { force: true });
    if (fs.existsSync(activePath)) fs.renameSync(activePath, previousPath);
    try {
        fs.renameSync(pendingPath, activePath);
    } catch (error) {
        fs.rmSync(pendingPath, { force: true });
        if (!fs.existsSync(activePath) && fs.existsSync(previousPath)) {
            fs.renameSync(previousPath, activePath);
        }
        throw error;
    }
    try {
        fs.rmSync(previousPath, { force: true });
    } catch (cleanupError) {
        // The authoritative pointer is committed; cleanup must not change the reported activation outcome.
        if (!fs.existsSync(activePath)) throw cleanupError;
        input.onCleanupDiagnostic?.(
            `Managed runtime pointer cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
        );
    }
}

function lockIsStale(lockPath: string): boolean {
    try {
        const owner = JSON.parse(fs.readFileSync(path.join(lockPath, 'owner.json'), 'utf8')) as { pid?: unknown };
        if (typeof owner.pid === 'number') {
            if (owner.pid === process.pid) return false;
            try {
                process.kill(owner.pid, 0);
                return false;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'EPERM') return false;
                return true;
            }
        }
        return Date.now() - fs.statSync(lockPath).mtimeMs > STALE_LOCK_AGE_MS;
    } catch {
        try {
            return Date.now() - fs.statSync(lockPath).mtimeMs > STALE_LOCK_AGE_MS;
        } catch {
            return false;
        }
    }
}

type ManagedTectonicLockOwner = { pid: number; token: string };

function readManagedTectonicLockOwner(lockPath: string): ManagedTectonicLockOwner | null {
    try {
        const owner = JSON.parse(fs.readFileSync(path.join(lockPath, 'owner.json'), 'utf8')) as {
            pid?: unknown;
            token?: unknown;
        };
        if (!Number.isInteger(owner.pid) || (owner.pid as number) <= 0 || typeof owner.token !== 'string' || !owner.token) {
            return null;
        }
        return { pid: owner.pid as number, token: owner.token };
    } catch {
        return null;
    }
}

function lockOwnerProcessState(owner: ManagedTectonicLockOwner): 'alive' | 'dead' | 'unknown' {
    if (owner.pid === process.pid) return 'alive';
    try {
        process.kill(owner.pid, 0);
        return 'alive';
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ESRCH') return 'dead';
        if (code === 'EPERM') return 'alive';
        return 'unknown';
    }
}

function lockOwnersMatch(left: ManagedTectonicLockOwner | null, right: ManagedTectonicLockOwner): boolean {
    return Boolean(left && left.pid === right.pid && left.token === right.token);
}

function readStaleLockClaim(lockPath: string): { claimToken: string; expectedOwnerToken: string } | null {
    try {
        const claim = JSON.parse(fs.readFileSync(path.join(lockPath, STALE_LOCK_CLAIM_NAME), 'utf8')) as {
            claimToken?: unknown;
            expectedOwnerToken?: unknown;
        };
        if (typeof claim.claimToken !== 'string' || typeof claim.expectedOwnerToken !== 'string') return null;
        return { claimToken: claim.claimToken, expectedOwnerToken: claim.expectedOwnerToken };
    } catch {
        return null;
    }
}

function restoreQuarantinedManagedTectonicLock(lockPath: string, quarantinePath: string): boolean {
    if (fs.existsSync(lockPath)) return false;
    try {
        fs.renameSync(quarantinePath, lockPath);
        return true;
    } catch {
        return false;
    }
}

export function clearStaleManagedTectonicLock(runtimeRoot: string): {
    status: 'cleared' | 'absent' | 'active' | 'changed' | 'unsafe';
    message: string;
} {
    const lockPath = path.join(runtimeRoot, INSTALL_LOCK_NAME);
    if (!fs.existsSync(lockPath)) return { status: 'absent', message: 'No managed runtime lock exists.' };
    const expectedOwner = readManagedTectonicLockOwner(lockPath);
    if (!expectedOwner) {
        return { status: 'unsafe', message: 'The managed runtime lock owner metadata is not valid.' };
    }
    const initialState = lockOwnerProcessState(expectedOwner);
    if (initialState === 'alive') return { status: 'active', message: 'The managed runtime lock owner is still active.' };
    if (initialState !== 'dead') return { status: 'unsafe', message: 'The managed runtime lock owner state is unknown.' };

    const claimPath = path.join(lockPath, STALE_LOCK_CLAIM_NAME);
    const claimToken = randomBytes(16).toString('hex');
    let claimDescriptor: number;
    try {
        claimDescriptor = fs.openSync(claimPath, 'wx');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
            return { status: 'changed', message: 'Another stale-lock cleanup contender is active.' };
        }
        return { status: 'unsafe', message: error instanceof Error ? error.message : String(error) };
    }
    let cleared = false;
    let claimContainerPath = lockPath;
    let claimRecordingError: unknown;
    try {
        fs.writeFileSync(claimDescriptor, JSON.stringify({ claimToken, expectedOwnerToken: expectedOwner.token }), 'utf8');
        fs.fsyncSync(claimDescriptor);
    } catch (error) {
        claimRecordingError = error;
    } finally {
        try {
            fs.closeSync(claimDescriptor);
        } catch (error) {
            claimRecordingError ??= error;
        }
    }
    if (claimRecordingError) {
        try {
            fs.rmSync(claimPath, { force: true });
        } catch (cleanupError) {
            return {
                status: 'unsafe',
                message: `Failed to record and clean the stale-lock claim: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
            };
        }
        return {
            status: 'unsafe',
            message: claimRecordingError instanceof Error ? claimRecordingError.message : String(claimRecordingError)
        };
    }

    try {
        const claimedOwner = readManagedTectonicLockOwner(lockPath);
        if (!lockOwnersMatch(claimedOwner, expectedOwner)) {
            return { status: 'changed', message: 'The managed runtime lock owner changed during cleanup.' };
        }
        if (lockOwnerProcessState(expectedOwner) !== 'dead') {
            return { status: 'changed', message: 'The managed runtime lock owner became active during cleanup.' };
        }
        const finalOwner = readManagedTectonicLockOwner(lockPath);
        if (!lockOwnersMatch(finalOwner, expectedOwner)) {
            return { status: 'changed', message: 'The managed runtime lock owner changed before cleanup committed.' };
        }
        const quarantinePath = `${lockPath}.stale-${claimToken}`;
        try {
            fs.renameSync(lockPath, quarantinePath);
            claimContainerPath = quarantinePath;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return { status: 'changed', message: 'The managed runtime lock changed before cleanup could isolate it.' };
            }
            return { status: 'unsafe', message: error instanceof Error ? error.message : String(error) };
        }

        const quarantinedOwner = readManagedTectonicLockOwner(quarantinePath);
        const quarantinedClaim = readStaleLockClaim(quarantinePath);
        if (
            !lockOwnersMatch(quarantinedOwner, expectedOwner)
            || quarantinedClaim?.claimToken !== claimToken
            || quarantinedClaim.expectedOwnerToken !== expectedOwner.token
        ) {
            if (restoreQuarantinedManagedTectonicLock(lockPath, quarantinePath)) claimContainerPath = lockPath;
            return { status: 'changed', message: 'The managed runtime lock was replaced before cleanup committed.' };
        }
        if (lockOwnerProcessState(expectedOwner) !== 'dead') {
            if (restoreQuarantinedManagedTectonicLock(lockPath, quarantinePath)) claimContainerPath = lockPath;
            return { status: 'changed', message: 'The managed runtime lock owner became active before cleanup committed.' };
        }

        fs.rmSync(quarantinePath, { recursive: true, force: true });
        cleared = true;
        return { status: 'cleared', message: 'Cleared the stale managed runtime lock.' };
    } finally {
        if (!cleared) {
            try {
                const cleanupClaimPath = path.join(claimContainerPath, STALE_LOCK_CLAIM_NAME);
                const claim = JSON.parse(fs.readFileSync(cleanupClaimPath, 'utf8')) as { claimToken?: unknown };
                if (claim.claimToken === claimToken) fs.rmSync(cleanupClaimPath, { force: true });
            } catch {
                // Claim cleanup is best-effort: a leftover claim safely blocks another cleanup attempt,
                // while replacing the stable owner outcome with a cleanup error would obscure the race result.
            }
        }
    }
}

function createLockAbortError(): Error {
    return Object.assign(new Error('Managed runtime operation cancelled while waiting for the lock.'), {
        name: 'AbortError'
    });
}

function abortableDelay(durationMs: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(createLockAbortError());
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', cancel);
            resolve();
        }, durationMs);
        const cancel = (): void => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', cancel);
            reject(createLockAbortError());
        };
        signal?.addEventListener('abort', cancel, { once: true });
    });
}

export async function withManagedTectonicLock<T>(
    runtimeRoot: string,
    operation: () => Promise<T>,
    signal?: AbortSignal,
    onCleanupDiagnostic?: (message: string) => void
): Promise<T> {
    if (signal?.aborted) throw createLockAbortError();
    fs.mkdirSync(runtimeRoot, { recursive: true });
    const lockPath = path.join(runtimeRoot, INSTALL_LOCK_NAME);
    const ownerToken = randomBytes(16).toString('hex');
    const deadline = Date.now() + LOCK_WAIT_TIMEOUT_MS;
    while (true) {
        if (signal?.aborted) throw createLockAbortError();
        try {
            await fs.promises.mkdir(lockPath);
            try {
                fs.writeFileSync(
                    path.join(lockPath, 'owner.json'),
                    JSON.stringify({ pid: process.pid, token: ownerToken }),
                    'utf8'
                );
            } catch (error) {
                // mkdir succeeded exclusively, so this directory is still the unannounced lock we own.
                fs.rmSync(lockPath, { recursive: true, force: true });
                throw error;
            }
            break;
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code !== 'EEXIST') throw error;
            if (lockIsStale(lockPath)) {
                throw new Error('Managed runtime lock appears stale; refusing unsafe automatic takeover.');
            }
            if (Date.now() >= deadline) throw new Error('Timed out waiting for the managed runtime installation lock.');
            await abortableDelay(LOCK_RETRY_MS, signal);
        }
    }

    try {
        if (signal?.aborted) throw createLockAbortError();
        return await operation();
    } finally {
        let releaseOwnedLock = false;
        try {
            const owner = JSON.parse(fs.readFileSync(path.join(lockPath, 'owner.json'), 'utf8')) as { token?: unknown };
            if (owner.token === ownerToken) {
                releaseOwnedLock = true;
                fs.rmSync(lockPath, { recursive: true, force: true });
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                const message = error instanceof Error ? error.message : String(error);
                onCleanupDiagnostic?.(`Managed runtime lock cleanup warning: ${message}`);
                if (releaseOwnedLock) {
                    try {
                        const releasedPath = `${lockPath}.released-${ownerToken}`;
                        fs.renameSync(lockPath, releasedPath);
                        fs.rmSync(releasedPath, { recursive: true, force: true });
                    } catch (fallbackError) {
                        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        onCleanupDiagnostic?.(`Managed runtime released-lock cleanup warning: ${fallbackMessage}`);
                    }
                }
            }
        }
    }
}
