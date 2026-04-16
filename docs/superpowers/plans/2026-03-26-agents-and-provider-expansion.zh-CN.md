# AGENTS 与 Provider 扩展执行计划

> **给代理执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐步执行本计划。步骤继续使用复选框 `- [ ]` 语法跟踪。

**目标：** 新增项目级 `AGENTS.md`，补强 Doubao 设置校验，并为 Notemd 扩展 `Baidu Qianfan` 与 `SiliconFlow` provider 支持。

**架构：** 继续将 provider 元数据集中在 `src/llmProviders.ts`，保持 `src/llmUtils.ts` 的 transport-driven runtime dispatch，并新增一个小型纯函数 validation helper，为设置页 warning 提供支撑。仓库工作流规则写入新的根级 `AGENTS.md`，但不修改 `GEMINI.md`。

**技术栈：** TypeScript、Jest、Obsidian 插件设置页界面、GitHub 发布流程

---

### 任务 1：新增项目级 AGENTS 指南

**文件：**
- 创建：`AGENTS.md`
- 测试/验证：`README.md`、`README_zh.md`、本地 git 历史中的发布工作流

- [ ] **步骤 1：起草指南内容**
编写一份简洁但具权威性的 `AGENTS.md`，覆盖项目概览、关键文件、构建/测试命令、发布步骤、文档同步、Provider 扩展规则以及 Git 安全规则。

- [ ] **步骤 2：明确发布资产规则**
文档中必须写清 GitHub 发布资产需要包含 `main.js`、`manifest.json`、`styles.css` 与 `README.md`。

- [ ] **步骤 3：自审避免重复**
确认该指南足以支撑代理执行，同时不要无意义地重复 `GEMINI.md` 内容。

### 任务 2：先补 Doubao 校验测试

**文件：**
- 创建：`src/tests/providerValidation.test.ts`
- 修改：`src/llmProviders.ts`

- [ ] **步骤 1：编写失败测试**
新增测试，描述 Doubao 使用占位符或明显无效的 endpoint 式 model 值时应出现警告，以及看起来有效的配置不应出现警告。

- [ ] **步骤 2：跑定向测试确认失败**
执行：`npm test -- --runInBand src/tests/providerValidation.test.ts`
预期：FAIL，因为 validation helper 还不存在。

- [ ] **步骤 3：实现最小校验 helper**
在 `src/llmProviders.ts` 中新增一个小型纯函数 helper，基于 provider 配置返回警告。

- [ ] **步骤 4：重新运行定向测试**
执行：`npm test -- --runInBand src/tests/providerValidation.test.ts`
预期：PASS。

### 任务 3：在设置页展示 Doubao 校验结果

**文件：**
- 修改：`src/ui/NotemdSettingTab.ts`
- 修改：`styles.css`

- [ ] **步骤 1：如有需要，新增失败的界面导向测试或 `helper` 调用方测试**
如果纯界面测试过重，就补一条 `helper` 级断言，再配一条围绕连接测试门禁的聚焦行为测试。

- [ ] **步骤 2：实现警告渲染**
当当前 provider 存在校验警告时，渲染一个可见的警告提示块。

- [ ] **步骤 3：对明显无效的 Doubao 配置阻断连接测试**
如果当前 provider 存在警告，则显示 `Notice`，并跳过远端测试请求。

- [ ] **步骤 4：重跑相关测试**
运行覆盖 provider validation 与设置页行为的相关 Jest 测试。

### 任务 4：先补 Qianfan 与 SiliconFlow 测试

**文件：**
- 修改：`src/tests/llmProviders.test.ts`
- 修改：`src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **步骤 1：扩展注册表测试**
新增失败断言，检查 `Baidu Qianfan` 与 `SiliconFlow` 的 provider 存在性和元数据。

- [ ] **步骤 2：扩展运行时 / API 测试**
新增失败测试，断言这两个 provider 都走 `openai-compatible` 运行时，并使用优先 `chat` 的 API 探测。

- [ ] **步骤 3：跑定向测试确认失败**
执行：`npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
预期：FAIL，直到 provider 定义被补齐。

### 任务 5：实现 Provider Registry 与运行时支持

**文件：**
- 修改：`src/llmProviders.ts`
- 修改：`src/llmUtils.ts`
- 修改：`src/ui/NotemdSettingTab.ts`

- [ ] **步骤 1：新增 provider 定义**
新增 `Baidu Qianfan` 与 `SiliconFlow`，补齐官方 `base URL`、代表性 `model ID`、元数据以及优先 `chat` 的 API 测试模式。

- [ ] **步骤 2：复用 `transport-driven` 运行时**
确保两个 provider 都继续走现有 `openai-compatible` 运行时与连接测试路径。

- [ ] **步骤 3：如有需要，更新设置页文案**
在设置页提示块或相关 provider 描述中体现扩展后的 provider 覆盖范围。

- [ ] **步骤 4：重跑定向 provider 测试**
执行：`npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
预期：PASS。

### 任务 6：更新文档

**文件：**
- 修改：`README.md`
- 修改：`README_zh.md`

- [ ] **步骤 1：更新 provider 列表与配置说明**
补充 `Baidu Qianfan` 与 `SiliconFlow`，并明确 Doubao endpoint-ID 的配置提示。

- [ ] **步骤 2：如有必要，更新发布流程说明**
确保仓库文档与新的 `AGENTS.md` 发布资产规则保持一致。

### 任务 7：最终验证

**文件：**
- 验证：仓库根目录及所有变更过的源码/测试/文档文件

- [ ] **步骤 1：运行构建**
执行：`npm run build`
预期：PASS。

- [ ] **步骤 2：运行完整测试套件**
执行：`npm test -- --runInBand`
预期：PASS；若已知 Jest open-handle warning 仍存在，只能在未恶化的前提下接受。

- [ ] **步骤 3：检查 `git diff` 质量**
执行：`git diff --check`
预期：PASS。

- [ ] **步骤 4：提交实现**
```bash
git add AGENTS.md docs/superpowers/specs/2026-03-26-agents-and-provider-expansion-design.md docs/superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md docs/superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md README.md README_zh.md src/llmProviders.ts src/llmUtils.ts src/ui/NotemdSettingTab.ts src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerValidation.test.ts styles.css
git commit -m "feat: add agent guide and expand provider presets"
```
