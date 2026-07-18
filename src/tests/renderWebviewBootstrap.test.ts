import { ensureRenderHostBridge, RENDER_HOST_BRIDGE_GLOBAL } from '../rendering/webview/bootstrap';
import * as mermaidPreview from '../rendering/preview/mermaidPreview';
import * as vegaLitePreview from '../rendering/preview/vegaLitePreview';

jest.mock('mermaid', () => {
    const runtime = {
        initialize: jest.fn(),
        parse: jest.fn().mockResolvedValue(true),
        render: jest.fn().mockResolvedValue({ svg: '<svg />' })
    };
    return { __esModule: true, default: runtime, ...runtime };
});

jest.mock('vega-lite', () => ({
    compile: jest.fn(() => ({ spec: { marks: [] } }))
}));

jest.mock('vega', () => ({
    parse: jest.fn(() => ({ runtime: true })),
    View: class {}
}));

jest.mock('../rendering/preview/mermaidPreview', () => ({
    renderMermaidArtifactSvg: jest.fn().mockResolvedValue('<svg data-renderer="mermaid" />')
}));

jest.mock('../rendering/preview/vegaLitePreview', () => ({
    renderVegaLiteArtifactSvg: jest.fn().mockResolvedValue('<svg data-renderer="vega-lite" />')
}));

describe('render webview bridge', () => {
    test('replaces a bridge retained from a previous plugin reload', () => {
        const staleBridge = {
            renderMermaidToSvg: jest.fn(),
            renderVegaLiteToSvg: jest.fn()
        };
        const root = { [RENDER_HOST_BRIDGE_GLOBAL]: staleBridge } as any;

        const currentBridge = ensureRenderHostBridge(root);

        expect(currentBridge).not.toBe(staleBridge);
        expect(root[RENDER_HOST_BRIDGE_GLOBAL]).toBe(currentBridge);
    });

    test('injects bundled preview dependencies instead of loading bare packages at runtime', async () => {
        const root = {} as any;
        const bridge = ensureRenderHostBridge(root);

        await bridge.renderMermaidToSvg('flowchart TD\nA --> B', 'dark', 'flowchart');
        await bridge.renderVegaLiteToSvg('{"mark":"bar"}', 'dark', 'dataChart');

        expect(root[RENDER_HOST_BRIDGE_GLOBAL]).toBe(bridge);
        expect(mermaidPreview.renderMermaidArtifactSvg).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({
                initialize: expect.any(Function),
                parse: expect.any(Function),
                render: expect.any(Function)
            }),
            'dark'
        );
        expect(vegaLitePreview.renderVegaLiteArtifactSvg).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'vega-lite' }),
            expect.any(Function),
            'dark'
        );
    });
});
