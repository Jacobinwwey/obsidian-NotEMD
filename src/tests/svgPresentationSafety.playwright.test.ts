import { build } from 'esbuild';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';

describe('SVG presentation clearance across display scales', () => {
    let browser: Browser;
    let page: Page;
    let bundle: string;

    beforeAll(async () => {
        const compiled = await build({
            stdin: { contents: "export { collectSvgPresentationDiagnostics } from './src/rendering/preview/svgSafety';",
                resolveDir: path.join(__dirname, '../..'), loader: 'ts' },
            bundle: true, write: false, format: 'iife', globalName: 'SvgSafety', platform: 'browser'
        });
        bundle = compiled.outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    }, 30000);
    afterAll(async () => { await browser?.close(); });
    afterEach(async () => { await page?.close(); });

    test.each([0.05, 0.16, 1, 4])('preserves real label and occlusion checks at scale %s', async scale => {
        page = await browser.newPage();
        await page.setContent('<div id="preview"><svg xmlns="http://www.w3.org/2000/svg" width="2593" height="956" viewBox="0 0 2593 956"><text x="72" y="44" font-family="Arial" font-size="24">architecture.zh-CN</text><text x="72" y="72" font-family="Arial" font-size="14">A native Drawnix tree with cross-branch relationships.</text></svg></div>');
        await page.addScriptTag({ content: bundle });
        const diagnostics = await page.evaluate(displayScale => {
            const svg = document.querySelector('svg')!;
            svg.style.transformOrigin = '0 0';
            svg.style.transform = 'scale(' + displayScale + ')';
            const runtime = window as unknown as { SvgSafety: { collectSvgPresentationDiagnostics(root: ParentNode): { kind: string }[] } };
            const root = document.querySelector('#preview')!;
            const clear = runtime.SvgSafety.collectSvgPresentationDiagnostics(root);
            const bounds = Array.from(svg.querySelectorAll('text')).map(text => ({
                client: text.getBoundingClientRect().toJSON(),
                source: { x: text.getBBox().x, y: text.getBBox().y, width: text.getBBox().width, height: text.getBBox().height }
            }));
            svg.querySelectorAll('text')[1].setAttribute('y', '44');
            const overlap = runtime.SvgSafety.collectSvgPresentationDiagnostics(root);
            svg.insertAdjacentHTML('beforeend', '<rect x="70" y="20" width="200" height="30"/>');
            const occluded = runtime.SvgSafety.collectSvgPresentationDiagnostics(root);
            return { clear, overlap, occluded, bounds, renderingAfter: svg.style.getPropertyValue('text-rendering') };
        }, scale);
        expect({ clear: diagnostics.clear, bounds: diagnostics.clear.length ? diagnostics.bounds : [] }).toEqual({ clear: [], bounds: [] });
        expect(diagnostics.overlap).toEqual([expect.objectContaining({ kind: 'svg-text-overlap' })]);
        expect(diagnostics.occluded).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'svg-text-occluded' })]));
        expect(diagnostics.renderingAfter).toBe('');
    });
});
