# Notemd Diagram Rendering Platform Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Notemd 从“LLM 直接生成 Mermaid 文本并事后修补”的单一路径，升级为“图形意图识别 + 中间规格 + 专门渲染 + 多格式输出”的可扩展图形平台，在 Obsidian 内稳定支持更多图像与图表类型。

**Architecture:** 采用四层架构：`Intent Plane` 负责识别笔记更适合的图形表达；`Spec Plane` 让 LLM 输出结构化 `DiagramSpec` 而不是直接输出语法；`Adapter Plane` 负责不同目标格式的生成、校验与最小修复；`Rendering Plane` 提供专门渲染宿主、缓存、预览、主题和导出能力。该方案有意避免把 `markdown-viewer` 整体照抄进 Notemd，而是吸收其 registry/host/cache 思想，并按 Obsidian 插件约束做渐进式落地。

**Tech Stack:** TypeScript, Obsidian Plugin API, Mermaid, Jest, ESLint, esbuild, iframe-based render host, JSON Canvas, Vega-Lite, SVG/HTML preview pipeline

---

## Execution Status (2026-04-14)

这份 roadmap 现在不再只是“待实现计划”。`main` 已经落地了 diagram domain model、spec-first 生成、Mermaid subtype adapters、renderer registry/service、JSON Canvas、Vega-Lite、preview/export、theme/i18n 等核心能力，但文档状态没有及时跟上，容易导致两种误判：

- 把已经存在的能力当成未开始，重复设计
- 把仍处于 experimental / partial 状态的边界当成已完成能力，对后续发布和架构判断形成误导

本次更新的目标不是改写方向，而是把 roadmap 变成“真实进度文档 + 下一批推进控制器”。

Phase-2 requirements snapshot:

- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md`

### Current Snapshot

| Task | Status | Current reality |
|---|---|---|
| Task 0 | Delivered with explicit limits | `src/rendering/webview/*` 与 `src/rendering/host/iframeRenderHost.ts` 已落地，继续采用内联 `srcdoc` 方案；`scripts/audit-render-host-bundle.js`、release workflow 与单测已把“render host 必须由 `main.js` 自包含携带”的 smoke gate 固化下来，但 `esbuild.config.mjs` 仍是单入口，真正的 heavier-runtime isolation 仍未完成。 |
| Task 1 | Delivered | `DiagramIntent`、`DiagramSpec`、validator、planner 和意图推断规则均已进入主线，并有单测覆盖。 |
| Task 2 | Partial | spec-first prompt 与 service pipeline 已落地，但命令层仍保留“legacy Mermaid command + separate experimental commands”的双入口状态，尚未完成真正的 command architecture 收口。 |
| Task 3 | Partial | Mermaid subtype adapters 与 `mermaid.parse` 校验已落地，但 `src/mermaidProcessor.ts` 仍承担大量 legacy fixer 责任，adapter-driven fixer 拆分未完成。 |
| Task 4 | Delivered | renderer registry/service、cache、inline host、iframe preview session 与统一 preview modal 已落地。 |
| Task 5 | Delivered | `.canvas` 输出、基础 deterministic layout、保存与预览链路已落地。 |
| Task 6 | Partial | Vega-Lite controlled templates、planner chart defaults、preview/export 已落地，但“通过 iframe host 隔离渲染依赖”这一目标仍未完全成立。 |
| Task 7 | Delivered with explicit limits | 主题、locale、SVG/PNG/source export 和文档矩阵已对齐当前代码；HTML 目标仍只承诺 iframe fallback preview 与 raw source save。 |
| Task 8 | Deferred by design | 高级 DSL / renderer 评估仍应继续推迟。 |

### Evidence Index

- Spec-first domain layer:
  - `src/diagram/types.ts`
  - `src/diagram/intent.ts`
  - `src/diagram/spec.ts`
  - `src/diagram/planner.ts`
  - `src/diagram/diagramGenerationService.ts`
- Mermaid subtype adapters:
  - `src/diagram/adapters/mermaid/mindmapAdapter.ts`
  - `src/diagram/adapters/mermaid/flowchartAdapter.ts`
  - `src/diagram/adapters/mermaid/sequenceAdapter.ts`
  - `src/diagram/adapters/mermaid/classAdapter.ts`
  - `src/diagram/adapters/mermaid/erAdapter.ts`
  - `src/diagram/adapters/mermaid/stateAdapter.ts`
  - `src/diagram/adapters/mermaid/validator.ts`
- Rendering platform:
  - `src/rendering/rendererRegistry.ts`
  - `src/rendering/rendererService.ts`
  - `src/rendering/cache/renderCache.ts`
  - `src/rendering/host/inlineRenderHost.ts`
  - `src/rendering/host/iframeRenderHost.ts`
  - `scripts/audit-render-host-bundle.js`
  - `.github/workflows/release.yml`
  - `src/ui/DiagramPreviewModal.ts`
- Non-Mermaid targets:
  - `src/diagram/adapters/canvas/canvasAdapter.ts`
  - `src/diagram/adapters/vega/vegaLiteAdapter.ts`
  - `src/rendering/renderers/jsonCanvasRenderer.ts`
  - `src/rendering/renderers/vegaLiteRenderer.ts`
  - `src/rendering/renderers/htmlRenderer.ts`
- Docs/tests that already enforce current behavior:
  - `src/tests/diagramGenerationService.test.ts`
  - `src/tests/diagramGenerationFallbacks.test.ts`
  - `src/tests/canvasAdapter.test.ts`
  - `src/tests/vegaLiteAdapter.test.ts`
  - `src/tests/rendererService.test.ts`
  - `src/tests/diagramPreviewModal.test.ts`
  - `src/tests/previewExport.test.ts`
  - `src/tests/diagramDocsContract.test.ts`
  - `src/tests/renderHostBundleAuditScript.test.ts`

## Why This Plan Exists

更新说明（2026-04-14）：

这部分保留了最初推动 diagram platform 改造的根因判断，但现状已经不是“这些能力完全不存在”，而是“核心能力已落地，剩余短板集中在 legacy 路径、命令收口和 runtime boundary”。下面的判断应理解为当前仍然存在的架构压力，而不是对 `main` 现状的全盘否定。

当前实现的瓶颈不是“支持的图表类型太少”，而是职责边界错误：

- `src/main.ts` 仍然同时承载 legacy Mermaid 链路、experimental diagram 链路、命令注册和 UI 编排，diagram domain 已经存在，但尚未真正从插件入口里抽离。
- `src/promptUtils.ts` 中的 legacy Mermaid prompt 仍把输出强制绑死在 `mindmap`，虽然 spec-first 路径已经绕开这一问题，但命令层尚未完全收口到新路径。
- `src/mermaidProcessor.ts` 已经演变成巨型修补器，说明系统在用后处理复杂度弥补 prompt 和建模不足。
- 当前构建方式仍只有单一 `main.js` 输出，`esbuild.config.mjs` 还没有为后续更重的 iframe/webview 资产、worker 或渲染静态资源建立明确打包策略。

如果继续沿着“多写几个 prompt + 多加几条 regex 修复 + 再支持几个新语法”的方向推进，复杂度会线性增长，稳定性会指数下降。

---

## Product North Star

Notemd 的图形能力应当服务于三类核心场景，而不是追求“支持格式列表越长越好”：

1. 结构理解
将长文、研究笔记、技术方案转成适合浏览和回顾的结构图。

2. 知识组织
把概念、关联、因果、层级和空间组织关系落到适合 Obsidian 工作流的可编辑载体。

3. 数据表达
当笔记中包含指标、时间序列、对比、分布时，生成图表而不是勉强转成 Mermaid。

对应到能力上，Notemd 需要的是“格式路由能力”，不是“单一 Mermaid 能力堆砌”。

---

## Current Constraints In Repo

### Code Reality

- `src/main.ts`
  当前承载命令注册、业务编排、legacy Mermaid 流程和 experimental diagram 流程，文件已过大，不适合作为 diagram 平台的长期 orchestration 入口。
- `src/fileUtils.ts`
  同时负责文件保存、Mermaid 修复、批处理和错误文件移动，职责已经交叉。
- `src/mermaidProcessor.ts`
  聚集了 Mermaid 检测、修复、语法清洗、深度 debug 等大量逻辑，应被拆分为 adapter 内的 validator/fixer。
- `src/promptUtils.ts`
  legacy prompt 仍直接绑定输出目标格式；spec-first prompt 已存在，但两套链路仍并行存在。

### Build Reality

- `esbuild.config.mjs`
  仅打包 `src/main.ts -> main.js`，没有静态资源复制、iframe 页面生成或多入口策略。
- `manifest.json`
  当前为通用移动/桌面插件，不应引入只在桌面可运行的图形能力而不设降级路径。

### Testing Reality

- Jest 单测体系已经存在，适合先做 domain model、adapter、service 级测试。
- 当前缺失的不是测试框架，而是可测试的边界。现状里 Mermaid 生成、修复、保存耦合过深，导致只能测结果，难测职责。

---

## Architecture Decision Summary

### Decision 1: 先建 `DiagramSpec`，停止让 LLM 直接输出最终渲染语法

推荐引入统一中间表示：

- `DiagramIntent`
- `DiagramSpec`
- `RenderTarget`
- `RenderArtifact`

`DiagramSpec` 至少覆盖：

- title
- summary
- nodes
- edges
- sections
- callouts
- dataSeries
- layoutHints
- sourceLanguage
- outputLanguage
- evidenceRefs

理由：

- 可以把“内容理解”和“目标格式语法”解耦。
- 可以为 Mermaid、Canvas、Vega-Lite 复用同一份语义输入。
- 可以把校验前移到结构层，而不是等字符串生成后再补洞。

### Decision 2: 先做 `RendererRegistry + RenderHost`，不要直接堆第三方引擎

推荐最小平台能力：

- `RendererRegistry`
- `RendererService`
- `RenderHost` interface
- `InlineRenderHost` 或 `IframeRenderHost`
- `RenderCache`

理由：

- 没有统一宿主时，多格式支持只会沦为“生成不同代码块文本”，不能预览、不能导出、不能缓存、不能统一主题。
- `markdown-viewer-extension` 真正值得借鉴的是 renderer registry、host abstraction、theme 和 cache，而不是“支持十几种格式”这件事本身。

### Decision 3: 第一波扩展目标不是 PlantUML，而是 Mermaid subtype + JSON Canvas + Vega-Lite

优先级如下：

| Priority | Target | Why | Notes |
|---|---|---|---|
| P0 | Mermaid 多子类型 | 用户已有认知和现有依赖都在这里；是最低迁移成本的收益点 | 先把 `mindmap` 独占问题解决 |
| P1 | JSON Canvas | Obsidian 原生资产格式；最契合知识图谱和空间整理 | 不需要额外重型渲染运行时 |
| P1 | Vega-Lite | 数值和对比类笔记的正确表达介质 | 需要专门 chart adapter 和预览 |
| P2 | HTML/SVG infographic | 适合摘要卡片、KPI、路标图 | 价值高，但需要主题和导出能力支撑 |
| P3 | PlantUML / Graphviz / Draw.io | 语法面大、依赖重、维护成本高 | 延后到渲染平台成熟后再评估 |

### Decision 4: 渲染宿主优先走 `iframe host`，但以渐进式打包为前提

建议路线：

- 第一阶段允许 `InlineRenderHost` 只服务 Mermaid 和本地 SVG 预览。
- 同时定义统一 `RenderHost` 接口，避免未来重构调用方。
- 第二阶段再上 `IframeRenderHost` 承担 Vega-Lite、HTML/SVG 信息卡和更重的前端渲染逻辑。

理由：

- 当前构建体系不适合一上来就做完整 worker/offscreen 体系。
- `iframe host` 足以隔离大部分前端渲染依赖，且更贴近 Obsidian 插件的现实约束。
- 不建议一步到位复制 `markdown-viewer` 的多宿主复杂度。Notemd 目前没有那个必要，也没有那个代码边界。

---

## Target Module Layout

建议新增或拆分出如下边界：

- `src/diagram/types.ts`
- `src/diagram/intent.ts`
- `src/diagram/spec.ts`
- `src/diagram/planner.ts`
- `src/diagram/prompts/diagramSpecPrompt.ts`
- `src/diagram/validators/specValidator.ts`
- `src/diagram/adapters/mermaid/base.ts`
- `src/diagram/adapters/mermaid/mindmapAdapter.ts`
- `src/diagram/adapters/mermaid/flowchartAdapter.ts`
- `src/diagram/adapters/mermaid/sequenceAdapter.ts`
- `src/diagram/adapters/mermaid/erAdapter.ts`
- `src/diagram/adapters/mermaid/validator.ts`
- `src/diagram/adapters/canvas/canvasAdapter.ts`
- `src/diagram/adapters/vega/vegaLiteAdapter.ts`
- `src/rendering/types.ts`
- `src/rendering/rendererRegistry.ts`
- `src/rendering/rendererService.ts`
- `src/rendering/cache/renderCache.ts`
- `src/rendering/host/renderHost.ts`
- `src/rendering/host/inlineRenderHost.ts`
- `src/rendering/host/iframeRenderHost.ts`
- `src/rendering/webview/index.html`
- `src/rendering/webview/bootstrap.ts`
- `src/rendering/webview/renderFrame.ts`
- `src/ui/DiagramPreviewModal.ts`
- `src/ui/components/diagramPreviewToolbar.ts`

建议逐步降责的旧文件：

- `src/main.ts`
- `src/fileUtils.ts`
- `src/mermaidProcessor.ts`
- `src/promptUtils.ts`

---

## Execution Plan

### Task 0: Build And Packaging Substrate For Dedicated Rendering

**Files:**
- Existing runtime host: `src/rendering/webview/contract.ts`
- Existing runtime host: `src/rendering/webview/page.ts`
- Existing runtime host: `src/rendering/webview/renderFrame.ts`
- Create: `scripts/audit-render-host-bundle.js`
- Modify: `package.json`
- Modify: `.github/workflows/release.yml`
- Test: `src/tests/renderHostBundleAuditScript.test.ts`

**Status:** Delivered with explicit limits

当前已经通过 `src/rendering/webview/contract.ts`、`src/rendering/webview/page.ts`、`src/rendering/webview/renderFrame.ts` 和 `src/rendering/host/iframeRenderHost.ts` 建立了内联 `srcdoc` preview host。也就是说，“渲染页面如何被插件携带”这个问题仍然通过主 bundle 内嵌 HTML 的方式解决，而不是通过额外静态资产复制解决。

本批工作补上了真正缺失的 smoke gate：`scripts/audit-render-host-bundle.js` 会直接审计构建后的 `main.js`，要求 bundle 中仍保留 `htmlSrcdoc`、`Notemd Render Host`、`notemd-render-shell` 和 `notemd-html-preview-theme-shim` 等关键标记，并拒绝出现 `rendering-webview/index.html` 之类的外部 render-host 资产依赖；`.github/workflows/release.yml` 也已把该审计纳入 release gate。

剩余限制依然存在：`esbuild.config.mjs` 仍是单入口，当前 smoke gate 证明的是“现有 srcdoc host 自包含不退化”，不是“已经具备真正独立 heavier runtime bundle 的打包与安装策略”。

- [x] 明确渲染资产目录约定，避免后续把 HTML、JS、CSS 散落到插件根目录。
- [x] 为生产构建固化 render host 的 bundle 携带方式，保证预览页面继续由 `main.js` 自包含发布。
- [x] 建立最小 smoke 测试，验证构建产物中包含渲染页面和必要脚本。

**Decisions:**

- Obsidian 标准社区插件 release 资产模型只保证 `main.js`、`manifest.json`、`styles.css`，因此不要把运行时正确性建立在“额外目录会随 release 安装下来”的假设上。
- 第一阶段优先使用 `iframe srcdoc` 或其他内联页面契约，把预览宿主做成 `main.js` 可携带的自包含能力，而不是依赖外部 `rendering-webview/` 目录。
- 如果后续确实需要更重的独立 runtime bundle，必须同时设计 release 打包与安装期落盘策略，而不是只在本地构建成功。
- 现阶段的 smoke gate 应当继续锁定“自包含 srcdoc host”这一约束；任何转向外部 host 资产的实现，都必须同步修改 release 资产模型、审计脚本和安装路径设计。

**Exit Criteria:**

- 构建产物可稳定携带渲染页面，并有自动审计阻止退化为未声明的外部 host 资产依赖。
- 不影响当前插件加载。

### Task 1: Introduce Diagram Domain Model And Intent Router

**Files:**
- Create: `src/diagram/types.ts`
- Create: `src/diagram/intent.ts`
- Create: `src/diagram/spec.ts`
- Create: `src/diagram/planner.ts`
- Modify: `src/types.ts`
- Test: `src/tests/diagramIntent.test.ts`
- Test: `src/tests/diagramSpecValidation.test.ts`

**Status:** Delivered

`src/diagram/types.ts`、`src/diagram/spec.ts`、`src/diagram/intent.ts` 与 `src/diagram/planner.ts` 已经把 diagram intent、spec、validator 和 route planner 变成真实边界。当前主要问题已不再是“有没有 domain model”，而是后续所有命令是否都持续复用这套模型。

- [x] 定义 `DiagramIntent`，覆盖至少 `mindmap`、`flowchart`、`sequence`、`classDiagram`、`erDiagram`、`stateDiagram`、`canvasMap`、`dataChart`。
- [x] 定义 `DiagramSpec` 的最小结构和 validator。
- [x] 把“从笔记内容判断应输出哪类图”的逻辑从 Mermaid prompt 中剥离出来。

**Decisions:**

- Intent router 先用规则 + prompt hint 的混合模式，不直接做模型级自动分类器。
- 当置信度不足时，默认回退到 `mindmap` 或在 UI 中让用户选择目标图种。

**Exit Criteria:**

- 新逻辑可以在不渲染的情况下单测验证“笔记 -> 意图”的判定。
- Mermaid prompt 不再硬编码为唯一图种。

### Task 2: Replace Raw Mermaid Prompting With Spec-First Generation

**Files:**
- Create: `src/diagram/prompts/diagramSpecPrompt.ts`
- Modify: `src/promptUtils.ts`
- Modify: `src/main.ts`
- Test: `src/tests/diagramPromptAssembly.test.ts`
- Test: `src/tests/diagramPlannerFlow.test.ts`

**Status:** Partial

`src/diagram/prompts/diagramSpecPrompt.ts`、`src/diagram/diagramSpecResponseParser.ts` 和 `src/diagram/diagramGenerationService.ts` 已经落地了 spec-first prompt 与 `spec -> validate -> render` 流水线。真正未完成的是命令层收口：当前仍是 legacy Mermaid 命令、experimental generate 命令、experimental preview 命令并存，而不是统一 diagram command architecture。

- [x] 新增“让 LLM 输出 `DiagramSpec` JSON”的 prompt。
- [ ] 让 `summarizeToMermaidCommand` 演进为 `generateDiagramCommand`，但保留现有命令名做兼容入口。
- [x] 在服务层引入“生成 spec -> 验证 spec -> 交给 adapter”的流水线。

**Decisions:**

- 保持现有 Mermaid 命令入口可用，避免一次性破坏用户工作流。
- 初期允许 UI 仍显示 “Summarise as Mermaid diagram”，但内部走 diagram pipeline；后续再扩展为统一 diagram action。

**Exit Criteria:**

- 生成链路不再依赖 LLM 直接吐最终 Mermaid。
- 新的 pipeline 可以在无渲染器参与时产生可复用 spec。

### Task 3: Mermaid Adapter V2 And Decomposition Of `mermaidProcessor.ts`

**Files:**
- Create: `src/diagram/adapters/mermaid/base.ts`
- Create: `src/diagram/adapters/mermaid/mindmapAdapter.ts`
- Create: `src/diagram/adapters/mermaid/flowchartAdapter.ts`
- Create: `src/diagram/adapters/mermaid/sequenceAdapter.ts`
- Create: `src/diagram/adapters/mermaid/erAdapter.ts`
- Create: `src/diagram/adapters/mermaid/validator.ts`
- Modify: `src/mermaidProcessor.ts`
- Test: `src/tests/mermaidMindmapAdapter.test.ts`
- Test: `src/tests/mermaidFlowchartAdapter.test.ts`
- Test: `src/tests/mermaidValidator.test.ts`

**Status:** Partial

Mermaid subtype adapters 已经覆盖 `mindmap`、`flowchart`、`sequenceDiagram`、`classDiagram`、`erDiagram`、`stateDiagram-v2`，并且 renderer 侧会先走 `mermaid.parse` 校验。这一批工作的价值已经兑现。

但 roadmap 原本更激进的目标还没完成：`src/mermaidProcessor.ts` 仍然是大型 legacy fixer，adapter-specific fix 规则没有真正成为主路径。当前现实是“adapter-driven emit + validate 已经存在，fixer decomposition 仍未完成”。

- [ ] 将 Mermaid 修复逻辑从“全局文本修补”拆成“按图种 adapter 的 emit + validate + fix”。
- [ ] 把 `mermaidProcessor.ts` 中通用能力下沉为有限工具函数，把图种特定规则挪进对应 adapter。
- [ ] 保留批量修复能力，但只作为 legacy fallback，不再作为主生成路径的必要步骤。

**Decisions:**

- 只保留最小修复策略，例如 fence 修复、少量保底字符清理。
- 删除“把所有括号删除”这类全局粗暴规则，避免损伤合法 Mermaid 语法。

**Exit Criteria:**

- 至少支持 `mindmap`、`flowchart`、`sequenceDiagram`、`erDiagram` 四类 Mermaid 输出。
- 新生成结果对 `mermaid.parse` 的通过率显著提升。

### Task 4: Rendering Platform Skeleton With Registry, Host, Cache And Preview

**Files:**
- Create: `src/rendering/types.ts`
- Create: `src/rendering/rendererRegistry.ts`
- Create: `src/rendering/rendererService.ts`
- Create: `src/rendering/cache/renderCache.ts`
- Create: `src/rendering/host/renderHost.ts`
- Create: `src/rendering/host/inlineRenderHost.ts`
- Create: `src/ui/DiagramPreviewModal.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Test: `src/tests/rendererRegistry.test.ts`
- Test: `src/tests/rendererService.test.ts`
- Test: `src/tests/diagramPreviewModal.test.ts`

**Status:** Delivered

`RendererRegistry`、`RendererService`、`RenderCache`、`InlineRenderHost`、`IframeRenderHost` 与 `DiagramPreviewModal` 已经把 preview/render/export 的最小平台骨架拉起来。缓存 key 也已经纳入 `spec + target + theme`。

- [x] 先建立平台接口，再逐步接入真实重型 renderer。
- [x] 为当前 Mermaid 输出提供统一预览入口，而不是把预览逻辑散在业务命令里。
- [x] 增加简单缓存，至少按 `spec + target + theme` 做 cache key。

**Decisions:**

- 第一阶段的预览只要求“可打开、可刷新、可复制源码、可保存结果”，不追求导出全家桶。
- 缓存策略先以内存或 vault 内轻量缓存为主，不急于做复杂持久化索引。

**Exit Criteria:**

- 调用方通过 `RendererService` 访问渲染能力，而不是直接耦合 Mermaid API。
- Mermaid 预览已进入统一平台路径。

### Task 5: Add JSON Canvas As First Non-Mermaid Output

**Files:**
- Create: `src/diagram/adapters/canvas/canvasAdapter.ts`
- Create: `src/diagram/adapters/canvas/layout.ts`
- Modify: `src/fileUtils.ts`
- Modify: `src/main.ts`
- Test: `src/tests/canvasAdapter.test.ts`
- Test: `src/tests/canvasLayout.test.ts`

**Status:** Delivered for baseline scope

`.canvas` 输出、基础 deterministic layout、保存和 preview/export 支持都已落地。当前实现仍然是初始自动布局，不提供复杂回写语义，但这正符合本任务原始 scope。

- [x] 增加 `.canvas` 目标格式输出。
- [x] 先支持知识图、概念图、研究梳理和任务拆解场景，不追求完整手工编辑语义。
- [x] 支持从 `DiagramSpec` 映射到 node/edge/position 的基础布局。

**Decisions:**

- 初始布局可采用 deterministic auto-layout，不必一开始支持复杂拖拽回写。
- Canvas 是原生资产，应优先打通保存、打开和 vault 关联流程。

**Exit Criteria:**

- 用户可以从同一条 diagram pipeline 输出 `.canvas` 文件。
- 输出的 canvas 在 Obsidian 中可直接打开。

### Task 6: Add Vega-Lite For Numeric And Comparative Notes

**Files:**
- Create: `src/diagram/adapters/vega/vegaLiteAdapter.ts`
- Create: `src/diagram/adapters/vega/schema.ts`
- Create: `src/rendering/host/iframeRenderHost.ts`
- Modify: `src/rendering/webview/bootstrap.ts`
- Modify: `src/rendering/webview/renderFrame.ts`
- Test: `src/tests/vegaLiteAdapter.test.ts`
- Test: `src/tests/iframeRenderHost.test.ts`

**Status:** Partial

`dataChart` intent、controlled Vega-Lite templates、planner chart defaults、preview/export 和 HTML fallback 都已落地，说明“数值与对比类笔记不必再被 Mermaid 强塞”这个产品方向已经成立。

真正还没完成的是 runtime boundary：当前 `IframeRenderHost` 更多承担 preview session / `srcdoc` 外壳职责，Vega-Lite SVG 渲染仍通过 `src/rendering/preview/vegaLitePreview.ts` 在插件 runtime 内动态加载 `vega-lite` 与 `vega`。所以“Vega-Lite 已支持”成立，但“已通过 iframe host 隔离渲染依赖”还不能算完成。

- [x] 让包含明确数据点、序列、对比、占比的笔记走 `dataChart` intent。
- [ ] 通过 iframe host 隔离 Vega-Lite 渲染依赖。
- [x] 先支持 bar、line、area、scatter、pie、table-like summary 六类高价值图表模板。

**Decisions:**

- 不支持“模型自由发挥写任意 Vega 规范”；只支持受控子集和模板化 schema。
- 图表生成必须要求明确数据来源，避免编造数值。

**Exit Criteria:**

- Vega-Lite 成为正式受支持的非 Mermaid 可预览输出。
- 渲染失败可回退到 spec/source JSON，而不是直接吞错。

### Task 7: Theme, Export And Release Hardening

**Files:**
- Modify: `src/rendering/rendererService.ts`
- Modify: `src/ui/DiagramPreviewModal.ts`
- Modify: `styles.css`
- Modify: `README.md`
- Modify: `docs/releases/*.md`
- Test: `src/tests/renderThemeConfig.test.ts`
- Test: `src/tests/renderExportFlow.test.ts`

**Status:** Delivered with explicit support limits

当前代码已经把 preview/export 的主题解析、UI locale 文案、SVG/PNG/source 导出与 README/release docs 对齐。需要强调的是：这不是“所有 target 一视同仁地支持所有导出”，而是“支持矩阵已被显式化”。HTML 目标当前只承诺 iframe fallback preview 和 raw source save，这一点应继续保持文档与实现一致。

- [x] 将 UI 语言、Obsidian theme、图表主题和导出选项对齐。
- [x] 补齐 PNG、SVG、source JSON/canvas 导出。
- [x] 更新文档，明确支持图种、限制、降级策略和故障排查。

**Decisions:**

- 先支持导出最稳定的格式组合，避免一开始承诺 PDF、DOCX、批量快照等高维护能力。
- 文档里要明确哪些输出是“生成文件”，哪些是“可预览渲染结果”。

**Exit Criteria:**

- 用户可以预览、复制源码、导出至少一种图像结果。
- 语言、主题和图种支持矩阵文档化。

### Task 8: Deferred Advanced Engines Evaluation

**Files:**
- Create later if approved: `src/diagram/adapters/plantuml/*`
- Create later if approved: `src/diagram/adapters/graphviz/*`
- Test later: `src/tests/plantumlAdapter.test.ts`

**Status:** Correctly deferred

这一段目前没有落后，反而是最需要坚持的边界。现状的真正短板不是格式不够多，而是 build/runtime isolation、command 收口、legacy Mermaid 退场边界还不够硬。如果现在引入 PlantUML、Graphviz 或 Draw.io，只会把未完成的平台债扩散到更多 DSL 上。

- [ ] 仅在前述平台完成后评估 PlantUML、Graphviz、Draw.io。
- [ ] 先做需求证据收集，再决定是否进入实现。

**Decision Gate:**

- 只有当以下条件同时成立时才进入：
  - Renderer platform 已稳定。
  - 现有 Mermaid/Canvas/Vega-Lite 已覆盖大部分需求。
  - 用户有明确场景需要更专业 DSL。
  - 有清晰的渲染与分发策略，而不是“先生成代码再说”。

---

## Short, Mid, Long Term Direction Control

### Short Term

目标周期：紧随当前 `main` 的下一批 diagram-platform 收口工作

重点：

- 维持 Task 0 已交付的 render-host smoke gate，不允许后续 runtime 迭代绕过 release/installation 约束
- 完成 Task 2 中真正缺失的 command architecture 收口，减少 legacy 命令与 experimental 命令长期双轨
- 完成 Task 3 中真正缺失的 `mermaidProcessor.ts` 降责和 sunset boundary
- 明确 Task 6 中 Vega-Lite runtime 应该继续留在 plugin runtime，还是转入真正的 bundled host 资产

成功标志：

- 下一批工作不再误把“加更多 renderer”当成主问题。
- best-fit / legacy-mermaid 的边界更清晰，experimental 标签不再掩盖真实状态。
- `src/main.ts` 不继续成为 diagram orchestration 的永久扩张点。

### Mid Term

目标周期：`1.9.x`

重点：

- 将 JSON Canvas 与 Vega-Lite 从“功能已存在”推进到“默认可理解、稳定可维护”的产品面
- 落定 heavier renderer runtime 的打包与运行策略
- 评估 HTML/SVG infographic 是否应作为正式 target，而不是仅做 fallback
- 把 docs、tests、release notes 和 support matrix 绑定到同一套 truth source

成功标志：

- experimental diagram 功能不再依赖过多 maintainer-only 上下文才能理解。
- 非 Mermaid 输出不只是“能生成”，而是具备可解释的稳定边界和故障模型。
- 文档对现状与限制的描述不再滞后于代码。

### Long Term

目标周期：`2.0+`

重点：

- 在 host/runtime boundary 完整成立后，再评估 richer infographic targets
- 在 support matrix 和 release discipline 成熟后，再评估 PlantUML、Graphviz 等重型 DSL
- 评估统一 diagram workspace、批量渲染和资产索引

成功标志：

- 图形平台成为独立能力域，而不是附属于某个单一命令。
- 具备明确的 target support matrix、theme contract、render failure model 和 release discipline。

---

## Key Risks And How To Control Them

### Risk: 过早引入太多图种，平台没有抽象先失控

控制策略：

- 先实现平台接口和前两类非 Mermaid 目标。
- 每新增一个目标格式，都必须复用 `DiagramSpec` 和 `RendererService`。

### Risk: 把 `markdown-viewer-extension` 整体搬进来，复杂度超出 Notemd 当前承载能力

控制策略：

- 只借鉴其 registry/host/cache 设计思想。
- 不照搬 offscreen、多端桥接、DOCX 导出和全部 renderer 集。

### Risk: Vega-Lite 或 HTML heavier runtime 演进再次偷偷引入未声明的外部 host 资产依赖

控制策略：

- 保持第一阶段 host 自包含在 `main.js` 内，并用 bundle smoke gate 持续审计。
- 如果必须引入独立 host 资产，先定义 release 打包、安装落盘和 capability fallback，再改实现。

### Risk: 生成 spec 时模型臆造数据

控制策略：

- 对 `dataChart` 强制要求 evidence/data extraction 步骤。
- 没有明确数值时，只允许生成结构图或文本摘要卡，不允许编造图表。

### Risk: 继续保留过多 legacy fallback，最终双系统长期共存

控制策略：

- 给旧 Mermaid 修补链设置 sunset 边界。
- 每完成一个 adapter，就减少一部分 legacy fixer 责任，而不是无限共存。

---

## Anti-Goals

以下方向当前不应进入主线：

- 直接支持 raster AI 绘图或图片生成
- 一开始就做 Draw.io round-trip 编辑
- 在没有 renderer runtime 的前提下承诺“支持很多图表类型”
- 为 PlantUML/Graphviz 引入需要额外服务端或复杂 license 风险的路径
- 在 `src/main.ts` 中继续堆叠新的图形业务逻辑

---

## Recommended Next Batch

如果现在继续推进，建议只做“收口批次”，不要回到“先加更多 target 再说”的路径：

1. 完成 Task 2 剩余部分：diagram command architecture 收口
2. 完成 Task 3 剩余部分：`mermaidProcessor.ts` 降责与 legacy fixer sunset boundary
3. 完成 Task 6 剩余部分：决定 Vega-Lite heavier runtime 的真正宿主边界
4. 继续维护 Task 7：把 support matrix 与 release/docs contract 绑定得更硬
5. 把 Task 0 smoke gate 当成回归边界，后续若引入独立 host 资产必须先升级 release/install 设计

原因很直接：

- 当前的关键断点已经不是“有没有 DiagramSpec/renderer registry”，而是“这些能力是否已经被正确 productize”。
- 如果这一断点没完成，后续任何新 renderer 都会继续叠在未完成的 runtime/command/legacy 边界上，返工成本只会更高。

---

## Verification Gate For Each Phase

每个阶段都应至少具备以下验证：

- `npm run build`
- 目标单元测试通过
- `npm run audit:render-host`
- 当前 Mermaid 回归集通过
- 新 renderer 的失败场景有明确错误面
- 产物路径、预览入口和导出结果可人工验证

对于渲染层新增功能，补充要求：

- 至少一条桌面端预览验证记录
- 至少一条移动端或降级策略验证记录
- 文档同步更新支持矩阵和限制说明

---

## Final Recommendation

最佳推进方向不是“继续强化 Mermaid 修补”，也不是“直接上十几个图种”，而是：

先把已经存在的 diagram platform productize，再决定它应该再承载哪些 renderer。

如果要用一句话概括接下来的技术策略，就是：

`spec-first, adapter-driven, productized boundaries before expansion`
