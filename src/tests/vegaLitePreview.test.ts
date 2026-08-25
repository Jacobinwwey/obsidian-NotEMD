import { renderVegaLiteArtifactSvg } from '../rendering/preview/vegaLitePreview';

describe('vega-lite preview renderer', () => {
    test('compiles a vega-lite artifact into svg using loaded runtime deps', async () => {
        const compile = jest.fn().mockReturnValue({ spec: { marks: [] } });
        const parse = jest.fn().mockReturnValue({ runtime: true });
        const finalize = jest.fn();
        const toSVG = jest.fn().mockResolvedValue('<svg viewBox="0 0 100 100"><rect /></svg>');
        const createView = jest.fn().mockReturnValue({ toSVG, finalize });

        const svg = await renderVegaLiteArtifactSvg({
            target: 'vega-lite',
            content: '{"mark":"bar","data":{"values":[{"x":"Week 1","y":12}]}}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }, async () => ({
            compile,
            parse,
            createView
        }));

        expect(compile).toHaveBeenCalledWith(expect.objectContaining({ mark: 'bar' }));
        expect(parse).toHaveBeenCalledWith({ marks: [] });
        expect(createView).toHaveBeenCalledWith({ runtime: true });
        expect(toSVG).toHaveBeenCalledTimes(1);
        expect(finalize).toHaveBeenCalledTimes(1);
        expect(svg).toContain('<svg viewBox="0 0 100 100"');
        expect(svg).toContain('data-layout-safety="notemd-layout-safety@1.0.0"');
    });

    test('rejects non-vega-lite artifacts', async () => {
        await expect(renderVegaLiteArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nmindmap\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        })).rejects.toThrow(/vega-lite/i);
    });

    test('surfaces invalid artifact json as an explicit preview error', async () => {
        await expect(renderVegaLiteArtifactSvg({
            target: 'vega-lite',
            content: '{invalid-json}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).rejects.toThrow(/Invalid Vega-Lite artifact JSON/i);
    });
});
