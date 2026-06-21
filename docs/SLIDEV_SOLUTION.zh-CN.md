# Slidev 导出方案总结

本文记录 NoteMD 当前 Slidev 导出的真实架构与验收标准。

## 当前导出模型

NoteMD 不再把直接运行 `slidev build` 视为 UI 导出按钮已经可用的充分证据。维护中的导出流程是：

1. 如果当前笔记不是 Slidev deck，先准备为可导出的 Slidev source deck。
2. 如果当前文件已经是 Slidev deck，先复制到隔离的 prepared workspace，再进行审计和导出，避免修改源文件，同时镜像 sibling Slidev support entries 和显式引用的本地资产。
3. 加载完整 Slidev skill 目录，包括 `SKILL.md` 与 `references/*.md`。
4. Deck 生成后应用展示 guardrails，避免大 Mermaid、表格、代码块或密集文本直接挤进单页。
5. 本地 Slidev fork 存在时优先使用本地 fork。
6. 每次构建前重建输出目录，避免旧 chunk 或旧 deck 污染结果。
7. HTML 默认尝试原生 standalone；当 sanity check 发现 loader binding 缺失时，才进入 server-script 兼容 fallback。
8. Playwright 默认审计完整 deck，而不是只抽样几页。
9. 产品导出路径和维护者 verifier 共享 `convergeSlidevDeckLayout()` 渲染收敛循环，再进入最终 `HTML` / `PDF` / `PNG` / `PPTX` / `MP4` 导出。

维护者工作流见：

```text
docs/maintainer/slidev-export-workflow.md
docs/maintainer/slidev-export-workflow.zh-CN.md
```

严格 standalone 验收记录见：

```text
docs/maintainer/slidev-standalone-acceptance-2026-06-18.md
docs/maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md
```

## HTML 模式

### Standalone HTML

Standalone 是默认的本地检查与分享路径。预期输出：

```text
docs/export/<source-basename>-slides/index-standalone.html
```

该文件应能直接从文件系统打开。若验收声明是“原生 standalone 已通过”，必须使用严格门禁：

```bash
node scripts/verify-slidev-export-workflow.cjs --json --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md
```

严格通过条件包括：

1. `htmlExport.actualMode = "standalone"`
2. `htmlExport.requiresLocalServer = false`
3. `htmlExport.standaloneAttempt.accepted = true`
4. `htmlExport.standaloneAttempt.loaderGaps = []`
5. `standaloneGate.required = true`
6. `standaloneGate.passed = true`

### Server-Script HTML

Server-script 是兼容路径，用于普通 Slidev SPA 或 native standalone sanity check 失败后的 fallback。预期输出：

```text
docs/export/<source-basename>-slides/index.html
docs/export/<source-basename>-slides/start-server.sh
docs/export/<source-basename>-slides/start-server.bat
docs/export/<source-basename>-slides/README.md
```

该模式需要通过本地 HTTP 服务查看。

## 当前侧边栏交互

导出 UI 现在遵循渐进披露：

1. 默认只暴露“一次性导出”主动作。
2. “导出前先输出大纲”开关默认关闭。
3. 打开开关后，主动作切换为两个有顺序的按钮：“先输出大纲”和“基于大纲继续导出”。
4. 大纲文件写入 `export/_slidev-outlines/<source>.outline.md`。
5. 基于大纲继续导出时，流程会读取保存的大纲，并把完整 Slidev skill references 和源笔记一起交给 deck 生成阶段。
6. 导出格式选择保留在 UI 中，直接写回 `slideExportDefaultFormat`。

这不是只换按钮。两步模式对应真实的 outline artifact 与后续 deck generation 路径；默认一次性导出仍走原先的 source preparation、layout convergence 和最终格式导出。

## 环境检测体验

“检测演示导出环境”应是非阻塞操作：

- 结果显示在侧边栏导出区内联面板中。
- 任务状态显示在底部进度区。
- 详细过程写入日志输出。
- 涉及 LLM 的步骤继续进入 API 活动区。
- 缺失工具必须给出命令和官网链接。

当前检查项：

```text
Node.js
Slidev CLI
Playwright Chromium
ffmpeg
```

典型安装提示：

```bash
node --version
npm install -D https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz @slidev/theme-default
npx playwright install chromium
sudo apt install ffmpeg
```

## 本地 Fork 解析

Slidev 命令解析优先级：

1. `NOTEMD_SLIDEV_BIN`
2. `SLIDEV_CLI_PATH`
3. `$HOME/slidev/packages/slidev/bin/slidev.mjs`
4. `npx -y @slidev/cli`

在 Jacob 的工作站上，维护者验证报告应显示本地 fork 路径。`npx -y @slidev/cli` 只是最后兜底探测路径，不是 NoteMD 推荐安装路径。如果该 fallback 没有暴露 `--standalone-bundle`，环境检测必须把 Slidev 判为不可用于 standalone 所需路径。

## Fork release 分发边界

UI 的安装入口必须指向 npm 可安装的 release artifact，而不是 GitHub source tree、blob 或 branch URL。分支链接只能让人看源码，不能稳定表达 `npm install` 的包边界；后续分支移动后，已经发出的 UI 链接也会变成不可复现状态。

当前 NoteMD 使用的 fork package 是：

```text
https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz
```

侧边栏复制出的安装命令是：

```bash
npm install -D https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz @slidev/theme-default
```

2026-06-21 的实机烟测已经证明该 release asset 会被 npm 识别为 `@slidev/cli@52.16.0`，能安装到干净 npm 项目，暴露 `slidev` binary，且 `slidev build --help` 包含 `--standalone-bundle`。

这个 release 有意挂在包含 NoteMD standalone fix 的 fork 分支上。不要在 UI 文案里把它替换成 `tree`、`blob`、raw file 或移动分支链接。这些链接适合维护者审代码，但不是 package artifact，也不能给 npm 一个稳定的可执行包边界。

## 可编辑 PPTX 导出

NoteMD 现在新增 `pptx` 导出格式。这里的 PPTX 不是把每页截图塞进 PowerPoint 的假导出，而是“可编辑文本 + 视觉 fallback 图层”的 PresentationML 输出。

本实现更接近 `oh-my-ppt` 的浏览器反抽取路线，而不是直接采用 `huashu-design` 的源 HTML 模板约束路线：

1. 先让 Slidev deck 经过现有 rendered layout convergence；
2. 用 Playwright 打开最终 HTML；
3. 逐页访问 Slidev route（`#/1`、`#/2` 等）；
4. 从当前可见 slide root 抽取真实可见文本框，并写成 PowerPoint 可编辑 text frame；
5. 对 HTML `<table>` 先做结构抽取，输出透明 native DrawingML table 层，保留单元格文本、行列尺寸与 merge 信息；
6. 将整页渲染结果作为视觉 fallback 图片层，用来保留复杂 CSS、Mermaid、SVG、canvas、icon 和 layout 效果；
7. 使用 clean-room PresentationML writer 与 `fflate` 生成 `.pptx`；
8. 额外写出 `.pptx.report.json`，明确记录可编辑覆盖率、表格结构层和 fallback 数量。

从 `oh-my-ppt` 借鉴的是 pipeline 和质量门，不是逐行迁移它的输出合同。`oh-my-ppt` 在可见 native text/table 策略下，会隐藏已抽取 primitive 后捕获背景，并用像素采样检查背景里是否残留文字；NoteMD 当前采用“冻结背景图可见 + editable text/table 透明结构层”的合同，所以截图阶段必须保留可见文字。residue 检测应作为未来打开可见 native layer 的准入门槛，而不是当前透明结构层的必需步骤。

`huashu-design` 的 `HTML Slides -> 可编辑 PPTX` 方案对“从第一行就按 PPTX 约束写 HTML”的项目很有价值：文本必须用段落/标题标签承载，背景应在容器上，渐变和 `background-image` 受限，画布尺寸要匹配 PowerPoint layout。但 Slidev 输出是 Vue SPA，含 transforms、Mermaid SVG、复杂 CSS 和组件状态；把这类 HTML 事后强行套入严格模板转换，稳定性很差。NoteMD 因此采用浏览器观测后的抽取路线，并用报告说明哪些内容仍是图片 fallback。

预期输出：

```text
docs/export/<source-basename>.pptx
docs/export/<source-basename>.pptx.report.json
```

维护者命令：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --json
```

这条命令只证明 PPTX 结构可编辑性。PPTX 结构额外通过条件：

1. `environment.capabilities.pptx = true`
2. `pptxInspection.isZip = true`
3. `pptxInspection.slideCount` 与渲染 deck 页数一致
4. `pptxInspection.textRunCount > 0`
5. 对每页都有文本的 deck，`pptxInspection.slidesWithoutEditableText = []`
6. 含表格的 deck 应记录 `pptxInspection.tableCount`
7. sidecar report 包含 `editableTextSlideCount`、`textBoxCount`、`tableCount`、`editableTableCellCount`、`imageFallbackCount` 与 `pagesWithoutEditableText`

视觉保真必须额外运行 PPTX 回渲染对比：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json
```

该流程会先导出 PPTX，再从 PPTX package 中按 slide relationship 抽取每页冻结视觉背景作为 reference，然后用 LibreOffice -> PDF -> `pdftoppm` 把 PPTX 回渲染成 PNG，并逐页计算 ImageMagick RMSE/AE。这里不再重新运行一次 Slidev PNG export 作为硬门槛 reference：实测证明独立 PNG export 会因为字体/抗锯齿/页面状态产生漂移，容易把同一个 PPTX 误判为失败。PPTX 视觉门槛要验证的是 Office 回渲是否保持写入 PPTX 的冻结视觉层；HTML/布局正确性仍由前置 rendered convergence 和 browser audit 负责。报告模式不会因为阈值超标而让总 `ok` 失败；需要收口时必须加：

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json
```

默认质量阈值：

1. `pptxVisualDiff.comparison.summary.maxRmse <= 0.12`
2. `pptxVisualDiff.comparison.summary.meanRmse <= 0.08`
3. `pptxVisualDiff.comparison.summary.missingReferenceSlides = []`
4. `pptxVisualDiff.comparison.summary.missingRenderedSlides = []`
5. `pptxVisualDiff.reference.source = "pptx-background-images"`

当前实现有意把 Mermaid/SVG/canvas 和复杂装饰保留为图片 fallback。这能保持源 Mermaid 内容不被改写，也能最大化视觉一致性，但这些图形部分不是 PowerPoint 原生可编辑对象。表格已有 native DrawingML 结构层，但默认透明，不负责可见渲染，因为当前 Office 原生表格的 grid、padding、line-height 与字体度量还不能稳定匹配 Slidev CSS。因此用户合同应写清楚：这是“可编辑文本与透明表格结构叠加在视觉 fallback 层上”，不是“把每个 Slidev/Vue/CSS 对象完美重建为 Office 原生可编辑元素”。

## 真实验证命令

默认真实源文件：

```text
docs/architecture.zh-CN.md
```

推荐命令：

```bash
npm run verify:slidev-export
```

关键通过条件：

1. `ok: true`
2. `slideSource.skillReferenceCount > 0`
3. `ignoredOutputs: []`
4. 无旧 deck 文本污染
5. 无缺失主题标记
6. Playwright 样本无失败
7. `layoutAuditSummary.overflowCount = 0`
8. `layoutAuditSummary.unreadableCount = 0`
9. `layoutAuditSummary.lowEffectiveFontCount = 0`
10. quality-margin 与 content-area finding 要么为零，要么能被结构化 patch attempt 解释
11. 除非人工显式改源文档，源 Mermaid fence 与导出 deck Mermaid fence 保持一一对应，且逐 fence 内容不变

2026-06-21 当前真实基线：

1. `docs/architecture.zh-CN.md` 的 strict native standalone 验证返回 `ok: true`。
2. 报告确认使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` 与 `/home/jacob/slidev/skills/slidev`。
3. 真实 deck 收敛为 `27` 张审计 slide，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`。
4. `mermaidSourcePreservation.passed = true`，源文件和导出 deck 均为 `3` 个 Mermaid fence，`changedFenceIndexes = []`。
5. HTML 输出为 native standalone，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneAttempt.accepted = true`。
6. 环境检测 UI 链接到 fork release 页面，并复制 `npm install -D <release .tgz> @slidev/theme-default`；不能把 branch 源码链接或官方通用 `@slidev/cli` 安装当作 NoteMD standalone 必需路径。
7. `docs/architecture.zh-CN.md` 的真实 PPTX 验证返回 `ok: true`，输出 27 页、331 个 slide XML `<a:t>` 文本节点、4 个 native table、95 个表格单元结构、27 个视觉 fallback 图片，且没有缺少可编辑文本的页面。

## 当前渲染收敛模型

渲染反馈循环由三部分组成：

1. `prepareSlidevExportSource()` 加载完整 skill，并在 prompt 中要求保留 Mermaid 源 fence；LLM 候选 deck 如果改变这些 fence，会在写入 prepared deck 前被拒绝并回退到 deterministic source-preserving preparation，同时仍要求拆分密集 prose/table/code。
2. `SlideLayoutPlan` 在生成前估算 dense Markdown block，并把 deterministic layout budget 注入 outline 与 LLM prompt。
3. `convergeSlidevDeckLayout()` 构建 HTML、打开浏览器、测量真实 `slidev-page`、易溢出元素、effective font、quality margin、content-area ratio 与 Mermaid 源图保持 fit 状态。
4. patcher 根据渲染证据应用 slide `zoom`、局部 `<Transform>`、结构化拆分或内容级重写；当 low effective font、tight margin 或 low utilization 出现时，table/code/prose 优先结构拆分，Mermaid 默认保持源图不拆。
5. slot/component-heavy 缩放现在同样受字体下限约束：zone 内实测最小 effective font 会推导最低可读 Transform scale；如果多个 named slot 的几何 fit scale 会让字体不可读，patcher 会把这些 slot 分页到独立默认画布，而不是修改 slot 内部内容或强行缩小。

Mermaid 的规则比 table/code/prose 更严格：用户提供的一个 Mermaid fence 仍然是一张图。若保留源图后出现低 zoom、低字号或边距过紧，流程记录 `fits`、`source-preserved-fit-review` 或 `manual-review` 证据，而不是把原图静默拆成多张图。

工程上这条是硬约束，不是偏好：自动导出不得拆分一个源 Mermaid fence，不得重写图体，不得改 fence metadata，也不得重排 Mermaid fence。自动路径只能对渲染后的图做 fit，移动非 Mermaid 邻近内容，或暴露 review 证据；要改变 Mermaid 内容必须来自明确的人工源文档编辑。

这条规则现在不只靠导出后 verifier 兜底：一次性 LLM deck 生成和基于 outline 继续生成两个入口，都会在写 prepared deck 之前逐个比较源 Mermaid fence 与候选 deck fence。数量、顺序、fence metadata 或正文任一变化，都会拒绝该 LLM 候选并回退到保留源图的 deterministic deck。

verifier 现在用 `mermaidSourcePreservation` 强制这条规则：导出 deck 会逐个 Mermaid fence 与源 fence 对比。只有 block 数一致不够，任何内容变化、顺序变化或 fence metadata 变化都应失败。

Mermaid/prose 混排页不能套用 Mermaid-only 页的低整页 zoom 策略，因为正文会一起变小。当前支持的修复是把 Mermaid 源 fence 原样保留在图专属页，只把 prose/list 这类非图内容移动到独立可读页；这不是把一个 Mermaid 原图拆成多图的许可。如果 layout 不支持安全移动非图内容，patcher 会阻止低整页 zoom，而不是牺牲正文可读性。

这一点现在也有单元测试约束：即使 Mermaid slide 被错误送入 code structural patch 候选，patcher 也必须拒绝把 `mermaid` fence 当作可拆分代码块。

混合 component/prose 页采用同一类“先保护正文可读性”的策略，但不触碰 Mermaid 规则：当自定义 layout 中只有一个完整 component/Vue surface 与一个 Markdown prose/list 主内容块时，patcher 会先把它们分成两个 presentation surfaces；下一轮 rendered audit 可以只对组件页的组件块套 measured local `<Transform>`，正文页不继承整页 `zoom`。如果组件混排里含 fence/table/image/directive/已有 Transform，或出现 component/prose/component 这类不稳定顺序，patcher 会 blocked/manual-review，而不是静默缩小正文。

Stage 13/14 把这类“不应自动修”的边界纳入生产 fixture runner：`unsupported-component-table-boundary-stress`、`unsupported-component-fence-boundary-stress` 与 `unsupported-component-image-boundary-stress` 都是 expected-failure fixtures，显式运行时应让 verifier `ok = false`，但必须同时证明 native standalone、浏览器加载、Git 可见性、失败指纹和 Mermaid source-preservation 都成立。image fixture 还要求本地 SVG 资产在 prepared deck 与最终 standalone export 中都存在。默认 `verify:slidev-layout-fixtures` 仍只跑可收敛 fixtures；需要审查失败边界时显式传具体 `--fixture ...` 或 `--include-expected-failures`。

最新真实 strict run 的 Mermaid fit 计数为 `mermaidSlideCount = 3`、`mermaidFitReviewCount = 3`、`mermaidLowZoomCount = 2`、`mermaidManualReviewCount = 1`。这说明当前流程已经把低 zoom 风险显性化，但没有改写原 Mermaid 内容。

支持的结构化 patch 范围包括：

- 简单标题、段落、列表 slide
- Markdown 表格拆行、拆列，病态宽表与长 cell 表转 record-list fallback
- 非 Mermaid 代码块中，TypeScript/JavaScript/Python/Rust 优先按 top-level tokenizer 分块，再退回通用语义块、空行或行数预算
- slot-marked layout 与部分 component-heavy slot zone
- effective font measurement 已感知局部 CSS `transform` / independent `scale` / CSS `zoom`，被局部 `<Transform>` 缩放的内容按真实渲染字号进入质量门
- unsafe competing component-heavy slot 会转为 slot 级分页；整页 `zoom` 和局部 `<Transform>` 都不能绕过字体地板
- Mermaid/prose 混排页只迁移非图内容，其中每个 Mermaid fence 的 opener、metadata、body、closer 仍逐字节保持
- 清晰边界 mixed component/prose 页会先迁移正文，再对组件页做局部 measured `<Transform>`；不清晰边界 fail transparent

当前已补齐的工程事实：

1. Markdown image、HTML media/link/srcset 属性和 Slidev frontmatter `background`、`image`、`src`、`favicon`、`poster`、`download` 显式引用的本地相对资产会被复制到 prepared deck 所在目录；deck 显式引用的本地 CSS 文件还会作为本地依赖图解析，包含 `url(...)` 图片/字体依赖和本地 `@import` 样式链，路径按每个 CSS 文件所在目录解析，避免 `_slidev-sources` 隔离工作副本破坏源文档相对 SVG/PNG/JPEG/background/favicon/poster/font 引用。
2. local Slidev fork 的 standalone bundler 已改为用括号平衡边界替换 Vite preload helper，避免误删第一张 slide loader binding；NoteMD strict standalone gate 继续 fail-closed 并报告真实 `loaderGaps`。
3. native standalone 或 server-script HTML build 后，exporter 会把 prepared deck 仍显式引用的本地文件、CSS `url(...)` 依赖和本地 `@import` 链同步到最终 `<source>-slides/` 输出目录；未显式配置顶层 `fonts:` 的 prepared deck 会默认注入 `fonts.provider: none`，避免验证依赖外网字体。
4. expanded full-deck fixture suite 已归档到 `/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/`，fixture 均为 native standalone：source-layout stress（含 52 个 Slidev skill references）、slot/component Transform stress、Mermaid/prose 非图内容迁移、media/nested-slot/超宽表 stress、frontmatter/cross-dir asset stress。
5. CSS dependency 最终验收包位于 `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`：真实 `architecture.zh-CN.md` strict standalone report 为 `ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`，加载 52 个 Slidev skill references，3 个源 Mermaid fence 全部 byte-stable，HTML 输出为 native standalone 且不需要本地 server。
6. 越界 CSS import/url 不会被复制，并会在复制后的 CSS 中被移除或中和，避免 standalone 打开时继续请求 `outside.css` / `outside.svg` 这类被拒绝路径。
7. CSS import/media fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`：生产 fixture suite 现在验证本地 CSS `@import` 递归、imported CSS 内的字体/背景图依赖、本地 video/audio/track/poster 资产、CSS sanitizer 行为，以及越界 imported stylesheet 在 prepared workspace 和最终 standalone export 两层都不会被复制。
8. source preparation 现在会拒绝一次性导出和基于 outline 继续导出中拆分、改写、重排或只改 metadata 的源 Mermaid fence LLM 候选，转而写入 deterministic source-preserving deck，避免 UI 路径落地产生改图后的 prepared deck。
9. 历史生成的 `docs/export/test-slidev-*`、`docs/export/test-slidev.pdf`、`docs/export/test-slidev-video.mp4` 与旧 `docs/export/slides/` 产物已不再跟踪到 `main`；可维护的导出说明保留在 `docs/export/README.md` 与 `docs/export/README.zh-CN.md`。
10. font-safe slot/code convergence 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`：生产 fixture suite 覆盖 unsafe competing slot 分页、font-floor zoom blocking、fit-factor code splitting，并保持 `hardOverflowCount = 0` 与 `lowEffectiveFontCount = 0`。
11. 同批真实 `architecture.zh-CN.md` strict standalone 输出归档到 `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`；其中 `architecture.zh-CN.slidev.md` 是可直接审查的导出 deck，`index-standalone.html` 是 native standalone 输出。
12. Stage 12 mixed component/prose 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`：生产 fixture suite 覆盖自定义 `dashboard-shell` 中的 Vue component surface + Markdown prose 分离，最终为 3 slides、2 patch passes、无 whole-slide zoom，并保留正文与组件指纹。
13. Stage 12 真实 `architecture.zh-CN.md` strict standalone 输出归档到 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`；其中 `architecture.zh-CN.stage12.slidev.md` 是可直接审查的输出 deck，`architecture.zh-CN-slides/index-standalone.html` 是 native standalone 输出。
14. Stage 13 expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture/`：`unsupported-component-table-boundary-stress` 的正确结果是 verifier `ok = false`，`hardOverflowCount > 0`，blocked reason 指向 mixed component + primary Markdown 不能用整页 `zoom` 修，同时 1 个源 Mermaid fence 与导出 deck Mermaid fence byte-stable。
15. Stage 13 默认成功 fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`：9 个可收敛生产 fixtures 均通过，expected-failure fixture 不进入默认成功套件。
16. Stage 13 真实 `architecture.zh-CN.md` strict standalone 输出归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`；其中 `architecture.zh-CN.stage13.slidev.md` 是可直接审查的输出 deck，`architecture.zh-CN-slides/index-standalone.html` 是 native standalone 输出。报告为 `ok = true`，使用本地 Slidev fork 与 52 个 skill references，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`。
17. Stage 14 component/fence expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture/`：`unsupported-component-fence-boundary-stress` 的正确结果是 verifier `ok = false`，blocked reason 指向 mixed component + primary Markdown 不能用整页 `zoom` 修，同时 source Mermaid fence 仍保持一个源 fence 对应一个导出 fence。
18. Stage 14 component/image expected-failure fixture 验收包位于 `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture/`：`unsupported-component-image-boundary-stress` 证明 image 混排同样 fail transparent，并额外证明 `assets/boundary-image.svg` 在 prepared deck 和最终 standalone export 中都存在。
19. Stage 14 默认成功 fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage14-success-fixtures/`：9 个可收敛生产 fixtures 继续全部通过，三个 expected-failure fixtures 不进入默认成功套件。
20. Stage 14 真实 `architecture.zh-CN.md` strict standalone 输出归档到 `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`；其中 `architecture.zh-CN.stage14.slidev.md` 是可直接审查的输出 deck，`architecture.zh-CN-slides/index-standalone.html` 是 native standalone 输出。报告为 `ok = true`，使用本地 Slidev fork 与 52 个 skill references，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`。
21. Stage 15 真实 `architecture.zh-CN.md` strict standalone 输出归档到 `/home/jacob/slidev-export-review/2026-06-21-stage15-final-rerun/`；其中 `architecture.stage15.slidev.zh-CN.md` 是可直接审查的输出 deck，`architecture.zh-CN-slides/index-standalone.html` 是 native standalone 输出。报告为 `ok = true`，使用本地 Slidev fork 与 52 个 skill references，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，且 native standalone 被接受。repo 内保留可审查的 Markdown deck：`docs/slidev/architecture.stage15.slidev.zh-CN.md`；生成 HTML/assets/screenshots 不进入提交。
22. Slidev fork release asset `slidev-cli-notemd-standalone-v52.16.0-1.tgz` 已在 GitHub release `notemd-standalone-v52.16.0-1` 下发布，并通过 `npm pack --dry-run` 与干净 npm 项目安装烟测；这是 UI 安装命令的稳定分发边界。
23. 可编辑 PPTX 导出已经接入 UI 格式选择、环境检测、产品导出命令和维护者 verifier；该路径复用渲染收敛后的 HTML，再生成 PresentationML `.pptx` 和可编辑性报告。
24. 2026-06-21 的真实 PPTX 验收归档在 `/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/`，包含 `architecture.zh-CN.pptx`、`architecture.zh-CN.pptx.report.json`、`architecture.zh-CN.slidev.md`、standalone HTML 目录与 `acceptance-summary.json`。
25. 2026-06-21 的 PPTX/PNG 逐页视觉对比已接入 verifier。真实 `architecture.zh-CN.md` report-mode run 返回 `ok = true`，但 visual quality gate 未通过：`meanRmse = 0.15322961111111114`，`maxRmse = 0.260447`，最差页为 21、19、24、20、16、17、18、10、22、15、13、12。产物位于 `docs/export/test-slidev-pptx-visual-diff/`，由 `.gitignore` 覆盖。
26. 参考 `oh-my-ppt` 的 table-first extraction 后，PPTX 现在写出透明 native DrawingML table 结构层：真实 `architecture.zh-CN.md` inspector run 记录 `pptxInspection.tableCount = 4`、sidecar `editableTableCellCount = 95`。可见 native table 与 hybrid native-table text 两次试验分别退化到 `meanRmse = 0.15640467407407407` 与 `0.15657594444444442`；当前透明结构层为 `meanRmse = 0.15259227777777779`，仍未通过视觉门槛。
27. 2026-06-21 后续参考 `oh-my-ppt` 的 freeze/capture 思路修正 PPTX 视觉门槛：PPTX 导出现在先等待字体、冻结动画、双 RAF 稳定后捕获 1960x1104 视觉层；`--pptx-visual-diff` 不再另跑 Slidev PNG export，而是从 PPTX 内嵌背景图抽取冻结 reference。真实 `architecture.zh-CN.md` strict run 位于 `docs/export/test-slidev-pptx-frozen-reference-strict/`，返回 `ok = true`、`pptxVisualGate.passed = true`、`meanRmse = 0.049441916296296295`、`maxRmse = 0.0889364`，并确认 `reference.source = pptx-background-images`。

当前仍存在的边界：

1. 更复杂的自定义 Vue layout 仍可能需要保守处理或人工复查，尤其是没有稳定 owner、无法安全分页、又不能在字体下限内缩放的单个 component surface。混入 table/directive/fence/image 的 component surface 已经有阻断证据；component/prose/component 顺序不稳定或多个 owner 竞争的情况仍需要继续沉淀真实 fixture。
2. Standalone 正确性依赖 post-build sanity detection；fallback 通过不能当作 native standalone 通过。
3. 全 deck Playwright 审计更正确但更慢，后续应优化收敛效率，而不是削弱审计范围。
4. Obsidian CLI 可以派发 `notemd:export-slides`，但缺少导出完成握手，所以宿主命令烟测弱于 verifier。
5. Mermaid `manual-review` 是源图保持约束下的透明证据，不是 hard gate failure，也不是自动拆图许可。
6. PPTX 当前是务实的可编辑文本与透明表格结构抽取层：文本可编辑，表格存在 native DrawingML 结构，视觉通过 slide-level image fallback 尽量保留；Mermaid、SVG、canvas 与 Vue component 内部尚未重建成 Office 原生可编辑对象。
7. PPTX visual diff gate 当前在冻结背景 reference 语义下已经通过，但这不等价于“每个对象都 Office 原生可编辑”。它证明 Office 回渲能保持写入 PPTX 的视觉层；Mermaid、SVG、canvas 与 Vue component 内部仍主要依赖视觉 fallback。

## Next-level 布局质量路线

当前验收已经能证明“不裁切、能 standalone、真实 UI 等价路径可运行”，但还不能单独证明“演示质量合格”。在 Mermaid 源图保持约束下，大型源 Mermaid 图有时仍需要较低 zoom；流程应该记录这个取舍，而不是把一张原图自动改写成多张图。

下一阶段不应替换现有 render-feedback pipeline。正确方向是：

1. 保留 `convergeSlidevDeckLayout()` 作为最终事实门；
2. 在 source preparation 前增加 clean-room `SlideGeometry` / `SlideLayoutPlan`，借鉴 `ref/infinite-canvas` 的 world rect、union bounds 与 viewport fit 思想，但不复制 AGPL-3.0 实现代码；
3. 在 rendered audit 中持续保留 effective font、quality margin、content area ratio、low-utilization 与 Mermaid fit-review 指标；
4. 保留 Mermaid 源 fence，对 table/code/prose 做预拆分和语义拆分，避免非 Mermaid 内容继续依赖低 `zoom`；
5. 将 hard gate 与 quality gate 分开报告：hard overflow 失败仍 fail closed，quality warning 用于推动拆分、重布局或人工复查。

具体路线和进度对比见：

```text
docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md
```

## 输出策略

`docs/export/` 下的验证产物用于本地检查。提交前应确认没有把一次性导出内容误加入 main：

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

当前策略是：`docs/export/README.md` 与 `docs/export/README.zh-CN.md` 可跟踪，其余 `docs/export/*` 生成物默认被 `.gitignore` 覆盖。维护者应直接打开这些本地产物检查，但不得把一次性导出内容提交到 `main`。
