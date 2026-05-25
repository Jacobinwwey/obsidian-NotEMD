---
date: 2026-05-13
last_updated: 2026-05-25
topic: mainline-progress-audit-1-8-9-and-next-direction
---

# 1.8.9 之后的主线进展审计：深度对比、当前状态与后续方向

> 历史边界说明：本文记录的是 `1.8.9` 发布切点视角下的审计结果，时间早于 2026-05-24 的 force-rewrite recovery 以及随后在当前主线上的 bounded recovery。要查看 recovery 之后的当前状态与 next-level 方案，请改看 `docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.zh-CN.md`。

## 1. 范围与基线

本文档用于落盘 `1.8.9` 发布边界之后的主线状态审计，并把当前代码真值与先前主线计划逐条对齐。

主要对比来源：

1. `.trellis/tasks/05-07-sync-main-progress-audit/prd.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`
4. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.zh-CN.md`
5. `docs/brainstorms/2026-05-12-release-chronicle-ci-hardening-progress-and-architecture-alignment.zh-CN.md`
6. `docs/brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.zh-CN.md`
7. 已发货 release 真值：`docs/releases/1.8.9.zh-CN.md`、`change.md`、`README_zh.md`、`src/ui/welcomeReleaseNotes.ts`

本次审计目标：

1. 区分哪些是已经落地的收敛事实，哪些仍是未开始的架构工作；
2. 防止进度文档继续高估 packaging/runtime 推进程度；
3. 基于当前 `main` 代码库，落盘一份具体后续方向。

## 2. 当前代码真值快照

### 2.1 图表预览边界

当前预览行为已经明显强于此前“已保存产物兜底预览”的基线：

1. `src/operations/diagramCommandHostAdapter.ts` 现在让 `Preview diagram` 走 canonical 直接预览路径，不再默认回退到重新生成。
2. `src/ui/DiagramPreviewModal.ts` 现在已经是可复用的预览壳层，而不只是“生成后弹一次”的一次性窗口：
   - 垂直 action rail
   - 历史面板
   - frame-safe 布局，避免无必要的横向滚动
3. `src/ui/diagramPreviewHistory.ts` 现在提供有上限的内存态预览历史（`MAX_DIAGRAM_PREVIEW_HISTORY = 12`），并按“已保存源真值”而不是简单弹窗顺序建 key。
4. `src/tests/diagramPreviewModal.test.ts`、`src/tests/diagramCommandHostAdapter.test.ts`、`src/tests/diagramCommandExecution.test.ts` 已锁定直接预览与再次打开行为。

必须明确的非结论：

- 这是预览表面的收敛，不是新的 renderer/runtime 拓扑。
- 当前代码依旧没有证明 heavy-runtime packaging isolation，也没有证明独立预览资产拆分已经完成。

### 2.2 Release chronicle / repo-saga 加固边界

发布后 follow-up 加固已经不止是一次性重试逻辑：

1. `scripts/release/commit-chronicle-refresh.js` 已经负责 tracked/untracked chronicle 工件的收口与有界 push 恢复。
2. `scripts/lib/repo-saga-execution-lock.js` 现在为 repo-saga chronicle 操作新增了可执行的串行锁。
3. `scripts/repo-saga/update-quarterly-saga.mjs` 现在在操作共享 repo-saga cache 根目录前会先拿这把锁。
4. `src/tests/repoSagaExecutionLock.test.ts` 锁定了：
   - 首次 acquire 成功
   - 活跃锁拒绝
   - stale lock 清理与重新 acquire
5. `docs/maintainer/release-workflow*.md` 与 `AGENTS.md` 现在把 `chronicle:sync-repo-saga` 和 `chronicle:update` 明确视为串行 gate，而不再只是操作经验。

必须明确的非结论：

- 这并不意味着 repo-saga 已经变成 parallel-safe。
- 它做的是把原本就应该串行的规则变成“运行时可执行 + 文档显式要求”的硬约束。

### 2.3 Release 真值同步边界

`1.8.9` 的发布边界现在内部一致：

1. `docs/releases/1.8.9.md`
2. `docs/releases/1.8.9.zh-CN.md`
3. `change.md`
4. `README.md`
5. `README_zh.md`
6. `src/ui/welcomeReleaseNotes.ts`

这套对齐现在同时覆盖两类真值：

1. 已保存 Mermaid 再次打开预览时，不再与首次预览内容漂移；
2. 欢迎弹窗中的“最近两次发布摘要”已经推进到 `1.8.9` / `1.8.8`。

## 3. 相对先前方案轨道的深度对比

### 3.1 对 `mainline-stabilization-next-batch` 的对比

该计划要求：

1. 优先做边界加固，而不是范围蔓延；
2. 代码、测试、文档必须同批落地；
3. 已落地稳定化与未来 packaging 工作必须诚实区分。

当前 `main` 已证明：

1. 预览真值收敛已经落地，而不是停留在计划层；
2. release follow-up 恢复与 repo-saga 串行安全都已 repo-owned 并被回归测试锁定；
3. release 版本真值、preview UX 真值与 welcome modal 真值都已在 `1.8.9` 边界同步。

仍然开放的点：

1. Stage-B2 -> Stage-C packaging 工作仍然是实际上的下一关键路径；
2. 当前 preview 进展不应再被误读成“可以继续推迟 packaging/semantic convergence”。

结论：

- `1.8.9` 是一次边界收敛 release。
- 它不是一次 renderer 扩张 release。

### 3.2 对 `diagram-rendering-platform-roadmap` 的对比

路线图要求：

1. canonical preview 入口；
2. 可复用的 preview/render host 表面；
3. 对已支持 preview/export 目标的真值表达；
4. runtime-boundary isolation 必须等到 contract/pipeline 收敛后再推进。

当前代码已证明：

1. canonical preview 入口已经真实复用到已保存产物的预览路径；
2. `DiagramPreviewModal` 已从“最小平台骨架”推进到产品可用的 host shell；
3. 历史切换与 frame-safe controls 已纳入 preview 边界，而不再依赖外部绕行；
4. 路线图里“support is explicit, not universal”的约束依旧成立。

仍然开放的点：

1. 还没有 dedicated render-host asset bundle；
2. 还没有 multi-entry packaging topology；
3. 任何新文档都不应暗示 universal renderer parity 或 detached heavy-runtime delivery 已完成。

结论：

- Task 4 / Task 5 风格的 preview 收敛已经实质推进。
- Stage-C runtime-boundary 工作在代码真值里仍然没有开始。

### 3.3 对 `packaging-semantic-convergence` 的对比

该轨道要求：

1. 保持当前 `main.js + inline srcdoc` 真值显式；
2. 在 helper/docs/tests 加固阶段不要重开 operation 边界；
3. runtime packaging 必须等 contract-definition gates 写清并锁定后再推进。

当前 `main` 已证明：

1. `1.8.9` 的 preview/release 工作没有与当前 packaging 真值冲突；
2. 仓库仍然是 single-entry bundling；
3. release 与 preview 收敛切片没有意外夸大 runtime isolation。

仍然开放的点：

1. Stage-B2 的 packaging-contract promotion 仍需把当前文档化意图进一步转成更紧的 implementation-readiness 工件；
2. Stage-C runtime 工作仍按设计被这些契约前置条件阻塞。

结论：

- packaging 轨道仍然是正确的下一阶段。
- 除非出现回归，否则 preview 与 release 加固现在不应继续占用这条关键路径。

### 3.4 对 release-chronicle / CI hardening 的对比

更早一轮 chronicle 加固解决了：

1. 远端 `500` 失败下的有界 push retry 与 rebase 恢复；
2. 用 repo-owned helper 替代内联 shell commit/push 逻辑。

当前代码在此基础上新增：

1. repo-saga chronicle 命令现在有可执行的串行锁，而不只是 prose 警告；
2. maintainer workflow 指南与 AGENTS 级 guardrail 已明确编码串行要求；
3. 当前加固同时覆盖了：
   - release follow-up push recovery
   - shared-cache mutation safety

结论：

- release-chronicle 轨道已经从 transport recovery 推进到了 concurrency-risk containment。

## 4. 架构推进评估

### 4.1 真正推进了什么

1. **预览真值从短暂内存态推进到已保存源真值**
   手动 `Preview diagram` 现在会重新打开已保存 Mermaid 源路径，而不是依赖陈旧的内存态 artifact 假设。
2. **预览 UI 已成为可复用的操作面**
   该 modal 现在支持重复检查与切换，而不是“生成后只看一次”。
3. **Release chronicle 安全性从操作习惯升级为执行约束**
   repo-saga 串行执行现在既有代码防护，也有 maintainer workflow 规则。

### 4.2 没有推进什么，且必须继续写清楚

1. heavy-runtime packaging isolation 依然没有落地；
2. multi-entry output topology 依然没有落地；
3. preview history 仍然只是内存态 session 状态，不是跨会话持久化目录；
4. repo-saga concurrency 仍然是“被禁止”，而不是“通过隔离 cache 或 parallel-safe 设计被解决”。

## 5. 风险与控制

1. **风险：** 后续文档把 preview 收敛误写成 runtime-boundary 路线图已基本完成。
   **控制：** 在所有 packaging-facing 文档里继续显式写清 `main.js + inline srcdoc` 真值。
2. **风险：** 维护者未来因为“锁通常能兜住”而在 CI 中并行 repo-saga 步骤。
   **控制：** 将串行规则同时保留在 `AGENTS.md`、release-workflow 文档与运行时锁 helper 中；三者不能只改其一。
3. **风险：** preview-history UX 在没有明确契约的前提下演变成持久化状态。
   **控制：** 在出现明确 PRD 之前，继续把历史保持为内存态。
4. **风险：** 通用 Mermaid fixer 再次被接回 preview reopening，导致非 flowchart 图表重复损坏。
   **控制：** 保持当前 type-aware preview 路径，不要把广义 fixer 再塞回已保存预览 reopening，除非对应 subtype 有回归测试锁定。

## 6. 具体后续方向

### 优先级 1：回到 packaging / semantic 关键路径

1. 基于已经落地的 semantic helper 真值，继续推进 Stage-B2 implementation-readiness contracts；
2. 除非出现新的用户可见回归，否则不要再重开 preview UI 工作；
3. 未来所有 packaging claim 继续受限于 `esbuild.config.mjs`、审计脚本与测试真正能证明的边界。

### 优先级 2：把 preview 视为收敛维护面，而不是无边界扩张面

1. 只有在真实跨会话工作流需要时，才考虑持久化 preview history；
2. 保持 command/sidebar/workflow 三个表面的 preview 入口持续 canonical；
3. 除非出现具体回归，不要按 artifact subtype 再次分叉 preview 主路径。

### 优先级 3：继续保守处理 repo-saga 加固

1. 对共享 cache 的 chronicle 命令继续保持串行执行；
2. 如果未来确实需要并行，先拆 cache roots，再讨论放宽锁粒度；
3. 对任何会写回仓库的 release follow-up step，继续坚持 helper-first + regression-locked。

## 7. 对当前主线状态的解释

这次审计应当被理解为：

1. `1.8.9` 在 `main` 上收口了真实的 preview-truth / preview-UX / release-truth 切片；
2. repo-saga 的串行防报错规则现在已经同时具备文档约束与可执行约束；
3. 仓库在产品边界与 release-ops 边界上的收敛程度，相比 `1.8.8` 已进一步提高；
4. 下一步真正有意义的架构推进仍然是 packaging-boundary convergence，而不是继续做更广泛的 UI 摇摆。

## 8. 2026-05-19 校正与追加进展

这份 2026-05-13 审计文档现在有两处必须显式校正，否则会继续误导后续判断：

1. 文中 `还没有 dedicated render-host asset bundle` 与 `仓库仍然是 single-entry bundling` 已经不再成立；
2. 当前代码真值早已进入受控的 `main.js` + `render-host.mjs` Stage-C runtime lane，这一点已被：
   - `npm run audit:render-host`
   - render-host bundle 审计测试
   - release/manual-install 资产要求
   - semantic helper / maintainer docs
   共同锁定。

在此基础上，主线又新增了一条产品收敛切片：

1. 本地知识库检索
   - 适用面：`从标题批量生成`、`研究并总结`、`生成图形`
   - 实现形态：plugin-native MiniSearch + heading-aware section chunking
   - 约束：prompt augmentation only，不引入 daemon / cloud / vector DB / GPU
2. 章节拆分
   - 适用面：active-file command / sidebar / workflow surface
   - 输出真值：`<basename>_chapters`、`<basename>_TOC.md`、`.notemd-chapter-split.json`
   - 目标：在原文件相邻路径下完成 heading-based split + TOC extraction，并清理旧生成物

对当前主线的正确解释应更新为：

1. Stage-C runtime lane 已经存在，但仍然是受控的 dedicated render-host lane，而不是泛化 topology 完成；
2. 新增的本地知识库检索与章节拆分属于产品能力收敛，不构成新的 runtime-boundary claim；
3. 下一关键路径仍然是 packaging / semantic-verification convergence，而不是把轻量本地检索错误升级成新的运行时架构方向。

## 9. 2026-05-19 真实文件与 CLI 落盘验证

在上述校正之外，还需要把这批 Stage-B2/C/D 相关功能的真实文件验证显式落盘，否则“已支持 CLI / 已完成收口”仍然会停留在口头层。

### 真实 vault 验证范围

活动 vault：`/home/jacob/obsidian-NotEMD/docs`

真实测试根：`docs/__e2e_manual_cli_1779194979/`

调用入口：

- `node scripts/invoke-maintainer-cli-operation.js`
- 底层仍是 `obsidian-cli native ... eval`
- 当前只支持四个有界 operation：
  1. `content.batch-generate-from-titles`
  2. `content.split-note-by-chapters`
  3. `research.summarize-topic`
  4. `diagram.generate`

### 真实结果

1. `content.batch-generate-from-titles`
   - 使用 `regex + basename + includeSubfolders=exclude`
   - 真实命中 1 个文件
   - 日志确认已注入 local-KB context
   - 真实 DeepSeek 往返成功
   - 当前代码真值：若 complete 目录已有同名目标，则保守跳过 move，不做覆盖
2. `content.split-note-by-chapters`
   - 从 `roadmap.md` 成功生成 2 个章节文件
   - 产出 `roadmap_TOC.md` 与 `.notemd-chapter-split.json`
   - 返回契约与磁盘产物一致
3. `research.summarize-topic`
   - Tavily API key 为空时，web research 路径失败但不会中断整条链
   - local-KB 单独可继续完成总结
   - `sourceLabel=Local KB`、`researchContextUsed=false`、`localKnowledgeContextUsed=true`、`appended=true`
4. `diagram.generate`
   - 显式 override `requestedIntent=flowchart`、`compatibilityMode=best-fit`、`targetLanguage=zh-CN` 已进入 `operationInput`
   - 日志确认 diagram artifact 路径已注入 local-KB context
   - 真实 Mermaid artifact 已落盘到 `diagram-input_summ.md`

### 解释边界

1. 这证明“新功能已支持 CLI”在当前主线上的正确表述应是：**已存在 repo-local、maintainer-grade、bounded 的 CLI 调用桥**；
2. 它**不等于**公共 CLI 表面已经扩大，也不等于可以对外承诺稳定用户向 typed CLI API；
3. 下一步如果要继续推进 CLI，只应在保持 public-safe slice 继续收窄声明的前提下，增量扩大 maintainer bridge 或继续做 contract-hardening，而不是反向夸大完成度。

## 10. 2026-05-20 RAG 真值校正与下一步

还需要把“本地知识库检索”的能力边界继续钉死，否则后续很容易把它误读成已经完成的通用 RAG 平台：

1. 当前代码真值仍然是：
   - plugin-native MiniSearch
   - heading-aware section chunking
   - lexical retrieval
   - prompt augmentation only
   - 没有 embedding / reranker / vector DB / daemon / GPU
2. 本批次新增的滑动窗口设置，只解决一个非常具体的问题：
   - 用户可以配置每个命中片段前后额外带多少个相邻 section
   - 这缓和了 section 命中后上下文切断过硬的问题
   - 它**不是**语义检索升级，也**不是**评测体系补齐
3. 如果拿 `ragas` / `RAGPerf` 这种参考系来衡量，当前差距依旧明确：
   - 没有 faithfulness / correctness 类离线评估
   - 没有 hit-rate / precision@k / miss diagnostics
   - 没有检索链路 latency 分解
   - 没有 freshness / update workload 基准
4. 这不意味着方案错误，反而说明当前工程取舍是克制的：
   - 对当前 Obsidian 插件边界而言，这条 MiniSearch + section-window 路径是正确的局部最优
   - 下一步优先补的应是 maintainer-grade evaluation / telemetry，而不是急于引入更重的 runtime

因此，当前进展的更准确解释应更新为：

1. 本地知识库检索已经从“纯命中 section 拼接”推进到“可调相邻窗口”的 bounded local retrieval；
2. 这提高了实际效果，但仍然只是轻量 local-KB augmentation，不应夸大为成熟 RAG 平台；
3. 后续优先级应转向：
   - retrieval telemetry
   - 小型 golden-set 评估
   - 章节拆分 / TOC anchor 语义加固
   而不是先引入新一轮重量级检索栈。

## 11. 2026-05-20 章节拆分 next-level 加固

还需要把另一条容易被“功能已落地”掩盖的事实写清楚：章节拆分虽然已经可用，但它之前仍然偏向 heuristic v1，而不是足够稳的 managed-artifact surface。

本轮代码真值相对先前计划要求又前进了一步：

1. 相比“只要能按标题拆开并生成 TOC 即可”的初始要求，当前实现已经明确补上了两个高价值稳态点：
   - 设置项中新增 `章节拆分 -> 拆分标题层级`，支持 `Auto` / `H1`-`H6`
   - 输出文件名不再把大量 CJK 标题退化成 `chapter-01` 一类 fallback slug，而会尽量保留 Unicode-safe 标题语义
2. 这两个点解决的是先前代码里的真实产品缺口，而不是抽象洁癖：
   - mixed heading notes 缺少 operator control，用户无法稳定指定按 H2 还是 H3 拆
   - 中文/Unicode 标题在章节文件名里语义丢失，导致生成物可读性与可维护性偏弱
3. 当前行为边界也更明确了：
   - 若显式指定的拆分层级在笔记中不存在，当前实现会直接失败，而不是静默回退到别的层级
   - 这是刻意选择的 deterministic 行为，目的是避免用户以为自己按 H3 拆了，实际却偷偷按 H1/H2 生成

但这仍然不等于章节拆分已经完全成熟：

1. 还没有完成 repeated-heading anchor collision 语义加固；
2. 还没有完成“用户手改生成章节文件后再次 rerun”的 overwrite-policy 收口；
3. 还没有扩展到 setext heading / richer metadata / batch split。

因此，章节拆分的更准确进展解释应更新为：

1. 它已经从“能拆”推进到“可控且对中文标题更友好”的 bounded v2；
2. 它仍然是 heading-based materialization workflow，而不是语义章节理解器；
3. 下一阶段若继续推进，应优先补：
   - anchor collision tests + semantics
   - managed-artifact overwrite policy
   - TOC/front-matter metadata
   而不是急于扩展 folder-batch split 或引入更重解析栈。

## 12. 2026-05-20 命名 file-selection profile 收口校正

还需要把文件夹筛选线的当前进展再校正一次，否则后续很容易把“保存的路径”误读成“绑定的执行路径”：

1. 当前代码真值已经从“只有全局默认筛选”推进到“全局默认筛选 + 可复用命名档案”：
   - 持久化设置：`folderTaskFileSelectionProfiles`
   - 每个档案包含 filter mode/pattern/target、大小写、反向匹配、子文件夹范围，以及可选 `folderPathHint`
2. 但这里最关键的约束不是“能保存路径”，而是“路径只作 hint，不作 binding”：
   - `folderPathHint` 只用于 interactive picker 的预填充
   - 实际运行时 folder 仍允许用户手动改选
   - 这是刻意的稳定性设计，用来避免陈旧档案路径 silently hijack 后续运行
3. 当前优先级模型也已明确且锁定：
   - `单次运行显式 override > 已保存档案 > 全局默认值`
4. 这一模型现在已贯通：
   - selector helper
   - interactive host adapter
   - maintainer CLI bridge 中的 `fileSelectionProfileId` / `fileSelectionProfileName`

因此，对当前架构推进状态的更准确表述应更新为：

1. 这是一条 selector-layer consistency hardening，而不是新的 runtime/product topology 扩张；
2. 它提升了文件夹任务可复用性，但没有把执行语义变成“档案驱动的隐式路径绑定”；
3. 下一步若继续推进，应优先做 profile-surface contract hardening，而不是先做更大的 CLI/public-surface promotion。
