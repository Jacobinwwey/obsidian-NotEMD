---
date: 2026-05-27
last_updated: 2026-05-27
topic: provider-settings-simplification-and-model-discovery-plan
canonical: true
---

# Provider Settings Simplification 与 Model Discovery 方案

## 1. 为什么现在必须开这条线

当前仓库已经具备较宽的 provider runtime 覆盖，但 settings control plane 并没有跟着这部分增长一起收敛。

这已经不是“体验还能凑合”的问题，而是实质性的架构问题：

1. 当前 provider runtime 宽度已经不再适合继续容忍字段级硬编码 UI 逻辑；
2. 用户已经明确要求 provider settings 做 core-vs-advanced 切分；
3. 用户也明确要求模型发现，但前提是它必须保持 lightweight、backward-compatible 且在能力边界上诚实。

本文用于把这条线的具体实现方案落盘。

## 2. 当前代码真值

### 2.1 Settings 渲染仍是硬编码

`src/ui/NotemdSettingTab.ts` 当前仍通过直接分支来决定 provider 字段渲染：

1. API key 按 `apiKeyMode` 决定是否显示；
2. `baseUrl`、`model`、`temperature` 直接渲染；
3. `maxOutputTokens` 只有在 developer mode 开启或已有持久化 override 时才渲染；
4. `topP` / `reasoningEffort` 仅对 OpenAI-compatible provider 渲染；
5. `thinkingEnabled` 仅对 `DeepSeek` 渲染；
6. `apiVersion` 仅对 `Azure OpenAI` 渲染。

这在运行上没问题，但在结构上很弱：

1. 没有可复用的字段 taxonomy；
2. 没有共享的 advanced disclosure 模型；
3. 每新增或调整一个 provider，settings 文件都会继续膨胀，而不是 provider schema 增长。

### 2.2 Provider metadata 目前偏 runtime，不偏 UI

`src/llmProviders.ts` 当前暴露的是：

1. provider name；
2. category；
3. transport；
4. API key mode；
5. API test mode；
6. description/setup hint；
7. default config。

它当前还没有暴露：

1. 字段可见性分组；
2. core / contextual / advanced / developer-only 分类；
3. model discovery capability 元数据；
4. provider-specific 的 discovery endpoint family 或 fallback 顺序。

### 2.3 Config 形态兼容性好，但过于扁平，无法驱动更强的 UI

`src/types.ts` 中的 `LLMProviderConfig` 仍是扁平结构：

1. `apiKey`
2. `baseUrl`
3. `model`
4. `temperature`
5. 可选 `topP`
6. 可选 `reasoningEffort`
7. 可选 `thinkingEnabled`
8. 可选 `maxOutputTokens`
9. 可选 `localOnly`
10. 可选 `apiVersion`

这对以下目标是有利的：

1. `data.json` 向后兼容；
2. import/export 稳定；
3. 保持 `model` 作为唯一持久化 source-of-truth 字符串。

但它对以下目标是不利的：

1. 推导 advanced auto-expand 逻辑；
2. 在不新增元数据层的前提下表达 provider-specific 字段分组。

### 2.4 Model discovery 的基础只是局部存在，还没产品化

`src/llmUtils.ts` 已有一些可复用基础：

1. OpenAI-compatible base-URL normalization；
2. `apiTestMode=models-then-chat`；
3. connection test 中的 `GET /models` 探测。

这意味着 runtime 已经知道一些必要语义，模型发现并不是从零开始。

但还缺：

1. 一条一等公民的 `discoverProviderModels()` 服务；
2. 面向不同 endpoint family 的 parser；
3. 设置页中的 UI 接入；
4. 面向最终用户的“失败时安全回退到手动输入”行为。

## 3. 相对当前仓库的需求状态

| Requirement | 当前状态 | 结论 |
|---|---|---|
| 默认仅显示 required/default-visible 字段 | 未落地 | 当前 UI 仍然是单层 provider panel |
| 保持 `model` 在默认可见面 | 当前已满足 | 重构时必须保留 |
| 次级调优项收入 advanced settings | 未落地 | 需要 metadata + UI 重构 |
| 持久化 advanced 值存在时自动展开 | 未落地 | 需要从 live provider config 推导展开逻辑 |
| selective reuse Cherry Studio | 已形成具体研究结论 | 可以安全进入实现，不需要整体照搬 |
| 模型发现不能阻断手动配置 | 未落地 | discovery 必须是 additive 且 transient 的 |

## 4. Cherry Studio 对照结论

参考仓库：`/home/jacob/ref/cherry-studio`

Cherry Studio 值得复用的点：

1. strategy-registry 模型获取方式；
2. 按 endpoint family 分离 parser；
3. graceful fallback；
4. 面向 endpoint normalization 的真实回归覆盖。

不适合 Notemd 的点：

1. 持久化 `provider.models[]` 生命周期；
2. 更重的 provider-domain state；
3. 把 model CRUD / catalog management 做成一等产品子系统。

结论：

1. 应复用 discovery 的策略模式；
2. 不应复用持久化 catalog 架构。

## 5. 目标架构

### 5.1 字段 taxonomy

为 provider 字段增加共享 metadata，使每个字段都能归入：

1. `core`
2. `contextual`
3. `advanced`
4. `developer`

建议语义：

1. `apiKey`、`baseUrl`、`model` 属于 `core`；
2. `apiVersion` 对 Azure 这类 provider 也应属于 `core`；
3. `temperature`、`topP`、`reasoningEffort`、`thinkingEnabled` 属于 `advanced`；
4. `maxOutputTokens` 属于 `developer`，但一旦已有持久化 override 仍应可见。

### 5.2 Discovery capability metadata

给 `LLMProviderDefinition` 增加按 provider 的 discovery metadata：

1. 是否支持 discovery；
2. discovery family：
   - `openai-compatible`
   - `ollama`
   - `google`
3. 可选的 provider-specific 说明或禁用原因。

### 5.3 保持持久化结构简洁

不要引入第二棵 provider-state tree。

应保持以下不变量：

1. `LLMProviderConfig.model` 仍是持久化真值；
2. discovery 结果只作为瞬时建议；
3. import/export 格式不变。

## 6. 实施计划

### Phase 1：metadata uplift

涉及文件：

1. `src/llmProviders.ts`
2. 若需要，也可在 `src/types.ts` 增加辅助类型

产物：

1. 字段 taxonomy metadata；
2. discovery capability metadata；
3. 用于判断某个 provider 是否已有持久化 advanced 值的 helper。

风险：

1. 把过多 UI 行为硬塞进 runtime registry。

缓解：

1. metadata 保持 declarative 与 field-scoped；
2. 不把渲染逻辑搬进 provider registry。

### Phase 2：settings renderer 重构

涉及文件：

1. `src/ui/NotemdSettingTab.ts`

产物：

1. core-only 默认面；
2. 显式 advanced disclosure；
3. 当已有持久化 advanced 值时自动展开；
4. 保持手动 `model` 编辑仍是默认控制路径。

风险：

1. 对已有持久化 provider config 造成 backward-compatibility 回归。

缓解：

1. advanced 展开逻辑从当前配置实时推导；
2. 保留现有字段值与保存语义。

### Phase 3：lightweight discovery service

建议新增文件：

1. `src/providerModelDiscovery.ts`

产物：

1. 瞬时模型发现服务；
2. 首批仅支持：
   - OpenAI-compatible `GET /models`
   - Ollama `GET /api/tags`
   - Google Gemini `GET v1beta/models`
3. 共享的错误归一化与 graceful empty-result fallback。

风险：

1. 让用户误以为 discovery 对所有 provider 都是权威结果。

缓解：

1. 首批只支持 endpoint 语义足够稳定的 family；
2. 始终保留手动 model 输入；
3. 永不持久化远程 catalog。

### Phase 4：UI 接入

产物：

1. 在 `model` 字段附近提供轻量 “fetch models” 或 suggestion surface；
2. discovery 与保存流程之间不能形成阻塞依赖；
3. 一旦 discovery 失败，当前手动工作流必须完整可用。

### Phase 5：测试与文档

必须补齐的测试覆盖：

1. provider metadata 回归覆盖；
2. core/advanced 分组的 UI rendering 覆盖；
3. 基于持久化 advanced 值的 auto-expand 覆盖；
4. 已支持 endpoint family 的 discovery success/fallback 覆盖。

必须同步的文档：

1. `README.md`
2. `README_zh.md`
3. 本文
4. 如果实现状态变化，则同步更新 canonical matrix/audit 文档

## 7. 显式非目标

首批不要做这些事：

1. 持久化 provider model catalog；
2. 增加 model CRUD management；
3. 整体照搬 Cherry Studio 的 provider domain；
4. 对所有 provider 宣称完整模型发现覆盖；
5. 在隔离实现通道验证前，直接把半成品落到 main worktree。

## 8. 执行规则

执行应保持如下分工：

1. `main` 只承载 docs/progress truth，并保持 clean；
2. 实现工作在为该任务创建的 isolated worktree/branch 中推进；
3. 只有经过验证的、有界实现才合回主线。

这样才能在保持规划真值诚实的同时，避免把半落地的 control-plane 改动直接摊在当前 main 上。
