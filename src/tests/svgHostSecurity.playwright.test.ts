import { build } from 'esbuild';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';

let browser: Browser; let page: Page; let bundle: string;
beforeAll(async () => {
    const compiled = await build({
        stdin: { contents: "export { renderPreviewArtifactSvg } from './src/rendering/preview/previewExport'; export { mountDiagramSvg } from './src/rendering/preview/svgHostSanitizer';", resolveDir: path.join(__dirname, '../..'), loader: 'ts' },
        bundle: true, write: false, format: 'iife', globalName: 'SvgExport', platform: 'browser', loader: { '.ttf': 'dataurl', '.txt': 'text' },
        plugins: [{ name: 'obsidian', setup(builder) { builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'mock' })); builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export class App {} export class TFile {} export const getLanguage = () => "en";' })); } }]
    });
    bundle = compiled.outputFiles[0].text; browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });
beforeEach(async () => { page = await browser.newPage(); await page.setContent('<div id="outside">outside</div><div id="mount"></div>'); await page.addScriptTag({ content: bundle }); });
afterEach(async () => { await page?.close(); });
async function preview(svg: string) {
    return page.evaluate(source => {
        const api = (window as unknown as { SvgExport: { renderPreviewArtifactSvg(artifact: unknown): Promise<string>; mountDiagramSvg(container: HTMLElement, svg: string): void } }).SvgExport;
        return api.renderPreviewArtifactSvg({ target: 'drawnix', content: '{}', mimeType: 'application/json', sourceIntent: 'mindmap', previewSvg: { content: source, mimeType: 'image/svg+xml' } }).then(safe => {
            api.mountDiagramSvg(document.querySelector('#mount') as HTMLElement, safe);
            return safe;
        });
    }, svg);
}
test('Vault SVG events, links and active embeds are stripped before host mounting', async () => {
    const safe = await preview('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="window.__svgExecuted=true"><rect width="100" height="100" onclick="alert(1)"/><image href="https://attacker.invalid/x.png"/><use href="javascript:alert(1)"/><foreignObject><iframe src="https://attacker.invalid"/></foreignObject><text x="10" y="30">中文标签</text></svg>');
    expect(safe).not.toMatch(/onload|onclick|attacker|javascript:|foreignObject|iframe/i);
    expect(safe).toContain('中文标签');
    expect(await page.evaluate(() => (window as unknown as { __svgExecuted?: boolean }).__svgExecuted)).toBeUndefined();
});
test('SVG CSS remains scoped to its graphic and cannot restyle sibling UI', async () => {
    await preview('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>#outside { display:none } text { fill:rgb(255,0,0) }</style><text x="5" y="25">图中文字</text></svg>');
    expect(await page.locator('#outside').isVisible()).toBe(true);
    expect(await page.locator('#mount text').evaluate(el => getComputedStyle(el).fill)).toBe('rgb(255, 0, 0)');
});
test('safe vector resources, Unicode and internal references survive', async () => {
    const safe = await preview('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><marker id="arrow"><path d="M0 0L5 5"/></marker><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs><path d="M0 0L10 10" marker-end="url(#arrow)"/><rect width="20" height="20" fill="url(#paint)"/><text x="1" y="20">关系 α 中文</text></svg>');
    expect(safe).toContain('marker'); expect(safe).toContain('url(#arrow)'); expect(safe).toContain('url(#paint)'); expect(safe).toContain('关系 α 中文');
});

test('styles survive multi-panel composition and stay local to each panel', async () => {
    await page.evaluate(() => {
        const api = (window as unknown as { SvgExport: { renderPreviewArtifactSvg(artifact: unknown): Promise<string>; mountDiagramSvg(container: HTMLElement, svg: string): void } }).SvgExport;
        const panel = (color: string) => ({ artifact: { target: 'drawnix', content: '{}', previewSvg: { content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>text {fill:' + color + '}</style><text x="5" y="25">中文面板</text></svg>' } } });
        return api.renderPreviewArtifactSvg({ target: 'drawnix', previewPanels: [panel('red'), panel('blue')] }).then(svg => api.mountDiagramSvg(document.querySelector('#mount') as HTMLElement, svg));
    });
    expect(await page.locator('#mount text').evaluateAll(nodes => nodes.map(el => getComputedStyle(el).fill))).toEqual(['rgb(255, 0, 0)', 'rgb(0, 0, 255)']);
});
test('source-controlled scope IDs cannot let one graphic restyle another', async () => {
    await preview('<svg data-notemd-svg-scope="shared" viewBox="0 0 100 100"><style>text {fill:red}</style><text x="5" y="25">first</text></svg>');
    await page.evaluate(() => {
        const container = document.createElement('div'); container.id = 'second'; document.body.append(container);
        (window as unknown as { SvgExport: { mountDiagramSvg(container: HTMLElement, svg: string): void } }).SvgExport.mountDiagramSvg(container, '<svg data-notemd-svg-scope="shared" viewBox="0 0 100 100"><style>text {display:none}</style><text x="5" y="25">second</text></svg>');
    });
    expect(await page.locator('#mount text').isVisible()).toBe(true);
});
test('CSS string image resources cannot leave the graphic', async () => {
    const requests: string[] = []; page.on('request', request => { if (request.url().includes('attacker.invalid')) requests.push(request.url()); });
    await page.route('https://attacker.invalid/**', route => route.abort());
    const svg = '<svg viewBox="0 0 100 100" style="background-image:image-set("https://attacker.invalid/inline.png" 1x)"><style>svg {background-image:image-set("https://attacker.invalid/style.png" 1x)}</style><rect width="100" height="100"/></svg>';
    const safe = await preview(svg.replace('style="background-image:image-set("https://attacker.invalid/inline.png" 1x)"', "style='background-image:image-set(\"https://attacker.invalid/inline.png\" 1x)'"));
    expect(safe).not.toContain('attacker.invalid'); expect(requests).toEqual([]);
});
test('legacy foreignObject Unicode is converted to visible vector text', async () => {
    const safe = await preview('<svg viewBox="0 0 200 100"><foreignObject x="10" y="10" width="180" height="60"><div xmlns="http://www.w3.org/1999/xhtml">中文关系<br/>第二行</div></foreignObject></svg>');
    expect(safe).toContain('中文关系'); expect(safe).toContain('第二行'); expect(safe).not.toContain('foreignObject');
    expect(await page.locator('#mount text').isVisible()).toBe(true);
});

test('reopening and re-exporting an SVG does not compound its CSS selectors', async () => {
    const lengths = await page.evaluate(() => {
        const api = (window as unknown as { SvgExport: { renderPreviewArtifactSvg(artifact: unknown): Promise<string> } }).SvgExport;
        let svg = '<svg viewBox="0 0 100 100"><defs><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs><style>text {fill:url(#paint)}</style><text x="5" y="25">重复导出</text></svg>';
        const lengths: number[] = [];
        const next = (): Promise<number[]> => api.renderPreviewArtifactSvg({ target: 'drawnix', content: '{}', previewSvg: { content: svg } }).then(safe => {
            svg = safe; lengths.push(safe.length);
            return lengths.length === 6 ? lengths : next();
        });
        return next();
    });
    expect(Math.max(...lengths)).toBeLessThan(lengths[0] * 2);
});

test('forged source-style metadata is revalidated and cannot acquire host or network authority', async () => {
    const requests: string[] = []; page.on('request', request => { if (request.url().includes('attacker.invalid')) requests.push(request.url()); });
    await page.route('https://attacker.invalid/**', route => route.abort());
    const safe = await preview("<svg viewBox=\"0 0 100 100\"><style data-notemd-source-css='svg {background-image:image-set(\"https://attacker.invalid/meta.png\" 1x)} #outside {display:none} text {fill:red}'>text {fill:green}</style><text x=\"5\" y=\"25\">安全标签</text></svg>");
    expect(safe).not.toContain('attacker.invalid'); expect(requests).toEqual([]);
    expect(await page.locator('#outside').isVisible()).toBe(true);
    expect(await page.locator('#mount text').evaluate(el => getComputedStyle(el).fill)).toBe('rgb(255, 0, 0)');
});
