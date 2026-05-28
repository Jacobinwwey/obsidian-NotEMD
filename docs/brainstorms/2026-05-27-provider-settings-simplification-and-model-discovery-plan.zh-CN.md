---
date: 2026-05-27
last_updated: 2026-05-28
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
4. provider-specific 的 discovery endpoint family 或 fallback 顺序；
5. 对刻意保持 manual-first 的预设，允许附带可选 disable reason。

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

### 2.4 Model discovery 的基础已不再只是局部 helper

`src/llmUtils.ts` 已有一些可复用基础：

1. OpenAI-compatible base-URL normalization；
2. `apiTestMode=models-then-chat`；
3. connection test 中的 `GET /models` 探测。

这意味着 runtime 已经知道一些必要语义，模型发现并不是从零开始。

但仍需要持续显式维护的真值是：

1. discovery 行为必须继续与 runtime/provider-family 语义对齐；
2. 瞬时 discovery hint 必须继续与持久化 provider state 分离；
3. discovered-model token autofill 的真实语义必须在 UI 与文档层保持诚实；
4. 不能回退到 provider-name-only 的 ad hoc 分支。

## 3. 相对当前仓库的需求状态

| Requirement | 当前状态 | 结论 |
|---|---|---|
| 默认仅显示 required/default-visible 字段 | 已落地 | 当前 main 已通过共享字段分组元数据渲染 provider settings，并默认展示 core controls |
| 保持 `model` 在默认可见面 | 当前已满足 | 重构时必须保留 |
| 次级调优项收入 advanced settings | 已落地 | 次级调优项现已收入显式 advanced disclosure |
| 持久化 advanced 值存在时自动展开 | 已落地 | 当前实现会根据持久化 provider override 派生展开状态 |
| selective reuse Cherry Studio | 已以有界形态落地 | 已落地实现复用了 discovery 策略思路，但没有照搬持久化 provider-model catalog |
| 模型发现不能阻断手动配置 | 已落地 | discovery 是 additive/transient 的，手动 `model` 输入仍是持久化真值 |

## 3.5 已落地实现检查点

截至 2026-05-27 收口，隔离 `feat/provider-settings-model-discovery` 通道中的实现已经完成验证并合回 current main。

当前 main 上现已存在的内容：

1. `src/llmProviders.ts` 已加入一版 provider-field taxonomy metadata（`core`、`contextual`、`advanced`、`developer`）与按 provider 的 model-discovery metadata。
2. 新增了一个瞬时 `src/providerModelDiscovery.ts`，有界覆盖：
   - 一批已验证的 OpenAI-compatible `GET /models` 预设
   - OpenRouter 有界的 chat + embedding catalog 聚合
   - Together 专用的 `/models` 数组响应
   - Anthropic `GET /models`
   - Ollama tag listing
   - Google model listing
3. `src/ui/NotemdSettingTab.ts` 中已有一版 metadata-driven provider panel 重构尝试，包含：
   - 默认/core 字段渲染
   - contextual 字段渲染
   - advanced disclosure
   - 基于持久化 advanced 值的派生 auto-expand
   - 可选的 fetch-models UI wiring
4. 对应 locale keys、README/update surface 与聚焦测试也已经补入。
5. 当前 main 还继续补齐了这条 lane 的有界 provider 宽度收口：
   - 对旧持久化 provider 名称做 canonical alias 归一化，例如 `Xiaomi` -> `Xiaomi MiMo`
   - 补入并对齐共享 runtime 的额外 OpenAI-compatible 预设（`LiteLLM`、`Nebius`、`Cerebras`、`Hugging Face`、`Vercel AI Gateway`、`AIHubMix`、`GitHub Models`、`PPIO`、`New API`、`OVMS`）
   - 对 Vercel AI Gateway 走有界的 `/v1/models` + `v3/ai/config` 双源合并，对 xAI 单独走 `/v1/language-models` 并有界回退到 `/v1/models`，对 Huawei Cloud MaaS 单独走 `v2/models` registry endpoint，对 Together 单独走数组式 `/models` 响应，将 LiteLLM 显式归入 proxy-family 的 `/models` + `/model/info` 有界合并，对 PPIO 单独走 chat + embedding + reranker 三路有界合并，并让 OVMS 优先走本地 `/v3/models`、必要时再回退到 `/v1/config`，而不是假装它们和 generic `/models` 完全等价
   - 对 OpenRouter 单独走有界的 chat + embedding catalog 聚合，而不是假装它只是另一个 generic `/models` 网关
   - 对 Azure OpenAI 等 manual-first 预设补入 provider-specific discovery disable reason，使设置页在 Fetch model list 不可用时能解释原因，而不是只显示统一的“不支持”
   - 在设置页中加入 model-aware token guidance，使当前模型的已知最大输出 Token 上限能在 `Model`、provider override 与全局 `Max tokens` 旁被明确展示
   - 对 gateway/provider-prefixed model ID 增加有界 token-cap 推断，使 `openai/gpt-4o`、`anthropic/claude-sonnet-4.5` 这类已抓取模型在 owner 足够明确时也能驱动 `Max tokens` / chunk-size 指引，而不会反过来假装所有 custom gateway 上的 bare model 名称都能被无上下文归因
   - 扩宽 OpenAI-compatible payload 解析，兼容 `list` / `items`、object-shaped proxy catalog、嵌套的 gateway `specification.modelId` 与 endpoint-type-aware listing metadata
   - 继续增强共享 fetch-model-list 的真实返回体容忍度，补齐 provider-mapped 的 `provider_models` 对象目录、更宽的 `nextPageUrl` / `next_page_url` 分页信号、保持 provider 语义正确的 `after_id` 续页处理，以及 `supportedOutputModalities`、嵌套 `supportedGenerationMethods`、limit objects 等更丰富的 generation/modality 元数据解析
   - discovered-model 的 token guidance 现在还会继续吸收真实 hosted registry 中的 token-cap 字段，例如 `top_provider.max_completion_tokens`、`per_request_limits` 与 `limits.max_output_tokens`，从而让 `Fetch model list -> Use` 在静态 provider token registry 还不认识该模型时，依然能自动填入 provider-scoped 的输出 Token 覆盖上限
   - 对瞬时 discovered-model metadata 保留显示标签、owner/provider hint 与 max-output-token 提示，并引入 capability / modality / status 感知过滤，尽量避免更宽模型目录把不可用、仅音频或仅图像模型混入文本生成建议；当上游返回体缺少主标识时，只把 alias 用作后备 identifier，而不会把所有 alias 都展开成独立选项
   - AIHubMix 的 discovery 现在优先走官方 `?type=llm` 目录，而不是先拉完整混合多模态模型表再完全依赖本地过滤
   - 让 runtime 与 discovery 共享同一套 OpenAI-compatible endpoint 归一化（包括 `/responses` 这类端点形态），容忍用户粘贴带 query/hash 的 endpoint root，并让 generic host 自动升级也能识别 OVMS 风格的本地 `/v3` 端点，而不是把所有本地 host 都折叠进 LiteLLM proxy bucket
   - family-specific 的 discovery 归一化现在也能容忍用户直接粘贴官方 discovery endpoint 而不是 provider root，例如 OpenRouter 的 `/models` 或 `/embeddings/models`，以及 Vercel AI Gateway 的 `/v3/ai/config` 或 `/v1/ai/models`，从而让 fetch-model-list 仍能回到正确的 bounded registry 流程
   - generic/custom gateway 现在还可以在已抓取 registry row 明确给出 `owned_by`、`publisher`、`provider` 这类 owner/provider hint 时，对 bare model ID 有界复用上游 token-cap metadata；但任意 bare-model 猜测仍刻意保持为非目标

仍然刻意不做的内容：

1. 持久化远程 provider model catalog；
2. model CRUD / health-check management UI；
3. 对首批之外 provider 的泛化 discovery 覆盖宣称。
4. 假装所有 OpenAI-compatible gateway 都共享完全相同的 `/models` 语义。

### 3.6 当前 discovered-model token 语义

这部分最容易在后续会话中被写错，必须显式落盘。

current main 的真实行为是：

1. `Fetch model list -> Use` **不会**直接同步全局 `Max tokens` 或 `Chunk word count`。
2. 当 `autoApplyDiscoveredModelMaxOutputTokens` 开启时，应用 discovered model 会尝试解析 provider/model 级别的 max-output-token ceiling，并把结果写入该 provider 的 `maxOutputTokens` override。
3. 当前解析优先级是有界的：
   - curated/static known-model metadata
   - bounded host/owner-aware lookup
   - transient discovered-row max-output-token metadata
   - conservative fallback
4. 如果没有足够可信的 ceiling，插件当前会优先保留已有的有效 provider override；只有在当前没有可用值时，才会把保守 fallback（`DEFAULT_SETTINGS.maxTokens`，目前是 `8192`）写入 provider override，并明确提示用户手动复核。
5. 这个 fallback 不能被描述成“真实发现到的模型上限”，它只是 safety rail，不是模型真值。
6. 手动 typed model edit 仍然走独立的全局 model-aware token guidance 通道（`globalModelAwareMaxTokensTracking`），前提是全局 `Max tokens` 仍处在 auto-managed baseline 上。

为什么这个区分重要：

1. 它保住了用户自己维护的全局输出上限；
2. 它让 discovered-model apply 保持 additive，而不是静默重写跨 provider 的全局策略；
3. 它避免了“因为远端 registry 元数据弱/缺失，就把已有 provider override 清空”的坏行为。

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

当前检查点：

1. 已落地到 current main；
2. 当前 metadata 形态仍保持 declarative、field-scoped。
3. backward compatibility 现在还覆盖了 legacy provider name 的 canonicalization，包括 settings load 与 provider-profile import/export。

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

当前检查点：

1. 已落地到 current main；
2. default/core、contextual 与 advanced 分区现已通过共享 metadata 接线；
3. 对应 CSS/layout 支撑与样式测试也已进入发货面。
4. provider settings 现在还会展示 model-aware token guidance，并在 `model`、全局 `Max tokens`、chunk-size 提交后立即刷新。

### Phase 3：lightweight discovery service

建议新增文件：

1. `src/providerModelDiscovery.ts`

产物：

1. 瞬时模型发现服务；
2. 当前有界验证批次支持：
   - 一批已验证的 OpenAI-compatible `GET /models` 预设
   - OpenRouter 有界 chat + embedding registry 聚合
   - LiteLLM proxy-family `/models` + `/model/info`
   - Together `/models`
   - Anthropic `GET /models`
   - Ollama `GET /api/tags`
   - Google Gemini `GET v1beta/models`
   - Huawei Cloud MaaS `v2/models`
   - Vercel AI Gateway 有界 `/v1/models` + `v3/ai/config`
   - AIHubMix hosted registry
   - GitHub Models `catalog/models` + `/v1/models`
   - PPIO 有界 chat + embedding + reranker 聚合
   - OVMS `/v3/models`，并有界回退 `/v1/config`
   - xAI `/v1/language-models`
3. 共享的错误归一化与 graceful empty-result fallback。
4. 对 Google `nextPageToken`、Anthropic `has_more` / `last_id` 这类分页 registry 做有界多页遍历。

风险：

1. 让用户误以为 discovery 对所有 provider 都是权威结果。

缓解：

1. 首批只支持 endpoint 语义足够稳定的 family；
2. 始终保留手动 model 输入；
3. 永不持久化远程 catalog。

当前检查点：

1. 已按当前有界 family 批次落地到 current main，除最初的 OpenAI-compatible/Ollama/Google 基线外，现在还包括 Anthropic、LM Studio、OpenRouter、LiteLLM proxy-family、Together、Huawei Cloud MaaS、Vercel AI Gateway、AIHubMix、GitHub Models、PPIO、OVMS 与 xAI；
2. 它仍保持手动 `model` 输入为持久化 source of truth；
3. 不支持的 provider 仍然降级回手动输入，而不是引入重型 catalog 子系统。
4. gateway 的有界分流现在已经显式化：Vercel AI Gateway 现在会有界合并 `/v1/models` 与 `v3/ai/config`；OpenRouter 现在会有界合并 chat 与 embedding catalog；LiteLLM 显式走 proxy-family 的 `/models` + `/model/info` 有界合并；Huawei Cloud MaaS 走专用 `v2/models` registry endpoint；PPIO 走有界的 chat + embedding + reranker 三路合并；`OVMS` 优先走当前本地 `/v3/models`，必要时才回退到 `/v1/config`；`New API` 复用共享的 bounded OpenAI-compatible `/models` 路径；Hugging Face 则并入这条共享路径，不再保持 manual-first。
5. Google 与 Anthropic 在 provider 返回分页模型目录时，也会执行有界多页遍历，避免 fetch-model-list 静默停在第一页。
6. 共享 parser 的加固现在还覆盖了更宽的 wrapped catalog shape，例如 `provider_models`、`providerModels`、`publisherModels`、`registry`、`registries` 与 `services`，以及对 `models/<id>`、`publishers/<owner>/models/<id>` 的保守 resource-name normalization。

### Phase 4：UI 接入

产物：

1. 在 `model` 字段附近提供轻量 “fetch models” 或 suggestion surface；
2. discovery 与保存流程之间不能形成阻塞依赖；
3. 一旦 discovery 失败，当前手动工作流必须完整可用。

当前检查点：

1. fetch-models UI wiring 与瞬时 suggestion state 已进入 current main；
2. 新 provider-panel surface 的 styling 支撑已经落地；
3. README / update surface 现在也已描述同样的有界行为。
4. “应用成功提示”与 discovered-models collapse-state/persistence 行为现在也有聚焦行为测试覆盖。
5. gateway/provider-prefixed 的已发现模型现在也会进入有界 token-cap guidance，只在 owner 能被安全推断时才复用 ceiling；generic `OpenAI Compatible` 对 bare model 名称仍然保持保守，不做无上下文猜测。
5. discovery 结果现在还会有界地优先保留适合生成任务的模型，避免 embedding / reranker / speech / classifier 这类明显不适合当前设置页选择器的条目挤占列表，也能覆盖 object-shaped proxy catalog 与 endpoint-type-aware listing 这类更宽的返回形态。
6. 共享的 OpenAI-compatible provider family 现在还会显式保持 discovery/runtime 兼容头一致，避免某些依赖 `X-Api-Key` 或 provider-specific compatibility header 的端点在 fetch-model-list 上出现假失败。
7. 通用 `OpenAI Compatible` 预设在 base URL 指向 OpenAI、DashScope/Qwen、Xiaomi MiMo、Fireworks、Hugging Face 这类已知可信官方 host 时，现在也会让 bare model ID 复用官方 provider 的 token-cap 元数据，而不再要求这些场景必须写成 provider-prefixed gateway model ID。
8. 全局 model-aware token guidance 不再只是“数值刚好相等”的启发式：当前主线现已持久化显式 `globalModelAwareMaxTokensTracking` 标记，使手动改模型、runtime request token ceiling、以及 reset/reload 行为在用户未接管全局值时共享同一条 auto-managed baseline 真值链路。
9. `Fetch model list -> Use` 现在拥有独立的 provider-scoped persistence lane：`discoveredModelMaxOutputTokensTracking`，因此 discovered-model autofill 不再伪装成全局 max-token 管理。
10. 共享的 discovery/runtime header owner 现在也通过同一条 endpoint-family seam 显式收敛，因此 fetch-model-list 不会再轻易与 runtime 在依赖 compatibility header 的 provider 上发生语义漂移。
11. registry 返回的瞬时 owner/provider hint 现在也会进入 generic/custom gateway 的有界 bare-model token guidance，因此像 `gpt-4.1` + `owned_by: "openai"` 这样的 discovered row，也能在不强迫用户把持久化 model 改成 provider-prefixed ID 的前提下，安全驱动 provider output-token autofill 与 settings hint。

### Phase 5：测试与文档

必须补齐的测试覆盖：

1. provider metadata 回归覆盖；
2. core/advanced 分组的 UI rendering 覆盖；
3. 基于持久化 advanced 值的 auto-expand 覆盖；
4. 已支持 endpoint family 的 discovery success/fallback 覆盖。
5. 对 wrapped provider/publisher catalog 与 resource-name normalization 的 registry-shape 覆盖。

必须同步的文档：

1. `README.md`
2. `README_zh.md`
3. 本文
4. 如果实现状态变化，则同步更新 canonical matrix/audit 文档

当前检查点：

1. 聚焦的 i18n/test 更新已经落地到 current main；
2. canonical 文档现在把这条线描述为 current-main 已落地真值，而不是隔离实现进展；
3. 验证证据现已包含 targeted provider-settings/model-discovery tests 与完整仓库门禁。
4. 当前 settings surface 还额外写清了全局 `Max tokens` 与 provider-specific output-token override 的关系，以降低“两处 max tokens”造成的理解成本。
5. 当前文档现在应被视为 current-main 真值维护文档，而不是 pre-landing 的实现草案。
6. 当前 host-side 验证证据仍然是不对称的：
   - 已验证通过本机 Obsidian 的 plugin reload/state inspection；
   - 已用 focused Jest coverage 锁住 discovered-model apply feedback、provider override 写入、以及 fallback/manual-review 分支；
   - 但当前 host 的 Obsidian CLI/runtime surface 仍未暴露一个干净的可脚本化桌面点击入口，无法把 `Fetch model list -> Use` 的设置页真实点击链路完全自动化。

## 6.5 这条 lane 的下一步 bounded direction

下一步不该先继续扩 provider 宽度，而该先把 resolution stack 稳定下来。

优先切片：

1. 引入显式 layered “output ceiling resolver” contract：
   - authoritative provider-native metadata（若存在）
   - curated static registry
   - bounded host/owner-aware inference
   - transient discovery metadata
   - conservative fallback
2. 在 docs/tests/UI 中更清楚地区分三件事：
   - discovered model output ceiling
   - 当前实际写入的 provider override
   - 用户自己掌控的 global response cap
3. 保持 fallback 行为 fail-closed：
   - unresolved discovery 不能清空或降级已有的有效 provider override
   - fallback 值必须继续显式标注为 fallback/manual-review 值

## 7. 显式非目标

首批不要做这些事：

1. 持久化 provider model catalog；
2. 增加 model CRUD management；
3. 整体照搬 Cherry Studio 的 provider domain；
4. 对所有 provider 宣称完整模型发现覆盖；
5. 在隔离实现通道验证前，直接把半成品落到 main worktree。
6. 把 generic `OpenAI Compatible` 的 token owner 推断扩写到 trusted host、显式 provider prefix 或其他有界可证场景之外。

## 8. 执行规则

执行应保持如下分工：

1. `main` 只承载 docs/progress truth，并保持 clean；
2. 当 control-plane 爆炸半径较大时，可以先在 isolated lane 中推进有界实现；
3. 只有经过验证的、有界实现才合回主线。

这条线的验证证据：

1. targeted provider-settings/model-discovery tests；
2. 完整的 `npm run build`；
3. 完整的 `npm test -- --runInBand`；
4. `npm run audit:i18n-ui`；
5. `npm run audit:render-host`；
6. `git diff --check`。

这套流程既在开发期间保持了规划真值诚实，也避免把半验证的 control-plane 改动直接摊到当前 main 上。
