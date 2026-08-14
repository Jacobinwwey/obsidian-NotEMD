import { Browser, chromium } from 'playwright';
import {
    buildDrawnixKnowledgeMapPresentation,
    DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
} from '../diagram/adapters/drawnix/drawnixKnowledgeMapPresentation';
import { DiagramSpec } from '../diagram/types';
import { renderDrawnixKnowledgeMapPresentationSvg } from '../rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer';

function createCrossingOverviewSpec(): DiagramSpec {
    return {
        intent: 'drawnixMindmap',
        title: 'Cross-root delivery overview',
        nodes: [
            { id: 'ingest', label: 'Ingest' },
            { id: 'semantic', label: 'Semantic model' },
            { id: 'projection', label: 'Projection' },
            { id: 'delivery', label: 'Delivery' },
            { id: 'review', label: 'Review' }
        ],
        edges: [
            { from: 'ingest', to: 'delivery', label: 'drives delivery' },
            { from: 'semantic', to: 'review', label: 'supports review' }
        ]
    };
}

describe('Drawnix knowledge-map presentation SVG', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    afterAll(async () => {
        await browser?.close();
    });

    test('routes overview cross-root relations outside unrelated root nodes', async () => {
        const presentation = buildDrawnixKnowledgeMapPresentation(
            createCrossingOverviewSpec(),
            DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
        );
        const svg = renderDrawnixKnowledgeMapPresentationSvg(presentation.overview);
        const page = await browser.newPage();

        try {
            await page.setContent(`<!doctype html><html><body>${svg}</body></html>`);
            await page.evaluate(() => document.fonts.ready);
            const report = await page.evaluate(() => {
                const relation = document.querySelector(
                    '[data-drawnix-knowledge-map-relation-id="relation-1-ingest-to-delivery"] path'
                ) as SVGGeometryElement | null;
                const label = document.querySelector(
                    '[data-drawnix-knowledge-map-relation-id="relation-1-ingest-to-delivery"] text'
                ) as SVGGraphicsElement | null;
                if (!relation || !label) {
                    throw new Error('Cross-root relation did not render.');
                }

                const unrelatedNodes = ['semantic', 'projection', 'review'].map(id => {
                    const rectangle = document.querySelector(
                        `[data-drawnix-knowledge-map-node-id="${id}"] rect`
                    ) as SVGGraphicsElement | null;
                    if (!rectangle) {
                        throw new Error(`Overview node "${id}" did not render.`);
                    }
                    return rectangle.getBBox();
                });
                const length = relation.getTotalLength();

                const pathIntersections = Array.from({ length: 101 }, (_, index) => relation.getPointAtLength(length * index / 100))
                    .filter(point => unrelatedNodes.some(bounds => (
                        point.x > bounds.x + 0.5
                        && point.x < bounds.x + bounds.width - 0.5
                        && point.y > bounds.y + 0.5
                        && point.y < bounds.y + bounds.height - 0.5
                    ))).length;
                const labelBounds = label.getBBox();
                const labelIntersections = unrelatedNodes.filter(bounds => (
                    labelBounds.x < bounds.x + bounds.width
                    && labelBounds.x + labelBounds.width > bounds.x
                    && labelBounds.y < bounds.y + bounds.height
                    && labelBounds.y + labelBounds.height > bounds.y
                )).length;

                return { pathIntersections, labelIntersections };
            });

            expect(report.pathIntersections).toBe(0);
            expect(report.labelIntersections).toBe(0);
        } finally {
            await page.close();
        }
    });
});
