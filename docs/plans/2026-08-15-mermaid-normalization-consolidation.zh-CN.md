---
date: 2026-08-15
last_updated: 2026-09-02
topic: mermaid-normalization-consolidation
status: completed
canonical_for:
  - mermaid-normalization
supersedes: []
superseded_by: null
implementation_record: src/tests/mermaidNormalizationConvergence.test.ts
---

### 当前 main 处置（2026-09-02）

Phase 0-3 已在 `main` 完成，包括 canonical 规范化、分阶段 legacy 修复、共享 fence 所有权和验证 runtime 初始化。剩余兼容导出与 maintainer-only repair SDK 是有意保留的边界：已经盘点生产、测试、脚本和文档调用方；在外部 consumer 迁移窗口出现前，没有足够证据删除。因此本方案在实现范围内已完成；外部 consumer 证据和未来兼容层删除由当前 main 收敛方案跟踪。

# Mermaid 规范化合并方案（2026-08-15）

## 1. 状态与范围

本方案合并当前互相不一致、且与路线图文档不一致的 Mermaid 规范化/修复面。它是路线图"双栈风险"控制与 Task 3 日落边界（`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`）的实现切片。

范围：渲染、预览、笔记修复三条路径共享的 diagram 级 Mermaid 规范化，以及 legacy 链的明确所有权边界。原始收敛切片不新增图表类型；第 11 节记录的后续目录准入是在这些门禁关闭后，只增加受限 Mermaid adapter。

## 2. 审计发现与更正

### 2.1 历史审计基线（记录于 2026-08-15）

本小节记录实施前的状态。diagram-level 发散已于 2026-08-17 关闭；剩余开放项见第 11 节。

- `validator.normalizeMermaidDefinition` — `src/diagram/adapters/mermaid/validator.ts:29-39` — 渲染路径，经 `validateMermaidDefinition`（`:41-56`）进入 `src/rendering/renderers/mermaidRenderer.ts:55`。缺少 ER 修复。
- `mermaidDefinitionShared.normalizeMermaidDefinition` — `src/rendering/preview/mermaidDefinitionShared.ts:92-101` — 预览路径，经 `mermaidPreview.ts:22,36` 与 `renderHostEntry.ts:119`。包含 `repairBraceLessErEntityBlocks` + `repairTruncatedErRelationCardinality`（`:84-87`）。
- `mermaidProcessor.refineMermaidBlocks` — `src/mermaidProcessor.ts:67-279` — markdown 级修复，笔记路径调用点 `fileUtils.ts:1006,1328,1671`、`searchUtils.ts:372`。

在 Phase 0 之前，同一输入在渲染与预览路径对 `erDiagram`（无括号实体、截断基数）产生不同规范化结果。该用户可见发散现已由 `mermaidNormalizationConvergence.test.ts` 与 canonical normalize 模块覆盖。

### 2.2 对先前 code-slop 审计的更正

- `runCircuitikzCompile` 不是死代码：`scripts/export-circuitikz.js:151,171` 在生产 CLI 路径调用它。先前 "tests-only" 结论只 grep 了 `src/`。重新定性为"重复编译实现"（CLI spawnSync vs 桌面 spawn），严重度 3 -> 1-2。
- `runCircuitikzRepairLoop`（`src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts:93`）仍无任何生产调用，但路线图把它定位为"opt-in Phase E execution boundary"——CLI 自行实现 repair-brief/acceptance（`scripts/export-circuitikz.js:253,307-324`）。结论成立（未接线的模块），严重度 3 -> 2，定性为"文档与代码错位"而非"功能缺失"。

### 2.3 影响设计的关键事实

- 历史上 fence 所有权分散在 `checkMermaidErrors`、`validator`、`refineMermaidBlocks` 与手工 fallback fence。现在由 `extractMermaidBlocks`/`mapMermaidBlocks` 提供共享 scanner，由 `fenceMermaidDefinition` 负责反引号/波浪线输入的 canonical 输出。
- `refineMermaidBlocks` 历史上会无条件剥除 Mermaid 块内行的 `(){}`。当前路径已保留 ER 语法花括号，legacy deep-debug 链只对 `flowchart`/`unknown` family 执行。
- 历史审计将 `deepDebugMermaid` 链称为“30 步”（`mermaidProcessor.ts:356-498`），但可执行 registry 现在固化为 35 个稳定 stage ID。它仍有 flowchart 偏置：`fixMermaidNotes` 改写 `note right of`（合法 sequence 语法），`fixMermaidPipes`/`fixMisplacedPipes` 触碰 `|`（ER 基数语法）。
- `ensureMermaidInitialized` 现在负责插件验证初始化：按函数身份调用一次 `mermaid.initialize`；预览 webview 保留独立的主题专属 `deps.initialize()` 生命周期。
- `legacyFixerUtils.ts` 死导出：`rewriteLegacyTrailingDoubleDashArrow`（`:412`）、4 个不被 import 的 `parse*`、字节相同的 `stripWrappingDoubleQuotes`/`stripWrappedQuotedLabel`（`:36-42`/`:44-50`）。
- Drawnix 几何重复（审计发现，超出本方案范围但在此登记）：当前单根原生投影内部仍有剩余的测量/布局 helper，但共享的矩形/折线 primitive 已集中到 `drawnixGeometry.ts`，确定性文本度量/换行已集中到 `drawnixTextLayout.ts`。canonical `drawnixRelationRouter.ts` 中的 `routeDrawnixCrossRootRelation` 无生产调用，并明确仅用于兼容；旧 `drawnixCrossRootRouter.ts` 路径是弃用 re-export。`enrichDrawnixSourceCoverage` 是 canonical 生产操作，`mergeDrawnixSourceCoverage` 仅保留为废弃兼容别名。已删除的 presentation 模块和 presentation 交付 bundle 不属于当前契约。

## 3. 问题分析：四个契约冲突

合并不是"删重复"；必须先定死四个契约，否则重复会重新长出来：

1. **fence 契约**：normalize 只输出内部内容；fence 所有权归调用方，统一走一个 `fenceMermaid(inner)`。
2. **层级契约**：`refineMermaidBlocks` 是 markdown 级，`normalizeMermaidDefinition` 是 diagram 级。合并单元是 diagram 级；markdown 扫描器保留但把块内修复委托下去。
3. **类型盲区**：legacy 链对 `erDiagram`/`stateDiagram-v2`/sequence 不安全。管线需要 family 检测与门控。
4. **配置生命周期**：`mermaid.initialize` 必须收敛为模块级一次性。

## 4. 目标架构

`src/diagram/adapters/mermaid/normalize.ts`（不 import mermaid 运行时）：

```
normalizeMermaidDiagram(input, opts?) -> { content, family }
  Stage 0 decode       : CRLF -> LF, trim
  Stage 1 defence      : 统一 fence 正则（吸收 ~~~ 与尾部 \n 语义），返回 inner + fence 信息
  Stage 2 detectFamily : 跳过 %% / --- 注释行后按首行意图检测
  Stage 3 legacyRepair : deepDebugMermaid 链，字节稳定，仅当 opts.repair && family 允许时
  Stage 4 erRepair     : repairBraceLessErEntityBlocks + repairTruncatedErRelationCardinality（仅 erDiagram）
  Stage 5 sanitize     : 逐行 trimEnd + 两拷贝共有的两条 ER 正则修复
```

消费者：
- `validateMermaidDefinition` = normalize + `mermaid.parse` + `fenceMermaid`（渲染路径）。
- `mermaidPreview`/`renderHostEntry` = normalize（re-export）；删除 `mermaidDefinitionShared.ts` 中的私有拷贝。
- `refineMermaidBlocks` = markdown 级扫描器 + 在 `errorCount > 0` 时委托 normalize 做块内修复。

依赖方向：normalize 位于 `diagram/adapters/mermaid/`；`rendering/preview` import 它（`mermaidRenderer.ts` -> `validator.ts` 已证明该方向可行）。禁止把 normalize 放在 `rendering/preview` 让 diagram 层向上依赖。

## 5. 整合策略

- 保留已经冻结的 legacy 执行顺序并暴露为有序 registry（`{id, run}`）；它是路线图日落边界的记账单位，当前包含 35 个 ID。
- stage 实现仍位于 `mermaidProcessor.ts`/`legacyFixerUtils.ts`；没有调用点证据就不删除任何死导出。
- 类型门控对安全集合之外的 family（安全集合为 `flowchart`/`unknown`）跳过整条 legacy 链；normalize 与 ER 修复仍运行，同时修复历史 `(){}` 剥除问题。
- 唯一有意的语义变化仍是渲染路径获得预览原有的 ER 修复；Phase 0 分歧夹具与 stage registry 回归测试保护该边界。

## 6. 权衡与备选方案

| 方案 | 代价 | 结论 |
|---|---|---|
| A. 中性 normalize + 阶段管线 | 一次迁移 + 全量回归 | 选定：同时解决四个契约 |
| B. validator 为 superset，shared 委托 | 最小 diff | 否决：依赖方向错误；validator 职责是校验不是修复 |
| C. 双份 + 互指注释 | 零 | 否决：已经分化过一次（ER 修复） |
| D. 渲染路径直接 import shared | 最小 diff | 否决：normalize 会留在 rendering/preview，diagram 层向上依赖 |

历史质疑（已关闭）：ER 修复曾是只在预览路径执行的猜测性重写，因此渲染路径从未验证其输出。当前 canonical normalizer 会让修复结果经过 `mermaid.parse`；解析失败则回退到未修复内容，保持 fail-closed 边界。

质疑点：首行 family 检测脆弱（BOM、前导空行、\%\%{init} 头）。Stage 2 在 Stage 1 之后运行并跳过注释；未知 family 落入安全集（不跑 legacy 链）。

## 7. 坑点

1. **fence 尾部锚点漂移**：legacy 链在 fenced 上下文跑过；改为 inner 文本后，尾部换行数变化会移动 `$`/`^` 的匹配。先锁死 `fenceMermaid` 尾缀，再跑全量 mermaidFix 回归——顺序不能反。
2. **幂等**：`fixConcatenatedLabels`/`fixDoubledID` 是启发式，二跑可能二次改写（`mermaidFixChain.test.ts` 已有部分 `toBe(input)` 断言）。补一条整链对干净内容二跑不变的回归。
3. **mermaid.parse 成本**：`checkMermaidErrors` 对每个块都 parse；保留 errorCount 门控；绝不在预览热路径引入 parse。
4. **`getValidNodeIDs` 上下文**（`mermaidProcessor.ts:1158`）：必须留在需要它的 stage 内，不提升为全局。
5. **测试面即行为契约**：约 25 个 `mermaidFix*`/`deepDebug*`/`mermaidProcessor.test.ts` 文件迁移后必须原样通过。测试失败意味着迁移破坏了行为，不是测试该改。
6. **历史 fallback fence 坑点（已关闭）**：早期 `diagramGenerationService` 错误回退路径曾用 `spec.intent` 作为首行手工拼接 fence。必须继续以 canonical `fenceMermaidDefinition` 为边界，并用回归测试保护合法 fallback 体。
7. **`~~~` fence（已关闭）**：共享 scanner 现在吸收 `~~~`；必须保留回归覆盖，防止未来修复链改动再次静默跳过波浪线 fence。

## 8. 阶段与门禁

- **Phase 0 — 分歧夹具（已完成）**：erDiagram 无括号实体 + 截断基数夹具现在断言渲染输出 == 预览输出，并记录唯一有意的语义变更。
- **Phase 1 — 中性 normalize 模块（已完成）**：normalize + ER 修复已移入 diagram 层；validator、preview 与 render-host 共享实现。门禁：`mermaidSanitization`/`mermaidValidator`/`mermaidErAdapter` 套件已通过。
- **Phase 2 — legacy 链阶段化（完成）**：冻结的执行顺序已由 35 个 ID 的 stage registry 表达；family 门控与整链幂等性已有覆盖。聚焦 legacy 套件和 build 已通过；死导出仍需调用点证据后再清理。
- **Phase 3 — fence 与配置收敛（完成）**：共享 scanner 和 canonical fence helper 负责 markdown 块边界；`ensureMermaidInitialized()` 按 `initialize` 函数身份一次化插件验证 runtime。预览 webview 的主题初始化有意保持独立。
- **最终门禁**：`npm run build`；`npm test -- --runInBand`；`npm run audit:render-host`；快照 diff 仅允许 erDiagram 产物变化。

## 9. 与先前方案的进展对比

### vs 图形渲染平台路线图（2026-04-14）

| Task | 要求 | 当前状态 | 缺口 |
|---|---|---|---|
| 0. 构建/打包基座 | render-host 冒烟门、单 main.js + inline srcdoc | 门存在（`audit:render-host`）；单入口执行中 | candidate-only 守卫仍在 production esbuild 路径之外（2026-06-09 状态未变） |
| 1. 领域模型 + 意图路由 | DiagramSpec + DiagramPlan | 完成（`architecture.md:188-203`） | 无 |
| 2. spec-first 生成 | DiagramSpecPrompt 取代裸 mermaid 文本 | 完成 | 命令表面收口未完成 |
| 3. Mermaid adapter V2 + mermaidProcessor 拆分 | 单一 adapter、legacy-fixer 日落 | diagram-level normalize、35-stage registry/type gating、共享 scanner/fence 所有权和验证配置生命周期均已收敛 | 仍需外部 consumer 证据以及最终 legacy-fixer 删除决策 |
| 4. 渲染平台骨架 | registry/host/cache/preview | 完成（8 个渲染器） | 无 |
| 5. JSON Canvas | 首个非 Mermaid 目标 | 完成 | 无 |
| 6. Vega-Lite | 沙箱 iframe 预览 | 完成 | 无 |
| 7. 主题/导出/发布硬化 | SVG/PNG/PDF + 发布纪律 | 完成（1.8.x-1.9.x） | 无 |
| 8. 延后高级引擎 | 暂缓 | 暂缓（正确） | 无 |

路线图 "Recommended Next Batch"（收敛批而非新目标）仍是正确方向；本方案现在记录已完成的 Task 3 Phase 2-3，并跟踪剩余的 consumer 证据与 renderer 收敛门禁，而不是重新打开已关闭的 diagram-level 发散。

### vs Drawnix 知识导图质量与交付方案（2026-07-22）+ 实施记录（2026-08-14）

已实现：投影、带内部 grid 回退的保留车道路由（已验证存活：`drawnixMindMapProjection.ts` 调用 `drawnixRelationRouter.ts` 中的 `routeDrawnixRelationThroughReservedLane()`）、source coverage，以及 2026-08-14 单根实施记录。`architecture.md:203` 描述的行为准确。

缺口（审计）：当前投影路径内部仍有测量/布局 helper 重复；仅用于兼容的 `routeDrawnixCrossRootRelation` 引擎；废弃别名 `mergeDrawnixSourceCoverage`。矩形/折线共享 geometry 已经集中。这些是本方案之后的 Drawnix 收敛切片。

### vs circuitikz Figure Generation Roadmap

Phase A-F：A 已文档化；B/C 受约束原型完成（circuitSpec + exporter + 黄金模板）；D render feedback 经 `runCircuitikzCompile` 接线（CLI，已更正）；E 已明确为单次尝试的 maintainer-only acceptance 边界；F 受管桌面环境完成。字节相同的 `dualInputPortX` helper 与 buffer 端口字面量已收敛：NAND/NOR 使用 `extendedPortX`，buffer 使用 `bufferPortX` 命名更宽的右侧 gutter 并驱动两个 buffer 端口。剩余模板级校验/渲染代码保持显式，因为每个 golden family 的拓扑和诊断不同；将其压成通用 mode switch 会降低审查性并削弱 golden 输出所有权。

### vs 图形平台稳健性与设置真值推进方案（2026-08-08）

Phase 0-6 已实现（1.9.5）。语义/几何/交付契约已文档化；当前投影仍存在 helper 重复，但不存在第二套 presentation 交付契约。审计未发现其他契约违反。

## 10. 后续推进方向

1. 在工具可用时记录真实外部 consumer 证据；不要把 fixture 或 serializer 证据升级成互操作性声明。
2. Drawnix 收敛切片：先证明并抽取原生投影中剩余的共享测量/布局逻辑；矩形/折线和文本度量/换行契约已经集中。只有完成调用点与迁移证据后，才删除仅用于兼容的路由引擎和废弃别名。
3. circuitikz：共享 document/label 模板 plumbing 已参数化；决定 `runCircuitikzRepairLoop` 去留，并同步文档。
4. 仓库级 helper 收敛（escapeHtml x10、错误三元 x94、FNV-1a x5、isRecord x6、slugify x3、枚举守卫 x4、indexOf 去重 x7）作为收敛批收尾，遵守路线图的 support-matrix 纪律。
5. 坚持路线图规则：先收敛，再上新目标。

## 11. 实现更新（2026-08-17）

Phase 0 至 Phase 3 现在均已落地。Phase 0 与 Phase 1 的 diagram 级实现关闭了渲染/预览发散；Phase 2 与 Phase 3 完成了 legacy 链、fence 和验证 runtime 的收敛。

- `src/diagram/adapters/mermaid/normalize.ts` 成为无运行时依赖的 canonical 边界，统一处理 BOM/CRLF、反引号与波浪线 fence、Mermaid family 检测、行尾清洗和现有 ER 修复。
- `validator.ts`、`mermaidPreview.ts`、`renderHostEntry.ts` 共同消费这一实现。`mermaidDefinitionShared.ts` 仅保留兼容 re-export。
- `refineMermaidBlocks` 识别两种 fence，并不再删除 ER 语法花括号；legacy 链已固化为 35 个稳定 stage，仅对 `flowchart`/`unknown` 执行，并有幂等性不变量覆盖。
- `src/tests/mermaidNormalizationConvergence.test.ts` 证明渲染验证与预览接收完全相同的 ER 内容，覆盖无括号实体和截断基数修复。
- `extractMermaidBlocks`/`mapMermaidBlocks` 现在由验证和修复路径共享；`fenceMermaidDefinition` 是唯一 canonical 输出边界。
- `ensureMermaidInitialized()` 防止插件验证 runtime 重复重置全局配置；预览 webview 按设计保留独立主题初始化。

剩余缺口已收窄为外部 consumer 证据、Drawnix 几何收敛和 Circuitikz 模板收敛。没有同等的 schema、renderer、持久化、gallery 与 consumer 证据门禁前，不接纳新的无界 Mermaid layout 或 target；2026-08-18 记录的窄范围 Mermaid-only 候选准入是已明确记录的例外。

### Drawnix 与 Circuitikz 收敛（2026-08-17）

Drawnix 生产边界现在有 canonical relation-router 模块和仅用于兼容的旧路径。`drawnixGeometry.ts` 统一负责矩形膨胀、严格重叠语义和按路径长度插值，避免 SVG projection 与 relation routing 在这些 primitive 上分叉。旧 cross-root router 只为源码兼容和定向测试保留；生产路由以 reserved-lane 为首选，并由 projection 负责原生标签定位。

Circuitikz exporter 现在让六个 golden renderer 共享一个 standalone-document wrapper 和一个 component-label lookup helper。这是保持精确输出契约的结构重构：拓扑、voltage convention、layout hints 和 golden fixture 均不变。repair loop 继续作为 maintainer-only acceptance 边界。

### 收敛后的候选准入（2026-08-18）

收敛门禁现在足以支持一次窄范围目录扩展。`timeline`、`swimlane`、`quadrant` 各自拥有 typed payload 字段、parser-backed Mermaid adapter、intent/planner 路由、与旧 spec 兼容的读取、确定性 fixture、双语 gallery 行和定向测试。三者的 `compatibleTargets` 有意严格为 `['mermaid']`；不宣称 editable HTML/SVG、Draw.io 或 Drawnix 支持。`org-chart` 也已作为受限责任归属 intent 准入，具备单根/环路/深度/直接汇报数校验、Mermaid adapter、HTML 语义表格 fallback 与确定性 gallery 证据。webview presentation registry 也已把 Mermaid/Vega-Lite host shell、HTML document passthrough 与 source-only fallback 收敛到一个 keyed contract。
### 收敛跟进（2026-08-18）

`drawnixRelationLabelLayout.ts` 现在统一负责 lane reservation 与 native label metadata 的关系标签测量。`dualInputPortX` 已由共享的 `extendedPortX` 规则取代；`bufferPortX` 为有意更宽的 buffer gutter 提供命名边界。以上源码收敛保持确定性 golden 输出与拓扑校验不变。`runCircuitikzRepairLoop` 继续作为 maintainer-only acceptance 边界，不会成为普通生成的 fallback。
