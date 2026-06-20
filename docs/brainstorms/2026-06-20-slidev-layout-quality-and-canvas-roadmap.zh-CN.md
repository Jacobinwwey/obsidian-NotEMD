---
date: 2026-06-20
last_updated: 2026-06-20
topic: slidev-layout-quality-and-canvas-roadmap
canonical: true
status: stage13-unsupported-component-boundary-fail-transparent
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
3. 本批次实现内容：rendered quality gate + clean-room `SlideLayoutPlan` 第一切片 + Mermaid 源图保持 fit 审计 + JS/TS/Python/Rust tokenizer + Mermaid 不拆图回归契约 + Stage 5 full-deck/export fixture、文本 glyph rect 测量、slot Transform 去整页 zoom 叠加、mixed Mermaid/prose 非图内容移动、相对图片资产镜像、local Slidev fork standalone loader 边界修复、Stage 6 frontmatter/cross-dir 资产镜像、CSS `url(...)` 与本地 `@import` 依赖图、HTML export 后资产同步、本地媒体 fixture 与离线字体 provider、Stage 7 font-safe slot/code convergence、Stage 8 Mermaid measured-fit ownership、Stage 9 custom single-surface local Transform fixture、Stage 10 bounded Vue component tree surface fixture、Stage 11 Mermaid fence metadata 保持回归约束、Stage 12 mixed component/prose 清晰边界分离与标题+组件局部 Transform、Stage 13 unsupported component/table/directive boundary fail-transparent fixture
4. 真实源文件：`docs/architecture.zh-CN.md`
5. 本批次真实导出证据包：`/home/jacob/slidev-export-review/2026-06-20-quality/`
6. 本批次最终 source-preserved-fit 输出归档：`/home/jacob/slidev-export-review/2026-06-20-source-preserved-fit-final/`
7. 局部 transform 字号感知验收包：`/home/jacob/slidev-export-review/2026-06-20-local-transform-font/`
8. JS/TS code tokenizer 验收包：`/home/jacob/slidev-export-review/2026-06-20-js-ts-code-tokenizer/`
9. Python/Rust code tokenizer 验收包：`/home/jacob/slidev-export-review/2026-06-20-python-rust-code-tokenizer/`
10. full-deck layout fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`
11. expanded layout fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/`
12. Stage 6 真实 architecture strict standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-expanded-layout-final/`
13. CSS import/media fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`
14. Stage 7 font-safe slot/code convergence fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`
15. Stage 7 真实 `architecture.zh-CN.md` strict standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`
16. Stage 8 Mermaid measured-fit ownership 真实 `architecture.zh-CN.md` strict native standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-mermaid-measured-fit-real/`
17. Stage 9 custom single-surface fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage9-custom-single-surface-fixtures/`
18. Stage 9 真实 `architecture.zh-CN.md` strict native standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage9-architecture-real/`
19. Stage 10 Vue component tree fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage10-vue-component-tree-fixtures/`
20. Stage 10 真实 `architecture.zh-CN.md` strict native standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage10-architecture-real/`
21. Stage 11 Mermaid source boundary 收口验收包：`/home/jacob/slidev-export-review/2026-06-20-stage11-mermaid-source-boundary/`
22. Stage 12 mixed component/prose fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`
23. Stage 12 真实 `architecture.zh-CN.md` strict native standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`
24. Stage 13 unsupported component boundary expected-failure fixture 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture/`
25. Stage 13 正常成功 fixture suite 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`
26. Stage 13 真实 `architecture.zh-CN.md` strict native standalone 验收包：`/home/jacob/slidev-export-review/2026-06-20-stage13-real/`

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
10. `architecture.zh-CN.md` strict native standalone rerun 已通过：`slideCount = 27`，源文档与导出 deck 均为 3 个 Mermaid fence，hard overflow / unreadable scale / low effective font / quality margin warning / low utilization 均为零，HTML export 为 native standalone 且不需要本地 server；
11. `slidevLayoutAudit` 单测与 verifier 回归新增 Mermaid source-preservation 约束：即使误收到 code structural patch，也不会把一个 Mermaid fence 拆成多个 fence；真实 verifier 还会逐 Mermaid fence 比较源内容与导出内容，数量一致但内容变化不能通过；source preparation 也会在写 prepared deck 前拒绝一次性或基于 outline 的 LLM 生成中改写、重排或拆分 Mermaid fence 的候选 deck；
12. Python/Rust code fence 现在也会先走轻量 top-level tokenizer，保持 import/use 组、decorator/attribute 与顶层 class/function/impl/module item 完整；
13. Stage 5 fixture 已从局部 unit/measurement 扩展到 full-deck export fixture：`source-layout-stress` 覆盖非 Slidev 源笔记、完整 skill references、长表 record-list、代码拆分、Mermaid 源图保持与 native standalone；`slot-component-stress` 覆盖 component-heavy slot 的局部 Transform 收敛；`mixed-mermaid-prose-stress` 覆盖 Mermaid fence 原样保留、只移动同页 prose 和禁止 mixed low zoom；`media-nested-slot-stress` 覆盖相对 SVG 资产、image slide、嵌套 slot component 与超宽表；
14. Mermaid-only 页在保留源 fence 且进一步拆图被禁止时，可以使用测量得到的低 `zoom` 先保证整张图不裁切，再通过 `mermaidFit.manual-review` 暴露投影可读性风险；这不是自动拆图许可；
15. 文本 overflow 测量已从 block element box 改为 text node Range glyph rect，避免 `h1` 等块级元素的布局盒被误判为文字超界；
16. 已有 slot `<Transform>` 的页面不会再叠加整页 `zoom`；若叠加导致低 effective font，patcher 会移除整页 zoom，保持局部 Transform 作为唯一缩放面；
17. source preparation 现在会把 deck 中引用的本地相对 Markdown/HTML 图片资产复制到 prepared deck 所在目录，避免 `_slidev-sources` 隔离工作副本破坏相对路径；
18. local Slidev fork 的 standalone bundler 已修复 Vite preload helper 替换边界，避免误删第一张 slide loader binding；NoteMD strict gate 继续保持 fail-closed，不把 server-script fallback 伪装为 native standalone；
19. 当前生成产物可被 Git 看到，用于本地视觉检查，但不应提交进 `main`；
20. source preparation 现在会识别 Slidev frontmatter 中的本地 `background`、`image`、`src`、`favicon`、`poster`、`download` 文件引用，以及 HTML media/link/srcset 引用；只复制源文件目录内的相对路径，继续拒绝 URL、绝对路径和 `..` traversal；
21. 被 deck 显式引用的本地 CSS 文件现在会继续解析其 `url(...)` 本地依赖与本地 `@import` 样式链，并按当前 CSS 文件所在目录递归解析相对路径；CSS 内部的 `../media/foo.svg` 或 sibling imported stylesheet 只要仍落在 deck base 目录内即可复制，越界/NUL/绝对路径引用仍会拒绝，并在复制后的 CSS 中被移除或中和；
22. HTML exporter 会把 prepared deck 中仍以相对路径引用、但未被 Vite/Slidev 打包进输出目录的本地文件同步到最终 `*-slides/` 输出目录，修复 frontmatter background/image/CSS import/media 依赖在 native standalone 中 `ERR_FILE_NOT_FOUND` 的真实问题；被拒绝的 CSS import/url 不会残留在复制后的 CSS 中继续触发缺失文件请求；
23. 未显式配置 `fonts:` 的 prepared deck 会写入 `fonts.provider: none`，避免 standalone 验证和本地打开时依赖 Google Fonts 等外网资源；用户显式 `fonts:` 配置保持不覆盖；
24. CSS asset dependency 最终验收包位于 `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`；真实 `architecture.zh-CN.md` strict standalone report 为 `ok = true`，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`skillReferenceCount = 52`，`mermaidSourcePreservation.passed = true`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`；
25. CSS import/media fixture 已覆盖本地 CSS `@import` 递归、imported CSS 内的字体/背景图依赖、本地 video/audio/track/poster 资产、CSS sanitizer 行为，以及越界 imported stylesheet 在 prepared workspace 与最终 standalone export 两层都不会被复制；
26. 历史生成的 `docs/export/test-slidev-*`、`docs/export/test-slidev.pdf`、`docs/export/test-slidev-video.mp4` 与旧 `docs/export/slides/` 产物已从 Git 索引移除；后续真实输出默认归档到 `/home/jacob/slidev-export-review/...`，提交前清理 `docs/export/_slidev-sources` 与 `docs/export/*-slides`。
27. slot zone 审计现在携带 `effectiveMinFontPx` 与 `minimumReadableTransformScale`；局部 `<Transform>` 和整页 `zoom` 都会先预测是否跌破字体下限。多个 component-heavy named slot 若几何 scale 会让字体不可读，patcher 会把 slot 内容分页到独立默认画布并保留 `data-notemd-slot-zone` 证据，而不是强行套低 scale。
28. table/code 结构化拆分现在也会在字体下限阻止 `zoom` 时触发，chunk 数按 `currentZoom / nextZoom` 的实际 fit factor 估算，避免 dense code 在 retry 预算内只被拆两半后仍溢出。
29. Stage 7 真实 `architecture.zh-CN.md` strict standalone rerun 为 `ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`，加载 `/home/jacob/slidev/skills/slidev` 与 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`mermaidSourcePreservation.passed = true`，3 个源 Mermaid fence 与导出 deck 一一对应且内容未变，hard overflow / unreadable scale / low effective font / quality margin warning / low utilization 均为零；输出 deck 位于 `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/architecture.zh-CN.slidev.md`。
30. Stage 8 明确 Mermaid fit ownership：source preparation 不再按 Mermaid 行数写入固定 `zoom`，也不保留 LLM 为生成 Mermaid 页选择的 `zoom`；含 Mermaid 的生成页会在写 `_slidev-sources` 前剥离 per-slide zoom，后续只由 Playwright rendered audit 的几何测量决定是否需要 measured zoom 或进入 `mermaidFit` 复核。已有用户 Slidev 源 deck 仍走隔离 working copy，保留用户显式源设置。
31. Stage 8 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档：`ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`，加载 `/home/jacob/slidev/skills/slidev` 与 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.required = true` 且 `passed = true`，`mermaidSourcePreservation.passed = true`，源文档与导出 deck 均为 3 个 Mermaid fence 且 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`qualityMarginWarningCount = 0`，`lowContentUtilizationCount = 0`，`postPatchCount = 4`，`mermaidFitReviewCount = 3`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`。最终 deck 只有 rendered audit 推导出的 `zoomLines = ["0.285", "0.384"]`，不再包含生成阶段按行数或 LLM 选择带来的第三条 Mermaid zoom。
32. Stage 9 新增 bounded raw HTML/component single-surface 收敛路径并已归档到 `/home/jacob/slidev-export-review/2026-06-20-stage9-custom-single-surface-fixtures/`：自定义 `layout: surface-shell` 且没有 slot owner marker 的单个超宽 component surface 可以被 measured local `<Transform>` 包裹；最终 deck 保留 custom layout frontmatter，不引入 `data-notemd-slot-zone`，也不会在已有 `<Transform>` 外再叠加整页 `zoom`；`custom-single-surface-component-stress` report 为 `ok = true`、`actualMode = "standalone"`、`hardOverflowCount = 0`、`lowEffectiveFontCount = 0`、`postPatchCount = 1`。
33. Stage 9 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage9-architecture-real/`：`ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`，加载 `/home/jacob/slidev/skills/slidev` 与 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.required = true` 且 `passed = true`，`mermaidSourcePreservation.passed = true`，源文档与导出 deck 均为 3 个 Mermaid fence 且 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`postPatchCount = 4`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`；可审查 deck 为 `architecture.zh-CN.stage9.slidev.md`。
34. Stage 10 新增 bounded Vue component tree single-surface 收敛路径并已归档到 `/home/jacob/slidev-export-review/2026-06-20-stage10-vue-component-tree-fixtures/`：`custom-vue-component-tree-stress` 覆盖 multiline Vue tag opener、multiline prop array、嵌套 component、named template slot 与 custom layout shell；最终 deck 用 measured local `<Transform>` 包裹一个完整 component-only surface，保留 `layout: dashboard-shell`，不引入 `data-notemd-slot-zone`，不叠加整页 `zoom`，report 为 `ok = true`、`actualMode = "standalone"`、`hardOverflowCount = 0`、`lowEffectiveFontCount = 0`、`postPatchCount = 1`。该切片没有修改 Mermaid 策略。
35. Stage 10 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage10-architecture-real/`：`ok = true`，使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`，加载 `/home/jacob/slidev/skills/slidev` 与 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.required = true` 且 `passed = true`，`mermaidSourcePreservation.passed = true`，源文档与导出 deck 均为 3 个 Mermaid fence 且 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`postPatchCount = 4`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，`zoomLines = ["0.285", "0.384"]`；可审查 deck 为 `architecture.zh-CN.stage10.slidev.md`。
36. Stage 11 把 Mermaid 源图边界进一步硬化为测试契约：mixed Mermaid/prose 的自动修复只能迁移非 Mermaid 正文，不能拆 Mermaid fence；带 inline metadata 的 Mermaid opener 也必须与 body、closer 一起 byte-stable。source preparation 现在有回归测试覆盖“LLM 只改 fence metadata”也必须拒绝该候选并回退 deterministic source-preserving deck。
37. Stage 11 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage11-mermaid-source-boundary/`：`ok = true`，继续使用本地 Slidev fork 与 `/home/jacob/slidev/skills/slidev` 的 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`mermaidSourcePreservation.passed = true`，源文档与导出 deck 均为 3 个 Mermaid fence 且 `changedFenceIndexes = []`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`postPatchCount = 4`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，`zoomLines = ["0.285", "0.384"]`；可审查 deck 为 `architecture.zh-CN.stage11.slidev.md`。
38. Stage 12 新增 mixed component/prose 清晰边界收敛路径：自定义 layout 中若只有一个完整 component/Vue surface 与一个 Markdown prose/list 主内容块，patcher 会先分离为两个 presentation surfaces，后续 rendered audit 可在组件页对组件块应用 measured local `<Transform>`，正文页不会继承整页 `zoom`。若混排中包含 fence/table/image/directive/Transform 或 component/prose/component 这类不稳定顺序，patcher 会阻断整页 `zoom` 并暴露 blocked reason，而不是静默缩小正文。
39. Stage 12 fixture suite 已归档到 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`：新增 `mixed-component-prose-stress`，真实 native standalone verifier 结果为 `3 slides`、`2 patch passes`、无 whole-slide `zoom`、保留 `layout: dashboard-shell`、保留 prose 指纹，并用 measured local `<Transform>` 收敛组件页。完整 fixture suite 现在覆盖 9 个生产 fixtures，均为 `ok = true`。
40. Stage 12 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`：`ok = true`，继续使用本地 Slidev fork、`/home/jacob/slidev/skills/slidev` 的 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`mermaidSourcePreservation.passed = true`，源文档与导出 deck 均为 3 个 Mermaid fence 且 `changedFenceIndexes = []`，`slideCount = 27`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`postPatchCount = 4`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，`zoomLines = ["0.285", "0.384"]`；可审查 deck 为 `architecture.zh-CN.stage12.slidev.md`。
41. Stage 13 把 unsupported component/table 与 component/directive 边界从单元测试提升为生产 fixture runner 可验收的 expected-failure 类型。`unsupported-component-table-boundary-stress` 不被默认成功套件包含；显式 `--fixture unsupported-component-table-boundary-stress` 或 `--include-expected-failures` 才运行。它的通过条件是 verifier 自身 `ok = false`、standalone gate 已通过、浏览器无 render error、`layoutPatchAttempts[].blockedSlides` 包含 `mixed component and primary Markdown content cannot be fixed with whole-slide zoom`、最终 deck 不引入整页 `zoom`，并保留失败复核指纹。
42. Stage 13 expected-failure fixture 特意包含一个 Mermaid fence，证明失败路径也必须遵守源图保持：report 为 `mermaidSourcePreservation.passed = true`，`sourceFenceCount = 1`，`deckFenceCount = 1`，`changedFenceIndexes = []`。这不是把 Mermaid 拆成多图的替代方案，而是证明不安全 component/table 边界会显性失败，同时不改 Mermaid 图体、metadata 或 fence 数量。
43. Stage 13 正常成功 fixture suite 默认仍只跑可收敛 fixtures，归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`：9 个生产 fixtures 全部通过，`unsupported-component-table-boundary-stress` 不进入默认成功套件，避免把预期失败混入普通绿色路径。
44. Stage 13 真实 `architecture.zh-CN.md` strict native standalone rerun 已通过并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`：`ok = true`，继续使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` 与 `/home/jacob/slidev/skills/slidev` 的 52 个 references，`actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true`，`slideCount = 27`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`，`mermaidSourcePreservation.passed = true`，3 个 Mermaid fence 均保持 `changedFenceIndexes = []`，`mermaidFitReviewCount = 3`，`mermaidLowZoomCount = 2`，`mermaidManualReviewCount = 1`，最终 deck 仍只有 rendered audit 推导的 `zoomLines = ["0.285", "0.384"]`；可审查 deck 为 `architecture.zh-CN.stage13.slidev.md`。

当前未完成事实：

1. semantic split 仍只覆盖当前已有 table/code/text 支持集；Mermaid 源图保持后，过密原图只能通过布局/zoom/Transform 或人工复核处理，不能把一个源 Mermaid fence 自动拆成多个图，也不能把 fence metadata 当作可由 LLM 重写的格式化细节；
2. effective font 现在会把文本节点到 slide root 之间的局部 CSS `transform` / `scale` / `zoom` 乘入逐样本字号；full-deck slot fixture 已覆盖复杂 Vue/slot、嵌套 slot、component-heavy Transform、unsafe competing slot 自动分页、bounded raw HTML/component single-surface local Transform、bounded component-only Vue tree surface，以及清晰边界 mixed component/prose 的真实收敛链路；混入 table/directive 的 component surface 已有 fail-transparent fixture 或单元测试覆盖，混入 fence/image、多个不稳定 surface owner 或不可安全分页的 custom layout 仍需继续加 fixture；
3. `SlideLayoutPlan` 是生成前预算，不替代 Playwright rendered audit；
4. 真实 `architecture.zh-CN.md` 仍需要每批次跑 strict standalone 验收，不能用单测替代；
5. 当前真实 deck 仍可能在 rendered audit 之后出现 `zoom` 小于 `0.72` 的 Mermaid-only 页面；在“不改原 Mermaid 图内容”的约束下，低 zoom 有时是保留源图的代价，但不能由 source preparation 的固定参数或 LLM 主观决定，也不能扩散到 prose/table/code。混合 Mermaid/prose 页只能先迁移非图内容，不能拆 Mermaid 原图，也不能把正文一起缩小。

## 3. 先前要求与当前代码逐项对比

| 要求 | 当前代码/文档状态 | 结论 | 下一步 |
|---|---|---|---|
| UI 中两个 Slidev export 按钮必须跑真实工作流 | `exportSlidesCommand()` 是命令面板和侧栏入口共同拥有的完整操作；侧栏支持一次性导出和大纲模式 | 已落地 | 后续 UI 改动继续以 `sidebarDomButtonClicks` 与真实 verifier 锁住 |
| 非大纲模式也要嵌入 Slidev skill 流程 | source preparation 会加载完整 skill references，不再只读 `SKILL.md` | 已落地 | skill reference 数继续作为 verifier 报告字段 |
| 必须使用本地 Slidev fork | CLI 解析优先使用 `$HOME/slidev/packages/slidev/bin/slidev.mjs`；本批次还在 fork 中修复 standalone loader binding 被 preload helper 替换误删的问题 | 已落地 | verifier 中继续检查 fork 路径与 `loaderGaps = []` |
| standalone 文件必须真实可打开 | strict native gate 检查 `actualMode = standalone`、`requiresLocalServer = false`、`loaderGaps = []` | 已落地 | 新 standalone 验收应继续走带日期 evidence package |
| 不能提交测试生成文件 | `docs/export/` 产物可见但默认不提交，本批次真实输出已归档到仓库外 | 已收口 | 最终 commit 前继续检查 `git status --short docs/export` |
| zoom 参数应由检测结果决定 | source preparation 已停止按 Mermaid 行数写固定 zoom，并会剥离 LLM 生成 Mermaid 页中的 zoom；overflow patch 已用 measured fit scale；slot Transform 与整页 zoom 还会用实测字体下限做预测门禁；table/code 的拆分数量按 fit factor 推导 | 已推进 | 继续避免把低 `zoom` 当最终修复手段 |
| 不修改 Mermaid 原图内容 | prompt、layout budget、patcher 与 audit 都按 source-preserved 模型推进；Mermaid fit 问题进入证据字段或人工复核，不进入自动拆图；单测已覆盖 Mermaid fence 不被误走 code split，verifier 已新增逐 fence exact compare；source preparation 会拒绝一次性或基于 outline 的 LLM 生成中改写、重排、改 metadata 或拆分 Mermaid fence 的候选 deck | 已落地当前切片 | 真实导出继续检查 `mermaidSourcePreservation.passed = true`；不要把“拆 Mermaid 原图”重新放回自动修复方案 |
| Mermaid 与正文混排不能靠低整页 zoom 解决 | `slidevLayoutAudit` 只允许把 mixed Mermaid/prose 页中的非 Mermaid 正文移到可读页；每个 Mermaid fence 的 opener、metadata、body、closer 原样保留、数量不变、逐 fence byte-stable；无法安全移动非图内容的 unsupported layout 会阻止低整页 zoom | 已落地 | 后续只允许增强外层布局或非图内容移动，不允许拆一个 Mermaid fence |
| 相对图片与 frontmatter 资产不能在 prepared/export 中丢失 | source-preparer 会复制 Markdown image、HTML media/link/srcset 与 Slidev frontmatter 本地文件引用到 prepared deck 所在目录；HTML exporter 会再把未被 Vite 打包的相对本地文件同步到最终输出目录；忽略 URL、绝对路径和 `..` traversal | 已落地 | 后续扩展到更复杂 CSS/background URL 时仍必须只复制显式引用，不能粗暴复制整个源目录 |
| 本地 CSS 内的图片/字体/imported CSS 依赖不能在 standalone 中丢失 | CSS 文件必须先被 deck 显式引用，随后 workflow 解析 CSS `url(...)` 与本地 `@import` 链，按当前 CSS 所在目录解析相对路径；远端/fragment 不当作本地依赖复制，越界/NUL/绝对路径会被拒绝并在 copied CSS 中移除或中和 | 已落地当前切片 | 后续若支持更多 CSS 语法，仍需显式解析依赖链，不能复制整个目录 |
| standalone 验证不能依赖外网字体 | 未显式配置 `fonts:` 的 prepared deck 注入 `fonts.provider: none`；显式字体配置保持用户选择 | 已落地 | 后续若需要品牌字体，应走本地 `public/` 或明确的 support asset，而不是默认拉远程字体 |
| 完整支持 Slidev skill references | skill root 与 reference count 已进入 verifier | 已落地 | 可考虑上游 skill PR，但只放通用 guardrails |
| 参考无限画布优化图/表/画布可见范围 | 已新增 clean-room `SlideLayoutPlan`，按 world-rect / viewport-fit 思想做生成前预算 | 已落地第一切片 | 后续加强语义拆分算法，不复制 AGPL 代码 |
| custom component surface 无稳定 slot owner 时仍需收敛 | bounded raw HTML/component single-surface、bounded component-only Vue tree surface、以及清晰边界 mixed component/prose 现在可以收敛：mixed 场景先分离正文，再让组件页走 measured local `<Transform>`；已有 Transform 会阻止整页 zoom 叠加；混入 table/directive 的 component surface 已有 expected-failure 生产 fixture 或单元测试覆盖，证明会阻断整页 zoom 并保留复核材料；混入 fence/image 或 component/prose/component 的 surface 仍回到 fail-transparent 路径 | 已落地 Stage 13 切片 | 继续沉淀真实 unsupported layout；不要扩大到无法证明 owner surface 的任意组件树 |

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
17. source Mermaid fence count = 3，exported Mermaid fence count = 3；当前 verifier 还要求 `mermaidSourcePreservation.passed = true`
18. `zoomLines = ["0.285", "0.384", "0.40"]`

最终结论：这次收口没有把任何一个 Mermaid 源 fence 拆成多图，也没有修改原 Mermaid 图内容来换取布局通过。代价是三张 Mermaid-only 页仍保留低 `zoom`，其中一页进入 `manual-review`；这是当前约束下正确暴露风险，而不是让导出器静默改图。

Stage 6 frontmatter/cross-dir asset 与离线 standalone 收口后的真实验收包在：

```text
/home/jacob/slidev-export-review/2026-06-20-expanded-layout-final/architecture-expanded-layout-report.json
/home/jacob/slidev-export-review/2026-06-20-expanded-layout-final/architecture.zh-CN.expanded-layout.slidev.md
/home/jacob/slidev-export-review/2026-06-20-expanded-layout-final/export/architecture.zh-CN-slides/index-standalone.html
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
17. `mermaidSourcePreservation.passed = true`
18. `sourceFenceCount = 3`
19. `deckFenceCount = 3`
20. `changedFenceIndexes = []`

本轮新增的关键区别是：验收不再只看 Mermaid 数量一致。`scripts/verify-slidev-export-workflow.cjs` 现在逐 Mermaid fence 比较源文档与导出 deck，一旦内容、顺序、fence metadata 或拆图行为变化，真实 report 的 `ok` 会失败。

expanded fixture suite 同步扩展为 5 个 native standalone fixture：`source-layout-stress`、`slot-component-stress`、`mixed-mermaid-prose-stress`、`media-nested-slot-stress`、`background-cross-asset-stress`。新增 fixture 覆盖嵌套源路径、deck headmatter `background` / `favicon`、slide headmatter `background: url(...)`、`layout: image-right` 的 `image` 资产、prepared workspace 资产复制、最终 HTML export 资产同步，以及默认离线字体 provider。Mermaid fixture 同时执行逐 fence exact compare，不再只断言 block count。

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
6. 验收必须继续检查 `mermaidSourcePreservation.passed = true`；只比较源文档 Mermaid block count 与导出 deck Mermaid block count 不够。

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

1. `src/tests/slidevLayoutAudit.test.ts` 覆盖 low effective font measurement、Mermaid 源图保持、Mermaid fit/manual-review 统计、`source-preserved-fit-review` 与 `manual-review` 分流、table/code 质量 finding 驱动结构拆分、长 cell record-list fallback、代码语义块拆分、TypeScript import 组和顶层声明 tokenizer、Python import/decorator/top-level block tokenizer、Rust use/attribute/top-level item tokenizer、unsafe competing slot font-safe pagination、component-heavy surface font-floor zoom blocking、summary 新字段；
2. `src/tests/slidevLayoutPlan.test.ts` 覆盖 clean-room layout budget 对 Mermaid 的 `preserve-source-fit` 与 table/code 的 pre-split 判断；
3. `src/tests/slidevSourcePreparer.test.ts` 覆盖 deterministic outline 与 LLM prompt 都带 layout budget；
4. `src/tests/slidevLayoutWorkflow.test.ts` 更新 summary schema，避免 verifier mock 停留在旧字段；
5. `src/tests/slidevRenderedMeasurement.test.ts` 用真实 Playwright 页面验证局部 `transform: scale(0.5)` 与整页 `--slidev-slide-zoom-scale: 0.8` 会把 20px code font 测为 8px effective font，并验证长表 record-list fallback 在浏览器里以可读文本呈现、不残留 table overflow；
6. `scripts/verify-slidev-layout-fixtures.cjs` 运行完整生产 verifier，临时生成 fixture vault，不把 fixture Markdown 或导出产物写入仓库；`source-layout-stress` 覆盖完整 skill references、native standalone、Mermaid source fence count、record-list fallback、font-safe code splitting 和低 zoom 只允许出现在 Mermaid-only 页；`slot-component-stress` 覆盖 component-heavy slot 的局部 `<Transform>`，并防止整页 low zoom 混入；`competing-slot-zones-stress` 覆盖多个 named slot 的几何 scale 会低于字体下限时，转为 slot 分页而不是低 scale Transform；
7. 2026-06-20 Stage 7 full-deck fixture 归档位于 `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`，6 条 fixture 均为 `ok: true`，`hardOverflowCount = 0`，`lowEffectiveFontCount = 0`；其中 `source-layout-stress` 使用 `/home/jacob/slidev/skills/slidev` 与 52 个 references，`competing-slot-zones-stress` 最终 3 页收敛且没有整页 `zoom`。

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
12. Stage 5 第三切片：expanded full-deck fixtures 已落地，覆盖 Mermaid/prose 混排、相对图片资产、image slide、嵌套 slot component 和超宽表；完整 suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/`，4 个 fixture 均为 native standalone，`source-layout-stress` 继续验证 `/home/jacob/slidev/skills/slidev` 与 52 个 references。
13. local Slidev fork 修复了 standalone bundler 用正则猜测 Vite preload helper 结束位置导致误删第一张 slide loader binding 的问题；fork focused bundler test 与 NoteMD full fixture suite 已验证 `loaderGaps = []`。
14. Stage 6 CSS asset dependency 切片已收口：full fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final-fixtures/`，真实 `architecture.zh-CN.md` strict standalone 归档到 `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`，并已确认测试导出产物不再进入 `main` 跟踪集合。
15. Stage 6 CSS import/media 切片已落地：full fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`，覆盖本地 CSS `@import` 递归、imported CSS 内的字体/背景图依赖、本地 video/audio/track/poster 资产、CSS sanitizer 行为，以及越界 imported stylesheet 在 prepared/export 两层都被拒绝。
16. Stage 7 font-safe convergence 切片已落地：slot zone measurement 新增字体下限，局部 Transform 和整页 zoom 都会拒绝不可读 scale；多个 competing component-heavy slot 会在 unsafe 时拆成独立画布；table/code 在字体下限阻止 zoom 时也会结构化拆分，并用实际 fit factor 决定 chunk 数。完整 fixture suite 归档到 `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`，真实 `architecture.zh-CN.md` 输出归档到 `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`。
17. Stage 8 Mermaid measured-fit ownership 已落地：生成阶段不再按行数或 LLM 主观选择保留 Mermaid zoom；含 Mermaid 的生成页在写 prepared deck 前剥离 per-slide zoom，最终 zoom 只来自 rendered audit 的实际超界测量或进入 `mermaidFit` 复核。
18. Stage 9 custom single-surface fixture 已落地并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage9-custom-single-surface-fixtures/`：`custom-single-surface-component-stress` 通过生产 verifier，覆盖没有 slot owner marker 的自定义 layout 单 surface 局部 Transform；最终 deck 保留 `layout: surface-shell`，不引入 slot wrapper，不叠加整页 zoom，完整 fixture suite 扩展为 7 条。
19. Stage 9 真实 `architecture.zh-CN.md` strict native standalone 已重新验收并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage9-architecture-real/`；输出 deck `architecture.zh-CN.stage9.slidev.md` 可直接审查，3 个 Mermaid fence 均未改写或拆分。
20. Stage 10 bounded Vue component tree surface fixture 已落地并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage10-vue-component-tree-fixtures/`：完整 fixture suite 扩展为 8 条，`custom-vue-component-tree-stress` 通过生产 verifier，覆盖 multiline component opener、prop array、nested components 与 named template slot，在 custom layout 中用 measured local `<Transform>` 收敛一个 component-only surface。
21. Stage 10 真实 `architecture.zh-CN.md` strict native standalone 已重新验收并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage10-architecture-real/`；报告继续证明本地 Slidev fork、52 个 skill references、native standalone、3 个 Mermaid fence byte-stable、`changedFenceIndexes = []`、0 hard overflow 与 0 low effective font。该切片没有引入任何 Mermaid 源图拆分或改写。
22. Stage 11 Mermaid source boundary 已补成更硬的回归契约并通过真实验收：mixed Mermaid/prose 只允许迁移非图正文；带 inline metadata 的 Mermaid fence 在 patcher 与 source-preparation LLM 候选校验中都必须保持 opener/metadata/body/closer byte-stable。真实 `architecture.zh-CN.md` strict native standalone 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage11-mermaid-source-boundary/`，报告继续保持 `mermaidSourcePreservation.passed = true` 与 `changedFenceIndexes = []`。这个切片不是新布局算法，而是防止后续把“非图内容迁移”误升级成“拆 Mermaid 原图”的安全栏。
23. Stage 12 mixed component/prose 清晰边界已收敛并通过真实验收：`mixed-component-prose-stress` 证明一个完整 component surface 与 Markdown prose/list 可以先拆成 presentation surfaces，组件页再走 measured local `<Transform>`；真实 `architecture.zh-CN.md` strict native standalone 归档到 `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`。
24. Stage 13 unsupported component boundary fail-transparent 已落地：`unsupported-component-table-boundary-stress` 是 expected-failure fixture，显式运行时 verifier 必须 `ok = false`，但 standalone、浏览器加载、Git 可见性、Mermaid source-preservation 都必须通过；blocked reason 必须说明 mixed component + primary Markdown 不能用整页 zoom 修。默认成功 fixture suite 仍排除 expected-failure fixture，归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`。
25. Stage 13 真实 `architecture.zh-CN.md` strict native standalone 已重新验收并归档到 `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`；报告继续证明本地 Slidev fork、52 个 skill references、native standalone、3 个 Mermaid fence byte-stable、`changedFenceIndexes = []`、0 hard overflow 与 0 low effective font。该切片没有引入任何 Mermaid 源图拆分或改写。

建议下一批实现顺序：

1. 继续把更多真实失败样本沉淀为 full-deck/export fixtures，尤其是多个不稳定 owner、component surface 内混入 fence/image、custom layout 需要分页但没有明确 surface boundary 的 unsupported layout；Stage 13 只证明 component/table 会 fail transparent、component/directive 会阻断整页 zoom，不代表任意 Vue component tree 都可安全 Transform；
2. 对 Mermaid 继续只做源图保持的 fit/zoom/Transform 与人工复核边界；自动路径只允许移动非 Mermaid 内容，不允许拆原图、改 body、改 opener metadata 或重排 fence；
3. 继续增强更多语言专用 splitter；Python/Rust 当前是 parser-light，不是完整 AST；
4. 评估是否把 source-preserved Mermaid fit review、mixed Mermaid/prose 仅移动非图内容的 guardrail、browser-check 与“不要拆用户原图”抽成通用 Slidev skill PR 建议。

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
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm test -- --runInBand src/tests/slidevRenderedMeasurement.test.ts
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm run verify:slidev-layout-fixtures -- --timeout-ms 300000
npm run build
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
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
