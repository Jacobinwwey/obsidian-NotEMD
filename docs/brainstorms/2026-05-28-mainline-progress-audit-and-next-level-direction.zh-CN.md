---
date: 2026-05-28
last_updated: 2026-05-28
topic: mainline-progress-audit-and-next-level-direction
canonical: true
---

# 当前主线进度审计与 Next-Level 方向

## 1. 为什么需要这份文档

仓库在 2026-05-25 的 bounded-recovery 审计之后又发生了一次解释层面的变化。

当前主线已经不应再被描述为：

1. 仍在证明 bounded recovery 是否真正落地；
2. provider-settings/model-discovery 还停留在第一阶段里程碑；
3. 当前 control-plane 边界还没有稳定说法。

现在真正需要的是更窄、更操作化的收口：

1. 按最新代码真值重述 current main；
2. 对照先前计划语言，指出哪些表述已经滞后；
3. 在不重开已收口存在性问题的前提下，明确下一阶段的有界推进方向。

主要对比来源：

1. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md`
2. `docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.zh-CN.md`
3. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.zh-CN.md`
4. `.trellis/spec/claude-dev/frontend/provider-settings-model-discovery.md`
5. 当前主线代码中的：
   - `src/llmProviders.ts`
   - `src/providerModelDiscovery.ts`
   - `src/openaiCompatibleEndpointFamily.ts`
   - `src/providerRequestHeaders.ts`
   - `src/ui/NotemdSettingTab.ts`
   - `src/main.ts`
   - `src/llmUtils.ts`

## 2. 当前主线真值

### 2.1 Packaging / runtime 真值仍刻意保持收窄

这一轮并没有改变发货边界：

1. 当前构建真值仍然是单入口 `main.js`；
2. `audit:render-host` 仍然只承认 inline/runtime-host 真值，不承认已发货 detached render-host asset；
3. 源码里继续保留 latent render-host/runtime candidates，但它们仍是源码组织层真值，不是 release 真值。

正确解释：

1. packaging 仍然是独立架构轨道；
2. provider-settings/model-discovery 的推进不能模糊 packaging 真值。

### 2.2 CLI / automation 真值边界未变，但重要性更高

最近的 provider 工作没有扩宽 public CLI surface。

当前真值仍然是：

1. public-safe export slice 仍然刻意保持收窄；
2. maintainer/helper surface 依然更宽，但有边界；
3. provider-settings/model-discovery 的改进仍然属于产品面与设置面，而不是更宽 public CLI 契约的证据。

正确解释：

1. 不要把新的 provider helper 能力写成 public CLI 已扩宽；
2. CLI 是否提升仍是独立决策门。

### 2.3 产品面真值已明显跨过旧 recovery 基线

先前恢复回来的有界产品切片仍然稳定存在于当前主线：

1. preview history 与 saved-artifact-aware reopening；
2. onboarding release digest；
3. settings reset；
4. concept-note prerequisite guidance；
5. 面向有界任务集的 local knowledge-base retrieval；
6. chapter split 与确定性的 managed-artifact 行为；
7. regex/file-selection profiles 与 batch input 控制；
8. API liveness/activity UI 与相关 operator feedback surface。

正确解释：

1. 当前进展瓶颈已经不是“这些用户可见 guardrail 有没有回来”；
2. 下一瓶颈是 control-plane 收敛与有界宽度管理。

### 2.4 Provider settings 与 model discovery 才是当前主线最主要的 control-plane 真值变化

当前 `main` 现在直接携带的有界收敛程度，已经明显超过 2026-05-25 审计里的描述。

现在已经真实成立的是：

1. `src/llmProviders.ts` 已不再只是 transport/runtime metadata：
   - 现已承载共享 `settingFields` taxonomy（`core`、`contextual`、`advanced`、`developer`）；
   - 现已承载按 provider 的 `modelDiscovery` metadata；
   - 现已支持 provider-specific/manual-first discovery disable reason；
   - 现已支持 canonical provider-name normalization 与 host-aware known-model token lookup。
2. `src/ui/NotemdSettingTab.ts` 已不再主要依赖 provider-name 来决定设置 taxonomy：
   - provider panel 现在通过共享字段 metadata 渲染；
   - advanced disclosure 的开合状态会在当前设置会话内跨 re-render 保持；
   - 已存在的 advanced/developer override 在需要时仍会强制可见；
   - discovered-model selection 现在会更新 model 字段、给出 apply feedback、收起 discovered-model panel，并进入 model-aware token 同步链路。
3. `src/providerModelDiscovery.ts` 已不再只是最小 first-batch helper：
   - 现在支持的有界 family 批次包括 OpenAI-compatible presets、OpenRouter、LiteLLM proxy-family、Together、Anthropic、Ollama、Google、Huawei Cloud MaaS、Vercel AI Gateway、AIHubMix、GitHub Models、PPIO、OVMS 与 xAI；
   - 现在能容忍更宽的 wrapped catalog，例如 `provider_models`、`providerModels`、`publisherModels`、`registry`、`registries` 与 `services`；
   - 现在会保留瞬时 discovered-model metadata，例如 label、owner/provider hint 与 max-output-token hint；
   - 现在会对 `models/<id>` 与 `publishers/<owner>/models/<id>` 这类 resource-style 名称做保守归一化；
   - 现在会把更宽目录优先过滤到 generation-relevant models，而不是把 embedding/reranker/speech 等条目一股脑暴露到设置选择器里。
4. `src/openaiCompatibleEndpointFamily.ts` 与 `src/providerRequestHeaders.ts` 现在已经成为共享 control-plane seam：
   - family detection 现在能把本地 OVMS 风格 `/v3` 端点与 LiteLLM 风格本地 proxy 分开；
   - runtime 与 discovery 现在复用同一套 compatibility-header owner，包括 `Authorization`、`X-Api-Key`、OpenRouter/Requesty referer-title header、AIHubMix `APP-Code`、GitHub Models API version header 与 Cerebras integration header。
5. model-aware token guidance 现在已变成显式状态，而不再只是启发式碰巧一致：
   - `globalModelAwareMaxTokensTracking` 现在持久化当前 auto-managed baseline；
   - `Fetch model list -> Use`、手动改模型、settings reload、reset 行为与 runtime request ceiling 选择，现已共享同一条 token-guidance 真值链路；
   - generic/custom gateway 现在也可以在 registry 明确返回 owner/provider hint 时，对 bare model ID 有界复用上游 token-cap metadata；但任意 bare-model 猜测仍然不在边界内。

正确解释：

1. 这条轨道已经跨过“先把架构 bootstrap 起步”的阶段；
2. 现在进入的是 bounded breadth management 与 truth-maintenance 阶段。

## 3. 相对先前方案语言的深度对比

### 3.1 2026-05-25 审计现在低估了什么

更早的 bounded-recovery 审计现在在一个关键点上已经滞后：

1. 它仍把 provider 轨道描述成 current main 只完成了第一阶段有界收敛；
2. 它仍保留了一些“metadata-driven settings 相对于硬编码 settings 仍待落地”的旧措辞；
3. 它仍把 discovery 批次想象成更窄的 OpenAI-compatible/Ollama/Google surface。

当前代码已经直接推翻这些旧表述：

1. metadata-driven settings rendering 已落地；
2. provider-specific discovery disable reason 已落地；
3. bounded discovery 现在已明显超出最初三个 family 的 starter batch；
4. runtime/discovery 的 header 与 endpoint-family 对齐已落地；
5. discovered-model token metadata 现在会直接影响 settings 默认值。

正确解释：

1. 那份旧审计对 packaging 与 lane ordering 仍有用；
2. 但它已经不再适合作为 provider 轨道的真值源。

### 3.2 2026-05-27 provider 专题文仍然正确的部分

provider 专题文在以下几点上仍然正确，而且不应被放松：

1. 持久化结构必须保持简单；
2. 手动 `model` 必须继续作为唯一持久化 provider-side 真值；
3. 优先走共享 family 语义，而不是 provider-name 分支；
4. Cherry Studio 只复用策略思想，不复用持久化 catalog 子系统；
5. 文档必须诚实描述已支持与未支持边界。

这些仍应视为硬约束。

### 3.3 2026-05-27 provider 专题文现在低估了什么

该文档现在也在若干处低估了 current main：

1. 它在 Phase 3 的叙述里，仍偏向“首批 discovery helper”；
2. 它还没有充分突出对 wrapped registries 与 resource-name normalization 的 parser 扩宽；
3. 它没有把以下三类 token guidance 清晰区分：
   - generic `OpenAI Compatible` 在 trusted host 上的 bare-model token 复用；
   - generic gateway 上基于 registry owner hint 的 bare-model token 复用；
   - gateway/provider-prefixed model 的 token 推断；
   - 刻意保持更窄的 globally consistent fallback。

正确解释：

1. 这份专题文现在更适合作为 control-plane contract 文档，而不是“未来实现草案”；
2. 下一步工作是有界扩充与真值维护，而不是首轮交付。

### 3.4 当前统一矩阵必须继续防止的误判

统一矩阵现在需要明确防住三类反复出现的误读：

1. 把当前更宽的 bounded discovery 误写成 all-provider discovery；
2. 把 host-aware bare-model token lookup 误写成 arbitrary custom gateway 上也能自动推断 owner；
3. 把已有共享 parser seam 误写成以后可以顺手持久化 remote catalog，而不需要新的显式架构决策。

## 4. 架构推进评估

### 4.1 真正推进了什么

1. provider control plane 现在可以通过共享 metadata 扩展，而不再只能靠手工堆 settings 分支。
2. discovery 与 runtime 在 endpoint-family 和 header-owner 层已经更收敛。
3. token guidance 不再只是 UI hint，而是已经进入持久化 settings 状态与 runtime ceiling 行为。
4. discovery parser 相比最初落地 helper，已经对真实 registry 漂移、wrapped catalogs 与 resource-style names 更鲁棒。

### 4.2 仍然存在的结构约束

1. packaging 真值仍刻意比源码组织层更窄。
2. discovery 仍按设计保持瞬时，不存在持久化 remote model catalog。
3. 当前 bounded discovery family 批次已经足够宽，需要纪律，但还远没到可以宣称“通用 provider discovery”。
4. generic `OpenAI Compatible` 对 owner 的推断仍必须保持保守；超出 trusted host、显式 registry owner hint 与显式 prefix 的部分，token ceiling 仍应保持 unresolved。

### 4.3 如果这条线现在漂移，最大的风险是什么

现在最大的风险已经不是“没实现出来”，而是“边界纪律丢失”。

最可能的失败方式：

1. ad hoc 的 provider-name special-case 又开始替代 family-based shared logic；
2. 文档开始夸大与 Cherry Studio 的 parity；
3. settings/discovery token guidance 与 runtime token-ceiling 逻辑再次漂移；
4. 未来有人顺手“把抓到的模型列表存起来”，静默造出第二套 provider-state subsystem。

## 5. 具体下一阶段方向

### Batch A：继续保持 provider 轨道处于 shared-core 模式

优先级：`P1`

目标：

1. 继续只通过共享 family 语义或 wrapped-catalog shape 支持来扩宽能力；
2. 除非 transport 或 discovery 契约真的不同，否则拒绝退回 provider-name-only 分支。

硬规则：

1. 每个新的 provider/discovery 扩展，都必须在同一批次里明确 family mode、header owner、endpoint normalization、token-guidance 行为，以及测试/文档。

### Batch B：完成当前有界 discovery 真值维护

优先级：`P1`

目标：

1. 继续审计真实返回体，找出还能被当前共享 parser 契约吸收的 wrapped catalog shape；
2. 只有在数据形态与现有 control-plane 架构兼容时才扩支持。

可能的工作：

1. 如果真实端点证明有价值，再补更多 wrapped registry/container key；
2. 只在语义安全时，再补更多 resource-style naming pattern；
3. 只在 ownership 在运维上足够显式且稳定时，再补更多 trusted-host 推断。

### Batch C：把文档与测试继续作为实际边界护栏

优先级：`P0`

目标：

1. 防止后续会话又把 current-main 真值降回过时的计划措辞；
2. 持续保持矩阵、专题文、README/change surface 与聚焦回归测试同步。

验收：

1. 专题文描述的 bounded discovery surface 与代码/测试一致；
2. 统一矩阵不再暗示旧的 first-batch-only 状态；
3. 下一位维护者能直接看懂什么已发货、什么仍然超出范围、以及原因。

### Batch D：继续把 packaging 与 public CLI 分开处理

优先级：`P0/P1`

目标：

1. 不要让 provider 轨道的推进被误读成 packaging 或 public CLI 已扩宽；
2. 保持主线叙述上的边界分离。

### Batch E：恢复诚实的 clean-state 收口

优先级：`P0`

目标：

1. 把当前 provider/settings/model-discovery 轨道与其它脏工作树改动明确拆开，而不是继续把整仓库当成一个没有命名边界的 WIP 桶；
2. 恢复仓库文档里定义的 finish 要求：current-main 真值更新最终应以真实 clean 的 `git status` 收尾，而不是只停留在测试全绿。

当前审计现实：

1. 当前 worktree 仍然不 clean，尽管 provider 这条线本身的 build/tests/audits 已经是绿的；
2. 当前 dirty state 横跨 provider/runtime 代码、进度文档、maintainer docs 与测试补充，现阶段还不能声称已经拿到 clean-state 证明；
3. 下一步真正需要的是提交边界隔离，而不是继续扩写真值文案。

必须跟进的动作：

1. 按轨道把 dirty files 拆成可审计的 commit batch；
2. 不把无法解释或无关的 dirty path 混进同一批；
3. 只有这些批次真正落下后，本文中的 clean-state gate 才能被视为满足。

## 6. 文档同步规则

未来任何会更新 provider-settings/model-discovery 轨道真值的改动，至少都应同步检查：

1. `change.md`
2. `README.md`
3. `README_zh.md`
4. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.*`
5. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
6. 本文

## 7. 验证门禁

任何会改变本文真值判断的更新，仍应以以下结果收尾：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean 的 `git status --short --branch`

## 8. Bottom Line

当前 `main` 已经不再需要再做一次“provider settings 这条线到底有没有落地”的论证。

现在真正的问题是：

1. 已扩宽的 bounded discovery surface 能否继续保持 shared-core、lightweight 且边界诚实；
2. token guidance、discovery metadata、runtime 行为、测试与文档能否继续同步收敛，而不是再次漂移；
3. 仓库能否继续把 packaging 真值、public CLI 真值与 provider control-plane 真值明确分开；
4. 当前脏工作树能否最终被拆成可审计的 commit batch，让文档里写着的 clean-state 要求从“政策”真正变成“已证明事实”。
