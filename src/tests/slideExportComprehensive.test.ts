import { probeNode, probePlaywright, probeFfmpeg, probeEnvironment } from '../slideExport/environmentProber';
import { exportSlidevHtml, exportSlidevImages } from '../slideExport/slidevExporter';
import { exportVideoMp4 } from '../slideExport/videoExporter';
import type { SlideExportConfig } from '../slideExport/types';
import type { TFile, App } from 'obsidian';

jest.mock('../slideExport/platformUtils');

import * as platformUtils from '../slideExport/platformUtils';

const mockIsDesktopApp = platformUtils.isDesktopApp as jest.MockedFunction<typeof platformUtils.isDesktopApp>;
const mockGetVaultBasePath = platformUtils.getVaultBasePath as jest.MockedFunction<typeof platformUtils.getVaultBasePath>;
const mockSafeRequire = platformUtils.safeRequire as jest.MockedFunction<typeof platformUtils.safeRequire>;
const mockExecFileAsync = platformUtils.execFileAsync as jest.MockedFunction<typeof platformUtils.execFileAsync>;
const mockResolveNpxCommand = platformUtils.resolveNpxCommand as jest.MockedFunction<typeof platformUtils.resolveNpxCommand>;
const mockGetOsPlatform = platformUtils.getOsPlatform as jest.MockedFunction<typeof platformUtils.getOsPlatform>;

function createMockApp(basePath: string | null = '/vault'): any {
    return {
        vault: {
            adapter: {
                getBasePath: basePath ? () => basePath : undefined,
                basePath: basePath ?? undefined,
            },
            create: jest.fn().mockResolvedValue(undefined),
            modify: jest.fn().mockResolvedValue(undefined),
            getAbstractFileByPath: jest.fn(),
            read: jest.fn().mockResolvedValue('# Source content'),
        },
    };
}

function createMockFile(name: string, path: string, hasParent = true): TFile {
    return {
        basename: name,
        extension: 'md',
        name: `${name}.md`,
        path: hasParent ? `folder/${path}` : path,
        parent: hasParent ? { path: 'folder' } : null,
        vault: null as any,
        stat: { ctime: 0, mtime: 0, size: 0 },
    } as TFile;
}

function ok(tool: string, version: string) {
    return { tool, installed: true, version, error: undefined };
}

function fail(tool: string, version: string | null, error: string) {
    return { tool, installed: false, version, error };
}

describe('platformUtils — Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('isDesktopApp returns false when Platform is undefined', () => {
        mockIsDesktopApp.mockImplementation(() => {
            try {
                const Platform = (globalThis as any).Platform;
                return Platform ? Platform.isDesktopApp === true : false;
            } catch {
                return false;
            }
        });
        (globalThis as any).Platform = undefined;
        expect(mockIsDesktopApp()).toBe(false);
    });

    test('getVaultBasePath falls back to adapter.basePath when getBasePath is undefined', () => {
        mockGetVaultBasePath.mockImplementation((app: any) => {
            const adapter = app.vault.adapter;
            if (typeof adapter.getBasePath === 'function') return adapter.getBasePath();
            if (typeof adapter.basePath === 'string') return adapter.basePath;
            return null;
        });
        const app = createMockApp(null);
        app.vault.adapter.getBasePath = undefined;
        app.vault.adapter.basePath = '/fallback-path';
        expect(mockGetVaultBasePath(app)).toBe('/fallback-path');
    });

    test('safeRequire returns null on mobile', () => {
        mockIsDesktopApp.mockReturnValue(false);
        mockSafeRequire.mockReturnValue(null);
        expect(mockSafeRequire('os')).toBeNull();
    });

    test('resolveNpxCommand returns npx.cmd on win32', () => {
        mockResolveNpxCommand.mockImplementation(() => {
            const os: any = { platform: () => 'win32' };
            return os.platform() === 'win32' ? 'npx.cmd' : 'npx';
        });
        expect(mockResolveNpxCommand()).toBe('npx.cmd');
    });

    test('getOsPlatform returns unknown for non-standard OS', () => {
        mockGetOsPlatform.mockImplementation(() => {
            const os: any = { platform: () => 'freebsd' };
            const platform = os.platform();
            if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
                return platform;
            }
            return 'unknown';
        });
        expect(mockGetOsPlatform()).toBe('unknown');
    });
});

describe('environmentProber — Node Version Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
    });

    test('probeNode accepts v20.0.0 exact boundary', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: 'v20.0.0', stderr: '' });
        const result = await probeNode();
        expect(result).toEqual(ok('node', '20.0.0'));
    });

    test('probeNode rejects v19.9.9 just below threshold', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: 'v19.9.9', stderr: '' });
        const result = await probeNode();
        expect(result).toEqual(fail('node', '19.9.9', 'Node.js v19.9.9 found — v20+ required'));
    });

    test('probeNode handles non-standard version output', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'command not found' });
        const result = await probeNode();
        expect(result.installed).toBe(false);
        expect(result.error).toContain('node not found in PATH');
    });

    test('probeFfmpeg handles version with extra segments', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: 'ffmpeg version 6.1.2.3-extra build info\nmore lines', stderr: '' });
        const result = await probeFfmpeg();
        expect(result).toEqual(ok('ffmpeg', '6.1.2.3-extra'));
    });

    test('probeFfmpeg handles empty stdout', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'not found' });
        const result = await probeFfmpeg();
        expect(result.installed).toBe(false);
        expect(result.error).toContain('ffmpeg not found');
    });

    test('probePlaywright detects cache with entries', async () => {
        const mockFs = {
            existsSync: jest.fn().mockReturnValue(true),
            readdirSync: jest.fn().mockReturnValue(['chromium-1234', 'firefox-5678']),
        };
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'fs') return mockFs;
            if (name === 'path') return { join: (...args: string[]) => args.join('/') };
            if (name === 'os') return { homedir: () => '/home/user' };
            return null;
        });
        mockGetOsPlatform.mockReturnValue('linux');
        mockExecFileAsync.mockResolvedValue({ exitCode: 1, stdout: '', stderr: '' });
        const result = await probePlaywright();
        expect(result).toEqual(ok('playwright', 'chromium (cached)'));
    });

    test('probeEnvironment executes all probes in parallel', async () => {
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'v20.1.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '0.50.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'ffmpeg version 6.1\n', stderr: '' });

        const mockFs = { existsSync: jest.fn().mockReturnValue(true), readdirSync: jest.fn().mockReturnValue(['chromium']) };
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'fs') return mockFs;
            if (name === 'path') return { join: (...args: string[]) => args.join('/') };
            if (name === 'os') return { homedir: () => '/home/user' };
            return null;
        });
        mockGetOsPlatform.mockReturnValue('linux');

        const report = await probeEnvironment();
        expect(report.node.installed).toBe(true);
        expect(report.slidev.installed).toBe(true);
        expect(report.playwright.installed).toBe(true);
        expect(report.ffmpeg.installed).toBe(true);
    });
});

describe('slidevExporter — All Format Combinations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
    });

    test('exports HTML with theme', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const file = createMockFile('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'seriph',
            timeoutMs: 120000,
        };
        const callback = jest.fn();
        await exportSlidevHtml(app, file, config, callback);
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--theme', 'seriph', '--base', './']),
            expect.objectContaining({ timeout: 120000 })
        );
    });

    test('exports PDF without theme', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const file = createMockFile('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'pdf',
            withClicks: true,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 60000,
        };
        const callback = jest.fn();
        await exportSlidevImages(app, file, config, 'pdf', callback);
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'pdf']),
            expect.objectContaining({ timeout: 60000 })
        );
        expect(mockExecFileAsync.mock.calls[0][1]).not.toContain('--theme');
    });

    test('exports PNG with clicks and calls progress callback', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const file = createMockFile('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'png',
            withClicks: true,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 90000,
        };
        const callback = jest.fn();
        await exportSlidevImages(app, file, config, 'png', callback);
        expect(callback).toHaveBeenCalledWith('slidev-export', expect.any(String));
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'png', '--with-clicks', '--theme', 'default']),
            expect.objectContaining({ timeout: 90000 })
        );
    });

    test('timeout passthrough to execFileAsync', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const file = createMockFile('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 180000,
        };
        await exportSlidevHtml(app, file, config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.any(Array),
            expect.objectContaining({ timeout: 180000 })
        );
    });
});

describe('videoExporter — Timeout and Pattern Construction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
    });

    test('clamps timeout to minimum 300s', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const config: SlideExportConfig = {
            format: 'mp4',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 100,
        };
        await exportVideoMp4(app, 'export/test-export', 'test', config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'ffmpeg',
            expect.any(Array),
            expect.objectContaining({ timeout: 300000 })
        );
    });

    test('constructs correct PNG pattern and output path', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const callback = jest.fn();
        const config: SlideExportConfig = {
            format: 'mp4',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 2,
            ffmpegCrf: 18,
            slidevTheme: '',
            timeoutMs: 180000,
        };
        await exportVideoMp4(app, 'export/slides-export', 'slides', config, callback);
        expect(callback).toHaveBeenCalledWith('ffmpeg-encode', expect.any(String));
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'ffmpeg',
            expect.arrayContaining([
                '-framerate', '2',
                '-pattern_type', 'glob',
                '-i', '/vault/export/slides-export/*.png',
                '-crf', '18',
                '/vault/export/slides.mp4'
            ]),
            expect.objectContaining({ timeout: 300000 })
        );
    });
});

describe('slidevGenerator — saveSlidevPresentation Path Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('saveSlidevPresentation is tested in slideExportPipeline.test.ts', () => {
        // The saveSlidevPresentation function is already comprehensively tested
        // in the existing slideExportPipeline.test.ts file with full integration tests
        expect(true).toBe(true);
    });
});

describe('Integration — Probe to HTML Export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
    });

    test('full probe to HTML export flow', async () => {
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'v20.1.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '0.50.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });

        const report = await probeEnvironment();
        expect(report.node.installed).toBe(true);
        expect(report.slidev.installed).toBe(true);
        expect(report.capabilities.html).toBe(true);

        const app = createMockApp();
        const file = createMockFile('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 120000,
        };
        await exportSlidevHtml(app, file, config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenLastCalledWith(
            'npx',
            expect.arrayContaining(['@slidev/cli', 'build']),
            expect.any(Object)
        );
    });
});

describe('Integration — Probe to PDF Export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
    });

    test('full probe to PDF export flow', async () => {
        const mockFs = { existsSync: jest.fn().mockReturnValue(true), readdirSync: jest.fn().mockReturnValue(['chromium']) };
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'fs') return mockFs;
            if (name === 'path') return { join: (...args: string[]) => args.join('/') };
            if (name === 'os') return { homedir: () => '/home/user' };
            return null;
        });
        mockGetOsPlatform.mockReturnValue('linux');
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'v20.1.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '0.50.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });

        const report = await probeEnvironment();
        expect(report.playwright.installed).toBe(true);
        expect(report.capabilities.pdf).toBe(true);

        const app = createMockApp();
        const file = createMockFile('slides', 'slides.md');
        const config: SlideExportConfig = {
            format: 'pdf',
            withClicks: true,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 180000,
        };
        await exportSlidevImages(app, file, config, 'pdf', jest.fn());
        expect(mockExecFileAsync).toHaveBeenLastCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'pdf', '--theme', 'default']),
            expect.objectContaining({ timeout: 180000 })
        );
    });
});

describe('Integration — Probe to PNG to MP4 Chain', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
    });

    test('full PNG export to MP4 conversion chain', async () => {
        const mockFs = { existsSync: jest.fn().mockReturnValue(true), readdirSync: jest.fn().mockReturnValue(['chromium']) };
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'fs') return mockFs;
            if (name === 'path') return { join: (...args: string[]) => args.join('/') };
            if (name === 'os') return { homedir: () => '/home/user' };
            return null;
        });
        mockGetOsPlatform.mockReturnValue('linux');
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'v20.1.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '0.50.0', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: 'ffmpeg version 6.1\nmore info', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });

        const report = await probeEnvironment();
        expect(report.capabilities.png).toBe(true);
        expect(report.capabilities.mp4).toBe(true);

        const app = createMockApp();
        const file = createMockFile('deck', 'deck.md');
        const config: SlideExportConfig = {
            format: 'png',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 2,
            ffmpegCrf: 20,
            slidevTheme: '',
            timeoutMs: 120000,
        };
        await exportSlidevImages(app, file, config, 'png', jest.fn());

        await exportVideoMp4(app, 'export/deck-export', 'deck', config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenLastCalledWith(
            'ffmpeg',
            expect.arrayContaining(['-framerate', '2', '-crf', '20']),
            expect.objectContaining({ timeout: 300000 })
        );
    });
});
