---
date: 2026-08-16
last_updated: 2026-08-26
topic: mainline-diagram-architecture-progress-and-next-direction
status: active
canonical_for:
  - current-diagram-progress
  - diagram-architecture-audit
supersedes: ./2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md
superseded_by: null
implementation_record: src/tests/mermaidNormalizationConvergence.test.ts
---

# 主线图形架构：当前进度审计与后续方向

这是图形平台当前以证据为准的进度记录，也是当前状态的发现入口；更早审计保留为历史材料。

## 总体判断

平台已经跨过关键架构门槛：生成采用 spec-first，渲染器由 registry 管理，target descriptor 同时服务预览和落盘，生成选择器与文档 gallery 都使用生产 renderer fixture。

下一步必须先收敛再扩展。若在契约、Mermaid 和外部 consumer 门禁未闭合前继续增加视觉类型，只会扩大兼容性债务。`ref/diagram-design` 是 taxonomy 与 UX 参考，不是待完成的功能清单。

## 已交付真值矩阵

| 领域 | 当前状态 | 证据 |
|---|---|---|
| 语义域 | 33 个可执行语义图形类型（15 个原有行、3 个显式定量 variant，以及 15 个参考衍生的 native/定量行） | `src/diagram/diagramTypeCatalog.ts`、`src/diagram/examples/diagramExampleCatalog.ts` |
| 渲染目标 | 8 个 registry target；target 身份与导出格式分离 | `src/rendering/rendererRegistry.ts`、`src/rendering/renderTargetCatalog.ts` |
| 导出格式 | target 按能力提供 SVG/PNG/PDF；editable HTML/SVG 携带 `previewSvg` | target catalog 与 renderer 集成测试 |
| 可发现性 | 设置页和工作台只列可执行类型；选择后显示一个生产 renderer 动态预览面板；仅参考 taxonomy 不进入 UI | `src/ui/diagramTypePreviewPanel.ts`、`diagramCapabilityManifest.test.ts`、`diagramExamplePreview.test.ts` |
| 静态 gallery | 33 组生产 fixture 生成的 SVG/PNG；过期资源会让检查失败 | `scripts/generate-diagram-gallery.js`、`npm run diagram:gallery:check` |
| Drawnix | 文件名根原生树、`.drawnix`、SVG companion、Markdown wrapper | Drawnix implementation record、导出测试与 `npm run diagram:consumer:drawnix` |
| Circuitikz | 受限原生模板与 CLI 编译路径；6 个 golden fixture 已在 TeX Live 2023 下编译 | `src/diagram/adapters/circuitikz`、`scripts/export-circuitikz.js`、smoke report |
| Operation 契约 | schema 形状准入、maintainer 输入校验、运行时结果校验、help/schema 字段派生均已可执行 | `src/operations/contractSchemas.ts`、`src/operations/maintainerCliContractMetadata.json`、bridge 测试 |
| Mermaid | diagram 级 normalize、35 个 stage 的 legacy registry、family 门控、共享 scanner、canonical fence 所有权和验证 runtime 初始化均已收敛 | `src/diagram/adapters/mermaid/normalize.ts`、`src/mermaidProcessor.ts`、`src/diagram/adapters/mermaid/runtime.ts` |
| Public CLI 边界 | `local-knowledge.inspect` 仍是 maintainer-only，不是 public CLI 扩张 | `src/maintainerCliBridge.ts`、capability/public-surface 测试 |

## 本轮实现增量（2026-08-17）

1. 将 maintainer CLI 输入 schema 提取为 JSON 事实源，由 TypeScript 校验器和 Node help 脚本共同读取。required/optional 字段只保留一份；summary 和 example 继续作为人工可读覆盖项。
2. 增加 `assertOperationResult()`。maintainer bridge 返回的非 null 结果会按 registry schema 校验；未知字段继续放行以保持向前兼容，`null` 保留原有取消/无结果语义。
3. 将 Mermaid normalize 移入无运行时依赖的 diagram 层模块，统一处理 BOM/CRLF、带 fence/无 fence、反引号/波浪线 fence、family 检测、ER 实体与基数修复、行尾空白。
4. 保留 `mermaidDefinitionShared.ts` 作为兼容 re-export，preview/render-host 改为直接依赖中性模块。
5. 加固 markdown 修复扫描器：识别两种 fence 并保护 ER 花括号。
6. 将 legacy 修复链暴露为 35 个稳定 stage ID，执行顺序不变。带 flowchart 偏置的 stage 仅对 `flowchart`/`unknown` 执行；sequence 与 ER 内容 fail closed，并增加整链幂等回归契约。
7. 增加共享 `extractMermaidBlocks`/`mapMermaidBlocks` scanner，以及 `openMermaidFence`/`closeMermaidFence`/`fenceMermaidDefinition`，收回验证、修复和 renderer 路径中的重复 fence 输出所有权。
8. 增加 `ensureMermaidInitialized()` 管理插件验证 runtime：按 `mermaid.initialize` 函数身份一次化；预览 webview 保留独立的主题专属 `deps.initialize()` 生命周期。
9. 扩大 Mermaid family registry，覆盖当前 Mermaid 11 已发布声明（`architecture-beta`、`block-beta`、C4、journey、kanban、packet、pie、quadrant、radar、requirement、sankey、timeline、treemap、xychart 与 ZenUML）。这些 family 现在会在进入 legacy flowchart 修复链前 fail closed；真正未知的 header 仍保留为明确的向前兼容逃生口。
10. 让语义目录成为 planner 默认目标与显式 target 准入的唯一事实源。best-fit 现在会在 LLM 生成前拒绝没有 renderer contract 的 intent/target 组合（例如 `dataChart -> mermaid`）；legacy Mermaid 模式仍保留为显式兼容逃生口。新增 fixture 驱动的 contract 测试，逐一验证目录声明的 target 与生产 renderer 的 `supports()` 一致。
11. 将生产 Drawnix source-coverage 操作更名为 `enrichDrawnixSourceCoverage()`。旧 `mergeDrawnixSourceCoverage()` 仅作为带弃用标记的兼容别名保留，供 maintainer 脚本和旧测试使用；生成路径已经切换到 canonical 名称。
12. 将生产 Drawnix 路由模块更名为 `drawnixRelationRouter.ts`。旧 `drawnixCrossRootRouter.ts` 路径保留为带弃用标记的 re-export 以维持源码兼容；projection 已改为依赖 canonical 模块，拓扑和坐标契约没有变化。
13. 抽取 `drawnixGeometry.ts` 作为共享几何边界，统一矩形膨胀、严格内部重叠判断和正交折线插值。router 与 projection 现在消费同一组 primitive；边缘相切语义和按路径长度测量的标签定位由定向测试覆盖。
14. 让六个 Circuitikz golden renderer 共享 standalone document wrapper 与 component-label lookup helper。现有 voltage convention、拓扑、layout hints 和精确 golden 输出保持不变；本次只去除重复的 preamble/label plumbing，不新增渲染模式。
15. 抽取 `drawnixTextLayout.ts` 作为 Drawnix header、节点和关系标签共用的确定性宽度估算与换行契约。projection 不再持有第二份算法；定向测试锁定 ASCII、宽字符、空白和长单词行为。
16. 增加通用 `TargetAdapterRegistry` 以及 preview、render-host adapter registry。preview/export 与 bundled render-host dispatch 不再按 target 使用 switch；未知 JSON payload target 会在 registry 边界 fail-closed。target 专属 webview markup 仍作为独立 presentation-layer 契约处理。
17. 通过受限 payload schema、确定性的 Mermaid adapter、planner/intent 路由、fixture、gallery 资产和双语能力行，将 `timeline`、`swimlane`、`quadrant` 纳入候选准入。三者当前有意只兼容 Mermaid，直到建立 editable 或外部 consumer 契约。
18. 增加 keyed webview presentation registry。Mermaid/Vega-Lite host shell、HTML document passthrough 与 source-only fallback 现在由同一 target 契约解析；未知 target fail-closed，MIME 不匹配时退回 source-only markup。
19. 增加 `npm run diagram:consumer:drawnix`。不传入路径时，它会 bundle 生产 Drawnix 架构 fixture，校验 native envelope，再把临时 `.drawnix` 交给 `scripts/test-drawnix-plait-consumer.mjs`，由公开的 `@plait/core`、`@plait/draw` 与 `@plait/mind` API 消费。该 gate 已通过：一个文件名根、20 个识别节点和 12 条原生关系；这是 consumer 契约证据，不代表工作区安装了 Drawnix 桌面应用。
20. 将共享 Drawnix 折线长度 primitive 移入 `drawnixGeometry.ts`，并通过 projection re-export 保持旧 `DrawnixPoint` 导入路径兼容。router 的标签定位和候选排序现在使用同一长度定义，新增多段折线 30 单位的定向回归。
21. 将 JSON-compatible schema/value validator 拆到 `schemaRuntime.ts`，并增加 `operationContractRegistry.ts`。registry 在模块准入时对 required/property 关系、重复 enum/required、重复 operation/command ID、缺失 input/result schema 和错误触发面 fail-closed。未知 operation payload 字段继续放行；operation 级能力 metadata 与 command binding 级上下文有意保持分离。

22. 在真实 Vega-Lite 浏览器渲染证据通过后，将 `radar-chart` 作为 Phase 5 首个非 Mermaid 候选交付。`radarSpec` 约束轴数量与每个 series 的完整轴覆盖；adapter 确定性计算极坐标并输出网格、轴线、闭合 profile 折线、点和标签 layers。同一生产 fixture 同时供设置页、文档 SVG/PNG 与明确的 HTML 表格 fallback 使用；`dataChart` 的 `chartType: radar` 继续被拒绝。

23. 将平铺 reference gallery 改为共享的选择驱动 `diagramTypePreviewPanel.ts`。设置页和生成工作台只暴露可执行类型；用户选择后，面板调用 `renderDiagramExampleThumbnail()` 并显示生产 SVG。`ref/diagram-design` 仅保留开发期 taxonomy/质量证据，不再有原始截图、data URL、选择器条目或 reference-preview API 进入运行时。

24. 完成选择驱动预览的发布验证切片。`npm.cmd run build`、定向 Jest（57 个测试）、全量 Jest（263 suites，2307 passed，1 skipped）、`npm.cmd run docs:build`、`npm.cmd run diagram:gallery:check` 和 `npm.cmd run audit:i18n-ui` 全部通过。已通过 CLI/eval 插件生命周期重载现有 `1Knowledge` Obsidian 进程并部署最新 bundle；运行时证据显示 1 个预览面板、0 个旧 gallery 节点、0 张参考图、16 个选择器选项、生产 SVG ready、选择器高度 44px、画布比例 16:9。frontend-law-auditor strict gate 得分 91.32/100，无失败项；p95 交互时延和移动端截图仍明确记录为证据缺口。

25. 关闭发布复核发现的 Settings 选择器同步缺口。切换图形类型后，现在会局部同步可见的生成 target 下拉框，不再整页重绘，从而保持渐进披露；行为由 `providerSettingsBehavior.test.ts` 覆盖。最终全量 Jest 仍为 263 suites，2307 passed，1 skipped。

## 与 `diagram-design` 的对比

| 轴 | 参考项目 | Notemd 当前真值 | 工程决策 |
|---|---|---|---|
| 语义选择 | pattern 页面映射到 visual layout | `DiagramIntent` 路由到 typed catalog | 保留 intent-first |
| 视觉 taxonomy | 27 种布局语法 | 33 个可执行语义类型；5 个精确参考语法仍在路线图中 | 只通过证据门禁增量准入 |
| 产物/导出 | 自包含 HTML/SVG/PNG 示例 | 8 个 target，导出能力独立声明 | target 与 export 正交 |
| 预览 | 示例 HTML 资产 | 设置页/工作台使用选择驱动的生产 fixture 动态预览；reference taxonomy 留在 UI 之外 | 明确区分生产证据与参考证据 |
| 治理 | type references 与 complexity budget | versioned capability/target manifest 加测试 | manifest 与测试共同构成契约 |
| 契约边界 | pattern 文档旁附带人工可读命令示例 | 纯 schema runtime 加 registry admission；host/core schema 保持显式 | 对非法契约 fail-closed，但不合并 UI 与 CLI 上下文 |

参考 taxonomy 曾提供 architecture、current-state、loop、nested、tree、layers、Venn、pyramid、bar、line、Gantt、scatter、medallion、process、data flow 以及 security/integration matrix 候选；其中已批准候选现在都具备 shipped payload、fixture 与生产预览。另有 5 个精确语法保持 reference-only；Mermaid-only 的 timeline、swimlane、quadrant 也不能据此宣称 editable HTML/SVG、Draw.io 或 Drawnix 支持。OAuth sequence、动画、imports、vertical orientation 等是 workflow 或变体，不应伪装成新的语义类型。

## 与既有方案的差距

| 既有要求 | 当前证据 | 尚未闭合的边界 |
|---|---|---|
| Operation 契约应有可执行事实源 | registry schema 已由与 registry 无关的 runtime 校验，并导出 CLI contract | maintainer 宿主 metadata 有意区别于 host-neutral schema；可生成纯数据目录仍是后续迁移 |
| 参考布局必须是真语义而非别名 | 已批准的 18 个扩展行都具备有界 payload、adapter、fixture、预览与测试 | 5 个精确参考语法仍需独立布局契约与证据后才能准入 |
| 外部互操作必须由 consumer 证明 | Plait 公开 API consumer 与固定 Circuitikz compiler gate 已通过 | Draw.io 与真实 Drawnix 应用不可用，因此不宣称应用级兼容 |
| 文档必须暴露支持类型与预览 | 双语文档暴露 33 组生产 SVG/PNG；runtime manifest 暴露可执行能力与 5 个仅参考路线图行，UI 只渲染用户选择的生产预览 | 新类型或参考资产变更必须同时通过资产可用性、UI 状态、文档对齐与 gallery freshness 门禁 |

## 风险与权衡

- **Mermaid legacy 链：** `mermaidProcessor.ts` 仍是大型且偏 flowchart 的修复面，但现在已固化为 35 个稳定 stage、family 门控和幂等测试。已知 Mermaid 11 family registry 现在会对非 flowchart 声明 fail closed；只有真正未知的 header 保留兼容逃生口。这是受控债务，不应因此把更多 diagram family 接入该链。
- **Mermaid 全局状态：** 插件验证侧已按 `initialize` 函数身份收敛为模块级初始化。预览 webview 有意保留主题专属初始化，因为它们属于独立 runtime；合并两个生命周期会引入主题回归。
- **Target adapter 边界：** preview/export、render-host dispatch 与 webview markup 都已通过 keyed target contract 收敛；`presentationRegistry.ts` 统一处理 host shell、HTML passthrough 与 source-only fallback。新增 target 仍必须明确 presentation mode，或有意使用 source-only。
- **外部互操作：** Draw.io、Drawnix、Circuitikz 必须使用真实 consumer 证据，不能用 mock 或 serializer snapshot 冒充。工具缺失必须显式记录。
- **向前兼容：** 未知契约字段有意放行；必填字段和已知字段类型在边界严格校验，不能为了“兼容”而整体放松。
- **契约 runtime 边界：** schema 校验现在纯化且可复用，operation 声明仍保留在 TypeScript registry 以保留本地上下文。不能强制 command binding 上下文等同于 operation 能力 metadata；二者描述不同触发面。
- **缓存：** response cache 只是优化，不能成为 artifact 身份或正确性的权威来源。

## 外部 Consumer 门禁状态

| Consumer | 当前证据 | 状态 |
|---|---|---|
| Draw.io | 工作区未发现 diagrams.net/Draw.io 可执行程序 | 未宣称互操作；需补 manual/CI gate |
| Drawnix | `npm run diagram:consumer:drawnix` 生成生产架构 fixture，并通过公开 `@plait/*` API 消费；当前没有独立 Drawnix 应用 | Plait consumer 契约已通过；不宣称真实应用互操作 |
| Circuitikz | `pdflatex` 已编译全部 6 个 golden fixture；每个都生成非空 PDF，0 error、0 warning | 本地 consumer gate 通过；CI 仍需记录工具/版本 |

## 向前推进计划

1. **Mermaid Phase 2：已完成。** legacy 链已成为 35 个有序 stage，具备稳定 ID、已知 family fail-closed 门控和幂等覆盖。family registry 已覆盖当前 Mermaid 11 声明，同时保留 `unknown` 以兼容未来语法；在把 unknown family 视为 flowchart-safe 之前仍必须补 parser-backed 准入证据。
2. **Mermaid Phase 3：已完成。** 共享 scanner、canonical fence 格式和插件验证 runtime 初始化已收敛；预览 webview 的主题初始化继续作为独立 runtime 契约。
3. **Target adapter dispatch：已完成。** preview/export、render-host 与 webview presentation 都使用 keyed target contract；没有内嵌 runtime 的 target 必须显式走 source-only。
4. **Consumer 证据：** 在工具可用时执行 Draw.io/Drawnix/Circuitikz 真实门禁；不可用时记录 blocker，不声称兼容。
5. **Drawnix 收敛：** 生产 source-coverage 与 relation-router 名称已经 canonical，旧 source-coverage export 和旧 router 模块仅用于兼容。矩形/折线、文本度量/换行以及关系标签度量 primitive 已集中，独立 Plait consumer gate 已证明生产 fixture 可以跨越公开 consumer 边界。真实 Drawnix 桌面/应用导入仍是单独的外部门禁。
6. **Circuitikz 收敛：** 六个 golden renderer 已共享 standalone-document 与 component-label helper；common/dual/buffer 端口坐标也已由显式布局 helper 管理，同时保持确定性输出。`runCircuitikzRepairLoop()` 明确保留为 maintainer-only acceptance SDK；正常生成不调用 LLM repair loop。只有在明确授权的 repair 命令且具备新鲜 compile/render evidence 时，才接入 CLI/desktop caller。

### 收敛跟进（2026-08-18）

- `drawnixRelationLabelLayout.ts` 现在是关系标签度量的 canonical 边界。projection 与 lane reservation 共用确定性的换行、宽度、高度和行高契约；SVG/native 几何保持字节稳定，并由聚焦回归测试锁定。
- Circuitikz 已移除字节相同的 `dualInputPortX()` helper。NAND/NOR 输入统一使用 extended-port 规则；buffer 有意保留更宽的右侧 gutter，并由 `bufferPortX()` 同时驱动输入与输出位置，避免隐藏坐标耦合，但不假设六个 golden template 拥有同一拓扑。
- `runCircuitikzRepairLoop()` 明确保留为 maintainer-only、单次尝试的 acceptance SDK。普通生成路径不会调用它；采纳候选仍要求拓扑相等、新鲜 compile/render evidence 和显式 caller。
7. **参考候选准入：** 新增的 18 个扩展行全部完成交付并置于有界 payload 与确定性 adapter 之后：三个定量 variant，以及十五个 native editable HTML/SVG 布局。此前已交付的 Mermaid-only family（`timeline`、`swimlane`、`quadrant`）和有界 Vega-Lite `radar` 保持不变。另有五个精确参考语法仍保持 reference-only，因为尚未宣称其布局契约。
8. **Operation 契约收敛：** 继续把与 registry 无关的 schema runtime 与 registry admission 作为 fail-closed 边界。只有当生成器能保留 host/core 契约分离、人工示例和未知字段行为时，才把声明迁移到生成式 JSON。

## 验收门禁

- `npm run diagram:gallery:check`
- `npm run docs:build`
- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:render-host`
- `npm run diagram:consumer:drawnix`
- `src/tests/renderTargetAdapterRegistry.test.ts`
- `src/tests/contractSchemas.test.ts`
- `npm run lint`（当前被仓库基线阻断；不能误标为本功能失败）
- `git diff --check`
- 外部 consumer 记录必须包含工具/版本/输入/输出，不能由 unit mock 替代。Plait gate 是仓库内的公开 API consumer 契约；真实 Drawnix 应用导入仍需单独的手工/CI 记录。

## 验证快照

最终变更后验证：265 个 Jest suite 通过（2,339 个测试通过、1 个 skipped）；TypeScript/esbuild build 通过；VitePress docs build 通过；gallery 生成/检查通过并得到 33 组 SVG/PNG；render-host audit、i18n audit、Drawnix public-API consumer gate 和 `git diff --check` 通过。全仓 lint 仍是独立基线债务（229 个 error / 1,361 个 warning，包含既有 unused/legacy 代码问题）。当前工作区没有 Draw.io 或真实 Drawnix 桌面应用，因此不作应用级互操作声明。

## 参考布局扩展决策记录（2026-08-21）

本轮已确认分批路线：先工程/数据平台布局，再定量布局，最后结构表达布局。这是已批准的设计与路线图，不代表 reference-only 布局已经交付。

### 当前代码真值与批准设计对照

| 边界 | 当前代码 | 已批准的向前变化 |
|---|---|---|
| 目录身份 | 一个 intent 对应一个目录行 | 稳定目录 ID 可以通过显式 variant 共享 intent；旧歧义查询 fail closed |
| Spec 形态 | 带许多可选专用字段的宽 `DiagramSpec` | 版本化 canonical `payload` 联合，并保留 legacy 读取投影 |
| Prompt 路由 | `diagramSpecPrompt.ts` 中按类型条件拼接 | 由目录元数据选择版本化纯数据 prompt profile |
| 几何 | 现有 Mermaid/Vega/Drawnix/Circuitikz adapter | 有限 native SVG payload-family adapter；模型不输出坐标 |
| Chart variant | `layoutHints.chartType` 加一个 `data-chart` 行 | `quantitative.chartType` 加显式 bar/line/scatter ID；旧 data-chart 继续可读 |
| Preview | 33 个 shipped 类型使用生产 fixture preview | 新类型只有通过同一 renderer、fixture、gallery、无障碍门禁后才能进入 selector |
| 参考 checkout | 开发期 taxonomy 与质量证据 | 继续排除在 runtime 之外；截图和原始 HTML 永不成为产品资产 |

### 已批准批次顺序

1. Batch 0：variant-aware catalog、canonical schema 边界、prompt profile、presentation 默认值、renderer admission；不增加 selector 行。
2. Batch 1A：`architecture`、`current-state`、`integration-topology`。
3. Batch 1B：`data-flow`、`access-matrix`。
4. Batch 2：`bar-chart`、`line-chart`、`scatter-plot`、`gantt`。
5. Batch 3A：`layer-stack`、`venn`、`ranked-funnel`、`loop`。
6. Batch 3B：`nested`、`tree`、`process`、`medallion`、`high-level`。

每个 batch 开始前必须更新本文件及其英文对应文件。详细双语设计和实施文档如下：

- `docs/superpowers/specs/2026-08-21-diagram-reference-expansion-design.en.md`
- `docs/superpowers/specs/2026-08-21-diagram-reference-expansion-design.zh-CN.md`
- `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md`
- `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md`

### 不宣称的能力与门禁

不能因为某种布局可以近似成 flowchart，就自动增加 Mermaid 兼容声明。矩阵、Venn、Gantt、topology 必须有 native 确定性 renderer；Draw.io、Drawnix、Circuitikz 兼容仍需真实 consumer gate。selector 行只有在 payload、prompt profile、validator、renderer、生产 fixture、preview SVG、gallery SVG/PNG、双语文档行和回归测试全部通过后才能准入。

### 工作区状态

本决策记录开始时，`main` 与 `origin/main` 一致，`git status --porcelain=v1 -b` 仅报告 `## main...origin/main`。后续每个 batch 提交都必须保留 `.trellis/`、不 reset 无关修改，并在 build、全量 Jest、docs、gallery、i18n、render-host 与 `git diff --check` 门禁后恢复相同 clean 状态。

## Batch 0 进度（2026-08-21）

Batch 0 已作为兼容基础实现；本批不增加 selector 行，也不把新的 reference 布局宣称为 shipped。

- 目录定义现在携带 `payloadKind` 与 `layoutProfileId`；查询支持显式 variant，legacy 默认查询继续可用。
- `DiagramSpec` 接受 `schemaVersion`、canonical `payload`、`presentation` 和命名空间 `extensions`，不删除现有 renderer 使用的 legacy 字段。
- generation merge 边界把 legacy v1 spec 归一化为 schema v2 元数据，生成 `legacy` 或 `quantitative` payload；未知 schema version fail closed。
- profile catalog 现在拥有 prompt profile ID、版本、payload family、hard limits、语义规则、target 规则和非法输出规则。现有 Circuitikz/Drawnix 专用 prompt 契约保持不变。
- capability manifest 行暴露 payload/layout 所有权元数据；manifest schema 仍采用 additive 方式，reference-only 行仍排除在 selector 之外。

本增量证据：catalog/payload/parser/prompt 聚焦测试通过（30 个测试），`npm.cmd run build` 通过；Batch 0 边界上既有 15 类型生产 gallery 与 renderer 契约保持不变。随后 Batch 1A 至 3B 均通过 native fixture 与 preview/gallery 门禁，完整交付记录如下。

## 参考扩展完整交付（2026-08-21）

分阶段实现已经在 runtime 与生产证据链中完成。目录现在包含 33 个可执行 ID：原有 15 个、3 个显式定量 variant，以及 15 个参考项目衍生布局能力。仍有 5 个精确参考语法保留在路线图中（`flowchart`、`sequence`、`state-machine`、`er-data-model`、`pyramid-funnel`），因为它们的参考布局契约不能简单等同于已有语义类型。

### 已交付 payload family

| Family | 已交付 ID | Target | 证据 |
|---|---|---|---|
| `topology` | `architecture`、`current-state`、`integration-topology`、`high-level` | editable HTML/SVG + HTML | 确定性 zone、有界节点、正交路由、生产 fixture |
| `lane-grid` | `data-flow`、`process` | editable HTML/SVG + HTML | lane/step 有界、显式 cell、空 cell 不占位、focal handoff |
| `access-matrix` | `access-matrix` | editable HTML/SVG + HTML | 封闭权限级别、有界 role/component 网格、focal cell 校验 |
| `quantitative` | `bar-chart`、`line-chart`、`scatter-plot` | Vega-Lite + HTML | canonical chart payload、legacy projection、浏览器 gallery 渲染 |
| `schedule` | `gantt` | editable HTML/SVG + HTML | 确定性 task 时间轴与 milestone；v1 不生成依赖箭头 |
| `ordered-stack` | `layer-stack`、`medallion` | editable HTML/SVG + HTML | 4-6 层有界 stack 与 focal layer |
| `set-overlap` | `venn` | editable HTML/SVG + HTML | 2-3 个集合与显式交集归属 |
| `ranked-segments` | `ranked-funnel` | editable HTML/SVG + HTML | 有界 pyramid/funnel segment 与 focal segment |
| `cycle` | `loop` | editable HTML/SVG + HTML | 5-8 个 station、一个 hub、循环返回路径 |
| `nested` / `tree` | `nested`、`tree` | editable HTML/SVG + HTML | 有界 containment level 与单 root 层级 |

### Runtime 与兼容性变化

- `diagramSpecResponseParser` 保留 canonical payload 与 presentation dial；`normalizeDiagramSpecPayload` 把定量 payload 投影回 legacy `dataSeries/layoutHints` 字段，既有 Vega-Lite 调用方继续有效。
- `validateCanonicalDiagramPayload` 在边界执行 family 预算和交叉引用不变量；renderer 不猜测缺失节点、日期、权限或几何。
- prompt profile registry 现在覆盖全部 33 个目录行。新 profile 只要求语义 payload，禁止模型输出坐标、SVG、CSS 和编造数字。
- `EditableHtmlSvgRenderer` 统一承担 topology、lane-grid、matrix、schedule、stack、overlap、ranked、cycle、nested、tree 的确定性 family adapter；生产 preview 与 gallery 共用同一 artifact 路径。
- intent inference 能识别显式参考布局词汇；显式 native-only 请求会覆盖全局 legacy-Mermaid 偏好，不再误路由到 mindmap。
- capability manifest 现在有 33 个 shipped 行和 5 个 reference-only 行。新类型不暗示 Draw.io、Drawnix 或 Circuitikz 兼容性。

### 证据快照

`npm.cmd run diagram:gallery` 已生成 33 组 SVG/PNG；已目视检查 topology、lane-grid、matrix、schedule、cycle、nested、tree 和 ranked 布局截图。native-layout 聚焦测试覆盖确定性 SVG、无障碍元数据、畸形 payload 拒绝、非法引用、schedule 顺序和预算拒绝。最终全量回归、文档、gallery、i18n、consumer、render-host 与 diff-check 门禁均已在提交前通过。

## Variant 可发现性跟进（2026-08-22）

完成度审计发现首轮交付存在兼容性缺口：目录虽然有 33 个 ID，但 Settings 与 Workbench 按 semantic intent 去重，导致 `bar-chart`、`line-chart`、`scatter-plot` 无法独立选择。该缺口现已关闭。

- 共享选择器与生产预览现在暴露全部 33 个 catalog ID。
- `preferredDiagramTypeId` 是稳定的持久化 selector 身份；旧 `preferredDiagramIntent` 仍可读取，并解析到对应默认目录行。
- 显式定量 variant 通过 operation input、planner、prompt profile、generation 传递 `requestedVariant`，最终进入 Vega-Lite；不会静默落入 legacy Mermaid。
- maintainer `diagram.generate` 接受 `requestedTypeId`；operation registry 与生成的 help metadata 已包含该字段。
- 不兼容的持久化 target/type 组合在 settings 边界清为 Auto；过期 catalog ID 回退到旧 semantic preference。

本跟进后的最终证据：266 个 Jest suite 通过（2,349 个测试通过、1 个 skipped）；build 通过；gallery check 通过并得到 33 条记录；VitePress docs、render-host audit、i18n audit、Drawnix public-API consumer gate 和 `git diff --check` 通过。全仓 lint 仍是基线债务，不重新归类为本功能失败。
## Layout Safety Closure (2026-08-23) / 布局安全闭环（2026-08-23）

English: The visual audit showed that canonical payload validity alone did not prove readable output. The shared `src/diagram/layout/layoutSafety.ts` contract now provides conservative glyph measurement, no-space token wrapping, bounded line counts, overlap primitives, and a version marker. `layoutDiagnostics.ts` rejects core labels that would be truncated and reports optional detail elision as warnings. Native editable SVG families now derive node, row, matrix, lane, schedule, stack, overlap, cycle, nested, and tree geometry from measured text; topology edge labels search deterministic clearance candidates. `RenderArtifact` carries additive `layoutSafetyVersion` metadata, `RendererService` applies the gate before caching, prompt profiles expose numeric density budgets without exposing coordinates, and preview iframes expose title/error/timeout states. The gallery browser gate uses `getBBox()` for native SVG to reject out-of-viewBox text, node text outside its node, node overlap, edge-label/node collision, and core truncation. All 33 production fixtures regenerate and pass `diagram:gallery:check`; six representative PNGs were visually inspected. This is renderer/headless evidence, not a claim of manual acceptance for every Obsidian theme.

中文：视觉审计证明，仅有 canonical payload 合法并不能证明输出可读。共享的 `src/diagram/layout/layoutSafety.ts` 现在提供保守字符测量、无空格 token 换行、行数上限、碰撞原语和版本标记；`layoutDiagnostics.ts` 会拒绝必须截断的核心标签，并把可选细节省略记录为 warning。native editable SVG family 现在依据实测文本推导节点、行、矩阵、lane、schedule、stack、overlap、cycle、nested 和 tree 几何；topology 边标签通过确定性候选位置避障。`RenderArtifact` 以 additive 方式携带 `layoutSafetyVersion`，`RendererService` 在缓存前执行门禁，prompt profile 暴露数值密度预算但不暴露坐标，preview iframe 提供 title、错误和超时状态。gallery 浏览器门禁使用 `getBBox()` 拒绝 viewBox 外文本、节点外文本、节点重叠、边标签与节点碰撞以及核心文本截断。33 个生产 fixture 均可重建并通过 `diagram:gallery:check`，另抽检 6 张 PNG。以上是 renderer/headless 证据，不等同于所有 Obsidian 主题的人工验收。
## 宿主预览纵横比与对比度闭环（2026-08-25）

Obsidian Vault 审计发现，之前的 SVG 几何门禁无法发现宿主层回退：设置页缩略图 CSS 把所有 native SVG 强制塞入 16:9 且 `overflow:hidden`。访问矩阵源画布是 880×532（1.65:1），因此宿主把无碰撞的源 SVG 压缩成 421.875×236.719 CSS 像素；这是展示层故障，不是 canonical payload 故障。

- native 类型预览现在保留 SVG `viewBox` 比例，写入 `data-preview-aspect-ratio`，并强制写入实测最小可读宽度（`data-preview-min-readable-width`），使用 intrinsic-height 且可水平滚动的区域，不再把所有 family 拉伸/裁切到单一缩略图比例。
- 共享 reference 调色板将 muted 文本改为 `#475569`；在 focal/soft 浅色块上副标题达到 AA 对比度。深色 cycle hub 使用专用浅色文字类，避免继承深色节点文字。
- 生产 gallery 浏览器门禁除边界、节点重叠、边标签避障、截断外，新增 native SVG 文本与图形背景的对比度检查；核心标签 fail-closed，可选细节只能显式截断并保持次要层级。
- 实机证据：已通过 `obsidian vault="1Knowledge" plugin:reload id=notemd` 热重载 `E:\1Knowledge`；Vault 与工作区 bundle hash 一致，访问矩阵实际报告 `880/532`、intrinsic SVG 尺寸 `880×532`、最小可读宽度 `704px`、宿主视口 `410px`、`scrollWidth=645px`、`overflow:auto`。

剩余验收边界：以上证明的是已发布 light-theme 宿主路径与确定性 gallery 路径；Mermaid/Vega 继续由各自 runtime validator 负责，任意用户 CSS 主题仍需同一对比度/边界门禁后才能发布。
## 根层遮挡闭环（2026-08-26）

后续审计发现一个单节点 `getBBox()` 无法覆盖的隐蔽问题：访问矩阵 role header 自身几何合法，但背景从 `y=50` 开始，而文档 summary baseline 为 `y=66`，导致 summary 在绘制顺序上被 header 遮挡。这是 z-order/owner 问题，不是换行问题。

- 访问矩阵 header 现在从 `y=78` 开始，位于标题/summary 块之后；focused renderer test 已锁定该不变量。
- gallery 验证新增根级文字/图形与根级文字/文字相交检查，同时保留节点内边界、节点重叠、边标签避障、截断和对比度检查。
- CLI 热重载后的实机复核：`viewBox=0 0 880 532`、`data-preview-min-readable-width=704`、SVG 高度 `532px`、`scrollWidth=645px`、宿主 client width `410px`，无 Obsidian error 或 error-level console 输出。

这关闭了已知的 native reference 遮挡类别。Mermaid/Vega 几何继续由各自 parser/runtime validator 负责；任何新 renderer family 在进入 catalog 前都必须注册等价的根层门禁与宿主缩放检查。
## JSON Canvas 预览安全提升（2026-08-26）

JSON Canvas 之前被视为 runtime-owned preview，因此跳过 native 几何门禁。这个边界过宽：插件拥有自己输出的 SVG adapter，包括节点文本和边标签。长 JSON Canvas 标签可能语法合法，但在预览中不可读或与节点碰撞。

- `canvasPreview.ts` 现在使用共享测量文本契约，对节点标签换行、动态增加节点高度、边标签最多两行，并对超出预算的核心标签 fail-closed。
- JSON Canvas SVG 现在携带 `data-layout-safety`、可编辑 node/edge 标注以及确定性边标签候选位置。
- gallery `getBBox()` 现在包含 JSON Canvas 节点与边，不再跳过；Mermaid/Vega 由于布局由外部浏览器 runtime 生成，仍由各自 runtime validator 负责。
- 回归覆盖长节点标签、长边标签、无效 payload 与共享 marker 传递。
- `RendererService` 现在在缓存写入以及 command host 落盘之前校验插件拥有的 JSON Canvas 内容；预览阶段不再是唯一的第一道防线。

生成链路证据：超预算的 `canvasMap` 节点现在会在 `RendererService.render()` 阶段失败，无法进入 `saveArtifact`；回归测试已在该边界断言拒绝行为。

## Runtime SVG 安全契约（2026-08-26）

剩余缺口是 Mermaid/Vega 运行时生成的 SVG：语法与 runtime parse 成功，并不保证返回 SVG 有可用 viewport 或 drawable 内容。新增共享 `svgSafety.ts` 契约，校验最终 runtime SVG markup，要求正的 viewBox 或 intrinsic 尺寸，拒绝空输出，并写入版本化 runtime ownership marker。gallery 对 runtime-owned 文本使用浏览器坐标边界检查，不套用 native node 假设。

- Mermaid 与 Vega-Lite 的预览和栅格导出路径现在对 malformed、无尺寸或空 SVG fail-closed。
- 运行时输出仍不执行 native 节点/边碰撞启发式，因为内部布局由 Mermaid/Vega 所有；但必须通过最终 viewport/文本 sanity 检查。
- 该契约在 runtime 渲染完成、预览/导出消费者接收之前执行，非法输出不会被静默缓存为成功预览。
## 共享文本所有权与矩阵单元留白（2026-08-26）

下一轮审计发现另一类 native 布局风险：family renderer 即使通过文本预算，仍可能把副标签固定在与换行后的主标签或标题/summary 相交的 baseline 上。现在由共享 renderer 几何边界负责该约束，不再依赖单个 fixture 文案长度。

- native family 的 body 起点通过 `documentBodyTop()` 根据已测量的文档 summary 推导。topology、lane-grid、access-matrix、schedule、stack、ranked、nested、tree 不再假设 summary 只有一行或位于固定高度。
- access-matrix 的 component hint 与 cell qualifier 锚定在单元底边，主权限值保留独立的两行预算。长标签不会覆盖 qualifier，也不会让颜色权限指代失清。
- gallery 仍是全部 33 个 fixture 的发布门禁；生产 renderer 与 gallery 共用同一确定性 SVG，单独修改 fixture 文案不能掩盖未来生成 payload 的长标签风险。
- Frontend Law Auditor 证据运行报告 0 个 fast-gate 失败、0 个 principle 失败；仍有 12 个 UX 指标明确为 unknown，因为 CLI 证据无法测量宿主热区、交互时延或真实任务完成率。unknown 不视为可用性证明。

本增量验证：native preview/layout 聚焦测试通过（15 个测试），TypeScript/esbuild build 通过，33 条 gallery 生成/check 通过，并在几何修改后重新生成访问矩阵 PNG。
