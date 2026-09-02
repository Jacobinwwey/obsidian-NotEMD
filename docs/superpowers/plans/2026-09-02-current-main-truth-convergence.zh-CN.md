---
date: 2026-09-02
last_updated: 2026-09-02
topic: current-main-truth-convergence
status: completed
canonical_for:
  - current-main-progress
  - plan-status-convergence
superseded_by: null
---

# 当前 Main 真值收敛实施计划

> **面向执行 agent：** 在当前 checkout 中内联执行。步骤使用复选框（`- [ ]`）跟踪。

**目标：** 将仓库计划、能力文档和可执行证据重新对齐到当前 `main` 实现，并用自动化契约与发布门禁锁定结果。

**架构：** 运行时 registry 与 manifest 是唯一数字真值来源；新增一份双语主线进度记录负责跨计划状态，更新过时的维护者文档和计划元数据但保留历史理由，再增加一个窄范围契约测试，在数量、路径或发布声明漂移时失败。

**技术栈：** TypeScript、Jest、Node.js CommonJS 脚本、Markdown、VitePress、Docusaurus、GitHub release helper。

## 全局约束

- 不得超出已检入证据扩大 target 或 consumer 兼容性声明。
- 保留现有 LM Studio 发布流程作为兼容路径；1.9.7 Codex 离线路径是明确补充。
- 英文和简体中文文档必须语义等价。
- 在完成仓库和外部 consumer 调用方盘点前，不删除兼容 shim。
- 手工编辑使用 `apply_patch`，仓库命令统一加 `rtk` 前缀。
- 发布前运行相同的 build、test、docs、gallery、i18n、render-host 与 clean-worktree 门禁。

---

### 任务 1：建立 canonical 当前 main 进度记录

**文件：**
- 新建：`docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.md`
- 新建：`docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md`

**接口：**
- 消费：可执行目录、provider registry、UI/网站 locale 目录、operation registry、图表示例 manifest、release 与 packaging 契约。
- 产出：双语状态矩阵、证据快照、延后边界、风险登记和有序推进计划。

- [x] **步骤 1：记录源代码数量和发布基线。**
- [x] **步骤 2：将每个活跃计划分类为 shipped、active、deferred、historical 或 superseded。**
- [x] **步骤 3：将外部 consumer 声明与 serializer/public-API 证据分开。**
- [x] **步骤 4：用简体中文镜像完整记录。**

### 任务 2：收敛过时文档与计划元数据

**文件：**
- 修改：`docs/maintainer/diagram-capability-catalog.md`
- 修改：`docs/maintainer/diagram-capability-catalog.zh-CN.md`
- 修改：`docs/architecture.md`
- 修改：`docs/architecture.zh-CN.md`
- 修改：`docs/plans/2026-08-15-mermaid-normalization-consolidation.en.md`
- 修改：`docs/plans/2026-08-15-mermaid-normalization-consolidation.zh-CN.md`
- 修改：`docs/superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.en.md`
- 修改：`docs/superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.zh-CN.md`
- 修改：`docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md`
- 修改：`docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md`
- 修改：`docs/superpowers/plans/2026-08-29-diagram-examples-implementation.en.md`
- 修改：`docs/superpowers/plans/2026-08-29-diagram-examples-implementation.zh-CN.md`

**接口：**
- 消费：任务 1 当前 main 记录与运行时 manifest。
- 产出：准确的已交付/延后表述，同时保留历史设计理由。

- [x] **步骤 1：将能力目录扩展为全部 33 个可执行行，并修正 5 个仅参考行。**
- [x] **步骤 2：把架构数量更新为 36 个 provider、21 个插件 locale，以及当前 target/catalog 数量。**
- [x] **步骤 3：为 8 月图表计划增加明确的完成/后续状态，但不删除 checklist 或历史理由。**
- [x] **步骤 4：保持所有双语对应文件一致。**

### 任务 3：增加反漂移契约测试

**文件：**
- 新建：`src/tests/currentMainProgressDocsContract.test.ts`

**接口：**
- 消费：`src/diagram/diagramTypeCatalog.ts`、`src/diagram/diagramCapabilityManifest.ts`、`src/llmProviders.ts`、`src/i18n/uiLocales.ts`、`website/src/lib/publishedLocales.mjs`、`docs/diagram-examples/manifest.json` 以及任务 1/2 文档。
- 产出：当源代码数量、双语文件、示例覆盖或过时声明发生漂移时，Jest 确定性失败。

- [x] **步骤 1：从运行时来源断言 catalog、provider、target、locale 和示例数量。**
- [x] **步骤 2：断言每个可执行图表都有双语示例输入和 manifest 行。**
- [x] **步骤 3：断言能力目录与当前 main 记录含当前数量/状态标记，并且不含已知过时表述。**
- [x] **步骤 4：运行 focused test，再运行完整 Jest。**

### 任务 4：限定兼容层清理边界

**文件：**
- 仅检查：`src/diagram/adapters/mermaid/legacyFixerUtils.ts`、`src/diagram/adapters/drawnix/drawnixRelationRouter.ts`、`src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts`、`src/diagram/adapters/drawnix/drawnixSourceCoverage.ts`、`src/rendering/preview/mermaidDefinitionShared.ts`、`src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts`。

**接口：**
- 消费：仓库搜索与测试调用图。
- 产出：记录迁移决策；没有证明边界无消费者和 focused regression 覆盖时不删除。

- [x] **步骤 1：盘点生产、测试、脚本和文档调用方。**
- [x] **步骤 2：仍有测试或 maintainer 调用方的兼容导出继续保留。**
- [x] **步骤 3：将删除候选记录进当前 main 进度记录，而不是凭假设删除。**

### 任务 5：验证并发布收敛切片

**文件：**
- 验证：插件源代码/测试、docs、website、release metadata 和 Git clean 状态。

- [x] **步骤 1：运行 focused 契约/文档测试。**
- [x] **步骤 2：运行 `npm.cmd run build`、完整 Jest、gallery/i18n/render-host/local-KB/consumer 门禁以及两套 docs build。**
- [x] **步骤 3：运行 release dry-run，确认远端 1.9.7 Release 仍为双语并包含四个必需资产。**
- [x] **步骤 4：运行 `git diff --check`，确认 `main` clean，并明确 ahead/behind 状态。**
- [x] **步骤 5：提交变更并推送 `origin/main`。**

## 完成记录（2026-09-02）

本次收敛切片已完成。剩余开放项明确属于外部证据或未来范围：真实 Draw.io/Drawnix 应用导入证据、可用于宿主验证的 Obsidian CLI 安装、changed-lines lint ratchet，以及外部迁移窗口完成后的兼容 shim 删除。不会仅凭过时 checklist 将 runtime 功能标记为完成。
