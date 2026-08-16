---
date: 2026-08-15
last_updated: 2026-08-16
topic: mermaid-normalization-consolidation
status: active
canonical_for:
  - mermaid-normalization
supersedes: []
superseded_by: null
implementation_record: null
---

# Mermaid 规范化合并方案（2026-08-15）

## 1. 状态与范围

本方案合并当前互相不一致、且与路线图文档不一致的 Mermaid 规范化/修复面。它是路线图"双栈风险"控制与 Task 3 日落边界（`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`）的实现切片。

范围：渲染、预览、笔记修复三条路径共享的 diagram 级 Mermaid 规范化。不在范围内：新增图表类型、改动 legacy 修复链顺序、打包/宿主工作。

## 2. 审计发现与更正

### 2.1 存在三套规范化面（严重度 4）

- `validator.normalizeMermaidDefinition` — `src/diagram/adapters/mermaid/validator.ts:29-39` — 渲染路径，经 `validateMermaidDefinition`（`:41-56`）进入 `src/rendering/renderers/mermaidRenderer.ts:55`。缺少 ER 修复。
- `mermaidDefinitionShared.normalizeMermaidDefinition` — `src/rendering/preview/mermaidDefinitionShared.ts:92-101` — 预览路径，经 `mermaidPreview.ts:22,36` 与 `renderHostEntry.ts:119`。包含 `repairBraceLessErEntityBlocks` + `repairTruncatedErRelationCardinality`（`:84-87`）。
- `mermaidProcessor.refineMermaidBlocks` — `src/mermaidProcessor.ts:67-279` — markdown 级修复，笔记路径调用点 `fileUtils.ts:1006,1328,1671`、`searchUtils.ts:372`。

同一输入在渲染与预览路径对 `erDiagram`（无括号实体、截断基数）产生不同规范化结果。这是唯一有用户可见行为影响的发散点。

### 2.2 对先前 code-slop 审计的更正

- `runCircuitikzCompile` 不是死代码：`scripts/export-circuitikz.js:151,171` 在生产 CLI 路径调用它。先前 "tests-only" 结论只 grep 了 `src/`。重新定性为"重复编译实现"（CLI spawnSync vs 桌面 spawn），严重度 3 -> 1-2。
- `runCircuitikzRepairLoop`（`src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts:93`）仍无任何生产调用，但路线图把它定位为"opt-in Phase E execution boundary"——CLI 自行实现 repair-brief/acceptance（`scripts/export-circuitikz.js:253,307-324`）。结论成立（未接线的模块），严重度 3 -> 2，定性为"文档与代码错位"而非"功能缺失"。

### 2.3 影响设计的关键事实

- fence 格式四处发散：`checkMermaidErrors` 正则（`mermaidProcessor.ts:42`，要求尾部 \n）、`MERMAID_FENCE_REGEX`（`validator.ts:4`，^$ 锚定）、`refineMermaidBlocks` 块正则（`:253`，只认反引号，漏 `~~~` 块）、`diagramGenerationService.ts:580` 的手工 fence。
- `refineMermaidBlocks` 无条件剥掉 mermaid 块内所有行的 `(){}`（`mermaidProcessor.ts:195`）——生产笔记路径上已经在破坏 `erDiagram` 实体块。
- 30 步 `deepDebugMermaid` 链（`mermaidProcessor.ts:356-498`）是 flowchart 偏置的：`fixMermaidNotes` 改写 `note right of`（合法 sequence 语法）、`fixMermaidPipes`/`fixMisplacedPipes` 触碰 `|`（ER 基数语法）。
- `mermaid.initialize` 在 `validator.ts:47` 与 `checkMermaidErrors`（`mermaidProcessor.ts:48`）各调一次；`mermaid.initialize` 是全局配置重置，重复调用会冲掉其他消费者。
- `legacyFixerUtils.ts` 死导出：`rewriteLegacyTrailingDoubleDashArrow`（`:412`）、4 个不被 import 的 `parse*`、字节相同的 `stripWrappingDoubleQuotes`/`stripWrappedQuotedLabel`（`:36-42`/`:44-50`）。
- Drawnix 几何重复（审计发现，超出本方案范围但在此登记）：当前单根原生投影内部仍有重复的测量/布局 helper；`routeDrawnixCrossRootRelation`（`drawnixCrossRootRouter.ts:823`，约 250 行）无生产调用；`mergeDrawnixSourceCoverage`（`drawnixSourceCoverage.ts:575-582`）是已废弃的 tests-only 别名。已删除的 presentation 模块和 presentation 交付 bundle 不属于当前契约。

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

- 30 步 `deepDebugMermaid` 链保持字节不变，只迁移宿主并暴露为有序阶段注册表（`{id, run}`）——这是路线图日落边界的记账单位。
- 29 个 legacy fixer 留在 `legacyFixerUtils.ts` 作为阶段实现；按 2.3 清理死导出。
- Stage 3 类型门控：非安全集 family（尤其 `erDiagram`、`stateDiagram-v2`）跳过整条 legacy 链；Stage 4/5 照常执行。同时修复 `:195` 剥 `(){}` 的 bug。
- 唯一有意的行为变更：渲染路径获得与预览一致的 ER 修复。用 Phase 0 分歧夹具守护。

## 6. 权衡与备选方案

| 方案 | 代价 | 结论 |
|---|---|---|
| A. 中性 normalize + 阶段管线 | 一次迁移 + 全量回归 | 选定：同时解决四个契约 |
| B. validator 为 superset，shared 委托 | 最小 diff | 否决：依赖方向错误；validator 职责是校验不是修复 |
| C. 双份 + 互指注释 | 零 | 否决：已经分化过一次（ER 修复） |
| D. 渲染路径直接 import shared | 最小 diff | 否决：normalize 会留在 rendering/preview，diagram 层向上依赖 |

质疑点：ER 修复是猜测性重写，目前只在预览跑，`mermaid.parse` 从未验证过其输出。合并后应解析修复结果，失败则回退未修复内容（fail-closed 到今天的渲染行为）。

质疑点：首行 family 检测脆弱（BOM、前导空行、\%\%{init} 头）。Stage 2 在 Stage 1 之后运行并跳过注释；未知 family 落入安全集（不跑 legacy 链）。

## 7. 坑点

1. **fence 尾部锚点漂移**：legacy 链在 fenced 上下文跑过；改为 inner 文本后，尾部换行数变化会移动 `$`/`^` 的匹配。先锁死 `fenceMermaid` 尾缀，再跑全量 mermaidFix 回归——顺序不能反。
2. **幂等**：`fixConcatenatedLabels`/`fixDoubledID` 是启发式，二跑可能二次改写（`mermaidFixChain.test.ts` 已有部分 `toBe(input)` 断言）。补一条整链对干净内容二跑不变的回归。
3. **mermaid.parse 成本**：`checkMermaidErrors` 对每个块都 parse；保留 errorCount 门控；绝不在预览热路径引入 parse。
4. **`getValidNodeIDs` 上下文**（`mermaidProcessor.ts:1158`）：必须留在需要它的 stage 内，不提升为全局。
5. **测试面即行为契约**：约 25 个 `mermaidFix*`/`deepDebug*`/`mermaidProcessor.test.ts` 文件迁移后必须原样通过。测试失败意味着迁移破坏了行为，不是测试该改。
6. **`diagramGenerationService:580` 手工 fence**（fenced mermaid + `spec.intent` 当首行）在错误回退路径产出非法图；改用 `fenceMermaid` + 合法 fallback 体。
7. **`~~~` fence**：统一正则必须吸收 `~~~`，否则修复链静默跳过这些块（`mermaidProcessor.ts:253` 现有 bug）。

## 8. 阶段与门禁

- **Phase 0 — 分歧夹具（测试先行）**：erDiagram 无括号实体 + 截断基数夹具，断言渲染输出 == 预览输出。今天必红；定义唯一的有意行为变更。
- **Phase 1 — 中性 normalize 模块**：从 shared 移植 normalize + ER 修复（带 mermaid.parse 回退）；validator 改 re-export。门禁：`mermaidSanitization`/`mermaidValidator`/`mermaidErAdapter` 套件全绿。
- **Phase 2 — legacy 链阶段化**：deepDebug 30 步 -> 阶段数组，字节不变；类型门控；清理 legacyFixerUtils 死导出。门禁：全部约 25 个 mermaidFix 套件 + `mermaidProcessor.test.ts` 全绿。
- **Phase 3 — fence 与配置收敛**：单一 `fenceMermaid`；删除 `:580` 手工 fence；`ensureMermaidInitialized()` 模块级一次。门禁：渲染/预览/导出集成（`renderExportFlow`、`diagramPreviewModal`）。
- **最终门禁**：`npm run build`；`npm test -- --runInBand`；`npm run audit:render-host`；快照 diff 仅允许 erDiagram 产物变化。

## 9. 与先前方案的进展对比

### vs 图形渲染平台路线图（2026-04-14）

| Task | 要求 | 当前状态 | 缺口 |
|---|---|---|---|
| 0. 构建/打包基座 | render-host 冒烟门、单 main.js + inline srcdoc | 门存在（`audit:render-host`）；单入口执行中 | candidate-only 守卫仍在 production esbuild 路径之外（2026-06-09 状态未变） |
| 1. 领域模型 + 意图路由 | DiagramSpec + DiagramPlan | 完成（`architecture.md:188-203`） | 无 |
| 2. spec-first 生成 | DiagramSpecPrompt 取代裸 mermaid 文本 | 完成 | 命令表面收口未完成 |
| 3. Mermaid adapter V2 + mermaidProcessor 拆分 | 单一 adapter、legacy-fixer 日落 | 未完成：normalize 发散（2.1），mermaidProcessor 仍 1339 行并 import 29 个 legacyFixerUtils 函数 | **本方案** |
| 4. 渲染平台骨架 | registry/host/cache/preview | 完成（8 个渲染器） | 无 |
| 5. JSON Canvas | 首个非 Mermaid 目标 | 完成 | 无 |
| 6. Vega-Lite | 沙箱 iframe 预览 | 完成 | 无 |
| 7. 主题/导出/发布硬化 | SVG/PNG/PDF + 发布纪律 | 完成（1.8.x-1.9.x） | 无 |
| 8. 延后高级引擎 | 暂缓 | 暂缓（正确） | 无 |

路线图 "Recommended Next Batch"（收敛批而非新目标）仍是正确方向；Task 3 是唯一未完成的收敛项，本方案执行它。

### vs Drawnix 知识导图质量与交付方案（2026-07-22）+ 实施记录（2026-08-14）

已实现：投影、带 grid 回退的保留车道路由（已验证存活：`routeDrawnixRelationThroughReservedLane` -> `findGridReservedLaneRoute`，`drawnixCrossRootRouter.ts:627-635`）、source coverage，以及 2026-08-14 单根实施记录。`architecture.md:203` 描述的行为准确。

缺口（审计）：当前投影路径内部的测量/布局 helper 重复；死的 `routeDrawnixCrossRootRelation` 引擎（约 250 行）；废弃别名 `mergeDrawnixSourceCoverage`。这些是本方案之后的 Drawnix 收敛切片。

### vs circuitikz Figure Generation Roadmap

Phase A-F：A 已文档化；B/C 受约束原型完成（circuitSpec + exporter + 黄金模板）；D render feedback 经 `runCircuitikzCompile` 接线（CLI，已更正）；E 修复环未接线（opt-in 边界无入口，CLI 自行实现 acceptance）；F 受管桌面环境完成。缺口：6x 模板/校验近重复（`circuitikzExporter.ts:205-778`）、字节相同的 `extendedPortX`/`dualInputPortX`（`:45-50`）、buffer 模板硬编码 `(7.2,1.2) node[right]`，以及 `runCircuitikzRepairLoop` 的去留决策（接线或删除，然后修文档声明）。

### vs 图形平台稳健性与设置真值推进方案（2026-08-08）

Phase 0-6 已实现（1.9.5）。语义/几何/交付契约已文档化；当前投影仍存在 helper 重复，但不存在第二套 presentation 交付契约。审计未发现其他契约违反。

## 10. 后续推进方向

1. 执行本方案（Mermaid 规范化合并）——唯一有用户可见行为发散的项。
2. Drawnix 收敛切片：为原生投影抽取单一共享测量/布局模块；删除死路由引擎与废弃别名。
3. circuitikz：模板参数化；决策 `runCircuitikzRepairLoop` 去留；同步文档。
4. 仓库级 helper 收敛（escapeHtml x10、错误三元 x94、FNV-1a x5、isRecord x6、slugify x3、枚举守卫 x4、indexOf 去重 x7）作为收敛批收尾，遵守路线图的 support-matrix 纪律。
5. 坚持路线图规则：先收敛，再上新目标。
