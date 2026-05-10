---
date: 2026-05-10
last_updated: 2026-05-10
topic: multi-entry-candidate-contract-and-stage-c-gate
---

# Stage-B2 多入口候选契约与 Stage-C 启动 Gate

## 1. 目的与范围

本文档将 packaging/semantic convergence 轨道中的 Stage-B2 契约单独落盘为可引用工件。  
它不会立即改动运行时打包，只定义在进入 Stage-C 运行时实现前必须成立的证据边界。

关联需求来源：

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md`（R1-R6 与 acceptance criteria）
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.zh-CN.md`
3. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.zh-CN.md`

## 2. 当前代码真值快照（主线证据）

### 2.1 构建边界真值（`esbuild.config.mjs`）

- `entryPoints: ["src/main.ts"]`
- `outfile: "main.js"`
- 未声明 `outdir`

结论：当前构建真值仍然是单入口、单输出插件 bundle 模型。

### 2.2 运行时宿主打包真值（`scripts/audit-render-host-bundle.js`）

- 审计要求 render-host 标记字符串存在于 `main.js` 内
- 审计显式拒绝以下独立宿主产物：
  - `render-host.html`
  - `render-host.js`
  - `rendering-webview/index.html`
- 审计也拒绝暗示外部宿主资产的引用

结论：当前被强制约束的边界仍然只证明“内联 `srcdoc` 宿主自包含”，并不等于独立宿主资产隔离已完成。

### 2.3 Release 资产契约真值（`scripts/release/publish-github-release.js`）

- `REQUIRED_RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'README.md']`
- release tag 必须匹配数字格式 `x.x.x`

结论：当前 release 契约仍然假定 `main.js` 是主要运行时交付产物。

### 2.4 语义契约真值（`scripts/diagram-semantic-verification.js`）

- helper 模板当前包含：
  - `Packaging Boundary`
  - `Packaging Contract`
  - `Contract Promotion Boundary`
  - `Implementation Readiness Contract`
- helper 现已编码：
  - 输出目标真值（`outfile` vs `outdir`）
  - release 资产契约真值
  - Stage-B2 runtime-isolation 前置条件映射

结论：语义层契约表达已经成熟到足以作为 Stage-C 启动 gate，但运行时隔离依旧是显式“未宣称完成”的状态。

## 3. 深度对比：先前要求 vs 当前架构推进进度

| 需求轨道 | 先前预期 | 当前证据 | 推进状态 | Stage-C 前仍需补齐 |
|---|---|---|---|---|
| PRD R1 | 不夸大 heavy-runtime isolation | build/audit/release 仍都锚定 `main.js` + 内联 host 真值 | 已闭环且稳定 | 无 |
| PRD R2 | 不重开 operation 语义表面 | 收敛切片仍限定在 helper/测试/文档 | 已闭环且稳定 | 当前轨道无 |
| PRD R3/R5 | 耐久契约检查 + 防漂移覆盖 | helper + 脚本测试 + 文档已对齐且持续扩展 | 已闭环且稳定 | parser/contract 变更继续先补失败样例 |
| PRD R4 | 文档声明必须跟随代码真值 | maintainer + progress/superpowers EN/ZH 已同步 | 已闭环且稳定 | 继续保持同批同步 |
| superpowers 任务 3 初衷 | 诚实澄清运行时打包边界 | 边界文案已由 audit/helper 显式表达并受约束 | 在“真值澄清层”已完成 | 真实 multi-entry runtime split 尚未开始 |
| Stage-B2 readiness 初衷 | 在 runtime 改动前固化 implementation-readiness 契约 | helper 已有 readiness 区块与前置条件映射 | 部分完成 | 还需独立落盘 multi-entry 候选与迁移 gate |

## 4. Stage-B2 候选契约（进入运行时改造前必须显式化的内容）

### 4.1 候选打包方向（实现前语义）

供 Stage-C 评估的候选方向：

1. 从单一 `outfile` 迁移到受控的 `outdir` 产物所有权
2. 只有在 release/audit 契约同批升级时，才允许拆分 dedicated host/runtime 资产
3. 迁移过程中必须继续显式记录 `main.js` 的兼容与归属预期

这仍然只是候选契约表述，不是已落地实现声明。

### 4.2 `outfile -> outdir` 迁移所需的契约更新

如果要启动 Stage-C，同一批次必须同时包含：

1. 构建真值更新（`esbuild.config.mjs`），显式声明输出产物所有权
2. 审计真值更新（`scripts/audit-render-host-bundle.js`），重定义允许/禁止的资产集合
3. release 契约更新（`REQUIRED_RELEASE_ASSETS` 及其相关测试/文档）
4. semantic helper 文案与测试更新，防止继续保留过时的单入口声明

### 4.3 被 runtime-isolation 前置条件阻塞的提升声明

在运行时边界真正实现并验证前，所有依赖宿主隔离假设的 workflow/settings/export 邻近操作叙述，都应继续保持“禁止提升为已完成声明”状态。

## 5. Stage-C 启动 Gate（必须全部满足）

只有当以下条件全部成立时，Stage-C 运行时边界实现才可以启动：

1. **契约 Gate：** Stage-B2 候选契约已落盘到文档，并在 helper 文案中有对应语义锚点。
2. **测试 Gate：** 针对计划中的契约迁移已具备 fail-first 回归样例。
3. **审计 Gate：** 新资产拓扑下的 `audit:render-host` 真值模型已先定义，再允许构建改动落地。
4. **Release Gate：** 迁移后 release 资产归属与 release notes 契约仍保持显式。
5. **文档 Gate：** maintainer + progress + superpowers EN/ZH 文档必须与代码真值同批更新。
6. **仓库 Gate：** 完整验证链通过（`build`、全量测试、audits、`git diff --check`、`obsidian help`、`obsidian-cli help`）。

## 6. 本文档落盘后的具体下一步

1. 在 semantic helper 脚本测试中补充围绕 `outfile -> outdir` 候选迁移语义的 fail-first 样例。
2. 在真正改构建前，先起草“独立 host 资产”审计契约差异。
3. 起草 release-helper 资产迁移测试，确保迁移过程中 `main.js` 归属语义不丢失。
4. 继续保持每个切片原子化、CI-safe，并执行完整门禁链。

## 7. 非声明项（防越界）

本文档**不**宣称：

- runtime isolation 已经实现
- multi-entry 构建产物已经发货
- 独立 render-host 资产已经被 release 批准

当前真值仍然是：单入口 `src/main.ts -> main.js`，并由现有 audit 与 release 契约强制约束“内联 host 自包含”。
