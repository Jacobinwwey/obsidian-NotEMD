import { loadBundledMermaidPreviewDeps } from '../rendering/preview/mermaidRuntime';

describe('mermaid runtime loader', () => {
    test('loads default preview deps from the dedicated render-host runtime module', async () => {
        const initialize = jest.fn();
        const parse = jest.fn();
        const render = jest.fn();
        const loadModule = jest.fn().mockResolvedValue({
            loadBundledMermaidPreviewDeps: () => ({
                initialize,
                parse,
                render
            })
        });

        const deps = await loadBundledMermaidPreviewDeps(loadModule as any, 'file:///tmp/render-host.mjs');

        expect(loadModule).toHaveBeenCalledWith('file:///tmp/render-host.mjs');
        expect(deps).toEqual({
            initialize,
            parse,
            render
        });
    });

    test('falls back to the package runtime in Jest when the dedicated render-host module is unavailable', async () => {
        const deps = await loadBundledMermaidPreviewDeps(
            undefined,
            'file:///tmp/notemd-missing-render-host.mjs'
        );

        expect(typeof deps.initialize).toBe('function');
        expect(typeof deps.parse).toBe('function');
        expect(typeof deps.render).toBe('function');
    });
});
