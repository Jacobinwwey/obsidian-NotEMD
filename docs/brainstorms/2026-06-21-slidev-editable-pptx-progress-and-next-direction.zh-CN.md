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

2026-06-21 重新 fetch 的 `ref/oh-my-ppt-upstream-fresh-20260621` 仍指向 `origin/main` 的 `843ff74`，最新 tag 为 `v2.0.17`。该项目对这类问题的关键处理不是“把截图转成 PPTX”，而是分层抽取：

1. `table-extract.ts` 先抽取真实 `<table>`，计算 row/column geometry、rowspan/colspan、border、padding 与 vertical align，并把 consumed table 标记掉，避免后续文本抽取重复吃表格内容。
2. `index.ts` 在浏览器中以 computed style 为事实源抽取 text run、shape、image、table，并使用 paint order 思路维持 z-order。
3. `renderer.ts` 在捕获 background 前隐藏已抽取 primitive，并用像素采样检测 text residue，必要时 retry，避免“背景截图里残留一份文字 + PPTX 文本框再叠一份文字”。
4. `ooxml-writer.ts` 支持 native DrawingML table、multi-run text、norm/no autofit、overlay image、font embedding 与 animation trace matching。
5. `font-collect.ts` 把字体作为输出合同的一部分，而不是假设 Office 端字体和 Chromium 字体度量一致。

NoteMD 当前已经从最小闭环推进到“文本框抽取 + table-first structural extraction + 整页视觉 fallback + PresentationML writer”。它仍没有 rich text runs、完整 paint-order primitive graph、字体 embedding 和 background residue retry。因此它能证明“文本与表格结构可编辑/可选中”，但还不能证明“PPTX 回放视觉接近 PNG reference”。

NoteMD 当前采用 clean-room Playwright + 小型 PresentationML writer 实现这条路线，避免直接复制 Apache-2.0 源码，也避免把 Electron 假设带入 Obsidian 插件。

## 已落地实现

当前实现新增：

1. 将 `pptx` 加入导出格式类型、UI 选择框、设置页、环境能力矩阵与维护者 verifier。
2. `src/slideExport/pptxDomExtractor.ts`：选择当前可见的 Slidev 页面，并基于 computed DOM geometry 抽取文本框。
3. `src/slideExport/pptxExporter.ts`：消费收敛后的 HTML，逐页访问 `#/1..n`，捕获视觉 fallback，并写 sidecar report。
4. `src/slideExport/pptxWriter.ts`：使用 `fflate` 写 clean-room PresentationML zip。
5. `scripts/verify-slidev-export-workflow.cjs --format pptx`：把 PPTX 当 zip 解开，验证 slide XML 中存在可编辑文本节点。
6. 新增 `src/tests/pptxWriter.test.ts`，并更新 UI / environment 相关测试。
7. `scripts/lib/pptx-visual-diff.js`：新增 PPTX 回渲染质量门，使用 LibreOffice 将 PPTX 转 PDF，再用 `pdftoppm` 渲染 PNG，与 Slidev 原生 PNG export 逐页比较。
8. `scripts/verify-slidev-export-workflow.cjs --pptx-visual-diff`：自动为同一 deck 生成 PNG reference，输出逐页 diff、side-by-side contact sheet、`comparison-metrics.csv` 与 JSON report；`--require-pptx-visual-match` 才把阈值作为 hard failure。
9. `src/slideExport/pptxDomExtractor.ts` 现在在普通文本抽取前先读取 `<table>` 几何、行列尺寸、rowspan/colspan、单元格文本和基本字体属性。
10. `src/slideExport/pptxWriter.ts` 现在输出 native DrawingML `<a:tbl>`，但默认作为透明结构层：可见表格仍由 DOM 文本层与整页 fallback 保持，避免 Office 默认表格样式污染 Slidev 视觉。
11. `scripts/verify-slidev-export-workflow.cjs` 的 PPTX inspector 现在统计 `tableCount`，sidecar report 记录 `tableCount` 与 `editableTableCellCount`。

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

新增真实命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json'
```

结果要分两层读：

1. `ok = true`：表示生产等价导出链、PPTX 结构检查、Mermaid source preservation、gitignore 输出隔离和 visual diff 执行本身都成功。
2. `pptxVisualDiff.gate.passed = false`：表示当前 PPTX 回放视觉不满足默认质量阈值。

当前真实指标：

1. `pageCount = 27`
2. `comparablePageCount = 27`
3. `meanRmse = 0.15322961111111114`
4. `maxRmse = 0.260447`
5. 默认阈值为 `maxRmse <= 0.12` 且 `meanRmse <= 0.08`
6. 最差页依次为 21、19、24、20、16、17、18、10、22、15、13、12

随后基于 `oh-my-ppt` 的 table-first 思路做了三组真实对比：

1. 直接输出可见原生表格：`meanRmse = 0.15640467407407407`，比基线更差。
2. 保留背景表格视觉但让原生表格文本可见：`meanRmse = 0.15657594444444442`，仍然更差。
3. 当前默认的透明结构表格层：`meanRmse = 0.15259227777777779`，`maxRmse = 0.260447`，比基线略好但远未达到默认阈值。

表格页本身有小幅改善：第 7、10、12、13 页 RMSE 分别下降约 `0.0034`、`0.0053`、`0.0042`、`0.0042`。这说明“表格先抽取”方向有效，但也证明不能天真地把 Slidev CSS 表格替换成 Office 默认表格。Office 的 grid、padding、line-height 和字体度量会把视觉质量拉低。

可检查产物在：

```text
docs/export/test-slidev-pptx-visual-diff/
docs/export/test-slidev-pptx-visual-diff/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/test-slidev-pptx-visual-diff/architecture.zh-CN-pptx-visual-diff/comparison-metrics.csv
docs/export/test-slidev-pptx-visual-diff/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
docs/export/test-slidev-pptx-visual-diff/architecture.zh-CN-pptx-visual-diff/all-diff-sheet.png
```

这些产物由 `.gitignore` 覆盖，只作为本地验收证据，不提交到 `main`。

该结果证明此前的验收标准过弱：`pptxInspection.textRunCount > 0` 只能证明“有可编辑文本”，不能证明排版、字体、表格、代码块、长文本在 Office 渲染后仍接近 Slidev PNG。当前最差页集中在长 mixed CJK/English 文本、表格和代码/列表页，而不是 Mermaid 页；因此固定 zoom 或让 LLM 手工猜 zoom 不是主解。

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
7. 视觉保真质量门当前未通过；这是当前实现需要继续推进的主要证据，而不是可以用“有 fallback 图片”掩盖的问题。

这些不是回归，而是明确边界。把可编辑性夸大成无法验证的承诺，比交付一个诚实的 report-driven 第一版更糟。

## 后续方向

下一阶段应保持增量、报告驱动：

1. 先把 visual diff gate 纳入每次 PPTX 真实验收：报告模式用于开发，`--require-pptx-visual-match` 用于收口或 CI。
2. table-first extraction 已经落地为透明结构层。下一步不要急着把表格设为可见层，而应先补齐 CSS padding、border collapse、line-height、cell text baseline、theme font fallback 与 Office round-trip 渲染模型；只有 visual diff 证明不退化时，才允许表格可见层逐页放开。
3. 文本模型从“每个 DOM block 一个 text frame”升级为 rich run extraction。必须处理 CJK 字体、font fallback、line-height、paragraph spacing、list indent、code monospace 和 inline emphasis，否则长文本页会持续偏。
4. 背景捕获增加 residue detection/retry。当前隐藏候选文本后直接截图，缺少像素级确认，容易叠出 ghost text 或漏隐藏的 inline text。
5. shape extraction 只从高置信纯色矩形/线条开始，按 DOM paint order 插入；不要先碰复杂 SVG/Mermaid/vector reconstruction。
6. Mermaid 源内容继续不动，默认保持 image fallback；除非未来提供明确 experimental vector reconstruction 选项，并且不得自动拆分或改写源 Mermaid fence。
7. 继续保留 rendered convergence 作为共同前置路径，不新增一条绕过 HTML/PNG 事实源的 HTML-to-PPTX 路线。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
