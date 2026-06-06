const bundleConfig = require('../../scripts/lib/esbuild-bundle-config.js');
const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('esbuild bundle config', () => {
    test('reuses the shared packaging contract for main and render-host output filenames', () => {
        const mainBuildOptions = bundleConfig.createMainBundleBuildOptions();
        const renderHostBuildOptions = bundleConfig.createRenderHostBundleBuildOptions();

        expect(mainBuildOptions.entryPoints).toEqual(['src/main.ts']);
        expect(mainBuildOptions.outfile).toBe(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(renderHostBuildOptions.entryPoints).toEqual(['src/rendering/runtime/renderHostEntry.ts']);
        expect(renderHostBuildOptions.outfile).toBe(packagingContract.RENDER_HOST_RUNTIME_OUTPUT_FILE);
    });
});
