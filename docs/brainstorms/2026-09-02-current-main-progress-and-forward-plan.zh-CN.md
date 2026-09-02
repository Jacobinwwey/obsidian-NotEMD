---
date: 2026-09-02
last_updated: 2026-09-02
topic: current-main-progress-and-forward-plan
status: current
canonical_for:
  - current-main-progress
  - plan-status-convergence
supersedes: ./2026-08-16-mainline-diagram-architecture-progress-and-next-direction.zh-CN.md
superseded_by: null
---

# 当前 Main 进度与后续推进计划

这是当前 main 的执行记录。它把已交付实现、活跃收敛工作、延后的外部证据和历史计划分开。运行时 registry、manifest 与检入的验证输出是唯一真值来源；旧计划中的 checkbox 数量不是完成证据。

## 总体判断

当前 `main` 可发布，内部覆盖已经足够完整。项目不再受限于缺少图表 primitive，主导风险已经转为真值漂移：文档可能超过当前 build 的实际能力，兼容 alias 可能超过迁移窗口，serializer 或 public API consumer 的通过也可能被误读为应用级互操作。

下一步应是有控制的收敛，而不是继续增加 renderer。除非有实测需求，否则保持当前单入口 `main.js` + 内联 `srcdoc` 打包契约。只有当 runtime、持久化、预览、文档和 consumer 证据一起前进时，才提升新的 target 声明。

## 当前源代码数量

| 表面 | 当前数量 | 真值来源 |
|---|---:|---|
| 可执行图表目录行 | 33 | `src/diagram/diagramTypeCatalog.ts` |
| 语义图表 intent | 30 | `src/diagram/types.ts` |
| 渲染 target | 8 | `src/rendering/renderTargetCatalog.ts` |
| 图片导出格式 | 3（`SVG`、`PNG`、`PDF`） | `src/rendering/renderTargetCatalog.ts` |
| Provider 定义 | 36 | `src/llmProviders.ts` |
| 插件 UI locale | 21 | `src/i18n/uiLocales.ts` |
| 已发布网站 locale | 34 | `website/src/lib/publishedLocales.mjs` |
| 已注册 operation 契约 | 29 | `src/operations/registry.ts` |
| 实机 Vault 示例 | 33，全部 `passed` | `docs/diagram-examples/manifest.json` |
| 仅参考图表 grammar | 5 | `src/diagram/diagramCapabilityManifest.ts` |

33 个目录行并不等于 33 个独立渲染引擎。多个行共享有界 payload family adapter，三个显式定量变体也有意共享 Vega-Lite target。文档和 release notes 必须保留这一差异。

## 验证快照

2026-09-02 针对当前 `main` 实现验证；clean-worktree 状态仍是最终发布门禁：

- `npm.cmd run build`：通过。
- `npm.cmd test -- --runInBand`：275 个 suite 通过；2511 个测试通过；1 个 skipped。
- `npm.cmd run docs:build`：通过。
- `npm.cmd --prefix website run build`：34 个已发布 locale 全部通过。
- `npm.cmd --prefix website run audit:build`：通过。
- `npm.cmd run diagram:examples:check`：33 条通过。
- `npm.cmd run diagram:gallery:check`：33 个 fixture 资产通过。
- `npm.cmd run audit:i18n-ui`：通过。
- `npm.cmd run audit:render-host`：通过。
- `npm.cmd run verify:local-kb-fixtures`：9 个测试通过。
- `npm.cmd run diagram:consumer:drawnix`：Plait public-API consumer 通过，20 个节点、12 条关系、1 个根节点。
- `npm.cmd run lint`：受仓库既有债务影响失败（`231` 个 error、`1374` 个 warning）；在建立 changed-lines ratchet 前，不应将其归类为本功能回归。

远端 `1.9.7` Release 已发布，包含 `main.js`、`manifest.json`、`README.md` 和 `styles.css`。Release body 的英文和简体中文均可独立阅读，只保留 `Highlights` / `Fixes And Robustness` 与 `重点更新` / `修复与鲁棒性` 两组。

## 计划状态矩阵

| 计划族 | 当前 main 状态 | 实际剩余工作 |
|---|---|---|
| Provider 扩展各轮 | 已交付 / 历史 | 上游 API 变化时保持 metadata、discovery、文档和测试同步。 |
| Language Support 多阶段 | 已交付 / 历史 | 没有剩余实现阶段；保持 Codex 离线发布翻译策略。 |
| 主线稳定化与 CI 加固 | 已交付 / 历史 | 维护 clean-worktree 与 release-helper 门禁，不重开已完成的 wrapper 工作。 |
| CLI operation 抽取与 registry 加固 | 已达到当前契约深度 | packaging-aware contract promotion 仍需单独决策；当前 operation binding 不自动等于 public API。 |
| 图表渲染路线图 | 活跃并带延后边界 | 重型 runtime 隔离和 Mermaid legacy 全拆解仍开放；PlantUML/Graphviz/Draw.io 继续延后。 |
| Vault 历史、设置导航、批处理文件夹 | 已交付 | 只做回归维护；文件夹批量变更与更丰富 history retention 需要新契约。 |
| 图表预览/历史自适应 | modal 架构已交付 | focus-trapped 内部 drawer 是新的交互系统变更，不是未修复 bug。 |
| Mermaid 规范化合并 | Phase 0-3 已交付 | 删除兼容导出前先盘点调用方；unknown family 继续采用 parser-backed 保守准入。 |
| 图表能力目录与向前架构 | runtime 基础已交付，外部门禁活跃 | Draw.io 与真实 Drawnix 应用证据不可用；Plait 门禁不代表应用兼容。 |
| 参考扩展 | 已完成 | 33 个可执行行、有界 payload、确定性 adapter、preview/gallery/docs 门禁全部通过。 |
| 真实 Vault 图表示例 | 已完成 | 仅在 provider 或 renderer 证据变化时重新生成；失败必须显式保留，不能用 fixture 替代。 |
| Local KB 与 Chapter Split | 有界设计已交付 | 当前是 MiniSearch 词法检索与 managed artifact；语义/vector retrieval 属于新架构线。 |
| Slidev 可编辑 PPTX | 质量线活跃 | Office 字体替换、表格基线、段落间距和 native geometry fidelity 仍有可测缺口。 |
| GEO/GitHub Pages/release | 运行上已交付 | Search Console 与 AI visibility 仍需部署后的外部证据。 |

旧计划保留 checkbox 与历史理由用于追溯。阅读时必须与本矩阵及计划进度段落结合；历史 TDD 步骤未勾选，不代表对应生产行为不存在。

## 证据与非声明

| 边界 | 证据 | 允许的声明 |
|---|---|---|
| Mermaid | canonical normalizer、35-stage legacy registry、family gate、幂等测试、runtime SVG safety | 已交付且保守兼容 legacy 的 Mermaid 路径 |
| Native editable SVG | 确定性 renderer、layout diagnostics、Chromium gallery gate、33 组 fixture 资产 | 在已测试 host/presentation 契约下交付 native family 预览 |
| Drawnix | `.drawnix` serializer 与 `@plait/*` public API consumer gate | Plait public-API 兼容；不宣称真实 Drawnix 应用导入 |
| Draw.io | 只有 exporter 与 XML 测试；当前工作区没有 diagrams.net 可执行程序 | 只能声明 serializer 契约，不声明应用互操作 |
| Circuitikz | 6 个 golden template 与本地 native compiler 证据 | 有界 native compile 路径；CI 工具/版本证据仍需补齐 |
| Render host | `main.js` 内联 `srcdoc`、render-host audit、fail-closed runtime module resolver | 当前自包含打包；不等于独立重型 runtime 隔离 |
| Local KB | MiniSearch、标题感知分块、离线 fixture、inspect diagnostics | 插件内词法检索；不等于 vector/RAG service 语义 |
| Slidev/PPTX | native standalone export 与 rendered layout audit | 有界可编辑性和明确图片 fallback；不等于 Office 往返像素一致 |

## 兼容层盘点与 Ponytail 审计

全仓过度设计审计没有发现可以在本次收敛切片中安全删除的生产依赖。当前候选及证据如下：

| 候选 | 当前调用方/证据 | 决策 |
|---|---|---|
| `src/rendering/preview/mermaidDefinitionShared.ts` | 兼容 re-export；当前没有生产 import；无法证明旧源码调用方已经消失 | 在记录外部迁移窗口前保留 |
| `src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts` | 废弃 re-export，仍由 routing focused tests 消费 | 保留；测试是当前兼容证据 |
| `routeDrawnixCrossRootRelation()` | 没有生产调用方；canonical router 和兼容测试仍引用 | 作为明确的兼容 API 保留；不把它宣传为生产路由 |
| `mergeDrawnixSourceCoverage()` | maintainer 文档和测试仍引用该别名 | 在下游迁移到 `enrichDrawnixSourceCoverage()` 前保留 |
| `rewriteLegacyTrailingDoubleDashArrow` | 仓库内部看起来没有引用；不能排除外部脚本 | 未完成外部 consumer 检查前不删除 |
| `runCircuitikzRepairLoop()` | focused tests 和 maintainer acceptance 文档消费该 SDK | 继续 maintainer-only；绝不接入普通生成 fallback |
| `stripWrappingDoubleQuotes()` / `stripWrappedQuotedLabel()` | `legacyFixerUtils.ts` 中字节相同的私有实现 | 作为未来小幅 shrink 候选；延后到独立的行为保持变更 |

因此本次审计建议建立迁移 ledger 并引入 changed-lines lint ratchet，而不是猜测式删除。这样能降低未来债务，同时不破坏旧 artifact 或隐藏调用方，是当前最小且稳妥的改动。

## 有序推进计划

### Phase A：真值控制面

1. 保持本文与中文对应文档作为 current-main 入口。
2. 在测试中从 runtime manifest 派生数字声明，不再维护第二份手写目录。
3. 计划状态统一使用 `current`、`active`、`shipped`、`deferred`、`historical`、`superseded`，并记录证据路径。
4. 将 release body、检入的 release notes、tag tree 与 release assets 视为相互校验而非同一产物。

退出门禁：docs contract tests、两套 docs build、完整 Jest、干净 Git 状态。

### Phase B：仅在实测支持时做 Packaging 决策

1. 在代表性 target 上测量 `main.js` 大小、启动成本、预览加载时间与移动端压力。
2. 若当前 inline host 仍在预算内则保持它；单纯减少源码文件大小不是增加第二资产的理由。
3. 若隔离确有必要，则在同一原子批次完成 build 输出、runtime loader、audit 规则、release assets、workflow、维护者文档和真实 Obsidian 证据。

退出门禁：release artifact 与 runtime-consumption 链路共同证明前，不得声称重型 runtime 已隔离。

### Phase C：兼容层 sunset

1. 盘点 `mermaidDefinitionShared.ts`、`drawnixCrossRootRouter.ts`、`mergeDrawnixSourceCoverage()`、`routeDrawnixCrossRootRelation()` 与 legacy Mermaid alias 的生产、测试、maintainer 脚本和外部调用方。
2. 删除 export 前先增加弃用窗口和迁移诊断。
3. 继续保持 `runCircuitikzRepairLoop()` 为 maintainer-only；LLM repair loop 不得成为普通生成的隐式 fallback。

退出门禁：调用方清单、迁移覆盖、focused regression 和明确的移除版本。

### Phase D：Consumer 证据

1. 当具备稳定 executable 或 CI container 时，增加真实 diagrams.net open/import 门禁。
2. 增加真实 Drawnix 应用打开/import 证据；Plait public-API gate 作为较低层契约保留。
3. 在 CI 固定 Circuitikz compiler/tool 版本，并按输入/输出 hash 归档日志。

退出门禁：能力目录中明确区分 serializer、public-API 和 application-level 状态。

### Phase E：不扩张 runtime 的质量深化

1. Local KB：先建立离线 query corpus，测量 recall、上下文膨胀、延迟、旧索引行为和低信号导航笔记，再考虑 embedding。
2. Slidev：优先处理 Office table/font/baseline fidelity，不急于扩大 native object extraction。
3. Lint：引入 baseline + changed-lines ratchet；功能开发期间不要全仓 `--fix`。

退出门禁：每个质量变更都有 before/after 指标，并且既有 release 门禁不回归。

### Phase F：收敛后再增加新引擎

PlantUML、Graphviz、Draw.io runtime 集成、Mermaid vector reconstruction 与 semantic/vector retrieval 均保持 deferred。必须先有需求证据并通过 Phase B-D 门禁。

## 风险控制

- 为向前兼容保留 unknown 字段，但 required 字段和已知类型在边界处 fail closed。
- Cache 只是优化，不是 artifact identity 或正确性 authority。
- Provider discovery 保持有界并面向生成；不要把 embedding/reranker/speech 条目展示成 generation model。
- Real-Vault `passed` 只表示一次 provider/environment 运行，不证明所有 provider、theme 或移动端 host。
- 网站构建通过只证明 route/build 完整性，不证明部署后的 Search Console 或 AI-answer visibility。

## 决策

下一次 release-sized 工作应是 truth/packaging/consumer 收敛批次，而不是继续扩展 catalog。任何无法明确 owner、invariant、evidence artifact 和 rollback/deferral 条件的提案，都还没有达到实现门槛。
