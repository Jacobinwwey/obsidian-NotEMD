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

        expect(resolveBundledRenderHostRuntimeModuleSpecifier()).toBe(
            'app://local/.obsidian/plugins/notemd/render-host.mjs'
        );
    });

    test('returns null when no dedicated runtime module specifier is configured on the current single-bundle lane', () => {
        expect(resolveBundledRenderHostRuntimeModuleSpecifier()).toBeNull();
    });
});
