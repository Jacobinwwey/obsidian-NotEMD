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
        expect(progressDoc).toContain('### 2026-06-09 Helper-Entrypoint Delta');
        expect(progressDocZh).toContain('### 2026-06-09 Helper-Entrypoint 增量');
        expect(progressDoc).toContain('stdout mode still emits the full checklist when `--output` is omitted');
        expect(progressDocZh).toContain('stdout 模式仍会输出完整检查清单');
        expect(progressDoc).toContain('unsupported `--surface` values still fail fast');
        expect(progressDocZh).toContain('不受支持的 `--surface` 值仍会以非零退出码快速失败');
        expect(progressDoc).toContain('### 2026-06-09 Release-Helper Entrypoint Delta');
        expect(progressDocZh).toContain('### 2026-06-09 Release-Helper Entrypoint 增量');
        expect(progressDoc).toContain('`node scripts/release/publish-github-release.js <tag> --dry-run`');
        expect(progressDocZh).toContain('`node scripts/release/publish-github-release.js <tag> --dry-run`');
        expect(progressDoc).toContain('temporary composed release-notes files are still cleaned up after dry-run output');
        expect(progressDocZh).toContain('dry-run 结束后仍会清理临时组合出的 release-notes 文件');
        expect(progressDoc).toContain('### 2026-06-09 Chronicle-Helper Entrypoint Delta');
        expect(progressDocZh).toContain('### 2026-06-09 Chronicle-Helper Entrypoint 增量');
        expect(progressDoc).toContain('`node scripts/release/commit-chronicle-refresh.js ...`');
        expect(progressDocZh).toContain('`node scripts/release/commit-chronicle-refresh.js ...`');
        expect(progressDoc).toContain('clean no-op runs print `Chronicle already up to date.`');
        expect(progressDocZh).toContain('clean no-op 时会输出 `Chronicle already up to date.`');
        expect(progressDoc).toContain('### 2026-06-09 Repo-Saga Entrypoint Delta');
        expect(progressDocZh).toContain('### 2026-06-09 Repo-Saga Entrypoint 增量');
        expect(progressDoc).toContain('`node scripts/repo-saga/update-quarterly-saga.mjs --sync-only`');
        expect(progressDocZh).toContain('`node scripts/repo-saga/update-quarterly-saga.mjs --sync-only`');
        expect(progressDoc).toContain('respects a matching integration stamp');
        expect(progressDocZh).toContain('在 integration stamp 命中时仍会按已检入语义成功退出');
        expect(progressDoc).toContain('`--no-readme --tag <tag>` run still produces localized chronicle SVGs');
        expect(progressDocZh).toContain('`--no-readme --tag <tag>` 真实运行仍会产出多语言编年史 SVG');
        expect(progressDoc).toContain('missing `--tag` values and unknown options now fail fast before touching repo-saga state');
        expect(progressDocZh).toContain('缺失 `--tag` 值与未知参数现在会在触碰 repo-saga 状态前快速失败');
        expect(progressDoc).toContain('### 2026-06-09 Current-Main Progress-Sync Delta');
        expect(progressDocZh).toContain('### 2026-06-09 Current-Main Progress-Sync 增量');
        expect(progressDoc).toContain('Task 0 as the still-live packaging/source-build bottleneck');
        expect(progressDocZh).toContain('任务 0 读成仍然活跃的 packaging/source-build 瓶颈');
        expect(progressDoc).toContain('Task 2 as compatibility-surface convergence rather than pipeline existence work');
        expect(progressDocZh).toContain('任务 2 读成 compatibility-surface 收口，而不是 pipeline 是否存在');
        expect(progressDoc).toContain('Task 3 as MermaidProcessor responsibility reduction guarded by real Obsidian verification');
        expect(progressDocZh).toContain('任务 3 读成带真实 Obsidian 验证门槛的 MermaidProcessor 降责');
    });
});
