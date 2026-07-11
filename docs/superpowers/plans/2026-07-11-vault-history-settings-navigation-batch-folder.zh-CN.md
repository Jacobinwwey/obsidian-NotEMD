# Vault 历史、设置导览与批处理文件夹实施计划

> **面向执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行。本计划使用复选框跟踪步骤。

**目标：** 交付 Vault 持久化图形历史、带大类导览和收藏的模糊设置搜索、安全批处理目标文件夹准备，以及同步的多语言 README 指南。

**架构：** 为历史查询、设置目录/搜索和批处理文件夹策略建立独立领域模块。现有 Obsidian UI 类只消费这些模块并负责界面交互。插件设置保存轻量索引与偏好，生成产物继续作为 Vault 文件存在。

**技术栈：** TypeScript、Obsidian Plugin API、Jest、现有 i18n registry、Markdown README 本地化。

## 全局约束

- 历史默认按完成时间倒序，每页默认 20 条。
- 历史按 Vault 保存，只记录路径和元数据，不重复保存二进制或 SVG 正文。
- 缺失批处理文件夹只有在用户明确选择后才可自动创建；非空文件夹每次批处理调用确认一次。
- CLI/无交互调用不能静默创建文件夹或授权非空文件夹。
- 每份设计、计划和进度文档都有独立英文与简体中文文件。
- 所有行为变更使用 TDD；最终必须重新执行构建、全量 Jest、`git diff --check`、Obsidian CLI 集成测试，推送 `main` 并保持工作区 clean。

---

### 任务 1：持久化图形历史领域

**文件：** 新建 `src/diagram/history/diagramHistoryRepository.ts`、`diagramHistoryQuery.ts` 和 `src/tests/diagramHistoryRepository.test.ts`；修改 `src/types.ts`、`src/constants.ts`。

- [ ] 先编写排序、模糊搜索、筛选、20 条分页、保留上限和克隆安全的失败测试。
- [ ] 运行目标 Jest，确认因模块缺失而失败。
- [ ] 实现纯查询函数和串行持久化仓库；清理只删除索引。
- [ ] 目标测试通过后提交 `feat(diagrams): persist vault diagram history`。

### 任务 2：历史记录与管理界面

**文件：** 新建 `src/ui/DiagramHistoryModal.ts`、`src/tests/diagramHistoryModal.test.ts`；修改预览历史、预览弹窗、`main.ts`、中英文 i18n 和相关测试。

- [ ] 为只记录已完成渲染、近期数量限制、打开完整管理器、筛选重置、分页边界和只删索引编写失败测试。
- [ ] 确认 RED。
- [ ] 实现紧凑近期历史和独立 Vault 历史弹窗，包括搜索、筛选、分页、重新预览、来源定位、导出状态和分离确认的产物删除。
- [ ] 目标测试通过后提交 `feat(diagrams): add vault history manager`。

### 任务 3：稳定设置目录与模糊搜索

**文件：** 新建 `src/ui/settings/settingCatalog.ts`、`settingSearch.ts`、`src/tests/settingCatalog.test.ts`；修改设置页、类型、默认值和现有设置行为测试。

- [ ] 为稳定唯一 ID、分类覆盖、中英文规范化、拼写容错有序匹配和空查询编写失败测试。
- [ ] 确认 RED。
- [ ] 实现不依赖 DOM 文本的目录和搜索，并为现有设置组补充稳定 ID。
- [ ] 通过测试后提交 `feat(settings): add searchable setting catalog`。

### 任务 4：大类导览与收藏

**文件：** 新建 `src/ui/settings/SettingsNavigation.ts`；修改设置页、`styles.css`、中英文 i18n 和 UI/style 测试。

- [ ] 为分类跳转、收藏跨语言稳定、未知 ID 隐藏、搜索分组、键盘焦点和窄布局编写失败测试。
- [ ] 确认 RED。
- [ ] 实现 Codex 风格紧凑导览、收藏入口、搜索头部、结果数量和响应式横向导航。
- [ ] 通过测试后提交 `feat(settings): add navigation and favorites`。

### 任务 5：批处理目标文件夹准备

**文件：** 新建 `src/operations/batchTargetFolderPreparation.ts` 和对应测试；修改 command host、`fileUtils.ts`、设置类型/默认值与中英文 i18n。

- [ ] 为缺失、空、非空、文件冲突、记忆自动创建、整批一次确认、取消不记错误和无交互可恢复结果编写失败测试。
- [ ] 确认 RED。
- [ ] 在从标题批量生成枚举文件前调用统一准备器，并移除该路径过晚的通用 invalid-folder 错误。
- [ ] 通过测试后提交 `fix(batch): prepare configured target folders safely`。

### 任务 6：README 与多语言文档

**文件：** 修改英文、中文及所有现有本地化 README；新建中英文进度文档；修改文档契约测试。

- [ ] 为历史管理、设置搜索/导览/收藏、缺失文件夹自动创建和非空文件夹整批确认编写失败契约测试。
- [ ] 确认各语言因缺失说明而失败。
- [ ] 更新英文 canonical 内容，翻译受控片段到所有现有 README locale，并记录架构对比与进度。
- [ ] 通过测试后提交 `docs: explain settings and history workflows`。

### 任务 7：集成、视觉审计与 main 交付

- [ ] 运行全部目标测试。
- [ ] 运行构建、全量 Jest、i18n UI 审计和 `git diff --check`。
- [ ] 通过 `Obsidian.com` 重载插件，验证历史重载持久化、搜索/收藏，以及缺失和非空批处理文件夹。
- [ ] 将准确证据和后续架构方向写入中英文进度文档。
- [ ] 检查完整 diff，提交验证修复，推送 `main` 并确认工作区 clean。

