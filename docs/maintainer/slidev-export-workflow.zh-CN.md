# Slidev 导出工作流验证

语言: [English](./slidev-export-workflow.md) | **简体中文**

此文档面向维护者。它定义 NoteMD 的 Slidev export UI 路径应如何验证。

## 为什么需要这条工作流

直接运行 `slidev build` 只能证明本地 Slidev CLI 能构建某个 deck，不能证明 NoteMD 的导出按钮真的工作。

NoteMD 的验证必须把以下步骤串起来看：

1. 当前 Markdown 笔记会在导出前转换成真正的 Slidev deck。
2. 能发现完整 Slidev skill 目录，包括 `references/*.md`，而不是只读 `SKILL.md`。
3. 本地 Slidev fork 存在时会被优先使用。
4. 现有 Slidev deck 也会先复制到隔离的 prepared working workspace，再进入验证链，避免 patch/retry 直接改写源笔记，同时允许把 sibling Slidev support entries 和显式引用的本地资产一并镜像进 working copy。
5. 每次 HTML build 前会重建输出目录，避免旧 chunk 残留。
6. 生成 deck 的 guardrails 会规范 theme 与逐页 frontmatter，并剥离生成页中的 Mermaid `zoom`，让 rendered audit 拥有实测 fit 决策权；LLM 生成的 deck 如果改变源 Mermaid fence，会在写入 prepared deck 前被拒绝。
7. HTML 导出会先尝试 native standalone，记录实际 HTML mode；只有在生成的 standalone bundle 确实缺少 slide loader binding 时，才自动回退到 server-script 兼容 HTML。
8. 最终 HTML 输出会经过真实浏览器打开，并默认审计整个 deck。
9. 生成的检查产物会保留在磁盘上供维护者直接打开检查，但默认被 Git 忽略，避免一次性导出文件误入提交。

## 维护者命令

用 docs vault 和 architecture 真实文件跑完整链路：

```bash
npm run verify:slidev-export
```

默认源文件是：

```text
docs/architecture.zh-CN.md
```

命令会写出与 UI 相同类型的产物：

```text
docs/export/_slidev-sources/architecture.zh-CN.slidev.md
docs/export/architecture.zh-CN-slides/index-standalone.html
或在 standalone 回退时写出 docs/export/architecture.zh-CN-slides/index.html
docs/export/architecture.zh-CN-slides/slide-*-workflow.png
```

验证可编辑 PPTX：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --json
```

PPTX 路径会写出：

```text
docs/export/architecture.zh-CN.pptx
docs/export/architecture.zh-CN.pptx.report.json
```

verifier 会把 `.pptx` 当作 zip 打开，并检查 slide XML 中是否存在可编辑文本节点 `<a:t>`，同时通过 `pptxInspection.tableCount` 统计 native DrawingML table。如果只是图片式 PPTX，这条路径应视为失败。

PPTX sidecar report 是导出合同的一部分，不能忽略。它会记录可见层策略（`visibleTextLayer = "background-image"`）、透明可编辑层策略、table consumption 数量、editability coverage、rich-run coverage、fallback-only 视觉对象类型、未建模 text-run 原因、`fontContract` 与逐页 summary。这样做是刻意的：复杂 Slidev/Mermaid/SVG/canvas 内容当前仍可作为 raster fallback，但 report 不能暗示它们已经是 Office 原生可编辑对象。

当前 `fontContract` 是诊断合同，不是默认打开可见原生文本的许可。它记录抽取到的字体族、承载 CJK 的字体族、承载 Latin 的字体族、writer 的 East Asian fallback 字体、Office 缺字风险，以及显式的 `fontEmbeddingPolicy = "not-embedded"` 状态。visible native text/table 后续必须先证明最终 Office 字体稳定，或先提供明确、授权可控的 local/vault 字体嵌入路径。

如果要逐页比较 PPTX 回放结果与写入 PPTX 的冻结视觉 reference：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json
```

该路径会写出：

```text
docs/export/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/architecture.zh-CN-pptx-visual-diff/comparison-metrics.csv
docs/export/architecture.zh-CN-pptx-visual-diff/pptx-background-reference/slide-*.png
docs/export/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
docs/export/architecture.zh-CN-pptx-visual-diff/all-diff-sheet.png
```

该门槛从 PPTX slide relationship 中抽取内嵌背景图作为 reference，不再另跑一次 Slidev PNG export。后者是另一个渲染实例，可能因为字体抗锯齿或页面状态漂移造成假失败。

报告还会输出诊断性几何与感知指标，例如 `maxScaleRatioDelta`、`maxDifferenceBoundingBoxAreaRatio`、`advisoryMetrics`、逐页 `diagnostics`、可选 `PHASH`/`NCC` 值与 `worstDifferenceBoundingBoxSlides`。除非显式传入阈值，这些指标应保持 advisory。密集文本抗锯齿可能造成大面积 diff bounding box，但不代表真实 slide overflow。

如果要把 PPTX 回渲结果与另一次 Slidev PNG 序列做 cross-export 对比，传入外部 reference 目录：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --pptx-visual-reference-dir docs/export/test-slidev-current-png-reference/architecture.zh-CN-slides-png --json
```

这条路径是 advisory，不是 strict hard gate。它适合检查 PNG export 与 PPTX capture 是否共享同一套 viewport、route、freeze、font-readiness 与稳定等待合同；除非外部 reference 来自同一个冻结 HTML/capture 合同，否则不能替代 frozen-background hard gate。本机 ImageMagick 支持 `PHASH` 与 `NCC`；如果当前构建没有暴露 `SSIM`，报告会把 `SSIM` 标成 unavailable，而不是让验证失败。

报告模式会记录 `pptxVisualDiff.gate.passed`，但视觉阈值超标时不会让整个 verifier 失败。严格收口时加：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json
```

如果只需要机器可读的轻量结果：

```bash
npm run verify:slidev-export -- --no-screenshots --json
```

如果要声称 native standalone 已通过，不能只看兼容默认路径。必须运行严格 gate：

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

该报告必须包含 `htmlExport.actualMode: "standalone"` 与 `standaloneGate.passed: true`。

测试其他 vault-relative 源文件：

```bash
npm run verify:slidev-export -- --source path/to/source.md
```

运行更重的 synthetic full-deck layout fixtures，同时避免把生成文件写进仓库：

```bash
npm run verify:slidev-layout-fixtures -- --archive /home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures
```

该命令会在仓库外创建临时 vault，调用生产 verifier，并归档 source fixture、最终 deck、report 与 standalone export。修改 layout audit、Mermaid fit、table/code 拆分、文本测量或 slot Transform 行为时应运行它。

当前 expanded fixture 归档为：

```text
/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/
```

当前 Stage 12 fixture archive 为：

```text
/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/
```

其中新增 `mixed-component-prose-stress`，用于证明自定义 `dashboard-shell` 中一个完整 Vue component surface 与 Markdown prose/list 主内容块可以先被分离为独立 presentation surfaces，后续组件页通过 measured local `<Transform>` 收敛，正文页不继承整页 `zoom`。该套件仍要求 Mermaid fence byte-stable，不允许把一个源 Mermaid 图拆成多个图，也不允许改写 fence metadata 或图体内容。

Stage 13/14 新增 expected-failure fixtures，用于验证不安全 component/table、component/fence 与 component/image 边界会显性失败而不是被整页 `zoom` 静默修掉：

```bash
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-table-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture --timeout-ms 300000
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-fence-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture --timeout-ms 300000
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-image-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture --timeout-ms 300000
```

这些 fixtures 的成功含义是生产 verifier 报告 `ok = false`，blocked reason 指向 `mixed component and primary Markdown content cannot be fixed with whole-slide zoom`，同时 standalone gate、浏览器加载、Git 可见性、失败指纹和 Mermaid source-preservation 都通过。image fixture 还要求本地 SVG 资产同时存在于 prepared deck 和最终 standalone export。默认 fixture suite 不包含 expected-failure；若要一起审查，显式传 `--include-expected-failures`。

如果本机已有真实 Obsidian 桌面会话，也应补一层真实命令路径 smoke：

```bash
obsidian open path=architecture.zh-CN.md vault=/home/jacob/obsidian-NotEMD/docs
obsidian command id=notemd:export-slides vault=/home/jacob/obsidian-NotEMD/docs
```

在 2026-06-18 的 Jacob docs vault 上，这条命令已经执行成功。它是宿主命令级 smoke，不是 DOM 点击自动化。

真实 `architecture.zh-CN.md` strict standalone run 的验收索引已落盘到：

```text
docs/maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md
```

## 通过标准

只有最终 JSON 同时满足以下条件时，才把这次导出视为通过：

1. `ok: true`
2. `environment.capabilities.html: true`
3. 安装本地 fork 时，`environment.slidev.version` 应显示本地 fork 路径
4. `slideSource.skillRootPath` 指向已解析的 Slidev skill 目录
5. `slideSource.skillReferenceCount` 大于零
6. `deck.theme` 等于配置主题，通常是 `default`
7. `deck.containsKnownStaleText: false`
8. `deck.containsMissingTheme: false`
9. 所有 `playwright[].failed` 都是 `false`
10. `unignoredOutputs: []`
11. `layoutAuditSummary.overflowCount: 0`
12. `layoutAuditSummary.unreadableCount: 0`
13. 严格 native standalone 收口时，`htmlExport.actualMode: "standalone"`
14. 严格 native standalone 收口时，`htmlExport.requiresLocalServer: false`
15. 严格 native standalone 收口时，`htmlExport.standaloneAttempt.loaderGaps: []`
16. 严格 native standalone 收口时，`standaloneGate.passed: true`
17. 源文件包含 Mermaid fence 时，除非人工显式改源文档，否则导出 deck 的 Mermaid fence 数量、顺序、fence metadata 与逐 fence 正文必须与源文档一致。
18. Mermaid/prose 混排页不能保留低整页 zoom；如果可以迁移非图内容，Mermaid fence 的 opener、metadata、body、closer 原样保留在 Mermaid 专属页，正文移动到可读页。
19. 已有局部 `<Transform>` 的页面，包括非 slot 的 single-surface wrapper，不能在后续 retry 中再叠加整页 `zoom`。
20. mixed component/prose 页在存在安全 component/prose 边界时不能保留整页 `zoom`；如果边界不安全，patcher 应阻断整页 `zoom` 并暴露 blocked/manual-review，而不是缩小正文。
21. expected-failure fixture 不能因为 verifier `ok = false` 就算失败；它必须证明失败原因、standalone 环境和源内容保持都符合预期。默认成功 suite 仍必须只包含 `ok = true` 的可收敛 fixtures。
22. PPTX 收口时，`environment.capabilities.pptx: true`
23. PPTX 收口时，`pptxInspection.isZip: true`
24. PPTX 收口时，`pptxInspection.textRunCount > 0`
25. PPTX 收口时，若源 deck 每页都有文本，`pptxInspection.slidesWithoutEditableText` 必须为空
26. PPTX 收口时，含表格的 deck 应满足 `pptxInspection.tableCount > 0`
27. PPTX 收口时，sidecar report 必须记录 `textBoxCount`、`tableCount`、`consumedTableCount`、`consumedTableTextCandidateCount`、`richTextBoxCount`、`richTextRunCount`、`editableTableCellCount`、`editableTextSlideCount`、`imageFallbackCount`、`pagesWithoutEditableText`、`editablePrimitiveCoverage`、`fontContract`、`fallbackOnlyElementKinds`、`unmodeledTextRunReasons` 与逐页 summary
28. PPTX 视觉收口时，必须加 `--pptx-visual-diff --require-pptx-visual-match`
29. PPTX 视觉收口时，`pptxVisualDiff.reference.source: "pptx-background-images"`
30. PPTX 视觉收口时，`pptxVisualDiff.comparison.summary.missingReferenceSlides: []`
31. PPTX 视觉收口时，`pptxVisualDiff.comparison.summary.missingRenderedSlides: []`
32. PPTX 视觉收口时，`pptxVisualDiff.comparison.summary.maxRmse <= 0.12`
33. PPTX 视觉收口时，`pptxVisualDiff.comparison.summary.meanRmse <= 0.08`
34. PPTX 视觉诊断时，应查看 `pptxVisualDiff.comparison.summary.maxScaleRatioDelta` 与 `maxDifferenceBoundingBoxAreaRatio`，但在阈值能区分 layout 位移和渲染噪声前，不应把它们默认升级为 hard failure
35. external PNG advisory 对比时，`pptxVisualDiff.reference.source: "external-png-sequence"` 可以出现 `pptxVisualDiff.gate.passed: false` 且 verifier 仍为 `ok: true`；应把 `advisoryMetrics.diagnosticCounts.referenceContractDriftLikely` 和 `layoutDriftLikely` 分开读

任一条件失败，都应先修 NoteMD 工作流，再相信导出文件。

## 渲染后可见范围质量门

当前工作流已经能证明 UI 等价导出路径可以生成 deck，并且默认会把整个准备后的 deck 放进真实浏览器审计。这是必要条件，因为密集架构笔记即使 build 成功，Mermaid 图、表格、代码块或长文本仍可能被固定 16:9 画布裁掉。

当前实现已经把 render-feedback gate 落到了共享工作流上；只要 Playwright 可用，维护者 verifier 与真实产品导出命令都会走这条链路：

1. 测量前等待 `document.fonts.ready`、图片 decode 和 Mermaid 渲染完成；
2. 对每个被审计页检查 DOM bbox 是否超出实际可见 slide root、是否存在 scroll overflow、Mermaid 容器是否溢出、表格自然宽度是否溢出、代码块是否溢出；
3. 将问题归类为 `overflow`、`unreadable-scale`、`stale-output` 或 `render-error`；
4. 基于渲染证据对 prepared working deck 做有界 patch/retry，当前最多 6 轮；
5. 如果多轮重试后内容仍被真实可见 slide root 裁掉，应 fail closed 并输出审计报告。

`ref/infinite-canvas` 只能作为 clean-room 设计参考。真正值得借鉴的不是把无限画布嵌进 Slidev export，而是先把 slide 元素建模成可测量的 world rect，计算 union bounds，再为固定 Slidev safe rect 推导 fit camera；一旦 fit 会破坏可读性，只能对非 Mermaid 的 table/code/prose/component presentation surface 做结构化拆分或局部 Transform。Mermaid 必须保持一个源 fence 对应一个导出 fence，并通过 `source-preserved-fit-review` 或 `manual-review` 暴露质量风险。不要把 AGPL-3.0 实现代码复制进 MIT 项目。

当前报告结构已经把 hard gate 与 quality gate 拆开，包含以下字段：

```text
layoutAudit[].slide
layoutAudit[].findings[]
layoutAudit[].safeRect
layoutAudit[].contentBounds
layoutAudit[].effectiveMinFontPx
layoutAudit[].svgTextMinFontPx
layoutAudit[].tableBodyMinFontPx
layoutAudit[].codeMinFontPx
layoutAudit[].qualityMargins
layoutAudit[].contentAreaRatio
layoutAudit[].mermaidFit.status
layoutAudit[].mermaidFit.reason
layoutAudit[].mermaidFit.pageScale
layoutAudit[].mermaidFit.fitScale
layoutAudit[].mermaidFit.nextZoom
layoutAudit[].mermaidFit.diagramBounds
layoutAudit[].mermaidFit.effectiveMinFontPx
layoutAudit[].mermaidFit.svgTextMinFontPx
layoutAudit[].mermaidFit.qualityMargins
layoutAudit[].mermaidFit.contentAreaRatio
layoutAudit[].mermaidFit.lowZoom
layoutAudit[].mermaidFit.lowFont
layoutAudit[].mermaidFit.tightMargin
layoutAudit[].recommendedPatch
layoutAuditSummary.hardOverflowCount
layoutAuditSummary.unreadableScaleCount
layoutAuditSummary.lowEffectiveFontCount
layoutAuditSummary.qualityMarginWarningCount
layoutAuditSummary.lowContentUtilizationCount
layoutAuditSummary.preSplitCount
layoutAuditSummary.postPatchCount
layoutAuditSummary.mermaidSlideCount
layoutAuditSummary.mermaidFitReviewCount
layoutAuditSummary.mermaidLowZoomCount
layoutAuditSummary.mermaidManualReviewCount
layoutAuditSummary.retryCount
mermaidSourcePreservation.required
mermaidSourcePreservation.passed
mermaidSourcePreservation.sourceFenceCount
mermaidSourcePreservation.deckFenceCount
mermaidSourcePreservation.changedFenceIndexes
```

对 Mermaid 来说，`mermaidFit.status` 是源图保持证据，不是允许自动改写或拆分用户图的指令。`fits` 表示保留源图后满足当前渲染阈值；`source-preserved-fit-review` 表示 deck 结构上成立，但由于低 zoom 或边距偏紧，需要人工看图确认演示质量；`manual-review` 表示保留源图与投影可读性存在冲突，流程必须暴露这个事实，而不是静默把一张图拆成多张图。

`mermaidSourcePreservation` 是更严格的结构门禁：源笔记包含 Mermaid fences 时，verifier 会逐个比较导出 Mermaid fence 与源 fence。只做到数量一致不够；内容变化、顺序变化、fence metadata 变化，或把一个源图改写成多图，都必须让报告失败。

同一约束也会更早在 source preparation 执行：一次性 LLM 生成和基于 outline 继续生成都会在写 `_slidev-sources` 前比较源 Mermaid fence 与候选 deck fence。数量、顺序、fence metadata 或正文任一变化，workflow 会拒绝该候选并回退到 deterministic source-preserving deck。

具体推进路线见 `docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md`。该路线保留当前 render-feedback loop 作为最终事实门，但在生成前增加 clean-room layout planning IR，并把 `ref/infinite-canvas` 的 world rect / viewport fit 思想转译为 NoteMD 自有几何算法，而不是复制 AGPL-3.0 实现或把无限画布 UI 嵌入 Slidev export。

当前真值：

1. 默认 HTML 验证在未传 `--sample-slides` 时会审计整个准备后的 deck；
2. patcher 的 `zoom` 来自真实 overflow 测量，而不是固定导出常数；
3. patcher 默认保留 Mermaid 源 fence；结构化拆分只适用于 Markdown table、病态宽表或长 cell 表的 record-list fallback、非 Mermaid fenced code block、简单的标题 + 段落/列表页、generic slot-marked layout（含显式 `::default::`），以及可结构拆分的第一张 deck headmatter 页面；
4. 生成 Mermaid 页的 guardrail 不再补缺省 `zoom`，也不信任 LLM 选择的 Mermaid `zoom`；写入 `_slidev-sources` 前会剥离生成页中的 Mermaid zoom，但用户已有 Slidev 源 deck 会在隔离 working copy 中保留显式源设置；
5. 现有 Slidev deck 现在会进入 `_slidev-sources/<deck-basename>/` 隔离 working copy 目录；若 sibling 下存在 `layouts/`、`public/`、`setup/`、`components/`、`snippets/`、`styles/`、`global-top.vue`、`global-bottom.vue` 等常见 Slidev support entries，也会一并镜像进去；
6. 渲染后布局审计现在也会测量带直接文本的 `div` / `section` / `article` / `aside` / `span`，因此 component-heavy 页面不会再被静默低估成“空布局”；
7. component-heavy slot zone 现在会在 prepared working copy 中带上轻量 owner wrapper；渲染测量不仅会带回 slot ownership，还会记录 zone 级 owner rect、content bounds、scroll overflow 与推荐的局部 transform scale；
8. 即使 slot container 用 `overflow-hidden` 把后代裁出了当前视口，slot-owned descendant 现在也会进入测量，因此 component-heavy slot 内容不会再因为被容器裁掉就被静默低估；
9. component-heavy custom slot layout 在结构拆分不可用时，现在可以回退到局部 `<Transform :scale=\"...\">` 包裹；该 scale 由当前超界 zone 相对于 slot-owner 几何与 scroll 边界的检测结果推导，而不是固定常数或 LLM 手动决定；当多个 component-heavy zone 独立溢出时，patcher 现在可以在同一页里对每个可变换 zone 分别包裹局部 `<Transform>`；只有在仍然必须选择唯一 owner 时，才会优先使用 zone 级几何归因，并在几何结果打平时回退到 slot signal / rendered text hint；
10. pass/fail 的 hard overflow 仍以渲染后的 slide root 为边界，而 `safeRect` 继续只承担 measured scale 的保守拟合目标；这样既不会放过真正裁剪，也不会把合理的 edge-aligned layout 过度误杀；
11. 共享的 `convergeSlidevDeckLayout()` 现在已经进入 `exportSlidesCommand()` 与维护者 verifier，因此 HTML/PDF/PNG/MP4 都会复用同一个收敛后的 prepared deck；
12. HTML exporter 现在会返回结构化 outcome，包含 `requestedMode`、`actualMode`、fallback 状态与 standalone sanity 细节；已知坏掉的 native attempt 会先保留为 `index-standalone.failed.html`，再进入兼容 fallback；
13. 真实 `docs/architecture.zh-CN.md` 严格 native standalone workflow 现在已经收敛到 `ok: true`、`actualMode: "standalone"`、`requiresLocalServer: false`、`standaloneGate.passed: true`、`27` 个审计页，hard overflow / unreadable scale / low effective font / quality margin warning / low utilization 均为零，`retryCount = 4`；preserve-Mermaid rerun 保持源文档与导出 deck 均为 `3` 个 Mermaid fence，且当前 verifier 必须报告 `mermaidSourcePreservation.passed = true`；当前 Stage 14 证据包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`；
14. 同一真实源文件的 `PDF` 与 `PNG` 验证也返回 `ok: true`，而且现在导出自同一个收敛后的 deck，而不是 raw prepared source；
15. rendered layout audit 现在会同时报告 effective minimum font、SVG text font、table/code minimum font、quality margins 与 content-area ratio；
16. low effective font、tight margin 与 low content utilization finding 现在会对 table/code/prose 携带结构化 `recommendedPatch`；Mermaid 低字号指标会被记录，但默认保持源 fence，不把一张原图自动拆成多张图；
17. source preparation 现在会生成 clean-room `SlideLayoutPlan`，并把 deterministic layout budget 注入 deterministic outline、一次性 Slidev deck prompt 与基于大纲继续导出的 prompt。
18. rendered layout audit 现在还会报告 `mermaidFit` 与对应 summary 计数，让 Mermaid 低 zoom、低字号和 manual-review 情况可见，但不修改原始 Mermaid fence；真实 `architecture.zh-CN.md` rerun 报告 `mermaidSlideCount = 3`、`mermaidFitReviewCount = 3`、`mermaidLowZoomCount = 2`、`mermaidManualReviewCount = 1`。
19. table/code quality splitting 已进入第二个结构化切片：长 table cell 会转成 key-value record-list slide，code fence 会优先按语义块拆分，再退回空行或行数预算。
20. effective font measurement 现在会把文本节点到 slide root 之间的局部 CSS `transform`、independent `scale` 与 CSS `zoom` 乘入逐样本字号，因此被局部 `<Transform>` 包裹的内容会按真实渲染字号进入质量门，而不是按未缩放的 computed font size 误判。
21. TypeScript 与 JavaScript code fence 现在会先走轻量 top-level tokenizer，再进入通用语义拆分；连续 import 组和顶层 type/function/class/const 声明在密集代码页拆分时保持完整。
22. Mermaid source-preservation 现在有独立回归测试：即使 Mermaid slide 被错误送入 code structural patch 候选，patcher 也不会把一个 `mermaid` fence 当作可拆分代码块；一次性或基于 outline 的 LLM 生成若改变源 Mermaid fence，source preparation 必须在写 prepared deck 前拒绝该候选。
23. Python 与 Rust code fence 现在也会先走轻量 top-level tokenizer，再进入通用语义拆分；Python import 组、decorator、顶层 class/function block，以及 Rust use 组、attribute、顶层 struct/enum/trait/impl/fn/mod item 会保持完整。
24. Stage 5 fixture 覆盖现在已经把保留 Mermaid 源图时的 `source-preserved-fit-review` 与 `manual-review` 分开测试，并用 Playwright measurement fixture 证明 record-list table fallback 在浏览器里是可读文本，不再是溢出的 table。
25. synthetic full-deck layout fixtures 现在会跑完整生产 verifier：`source-layout-stress` 覆盖完整 skill references、native standalone、Mermaid fence 保真、record-list fallback 与 code splitting；`slot-component-stress` 覆盖 component-heavy slot 的局部 Transform 收敛，并防止整页 zoom 叠加。2026-06-20 归档为 `/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`。
26. text overflow measurement 现在对 text 元素使用 text-node Range glyph rectangles，而不是 block-level element box，因此不会因为 `h1` 的块级布局盒比实际可见文字宽就误判失败。
27. Mermaid-only 页面可以用测量得到的低 zoom 保证一张保留源图完整可见；可读性风险通过 `mermaidFit.manual-review` 暴露，而不是拆分或改写原 Mermaid 图。
28. Mermaid/prose 混排页现在会在允许 source-preserved Mermaid fit 之前先移动非 Mermaid 主内容；每个源 Mermaid fence 仍保持一个 byte-stable fence，opener、metadata、body、closer 均不变，unsupported mixed layout 会阻止低整页 zoom，而不是把正文一起缩小。
29. prepared deck workspace 现在会复制 Markdown image、HTML media/link/srcset 属性和 Slidev frontmatter `background`、`image`、`src`、`favicon`、`poster`、`download` 显式引用的本地相对资产；deck 显式引用的本地 CSS 文件还会作为本地依赖图继续解析，包含 `url(...)` 图片/字体依赖和本地 `@import` 样式链，并按每个 CSS 文件所在目录解析相对路径。URL、绝对路径、NUL 字节和越界 traversal 会被拒绝，复制后的 CSS 会移除或中和这些被拒绝的本地引用，也不会粗暴复制整个源目录。
30. local Slidev fork 的 standalone bundler 现在用括号平衡的函数边界替换来 stub Vite preload helper，避免误删第一张 slide loader binding。NoteMD strict standalone gate 仍保持 fail-closed，继续报告 loader gaps，而不会把 fallback 输出当成 native standalone 成功。
31. native standalone 或 server-script HTML build 完成后，exporter 会把 prepared deck 仍显式引用的本地文件、CSS `url(...)` 依赖和本地 CSS `@import` 链同步到最终 `<source>-slides/` 输出目录，避免 frontmatter background、image layout、favicon、poster、linked CSS、imported CSS、本地字体或 CSS background image 反向依赖临时 prepared workspace；被拒绝的 CSS import/url 会在复制后的 CSS 中被移除或中和，避免 standalone 继续请求缺失的本地文件。
32. 未显式配置顶层 `fonts:` 的 prepared deck 会注入 `fonts.provider: none`，避免 strict standalone 验证因 Google Fonts 等外网字体请求超时；用户显式字体配置保持不覆盖。
33. 2026-06-20 CSS asset dependency 收口验收包位于 `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`；真实 `architecture.zh-CN.md` strict standalone report 为 `ok = true`，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`skillReferenceCount = 52`，且 `mermaidSourcePreservation.passed = true`。
34. 2026-06-20 CSS import/media fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`；生产 fixture suite 现在覆盖本地 CSS `@import` 递归、imported CSS 内的字体/背景图依赖、本地 video/audio/track/poster 资产、CSS sanitizer 行为，以及越界 imported stylesheet 在 prepared workspace 和最终 standalone export 两层都不会被复制。
35. 生成式测试导出产物已不再跟踪在 `docs/export/test-slidev-*`、`docs/export/test-slidev.pdf`、`docs/export/test-slidev-video.mp4` 或旧 `docs/export/slides/` 下；后续 Slidev 生成产物默认作为仓库外 evidence package 保存，除非任务明确要求提交经过审查的 artifact。
36. 2026-06-20 font-safe slot/code convergence 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`；slot zone audit 现在报告 zone 内最小 effective font 与最低可读 Transform scale，局部 `<Transform>` 和整页 `zoom` 都会拒绝跌破字体下限的 scale。多个 component-heavy named slot 若无法以可读 scale 局部缩放，会分页为独立默认画布并保留 `data-notemd-slot-zone` 证据。
37. table/code 结构拆分现在会在字体下限禁止 `zoom` 时触发，chunk 数按实测 fit factor 估算；`source-layout-stress` 重新验证为 `ok: true`，使用 `/home/jacob/slidev/skills/slidev` 与 52 个 references，最终 `hardOverflowCount = 0`、`lowEffectiveFontCount = 0`。
38. 同批真实 `architecture.zh-CN.md` strict standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`；报告为 `ok = true`，使用本地 Slidev fork，加载 52 个 skill references，`actualMode = "standalone"`，`requiresLocalServer = false`，`mermaidSourcePreservation.passed = true`，并归档了可审查的 `architecture.zh-CN.slidev.md`。
39. bounded raw HTML/component single-surface custom layout 现在可以通过 measured local `<Transform>` 收敛，不需要 `data-notemd-slot-zone` wrapper。`custom-single-surface-component-stress` fixture 会检查最终 deck 保留 `layout: surface-shell`、保留 component surface 内容，并拒绝局部 Transform 后继续叠加整页 `zoom` 的回归。
40. Stage 9 真实 `architecture.zh-CN.md` strict standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage9-architecture-real/`；报告为 `ok = true`，使用本地 Slidev fork，加载 52 个 skill references，输出 native standalone HTML，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，并归档了可审查的 `architecture.zh-CN.stage9.slidev.md`。
41. bounded component-only Vue tree surface 现在也可以通过 measured local `<Transform>` 收敛。`custom-vue-component-tree-stress` fixture 覆盖 multiline component opener、multiline prop array、nested components 与 named template slot，最终 deck 保留 `layout: dashboard-shell`，不引入 `data-notemd-slot-zone`，不叠加整页 `zoom`。
42. Stage 10 真实 `architecture.zh-CN.md` strict standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage10-architecture-real/`；报告为 `ok = true`，使用本地 Slidev fork，加载 52 个 skill references，输出 native standalone HTML，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，并归档了可审查的 `architecture.zh-CN.stage10.slidev.md`。
43. Stage 11 Mermaid source boundary 收口验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage11-mermaid-source-boundary/`；新增回归测试覆盖 mixed Mermaid/prose 迁移后 inline metadata 仍保持，以及 LLM 只改 Mermaid fence metadata 时也必须被 source preparation 拒绝。真实 `architecture.zh-CN.md` strict native standalone report 为 `ok = true`，`actualMode = "standalone"`，`requiresLocalServer = false`，`mermaidSourcePreservation.passed = true`，`changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，并归档了可审查的 `architecture.zh-CN.stage11.slidev.md`。
44. Stage 12 mixed component/prose 收口验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`；新增 `mixed-component-prose-stress`，完整生产 fixture suite 现在覆盖 9 个 fixtures，`mixed-component-prose-stress` 收敛为 3 slides、2 patch passes、保留 `layout: dashboard-shell`、保留 prose/component 指纹、无整页 `zoom`，并通过 measured local `<Transform>` 收敛组件页。
45. Stage 12 真实 `architecture.zh-CN.md` strict native standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`；报告为 `ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` 与 `/home/jacob/slidev/skills/slidev` 的 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，并归档了可审查的 `architecture.zh-CN.stage12.slidev.md` 与 `architecture.zh-CN-slides/index-standalone.html`。
46. Stage 13 expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture/`；`unsupported-component-table-boundary-stress` 证明 unsupported component/table boundary 不会被整页 `zoom` 静默修掉，同时保留一个源 Mermaid fence 为一个导出 Mermaid fence。
47. Stage 13 默认成功 fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`；9 个可收敛生产 fixtures 均通过，expected-failure fixture 默认排除。
48. Stage 13 真实 `architecture.zh-CN.md` strict native standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`；报告为 `ok = true`，使用本地 Slidev fork 与 52 个 skill references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，并归档了可审查的 `architecture.zh-CN.stage13.slidev.md` 与 `architecture.zh-CN-slides/index-standalone.html`。
49. Stage 14 component/fence expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture/`；`unsupported-component-fence-boundary-stress` 证明 unsupported component/fence boundary 不会被整页 `zoom` 静默修掉，同时保留一个源 Mermaid fence 为一个导出 Mermaid fence。
50. Stage 14 component/image expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture/`；`unsupported-component-image-boundary-stress` 证明 image 混排边界同样 fail transparent，并验证 `assets/boundary-image.svg` 在 prepared deck 和最终 standalone export 两层都存在。
51. Stage 14 默认成功 fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage14-success-fixtures/`；9 个可收敛生产 fixtures 均通过，三个 expected-failure fixtures 默认排除。
52. Stage 14 真实 `architecture.zh-CN.md` strict native standalone 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`；报告为 `ok = true`，使用本地 Slidev fork 与 52 个 skill references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，并归档了可审查的 `architecture.zh-CN.stage14.slidev.md` 与 `architecture.zh-CN-slides/index-standalone.html`。
53. 2026-07-02 process-resolution 收口修复了 Windows 上表现为 `spawn EINVAL` 的底层环境探测失败。exporter 现在会先尝试 direct execution；Windows bare command name 通过 `PATH` + `PATHEXT` 解析；`.exe` / `.com` 直接执行；`.js` / `.mjs` / `.cjs` 通过 `process.execPath` 运行；只有解析结果是 `.cmd` / `.bat` shim 时，才进入带安全 quoting 的 `cmd.exe /d /s /c call` 隔离路径。Linux 与 macOS 继续 direct exec，不因为 Windows 需要 batch-shim adapter 就额外加 shell 层。
54. 2026-07-04 standalone-bundle 复核新增显式 rendered-layout gate。严格 native standalone 声明现在必须同时通过 native bundle sanity gate 与 Playwright rendered layout audit；`--no-playwright --require-native-standalone` 必须失败，因为它不能证明最终 `index-standalone.html` 渲染后没有表格/正文溢出。
55. `tableBodyLayoutGate` 现在是表格与正文/主体内容的交付门禁。它会报告已审计页数、表格页数、正文页数、失败数量、失败页与具体失败项。Mermaid-only finding 不会让这个门禁失败；Mermaid 仍由 `mermaidSourcePreservation` 与 `mermaidFit` 管理，因为保持一个源 Mermaid fence 对应一个导出 fence，比自动拆图是更强的结构不变量。
56. 2026-07-04 对真实 `architecture.zh-CN.md` 的 Windows 验证证明了所有支持格式都走同一条已收敛 deck 路径：standalone HTML、PDF、PNG、PPTX 与 MP4 都在全量 deck audit 后返回 `ok = true`，报告 32 个审计页、8 个表格页、32 个正文页、零表格/正文失败、零 hard overflow、零 unreadable/low-effective-font finding，并保持全部 3 个 Mermaid fence 的 `changedFenceIndexes = []`。
57. 同一 PPTX 验证报告 339 个可编辑文本框、8 个原生表格、106 个可编辑表格单元格，并覆盖全部 8 个表格页的 rich table-cell。这不声明 Mermaid/SVG 内部具备 Office 原生可编辑性；它们仍是背景图视觉层，而正文文本、代码文本与表格单元格会建模为可编辑 PowerPoint primitive。
58. VitePress 文档构建隔离现在会排除生成或历史输出树：`archive/root-history/**`、`export/**` 与 `dist/**`。生成的 Slidev 导出结果继续作为 `docs/export/` 下的本地证据，而不是 Pages 源码文件。

当前限制：

1. effective font measurement 现在已经覆盖常见局部 CSS transform / scale / zoom 链，但复杂 Vue layout 仍必须以浏览器 rendered audit 为准，不能退回静态 Markdown 估算；
2. 超出当前支持集的 richer custom/component-heavy Slidev layout 仍保持保守/manual-review 路径，尤其是缺少稳定 owner surface、component/prose/component 顺序不稳定或不能安全分页的情况；Stage 14 已覆盖 component/table/fence/image fail-transparent，component/directive 阻断由单测覆盖，不证明任意 Vue component tree 都能安全 Transform；多个 named slot 竞争且 unsafe 的路径已由 slot 分页 fixture 覆盖；
3. native standalone 现在已有严格 gate，且真实 architecture fixture 已通过；但正确性仍依赖 post-build sanity detection，server-script fallback 只是兼容通道，不能再被算作 native standalone 成功；
4. full-deck Playwright 验证故意比代表性抽样更慢，后续优化方向应是提高 patch 收敛能力，而不是退回弱审计；
5. `obsidian command id=notemd:export-slides` 目前仍只能算 dispatch-level smoke，因为 Obsidian CLI 没有暴露导出完成握手信号。
6. Mermaid `manual-review` 证据不是 hard gate failure。它是在“不修改原 Mermaid 内容”和“自动保证投影级可读”不能同时被证明时，正确暴露给维护者的透明结果。
7. code splitting 仍是 parser-light；TypeScript/JavaScript/Python/Rust 已有 top-level tokenizer，但完整 AST 拆分与更多语言专用 splitter 仍是后续工作。
8. Mermaid 不拆图约束不等于 Mermaid 演示质量自动合格。超大源图如果只能靠低 zoom 保持完整，流程应暴露 `source-preserved-fit-review` 或 `manual-review`，而不是静默改图或拆图。
9. 当前 full-deck fixtures 已覆盖长表、宽表、混合代码、Mermaid 源图保持 fit、component-heavy slot Transform 边界、Mermaid/prose 非图内容移动、本地图片资产、嵌套 slot component、超宽表、frontmatter background/image/favicon、跨目录资产、CSS `url(...)` 图片/字体依赖、本地 CSS `@import` 链、本地 video/audio/track 资产、离线字体边界、bounded raw HTML/component single-surface、bounded component-only Vue tree surface、清晰边界 mixed component/prose 与 unsupported component/table/fence/image expected-failure，但仍不是 exhaustive；后续真实文档若出现复杂 Vue component 或 unsupported layout 失败，应继续沉淀为 fixture。
10. 进程启动可移植性现在属于导出契约的一部分。不要把平台适配器退回到全局 `shell: true`；它虽然可能掩盖 `.cmd` 解析失败，但会破坏 JSON 与代码式参数的参数保真。
11. strict standalone 验证有意比 bundle-generation smoke test 更慢。快速路径适合本地迭代，但任何关于 standalone 交付、表格/正文分页或跨格式导出质量的最终声明，都必须包含 rendered layout 证据。

## 输出策略

`docs/export/` 下的生成文件是维护者检查产物。它们对本地视觉审查有价值，但除非发布或文档任务明确要求，不应提交这些临时生成结果。

提交 Slidev 导出相关改动前检查：

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

维护者本地期望状态：

1. 生成文件可以显示为 untracked；
2. 生成的 `docs/export/<run>/...` 验证产物应被 `docs/export/*` ignore 规则覆盖；
3. 最终 commit 应包含源码、工作流或文档改动，不应夹带临时生成测试输出。

## UI 契约

命令面板导出动作与侧栏导出动作都必须进入 `exportSlidesCommand()`。

该方法应保持以下顺序：

1. 探测环境；
2. 准备 Slidev export source；
3. 按所选格式导出已准备的 source；
4. 报告具体输出路径。

设置页必须暴露默认导出格式（`HTML`、`PDF`、`PNG`、`PPTX`、`MP4`），当选择 HTML 时还应暴露 HTML mode。任何隐藏格式选择的 UI 改动都应视为导出工作流回归。

## 什么时候运行

以下改动都应运行 `npm run verify:slidev-export`：

1. `src/main.ts` 的导出命令接线；
2. `src/ui/NotemdSidebarView.ts` 或 Slidev export 控件；
3. `src/ui/NotemdSettingTab.ts` 的 Slidev 设置；
4. `src/slideExport/*`；
5. 本地 Slidev fork 解析；
6. Slidev skill 加载或 prompt 准备；
7. 输出目录清理、打包或浏览器打开行为。

以下改动还应运行 `npm run verify:slidev-layout-fixtures`：

1. rendered layout measurement；
2. Mermaid fit/manual-review 处理；
3. table/code 结构化拆分；
4. slot-zone 测量或局部 Transform patch；
5. 任何用于避免非 Mermaid 内容依赖整页低 zoom 的规则。

代码改动还应同时运行：

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxVisualDiff.test.ts src/tests/pptxExportReport.test.ts
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm test -- --runInBand src/tests/slidevRenderedMeasurement.test.ts
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm run verify:slidev-layout-fixtures -- --timeout-ms 300000
npm run build
git diff --check
```

## Slidev skill PR 评估

只有那些对 NoteMD 之外也成立的通用指导，才值得提到共享 Slidev skill。

适合上游 skill PR 的内容：

1. 将长篇技术文档转换成 Slidev deck 时，应使用完整 skill references，而不是只依赖顶层 `SKILL.md`；
2. 除非项目明确声明已安装自定义主题，否则优先使用内置或调用方配置的主题；
3. 逐页 frontmatter 必须在正文前闭合；
4. 用户 Mermaid 图必须保持完整，并让浏览器 rendered audit 推导必要的 Mermaid zoom 或复核状态；表格与密集代码块再按实测 overflow 使用结构化拆分、`zoom` 或 `Transform`；
5. 验证导出结果时应 build 并在浏览器里检查渲染页，而不只是检查 Markdown 已生成；
6. 当旧资产可能影响浏览器输出时，重建前应清理或重建输出目录。

这些应留在 NoteMD 本地，不应上游：

1. `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` fork 探测；
2. NoteMD 的 vault-relative 输出路径；
3. `architecture.zh-CN.md` 这个具体 smoke fixture；
4. `快速定位` 这类 NoteMD 专属旧内容检查。

建议：等当前 NoteMD 工作流稳定后，可以给上游 Slidev skill 准备一个小 PR，范围只放通用 deck-conversion/export guardrails，不包含 NoteMD 的路径和 vault 行为。
