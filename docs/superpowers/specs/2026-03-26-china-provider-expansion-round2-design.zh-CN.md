# 中国区 Provider 扩展第二轮设计

**日期：** 2026-03-26

## 范围

本设计覆盖 Notemd 在首轮中国区 provider 扩展之后的下一轮扩展：

1. 新增 `Qwen Code` 作为面向编码场景的独立预设，而不是要求用户复用通用 `Qwen` 预设。
2. 新增 `Z AI` 作为国际版 GLM/Zhipu 入口，与现有面向中国大陆 endpoint 的 `GLM` 预设并存。
3. 新增 `Huawei Cloud MaaS` 作为一等公民预设，服务于通过华为云 OpenAI-compatible endpoint 接入托管模型的用户。
4. 同步更新测试、文档和发布材料，使这些 provider 以与现有预设相同的质量门槛交付。

这一轮明确排除需要新认证机制、provider 专属 SDK 逻辑或新 transport 类型的 provider。目标是在不增加协议复杂度的前提下，扩展中国区与 China-adjacent provider 覆盖。

## 架构

provider 系统应继续使用 `src/llmProviders.ts` 作为 preset 元数据的单一事实源。三个新 provider 都应表现为 registry entry，并复用 `src/llmUtils.ts` 中现有的 `openai-compatible` transport 路径。

不应引入新的 transport。runtime 调用应继续走共享的 OpenAI-compatible request builder 以及集中式 retry/fallback 逻辑。connection test 也应继续依赖 provider 元数据，决定该 preset 是先探测 `/models`，还是直接探测 `chat/completions`。

这意味着实现保持增量式：

- 在 `src/llmProviders.ts` 中新增 registry entry
- 在测试文件中新增 provider 断言
- 更新 `README.md`、`README_zh.md` 与 `change.md`
- 使用现有双语 release workflow 发布一个 patch 版本

## Provider 决策

### 1. Qwen Code

`Qwen Code` 应作为独立 preset 添加，而不是隐藏在 `Qwen` 的建议 model 中。

原因：

- 最新 Cline 会将其单独暴露，而不是混在通用 Qwen 下
- 寻找 coding-specialized model 的用户，预期看到直接可选的 preset
- 它符合现有 OpenAI-compatible transport 与 chat-first API testing 模型

预期形态：

- transport：`openai-compatible`
- category：`cloud`
- API key mode：`required`
- API test mode：`chat-only`
- base URL：DashScope compatible-mode endpoint
- 默认 model：例如 `qwen3-coder-plus` 这类 Qwen coding model

### 2. Z AI

虽然 Notemd 已经包含 `GLM`，`Z AI` 仍应作为独立 preset 新增。

原因：

- 最新 Cline 把 `Z AI` 视为一等 provider，而不是重复命名
- 当前 `GLM` preset 面向中国大陆的 `open.bigmodel.cn`
- 单独的 `Z AI` preset 可以给用户提供国际 endpoint，同时不破坏现有 `GLM` 行为

预期形态：

- transport：`openai-compatible`
- category：`cloud`
- API key mode：`required`
- API test mode：`chat-only`
- base URL：国际版 `https://api.z.ai/api/paas/v4`
- 默认 model：`glm-5`

### 3. Huawei Cloud MaaS

`Huawei Cloud MaaS` 应作为一等公民 preset，为在华为云上托管 DeepSeek/Qwen 等模型的用户提供支持。

原因：

- 最新 Cline 已直接内置
- 它是有意义的新增入口，而不是对现有 preset 的重命名
- 它的文档 endpoint 可以直接纳入现有 OpenAI-compatible runtime

预期形态：

- transport：`openai-compatible`
- category：`cloud`
- API key mode：`required`
- API test mode：`chat-only`
- base URL：`https://api.modelarts-maas.com/v1`
- 默认 model：例如 `DeepSeek-V3` 这样的稳定华为托管模型 ID

## 组件

### 1. Provider Registry

修改 `src/llmProviders.ts`：

- 新增 `Qwen Code`、`Z AI` 与 `Huawei Cloud MaaS`
- 将它们放在与相关 provider 相邻的合理顺序中
- 提供准确的描述与 setup hint
- 保留设置页依赖的现有 provider 排序语义

### 2. Runtime 与连接测试

只要 provider 可以通过 `openai-compatible` 路由，就不应新增 runtime 分支。

实现应继续复用当前共享行为：

- `callLLM()` 中针对 OpenAI-compatible 请求的 transport dispatch
- `testAPI()` 中基于 provider 元数据的 OpenAI-compatible probing
- runtime 调用和连接测试共享的瞬时网络 fallback

因此，新的 provider 需要的是元数据，而不是自定义 runtime 代码路径；除非实现评审证明存在无法通过当前元数据表达的 provider 兼容性问题。

### 3. 文档

更新：

- `README.md`
- `README_zh.md`
- `change.md`

文档应说明：

- `Qwen Code` 是 coding-focused 预设
- `Z AI` 是对 `GLM` 的补充，而不是替代
- `Huawei Cloud MaaS` 作为托管式 OpenAI-compatible 选项可用

provider 列表、配置说明与 preset 覆盖范围在两份 README 中必须保持同步。

### 4. 发布

如果期间没有其他无关功能先落地，本工作应作为补丁版本 `1.7.6` 发布。

发布流程要求保持不变：

- GitHub release body 必须具备完整英文段与完整中文段
- release 资产必须包含 `main.js`、`manifest.json`、`styles.css` 与 `README.md`

## 错误处理

新 provider 应继承现有共享的 retry 与 transient-failure fallback 行为。

本设计不新增 provider 级错误归一化。如果后续其中任何 provider 证明需要独立 response parser 或非标准 auth header，应单独拆出一份设计，因为那会把协议范围扩大到本轮之外。

当前规则继续保持：

- 不要把 fatal client-status failure 当作瞬时网络错误重试
- 瞬时断连仍然通过现有稳定 fallback 路径重试

## 测试策略

### Provider Registry 测试

扩展 `src/tests/llmProviders.test.ts`：

- 断言 `Qwen Code`、`Z AI` 与 `Huawei Cloud MaaS` 存在
- 断言它们的 `transport` 与 `apiTestMode`
- 确认它们被视为 OpenAI-compatible provider

### Runtime Routing 测试

扩展 `src/tests/llmUtilsProviderSupport.test.ts`：

- 断言 `callLLM()` 会把每个新 provider 路由到 OpenAI-compatible runtime
- 断言实际使用的 endpoint、auth header 与 model 值符合预期

### 连接测试覆盖

扩展 `src/tests/llmUtilsProviderSupport.test.ts`：

- 断言 `testAPI()` 会对每个新 provider 探测预期的 `chat/completions` 路径
- 断言瞬时断连 fallback 也能在连接测试阶段覆盖这些新 preset

### 完整验证

发布前：

- 先跑定向 provider 测试，遵循 TDD
- 运行 `npm test -- --runInBand`
- 运行 `npm run build`
- 运行 `git diff --check`
- 运行现有 Obsidian CLI 检查，并如实记录当前机器环境中的限制

## 评审说明

本设计刻意只选择那些可以直接纳入现有 OpenAI-compatible transport 的 provider。任何需要专属 SDK、签名流程或新协议层的 provider，都继续延后处理。

当前会话没有用户明确授权进行子代理委派，因此未使用专门的 spec-review 子代理。本设计已经结合当前 provider registry、测试布局、发布规则，以及设计时参考的最新公开 Cline provider 目录和 provider 文档进行了自审。
