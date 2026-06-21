# Slidev 可编辑 PPTX 推进记录与后续方向，2026-06-21

## 问题定义

本需求不是“生成一个 `.pptx` 文件”。每页一张截图的 PPTX 很容易做，但不满足“可编辑 PPTX”的要求。真正有价值的目标是：PowerPoint 用户能直接编辑 slide 文本，同时 Slidev 渲染出的复杂视觉结果仍然被保留。

## 参考项目对比

`huashu-design` 适合从源头就按 PPTX 转换约束写 HTML 的场景。它的约束在该领域是合理的：文本应由段落/标题标签承载，背景和边框归容器所有，渐变与 background-image 受限，画布尺寸要匹配 `LAYOUT_WIDE`。但这不适合直接套在生成后的 Slidev HTML 上，因为 Slidev 是 routed Vue SPA，包含 transforms、Mermaid SVG、canvas/SVG/icon、生成 CSS 与运行时状态。

`oh-my-ppt` 更适合作为 NoteMD 的架构参考，因为它先观察真实浏览器渲染状态，再抽取 text、image、table、formula、paint order 与 fallback image，最后写 OOXML。值得采用的是 pipeline 形态，而不是 Electron 本身：

1. 在真实浏览器里渲染 HTML；
2. 对高置信元素抽取可编辑 primitive；
3. 对 Office 原生重建不稳的复杂元素做 raster fallback；
4. 写 OOXML package；
5. 输出 warnings 与 editability coverage。

NoteMD 当前采用 clean-room Playwright + 小型 PresentationML writer 实现这条路线，避免直接复制 Apache-2.0 源码，也避免把 Electron 假设带入 Obsidian 插件。

## 已落地实现

当前实现新增：

1. 将 `pptx` 加入导出格式类型、UI 选择框、设置页、环境能力矩阵与维护者 verifier。
2. `src/slideExport/pptxDomExtractor.ts`：选择当前可见的 Slidev 页面，并基于 computed DOM geometry 抽取文本框。
3. `src/slideExport/pptxExporter.ts`：消费收敛后的 HTML，逐页访问 `#/1..n`，捕获视觉 fallback，并写 sidecar report。
4. `src/slideExport/pptxWriter.ts`：使用 `fflate` 写 clean-room PresentationML zip。
5. `scripts/verify-slidev-export-workflow.cjs --format pptx`：把 PPTX 当 zip 解开，验证 slide XML 中存在可编辑文本节点。
6. 新增 `src/tests/pptxWriter.test.ts`，并更新 UI / environment 相关测试。

PPTX 导出被放在 `convergeSlidevDeckLayout()` 之后，这是刻意的。这样不会引入第二条未审计路径，PPTX 与 HTML/PDF/PNG/MP4 共享同一套 rendered fit 修复。

## 真实验收

真实命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

结果：

1. `ok = true`
2. `slideCount = 27`
3. `pptxInspection.textRunCount = 236`
4. `pptxInspection.pictureCount = 27`
5. `pptxInspection.slidesWithoutEditableText = []`
6. sidecar `textBoxCount = 223`
7. sidecar `editableTextSlideCount = 27`
8. sidecar `imageFallbackCount = 27`

归档：

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

## Release 链接决策

环境检测 UI 必须继续指向 npm 可安装的 GitHub release asset：

```text
https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz
```

GitHub branch、tree 或 blob URL 都不是正确安装面。它们不是稳定 package 边界，会随分支漂移，也可能直接在 `npm install` 下失败。当前实机核验已经确认 `Jacobinwwey/slidev` 中存在该 release tag 和 asset，且 `npm pack <release-asset-url> --dry-run` 能识别为 `@slidev/cli@52.16.0`。

后续 Slidev fork 有新改动时，只有在 fork 仓库真正切出新 release 并完成 npm package 烟测后，NoteMD 才应该更新 UI 安装 URL。包含 PR 工作的分支只是 staging surface，不是用户安装 surface。

## 当前边界

第一版实现有意保守：

1. 文本可编辑。
2. 整页视觉 fallback 保留复杂视觉。
3. Mermaid/SVG/canvas 不会被转换成 Office 原生可编辑 vector object。
4. 表格当前视觉保留，尚未重建为 PowerPoint 可编辑表格。
5. 代码块在 DOM 文本被选中时会以文本方式进入 PPTX，但尚未建模 syntax highlight run fidelity。
6. 动画和 click steps 尚未转换为 PowerPoint animations。

这些不是回归，而是明确边界。把可编辑性夸大成无法验证的承诺，比交付一个诚实的 report-driven 第一版更糟。

## 后续方向

下一阶段应保持增量、报告驱动：

1. 只有在 row/column geometry 能可靠重建时才添加 table extraction；
2. 代码块先按单个等宽 text frame 抽取，再考虑逐 token 样式；
3. shape extraction 只从高置信纯色矩形/线条开始；
4. Mermaid 源内容继续不动，默认保持 image fallback；除非未来提供明确 experimental vector reconstruction 选项；
5. 继续用 `pptxInspection` 与 sidecar metrics 做验收门。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
