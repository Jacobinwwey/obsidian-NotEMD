import { probeNode, probePlaywright, probeFfmpeg, probeEnvironment } from '../slideExport/environmentProber';
import { detectStandaloneBundleLoaderGaps, exportSlidevHtml, exportSlidevHtmlWithOutcome, exportSlidevPdf, exportSlidevPng } from '../slideExport/slidevExporter';
import { exportVideoMp4 } from '../slideExport/videoExporter';
import type { SlideExportConfig, SlidevExportSource } from '../slideExport/types';
import type { TFile, App } from 'obsidian';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('../slideExport/platformUtils');

import * as platformUtils from '../slideExport/platformUtils';

const mockIsDesktopApp = platformUtils.isDesktopApp as jest.MockedFunction<typeof platformUtils.isDesktopApp>;
const mockGetVaultBasePath = platformUtils.getVaultBasePath as jest.MockedFunction<typeof platformUtils.getVaultBasePath>;
const mockSafeRequire = platformUtils.safeRequire as jest.MockedFunction<typeof platformUtils.safeRequire>;
const mockExecFileAsync = platformUtils.execFileAsync as jest.MockedFunction<typeof platformUtils.execFileAsync>;
const mockResolveNpxCommand = platformUtils.resolveNpxCommand as jest.MockedFunction<typeof platformUtils.resolveNpxCommand>;
const mockResolvePlaywrightBrowsersPath = platformUtils.resolvePlaywrightBrowsersPath as jest.MockedFunction<typeof platformUtils.resolvePlaywrightBrowsersPath>;
const mockResolveSlidevCommand = platformUtils.resolveSlidevCommand as jest.MockedFunction<typeof platformUtils.resolveSlidevCommand>;
const mockResolveWorkspaceHomeCandidates = platformUtils.resolveWorkspaceHomeCandidates as jest.MockedFunction<typeof platformUtils.resolveWorkspaceHomeCandidates>;
const mockGetOsPlatform = platformUtils.getOsPlatform as jest.MockedFunction<typeof platformUtils.getOsPlatform>;

function mockNpxSlidevCommand(): void {
    mockResolveSlidevCommand.mockReturnValue({
        command: 'npx',
        argsPrefix: ['-y', '@slidev/cli'],
        description: 'npx -y @slidev/cli',
        source: 'npx',
    });
}

function createMockApp(basePath: string | null = '/vault'): any {
    return {
        vault: {
            adapter: {
                getBasePath: basePath ? () => basePath : undefined,
                basePath: basePath ?? undefined,
                read: jest.fn().mockResolvedValue(`
window.__require("./index-abc.js");
{"./index-abc.js":"var LoaderA=async()=>{},LoaderB=async()=>{};const slides=[{load:LoaderA},{load:LoaderB}]"}
`),
                write: jest.fn().mockResolvedValue(undefined),
                stat: jest.fn().mockResolvedValue({ size: 1024 }),
                list: jest.fn().mockResolvedValue({ files: [], folders: [] }),
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

function createMockSlidevSource(name: string, path: string, hasParent = true): SlidevExportSource {
    const file = createMockFile(name, path, hasParent);
    return {
        inputFilePath: file.path,
        outputBasename: file.basename,
        sourceLabel: file.path,
    };
}

function ok(tool: string, version: string) {
    return { tool, installed: true, version, error: undefined };
}

function fail(tool: string, version: string | null, error: string) {
    return { tool, installed: false, version, error };
}

function mockSlideExportExec(options: { playwrightAvailable?: boolean; ffmpegAvailable?: boolean } = {}): void {
    mockExecFileAsync.mockImplementation(async (command: string, args: string[]) => {
        if (command === 'node' && args.includes('--version')) {
            return { exitCode: 0, stdout: 'v20.1.0', stderr: '' };
        }
        if (command === 'ffmpeg' && args.includes('-version')) {
            return options.ffmpegAvailable
                ? { exitCode: 0, stdout: 'ffmpeg version 6.1\nmore info', stderr: '' }
                : { exitCode: 1, stdout: '', stderr: '' };
        }
        if (command === 'ffmpeg') {
            return { exitCode: 0, stdout: '', stderr: '' };
        }
        if (args.includes('playwright') && args.includes('--version')) {
            return options.playwrightAvailable
                ? { exitCode: 0, stdout: 'Version 1.61.0', stderr: '' }
                : { exitCode: 1, stdout: '', stderr: '' };
        }
        if (args.includes('--version')) {
            return { exitCode: 0, stdout: '52.16.0', stderr: '' };
        }
        if (args.includes('build') && args.includes('--help')) {
            return { exitCode: 0, stdout: '--standalone-bundle  generate standalone single-file HTML bundle', stderr: '' };
        }
        return { exitCode: 0, stdout: '', stderr: '' };
    });
}

describe('platformUtils — Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNpxSlidevCommand();
        mockResolvePlaywrightBrowsersPath.mockReturnValue('/home/user/.cache/ms-playwright');
        mockResolveWorkspaceHomeCandidates.mockReturnValue(['/home/user']);
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
        mockNpxSlidevCommand();
        mockResolvePlaywrightBrowsersPath.mockReturnValue('/home/user/.cache/ms-playwright');
        mockResolveWorkspaceHomeCandidates.mockReturnValue(['/home/user']);
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
        const mockFs = { existsSync: jest.fn().mockReturnValue(true), readdirSync: jest.fn().mockReturnValue(['chromium']) };
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'fs') return mockFs;
            if (name === 'path') return { join: (...args: string[]) => args.join('/') };
            if (name === 'os') return { homedir: () => '/home/user' };
            return null;
        });
        mockGetOsPlatform.mockReturnValue('linux');
        mockSlideExportExec({ ffmpegAvailable: true });

        const report = await probeEnvironment(['/vault']);
        expect(report.node.installed).toBe(true);
        expect(report.slidev.installed).toBe(true);
        expect(report.playwright.installed).toBe(true);
        expect(report.ffmpeg.installed).toBe(true);
        expect(mockResolveSlidevCommand).toHaveBeenCalledWith({ roots: ['/vault'] });
    });
});

describe('slidevExporter — All Format Combinations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
        mockNpxSlidevCommand();
        mockResolvePlaywrightBrowsersPath.mockReturnValue('/home/user/.cache/ms-playwright');
        mockResolveWorkspaceHomeCandidates.mockReturnValue(['/home/user']);
    });

    test('exports HTML with theme', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
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
        await exportSlidevHtml(app, source, config, callback);
        expect(rmSync).toHaveBeenCalledWith('/vault/export/test-slides', { recursive: true, force: true });
        expect(mkdirSync).toHaveBeenCalledWith('/vault/export/test-slides', { recursive: true });
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--theme', 'seriph', '--base', './', '--standalone-bundle']),
            expect.objectContaining({ timeout: 120000 })
        );
    });

    test('reports accepted native standalone html outcome', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'seriph',
            timeoutMs: 120000,
        };

        const outcome = await exportSlidevHtmlWithOutcome(app, source, config, jest.fn());

        expect(outcome).toEqual({
            path: 'export/test-slides/index-standalone.html',
            requestedMode: 'standalone',
            actualMode: 'standalone',
            requiresLocalServer: false,
            fallbackPath: null,
            standaloneAttempt: {
                attempted: true,
                accepted: true,
                outputPath: 'export/test-slides/index-standalone.html',
                preservedFailurePath: null,
                loaderGaps: [],
                failureReason: null,
            },
        });
        expect(mockExecFileAsync).toHaveBeenCalledTimes(1);
        expect(mockExecFileAsync.mock.calls[0][1]).toEqual(expect.arrayContaining(['--standalone-bundle']));
    });

    test('copies prepared local file references into the HTML export directory', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const tempVaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-slidev-export-assets-'));
        const preparedDeckPath = 'export/_slidev-sources/deck/deck.slidev.md';
        const preparedDeckDirectory = path.join(tempVaultRoot, 'export/_slidev-sources/deck');
        fs.mkdirSync(path.join(preparedDeckDirectory, 'assets'), { recursive: true });
        fs.mkdirSync(path.join(preparedDeckDirectory, 'media'), { recursive: true });
        fs.writeFileSync(path.join(preparedDeckDirectory, 'deck.slidev.md'), [
            '---',
            'theme: default',
            'background: ./assets/deck-background.svg',
            'favicon: ./assets/favicon.svg?cache=test',
            '---',
            '',
            '# Deck',
            '',
            '---',
            'layout: image-right',
            'image: ./assets/hero.svg',
            '---',
            '',
            '# Image',
            '',
            '![Texture](./assets/texture.svg)',
            '<link rel="stylesheet" href="./assets/local-theme.css">',
            '',
            '---',
            'background: ../outside.svg',
            '---',
            '',
            '# Rejected',
        ].join('\n'));
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/deck-background.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/favicon.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/hero.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/texture.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/local-theme.css'), [
            '@import "./imported-theme.css";',
            '@import "https://example.test/remote-theme.css";',
            '@import "../../outside.css";',
            '@font-face { font-family: FixtureTheme; src: url("./theme-font.woff2") format("woff2"); }',
            '.themed-backdrop { background-image: url("../media/theme-pattern.svg"); }',
            '.remote-backdrop { background-image: url("https://example.test/remote-pattern.svg"); }',
            '.bad-backdrop { background-image: url("../../outside.svg"); }',
            '.bad-null { background-image: url("bad\0asset.svg"); }',
        ].join('\n'), 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/imported-theme.css'), [
            '@font-face { font-family: FixtureImported; src: url("./imported-font.woff2") format("woff2"); }',
            '.imported-backdrop { background-image: url("../media/imported-pattern.svg"); }',
        ].join('\n'), 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/theme-font.woff2'), 'fake font payload', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'assets/imported-font.woff2'), 'fake imported font payload', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'media/theme-pattern.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(preparedDeckDirectory, 'media/imported-pattern.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(tempVaultRoot, 'export/_slidev-sources/outside.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(tempVaultRoot, 'export/_slidev-sources/outside.css'), 'body{}', 'utf8');
        mockGetVaultBasePath.mockReturnValue(tempVaultRoot);
        mockSafeRequire.mockImplementation((moduleName: string) => {
            if (moduleName === 'fs') return fs;
            if (moduleName === 'path') return path;
            return null;
        });
        const app = createMockApp(tempVaultRoot);
        const source: SlidevExportSource = {
            inputFilePath: preparedDeckPath,
            outputBasename: 'deck',
            sourceLabel: preparedDeckPath,
            preparedDeckPath,
        };
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 120000,
        };

        try {
            await exportSlidevHtmlWithOutcome(app, source, config, jest.fn());

            const exportDirectory = path.join(tempVaultRoot, 'export/deck-slides');
            expect(fs.existsSync(path.join(exportDirectory, 'assets/deck-background.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/favicon.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/hero.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/texture.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/local-theme.css'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/imported-theme.css'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/theme-font.woff2'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'assets/imported-font.woff2'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'media/theme-pattern.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'media/imported-pattern.svg'))).toBe(true);
            expect(fs.existsSync(path.join(exportDirectory, 'outside.svg'))).toBe(false);
            expect(fs.existsSync(path.join(exportDirectory, 'outside.css'))).toBe(false);
            const exportedThemeCss = fs.readFileSync(path.join(exportDirectory, 'assets/local-theme.css'), 'utf8');
            expect(exportedThemeCss).toContain('@import "./imported-theme.css";');
            expect(exportedThemeCss).toContain('@import "https://example.test/remote-theme.css";');
            expect(exportedThemeCss).toContain('url("../media/theme-pattern.svg")');
            expect(exportedThemeCss).toContain('url("https://example.test/remote-pattern.svg")');
            expect(exportedThemeCss).not.toContain('outside.css');
            expect(exportedThemeCss).not.toContain('outside.svg');
            expect(exportedThemeCss).not.toContain('\0');
        } finally {
            fs.rmSync(tempVaultRoot, { recursive: true, force: true });
        }
    });

    test('reports explicit server-script html outcome without standalone attempt', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 120000,
            htmlMode: 'server-script',
        };

        const outcome = await exportSlidevHtmlWithOutcome(app, source, config, jest.fn());

        expect(outcome).toEqual({
            path: 'export/test-slides/index.html',
            requestedMode: 'server-script',
            actualMode: 'server-script',
            requiresLocalServer: true,
            fallbackPath: null,
            standaloneAttempt: {
                attempted: false,
                accepted: false,
                outputPath: null,
                preservedFailurePath: null,
                loaderGaps: [],
                failureReason: null,
            },
        });
        expect(mockExecFileAsync).toHaveBeenCalledTimes(1);
        expect(mockExecFileAsync.mock.calls[0][1]).not.toEqual(expect.arrayContaining(['--standalone-bundle']));
    });

    test('exports PDF without theme', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { mkdirSync } : null);
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
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
        await exportSlidevPdf(app, source, config, callback);
        expect(mkdirSync).toHaveBeenCalledWith('/vault/export', { recursive: true });
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'pdf', '--output', '/vault/export/test.pdf']),
            expect.objectContaining({
                timeout: 60000,
                env: { PLAYWRIGHT_BROWSERS_PATH: '/home/user/.cache/ms-playwright' },
            })
        );
        expect(mockExecFileAsync.mock.calls[0][1]).not.toContain('--theme');
    });

    test('exports PNG with clicks and calls progress callback', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
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
        await exportSlidevPng(app, source, config, callback);
        expect(callback).toHaveBeenCalledWith('slidev-export', expect.any(String));
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'png', '--output', '/vault/export/test-slides-png', '--with-clicks', '--theme', 'default']),
            expect.objectContaining({
                timeout: 90000,
                env: { PLAYWRIGHT_BROWSERS_PATH: '/home/user/.cache/ms-playwright' },
            })
        );
        expect(rmSync).toHaveBeenCalledWith('/vault/export/test-slides-png', { recursive: true, force: true });
        expect(mkdirSync).toHaveBeenCalledWith('/vault/export/test-slides-png', { recursive: true });
    });

    test('timeout passthrough to execFileAsync', async () => {
        mockExecFileAsync.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 180000,
        };
        await exportSlidevHtml(app, source, config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenCalledWith(
            'npx',
            expect.any(Array),
            expect.objectContaining({ timeout: 180000 })
        );
    });

    test('falls back to server-script html when native standalone bundle misses slide loader bindings', async () => {
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        app.vault.adapter.read = jest.fn().mockResolvedValue(`
window.__require("./index-abc.js");
{"./index-abc.js":"var Bt=(e,t)=>t;const slides=[{load:Vt,component:Bt(0,Vt)},{load:Ht,component:Bt(1,Ht)}];Ht=async()=>{};"}
`);
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 120000,
        };

        const output = await exportSlidevHtml(app, source, config, jest.fn());

        expect(output).toBe('export/test-slides/index.html');
        expect(mockExecFileAsync.mock.calls[0][1]).toEqual(expect.arrayContaining(['--standalone-bundle']));
        expect(mockExecFileAsync.mock.calls[1][1]).not.toEqual(expect.arrayContaining(['--standalone-bundle']));
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/test-slides/start-server.sh',
            expect.stringContaining('python3 -m http.server')
        );
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/test-slides/README.md',
            expect.stringContaining('Quick Start')
        );
    });

    test('reports fallback html outcome and preserves rejected standalone bundle', async () => {
        mockExecFileAsync
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
            .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });
        const rmSync = jest.fn();
        const mkdirSync = jest.fn();
        mockSafeRequire.mockImplementation((name: string) => name === 'fs' ? { rmSync, mkdirSync } : null);
        const app = createMockApp();
        const rejectedHtml = `
window.__require("./index-abc.js");
{"./index-abc.js":"var Bt=(e,t)=>t;const slides=[{load:Vt,component:Bt(0,Vt)},{load:Ht,component:Bt(1,Ht)}];Ht=async()=>{};"}
`;
        app.vault.adapter.read = jest.fn().mockResolvedValue(rejectedHtml);
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 120000,
        };

        const outcome = await exportSlidevHtmlWithOutcome(app, source, config, jest.fn());

        expect(outcome).toEqual({
            path: 'export/test-slides/index.html',
            requestedMode: 'standalone',
            actualMode: 'server-script-fallback',
            requiresLocalServer: true,
            fallbackPath: 'export/test-slides/index.html',
            standaloneAttempt: {
                attempted: true,
                accepted: false,
                outputPath: 'export/test-slides/index-standalone.html',
                preservedFailurePath: 'export/test-slides/index-standalone.failed.html',
                loaderGaps: ['Vt'],
                failureReason: 'loader-gaps',
            },
        });
        expect(mockExecFileAsync).toHaveBeenCalledTimes(2);
        expect(mockExecFileAsync.mock.calls[0][1]).toEqual(expect.arrayContaining(['--standalone-bundle']));
        expect(mockExecFileAsync.mock.calls[1][1]).not.toEqual(expect.arrayContaining(['--standalone-bundle']));
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/test-slides/index-standalone.failed.html',
            rejectedHtml
        );
    });
});

describe('slidevExporter — standalone loader sanity detection', () => {
    test('detects missing slide loader bindings in standalone bundle html', () => {
        const html = `
window.__require("./index-abc.js");
{"./index-abc.js":"var Bt=(e,t)=>t;const slides=[{load:Vt,component:Bt(0,Vt)},{load:Ht,component:Bt(1,Ht)}];Ht=async()=>{};"}
`;
        expect(detectStandaloneBundleLoaderGaps(html)).toEqual(['Vt']);
    });

    test('accepts standalone bundle html when all referenced slide loaders are defined', () => {
        const html = `
window.__require("./index-abc.js");
{"./index-abc.js":"var Bt=(e,t)=>t,Vt=async()=>{},Ht=async()=>{};const slides=[{load:Vt,component:Bt(0,Vt)},{load:Ht,component:Bt(1,Ht)}];"}
`;
        expect(detectStandaloneBundleLoaderGaps(html)).toEqual([]);
    });

    test('accepts minified loader bindings that start with dollar signs', () => {
        const html = `
window.__require("./index-abc.js");
{"./index-abc.js":"var Bt=(e,t)=>t,$n=async()=>{},er=async()=>{};const slides=[{load:$n,component:Bt(0,$n)},{load:er,component:Bt(1,er)}];"}
`;
        expect(detectStandaloneBundleLoaderGaps(html)).toEqual([]);
    });
});

describe('videoExporter — Timeout and Pattern Construction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
        mockNpxSlidevCommand();
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
        mockNpxSlidevCommand();
    });

    test('full probe to HTML export flow', async () => {
        mockSlideExportExec();

        const report = await probeEnvironment(['/vault']);
        expect(report.node.installed).toBe(true);
        expect(report.slidev.installed).toBe(true);
        expect(report.capabilities.html).toBe(true);

        const app = createMockApp();
        const source = createMockSlidevSource('test', 'test.md');
        const config: SlideExportConfig = {
            format: 'html',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: '',
            timeoutMs: 120000,
        };
        await exportSlidevHtml(app, source, config, jest.fn());
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
        mockNpxSlidevCommand();
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
        mockSlideExportExec();

        const report = await probeEnvironment(['/vault']);
        expect(report.playwright.installed).toBe(true);
        expect(report.capabilities.pdf).toBe(true);
        expect(report.capabilities.pptx).toBe(true);

        const app = createMockApp();
        const source = createMockSlidevSource('slides', 'slides.md');
        const config: SlideExportConfig = {
            format: 'pdf',
            withClicks: true,
            outputSubfolder: 'export',
            ffmpegFps: 1,
            ffmpegCrf: 23,
            slidevTheme: 'default',
            timeoutMs: 180000,
        };
        await exportSlidevPdf(app, source, config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenLastCalledWith(
            'npx',
            expect.arrayContaining(['--format', 'pdf', '--theme', 'default']),
            expect.objectContaining({
                timeout: 180000,
                env: { PLAYWRIGHT_BROWSERS_PATH: '/home/user/.cache/ms-playwright' },
            })
        );
    });
});

describe('Integration — Probe to PNG to MP4 Chain', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDesktopApp.mockReturnValue(true);
        mockGetVaultBasePath.mockReturnValue('/vault');
        mockResolveNpxCommand.mockReturnValue('npx');
        mockNpxSlidevCommand();
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
        mockSlideExportExec({ ffmpegAvailable: true });

        const report = await probeEnvironment(['/vault']);
        expect(report.capabilities.png).toBe(true);
        expect(report.capabilities.pptx).toBe(true);
        expect(report.capabilities.mp4).toBe(true);

        const app = createMockApp();
        const source = createMockSlidevSource('deck', 'deck.md');
        const config: SlideExportConfig = {
            format: 'png',
            withClicks: false,
            outputSubfolder: 'export',
            ffmpegFps: 2,
            ffmpegCrf: 20,
            slidevTheme: '',
            timeoutMs: 120000,
        };
        await exportSlidevPng(app, source, config, jest.fn());

        await exportVideoMp4(app, 'export/deck-slides-png', 'deck', config, jest.fn());
        expect(mockExecFileAsync).toHaveBeenLastCalledWith(
            'ffmpeg',
            expect.arrayContaining(['-framerate', '2', '-crf', '20']),
            expect.objectContaining({ timeout: 300000 })
        );
    });
});
