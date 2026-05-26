---
date: 2026-05-25
last_updated: 2026-05-25
topic: post-bounded-recovery-audit-and-next-level-direction
canonical: true
---

# Bounded Recovery 之后的主线审计与 Next-Level 方向

## 1. 为什么需要这份文档

仓库当前已经不再处于以下两个解释断点中的任意一个：

1. 2026-05-13 的 `1.8.9` 发布边界审计；
2. 2026-05-24 的 force-rewrite 基线审计。

在那之后，当前 `main` 已重新拿回一部分有界但实质性的 backup-branch 能力宽度，且 release-facing 的版本真值也再次同步完成。因此，当前真正需要回答的问题已经变了：

- 不再是“缺失的 recovery 切片到底是不是真存在”；
- 而是“recovery 之后的当前代码真值是什么、相对先前方案推进了多远，以及下一阶段真正的关键路径是什么”。

主要对比来源：

1. `docs/brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.zh-CN.md`
2. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md`
3. `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.zh-CN.md`
4. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md`
5. `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md`
6. `d81d84d` 之后的 live `main`

## 2. Recovery 之后的当前代码真值

### 2.1 Packaging / runtime 真值

当前发货真值仍然比源码树表面看起来更窄：

1. `esbuild.config.mjs` 仍只构建单个 `main.js` 输出。
2. `scripts/audit-render-host-bundle.js` 仍在强制执行 `main.js + inline srcdoc` 的 host 契约，并拒绝独立 render-host 输出文件。
3. 但源码中已经重新出现 runtime 候选文件，例如：
   - `src/rendering/runtime/renderHostEntry.ts`
   - `src/rendering/preview/renderHostRuntimeClient.ts`
   - 一组共享的 Mermaid / Vega-Lite preview runtime helper
4. 这意味着这些文件目前只是 **潜在实现通道**，而不是已发货的构建边界。
5. 当前 `main` 上的执行链也已开始显式收口到这条真值：
   - 默认 Mermaid / Vega-Lite preview loading 仍走 package runtime
   - `audit:render-host` 会拒绝当前主线中残留的 `render-host.mjs` 资产与构建产物引用

正确解释：

- 架构在源码组织层面继续推进了；
- 但在 release-asset 边界上 **还没有** 推进成已发货事实。

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
   - 以及 export 相关操作
2. `src/maintainerCliBridge.ts` 已实现这些 path-based maintainer operations，并要求显式 JSON / 文件 payload。
3. `content.split-note-by-chapters` 现在也已进入 `src/operations/registry.ts` / `src/cliContracts.ts` 的类型化主干，但仍明确不属于当前 public-safe slice。
4. `content.split-note-by-chapters` 的 maintainer 调用现已支持可选 `splitHeadingLevel` override，不再只依赖当前 settings 快照。
5. `content.split-note-by-chapters` 的类型化结果现在还会直接暴露 managed artifact contract（`requestedSplitHeadingLevel`、`chapterNotePaths`、`managedArtifactPaths`、`removedStalePaths`），不再逼调用方靠命名规则反推。
6. `scripts/lib/maintainer-cli-operation-help.js` 已成为这层 helper surface 的共享帮助真值。
7. public-safe export slice 仍然刻意比 maintainer helper 更窄。

正确解释：

- 当前 main 已不再是“只支持 export-only 的 maintainer helper”；
- 但它依然不是宽口径 public CLI API。

### 2.3 产品面真值

此前恢复回来的产品切片，现在已经是 current-main 事实，而不再只是 backup-branch evidence：

1. local knowledge retrieval 已接入：
   - `从标题批量生成`
   - `研究与总结`
   - `生成图形`
2. chapter split 已落地，具备 TOC/manifest 输出、面向重复 nested heading 的稳定 block ref，以及陈旧生成文件清理。
3. preview history 与 saved-artifact-aware reopening 已进入可复用 preview shell。
4. settings reset、concept-note prerequisite guidance、concept synonym suppression 与 folder file-selection profiles 都已回到当前主线。
5. 面向 retrieval 的 note-processing 结果现在也已为标题生成与研究总结暴露 machine-readable 的 `localKnowledgeRetrieval` 摘要，包含 matched/returned counts、source paths、请求的 `topK`、sliding-window size、current-file exclusion telemetry、index/query timing 与 context-char count。
6. 现在也已有专用的离线 retrieval-quality maintainer fixture：`npm run verify:local-kb-fixtures`。它直接对当前线上 MiniSearch retriever 跑一组小型回归语料，而不是再造一条评测专用检索路径。

代码证据包括：

1. `src/localKnowledgeBase.ts`
2. `src/chapterSplit.ts`
3. `src/ui/diagramPreviewHistory.ts`
4. `src/tests/localKnowledgeTaskIntegration.test.ts`
5. `src/tests/chapterSplit.test.ts`
6. `src/tests/diagramPreviewModal.test.ts`

### 2.4 Release / version / chronicle 真值

release-facing 真值也已在当前主线上重新对齐：

1. `package.json`、`manifest.json`、`versions.json` 已回到 `1.8.9`；
2. `src/ui/welcomeReleaseNotes.ts` 已把欢迎弹窗摘要推进到 `1.8.9` / `1.8.8`；
3. root `README*.md` 家族再次同步了版本 / badge / chronicle footer；
4. `scripts/release/commit-chronicle-refresh.js` 与 `scripts/lib/repo-saga-contributor-normalization.js` 已重新回到当前主线；
5. repo-saga 串行执行纪律仍由执行锁与文档共同强制。

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
4. packaging 文案整体上又恢复了诚实，但 latent runtime candidate code 让 source/build 歧义重新出现。

仍然未解决的点：

1. 下一阶段的瓶颈已不再是“把 runbook 写出来”；
2. 下一阶段真正的瓶颈，是“决定 latent runtime lane 是继续 dormant，还是提升成真实 packaged boundary”。

### 3.2 相对 local-KB / chapter-split Stage-B2CD PRD

当前 `main` 上，PRD requirement 状态如下：

| Requirement | 状态 | 说明 |
|---|---|---|
| R1 local KB retrieval for targeted tasks | 已落地 | 通过 `src/localKnowledgeBase.ts` 与任务级接入路径实现 |
| R2 local-only / no cloud / no daemon / no GPU | 已落地 | 当前实现基于插件内 MiniSearch 索引 |
| R3 retrieval disabled 时不回归旧行为 | 已落地 | 由可选设置和 integration tests 保护 |
| R4 settings-driven / conservative defaults | 已落地 | 当前设置路径可见且默认保守 |
| R5 候选 OSS 对比研究 | 已落地 | 研究结果已记录在 `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/` |
| R6 新增 `章节拆分` 动作 | 已落地 | command/sidebar wiring 已存在于 current main |
| R7 按标题拆分并生成 TOC 工件 | 已落地 | `src/chapterSplit.ts` 与对应测试已证明 |
| R8 不回归 packaging / semantic 真值 | 已落地 | build/audit 仍只证明 `main.js` 单资产发货 |
| R9 tests/docs/progress artifacts 对齐先前方案 | 已落地，且已进一步收紧 | 本文、矩阵更新以及 `verify:local-kb-fixtures` 现在同时覆盖了叙述层进度对齐与有界离线 retrieval-quality 回归检查 |
| R10 keep CI green and stability bar intact | 当前检查点已落地 | 已由当前 repo gates 重新验证 |

正确解释：

- 这份 PRD 在 current main 上已经功能性落地；
- 后续工作应转入质量/深度跟进，而不是继续证明“这些能力存不存在”。

### 3.3 相对 2026-05-20 统一矩阵

相对那份矩阵，当前有三处关键变化：

1. lane B 不能再继续写成 export-only maintainer tooling；
2. lane A 需要明确写出：runtime 候选源码已存在，但 build 真值仍未发货它；
3. lane C 现在不仅有 UX guardrail 收口，还有恢复后的 release-facing version truth 对齐；
4. lane D 已经明确进入“继续做质量/深度”阶段，而不是“恢复功能存在性”阶段。

## 4. 架构推进评估

### 4.1 真正推进了什么

1. **Registry-centered orchestration 更深了**
   maintainer helper metadata、public-safe export surfaces 与 operation identifiers 比最初 recovery 基线更一致。
2. **产品切片恢复时没有破坏 packaging honesty**
   local-KB、chapter split、preview history 与 saved-artifact reopening 的回归，没有逼着文档去假装 packaged runtime isolation 已经完成。
3. **runtime-candidate 代码更可复用了**
   共享 preview runtime helper 会降低未来 Stage-C 若真的选择 multi-entry delivery 的实现成本。

### 4.2 当前最大的结构性张力

1. **Source/build 真值不再完全一致**
   源码里已有 render-host runtime candidates；但 build 和 audit 仍证明没有发货独立 runtime asset。
2. **Maintainer helper 的能力宽度大于 public CLI**
   这本身可以成立，但必须保持显式边界。
3. **Local-KB 质量仍然受制于轻量本地索引设计**
   当前实现是刻意 lightweight 的；未来工作应是 tuning / explainability，而不是“上更多基础设施”。

### 4.3 正确解释

当前 main 最准确的定位应是：

1. 已经跨过“bounded product slice 是否恢复存在”的阶段；
2. 但还没有进入真正的 Stage-C packaged runtime convergence；
3. 也还没有进入宽口径 public CLI promotion。

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

1. 在标题生成、研究总结与 artifact-mode 图形生成已经落地 retrieval 摘要与 timing telemetry，且 chapter split 已补上 repeated-heading-safe TOC block ref 之后，继续把 richer result/evidence framing 推进到剩余的 chapter-split 路径；
2. shared maintainer helper 现已为依赖 retrieval 的路径补上简洁 payload 示例，下一步重点是让这些示例持续跟随 result schema 演进；
3. 继续完善 sliding-window、snippet shaping 与 folder-scope 预期等调优文档；对 offline fixture 则应把它视为已落地基线，而 chapter-split 的剩余缺口应转向 overwrite-policy / optional metadata 加固与更丰富的 query-class coverage，而不是重复证明“需要有这条夹具”。

## 6. Task 与文档收口规则

下一批工作应继续保持四层同步：

1. task-local Trellis artifact（`.trellis/tasks/...`）
2. 当前 canonical progress matrix
3. 专题 brainstorm / next-level audit 文档
4. 一旦涉及 automation 或 packaging 文案变化，就同步维护 maintainer control docs

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

当前主线现在真正承载的是一个新的架构问题：

1. 是继续让 latent runtime lane 明确保持 dormant / non-shipped，
2. 还是把它推进成 build、audit、docs、release truth 全部一致的真实 packaged boundary。

这才是现在真正的 next-level move。
