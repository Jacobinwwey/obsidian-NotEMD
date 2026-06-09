import * as fs from 'fs';
import * as path from 'path';

const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('release workflow docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const releaseWorkflowPath = path.join(repoRoot, 'docs', 'maintainer', 'release-workflow.md');
    const releaseWorkflowZhPath = path.join(repoRoot, 'docs', 'maintainer', 'release-workflow.zh-CN.md');

    test('maintainer release workflow docs stay aligned with the shared packaging contract', () => {
        const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, 'utf8');
        const releaseWorkflowZh = fs.readFileSync(releaseWorkflowZhPath, 'utf8');
        const releaseNotesPaths = packagingContract.resolveReleaseNotesRelativePaths('<tag>');

        for (const asset of packagingContract.REQUIRED_RELEASE_ASSET_FILES) {
            expect(releaseWorkflow).toContain(`- \`${asset}\``);
            expect(releaseWorkflowZh).toContain(`- \`${asset}\``);
        }

        expect(releaseWorkflow).toContain('numeric `x.x.x` format');
        expect(releaseWorkflowZh).toContain('纯数字 `x.x.x`');
        expect(releaseWorkflow).toContain(`- English: \`${releaseNotesPaths.english}\``);
        expect(releaseWorkflow).toContain(`- Simplified Chinese: \`${releaseNotesPaths.simplifiedChinese}\``);
        expect(releaseWorkflowZh).toContain(`- 英文：\`${releaseNotesPaths.english}\``);
        expect(releaseWorkflowZh).toContain(`- 简体中文：\`${releaseNotesPaths.simplifiedChinese}\``);

        expect(releaseWorkflow).toContain('NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH');
        expect(releaseWorkflow).toContain('NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH');
        expect(releaseWorkflow).toContain('workflow-source checkout branch');
        expect(releaseWorkflow).toContain('chronicle push target');
        expect(releaseWorkflowZh).toContain('NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH');
        expect(releaseWorkflowZh).toContain('NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH');
        expect(releaseWorkflowZh).toContain('workflow-source checkout 分支');
        expect(releaseWorkflowZh).toContain('chronicle push 目标');
        expect(releaseWorkflow).toContain('RELEASE_WORKFLOW_TAG_TRIGGER_GLOB');
        expect(releaseWorkflow).toContain('RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS');
        expect(releaseWorkflowZh).toContain('RELEASE_WORKFLOW_TAG_TRIGGER_GLOB');
        expect(releaseWorkflowZh).toContain('RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS');
        expect(releaseWorkflow).toContain('If you omit `--output`, the helper prints the checklist to stdout');
        expect(releaseWorkflowZh).toContain('如果不传 `--output`，helper 会直接把检查清单打印到 stdout');
        expect(releaseWorkflow).toContain('unsupported `--surface` values fail fast');
        expect(releaseWorkflowZh).toContain('若 `--surface` 不受支持，则会快速失败');
        expect(releaseWorkflow).toContain('`npm run release:github -- <tag> --dry-run` is the checked-in no-network proof path');
        expect(releaseWorkflowZh).toContain('`npm run release:github -- <tag> --dry-run` 是已检入的无网络证明路径');
        expect(releaseWorkflow).toContain('`scripts/release/commit-chronicle-refresh.js` entrypoint is now also process-level regression-locked');
        expect(releaseWorkflowZh).toContain('`scripts/release/commit-chronicle-refresh.js` 入口现在也具备 process-level 回归锁定');
        expect(releaseWorkflow).toContain('`scripts/repo-saga/update-quarterly-saga.mjs` entrypoint is now also process-level regression-locked');
        expect(releaseWorkflowZh).toContain('`scripts/repo-saga/update-quarterly-saga.mjs` 入口现在也具备 process-level 回归锁定');
    });
});
