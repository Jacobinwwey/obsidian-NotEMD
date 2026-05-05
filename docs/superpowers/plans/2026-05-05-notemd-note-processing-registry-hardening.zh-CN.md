# Notemd Note-Processing Registry Hardening 实施计划

> **给代理执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 逐任务执行本计划。步骤继续使用复选框 `- [ ]` 语法跟踪。

**目标：** 将已落地的 note-processing host adapter 推进到 registry/capability/contract 层，并继续收紧 translation/extraction utility 的宿主副作用边界。

**架构：** 保持四层分离：trigger、host adapter、operation、contract。本计划不再重复做 `src/main.ts` 包装搬运，而是先把已抽出的 note-processing 流程纳入 operation registry，再继续把 `ProgressModal`、`Notice`、vault 写入等宿主副作用从 utility core 中显式化。

**技术栈：** TypeScript、Obsidian Plugin API、Jest、Markdown 文档、官方 `obsidian` CLI、capability manifest / invocation contract

---

## 当前基线

- `src/operations/noteProcessingCommandHostAdapter.ts` 已承接 process / generate / research / translate / extract 系列 wrapper。
- `src/main.ts` 中翻译与抽取 wrapper 已瘦身为 delegator。
- `src/fileUtils.ts` 与 `src/extractOriginalText.ts` 已接受窄 runtime context，而不是具体 `NotemdPlugin` 类。
- 剩余缺口不在 wrapper 层，而在 registry onboarding 与 utility side-effect 收口。

### 任务 1：Note-Processing Operation Registry Onboarding

**文件：**
- 修改：`src/operations/registry.ts`
- 修改：`src/operations/capabilityManifest.ts`
- 修改：`src/cliContracts.ts`
- 修改：`src/workflowButtons.ts`
- 测试：`src/tests/operationsRegistry.test.ts`
- 测试：按需要补充 CLI contract / capability-manifest 相关测试

- [ ] **步骤 1：先写失败测试，定义 note-processing operation 元数据**
明确 `translate-current-file`、`batch-translate-folder`、`extract-concepts-current`、`extract-concepts-folder`、`extract-original-text`、`extract-concepts-and-generate-titles` 的 `automationLevel`、`requiredContext`、`sideEffectClass` 与 command binding。

- [ ] **步骤 2：运行聚焦测试确认 registry 缺口存在**
执行：`npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/operationsRegistry.test.ts`
预期：因缺少 note-processing operation definitions 而 FAIL。

- [ ] **步骤 3：以最小 schema 落地 registry**
先建最小输入/结果 schema。对 active-file 依赖命令优先标记 `requires-active-file`，不要提前宣告为 `safe`。

- [ ] **步骤 4：更新 capability manifest / invocation contract 导出**
保证新增 operation 只暴露真实可解释的 bindings；legacy alias 保留兼容，但默认不进入 capability manifest。

- [ ] **步骤 5：重跑聚焦测试**
执行：`npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/operationsRegistry.test.ts`
预期：PASS。

### 任务 2：Translation And Extraction Utility Side-Effect Tightening

**文件：**
- 修改：`src/translate.ts`
- 修改：`src/fileUtils.ts`
- 修改：`src/extractOriginalText.ts`
- 修改：`src/operations/noteProcessingCommandHostAdapter.ts`
- 测试：`src/tests/noteProcessingCommandHostAdapter.test.ts`
- 测试：如签名变化则补 `src/translate.ts` / `src/extractOriginalText.ts` 聚焦测试

- [ ] **步骤 1：先写失败测试，锁定无 UI 路径**
为 batch translation 的 reporter 注入、notice shaping 或结果对象边界补测试，避免继续把 `ProgressModal` 当成唯一执行器。

- [ ] **步骤 2：运行聚焦测试确认当前 utility 耦合**
执行：`npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/noteProcessingCommandHostAdapter.test.ts`
预期：因新增的 host-effect 边界断言而 FAIL。

- [ ] **步骤 3：实现最小 utility 收口**
把 reporter/notice/file-write 影响拆成更显式的 host choice 或结果对象；不要一次性把 utility 全部重写成 service 层。

- [ ] **步骤 4：回填组合路径回归**
确保 `extract-concepts-and-generate-titles` 继续复用同一 busy-state 语义，且 batch generation 强制走配置中的概念目录。

- [ ] **步骤 5：重跑聚焦测试**
执行：`npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/noteProcessingCommandHostAdapter.test.ts src/tests/noteProcessingCommands.test.ts`
预期：PASS。

### 任务 3：Remaining `src/main.ts` Host-Adapter Extraction

**文件：**
- 修改：`src/main.ts`
- 修改：`src/operations/`（按需新建或扩展 host-adapter 模块）
- 测试：补充 command-surface delegation 聚焦测试

- [ ] **步骤 1：选择下一批高价值命令**
优先顺序固定为 duplicate cleanup -> batch Mermaid fix -> formula fix。不要同时开多条跨文件大改。

- [ ] **步骤 2：先写 delegator 测试**
为选定命令补“只调用 host adapter，不直接执行 utility”的 command-surface 测试。

- [ ] **步骤 3：提取最小 host adapter**
沿用现有 pattern：busy guard、reporter lifecycle、notice/error-log 编排留在 host adapter；utility core 保持可复用。

- [ ] **步骤 4：逐个回归**
每抽完一类命令，就重跑对应聚焦测试，不要等所有命令抽完后一次性找回归。

### 任务 4：Mainline Sync And Doc Alignment

**文件：**
- 修改：`docs/architecture.md`
- 修改：`docs/architecture.zh-CN.md`
- 修改：`docs/brainstorms/2026-05-02-progress-audit-and-next-direction.md`
- 修改：`docs/brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md`
- 修改：`docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md`
- 修改：`docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.zh-CN.md`

- [ ] **步骤 1：逐段对齐文档**
明确哪些承诺已由代码兑现，哪些缺口已转移，哪些旧说法必须删除。

- [ ] **步骤 2：写清后续方向**
短期写 registry onboarding；中期写 utility side-effect 收口与剩余 host-adapter 抽离；长期再谈 richer CLI transport。

- [ ] **步骤 3：保持双语同步**
每次修改 EN/ZH 同步完成，避免只更新单语版本。

## 短中长期推进顺序

**短期（本批次后立即执行）**
- note-processing registry onboarding
- translation/extraction utility side-effect tightening
- clean worktree fast-forward `main`

**中期（2-6 周）**
- remaining `src/main.ts` host-adapter extraction
- note-processing capability manifest / invocation contract 完整化
- 更清晰的 dry-run / machine-readable result surface

**长期（6 周以上）**
- richer CLI transport 评估（file bridge / local IPC / REST）
- 更细粒度的 operation versioning
- write-heavy automation policy 与 rollback semantics

## 验证

- [ ] `npm run build`
- [ ] `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs`
- [ ] `npm run audit:i18n-ui`
- [ ] `npm run audit:render-host`
- [ ] `git diff --check`
- [ ] `git status --short` returns clean before final push

## 风险与控制

- **风险：** 把 active-file 依赖错误标记为 `safe`。
  **控制：** 先标真实 `requiredContext`，再谈 CLI 暴露。

- **风险：** utility side-effect 收口时破坏现有 Notice / modal 体验。
  **控制：** host adapter 持续持有 UI 整形职责，utility 只收敛边界，不直接删行为。

- **风险：** 再次只做 wrapper 搬运，registry 仍然空缺。
  **控制：** 本计划把 registry onboarding 排在第一任务。
