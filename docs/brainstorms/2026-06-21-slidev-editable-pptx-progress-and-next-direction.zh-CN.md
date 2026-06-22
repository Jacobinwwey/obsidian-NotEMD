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

2026-06-21 重新 fetch 后，`/home/jacob/ref/oh-my-ppt-upstream-fresh-20260621` 的 `origin/main` 为 `843ff74` / `v2.0.17`。本地 fork `/home/jacob/ref/oh-my-ppt-fork` 当前在 `pr/animation-export-contract` 的 `257c23b`，相对 `upstream/main` 的相关差异集中在 animation export contract；HTML->PPTX 主路线仍以 upstream 的 `renderer.ts`、`browser-scripts.ts`、`index.ts`、`table-extract.ts`、`font-collect.ts` 与 `ooxml-writer.ts` 为准。

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
5. **可见原生层合同**：`renderer.ts` 在隐藏已抽取 primitive 后捕获背景，并用像素采样检测文本残影、失败重试。这个机制不能直接搬进 NotEMD 当前流程，因为 NotEMD 的可见文字和可见表格来自整页冻结背景；现在隐藏文字会直接降低视觉质量。它应该作为 visible-native-text / visible-native-table 实验的准入门槛。

所以后续不是“全面换成 oh-my-ppt 路线”。更准确的推进切片是：

1. **M1：增强 report，而不是先增强可见层**。这一项已在当前分支落地。report 继续保留 `visibleTextLayer = background-image` 和 `editableLayerRenderMode = transparent-structure`，并新增 `consumedTableCount`、`consumedTableTextCandidateCount`、`editablePrimitiveCoverage`、`fallbackOnlyElementKinds`、`unmodeledTextRunReasons` 与逐页 summary。这能防止“看似可编辑，实际大部分靠截图”的误报。
2. **M2：rich run extraction**。在透明文本层里补 inline runs、CJK/Latin font face 拆分、code monospace、bullet level、line-height/paragraph spacing。透明模式下做这件事不会影响视觉，是性价比最高的下一步。
3. **M3：external PNG advisory gate 升级指标**。继续保留 external PNG gate，但默认不要 hard fail；新增几何偏移、scale drift、SSIM/pHash、文本抗锯齿容忍，把“不同 rasterization path 的亚像素差异”和“真实版面漂移”分开。
4. **M4：visible native table/text 分支**。只有同一 frozen HTML 下的 A/B gate 通过，才允许把透明结构层变成可见层。这个分支必须带 residue detection/retry，否则很容易出现背景文字 + PPTX 文字双影。
5. **M5：字体合同**。`oh-my-ppt` 的 font embedding 很有价值，但 NotEMD 不能默认嵌入用户系统字体或远程字体；可行做法是先报告字体族、CJK fallback、Office 端缺失风险，再只对 vault/local package 中有授权的 font asset 做 opt-in embedding。

不建议现在迁移的部分也要明确：

1. 不要把 `oh-my-ppt` 的 Electron `BrowserWindow` 假设带进 Obsidian 插件；Playwright + local server 更适合当前运行边界。
2. 不要为了 visible native layer 去重写 Mermaid 源码或拆 Mermaid 图；用户要求是保留原 Mermaid 内容，Mermaid/SVG/canvas 现阶段应作为 atomic visual fallback。
3. 不要把 Tailwind 专用 utility parser 当成 Slidev 通用解。可以借鉴“utility hint 补充 computed style”的思想，但 Slidev theme / Vue component / Mermaid 的失败面不同。
4. 不要把 external PNG RMSE 失败直接归因到 `pptxWriter.ts`。当前 frozen-reference hard gate 已证明 writer 保留了 PPTX 内嵌视觉层；external PNG 失败主要暴露 reference contract 不统一。

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
4. 如果未来要让原生 text/table layer 从透明变为可见，必须先增加 background residue detection/retry。当前透明结构层不应隐藏背景文字；只有可见原生文本接管视觉时，才需要像 `oh-my-ppt` 那样隐藏已抽取文字并用像素采样确认背景不残留 ghost text。
5. shape extraction 只从高置信纯色矩形/线条开始，按 DOM paint order 插入；不要先碰复杂 SVG/Mermaid/vector reconstruction。
6. Mermaid 源内容继续不动，默认保持 image fallback；除非未来提供明确 experimental vector reconstruction 选项，并且不得自动拆分或改写源 Mermaid fence。
7. 继续保留 rendered convergence 作为共同前置路径，不新增一条绕过 HTML/PNG 事实源的 HTML-to-PPTX 路线。

不要新增一条绕过 rendered convergence 的 HTML-to-PPTX 路线。那会制造第二套质量门，并让 PPTX 结果偏离用户已经依赖的 HTML 导出路径。
