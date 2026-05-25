import { loadBundledMermaidPreviewDeps } from '../rendering/preview/mermaidRuntime';

describe('mermaid runtime loader', () => {
    test('loads default preview deps directly from the mermaid package runtime', async () => {
        const initialize = jest.fn();
        const parse = jest.fn();
        const render = jest.fn();
        const loadModule = jest.fn().mockResolvedValue({
            default: {
                initialize,
                parse,
                render
            }
        });

        const deps = await loadBundledMermaidPreviewDeps(loadModule as any);

        expect(loadModule).toHaveBeenCalledWith('mermaid');
        expect(deps).toEqual({
            initialize,
            parse,
            render
        });
    });

    test('accepts direct mermaid module exports without a default wrapper', async () => {
        const initialize = jest.fn();
        const parse = jest.fn();
        const render = jest.fn();
        const deps = await loadBundledMermaidPreviewDeps(jest.fn().mockResolvedValue({
            initialize,
            parse,
            render
        }) as any);

        expect(deps).toEqual({
            initialize,
            parse,
            render
        });
    });
});
