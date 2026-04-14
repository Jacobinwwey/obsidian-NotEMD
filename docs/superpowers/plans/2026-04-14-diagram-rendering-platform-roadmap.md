# Notemd Diagram Rendering Platform Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Notemd 从“LLM 直接生成 Mermaid 文本并事后修补”的单一路径，升级为“图形意图识别 + 中间规格 + 专门渲染 + 多格式输出”的可扩展图形平台，在 Obsidian 内稳定支持更多图像与图表类型。

**Architecture:** 采用四层架构：`Intent Plane` 负责识别笔记更适合的图形表达；`Spec Plane` 让 LLM 输出结构化 `DiagramSpec` 而不是直接输出语法；`Adapter Plane` 负责不同目标格式的生成、校验与最小修复；`Rendering Plane` 提供专门渲染宿主、缓存、预览、主题和导出能力。该方案有意避免把 `markdown-viewer` 整体照抄进 Notemd，而是吸收其 registry/host/cache 思想，并按 Obsidian 插件约束做渐进式落地。

**Tech Stack:** TypeScript, Obsidian Plugin API, Mermaid, Jest, ESLint, esbuild, iframe-based render host, JSON Canvas, Vega-Lite, SVG/HTML preview pipeline

---

## Why This Plan Exists

当前实现的瓶颈不是“支持的图表类型太少”，而是职责边界错误：

- `src/main.ts` 中的 Mermaid 生成链路本质上是 `prompt -> LLM -> save file -> optional fix`，没有图形领域层，也没有渲染层。
- `src/promptUtils.ts` 的 Mermaid prompt 把输出强制绑死在 `mindmap`，导致流程图、时序图、ER 图、类图等合法需求被迫塞进同一条错误的生成路径。
- `src/mermaidProcessor.ts` 已经演变成巨型修补器，说明系统在用后处理复杂度弥补 prompt 和建模不足。
- 当前构建方式只有单一 `main.js` 输出，`esbuild.config.mjs` 还没有为 iframe/webview 资产、worker 或渲染静态资源做任何打包策略。

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
  当前承载命令注册、业务编排、任务执行和 Mermaid 生成入口，文件已过大，不适合作为后续渲染平台入口。
- `src/fileUtils.ts`
  同时负责文件保存、Mermaid 修复、批处理和错误文件移动，职责已经交叉。
- `src/mermaidProcessor.ts`
  聚集了 Mermaid 检测、修复、语法清洗、深度 debug 等大量逻辑，应被拆分为 adapter 内的 validator/fixer。
- `src/promptUtils.ts`
  直接用 prompt 绑定输出目标格式，缺失 diagram intent 和 intermediate spec。

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
- Modify: `esbuild.config.mjs`
- Create: `scripts/build/copy-render-assets.mjs`
- Create: `src/rendering/webview/index.html`
- Create: `src/rendering/webview/bootstrap.ts`
- Test: `src/tests/buildRenderAssets.test.ts`

- [ ] 明确渲染资产目录约定，避免后续把 HTML、JS、CSS 散落到插件根目录。
- [ ] 为生产构建增加静态渲染资源复制或生成步骤，保证 `main.js` 之外的资源可随插件一起发布。
- [ ] 建立最小 smoke 测试，验证构建产物中包含渲染页面和必要脚本。

**Decisions:**

- 第一阶段不要引入多入口复杂打包，先用单独脚本复制 `src/rendering/webview/` 到发布目录。
- 如果后续 iframe runtime 需要独立 bundle，再扩展为多入口 esbuild。

**Exit Criteria:**

- 构建产物可稳定携带渲染页面。
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

- [ ] 定义 `DiagramIntent`，覆盖至少 `mindmap`、`flowchart`、`sequence`、`classDiagram`、`erDiagram`、`stateDiagram`、`canvasMap`、`dataChart`。
- [ ] 定义 `DiagramSpec` 的最小结构和 validator。
- [ ] 把“从笔记内容判断应输出哪类图”的逻辑从 Mermaid prompt 中剥离出来。

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

- [ ] 新增“让 LLM 输出 `DiagramSpec` JSON”的 prompt。
- [ ] 让 `summarizeToMermaidCommand` 演进为 `generateDiagramCommand`，但保留现有命令名做兼容入口。
- [ ] 在服务层引入“生成 spec -> 验证 spec -> 交给 adapter”的流水线。

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

- [ ] 先建立平台接口，再逐步接入真实重型 renderer。
- [ ] 为当前 Mermaid 输出提供统一预览入口，而不是把预览逻辑散在业务命令里。
- [ ] 增加简单缓存，至少按 `spec + target + theme` 做 cache key。

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

- [ ] 增加 `.canvas` 目标格式输出。
- [ ] 先支持知识图、概念图、研究梳理和任务拆解场景，不追求完整手工编辑语义。
- [ ] 支持从 `DiagramSpec` 映射到 node/edge/position 的基础布局。

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

- [ ] 让包含明确数据点、序列、对比、占比的笔记走 `dataChart` intent。
- [ ] 通过 iframe host 隔离 Vega-Lite 渲染依赖。
- [ ] 先支持 bar、line、area、scatter、pie、table-like summary 六类高价值图表模板。

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

- [ ] 将 UI 语言、Obsidian theme、图表主题和导出选项对齐。
- [ ] 补齐 PNG、SVG、source JSON/canvas 导出。
- [ ] 更新文档，明确支持图种、限制、降级策略和故障排查。

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

目标周期：`1.8.3` 到 `1.8.5`

重点：

- 建立 `DiagramSpec`
- 解除 Mermaid 对 `mindmap` 的单点绑定
- 上线 Mermaid adapter v2
- 建好 renderer registry 和最小 preview 流程

成功标志：

- Mermaid 输出质量提升明显。
- 新逻辑不再依赖大规模字符串修补。
- 插件内部具备“未来可挂多 renderer”的真实接口，而不是计划层面口头保留。

### Mid Term

目标周期：`1.9.x`

重点：

- 正式支持 JSON Canvas
- 正式支持 Vega-Lite
- 引入 iframe render host
- 加入基础缓存、主题配置和导出

成功标志：

- Notemd 不再是“只能吐 Mermaid 文本”的插件。
- 图形输出开始覆盖结构图、知识图和数据图三类场景。
- 预览、缓存、导出具备最小闭环。

### Long Term

目标周期：`2.0+`

重点：

- 评估 HTML/SVG infographic 与 richer summary cards
- 评估 PlantUML、Graphviz 等重型 DSL
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

### Risk: Vega-Lite 或 HTML 渲染资源打包影响插件稳定性

控制策略：

- 把新渲染 runtime 放到独立 webview 资产目录。
- 为移动端和桌面端设计 capability checks 与 fallback。

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

## Recommended First Batch

如果现在就进入实现，建议只做第一批，不要跨阶段并行膨胀：

1. Task 0
2. Task 1
3. Task 2
4. Task 3 的 `mindmap + flowchart` 子集
5. Task 4 的 registry/service/preview 最小骨架

这批完成后再决定是否进入 Canvas 和 Vega-Lite。原因很直接：

- 这是把 Notemd 从“字符串修补系统”转成“图形平台”的关键断点。
- 如果这一断点没完成，后续任何新图种都会继续落在旧架构里，最终返工成本更高。

---

## Verification Gate For Each Phase

每个阶段都应至少具备以下验证：

- `npm run build`
- 目标单元测试通过
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

先把 Notemd 做成一个真正存在的 diagram platform，再决定它应该承载哪些 renderer。

如果要用一句话概括接下来的技术策略，就是：

`spec-first, adapter-driven, renderer-hosted, staged expansion`

