import { build } from 'esbuild';
import { chromium, Browser } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('complete diagram default viewport', () => {
    let browser: Browser;
    let bundle: string;
    beforeAll(async () => {
        bundle = (await build({ entryPoints: [resolve(__dirname, '../ui/DiagramPreviewViewport.ts')],
            bundle: true, write: false, format: 'iife', globalName: 'PreviewViewport' })).outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    });
    afterAll(async () => { await browser?.close(); });

    test.each([[4200, 1600], [4772, 16749], [600, 200]])('fits all %s x %s source pixels on initial open and after container resize', async (width, height) => {
        const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
        try {
            await page.setContent('<section class="notemd-diagram-preview-body" style="width:800px"></section>');
            await page.addStyleTag({ content: readFileSync(resolve(__dirname, '../../styles.css'), 'utf8') });
            await page.addScriptTag({ content: bundle });
            await page.evaluate(({ width, height }) => {
                const runtime = window as any;
                const copy = { zoomIn: 'In', zoomOut: 'Out', zoomFit: 'Fit', zoomActual: 'Actual', zoomLevel: 'Level', zoomViewport: 'Diagram', zoomLock: 'Lock', zoomUnlock: 'Unlock' };
                const view = new runtime.PreviewViewport.DiagramPreviewViewport(document.querySelector('section'), copy);
                view.contentEl.innerHTML = `<svg viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}"/><text x="8" y="24">Complete diagram</text></svg>`;
                view.refresh();
                runtime.testView = view;
            }, { width, height });
            for (const containerWidth of [800, 360]) {
                await page.locator('section').evaluate((section, containerWidth) => { section.style.width = `${containerWidth}px`; }, containerWidth);
                await page.evaluate(() => (window as any).testView.refresh());
                const bounds = await page.evaluate(() => {
                    const viewport = document.querySelector('.notemd-diagram-zoom-viewport')!;
                    const svg = document.querySelector('svg')!.getBoundingClientRect();
                    return { width: svg.width, height: svg.height, availableWidth: viewport.clientWidth, availableHeight: viewport.clientHeight, left: viewport.scrollLeft, top: viewport.scrollTop };
                });
                expect(bounds.width).toBeLessThanOrEqual(bounds.availableWidth + 1);
                expect(bounds.height).toBeLessThanOrEqual(bounds.availableHeight + 1);
                expect(bounds.left).toBe(0);
                expect(bounds.top).toBe(0);
            }
            await page.evaluate(() => (window as any).testView.destroy());
        } finally { await page.close(); }
    });
});
