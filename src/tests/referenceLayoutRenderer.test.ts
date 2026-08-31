import { getExecutableDiagramExamples } from '../diagram/examples/diagramExampleCatalog';
import { getExecutableDiagramType } from '../diagram/diagramTypeCatalog';
import { validateDiagramSpec } from '../diagram/spec';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
import { buildSemanticFigureModel } from '../diagram/adapters/editableSvg/semanticFigureModel';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';

const NEW_REFERENCE_TYPE_IDS = [
    'bar-chart', 'line-chart', 'scatter-plot', 'architecture', 'current-state',
    'integration-topology', 'data-flow', 'access-matrix', 'gantt', 'layer-stack',
    'venn', 'ranked-funnel', 'loop', 'nested', 'tree', 'process', 'medallion', 'high-level'
] as const;

describe('diagram-design-inspired production layouts', () => {
    test('owns a production fixture and target contract for every new type', () => {
        const examples = getExecutableDiagramExamples();
        for (const typeId of NEW_REFERENCE_TYPE_IDS) {
            const type = getExecutableDiagramType(typeId);
            const example = examples.find(candidate => candidate.typeId === typeId);
            expect(example).toBeDefined();
            expect(type.defaultTarget).toBe(typeId.endsWith('chart') || typeId === 'scatter-plot' ? 'vega-lite' : 'editable-html-svg');
            expect(example?.spec.schemaVersion).toBe(2);
            expect(example?.spec.payload?.kind).toBe(type.payloadKind);
        }
    });

    test('renders every native layout as accessible deterministic SVG', async () => {
        const renderer = new EditableHtmlSvgRenderer();
        const examples = getExecutableDiagramExamples().filter(example => NEW_REFERENCE_TYPE_IDS.includes(example.typeId as typeof NEW_REFERENCE_TYPE_IDS[number]));
        for (const example of examples) {
            const first = await renderer.render(example.spec);
            const second = await renderer.render(example.spec);
            expect(first.previewSvg?.content).toContain('role="img"');
            expect(first.previewSvg?.content).toContain('<title');
            expect(first.previewSvg?.content).toContain('<desc');
            expect(first.previewSvg?.content).toBe(second.previewSvg?.content);
            expect(first.content).toContain('Content-Security-Policy');
        }
    });

    test('rejects invalid topology references and over-budget matrix payloads at the boundary', () => {
        const topology = getExecutableDiagramExamples().find(example => example.typeId === 'architecture')!.spec;
        const invalidTopology = {
            ...topology,
            payload: {
                ...(topology.payload as any),
                edges: [{ from: 'missing', to: 'also-missing' }]
            }
        };
        expect(validateDiagramSpec(invalidTopology).errors.join(' ')).toMatch(/missing node/i);

        const matrix = getExecutableDiagramExamples().find(example => example.typeId === 'access-matrix')!.spec;
        const invalidMatrix = {
            ...matrix,
            payload: {
                ...(matrix.payload as any),
                roles: Array.from({ length: 7 }, (_, index) => ({ id: `role-${index}`, label: `Role ${index}` }))
            }
        };
        expect(validateDiagramSpec(invalidMatrix).errors.join(' ')).toMatch(/2 to 6 roles/i);
    });

    test('fails closed for malformed canonical arrays instead of leaking a TypeError', () => {
        const topology = getExecutableDiagramExamples().find(example => example.typeId === 'architecture')!.spec;
        const malformed = {
            ...topology,
            payload: {
                kind: 'topology',
                zones: null,
                nodes: [],
                edges: []
            }
        } as any;

        expect(() => validateDiagramSpec(malformed)).not.toThrow();
        expect(validateDiagramSpec(malformed).errors.join(' ')).toMatch(/field "zones" must be an array/i);
    });

    test('rejects schedules whose end precedes their start', () => {
        const schedule = getExecutableDiagramExamples().find(example => example.typeId === 'gantt')!.spec;
        const malformed = {
            ...schedule,
            payload: {
                ...(schedule.payload as any),
                tasks: [{
                    ...(schedule.payload as any).tasks[0],
                    start: 8,
                    end: 3
                }]
            }
        };

        expect(validateDiagramSpec(malformed).errors.join(' ')).toMatch(/ends before it starts/i);
    });

    test('keeps reference layout geometry target-specific', () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'loop')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        expect(svg).toContain('data-notemd-renderer="notemd-reference-layouts@1.1.0"');
        expect(svg).toContain('marker-end="url(#notemd-reference-arrow)"');
        expect(svg).not.toContain('https://');
    });

    test('keeps access-matrix headers below the document summary', async () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'access-matrix')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        expect(svg).toMatch(/<text x="40" y="66"[^>]*class="ref-summary"/);
        expect(svg).toMatch(/id="reference-role-[^"]+"><rect x="250" y="78"/);
    });

    test('paints lane-grid surfaces before cross-lane edge labels', () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'data-flow')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        expect(svg.indexOf('id="reference-cell-engineer-transform"'))
            .toBeLessThan(svg.indexOf('id="reference-lane-edge-4"'));
    });

    test('keeps lane-grid header controls below a wrapped document summary', async () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'data-flow')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
            await page.setContent(`<div>${svg}</div>`);
            const overlaps = await page.evaluate(() => {
                const summary = document.querySelector('text.ref-summary');
                if (!summary) return ['missing summary'];
                const summaryRect = summary.getBoundingClientRect();
                const overlap = (first: DOMRect, second: DOMRect) => first.x < second.x + second.width
                    && first.x + first.width > second.x
                    && first.y < second.y + second.height
                    && first.y + first.height > second.y;
                return Array.from(document.querySelectorAll('[id^="reference-step-"] rect'))
                    .filter(rect => overlap(summaryRect, rect.getBoundingClientRect()))
                    .map(rect => rect.getAttribute('x') ?? 'unknown');
            });
            expect(overlaps).toEqual([]);
        } finally {
            await browser.close();
        }
    }, 15000);

    test('keeps lane-grid connector routes outside non-endpoint cells', async () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'data-flow')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
            await page.setContent(`<div>${svg}</div>`);
            const collisions = await page.evaluate(() => {
                const cells = Array.from(document.querySelectorAll('[id^="reference-cell-"]'))
                    .map(group => ({
                        id: group.id,
                        rect: (group.querySelector('rect') as SVGRectElement).getBBox()
                    }));
                const inside = (point: DOMPoint, rect: DOMRect, padding = 2) => point.x > rect.x + padding
                    && point.x < rect.x + rect.width - padding
                    && point.y > rect.y + padding
                    && point.y < rect.y + rect.height - padding;
                return Array.from(document.querySelectorAll('[id^="reference-lane-edge-path-"]')).flatMap(path => {
                    const source = path.getAttribute('data-drawio-source');
                    const target = path.getAttribute('data-drawio-target');
                    const length = (path as SVGPathElement).getTotalLength();
                    const points = Array.from({ length: 41 }, (_, index) => (path as SVGPathElement).getPointAtLength(length * (index + 1) / 42));
                    return points.flatMap(point => cells
                        .filter(cell => cell.id !== `reference-cell-${source}` && cell.id !== `reference-cell-${target}`)
                        .filter(cell => inside(point, cell.rect))
                        .map(cell => `${path.id}:${cell.id}`));
                });
            });
            expect(collisions).toEqual([]);
        } finally {
            await browser.close();
        }
    });

    test('paints nested scope surfaces before their labels', () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'nested')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        const firstLabel = svg.indexOf('id="reference-nested-org"');
        const firstSurface = svg.indexOf('class="ref-node"');
        expect(firstSurface).toBeGreaterThan(-1);
        expect(firstSurface).toBeLessThan(firstLabel);
    });

    test('keeps nested labels outside every later-painted scope surface', async () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'nested')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
            await page.setContent(`<div class="preview">${svg}</div>`);
            const diagnostics = await page.evaluate(() => {
                const root = document.querySelector('svg')!;
                const overlap = (first: DOMRect, second: DOMRect, padding = 1) => first.x - padding < second.x + second.width
                    && first.x + first.width + padding > second.x
                    && first.y - padding < second.y + second.height
                    && first.y + first.height + padding > second.y;
                const texts = Array.from(root.querySelectorAll('text')).filter(text => (text.textContent ?? '').trim());
                const shapes = Array.from(root.querySelectorAll('rect,circle,ellipse,polygon,image'))
                    .filter(shape => !shape.classList.contains('ref-canvas'));
                return texts.flatMap(text => shapes
                    .filter(shape => (text.compareDocumentPosition(shape) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
                    .filter(shape => overlap(text.getBoundingClientRect(), shape.getBoundingClientRect()))
                    .map(shape => `${text.textContent?.trim()}:${shape.tagName.toLowerCase()}`));
            });
            expect(diagnostics).toEqual([]);
        } finally {
            await browser.close();
        }
    });

    test('routes entity edge labels away from child node labels', () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'entity-relationship')!;
        const model = buildSemanticFigureModel(example.spec);
        expect(model.edges[0]?.labelY).toBeLessThan(model.nodes[0].y + model.nodes[0].height);
        expect(model.edges[0]?.labelY).toBeGreaterThan(model.nodes[0].y - 60);
    });

    test('keeps topology footer labels inside their background chip', async () => {
        const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === 'integration-topology')!;
        const svg = renderReferenceLayoutSvg(example.spec);
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage({ viewport: { width: 1120, height: 676 } });
            await page.setContent(`<div>${svg}</div>`);
            const diagnostics = await page.evaluate(() => {
                const footer = document.querySelector('#reference-footer-identity');
                const chip = footer?.querySelector('rect');
                if (!footer || !chip) return ['missing footer chip'];
                const chipRect = chip.getBoundingClientRect();
                return Array.from(footer.querySelectorAll('text')).map(text => {
                    const textRect = text.getBoundingClientRect();
                    return {
                        text: text.textContent?.trim(),
                        textBottom: textRect.bottom,
                        chipBottom: chipRect.bottom
                    };
                }).filter(entry => entry.textBottom > entry.chipBottom + 0.5);
            });
            expect(diagnostics).toEqual([]);
        } finally {
            await browser.close();
        }
    });
});
