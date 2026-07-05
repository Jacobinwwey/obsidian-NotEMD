import { chromium } from 'playwright';
import { DiagramSpec } from '../diagram/types';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';

const PREVIEW_VIEWPORTS = [
    { name: 'desktop', width: 1280, height: 820 },
    { name: 'mobile', width: 390, height: 844 }
];

interface EditableHtmlSvgPreviewMetrics {
    nodeCount: number;
    edgeCount: number;
    textOutOfBounds: string[];
    sheetWidth: number;
    sheetClientWidth: number;
    sheetScrollWidth: number;
    svgWidth: number;
    viewportWidth: number;
    nonBlankPixels: number;
}

function createPreviewSpec(): DiagramSpec {
    return {
        intent: 'flowchart',
        title: 'Runtime Mechanism Preview',
        summary: 'Client requests cross the gateway and worker boundary.',
        nodes: [
            { id: 'client', label: 'Client Application', kind: 'actor' },
            { id: 'gateway', label: 'API Gateway', kind: 'boundary' },
            { id: 'worker', label: 'Background Worker', kind: 'processor' },
            { id: 'store', label: 'Durable Store', kind: 'state' }
        ],
        edges: [
            { from: 'client', to: 'gateway', label: 'request' },
            { from: 'gateway', to: 'worker', label: 'job' },
            { from: 'worker', to: 'store', label: 'commit' }
        ]
    };
}

describe('editable html/svg browser preview', () => {
    test('renders nonblank framed SVG with node text contained across desktop and mobile viewports', async () => {
        const renderer = new EditableHtmlSvgRenderer();
        const artifact = await renderer.render(createPreviewSpec());
        const browser = await chromium.launch({ headless: true });

        try {
            for (const viewport of PREVIEW_VIEWPORTS) {
                const page = await browser.newPage({ viewport });
                await page.setContent(artifact.content);
                await page.waitForSelector('svg[data-notemd-renderer]');

                const metrics = await page.evaluate(`(async () => {
                    async function countNonBlankSvgPixels() {
                        const svg = document.querySelector('svg');
                        if (!svg) {
                            return 0;
                        }

                        const xml = new XMLSerializer().serializeToString(svg);
                        const image = new Image();
                        const loaded = new Promise((resolve, reject) => {
                            image.onload = () => resolve();
                            image.onerror = () => reject(new Error('Unable to rasterize SVG preview.'));
                        });
                        image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
                        await loaded;

                        const canvas = document.createElement('canvas');
                        canvas.width = 320;
                        canvas.height = 220;
                        const context = canvas.getContext('2d');
                        if (!context) {
                            return 0;
                        }

                        context.drawImage(image, 0, 0, canvas.width, canvas.height);
                        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                        let nonBlank = 0;

                        for (let index = 0; index < pixels.length; index += 4) {
                            const red = pixels[index];
                            const green = pixels[index + 1];
                            const blue = pixels[index + 2];
                            const alpha = pixels[index + 3];
                            if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
                                nonBlank += 1;
                            }
                        }

                        return nonBlank;
                    }

                    const sheet = document.querySelector('.notemd-editable-svg-sheet');
                    const svg = document.querySelector('svg[data-notemd-renderer]');
                    const nodeGroups = Array.from(document.querySelectorAll('g[data-drawio-type="node"]'));
                    const edgeGroups = Array.from(document.querySelectorAll('g[data-drawio-type="edge"]'));
                    const textOutOfBounds = nodeGroups.flatMap((group) => {
                        const rect = group.querySelector('rect');
                        const textBoxes = Array.from(group.querySelectorAll('text')).map((text) => text.getBBox());
                        if (!rect) {
                            return [group.id + ':missing-rect'];
                        }
                        const nodeBox = rect.getBBox();
                        return textBoxes
                            .filter((box) => box.x < nodeBox.x - 2
                                || box.y < nodeBox.y - 2
                                || box.x + box.width > nodeBox.x + nodeBox.width + 2
                                || box.y + box.height > nodeBox.y + nodeBox.height + 2)
                            .map(() => group.id + ':text-out-of-bounds');
                    });
                    const sheetRect = sheet?.getBoundingClientRect();
                    const svgRect = svg?.getBoundingClientRect();

                    return {
                        nodeCount: nodeGroups.length,
                        edgeCount: edgeGroups.length,
                        textOutOfBounds,
                        sheetWidth: sheetRect?.width ?? 0,
                        sheetClientWidth: sheet?.clientWidth ?? 0,
                        sheetScrollWidth: sheet?.scrollWidth ?? 0,
                        svgWidth: svgRect?.width ?? 0,
                        viewportWidth: window.innerWidth,
                        nonBlankPixels: await countNonBlankSvgPixels()
                    };
                })()`) as EditableHtmlSvgPreviewMetrics;

                expect(metrics.nodeCount).toBe(4);
                expect(metrics.edgeCount).toBe(3);
                expect(metrics.textOutOfBounds).toEqual([]);
                expect(metrics.sheetWidth).toBeLessThanOrEqual(viewport.width);
                expect(metrics.svgWidth).toBeGreaterThan(0);
                expect(metrics.nonBlankPixels).toBeGreaterThan(500);
                if (viewport.name === 'mobile') {
                    expect(metrics.sheetScrollWidth).toBeGreaterThan(metrics.sheetClientWidth);
                }

                await page.close();
            }
        } finally {
            await browser.close();
        }
    }, 30000);
});
