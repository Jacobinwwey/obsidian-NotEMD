---
date: 2026-09-12
last_updated: 2026-09-13
status: current
canonical_for: plan-disposition
audit_commit: 7638cec
---

# 项目计划进度与工程评估

语言：[English](./project-plan-status.md) | **简体中文**

[当前进度记录](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md)负责摘要，本文负责逐项计划处置，[实施计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md)与[验收记录](./reliability-acceptance-2026-09-12.zh-CN.md)负责 U1–U8 执行和证据。历史 checklist 保留为意图记录，不再形成另一套当前 backlog。

## 审计范围与判断

原文档审计从干净工作区检查 `main@7638cec`、插件 `1.9.7`。9 月 12–13 日的实施已关闭四项复现的运行时缺陷，并补充逐 target 的 host／应用／compiler 证据。发布 tag 仍为 `1.9.7@ef77788`，本批是未发布主线改善，不包含新 Release／tag 或付费 provider 示例重生成。

覆盖 `docs/plans/` 与 `docs/superpowers/plans/` 中全部 **19 份既有英文正式计划／设计记录**及中文配对文档、全部 **32 份 brainstorming 记录**、相关维护者计划、运行时 registry、高风险执行／持久化路径、构建测试配置和发布工作流。历史记录按范围与实现证据核对，不倒放或盲目勾选原来的微步骤。新建的 9 月 12 日计划不计入上述 19 份历史清单。

项目继续保留 36 个 provider preset、29 个 operation 定义、33 个可执行图表行、8 个 render target，以及词法检索、章节拆分、持久历史、Slidev／PPTX 导出。按 transport 调度、`DiagramSpec` 加确定性投影、明确 fallback 边界仍然合理。U1／U2 修复操作归属，U3／U4 加强回归门禁与证据完整性。剩余限制集中于具体 consumer／设备和可测质量，并非基础架构缺失。

不提供全项目完成百分比。“有限范围已交付”“在当前环境验证通过”“被真实消费应用支持”是三个不同结论。

## 正式计划逐项登记

下表的“已交付”仅指有限功能范围，后面的缺陷处置及 consumer 限制进一步限定验收结论。

| ID | 计划 | 校准后状态 | 实现证据与剩余义务 |
|---|---|---|---|
| P01 | [03-26 AGENTS／provider 扩展](../superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md) | 已交付；历史 | `llmProviders.ts`、豆包校验、provider transport 测试均已存在。维护 metadata／runtime／docs 一致，不另起一轮抽取工程。 |
| P02 | [03-26 中国 provider 第二轮](../superpowers/plans/2026-03-26-china-provider-expansion-round2.zh-CN.md) | 已交付；历史 | Qwen Code、Z AI、Huawei preset 使用共享 transport。上游模型／API 变化属于持续维护，不是未完成的发布阶段。 |
| P03 | [04-09 语言支持](../superpowers/plans/2026-04-09-language-support-first-principles-multiphase.zh-CN.md) | 声明的 locale 范围已交付 | UI locale 与任务语言策略已分离；21 个插件 locale 不等于 34 个网站 locale。key／fallback 测试不证明翻译质量或所有设备。 |
| P04 | [04-14 图表平台路线图](../superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md) | 核心已交付；路线图部分完成 | spec、adapter、registry、cache、host、export 均存在。Task 0 打包隔离有条件推进；Task 2 保留兼容路径；Task 3 仍保留 legacy 修复主体。并不自动产生新增 engine 的义务。 |
| P05 | [05-03 主线稳定化](../superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md) | 有限批次已交付 | 命令收敛、语义验证工具、打包审计、发布辅助已落地。旧文档“Drawnix 未来 adapter”已属历史；发布侧 CI 不等于 PR CI。 |
| P06 | [05-04 CLI 抽取](../superpowers/plans/2026-05-04-notemd-cli-operation-extraction.zh-CN.md) | 抽取已交付；广泛公开延后 | registry、host adapter、调用契约、有界维护者调用已存在。`publicCliSurface.ts` 仍筛选安全子集；29 个定义不等于公开自动化接口。 |
| P07 | [05-05 笔记处理 registry 加固](../superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.zh-CN.md) | registry 与有界生命周期加固已交付 | U1 通过实时子任务状态、传输中断及真实 host 证据关闭已复现的取消后变更路径；不可中断的服务端工作、已开始的写入仍有明确边界。 |
| P08 | [07-11 历史／设置／批处理文件夹设计](../plans/2026-07-11-vault-history-settings-navigation-batch-folder-design.zh-CN.md) | 已交付，UI 已调整 | repository-backed history、稳定设置目录／导航、显式文件夹准备已存在。实际分类选择器取代了原先的大型分类栏。 |
| P09 | [07-11 历史／设置／批处理文件夹实施](../superpowers/plans/2026-07-11-vault-history-settings-navigation-batch-folder.zh-CN.md) | 已交付 | 历史中 29 个勾选步骤描述此功能范围。history repository 的串行化不会保护其他位置的 artifact 文件写入。 |
| P10 | [07-19 自适应预览／历史设计](../plans/2026-07-19-diagram-popup-adaptive-history-design.zh-CN.md) | 已按 modal 架构交付 | 共享 `DiagramHistoryView`、响应式控件、预览／历史入口已存在。内部 focus-trapped drawer 属于另一项交互变更。 |
| P11 | [07-19 自适应预览／历史实施](../superpowers/plans/2026-07-19-diagram-popup-adaptive-history.zh-CN.md) | 已交付，替代决定有记录 | 旧“drawer”步骤应按已交付的 modal 决策解读；不能据勾选措辞重启项目或宣称内部 drawer 已交付。 |
| P12 | [08-03 路由／源视觉／DPI](../plans/2026-08-03-drawnix-routing-visuals-dpi-design.zh-CN.md) | 已交付；持久化已加强 | U2 串行化重叠路径，仅恢复仍有归属的文本；冲突／二进制／新建输出保留恢复证据，旧 companion 目录不再盲目删除。 |
| P13 | [08-14 目录／Drawnix 交付设计](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.zh-CN.md) | 已取代；否决方案 | 不恢复 document-tree／full-board／presentation 模式或保存前 replay 校验。P14 是替代契约。 |
| P14 | [08-14 目录／Drawnix 实施记录](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.zh-CN.md) | 替代方案已交付；consumer 限制已测量 | 真实 Drawnix 编辑／保存／重开保留 38 个原生节点／1 根及语义关系；静态跨枝箭头在原生重排后脱离，renderer 已报告限制。 |
| P15 | [08-15 Mermaid 合并](../plans/2026-08-15-mermaid-normalization-consolidation.zh-CN.md) | Phase 0–3 已交付 | canonical normalization、共享围栏、35 个有序修复阶段、family gate、runtime 初始化已有测试。并非已彻底移除 legacy grammar；内部 alias 需先界定支持范围。 |
| P16 | [08-16 能力目录／后续架构](../superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.zh-CN.md) | 基础与逐 target 评估已交付 | diagrams.net 原生往返、固定版本 Circuitikz 编译／视觉复核通过；Drawnix 节点编辑通过，跨枝连线附着仍不支持。 |
| P17 | [08-21 参考扩展](../superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md) | 已交付 | 33 个可区分 variant 的行、有界 payload family、确定性原生布局已存在；5 种精确参考 grammar 有意未进入执行目录。 |
| P18 | [08-29 真实 Vault 示例](../superpowers/plans/2026-08-29-diagram-examples-implementation.zh-CN.md) | 历史证据集已交付 | 33 条记录、双语输入、产物、机器报告通过归档检查；本轮没有重跑对应 LLM／Vault 会话。 |
| P19 | [09-02 真值收敛](../superpowers/plans/2026-09-02-current-main-truth-convergence.zh-CN.md) | 历史文档切片已完成 | 对应进度入口继续原位维护。新缺陷修订置信度与优先级，不改写原来的执行历史。 |

`docs/superpowers/specs/` 中 4 份上游设计分别映射 P01、P02、P17、P18。它们是需求／设计来源，不额外计为 4 个独立交付项目。

## Brainstorming 与进度记录登记

以下 32 份记录保留历史推理。专题文档可以继续定义子系统范围，但旧全局矩阵不再决定当前优先级。

| ID | 记录 | 当前处置 |
|---|---|---|
| B01 | [04-14 图表第二阶段](../brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md) | 核心需求已实现；条件性剩余项归 P04。 |
| B02 | [05-01 LLM 兼容／进度](../brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.zh-CN.md) | 历史 transport／token 基线；U1 已补充完整操作的 signal／retry 归属。 |
| B03 | [05-02 进度审计](../brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md) | 历史快照，旧数字和任务顺序不作为当前 backlog。 |
| B04 | [05-03 Drawnix 可行性](../brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md) | 后续已交付原生导出；完整应用嵌入仍延后。 |
| B05 | [05-03 稳定化／CI 需求](../brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.zh-CN.md) | 发布侧范围已交付；U3 新增 PR／main Linux／Windows 检查和 lint 约束。 |
| B06 | [05-04 CLI 可扩展性](../brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.zh-CN.md) | 已实现到 P06 的有界契约深度。 |
| B07 | [05-05 CLI 主线同步](../brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.zh-CN.md) | 历史同步记录；保留的契约升级边界仍有效。 |
| B08 | [05-05 高写入量契约](../brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.zh-CN.md) | U1／U2 关闭已复现的取消／持久化失败；不宣称跨进程／崩溃原子性。 |
| B09 | [05-07 CLI 下一阶段](../brainstorms/2026-05-07-cli-next-phase-planning.zh-CN.md) | 抽取大部分已交付；不接受将打包变为无关工作的全局前置条件。 |
| B10 | [05-08 打包／语义收敛](../brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.zh-CN.md) | 内联发布边界和语义验证已实现；独立 runtime 有条件推进。 |
| B11 | [05-10 多入口候选](../brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.zh-CN.md) | 候选未发布；U5 已用实测支持的保持内联决定关闭调查。 |
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
| B22 | [06-09 RAG 质量／执行](../brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md) | U7 新增固定独立评估、文件变化行为、真实 Vault 耗时；保留语义／中文未命中记录。 |
| B23 | [06-09 检索决策](../brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md) | 词法、进程内、无 embedding 的边界继续作为基线。 |
| B24 | [06-20 Slidev 布局／canvas](../brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md) | 布局／审计基线已交付；B25 承接后续 PPTX 保真工作。 |
| B25 | [06-21 可编辑 PPTX](../brainstorms/2026-06-21-slidev-editable-pptx-progress-and-next-direction.zh-CN.md) | U8 修复原生表格绘制并验证 PowerPoint 16 编辑／保存／重开；raster-strict 与字体保真仍有限。 |
| B26 | [07-02 CI／GEO／CLI／Slidev 收尾](../brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.zh-CN.md) | 历史有限范围已收尾；外部部署观察与后续 Office 保真度分开推进。 |
| B27 | [07-04 参考／figure 生成](../brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md) | P16／P17 已交付原生目录和 figure 扩展；精确参考 grammar 与新 engine 仍限定范围。 |
| B28 | [07-22 Drawnix 质量／交付](../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.zh-CN.md) | 已实现并由 P14 细化；不恢复已否决的交付模式矩阵。 |
| B29 | [08-08 图表／设置完整性](../brainstorms/2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.zh-CN.md) | 有限范围加 U2 写入归属已交付；补偿仍不构成通用事务安全。 |
| B30 | [08-14 presentation 架构审查](../brainstorms/2026-08-14-drawnix-presentation-architecture-review.zh-CN.md) | 已取代／否决的架构；保留为反面设计经验。 |
| B31 | [08-16 主线图表审计](../brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.zh-CN.md) | 已明确由 B32 取代；后续 geometry／presentation 修复仍已实现。 |
| B32 | [09-02 当前主线](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md) | 当前摘要，9 月 13 日更新了实现、consumer 证据和有界后续决策。 |

## 维护者工作线与外部验收

| 工作线 | 当前实现 | 开放的验收边界 |
|---|---|---|
| [Circuitikz 路线图](./circuitikz-figure-generation-roadmap.zh-CN.md)及[原型](./circuitikz-export-prototype.zh-CN.md) | 6 个确定性模板、拓扑检查、诊断、维护者 repair SDK；U6 修复连线／标签布局 | Tectonic 0.16.9／Circuitikz 1.4.6 编译 6 个模板加 5 个方向变体，PDFium 复核通过；repair SDK 仍仅供维护者使用。 |
| [07-19 托管 Circuitikz／runtime／历史](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.zh-CN.md) | 可选固定 runtime、完整性／staging 检查、桌面惰性加载、历史滚动 | 独立预热包缓存后完成离线验收；冷下载超过常规 runner 超时。保留移动端无该依赖的路径。 |
| [07-10 Circuitikz UI／导出／文档](./circuitikz-ui-export-and-docs-sync-2026-07-10.zh-CN.md) | 源格式 UI、导出和双语文档已交付 | 维护各 target 的支持范围；compiler 不保证普遍可用。 |
| [07-19 生成链路／MDX](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.zh-CN.md) | 生成／导出链路及网站策略已有文档和实现 | 区分 source、preview 和真实外部 consumer 声明。 |
| [07-11 历史／设置进度](./vault-history-settings-navigation-progress-2026-07-11.zh-CN.md) | P08／P09 功能范围已交付 | 更复杂 retention 或文件夹变更策略需要额外明确范围。 |
| [Standalone 验收](./slidev-standalone-acceptance-2026-06-18.zh-CN.md)、[PPTX 验收](./slidev-editable-pptx-acceptance-2026-06-21.zh-CN.md)、[导出门禁](./slidev-export-workflow.zh-CN.md) | 原生表格绘制已修复；PowerPoint 16 build 14332 编辑／保存／重开 10 页、2 张原生表格 | 表格页 RMSE 0.192665 → 0.159463，既有 visible-native 门禁通过；raster-strict／字体保真仍有限。 |
| [Draw.io 视觉回归](./drawio-export-visual-regression.zh-CN.md) | diagrams.net 31.4.5 原生导入／编辑／保存／重开 | 记录的 fixture 保留 3 个顶点／2 条边和已编辑中文标签；其他版本需独立验收。 |
| [Drawnix spike](./drawnix-export-spike.zh-CN.md) | 真实 Drawnix `9939f452` 编辑／保存／重开：38 节点、12 条语义关系、1 根 | 节点往返通过；静态箭头在重排后脱离，实测上游契约不支持 Mind 节点 bound handle。 |
| [GEO 测量记录](./github-pages-geo-measurement-log.zh-CN.md) | 34 个网站 locale 的新鲜本地构建／审计，加历史部署观察 | Search Console 收录与 AI 回答可见性需要有日期的外部观察，构建通过不能提供。 |
| [发布流程](./release-workflow.zh-CN.md) | tag 发布继续独立于新增 PR／main 验证工作流 | 本批不改变 Release 资产／tag 或分支保护设置，CI 执行证据由 U3 维护。 |

## 缺陷处置

R1–R4 在实施前针对 `7638cec` 复现。当前修正结果已有红／绿回归及真实 host 验收；源码测试和跟踪的证据足以复现，不依赖本地审计缓存或 `.trellis/`。

| ID | 优先级 | 基线机制 | 当前处置 |
|---|---|---|---|
| R1 | P1 | 首个 worker 之前取消，外层 Promise 不结束。 | U1 已关闭：所有 worker 均结束，包括错峰期间取消；活动计数归零。 |
| R2 | P1 | 子 reporter 复制状态，LLM 迟到响应在取消后仍修改／移动笔记。 | U1 已关闭：实时子 getter 与变更边界检查；真实 Obsidian 迟到响应探针保留两份源笔记。 |
| R3 | P1 | 传输收到原始可选 signal，而非内部创建的实际生效 signal。 | U1 已关闭：统一 signal 到达五种传输与重试等待；保留调用方所有权，不可中断请求逻辑结束。 |
| R4 | P1 | 失败保存用旧字节覆盖并发成功保存，并隐藏恢复失败。 | U2 已关闭：重叠路径预留、原子归属校验文本补偿、恢复副本与结构化失败。 |
| R5 | P1 | 插件测试仅在发布 tag 后运行，没有 PR／main 工作流。 | U3 已实现：锁定 Linux／Windows 构建／Jest／审计／lint 检查；正／负远端验收由执行记录维护，分支保护独立。 |
| R6 | P2 | 另一张合法但无关的 PNG 可通过签名／存在性检查。 | U4 已关闭：已提交 PNG 哈希检测替换，规范化 SVG 比较兼容 checkout 换行。 |
| R7 | P2 | 文档测试固定审计意见原文。 | U4 已关闭：移除意见断言，保留源码数量、双语链接和 schema 契约。 |
| R8 | P2 | 没有明确激活／预览／堆预算，manifest 支持声明超出真实 host 证据。 | U5 已按桌面预算与保持内联决定关闭调查；物理移动设备、Obsidian 0.15.0 仍明确未验证。 |

Serializer 或 compiler 通过仍不足以证明视觉语义。U6 的 PDF 复核发现并修复了 Circuitikz 连线／控制线布局与标签镜像；真实 Drawnix 重排暴露了上游附着限制，继续报告该限制，不提升支持声明。

## 架构决策的保留与修正

| 决策 | 评估 | 实施方向 |
|---|---|---|
| Provider registry 加 5 类共享 transport | 保留 | 统一修正 signal／retry 归属，保留协议感知的流式处理和 partial diagnostics。preset 数量不作为主要进度指标。 |
| 语义 spec 加目标投影 | 保留 | 外部输入在准入边界验证，内部信任不变量；不再引入第二套语义／presentation 持久模型。 |
| 单一内联 render bundle | 保留：有实测支持 | 激活 p95 289.3 ms、密集预览 p95 120 ms、预热堆占用满足桌面暂定预算；bundle 哈希／体积集中记录于验收文档。 |
| History repository 写队列 | 责任归属合理 | 将归属原则用于 artifact 持久化，不假设 history 队列会串行化别处文件写入。 |
| Artifact 写入归属 | 有界保证已实现 | 预留完整输出集、串行化重叠路径、仅补偿仍归属本操作的文本，保留冲突／二进制前像；不承诺跨进程／崩溃 ACID。 |
| 词法 MiniSearch 检索 | 保留为基线 | 每次构建 retriever 都枚举候选、串行读文件并重建索引；批量标题生成已共享一个 retriever。先测语料／读取成本和 batch 内快照陈旧，再决定持久化。 |
| 兼容层保留 | 按承诺的支持面缩小范围 | 持久 schema 与 command ID 应有迁移窗口；私有源码 re-export 不因测试 import 就变成 public。 |
| 单纯缩小大文件 | 不作为独立目标 | `NotemdSettingTab.ts` 约 4.1k 行，`main.ts` 3.3k，`llmUtils.ts` 3.2k，`fileUtils.ts` 2.4k。只有具体不变量／依赖获得真正责任方时才抽取。 |

## 推进方向与完成规则

1. **可靠性基线：** U1／U2 关闭 R1–R4，U3 用新鲜 Linux／Windows 验证及故意失败证据保护集成，后续变更继续遵守这些门禁。
2. **实测架构：** U4 完整性已实现，U5 以保持内联关闭。开发热重载残留另行调查；扩展支持声明前验证物理移动设备／最旧 host。
3. **Consumer 准入：** U6 完成逐 target 评估；直到真实上游／替代 target 证明确有能力，Drawnix 跨枝连线附着仍不支持。
4. **产品深化：** U7 快照／评估、U8 表格绘制质量线已交付。后续中文／排序工作需新验证划分，Office 改善需明确字体／renderer 缺陷且不放松保真阈值。

有限需求、实现、回归证据和文档一致时，计划才关闭。外部门禁必须有明确应用／工具版本及保留的产物。延后想法只有在具备用例、责任方、验收用例与维护预算时才重开。发布／历史记录保持日期；维护本文和当前进度摘要，不再叠加另一份竞争性的全局路线图。
