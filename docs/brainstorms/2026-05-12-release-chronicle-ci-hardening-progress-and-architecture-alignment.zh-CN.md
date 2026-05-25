---
date: 2026-05-12
last_updated: 2026-05-13
topic: release-chronicle-ci-hardening-progress-and-architecture-alignment
---

# Release Chronicle CI 加固：深度对比、当前进展与后续方向

## 1. 范围与需求基线

本文档用于落盘 `1.8.7` 发布后 `Release` workflow 加固切片的具体方案与当前状态评估。

本次对齐的主要需求来源：

1. `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
3. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md`
4. `1.8.7` 对应的失败 `Release` workflow run `25675613652` 以及修复验证成功的回放 `25718241272`

本切片的交付目标：

1. 去掉 release chronicle follow-up push 路径中的单次尝试脆弱性；
2. 将 release workflow 真值收口到仓库代码，而不是留在 YAML 内联 shell；
3. 保持 CI-safe 纪律：代码、测试、维护者文档和真实 workflow 回放必须一致；
4. 让修复路径落地后 `main` 保持干净且与远端同步。

## 2. 故障现实与根因

最新一次远端失败并不在插件 build/test 主路径上。

- `publish` job 成功。
- `refresh_chronicle` 失败在 `Commit chronicle refresh` 步骤。
- 真正失败的操作是 `git push origin HEAD:main`，GitHub 远端返回了 `500 Internal Server Error`。

根因总结：

1. **workflow 采用了一次性 push 假设**
   在生成 chronicle 工件后只 commit 一次、push 一次，对瞬时远端失败没有恢复路径。
2. **chronicle commit 逻辑只存在于内联 shell**
   这使 release 路径中最脆弱的部分难以测试，也容易与文档发生漂移。
3. **变更检测面窄于真实工件面**
   旧路径依赖 `git diff --quiet` 之类的 tracked-file 视角，而 chronicle 刷新完全可能涉及 tracked 和 untracked 候选工件。

## 3. 实现映射（需求 / 代码证据）

| 需求 / 问题 | 代码证据 | 状态 |
|---|---|---|
| 用检入 helper 替代脆弱的内联 chronicle push 逻辑 | `scripts/release/commit-chronicle-refresh.js` | 已落地 |
| 用 tracked + untracked 状态检测 chronicle 变化 | `hasChronicleChanges()` 使用 `git status --porcelain --untracked-files=all` | 已落地 |
| 只 stage 预期的 chronicle 工件 | `CHRONICLE_PATHS` + `stageChronicleFiles()` | 已落地 |
| 无需提交时干净退出 | `commitChronicleRefresh()` 的 no-op / staged-noop 分支 | 已落地 |
| 对瞬时 push 失败做重试 | `pushChronicleCommitWithRetries()` | 已落地 |
| 远端已包含 commit 时视为恢复成功 | `remoteContainsCommit()` + already-present success path | 已落地 |
| 远端 `main` 前进后可 fetch/rebase/retry | `fetchRemoteBranch()` + `rebaseOntoRemote()` + retry loop | 已落地 |
| workflow 真值与仓库 helper 保持一致 | `.github/workflows/release.yml` 直接调用 helper | 已落地 |
| 用回归测试锁定行为 | `src/tests/commitChronicleRefreshScript.test.ts` | 已落地 |
| 锁定 workflow 契约、防止回退到内联 shell | `src/tests/githubReleaseWorkflow.test.ts` | 已落地 |
| 维护者文档与真实恢复路径保持一致 | `docs/maintainer/release-workflow*.md` | 已落地 |

## 4. 架构推进评估

这一切片相较修复前的 release 路径，在三个维度上明显前进：

1. **从 workflow shell 提升到仓库内 helper**
   release follow-up commit/push 语义现在是仓库一级代码，而不是 YAML 中的临时 shell。
2. **从 best-effort push 升级为状态化恢复路径**
   chronicle 发布路径现在能区分：
   - no-op
   - 本地 commit + 直接 push 成功
   - 远端已包含该 commit
   - 远端前进后 rebase 再重试
3. **从“本地绿”升级为“真实远端回放验证”**
   修复没有停留在本地测试，而是直接对已有 `1.8.7` tag 进行了 `Release` workflow 回放并成功完成。

## 5. 相对先前方案轨道的深度对比

### 5.1 对 `mainline-stabilization-and-ci-hardening` requirements 的对比

对齐点：

1. **R1 真值源控制** 更强了，因为真实 release follow-up 行为现已显式检入仓库代码和维护者文档。
2. **R2 维护者侧 CI 真值区分** 仍然保持；这次变更没有额外引入常规 `main` push/PR CI，而是继续收敛在 release workflow 真值模型里。
3. **R3 支持的 release path 稳定性** 已从 action pinning 等表层，进一步延伸到发布后 follow-up transport recovery。
4. **R9 仓库卫生** 依然保持，因为只有预期的 chronicle 工件会被 stage / push。

净效果：

- 原始 requirements 此前更多是在“workflow 形态”层面满足；
- 现在进一步提升到“真实远端失败场景下的恢复行为”层面满足。

### 5.2 对 `mainline-stabilization-next-batch` 意图的对比

对齐点：

1. 这依然是边界加固，不是产品表面扩展；
2. 它延续了相同的 CI-safe 规则：检入真值 + 回归锁定 + 完整门禁后再落地；
3. 它减少 release path 漂移，但没有重开无关的 renderer/runtime packaging 拓扑议题。

差异点：

- 本切片推进的是 release automation 边界，而不是终端用户 command/workflow 行为。

### 5.3 对 packaging / semantic convergence 轨道的对比

对齐点：

1. 延续了相同的 anti-drift 模式：把真值收口到 helper 代码，再用测试与文档锁定；
2. 修复范围严格停留在 release/verification 边界，没有提前进入 Stage-C runtime packaging 工作。

差异点：

- 本切片不实现 packaging-boundary 拓扑变化；它加固的是承载这些后续阶段的 release-ops 外围路径。

## 6. 风险清单与控制措施

1. **风险：** 后续 chronicle refresh 再次产生合法 commit，但远端 push 又遇到间歇性 transport/server 失败。
   **控制：** 有界重试 + fetch/rebase/backoff + remote-contains-commit 恢复路径。
2. **风险：** 后续 workflow 修改绕开 helper，重新引入内联 shell 漂移。
   **控制：** workflow 契约回归现在会断言 helper 调用，并拒绝旧的直接 `git push origin HEAD:main` 模式。
3. **风险：** chronicle 变更检测漏掉 untracked 工件。
   **控制：** 状态检测现在显式包含 `--untracked-files=all`。
4. **风险：** chronicle follow-up 文档再次落后于真实恢复行为。
   **控制：** 维护者 release 文档已在同一批次内同步更新。

## 7. 验证证据

### 7.1 本地门禁

执行并通过：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

### 7.2 真实远端验证

1. 失败历史证据：
   `Release` run `25675613652` 失败在 `refresh_chronicle`，原因是 chronicle commit push 命中远端 `500`。
2. 修复验证：
   `Release` workflow 回放 `25718241272` 已端到端成功。
3. 回放后结果：
   workflow follow-up chronicle commit 已落到 `main`，本地 `main` 也已 fast-forward 到同一 tip。

## 8. 当前进展与主线状态

当前主线证据：

1. 修复提交：`2da94e0`（`fix(ci): harden chronicle release push recovery`）
2. workflow 自动 follow-up chronicle 提交：`c28bcee`
3. `main` 与 `origin/main` 在 fast-forward 拉取后保持同一 SHA

这说明仓库并没有停留在“半修复状态”：

- helper 已落地；
- 测试已落地；
- 文档已落地；
- 真实 workflow 回放已成功；
- follow-up chronicle 工件已并入主线；
- 工作区最终保持 clean。

## 9. 后续方向

1. 后续凡是 release 后还会写回 `main` 的步骤，都应优先采用“helper-first”而不是 YAML shell-first。
2. 任何新的 repo-mutating follow-up step 都应满足本切片已经建立的同一标准：
   helper 优先、回归锁定、真实 workflow 回放后再关闭。
3. 继续沿既有 Stage-B2 packaging / semantic-verification convergence 方向推进，不要把 heavy runtime-topology 变更混入 release-ops 加固切片。

## 10. 2026-05-13 串行执行安全补充

原始 `2026-05-12` chronicle 加固解决的是远端 push 恢复缺口。当前 `main` 在此基础上又新增了一层不同类型的保护，必须显式记录：

### 10.1 第一轮修复后仍然薄弱的地方

即便 `commit-chronicle-refresh.js` 已具备恢复能力，repo-saga chronicle 路径仍然对一条重要假设过度依赖操作习惯：

1. `npm run chronicle:sync-repo-saga`
2. `npm run chronicle:update`

这两个命令共享 `.cache/repo-saga-sources/` 与 `.cache/repo-saga-upstream/`。如果并行执行，仍然可能破坏 clone 状态或留下陈旧 git lock 文件。

### 10.2 当前代码新增了什么

1. `scripts/lib/repo-saga-execution-lock.js` 现在提供检入式串行执行锁，具备：
   - 活跃进程拒绝
   - stale lock 清理
   - 面向操作者的明确报错文本
2. `scripts/repo-saga/update-quarterly-saga.mjs` 现在会在修改共享 cache 根目录前先获取该锁。
3. `src/tests/repoSagaExecutionLock.test.ts` 直接锁定这套串行安全行为。
4. `AGENTS.md` 与 `docs/maintainer/release-workflow*.md` 现在也在 workflow 层编码了同一条串行规则。

### 10.3 架构解释

这并不是“repo-saga 已支持并行”。它代表的是一条更严格、也更诚实的边界：

1. 共享 cache 的 chronicle 路径依旧按设计保持串行；
2. 这条串行规则现在已经从纯 prose 提升为运行时可执行约束；
3. 因而 release-chronicle 加固现在同时覆盖了：
   - 远端 follow-up push 恢复
   - 共享 cache 变更安全

### 10.4 后续规则

如果未来真的需要并发 repo-saga 作业，正确方向不是削弱这把锁，而是先隔离 cache roots、先重定义并发契约，再讨论放宽锁粒度。

当前更广义的主线状态审计可交叉参考：

- `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.zh-CN.md`
