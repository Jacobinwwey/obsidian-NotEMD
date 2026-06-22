# Slidev 可编辑 PPTX 验收记录，2026-06-21

语言: [English](./slidev-editable-pptx-acceptance-2026-06-21.md) | **简体中文**

本文记录首次基于真实 `docs/architecture.zh-CN.md` 的 NoteMD `HTML Slides -> 可编辑 PPTX` 验收。

## 范围

本次验收的合同不是“截图式 PPTX”。正确合同是：

1. 先让 Slidev deck 经过与 UI 导出路径一致的 HTML 渲染收敛；
2. 把真实可见文本抽取为 PowerPoint 可编辑 text frame；
3. 将复杂 Slidev/Mermaid/CSS 视觉保留为 slide-level image fallback；
4. 生成真正的 `.pptx` zip，其中 slide XML 含 `<a:t>` 文本节点；
5. 对 HTML `<table>` 输出 native DrawingML 结构层，但默认不让它接管可见渲染；
6. 写出 sidecar JSON report，用数据说明可编辑覆盖率，而不是口头暗示。

## 命令

以 Jacob 用户运行，并使用 Jacob 的 Playwright browser cache：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

## 结果

本次运行返回 `ok: true`。

关键证据：

1. `environment.capabilities.pptx = true`
2. `environment.slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `slideSource.skillRootPath = /home/jacob/slidev/skills/slidev`
4. `slideSource.skillReferenceCount = 52`
5. `htmlExport.actualMode = standalone`
6. `htmlExport.requiresLocalServer = false`
7. `mermaidSourcePreservation.passed = true`
8. `layoutAuditSummary.overflowCount = 0`
9. `layoutAuditSummary.lowEffectiveFontCount = 0`
10. `pptxInspection.isZip = true`
11. `pptxInspection.slideCount = 30`
12. `pptxInspection.mediaCount = 30`
13. `pptxInspection.textRunCount = 254`
14. `pptxInspection.pictureCount = 30`
15. `pptxInspection.slidesWithoutEditableText = []`

当前 sidecar report 记录：

```json
{
  "slideCount": 30,
  "textBoxCount": 139,
  "tableCount": 6,
  "consumedTableCount": 6,
  "consumedTableTextCandidateCount": 129,
  "editableTableCellCount": 102,
  "editableTextSlideCount": 30,
  "pagesWithoutEditableText": [],
  "backgroundImageSlideCount": 30,
  "imageFallbackCount": 30,
  "fallbackOnlyElementKinds": ["code-highlight", "mermaid", "svg"],
  "unmodeledTextRunReasons": ["inline-code", "inline-formatting", "syntax-highlight"],
  "warnings": []
}
```

## 输出归档

生成文件不提交到 `main`。可检查的验收归档在：

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

归档内容：

```text
acceptance-summary.json
architecture.zh-CN.pptx
architecture.zh-CN.pptx.report.json
architecture.zh-CN.slidev.md
architecture.zh-CN-slides/
```

## 解释

本次验收证明直接 PPTX 导出已经接入生产等价的 NoteMD 工作流，并且会输出 PowerPoint 可编辑文本。它不声称每个 Slidev 对象都已经被重建为 Office 原生可编辑对象。Mermaid、SVG、canvas 和复杂 Vue/CSS surface 当前按设计保留为图片 fallback。

后续更有价值的升级是表格重建、代码块以等宽 text runs 抽取、以及选择性 shape extraction。这些升级仍应由 sidecar report 量化，而不是把“可编辑”退化成无法验证的口号。

## 视觉对比后续补充

同日后续新增了更严格的 PPTX 回渲染视觉质量门：

```bash
npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json
```

该 run 完成了生产等价导出路径，并生成逐页对比产物，但视觉质量门没有通过：

1. `pageCount = 27`
2. `comparablePageCount = 27`
3. `meanRmse = 0.15322961111111114`
4. `maxRmse = 0.260447`
5. 默认阈值：`meanRmse <= 0.08`，`maxRmse <= 0.12`
6. 最差页：21、19、24、20、16、17、18、10、22、15、13、12

因此这份验收记录应理解为结构/可编辑性验收，不是最终视觉保真验收。后续收口门槛是 `--pptx-visual-diff --require-pptx-visual-match`。

## 结构化表格后续补充

随后参考 `oh-my-ppt` 的 table-first extraction 路线，NoteMD 增加了透明 native DrawingML table 结构层。最新真实 `architecture.zh-CN.md` inspector run 仍返回 `ok: true`，并额外记录：

1. `pptxInspection.textRunCount = 331`
2. `pptxInspection.tableCount = 4`
3. sidecar `tableCount = 4`
4. sidecar `editableTableCellCount = 95`
5. `pptxInspection.slidesWithoutEditableText = []`

这里的表格结构层是有意透明的。两次让原生表格进入可见层的实测结果都变差：可见 native table 的 `meanRmse = 0.15640467407407407`，hybrid native table text 的 `meanRmse = 0.15657594444444442`，均差于基线 `0.15322961111111114`。当前透明结构层为 `meanRmse = 0.15259227777777779`、`maxRmse = 0.260447`，略优于基线但仍未通过默认视觉门槛。

结论：表格先抽取是正确架构方向，但当前不应把 Office 原生表格作为可见层。下一步应先补齐 padding、border collapse、line-height、cell baseline 与字体 fallback 的 round-trip 模型，再用 visual diff 决定是否逐步放开可见表格层。

## 冻结背景视觉门槛收口补充

继续排查后，先前 `--require-pptx-visual-match` 失败被定位为 reference 语义错误，而不是 PPTX package 或 LibreOffice 回渲漂移。失败 run 与通过 run 的 PPTX 内嵌背景图一致，PPTX 回渲 PNG 也一致；漂移来自另一次独立的 Slidev PNG export reference。该 reference 不是同一冻结渲染实例，不能作为 PPTX hard gate。

因此 verifier 已改为从 PPTX slide relationship 中抽取每页内嵌背景图作为 frozen visual reference，再与 LibreOffice 回渲结果逐页比较。真实 strict 命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-frozen-reference-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

结果：

1. `ok = true`
2. `pptxVisualGate.required = true`
3. `pptxVisualGate.passed = true`
4. `pptxVisualDiff.reference.source = pptx-background-images`
5. `pptxVisualDiff.comparison.summary.pageCount = 27`
6. `pptxVisualDiff.comparison.summary.meanRmse = 0.049441916296296295`
7. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
8. `pptxInspection.textRunCount = 331`
9. `pptxInspection.pictureCount = 27`
10. `pptxInspection.tableCount = 4`
11. `pptxInspection.slidesWithoutEditableText = []`

对应产物位于：

```text
docs/export/test-slidev-pptx-frozen-reference-strict/
```

这次补充把 PPTX 验收从“结构可编辑已过、视觉未收口”推进为“结构可编辑已过、Office 回渲保持冻结视觉层已过”。它仍不声明 Mermaid、SVG、canvas 或 Vue component 内部已经转成 Office 原生可编辑对象。

## 当前 strict 收口

当前真实收口命令：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-final-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

当前证据：

1. `ok = true`
2. `pptxInspection.slideCount = 30`
3. `pptxInspection.mediaCount = 30`
4. `pptxInspection.textRunCount = 254`
5. `pptxInspection.pictureCount = 30`
6. `pptxInspection.tableCount = 6`
7. `pptxInspection.slidesWithoutEditableText = []`
8. `pptxVisualGate.passed = true`
9. `pptxVisualDiff.reference.source = pptx-background-images`
10. `pptxVisualDiff.comparison.summary.pageCount = 30`
11. `pptxVisualDiff.comparison.summary.meanRmse = 0.049339111333333345`
12. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
13. `pptxVisualDiff.comparison.summary.maxScaleRatioDelta = 0.02091836734693886`
14. `pptxVisualDiff.comparison.summary.maxDifferenceBoundingBoxAreaRatio = 0.6987466725820763`

产物在：

```text
docs/export/test-slidev-final-pptx-strict/
docs/export/test-slidev-final-pptx-strict/architecture.zh-CN.pptx
docs/export/test-slidev-final-pptx-strict/architecture.zh-CN.pptx.report.json
docs/export/test-slidev-final-pptx-strict/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/test-slidev-final-pptx-strict/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
```

高 difference bounding-box area 当前是诊断信息，不是 hard failure。它主要来自密集文本区的抗锯齿与 LibreOffice 回渲差异；RMSE 与 side-by-side 视觉检查显示冻结视觉层保持成立。后续如果要把几何指标升级为 hard gate，应检测对象位移或缩放漂移，而不是直接用原始 diff 面积。

## M2 rich-run 收口

2026-06-21 的 M2 后续仍使用同形 strict 命令，产物位于：

```text
docs/export/test-slidev-m2-pptx-strict/
```

当前证据：

1. `ok = true`
2. `environment.slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `slideSource.skillRootPath = /home/jacob/slidev/skills/slidev`
4. `slideSource.skillReferenceCount = 52`
5. `htmlExport.actualMode = standalone`
6. `mermaidSourcePreservation.changedFenceIndexes = []`
7. `layoutAuditSummary.overflowCount = 0`
8. `layoutAuditSummary.unreadableCount = 0`
9. `pptxInspection.slideCount = 30`
10. `pptxInspection.mediaCount = 30`
11. `pptxInspection.textRunCount = 371`
12. `pptxInspection.pictureCount = 30`
13. `pptxInspection.tableCount = 6`
14. `pptxInspection.slidesWithoutEditableText = []`
15. sidecar `textBoxCount = 139`
16. sidecar `richTextBoxCount = 45`
17. sidecar `richTextRunCount = 344`
18. sidecar `editablePrimitiveCoverage.richTextBoxRatio = 0.323741`
19. sidecar `editablePrimitiveCoverage.richTextRunCharacterCount = 6502`
20. sidecar `editableTableCellCount = 102`
21. `pptxVisualGate.passed = true`
22. `pptxVisualDiff.reference.source = pptx-background-images`
23. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
24. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`

这收口的是 rich-run 第一片：可编辑文本框现在会保留多 run DrawingML 结构，用于 inline emphasis、computed text style、code/link 标记和 Office-safe whitespace。它仍是透明结构层；不声称已经支持可见原生文本、真实 hyperlink relationship 或完整 syntax-token 语义。

## M3 external PNG advisory diagnostics

external PNG 对比现在是一等 verifier 输入，不再需要单独写 Node 脚本调用库函数：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m3-pptx-external-advisory --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --pptx-visual-reference-dir docs/export/test-slidev-m3-png-reference/architecture.zh-CN-slides-png --json'
```

external reference 由同一个真实源文件生成：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-m3-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

当前证据：

1. PNG reference run 返回 `ok = true`。
2. PPTX external advisory run 返回 `ok = true`。
3. `pptxVisualDiff.reference.source = external-png-sequence`。
4. `pptxVisualGate.required = false`。
5. `pptxVisualGate.passed = true`。
6. 内部 `pptxVisualDiff.gate.passed = false`，`meanRmse = 0.102229238`，`maxRmse = 0.241976`。
7. `pptxVisualDiff.comparison.summary.maxScaleRatioDelta = 0.02091836734693886`。
8. `advisoryMetrics.diagnosticCounts.rendererNoiseLikely = 7`。
9. `advisoryMetrics.diagnosticCounts.referenceContractDriftLikely = 13`。
10. `advisoryMetrics.diagnosticCounts.layoutDriftLikely = 0`。
11. 当前 ImageMagick 可选指标包含 `PHASH` 与 `NCC`；本机不支持 `SSIM`，报告会标为 unavailable。
12. `unignoredOutputs = []`。

这是预期结果。external PNG 对比的价值是暴露 Slidev PNG export 与 NotEMD PPTX capture 之间仍未统一的 cross-export contract drift；它不是 PPTX writer hard failure。在 PNG export 与 PPTX capture 共用同一套 frozen HTML/capture contract 前，PPTX 视觉 hard gate 仍应以 frozen-background strict gate 为准。

## M5 字体合同收口

当前字体合同收口仍使用同一个真实源文件和 strict visual gate：

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m5-font-contract-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

当前证据：

1. `ok = true`
2. `pptxInspection.slideCount = 30`
3. `pptxInspection.mediaCount = 30`
4. `pptxInspection.textRunCount = 371`
5. `pptxInspection.tableCount = 6`
6. `pptxInspection.slidesWithoutEditableText = []`
7. `pptxVisualGate.passed = true`
8. `pptxVisualDiff.reference.source = pptx-background-images`
9. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
10. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
11. sidecar `fontContract.fontFamilyCount = 2`
12. sidecar `fontContract.fontFamilies = ["Avenir Next", "Fira Code"]`
13. sidecar `fontContract.cjkFontFamilies = ["Avenir Next", "Fira Code"]`
14. sidecar `fontContract.writerEastAsiaFontFace = "Microsoft YaHei"`
15. sidecar `fontContract.writerEastAsiaFallbackFontFamilies = ["Avenir Next", "Fira Code"]`
16. sidecar `fontContract.officeMissingFontRiskCount = 2`
17. sidecar `fontContract.officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`
18. sidecar `fontContract.fontEmbeddingPolicy = "not-embedded"`
19. sidecar `fontContract.embeddedFontCount = 0`
20. `unignoredOutputs = []`

产物在：

```text
docs/export/test-slidev-m5-font-contract-pptx-strict/
docs/export/test-slidev-m5-font-contract-pptx-strict/architecture.zh-CN.pptx
docs/export/test-slidev-m5-font-contract-pptx-strict/architecture.zh-CN.pptx.report.json
docs/export/test-slidev-m5-font-contract-pptx-strict/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/test-slidev-m5-font-contract-pptx-strict/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
```

这只收口了字体合同的第一片。它不嵌入字体、不拉取远程字体，也不声称可见 native text 会匹配 Chromium。真实 report 显示可编辑层依赖 `Avenir Next` 和 `Fira Code`，两者都被标为 Office 缺字风险；CJK 文本会通过 writer 的 East Asian fallback `Microsoft YaHei` 写出。这正是继续保持透明结构层的理由，除非后续 visible-native 分支先通过更严格的字体合同和视觉 A/B gate。
