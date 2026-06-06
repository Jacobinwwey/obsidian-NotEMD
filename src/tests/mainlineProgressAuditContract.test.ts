import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..', '..');

function readDoc(relativePath: string): string {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('mainline progress audit contract', () => {
    const progressDoc = readDoc('docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md');
    const progressDocZh = readDoc(
        'docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md'
    );
    const matrixDoc = readDoc('docs/brainstorms/2026-05-20-unified-follow-through-matrix.md');
    const matrixDocZh = readDoc('docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md');

    test('records the current Stage-B2/C/D checkpoint in both canonical progress docs', () => {
        expect(progressDoc).toContain('### 2.7 Current `824d07e` Stage-B2/C/D checkpoint');
        expect(progressDocZh).toContain('### 2.7 当前 `824d07e` Stage-B2/C/D 检查点');
        expect(progressDoc).toContain('test(local-kb): cover chapter split showcase retrieval');
        expect(progressDocZh).toContain('test(local-kb): cover chapter split showcase retrieval');
        expect(progressDoc).toContain('`npm run verify:local-kb-fixtures`');
        expect(progressDocZh).toContain('`npm run verify:local-kb-fixtures`');
        expect(progressDoc).toContain('MiniSearch-backed retrieval path');
        expect(progressDocZh).toContain('MiniSearch-backed retrieval 路径');
    });

    test('locks the active PRD interpretation to landed implementation truth plus ongoing gates', () => {
        expect(progressDoc).toContain('Requirement-by-requirement status');
        expect(progressDocZh).toContain('当前逐项状态');

        for (const marker of ['R1 local-KB task support', 'R2/R3 local-only', 'R4/R4a/R4b', 'R8 packaging']) {
            expect(progressDoc).toContain(marker);
        }

        for (const marker of ['R1 local-KB 任务支持', 'R2/R3 local-only', 'R4/R4a/R4b', 'R8 packaging']) {
            expect(progressDocZh).toContain(marker);
        }

        expect(progressDoc).toContain('On current main, R1 through R7 are implementation truth');
        expect(progressDocZh).toContain('在当前主线上，R1 到 R7 已经是实现真值');
        expect(progressDoc).toContain('R9 and R10 are continuing finish gates');
        expect(progressDocZh).toContain('R9 与 R10 是持续 finish gate');
    });

    test('keeps diagnostics and packaging boundaries explicit instead of widening public claims', () => {
        for (const content of [progressDoc, progressDocZh, matrixDoc, matrixDocZh]) {
            expect(content).toContain('`local-knowledge.inspect`');
            expect(content).toContain('maintainer-only');
            expect(content).toContain('`main.js`');
            expect(content).toContain('inline `srcdoc`');
        }

        expect(progressDoc).toContain('not a public CLI expansion');
        expect(progressDocZh).toContain('不是 public CLI 扩张');
        expect(progressDoc).toContain('no dedicated runtime asset is claimed');
        expect(progressDocZh).toContain('没有宣称 dedicated runtime asset');
        expect(progressDoc).toContain('`createRenderHostBundleBuildOptions()` remains candidate-only');
        expect(progressDoc).toContain('not consumed by `esbuild.config.mjs`');
        expect(progressDocZh).toContain('`createRenderHostBundleBuildOptions()` 继续保持 candidate-only');
        expect(progressDocZh).toContain('不能被 `esbuild.config.mjs` 消费');
        expect(matrixDoc).toContain('`createRenderHostBundleBuildOptions()` candidate-only');
        expect(matrixDoc).toContain('production `esbuild.config.mjs` path');
        expect(matrixDocZh).toContain('`createRenderHostBundleBuildOptions()`');
        expect(matrixDocZh).toContain('candidate-only');
        expect(matrixDocZh).toContain('production `esbuild.config.mjs`');
        expect(matrixDoc).toContain('not existence re-proof');
        expect(matrixDocZh).toContain('不是继续做存在性重证');
    });

    test('keeps the unified matrix aligned with the same current-head evidence and next direction', () => {
        expect(matrixDoc).toContain('Current execution checkpoint for this matrix update:');
        expect(matrixDocZh).toContain('本次矩阵更新的当前执行检查点：');
        expect(matrixDoc).toContain('`824d07e`');
        expect(matrixDocZh).toContain('`824d07e`');
        expect(matrixDoc).toContain('real-note-style chapter-split showcase retrieval through the live MiniSearch path');
        expect(matrixDocZh).toContain('real-note-style chapter-split showcase retrieval');
        expect(matrixDocZh).toContain('MiniSearch path');
        expect(matrixDoc).toContain('evaluation depth, maintainer-example alignment, and packaging-boundary discipline');
        expect(matrixDocZh).toContain('评估深度、maintainer 示例对齐与 packaging 边界纪律');
        expect(matrixDoc).toContain('candidate-only production-build guard');
        expect(matrixDocZh).toContain('candidate-only production-build guard');
    });
});
