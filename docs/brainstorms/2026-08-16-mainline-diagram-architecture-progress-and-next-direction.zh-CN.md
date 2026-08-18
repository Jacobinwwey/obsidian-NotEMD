---
date: 2026-08-16
last_updated: 2026-08-18
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
| 语义域 | 13 个可执行语义图形类型 | `src/diagram/diagramTypeCatalog.ts`、`src/diagram/examples/diagramExampleCatalog.ts` |
| 渲染目标 | 8 个 registry target；target 身份与导出格式分离 | `src/rendering/rendererRegistry.ts`、`src/rendering/renderTargetCatalog.ts` |
| 导出格式 | target 按能力提供 SVG/PNG/PDF；editable HTML/SVG 携带 `previewSvg` | target catalog 与 renderer 集成测试 |
| 可发现性 | 设置页显示确定性缩略图，并提供“使用此类型”动作 | `docs/assets/diagrams/manifest.json`、`diagramExamplePreview.test.ts` |
| 静态 gallery | 13 组生产 fixture 生成的 SVG/PNG；过期资源会让检查失败 | `scripts/generate-diagram-gallery.js`、`npm run diagram:gallery:check` |
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

## 与 `diagram-design` 的对比

| 轴 | 参考项目 | Notemd 当前真值 | 工程决策 |
|---|---|---|---|
| 语义选择 | pattern 页面映射到 visual layout | `DiagramIntent` 路由到 typed catalog | 保留 intent-first |
| 视觉 taxonomy | 27 种布局语法 | 13 个可执行语义类型 | 只通过证据门禁增量准入 |
| 产物/导出 | 自包含 HTML/SVG/PNG 示例 | 8 个 target，导出能力独立声明 | target 与 export 正交 |
| 预览 | 示例 HTML 资产 | 设置页和 docs 使用生产 renderer fixture 缩略图 | 两者使用同一 fixture |
| 治理 | type references 与 complexity budget | versioned capability/target manifest 加测试 | manifest 与测试共同构成契约 |
| 契约边界 | pattern 文档旁附带人工可读命令示例 | 纯 schema runtime 加 registry admission；host/core schema 保持显式 | 对非法契约 fail-closed，但不合并 UI 与 CLI 上下文 |

参考 taxonomy 仍提供 architecture、current-state、radar、loop、nested、tree、org chart、layers、Venn、pyramid、bar、line、Gantt、scatter、medallion、process、data flow 以及 security/integration matrix 候选。Timeline、swimlane、quadrant 已通过受限 Mermaid-only 准入门禁，但这不代表 editable HTML/SVG、Draw.io 或 Drawnix 支持。OAuth sequence、动画、imports、vertical orientation 等是 workflow 或变体，不应伪装成新的语义类型。

## 与既有方案的差距

| 既有要求 | 当前证据 | 尚未闭合的边界 |
|---|---|---|
| Operation 契约应有可执行事实源 | registry schema 已由与 registry 无关的 runtime 校验，并导出 CLI contract | maintainer 宿主 metadata 有意区别于 host-neutral schema；可生成纯数据目录仍是后续迁移 |
| 参考布局必须是真语义而非别名 | timeline、swimlane、quadrant 已具备受限 payload、adapter、fixture、预览与测试 | Radar 仍需真实 Vega-Lite adapter，其余参考布局保持计划中 |
| 外部互操作必须由 consumer 证明 | Plait 公开 API consumer 与固定 Circuitikz compiler gate 已通过 | Draw.io 与真实 Drawnix 应用不可用，因此不宣称应用级兼容 |
| 文档必须暴露支持类型与预览 | manifest 驱动的双语 gallery 已有 13 组生产 SVG/PNG | 新类型必须在同一变更中保持 gallery freshness 与双语支持行 |

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
5. **Drawnix 收敛：** 生产 source-coverage 与 relation-router 名称已经 canonical，旧 source-coverage export 和旧 router 模块仅用于兼容。矩形/折线以及文本度量/换行共享 primitive 已集中，独立 Plait consumer gate 已证明生产 fixture 可以跨越公开 consumer 边界。真实 Drawnix 桌面/应用导入仍是单独的外部门禁。
6. **Circuitikz 收敛：** 六个 golden renderer 已共享 standalone-document 与 component-label helper，同时保持确定性输出。`runCircuitikzRepairLoop()` 明确保留为 maintainer-only acceptance SDK；正常生成不调用 LLM repair loop。只有在明确授权的 repair 命令且具备新鲜 compile/render evidence 时，才接入 CLI/desktop caller。
7. **参考候选准入：** timeline、swimlane、quadrant 已以 Mermaid-only 类型交付，并具备确定性 fixture 与 parser-backed gallery 证据。Radar 在真实 Vega-Lite adapter 出现前继续阻塞；其余参考布局仍受门禁控制。
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

本轮新鲜验证：261 个 Jest suite 通过（2,284 tests passed、1 skipped）；TypeScript/esbuild build 通过；VitePress docs build 通过；生产 gallery check 通过并生成 13 组 SVG/PNG；render-host audit 与 i18n audit 通过；独立 Drawnix Plait consumer gate 通过（20 个节点、1 个根、12 条关系）；semantic verification helper 通过；Circuitikz smoke 使用 TeX Live 2023 `pdflatex` 通过（6/6 PDF，0 error/0 warning）。`git diff --check` 通过。当前工作区没有 Draw.io 或真实 Drawnix 桌面应用，因此不作应用级互操作声明。全仓 lint 仍作为独立基线债务跟踪。
