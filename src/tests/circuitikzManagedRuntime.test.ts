import * as path from 'path';

type ManagedRuntimeApi = {
    MANAGED_TECTONIC_VERSION: string;
    getManagedTectonicArtifact: (platform: NodeJS.Platform, architecture: string) => {
        archiveFormat: 'zip' | 'tar-gz';
        compressedBytes: number;
        executableName: string;
        sha256: string;
        url: string;
    } | null;
    isSafeManagedArchiveEntry: (entryName: string) => boolean;
    resolveManagedLatexRuntimeRoot: (input: {
        platform: NodeJS.Platform;
        environment: NodeJS.ProcessEnv;
        homeDirectory: string;
        configuredRoot?: string;
    }) => string;
};

function loadManagedRuntimeApi(): Partial<ManagedRuntimeApi> {
    try {
        return require('../latexEnvironment/managedTectonicDistribution') as ManagedRuntimeApi;
    } catch {
        return {};
    }
}

describe('managed Tectonic distribution contract', () => {
    test('pins the verified Windows x64 MSVC asset', () => {
        const api = loadManagedRuntimeApi();

        expect(api.MANAGED_TECTONIC_VERSION).toBe('0.16.9');
        expect(api.getManagedTectonicArtifact?.('win32', 'x64')).toEqual({
            archiveFormat: 'zip',
            compressedBytes: 20_035_039,
            executableName: 'tectonic.exe',
            sha256: '131a24604785a9600989a3d91225f597df52ac06f00aeffe86fd529f99ee5cdd',
            url: 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.16.9/tectonic-0.16.9-x86_64-pc-windows-msvc.zip'
        });
    });

    test('selects supported macOS and Linux archives and rejects unsupported Windows ARM', () => {
        const api = loadManagedRuntimeApi();

        expect(api.getManagedTectonicArtifact?.('darwin', 'arm64')).toEqual(expect.objectContaining({
            archiveFormat: 'tar-gz',
            executableName: 'tectonic',
            sha256: 'edb67c61aba768289f6da441c9e6f523cfaff4f8b2a5708523ef29c543f8e88e'
        }));
        expect(api.getManagedTectonicArtifact?.('linux', 'x64')).toEqual(expect.objectContaining({
            archiveFormat: 'tar-gz',
            executableName: 'tectonic',
            sha256: '60b13a0826ae7ad9ce34b4a2df06bff2cfcfa6dda8a915477c0cbb84e1a4a902'
        }));
        expect(api.getManagedTectonicArtifact?.('win32', 'arm64')).toBeNull();
    });

    test('keeps the managed runtime outside the Vault by default and honors an explicit root', () => {
        const api = loadManagedRuntimeApi();

        expect(api.resolveManagedLatexRuntimeRoot?.({
            platform: 'win32',
            environment: { LOCALAPPDATA: 'D:\\Users\\Ada\\AppData\\Local' },
            homeDirectory: 'D:\\Users\\Ada'
        })).toBe(path.resolve('D:\\Users\\Ada\\AppData\\Local', 'Notemd', 'runtimes', 'latex'));
        expect(api.resolveManagedLatexRuntimeRoot?.({
            platform: 'linux',
            environment: { XDG_DATA_HOME: '/mnt/data/.local-data' },
            homeDirectory: '/home/ada'
        })).toBe('/mnt/data/.local-data/notemd/runtimes/latex');
        expect(api.resolveManagedLatexRuntimeRoot?.({
            platform: 'darwin',
            environment: {},
            homeDirectory: '/Users/ada'
        })).toBe('/Users/ada/Library/Application Support/Notemd/runtimes/latex');
        expect(api.resolveManagedLatexRuntimeRoot?.({
            platform: 'win32',
            environment: {},
            homeDirectory: 'C:\\Users\\Ada',
            configuredRoot: 'E:\\Notemd Runtime'
        })).toBe(path.resolve('E:\\Notemd Runtime'));
    });

    test('rejects archive traversal and absolute entry names', () => {
        const api = loadManagedRuntimeApi();

        expect(api.isSafeManagedArchiveEntry?.('tectonic.exe')).toBe(true);
        expect(api.isSafeManagedArchiveEntry?.('bin/tectonic')).toBe(true);
        expect(api.isSafeManagedArchiveEntry?.('../tectonic.exe')).toBe(false);
        expect(api.isSafeManagedArchiveEntry?.('bin/../../tectonic')).toBe(false);
        expect(api.isSafeManagedArchiveEntry?.('/usr/bin/tectonic')).toBe(false);
        expect(api.isSafeManagedArchiveEntry?.('C:\\Windows\\tectonic.exe')).toBe(false);
    });
});
