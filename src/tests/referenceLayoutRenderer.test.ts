import { getExecutableDiagramExamples } from '../diagram/examples/diagramExampleCatalog';
import { getExecutableDiagramType } from '../diagram/diagramTypeCatalog';
import { validateDiagramSpec } from '../diagram/spec';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
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
});
