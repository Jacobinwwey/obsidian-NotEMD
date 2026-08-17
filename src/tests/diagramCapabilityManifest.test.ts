import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import {
    DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION,
    getDiagramCapabilityManifest
} from '../diagram/diagramCapabilityManifest';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';
import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { getExecutableDiagramExamples } from '../diagram/examples/diagramExampleCatalog';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';
import { DrawioRenderer } from '../rendering/renderers/drawioRenderer';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { CircuitikzRenderer } from '../rendering/renderers/circuitikzRenderer';
import type { DiagramRenderer } from '../rendering/types';

describe('diagram capability manifest', () => {
    test('is versioned and covers every shipped type from the executable catalog', () => {
        const manifest = getDiagramCapabilityManifest();

        expect(manifest.schemaVersion).toBe(DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION);
        expect(manifest.shippedTypes).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        expect(manifest.shippedTypes.map(type => type.id).sort()).toEqual(
            EXECUTABLE_DIAGRAM_TYPES.map(type => type.id).sort()
        );
        expect(manifest.shippedTypes.every(type => type.lifecycle === 'shipped')).toBe(true);
    });

    test('keeps target compatibility and fixture ownership executable', () => {
        const manifest = getDiagramCapabilityManifest();

        for (const type of manifest.shippedTypes) {
            expect(type.compatibleTargets).toContain(type.defaultTarget);
            expect(type.compatibleTargets.map(target => getRenderTargetDescriptor(target).target))
                .toEqual(type.compatibleTargets);
            expect(type.fixtureId).toBe(
                EXECUTABLE_DIAGRAM_TYPES.find(candidate => candidate.id === type.id)?.exampleFixtureId
            );
        }
    });

    test('does not advertise Mermaid for data charts without a Mermaid renderer contract', () => {
        const dataChart = EXECUTABLE_DIAGRAM_TYPES.find(type => type.intent === 'dataChart');

        expect(dataChart?.compatibleTargets).not.toContain('mermaid');
        expect(new MermaidRenderer().supports({
            intent: 'dataChart',
            title: 'Revenue trend',
            nodes: [],
            dataSeries: []
        })).toBe(false);
    });

    test('proves every advertised target against its production fixture renderer contract', () => {
        const renderers = new Map<string, DiagramRenderer>([
            ['mermaid', new MermaidRenderer()],
            ['json-canvas', new JsonCanvasRenderer()],
            ['vega-lite', new VegaLiteRenderer()],
            ['html', new HtmlRenderer()],
            ['editable-html-svg', new EditableHtmlSvgRenderer()],
            ['drawio', new DrawioRenderer()],
            ['drawnix', new DrawnixRenderer()],
            ['circuitikz', new CircuitikzRenderer()]
        ]);
        const examples = getExecutableDiagramExamples();

        for (const type of EXECUTABLE_DIAGRAM_TYPES) {
            const example = examples.find(candidate => candidate.typeId === type.id);
            expect(example).toBeDefined();
            for (const target of type.compatibleTargets) {
                const renderer = renderers.get(target);
                expect(renderer).toBeDefined();
                expect(renderer?.supports(example!.spec)).toBe(true);
            }
        }
    });

    test('keeps diagram-design layouts reference-only and out of the runtime selector', () => {
        const manifest = getDiagramCapabilityManifest();

        expect(manifest.referenceOnlyLayouts).toHaveLength(24);
        expect(manifest.referenceOnlyLayouts.every(layout => layout.lifecycle === 'reference-only')).toBe(true);
        expect(manifest.referenceOnlyLayouts.some(layout => layout.id === 'diagram-design:radar')).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.map(type => type.id)).toEqual(expect.arrayContaining([
            'timeline',
            'swimlane',
            'quadrant'
        ]));
        expect(manifest.shippedTypes
            .filter(type => ['timeline', 'swimlane', 'quadrant'].includes(type.id))
            .every(type => type.defaultTarget === 'mermaid'
                && type.compatibleTargets.length === 1
                && type.compatibleTargets[0] === 'mermaid')).toBe(true);
    });
});
