import { renderJsonCanvasArtifactSvg } from '../rendering/preview/canvasPreview';

describe('json canvas preview renderer', () => {
    test('renders json-canvas nodes and edges into svg markup', async () => {
        const svg = await renderJsonCanvasArtifactSvg({
            target: 'json-canvas',
            content: JSON.stringify({
                nodes: [
                    { id: 'root', type: 'text', text: 'Root', x: 0, y: 0, width: 220, height: 90 },
                    { id: 'child', type: 'text', text: 'Child', x: 320, y: 140, width: 220, height: 90 }
                ],
                edges: [
                    {
                        id: 'edge-1',
                        fromNode: 'root',
                        fromSide: 'right',
                        toNode: 'child',
                        toSide: 'left',
                        toEnd: 'arrow',
                        label: 'relates to'
                    }
                ]
            }),
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        });

        expect(svg).toContain('<svg');
        expect(svg).toContain('Root');
        expect(svg).toContain('Child');
        expect(svg).toContain('relates to');
        expect(svg).toContain('marker-end');
    });

    test('rejects non-canvas artifacts', async () => {
        await expect(renderJsonCanvasArtifactSvg({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).rejects.toThrow(/json-canvas/i);
    });

    test('surfaces invalid canvas json as an explicit preview error', async () => {
        await expect(renderJsonCanvasArtifactSvg({
            target: 'json-canvas',
            content: '{invalid-json}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).rejects.toThrow(/Invalid JSON Canvas artifact JSON/i);
    });
});
