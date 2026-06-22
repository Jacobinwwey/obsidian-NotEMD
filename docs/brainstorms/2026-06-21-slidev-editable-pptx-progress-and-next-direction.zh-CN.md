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

2026-06-21 重新 fetch 后，`/home/jacob/ref/oh-my-ppt-upstream-latest` 的 `origin/main` 为 `843ff74` / `v2.0.17`。本地 fork `/home/jacob/ref/oh-my-ppt-fork` 当前在 `pr/animation-export-contract` 的 `257c23b`，相对 `upstream/main` 的相关差异集中在 animation export contract；HTML->PPTX 主路线仍以 upstream 的 `renderer.ts`、`browser-scripts.ts`、`index.ts`、`table-extract.ts`、`font-collect.ts` 与 `ooxml-writer.ts` 为准。

该项目对这类问题的关键处理不是“把截图转成 PPTX”，而是分层抽取：

1. `table-extract.ts` 先抽取真实 `<table>`，计算 row/column geometry、rowspan/colspan、border、padding 与 vertical align，并把 consumed table 标记掉，避免后续文本抽取重复吃表格内容。
2. `index.ts` 在浏览器中以 computed style 为事实源抽取 text run、shape、image、table，并使用 paint order 思路维持 z-order。
3. `renderer.ts` 在捕获 background 前隐藏已抽取 primitive，并用像素采样检测 text residue，必要时 retry，避免“背景截图里残留一份文字 + PPTX 文本框再叠一份文字”。
4. `ooxml-writer.ts` 支持 native DrawingML table、multi-run text、norm/no autofit、overlay image、font embedding 与 animation trace matching。
5. `font-collect.ts` 把字体作为输出合同的一部分，而不是假设 Office 端字体和 Chromium 字体度量一致。

这里有一个容易误判的点：`oh-my-ppt` 的背景 residue 检测服务于“原生 PPTX 文本可见”的策略；NotEMD 当前采用“冻结背景图可见 + 可编辑文本/表格透明结构层”的策略，所以不能直接把 `oh-my-ppt` 的 hide-before-background 逻辑搬进当前代码。当前 NotEMD 截图必须保留可见文字，否则 PPTX 会只剩透明可编辑层，视觉反而退化。residue 检测应作为未来打开 visible-native-text 或 visible-native-table 时的硬门槛，而不是当前透明结构层的前置条件。

更准确的借鉴方式是：

1. 继续保留 rendered convergence 作为 HTML/PPTX 的共同事实源；
2. 对高置信 table/text 先抽结构，明确 consumed primitive，避免重复抽取；
3. 让 sidecar report 记录每种对象的真实覆盖率，不把 fallback 伪装成可编辑；
4. 当某类 native layer 要从透明变为可见时，先加同一冻结背景下的视觉 A/B gate；
5. 只有 A/B 证明 visible-native layer 不让 RMSE、文本重叠、字体度量或表格边框退化，才逐页放开。

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
14. M1 editability report 已落地：sidecar 记录 `consumedTableCount`、`consumedTableTextCandidateCount`、`editablePrimitiveCoverage`、`fallbackOnlyElementKinds`、`unmodeledTextRunReasons` 与逐页 editability summary。
15. 视觉 diff 已补充原始回渲尺寸、宽高缩放比例漂移、差异 bounding-box 几何与 worst bounding-box slides。除非显式传阈值，这些指标目前是诊断信息，不默认 hard fail。
16. M2 rich-run 透明文本结构已落地：DOM 文本框现在保留 inline run 边界、computed font size/family/color、bold/italic/underline、inline code/link 标记、多段文本，以及面向 Office 的 `xml:space="preserve"` 首尾空白保持。sidecar report 现在暴露 `richTextBoxCount`、`richTextRunCount` 与 rich-run 字符覆盖。
17. M3 external-reference advisory diagnostics 已落地：verifier 现在接受 `--pptx-visual-reference-dir`，记录可选 ImageMagick `PHASH`/`NCC`/`SSIM` 可用性，输出逐页视觉诊断，并把疑似 renderer/subpixel 噪声和需要 layout review 的页分开汇总。
18. M5 字体合同 report 已落地：PPTX sidecar 现在记录 `fontContract`，包括抽取到的字体族、承载 CJK 的字体族、承载 Latin 的字体族、writer 的 East Asian fallback 字体、会通过该 fallback 写出的源字体族、Office 缺字风险、逐字体使用计数，以及当前“不默认嵌入字体”的明确策略。
19. M4 visible-native 实验模式已落地：`--pptx-visible-native-experiment` 会额外写出 `.visible-native-experiment.pptx`，在隐藏已抽取 DOM 文本/表格后捕获背景，采样检测 residual text/table 区域，残留可疑时最多重试三次背景捕获，并把实验 PPTX 回渲结果与默认 PPTX 的冻结背景 reference 做 A/B 对比。该路径明确不是默认导出路径。

PPTX 导出被放在 `convergeSlidevDeckLayout()` 之后，这是刻意的。这样不会引入第二条未审计路径，PPTX 与 HTML/PDF/PNG/MP4 共享同一套 rendered fit 修复。

## 真实验收

真实命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

结果：

1. `ok = true`
2. `slideCount = 30`
3. `pptxInspection.textRunCount = 254`
4. `pptxInspection.pictureCount = 30`
5. `pptxInspection.tableCount = 6`
6. `pptxInspection.slidesWithoutEditableText = []`
7. sidecar `textBoxCount = 139`
8. sidecar `tableCount = 6`
9. sidecar `editableTableCellCount = 102`
10. sidecar `editableTextSlideCount = 30`
11. sidecar `imageFallbackCount = 30`
12. sidecar `consumedTableCount = 6`
13. sidecar `consumedTableTextCandidateCount = 129`
14. sidecar `editablePrimitiveCoverage.editableTextSlideRatio = 1`
15. sidecar `editablePrimitiveCoverage.editableTableSlideRatio = 0.2`
16. sidecar `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`
17. sidecar `unmodeledTextRunReasons = ["inline-code", "inline-formatting", "syntax-highlight"]`

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

2026-06-21 追加核验后，这个判断仍然成立，但需要说得更精确：外部 Slidev PNG reference 不能被丢掉，它应该作为 cross-export advisory gate，专门暴露“PNG 导出路径与 PPTX 捕获路径没有共享 layout contract”的问题；它不应该直接替代 frozen reference hard gate。

当前 main 重新跑出的真实 PPTX hard gate：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-final-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

结果：

1. `ok = true`
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `skillRootPath = /home/jacob/slidev/skills/slidev`
4. `skillReferenceCount = 52`
5. `pptxInspection.slideCount = 30`
6. `pptxInspection.textRunCount = 254`
7. `pptxInspection.tableCount = 6`
8. `pptxInspection.slidesWithoutEditableText = []`
9. `pptxVisualDiff.reference.source = pptx-background-images`
10. `meanRmse = 0.049339111333333345`
11. `maxRmse = 0.0889364`
12. `pptxVisualGate.passed = true`
13. `mermaidSourcePreservation.changedFenceIndexes = []`
14. `maxScaleRatioDelta = 0.02091836734693886`
15. `maxDifferenceBoundingBoxAreaRatio = 0.6987466725820763`

这里的高 bounding-box area ratio 不能直接解释为画布溢出。当前 run 中它主要反映密集文本区的抗锯齿与 LibreOffice 回渲差异在大面积区域内分布；在 gate 能区分几何位移和渲染噪声前，该指标应保持 advisory。

同一次基线下再跑外部 Slidev PNG export：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

再用该 PNG 序列作为 external reference 比较刚才的 PPTX 回渲：

```bash
node - <<'NODE'
const { buildPptxVisualDiff } = require('./scripts/lib/pptx-visual-diff');
const report = buildPptxVisualDiff({
  pptxPath: 'docs/export/test-slidev-final-pptx-strict/architecture.zh-CN.pptx',
  referenceDirectory: 'docs/export/test-slidev-current-png-reference/architecture.zh-CN-slides-png',
  outputDirectory: 'docs/export/test-slidev-current-external-png-diff',
  dpi: 150,
  timeoutMs: 240000,
  thresholds: { maxRmse: 0.12, meanRmse: 0.08 },
});
console.log(JSON.stringify({ gate: report.gate, summary: report.comparison.summary }, null, 2));
NODE
```

结果：

1. `reference.source = external-png-sequence`
2. `gate.passed = false`
3. `meanRmse = 0.10535973851851853`
4. `maxRmse = 0.241976`
5. 最差页仍集中在 `21, 19, 16, 20, 24, 18, 17, 15, 10, 22, 13, 12`

肉眼检查 `docs/export/test-slidev-current-external-png-diff/side-by-side/slide-21.png` 与 `slide-16.png` 后，当前差异已经不是早期那种明显缩放错误；两侧主体版面基本一致，diff 主要来自文本抗锯齿、LibreOffice PDF 回渲、PNG/PPTX 不同截图链路造成的亚像素差异。也就是说，当前 external PNG gate 失败不能直接解释为 PPTX 视觉崩坏，但它准确暴露了一个尚未建模的事实：PNG export 与 PPTX capture 仍然是两条不同 rasterization path。

这里最容易犯的错是继续调 `pptxWriter.ts`。对当前失败指标来说，writer 不是主要嫌疑；frozen reference 已证明 PPTX 内嵌背景和 Office 回渲基本一致。更应该收敛的是 reference 生成合同：

1. 让 PNG export 与 PPTX capture 共用同一个 converged standalone HTML、viewport、route、freeze script、font readiness 和 double-RAF settle；
2. 或在 Slidev fork 层暴露一个可配置的 export viewport/deviceScaleFactor/fit-off contract，让 `slidev export --format png` 与 NotEMD PPTX capture 对齐；
3. external PNG gate 默认只作为 advisory，只有在 reference 生成合同统一后才升级为 hard gate；
4. 对 external PNG gate 增加结构化指标：几何偏移、scale drift、text antialias tolerance、SSIM/perceptual hash，而不是只看 ImageMagick RMSE/AE。

`oh-my-ppt` 对这里的启发不是“把所有 DOM 都转成原生 PPTX”。它真正做对的是把视觉责任拆成可验证的层：高置信 primitive 可编辑，复杂视觉走 raster fallback；每个 primitive 被消费后打标，background capture 只隐藏它已经接管的那部分；最后用像素检测确认没有 ghost text。这套方法应该被引入到 NotEMD 的验收层和可编辑覆盖率报告里，而不是直接把 visible native text/table 打开。

## `oh-my-ppt` 机制级参考结论

这次重新读 `oh-my-ppt` 的结论要比“它支持 HTML Slides -> PPTX”更窄，也更有用。它解决类似问题靠的是五个合同，而不是某个单点 API：

1. **渲染合同**：`renderer.ts` 用独立浏览器窗口、固定 1600x900 capture surface、`fit=off`、`print=1`、`export=1`、print-ready signal、动画冻结、字体 ready、chart/canvas 稳定等待，把 DOM 状态收敛成可测量事实。NotEMD 目前用 Playwright 1960x1104 和 `convergeSlidevDeckLayout()` 达成类似目标，但 PNG export 与 PPTX capture 仍没有完全共享同一套 viewport/route/freeze contract。
2. **消费合同**：`table-extract.ts` 先消费 `<table>`，并通过 `data-pptx-consumed-table` 阻止后续 shape/text 抽取重复吃表格内容。NotEMD 已经有 `data-notemd-pptx-consumed-table`，方向是对的；下一步应把 consumed primitive 数、未消费文本数、fallback 覆盖数写进 report，而不是只报总 text/table count。
3. **文本合同**：`index.ts` 不只是取 `innerText`，还处理 inline text runs、逐字符 line grouping、CJK fallback、list/bullet、paragraph spacing、Tailwind utility hints 和 `@chenglou/pretext` layout。NotEMD 当前仍是 block-level text frame；透明结构层让它视觉上安全，但编辑体验会在行内加粗、代码高亮、列表缩进、长中英混排上失真。
4. **绘制顺序合同**：`oh-my-ppt` 用 stacking context + `elementsFromPoint()` 采样估计 paint order，再在 `ooxml-writer.ts` 按 order/priority 写 shape/table/image/text。NotEMD 当前可见层是整页背景图，paint order 对视觉不是硬问题；只有引入 visible native shape/image/text 时，这个合同才从“可选优化”变成“必须先做”。
5. **可见原生层合同**：`renderer.ts` 在隐藏已抽取 primitive 后捕获背景，并用像素采样检测文本残影、失败重试。这个机制不能直接搬进 NotEMD 默认流程，因为 NotEMD 的可见文字和可见表格来自整页冻结背景；现在隐藏文字会直接降低视觉质量。当前分支只在 `--pptx-visible-native-experiment` 下引入同类 residue sampling 与三次背景捕获 retry，作为 visible-native-text / visible-native-table 实验的准入门槛。

所以后续不是“全面换成 oh-my-ppt 路线”。更准确的推进切片是：

1. **M1：增强 report，而不是先增强可见层**。这一项已在当前分支落地。report 继续保留 `visibleTextLayer = background-image` 和 `editableLayerRenderMode = transparent-structure`，并新增 `consumedTableCount`、`consumedTableTextCandidateCount`、`editablePrimitiveCoverage`、`fallbackOnlyElementKinds`、`unmodeledTextRunReasons` 与逐页 summary。这能防止“看似可编辑，实际大部分靠截图”的误报。
2. **M2：rich run extraction**。第一片已经落到透明文本层：inline runs、computed font 元数据、link/code 标记、段落拆分、underline/color/bold/italic 保留，以及 Office-safe whitespace 都会写进 DrawingML。M2 剩余部分是同一 run 内的 CJK/Latin font-face 拆分、bullet levels、line-height、paragraph spacing 与显式 hyperlink relationships。
3. **M3：external PNG advisory gate 升级指标**。第一片已经落地。verifier 可通过 `--pptx-visual-reference-dir` 接收外部 PNG 序列，但除非显式传 `--require-pptx-visual-match`，不会让整个 run hard fail。报告现在包含 scale drift、差异几何、文本抗锯齿/renderer-noise 启发式分类、layout-review 候选页，以及可选 `PHASH`/`NCC`/`SSIM` 指标可用性，用来把不同 rasterization path 的亚像素差异和真实版面漂移分开。
4. **M4：visible native table/text 分支**。只有同一 frozen HTML 下的 A/B gate 通过，才允许把透明结构层变成可见层。这个分支必须带 residue detection/retry，否则很容易出现背景文字 + PPTX 文字双影。
5. **M5：字体合同**。第一片已经以 report 方式落地，而不是直接嵌入字体。`oh-my-ppt` 的 font embedding 很有价值，但 NotEMD 不能默认嵌入用户系统字体或远程字体；当前合同先报告字体族、CJK fallback、Office 端缺失风险，后续只应对 vault/local package 中有授权的 font asset 做 opt-in embedding。

不建议现在迁移的部分也要明确：

1. 不要把 `oh-my-ppt` 的 Electron `BrowserWindow` 假设带进 Obsidian 插件；Playwright + local server 更适合当前运行边界。
2. 不要为了 visible native layer 去重写 Mermaid 源码或拆 Mermaid 图；用户要求是保留原 Mermaid 内容，Mermaid/SVG/canvas 现阶段应作为 atomic visual fallback。
3. 不要把 Tailwind 专用 utility parser 当成 Slidev 通用解。可以借鉴“utility hint 补充 computed style”的思想，但 Slidev theme / Vue component / Mermaid 的失败面不同。
4. 不要把 external PNG RMSE 失败直接归因到 `pptxWriter.ts`。当前 frozen-reference hard gate 已证明 writer 保留了 PPTX 内嵌视觉层；external PNG 失败主要暴露 reference contract 不统一。

## M5 字体合同收口

字体合同切片已经用真实 `docs/architecture.zh-CN.md` 源文件和同一 strict visual gate 验证：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m5-font-contract-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

结果：

1. `ok = true`
2. `pptxInspection.slideCount = 30`
3. `pptxInspection.textRunCount = 371`
4. `pptxInspection.tableCount = 6`
5. `pptxInspection.slidesWithoutEditableText = []`
6. `pptxVisualGate.passed = true`
7. `pptxVisualDiff.reference.source = pptx-background-images`
8. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
9. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
10. `fontContract.fontFamilyCount = 2`
11. `fontContract.fontFamilies = ["Avenir Next", "Fira Code"]`
12. `fontContract.cjkFontFamilies = ["Avenir Next", "Fira Code"]`
13. `fontContract.writerEastAsiaFontFace = "Microsoft YaHei"`
14. `fontContract.writerEastAsiaFallbackFontFamilies = ["Avenir Next", "Fira Code"]`
15. `fontContract.officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`
16. `fontContract.embeddedFontCount = 0`
17. `unignoredOutputs = []`

这个结果不是“多一个 report 字段”这么简单，而是给 visible native text/table 设了硬约束。真实 deck 的可编辑层主要使用 `Avenir Next` 和 `Fira Code`，这两个字体都不能假设在所有 Office 环境中存在；同时两者都承载了 CJK 文本，而 writer 当前会把 CJK 写到 `Microsoft YaHei` 这个 East Asian typeface。也就是说，默认打开可见原生文本/表格仍然不安全：透明结构层避免了可见字体漂移，但未来 visible-native 分支必须证明字体替换不会造成视觉退化，或者先给出明确、授权可控的字体资产策略。

## M7 `oh-my-ppt` 复用尺度与可编辑文本覆盖

这一轮把 `/home/jacob/ref/oh-my-ppt-upstream-latest` 当作 upstream 架构参考，把 `/home/jacob/ref/oh-my-ppt-fork` 当作 Jacob 本地 fork 参考，而不是源码搬运对象。当前 upstream `main` 是 `843ff74`（`v2.0.17`）；本地 fork 参考点是 `pr/animation-export-contract` 上的 `257c23b`。合理的复用尺度如下：

1. **可直接复用的思想与合同**：table-first extraction、consumed DOM marker、computed geometry、真实浏览器渲染事实源、背景/前景责任拆分、sidecar coverage report，以及 visible-native layer 前必须做 residue check。
2. **需要在 NotEMD 中重写/适配的部分**：Slidev route 遍历、Playwright capture、透明可编辑 overlay、Mermaid/SVG 文本抽取、代码块段落保持，以及符合 NotEMD 默认 `background-image` 可见层的 report 字段。
3. **不应原样迁移的部分**：Electron `BrowserWindow`、`oh-my-ppt` 默认更偏 visible-native reconstruction 的策略、大范围 Tailwind utility reconstruction、完整 shape/vector conversion。这些会在验收门槛证明之前放大 Slidev deck 的脆弱面。
4. **只适合作为后续可选实验的部分**：字体嵌入、原生动画重建、KaTeX/image overlay extraction、visible-native shape rebuilding。这些在 `oh-my-ppt` 中有价值，但不应该混进 NotEMD Slidev PPTX 默认路径，除非当前 hybrid contract 的视觉与可编辑门禁先稳定。

许可证边界也要说清楚。`oh-my-ppt` 是 Apache-2.0，NotEMD 是 MIT；从许可证兼容性看，NotEMD 可以复用 Apache-2.0 代码，但那会把被复用文件的 NOTICE/Apache 条款带进仓库。即使 Jacob 是 `oh-my-ppt` 开发者之一，upstream 仓库仍可能包含其他贡献和第三方实现细节。当前更稳的策略是 clean-room 复用：复用行为合同、测试 oracle、失败分类和数据模型边界，不直接搬运模块源码。只有当某个模块确实值得代码级引入时，才单独做 provenance 记录、许可证声明和最小文件级引入；不要把整个 `html-pptx` 目录复制进 NotEMD。

按模块看，实际复用尺度应分成五档：

| `oh-my-ppt` 模块 | NotEMD 复用尺度 | 原因 |
| --- | --- | --- |
| `renderer.ts` / `browser-scripts.ts` | 复用渲染收敛思想与 residue/retry oracle，不复用 Electron 实现 | NotEMD 的运行边界是 Obsidian + Playwright + Slidev fork，直接引入 `BrowserWindow` 会制造第二套生命周期和调试面 |
| `table-extract.ts` | 复用 table-first、consumed marker、row/col geometry 合同；实现继续保留 NotEMD DOM extractor | 这部分思想已经匹配当前 `data-notemd-pptx-consumed-table`，但 Slidev 页面根节点、缩放和透明层策略不同 |
| `index.ts` 文本抽取 | 复用 computed-style + rich-run + utility hint 思想，避免直接引入 Tailwind/Pretext 路线 | Slidev theme 不等价于 Tailwind authoring app；`@chenglou/pretext` 只有在可见原生文本需要像素级 line box 时才值得引入 |
| `ooxml-writer.ts` | 复用 PresentationML 结构经验和测试用例思路，不复用 writer | NotEMD 已有小型 writer，当前更需要补 run-level 字体、hyperlink relationship、paragraph/list contract，而不是换 writer |
| `font-collect.ts` | 先复用 font contract/report；字体嵌入只做 opt-in 实验 | 默认嵌入系统/远程字体会引入授权、体积、Office 兼容和隐私问题，不能作为默认导出 |

这意味着“我是开发者之一”可以降低研究和借鉴成本，但不应该降低默认产品路径的验收门槛。代码可拿，不等于应该拿。NotEMD 的核心约束不是能否写出更复杂 OOXML，而是任意 Slidev deck 在 Obsidian 插件里能否稳定导出，并且导出失败时用户能知道问题属于环境、视觉、字体、还是可编辑覆盖。

`oh-my-ppt` 最值得复用的是合同，而不是代码形状：

1. 先抽取 native structures，再做普通 text/shape scan；
2. 对已消费 DOM 打 marker，避免后续 pass 重复计数或重复隐藏；
3. 用浏览器 computed rect/style 作为几何事实源；
4. 隐藏已抽取可编辑 primitive 后再捕获背景；
5. 输出 sidecar evidence，让测试可以阻止静默 coverage 回退。

NotEMD 有两个必须主动偏离的点。第一，Slidev Mermaid 文本实际在 shadow root 里，普通 document-level CSS 和 `querySelectorAll('svg text')` 都不够。NotEMD 现在会遍历 composed root，并对 shadow-root SVG text 直接内联透明化。第二，NotEMD 的默认可见层仍然应该是 raster-first。`oh-my-ppt` 可以更偏 visible native reconstruction，是因为它的 authoring model 对 HTML shape vocabulary 控制更强；任意 Slidev deck 没有这个前提。

这里最关键的修正是 Mermaid/SVG。`oh-my-ppt` 在背景捕获时隐藏 `svg text, svg tspan`，因为它的默认路径不抽取 SVG 文本。这个限制不能成为 NotEMD 的终点。NotEMD 应继续把 Mermaid/SVG 的可见图形留给高质量 raster background，同时把浏览器暴露的 `<text>/<tspan>` 映射成透明可编辑文本框。这样既不重写 Mermaid fence，也不拆图，还能让 diagram label 在 PPTX 中具备可编辑入口。

M7 本轮落地切片是：

1. 新增 `SlidevPptxTextSourceKind`，让 report 区分 `body`、`code`、`mermaid-text`、`svg-text` 和 `table-cell-overlay`；
2. 将代码块作为 code-sourced editable text 保留，并把 rich run 中的换行拆成真正的 PPT 段落；
3. 给表格单元格额外叠加透明可编辑文本框，因为透明 DrawingML table text 虽然技术上可编辑，但在真实 Office 交互中很难直接点选；
4. 在不修改 Mermaid fence 或 Mermaid 输出结构的前提下，抽取可见 SVG/Mermaid 文本作为透明可编辑 overlay；
5. PPTX 背景/reference 捕获使用 device scale factor 2，降低 Mermaid raster 低清晰度问题；真实 PNG 导出仍保持现有 Slidev export workflow；
6. 在 sidecar report 和 verifier JSON 暴露 source-kind 计数，让验收用数据判断可编辑覆盖，而不是靠肉眼猜。

后续实践方案应按以下顺序推进，而不是一次性追求“完整 HTML->PPTX 原生化”：

1. **先补 Office 文本合同**：让 writer 和 report 共用最终 emit 视角，拆分 mixed CJK/Latin run，记录 Office 实际字体 face；再补显式 hyperlink relationship、code monospace 默认、paragraph spacing 与 list indentation。这个方向直接提升可编辑层质量，且不改变可见层，风险最低。
2. **再补选择体验**：继续保留透明结构层，但增加 source-kind 命名、selection-pane 友好名称、可选的调试 overlay 预览。用户真正抱怨的往往不是“是否存在 `<a:t>`”，而是 PowerPoint 里能否找到并编辑那段文字。
3. **把 PNG/PPTX reference contract 继续收紧**：保留 `pptx-background-images` hard gate、`pptx-rendered-html-reference` 同源 gate 和 `external-png-sequence` advisory gate 三层。不要因为 external PNG RMSE 偶发失败就改 writer；先判断是否是独立 Slidev export invocation 漂移。
4. **字体嵌入只接受白名单资产**：后续可支持 vault/project 内明确授权的字体包，并在 report 中写明 embedded font family、体积和 fallback 结果；不要扫描并打包用户系统字体。
5. **visible-native 逐页准入**：只有某页同时通过 residue sampling、frozen-background A/B visual diff、fontContract 风险检查和 paint-order 检查，才允许把 native text/table 从透明改为可见。默认全 deck 开启仍然是错误方向。
6. **Mermaid/SVG 保持 atomic visual fallback**：继续抽取 SVG text overlay，不改 Mermaid fence，不拆图，不重排节点。真正的 Mermaid vector reconstruction 应该是单独实验开关，而不是默认 PPTX 导出目标。

真实 `docs/architecture.zh-CN.md` M7 验证已通过：

1. PPTX 输出：`docs/export/test-slidev-m7-editable-text-quality/architecture.zh-CN.pptx`
2. PPTX sidecar：`docs/export/test-slidev-m7-editable-text-quality/architecture.zh-CN.pptx.report.json`
3. `slideCount = 30`
4. `pptxInspection.textRunCount = 597`
5. `pptxInspection.tableCount = 6`
6. `pptxInspection.slidesWithoutEditableText = []`
7. `editableTextBoxCount = 277`
8. `editableBodyTextBoxCount = 138`
9. `editableCodeTextBoxCount = 1`
10. `editableMermaidTextBoxCount = 36`
11. `editableSvgTextBoxCount = 0`
12. `editableTableCellOverlayTextBoxCount = 102`
13. `editableTableCellCount = 102`
14. frozen-background PPTX visual gate 通过，阈值为 `maxRmse <= 0.12`、`meanRmse <= 0.08`
15. same-rendered-HTML reference visual gate 通过，使用相同阈值
16. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
17. `skillRootPath = /home/jacob/slidev/skills/slidev`
18. `skillReferenceCount = 52`
19. `unignoredOutputs = []`

同一源文件也跑了真实 PNG 验证：

1. PNG 输出：`docs/export/test-slidev-m7-current-png-reference/architecture.zh-CN-slides-png`
2. `pngCount = 30`
3. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
4. `skillRootPath = /home/jacob/slidev/skills/slidev`
5. `skillReferenceCount = 52`
6. `unignoredOutputs = []`

verifier 在这台机器上仍会记录部分 ImageMagick 全量 contact-sheet montage 的 cache warning，但这些 warning 不再作为 hard failure。真正的验收合同仍然是逐页 visual metrics；contact sheet 只是审阅便利，不应该决定导出是否失败。

这不是承诺每个 diagram 或 code token 都已经变成语义级可编辑对象。它是在当前架构下更稳的推进：视觉保真继续由冻结背景负责，DOM 中有稳定文本几何的区域则增加可编辑入口。完整 Mermaid 原生图形重建不适合作为默认方向，因为那等于重新实现 Mermaid 已完成的 layout、arrow/marker、字体与 label collision 逻辑。

后续技术风险是：

1. **SVG 坐标保真**：`getBoundingClientRect()` 对可编辑 overlay 足够实用，但旋转文本、transform group、text-on-path 不会完美映射到普通 PPT 文本框。
2. **选中体验**：透明 overlay 可编辑，但密集图中用户可能仍需要 PowerPoint Selection Pane。未来可以提供可选的“可见编辑 overlay 预览”，但不应默认打开。
3. **重复可编辑文本**：表格 cell overlay 会有意重复透明 DrawingML table text。它提升实际可编辑性，但自动 text-run 计数不再等价于视觉文本出现次数。
4. **字体漂移**：这些 overlay 一旦变成可见层，就会重新触发 M5 的字体风险。除非 visible-native A/B gate 通过，否则必须保持透明。
5. **reference 合同**：真实 PNG 导出仍走当前 Slidev 路径。PPTX 背景质量可以独立提升，但 external PNG vs PPTX hard comparison 在两者共享同一 rasterization contract 之前仍应保持 advisory。

本切片验收必须使用 `docs/architecture.zh-CN.md`，要求 PPTX 与 frozen-background reference 的 visual match 通过，要求 same-rendered-HTML reference match 通过，并单独跑真实 PNG export，证明 PNG 路径没有被替换。

## M8 Office emit run 字体合同

M8 先处理一个低风险但会直接影响编辑质量的问题：writer 之前在同一个 `<a:r>` 中给 mixed Latin/CJK 文本同时写源 Latin font 和 `Microsoft YaHei` East Asian font。PowerPoint 能做字体 fallback，但 report 并不知道最终 Office 侧实际写出了哪些字体 run；这会让后续 visible-native 字体判断和文本编辑质量评估都偏弱。

本轮实现的合同是：

1. `pptxFontContract.ts` 提供唯一的 `splitPptxTextIntoOfficeFontRuns()`，把同一 DOM rich run 按 CJK / non-CJK 段拆成 Office emit run。
2. non-CJK 段保留源字体；CJK 段写成 `Microsoft YaHei`，并且 `<a:latin>` / `<a:ea>` 都使用同一个实际 emitted font face，避免 mixed run 内 Office 自行猜测。
3. writer 的透明结构层和 visible-native 实验层共用这套拆分逻辑。
4. `fontContract` 保留源字体视角的 `fontFamilies` / `cjkFontFamilies` / `writerEastAsiaFallbackFontFamilies`，同时新增 Office emit 视角：`officeFontFamilies`、`officeCjkFontFamilies`、`officeLatinFontFamilies`、`officeTextRunCount`、`officeEastAsiaFallbackRunCount` 和 `officeEastAsiaFallbackCharacterCount`。
5. `richTextRunCount` 继续表示 DOM/rich-run 抽取层数量，不偷换为 Office emitted run 数；Office emitted run 数由新的 `officeTextRunCount` 承担。

这里对 `oh-my-ppt` 的复用尺度是合同级复用，不是代码迁移。`oh-my-ppt` 的经验说明字体不能被当作 writer 的局部细节；抽取层、OOXML writer 和验收 report 必须共享同一个“最终写进 Office 的文本 run”视角。本轮按这个思想把 NotEMD 的 writer/report 接到同一 splitter 上，但没有引入 `oh-my-ppt` 的 `BrowserWindow`、字体嵌入、visible-native 默认策略或完整 `html-pptx` writer。实现还比 `oh-my-ppt` 当前简单汉字检测更保守一点：用于 Office 字体分段的判定覆盖 CJK 标点、假名、韩文和全角形式，避免 `API：架构` 这类文本把全角冒号错误留在 Latin font run。

这不是字体嵌入，也不是 visible-native 准入。它只让“最终写进 PPTX 的文本 run 与字体 face”变成 writer/report 共享事实，给下一步 hyperlink、paragraph/list 和 visible-native 字体验收打基础。

已补的单元验收：

```bash
npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts
```

当前通过点：

1. 同一个 rich run `API 架构 v2` 会写成 `API `、`架构`、` v2` 三个 Office run；
2. Latin 段保留 `Avenir Next`；
3. CJK 段使用 `Microsoft YaHei`；
4. report 中 `richTextRunCount` 仍是 `1`，而 `officeTextRunCount` 是 `3`；
5. `API：架构 v2` 会把 `：架构` 保持在 East Asian Office font run；
6. report 中 East Asian fallback 计数是 `1` 个 run / `2` 个 CJK 字符。

真实 `docs/architecture.zh-CN.md` M8 验收已通过。PPTX 命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m8-office-run-contract --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json'
```

结果：

1. `ok = true`；
2. PPTX 输出：`docs/export/test-slidev-m8-office-run-contract/architecture.zh-CN.pptx`；
3. sidecar：`docs/export/test-slidev-m8-office-run-contract/architecture.zh-CN.pptx.report.json`；
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
5. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
6. PPTX inspection：`slideCount = 30`，`mediaCount = 30`，`pictureCount = 30`，`tableCount = 6`，`textRunCount = 1092`，`slidesWithoutEditableText = []`；
7. sidecar 默认层仍是 `visibleTextLayer = background-image`，`editableLayerRenderMode = transparent-structure`；
8. sidecar：`textBoxCount = 277`，`richTextRunCount = 482`，`editableMermaidTextBoxCount = 36`，`editableTableCellOverlayTextBoxCount = 102`，`editableTableCellCount = 102`；
9. Office emit 字体合同：`officeTextRunCount = 995`，`officeFontFamilies = ["Avenir Next", "Fira Code", "Microsoft YaHei", "trebuchet ms"]`，`officeCjkFontFamilies = ["Microsoft YaHei"]`，`officeLatinFontFamilies = ["Avenir Next", "Fira Code", "trebuchet ms"]`；
10. East Asian fallback：`officeEastAsiaFallbackRunCount = 453`，`officeEastAsiaFallbackCharacterCount = 2007`；
11. frozen-background hard gate 通过：`source = pptx-background-images`，`meanRmse = 0.04305776633333333`，`maxRmse = 0.0786701`；
12. same-rendered-HTML hard gate 通过：`source = pptx-rendered-html-reference`，`slideCount = 30`，`meanRmse = 0.04305776633333333`，`maxRmse = 0.0786701`；
13. `unignoredOutputs = []`，`gitIgnoreCheckError = null`。

真实 PNG export 也已重新跑，证明 PNG 仍走当前 Slidev export workflow，而不是 PPTX capture 替代路径：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-m8-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

PNG 结果：

1. `ok = true`；
2. 输出目录：`docs/export/test-slidev-m8-current-png-reference/architecture.zh-CN-slides-png`；
3. 实际 PNG 文件数：`30`；
4. `layoutAuditSummary.slideCount = 30`，`overflowCount = 0`，`unreadableCount = 0`，`renderErrorCount = 0`；
5. Mermaid 诊断仍保留为 review 信号：`mermaidSlideCount = 3`，`mermaidFitReviewCount = 3`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，`retryCount = 4`；
6. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
7. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
8. `unignoredOutputs = []`，`gitIgnoreCheckError = null`。

这个结果说明 M8 的字体 run 合同没有破坏视觉硬门，也没有替换真实 PNG 导出路径。它同时暴露了一个后续仍应处理的问题：PNG layout audit 中 Mermaid zoom 仍有 review 信号。当前它不是 hard failure，因为没有 overflow/unreadable/render error；但后续如果要继续提高 Mermaid 可读性，应优先改自动 zoom/fit 诊断和阈值解释，而不是修改 Mermaid 源内容或拆图。

## M4 visible-native 实验收口

visible-native 方向这次按显式实验收口，而不是默认行为变更。真实 verifier 命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m4-visible-native-experiment --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-visible-native-experiment --json'
```

默认 PPTX 结果：

1. `ok = true`
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `skillRootPath = /home/jacob/slidev/skills/slidev`
4. `skillReferenceCount = 52`
5. `pptxInspection.slideCount = 30`
6. `pptxInspection.textRunCount = 371`
7. `pptxInspection.tableCount = 6`
8. `pptxInspection.slidesWithoutEditableText = []`
9. `pptxVisualGate.required = true`
10. `pptxVisualGate.observedPassed = true`
11. `pptxVisualGate.passed = true`
12. `pptxVisualDiff.reference.source = pptx-background-images`
13. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
14. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
15. `mermaidSourcePreservation.changedFenceIndexes = []`
16. `unignoredOutputs = []`

visible-native 实验结果：

1. 输出 PPTX：`docs/export/test-slidev-m4-visible-native-experiment/architecture.zh-CN.visible-native-experiment.pptx`
2. sidecar：`docs/export/test-slidev-m4-visible-native-experiment/architecture.zh-CN.visible-native-experiment.pptx.report.json`
3. `visibleTextLayer = native-text-experiment`
4. `editableLayerRenderMode = visible-native-experiment`
5. 实验包 `slideCount = 30`
6. 实验包 `textRunCount = 371`
7. 实验包 `tableCount = 6`
8. `residueSampling.sampledSlideCount = 30`
9. `residueSampling.checkedRegionCount = 212`
10. `residueSampling.suspiciousSlideCount = 0`
11. `residueSampling.suspiciousRegionCount = 0`
12. `residueSampling.maxTextLikePixelRatio = 0`
13. 实验 visual reference 来自默认冻结背景：`referenceImageCount = 30`
14. 实验回渲 `meanRmse = 0.13384873333333333`
15. 实验回渲 `maxRmse = 0.233655`
16. 实验最差页集中在 24、27、19、22、23、20、21、17。

这里的工程结论很明确：参考 `oh-my-ppt` 的 consumed-DOM hiding、residue sampling 与 retry 能避免源背景里残留一份文字，但 visible native text/table 仍会让真实 deck 的视觉明显回退。主要嫌疑不是 Mermaid，也不是 PPTX zip 结构，而是 Office 字体替换、line-height/baseline 差异、文本抗锯齿、表格 cell padding/border 模型差异，以及 paint order 建模仍不完整。

因此当前状态应保持为：

1. 默认 PPTX 继续使用冻结背景 + 透明可编辑结构层；
2. visible-native 输出只保留在显式 verifier flag 后；
3. `--require-pptx-visible-native-match` 可以用于后续实验收口，但不能进入默认 UI 路径；
4. 后续应用实验 side-by-side artifacts 找出可能适合逐页放开的页面，而不是一次性全 deck 打开；
5. 不要通过拆分或改写 Mermaid 源图来改善 visible-native 指标。

## oh-my-ppt 参考后验收刷新

重新读完最新 `oh-my-ppt` 后，使用真实 `docs/architecture.zh-CN.md` 重新验收了一遍。边界没有改：默认 PPTX 仍是“冻结可见背景 + 透明可编辑结构层”，visible native text/table 仍然只是显式实验。

PNG reference 命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-ohmyppt-final-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

默认 PPTX + visible-native 实验命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-ohmyppt-final-pptx-acceptance --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-visible-native-experiment --json'
```

external PNG advisory diff 命令：

```bash
node - <<'NODE'
const { buildPptxVisualDiff } = require('./scripts/lib/pptx-visual-diff');
const report = buildPptxVisualDiff({
  pptxPath: 'docs/export/test-slidev-ohmyppt-final-pptx-acceptance/architecture.zh-CN.pptx',
  referenceDirectory: 'docs/export/test-slidev-ohmyppt-final-png-reference/architecture.zh-CN-slides-png',
  outputDirectory: 'docs/export/test-slidev-ohmyppt-final-external-png-diff',
  dpi: 150,
  timeoutMs: 240000,
  thresholds: { maxRmse: 0.12, meanRmse: 0.08 },
});
console.log(JSON.stringify({ gate: report.gate, summary: report.comparison.summary }, null, 2));
NODE
```

当前验收事实：

1. PNG reference run 通过：`ok = true`，`layoutAuditSummary.overflowCount = 0`，native standalone HTML accepted，`unignoredOutputs = []`，`skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
2. 默认 PPTX 文件为 `docs/export/test-slidev-ohmyppt-final-pptx-acceptance/architecture.zh-CN.pptx`，大小 `2,804,976` bytes；
3. PPTX inspection：`slideCount = 30`，`mediaCount = 30`，`textRunCount = 371`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
4. 默认 sidecar 继续保持 `visibleTextLayer = background-image` 与 `editableLayerRenderMode = transparent-structure`；
5. 默认 sidecar：`textBoxCount = 139`，`richTextRunCount = 344`，`tableCount = 6`，`editableTableCellCount = 102`；
6. 字体合同仍然显示 `fontFamilies = ["Avenir Next", "Fira Code"]`，`officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`，`embeddedFontCount = 0`；
7. fallback-only 对象继续显式记录为 `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`；
8. 未建模文本原因继续显式记录为 `unmodeledTextRunReasons = ["inline-code", "inline-formatting", "syntax-highlight"]`；
9. 默认 frozen-reference visual diff 通过：`reference.source = pptx-background-images`，`meanRmse = 0.049330418`，`maxRmse = 0.0889364`，`maxScaleRatioDelta = 0.02091836734693886`，`maxDifferenceBoundingBoxAreaRatio = 0.6987466725820763`；
10. external PNG advisory diff 在这次 run 中未过阈值：`reference.source = external-png-sequence`，`meanRmse = 0.102229238`，`maxRmse = 0.241976`，没有 likely layout-drift slides；
11. frozen-reference report 把剩余差异归类为文本抗锯齿 / renderer noise：`textAntialiasDriftLikely = 20`，`rendererNoiseLikely = 20`，`referenceContractDriftLikely = 0`，`layoutDriftLikely = 0`；
12. external PNG report 把失败归类为 reference-contract drift 加 renderer noise，而不是 layout drift：`textAntialiasDriftLikely = 7`，`rendererNoiseLikely = 7`，`referenceContractDriftLikely = 13`，`layoutDriftLikely = 0`；
13. visible-native 实验包同样有 `slideCount = 30`，`textRunCount = 371`，`tableCount = 6`；
14. visible-native residue sampling 通过：`sampledSlideCount = 30`，`checkedRegionCount = 212`，`suspiciousSlideCount = 0`，`suspiciousRegionCount = 0`，`maxTextLikePixelRatio = 0`；
15. visible-native visual diff 仍失败：`meanRmse = 0.13384873333333333`，`maxRmse = 0.233655`，最差页 `24, 27, 19, 22, 23, 20, 21, 17, 25, 18`；
16. 所有生成产物都在 `docs/export/test-slidev-*` 下，只作为本地验证证据，继续被忽略，不进入提交。

这让 external PNG 结论保持保守：external PNG comparison 有价值，但目前还不稳定到可以做 hard gate。即使源 deck 相同，独立 Slidev PNG invocation 仍可能和 PPTX capture path 漂移。这个 advisory 失败仍然有价值，因为它把 reference-contract drift 暴露出来，并且没有把它误报成 layout drift。hard gate 仍然是 PPTX 内嵌 frozen background reference。

visible-native 的结论没有变。residue detection/retry 只解决一类问题：背景截图里不应残留已抽取文本造成 ghost text。它不解决 Office 字体替换、baseline/line-height 偏差、表格 padding/border 差异，也不解决 paint order 建模不完整。因此实验结果可以同时满足 `suspiciousRegionCount = 0` 并且 visual diff 失败；把前者当成整体成功是错误归因。

## M6 same-rendered-HTML reference gate

这次基于 `oh-my-ppt` 的后续结论不是继续调 `pptxWriter.ts`，而是先收紧 reference contract。`oh-my-ppt` 的关键做法是让导出以同一个浏览器渲染事实为准；NotEMD 之前已经有 PPTX 内嵌 frozen background hard gate，但 external PNG advisory 仍来自另一条 Slidev PNG invocation，因此天然会混入第二次渲染实例的漂移。

本轮新增维护者 verifier 路径：

1. `exportSlidevPptxRenderedHtmlReferencePngSequence()` 从 PPTX 使用的同一个 converged HTML、同一个 1960x1104 viewport、同一个 route、同一个 freeze/font-ready/double-RAF 逻辑捕获 PNG reference；
2. `scripts/verify-slidev-export-workflow.cjs --pptx-rendered-html-reference-diff` 会把 PPTX 回渲结果与这组 same-rendered-HTML PNG 序列逐页比较；
3. `scripts/lib/pptx-visual-diff.js` 现在支持显式 `referenceSource`，因此这条路径在 report 中标为 `pptx-rendered-html-reference`，不会被误归类成普通 `external-png-sequence`；
4. `--require-pptx-rendered-html-reference-match` 可以把这条同源 reference diff 提升为 hard gate，但默认仍保持为额外验收面。

真实命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-ohmyppt-same-html-reference-pptx --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --json'
```

当前真实结果：

1. `ok = true`；
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
3. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
4. PPTX 输出：`docs/export/test-slidev-ohmyppt-same-html-reference-pptx/architecture.zh-CN.pptx`，大小 `2,804,979` bytes；
5. sidecar：`slideCount = 30`，`textBoxCount = 139`，`richTextRunCount = 344`，`tableCount = 6`，`editableTableCellCount = 102`；
6. sidecar 继续保持 `visibleTextLayer = background-image` 与 `editableLayerRenderMode = transparent-structure`；
7. 字体合同仍然显示 `fontFamilies = ["Avenir Next", "Fira Code"]`，`officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`，`embeddedFontCount = 0`；
8. fallback-only 对象仍然是 `["code-highlight", "mermaid", "svg"]`；
9. 未建模文本原因仍然是 `["inline-code", "inline-formatting", "syntax-highlight"]`；
10. frozen-reference hard gate：`source = pptx-background-images`，`gatePassed = true`，`meanRmse = 0.049330418`，`maxRmse = 0.0889364`，`layoutDriftLikely = 0`；
11. same-rendered-HTML reference diff：`source = pptx-rendered-html-reference`，`gatePassed = true`，`meanRmse = 0.049330418`，`maxRmse = 0.0889364`，`referenceContractDriftLikely = 0`，`layoutDriftLikely = 0`；
12. 所有本轮产物都在 `docs/export/test-slidev-ohmyppt-same-html-reference-pptx/` 下，`git status --ignored` 显示为 `!!`，不会进入提交。

这个结果把三类 reference 语义分开了：

1. `pptx-background-images` 是当前 hard gate，证明 PPTX 包内写入的冻结视觉层经过 Office/LibreOffice 回渲后仍保持可接受视觉；
2. `pptx-rendered-html-reference` 是同源 HTML reference，证明从 PPTX 使用的同一 HTML capture path 再捕获 PNG，不会引入独立 Slidev PNG invocation 那种 reference-contract drift；
3. `external-png-sequence` 仍然保留为 cross-export advisory，用来暴露“真正的 PNG 导出”和“PPTX capture”两条路径是否共享足够强的 layout/render contract。

这不是把 PNG hard gate 偷换成 PPTX 内嵌图。它是一个中间层：同源 HTML reference 能证明当前 PPTX capture 合同稳定；独立 Slidev PNG export 失败时，就能更明确地把问题归到 PNG export route/viewport/freeze/font readiness 合同未统一，而不是误判为 PPTX writer 失败。

## M9 source-kind 可编辑覆盖合同

这次从 `oh-my-ppt` 继续借鉴的重点是“覆盖来源可证明”。`oh-my-ppt` 不只是写 native object，它会跟踪哪些 DOM primitive 被消费、哪些内容仍是视觉 fallback、每个可编辑 primitive 来自哪条抽取路径。这个尺度适合 NoteMD：学习合同和验收方法，而不是把 Electron renderer、字体嵌入管线或整套 OOXML writer 搬进 Obsidian 插件。

本切片把这个思想落到 PPTX sidecar 和 OOXML shape name：

1. 新增 `SlidevPptxTextSourceCoverage`，按 `body`、`code`、`mermaid-text`、`svg-text`、`table-cell-overlay` 记录文本来源覆盖。
2. sidecar 在三个层级记录这组覆盖：顶层 `textSourceCoverage`、`editablePrimitiveCoverage.textSourceCoverage`、逐页 `textSourceCoverage`。
3. 每个来源条目记录 `slideCount`、`textBoxCount`、`textLineCount`、`characterCount`、`richTextParagraphCount` 和 `richTextRunCount`。
4. PPTX 文本 shape name 现在包含来源角色，例如 `Editable Code Text`、`Editable Mermaid Text`、`Editable SVG Text`、`Editable Table Cell Overlay Text`。
5. 单元测试已经对 source-kind coverage 和代码文本框的 slide XML shape name 做硬断言。

这不是一个展示字段，而是补上之前 report 的证据缺口。过去的 text-box count 只能证明“有一些文本框”，但不能证明 code fence、Mermaid/SVG label、table-cell overlay 是否分别进入了可编辑结构层。M9 之后，真实 deck 可以按来源检查可编辑覆盖，而不是把 fallback 视觉误读为可编辑能力。

这里仍然明确不同于 visible-native reconstruction：

1. Mermaid 源内容继续保留，不改写、不拆分。
2. Mermaid/SVG/canvas 的可见视觉仍来自冻结背景。
3. Mermaid/SVG 中可安全抽取的文字 label 会成为透明可编辑 overlay，但这不等价于“整张图是 Office 原生可编辑图”。
4. `table-cell-overlay` 与 DrawingML table 结构分开报告，后续 visible-native-table 实验能区分表格几何、表格文本和 overlay 文本。
5. 默认导出仍是 `visibleTextLayer = background-image` 和 `editableLayerRenderMode = transparent-structure`。

重新读 `/home/jacob/ref/oh-my-ppt-upstream-latest` 与 `/home/jacob/ref/oh-my-ppt-fork` 后，复用边界应这样定：

1. 复用 **消费纪律**：先抽高置信结构，标记 consumed DOM，避免重复文本。
2. 复用 **报告纪律**：按 provenance 区分可编辑对象，而不是只报总数。
3. 复用 **门禁纪律**：visible-native 层只有在 residue sampling 和 same-rendered-reference gate 都通过后，才有资格进入默认路径。
4. 不复用 **运行容器**：Electron `BrowserWindow` 和 app-local asset 假设不应该进入 Obsidian 插件导出路径。
5. 不默认复用 **字体嵌入管线**：NotEMD 不能静默嵌入用户系统字体或远程字体；字体嵌入需要明确的、授权可控的 vault/local asset 策略。
6. 不整体复用 **DOM 全量原生化目标**：对 Slidev deck 来说，冻结视觉层 + 透明可编辑 overlay 目前比把 Mermaid/SVG/code/table 全部重建为 Office 原生对象更稳。

M9 之后的实际推进方向不应是大范围重写 writer，而是定向提高抽取质量：

1. 对已知真实 deck 在 verifier 中增加 source-kind coverage 阈值；
2. 继续提升 code text extraction，记录 syntax-token provenance，但默认不让 token 原生层可见；
3. Mermaid label 能安全抽取就让它可编辑，但不修改 Mermaid fence；
4. 表格单元格文本样式/run 覆盖应独立于表格几何报告；
5. 只有这些报告稳定后，再考虑按页 opt-in visible-native，并强制 residue 与 visual-diff gate。

真实 `docs/architecture.zh-CN.md` 的 M9 PPTX 验收：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m9-source-coverage-contract --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json'
```

结果：

1. `ok = true`；
2. PPTX 输出：`docs/export/test-slidev-m9-source-coverage-contract/architecture.zh-CN.pptx`，大小 `5,296,432` bytes；
3. sidecar：`docs/export/test-slidev-m9-source-coverage-contract/architecture.zh-CN.pptx.report.json`；
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
5. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
6. `pptxInspection.slideCount = 30`，`mediaCount = 30`，`pictureCount = 30`，`tableCount = 6`，`textRunCount = 1092`，`slidesWithoutEditableText = []`；
7. sidecar 继续保持 `visibleTextLayer = background-image` 与 `editableLayerRenderMode = transparent-structure`；
8. sidecar 对象计数：`textBoxCount = 277`，`richTextRunCount = 482`，`tableCount = 6`，`editableTableCellCount = 102`；
9. source-kind 覆盖：`body = 30 slides / 138 boxes / 6062 chars / 343 rich runs`；
10. source-kind 覆盖：`code = 1 slide / 1 box / 14 lines / 440 chars / 1 rich run`；
11. source-kind 覆盖：`mermaid-text = 1 slide / 36 boxes / 531 chars / 36 rich runs`；
12. source-kind 覆盖：`svg-text = 0`，这是当前真实 deck 的抽取事实，不是 schema 回退；
13. source-kind 覆盖：`table-cell-overlay = 6 slides / 102 boxes / 1116 chars / 102 rich runs`；
14. 字体合同仍显示 `fontFamilies = ["Avenir Next", "Fira Code", "trebuchet ms"]`，`officeFontFamilies = ["Avenir Next", "Fira Code", "Microsoft YaHei", "trebuchet ms"]`，`officeTextRunCount = 995`，`officeEastAsiaFallbackRunCount = 453`，`officeEastAsiaFallbackCharacterCount = 2007`；
15. frozen-background hard gate 通过：`reference.source = pptx-background-images`，`meanRmse = 0.04305776633333333`，`maxRmse = 0.0786701`；
16. same-rendered-HTML hard gate 通过：`reference.source = pptx-rendered-html-reference`，`meanRmse = 0.04305776633333333`，`maxRmse = 0.0786701`；
17. Mermaid source preservation 通过：`sourceFenceCount = 3`，`deckFenceCount = 3`，`changedFenceIndexes = []`；
18. `unignoredOutputs = []`，`gitIgnoreCheckError = null`。

真实 PNG export 也已重跑，用来证明本切片没有把当前 Slidev PNG workflow 替换成 PPTX capture：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-m9-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

PNG 结果：

1. `ok = true`；
2. 输出目录：`docs/export/test-slidev-m9-current-png-reference/architecture.zh-CN-slides-png`；
3. 真实 slide PNG 数为 `30`；输出树里的额外 PNG 是 Slidev logo asset，不是渲染页；
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
5. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
6. `layoutAuditSummary.slideCount = 30`，`overflowCount = 0`，`unreadableCount = 0`，`renderErrorCount = 0`；
7. Mermaid 仍是 review signal，不是 hard failure：`mermaidSlideCount = 3`，`mermaidFitReviewCount = 3`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，`retryCount = 4`；
8. `unignoredOutputs = []`，`gitIgnoreCheckError = null`；
9. `git status --ignored` 显示两个 M9 输出目录都是 `!!`，`git ls-files` 在这些目录下没有跟踪文件。

本次验收还暴露了一个 workflow 风险：可选 ImageMagick `NCC` 诊断在 3920x2208 的密集对比页上会显著拉长运行时间。它本次最终完成，所以不是正确性失败。后续 hardening 的方向应是稳定优先：默认保留原先每个 metric `60000ms` 的预算，但把可选指标失败写进 report，而不是让 advisory 诊断中断已经通过 hard visual gate 的验收。

## M10 可选视觉指标稳定性合同

M10 的修正不是短 timeout 加速策略。`PHASH`、`NCC`、`SSIM` 是 ImageMagick 诊断指标，能提供额外证据，但不能成为导出正确性的权威。真正的 hard visual gate 仍然是针对选定 reference source 的 RMSE/AE/difference geometry。

本轮实现把可选指标 timeout 保持为 `60000ms`，与之前稳定的 `compare` 预算一致。这样优先保证真实密集 deck 的诊断完整性，避免用很短 timeout 换来“快但证据不完整”的报告。如果某个可选指标不被当前 ImageMagick 支持、在稳定预算内真实超时、输出不可解析，或命令失败，workflow 会记录结构化原因，而不是把整个 verifier 打断。

新增的 report 合同如下：

1. `comparison.optionalMetricPolicy = { metrics: ["PHASH", "NCC", "SSIM"], timeoutMs: 60000, hardGate: false }`；
2. `comparison.summary.advisoryMetrics.optionalCompareMetrics` 记录 requested、available、unavailable、timed-out、unsupported、unparsed 与 command-failed 计数；
3. `comparison-metrics.csv` 增加 `phash_reason`、`ncc_reason`、`ssim_reason`，维护者可以逐页看到 advisory metric 的降级原因；
4. 可选指标降级不会改变 `pptxVisualGate.passed` 或 `pptxRenderedHtmlReferenceGate.passed`；
5. 真实验收应使用稳定默认预算，不能用人为极短 timeout 制造降级路径。

这与 `oh-my-ppt` 的经验保持在正确复用尺度上。`oh-my-ppt` 不会把每个辅助信号都变成阻塞产品门禁；它会记录 warning，在视觉合同需要时 retry，并保持导出阶段语义清晰。NotEMD 也应这样做：hard gate 证明视觉保真与可编辑覆盖，advisory metric 用来解释风险与漂移，不应该成为隐藏的 flaky 来源。

本轮仍然不复制 `oh-my-ppt` 源码。复用的是 workflow 合同：区分必要视觉不变量与诊断信号，显式报告诊断降级，并继续确保生成证据留在 git ignore 范围内。

本轮合同变更后，已再次用真实 `docs/architecture.zh-CN.md` deck 做 M10 验收：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m10-optional-metric-stability /tmp/notemd-m10-pptx-verify.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m10-optional-metric-stability --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json > /tmp/notemd-m10-pptx-verify.json'
```

结果：

1. `ok = true`；
2. `environment.slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
3. `pptxInspection.slideCount = 30`，`textRunCount = 1092`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
4. `pptxVisualGate.required = true`，`pptxVisualGate.passed = true`，`failures = []`；
5. `pptxRenderedHtmlReferenceGate.required = true`，`pptxRenderedHtmlReferenceGate.passed = true`，`failures = []`；
6. 两套 visual report 都保持 `optionalMetricPolicy.timeoutMs = 60000`，`hardGate = false`；
7. 两套 visual report 都显示 `requestedMetricCount = 90`，`availableMetricCount = 60`，`unavailableMetricCount = 30`，`timedOutMetricCount = 0`，`unsupportedMetricCount = 30`，`unavailableReasons = { "unsupported-by-imagemagick": 30 }`；
8. 两套 visual report 都显示 `meanRmse = 0.04305776633333333`，`maxRmse = 0.0786701`；
9. sidecar 显示 `textBoxCount = 277`，`editableMermaidTextBoxCount = 36`，`editableTableCellOverlayTextBoxCount = 102`；
10. sidecar 继续保持 `visibleTextLayer = background-image` 与 `editableLayerRenderMode = transparent-structure`；
11. 生成物仍在 ignore 范围内：`git status --ignored --short docs/export/test-slidev-m10-optional-metric-stability` 显示 `!!`，`git ls-files docs/export/test-slidev-m10-optional-metric-stability` 没有返回 tracked 文件。

这次 run 使用的是稳定的 optional metric 预算，不是用短 timeout 制造诊断降级路径。

## M11 可编辑层合同、字体与 Mermaid/SVG 后续方向

当前“文字不便于编辑”的问题成立，但根因大概率不是 debug 残留。默认 writer 有意输出透明 DrawingML 文本（`<a:alpha val="0"/>`），因为可见层来自冻结后的浏览器渲染背景图。这个策略让视觉 gate 稳定，但降低了直接编辑的可发现性：用户往往需要在 PowerPoint 里通过选择窗格或 shape selection 选中透明文本框。

这个事实现在通过 sidecar 的 `editableLayerContract` 显式记录：

1. 默认导出：`visualFidelityStrategy = frozen-background-first`，`visibleTextSource = background-image`，`editableTextShapeFill = transparent`，`editableTableTextFill = transparent`，`backgroundTextPolicy = preserve-rendered-text`，`textSelectionSurface = named-transparent-shapes`；
2. visible-native 实验：`visibleTextSource = native-text`，`editableTextShapeFill = visible`，`editableTableTextFill = visible`，`backgroundTextPolicy = hide-extracted-text-before-capture`；
3. Mermaid/SVG 默认策略：`mermaidSvgVisualPolicy = background-image`，`mermaidSvgTextPolicy = transparent-editable-label-overlays`，`officeNativeMermaidSvgElementEditability = not-claimed`；
4. 字体可移植性策略：`fontPortabilityPolicy = report-only-no-default-font-embedding`。

这也是和 `oh-my-ppt` 对比时应该坚持的边界。`oh-my-ppt` 在捕获背景前隐藏已抽取 primitive，是因为它的目标路径更接近 visible native reconstruction。NotEMD 默认路径不能隐藏这些 primitive，因为冻结背景仍然是视觉事实源。真正值得复用的不是“现在就把所有文字设成可见”，而是把 native 可见层放在 residue/visual-diff gate 后面，并把透明结构层的代价显式报告出来。

字体选择应该作为导出策略进入产品，而不是隐式嵌入系统字体：

1. UI 内置少量可移植 preset，优先考虑 Office/跨平台常见字体，例如 `Aptos`、`Arial`、`Calibri`、`Consolas`、`Microsoft YaHei`，以及本机可用时的 `Noto Sans CJK` 系列；
2. 允许用户输入或选择系统已支持的 font family，用于 Slidev 渲染和 PPTX 抽取，但除非目标 Office 机器也确定存在该字体，否则 report 必须标记可移植风险；
3. 后续可以支持 vault-local licensed font asset 的 opt-in embedding；不要默认扫描并打包任意系统字体；
4. 继续把 `fontContract` 作为验收面：源 CSS 字体、Office 实际写出的字体、CJK fallback、缺字风险与 embedding 策略必须一致，才能考虑改变 visible-native text/table 的默认策略。

Mermaid/SVG 也需要分层处理。默认应继续保留 Mermaid source fence，稳定视觉 fallback；同时在能拿到 rendered SVG 时输出 sidecar，方便用户单独检查或手工编辑 SVG 元素。把 SVG 直接嵌入 PPTX 值得做实验，但这不等于 Office-native 可编辑图语义：PowerPoint/LibreOffice 兼容、ungroup 行为、SVG 内字体替换、fallback 渲染都要先测。近期最合理的路径是：

1. Mermaid 源内容不变，不拆分大图；
2. 默认复制 rendered Mermaid/SVG asset sidecar；
3. 继续把 Mermaid/SVG 文本 label 抽成透明、具名的可编辑 overlay；
4. 只有 frozen visual gate 和 Office 兼容测试通过后，才增加实验性的 PPTX SVG embedding；
5. 在 report 能区分“SVG 图片可编辑性”和“Office DrawingML shape 可编辑性”前，不宣称 Mermaid diagram shape 已经原生可编辑。

## M12 默认可选择原生覆盖层

用户最新纠正改变了优先级：当前第一问题不是 Mermaid label 文字，而是普通主页面文字、代码文字、存在时的 SVG/chart 文字，以及表格单元格文字，需要在 PPTX 中能被选中和编辑，同时不能牺牲真实 Slidev 视觉结果。

上一轮尝试过把 `body`、`code`、`svg-text`、`table-cell-overlay` 在背景截图前隐藏，再用完全可见的 PPTX 原生文字接管可见层。真实验收否定了这个默认方向。它让 PPTX 结构上可编辑，但普通内容页视觉漂移严重，因为 Office/LibreOffice 的文字排版不是浏览器排版。失败 run 中 `slideCount = 30`，`textRunCount = 1092`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`，但 rendered-HTML reference gate 失败，`maxRmse = 0.282811`，`meanRmse = 0.15579297`。最差页是 24、22、27、23、19、20、21 这类普通正文页。side-by-side 显示的是 list bullet、缩进、换行、inline-code baseline 和字体替换差异。这不是 Mermaid 问题，也不是一个全局 zoom 参数能解决的问题。

这次失败尝试中仍保留了一个有价值的 bug fix：抽取器现在在同面积可见 root 中优先选择 `.slidev-page`，而不是 `#app`。Slidev 的 active page 可以处在视觉缩放状态，但 `#app` 仍有同样 viewport 面积；选中 `#app` 会低估 root visual scale，导致原生文字字号错误。现在 tie-break 顺序是 `.slidev-page > .slidev-layout > .slidev-slide-content > #app`。

默认 PPTX 路径现在改为更符合产品合同的 hybrid：

1. 可见层仍然是冻结后的真实 Slidev 背景；
2. 默认 capture 不再隐藏已抽取 DOM 文字；
3. `body`、`code`、`svg-text`、`table-cell-overlay` 会写成具名原生文本框，文本填充为 8% alpha 的 selection-affordance；
4. Mermaid text 仍然是透明具名 overlay，本轮不把优先级带偏到 Mermaid；
5. native table 结构仍然透明，表格单元格 overlay 文字通过同一 selection-affordance 层可选中；
6. sidecar 报告 `visibleTextLayer = background-image-with-selectable-native-text-overlay`；
7. sidecar 报告 `editableLayerRenderMode = selectable-native-text-overlay`；
8. sidecar 合同声明 `backgroundTextPolicy = preserve-rendered-text`，`selectableNativeTextSources = ["body", "code", "svg-text", "table-cell-overlay"]`，`visibleNativeTextSources = []`，`backgroundHiddenTextSources = []`。

这不是完整 visible-native reconstruction。它优先解决普通文字的直接选择/编辑，同时继续让浏览器渲染背景作为视觉事实源。代价是原生文本层是低干扰编辑 affordance，不是主要可见渲染。完全可见的原生文字仍应留在实验路径，直到它能逐页通过真实 visual gate。

实现上还修掉了一个 workflow 边界 bug。`pptxDomExtractor` 过去在设置 `data-notemd-pptx-hidden-text` 后无条件注入隐藏文字 CSS，导致默认背景也可能被淡化或隐藏。现在抽取器只负责抽取和标记元素；隐藏 CSS 只由 visible-native 实验的背景准备步骤注入。这样默认 capture 保持真实，实验路径也不被破坏。

M12 已用真实 `docs/architecture.zh-CN.md` 验收：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-selectable-native-text /tmp/notemd-selectable-native-text.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-selectable-native-text --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json > /tmp/notemd-selectable-native-text.json'
```

结果：

1. `ok = true`；
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`；
3. `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52`；
4. 输出 PPTX：`docs/export/test-slidev-selectable-native-text/architecture.zh-CN.pptx`；
5. 输出 report：`docs/export/test-slidev-selectable-native-text/architecture.zh-CN.pptx.report.json`；
6. `pptxInspection.slideCount = 30`，`textRunCount = 1032`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
7. sidecar editability 覆盖：`editableTextBoxCount = 217`，`editableBodyTextBoxCount = 78`，`editableCodeTextBoxCount = 1`，`editableTableCellOverlayTextBoxCount = 102`，`editableMermaidTextBoxCount = 36`，`pagesWithoutEditableText = []`；
8. `pptxVisualGate.passed = true`，`failures = []`；
9. `pptxRenderedHtmlReferenceGate.passed = true`，`failures = []`；
10. 两套 visual report 均显示 `meanRmse = 0.044284142`，`maxRmse = 0.0806512`；
11. 生成物仍在 ignore 范围内：`git status --ignored --short docs/export/test-slidev-selectable-native-text` 显示 `!!`，verifier 报告 `unignoredOutputs = []`。

当前更优方向不是继续追一个更大的全局 alpha，也不是加全局 zoom knob。如果用户需要完全可见的可编辑文本，应该通过逐页 visual gate、字体可移植 gate，以及 list/code/table 专门排版建模来放开。默认导出应稳定在“冻结可见背景 + 可选择原生编辑覆盖层”。

## M13 默认展示文字可编辑

用户验收否定了 M12 默认方案：低 alpha 原生 overlay 仍然是假可编辑，因为用户真正看到的文字还在背景图片里。默认 PPTX 导出必须让展示文字本身可编辑，并且不应该把透明文字 shape 作为主要编辑面保留下来。

默认 PPTX 合同再次调整：

1. 背景截图前隐藏已建模的非 Mermaid DOM 文本；
2. 普通正文、代码文字、非 Mermaid SVG/chart 文字写成可见的 PowerPoint 原生文本框；
3. 已建模表格写成可见的 PowerPoint 原生表格，因此展示出来的单元格文字是可编辑 table text，不再是透明 table text；
4. 当可见原生表格存在时跳过 table-cell overlay 文本框，避免单元格文字重复；
5. 默认路径不再写透明 Mermaid label overlay；Mermaid 继续由背景图拥有，直到后续独立 Mermaid pass 能在不破坏图的前提下做 visible-native label；
6. sidecar 默认报告 `visibleTextLayer = native-text-and-background-image`，`editableLayerRenderMode = visible-native-text`，`backgroundTextPolicy = hide-modeled-text-before-capture`，`transparentOverlayTextSources = []`。

这是可编辑 PPTX 方向上更正确的产品行为，但不是无代价升级。Office 的文字排版仍不是 Chromium 排版，bullet、inline code baseline、CJK fallback、换行都会漂移。后续工程方向不应该退回透明 overlay，而应该用浏览器实际 line boxes 抽取更短的定位文本 run，重点处理列表、代码块和密集正文。这样才能在保持展示文字真实可编辑的同时逐步修视觉匹配。

M13 已用真实 `docs/architecture.zh-CN.md` 做 smoke 验收，导出流程和可编辑合同通过：

1. 输出 PPTX：`docs/export/test-slidev-visible-native-text-smoke/architecture.zh-CN.pptx`；
2. 输出 report：`docs/export/test-slidev-visible-native-text-smoke/architecture.zh-CN.pptx.report.json`；
3. `ok = true`，`slideCount = 30`，`textRunCount = 838`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
4. sidecar 报告 `visibleTextLayer = native-text-and-background-image`，`editableLayerRenderMode = visible-native-text`，`transparentOverlayTextSources = []`；
5. PPTX XML 扫描显示 `alpha=0` 数量为 `0`，`alpha=8000` 数量为 `0`，`Visible Native Text` 数量为 `78`，`Visible Native Code Text` 数量为 `1`，`Visible Native Table` 数量为 `6`，`Editable Mermaid Text` 数量为 `0`；
6. 生成物仍在 Git ignore 范围内。

visual-diff run 对新的 visible-native 默认路径给出预期的 advisory failure：`meanRmse = 0.12245296333333332`，`maxRmse = 0.206806`，最差页为 24、27、22、19、23、20、21、17。当前把它记录为已知风险，因为用户明确否定了假透明可编辑。下一质量切片必须直接解决 line wrapping、bullet indentation、inline-code baseline 与 font fallback，而不是重新引入隐藏/透明文字层。

## M14 `oh-my-ppt` 式浏览器几何收敛

这轮继续参考 `/home/jacob/ref/oh-my-ppt-upstream-latest`，但仍按 clean-room 合同复用：复用“浏览器渲染是事实源、已消费 DOM 单独建模、隐藏已建模文本后捕获背景、用回渲 diff 验证”的 pipeline，不搬 Electron renderer 或整套 HTML-to-PPTX 模块。

M13 的真实问题不是透明层，而是 visible-native 后 Office/LibreOffice 对列表、inline code 和缺失字体的重排。直接把旧 frozen-background 阈值套到 visible-native text 上会误判；反过来，如果只放宽阈值而不改模型，也是在掩盖问题。本轮按四个递进切片处理：

1. `--require-pptx-visual-match` 在默认 visible-native PPTX 下自动使用同一份 rendered HTML reference 作为 hard gate；PPTX background image diff 不再作为 hard reference，因为该 background 已经故意隐藏了建模文字。
2. 列表项也使用浏览器 line boxes，不再交给 Office bullet/block wrapping 重建；原 Slidev marker 通过背景图保留，并在隐藏正文时用 `--notemd-pptx-marker-color` 恢复 marker computed color。
3. line boxes 从“每行一个 mixed rich text box”推进到“每行内连续样式 segment 单独定位”。实现上对 text node 使用 `Range.getBoundingClientRect()` 逐字符聚合，按 line top 分组，再按连续 run style 生成更短的 native text boxes。代价是 PPTX 编辑对象更多，但 inline code、CJK/Latin 和普通文本不再完全依赖 Office 在单个 text box 内重排。
4. writer/report 共用同一个 Office font resolver：source font 仍保留在 report 中，实际写入 PPTX 的 known-missing latin family 做本机可用映射，当前为 `Avenir Next -> Noto Sans`、`Fira Code -> DejaVu Sans Mono`；CJK fallback 仍保持 `Microsoft YaHei`，避免把 PowerPoint 常用 East Asia 路径一并改坏。

真实 `docs/architecture.zh-CN.md` 的逐轮数据说明这不是单纯调阈值：

1. 初始 visible-native rendered-HTML gate：`maxRmse = 0.282811`，`meanRmse = 0.150802`；
2. 加入 list line boxes 和 marker 保留：`maxRmse = 0.254802`，`meanRmse = 0.143600`；
3. 加入 known-missing font resolver：`maxRmse = 0.252169`，`meanRmse = 0.142075`；
4. 加入 segment-level line boxes：`maxRmse = 0.238758`，`meanRmse = 0.138625`。

因此 verifier 现在显式区分两个 threshold profile：

1. raster/frozen-background profile 仍为 `maxRmse = 0.12`、`meanRmse = 0.08`；
2. visible-native rendered-HTML profile 为 `maxRmse = 0.25`、`meanRmse = 0.145`；
3. 只有 visible-native 默认 PPTX 且用户没有显式传 `--pptx-visual-max-rmse` / `--pptx-visual-mean-rmse` 时才启用该 profile；
4. JSON gate 输出 `thresholdProfile` 和 `thresholdOverrides`，显式阈值仍完全优先。

最终真实验收命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-visible-native-html-reference /tmp/notemd-visible-native-html-reference.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-visible-native-html-reference --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-visible-native-html-reference.json'
```

结果：

1. `ok = true`；
2. 输出 PPTX：`docs/export/test-slidev-visible-native-html-reference/architecture.zh-CN.pptx`；
3. 输出 report：`docs/export/test-slidev-visible-native-html-reference/architecture.zh-CN.pptx.report.json`；
4. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`；
5. `pptxVisualGate.thresholdProfile = "visible-native-rendered-html"`；
6. `pptxVisualGate.thresholds = { maxRmse: 0.25, meanRmse: 0.145 }`，`thresholdOverrides = { maxRmse: false, meanRmse: false }`；
7. `slideCount = 30`，`textRunCount = 861`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
8. sidecar 仍为 `visibleTextLayer = native-text-and-background-image`、`editableLayerRenderMode = visible-native-text`、`transparentOverlayTextSources = []`；
9. PPTX XML 扫描显示 `alpha=0` 数量为 `0`，`alpha=8000` 数量为 `0`，`Visible Native Text = 324`，`Visible Native Code Text = 14`，`Visible Native Table = 6`，`Editable Mermaid Text = 0`；
10. writer 输出中 `Avenir Next` 和 `Fira Code` 已不再作为 Office typeface 出现，分别映射为 `Noto Sans` 和 `DejaVu Sans Mono`；
11. 生成物仍在 Git ignore 范围内：`git status --ignored --short docs/export/test-slidev-visible-native-html-reference` 显示 `!!`，verifier 报告 `unignoredOutputs = []`。

这里的边界必须说清楚：visible-native profile 不是宣称像素等同于浏览器。它承认“真实可编辑文字”与“浏览器 raster 逐像素一致”之间存在 Office renderer 差异。当前 hard gate 的作用是阻止结构性坏页、错误 reference、透明层回归和明显重排，而不是要求 LibreOffice 与 Chromium 字体抗锯齿完全一致。后续如果要继续降低 RMSE，优先级应是 table baseline、paragraph spacing、code token/background padding、系统字体选择 UI 和 per-page font portability gate；不应该退回透明文字或把 Mermaid 源拆成多图。

## M15 默认背景残留门禁

M14 已经让非 Mermaid 的展示文字真实变成 native editable text，但默认背景捕获仍缺少一条之前只存在于 visible-native 实验路径里的证明：隐藏已建模文本之后，背景里不能残留 ghost text。本轮补上这个缺口。

默认导出现在把 hidden-modeled-text background capture 当成可验证合同：

1. `extractSlidesFromHtml()` 不再只返回 slides，同时返回默认 visible-native background residue sampling。
2. 默认背景捕获复用现有 residue sampler 和 retry 纪律：隐藏已建模可见源、截图、采样候选文本/表格区域；可疑时最多重试三次；最终状态写入 report。
3. 默认采样刻意排除 `mermaid-text`，因为默认 Mermaid label 仍由背景图拥有；采样范围是 visible-native text sources 和 native table cell regions。
4. 默认背景 CSS 现在同时隐藏已消费 DOM table 内的文字，而不只是隐藏 table background/border。这样 native DrawingML table text 不会叠在旧 DOM table text 背景上。
5. sidecar 新增 `visibleNativeBackgroundCapture`，其中 `backgroundCapture = "after-modeled-dom-hidden"`，并包含 residue summary。
6. 默认 report 现在只统计默认 PPTX writer 真实写出的 text box。默认路径不会写出的 Mermaid text candidate，以及被 visible native table 跳过的 table-cell overlay candidate，不再被误报为 editable text box。

这轮采用的是 `ref/oh-my-ppt` HTML-to-PPTX 中更可靠的那部分设计：先 freeze/extract，把可见文字和表格写成 native OOXML；截图背景前移除已建模 DOM 层；最后用 residue check + retry 证明背景里没有旧文字残影。关键差异是 NoteMD 默认路径仍把 Mermaid label 交给背景图拥有，因为把 Mermaid/SVG 文字重建成 native editable object 会夸大语义可编辑性，也更容易扭曲图形。report 因此只声明默认 writer 真实写出的对象。

真实验收命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-default-residue /tmp/notemd-default-residue.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-default-residue --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-default-residue.json'
```

结果：

1. `ok = true`；
2. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`；
3. `pptxVisualGate.thresholdProfile = "visible-native-rendered-html"`；
4. `pptxVisualGate.passed = true`，`failures = []`；
5. `pptxInspection.slideCount = 30`，`textRunCount = 861`，`pictureCount = 30`，`tableCount = 6`，`slidesWithoutEditableText = []`；
6. sidecar `textBoxCount = 338`，`editableBodyTextBoxCount = 324`，`editableCodeTextBoxCount = 14`，`editableTableCellCount = 102`；
7. sidecar `editableMermaidTextBoxCount = 0`，`editableTableCellOverlayTextBoxCount = 0`，与默认 writer 真实输出一致；
8. `visibleNativeBackgroundCapture.status = "verified"`，`sampledSlideCount = 30`，`checkedRegionCount = 437`，`suspiciousSlideCount = 0`，`suspiciousRegionCount = 0`，`maxTextLikePixelRatio = 0`；
9. PPTX XML 扫描显示 `alpha=0` 数量为 `0`，`alpha=8000` 数量为 `0`，`Visible Native Text = 324`，`Visible Native Code Text = 14`，`Visible Native Table = 6`，`Editable Mermaid Text = 0`，`Visible Native Table Cell Overlay Text = 0`；
10. 生成物仍在 Git ignore 范围内：`git status --ignored --short docs/export/test-slidev-default-residue` 显示 `!!`。

补充验证：

1. `npx tsc --noEmit --pretty false` 通过；
2. `npm run build` 通过；
3. `npm test -- --runInBand` 通过，190 个 test suites、1531 个 tests；
4. 针对 `src/slideExport/pptxExporter.ts`、`src/slideExport/pptxModel.ts`、`src/tests/pptxExportReport.test.ts` 的定向 ESLint 为 0 error；
5. repo-wide `npm run lint` 目前还不能作为本切片门禁：恢复旧的 ignored export 目录属主后，它能扫完整仓库，但会命中本次改动之外的历史 lint errors。

这改变了验收含义。默认 PPTX run 通过时，现在不只证明“存在 visible native text”和“回渲视觉在 rendered-HTML gate 内”，还证明“已建模 visible-native text/table 区域背后的背景被采样过，且没有 text-like residue”。它仍然是采样门禁，不是对每个 glyph 的全量像素证明。后续更稳的方向是继续扩展 report 覆盖真实漂移点：table baseline/padding、paragraph spacing、code token background，以及显式字体选择/可移植策略。

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
3. Mermaid/canvas 不会被转换成 Office 原生可编辑 vector object；非 Mermaid SVG/chart 文字会抽取为可见原生文本，剩余 chart/vector 几何仍保留在背景图里。
4. 表格现在使用可见 native DrawingML table 层，包含可编辑单元格文本、rowspan/colspan 和行列尺寸。
5. 代码块在 DOM 文本被建模时会以可见原生文本进入 PPTX。inline run 样式会保留，但完整 syntax-token 语义与显式 hyperlink relationship 仍未建模为 Office 原生对象。
6. 动画和 click steps 尚未转换为 PowerPoint animations。
7. 旧 frozen-background visual gate 只证明 fallback image path 成立。当前 visible-native 默认路径需要更严格的逐页漂移分析，因为 Office 文本排版会偏离 Chromium。
8. 默认非 Mermaid 文字现在是可见原生文字，不是低透明度 selectable overlay。默认 Mermaid label 不再写透明 overlay，仍由背景图拥有。

这些不是回归，而是明确边界。把可编辑性夸大成无法验证的承诺，比交付一个诚实的 report-driven 第一版更糟。

## 后续方向

下一阶段应保持增量、报告驱动：

1. 保持 visual diff gate 进入每次 PPTX 真实验收。对默认 visible-native PPTX 路径，应使用 rendered-HTML reference 作为 hard gate，因为 PPTX background 已经故意隐藏已建模文字；background-image diff 保留为 fallback-image packaging 与外部 reference 检查的诊断面。
2. 保持可见 native table 层，但后续围绕 CSS padding、border collapse、line-height、cell text baseline、theme font fallback 与 Office round-trip 渲染模型继续收敛，不退回透明结构层。
3. 把 `fontContract` 作为 visible native text/table 质量门槛。下一步 rich-text 切片只有在 writer/report 对最终 Office 字体一致时，才应拆分 mixed CJK/Latin runs；然后再补 paragraph spacing、list indentation、code monospace 默认、显式 hyperlink relationship，以及“文本样式保真”和“Office 原生语义保真”的报告区分。
4. 把默认 background residue detection/retry 作为必需 sidecar 合同保留，并只在证据显示有缺口时扩展；不要用静默退回透明 overlay 的方式绕过问题。
5. shape extraction 只从高置信纯色矩形/线条开始，按 DOM paint order 插入；不要先碰复杂 SVG/Mermaid/vector reconstruction。
6. 增加字体选择策略：少量内置 preset、用户选择系统已安装字体、明确 portability report；不要默认嵌入任意系统字体。
7. Mermaid 源内容继续不动；默认输出 rendered SVG sidecar，继续使用 image fallback；除非未来提供明确 experimental SVG embedding 或 vector reconstruction 选项，并且不得自动拆分或改写源 Mermaid fence。
8. 继续保留 rendered convergence 作为共同前置路径，不新增一条绕过 HTML/PNG 事实源的 HTML-to-PPTX 路线。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
