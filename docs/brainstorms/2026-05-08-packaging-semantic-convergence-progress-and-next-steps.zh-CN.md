---
date: 2026-05-08
topic: packaging-semantic-convergence-progress-and-next-steps
---

# Packaging / Semantic Convergence 进展深度对比与下一步落地方案

## 1. 对比范围与基线

本次对比覆盖以下“先前方案要求”与当前 `main` 代码现实：

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md`（R1-R6 与 Acceptance Criteria）
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.*`
4. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`

对比目标：

- 判断“已落地能力”与“文档承诺”是否一致
- 判断 helper/test/docs 是否形成防漂移闭环
- 明确下一阶段从“文档与验证收敛”切换到“真实打包边界实现”的条件

## 2. 要求逐条映射（代码证据）

### PRD R1-R6 映射

| 需求 | 当前实现证据 | 状态 | 备注 |
|---|---|---|---|
| R1 保持真实架构边界，不夸大 heavy-runtime isolation | `scripts/diagram-semantic-verification.js` checklist + `docs/maintainer/release-workflow*.md` | 已满足 | 明确 `audit:render-host` 仅证明 `main.js + srcdoc` 自包含 |
| R2 不重开 `diagram.generate/preview/provider.connection.test` 契约边界 | 当前提交仅触及 `scripts/diagram-semantic-verification.js`、文档、测试 | 已满足 | 未修改 operation 语义层 |
| R3 helper 输出包含耐久 packaging-boundary 提示 | helper `buildPackagingBoundaryChecklistLines()` | 已满足 | 已覆盖 `outfile/outdir/unknown/ambiguous` 状态 |
| R4 release/semantic 文档真值一致 | `docs/maintainer/diagram-semantic-verification*.md` + `release-workflow*.md` | 已满足 | 双语文档已同步 |
| R5 增加防漂移回归测试 | `src/tests/diagramSemanticVerificationScript.test.ts` | 已满足 | 覆盖 array/object/backtick/unknown/ambiguous/context-scope |
| R6 不夸大原生桌面 CLI 结论 | 门禁始终记录 `obsidian help`、`obsidian-cli help` 实际输出 | 已满足 | 维持“实测即证据”策略 |

### Acceptance Criteria 映射

| 验收项 | 证据 | 状态 |
|---|---|---|
| 模板包含 packaging-boundary 且描述当前边界真值 | `npm run verify:diagram-semantics` 输出 | 已满足 |
| Maintainer 文档与模板一致 | `docs/maintainer/*` 对齐文案 | 已满足 |
| 测试锁住 helper/docs 形态 | `npm test -- --runInBand src/tests/diagramSemanticVerificationScript.test.ts` | 已满足 |
| 不改 command/operation 语义、不夸大运行时隔离 | 提交 diff 范围与门禁结果 | 已满足 |

## 3. 代码架构推进进度（相对先前方案）

### 已完成的收敛层

1. **语义验证 helper 从“单次模板”升级为“状态化边界检查器”**
   `outputTargetStatus` 已区分 `outfile` / `outdir` / `unknown` / `ambiguous`，降低维护者误读风险。
2. **解析器鲁棒性增强**
   支持 `"..."`、`'...'`、`` `...` `` 三种字面量；支持 array/object `entryPoints`；支持上下文作用域解析（优先 `esbuild.context({...})`，避免同名 decoy 字段污染）。
3. **验证闭环完整**
   helper 行为 -> 测试锁定 -> maintainer 文档同步 -> release 说明对齐，形成可重复演进路径。
4. **Stage B 契约定义已开始进入可执行落地**
   helper 模板现在新增 `Packaging Contract` 区块：从 `scripts/release/publish-github-release.js` 同步 release 必需资产，并显式检查双语 release notes 文件契约，同时记录数字 tag 与 create/upload 模式契约真值，并校验 `.github/workflows/release.yml` 中 tag-only 触发防护约束。
5. **Stage B 契约提升边界已进入可执行形态**
   helper 模板现在新增 `Contract Promotion Boundary` 区块：从 `src/operations/registry.ts` 提取 workflow/settings/export 邻近操作的 `automationLevel` / `requiredContext` / `sideEffectClass` 约束真值。

### 尚未进入实现层的边界

1. **真正的 heavy-runtime packaging isolation**
   仍未进入多入口资产落地，当前仍是单入口 `main.js` + inline `srcdoc`。
2. **更广泛的 Stage B 契约提升**
   虽然 release 与操作提升边界真值已进入 helper，但更广泛的 selection/export 契约提升仍依赖后续真实 packaging-boundary 约束落地。

## 4. 下一阶段具体落盘方案（执行顺序）

### Stage A：维持收敛稳定（短周期）

1. 持续把 helper 变化绑定到 `diagramSemanticVerificationScript.test.ts`（先测后改）。
2. 每次边界文案变更必须同步 `docs/maintainer/*` 双语文档。
3. 保持当前门禁链条：`build + full test + audit + diff-check + obsidian/obsidian-cli`。

### Stage B：打包实现前置研究（中周期）

1. 在 `esbuild.config.mjs` 维度梳理“多入口/独立资产”最小可行方案（不立即改主流程）。
2. 明确 release 资产、安装落盘、降级策略三者契约，再推进实现。
3. 把研究结论写入下一份 PRD，避免“先改构建后补约束”。

### Stage C：真实边界实现（后续）

1. 在确认契约后引入最小多入口或独立 host 资产路径。
2. 扩展 `audit:render-host` 与语义 helper 文案，反映新边界真值。
3. 再次执行文档-测试-实现三向同步，避免历史漂移复发。

## 5. 风险与控制

1. **风险：** helper 解析继续被 `esbuild.config` 结构变化击穿  
   **控制：** 新增回归必须覆盖新结构样例，再允许改动合入。
2. **风险：** 文档叙述快于实现  
   **控制：** 所有“已完成”结论必须绑定代码路径与测试名称。
3. **风险：** 过早进入 heavy-runtime isolation 导致 CI 波动  
   **控制：** 先做 Stage B 契约研究，后做 Stage C 实现。

## 6. 本次结论

当前 `main` 已达到“packaging/semantic-verification 收敛层”的稳定状态：

- helper 能表达当前边界并对异常状态给出显式提示
- 文档、测试、脚本三层一致
- CI 门禁保持全绿且可重复

下一步应按上面的 Stage B -> Stage C 路线推进“真实打包边界实现”，而不是回头重做已收敛的语义层。
