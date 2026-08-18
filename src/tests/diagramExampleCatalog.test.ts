import {
    getExecutableDiagramExamples,
    renderExecutableDiagramExample
} from '../diagram/examples/diagramExampleCatalog';
import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import { CircuitikzRenderer } from '../rendering/renderers/circuitikzRenderer';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import * as diagramGenerationService from '../diagram/diagramGenerationService';

function createExampleRendererService(): RendererService {
    return new RendererService(new RendererRegistry([
        new MermaidRenderer(),
        new JsonCanvasRenderer(),
        new VegaLiteRenderer(),
        new DrawnixRenderer(),
        new CircuitikzRenderer()
    ]));
}

describe('executable diagram example catalog', () => {
    test('covers every executable type with an owned fixture and selection rationale', () => {
        const examples = getExecutableDiagramExamples();

        expect(examples.map(example => example.typeId).sort()).toEqual(
            EXECUTABLE_DIAGRAM_TYPES.map(type => type.id).sort()
        );
        expect(examples.every(example => example.fixtureId.trim().length > 0)).toBe(true);
        expect(examples.every(example => example.selectionRationale.trim().length > 0)).toBe(true);
        expect(examples.map(example => example.typeId)).toEqual(expect.arrayContaining([
            'timeline',
            'swimlane',
            'quadrant',
            'radar-chart',
            'org-chart'
        ]));
    });

    test('renders every catalog fixture through its production renderer binding', async () => {
        const rendererService = createExampleRendererService();
        const rendered = await Promise.all(getExecutableDiagramExamples().map(example => (
            renderExecutableDiagramExample(example, rendererService)
        )));

        expect(rendered).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        rendered.forEach((artifact, index) => {
            expect(artifact.sourceIntent).toBe(getExecutableDiagramExamples()[index].sourceIntent);
            expect(artifact.content.trim()).not.toBe('');
        });
    });

    test('exposes the production renderer registry for renderer-backed example previews', async () => {
        const createDefaultRendererService = (diagramGenerationService as unknown as {
            createDefaultDiagramRendererService?: () => RendererService;
        }).createDefaultDiagramRendererService;

        expect(createDefaultRendererService).toBeDefined();

        const drawnixExample = getExecutableDiagramExamples().find(example => (
            example.typeId === 'drawnix-knowledge-map'
        ));
        expect(drawnixExample).toBeDefined();

        const artifact = await renderExecutableDiagramExample(
            drawnixExample!,
            createDefaultRendererService!()
        );

        expect(artifact.target).toBe('drawnix');
        expect(artifact.content.trim()).not.toBe('');
    });

    test('uses a filename-rooted Drawnix example without obsolete delivery metadata', async () => {
        const rendererService = createExampleRendererService();
        const example = getExecutableDiagramExamples().find(candidate => (
            candidate.typeId === 'drawnix-knowledge-map'
        ));

        const artifact = await renderExecutableDiagramExample(example!, rendererService);
        const data = JSON.parse(artifact.content) as {
            elements: Array<{
                type: string;
                data?: { topic?: { children?: Array<{ text?: string }> } };
            }>;
            metadata?: { notemd?: { knowledgeMap?: unknown } };
        };
        const roots = data.elements.filter(element => element.type === 'mindmap');

        expect(roots).toHaveLength(1);
        expect(roots[0].data?.topic?.children?.[0]?.text).toBe('architecture.zh-CN');
        expect(data.metadata?.notemd?.knowledgeMap).toBeUndefined();
    });
});
