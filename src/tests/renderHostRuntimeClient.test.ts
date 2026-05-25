import {
    configureBundledRenderHostRuntimeModuleSpecifier,
    resolveBundledRenderHostRuntimeModuleSpecifier
} from '../rendering/preview/renderHostRuntimeClient';

describe('render host runtime client', () => {
    afterEach(() => {
        configureBundledRenderHostRuntimeModuleSpecifier(null);
    });

    test('prefers an explicitly configured runtime module specifier over the fallback relative path', () => {
        configureBundledRenderHostRuntimeModuleSpecifier('app://local/.obsidian/plugins/notemd/render-host.mjs');

        expect(resolveBundledRenderHostRuntimeModuleSpecifier('/tmp/plugin/dist')).toBe(
            'app://local/.obsidian/plugins/notemd/render-host.mjs'
        );
    });

    test('falls back to a relative file URL when no runtime module specifier is configured', () => {
        const specifier = resolveBundledRenderHostRuntimeModuleSpecifier('/tmp/plugin/dist');

        expect(specifier).toBe('file:///render-host.mjs');
    });
});
