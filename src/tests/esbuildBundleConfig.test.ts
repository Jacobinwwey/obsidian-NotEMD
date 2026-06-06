import * as fs from 'fs';
import * as path from 'path';

const bundleConfig = require('../../scripts/lib/esbuild-bundle-config.js');
const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('esbuild bundle config', () => {
    const repoRoot = path.join(__dirname, '..', '..');

    test('reuses the shared packaging contract for main and render-host output filenames', () => {
        const mainBuildOptions = bundleConfig.createMainBundleBuildOptions();
        const renderHostBuildOptions = bundleConfig.createRenderHostBundleBuildOptions();

        expect(mainBuildOptions.entryPoints).toEqual(['src/main.ts']);
        expect(mainBuildOptions.outfile).toBe(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(renderHostBuildOptions.entryPoints).toEqual(['src/rendering/runtime/renderHostEntry.ts']);
        expect(renderHostBuildOptions.outfile).toBe(packagingContract.RENDER_HOST_RUNTIME_OUTPUT_FILE);
    });

    test('keeps production build on the single-entry main bundle while render-host output remains candidate-only', () => {
        const esbuildConfigSource = fs.readFileSync(path.join(repoRoot, 'esbuild.config.mjs'), 'utf8');
        const mainBuildOptions = bundleConfig.createMainBundleBuildOptions({ prod: true });
        const renderHostBuildOptions = bundleConfig.createRenderHostBundleBuildOptions({ prod: true });

        expect(esbuildConfigSource).toContain('createMainBundleBuildOptions');
        expect(esbuildConfigSource).not.toContain('createRenderHostBundleBuildOptions');
        expect(mainBuildOptions.entryPoints).toEqual(['src/main.ts']);
        expect(mainBuildOptions.outfile).toBe(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(renderHostBuildOptions.outfile).toBe(packagingContract.RENDER_HOST_RUNTIME_OUTPUT_FILE);
        expect(packagingContract.RENDER_HOST_STANDALONE_OUTPUT_FILES).toContain(renderHostBuildOptions.outfile);
        expect(packagingContract.REQUIRED_RELEASE_ASSET_FILES).toContain(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(packagingContract.REQUIRED_RELEASE_ASSET_FILES).not.toContain(renderHostBuildOptions.outfile);
    });
});
