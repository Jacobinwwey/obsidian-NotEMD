import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_SETTINGS } from '../constants';

const HOST_PLATFORM = process.platform;
const HOST_ARCHITECTURE = process.arch;
const HOST_PLATFORM_DIRECTORY = `${HOST_PLATFORM}-${HOST_ARCHITECTURE}`;
const HOST_TECTONIC_EXECUTABLE = HOST_PLATFORM === 'win32' ? 'tectonic.exe' : 'tectonic';
const HOST_PDFLATEX_EXECUTABLE = HOST_PLATFORM === 'win32' ? 'pdflatex.exe' : 'pdflatex';
const hostPathEnvironment = (pathValue: string): NodeJS.ProcessEnv => ({
    PATH: pathValue,
    ...(HOST_PLATFORM === 'win32' ? { PATHEXT: '.EXE' } : {})
});

function writeHostExecutable(filePath: string, contents: string): void {
    fs.writeFileSync(filePath, contents, 'utf8');
    if (HOST_PLATFORM !== 'win32') {
        fs.chmodSync(filePath, 0o755);
    }
}

type DesktopEnvironmentApi = {
    findExecutableOnPath: (name: string, input: {
        platform: NodeJS.Platform;
        pathValue: string;
        pathExtValue?: string;
        isExecutable?: (candidate: string) => boolean;
    }) => string | null;
    createCircuitikzEnvironmentDesktopContext: (settings: typeof DEFAULT_SETTINGS, input: {
        platform: NodeJS.Platform;
        architecture: string;
        environment: NodeJS.ProcessEnv;
        homeDirectory: string;
        isExecutable?: (candidate: string) => boolean;
    }) => {
        runtimeRoot: string;
        managedRuntimeVersion: string;
        managedArtifact: unknown;
        managedExecutablePath: string | null;
        candidates: Array<{ kind: string; source: string; executable: string }>;
    };
    removeConfiguredManagedTectonic: (
        settings: typeof DEFAULT_SETTINGS,
        input?: { signal?: AbortSignal }
    ) => Promise<{ status: 'removed' | 'cancelled' }>;
    clearConfiguredManagedTectonicStaleLock: (settings: typeof DEFAULT_SETTINGS) => Promise<{
        status: 'cleared' | 'absent' | 'active' | 'changed' | 'unsafe';
        message: string;
    }>;
};

function loadDesktopEnvironmentApi(): Partial<DesktopEnvironmentApi> {
    try {
        return require('../latexEnvironment/circuitikzEnvironmentDesktop') as DesktopEnvironmentApi;
    } catch {
        return {};
    }
}

describe('CircuitikZ desktop environment discovery', () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-path-'));
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    test('resolves executable names from PATH using target-platform extension rules', () => {
        const api = loadDesktopEnvironmentApi();
        const windowsRoot = 'C:\\Notemd';
        const bin = path.win32.join(windowsRoot, 'bin');
        const pdflatex = path.win32.join(bin, 'pdflatex.exe');

        expect(api.findExecutableOnPath?.('pdflatex', {
            platform: 'win32',
            pathValue: `${root};${bin}`,
            pathExtValue: '.COM;.EXE;.BAT;.CMD',
            isExecutable: candidate => candidate === pdflatex
        })).toBe(pdflatex);
        expect(api.findExecutableOnPath?.('tectonic', {
            platform: 'win32',
            pathValue: bin,
            pathExtValue: '.EXE',
            isExecutable: fs.existsSync
        })).toBeNull();
    });

    test('skips Windows batch shims and continues to an executable supported by shell-free spawning', () => {
        const api = loadDesktopEnvironmentApi();
        const bin = path.win32.join('C:\\Notemd', 'bin');
        const executable = path.win32.join(bin, 'tectonic.exe');

        expect(api.findExecutableOnPath?.('tectonic', {
            platform: 'win32',
            pathValue: bin,
            pathExtValue: '.CMD;.EXE',
            isExecutable: candidate => candidate === executable
        })).toBe(executable);
    });

    test('builds auto-discovery candidates from managed and system installations', () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const managedExecutable = path.join(runtimeRoot, 'tectonic-0.16.9', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        const systemBin = path.join(root, 'system-bin');
        const systemPdflatex = path.join(systemBin, HOST_PDFLATEX_EXECUTABLE);
        fs.mkdirSync(path.dirname(managedExecutable), { recursive: true });
        fs.mkdirSync(systemBin, { recursive: true });
        writeHostExecutable(managedExecutable, 'managed');
        writeHostExecutable(systemPdflatex, 'system');
        fs.writeFileSync(path.join(runtimeRoot, 'managed-runtime.json'), JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath: managedExecutable,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256: '0'.repeat(64),
            installedAt: new Date().toISOString()
        }));

        const context = api.createCircuitikzEnvironmentDesktopContext?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        }, {
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            environment: hostPathEnvironment(systemBin),
            homeDirectory: root,
            isExecutable: fs.existsSync
        });

        expect(context).toEqual(expect.objectContaining({
            runtimeRoot,
            managedRuntimeVersion: '0.16.9',
            managedExecutablePath: managedExecutable
        }));
        expect(context?.candidates).toEqual([
            { kind: 'tectonic', source: 'managed', executable: managedExecutable },
            { kind: 'pdflatex', source: 'system', executable: systemPdflatex }
        ]);
    });

    test('discovers the last valid interrupted pointer without normalizing files during discovery', () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const managedExecutable = path.join(
            runtimeRoot,
            'tectonic-0.16.9-0123456789abcdef',
            HOST_PLATFORM_DIRECTORY,
            HOST_TECTONIC_EXECUTABLE
        );
        fs.mkdirSync(path.dirname(managedExecutable), { recursive: true });
        writeHostExecutable(managedExecutable, 'managed');
        const previousManifestPath = path.join(runtimeRoot, 'managed-runtime.json.previous');
        fs.writeFileSync(previousManifestPath, JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath: managedExecutable,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256: '0123456789abcdef'.padEnd(64, '0'),
            installedAt: new Date().toISOString()
        }));
        fs.writeFileSync(path.join(runtimeRoot, 'managed-runtime.json.new'), '{interrupted');

        const context = api.createCircuitikzEnvironmentDesktopContext?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        }, {
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            environment: hostPathEnvironment(''),
            homeDirectory: root,
            isExecutable: fs.existsSync
        });

        expect(context?.managedExecutablePath).toBe(managedExecutable);
        expect(fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json'))).toBe(false);
        expect(fs.existsSync(previousManifestPath)).toBe(true);
        expect(fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json.new'))).toBe(true);
    });

    test('reads the last valid pointer without mutating an activation in progress', () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const previousExecutable = path.join(runtimeRoot, 'tectonic-old', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        const pendingExecutable = path.join(runtimeRoot, 'tectonic-new', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        fs.mkdirSync(path.dirname(previousExecutable), { recursive: true });
        fs.mkdirSync(path.dirname(pendingExecutable), { recursive: true });
        fs.mkdirSync(path.join(runtimeRoot, '.managed-runtime.lock'));
        writeHostExecutable(previousExecutable, 'previous');
        writeHostExecutable(pendingExecutable, 'pending');
        const manifest = (executablePath: string, sha256: string) => JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256,
            installedAt: new Date().toISOString()
        });
        const previousManifestPath = path.join(runtimeRoot, 'managed-runtime.json.previous');
        const pendingManifestPath = path.join(runtimeRoot, 'managed-runtime.json.new');
        fs.writeFileSync(previousManifestPath, manifest(previousExecutable, '1'.repeat(64)));
        fs.writeFileSync(pendingManifestPath, manifest(pendingExecutable, '2'.repeat(64)));

        const context = api.createCircuitikzEnvironmentDesktopContext?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        }, {
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            environment: hostPathEnvironment(''),
            homeDirectory: root,
            isExecutable: fs.existsSync
        });

        expect(context?.managedExecutablePath).toBe(previousExecutable);
        expect(fs.existsSync(previousManifestPath)).toBe(true);
        expect(fs.existsSync(pendingManifestPath)).toBe(true);
        expect(fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json'))).toBe(false);
    });

    test('keeps recovery discovery read-only when a concurrent activation appears during pointer reads', () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const previousExecutable = path.join(runtimeRoot, 'previous-release', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        const pendingExecutable = path.join(runtimeRoot, 'pending-release', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        fs.mkdirSync(path.dirname(previousExecutable), { recursive: true });
        fs.mkdirSync(path.dirname(pendingExecutable), { recursive: true });
        writeHostExecutable(previousExecutable, 'previous');
        writeHostExecutable(pendingExecutable, 'pending');
        const manifest = (executablePath: string, digest: string) => JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256: digest,
            installedAt: new Date().toISOString()
        });
        const activePath = path.join(runtimeRoot, 'managed-runtime.json');
        const previousPath = path.join(runtimeRoot, 'managed-runtime.json.previous');
        const pendingPath = path.join(runtimeRoot, 'managed-runtime.json.new');
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        fs.writeFileSync(activePath, '{invalid');
        fs.writeFileSync(previousPath, manifest(previousExecutable, '6'.repeat(64)));
        const readFileSync = fs.readFileSync;
        let interleavingInjected = false;
        const read = jest.spyOn(fs, 'readFileSync').mockImplementation((candidate, options) => {
            const value = readFileSync(candidate, options as any);
            if (String(candidate) === activePath && !interleavingInjected) {
                interleavingInjected = true;
                fs.mkdirSync(lockPath);
                fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({ pid: process.pid, token: 'concurrent' }));
                fs.writeFileSync(pendingPath, manifest(pendingExecutable, '7'.repeat(64)));
            }
            return value;
        });

        try {
            const context = api.createCircuitikzEnvironmentDesktopContext?.({
                ...DEFAULT_SETTINGS,
                circuitikzManagedRuntimeRoot: runtimeRoot
            }, {
                platform: HOST_PLATFORM,
                architecture: HOST_ARCHITECTURE,
                environment: hostPathEnvironment(''),
                homeDirectory: root,
                isExecutable: fs.existsSync
            });

            expect(context?.managedExecutablePath).toBe(previousExecutable);
            expect(fs.readFileSync(activePath, 'utf8')).toBe('{invalid');
            expect(fs.existsSync(previousPath)).toBe(true);
            expect(fs.existsSync(pendingPath)).toBe(true);
            expect(fs.existsSync(lockPath)).toBe(true);
        } finally {
            read.mockRestore();
        }
    });

    test('removes only manifest-owned installs and preserves unrelated tectonic-prefixed directories', async () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const ownedExecutable = path.join(runtimeRoot, 'tectonic-owned', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        const unrelatedDirectory = path.join(runtimeRoot, 'tectonic-user-cache');
        fs.mkdirSync(path.dirname(ownedExecutable), { recursive: true });
        fs.mkdirSync(unrelatedDirectory, { recursive: true });
        writeHostExecutable(ownedExecutable, 'owned-runtime');
        fs.writeFileSync(path.join(unrelatedDirectory, 'keep.txt'), 'user-owned');
        fs.writeFileSync(path.join(runtimeRoot, 'managed-runtime.json'), JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath: ownedExecutable,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256: '1'.repeat(64),
            installedAt: new Date().toISOString()
        }));

        const removed = await api.removeConfiguredManagedTectonic?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        });

        expect(removed).toEqual({ status: 'removed' });
        expect(fs.existsSync(path.dirname(ownedExecutable))).toBe(false);
        expect(fs.readFileSync(path.join(unrelatedDirectory, 'keep.txt'), 'utf8')).toBe('user-owned');
        expect(fs.existsSync(path.join(runtimeRoot, 'managed-runtime.json'))).toBe(false);
    });

    test('preserves external directories reached through a linked runtime ancestor', async () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const externalReleaseDirectory = path.join(root, 'external-user-release');
        const externalInstallDirectory = path.join(externalReleaseDirectory, HOST_PLATFORM_DIRECTORY);
        const externalExecutable = path.join(externalInstallDirectory, HOST_TECTONIC_EXECUTABLE);
        const linkedReleaseDirectory = path.join(runtimeRoot, 'linked-release');
        const linkedExecutable = path.join(linkedReleaseDirectory, HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        fs.mkdirSync(runtimeRoot, { recursive: true });
        fs.mkdirSync(externalInstallDirectory, { recursive: true });
        writeHostExecutable(externalExecutable, 'external-user-runtime');
        fs.writeFileSync(path.join(externalInstallDirectory, 'keep.txt'), 'must-survive-removal');
        fs.symlinkSync(
            externalReleaseDirectory,
            linkedReleaseDirectory,
            process.platform === 'win32' ? 'junction' : 'dir'
        );
        fs.writeFileSync(path.join(runtimeRoot, 'managed-runtime.json'), JSON.stringify({
            schemaVersion: 'notemd.managed-latex-runtime.v1',
            runtime: 'tectonic',
            version: '0.16.9',
            platform: HOST_PLATFORM,
            architecture: HOST_ARCHITECTURE,
            executablePath: linkedExecutable,
            archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
            sha256: '3'.repeat(64),
            installedAt: new Date().toISOString()
        }));

        await api.removeConfiguredManagedTectonic?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        });

        expect(fs.readFileSync(externalExecutable, 'utf8')).toBe('external-user-runtime');
        expect(fs.readFileSync(path.join(externalInstallDirectory, 'keep.txt'), 'utf8')).toBe('must-survive-removal');
    });

    test('removes inactive installs only when install-local ownership metadata validates the exact directory', async () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const inactiveExecutable = path.join(runtimeRoot, 'notemd-release', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        const unrelatedExecutable = path.join(runtimeRoot, 'tectonic-lookalike', HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
        fs.mkdirSync(path.dirname(inactiveExecutable), { recursive: true });
        fs.mkdirSync(path.dirname(unrelatedExecutable), { recursive: true });
        writeHostExecutable(inactiveExecutable, 'owned-runtime');
        writeHostExecutable(unrelatedExecutable, 'unrelated-runtime');
        fs.writeFileSync(
            path.join(path.dirname(inactiveExecutable), '.notemd-managed-runtime.json'),
            JSON.stringify({
                schemaVersion: 'notemd.managed-latex-runtime.v1',
                runtime: 'tectonic',
                version: '0.16.9',
                platform: HOST_PLATFORM,
                architecture: HOST_ARCHITECTURE,
                executablePath: inactiveExecutable,
                archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
                sha256: '2'.repeat(64),
                executableSha256: createHash('sha256').update('owned-runtime').digest('hex'),
                installedAt: new Date().toISOString()
            })
        );
        fs.writeFileSync(
            path.join(path.dirname(unrelatedExecutable), '.notemd-managed-runtime.json'),
            JSON.stringify({
                schemaVersion: 'notemd.managed-latex-runtime.v1',
                runtime: 'tectonic',
                version: '0.16.9',
                platform: HOST_PLATFORM,
                architecture: HOST_ARCHITECTURE,
                executablePath: unrelatedExecutable,
                archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
                sha256: '9'.repeat(64),
                executableSha256: '0'.repeat(64),
                installedAt: new Date().toISOString()
            })
        );

        await api.removeConfiguredManagedTectonic?.({
            ...DEFAULT_SETTINGS,
            circuitikzManagedRuntimeRoot: runtimeRoot
        });

        expect(fs.existsSync(path.dirname(inactiveExecutable))).toBe(false);
        expect(fs.readFileSync(unrelatedExecutable, 'utf8')).toBe('unrelated-runtime');
    });

    test('finishes the validated removal set when cancellation arrives after lock acquisition', async () => {
        const api = loadDesktopEnvironmentApi();
        const runtimeRoot = path.join(root, 'runtime');
        const controller = new AbortController();
        const createOwnedInstall = (releaseName: string, contents: string): string => {
            const executablePath = path.join(runtimeRoot, releaseName, HOST_PLATFORM_DIRECTORY, HOST_TECTONIC_EXECUTABLE);
            fs.mkdirSync(path.dirname(executablePath), { recursive: true });
            writeHostExecutable(executablePath, contents);
            fs.writeFileSync(
                path.join(path.dirname(executablePath), '.notemd-managed-runtime.json'),
                JSON.stringify({
                    schemaVersion: 'notemd.managed-latex-runtime.v1',
                    runtime: 'tectonic',
                    version: '0.16.9',
                    platform: HOST_PLATFORM,
                    architecture: HOST_ARCHITECTURE,
                    executablePath,
                    archiveUrl: 'https://github.com/notemd/fake-tectonic.zip',
                    sha256: '4'.repeat(64),
                    executableSha256: createHash('sha256').update(contents).digest('hex'),
                    installedAt: new Date().toISOString()
                })
            );
            return path.dirname(executablePath);
        };
        const firstDirectory = createOwnedInstall('first-owned-release', 'first');
        const secondDirectory = createOwnedInstall('second-owned-release', 'second');
        const rmSync = fs.rmSync;
        const remove = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
            const removed = rmSync(target, options);
            if (String(target) === firstDirectory) controller.abort();
            return removed;
        });

        try {
            const result = await api.removeConfiguredManagedTectonic?.({
                ...DEFAULT_SETTINGS,
                circuitikzManagedRuntimeRoot: runtimeRoot
            }, { signal: controller.signal });

            expect(result).toEqual({ status: 'removed' });
            expect(fs.existsSync(firstDirectory)).toBe(false);
            expect(fs.existsSync(secondDirectory)).toBe(false);
        } finally {
            remove.mockRestore();
        }
    });

    test('clears a configured stale lock through the desktop environment boundary', async () => {
        const api = loadDesktopEnvironmentApi();
        expect(api.clearConfiguredManagedTectonicStaleLock).toBeDefined();
        if (!api.clearConfiguredManagedTectonicStaleLock) return;
        const runtimeRoot = path.join(root, 'runtime');
        const lockPath = path.join(runtimeRoot, '.managed-runtime.lock');
        fs.mkdirSync(lockPath, { recursive: true });
        fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({
            pid: 999_999_999,
            token: 'configured-stale-owner'
        }));
        const kill = jest.spyOn(process, 'kill').mockImplementation((() => {
            throw Object.assign(new Error('missing process'), { code: 'ESRCH' });
        }) as typeof process.kill);

        try {
            await expect(api.clearConfiguredManagedTectonicStaleLock({
                ...DEFAULT_SETTINGS,
                circuitikzManagedRuntimeRoot: runtimeRoot
            })).resolves.toEqual(expect.objectContaining({ status: 'cleared' }));
            expect(fs.existsSync(lockPath)).toBe(false);
        } finally {
            kill.mockRestore();
        }
    });
});
