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
11. `pptxInspection.slideCount = 27`
12. `pptxInspection.mediaCount = 27`
13. `pptxInspection.textRunCount = 236`
14. `pptxInspection.pictureCount = 27`
15. `pptxInspection.slidesWithoutEditableText = []`

验收时 sidecar report 记录：

```json
{
  "slideCount": 27,
  "textBoxCount": 223,
  "editableTextSlideCount": 27,
  "pagesWithoutEditableText": [],
  "backgroundImageSlideCount": 27,
  "imageFallbackCount": 27,
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
