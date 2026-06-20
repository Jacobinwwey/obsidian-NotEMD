---
date: 2026-06-20
last_updated: 2026-06-20
topic: slidev-layout-quality-and-canvas-roadmap
canonical: true
status: stage5-full-deck-fixtures-and-source-preserved-fit-implemented
---

# Slidev 布局质量与画布规划路线

## 1. 为什么需要这份文档

当前 Slidev export 已经跨过“按钮是否真的能导出”的阶段，但还没有跨过“导出的演示是否稳定达到演示质量”的阶段。

这两件事不能混为一谈：

1. `standalone`、完整 skill references、本地 Slidev fork、UI 等价 verifier、full-deck Playwright audit 已经落地；
2. 真实 `architecture.zh-CN.md` 导出仍出现低 `zoom`、图表空间利用率差、表格贴边等质量问题；
3. `ref/infinite-canvas` 提供了有价值的几何建模参考，但它不能被误解成“把无限画布嵌进 Slidev 就能解决问题”。

本文件把当前进度、现有代码边界、先前方案要求、`ref/infinite-canvas` 可借鉴点与下一阶段实现路线落盘，避免后续会话再次退回“CLI 能 build 就算导出成功”或“缩进去就算可读”的弱判断。

## 2. 当前基线

当前代码基线：

1. 分支：`main`
2. 远端：`origin/main`
3. 本批次实现内容：rendered quality gate + clean-room `SlideLayoutPlan` 第一切片 + Mermaid 源图保持 fit 审计 + JS/TS/Python/Rust tokenizer + Mermaid 不拆图回归契约 + Stage 5 full-deck/export fixture、文本 glyph rect 测量、slot Transform 去整页 zoom 叠加
4. 真实源文件：`docs/architecture.zh-CN.md`
5. 本批次真实导出证据包：`/home/jacob/slidev-export-review/2026-06-20-quality/`
6. 本批次最终 source-preserved-fit 输出归档：`/home/jacob/slidev-export-review/2026-06-20-source-preserved-fit-final/`
7. 局部 transform 字号感知验收包：`/home/jacob/slidev-export-review/2026-06-20-local-transform-font/`
8. JS/TS code tokenizer 验收包：`/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/`
9. Python/Rust code tokenizer 验收包：`/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/`
10. full-deck layout fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`

当前已落地事实：

1. `prepareSlidevExportSource()` 会在非 Slidev 笔记导出前生成真正的 Slidev deck；
2. source preparation 会加载完整 Slidev skill 目录，包括 `references/*.md`；
3. Jacob 本机优先使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`；
4. `convergeSlidevDeckLayout()` 已进入产品导出路径与维护者 verifier；
5. HTML native standalone 有严格 gate；
6. Playwright 默认审计完整 prepared deck；
7. patcher 已支持 measured zoom、部分局部 `<Transform>`、table/code/simple slide/slot layout 结构化拆分；Mermaid 默认保留源 fence，不做自动拆图；
8. rendered audit 已新增 effective font、SVG/table/code 最小字号、quality margin、content-area ratio、局部 CSS transform 字号感知与 Mermaid 源图保持 fit 证据；
9. source preparation 已新增 clean-room `SlideLayoutPlan` 预算，并把 deterministic layout budget 接入非大纲、大纲继续导出与 outline prompt；
10. `architecture.zh-CN.md` strict native standalone rerun 已通过：`slideCount = 27`，源文档与导出 deck 均为 3 个 Mermaid block，hard overflow / unreadable scale / low effective font / quality margin warning / low utilization 均为零，HTML export 为 native standalone 且不需要本地 server；
11. `slidevLayoutAudit` 单测新增 Mermaid source-preservation 回归：即使误收到 code structural patch，也不会把一个 Mermaid fence 拆成多个 fence；
12. Python/Rust code fence 现在也会先走轻量 top-level tokenizer，保持 import/use 组、decorator/attribute 与顶层 class/function/impl/module item 完整；
13. Stage 5 fixture 已从局部 unit/measurement 扩展到 full-deck export fixture：`source-layout-stress` 覆盖非 Slidev 源笔记、完整 skill references、长表 record-list、代码拆分、Mermaid 源图保持与 native standalone；`slot-component-stress` 覆盖 component-heavy slot 的局部 Transform 收敛；
14. Mermaid-only 页在保留源 fence 且进一步拆图被禁止时，可以使用测量得到的低 `zoom` 先保证整张图不裁切，再通过 `mermaidFit.manual-review` 暴露投影可读性风险；这不是自动拆图许可；
15. 文本 overflow 测量已从 block element box 改为 text node Range glyph rect，避免 `h1` 等块级元素的布局盒被误判为文字超界；
16. 已有 slot `<Transform>` 的页面不会再叠加整页 `zoom`；若叠加导致低 effective font，patcher 会移除整页 zoom，保持局部 Transform 作为唯一缩放面；
17. 当前生成产物可被 Git 看到，用于本地视觉检查，但不应提交进 `main`。

当前未完成事实：

1. semantic split 仍只覆盖当前已有 table/code/text 支持集；Mermaid 源图保持后，过密原图只能通过布局/zoom/Transform 或人工复核处理，不能把一个源 Mermaid fence 自动拆成多个图；
2. effective font 现在会把文本节点到 slide root 之间的局部 CSS `transform` / `scale` / `zoom` 乘入逐样本字号；full-deck slot fixture 已覆盖一条复杂 Vue/slot layout 的真实收敛链路，但更多 custom layout 仍需继续加 fixture；
3. `SlideLayoutPlan` 是生成前预算，不替代 Playwright rendered audit；
4. 真实 `architecture.zh-CN.md` 仍需要每批次跑 strict standalone 验收，不能用单测替代；
5. 当前真实 deck 仍可能出现 `zoom` 小于 `0.72` 的 Mermaid 页面；在“不改原 Mermaid 图内容”的约束下，低 zoom 有时是保留源图的代价，但不能扩散到 prose/table/code。

## 3. 先前要求与当前代码逐项对比

| 要求 | 当前代码/文档状态 | 结论 | 下一步 |
|---|---|---|---|
| UI 中两个 Slidev export 按钮必须跑真实工作流 | `exportSlidesCommand()` 是命令面板和侧栏入口共同拥有的完整操作；侧栏支持一次性导出和大纲模式 | 已落地 | 后续 UI 改动继续以 `sidebarDomButtonClicks` 与真实 verifier 锁住 |
| 非大纲模式也要嵌入 Slidev skill 流程 | source preparation 会加载完整 skill references，不再只读 `SKILL.md` | 已落地 | skill reference 数继续作为 verifier 报告字段 |
| 必须使用本地 Slidev fork | CLI 解析优先使用 `$HOME/slidev/packages/slidev/bin/slidev.mjs` | 已落地 | verifier 中继续检查 fork 路径 |
| standalone 文件必须真实可打开 | strict native gate 检查 `actualMode = standalone`、`requiresLocalServer = false`、`loaderGaps = []` | 已落地 | 新 standalone 验收应继续走带日期 evidence package |
| 不能提交测试生成文件 | `docs/export/` 产物可见但默认不提交，本批次真实输出已归档到仓库外 | 已收口 | 最终 commit 前继续检查 `git status --short docs/export` |
| zoom 参数应由检测结果决定 | overflow patch 已用 measured fit scale；quality finding 现在会优先触发结构化拆分 | 已推进 | 继续避免把低 `zoom` 当最终修复手段 |
| 不修改 Mermaid 原图内容 | prompt、layout budget、patcher 与 audit 都按 source-preserved 模型推进；Mermaid fit 问题进入证据字段或人工复核，不进入自动拆图；单测已覆盖 Mermaid fence 不被误走 code split | 已落地当前切片 | 真实导出继续检查 source/exported Mermaid block count 一致 |
| 完整支持 Slidev skill references | skill root 与 reference count 已进入 verifier | 已落地 | 可考虑上游 skill PR，但只放通用 guardrails |
| 参考无限画布优化图/表/画布可见范围 | 已新增 clean-room `SlideLayoutPlan`，按 world-rect / viewport-fit 思想做生成前预算 | 已落地第一切片 | 后续加强语义拆分算法，不复制 AGPL 代码 |

## 4. 现有架构推进进度

### 4.1 已稳定的所有者边界

当前已有四个关键边界是正确的：

1. `prepareSlidevExportSource()` 拥有 deck 准备、skill 加载、已有 deck working-copy 隔离和 support-entry mirror；
2. `convergeSlidevDeckLayout()` 拥有 HTML build、Playwright audit、patch/rebuild retry；
3. `slidevLayoutAudit.ts` 拥有 rendered measurement 到 patch decision 的转换；
4. `exportSlidevHtmlWithOutcome()` 拥有 native standalone 与 fallback 的结构化结果。

这条边界不应被推翻。下一阶段应该在这些边界前面补布局规划层，在这些边界内部增强质量指标，而不是把责任退回 prompt。

### 4.2 当前 hard gate 的价值

当前 hard gate 已经能防：

1. 输出目录 stale chunk 污染；
2. 缺失 local fork；
3. 缺失 Slidev skill references；
4. 生成 deck frontmatter/theme 明显错误；
5. standalone bundle loader binding 误判；
6. slide root 可见范围裁切；
7. table/code/slot zone 的 scroll overflow。

这些都是 P0 正确性门，不能为了速度退回抽样或 CLI-only smoke。

### 4.3 当前 hard gate 的漏洞

当前 hard gate 不能充分证明：

1. Mermaid SVG 内文字字号足够演示阅读；
2. table cell 字号、行高和底部边距足够；
3. code token 在投影或共享屏幕里可读；
4. 图表是否只占左半边而右侧大面积空白；
5. Mermaid 源图在保留完整内容时是否需要更明确的 fit/zoom/Transform 或人工复核证据；
6. slide 是否“未裁切但贴边”，导致视觉质量差。

这不是实现细节，而是验收定义缺失。

## 5. `architecture.zh-CN` 真实输出暴露的问题与本批次验收

先前生成 deck 中有明确低 zoom 证据：

1. 系统架构页：`zoom: 0.285`
2. LLM 调用管道页：`zoom: 0.384`
3. 图表渲染平台页：`zoom: 0.40`

这些值没有让 Playwright hard gate 失败，因为它们仍高于旧产品路径的 `minReadableScale: 0.24`。但从实际截图看：

1. slide 03 没有裁切，但图表集中在左半区，文字接近不可读；
2. slide 05 没有裁切，但 sequence diagram 文字密度和线条跨度已经过高；
3. slide 10 表格没有 overflow，但底部空间接近贴边，只是 hard gate 没有把它判为质量问题。

因此，当前 `overflowCount = 0` 与 `unreadableCount = 0` 只能说明“没有硬裁切”，不能说明“演示质量合格”。

本批次修正后，真实 strict standalone rerun 的证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-quality/architecture-strict-preserve-mermaid-report-final.json
/home/jacob/slidev-export-review/2026-06-20-quality/architecture.zh-CN.preserve-mermaid.final.slidev.md
/home/jacob/slidev-export-review/2026-06-20-quality/preserve-mermaid-success-export-final/
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `standaloneGate.passed = true`
4. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
5. `skillReferenceCount = 52`
6. `slideCount = 29`
7. `hardOverflowCount = 0`
8. `unreadableScaleCount = 0`
9. `lowEffectiveFontCount = 0`
10. `qualityMarginWarningCount = 0`
11. `lowContentUtilizationCount = 0`
12. `retryCount = 4`
13. source Mermaid block count = 3，exported Mermaid block count = 3

需要保持批判的一点：成功 deck 仍包含 `zoom: 0.285`、`0.384`、`0.40`。当前它们没有触发 hard gate failure，说明 rendered gate 认为它们在这次输出里没有裁切；但从架构方向看，低 zoom 不应扩散到 table/code/prose。对 Mermaid，当前路线已经明确为源图保持 fit 评估、局部 Transform 与人工复核证据，而不是默认拆原图。

本切片新增 Mermaid fit 审计后的真实 strict standalone rerun 证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-mermaid-fit/architecture-strict-mermaid-fit-report.json
/home/jacob/slidev-export-review/2026-06-20-mermaid-fit/architecture.zh-CN.mermaid-fit.slidev.md
/home/jacob/slidev-export-review/2026-06-20-mermaid-fit/export/architecture.zh-CN-slides/index-standalone.html
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `requiresLocalServer = false`
4. `standaloneGate.passed = true`
5. `slidev = "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)"`
6. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
7. `skillReferenceCount = 52`
8. `slideCount = 29`
9. `hardOverflowCount = 0`
10. `unreadableScaleCount = 0`
11. `renderErrorCount = 0`
12. `mermaidSlideCount = 3`
13. `mermaidFitReviewCount = 3`
14. `mermaidLowZoomCount = 3`
15. `mermaidManualReviewCount = 1`
16. source Mermaid block count = 3，exported Mermaid block count = 3
17. `zoomLines = ["0.285", "0.384", "0.40"]`

这次结果不是“质量问题消失”，而是把此前隐藏的质量判断变成了可审计事实：三张 Mermaid 页都因为保留源图而进入 fit review；第 3 页是 `manual-review`，原因是保留源图后若继续按 safe rect 拟合，`nextZoom = 0.2778` 会低于当前 readable floor `0.28`。这比自动拆图更符合用户约束，也更诚实。

本切片新增局部 transform 字号感知后的真实 strict standalone rerun 证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-local-transform-font/architecture-strict-local-transform-font-report.json
/home/jacob/slidev-export-review/2026-06-20-local-transform-font/architecture.zh-CN.local-transform-font.slidev.md
/home/jacob/slidev-export-review/2026-06-20-local-transform-font/export/architecture.zh-CN-slides/index-standalone.html
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `requiresLocalServer = false`
4. `standaloneGate.passed = true`
5. `slidev = "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)"`
6. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
7. `skillReferenceCount = 52`
8. `slideCount = 29`
9. `hardOverflowCount = 0`
10. `lowEffectiveFontCount = 0`
11. `qualityMarginWarningCount = 0`
12. `mermaidSlideCount = 3`
13. `mermaidFitReviewCount = 3`
14. `mermaidManualReviewCount = 1`
15. source Mermaid block count = 3，exported Mermaid block count = 3

本切片新增 TypeScript/JavaScript code tokenizer 后的真实 strict standalone rerun 证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/architecture-strict-js-ts-code-tokenizer-report.json
/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/architecture.zh-CN.js-ts-code-tokenizer.slidev.md
/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/export/architecture.zh-CN-slides/index-standalone.html
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `requiresLocalServer = false`
4. `standaloneGate.passed = true`
5. `slidev = "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)"`
6. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
7. `skillReferenceCount = 52`
8. `slideCount = 29`
9. `hardOverflowCount = 0`
10. `lowEffectiveFontCount = 0`
11. `qualityMarginWarningCount = 0`
12. `mermaidSlideCount = 3`
13. `mermaidFitReviewCount = 3`
14. `mermaidManualReviewCount = 1`
15. source Mermaid block count = 3，exported Mermaid block count = 3

本切片新增 Python/Rust code tokenizer 后的真实 strict standalone rerun 证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/architecture-strict-python-rust-code-tokenizer-report.json
/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/architecture.zh-CN.python-rust-code-tokenizer.slidev.md
/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/export/architecture.zh-CN-slides/index-standalone.html
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `requiresLocalServer = false`
4. `standaloneGate.passed = true`
5. `slidev = "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)"`
6. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
7. `skillReferenceCount = 52`
8. `slideCount = 29`
9. `hardOverflowCount = 0`
10. `lowEffectiveFontCount = 0`
11. `qualityMarginWarningCount = 0`
12. `mermaidSlideCount = 3`
13. `mermaidFitReviewCount = 3`
14. `mermaidManualReviewCount = 1`
15. source Mermaid block count = 3，exported Mermaid block count = 3

最终 source-preserved-fit 收口 rerun 证据包在：

```text
/home/jacob/slidev-export-review/2026-06-20-source-preserved-fit-final/architecture-strict-source-preserved-fit-final-report.json
/home/jacob/slidev-export-review/2026-06-20-source-preserved-fit-final/architecture.zh-CN.source-preserved-fit-final.slidev.md
/home/jacob/slidev-export-review/2026-06-20-source-preserved-fit-final/export/index-standalone.html
```

该 rerun 的关键结果：

1. `ok = true`
2. `actualMode = "standalone"`
3. `requiresLocalServer = false`
4. `standaloneGate.passed = true`
5. `slidev = "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)"`
6. `skillRootPath = "/home/jacob/slidev/skills/slidev"`
7. `skillReferenceCount = 52`
8. `slideCount = 27`
9. `hardOverflowCount = 0`
10. `lowEffectiveFontCount = 0`
11. `qualityMarginWarningCount = 0`
12. `lowContentUtilizationCount = 0`
13. `mermaidSlideCount = 3`
14. `mermaidFitReviewCount = 3`
15. `mermaidLowZoomCount = 3`
16. `mermaidManualReviewCount = 1`
17. source Mermaid block count = 3，exported Mermaid block count = 3
18. `zoomLines = ["0.285", "0.384", "0.40"]`

最终结论：这次收口没有把任何一个 Mermaid 源 fence 拆成多图，也没有修改原 Mermaid 图内容来换取布局通过。代价是三张 Mermaid-only 页仍保留低 `zoom`，其中一页进入 `manual-review`；这是当前约束下正确暴露风险，而不是让导出器静默改图。

## 6. `ref/infinite-canvas` 的可借鉴点

`ref/infinite-canvas` 的直接实现不能复制进 NoteMD：它是 AGPL-3.0，NoteMD 是 MIT。可借鉴的是 clean-room 设计思想：

1. 节点是带 `position`、`width`、`height`、`metadata` 的可测量对象；
2. viewport 是 `{ x, y, k }`，所有显示都可用 camera transform 解释；
3. minimap 会先计算所有节点 union bounds，再推导 scale 和 offset；
4. 连线坐标由节点几何推导，而不是写死；
5. 图片/节点尺寸会先经过比例约束，再进入画布。

转译到 Slidev export 后，应该变成：

1. `SlideBlockGeometry`：每个 heading、paragraph、Mermaid、table、code、image 都有 estimated/intrinsic size；
2. `SlideViewportFit`：对固定 Slidev safe rect 计算 fit scale、margin、content-area ratio；
3. `SlideLayoutPlan`：在生成 deck 前决定一页能放什么，何时预拆分 table/code/prose，何时对 Mermaid 做源图保持的 fit review；
4. `SemanticFitPlan`：对 Mermaid 做保持源图的 fit/zoom/Transform 预算，对 table/code 做确定性拆分预算；
5. rendered audit 仍作为最终事实门。

不建议做：

1. 把 infinite-canvas UI 嵌进 Slidev export；
2. 把 Slidev deck 变成一个巨大可缩放画布；
3. 复制 AGPL 代码；
4. 用 canvas screenshot 代替 Slidev 原生语义；
5. 用更低 zoom 掩盖语义拆分缺失。

## 7. Next-level 方案

### Stage 1：增强 rendered quality measurement

目标：把当前 hard gate 扩展成 hard gate + quality gate。

实现状态：已落地到 `src/slideExport/slidevLayoutAudit.ts` 与 `src/slideExport/slidevLayoutWorkflow.ts`。产品路径与 verifier 现在统一使用 `minReadableScale = 0.28`。对 table/code/prose，低有效字号、贴边与低利用率会转换为 `recommendedPatch`；对 Mermaid，低字号保留为 rendered metric，不触发自动拆图。本切片补齐局部 CSS transform 字号感知：字体样本不再只用 DOM computed font size 乘整页 zoom，而是逐节点乘入从文本节点到 slide root 之间的 `transform` / independent `scale` / `zoom`。

新增 measurement 字段：

```text
layoutAudit[].effectiveMinFontPx
layoutAudit[].svgTextMinFontPx
layoutAudit[].tableBodyMinFontPx
layoutAudit[].codeMinFontPx
layoutAudit[].qualityMargins
layoutAudit[].contentAreaRatio
layoutAudit[].lowContentUtilization
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
layoutAuditSummary.lowEffectiveFontCount
layoutAuditSummary.qualityMarginWarningCount
layoutAuditSummary.lowContentUtilizationCount
layoutAuditSummary.mermaidSlideCount
layoutAuditSummary.mermaidFitReviewCount
layoutAuditSummary.mermaidLowZoomCount
layoutAuditSummary.mermaidManualReviewCount
```

判定原则：

1. hard overflow 继续 fail closed；
2. low effective font 进入 fail 或 warning，按内容类型区分；
3. bottom/right margin 低于质量阈值进入 warning；
4. content area ratio 过低且有低 zoom 时，优先拆分/重布局，而不是继续缩小。

### Stage 2：新增 clean-room layout planning IR

目标：在 LLM 生成 deck 前做几何预算。

实现状态：已落地到 `src/slideExport/slidevLayoutPlan.ts`，并接入 `buildDeterministicSlidevOutline()`、一次性 LLM deck prompt、大纲继续导出 prompt 与 outline prompt。它只做预算与约束，不拥有最终验收。

建议类型：

```ts
type SlideBlockKind = 'heading' | 'text' | 'mermaid' | 'table' | 'code' | 'image';

interface SlideBlockGeometry {
  id: string;
  kind: SlideBlockKind;
  intrinsicWidth: number;
  intrinsicHeight: number;
  minReadableFontPx: number;
  splitAxes: Array<'semantic' | 'rows' | 'columns'>;
  fitStressors: Array<'wide' | 'tall' | 'dense-sequence' | 'dense-graph' | 'dense-diagram'>;
}

interface SlideViewportFit {
  scale: number;
  margins: { left: number; top: number; right: number; bottom: number };
  hardPass: boolean;
  qualityPass: boolean;
  reason: string;
}

interface SlideLayoutPlan {
  slides: PlannedSlide[];
  preSplitCount: number;
  fitReviewCount: number;
  warnings: string[];
}
```

命名注意：

1. 不要叫 `LayoutManager`、`CanvasHelper`、`GeometryUtils`；
2. 用 `SlideGeometry`、`SlideViewportFit`、`SlideLayoutPlan` 这类能说明职责的名字；
3. 不用 bool/enum 参数让同一函数一会儿做 hard gate、一会儿做 quality gate；拆成独立操作。

### Stage 3：Mermaid 源图保持与适配

目标：把 Mermaid 从“自动改写/拆图”改为“保持源 fence，先做布局适配，不能保证阅读质量时明确人工复核”。

实现状态：已按用户约束调整为默认不拆 Mermaid。低 effective SVG/Mermaid 字号仍保留在 rendered measurement 字段中，但不再触发 `split-diagram` 或把一张源图改写成多张图；hard overflow 只能尝试保留源图的 measured `zoom` / layout / `<Transform>` 适配，低于可读下限时进入 blocked/manual-review。

本切片补了防回退测试：当 Mermaid slide 被错误标成 code structural patch 候选时，`findSingleCodeFenceBlock()` 仍拒绝把 `mermaid` fence 当作可拆分代码块，patcher 保持单个 Mermaid fence 与原始图内容。这个测试是约束，不是鼓励错误路由；正常路径仍应把 Mermaid 质量问题表达为 `mermaidFit` 和 `manual-review`。

本切片新增 `mermaidFit` 审计结果：

1. `fits`：保留源 fence 后仍满足当前渲染质量阈值；
2. `source-preserved-fit-review`：源图未裁切，但存在低 zoom 或 tight margin，需要人工看图确认演示质量；
3. `manual-review`：保留源图和可读性存在冲突，例如 Mermaid 字号过低，或 safe-rect fit 后会低于 readable floor。

这些字段是源图保持证据，不是自动改写指令。`mermaidManualReviewCount` 也不是 hard gate failure；它表示在“不修改原 Mermaid 内容”的约束下，流程不能伪装成完全自动合格。

保持策略：

1. 不自动把一个 Mermaid fence 改写成多个 Mermaid fence；
2. LLM prompt 明确要求 preserve each source Mermaid fence；
3. `SlideLayoutPlan` 对密集 Mermaid 给出 `preserve-source-fit`，而不是 `overview-detail`；
4. overflow 时先用 measured `zoom` 或可证明不改源图的 layout/Transform；
5. 单图过密导致“保留完整内容”和“投影可读”不可同时满足时，报告 manual-review，不伪造通过。
6. 验收必须继续检查源文档 Mermaid block count 与导出 deck Mermaid block count 一致。

### Stage 4：Table / code quality splitter

目标：避免“没溢出但不可读”的大表和代码块。

实现状态：低 table/code effective font 现在分别触发 `split-table` 与 `reduce-code`，在没有 hard overflow 时也会进入结构化拆分；layout budget 会提前把宽表、长表和长代码标为 pre-split candidates。已补上四个更具体的质量策略：长 table cell 会转成 record-list，不继续挤压表格；code fence 会先按语义块拆分，尽量保留注释+函数/作用域块，失败时才退回空行/行预算；TypeScript/JavaScript fence 现在会先走轻量 top-level tokenizer，保持连续 import 组与顶层 type/function/class/const 声明完整；Python/Rust fence 也会先走轻量 top-level tokenizer，保持 import/use 组、decorator/attribute 与顶层 class/function/impl/module item 完整。尚未落地的是完整 AST 级拆分，以及更多语言的专用 splitter。

表格策略：

1. wide table：优先列拆分；
2. tall table：优先行拆分；
3. dense table：转 record-list 或 summary + appendix；
4. cell 文本过长：先改写为 key-value record-list，而不是继续缩小 table。

代码策略：

1. TypeScript/JavaScript fence 优先按 top-level tokenizer 拆，连续 import 组和顶层声明不能被行预算切开；
2. Python fence 优先按 import 组、decorator、class/function 和顶层缩进块拆；
3. Rust fence 优先按 use 组、attribute、struct/enum/trait/impl/fn/mod/test module 等顶层 item 拆；
4. 超长 code fence 继续退回通用语义块，包括注释前缀、括号/缩进作用域与续行边界；
5. 宽代码优先解释/摘录关键片段；
6. 代码字号低于阈值时不要继续 shrink。

### Stage 5：验收 fixture 扩展

新增 fixtures：

1. 大型 flowchart；
2. 长 sequenceDiagram；
3. 宽表；
4. 长表；
5. dense mixed table/code；
6. component-heavy slot layout；
7. `architecture.zh-CN.md` 继续作为真实回归源。

通过标准：

1. standalone strict gate 继续通过；
2. hard overflow 为零；
3. low effective font 为零，或只存在明确记录的 warning；
4. quality margin warning 不超过约定阈值；
5. `preSplitCount`、`fitReviewCount` 与 `postPatchCount` 可解释；
6. 不出现低于质量阈值的 `zoom` 作为最终主要修复手段。

实现状态：已新增/扩展 unit fixtures 与 full-deck export fixtures：

1. `src/tests/slidevLayoutAudit.test.ts` 覆盖 low effective font measurement、Mermaid 源图保持、Mermaid fit/manual-review 统计、`source-preserved-fit-review` 与 `manual-review` 分流、table/code 质量 finding 驱动结构拆分、长 cell record-list fallback、代码语义块拆分、TypeScript import 组和顶层声明 tokenizer、Python import/decorator/top-level block tokenizer、Rust use/attribute/top-level item tokenizer、summary 新字段；
2. `src/tests/slidevLayoutPlan.test.ts` 覆盖 clean-room layout budget 对 Mermaid 的 `preserve-source-fit` 与 table/code 的 pre-split 判断；
3. `src/tests/slidevSourcePreparer.test.ts` 覆盖 deterministic outline 与 LLM prompt 都带 layout budget；
4. `src/tests/slidevLayoutWorkflow.test.ts` 更新 summary schema，避免 verifier mock 停留在旧字段；
5. `src/tests/slidevRenderedMeasurement.test.ts` 用真实 Playwright 页面验证局部 `transform: scale(0.5)` 与整页 `--slidev-slide-zoom-scale: 0.8` 会把 20px code font 测为 8px effective font，并验证长表 record-list fallback 在浏览器里以可读文本呈现、不残留 table overflow；
6. `scripts/verify-slidev-layout-fixtures.cjs` 运行完整生产 verifier，临时生成 fixture vault，不把 fixture Markdown 或导出产物写入仓库；`source-layout-stress` 覆盖完整 skill references、native standalone、Mermaid source fence count、record-list fallback、代码拆分和低 zoom 只允许出现在 Mermaid-only 页；`slot-component-stress` 覆盖 component-heavy slot 的局部 `<Transform>`，并防止整页 low zoom 混入；
7. 2026-06-20 full-deck fixture 归档位于 `/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`，两条 fixture 均为 `ok: true`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`。

## 8. 与上游 Slidev skill PR 的关系

值得上游的内容：

1. 长文档转 deck 应使用完整 references；
2. 大 Mermaid 应保留源 fence 并明确 fit/manual-review 边界；table/code 应优先拆分，而不是只 zoom；
3. 导出后应用真实浏览器检查；
4. standalone 与 fallback 应区分记录；
5. 输出目录应在 rebuild 前清理。

不应上游的内容：

1. `/home/jacob/slidev` 本地 fork 路径；
2. NoteMD vault-relative 输出路径；
3. `architecture.zh-CN.md` fixture；
4. NoteMD 的 Playwright audit 内部字段；
5. NoteMD 的 generated artifact policy。

不值得上游的方向：建议把一个用户提供的 Mermaid 原图自动拆成多个 Mermaid 图。这个策略会破坏源图语义边界，也会让导出器替用户做不可逆的图结构编辑。

更合理的上游 PR 时机：Stage 1/2/3 在 NoteMD 中稳定后，只抽通用 prompt guardrails、source-preserved Mermaid fit review 和 browser-check 建议，不把 NoteMD 的实现细节带上去。

## 9. 后续推进顺序

本批次已完成：

1. Stage 1 measurement 第一切片：`minReadableScale` 口径统一为 `0.28`，新增 effective-font / quality-margin / content-area ratio 报告；
2. Stage 2 layout planning IR 第一切片：支持 Markdown block、Mermaid、table、code 的预算估算；
3. Stage 3/4 第一切片：low effective font 可触发 table/code 结构化 patch；Mermaid 改为源图保持，不再自动拆图；
4. verifier JSON 与 unit fixtures 已覆盖新 summary schema；
5. 真实 `architecture.zh-CN.md` strict standalone 已重新验收并归档；
6. Stage 4 第二切片：长 table cell 转 record-list，code fence 优先按语义块拆分，避免行预算切断函数体。
7. Stage 1 第二切片：effective font measurement 已感知局部 CSS transform / scale / zoom，避免 `<Transform>` 包裹内容被误判为仍有原始字号。
8. Stage 4 第三切片：TypeScript/JavaScript code fence 先走 top-level tokenizer，连续 import 组和顶层 type/function/class/const 声明保持完整，再进入 chunk 分配。
9. Stage 4 第四切片：Python/Rust code fence 先走 top-level tokenizer，import/use 组、decorator/attribute 与顶层 class/function/impl/module item 保持完整，再进入 chunk 分配。
10. Stage 5 第一切片：Mermaid fit status 分流 fixture 与 record-list Playwright measurement fixture 已落地，明确 Mermaid 源图保持问题进入审计状态，表格可读性问题走结构化文本 fallback。
11. Stage 5 第二切片：full-deck/export fixtures 已落地，覆盖真实生产 verifier 链路；Mermaid-only 页允许测量低 zoom fit 来保证整图可见，同时以 `manual-review` 记录投影可读性风险；slot/component-heavy 页禁止局部 Transform 与整页 zoom 叠加。

建议下一批实现顺序：

1. 继续把更多真实失败样本沉淀为 full-deck/export fixtures，尤其是图片、复杂 Vue component、嵌套 slot、超宽表与多 Mermaid 页面混排；
2. 对 Mermaid 继续只做源图保持的 fit/zoom/Transform 与人工复核边界，不引入自动拆原图策略；
3. 继续增强更多语言专用 splitter；Python/Rust 当前是 parser-light，不是完整 AST；
4. 评估是否把 source-preserved Mermaid fit review、browser-check 与“不要拆用户原图”抽成通用 Slidev skill PR 建议。

不要先做：

1. 大规模 UI 画布编辑器；
2. 截图式 canvas export；
3. 更低的默认 zoom；
4. 只靠 LLM 手写拆分规则；
5. 复制 `ref/infinite-canvas` 实现代码。

## 10. 收口要求

本路线任何代码切片至少应验证：

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
npm test -- --runInBand src/tests/slidevLayoutPlan.test.ts src/tests/slidevLayoutWorkflow.test.ts
npm run verify:slidev-layout-fixtures -- --timeout-ms 300000
npm run build
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
git diff --check
```

本路线任何文档切片至少应验证：

```bash
git diff --check
git status --short --branch
```

生成的 `docs/export/` 产物处理规则：

1. 可以用于本地视觉审查；
2. 不提交进 `main`；
3. 如果需要保留证据，归档到 `/home/jacob/slidev-export-review/<date>/...`；
4. 最终提交前工作区必须回到 clean，不留下未跟踪生成目录。

## 11. Bottom Line

当前项目不缺“能导出”的证明，缺的是“可读且专业”的质量门。

最佳路线不是替换现有 render-feedback pipeline，而是在它前面加 deterministic layout planning，在它内部加 effective-font / quality-margin measurement，在它后面保留 strict standalone 和 full-deck browser audit。

`ref/infinite-canvas` 的价值是几何思想，不是代码依赖，也不是 UI 替换方案。
