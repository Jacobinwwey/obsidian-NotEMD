import * as fs from 'fs';
import * as path from 'path';

describe('diagram roadmap docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const roadmapEn = fs.readFileSync(
        path.join(repoRoot, 'docs', 'superpowers', 'plans', '2026-04-14-diagram-rendering-platform-roadmap.en.md'),
        'utf8'
    );
    const roadmapZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'superpowers', 'plans', '2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md'),
        'utf8'
    );

    test('roadmap keeps the 2026-06-09 current-main truth sync explicit in both languages', () => {
        expect(roadmapEn).toContain('## 2026-06-09 Current-Main Truth Sync');
        expect(roadmapZh).toContain('## 2026-06-09 Current-Main 真值同步');
        expect(roadmapEn).toContain('`7af2f9b` (`docs(progress): sync current-main helper proof truth`)');
        expect(roadmapZh).toContain('`7af2f9b`（`docs(progress): sync current-main helper proof truth`）');
        expect(roadmapEn).toContain('clean `main...origin/main`');
        expect(roadmapZh).toContain('clean 的 `main...origin/main`');
    });

    test('roadmap keeps Task 0 and Task 7 aligned with the current packaging and helper-proof boundaries', () => {
        expect(roadmapEn).toContain('`scripts/lib/packaging-contract.js`');
        expect(roadmapZh).toContain('`scripts/lib/packaging-contract.js`');
        expect(roadmapEn).toContain('`createRenderHostBundleBuildOptions()` remains candidate-only outside the production `esbuild.config.mjs` path');
        expect(roadmapZh).toContain('`createRenderHostBundleBuildOptions()` 继续保持在 production `esbuild.config.mjs` 之外的 candidate-only 状态');
        expect(roadmapEn).toContain('release / chronicle / repo-saga helper entrypoints now have process-level regression proof');
        expect(roadmapZh).toContain('release / chronicle / repo-saga helper 入口也已经具备当前 release-contract 轨道所需的 process-level 回归证明');
    });

    test('roadmap recommended next batch keeps packaging before command and Mermaid cleanup in both languages', () => {
        expect(roadmapEn).toContain(
            "1. Revisit Task 0's remaining heavier-runtime packaging boundary first, so current source/build/release/audit truth stays aligned before any broader claim widening"
        );
        expect(roadmapEn).toContain("2. Finish Task 2's remaining command-architecture convergence");
        expect(roadmapEn).toContain("3. Finish Task 3's remaining `mermaidProcessor.ts` responsibility reduction and legacy-fixer sunset boundary");
        expect(roadmapZh).toContain('1. 先回到任务 0 的剩余 heavier-runtime packaging boundary，持续对齐当前 source/build/release/audit 真值，再考虑任何更宽的能力叙述');
        expect(roadmapZh).toContain('2. 完成任务 2 剩余部分：diagram command architecture 收口');
        expect(roadmapZh).toContain('3. 完成任务 3 剩余部分：`mermaidProcessor.ts` 降责与 legacy fixer sunset boundary');
    });

    test('roadmap records the 2026-07-04 Cloudy and Drawnix reference alignment in both languages', () => {
        expect(roadmapEn).toContain('## 2026-07-04 Reference Integration Reality Correction');
        expect(roadmapZh).toContain('## 2026-07-04 参考项目集成现实校正');
        expect(roadmapEn).toContain('`cloudy-liu/cloudy-tech-diagrams-skill` at `main@719a5be`');
        expect(roadmapZh).toContain('`cloudy-liu/cloudy-tech-diagrams-skill`：`main@719a5be`');
        expect(roadmapEn).toContain('`plait-board/drawnix` at `develop@9939f45`');
        expect(roadmapZh).toContain('`plait-board/drawnix`：`develop@9939f45`');
        expect(roadmapEn).toContain(
            'editable HTML/SVG figure target with semantic Draw.io export annotations'
        );
        expect(roadmapZh).toContain('带语义 Draw.io export annotations 的可编辑 HTML/SVG figure target');
        expect(roadmapEn).toContain('It does not justify embedding the full React/Plait whiteboard host');
        expect(roadmapZh).toContain('不应被解读为需要把完整 React/Plait 白板宿主嵌入 Obsidian 插件');
        expect(roadmapEn).toContain(
            '`DiagramSpec -> target-specific adapter -> renderer/export artifact`'
        );
        expect(roadmapZh).toContain(
            '`DiagramSpec -> target-specific adapter -> renderer/export artifact`'
        );
    });
});
