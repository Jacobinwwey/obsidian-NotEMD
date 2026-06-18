---
date: 2026-05-28
last_updated: 2026-06-18
topic: mainline-progress-audit-and-next-level-direction
canonical: true
---

# 当前主线进度审计与 Next-Level 方向

## 1. 为什么需要这份文档

仓库在 2026-05-28 的 provider-settings/model-discovery 收口审计之后，又发生了一次需要重新落盘的真值变化。

当前主线已经不应再被描述为：

1. 仍在证明 bounded recovery 是否真正落地；
2. provider-settings/model-discovery 还停留在第一阶段里程碑；
3. 当前 control-plane 边界还没有稳定说法。

现在真正需要的是更窄、更操作化的收口：

1. 以最新 `1.9.2` 发货边界、远端同步以及后续 post-release contract/evidence follow-through commits 为基准，重述 current main；
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
   - `src/localKnowledgeBase.ts`
   - `src/ui/NotemdSidebarView.ts`
   - `styles.css`
   - `website/docusaurus.config.js`
   - `website/src/pages/index.js`
   - `website/src/theme/DocItem/Layout/index.js`
   - `website/static/llms.txt`
6. 当前已发货 release/docs 真值：
   - `docs/releases/1.9.2.md`
   - `docs/releases/1.9.2.zh-CN.md`
   - `change.md`
   - `src/ui/welcomeReleaseNotes.ts`
7. 当前 GitHub Pages / GEO 真值：
   - `GEO_ROADMAP.md`
   - `website/README.md`
   - `.github/workflows/deploy-docs.yml`

## 2. 当前主线真值

### 2.0 当前 live 分支与 release 边界已经重新明确

当前审计基线不再是“某个计划之后的本地工作树”。

它现在明确是：

1. `origin/main` 已越过 `1.9.2` release cut，并包含后续 post-release contract/evidence follow-through commits；
2. 本地 `main` 在本批次开始前已重新同步到该远端头部；
3. 本文更新前仓库处于 clean 的 `main...origin/main` 状态。

正确解释：

1. 这次审计基于真实已发货且已重新同步的主线边界，而不是本地推演中的 WIP；
2. 任何仍把 remote sync 或 clean-state 写成未完成事项的旧措辞，都已经过时。

### 2.1 Packaging / runtime 真值仍刻意保持收窄

这一轮并没有改变发货边界：

1. 当前构建真值仍然是单入口 `main.js`；
2. `audit:render-host` 仍然只承认 inline/runtime-host 真值，不承认已发货 detached render-host asset；
3. 源码里继续保留 latent render-host/runtime candidates，但它们仍是源码组织层真值，不是 release 真值；
4. production build 路径现在已经围绕这条分层补上显式 guard：除非 release assets、audit rules 与 docs 同批前进，否则 `createRenderHostBundleBuildOptions()` 继续保持 candidate-only，不能被 `esbuild.config.mjs` 消费。

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
   - `globalModelAwareMaxTokensTracking` 现在持久化手动改模型、reset/reload 与 runtime request ceiling 选择所共享的全局 auto-managed baseline；
   - discovered-model apply 现在走独立的 provider-scoped lane（`discoveredModelMaxOutputTokensTracking`），而不是静默改写全局 token cap；
   - generic/custom gateway 现在也可以在 registry 明确返回 owner/provider hint 时，对 bare model ID 有界复用上游 token-cap metadata；但任意 bare-model 猜测仍然不在边界内。

正确解释：

1. 这条轨道已经跨过“先把架构 bootstrap 起步”的阶段；
2. 现在进入的是 bounded breadth management 与 truth-maintenance 阶段。

### 2.5 Clean-state 收口现在已经重新证明，不再处于待完成状态

旧审计里把 clean-state 写成仍待完成，现已不再准确。

当前真值是：

1. provider-settings/model-discovery 这一轮收口工作已经真实提交到 `main`；
2. 当前仓库已经回到 clean 的 `main...origin/main` 状态；
3. 对这条轨道来说，clean-state 已不再是阻塞 next-direction 讨论的未解前置条件。

正确解释：

1. clean-state 仍然必须继续作为后续每个批次的 finish gate；
2. 但本文不应再把它写成尚未完成的收尾欠账。

### 2.6 `1.9.2` 对主线真值的影响更窄，但仍然重要

最新一轮发货增量并没有重开新的架构轨道，而是收紧了已经落地轨道上的真值。

现在真实成立的是：

1. sidebar 可观测性布局回退已在发货主线上修复：
   - `styles.css` 再次明确包含 footer scroll container 与有界 API-activity 区域样式；
   - `src/ui/NotemdSidebarView.ts` 再次让日志输出与 API activity 处在同一个可滚动发货面中，不再让 activity 条目把日志顶出视野。
2. 本地知识库 inspect 在不扩大 public runtime contract 的前提下变得更可诊断：
   - `src/localKnowledgeBase.ts` 现在会暴露结构化 `queryDiagnostics`；
   - inspect 结果现在可以更清楚地区分低信号 basename 推导与健康 retrieval 路径，并对 `index.*` 这类导航型笔记给出 caution。
3. maintainer CLI 示例与文档更贴近真实运行时：
   - 文档与 helper 示例现在一致采用 `--vault docs` 下的 vault-relative 路径；
   - 这减少了 maintainer 示例与真实 retrieval / chapter-split 执行契约之间的漂移。
4. chapter split 现在已更明确地进入发货文档面，而不只是 maintainer 文档面：
   - chapter split + TOC 的独立聚焦文档与 showcase 资产已经进入 checked-in 的 release-facing documentation surface。
5. release 维护链路真值再次收紧：
   - chronicle refresh helper 现在会保留 maintainer 身份，而不是悄悄退回 bot-like identity。
   - workflow-source checkout 与 chronicle-target branch 真值现在归 `scripts/lib/packaging-contract.js` 所有，并通过 workflow env 名与 helper/tests 保持 GitHub Actions bootstrap 值一致。
   - release workflow 的 tag-trigger glob 真值现在也归 `scripts/lib/packaging-contract.js` 所有，`.github/workflows/release.yml` 只保留 GitHub Actions 在 checkout 前必须解析的 bootstrap 字面量。
   - semantic verification 现在会区分 workflow-start trigger 真值与数字版 release 准入：`*.*.*` 只负责启动 workflow，`scripts/release/validate-release-tag.js` 仍负责执行纯数字 `x.x.x` 契约。
   - 已检入的 release / chronicle / repo-saga 入口现在也已经具备 process-level 回归证明，而不再只依赖 helper 函数层测试：
     - `scripts/release/publish-github-release.js` 现在会通过真实 `--dry-run` create/repair 命令规划与非法/缺失 tag 的真实 wrapper 失败路径被执行；
     - `scripts/release/commit-chronicle-refresh.js` 现在会通过真实 clean no-op、显式 `--target-branch` override 与 git-status 失败路径被执行；
     - `scripts/repo-saga/update-quarterly-saga.mjs` 现在会通过真实 `--sync-only`、active execution-lock refusal、隔离的 `--no-readme --tag` 生成路径，以及非法参数的 fast-fail 路径被执行。
   - 已检入的 release helper 入口现在也具备 process-level 回归证明，而不再只依赖模块级 helper 测试：
     - `scripts/release/publish-github-release.js` 现在会通过真实 `--dry-run` create/repair 路径与真实 tag-wrapper 失败路径被执行；
     - `scripts/release/commit-chronicle-refresh.js` 现在会通过真实 clean no-op、显式 target-branch override 与 git-failure 路径被执行；
     - `scripts/repo-saga/update-quarterly-saga.mjs` 现在会通过真实 `--sync-only`、active-lock refusal、隔离的 `--no-readme --tag` 生成路径，以及 fail-fast 的非法参数路径被执行。

正确解释：

1. `1.9.2` 不是“新增架构主线”的 release；
2. `1.9.2` 之后的 release-contract 跟进仍在同一轨道内：减少 operator confusion、doc/runtime 漂移与 release-process 歧义，但不改变插件发货行为。

### 2.7 当前 `890b21b` Stage-B2/C/D 跟进基线

本文更新前的执行基线是 `890b21b`（`docs(progress): align post-recovery packaging truth`），本地 `main`、`origin/main` 与工作区在本批次开始前保持一致且 clean。更早的 local-KB fixture 锚点仍是 `824d07e`（`test(local-kb): cover chapter split showcase retrieval`）。

这条 fixture lane 的价值在于，它把 Stage-C 证据从叙事层推进到可运行检查：`npm run verify:local-kb-fixtures` 现在会用当前线上 MiniSearch-backed retrieval 路径，跑 real-note-style 的 chapter-split docs-vault 示例，并覆盖 managed artifacts、guarded reruns、稳定 TOC block refs、跨文件夹 task-contract retrieval，以及 chapter-split showcase 之外的真实 note/query 多样性。

当前 `7999a5f` 之后的跟进切片没有改 runtime retrieval algorithm，而是把已经通过 fixture 的真实 docs-vault 检索路径继续落到 maintainer operator surface：`local-knowledge.inspect` 的 helper help、双语 capability matrix 与文档对齐测试现在共同覆盖 explicit research query、跨文件夹 batch-title source path、diagram-source retrieval，以及有界 `topK` / `slidingWindowSize` override。这个切片的意义是减少“测试证明了，但维护者不知道怎么复现”的断层；它不改变 public CLI 边界，也不把 maintainer-only inspect seam 提升为用户 API。

对照 `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md`，当前逐项状态如下：

| PRD 要求 | 当前代码/文档真值 | 状态 | 下一步解释 |
|---|---|---|---|
| R1 local-KB 任务支持 | `从标题生成`、`从标题批量生成`、`研究与总结` 与 `生成图形` 在启用后已经进入 settings-driven retrieval 链路 | 已落地 | 不再把任务接线写成开放问题，后续投入质量深度 |
| R2/R3 local-only 与 fallback 行为 | 当前运行时使用插件内 MiniSearch lexical retrieval；关闭 retrieval 或没有可用 context 时保留原任务路径 | 已落地 | 应写成轻量本地检索，不应写成完整 semantic RAG 平台 |
| R4/R4a/R4b 设置与 source paths | 已支持混合 vault-relative 文件/文件夹知识库路径、默认列表、按任务覆盖，以及空覆盖回退默认列表 | 已落地 | 先提升示例与 inspect 易诊断性，再考虑更多任务类型 |
| R5 对比研究 | active task 的 `research/` 目录下已有 local-RAG 与 TOC 对比材料 | 已作为决策支撑落地 | 后续比较必须落到 Notemd 当前任务契约，不能泛化成 RAG 口号 |
| R6/R7 chapter split | command/sidebar/maintainer surface、确定性 TOC metadata、稳定 block refs、manifest-backed guarded reruns 与 managed artifact 结果已存在 | 已落地 | 随 result schema 演进，持续保持 showcase docs 与写入契约一致 |
| R8 packaging / semantic truth | 当前发货边界仍是 `main.js` + inline `srcdoc`，没有宣称 dedicated runtime asset | 已作为约束落地 | packaging convergence 是下一条 P0 架构轨道，不是已完成项 |
| R9/R10 tests、docs 与 CI 稳定性 | 现有集成测试与 `verify:local-kb-fixtures` 已覆盖 retrieval injection、fallback、inspect、chapter-split showcase 行为、跨文件夹 task-contract retrieval 与低信号导航源 diagnostics；当前 maintainer help/docs alignment 测试还锁住真实 docs-vault example payload | 持续 finish gate | 扩大表述前继续用测试锁住进度文案；helper 示例必须继续保持 vault-relative 且不越界进入 public CLI 叙述 |

架构解释：

1. local-KB 是插件内 MiniSearch lexical retriever，加上 task-scoped prompt injection；不是已发货的外部 semantic RAG stack；
2. `local-knowledge.inspect` 是 maintainer-only 诊断 seam，不是 public CLI 扩张；
3. chapter split 是具备确定性 rerun 行为的 managed artifact 写入契约，不只是文本转换 helper；
4. packaging 真值仍是单入口 `main.js` + inline `srcdoc`，所以 latent render-host source candidate 仍只是源码候选，除非未来同批修改 build、release、audit 与 docs。

### 2.8 local retrieval 方案决策不应继续只留在 `.trellis`

当前 local-KB 实现已经发货，但最明确的方案比较研究最初主要落在 `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/`。这对开发有用，但单靠它还不足以构成 repo-owned 真值。

现在必须保持显式的 repo-side 决策是：

1. **MiniSearch 仍是当前主线的实现基座**，因为它同时满足：
   - TypeScript 原生
   - local-only
   - in-process
   - server-free
   - GPU-free
   - 对 Obsidian 插件运行时足够收敛
2. **LightRAG、txtai 与 Mem0/Embedchain 仍应排除为本批直连 runtime 基座**，因为它们是 Python-first，且会把架构推向更重的服务、vector-store 或 companion-runtime 形态，不适合 current main 的有界切片。
3. **Smart Connections 与 Smart Composer 仍是产品/UX 参考，而不是实现基座**：
   - 对后续产品设计有参考价值；
   - 但 embedding / local-db / adjacent-runtime 足迹仍明显重于当前切片可接受范围。
4. **RAGPerf / ragas 仍应视为评测参考，而不是 runtime 依赖**：
   - 它们有助于判断检索质量；
   - 当前正确动作是在线路外借用它们的评测思维，而不是把它们的栈嵌入插件。

正确解释：

1. 当前主线仍应继续把 local-KB 描述为 plugin-native 的 MiniSearch lexical retriever，加上 task-scoped prompt injection；
2. 任何未来 semantic/vector 扩张都必须被视为新的架构决策，而不是当前发货线路已经暗含的能力；
3. `.trellis` 研究可以继续指导后续工作，但 repo 也必须在 tracked progress truth 中保留这条决策，以防未来会话又退回到含糊的“local RAG”措辞。

这已经不再只是原则陈述。仓库现在也已把相关研究结论镜像到 repo 跟踪文档：

1. `docs/brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md`
2. `docs/brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md`
3. `docs/brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md`

这些镜像现在也已经进入可执行的 Stage-C 证据面，而不再只是 docs-only 真值：local-KB 的离线 fixture 与 maintainer inspect 示例会沿真实检索路径探测它们。

### 2.9 当前 `7af2f9b` 的文档同步基线

当前远端同步后的基线，也已经在文档层被明确下来：`7af2f9b`（`docs(progress): sync current-main helper proof truth`）。

这个基线真正意味着：

1. 这次 docs-sync commit 没有改变任何已发货 runtime 或产品行为；
2. canonical 的 current-main progress 文档现在会把 release / chronicle / repo-saga helper 的入口级证明明确视为已落地证据，而不是未来意图；
3. diagram-platform roadmap 现在也应明确把：
   - 任务 0 读成 packaging/source-build 边界真值；
   - 任务 2 读成 compatibility-surface 收口，而不是 pipeline 是否存在；
   - 任务 3 读成带真实 Obsidian 验证门槛的 MermaidProcessor 降责工作。

正确解释：

1. 当前主线真值维护现在也包括让 roadmap/progress 语言持续跟上已检入 helper-entrypoint 证据；
2. 文档同步现在已经是回归边界，而不是可选的 prose 清理。

### 2.10 2026-06-17 GitHub Pages / language / GEO 真值

这一批次新增的主线真值不在插件 runtime，而在公开文档站的发布面。用户反馈的核心问题不是“还要再加一个语言开关”，而是 GitHub Pages 的真实路由、语言覆盖声明、GEO 入口和文档说明已经彼此漂移。

实机审计发现：

1. `website` 本地第一次构建在未安装依赖时失败于 `docusaurus: not found`，但 Pages workflow 本身已经包含 `npm ci`，所以这不是 CI 架构缺口；
2. 安装依赖后 `npm run build` 可以运行，但暴露出真实缺陷：默认根路径 `/obsidian-NotEMD/` 与 zh-CN 根路径 `/obsidian-NotEMD/zh-CN/` 被 navbar/logo/footer 链接引用，却没有对应 root page；
3. Docusaurus 配置仍使用即将迁出的位置：`siteConfig.onBrokenMarkdownLinks`，应转到 `markdown.hooks.onBrokenMarkdownLinks`；
4. `website/README.md` 仍把站点描述为 Docusaurus 3.6.3 与 10 语言支持，而实际 `package.json` 是 `^3.10.1`，`i18n.locales` 只有 `en` 与 `zh-CN`；
5. `website/i18n/zh-CN` 实际只有 FAQ 本地化文件，因此 zh-CN 是局部语言面，不是完整中文文档站；
6. 旧 `GEO_ROADMAP.md` 同时宣称 Phase 1/2/3 complete、Phase 2 in progress、以及已经被代码否定的语言数量，已经不能再作为可执行真值；
7. Docusaurus 会为未翻译 docs 生成 zh-CN fallback 路径，若直接进 sitemap，会把英文 fallback 当作中文页面暴露给 crawler；
8. 站点缺少一个精简的 AI answer-engine source map，导致 answer engine 更容易从生成导出物、旧 issue 或 fallback locale 中取错信号。

本批次已经把这条文档站轨道推进到更真实的结构：

1. `website/src/pages/index.js` 现在提供默认语言与 zh-CN 的 root homepage，并把 root page JSON-LD 写成带 URL 与语言的 WebPage schema；
2. `website/docusaurus.config.js` 将 broken markdown link hook 放到 Docusaurus 当前推荐的 `markdown.hooks` 位置；
3. doc page 的 TechArticle schema、全站 WebSite schema 与首页 WebPage schema 都从 `siteConfig.url` / `siteConfig.baseUrl` 推导 URL，不再在多个位置散落同一段 GitHub Pages base path；
4. zh-CN FAQ 现在使用同一个 Person author `@id` 并补上 citations；
5. 未翻译的 zh-CN docs fallback 现在被排除在 sitemap 之外，并在 swizzled doc layout 里标记为 `noindex,follow`；
6. `website/static/llms.txt` 成为静态高信号入口，列出 canonical docs、provider/runtime 页面、语言覆盖边界和回答约束；
7. `website/README.md` 与 `GEO_ROADMAP.md` 已把语言策略改成“English complete + partial zh-CN”，不再夸大为 10 语言或 3 语言 ready。

架构解释：

1. 插件 runtime 的 UI 语言支持、Obsidian 内部工作流语言、以及 Docusaurus 文档站 locale 是三条不同轨道，不能互相证明；
2. GEO 的第一优先级不是增加 locale 数量，而是让 canonical route、locale root、FAQ、intro、quick-start、provider overview、pillar page、sitemap、robots 和 `llms.txt` 都指向真实可访问内容；
3. `llms.txt` 是 answer-engine 索引入口，不是内容副本；当前只维护 concise canonical map，暂不生成容易漂移的 `llms-full.txt`；
4. zh-CN 接下来的正确推进不是继续索引 fallback 页面，而是补齐 homepage、FAQ、intro、installation、quick-start、configuration、provider overview 与 pillar page 这条 critical path；
5. 本批次必须把测试文件、生成导出物和 Slidev 上一阶段 WIP 排除在提交之外；clean-state 的实现方式应是只提交生产/文档文件，其余未提交内容保留到受控 stash。

### 2.11 2026-06-18 Slidev export 渲染后布局真值

这一批次需要把 Slidev export 轨道从“workflow 能跑通”推进到“导出的 deck 可以被信任为可见且可读的产物”。

当前代码已经满足一部分先前要求：

1. 命令面板导出与侧栏导出都进入 `exportSlidesCommand()`；
2. 设置页暴露 `HTML`、`PDF`、`PNG`、`MP4` 默认格式选择，选择 `HTML` 时暴露 HTML mode；
3. 侧栏已有内联 Slidev export format selector，不再把格式选择完全隐藏；
4. `exportSlidesCommand()` 会先探测环境、准备 Slidev export source，再按选择格式导出已准备的 source；
5. `prepareSlidevExportSource()` 可加载顶层 Slidev skill 和 `references/*.md`，LLM prompt 也明确要求拆分密集页，并避免大图、表格和代码块裁剪；
6. `scripts/verify-slidev-export-workflow.cjs` 会用真实 `docs/architecture.zh-CN.md` 源文件跑生产模块，并记录 skill reference 数、本地 fork、deck 摘要、Playwright 结果与 `.gitignore` 可见性。

真正的缺口也很明确：

| 方案要求 | 当前实现 | 状态 |
|---|---|---|
| 非大纲生成路径完整支持 Slidev skill | `loadSlidevSkillContext()` 读取 `SKILL.md` 与排序后的 `references/*.md`，并把内容注入 prompt | 已落地 |
| 使用本地 Slidev fork | Slidev command resolution 优先 env override，然后落到 `$HOME/slidev/packages/slidev/bin/slidev.mjs` | 已落地，仍需持续验证 |
| UI 格式选择 | 设置页和侧栏都暴露格式选择；HTML mode 随 HTML 条件显示 | 代码已落地，UI 改动时仍需实机 smoke |
| 导出产物对 Git 可见 | `verify:slidev-export` 检查生成 deck/output/screenshots 的 `.gitignore` 命中情况 | 已作为工作流证据落地 |
| 渲染后布局 containment | 真实维护者链路里已经有 visible-root DOM bbox、scroll overflow、Mermaid host、table、code 与 text overflow 审计 | 已落地 |
| 自动修正 | `SlidevDeckPatch` 已能在有界重试里执行 measured `zoom`、Mermaid / table / code 结构拆分、支持集内的 slot layout 拆分，以及第一张 deck headmatter 页的结构拆分 | 已落地，继续扩展 |

`ref/infinite-canvas` 的分析支持 clean-room 方向，而不是代码复用。它真正有价值的架构思想是：world-space nodes 使用 `{ position, width, height }`，viewport 使用 `{ x, y, k }`，通过 screen/world conversion、union bounds、natural image sizing 与 minimap/bounds 计算来管理可视范围。这些思想适合映射成 Slidev 固定 safe rect 上的 export-layout camera；它们不意味着要把 Slidev 变成交互式无限画布。该参考项目是 AGPL-3.0，本项目是 MIT，不能复制实现代码。

正确解释：

1. 当前 workflow proof 已经明显强于直接 `slidev build`；
2. 它现在已经带着真实渲染反馈质量门，而不再只是 CLI smoke；
3. 真实 `docs/architecture.zh-CN.md` HTML fixture 现在已经收敛到 `ok: true`、`28` 个审计页、零 `overflow` / `unreadable-scale`，同一源文件的 `PDF` 与 `PNG` 也返回 `ok: true`；
4. 当前已经落地的实现真值比最初方案更进一步：workspace-aware 的 local Slidev fork / Slidev skill / Playwright browser cache 解析、full-deck visible slide root 审计，以及覆盖 Mermaid、Markdown table、code fence、密集文本、支持集内 slot layout 与第一张 deck headmatter 页的非 zoom-only patch/rebuild 都已进入真实维护者链路；已知坏掉的 standalone bundle 也会回退到 server-script HTML，而不再被当成成功产物；
5. 下一步架构推进已经更收窄：继续扩展 richer custom Slidev layout / richer component slide 的结构化 patch，以及病态内容 fallback，而不是退回代表性抽样页验证；同时还要判断当前 standalone fallback 是否应继续作为产品真值，还是后续再引入更强的 standalone bundling 策略。

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

统一矩阵现在需要明确防住这些反复出现的误读：

1. 把当前更宽的 bounded discovery 误写成 all-provider discovery；
2. 把 host-aware bare-model token lookup 误写成 arbitrary custom gateway 上也能自动推断 owner；
3. 把已有共享 parser seam 误写成以后可以顺手持久化 remote catalog，而不需要新的显式架构决策。
4. 把 `1.9.2` 中 sidebar / inspect / docs 的收口误写成 public CLI 已扩宽，或 packaging 契约已变化。
5. 把 YAML 中的 `*.*.*` trigger 字面量误写成独立 release 规则，而不是受 shared release contract 锁定、且后续仍由数字 tag validator 准入的 bootstrap 值。

### 3.5 Packaging 与 CLI 规划文档目前仍然成立的部分

更早的 packaging 与 CLI 规划文档，在两个关键点上仍然是正确的：

1. 当前真正发货的渲染器边界仍然是 `main.js` + inline `srcdoc`，而不是已发货 dedicated runtime asset；
2. 当前 CLI 的正确边界仍然是“先保持宿主无关 core，再单独处理 host/file/UI follow-through”，而不是继续做更广 public command 数量扩张。

当前代码仍然支持这些早期决策：

1. `esbuild.config.mjs`、`scripts/audit-render-host-bundle.js` 与 maintainer 文档仍然共同锁定单入口发货边界；
2. `src/operations/diagramGenerateOperation.ts`、`src/operations/diagramCommandExecution.ts`、`src/operations/diagramCommandHostAdapter.ts`、`src/operations/publicCliSurface.ts` 与 `src/maintainerCliBridge.ts` 仍然保持以下有界拆分：
   - typed core operation；
   - 有界 public-safe export command；
   - 更宽但明确仅供 maintainer 使用的 path-based helper flow。

正确解释：

1. provider 轨道的收口降低了一部分 control-plane 风险，但并没有取代 packaging 与 bounded CLI promotion discipline，成为新的架构主问题；
2. next-level 规划现在应回到 packaging/semantic convergence 优先，其次才是 bounded CLI/public-surface 决策；provider 宽度扩充应降为持续维护轨道，而不是继续占据中心叙事。

### 3.6 哪些旧进度表述现在会高估或错位

现在有一类旧进度表述已经朝相反方向失真了：它们给 provider 轨道过多叙事权重，却低估了当前 Stage-C 真值维护的价值。

具体来说：

1. 当前主线不应再被写成 provider settings/model discovery 仍是唯一主要推进轨道；
2. 当前主线不应再被写成 Stage-C local-KB / chapter-split 仍主要是在证明“功能是否存在”；
3. 当前主线不应再被写成最新 release-facing truth 仍停留在 `1.9.0` 或 `1.9.1`。

正确解释：

1. provider 宽度现在属于维护轨道；
2. Stage-C 质量/评测现在是更高价值的产品轨道；
3. 在后续 release 出现前，`1.9.2` 就是当前公开真值边界。

### 3.7 Stage-B2/C/D PRD 在当前主线上的真实含义

当前 active Stage-B2/C/D PRD 不应再被读成“功能是否存在”的 checklist。在当前主线上，R1 到 R7 已经是实现真值；R8 是防止夸大 packaging 的边界锁；R9 与 R10 是持续 finish gate。

这会改变工程推进方向：

1. local-KB 的有效工作是更多真实 note/query 多样性与失败态 explainability，而不是重新接一遍任务入口；
2. chapter split 的有效工作是 showcase/doc/result-schema 对齐，而不是重新恢复命令面；
3. CLI 的有效工作是判断是否有有界 path-based operation 值得 public promotion，而不是把 maintainer diagnostics 变成隐含 public support；
4. packaging 的有效工作是解决 latent runtime candidate 的 source/build 边界，而不是把候选源码写成已发货资产。

### 3.8 GitHub Pages / GEO 方案语言现在需要纠偏的部分

旧 GEO 方案的主要问题不是方向完全错误，而是把“内容与 schema 已推进”过早等同于“Pages 发布面已经可靠”。当前代码审计显示，这个等号不成立。

需要纠偏的地方：

1. 旧方案强调 schema、TLDR、citations、pillar page，但没有把 root route 和 locale root route 当成第一等 acceptance；实际构建已经证明缺 root route 会直接形成站内坏链；
2. 旧方案把 locale 数量当成进度表达，当前正确表达应改成“已发布语言面是否真实、完整、可被 crawler 正确解释”；
3. 旧方案把 zh-CN FAQ 的存在写得过于接近“中文站已具备”，但现状只是局部中文面；
4. 旧方案没有给 answer engine 一个紧凑入口，导致 GEO 依赖 sitemap 与页面 schema 的间接发现；
5. 旧方案没有把 Pages build warning 当成 blocking-quality signal，导致 deprecated config 与 root broken links 能继续存在。

当前实现后的正确判断：

1. GitHub Pages 轨道已经从“schema/content first”推进到“route/schema/language truth first”；
2. 下一步高杠杆工作是翻译并审校 zh-CN critical path，以及扩充薄 provider 页面，而不是立刻添加更多 locales；
3. `llms.txt` 应随 canonical docs 与语言状态同步维护，但不应在没有生成管线时手写大体量全文副本；
4. Pages build 现在必须进入与 plugin build/test 并列的文档站 finish gate。

## 4. 架构推进评估

### 4.1 真正推进了什么

1. provider control plane 现在可以通过共享 metadata 扩展，而不再只能靠手工堆 settings 分支。
2. discovery 与 runtime 在 endpoint-family 和 header-owner 层已经更收敛。
3. token guidance 不再只是 UI hint，而是已经进入持久化 settings 状态与 runtime ceiling 行为。
4. discovery parser 相比最初落地 helper，已经对真实 registry 漂移、wrapped catalogs 与 resource-style names 更鲁棒。
5. retrieval explainability 在 maintainer 轨道上更强了，因为弱 query 推导现在会被结构化诊断显式暴露，而不再只表现为不透明的空 context。
6. shipped UI 的 operator feedback 再次可用了，因为日志输出与 API activity 现在共享有界滚动布局，而不是继续争抢固定空间。
7. release workflow trigger 真值现在和 release assets、notes、tag validation、workflow-source branch、chronicle-target branch 一起进入 contract-backed 状态；这关闭了一处 YAML-local 漂移缝隙，同时没有假装 GitHub Actions 能在 checkout 前 import 仓库代码。

### 4.2 仍然存在的结构约束

1. packaging 真值仍刻意比源码组织层更窄。
2. discovery 仍按设计保持瞬时，不存在持久化 remote model catalog。
3. 当前 bounded discovery family 批次已经足够宽，需要纪律，但还远没到可以宣称“通用 provider discovery”。
4. generic `OpenAI Compatible` 对 owner 的推断仍必须保持保守；超出 trusted host、显式 registry owner hint 与显式 prefix 的部分，token ceiling 仍应保持 unresolved。
5. 当前本机 host-side desktop verification 对 plugin reload/state inspection 更强，但对 settings-panel 的完整脚本化点击自动化仍较弱；这条 lane 目前仍依赖 Jest 去锁住 `Fetch model list -> Use` 的 notice/override 分支。
6. maintainer inspect explainability 刻意比 public CLI 真值更丰富；除非未来有显式提升批次，否则它必须继续保持有界。
7. repo-local 的 maintainer CLI wrapper 现在已经具备入口级 process-level 回归覆盖（`--input-json`、`--input-file`、`--pretty`、stderr 透传，以及 eval 解析失败路径），因此这条有界 maintainer surface 不再只依赖 bridge 层单元测试。
8. release / repo-saga helper 这条线现在也已经具备已检入入口的 process-level 回归覆盖，因此当前 release-contract 与 chronicle-contract 结论不再只依赖 helper 函数测试和维护文档本身。这层 proof 现在已明确覆盖：
   - release dry-run 的 create/repair 命令形态；
   - chronicle refresh 的 no-op / override / git-failure 行为；
   - repo-saga 的 sync-only stamp 命中、active-lock refusal、隔离生成路径与非法参数 fast-fail。

### 4.3 如果这条线现在漂移，最大的风险是什么

现在最大的风险已经不是“没实现出来”，而是“边界纪律丢失”。

最可能的失败方式：

1. ad hoc 的 provider-name special-case 又开始替代 family-based shared logic；
2. 文档开始夸大与 Cherry Studio 的 parity；
3. settings/discovery token guidance 与 runtime token-ceiling 逻辑再次漂移；
4. 未来有人顺手“把抓到的模型列表存起来”，静默造出第二套 provider-state subsystem。

### 4.4 当前主线真正的瓶颈已经移动到哪里

在最新 provider 收口之后，当前最高杠杆、但尚未解决的瓶颈，已经移动到了相邻轨道：

1. packaging / semantic-verification 仍然承载着最核心的 source-vs-shipped 边界歧义，因为源码里已有可复用 runtime candidate，但真正发货契约仍是单入口；
2. CLI / automation 仍然承载着刻意保持的 public-vs-maintainer 分层，任何 path-based operation 的提升都必须继续显式化；
3. file-selection / local-KB / chapter-split 的 Stage C 现在需要的是更深的 mixed-corpus 评估覆盖、示例对齐与 explainability 收口，而不是再做一次“功能是否存在”的恢复性论证。

### 4.5 文档站架构瓶颈已经从“有页面”移动到“可信发布面”

GitHub Pages 这条线当前最大的结构风险不是缺少更多页面，而是公开站点的入口、语言、schema 与 source map 是否一致。

当前已推进的架构点：

1. root homepage 现在成为 Docusaurus `src/pages` 管理的真实 route，不再依赖 docs plugin 的 sidebar 首页间接承担站点根路径；
2. default locale 与 zh-CN locale 都能通过同一个 homepage component 生成对应语言的入口文案；
3. doc page schema 与 root page schema 都开始从站点配置推导 URL；
4. `llms.txt` 把 answer-engine 引导从“猜 sitemap / 猜页面关系”改成“读取明确 canonical map”；
5. website README 与 GEO roadmap 现在记录真实语言覆盖，减少未来会话继续把 runtime i18n 与 website i18n 混在一起。

仍然存在的约束：

1. zh-CN 还不是完整文档站，不能在对外材料里写成完整中文支持；
2. provider docs 仍有薄页风险，后续需要按真实配置、请求语义、错误诊断扩写或合并；
3. `llms.txt` 当前是手工维护文件，后续如果 canonical docs 扩大，应考虑生成式维护而不是继续人工复制长内容；
4. Pages 质量门禁目前仍主要靠 `npm run build`，还没有独立的 sitemap/llms/locale-root smoke script。

## 5. 具体下一阶段方向

下一批有界执行方案：

1. **P0 packaging 真值：** 在没有同批修改 build graph、release assets、audit 与 docs 之前，继续把 `main.js` + inline `srcdoc` 作为唯一发货边界。
2. **P1 Stage-C 质量：** 在保留 exact-file/folder、exclusion、failure-state 与 task-scoped inspect 覆盖的前提下，把 `verify:local-kb-fixtures` 扩展到更多 chapter-split showcase 之外的真实 note/query 形态。
3. **P1 chapter split 文档：** 让 showcase docs 与 generated-artifact 示例持续跟随确定性 TOC front matter、稳定 block refs 与 guarded rerun 语义。
4. **P1 CLI 边界：** 除非另起 public-promotion 批次并同批补齐契约、help、测试与文档，否则 `local-knowledge.inspect` 继续保持 maintainer-only。
5. **P1/P2 provider 维护：** provider/model-discovery 的新增支持继续走共享 family 与 response-shape seam，并且每次都明确 token-guidance 的影响范围。

### Batch A：优先完成 packaging / semantic-verification 收敛，再决定是否拓宽任何叙述

优先级：`P0`

目标：

1. 继续把当前 `main.js` + inline `srcdoc` 的发货真值保持为显式、可执行的边界；
2. 让 release workflow trigger、tag validation、assets、notes、workflow-source 与 chronicle-target 真值继续处在同一份 shared contract 下；
3. 在任何人拓宽 packaging 叙述之前，继续显式守住 latent render-host runtime candidate 的 candidate-only production-build guard。

硬规则：

1. 如果未来又要引入 dedicated runtime asset，那么 build graph、release assets、audit logic、maintainer docs 与 release docs 必须在同一批次里一起变更。

### Batch B：继续把 bounded CLI / public-surface promotion 与 maintainer helper 显式分开

优先级：`P1`

目标：

1. 保持当前有界 public-safe export 与仅供 maintainer 使用的 path-based helper flow 的分层；
2. 只有当某个 path-based operation 的 contract、automation level、context requirement、测试与文档都足以支撑更广暴露时，才考虑提升。

可能的工作：

1. 持续保持 `cli.public-surface.export` 与当前 registry metadata 对齐；
2. 持续保持 `npm run cli:help` 与 maintainer 文档对当前有界 helper surface 的描述一致；
3. 避免把 maintainer-only mutation/introspection seam 误写成已有公共 CLI 支持。

### Batch C：在不重开存在性问题的前提下，深化 file selection / local-KB / chapter split 的 Stage-C 质量

优先级：`P1`

目标：

1. 把当前主线上的 retrieval 与 batch-input 能力当作已经落地的产品切片；
2. 后续投入聚焦在更宽 corpus-quality 证据、maintainer 示例与回归深度，而不是继续做恢复性叙事。

可能的工作：

1. 在当前契约已经支持的前提下，继续扩 mixed file/folder、mixed query-shape 与 exclusion-behavior 的夹具覆盖；
2. 持续保持 maintainer 示例与 retrieval inspect 指引和真实 task-scoped retrieval 链路一致；
3. 在扩测试深度时，继续保住 deterministic managed-artifact 与 rerun-guard 语义。
4. 只有在能严格落到 Notemd 当前任务契约时，才增加与外部参考项目的比较性评测；避免泛化成脱离当前产品面的 RAG 口号。

当前主线在这一轮 Stage-C follow-through 中已经新增落地的差量：

1. 离线夹具现在还会回归锁定 task-scoped 的 `batchGenerateFromTitles` 与 `researchSummarize` retrieval case，而不再把 diagram generation 当成唯一的 maintainer inspect 证明路径；
2. maintainer helper 的 help/示例现在已经把当前真实支持的三条 inspect query 派生路径一起暴露出来：`basename`、`explicit` 与 `diagram-source`；
3. exact-file-vs-folder 的 configured knowledge-path 边界现在也在同一条离线夹具链路中被检查，进一步降低了文档/示例与真实 retrieval 行为漂移的风险；
4. maintainer 侧 inspect 的失败态现在也被明确锁成 explainability 真值：`no-paths`、`no-candidate-files` 与 `no-retrievable-sections` 将继续保持可区分，而不会再被压成一个笼统的“没有 context”结果。
5. 离线夹具现在还覆盖了 noisy mixed-corpus scope：重复/空白 override path、混合 file/folder entry、非 Markdown 干扰文件、无关文件夹与空 searchable section 候选都会进入同一条评估路径，用来证明当前 MiniSearch 路径仍能保持 scope 收敛，同时不扩任务数量或 public CLI 行为。
6. 离线夹具与 maintainer helper 示例现在还覆盖 real-note-style chapter-split showcase query：它会围绕 managed artifacts、guarded reruns 与稳定 TOC block refs 检查检索效果，并且 runnable inspect 示例使用真实 docs vault 路径，而不是只存在于测试夹具中的路径。
7. 离线夹具现在还覆盖了 chapter-split showcase 之外的真实 note/query 多样性：跨文件夹 project/reference 知识库路径、任务契约检索、RAG 质量评估笔记与 navigation-like source diagnostics 都被锁定，同时没有把 `local-knowledge.inspect` 提升成 public CLI contract。
8. maintainer help、双语 capability matrix 与对应 Jest alignment 测试现在补上了同一批真实 docs-vault inspect 示例：explicit research query 使用 `brainstorms` + `maintainer` 跨文件夹知识路径，batch-title 示例直接指向 `brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md`，diagram-source 示例继续用 `index.zh-CN.md` 验证低信号来源诊断；这使 Batch C 的“示例对齐”从开放方向推进为已落地 guardrail。
9. maintainer help、双语 capability matrix 与离线 runtime fixture 现在还补上了可直接复现的 docs-vault failure-state 示例：显式空 override 数组会稳定证明 `no-paths`，而 `repo-saga` 这个仅含 SVG 的目录会稳定证明 `no-candidate-files`，不再只依赖合成夹具去表达这两类失败态。

这一批次接下来的有界方向：

1. 继续增加 chapter-split showcase 之外的真实 note/query 多样性时，优先补真实任务契约上的失败态、低信号 query 与 noisy-corpus 证据，而不是增加更多演示性路径；
2. 随 result schema 演进，持续保持 chapter split 的 showcase/docs、maintainer examples 与真实写入契约、managed-artifact 语义一致；
3. 让 maintainer inspect 足够适合诊断，但不要让它意外变成事实上的 public contract；若未来要提升任何 path-based operation，必须另起 public-promotion 批次并同批锁 schema、help、测试与文档。

### Batch D：把 provider 轨道放回 bounded breadth-maintenance 模式

优先级：`P1/P2`

目标：

1. 继续只通过共享 family 语义或 wrapped-catalog shape 支持来扩宽能力；
2. 除非 transport 或 discovery 契约真的不同，否则拒绝退回 provider-name-only 分支。

硬规则：

1. 每个新的 provider/discovery 扩展，都必须在同一批次里明确 family mode、header owner、endpoint normalization、token-guidance 行为，以及测试/文档。
2. 每次改 discovered-model token autofill 时，都必须显式写清它影响的是：
   - 全局 `Max tokens`
   - provider output-token override
   - 两者都影响
   - 两者都不影响

当前真值：

1. 当前实现只影响 provider output-token override；
2. 手动 typed model change 仍是会推进全局 model-aware baseline 的那条路径，前提是用户没有偏离它。

### Batch E：把文档/测试与 clean-state 继续当作长期护栏

优先级：`P0`

目标：

1. 防止后续会话再次把 current-main 真值降回过时措辞；
2. 把 clean-state 证明维持为持续满足的收尾不变量，而不是重新积累成待清理债务。

当前审计现实：

1. 历史 current-main 收口曾经是 clean 的，但本轮 Slidev/GEO follow-through 开始时，本地分支并不 clean；
2. 现有脏状态包括生成的 `docs/export` 产物、`docs/dist` churn，以及 Slidev export WIP，不能在本批次里盲目 reset，也不能夹进无关提交；
3. 因此本批次的 clean-state 规则要收窄为：不新增、不提交新的测试/导出生成物，并让生产/文档差量与既有 WIP 可分离；
4. 真正的后续清理动作应是受控拆分：先提交或 stash 有意保留的源码/文档改动，再在确认不再需要视觉检查证据后，显式丢弃或归档生成产物；
5. 统一矩阵、专题文、README/change surface 与聚焦回归检查，仍然是最实际的 anti-drift 护栏。

必须跟进的动作：

1. 只要 packaging、CLI surface 或 provider/discovery 边界发生变化，就重新检查当前真值文档；
2. 持续把 `npm run build`、`npm test -- --runInBand`、`npm run audit:i18n-ui`、`npm run audit:render-host`、`git diff --check`，以及 clean 的 `git status --short --branch` 或明确的 pre-existing-dirty ledger，作为最小收尾包。

### Batch F：把 GitHub Pages / GEO 作为独立发布面维护

优先级：`P0/P1`

目标：

1. 把 `website` 视为独立的公开产品面，而不是主插件 README 的附属输出；
2. Pages build warning 必须进入 blocking-quality 视角，尤其是 root route、locale route、deprecated config 与 broken links；
3. GEO 策略先服务于准确、可访问、可验证的 canonical pages，再服务于更多语言或更多 schema 类型。

当前已经落地：

1. 默认 root 与 zh-CN root 已由 `website/src/pages/index.js` 接管；
2. `website/static/llms.txt` 已提供 canonical answer-engine map；
3. Docusaurus markdown link hook 已迁到当前配置位置；
4. 未翻译的 zh-CN fallback docs 已从 sitemap 排除，并标记 `noindex,follow`；
5. website README 和 GEO roadmap 已同步真实语言边界。

下一步：

1. 把 zh-CN critical path 补齐到 homepage、FAQ、intro、installation、quick-start、configuration、provider overview 与 pillar page；
2. 给 `website` 增加轻量 smoke gate，检查 `build/index.html`、`build/zh-CN/index.html`、`build/llms.txt` 和 sitemap 是否存在；
3. 扩写或合并 provider thin pages，优先补真实 provider setup、endpoint/header 语义、model discovery 与 troubleshooting；
4. fixed Pages 部署后再进行 Search Console 与 AI visibility 复测，不要用本地未部署结果过早判断 GEO 成败。

### Batch G：把 Slidev export 从一次性 smoke 提升为真实工作流门禁

优先级：`P0`

背景：

1. 本轮真实测试 `docs/architecture.zh-CN.md` 暴露出旧验证方式的盲点：直接调 Slidev CLI 不能证明 UI 的两个 export 入口真的走到了 NoteMD 的 source preparation、完整 skill references、local fork 与 output cleanup；
2. 旧 HTML 文档仍把 server-script 当成唯一可靠方案，已经落后于当前本地 fork 的 standalone bundle 真值；
3. 生成产物需要可检查，而不是被 `.gitignore` 或清理脚本过早隐藏。

当前 WIP 已经推进到：

1. `npm run verify:slidev-export` 成为稳定维护者入口，默认以 `docs/architecture.zh-CN.md` 跑真实 workflow；
2. 该入口会通过生产 TypeScript 模块执行 `prepareSlidevExportSource()` 与 `exportSlidevHtml()`，而不是只直接运行 Slidev CLI；
3. 结果 JSON 会记录环境能力、本地 fork 路径、skill root、skill reference 数、deck 摘要、Playwright 抽样、以及 `.gitignore` 命中情况；
4. `docs/maintainer/slidev-export-workflow.*` 已把通过标准、输出策略、UI 契约和何时运行落盘；
5. `docs/SLIDEV_SOLUTION.md` 与 `docs/SLIDEV_HTML_FIX.md` 已从旧 server-only 叙述更新为 standalone 优先、server-script 兼容的当前真值。
6. 当前 source-preparation prompt 已经使用完整 skill references 并要求拆分密集内容，但生成后的 guardrails 仍依赖静态 Markdown 启发式。
7. `node scripts/verify-slidev-export-workflow.cjs --json` 现在已经可以在真实 `docs/architecture.zh-CN.md` 上证明：
   - 命中 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`
   - 命中 `/home/jacob/slidev/skills/slidev`
   - 命中 Jacob 的 Playwright browser cache
   - 对 full-deck HTML slides 执行 visible-root layout audit 与 measured bounded patch/rebuild
   - `HTML`、`PDF`、`PNG` 三条实机导出链可用
   - 真实 HTML fixture 已收敛到 `ok: true`、`28` 个审计页、`overflowCount = 0`
   - 维护者本地结构化 overflow note 已能通过真实 Markdown table decomposition 与 code-fence chunking 收敛，而不只是单测改写

下一步：

1. Slidev export 相关改动必须把 `npm run verify:slidev-export` 纳入收尾证据；
2. 生成的 `docs/export/` 产物可以保留给本地查看，但除非任务明确要求，不应提交；
3. `SlidevRenderedMeasure`、`SlidevOverflowAudit` 与 `SlidevDeckPatch` 现在已经是明确的 NoteMD 自有模块边界，后续应继续沿这些边界扩展，而不是把逻辑退回 prompt 启发式；
4. 下一步已经不是“先把表格/代码拆解做出来”；而是继续把 patcher 推进到 custom layout-safe splitting、richer component slide，以及病态 cell/content fallback，同时保持确定性的失败路径；
5. 如果要给上游 Slidev skill 提 PR，范围应限制在通用 deck-conversion/export guardrails，例如完整 references、内置主题优先、frontmatter 闭合、大图/表格/代码块使用可读 transform、build 后浏览器抽样验证；不要上游 NoteMD 的 vault 路径、本地 fork 路径、layout audit 内部实现或 `architecture.zh-CN.md` fixture。

## 6. 文档同步规则

未来任何会更新 provider-settings/model-discovery 轨道真值的改动，至少都应同步检查：

1. `change.md`
2. `README.md`
3. `README_zh.md`
4. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.*`
5. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
6. 本文

未来任何会更新 GitHub Pages / GEO / website language 轨道真值的改动，至少都应同步检查：

1. `GEO_ROADMAP.md`
2. `website/README.md`
3. `website/docusaurus.config.js`
4. `website/src/pages/index.js`
5. `website/static/llms.txt`
6. `.github/workflows/deploy-docs.yml`

未来任何会更新 Slidev export 轨道真值的改动，至少都应同步检查：

1. `docs/maintainer/slidev-export-workflow.*`
2. `docs/SLIDEV_SOLUTION.md`
3. `docs/SLIDEV_HTML_FIX.md`
4. `src/slideExport/*`
5. `src/main.ts`
6. `src/ui/NotemdSettingTab.ts`
7. `src/ui/NotemdSidebarView.ts`
8. `package.json`

## 7. 验证门禁

任何会改变本文真值判断的更新，仍应以以下结果收尾：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `cd website && npm run build`
6. `test -f website/build/index.html`
7. `test -f website/build/zh-CN/index.html`
8. `test -f website/build/llms.txt`
9. `git diff --check`
10. clean 的 `git status --short --branch`

如果改动触及 Slidev export，还必须额外执行：

1. `npm run verify:slidev-export`
2. `npm test -- --runInBand src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts`

等渲染后布局 gate 落地后，Slidev export 收尾还必须基于 `docs/architecture.zh-CN.md` 输出非空 layout-audit report，并且 `overflow` 与 `unreadable-scale` 均为零。

## 8. Bottom Line

当前 `main` 已经不再需要再做一次“provider settings 这条线到底有没有落地”的论证。

现在真正的问题是：

1. packaging/source organization 与真正 shipped render-host truth 能否继续保持一致，而不夸大当前主线并未发货的 runtime topology；
2. 当前 bounded CLI 分层能否继续显式保持，而未来任何 path-based promotion 都坚持 contract-first，而不是 convenience-first；
3. Stage-C local-KB / file-selection / chapter-split 工作能否继续补强 mixed-corpus 质量证据，而不是反复重谈“功能是否存在”；
4. 当前更宽的 bounded provider discovery surface 能否继续保持 shared-core、lightweight 且边界诚实，并作为维护轨道而不是更大架构声明的借口；
5. GitHub Pages / GEO / website language 轨道能否坚持 route-first、truth-first，而不是继续用空 locale 或过时 README 制造弱信号；
6. Slidev export 能否继续用真实 UI-equivalent workflow 验证，并补上渲染后布局质量门，而不是退回到“CLI 能 build 就算按钮可用”的弱证明；
7. 当前真值文档能否足够快地跟上真实发货分支边界，避免未来会话又退回到 `1.9.0/1.9.1` 时代的旧措辞。
