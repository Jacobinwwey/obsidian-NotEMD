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

    test('keeps labelled dashed relations readable above nodes in the browser', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Relation label layering',
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [
                    { id: 'registry', label: 'RendererRegistry' },
                    { id: 'output', label: 'Output' }
                ]
            }],
            edges: [{
                from: 'registry',
                to: 'output',
                label: 'RendererRegistry feeds Vault files, preview modal, and export'
            }]
        };
        const svg = renderDrawnixMindMapSvg(buildDrawnixMindMapProjection(spec));
        const page = await browser.newPage();

        try {
            await page.setContent(`<!doctype html><html><body>${svg}</body></html>`);
            await page.evaluate(() => document.fonts.ready);
            const report = await page.evaluate(() => {
                const labelBackground = document.querySelector('[data-drawnix-mindmap-relation-label-background]') as SVGGraphicsElement | null;
                const label = document.querySelector('[data-drawnix-mindmap-relation-label]') as SVGGraphicsElement | null;
                const nodeRectangles = Array.from(document.querySelectorAll('[data-drawnix-mindmap-node-id] > rect')) as SVGGraphicsElement[];
                if (!labelBackground || !label || nodeRectangles.length === 0) {
                    throw new Error('Relation label or node rectangles did not render.');
                }
                const backgroundBounds = labelBackground.getBBox();
                const labelBounds = label.getBBox();
                const overlapsNode = nodeRectangles.some(node => {
                    const bounds = node.getBBox();
                    return backgroundBounds.x < bounds.x + bounds.width
                        && backgroundBounds.x + backgroundBounds.width > bounds.x
                        && backgroundBounds.y < bounds.y + bounds.height
                        && backgroundBounds.y + backgroundBounds.height > bounds.y;
                });
                const textInsideBackground = labelBounds.x >= backgroundBounds.x
                    && labelBounds.x + labelBounds.width <= backgroundBounds.x + backgroundBounds.width
                    && labelBounds.y >= backgroundBounds.y
                    && labelBounds.y + labelBounds.height <= backgroundBounds.y + backgroundBounds.height;
                return { overlapsNode, textInsideBackground, lineCount: label.querySelectorAll('tspan').length };
            });

            expect(report.overlapsNode).toBe(false);
            expect(report.textInsideBackground).toBe(true);
            expect(report.lineCount).toBeGreaterThan(1);
        } finally {
            await page.close();
        }
    });

    test('keeps a wrapped summary above every dashed relation segment in the browser', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Notemd Architecture',
            summary: '以 Notemd 插件为对象的知识地图，覆盖系统架构、LLM 调用管道、图表渲染平台、模块地图、CLI 边界现实、关键设计决策与验证。',
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [
                    { id: 'registry', label: 'RendererRegistry' },
                    { id: 'output', label: 'Output' }
                ]
            }],
            edges: [{
                from: 'registry',
                to: 'output',
                label: 'RendererRegistry feeds Vault files, preview modal, and export'
            }]
        };
        const svg = renderDrawnixMindMapSvg(buildDrawnixMindMapProjection(spec));
        const page = await browser.newPage();

        try {
            await page.setContent(`<!doctype html><html><body>${svg}</body></html>`);
            await page.evaluate(() => document.fonts.ready);
            const report = await page.evaluate(() => {
                const headerRect = document.querySelector('[data-drawnix-mindmap-header-safe-height]') as SVGGraphicsElement | null;
                const summary = document.querySelector('[data-drawnix-mindmap-summary-line]')?.parentElement as SVGGraphicsElement | null;
                const relationPaths = Array.from(document.querySelectorAll('[data-drawnix-mindmap-relation-layer="path"] path')) as SVGGeometryElement[];
                if (!headerRect || !summary || relationPaths.length === 0) {
                    throw new Error('Dynamic header or relation path did not render.');
                }
                const safeHeight = Number(headerRect.getAttribute('data-drawnix-mindmap-header-safe-height'));
                const summaryBounds = summary.getBBox();
                const relationSamplesStayBelowHeader = relationPaths.every(path => {
                    const length = path.getTotalLength();
                    const samples = Array.from({ length: 17 }, (_, index) => path.getPointAtLength(length * index / 16));
                    return samples.every(point => point.y >= safeHeight - 0.5);
                });
                return {
                    safeHeight,
                    summaryLines: summary.querySelectorAll('tspan').length,
                    summaryBottom: summaryBounds.y + summaryBounds.height,
                    relationSamplesStayBelowHeader
                };
            });

            expect(report.summaryLines).toBeGreaterThan(1);
            expect(report.summaryBottom).toBeLessThanOrEqual(report.safeHeight);
            expect(report.relationSamplesStayBelowHeader).toBe(true);
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
