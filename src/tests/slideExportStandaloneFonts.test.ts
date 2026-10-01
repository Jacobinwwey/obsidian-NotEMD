import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportSlidevHtmlWithOutcome } from '../slideExport/slidevExporter';
import { execFileAsync } from '../slideExport/platformUtils';
import type { App } from 'obsidian';

jest.mock('../slideExport/platformUtils', () => ({
    safeRequire: (name: string) => jest.requireActual(name),
    getVaultBasePath: (app: App) => (app.vault.adapter as unknown as { basePath: string }).basePath,
    resolveSlidevCommand: () => ({ command: 'slidev', argsPrefix: [], description: 'test Slidev' }),
    execFileAsync: jest.fn()
}));

describe('standalone Slidev stylesheet resources', () => {
    let root: string;
    let stylesheet: string;
    let app: App;
    const source = { inputFilePath: 'source.md', outputBasename: 'deck', sourceLabel: 'source.md' };
    const config = { format: 'html' as const, withClicks: false, outputSubfolder: 'export', ffmpegFps: 1, ffmpegCrf: 23, timeoutMs: 1000, slidevTheme: 'default', imageScale: 3 };
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-standalone-fonts-'));
        stylesheet = '';
        app = { vault: { adapter: {
            basePath: root,
            read: async (file: string) => fs.readFileSync(path.join(root, file), 'utf8'),
            write: async (file: string, text: string) => fs.writeFileSync(path.join(root, file), text)
        } } } as unknown as App;
        (execFileAsync as jest.Mock).mockImplementation(async () => {
            const output = path.join(root, 'export/deck-slides');
            fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
            fs.writeFileSync(path.join(output, 'assets/KaTeX_Math.woff2'), Buffer.from([0, 1, 2, 3]));
            fs.writeFileSync(path.join(output, 'index-standalone.html'), `<!doctype html><style>${stylesheet}</style><body>Math</body>`);
            return { exitCode: 0, stdout: '', stderr: '' };
        });
    });
    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    test('embeds fonts whose URLs became relative to the HTML after CSS hoisting', async () => {
        stylesheet = '@font-face{font-family:KaTeX;src:url(./KaTeX_Math.woff2) format("woff2")}';
        const outcome = await exportSlidevHtmlWithOutcome(app, source, config);
        const html = await app.vault.adapter.read(outcome.path);
        expect(html).toContain('url("data:font/woff2;base64,AAECAw==")');
        expect(html).not.toContain('url(./KaTeX_Math.woff2)');
        expect(outcome.actualMode).toBe('standalone');
    });

    test('embeds already rebased asset URLs with quotes and a cache query', async () => {
        stylesheet = '@font-face{src:url("./assets/KaTeX_Math.woff2?v=1")}';
        const outcome = await exportSlidevHtmlWithOutcome(app, source, config);
        expect(await app.vault.adapter.read(outcome.path)).toContain('data:font/woff2;base64,AAECAw==');
    });

    test('fails visibly when a local font is missing instead of accepting a broken standalone export', async () => {
        stylesheet = '@font-face{src:url(./missing.woff2)}';
        await expect(exportSlidevHtmlWithOutcome(app, source, config)).rejects.toThrow('Standalone stylesheet asset');
    });

    test('never reads assets outside the generated output directory', async () => {
        fs.writeFileSync(path.join(root, 'private.woff2'), 'private');
        stylesheet = '@font-face{src:url(../../private.woff2)}';
        await expect(exportSlidevHtmlWithOutcome(app, source, config)).rejects.toThrow('Standalone stylesheet asset');
    });

    test('leaves embedded, remote and fragment URLs intact', async () => {
        stylesheet = 'a{background:url(data:image/png;base64,AAAA)}b{filter:url(#shadow)}c{background:url(https://example.com/image.png)}';
        const outcome = await exportSlidevHtmlWithOutcome(app, source, config);
        expect(await app.vault.adapter.read(outcome.path)).toContain(stylesheet);
    });
});
