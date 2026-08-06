import { Browser, chromium } from 'playwright';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DiagramSpec } from '../diagram/types';
import { renderDrawnixMindMapSvg } from '../rendering/renderers/drawnixMindMapSvgRenderer';

describe('Drawnix mind-map browser layout', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    afterAll(async () => {
        await browser?.close();
    });

    test('keeps wide Latin glyphs inside their node rectangle', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Wide glyph layout',
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [{ id: 'wide-label', label: 'W'.repeat(32) }]
            }],
            edges: []
        };
        const svg = renderDrawnixMindMapSvg(buildDrawnixMindMapProjection(spec));
        const page = await browser.newPage();

        try {
            await page.setContent(`<!doctype html><html><body>${svg}</body></html>`);
            await page.evaluate(() => document.fonts.ready);
            const overflow = await page.evaluate(() => {
                const node = document.querySelector('[data-drawnix-mindmap-node-id="wide-label"]');
                const rectangle = node?.querySelector(':scope > rect') as SVGGraphicsElement | null;
                const label = node?.querySelector(':scope > text') as SVGGraphicsElement | null;
                if (!rectangle || !label) {
                    throw new Error('Wide-label Drawnix node did not render.');
                }
                const rectangleBounds = rectangle.getBBox();
                const labelBounds = label.getBBox();
                return Math.max(
                    rectangleBounds.x - labelBounds.x,
                    labelBounds.x + labelBounds.width - rectangleBounds.x - rectangleBounds.width,
                    0
                );
            });

            expect(overflow).toBeLessThanOrEqual(0.5);
        } finally {
            await page.close();
        }
    });

    test('keeps normalized inline font styles valid in strict SVG XML', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Inline font style',
            nodes: [{ id: 'root', label: 'Root' }],
            edges: []
        };
        const svg = renderDrawnixMindMapSvg(buildDrawnixMindMapProjection(spec), [{
            id: 'source-visual-inline-style',
            kind: 'mermaid',
            title: 'Inline style',
            lineStart: 1,
            lineEnd: 1,
            svg: '<svg><text style="font-family: Trebuchet MS; fill: red">Node</text></svg>'
        }]);
        const page = await browser.newPage();

        try {
            const parsed = await page.evaluate(markup => {
                const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
                return {
                    parserErrors: document.querySelectorAll('parsererror').length,
                    inlineStyle: document.querySelector('text[style]')?.getAttribute('style')
                };
            }, svg);

            expect(parsed.parserErrors).toBe(0);
            expect(parsed.inlineStyle).toContain('font-family: "NotoSansSC", "Segoe UI", Arial, sans-serif');
        } finally {
            await page.close();
        }
    });
});
