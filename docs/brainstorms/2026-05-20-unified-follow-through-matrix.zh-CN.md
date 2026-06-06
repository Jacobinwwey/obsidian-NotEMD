---
date: 2026-05-20
last_updated: 2026-06-06
topic: unified-follow-through-matrix
canonical: true
---

# 主线统一推进矩阵

> 目的：保留一份单一执行矩阵，明确区分 **被重写后的 live mainline** 与 **仍保留更多后续工作结果的备份分支**，避免后续规划继续高估当前主线已发货进展，或把新的结构性瓶颈继续隐藏起来。

## 1. Source-Of-Truth 规则

从这次检查点开始：

1. 重写后的 `origin/main` 才是唯一的当前发货真值。
2. `backup/main-before-origin-force-20260524` 只是 reintegration 证据，不是当前 release 真值。
3. 任何新的当前进展都先更新本文。
4. 只有当代码、测试、文档都真实存在于重写后的主线上时，某条轨道才允许被写成“已落地”。

## 2. 审计基线

本文基于以下事实建立：

1. 2026-05-24 force rewrite 之后的 live `origin/main`，并在 2026-06-06 基于 `1.9.2` 发货边界以及后续 post-release contract/evidence follow-through commits 重新审计当前 `main` 工作树；
2. 先前仍与当前主线相关的文档：
   - `docs/brainstorms/2026-05-07-cli-next-phase-planning.*`
   - `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.*`
   - `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
   - `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
3. 来自 `backup/main-before-origin-force-20260524` 的备份分支证据。

## 3. 当前统一矩阵

| 轨道 | 当前 `origin/main` 真值 | 备份分支证据 | 需要的下一步 | 严禁误判 | 优先级 |
|---|---|---|---|---|---|
| A. Packaging / semantic verification | 当前 live build/audit 真值仍是单入口 `main.js` + inline `srcdoc`；源码中仍保留 render-host runtime 候选模块，但当前执行链与审计真值已明确把它们保持为 non-shipped，并拒绝残留的 `render-host.mjs` 资产/引用 | 更晚的备份分支曾进入更宽的 dedicated runtime-asset 通道 | 重新把它视为当前主线最优先的架构瓶颈：在未来真正补齐 build + release + audit + 文档之前，继续把当前 source-only 决策写清楚 | 不要因为 `src/` 里重新出现 runtime 候选代码，就继续把 `render-host.mjs` 写成当前主线已发货 | P0 |
| B. CLI / automation surface | 当前主线现已具备 registry-backed 的 config/profile export/import、脱敏 provider 导出、public-surface 导出、已进入 registry-backed typed contract 的 `content.split-note-by-chapters`，以及覆盖有界 path-based 操作与 export 操作的 repo-local maintainer help/invoke 脚本，其中也包含 maintainer-only 的 `local-knowledge.inspect` retrieval introspection | 备份分支还承载过更宽的 maintainer-bridge 设想，但当前 reintegration 刻意保持在窄边界内 | 继续把 maintainer helper 的边界写清楚；若任何 path-based operation 要提升为更广或更公共的 CLI 面，必须同批补齐契约/测试/文档；不要让最近 provider/settings 进展模糊这条分层边界 | 不要把当前能力面写成通用 public CLI，或无边界的 maintainer mutation API | P1 |
| C. 用户可见 settings / preview / onboarding | 当前主线现已具备 preview flows、preview history、欢迎弹窗 release digest、provider diagnostics、settings reset、concept-note 前置配置提示、API liveness/activity UI、面向已保存工件的 preview 恢复链路、已恢复的 sidebar footer/API activity 滚动布局，并已重新同步 `1.9.2` 的 release-facing version truth | 备份分支还有更多 UX 收口尝试，但目前已恢复切片加上后续 `1.9.2` 的 sidebar 可观测性修复，已在当前主线上重新证明 | 继续保持 sidebar / preview / settings 的文案、i18n、已保存工件行为、footer-scroll 布局与 release-facing version truth 一致 | 不要再把这些 UX guardrail 写成“当前主线缺失”，但也不要顺手高估尚未恢复的 UX 想法，更不要把布局修复误写成 CLI/runtime 边界变化 | P1 |
| D. Regex / 文件筛选 / local-KB / chapter split | 当前主线现已具备 file-selection profiles、文件夹 regex/glob 筛选、`relativePath` / `basename` 匹配、可选子目录范围控制、覆盖 `从标题生成`、`从标题批量生成`、`研究与总结`、`生成图形` 的 local-KB retrieval、混合的 Vault 相对文件/文件夹知识库路径、带默认回退语义的按任务知识库覆盖列表、chapter split、面向重复标题的稳定 TOC block ref、确定性的 TOC front-matter metadata、manifest-backed 的 guarded rerun overwrite 语义、对应回归测试、面向标题生成/研究总结/artifact-mode 图形结果路径的 machine-readable retrieval 摘要与 timing/size telemetry、用于检查 effective path/query/context 的 maintainer-only retrieval inspect seam、支持临时 `knowledgePaths` override 数组做 ad hoc task-scoped retrieval 检查、结构化 `queryDiagnostics`，以及通过 `npm run verify:local-kb-fixtures` 暴露、且已覆盖 mixed file/folder task-scoped inspect case，并新增覆盖重复/空白 override、非 Markdown 干扰文件、无关文件夹与空 section 候选的 noisy mixed-corpus scope 的更宽离线夹具 | 备份分支提供了最初恢复证据；当前主线现在已直接携带该有界产品切片、后续 Stage C 收口结果，以及 `1.9.2` 的 inspect explainability 收紧 | 下一步应转向更多真实 note/query corpus 覆盖、maintainer example 对齐、chapter-split showcase/doc 对齐与评估深度收口，而不是继续证明这些能力“是否存在” | 不要继续把这些能力写成只存在于 backup、或 live mainline 尚未具备；不要把 single-title / task-scoped retrieval 契约从文档里漏掉；也不要在文档或契约里把 retrieval 再压回 boolean-only signaling | P1 |
| E. Provider settings / model discovery | 当前主线现已具备 metadata-driven 的 provider settings panel：其背后由 `src/llmProviders.ts` 提供共享字段 taxonomy，支持显式的 core/contextual/advanced/developer 分组、基于持久化 override 的 advanced auto-expand，以及面向一批已验证 OpenAI-compatible `/models` 预设（含 LM Studio、Groq、Fireworks、多项中国区 provider、`New API`、`OVMS`）、OpenRouter 有界 chat + embedding catalog 聚合、LiteLLM 显式 proxy-family `/models` + `/model/info` 聚合、Together 专用 `/models` 响应、Anthropic `GET /models`、Ollama tags、Google Gemini model listing、Huawei Cloud MaaS 专用 `v2/models`、Vercel AI Gateway 有界 `/v1/models` + `v3/ai/config` 双源合并、`AIHubMix` 托管 `/api/v1/models` registry、`GitHub Models` 的 `catalog/models` + `/v1/models` 双源发现、PPIO 的 chat + embedding + reranker 三路有界发现、OVMS 优先 `/v3/models` 并有界回退 `/v1/config` 的本地发现，以及 xAI 的 `/v1/language-models`；Google `nextPageToken` 与 Anthropic `has_more` / `last_id` 这类分页 registry 现在也会做有界多页遍历；runtime 与 discovery 还已收敛到共享的 OpenAI-compatible header owner 与 endpoint normalization，以避免 `Authorization` / `X-Api-Key` / `provider-specific compatibility header` 语义继续漂移，并容忍 `/responses`、`/chat/completions`、`/models` 这类 endpoint 形态；generic `OpenAI Compatible` 还会把 OVMS 风格本地 `/v3` 端点与 LiteLLM 风格本地 proxy 分开路由；同时仍保持手动 `model` 字符串作为持久化 source-of-truth，共享 parser 现已兼容 object-shaped proxy catalog、nested `specification.modelId`、wrapped `provider_models` / `publisherModels` / `registry` / `services` 目录，以及 `models/<id>`、`publishers/<owner>/models/<id>` 这类 resource-style 名称归一化，并已补齐对 gateway/provider-prefixed 模型的有界 token-cap guidance；此外，当 generic `OpenAI Compatible` 的 base URL 指向 OpenAI、DashScope/Qwen、Xiaomi MiMo、Fireworks、Hugging Face 这类已知 trusted official host 时，bare model ID 现在也会复用官方 provider 的 token-cap 元数据 | 这里没有值得“恢复”的 backup-branch 已发货实现；这条能力来自 current-main 代码、`.trellis/tasks/05-27-provider-settings-model-discovery/` 下的 Cherry Studio 对照研究，以及已经验证完成并合回的隔离实现通道 | 把这条轨道降为 bounded breadth-maintenance：继续通过共享 family/response-shape 语义扩宽支持，而不是退回 provider-name 分支；只有在 endpoint 语义、header owner、fallback 行为、token metadata 与测试/文档都足够稳定时，才扩到更多 provider family | 不要把当前有界 helper 误写成已经具备完整 Cherry Studio parity、持久化远程 model catalog、或所有 provider 都支持模型发现；generic `OpenAI Compatible` 的 bare model token ceiling 也只能在已知 trusted host 上写成当前主线真值，不能扩写成对任意 custom gateway 都成立 | P1/P2 |
| F. Release / repo-saga / clean-state hygiene | 当前主线现已具备 release/repo-saga 脚本、repo-saga 执行锁、测试、文档、本地工件忽略 guardrail、chronicle refresh authorship 保护，且 release assets / tags / notes / workflow tag-trigger globs / workflow-source branch / chronicle-target branch 已进入同一套 shared release contract；远端主线同步到已发货 `1.9.2` 后也持续保持 clean-state 收尾纪律 | 备份分支推动了这些 guardrail；当前主线已恢复有界串行安全切片并进一步收紧 release truth | 保持 repo-saga 刷新流程的串行纪律，让 release-facing truth 始终与真实发货分支头部一致，让 workflow trigger、workflow-source 与 chronicle-target 真值继续由 contract 锁住，并把 clean-state 证明作为持续满足的收尾不变量，而不是重新积累成“以后再清理”的债务 | 不要把“脚本还在”误读为“可以并行跑 repo-saga 刷新路径”，不要让 YAML-local trigger 或分支 bootstrap 字面量漂离 repo-owned release contracts，也不要再回到“先做完再说，工作区之后再清”的收尾漂移，或继续使用过时版本真值措辞 | P0 |

## 4. 当前主线已确认 register

以下内容可以安全地继续描述为当前主线已存在：

1. packaging / semantic helper 与 maintainer 文档；
2. inline render-host 审计与相关测试；
3. provider profile export/import 命令面；
4. 欢迎弹窗 release digest；
5. preview artifact save/export helpers；
6. 脱敏 / public-safe CLI 导出表面与仓库内 maintainer help/invoke（含有界 path-based 操作）；
7. settings reset、concept-note 前置提示、concept synonym suppression 与 API liveness/activity UI；
8. file-selection profiles 与 folder-scope regex/glob 控制；
9. local knowledge-base retrieval，包括单文件标题生成与按任务启用、混合文件/文件夹知识库源路径、面向标题生成、研究总结与 artifact-mode 图形结果路径的 machine-readable retrieval 摘要、用于检查 effective path/query/context 的 maintainer-only `local-knowledge.inspect` seam、用于 ad hoc task-scoped 检查的临时 `knowledgePaths` override 数组，以及 `npm run verify:local-kb-fixtures` 这条现已覆盖 mixed file/folder task-scoped inspect case 与 noisy mixed-corpus scope 的有界离线夹具；
10. chapter split（含 repeated-heading-safe TOC block ref、确定性的 TOC front-matter metadata 与 guarded rerun overwrite 语义）；
11. package metadata、welcome digest、README family、change log 与 release-note artifacts 上当前 `1.9.2` 的 release-facing version truth；
12. transport-driven provider registry 增长，以及 OpenAI-compatible base-URL normalization、`models-then-chat` probing 等连接测试语义，同时仍保持手动 model 输入作为 live configuration truth；
13. 当前主线已落地的 schema-driven provider-settings field grouping、基于持久化 advanced 值的自动展开，以及当前有界 family 批次的 in-plugin provider model discovery suggestions，包括 OpenAI-compatible（含 LM Studio、多项中国区 provider、Groq、Fireworks、`New API`、`OVMS`）、OpenRouter、LiteLLM proxy-family、Together、Anthropic、Ollama、Google、Huawei Cloud MaaS、`AIHubMix`、`GitHub Models`、`PPIO`、Vercel AI Gateway 与 xAI；
14. 当前主线已落地的 host-aware token-cap guidance：generic `OpenAI Compatible` 在 base URL 指向已知 trusted official host 时，可让 bare model ID 复用上游 provider 的已知输出 token ceiling；手动 typed model change 仍可推进全局 auto-managed baseline，而 transient discovered-model max-output-token hint 则只驱动 provider-scoped 的输出 Token 覆盖上限 autofill，不会静默改写全局 `Max tokens`。

以下内容当前必须描述为 **未在重写后的主线上被证明存在**：

1. 已发货 dedicated runtime assets；
2. 超出当前有界 path-based helper 边界的更宽 maintainer mutation surface；
3. 任何绕开当前单入口 `main.js` + inline `srcdoc` 真值的 dedicated-runtime 叙述；
4. 当前主线已存在持久化 provider model catalog 或 Cherry Studio 风格 model CRUD 子系统的说法；
5. 当前主线已覆盖所有 provider 的 remote model discovery，或任意 custom gateway 都自动具备权威模型发现、token metadata 与 provider ownership 推断能力的说法。

## 5. 单一执行顺序

除非出现打断当前顺序的回归：

1. **P0**：保持 packaging / semantic 当前主线真值诚实
2. **P0/P1**：先解决当前 latent render-host runtime source 与实际 shipping build 之间的歧义，再决定是否拓宽 packaging 叙述
3. **P1**：保持有界 CLI / maintainer-surface 真值收敛且测试充分，再决定是否有 path-based operation 适合做有界 public 提升
4. **P1**：通过更宽 corpus 评估与 maintainer 示例对齐，继续深化 file-selection、local-KB、chapter split 的质量，而不是重开“功能存在性”论证
5. **P1/P2**：把已落地的 provider-settings/model-discovery control plane 作为维护轨道持续收口，只通过显式 shared-core 语义继续扩 family
6. **P1**：持续保持已恢复的用户可见 settings / preview guardrails 在代码、i18n、文档与 `1.9.2` release-facing version truth 之间一致
7. **P0**：把 repo-saga 串行 guardrail 与 clean-state 证明继续作为每个批次的 finish criteria

## 6. 文档同步规则

每次触碰任一轨道，至少同步检查：

1. `change.md`
2. 对应专题 brainstorm 文档
3. 本矩阵
4. 若涉及 automation/verification 文案，则同步检查对应 maintainer 文档

## 7. 验证门禁

任何会更新本文判断的改动，都必须以以下结果收尾：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean 的 `git status --short --branch`
