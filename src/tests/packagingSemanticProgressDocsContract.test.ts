import * as fs from 'fs';
import * as path from 'path';

const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('packaging semantic progress docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const progressDocPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md'
    );
    const progressDocZhPath = path.join(
        repoRoot,
        'docs',
        'brainstorms',
        '2026-05-08-packaging-semantic-convergence-progress-and-next-steps.zh-CN.md'
    );

    test('deep comparison docs stay aligned with current packaging contract ownership truth', () => {
        const progressDoc = fs.readFileSync(progressDocPath, 'utf8');
        const progressDocZh = fs.readFileSync(progressDocZhPath, 'utf8');
        for (const content of [progressDoc, progressDocZh]) {
            expect(content).toContain('scripts/lib/packaging-contract.js');
            expect(content).toContain('createRenderHostBundleBuildOptions()');
            expect(content).toContain('candidate-only');
            expect(content).toContain('render-host.mjs');
            expect(content).toContain('RELEASE_WORKFLOW_TAG_TRIGGER_GLOB');
            expect(content).toContain('RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS');
            expect(content).toContain('NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH');
            expect(content).toContain('NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH');
        }

        expect(progressDoc).toContain('single-entry `main.js` + inline `srcdoc`');
        expect(progressDocZh).toContain('单入口 `main.js` + inline `srcdoc`');
        expect(progressDoc).toContain(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(progressDocZh).toContain(packagingContract.MAIN_BUNDLE_OUTPUT_FILE);
        expect(progressDoc).toContain(packagingContract.RENDER_HOST_RUNTIME_OUTPUT_FILE);
        expect(progressDocZh).toContain(packagingContract.RENDER_HOST_RUNTIME_OUTPUT_FILE);
        expect(progressDoc).toContain('canonical release-notes directory and bilingual filename suffixes');
        expect(progressDocZh).toContain('英文 / 简体中文 release-notes 路径');
        expect(progressDocZh).toContain('`src/tests/githubReleaseWorkflow.test.ts`');
        expect(progressDocZh).toContain('`src/tests/diagramSemanticVerificationScript.test.ts`');
        expect(progressDoc).toContain('`src/tests/githubReleaseWorkflow.test.ts`');
        expect(progressDoc).toContain('`src/tests/diagramSemanticVerificationScript.test.ts`');
        expect(progressDoc).toContain('`src/tests/esbuildBundleConfig.test.ts`');
        expect(progressDocZh).toContain('`src/tests/esbuildBundleConfig.test.ts`');
    });
});
