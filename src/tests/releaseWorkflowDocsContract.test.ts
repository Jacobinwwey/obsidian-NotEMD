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
    });
});
