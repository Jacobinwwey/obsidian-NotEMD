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

2026-06-21 重新 fetch 后，`ref/oh-my-ppt-upstream-fresh-20260621` 的 `origin/main` 仍停在 `843ff74` / `v2.0.17`，但本地 fork 已同步 `upstream/feat/v2.0.18` 到 `5cf764b`。本次参考的是 `renderer.ts`、`browser-scripts.ts`、`index.ts`、`table-extract.ts` 与 `ooxml-writer.ts` 的 HTML->PPTX 路线。该项目对这类问题的关键处理不是“把截图转成 PPTX”，而是分层抽取：

1. `table-extract.ts` 先抽取真实 `<table>`，计算 row/column geometry、rowspan/colspan、border、padding 与 vertical align，并把 consumed table 标记掉，避免后续文本抽取重复吃表格内容。
2. `index.ts` 在浏览器中以 computed style 为事实源抽取 text run、shape、image、table，并使用 paint order 思路维持 z-order。
3. `renderer.ts` 在捕获 background 前隐藏已抽取 primitive，并用像素采样检测 text residue，必要时 retry，避免“背景截图里残留一份文字 + PPTX 文本框再叠一份文字”。
4. `ooxml-writer.ts` 支持 native DrawingML table、multi-run text、norm/no autofit、overlay image、font embedding 与 animation trace matching。
5. `font-collect.ts` 把字体作为输出合同的一部分，而不是假设 Office 端字体和 Chromium 字体度量一致。

NoteMD 当前已经从最小闭环推进到“文本框抽取 + table-first structural extraction + 整页视觉 fallback + PresentationML writer + 冻结背景视觉门槛”。它仍没有 rich text runs、完整 paint-order primitive graph、字体 embedding 和 background residue retry。因此它能证明“文本与表格结构可编辑/可选中”，也能证明“Office 回渲接近写入 PPTX 的冻结视觉层”；但还不能证明 Mermaid/SVG/canvas/Vue component 已被重建为 Office 原生可编辑对象。

NoteMD 当前采用 clean-room Playwright + 小型 PresentationML writer 实现这条路线，避免直接复制 Apache-2.0 源码，也避免把 Electron 假设带入 Obsidian 插件。

## 已落地实现

当前实现新增：

1. 将 `pptx` 加入导出格式类型、UI 选择框、设置页、环境能力矩阵与维护者 verifier。
2. `src/slideExport/pptxDomExtractor.ts`：选择当前可见的 Slidev 页面，并基于 computed DOM geometry 抽取文本框。
3. `src/slideExport/pptxExporter.ts`：消费收敛后的 HTML，逐页访问 `#/1..n`，捕获视觉 fallback，并写 sidecar report。
4. `src/slideExport/pptxWriter.ts`：使用 `fflate` 写 clean-room PresentationML zip。
5. `scripts/verify-slidev-export-workflow.cjs --format pptx`：把 PPTX 当 zip 解开，验证 slide XML 中存在可编辑文本节点。
6. 新增 `src/tests/pptxWriter.test.ts`，并更新 UI / environment 相关测试。
7. `scripts/lib/pptx-visual-diff.js`：新增 PPTX 回渲染质量门，使用 LibreOffice 将 PPTX 转 PDF，再用 `pdftoppm` 渲染 PNG，与 PPTX 内嵌冻结背景 reference 逐页比较。
8. `scripts/verify-slidev-export-workflow.cjs --pptx-visual-diff`：从 PPTX slide relationship 抽取 reference image，输出逐页 diff、side-by-side contact sheet、`comparison-metrics.csv` 与 JSON report；`--require-pptx-visual-match` 才把阈值作为 hard failure。
9. `src/slideExport/pptxDomExtractor.ts` 现在在普通文本抽取前先读取 `<table>` 几何、行列尺寸、rowspan/colspan、单元格文本和基本字体属性。
10. `src/slideExport/pptxWriter.ts` 现在输出 native DrawingML `<a:tbl>`，但默认作为透明结构层：可见表格仍由 DOM 文本层与整页 fallback 保持，避免 Office 默认表格样式污染 Slidev 视觉。
11. `scripts/verify-slidev-export-workflow.cjs` 的 PPTX inspector 现在统计 `tableCount`，sidecar report 记录 `tableCount` 与 `editableTableCellCount`。
12. `src/slideExport/pptxExporter.ts` 现在用 1960x1104 viewport 捕获视觉层，并在捕获前等待字体、冻结 animation/transition、双 RAF 稳定，减少 browser snapshot 漂移。
13. `src/slideExport/pptxWriter.ts` 将普通文本和表格文本都写成透明可编辑结构层，让可见文本来自冻结背景图，避免 Office 字体/line-height 差异污染视觉门槛。

PPTX 导出被放在 `convergeSlidevDeckLayout()` 之后，这是刻意的。这样不会引入第二条未审计路径，PPTX 与 HTML/PDF/PNG/MP4 共享同一套 rendered fit 修复。

## 真实验收

真实命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

结果：

1. `ok = true`
2. `slideCount = 27`
3. `pptxInspection.textRunCount = 331`
4. `pptxInspection.pictureCount = 27`
5. `pptxInspection.tableCount = 4`
6. `pptxInspection.slidesWithoutEditableText = []`
7. sidecar `textBoxCount = 223`
8. sidecar `tableCount = 4`
9. sidecar `editableTableCellCount = 95`
10. sidecar `editableTextSlideCount = 27`
11. sidecar `imageFallbackCount = 27`

归档：

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

## 逐页视觉对比验收

旧真实命令曾经把 PPTX 回渲结果与另一次 Slidev PNG export 比较：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json'
```

该旧 gate 产出了有价值的失败数据，但其 hard gate 语义不稳：PPTX 背景图来自已导出的 HTML 实例，reference 却来自另一次 Slidev PNG export。后续严格/非严格对比证明，两次 PPTX 内嵌图和 LibreOffice 回渲 PNG 完全一致，失败来自第二次 Slidev PNG reference 漂移。最差页 21 的例子是同一个 PPTX 被不同 reference 误判：PPTX embedded image hash 相同，rendered PNG hash 相同，但严格 run 的 Slidev PNG reference hash 不同。

旧 gate 的历史指标保留如下：

1. baseline：`meanRmse = 0.15322961111111114`，`maxRmse = 0.260447`
2. 直接输出可见原生表格：`meanRmse = 0.15640467407407407`，比 baseline 更差。
3. 保留背景表格视觉但让原生表格文本可见：`meanRmse = 0.15657594444444442`，仍然更差。
4. 透明结构表格层：`meanRmse = 0.15259227777777779`，`maxRmse = 0.260447`，比 baseline 略好但仍受错误 reference 语义影响。

修正后的 strict 命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-frozen-reference-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

修正后的真实结果：

1. `ok = true`
2. `pptxVisualGate.required = true`
3. `pptxVisualGate.passed = true`
4. `pptxVisualDiff.reference.source = pptx-background-images`
5. `pageCount = 27`
6. `comparablePageCount = 27`
7. `meanRmse = 0.049441916296296295`
8. `maxRmse = 0.0889364`
9. `pptxInspection.textRunCount = 331`
10. `pptxInspection.pictureCount = 27`
11. `pptxInspection.tableCount = 4`
12. `pptxInspection.slidesWithoutEditableText = []`

可检查产物在：

```text
docs/export/test-slidev-pptx-frozen-reference-strict/
docs/export/test-slidev-pptx-frozen-reference-strict/architecture.zh-CN.pptx
docs/export/test-slidev-pptx-frozen-reference-strict/architecture.zh-CN.pptx.report.json
docs/export/test-slidev-pptx-frozen-reference-strict/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/test-slidev-pptx-frozen-reference-strict/architecture.zh-CN-pptx-visual-diff/comparison-metrics.csv
docs/export/test-slidev-pptx-frozen-reference-strict/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
```

这些产物由 `.gitignore` 覆盖，只作为本地验收证据，不提交到 `main`。

该结果证明两件事：第一，`pptxInspection.textRunCount > 0` 仍然只能证明结构可编辑，不能单独证明视觉；第二，PPTX 视觉 hard gate 的 reference 必须来自同一冻结视觉层。把另一次 Slidev PNG export 当作 hard gate reference 会把独立渲染实例的漂移混入 PPTX 质量评估。

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
4. 表格现在有 native DrawingML 结构层，包含单元格文本、rowspan/colspan 和行列尺寸；但该结构层默认透明，不负责可见渲染。可见表格仍由 DOM 文本框和整页 fallback 保持，直到 Office 原生表格排版能稳定匹配 Slidev。
5. 代码块在 DOM 文本被选中时会以文本方式进入 PPTX，但尚未建模 syntax highlight run fidelity。
6. 动画和 click steps 尚未转换为 PowerPoint animations。
7. 冻结背景 reference 下的视觉质量门已经通过；但这只证明 Office 回渲保留视觉层，不证明复杂对象已经 Office 原生可编辑。

这些不是回归，而是明确边界。把可编辑性夸大成无法验证的承诺，比交付一个诚实的 report-driven 第一版更糟。

## 后续方向

下一阶段应保持增量、报告驱动：

1. 保持 visual diff gate 进入每次 PPTX 真实验收：报告模式用于开发，`--require-pptx-visual-match` 用于收口或 CI，并固定使用 `pptx-background-images` 作为 hard gate reference。
2. table-first extraction 已经落地为透明结构层。下一步不要急着把表格设为可见层，而应先补齐 CSS padding、border collapse、line-height、cell text baseline、theme font fallback 与 Office round-trip 渲染模型；只有 visible-native-table 分支在 frozen reference gate 下不退化时，才允许逐页放开。
3. 文本模型从“每个 DOM block 一个 text frame”升级为 rich run extraction。必须处理 CJK 字体、font fallback、line-height、paragraph spacing、list indent、code monospace 和 inline emphasis，否则长文本页会持续偏。
4. 背景捕获增加 residue detection/retry。当前隐藏候选文本后直接截图，缺少像素级确认，容易叠出 ghost text 或漏隐藏的 inline text。
5. shape extraction 只从高置信纯色矩形/线条开始，按 DOM paint order 插入；不要先碰复杂 SVG/Mermaid/vector reconstruction。
6. Mermaid 源内容继续不动，默认保持 image fallback；除非未来提供明确 experimental vector reconstruction 选项，并且不得自动拆分或改写源 Mermaid fence。
7. 继续保留 rendered convergence 作为共同前置路径，不新增一条绕过 HTML/PNG 事实源的 HTML-to-PPTX 路线。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
