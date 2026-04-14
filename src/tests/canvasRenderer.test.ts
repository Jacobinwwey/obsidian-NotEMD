import { DiagramSpec } from '../diagram/types';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';

describe('json canvas renderer', () => {
    test('supports canvasMap and returns json-canvas artifact', async () => {
        const renderer = new JsonCanvasRenderer();
        const spec: DiagramSpec = {
            intent: 'canvasMap',
            title: 'Knowledge Map',
            nodes: [{ id: 'root', label: 'Root' }]
        };

        expect(renderer.supports(spec)).toBe(true);

        const artifact = await renderer.render(spec);

        expect(artifact.target).toBe('json-canvas');
        expect(artifact.mimeType).toBe('application/json');
        expect(artifact.content).toContain('"nodes"');
    });
});
