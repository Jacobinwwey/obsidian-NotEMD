---
date: 2026-05-25
last_updated: 2026-06-06
topic: post-bounded-recovery-audit-and-next-level-direction
canonical: true
---

# Bounded Recovery 之后的主线审计与 Next-Level 方向

## 1. 为什么需要这份文档

仓库当前已经不再处于以下两个解释断点中的任意一个：

1. 2026-05-13 的 `1.8.9` 发布边界审计；
2. 2026-05-24 的 force-rewrite 基线审计。

在那之后，当前 `main` 已重新拿回一部分有界但实质性的 backup-branch 能力宽度，并已发货到 `1.9.2` 边界，同时继续把 local-KB / chapter-split 的 Stage C 收口往前推进。因此，当前真正需要回答的问题又变了：

- 不再是“recovery 到底有没有发生”；
- 也不再只是“bounded product slice 有没有重新落回主线”；
- 而是“哪些架构通道现在已经实质收敛、哪些仍然结构性落后，以及 bounded recovery 之后真正的 next-level control-plane 工作是什么”。

主要对比来源：

1. `docs/brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.zh-CN.md`
2. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md`
3. `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.zh-CN.md`
4. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md`
5. `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md`
6. `.trellis/tasks/05-27-provider-settings-model-discovery/prd.md`
7. `1.9.2` release 边界与后续 post-release contract/evidence follow-through 之后的 live `main`

当前阅读说明：

1. 本文仍是 post-bounded-recovery checkpoint；
2. 更新的 current-main 真值来源是 `docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md`；
3. 统一执行矩阵仍是 `docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md`。

## 2. Recovery 之后的当前代码真值

### 2.1 Packaging / runtime 真值

当前发货真值仍然比源码树表面看起来更窄：

1. `esbuild.config.mjs` 仍只构建单个 `main.js` 输出。
2. `scripts/audit-render-host-bundle.js` 仍在强制执行 `main.js` + inline `srcdoc` 的 host 契约，并拒绝独立 render-host 输出文件。
3. 源码里仍保留 runtime 候选文件，例如：
   - `src/rendering/runtime/renderHostEntry.ts`
   - `src/rendering/preview/renderHostRuntimeClient.ts`
   - 一组共享的 Mermaid / Vega-Lite preview runtime helper
4. 这意味着这些文件目前只是 **潜在实现通道**，而不是已发货的构建边界。
5. 当前执行链已显式把这条通道保持为 dormant：
   - 默认 Mermaid / Vega-Lite preview loading 仍走 package runtime
   - `audit:render-host` 会拒绝当前主线中残留的 `render-host.mjs` 资产与构建产物引用
   - `resolveBundledRenderHostRuntimeModuleSpecifier()` 除非显式配置 runtime module specifier，否则继续 fail-closed
   - `createRenderHostBundleBuildOptions()` 会保持 candidate-only，并留在 production `esbuild.config.mjs` 路径之外，除非 build、release assets、audit 与 docs 同批前进

正确解释：

- 架构在源码组织层面继续推进了；
- 但在 release-asset 边界上 **还没有** 推进成已发货事实。
- source/build split 现在已经由可执行检查守住，而不只是计划文案。

### 2.2 CLI / automation 真值

当前 CLI 叙述已经明确分成两层：

1. public-safe export slice 仍然是刻意收窄的；
2. repo-local maintainer helper 更宽，但仍是有边界、显式输入的维护者工具。

当前代码真值：

1. `npm run cli:help` 现在明确列出：
   - `content.batch-generate-from-titles`
   - `content.split-note-by-chapters`
   - `research.summarize-topic`
   - `diagram.generate`
   - `local-knowledge.inspect`
   - 以及 export 相关操作
2. `src/maintainerCliBridge.ts` 已实现这些 path-based maintainer operations，并要求显式 JSON / 文件 payload。
3. maintainer-only 的 `local-knowledge.inspect` seam 现已可以暴露 effective path resolution、显式或自动派生的 query、candidate file paths、原始格式化 context、结构化 `contextBlocks` 证据、结构化 retrieval 摘要，以及临时 `knowledgePaths` override 数组，用于 task-scoped local-KB 调试，而不会扩大 public-safe slice。
4. `content.split-note-by-chapters` 现在也已进入 `src/operations/registry.ts` / `src/cliContracts.ts` 的类型化主干，但仍明确不属于当前 public-safe slice。
5. `content.split-note-by-chapters` 的 maintainer 调用现已支持可选 `splitHeadingLevel` override，不再只依赖当前 settings 快照。
6. `content.split-note-by-chapters` 的类型化结果现在还会直接暴露 managed artifact contract（`requestedSplitHeadingLevel`、`chapterNotePaths`、`managedArtifactPaths`、`removedStalePaths`），不再逼调用方靠命名规则反推。
7. `scripts/lib/maintainer-cli-operation-help.js` 已成为这层 helper surface 的共享帮助真值。
8. public-safe export slice 仍然刻意比 maintainer helper 更窄。

正确解释：

- 当前 main 已不再是“只支持 export-only 的 maintainer helper”；
- 但它依然不是宽口径 public CLI API。

### 2.3 产品面真值

此前恢复回来的产品切片，现在已经是 current-main 事实，而不再只是 backup-branch evidence：

1. local knowledge retrieval 已接入：
   - `从标题生成`
   - `从标题批量生成`
   - `研究与总结`
   - `生成图形`
2. local knowledge retrieval 设置现已支持混合的 Vault 相对文件/文件夹路径列表，并可为各任务单独覆盖；任务级覆盖留空时会回退到默认路径列表。
3. chapter split 已落地，具备 TOC/manifest 输出、确定性的 TOC front-matter metadata、面向重复 nested heading 的稳定 block ref、manifest-backed 的 guarded rerun overwrite 语义，以及陈旧生成文件清理。
4. preview history 与 saved-artifact-aware reopening 已进入可复用 preview shell。
5. settings reset、concept-note prerequisite guidance、concept synonym suppression 与 folder file-selection profiles 都已回到当前主线。
6. 面向 retrieval 的 note-processing 结果现在也已为标题生成与研究总结暴露 machine-readable 的 `localKnowledgeRetrieval` 摘要，包含 matched/returned counts、source paths、请求的 `topK`、sliding-window size、current-file exclusion telemetry、index/query timing 与 context-char count。
7. 现在也已有专用的离线 retrieval-quality maintainer fixture：`npm run verify:local-kb-fixtures`。它直接对当前线上 MiniSearch retriever 跑一组更宽的 mixed-note/query 回归语料、task-scoped inspect case，以及 chapter-split showcase 之外的真实 note/query 多样性，而不是再造一条评测专用检索路径。

代码证据包括：

1. `src/localKnowledgeBase.ts`
2. `src/chapterSplit.ts`
3. `src/ui/diagramPreviewHistory.ts`
4. `src/tests/localKnowledgeTaskIntegration.test.ts`
5. `src/tests/chapterSplit.test.ts`
6. `src/tests/diagramPreviewModal.test.ts`

### 2.4 Release / version / chronicle 真值

release-facing 真值已重新对齐到当前主线：

1. `package.json`、`manifest.json`、`versions.json` 现在处于 `1.9.2`；
2. `src/ui/welcomeReleaseNotes.ts` 现在承载 `1.9.2` 欢迎弹窗摘要；
3. root `README*.md` 家族现在也同步了 `1.9.2` 的版本 / badge / footer 状态；
4. `docs/releases/1.9.2.md` 与 `docs/releases/1.9.2.zh-CN.md` 已进入当前发货真值面；
5. `scripts/release/commit-chronicle-refresh.js` 与 `scripts/lib/repo-saga-contributor-normalization.js` 已重新回到当前主线；
6. repo-saga 串行安全仍由执行锁与文档共同强制；
7. release workflow assets、tag trigger、workflow-source branch 与 chronicle-target branch 真值现在都由 `scripts/lib/packaging-contract.js` 共享持有，而不再只是 YAML-local 假设。

### 2.5 Provider settings / model-discovery 真值

这条通道已经从 planning/bootstrap 进入 bounded breadth maintenance：

1. `src/llmProviders.ts` 现在承载共享的 provider-field taxonomy metadata，覆盖 `core`、`contextual`、`advanced` 与 `developer` 字段。
2. `src/ui/NotemdSettingTab.ts` 现在从这些 metadata 渲染 provider settings，而不是把 provider-name 分支当成字段 taxonomy 的主要 owner。
3. 面板仍保持扁平的 `LLMProviderConfig` 形态，从而保留 import/export 与既有 `data.json` 兼容性，并让 `model` 继续作为持久化 source-of-truth 字符串。
4. advanced disclosure 现在由 metadata 与持久化 override 共同派生，因此既有显式 advanced 值仍会保持可见，不会被简化 UI 隐藏。
5. 当前主线已包含有界的 settings 内模型发现能力，并使用瞬时 helper，而不是持久化 remote model catalog。
6. discovery/runtime 现在会为当前已验证的 provider family 共享 endpoint-family 与 header ownership seam。
7. discovered-model token metadata 可以引导 provider-scoped output-token autofill，但 arbitrary generic gateway owner inference 仍然刻意保持 out of bounds。
8. 对 Cherry Studio 的分析已经给出明确对照方向：
   - strategy-registry 与 parser/fallback 分层值得复用
   - 持久化 `provider.models[]` 生命周期和更重的 provider-domain 状态，对 Notemd 当前架构来说过重
9. 当前剩余边界已经转成产品边界，而不是实现边界：
   - 没有持久化 `provider.models[]` catalog
   - 没有 model CRUD 子系统
   - 不宣称已覆盖 verified bounded family batch 之外的 broad all-provider discovery

正确解释：

- provider settings/model discovery 已不再是未落地的 UX architecture gap；
- 下一阶段真正该做的不是 first delivery，而是 bounded breadth maintenance 与 truth discipline；
- 这条线已经不再只是规划或隔离实现话题；有界的 provider-settings control-plane convergence 已经落到 current main。

## 3. 相对先前方案要求的深度对比

### 3.1 相对 `mainline-stabilization-next-batch`

当时方案要求的是：

1. 先做边界收敛，再扩范围；
2. 让 semantic verification 从“口头经验”变成可维护的制度；
3. packaging 语言必须严格服从真实构建边界；
4. Drawnix 继续作为 reference boundary，而不是 scope creep。

当前代码已经证明：

1. command/help/preview follow-through 的收敛程度已经超过当时最小目标；
2. semantic helper / runbook 真值已真实落地并检入；
3. Drawnix 仍未被误写成下一批 active scope；
4. packaging 文案现在已由可执行 guardrails 支撑，但真正的 multi-entry runtime 发货仍未解决；
5. provider/runtime 宽度与 provider-settings metadata 现在已共享一条有界 control plane，因此剩余风险是边界漂移，而不是首轮实现。

仍然未解决的点：

1. 下一阶段的第一个瓶颈，依然是“latent runtime lane 是继续 dormant，还是提升成真实 packaged boundary”；
2. 第二个瓶颈，则是“让 provider discovery 的扩宽继续走共享 family/shape seam，而不是演变成持久化 catalog 或 all-provider 宣称”。

### 3.2 相对 local-KB / chapter-split Stage-B2CD PRD

当前 `main` 上，PRD requirement 状态如下：

| Requirement | 状态 | 说明 |
|---|---|---|
| R1 local KB retrieval for targeted tasks | 已落地 | 通过 `src/localKnowledgeBase.ts` 与任务级接入路径实现，现已覆盖 `从标题生成` |
| R2 local-only / no cloud / no daemon / no GPU | 已落地 | 当前实现基于插件内 MiniSearch 索引 |
| R3 retrieval disabled 时不回归旧行为 | 已落地 | 由可选设置和 integration tests 保护 |
| R4 settings-driven / conservative defaults | 已落地 | 当前设置路径可见且默认保守，并支持默认文件/文件夹源路径与任务级覆盖 |
| R5 候选 OSS 对比研究 | 已落地 | 研究结果已记录在 `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/` |
| R6 新增 `章节拆分` 动作 | 已落地 | command/sidebar wiring 已存在于 current main |
| R7 按标题拆分并生成 TOC 工件 | 已落地 | `src/chapterSplit.ts` 与对应测试已证明 |
| R8 不回归 packaging / semantic 真值 | 已落地 | build/audit 仍只证明 `main.js` 单资产发货 |
| R9 tests/docs/progress artifacts 对齐先前方案 | 已落地，且已进一步收紧 | 本文、矩阵更新以及 `verify:local-kb-fixtures` 现在同时覆盖了叙述层进度对齐与有界离线 retrieval-quality 回归检查 |
| R10 keep CI green and stability bar intact | 当前检查点已落地 | 已由当前 repo gates 重新验证 |

正确解释：

- 这份 Stage-B2CD PRD 在 current main 上已经功能性落地；
- 后续工作应转入质量/深度跟进，而不是继续证明“这些能力存不存在”。

### 3.3 相对 provider-settings simplification / model-discovery PRD

当前 requirement 状态如下：

| Requirement | 状态 | 说明 |
|---|---|---|
| R1 provider settings 需要区分 required/core 与 advanced 字段 | 已落地 | 当前 main 已通过共享的 core/contextual/advanced/developer 字段分组元数据来渲染 provider settings |
| R2 这一区分必须来自共享 provider metadata | 已落地 | `LLMProviderDefinition` 现已承载 `settingFields` 元数据，并被设置面板直接使用 |
| R3 保持 runtime 行为与 import/export 兼容 | 当前数据模型已天然有利于此 | 扁平 provider config 让未来重构的兼容性压力较低 |
| R4 支持 Azure 专属 required 字段而不污染其他 provider | 已落地 | `apiVersion` 可见性现在通过 provider metadata 表达，同时不改变扁平持久化结构 |
| R5 常见配置流程需要更快更聚焦 | 已以有界形态落地 | 当前 main 现已默认展示 core-first provider controls，并将次级调优项收进显式 advanced disclosure |
| R6 深度分析 Cherry Studio 模型获取链路 | 研究已落地 | `.trellis/tasks/05-27-provider-settings-model-discovery/research/cherry-studio-model-discovery.md` |
| R7 发现失败时必须平滑回退到手动 model 输入 | 已落地 | discovery 是 additive/transient 的；手动 `model` 输入仍是持久化真值路径，且在 discovery 不可用或失败时仍完整可用 |
| R8 `model` 必须保持 core/default-visible | 当前行为已满足 | `model` 现在就是一等可见字段 |
| R9 若已有持久化 advanced 值则默认展开 advanced | 已落地 | 当前 main 现已根据持久化 provider override 派生 advanced 展开状态 |
| R10 Cherry 方案只做 selective reuse，不整体照搬 | 已以有界形态落地 | 当前 main 使用的是 transient discovery metadata/service，而不是持久化 `provider.models[]` 子系统 |

正确解释：

1. 首轮 provider-settings/model-discovery 实现已经落到 current main；
2. 这份方案现在应被读作 control-plane contract 与 maintenance boundary；
3. 剩余工作是有界 provider-family 扩展、parser/header/token-guidance 纪律，以及文档真值维护。

### 3.4 相对 2026-05-20 统一矩阵

相对那份矩阵，当前有三处关键变化：

1. lane C 应明确带上 `1.9.2` release-facing version truth，而不再停留在 `1.8.9`、`1.9.0` 或 `1.9.1`；
2. 矩阵中需要显式保留 provider-settings / model-discovery 轨道，因为这条已落地的有界 surface 已足够影响后续优先级，不能被“泛化 settings 叙述”掩盖；
3. lane D 应继续保持“质量/深度 next”定位，而不是回退到“先证明功能存在”的表述。

## 4. 架构推进评估

### 4.1 真正推进了什么

1. **Transport-driven provider runtime 更成熟了**
   provider 宽度、test mode、known-model token metadata 与 connection-test 语义都比早期 provider-expansion 方案更完整。
2. **Bounded product slice 在不扩大 packaging claim 的前提下重新落地**
   local-KB、chapter split、preview history 与 saved-artifact reopening 的回归，没有逼着文档去假装 packaged runtime isolation 已经完成。
3. **Cherry Studio 对照研究消除了大的规划盲区**
   仓库现在已经明确知道该复用什么、不该复用什么，以及原因是什么。
4. **Provider-settings 轨道已经成为 current-main 已落地能力**
   先前的架构模糊已经转化为一个有界且已发货的实现，而不再只是规划话题或隔离执行探针。
5. **Release truth 在这个 checkpoint 之后再次前进**
   `1.9.2` 与后续 post-release contract follow-through 已把 sidebar observability、inspect explainability 与 release workflow contract ownership 变成 current-main 真值。

### 4.2 当前最大的结构性张力

1. **Source/build 真值不再完全一致**
   源码里已有 render-host runtime candidates；但 build 和 audit 仍证明没有发货独立 runtime asset。
2. **Provider discovery 宽度现在需要 maintenance discipline**
   control plane 可以通过共享 metadata 扩展，但前提是新增 provider 继续走 family/shape/header seam，而不是回到临时 provider-name 分支。
3. **朴素的 model-discovery 功能很容易过度扩 scope**
   如果整体照搬 Cherry Studio，就会平白引入第二套 provider-state subsystem。
4. **扁平配置结构既是优势也是约束**
   它保住了 import/export 与 `data.json` 兼容性，但不能被拉伸成隐藏的持久化 remote catalog。
5. **当前下一个 blocker 已经变成 scope discipline，而不是实现 bootstrap**
   首批 helper 已经落地，风险从“这条线能不能收敛”转向“随着 provider 宽度继续扩张，能否继续保持 discovery 边界轻量且诚实”。

### 4.3 正确解释

当前 main 最准确的定位应是：

1. 已经跨过“bounded product slice 是否恢复存在”的阶段；
2. 但还没有进入真正的 Stage-C packaged runtime convergence；
3. 已经跨过 current main 上第一阶段有界 provider-settings control-plane convergence 的里程碑，但仍刻意没有进入重型 provider-model catalog 子系统；
4. 更没有进入宽口径 public CLI promotion。

## 5. 具体 next-level 方案

### Batch A：Packaging source/build 收敛决策

优先级：`P0`

目标：

1. 明确决定 runtime-candidate 源码是否继续保持显式 non-shipped 状态，或
2. 同批推进为真实的 packaged multi-entry boundary。

强约束：

- 不要让“源码像是有 `render-host.mjs`，但 build/release 事实仍在否认它”这种暧昧中间态长期存在。

验收：

1. `esbuild.config.mjs`、`audit:render-host`、release-asset 文档与测试结论一致；
2. README / maintainer docs 不再传递混合信号；
3. 本机验证后 `git status` 仍 clean。

当前在 `main` 上做出的决策是：

- 先明确保持 render-host lane 为 source-only，利用运行时加载逻辑与审计覆盖共同锁定该真值，而不是半恢复一个未闭环的 shipped multi-entry 契约。

### Batch B：有界 public-CLI promotion 评审

优先级：`P1`

目标：

1. 评估是否有现存 path-based maintainer operation 已经准备好做有界 public 提升；
2. 对尚未准备好的 operation，继续有意保持 maintainer-only。

评审规则：

只有当以下条件都满足时才允许提升：

1. 输入显式；
2. 副作用已文档化；
3. 输出对自动化足够 machine-readable；
4. 失败 / 进度语义是确定性的。

### Batch C：local-KB / chapter-split 质量跟进

优先级：`P1`

目标：

1. 在不改变 local-only 架构的前提下提升 explainability 与 operator control；
2. 除非未来证明有更好的 local-only 方案，否则继续保持当前 lightweight retriever 形态。

可能的切入点：

1. 在标题生成、研究总结与 artifact-mode 图形生成已经落地 retrieval 摘要与 timing telemetry，且 chapter split 已补上确定性的 TOC front-matter metadata 与 repeated-heading-safe TOC block ref 之后，继续把 richer result/evidence framing 推进到剩余的 chapter-split helper/example 路径；
2. shared maintainer helper 现已为依赖 retrieval 的路径补上简洁 payload 示例，而当前 `main` 也新增了有界的 `local-knowledge.inspect` seam 用于检查 effective path/query/context，并支持临时 override-path 调参；下一步重点是让这些 maintainer 示例与 inspect 输出持续跟随 result schema 演进；
3. 继续完善 sliding-window、snippet shaping 与 folder-scope 预期等调优文档；对 offline fixture 则应把它视为已覆盖 exact/prefix/current-file-exclusion 类别以及 mixed file/folder task-scoped inspect case 的更宽基线，而 chapter-split 的剩余缺口应转向更深的 corpus 扩充，而不是重复证明“需要有这条夹具”。

### Batch D：provider-settings simplification + lightweight model discovery

优先级：`P1`

目标：

1. 继续保持默认 provider panel 为 core-first 且 metadata-driven；
2. 保持 `model` 在 core/default-visible surface；
3. 继续将非核心调优项放在显式 advanced disclosure 后，同时保留已有 persisted override 的可见性；
4. 继续让模型发现保持 lightweight transient helper，而不是第二套持久化 provider-state system；
5. 只有当 endpoint semantics、header ownership、token-guidance behavior、tests 与 docs 同批对齐时，才继续扩宽支持面。

实现形态：

1. 继续让 `LLMProviderDefinition` 成为 shared field/discovery metadata owner；
2. 继续保持 `src/ui/NotemdSettingTab.ts` 的 metadata-driven provider-field rendering，不要把 taxonomy 决策退回 provider-name 分支；
3. 保持 `LLMProviderConfig.model` 作为持久化 source-of-truth 字符串；
4. 继续让 discovery services 与 runtime/base-URL/header 语义保持一致；
5. 未来 discovery 扩展应继续通过共享 family/shape support 保持有界，而不是宣称 broad all-provider support；
6. **不要** 把远程 model catalog 持久化进 `data.json`；
7. 即使有 discovery，手动 model 输入也必须始终可用；
8. 重大扩宽批次仍应使用隔离 worktree/branch，只有在 docs/tests/verification 对齐后再合回。

验收：

1. provider definition 持续表达 core/contextual/advanced/developer 字段分组；
2. 当前已有 advanced 持久化值的用户不会丢失对实际行为的可见性；
3. model-discovery 失败不会阻断手动配置；
4. 测试覆盖 metadata-driven rendering、backward compatibility、discovery fallback、parser shapes、header ownership，以及本批触及的 token-guidance behavior；
5. 文档明确写出能力边界，不要高估 Cherry Studio parity。

## 6. Task 与文档收口规则

下一批工作应保持以下产物持续对齐：

1. task-local Trellis artifact（`.trellis/tasks/...`）
2. 当前 canonical progress matrix
3. 本审计文档
4. 独立的 provider-settings/model-discovery 专题方案文档
5. 若涉及 automation 或 packaging 文案变化，则同步维护 maintainer control docs

## 7. 验证门禁

下一层级批次仍应继续要求：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. 最终 clean 的 `git status --short --branch`

## 8. Bottom Line

当前主线已经不再主要缺失 bounded recovery slice。

当前主线现在主要承载着两个 next-level 架构问题：

1. 是继续让 latent runtime lane 明确保持 dormant / non-shipped，还是把它推进成 build、audit、docs、release truth 全部一致的真实 packaged boundary；
2. 是让已落地的 provider settings/model-discovery control plane 在扩宽时继续保持 shared-core、lightweight，还是让 provider-specific exception 与 catalog-like state 再次渗回系统。

这两件事，才是现在真正的 next-level move。
