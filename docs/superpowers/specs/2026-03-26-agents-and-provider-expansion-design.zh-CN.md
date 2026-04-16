# AGENTS 与 Provider 扩展设计

**日期：** 2026-03-26

## 范围

本设计覆盖 Notemd 中三项相互关联的改动：

1. 在不重写 `GEMINI.md` 的前提下，新增项目级 `AGENTS.md`，作为 Codex/agent 工作流的执行权威。
2. 为 `Doubao` 预设增加前端校验提示，当模型字段看起来仍是未设置的 Ark endpoint 占位值时，给用户明确反馈。
3. 扩展集中式 LLM provider registry，新增 `Baidu Qianfan` 与 `SiliconFlow`，并补齐 runtime 支持、API 连接测试、文档与回归测试。

之所以把这三项合并，是因为它们都在提升 agent/operator 的可靠性：一项作用于仓库工作流层，一项作用于 provider UX 层，一项作用于 provider 覆盖面。

## 架构

provider 架构应继续使用 `src/llmProviders.ts` 作为 provider 元数据的单一事实源。新增 provider 必须表现为 registry 定义，并沿着 `src/llmUtils.ts` 中 transport-driven 的 dispatch 路径流动，而不是继续增加 provider-name 分支。

provider 校验应实现为一个小型纯函数 helper，向 UI 消费方返回 warning。设置页可以渲染这些 warning，并在 provider 配置显然不完整时阻止 connection test。这样可以让校验逻辑保持可测试、可复用，而不是埋在脆弱的 UI 特判里。

新的 `AGENTS.md` 应作为仓库本地文档，明确表达 Notemd 的 build、verification、documentation、release 和 asset-upload 工作流。它必须显式写清：GitHub release 除了 `main.js`、`manifest.json`、`styles.css` 外，还必须上传 `README.md`。

## 组件

### 1. 仓库指南

- 在仓库根目录创建 `AGENTS.md`。
- 保持 `GEMINI.md` 不变。
- 内容应覆盖项目概览、关键文件、build/test 命令、release workflow、文档同步规则、provider 扩展规则和 Git 安全规则。

### 2. Provider 校验

- 在 provider registry 附近新增一个小型校验 helper。
- 检测 `Doubao` 是否仍使用占位 endpoint model，或配置值是否看起来不像有效的 Ark endpoint ID。
- 在用户运行任务或连接测试之前，于设置页中展示 warning。

### 3. Provider 扩展

- 将 `Baidu Qianfan` 与 `SiliconFlow` 新增到 registry 中。
- 保持它们继续走现有的 `openai-compatible` transport。
- 设置 API-test 元数据，确保 connection test 针对的是用户实际配置的 model。
- 同步更新 `README.md` 与 `README_zh.md`。

## 错误处理

连接测试路径应继续沿用当前 runtime/API 错误处理行为。新的 provider-validation 层只处理明显不完整的本地配置，并生成面向用户的 warning；它不应尝试猜测或自动改写 provider model。

对于 `Doubao`，UX 的目标应是提示用户配置有效的 Ark endpoint，同时保留 provider 侧未来更改命名方式的空间。Warning 比破坏性归一化更安全。

## 测试策略

- 为 provider validation warning 新增单元测试。
- 扩展 provider registry 测试，断言 `Baidu Qianfan` 与 `SiliconFlow` 存在。
- 扩展 provider runtime/API 测试，断言两者都走 openai-compatible runtime，并使用 chat-first API probing。
- 实现完成后重新运行完整 build 与 Jest 套件。

## 评审说明

本次未使用专门的 spec-review 子代理，因为当前会话没有用户明确授权进行子代理委派。本设计已依据仓库当前 provider 架构与 release workflow 进行自审。
