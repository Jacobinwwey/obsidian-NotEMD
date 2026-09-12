---
date: 2026-09-12
last_updated: 2026-09-12
status: current
canonical_for: plan-disposition
audit_commit: 7638cec
---

# 项目计划进度与工程评估

语言：[English](./project-plan-status.md) | **简体中文**

[当前进度记录](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md) 负责验证快照，本文负责每份计划的状态处置，[下一步实施计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md) 负责建议工作。历史 checklist 保留为意图记录，不再形成另一套当前 backlog。

## 审计范围与判断

审计本地 `main@7638cec`、插件 `1.9.7`，开始时工作区干净。本地发布 tag 为 `1.9.7@ef77788`；其后到本次基线的变更涉及文档及文档测试，生产 runtime 未变化。本轮不包含远端 fetch、真实 provider 生成、部署、应用导入、Office 渲染、提交或发布。

覆盖 `docs/plans/` 与 `docs/superpowers/plans/` 中全部 **19 份既有英文正式计划／设计记录**及中文配对文档、全部 **32 份 brainstorming 记录**、相关维护者计划、运行时 registry、高风险执行／持久化路径、构建测试配置和发布工作流。历史记录按范围与实现证据核对，不倒放或盲目勾选原来的微步骤。新建的 9 月 12 日计划不计入上述 19 份历史清单。

项目已实现的广度很大：36 个 provider preset、29 个 operation 定义、33 个可执行图表行、8 个 render target，以及词法检索、章节拆分、持久历史、Slidev／PPTX 导出。值得保留的架构决策是按 transport 调度 provider、`DiagramSpec` 加确定性目标投影，以及明确的 fallback／报告边界。主要不足是操作生命周期正确性，以及用来宣告完成的证据强度。

不提供全项目完成百分比。“有限范围已交付”“在当前环境验证通过”“被真实消费应用支持”是三个不同结论。

## 正式计划逐项登记

下表的“已交付”仅指有限功能范围；后面的开放缺陷仍适用于相应执行路径。

| ID | 计划 | 校准后状态 | 实现证据与剩余义务 |
|---|---|---|---|
| P01 | [03-26 AGENTS／provider 扩展](../superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md) | 已交付；历史 | `llmProviders.ts`、豆包校验、provider transport 测试均已存在。维护 metadata／runtime／docs 一致，不另起一轮抽取工程。 |
| P02 | [03-26 中国 provider 第二轮](../superpowers/plans/2026-03-26-china-provider-expansion-round2.zh-CN.md) | 已交付；历史 | Qwen Code、Z AI、Huawei preset 使用共享 transport。上游模型／API 变化属于持续维护，不是未完成的发布阶段。 |
| P03 | [04-09 语言支持](../superpowers/plans/2026-04-09-language-support-first-principles-multiphase.zh-CN.md) | 声明的 locale 范围已交付 | UI locale 与任务语言策略已分离；21 个插件 locale 不等于 34 个网站 locale。key／fallback 测试不证明翻译质量或所有设备。 |
| P04 | [04-14 图表平台路线图](../superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md) | 核心已交付；路线图部分完成 | spec、adapter、registry、cache、host、export 均存在。Task 0 打包隔离有条件推进；Task 2 保留兼容路径；Task 3 仍保留 legacy 修复主体。并不自动产生新增 engine 的义务。 |
| P05 | [05-03 主线稳定化](../superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md) | 有限批次已交付 | 命令收敛、语义验证工具、打包审计、发布辅助已落地。旧文档“Drawnix 未来 adapter”已属历史；发布侧 CI 不等于 PR CI。 |
| P06 | [05-04 CLI 抽取](../superpowers/plans/2026-05-04-notemd-cli-operation-extraction.zh-CN.md) | 抽取已交付；广泛公开延后 | registry、host adapter、调用契约、有界维护者调用已存在。`publicCliSurface.ts` 仍筛选安全子集；29 个定义不等于公开自动化接口。 |
| P07 | [05-05 笔记处理 registry 加固](../superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.zh-CN.md) | registry 已交付；副作用加固部分完成 | Task 1 registry、Task 3 host 抽取已实现。取消仍能继续写入／移动时，不能宣称 Task 2 已完全稳健；该缺口由 U1 承接。 |
| P08 | [07-11 历史／设置／批处理文件夹设计](../plans/2026-07-11-vault-history-settings-navigation-batch-folder-design.zh-CN.md) | 已交付，UI 已调整 | repository-backed history、稳定设置目录／导航、显式文件夹准备已存在。实际分类选择器取代了原先的大型分类栏。 |
| P09 | [07-11 历史／设置／批处理文件夹实施](../superpowers/plans/2026-07-11-vault-history-settings-navigation-batch-folder.zh-CN.md) | 已交付 | 历史中 29 个勾选步骤描述此功能范围。history repository 的串行化不会保护其他位置的 artifact 文件写入。 |
| P10 | [07-19 自适应预览／历史设计](../plans/2026-07-19-diagram-popup-adaptive-history-design.zh-CN.md) | 已按 modal 架构交付 | 共享 `DiagramHistoryView`、响应式控件、预览／历史入口已存在。内部 focus-trapped drawer 属于另一项交互变更。 |
| P11 | [07-19 自适应预览／历史实施](../superpowers/plans/2026-07-19-diagram-popup-adaptive-history.zh-CN.md) | 已交付，替代决定有记录 | 旧“drawer”步骤应按已交付的 modal 决策解读；不能据勾选措辞重启项目或宣称内部 drawer 已交付。 |
| P12 | [08-03 路由／源视觉／DPI](../plans/2026-08-03-drawnix-routing-visuals-dpi-design.zh-CN.md) | 已交付，后续契约已细化 | 源视觉、限定 companion、原生路由和 DPI 已存在。多文件回滚仅为补偿；U2 承接已复现的并发回滚问题。 |
| P13 | [08-14 目录／Drawnix 交付设计](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.zh-CN.md) | 已取代；否决方案 | 不恢复 document-tree／full-board／presentation 模式或保存前 replay 校验。P14 是替代契约。 |
| P14 | [08-14 目录／Drawnix 实施记录](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.zh-CN.md) | 替代方案已交付 | 文件名根节点的原生树、层级保留、外侧关系通道已存在。真实 Drawnix 应用互操作仍未在此得到证明。 |
| P15 | [08-15 Mermaid 合并](../plans/2026-08-15-mermaid-normalization-consolidation.zh-CN.md) | Phase 0–3 已交付 | canonical normalization、共享围栏、35 个有序修复阶段、family gate、runtime 初始化已有测试。并非已彻底移除 legacy grammar；内部 alias 需先界定支持范围。 |
| P16 | [08-16 能力目录／后续架构](../superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.zh-CN.md) | 本地基础已交付；外部验收开放 | catalog／target／export 三轴、fixture、gallery、docs 均已实现。应用与 compiler 门禁仍是各 target 独立的验收义务。 |
| P17 | [08-21 参考扩展](../superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md) | 已交付 | 33 个可区分 variant 的行、有界 payload family、确定性原生布局已存在；5 种精确参考 grammar 有意未进入执行目录。 |
| P18 | [08-29 真实 Vault 示例](../superpowers/plans/2026-08-29-diagram-examples-implementation.zh-CN.md) | 历史证据集已交付 | 33 条记录、双语输入、产物、机器报告通过归档检查；本轮没有重跑对应 LLM／Vault 会话。 |
| P19 | [09-02 真值收敛](../superpowers/plans/2026-09-02-current-main-truth-convergence.zh-CN.md) | 历史文档切片已完成 | 对应进度入口继续原位维护。新缺陷修订置信度与优先级，不改写原来的执行历史。 |

`docs/superpowers/specs/` 中 4 份上游设计分别映射 P01、P02、P17、P18。它们是需求／设计来源，不额外计为 4 个独立交付项目。

## Brainstorming 与进度记录登记

以下 32 份记录保留历史推理。专题文档可以继续定义子系统范围，但旧全局矩阵不再决定当前优先级。

| ID | 记录 | 当前处置 |
|---|---|---|
| B01 | [04-14 图表第二阶段](../brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md) | 核心需求已实现；条件性剩余项归 P04。 |
| B02 | [05-01 LLM 兼容／进度](../brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.zh-CN.md) | 历史 transport／token 基线；R2／R3 限定当前可靠性判断。 |
| B03 | [05-02 进度审计](../brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md) | 历史快照，旧数字和任务顺序不作为当前 backlog。 |
| B04 | [05-03 Drawnix 可行性](../brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md) | 后续已交付原生导出；完整应用嵌入仍延后。 |
| B05 | [05-03 稳定化／CI 需求](../brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.zh-CN.md) | 有界发布侧范围已交付；PR CI 仍缺失。 |
| B06 | [05-04 CLI 可扩展性](../brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.zh-CN.md) | 已实现到 P06 的有界契约深度。 |
| B07 | [05-05 CLI 主线同步](../brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.zh-CN.md) | 历史同步记录；保留的契约升级边界仍有效。 |
| B08 | [05-05 高写入量契约](../brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.zh-CN.md) | 副作用归属已改善；取消／持久化验收仍部分完成。 |
| B09 | [05-07 CLI 下一阶段](../brainstorms/2026-05-07-cli-next-phase-planning.zh-CN.md) | 抽取大部分已交付；不接受将打包变为无关工作的全局前置条件。 |
| B10 | [05-08 打包／语义收敛](../brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.zh-CN.md) | 内联发布边界和语义验证已实现；独立 runtime 有条件推进。 |
| B11 | [05-10 多入口候选](../brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.zh-CN.md) | 候选未发布；激活前由 U5 给出实测理由。 |
| B12 | [05-11 文件夹过滤](../brainstorms/2026-05-11-folder-task-file-filtering-progress-and-architecture-alignment.zh-CN.md) | named profile、glob／regex、路径范围、operation override 已交付。 |
| B13 | [05-12 发布 chronicle CI](../brainstorms/2026-05-12-release-chronicle-ci-hardening-progress-and-architecture-alignment.zh-CN.md) | 发布辅助／锁范围已交付；chronicle 作业仍串行。 |
| B14 | [05-12 侧栏／API 可观测性](../brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.zh-CN.md) | 活动／反馈 UI 已交付；活动统计不代表取消正确性。 |
| B15 | [05-13 主线 1.8.9](../brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.zh-CN.md) | 历史发布／恢复基线。 |
| B16 | [05-20 统一矩阵](../brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md) | 全局执行权威已由 B32 和本文取代。 |
| B17 | [05-24 强制改写审计](../brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.zh-CN.md) | 历史恢复记录；不根据 backup branch 状态推断当前功能缺失。 |
| B18 | [05-25 恢复后审计](../brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.zh-CN.md) | 旧全局快照已取代；恢复的功能已在本次主线存在。 |
| B19 | [05-27 Provider 设置／发现](../brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.zh-CN.md) | 有界实现已交付；发现信息仍瞬态，手动 model 选择仍是权威。 |
| B20 | [05-28 主线／下一层次](../brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md) | 旧全局快照已取代；不再维持另一套 packaging-first 顺序。 |
| B21 | [06-09 章节拆分／TOC](../brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md) | 标题感知拆分、稳定引用、受控 managed rerun 已交付；不构成通用 Vault 事务保证。 |
| B22 | [06-09 RAG 质量／执行](../brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md) | 执行模型已实现；评估深度由 U7 继续推进。 |
| B23 | [06-09 检索决策](../brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md) | 词法、进程内、无 embedding 的边界继续作为基线。 |
| B24 | [06-20 Slidev 布局／canvas](../brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md) | 布局／审计基线已交付；B25 承接后续 PPTX 保真工作。 |
| B25 | [06-21 可编辑 PPTX](../brainstorms/2026-06-21-slidev-editable-pptx-progress-and-next-direction.zh-CN.md) | 文本／表格／有限形状已交付；Office 往返质量部分完成。 |
| B26 | [07-02 CI／GEO／CLI／Slidev 收尾](../brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.zh-CN.md) | 历史有限范围已收尾；外部部署观察与后续 Office 保真度分开推进。 |
| B27 | [07-04 参考／figure 生成](../brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md) | P16／P17 已交付原生目录和 figure 扩展；精确参考 grammar 与新 engine 仍限定范围。 |
| B28 | [07-22 Drawnix 质量／交付](../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.zh-CN.md) | 已实现并由 P14 细化；不恢复已否决的交付模式矩阵。 |
| B29 | [08-08 图表／设置完整性](../brainstorms/2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.zh-CN.md) | 有限加固范围已交付；R4 阻止将其解释为通用事务安全。 |
| B30 | [08-14 presentation 架构审查](../brainstorms/2026-08-14-drawnix-presentation-architecture-review.zh-CN.md) | 已取代／否决的架构；保留为反面设计经验。 |
| B31 | [08-16 主线图表审计](../brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.zh-CN.md) | 已明确由 B32 取代；后续 geometry／presentation 修复仍已实现。 |
| B32 | [09-02 当前主线](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md) | 当前摘要，9 月 12 日更新，优先操作可靠性。 |

## 维护者工作线与外部验收

| 工作线 | 当前实现 | 开放的验收边界 |
|---|---|---|
| [Circuitikz 路线图](./circuitikz-figure-generation-roadmap.zh-CN.md)及[原型](./circuitikz-export-prototype.zh-CN.md) | 6 个确定性模板、拓扑签名、编译诊断、render smoke、单次 repair SDK | SDK 仅供维护者使用，普通生成没有 caller。真实 repair 命令是可选新范围；compiler CI 与路径字形可读性需独立证据。 |
| [07-19 托管 Circuitikz／runtime／历史](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.zh-CN.md) | 可选固定版本 Tectonic 安装、完整性／staging／回滚、桌面惰性加载、历史滚动修复 | 有历史真实 host 验收；本轮不重装、不重编译。保留移动端无该依赖的路径。 |
| [07-10 Circuitikz UI／导出／文档](./circuitikz-ui-export-and-docs-sync-2026-07-10.zh-CN.md) | 源格式 UI、导出和双语文档已交付 | 维护各 target 的支持范围；compiler 不保证普遍可用。 |
| [07-19 生成链路／MDX](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.zh-CN.md) | 生成／导出链路及网站策略已有文档和实现 | 区分 source、preview 和真实外部 consumer 声明。 |
| [07-11 历史／设置进度](./vault-history-settings-navigation-progress-2026-07-11.zh-CN.md) | P08／P09 功能范围已交付 | 更复杂 retention 或文件夹变更策略需要额外明确范围。 |
| [Standalone 验收](./slidev-standalone-acceptance-2026-06-18.zh-CN.md)、[PPTX 验收](./slidev-editable-pptx-acceptance-2026-06-21.zh-CN.md)、[导出门禁](./slidev-export-workflow.zh-CN.md) | standalone 导出、可见可编辑文本／表格有历史真实笔记证据 | Office 字体、单元格基线、段落布局、文档重开是 U8 的可测缺口。 |
| [Draw.io 视觉回归](./drawio-export-visual-regression.zh-CN.md) | serializer／XML 契约 | 真实 diagrams.net 打开／编辑／保存／重开证据仍缺。 |
| [Drawnix spike](./drawnix-export-spike.zh-CN.md) | serializer，加本轮归档示例的 Plait public-API 检查：38 节点、12 关系、1 根 | `createBoard`／类型识别不是 Drawnix 应用导入或原生视觉布局测试。 |
| [GEO 测量记录](./github-pages-geo-measurement-log.zh-CN.md) | 34 个网站 locale 的新鲜本地构建／审计，加历史部署观察 | Search Console 收录与 AI 回答可见性需要有日期的外部观察，构建通过不能提供。 |
| [发布流程](./release-workflow.zh-CN.md) | 数字 tag、双语说明、4 项必要资产、串行 chronicle 已实现 | 未检查当前远端资产／分支保护；PR CI 是仓库中另一项缺失工作流。 |

## 已复现缺陷与验证缺口

R1–R4 针对生产函数复现，未改变跟踪中的源码。虚拟时钟与内存 Vault／HTTP 边界使调度确定，避免触碰用户笔记或发出网络请求。本地探针／报告位于 `.cache/plan-audit-2026-09-12/`；下述机制和后续回归路径足以重新验证，不要求依赖该本地目录。

| ID | 优先级 | 证据与实测机制 | 必须达到的结果 |
|---|---|---|---|
| R1 | P1 | `utils.ts#createConcurrentProcessor`：排定任务后、首次 timer 前取消；所有 timer 跳过主体，没有 worker 负责 resolve 外层 Promise。探针观察到任务执行数为 0、剩余 timer 为 0，但 Promise 未结束。 | U1：即使没有 worker 启动，取消也必须进入终态。 |
| R2 | P1 | `fileUtils.ts#batchGenerateContentForTitles`：子 reporter 复制 `cancelled` 与 `abortController`。让两个 LLM 请求挂起，取消父任务，再返回响应；子任务仍读到 `false`，两份笔记都被修改并移动，而 batch 返回 cancelled。 | U1：实时共享的取消生命周期到达每个子任务；迟到结果不能启动写入／移动。 |
| R3 | P1 | `llmUtils.ts#getAbortSignal` 创建并保存 controller，但 provider executor 只解构 `controller`，向下传原始可选 `signal`。调用方未提供 signal 时，取消 reporter 不会触发模拟桌面请求的 `destroy`；直到响应迟到才拒绝。 | U1：所有可取消传输收到实际生效的 signal；准确描述不可取消 host 调用的限制。 |
| R4 | P1 | `fileUtils.ts#saveDiagramArtifactFile`：A 快照并更新文件，在 wrapper 写入处暂停；B 对同路径保存成功；A 的 wrapper 失败，其无条件回滚用旧字节覆盖 B。回滚错误还可能被吞掉。 | U2：重叠写入有唯一归属，失败操作不能回滚别人的产物，恢复失败必须可见。 |
| R5 | P1 | `.github/workflows/` 只有 `release.yml` 与 `deploy-docs.yml`；前者在创建 tag 后才跑插件测试。远端分支保护状态未知。 | U3：PR 在合并／打 tag 前就能因插件回归失败，不依赖凭据或发布权限。 |
| R6 | P2 | `generate-diagram-gallery.js#verifyCommittedGallery` 比较 SVG 字节，但 PNG 只检查存在性／签名；`buildGalleryManifest` 仅记录 SVG 哈希。 | U4：资产完整性和视觉回归各自有明确证据；替换成另一张合法 PNG 必须导致完整性检查失败。 |
| R7 | P2 | `currentMainProgressDocsContract.test.ts` 断言“no production dependency that can be removed safely”等审计结论原文。 | U4：测试验证执行事实、链接／schema 覆盖；更新工程判断不需要保留已失效结论。 |
| R8 | P2 | 尚无启动／预览内存预算；manifest 允许移动端并声明 Obsidian `0.15.0`，本地测试 mock host API。 | U5：在作出打包或支持范围判断前，获取明确 host／设备证据与性能预算。 |

既有绿灯解释了盲区：`parallelBatch.test.ts` 的取消 getter 恒为 false；回滚测试检查 mock 调用而非竞争中的持久状态；transport 覆盖未确立默认 signal 的归属路径。保留已有测试，同时在真实接口接合处补行为级用例。

## 架构决策的保留与修正

| 决策 | 评估 | 实施方向 |
|---|---|---|
| Provider registry 加 5 类共享 transport | 保留 | 统一修正 signal／retry 归属，保留协议感知的流式处理和 partial diagnostics。preset 数量不作为主要进度指标。 |
| 语义 spec 加目标投影 | 保留 | 外部输入在准入边界验证，内部信任不变量；不再引入第二套语义／presentation 持久模型。 |
| 单一内联 render bundle | 等待测量期间保留 | `main.js` 为 10,056,115 字节，gzip 3,728,761 字节；这支持性能调查，不自动支持新增 loader／asset 系统。 |
| History repository 写队列 | 责任归属合理 | 将归属原则用于 artifact 持久化，不假设 history 队列会串行化别处文件写入。 |
| 快照式 artifact 回滚 | 并发保证不足 | 能补偿单次调用，但不是 ACID 存储；避免盲目恢复，也避免引入全项目事务框架。 |
| 词法 MiniSearch 检索 | 保留为基线 | 每次构建 retriever 都枚举候选、串行读文件并重建索引；批量标题生成已共享一个 retriever。先测语料／读取成本和 batch 内快照陈旧，再决定持久化。 |
| 兼容层保留 | 按承诺的支持面缩小范围 | 持久 schema 与 command ID 应有迁移窗口；私有源码 re-export 不因测试 import 就变成 public。 |
| 单纯缩小大文件 | 不作为独立目标 | `NotemdSettingTab.ts` 约 4.1k 行，`main.ts` 3.3k，`llmUtils.ts` 3.2k，`fileUtils.ts` 2.4k。只有具体不变量／依赖获得真正责任方时才抽取。 |

## 推进方向与完成规则

1. **下一补丁：** U1 取消、U2 持久化、U3 PR 验证。将 R1–R4 作为下一补丁的已知阻塞缺陷；本文没有修复其中任何一项。
2. **下一实测切片：** U4 证据完整性、U5 host／性能刻画。内联设计满足明确预算时，就关闭打包调查。
3. **条件性准入：** U6 按 target 补真实 consumer 门禁。外部工具不可用只限制相关能力声明，不阻塞无关正确性工作。
4. **产品深化：** 默认优先 U7 检索质量，因为能改善四类既有任务；导出需求或明确缺陷报告支持相应成本时选择 U8 Office 保真度，不同时启动无边界的功能扩张。

有限需求、实现、回归证据和文档一致时，计划才关闭。外部门禁必须有明确应用／工具版本及保留的产物。延后想法只有在具备用例、责任方、验收用例与维护预算时才重开。发布／历史记录保持日期；维护本文和当前进度摘要，不再叠加另一份竞争性的全局路线图。
