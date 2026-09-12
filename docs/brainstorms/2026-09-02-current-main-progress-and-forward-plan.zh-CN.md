---
date: 2026-09-02
last_updated: 2026-09-13
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

[计划进度登记表](../maintainer/project-plan-status.zh-CN.md) 逐项核对了已有的 19 份正式计划、32 份 brainstorming 记录及相关维护者工作线。[可靠性与证据推进计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md)与[验收记录](../maintainer/reliability-acceptance-2026-09-12.zh-CN.md)负责 9 月 12–13 日的实现和测量。本文继续作为当前进度入口；此前的真值收敛仍是已完成的历史切片。

## 总体判断

`main@7638cec` 的审计在既有测试全绿时仍发现四项操作生命周期缺陷。当前实现已保证取消队列结束、实时取消贯通五种传输、重叠保存不会互相回滚。新增故障调度回归和真实 Obsidian 1.13.7 取消／写冲突探针验证了修正后的行为。版本仍为 `1.9.7`，本批属于未发布主线变更，不是新 Release。

Linux／Windows 验证和 lint 约束已建立，远端验收由链接的执行记录维护。保持单入口 `main.js` + 内联 `srcdoc`：桌面激活／预览／堆占用实测满足暂定预算。检索快照语义、PowerPoint 原生表格绘制、Circuitikz 连线与标签也在有界范围内得到改善。新增 renderer、通用事务／索引框架的优先级继续低于这些可测结果。

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

[验收记录](../maintainer/reliability-acceptance-2026-09-12.zh-CN.md)与[测量 JSON](../maintainer/evidence/2026-09-12/verification.json)负责精确测试数量、bundle 哈希和 consumer 版本。本地环境为 Windows x64／Node 22.19.0，新 CI 矩阵使用 Linux／Windows Node 20。构建、全量 Jest、lint 新增诊断、i18n／render-host、gallery／examples、两套文档构建的结果及范围统一记录于该处。

- 取消覆盖派发前、重试／传输中和响应迟到后；真实桌面 HTTP 与非桌面 fetch 集成测试补充 mock。
- Artifact 失败会保留竞争编辑、报告恢复失败，并保证 Vault 输出队列可继续使用。原子文本补偿使用 `Vault.process`，旧 host 接收恢复副本。
- 33 条 gallery 已检查已提交 PNG 哈希和规范化 SVG 内容。33 条真实 Vault 示例继续作为归档 provider 证据，本轮没有付费生成刷新。
- 真实 Obsidian 1.13.7：激活 p95 289.3 ms，密集 Mermaid p95 120 ms；两组各 30 次预览的堆占用为 62.92 → 66.30 → 66.58 MB。30 次移动端模拟通过；物理移动设备和 0.15.0 未验证。
- diagrams.net、Drawnix、Tectonic／Circuitikz、PowerPoint 均有明确应用／compiler 记录。Drawnix 跨枝连线附着失败；编译结果另经 PDFium 视觉复核。
- 原始全局 lint 债务为 231 个 error／1374 个 warning。按诊断比较的门禁阻止新增 error 和选定正确性 warning，不宣称已清空全局债务。

本地 `1.9.7` tag 仍为 `ef77788`。本批不改变版本元数据或远端 Release 资产。分支保护是独立管理设置；工作流存在不代表管理员所有 push 都被强制门禁。网站 CI 的 Node 24 与本地 Node 22、插件 CI 的 Node 20 仍是不同环境。

## 计划状态矩阵

| 计划族 | 当前 main 状态 | 实际剩余工作 |
|---|---|---|
| Provider 扩展各轮 | 已交付 / 历史 | 上游 API 变化时保持 metadata、discovery、文档和测试同步。 |
| Language Support 多阶段 | 已交付 / 历史 | 没有剩余实现阶段；保持 Codex 离线发布翻译策略。 |
| 主线稳定化与 CI 加固 | 发布侧与 PR／main 验证已实现 | 维护 Linux／Windows 锁定安装、两种 Chromium revision、lint 新增诊断证据，以及独立的 tag 发布。 |
| CLI operation 抽取与 registry 加固 | registry／host 抽取和有界生命周期修复已交付 | 29 个 operation 不等于 29 个 public-safe API；变更契约升级仍需具体调用方与契约。 |
| 图表渲染路线图 | 核心已交付；保持内联的测量完成 | 桌面预算通过，物理移动设备／最旧 host 未验证；新增引擎和打包隔离需实测理由。 |
| Vault 历史、设置导航、批处理文件夹 | 有限范围及操作可靠性已交付 | history 与 artifact 写入各有责任方；artifact 重叠串行化限定于单个 Vault，不是跨进程／崩溃 ACID。 |
| 图表预览/历史自适应 | modal 架构已交付 | focus-trapped 内部 drawer 是新的交互系统变更，不是未修复 bug。 |
| Mermaid 规范化合并 | Phase 0-3 已交付 | 删除兼容导出前先盘点调用方；unknown family 继续采用 parser-backed 保守准入。 |
| 图表能力目录与向前架构 | runtime 基础及逐 target consumer 评估已交付 | diagrams.net 通过；Drawnix 节点往返通过，但跨枝箭头不附着；逐项限制支持声明。 |
| 参考扩展 | 已完成 | 33 个可执行行、有界 payload、确定性 adapter、preview/gallery/docs 门禁全部通过。 |
| 真实 Vault 图表示例 | 历史证据集已完成 | 相关输入／runtime 变化时有意识地刷新；哈希校验不等于重跑 provider，更不证明所有 host。 |
| Local KB 与 Chapter Split | 有界设计及快照／评估质量线已交付 | 固定合成语料 Top-3 正例召回 7/9，宏平均精度 51.9%；未来中文／排序改动须使用新的验证划分。 |
| Slidev 可编辑 PPTX | 有界表格绘制保真质量线已交付 | PowerPoint 16 编辑／保存／重开及既有 visible-native 门禁通过；字体、基线、raster-strict 保真仍是独立后续项。 |
| GEO/GitHub Pages/release | 运行上已交付 | Search Console 与 AI visibility 仍需部署后的外部证据。 |

旧计划保留 checkbox 与历史理由用于追溯。每份计划的处置及证据归属见[计划进度登记表](../maintainer/project-plan-status.zh-CN.md)。历史 TDD 步骤未勾选或文档任务已完成，都不能单独决定当前运行时可靠性。

## 证据与非声明

| 边界 | 证据 | 允许的声明 |
|---|---|---|
| Mermaid | canonical normalizer、35-stage legacy registry、family gate、幂等测试、runtime SVG safety | 已交付且保守兼容 legacy 的 Mermaid 路径 |
| Native editable SVG | 确定性 renderer、layout diagnostics、Chromium gallery gate、33 组 fixture 资产 | 在已测试 host/presentation 契约下交付 native family 预览 |
| Drawnix | `9939f452` 的真实应用、Plait 0.93.1、原生编辑／保存／重开 | 38 节点／1 根及语义关系记录保留；重排后静态箭头脱离，`drawnix-static-cross-relations` 明确报告 |
| Draw.io | diagrams.net 31.4.5 导入／编辑／下载／重开 | 记录的 fixture 保留 3 个原生顶点、2 条边 |
| Circuitikz | Tectonic 0.16.9／Circuitikz 1.4.6、6 个模板和 5 个方向变体、PDFium 复核 | 有界模板可读且拓扑保持；compiler 可用性／包版本仍需明确 |
| Render host | 内联 `srcdoc`、bundle 审计、真实 Obsidian 1.13.7 耗时／堆占用对照 | 在实测桌面预算内保持内联；不推广到物理移动设备／最旧 host |
| Local KB | 固定 13 查询语料、batch 不可变快照测试、65 次真实 Vault 重建 | 词法检索有实测且快照陈旧语义明确；不保证语义检索质量 |
| Slidev/PPTX | PowerPoint 16 build 14332、10 页幻灯片、原生表格编辑／保存／重开 | 有界原生可编辑性与改善的表格绘制；字体仍不同于 Chromium，几何 fallback 仍是图片 |

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

持久化设置 ID、command ID、artifact schema 仍必须有明确迁移纪律。私有 TypeScript re-export 不自动需要对外 sunset 流程。U4 已移除锁定旧审计结论的断言，同时保留源码数量、双语链接和目录契约验证。本批不删除兼容 API。

## 有序推进计划

9 月实施单元及验收边界见[计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md)。下表是后续独立定界的决策，不是 U1–U8 中尚未执行的微步骤。

| 优先级／责任方 | 下一项具体问题 | 验收与停止条件 |
|---|---|---|
| Host 生命周期／render host | 开发期间反复热重载的内存残留，能否在正常启用／禁用中复现？ | 用新 Vault 对照隔离 renderer 复用／listener 归属；只修已复现的生命周期泄漏，稳定的普通预览路径不支持重写 asset loader。 |
| 支持边界／host 验证 | 取消、恢复、预览契约是否适用于物理移动设备和最旧的目标 Obsidian 版本？ | 在受支持环境运行带 disposable-Vault 标记的 harness，记录设备／host／API 可用性；只有明确兼容性证据才调整支持元数据。 |
| 检索责任方 | 中文分词、导航抑制或词法排序能否在精度／上下文预算内提高召回？ | 使用新的验证划分，与固定 13 查询报告比较；保留 batch 快照复用。embedding 需语义缺口及隐私／存储／安装预算支持。 |
| 原生导出责任方 | 上游是否具备 Mind 节点附着式可编辑跨枝连线？ | 必须有真实 Drawnix 节点移动／保存／重开证据；此前用 SVG 保留连接视觉，或采用既有支持边绑定的 native target，不能把 metadata 改名为不受支持的 handle。 |
| Office 导出责任方 | 剩余字体／基线漂移中，哪类实际影响可编辑演示？ | 固定 Office／字体集，一次修一个可测缺陷族，保留前后渲染和 fallback 归属；维持 visible-native 阈值，不宣称像素等价。 |

维护锁定依赖及两种浏览器 revision 的 CI。分支保护属于仓库策略，不能从 YAML 通过推断。Provider／locale 继续通过共享 registry 维护，新增 engine 需未满足用例和有界 consumer 契约。

## 风险控制

- 为向前兼容保留 unknown 字段，但 required 字段和已知类型在边界处 fail closed。
- Cache 只是优化，不是 artifact identity 或正确性 authority。
- Provider discovery 保持有界并面向生成；不要把 embedding/reranker/speech 条目展示成 generation model。
- Real-Vault `passed` 只表示一次 provider/environment 运行，不证明所有 provider、theme 或移动端 host。
- 网站构建通过只证明 route/build 完整性，不证明部署后的 Search Console 或 AI-answer visibility。

## 决策

9 月可靠性工作确立了操作归属并增强了验收证据。保持实测支持的内联架构，保留 consumer 能力限制，从已观察到的失败或新用户需求选择下一项变更。实现单元完成、结构检查通过、应用能力成立仍是不同结论。
