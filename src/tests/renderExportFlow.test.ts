import { renderPreviewArtifactSvg } from '../rendering/preview/previewExport';

describe('render export flow', () => {
    test('renders dark json-canvas previews with dark surface colors', async () => {
        const svg = await renderPreviewArtifactSvg({
            target: 'json-canvas',
            content: JSON.stringify({
                nodes: [
                    { id: 'root', type: 'text', text: 'Root', x: 0, y: 0, width: 220, height: 90 }
                ],
                edges: []
            }),
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, {
            theme: 'dark'
        } as any);

        expect(svg).toContain('#0f172a');
        expect(svg).not.toContain('#f8fafc');
    });

    test('forwards dark theme config into vega-lite preview compilation', async () => {
        const compile = jest.fn().mockReturnValue({ spec: { marks: [] } });
        const parse = jest.fn().mockReturnValue({ runtime: true });
        const finalize = jest.fn();
        const toSVG = jest.fn().mockResolvedValue('<svg><rect /></svg>');
        const createView = jest.fn().mockReturnValue({ toSVG, finalize });

        await renderPreviewArtifactSvg({
            target: 'vega-lite',
            content: '{"mark":"bar","data":{"values":[{"x":"Week 1","y":12}]}}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }, {
            theme: 'dark',
            vegaLiteDepsLoader: async () => ({
                compile,
                parse,
                createView
            })
        } as any);

        expect(compile).toHaveBeenCalledWith(expect.objectContaining({
            background: '#0f172a',
            config: expect.objectContaining({
                axis: expect.objectContaining({
                    labelColor: '#e2e8f0'
                })
            })
        }));
    });
});
