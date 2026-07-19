import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { NotemdSettings } from '../types';
import {
    CircuitikzCompilerCandidate,
    createCircuitikzCompilerCandidates,
    probeCircuitikzEnvironment,
    verifyCircuitikzGoldenFixtures
} from '../diagram/adapters/circuitikz/circuitikzEnvironment';
import { runDesktopCommand } from '../platform/desktopProcess';
import {
    getManagedTectonicArtifact,
    MANAGED_TECTONIC_VERSION,
    ManagedTectonicArtifact,
    resolveManagedLatexRuntimeRoot
} from './managedTectonicDistribution';
import {
    installManagedTectonic,
    ManagedTectonicInstallProgress
} from './managedTectonicInstaller';
import {
    clearStaleManagedTectonicLock,
    findOwnedManagedTectonicInstallDirectories,
    managedRuntimeContainsExistingPath,
    recoverActiveManagedTectonic,
    withManagedTectonicLock
} from './managedTectonicActivation';

type CircuitikzEnvironmentSettings = Pick<NotemdSettings,
    | 'circuitikzCompilerPreference'
    | 'circuitikzCustomCompilerKind'
    | 'circuitikzCustomCompilerPath'
    | 'circuitikzManagedRuntimeRoot'
    | 'circuitikzCompileTimeoutMs'>;

export interface CircuitikzEnvironmentDesktopContext {
    platform: NodeJS.Platform;
    architecture: string;
    runtimeRoot: string;
    managedRuntimeVersion: string;
    managedArtifact: ManagedTectonicArtifact | null;
    managedExecutablePath: string | null;
    candidates: CircuitikzCompilerCandidate[];
}

function defaultExecutableCheck(candidate: string, platform: NodeJS.Platform): boolean {
    try {
        fs.accessSync(candidate, platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
        return fs.statSync(candidate).isFile();
    } catch {
        return false;
    }
}

export function findExecutableOnPath(name: string, input: {
    platform: NodeJS.Platform;
    pathValue: string;
    pathExtValue?: string;
    isExecutable?: (candidate: string) => boolean;
}): string | null {
    const platformPath = input.platform === 'win32' ? path.win32 : path.posix;
    const delimiter = input.platform === 'win32' ? ';' : ':';
    const hasExtension = platformPath.extname(name).length > 0;
    const extensions = input.platform === 'win32' && !hasExtension
        ? (input.pathExtValue || '.COM;.EXE;.BAT;.CMD')
            .split(';')
            .filter(extension => extension && !/^\.(?:bat|cmd)$/i.test(extension))
        : [''];
    const isExecutable = input.isExecutable ?? (candidate => defaultExecutableCheck(candidate, input.platform));

    for (const directory of input.pathValue.split(delimiter).map(value => value.trim()).filter(Boolean)) {
        for (const extension of extensions) {
            const candidate = platformPath.join(directory, `${name}${extension.toLowerCase()}`);
            if (isExecutable(candidate)) return candidate;
            if (input.platform === 'win32') {
                const upperCandidate = platformPath.join(directory, `${name}${extension.toUpperCase()}`);
                if (upperCandidate !== candidate && isExecutable(upperCandidate)) return upperCandidate;
            }
        }
    }
    return null;
}

export function createCircuitikzEnvironmentDesktopContext(
    settings: CircuitikzEnvironmentSettings,
    input: {
        platform?: NodeJS.Platform;
        architecture?: string;
        environment?: NodeJS.ProcessEnv;
        homeDirectory?: string;
        isExecutable?: (candidate: string) => boolean;
    } = {}
): CircuitikzEnvironmentDesktopContext {
    const platform = input.platform ?? process.platform;
    const architecture = input.architecture ?? process.arch;
    const environment = input.environment ?? process.env;
    const homeDirectory = input.homeDirectory ?? os.homedir();
    const isExecutable = input.isExecutable ?? (candidate => defaultExecutableCheck(candidate, platform));
    const runtimeRoot = resolveManagedLatexRuntimeRoot({
        platform,
        environment,
        homeDirectory,
        configuredRoot: settings.circuitikzManagedRuntimeRoot
    });
    const managedArtifact = getManagedTectonicArtifact(platform, architecture);
    const activeManagedRuntime = recoverActiveManagedTectonic({
        runtimeRoot,
        platform,
        architecture,
        isExecutable
    });
    const resolvedManagedPath = activeManagedRuntime?.executablePath;
    const pathValue = environment.PATH || environment.Path || '';
    const systemTectonicPath = findExecutableOnPath('tectonic', {
        platform,
        pathValue,
        pathExtValue: environment.PATHEXT,
        isExecutable
    }) ?? undefined;
    const systemPdflatexPath = findExecutableOnPath('pdflatex', {
        platform,
        pathValue,
        pathExtValue: environment.PATHEXT,
        isExecutable
    }) ?? undefined;

    return {
        platform,
        architecture,
        runtimeRoot,
        managedRuntimeVersion: MANAGED_TECTONIC_VERSION,
        managedArtifact,
        managedExecutablePath: resolvedManagedPath ?? null,
        candidates: createCircuitikzCompilerCandidates({
            preference: settings.circuitikzCompilerPreference,
            customCompilerKind: settings.circuitikzCustomCompilerKind,
            customCompilerPath: settings.circuitikzCustomCompilerPath,
            managedExecutablePath: resolvedManagedPath,
            systemTectonicPath,
            systemPdflatexPath
        })
    };
}

export async function probeConfiguredCircuitikzEnvironment(
    settings: CircuitikzEnvironmentSettings,
    input: {
        isDesktop: boolean;
        signal?: AbortSignal;
        onCommandOutput?: (text: string) => void;
    }
) {
    const context = createCircuitikzEnvironmentDesktopContext(settings);
    const report = await probeCircuitikzEnvironment({
        isDesktop: input.isDesktop,
        candidates: context.candidates,
        timeoutMs: settings.circuitikzCompileTimeoutMs,
        runCommand: command => runDesktopCommand(command, {
            signal: input.signal,
            onProgress: progress => input.onCommandOutput?.(progress.text)
        })
    });
    return { context, report };
}

export async function installConfiguredManagedTectonic(
    settings: CircuitikzEnvironmentSettings,
    input: {
        signal?: AbortSignal;
        onProgress?: (progress: ManagedTectonicInstallProgress) => void;
    }
) {
    const context = createCircuitikzEnvironmentDesktopContext(settings);
    if (!context.managedArtifact) {
        return { status: 'failed' as const, message: `No managed Tectonic build is available for ${context.platform}/${context.architecture}.` };
    }
    return installManagedTectonic({
        artifact: context.managedArtifact,
        runtimeRoot: context.runtimeRoot,
        platform: context.platform,
        architecture: context.architecture,
        signal: input.signal,
        onProgress: input.onProgress,
        verifyExecutable: async (executablePath, signal) => {
            const candidate = { kind: 'tectonic' as const, source: 'managed' as const, executable: executablePath };
            const report = await probeCircuitikzEnvironment({
                isDesktop: true,
                candidates: [candidate],
                timeoutMs: settings.circuitikzCompileTimeoutMs,
                runCommand: command => runDesktopCommand(command, { signal })
            });
            if (report.status !== 'ready') {
                return {
                    ok: false,
                    message: report.attempts[0]?.message || 'CircuitikZ smoke failed.'
                };
            }
            const golden = await verifyCircuitikzGoldenFixtures({
                candidate,
                timeoutMs: settings.circuitikzCompileTimeoutMs,
                runCommand: command => runDesktopCommand(command, { signal })
            });
            const failedFixtures = golden.fixtures
                .filter(fixture => fixture.status === 'failed')
                .map(fixture => fixture.name);
            return {
                ok: golden.ok,
                message: golden.ok
                    ? `CircuitikZ smoke passed for ${golden.fixtures.length} golden fixtures.`
                    : `CircuitikZ smoke failed for: ${failedFixtures.join(', ')}.`
            };
        }
    });
}

function assertManagedTarget(runtimeRoot: string, targetPath: string): void {
    const relative = path.relative(path.resolve(runtimeRoot), path.resolve(targetPath));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('Managed runtime target is outside the configured runtime root.');
    }
    if (fs.existsSync(targetPath) && !managedRuntimeContainsExistingPath(runtimeRoot, targetPath)) {
        throw new Error('Managed runtime target resolves outside the configured runtime root.');
    }
}

function removalWasCancelled(error: unknown, signal?: AbortSignal): boolean {
    return Boolean(signal?.aborted || (error instanceof Error && error.name === 'AbortError'));
}

export async function removeConfiguredManagedTectonic(
    settings: CircuitikzEnvironmentSettings,
    input: { signal?: AbortSignal } = {}
): Promise<{ status: 'removed' | 'cancelled' }> {
    const context = createCircuitikzEnvironmentDesktopContext(settings);
    if (input.signal?.aborted) return { status: 'cancelled' };
    try {
        await withManagedTectonicLock(context.runtimeRoot, async () => {
            const ownedInstallDirectories = findOwnedManagedTectonicInstallDirectories(context.runtimeRoot);
            if (input.signal?.aborted) {
                throw Object.assign(new Error('Managed runtime removal cancelled.'), { name: 'AbortError' });
            }
            for (const targetDirectory of ownedInstallDirectories) {
                assertManagedTarget(context.runtimeRoot, targetDirectory);
                fs.rmSync(targetDirectory, { recursive: true, force: true });
            }
            for (const name of ['managed-runtime.json', 'managed-runtime.json.new', 'managed-runtime.json.previous']) {
                const targetPath = path.join(context.runtimeRoot, name);
                assertManagedTarget(context.runtimeRoot, targetPath);
                fs.rmSync(targetPath, { force: true });
            }
        }, input.signal);
        return { status: 'removed' };
    } catch (error) {
        if (removalWasCancelled(error, input.signal)) return { status: 'cancelled' };
        throw error;
    }
}

export async function clearConfiguredManagedTectonicStaleLock(
    settings: CircuitikzEnvironmentSettings
): Promise<ReturnType<typeof clearStaleManagedTectonicLock>> {
    const context = createCircuitikzEnvironmentDesktopContext(settings);
    return clearStaleManagedTectonicLock(context.runtimeRoot);
}
