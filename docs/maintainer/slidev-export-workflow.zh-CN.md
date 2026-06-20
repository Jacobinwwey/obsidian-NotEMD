# Slidev 导出工作流验证

语言: [English](./slidev-export-workflow.md) | **简体中文**

此文档面向维护者。它定义 NoteMD 的 Slidev export UI 路径应如何验证。

## 为什么需要这条工作流

直接运行 `slidev build` 只能证明本地 Slidev CLI 能构建某个 deck，不能证明 NoteMD 的导出按钮真的工作。

NoteMD 的验证必须把以下步骤串起来看：

1. 当前 Markdown 笔记会在导出前转换成真正的 Slidev deck。
2. 能发现完整 Slidev skill 目录，包括 `references/*.md`，而不是只读 `SKILL.md`。
3. 本地 Slidev fork 存在时会被优先使用。
4. 现有 Slidev deck 也会先复制到隔离的 prepared working workspace，再进入验证链，避免 patch/retry 直接改写源笔记，同时允许把 sibling Slidev support entries 和被引用的本地图片资产一并镜像进 working copy。
5. 每次 HTML build 前会重建输出目录，避免旧 chunk 残留。
6. 生成 deck 的 guardrails 会规范 theme、逐页 frontmatter，并且只在页面本身没有声明 `zoom` 时才为大 Mermaid 图补缺省 zoom。
7. HTML 导出会先尝试 native standalone，记录实际 HTML mode；只有在生成的 standalone bundle 确实缺少 slide loader binding 时，才自动回退到 server-script 兼容 HTML。
8. 最终 HTML 输出会经过真实浏览器打开，并默认审计整个 deck。
9. 生成的检查产物对 Git 可见，不会被 `.gitignore` 意外隐藏。

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
10. `ignoredOutputs: []`
11. `layoutAuditSummary.overflowCount: 0`
12. `layoutAuditSummary.unreadableCount: 0`
13. 严格 native standalone 收口时，`htmlExport.actualMode: "standalone"`
14. 严格 native standalone 收口时，`htmlExport.requiresLocalServer: false`
15. 严格 native standalone 收口时，`htmlExport.standaloneAttempt.loaderGaps: []`
16. 严格 native standalone 收口时，`standaloneGate.passed: true`
17. 源文件包含 Mermaid fence 时，除非人工显式改源文档，否则导出 deck 的 Mermaid block 数应与源文档一致。
18. Mermaid/prose 混排页不能保留低整页 zoom；如果可以分离，Mermaid fence 原样保留在 Mermaid 专属页，正文移动到可读页。

任一条件失败，都应先修 NoteMD 工作流，再相信导出文件。

## 渲染后可见范围质量门

当前工作流已经能证明 UI 等价导出路径可以生成 deck，并且默认会把整个准备后的 deck 放进真实浏览器审计。这是必要条件，因为密集架构笔记即使 build 成功，Mermaid 图、表格、代码块或长文本仍可能被固定 16:9 画布裁掉。

当前实现已经把 render-feedback gate 落到了共享工作流上；只要 Playwright 可用，维护者 verifier 与真实产品导出命令都会走这条链路：

1. 测量前等待 `document.fonts.ready`、图片 decode 和 Mermaid 渲染完成；
2. 对每个被审计页检查 DOM bbox 是否超出实际可见 slide root、是否存在 scroll overflow、Mermaid 容器是否溢出、表格自然宽度是否溢出、代码块是否溢出；
3. 将问题归类为 `overflow`、`unreadable-scale`、`stale-output` 或 `render-error`；
4. 基于渲染证据对 prepared working deck 做有界 patch/retry，当前最多 6 轮；
5. 如果多轮重试后内容仍被真实可见 slide root 裁掉，应 fail closed 并输出审计报告。

`ref/infinite-canvas` 只能作为 clean-room 设计参考。真正值得借鉴的不是把无限画布嵌进 Slidev export，而是先把 slide 元素建模成可测量的 world rect，计算 union bounds，再为固定 Slidev safe rect 推导 fit camera；一旦 fit 会破坏可读性，就拆分内容。不要把 AGPL-3.0 实现代码复制进 MIT 项目。

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
```

对 Mermaid 来说，`mermaidFit.status` 是源图保持证据，不是允许自动改写用户图的指令。`fits` 表示保留源图后满足当前渲染阈值；`source-preserved-fit-review` 表示 deck 结构上成立，但由于低 zoom 或边距偏紧，需要人工看图确认演示质量；`manual-review` 表示保留源图与投影可读性存在冲突，流程必须暴露这个事实，而不是静默把一张图拆成多张图。

具体推进路线见 `docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md`。该路线保留当前 render-feedback loop 作为最终事实门，但在生成前增加 clean-room layout planning IR，并把 `ref/infinite-canvas` 的 world rect / viewport fit 思想转译为 NoteMD 自有几何算法，而不是复制 AGPL-3.0 实现或把无限画布 UI 嵌入 Slidev export。

截至 2026-06-20 的当前真值：

1. 默认 HTML 验证在未传 `--sample-slides` 时会审计整个准备后的 deck；
2. patcher 的 `zoom` 来自真实 overflow 测量，而不是固定导出常数；
3. patcher 默认保留 Mermaid 源 fence，并会在不宜继续缩小时对 Markdown table、病态宽表或长 cell 表的 record-list fallback、非 Mermaid fenced code block、简单的标题 + 段落/列表页、generic slot-marked layout（含显式 `::default::`），以及可结构拆分的第一张 deck headmatter 页面做结构化拆分；
4. 大 Mermaid guardrail 不会再覆盖页面里已经显式声明的 `zoom`；
5. 现有 Slidev deck 现在会进入 `_slidev-sources/<deck-basename>/` 隔离 working copy 目录；若 sibling 下存在 `layouts/`、`public/`、`setup/`、`components/`、`snippets/`、`styles/`、`global-top.vue`、`global-bottom.vue` 等常见 Slidev support entries，也会一并镜像进去；
6. 渲染后布局审计现在也会测量带直接文本的 `div` / `section` / `article` / `aside` / `span`，因此 component-heavy 页面不会再被静默低估成“空布局”；
7. component-heavy slot zone 现在会在 prepared working copy 中带上轻量 owner wrapper；渲染测量不仅会带回 slot ownership，还会记录 zone 级 owner rect、content bounds、scroll overflow 与推荐的局部 transform scale；
8. 即使 slot container 用 `overflow-hidden` 把后代裁出了当前视口，slot-owned descendant 现在也会进入测量，因此 component-heavy slot 内容不会再因为被容器裁掉就被静默低估；
9. component-heavy custom slot layout 在结构拆分不可用时，现在可以回退到局部 `<Transform :scale=\"...\">` 包裹；该 scale 由当前超界 zone 相对于 slot-owner 几何与 scroll 边界的检测结果推导，而不是固定常数或 LLM 手动决定；当多个 component-heavy zone 独立溢出时，patcher 现在可以在同一页里对每个可变换 zone 分别包裹局部 `<Transform>`；只有在仍然必须选择唯一 owner 时，才会优先使用 zone 级几何归因，并在几何结果打平时回退到 slot signal / rendered text hint；
10. pass/fail 的 hard overflow 仍以渲染后的 slide root 为边界，而 `safeRect` 继续只承担 measured scale 的保守拟合目标；这样既不会放过真正裁剪，也不会把合理的 edge-aligned layout 过度误杀；
11. 共享的 `convergeSlidevDeckLayout()` 现在已经进入 `exportSlidesCommand()` 与维护者 verifier，因此 HTML/PDF/PNG/MP4 都会复用同一个收敛后的 prepared deck；
12. HTML exporter 现在会返回结构化 outcome，包含 `requestedMode`、`actualMode`、fallback 状态与 standalone sanity 细节；已知坏掉的 native attempt 会先保留为 `index-standalone.failed.html`，再进入兼容 fallback；
13. 真实 `docs/architecture.zh-CN.md` 严格 native standalone workflow 现在已经收敛到 `ok: true`、`actualMode: "standalone"`、`requiresLocalServer: false`、`standaloneGate.passed: true`、`29` 个审计页，hard overflow / unreadable scale / low effective font / quality margin warning / low utilization 均为零，`retryCount = 4`；preserve-Mermaid rerun 保持源文档与导出 deck 均为 `3` 个 Mermaid block；当前证据包位于 `/home/jacob/slidev-export-review/2026-06-20-quality/`、`/home/jacob/slidev-export-review/2026-06-20-mermaid-fit/`、`/home/jacob/slidev-export-review/2026-06-20-local-transform-font/`、`/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/` 与 `/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/`；
14. 同一真实源文件的 `PDF` 与 `PNG` 验证也返回 `ok: true`，而且现在导出自同一个收敛后的 deck，而不是 raw prepared source；
15. rendered layout audit 现在会同时报告 effective minimum font、SVG text font、table/code minimum font、quality margins 与 content-area ratio；
16. low effective font、tight margin 与 low content utilization finding 现在会对 table/code/prose 携带结构化 `recommendedPatch`；Mermaid 低字号指标会被记录，但默认保持源 fence，不把一张原图自动拆成多张图；
17. source preparation 现在会生成 clean-room `SlideLayoutPlan`，并把 deterministic layout budget 注入 deterministic outline、一次性 Slidev deck prompt 与基于大纲继续导出的 prompt。
18. rendered layout audit 现在还会报告 `mermaidFit` 与对应 summary 计数，让 Mermaid 低 zoom、低字号和 manual-review 情况可见，但不修改原始 Mermaid fence；真实 `architecture.zh-CN.md` rerun 报告 `mermaidSlideCount = 3`、`mermaidFitReviewCount = 3`、`mermaidLowZoomCount = 3`、`mermaidManualReviewCount = 1`。
19. table/code quality splitting 已进入第二个结构化切片：长 table cell 会转成 key-value record-list slide，code fence 会优先按语义块拆分，再退回空行或行数预算。
20. effective font measurement 现在会把文本节点到 slide root 之间的局部 CSS `transform`、independent `scale` 与 CSS `zoom` 乘入逐样本字号，因此被局部 `<Transform>` 包裹的内容会按真实渲染字号进入质量门，而不是按未缩放的 computed font size 误判。
21. TypeScript 与 JavaScript code fence 现在会先走轻量 top-level tokenizer，再进入通用语义拆分；连续 import 组和顶层 type/function/class/const 声明在密集代码页拆分时保持完整。
22. Mermaid source-preservation 现在有独立回归测试：即使 Mermaid slide 被错误送入 code structural patch 候选，patcher 也不会把一个 `mermaid` fence 当作可拆分代码块。
23. Python 与 Rust code fence 现在也会先走轻量 top-level tokenizer，再进入通用语义拆分；Python import 组、decorator、顶层 class/function block，以及 Rust use 组、attribute、顶层 struct/enum/trait/impl/fn/mod item 会保持完整。
24. Stage 5 fixture 覆盖现在已经把保留 Mermaid 源图时的 `source-preserved-fit-review` 与 `manual-review` 分开测试，并用 Playwright measurement fixture 证明 record-list table fallback 在浏览器里是可读文本，不再是溢出的 table。
25. synthetic full-deck layout fixtures 现在会跑完整生产 verifier：`source-layout-stress` 覆盖完整 skill references、native standalone、Mermaid block count 保真、record-list fallback 与 code splitting；`slot-component-stress` 覆盖 component-heavy slot 的局部 Transform 收敛，并防止整页 zoom 叠加。2026-06-20 归档为 `/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`。
26. text overflow measurement 现在对 text 元素使用 text-node Range glyph rectangles，而不是 block-level element box，因此不会因为 `h1` 的块级布局盒比实际可见文字宽就误判失败。
27. Mermaid-only 页面可以用测量得到的低 zoom 保证一张保留源图完整可见；可读性风险通过 `mermaidFit.manual-review` 暴露，而不是拆分或改写原 Mermaid 图。
28. Mermaid/prose 混排页现在会在允许 source-preserved Mermaid fit 之前先分离非 Mermaid 主内容；每个源 Mermaid fence 仍保持一个 fence 且内容不变，unsupported mixed layout 会阻止低整页 zoom，而不是把正文一起缩小。
29. prepared deck workspace 现在会把本地相对 Markdown image 和 HTML `<img>` 资产复制到生成 deck 所在目录，同时拒绝 URL、绝对路径和 `..` traversal；这避免 `_slidev-sources` 隔离工作副本破坏源文档的相对 SVG/PNG/JPEG 引用。
30. local Slidev fork 的 standalone bundler 现在用括号平衡的函数边界替换来 stub Vite preload helper，避免误删第一张 slide loader binding。NoteMD strict standalone gate 仍保持 fail-closed，继续报告 loader gaps，而不会把 fallback 输出当成 native standalone 成功。

当前限制：

1. effective font measurement 现在已经覆盖常见局部 CSS transform / scale / zoom 链，但复杂 Vue layout 仍必须以浏览器 rendered audit 为准，不能退回静态 Markdown 估算；
2. 超出当前支持集的 richer custom/component-heavy Slidev layout 仍保持保守/manual-review 路径，尤其是多个 component-heavy slot zone 的 zone 级几何仍然接近打平但并非每个溢出 zone 都可安全 transform、或 owner surface 本身不形成稳定 local transform / structural split target 的情况；
3. native standalone 现在已有严格 gate，且真实 architecture fixture 已通过；但正确性仍依赖 post-build sanity detection，server-script fallback 只是兼容通道，不能再被算作 native standalone 成功；
4. full-deck Playwright 验证故意比代表性抽样更慢，后续优化方向应是提高 patch 收敛能力，而不是退回弱审计；
5. `obsidian command id=notemd:export-slides` 目前仍只能算 dispatch-level smoke，因为 Obsidian CLI 没有暴露导出完成握手信号。
6. Mermaid `manual-review` 证据不是 hard gate failure。它是在“不修改原 Mermaid 内容”和“自动保证投影级可读”不能同时被证明时，正确暴露给维护者的透明结果。
7. code splitting 仍是 parser-light；TypeScript/JavaScript/Python/Rust 已有 top-level tokenizer，但完整 AST 拆分与更多语言专用 splitter 仍是后续工作。
8. Mermaid 不拆图约束不等于 Mermaid 演示质量自动合格。超大源图如果只能靠低 zoom 保持完整，流程应暴露 `source-preserved-fit-review` 或 `manual-review`，而不是静默改图。
9. Stage 5 full-deck fixtures 已覆盖长表、宽表、混合代码、Mermaid 源图保持 fit、component-heavy slot Transform 边界、Mermaid/prose 分离、本地图片资产、嵌套 slot component 与超宽表，但仍不是 exhaustive；后续真实文档若出现 frontmatter background、跨目录资产、媒体密集 deck、复杂 Vue component 或 unsupported layout 失败，应继续沉淀为 fixture。

## 输出策略

`docs/export/` 下的生成文件是维护者检查产物。它们对本地视觉审查有价值，但除非发布或文档任务明确要求，不应提交这些临时生成结果。

提交 Slidev 导出相关改动前检查：

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

维护者本地期望状态：

1. 生成文件可以显示为 untracked；
2. `git check-ignore` 对当前验证产物不应输出任何内容；
3. 最终 commit 应包含源码、工作流或文档改动，不应夹带临时生成测试输出。

## UI 契约

命令面板导出动作与侧栏导出动作都必须进入 `exportSlidesCommand()`。

该方法应保持以下顺序：

1. 探测环境；
2. 准备 Slidev export source；
3. 按所选格式导出已准备的 source；
4. 报告具体输出路径。

设置页必须暴露默认导出格式（`HTML`、`PDF`、`PNG`、`MP4`），当选择 HTML 时还应暴露 HTML mode。任何隐藏格式选择的 UI 改动都应视为导出工作流回归。

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
npm run verify:slidev-layout-fixtures -- --timeout-ms 300000
npm run build
git diff --check
```

## Slidev skill PR 评估

只有那些对 NoteMD 之外也成立的通用指导，才值得提到共享 Slidev skill。

适合上游 skill PR 的内容：

1. 将长篇技术文档转换成 Slidev deck 时，应使用完整 skill references，而不是只依赖顶层 `SKILL.md`；
2. 除非项目明确声明已安装自定义主题，否则优先使用内置或调用方配置的主题；
3. 逐页 frontmatter 必须在正文前闭合；
4. 大 Mermaid 图、表格和密集代码块应使用 `zoom` 或 `Transform`；
5. 验证导出结果时应 build 并在浏览器里检查渲染页，而不只是检查 Markdown 已生成；
6. 当旧资产可能影响浏览器输出时，重建前应清理或重建输出目录。

这些应留在 NoteMD 本地，不应上游：

1. `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` fork 探测；
2. NoteMD 的 vault-relative 输出路径；
3. `architecture.zh-CN.md` 这个具体 smoke fixture；
4. `快速定位` 这类 NoteMD 专属旧内容检查。

建议：等当前 NoteMD 工作流稳定后，可以给上游 Slidev skill 准备一个小 PR，范围只放通用 deck-conversion/export guardrails，不包含 NoteMD 的路径和 vault 行为。
