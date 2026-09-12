---
date: 2026-09-02
last_updated: 2026-09-12
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

语言：[English](./2026-09-02-current-main-progress-and-forward-plan.md) | **简体中文**

[计划进度登记表](../maintainer/project-plan-status.zh-CN.md) 逐项核对了已有的 19 份正式计划、32 份 brainstorming 记录及相关维护者工作线。[可靠性与证据推进计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md) 定义下一批建议实施单元。本文继续作为当前进度入口；9 月 2 日的真值收敛实施仍是已完成的历史切片。

## 总体判断

本次基线为 `main@7638cec`、版本 `1.9.7`。构建和既有测试通过，但 9 月 2 日“内部覆盖已经足够完整”的判断过强。四项确定性本地探针复现了取消与持久化缺陷：取消后的队列可能不结束、并行任务取消后仍可写入、内部创建的取消信号没有到达传输层、失败保存的回滚可以覆盖另一笔并发成功的保存。这些缺陷尚未修复；本轮只修改文档。

下一补丁应先修复操作取消与 artifact 写入归属，并用 PR 验证保护这些变更。在测量实际成本期间保持单入口 `main.js` + 内联 `srcdoc`。打包隔离是条件性优化，不是正确性修复、检索评估或有界 CLI 契约的前置条件。现有操作的可信度优先于新增 renderer。

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

2026-09-12 在 Windows x64、Node `22.19.0` 上重新验证，生产代码基线为 `7638cec`。仓库命令通过 `rtk proxy npm.cmd` 执行；本机 `rtk npm` 专用入口无法解析 npm。

- `npm.cmd run build`：通过。
- `npm.cmd test -- --runInBand`：275 个 suite 通过；2515 个测试通过；1 个 skipped。
- VitePress 文档构建（`1.6.4`，离线）：通过。
- `npm.cmd --prefix website run build`：34 个已发布 locale 全部通过。
- `npm.cmd --prefix website run audit:build`：通过。
- `npm.cmd run diagram:examples:check`：33 条历史示例通过一致性／哈希校验；本轮未重新调用 provider 或在 Vault 中生成。
- `npm.cmd run diagram:gallery:check`：33 个 fixture 通过现有门禁。SVG 比较实际内容；PNG 当前仅检查签名／存在性，不比较像素或 PNG 哈希。
- `npm.cmd run audit:i18n-ui`：通过。
- `npm.cmd run audit:render-host`：通过。
- Local KB 离线 fixture：全量 Jest 中的 9 个测试通过；项目已有评估语料。
- `npm.cmd run diagram:consumer:drawnix -- --input docs/diagram-examples/drawnix-knowledge-map/artifact.drawnix`：Plait public-API consumer 通过，38 个节点、12 条关系、1 个根节点。输入是历史示例，不是先前的 20 节点生成 fixture。
- ESLint：按 `npm.cmd run lint` 相同的 `eslint . --ext .ts` 范围运行，检查 512 个文件，报告 `231` 个 error、`1374` 个 warning。基线未增加，但仍没有防止新增债务的门禁。
- 隔离故障探针：使用虚拟时钟、内存 Vault／HTTP 边界，针对生产函数确认四项异常。探针通过表示缺陷被复现，不表示已修复。
- 生产 `main.js`：`10,056,115` 字节；gzip：`3,728,761` 字节。这是产物体积，不是启动时间或内存测量。

本地 `1.9.7` tag 指向 `ef77788`；从该 tag 到本次基线，生产源码未变化。9 月 2 日的审计记录了含 `main.js`、`manifest.json`、`README.md`、`styles.css` 的远端双语 Release。本轮未重新验证远端发布资产、分支保护、真实 provider、Obsidian 应用行为、Drawnix／Draw.io 应用或 Office 渲染。发布 CI 使用 Node 20，网站 CI 使用 Node 24；本地 Node 22 的结果不替代这两类 CI 环境。

## 计划状态矩阵

| 计划族 | 当前 main 状态 | 实际剩余工作 |
|---|---|---|
| Provider 扩展各轮 | 已交付 / 历史 | 上游 API 变化时保持 metadata、discovery、文档和测试同步。 |
| Language Support 多阶段 | 已交付 / 历史 | 没有剩余实现阶段；保持 Codex 离线发布翻译策略。 |
| 主线稳定化与 CI 加固 | 发布侧范围已交付 | 目前只有标签发布与网站部署工作流；插件 PR 构建／测试验证仍缺失。 |
| CLI operation 抽取与 registry 加固 | registry／host 抽取已交付；生命周期加固部分完成 | 29 个 operation 不等于 29 个 public-safe API。扩展变更契约前先修取消；打包不是通用前置条件。 |
| 图表渲染路线图 | 核心已交付；部分后续项有条件推进 | 测量打包成本，保留保守的 Mermaid 兼容边界；PlantUML／Graphviz／Draw.io runtime 继续延后。 |
| Vault 历史、设置导航、批处理文件夹 | 有限功能范围已交付 | history 自带写队列；artifact 持久化不会自动获得这层保护。批量取消与 artifact 回滚需单独修复。 |
| 图表预览/历史自适应 | modal 架构已交付 | focus-trapped 内部 drawer 是新的交互系统变更，不是未修复 bug。 |
| Mermaid 规范化合并 | Phase 0-3 已交付 | 删除兼容导出前先盘点调用方；unknown family 继续采用 parser-backed 保守准入。 |
| 图表能力目录与向前架构 | runtime 基础已交付，外部门禁活跃 | Draw.io 与真实 Drawnix 应用证据不可用；Plait 门禁不代表应用兼容。 |
| 参考扩展 | 已完成 | 33 个可执行行、有界 payload、确定性 adapter、preview/gallery/docs 门禁全部通过。 |
| 真实 Vault 图表示例 | 历史证据集已完成 | 相关输入／runtime 变化时有意识地刷新；哈希校验不等于重跑 provider，更不证明所有 host。 |
| Local KB 与 Chapter Split | 有界设计已交付 | 当前是 MiniSearch 词法检索与 managed artifact；语义/vector retrieval 属于新架构线。 |
| Slidev 可编辑 PPTX | 质量线活跃 | Office 字体替换、表格基线、段落间距和 native geometry fidelity 仍有可测缺口。 |
| GEO/GitHub Pages/release | 运行上已交付 | Search Console 与 AI visibility 仍需部署后的外部证据。 |

旧计划保留 checkbox 与历史理由用于追溯。每份计划的处置及证据归属见[计划进度登记表](../maintainer/project-plan-status.zh-CN.md)。历史 TDD 步骤未勾选或文档任务已完成，都不能单独决定当前运行时可靠性。

## 证据与非声明

| 边界 | 证据 | 允许的声明 |
|---|---|---|
| Mermaid | canonical normalizer、35-stage legacy registry、family gate、幂等测试、runtime SVG safety | 已交付且保守兼容 legacy 的 Mermaid 路径 |
| Native editable SVG | 确定性 renderer、layout diagnostics、Chromium gallery gate、33 组 fixture 资产 | 在已测试 host/presentation 契约下交付 native family 预览 |
| Drawnix | `.drawnix` serializer 与 `@plait/*` public API consumer gate | Plait public-API 兼容；不宣称真实 Drawnix 应用导入 |
| Draw.io | exporter 与 XML 测试；本轮没有新的应用实测 | 只能声明 serializer 契约，不声明应用互操作 |
| Circuitikz | 6 个 golden template、回归覆盖、历史本地 compiler 证据 | 有界 native compile 路径；新鲜 CI 工具／版本证据仍需补齐 |
| Render host | `main.js` 内联 `srcdoc`、render-host audit、fail-closed runtime module resolver | 当前自包含打包；不等于独立重型 runtime 隔离 |
| Local KB | MiniSearch、标题感知分块、离线 fixture、inspect diagnostics | 插件内词法检索；不等于 vector/RAG service 语义 |
| Slidev/PPTX | native standalone export 与 rendered layout audit | 有界可编辑性和明确图片 fallback；不等于 Office 往返像素一致 |

## 兼容层盘点与 Ponytail 审计

9 月 2 日审计记载“没有发现可以在本次收敛切片中安全删除的生产依赖”。这是该切片不做删除的决定，不代表每个内部 export 都属于受支持的 public API。本次盘点区分持久化契约、已公开的 maintainer API 和内部源码 import：

| 候选 | 当前调用方/证据 | 决策 |
|---|---|---|
| `src/rendering/preview/mermaidDefinitionShared.ts` | 兼容 re-export；当前未记录生产 import | 先界定支持范围；假想的未知调用方不能单独成为无限期保留理由 |
| `src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts` | 废弃 re-export，routing focused tests 仍消费 | 内部测试随调用方迁移；测试引用本身不构成公开兼容承诺 |
| `routeDrawnixCrossRootRelation()` | 兼容 router／测试仍引用 | 本次不做删除；根据已承诺的支持范围和真实调用方决定移除 |
| `mergeDrawnixSourceCoverage()` | maintainer 文档和测试仍引用 | 先将已知引用迁移到 `enrichDrawnixSourceCoverage()` |
| `rewriteLegacyTrailingDoubleDashArrow` | 未记录仓库调用方 | 核对已声明的支持接口；只有存在该契约时才要求弃用窗口 |
| `runCircuitikzRepairLoop()` | focused tests 和 maintainer acceptance 文档消费该 SDK | 继续 maintainer-only；绝不接入普通生成 fallback |
| `stripWrappingDoubleQuotes()` / `stripWrappedQuotedLabel()` | `legacyFixerUtils.ts` 中字节相同的私有实现 | 作为未来小幅 shrink 候选；延后到独立的行为保持变更 |

持久化设置 ID、command ID、artifact schema 仍必须有明确迁移纪律。私有 TypeScript re-export 不自动需要对外 sunset 流程。当前文档测试还锁定了旧审计措辞，后续应验证契约和引用，不应冻结工程判断。本轮不删除兼容代码。

## 有序推进计划

### 下一补丁：操作正确性与 PR 验证

1. 一次运行拥有统一取消生命周期：首次 timer 前取消也要结束队列；子任务读取实时取消状态；可取消传输收到实际生效的 signal；观察到取消后不再启动新的写入／移动。
2. 在持久化责任方串行化重叠 artifact 写入。只恢复仍归属于失败操作的写入；回滚冲突／失败必须连同恢复证据上报。补偿不等于多文件崩溃原子性。
3. 建立不依赖密钥的 PR 构建／测试工作流，以及 lint 基线约束。发布操作继续仅由 tag 触发。

退出门禁：四项已复现异常变为验证正确行为的回归用例；Linux／Windows 检查实际运行；原有全量测试、构建、i18n、打包门禁保持通过。这些是建议实施的修复，不是本次已完成工作。

### 后续切片：证据质量与实测预算

1. 将 gallery PNG 资产身份校验与视觉保真度分开；移除冻结审计结论的测试断言。
2. 在明确的 Obsidian 版本和设备上测量启动、冷／热预览延迟与内存。manifest 允许移动端并声明 `minAppVersion: 0.15.0`；mock 不能证明整个支持范围。
3. 只有测量支持 runtime 隔离时，才同时变更 build／loader／release／audit／host 证据；否则以明确的保持内联决定关闭调查。
4. 目标应用可用时，逐 target 补导入／编辑／重开证据。consumer 证据缺失只限制相应能力声明。

退出门禁：每份证据记录输入版本、环境、哈希、适用范围和失败状态；不对无关工作施加统一的打包前置条件。

### 产品深化：优先检索质量，导出需求明确时推进 Office 保真度

1. 扩展已有词法检索语料，覆盖独立留出集、多语言、低信号查询与变化中的 Vault。先测质量和上下文成本，再决定持久索引或 embedding。
2. 对指定的 Office renderer 改善 PPTX 字体／表格／基线，同时保留明确的 Mermaid／SVG fallback。
3. Provider 和 locale 通过共享 metadata 维护。新增 engine 必须有明确未满足用例、有界 runtime 与 consumer 契约。

责任边界、替代方案、依赖、测试路径及停止条件见[实施计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md)。

## 风险控制

- 为向前兼容保留 unknown 字段，但 required 字段和已知类型在边界处 fail closed。
- Cache 只是优化，不是 artifact identity 或正确性 authority。
- Provider discovery 保持有界并面向生成；不要把 embedding/reranker/speech 条目展示成 generation model。
- Real-Vault `passed` 只表示一次 provider/environment 运行，不证明所有 provider、theme 或移动端 host。
- 网站构建通过只证明 route/build 完整性，不证明部署后的 Search Console 或 AI-answer visibility。

## 决策

优先处理取消、artifact 持久化和 PR 验证。主约束是失败与取消时保护用户成果，不是缺少图表类型。优化和外部能力扩展必须有实测依据；不要让假想调用方或宽泛架构偏好成为永久阻塞项。
