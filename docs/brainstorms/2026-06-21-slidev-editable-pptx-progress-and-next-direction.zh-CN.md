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
5. 代码块在 DOM 文本被选中时会以文本方式进入 PPTX。inline run 样式现在会进入透明结构层，但完整 syntax-token 语义与显式 hyperlink relationship 仍未建模为 Office 原生对象。
6. 动画和 click steps 尚未转换为 PowerPoint animations。
7. 冻结背景 reference 下的视觉质量门已经通过；但这只证明 Office 回渲保留视觉层，不证明复杂对象已经 Office 原生可编辑。

这些不是回归，而是明确边界。把可编辑性夸大成无法验证的承诺，比交付一个诚实的 report-driven 第一版更糟。

## 后续方向

下一阶段应保持增量、报告驱动：

1. 保持 visual diff gate 进入每次 PPTX 真实验收：报告模式用于开发，`--require-pptx-visual-match` 用于收口或 CI，并固定使用 `pptx-background-images` 作为 hard gate reference；同时保留 `--pptx-rendered-html-reference-diff` 作为 reference-contract 回归检查，避免后续改动重新制造 HTML capture 漂移。
2. table-first extraction 已经落地为透明结构层。下一步不要急着把表格设为可见层，而应先补齐 CSS padding、border collapse、line-height、cell text baseline、theme font fallback 与 Office round-trip 渲染模型；只有 visible-native-table 分支在 frozen reference gate 下不退化时，才允许逐页放开。
3. 把 `fontContract` 作为 visible native text/table 的前置门槛。下一步 rich-text 切片只有在 writer/report 对最终 Office 字体一致时，才应拆分 mixed CJK/Latin runs；然后再补 paragraph spacing、list indentation、code monospace 默认、显式 hyperlink relationship，以及“文本样式保真”和“Office 原生语义保真”的报告区分。
4. 如果未来要让原生 text/table layer 从透明变为可见，必须先增加 background residue detection/retry。当前透明结构层不应隐藏背景文字；只有可见原生文本接管视觉时，才需要像 `oh-my-ppt` 那样隐藏已抽取文字并用像素采样确认背景不残留 ghost text。
5. shape extraction 只从高置信纯色矩形/线条开始，按 DOM paint order 插入；不要先碰复杂 SVG/Mermaid/vector reconstruction。
6. Mermaid 源内容继续不动，默认保持 image fallback；除非未来提供明确 experimental vector reconstruction 选项，并且不得自动拆分或改写源 Mermaid fence。
7. 继续保留 rendered convergence 作为共同前置路径，不新增一条绕过 HTML/PNG 事实源的 HTML-to-PPTX 路线。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
