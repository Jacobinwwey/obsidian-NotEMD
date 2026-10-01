---
date: 2026-09-12
last_updated: 2026-10-01
status: current
canonical_for: plan-disposition
audit_commit: 7638cec
---

# 项目计划进度与工程评估

语言：[English](./project-plan-status.md) | **简体中文**

[当前进度记录](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md)负责摘要，本文负责逐项计划处置，[实施计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md)与[验收记录](./reliability-acceptance-2026-09-12.zh-CN.md)负责 U1–U8 执行和证据。历史 checklist 保留为意图记录，不再形成另一套当前 backlog。

## 当前检查点 — 2026-10-01

V0–V4 实施及本地验收完成。816 篇网站文档、34 组首页／导航、31 份 README 首屏及相关说明已直接撰写并复核；仓库 About 首页现已指向标准 Pages URL。792 篇译文均有来源收据，Codex 复核不等同于独立母语人工审校，也不自动提升索引资格。

最终本地验证通过：插件构建、289 个 Jest 套件／2703 项测试（一项平台跳过）、lint 回归、UI／render-host 审计、两项归档、VitePress、Node 24 全站构建／审计及 816 个真实 Tab 导航场景。F16–F18 修复继续有效。F19 在用户已打开的 1Knowledge 中复现：宿主 Escape 在 DOM 冒泡前关闭父预览。抽屉现仅在打开时持有 Obsidian Scope，十一项 Chromium 键盘测试及原生 CLI 搜索／Tab／两次 Escape 检查通过；五类持久化竞态通过，原设置字节保留。

1Knowledge 的默认工作流／四个公开导出、取消／恢复及五类预览均经 CLI 验证。PowerPoint 完整导出／视觉门禁、编辑保存重开、导出／重开文件合并边框，以及历史缺陷文件的负例检查完成；六个 CircuitikZ 黄金模板、五种方向变体编译通过。双语 release-1.9.8-acceptance 及 docs/maintainer/evidence/2026-10-01 脱敏证据保留哈希与边界；本地构建收据与标准 Linux 发布构建分开记录。

V5 仍待新鲜远端 Linux／Windows Node 20 CI 和确切候选身份；V6 仍待 main 集成、Release、编年史及线上 Pages。此检查点尚未创建 1.9.8 标签或公开发布。较早日期的检查点作为历史保留，不覆盖上述计数。

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
| P10 | [07-19 自适应预览／历史设计](../plans/2026-07-19-diagram-popup-adaptive-history-design.zh-CN.md) | 抽屉与独立 modal 已交付；1.9.8 候选修复键盘缺陷 | `DiagramPreviewModal` 使用 `DiagramHistoryDrawer`，直接历史入口使用 `DiagramHistoryModal`，共用 `DiagramHistoryView`。此前“仅 modal”分类错误。 |
| P11 | [07-19 自适应预览／历史实施](../superpowers/plans/2026-07-19-diagram-popup-adaptive-history.zh-CN.md) | 已交付；补充候选键盘验收 | 真实浏览器复现加载焦点越界、Tab 越界、Escape 冒泡及搜索丢字；候选版在抽屉／视图归属处修复，十一个浏览器场景通过，包含宿主 Scope 和跨视图焦点归属，1Knowledge 原生 CLI 检查亦通过。 |
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
| R5 | P1 | 插件测试仅在发布 tag 后运行，没有 PR／main 工作流。 | U3 已关闭：Linux／Windows PR 检查通过，隔离负例 PR 在两端都只失败于预期断言；compiler／lint 负例也拒绝错误。分支保护独立。 |
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

## 当前发布实施：1.9.8

[1.9.8 双语实施计划](../plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.zh-CN.md)继续执行。V0 已提交为 `71a1f32`，本地 282 套件／2633 项通过，Linux／Windows Node 20 CI `34752964828` 通过。V1 已校正 21 篇源指南，并新增开发者、Agent 和升级指南，共 24 条路由。

V3 已为 zh-CN、zh-Hant、zh-TW、ja、ar、fr、de、es、pt、pt-BR、it、ko、ru、nl、fa、hi、bn、sv、fi、da、no、pl、tr、he、th 各直接撰写 24 篇，共 **600 篇本地化文档**，并补齐首页及受众导航。葡语路由有意共用技术正文，保留各自路由 metadata 和标签；不声称独立母语者审核。600 篇的源文／译文哈希、路由、摘要语言及 FAQ 正文一致性检查通过。范围内仍有 **8 组语言**。全部 33 种本地化路由的基础文档／FAQ／分类／页脚／logo 标签已直接撰写。Node 24 与局部浏览器证据包括：东亚 90 场景，英文配阿拉伯语／法语／德语／西班牙语／意大利语各 36 场景，英文／pt／pt-BR 共 54 场景，以及新鲜英文／韩语／俄语共 54 场景。针对实际 ko-KR 语言标记修正韩语单词断行后，已复核韩语与俄语窄屏截图。这些记录不替代 V5 全站验收。

F9 历史键盘／焦点／搜索修复有八项浏览器回归。F10 修复研究／翻译在最后一次异步文件边界期间取消后继续写入：五项复现失败已通过，原本已接受的写入仍保留完成计数。六项取消用例、新鲜插件构建和 lint 门禁通过；取消、发布及治理三套测试共 24 项通过。V4 有十项发布／语言准入测试和三项生成索引测试。默认语言构建从共用发行与路由事实生成 `llms.txt`，JSON-LD 共用版本／描述／下载链接投影。内部链接错误会阻断构建，英文／西班牙语严格构建已通过。双语 GEO 手册与网站 README 已退役旧翻译写入流程，根 GEO 路线图将旧记录标为历史。取消／发行／索引／治理五套测试共 32 项通过，并有新鲜插件构建和 lint 结果。完整语言／界面与发布标签审核、候选／原生／CI 验收、About 元数据及发布门禁仍开放。

英文／简中文 README 首屏已突出受众入口、输出验证步骤和 1.9.8 变化；原三张截图保留在快速开始后的折叠区。已校正批处理／进度／链接／翻译的已确认误述，保留技术参考。六套 README／provider／diagram 文档测试共 160 项通过。31 份 README 的发行／下载徽章均已成为真实链接，其余 29 份正文仍待更新。取消修复的相邻调用路径也通过四套、38 项测试。

**1.9.8 尚未发布。远端 main 集成、不可变发行资产、发布后编年史刷新和线上 Pages 验证仍属 V6。**局部语言和历史验收不能关闭这些门禁。

F11 关闭已复现的译文目录创建竞态：复用他者先建好的目录，不冒认产物归属；冲突文件与仍缺失路径保持原回退。取消／翻译相邻四套 41 项测试、新鲜插件构建、lint 回归、UI 字符串与 render-host 审计均通过。最终原生与完整候选验收仍归 V5。

V3／V4 续进：意大利语、韩语、俄语各完成 24 篇直接撰写指南及首页／受众文案，累计 13 组、312 篇审阅文档。英文／意大利语严格构建与 36 场景通过；新鲜英文／韩语／俄语构建及 54 场景也通过，韩语断行修正后的窄屏截图已复核。首页不再用英文补齐缺失字段，渲染入口会拒绝缺失语言、正文或受众／参考链接字段。三个缺失文案准入失败已复现并修复；四项首页测试与发布／索引／版本组共 22 项通过。测试引入的 import lint 诊断已按仓库 createRequire 写法修正，重跑无回归。F11 已同步发布说明、双语计划／状态、英文升级源页及所有完成译文。V5／V6、20 组剩余指南与 29 份 README 正文更新继续开放。

F12：根据当前产品目录核对教程控件名称。模型发现按钮实际为 Fetch models，概念目录／提取／标题研究控件也有与旧正文不同的确切名称。三项预期源契约失败已复现并修正。本地格式化器只从现有 resolved UI 目录投影明确标识的粗体控件标签，不生成或翻译正文，未支持的 UI 语言保留产品实际使用的英文标签。这次标签级源变更后，312 篇文档哈希检查仍通过。指南／首页／索引共 27 项测试、lint、严格英文／韩语／俄语构建与 54 个浏览器场景通过。F12 检查时荷兰语已撰写七页；后续完成记录见下方。

V3 续进：荷兰语已完成全部 24 篇直接撰写指南、首页及受众导航。十四组完整语言、336 篇文档的源文／译文哈希、路由、摘要语言与 FAQ 正文检查通过。严格英文／荷兰语 Node 24 构建和 36 个浏览器场景通过，荷兰语窄屏首页已复核。波斯语已有三篇入门指南，仍未完成。十九组剩余语言、29 份 README 正文及最终 V5／V6 验收和发布工作继续开放。

V3／V4 续进：波斯语 24 篇直接撰写指南、首页和受众导航已完成，十五组完整语言、360 篇文档通过源哈希、路由、摘要语言与 FAQ 正文检查。RTL 截图发现 F13：浅色表头前景色使用了 Infima 的透明背景变量。新浏览器绘制颜色检查复现 54 项失败；改用反向文字颜色后，新鲜严格英文／波斯语构建和 36 场景全部通过。RTL 证据现包含首页、Agent 与 provider 截图，表头、代码及表格布局已复核。之前的浏览器记录早于此门禁，不能关闭最终验收。印地语目前已撰写三篇入门页。十八组剩余语言、29 份 README 正文和 V5／V6 继续开放。

V3 续进，2026-09-15：印地语 24 篇直接撰写指南及首页／受众文案已完成。十六组完整语言、384 篇译文通过哈希、路由、摘要语言及 FAQ 检查。截图复核后进一步优化首页普通说明，保留技术标识；再次严格英文／印地语构建和 36 个浏览器场景通过，包含 F13 透明表头检查，窄屏天城文字体已复核。连同 24 篇英文源文，已撰写目标 816 篇中的 408 篇。孟加拉语已有三篇入门页。十七组剩余语言、29 份 README 正文及最终 V5／V6 门禁继续开放。

V3 续进，2026-09-15：孟加拉语已完成 24 篇直接撰写指南、首页与受众导航。十七组完整语言、408 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查。严格英文／孟加拉语 Node 24 构建和 36 个浏览器场景通过，包含 F13 表头绘制检查，孟加拉语窄屏首页已复核。连同英文，目标 816 篇中的 432 篇已撰写。十六组语言、29 份 README 正文及最终 V5／V6 门禁继续开放。

V3 续进，2026-09-15：瑞典语与芬兰语各完成 24 篇直接撰写指南、首页及受众导航。十九组完整语言、456 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查。分别完成严格英文／瑞典语、英文／芬兰语 Node 24 构建，各 36 个浏览器场景通过，包含表头绘制检查；已复核窄屏长词和按钮布局。连同英文，目标 816 篇中的 480 篇已撰写。丹麦语已有七页。十四组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3 续进，2026-09-15：丹麦语与挪威语各完成 24 篇直接撰写指南、首页及受众导航。二十一组完整语言、504 篇译文通过源文／译文哈希、路由、摘要及 FAQ 正文检查。分别完成严格英文／丹麦语、英文／挪威语 Node 24 构建，各 36 个浏览器场景通过，包含表头绘制检查；两种语言窄屏首页均已复核。连同英文，目标 816 篇中的 528 篇已撰写。波兰语已有七页。十二组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3 续进，2026-09-15：波兰语已完成 24 篇直接撰写指南、首页及受众导航。二十二组完整语言、528 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查。严格英文／波兰语 Node 24 构建和 36 个浏览器场景通过，包含表头绘制检查；窄屏首页已复核。连同英文，目标 816 篇中的 552 篇已撰写。土耳其语已有七页。十一组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3 续进，2026-09-15：土耳其语已完成 24 篇直接撰写指南、首页及受众导航。二十三组完整语言、552 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查；提供商正文已区分原生 API 协议与本地推理。严格英文／土耳其语 Node 24 构建和 36 个浏览器场景通过，包含表头绘制检查；窄屏首页已复核。连同英文，目标 816 篇中的 576 篇已撰写。希伯来语已有七页。十组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3／V4 续进，2026-09-15：希伯来语已完成 24 篇直接撰写指南、首页及受众导航。二十四组完整语言、576 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查。截图复核复现 F14：三个视口的希伯来语行内代码均把 .obsidian 的前导点移到右侧。使用从左到右隔离，并防止 Docusaurus RTL CSS 转换反转方向后，严格英文／阿拉伯语／波斯语／希伯来语构建及 72 场景通过。F15 随后补上到当前版本指南和页脚 FAQ 的实际键盘访问；原手册已声称覆盖，脚本此前未执行。扩展门禁 96 场景全部通过，修复后 RTL 截图已复核，指南／首页／索引 27 项测试和 lint 回归门禁通过。后续双语言组合需要 48 场景，全 34 语言需要 816 场景；旧记录不能关闭扩展后的验收。连同英文，目标 816 篇中的 600 篇已撰写。泰语已有七页。九组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3 续进，2026-09-15：泰语已完成 24 篇直接撰写指南、首页及受众导航。二十五组完整语言、600 篇译文通过源文／译文哈希、路由、摘要语言及 FAQ 正文检查。严格英文／泰语 Node 24 构建和扩展后的 48 个浏览器场景通过，包含升级／FAQ 访问、表头绘制及行内路径字形顺序；泰语窄屏首页已复核。连同英文，目标 816 篇中的 624 篇已撰写。希腊语已有七页。八组语言、29 份 README 正文及最终 V5／V6 交付继续开放。

V3 续进，2026-09-15：希腊语已完成 24 篇直接撰写的指南、首页及四类读者导航。26 组完整本地化版本共 624 篇文档通过来源/译文哈希、路由、摘要语言和可见 FAQ 检查。英语/希腊语 Node 24 严格构建及全部 48 个扩展浏览器场景通过，并检查了希腊语窄屏首页。校正了保留源文、词项检索及移动端未经验证等术语。计入英语后已完成 648/816 篇。捷克语已有 7 篇正文。剩余 7 组语言、29 份 README 内容更新及最终 V5/V6 交付仍在范围内。

V3 续进，2026-09-15：捷克语已完成 24 篇直接撰写的指南、首页及读者导航。27 组完整本地化版本共 648 篇文档通过来源/译文哈希、路由、摘要语言和可见 FAQ 检查。英语/捷克语 Node 24 严格构建及全部 48 个扩展浏览器场景通过，已检查捷克语窄屏首页。计入英语后完成 672/816 篇。匈牙利语已有 7 篇正文。剩余 6 组语言、29 份 README 内容更新及最终 V5/V6 交付仍待完成。

V3 续进，2026-09-15：匈牙利语已完成 24 篇直接撰写的指南、首页及读者导航。28 组完整本地化版本共 672 篇文档通过来源/译文哈希、路由、摘要语言和可见 FAQ 检查。英语/匈牙利语 Node 24 严格构建及全部 48 个扩展浏览器场景通过，已检查窄屏长词和控件布局。计入英语后完成 696/816 篇。罗马尼亚语已有 7 篇正文。剩余 5 组语言、29 份 README 内容更新及最终 V5/V6 交付仍待完成。

V3 续进，2026-09-15：罗马尼亚语已完成 24 篇直接撰写的指南、首页及读者导航。29 组完整本地化版本共 696 篇文档通过来源/译文哈希、路由、摘要语言和可见 FAQ 检查。英语/罗马尼亚语 Node 24 严格构建及全部 48 个扩展浏览器场景通过，已检查窄屏首页，并区分检索与文件恢复术语。计入英语后完成 720/816 篇。乌克兰语已有 7 篇正文。剩余 4 组语言、29 份 README 内容更新及最终 V5/V6 交付仍待完成。

V3 续进，2026-10-01：从旧会话的乌克兰语校对停点恢复，将两处待同步措辞直接更新到文档，未重新生成已完成语言。乌克兰语与越南语均完成 24 篇直接撰写的指南、首页和受众导航。31 组完整本地化版本共 744 篇通过来源/译文哈希、路由、摘要语言和可见 FAQ 检查。英语/乌克兰语与英语/越南语分别通过 Node 24 严格构建及各 48 个扩展浏览器场景，两组 390px 首页已检查。浏览器验收前已将缺失的锁定 Chromium 版本安装到 E 盘缓存。计入英语后完成 768/816 篇。印尼语已直接撰写三篇入门指南。印尼语、马来语、29 份 README 正文、治理收尾和全部 V5/V6 候选验收/集成/发布仍未完成。本轮局部检查不替代最终候选全量测试，也不证明远端发布状态发生变化。
