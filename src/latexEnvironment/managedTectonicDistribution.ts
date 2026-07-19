import * as path from 'path';

export const MANAGED_TECTONIC_VERSION = '0.16.9';

export type ManagedTectonicArchiveFormat = 'zip' | 'tar-gz';

export interface ManagedTectonicArtifact {
    archiveFormat: ManagedTectonicArchiveFormat;
    compressedBytes: number;
    executableName: 'tectonic.exe' | 'tectonic';
    sha256: string;
    url: string;
}

const RELEASE_ROOT = `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${MANAGED_TECTONIC_VERSION}`;

const MANAGED_TECTONIC_ARTIFACTS: Record<string, ManagedTectonicArtifact> = {
    'win32-x64': {
        archiveFormat: 'zip',
        compressedBytes: 20_035_039,
        executableName: 'tectonic.exe',
        sha256: '131a24604785a9600989a3d91225f597df52ac06f00aeffe86fd529f99ee5cdd',
        url: `${RELEASE_ROOT}/tectonic-${MANAGED_TECTONIC_VERSION}-x86_64-pc-windows-msvc.zip`
    },
    'darwin-arm64': {
        archiveFormat: 'tar-gz',
        compressedBytes: 20_590_132,
        executableName: 'tectonic',
        sha256: 'edb67c61aba768289f6da441c9e6f523cfaff4f8b2a5708523ef29c543f8e88e',
        url: `${RELEASE_ROOT}/tectonic-${MANAGED_TECTONIC_VERSION}-aarch64-apple-darwin.tar.gz`
    },
    'darwin-x64': {
        archiveFormat: 'tar-gz',
        compressedBytes: 20_572_838,
        executableName: 'tectonic',
        sha256: '79d8839fa3594bfea9b2bf2ac0a0455bcc4d0de956a5e5c403107e9a72f79e86',
        url: `${RELEASE_ROOT}/tectonic-${MANAGED_TECTONIC_VERSION}-x86_64-apple-darwin.tar.gz`
    },
    'linux-arm64': {
        archiveFormat: 'tar-gz',
        compressedBytes: 9_923_433,
        executableName: 'tectonic',
        sha256: 'f9aa39017dbd51f111fdb93dda222178cbe51c8193508fc567b523cc74fff9c1',
        url: `${RELEASE_ROOT}/tectonic-${MANAGED_TECTONIC_VERSION}-aarch64-unknown-linux-musl.tar.gz`
    },
    'linux-x64': {
        archiveFormat: 'tar-gz',
        compressedBytes: 10_146_030,
        executableName: 'tectonic',
        sha256: '60b13a0826ae7ad9ce34b4a2df06bff2cfcfa6dda8a915477c0cbb84e1a4a902',
        url: `${RELEASE_ROOT}/tectonic-${MANAGED_TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz`
    }
};

export function getManagedTectonicArtifact(platform: NodeJS.Platform, architecture: string): ManagedTectonicArtifact | null {
    const artifact = MANAGED_TECTONIC_ARTIFACTS[`${platform}-${architecture}`];
    return artifact ? { ...artifact } : null;
}

export function isSafeManagedArchiveEntry(entryName: string): boolean {
    if (!entryName || entryName.includes('\0') || /^[A-Za-z]:[\\/]/.test(entryName)) {
        return false;
    }
    const normalized = entryName.replace(/\\/g, '/');
    if (normalized.startsWith('/')) {
        return false;
    }
    return normalized.split('/').every(segment => segment !== '..');
}

export function resolveManagedLatexRuntimeRoot(input: {
    platform: NodeJS.Platform;
    environment: NodeJS.ProcessEnv;
    homeDirectory: string;
    configuredRoot?: string;
}): string {
    const platformPath = input.platform === 'win32' ? path.win32 : path.posix;
    if (input.configuredRoot?.trim()) {
        return platformPath.resolve(input.configuredRoot.trim());
    }

    if (input.platform === 'win32') {
        const localAppData = input.environment.LOCALAPPDATA?.trim()
            || path.win32.join(input.homeDirectory, 'AppData', 'Local');
        return path.win32.resolve(localAppData, 'Notemd', 'runtimes', 'latex');
    }
    if (input.platform === 'darwin') {
        return path.posix.resolve(input.homeDirectory, 'Library', 'Application Support', 'Notemd', 'runtimes', 'latex');
    }
    const dataHome = input.environment.XDG_DATA_HOME?.trim()
        || path.posix.join(input.homeDirectory, '.local', 'share');
    return path.posix.resolve(dataHome, 'notemd', 'runtimes', 'latex');
}
