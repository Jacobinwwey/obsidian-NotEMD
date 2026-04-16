# AGENTS 与 Provider 扩展执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增项目级 `AGENTS.md`，补强 Doubao 设置校验，并为 Notemd 扩展 Baidu Qianfan 与 SiliconFlow provider 支持。

**Architecture:** 继续将 provider 元数据集中在 `src/llmProviders.ts`，保持 `src/llmUtils.ts` 的 transport-driven runtime dispatch，并新增一个小型纯函数 validation helper，为设置页 warning 提供支撑。仓库工作流规则写入新的根级 `AGENTS.md`，但不修改 `GEMINI.md`。

**Tech Stack:** TypeScript、Jest、Obsidian 插件设置页 UI、GitHub Releases

---

### Task 1: 新增项目级 AGENTS 指南

**Files:**
- Create: `AGENTS.md`
- Test/Verify: `README.md`、`README_zh.md`、本地 git 历史中的 release workflow

- [ ] **Step 1: 起草指南内容**
编写一份简洁但具权威性的 `AGENTS.md`，覆盖项目概览、关键文件、build/test 命令、release 步骤、文档同步、provider 扩展规则以及 Git 安全规则。

- [ ] **Step 2: 明确 release 资产规则**
文档中必须写清 GitHub release 资产需要包含 `main.js`、`manifest.json`、`styles.css` 与 `README.md`。

- [ ] **Step 3: 自审避免重复**
确认该指南足以支撑 agent 执行，同时不要无意义地重复 `GEMINI.md` 内容。

### Task 2: 先补 Doubao 校验测试

**Files:**
- Create: `src/tests/providerValidation.test.ts`
- Modify: `src/llmProviders.ts`

- [ ] **Step 1: 编写失败测试**
新增测试，描述 Doubao 使用占位符或明显无效 endpoint-like model 时应出现的 warning，以及看起来有效的配置不应出现 warning。

- [ ] **Step 2: 跑定向测试确认失败**
Run: `npm test -- --runInBand src/tests/providerValidation.test.ts`
Expected: FAIL，因为 validation helper 还不存在。

- [ ] **Step 3: 实现最小校验 helper**
在 `src/llmProviders.ts` 中新增一个小型纯函数 helper，基于 provider 配置返回 warning。

- [ ] **Step 4: 重新运行定向测试**
Run: `npm test -- --runInBand src/tests/providerValidation.test.ts`
Expected: PASS。

### Task 3: 在设置页展示 Doubao 校验结果

**Files:**
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `styles.css`

- [ ] **Step 1: 如有需要，新增失败的 UI 导向测试或 helper-consumer 测试**
如果纯 UI 测试过重，就补一条 helper 级断言，再配一条围绕 connection-test gating 的聚焦行为测试。

- [ ] **Step 2: 实现 warning 渲染**
当当前 provider 存在 validation warning 时，渲染一个可见的 warning callout。

- [ ] **Step 3: 对明显无效的 Doubao 配置阻断 connection test**
如果当前 provider 存在 warning，则显示 Notice，并跳过远端测试请求。

- [ ] **Step 4: 重跑相关测试**
运行覆盖 provider validation 与 settings behavior 的相关 Jest 测试。

### Task 4: 先补 Qianfan 与 SiliconFlow 测试

**Files:**
- Modify: `src/tests/llmProviders.test.ts`
- Modify: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: 扩展 registry 测试**
新增失败断言，检查 `Baidu Qianfan` 与 `SiliconFlow` 的 provider 存在性和元数据。

- [ ] **Step 2: 扩展 runtime/API 测试**
新增失败测试，断言这两个 provider 都走 openai-compatible runtime，并使用 chat-first API probing。

- [ ] **Step 3: 跑定向测试确认失败**
Run: `npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
Expected: FAIL，直到 provider 定义被补齐。

### Task 5: 实现 Provider Registry 与 Runtime 支持

**Files:**
- Modify: `src/llmProviders.ts`
- Modify: `src/llmUtils.ts`
- Modify: `src/ui/NotemdSettingTab.ts`

- [ ] **Step 1: 新增 provider 定义**
新增 `Baidu Qianfan` 与 `SiliconFlow`，补齐官方 base URL、代表性 model ID、元数据以及 chat-first API-test mode。

- [ ] **Step 2: 复用 transport-driven runtime**
确保两个 provider 都继续走现有 openai-compatible runtime 与 connection-test 路径。

- [ ] **Step 3: 如有需要，更新设置页文案**
在 settings callout 或相关 provider 描述中体现扩展后的 provider 覆盖范围。

- [ ] **Step 4: 重跑定向 provider 测试**
Run: `npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
Expected: PASS。

### Task 6: 更新文档

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`

- [ ] **Step 1: 更新 provider 列表与配置说明**
补充 `Baidu Qianfan` 与 `SiliconFlow`，并明确 Doubao endpoint-ID 的配置提示。

- [ ] **Step 2: 如有必要，更新发布流程说明**
确保仓库文档与新的 `AGENTS.md` release 资产规则保持一致。

### Task 7: 最终验证

**Files:**
- Verify: 仓库根目录及所有变更过的 source/test/docs 文件

- [ ] **Step 1: 跑 build**
Run: `npm run build`
Expected: PASS。

- [ ] **Step 2: 跑完整测试套件**
Run: `npm test -- --runInBand`
Expected: PASS；若已知 Jest open-handle warning 仍存在，只能在未恶化的前提下接受。

- [ ] **Step 3: 检查 git diff 质量**
Run: `git diff --check`
Expected: PASS。

- [ ] **Step 4: 提交实现**
```bash
git add AGENTS.md docs/superpowers/specs/2026-03-26-agents-and-provider-expansion-design.md docs/superpowers/plans/2026-03-26-agents-and-provider-expansion.md README.md README_zh.md src/llmProviders.ts src/llmUtils.ts src/ui/NotemdSettingTab.ts src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerValidation.test.ts styles.css
git commit -m "feat: add agent guide and expand provider presets"
```
