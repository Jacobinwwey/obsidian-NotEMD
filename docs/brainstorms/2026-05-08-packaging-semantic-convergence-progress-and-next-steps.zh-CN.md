date: 2026-05-08
last_updated: 2026-05-10
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
   helper 模板现在新增 `Contract Promotion Boundary` 区块：从 `src/operations/registry.ts` 提取 workflow/settings/selection/export/config 邻近操作的 `automationLevel` / `requiredContext` / `sideEffectClass` 约束真值。
6. **契约提升解析器已补齐 registry 字面量抗漂移**
   操作契约元数据提取现在可容忍混合引号字面量（`"..."`、`'...'`、`` `...` ``），并新增回归覆盖锁定 selection/config/export 追踪操作的该行为。
7. **契约提升追踪已支持前缀通配自动展开**
   `file.process-*` 与 `concept.extract-*` 现在从实时 registry operation ID 自动展开，不再完全依赖静态手工列表；同时在 registry 缺失时仍保留稳定回退 ID，保证 checklist 输出可用。
8. **Release workflow 触发解析已降低引号样式脆弱性**
   tag 触发契约检查现在会解析 `tags:` 列表的混合引号风格，并显式把 `v*.*.*` 通配模式视为防护违规，降低仅因 YAML 格式改写导致的真值漂移风险。
9. **Release tag 触发作用域已显式收敛**
   触发检测现在只信任 `on.push.tags`，会忽略工作流其他区块中的 `tags:` 字段，降低来自 matrix/env 元数据键的误报风险。
10. **内联 push tag 语法已纳入解析**
   release 触发检查现在也会解析内联 push 对象写法（例如 `push: { tags: ["*.*.*"] }`），降低 workflow YAML 紧凑化改写后的漂移风险。
11. **顶层内联 `on` 对象语法已纳入解析**
   release 触发检查现在也会解析紧凑的顶层 `on` 对象写法（例如 `on: { push: { tags: ["*.*.*"] }, workflow_dispatch: {} }`），在事件声明完全内联时仍可保持触发防护真值稳定。
12. **`on` 事件序列中的 workflow_dispatch 检测已纳入解析**
   release 触发检查现在也会从事件序列与内联事件数组写法中识别 `workflow_dispatch`（例如 `on` 下使用 `- workflow_dispatch`，或 `on: [push, workflow_dispatch]`），在事件语法改写但意图不变时降低真值漂移风险。
13. **`on` 事件序列 push 映射的 tag 语法已纳入解析**
   release 触发检查现在也会解析 `on` 事件序列里 `- push:` + 嵌套 `tags` 的写法，在事件声明风格变化时保持 tag 触发真值稳定。
14. **带引号的 YAML 事件键已纳入解析**
   release 触发检查现在也支持带引号的 workflow 事件键与嵌套触发键（例如 `'push':`、`"tags":`、`'workflow_dispatch':`），降低键名引号风格统一改写导致的真值漂移风险。
15. **带引号顶层内联 `on` 对象写法已由回归覆盖锁定**
   回归测试现已显式锁定带引号的顶层内联 `on` 对象写法（例如 `'on': { 'push': { "tags": [...] }, "workflow_dispatch": {} }`），避免紧凑带引号声明发生静默回退。
16. **`on` 事件序列中的 workflow_dispatch 映射写法已纳入解析**
   release 触发检查现在也可解析 `on` 事件序列中的 workflow_dispatch 映射写法（例如 `- workflow_dispatch: {}` 与 `- 'workflow_dispatch': {}`），在序列映射式事件声明下减少真值漂移。
17. **嵌套非事件 workflow_dispatch 键已加入误报防护**
   事件键检测现在限定为 `on` 顶层映射，避免把 `workflow_call.inputs.workflow_dispatch` 这类嵌套键误判为 release 触发事件。
18. **内联 push 嵌套 tags 键已加入误报防护**
   内联 `push` 触发解析现在只信任顶层 `push.tags` 字段，避免把 `push.filters.tags` 这类嵌套键误判为 release tag 触发条件。
19. **多行 push 嵌套 tags 块已加入误报防护**
   多行 `push` 触发解析现在只信任 `push` 首层映射中的 `tags` 键，避免把 `push.filters.tags` 这类嵌套块误判为 release tag 触发条件。
20. **多行 push.tags 的嵌套列表形态已加入误报防护**
   多行 `push.tags` 解析现在只信任直接列表项形态，避免把 `push.tags.include` 这类嵌套结构中的列表误判为 release tag 触发条件。
21. **`on` 序列内联对象事件映射写法已纳入解析**
   release 触发检查现在也可解析 `on` 序列中的内联对象写法（例如 `- { push: { tags: [...] }, workflow_dispatch: {} }`），同时继续忽略这类内联对象中嵌套的非事件键。
22. **内联 on 数组对象事件项已纳入解析**
   release 触发检查现在也可解析内联 `on` 数组中的对象项（例如 `on: [{ push: { tags: [...] } }, { workflow_dispatch: {} }]`），同时继续忽略这类对象项中的嵌套非事件键。
23. **多行 flow-style 顶层 `on` 对象写法已纳入解析**
   release 触发检查现在也可解析多行 flow-style 顶层 `on` 写法（例如首行 `on: {`，后续行继续声明事件映射），同时继续忽略嵌套非事件键。
24. **多行 flow-style 顶层 `on` 首行注释也可容忍**
   当多行 flow-style 顶层 `on` 首行带有尾随注释（例如 `on: { # ...`）时，release 触发检查也可保持稳定解析，同时继续保留嵌套非事件键防误报约束。
25. **`push.tags` 键行尾随注释不再掩盖 tag 列表触发**
   release 触发检查现在会把仅注释的 `tags:` 值（例如 `tags: # ...`）视作块列表声明，因此无论是顶层 `push` 还是序列 `push` 映射，都能继续从后续列表项稳定解析 `*.*.*` 触发。
26. **workflow-trigger 回退文案现在保持期望契约显式**
   当 release workflow 解析走回退路径时，检查清单文案现在会显式保留触发期望（期望 `tag push (*.*.*) + workflow_dispatch` 与 numeric-tag guard），而不再只给出“inspection incomplete”。
27. **混合 quoted-key 的 sequence/object 触发声明已被回归锁定**
   release 触发覆盖现在包含“单个 workflow 内同时混合 quoted key、序列映射项、内联对象项与嵌套非事件噪音”的场景，确保仅顶层触发事实会被提升为契约真值。
28. **`on:` 键行尾随注释不再抑制后续触发块解析**
   release 触发检查现在会将仅注释的 `on:` 值（例如 `on: # ...`）视为块声明，因此无论后续是顶层映射还是序列触发声明，都能继续解析 `push.tags` 与 `workflow_dispatch`。
29. **多行 flow-style `on` 数组现在可跨续行解析**
   release 触发检查现在会收集多行 flow-style `on` 数组声明（包括数组对象项）直到集合闭合，从而在紧凑多行数组格式下继续稳定解析顶层 `workflow_dispatch` 与 `push.tags` 触发事实。
30. **`push.tags` 多行 flow-style 数组现在可跨续行解析**
   release 触发检查现在会收集多行 flow-style `push.tags` 数组（覆盖顶层与序列 `push` 映射）直到集合闭合，在紧凑多行 flow 格式下继续稳定保持 numeric-tag 触发识别与 v 前缀守卫语义。

### 尚未进入实现层的边界

1. **真正的 heavy-runtime packaging isolation**
   仍未进入多入口资产落地，当前仍是单入口 `main.js` + inline `srcdoc`。
2. **更广泛的 Stage B 契约提升**
   release 与操作提升边界真值已进入 helper，且第一批更广泛的 selection/config/export 元数据约束也已纳入；更深层的 path/context 语义仍依赖后续真实 packaging-boundary 约束与 host-adapter 契约推进。

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

1. **风险：** helper 解析继续被 `esbuild.config` / `registry` 结构变化击穿
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

## 7. 2026-05-10 深度差异审计与具体落盘方案

### 7.1 主线证据检查点

当前 `main` 已形成连续的 release-trigger 解析防漂移提交链：

- `087cd1a`：把事件键检测收敛到顶层 `on`，防止嵌套非事件键误报。
- `605a282`：修复内联 push 嵌套 tags 误报。
- `5188ad3`：修复多行 push 嵌套 tags 误报。
- `63ad325`：修复多行 `push.tags` 嵌套列表误报。
- `b545f91`：支持 `on` 序列内联对象事件映射。
- `5b55fba`：支持内联 `on` 数组对象项事件映射。

这些切片始终约束在 `scripts/diagram-semantic-verification.js` + `src/tests/diagramSemanticVerificationScript.test.ts` + 进度文档，没有重开 operation 层契约（`diagram.generate`、`diagram.preview`、`provider.connection.test`）。

### 7.2 先前需求与代码真值深度映射

| 需求来源重点 | 当前代码证据 | 推进状态 | 剩余缺口 |
|---|---|---|---|
| PRD R1：不夸大运行时隔离 | `buildPackagingBoundaryChecklistLines()` + maintainer/release 文案明确仍是单入口 `main.js + inline srcdoc` | 已闭环且稳定 | 收敛层无缺口 |
| PRD R2：不重开 operation 表面 | 提交与改动文件范围仍限定在 helper/测试/文档 | 已闭环且稳定 | 当前轨道无缺口 |
| PRD R3/R5：耐久 helper + 防漂移测试 | trigger parser 已覆盖顶层/内联/序列/数组/对象变体，并具备嵌套非事件键误报防护 | 持续扩展且稳定 | 后续 parser 变更仍需先补样例 |
| PRD R4：文档与 helper 真值一致 | maintainer EN/ZH + progress EN/ZH 保持同一边界叙述 | 已闭环且稳定 | 继续保持同批文档同步 |
| Stage-B 契约提升目标 | helper 已可提取操作契约元数据并支持通配展开 | 部分完成 | 更深层 path/context 语义仍待推进 |
| Stage-C 打包目标 | 尚无多入口构建或独立重型运行时资产 | 按设计未启动 | 需先完成 Stage-B 契约 gate |

### 7.3 架构推进状态（分层）

1. **契约定义层：** 已成熟并可执行。
   semantic helper 已编码打包边界真值、release 契约真值、workflow trigger 契约真值、contract-promotion 边界真值。
2. **解析鲁棒层：** 已扩大并带表示层防护。
   trigger 解析可容忍紧凑 YAML 写法，同时拒绝此前造成误报的嵌套非事件键。
3. **契约提升治理层：** 进行中。
   元数据真值提取覆盖面已扩大，但更深层跨层提升约束（path/runtime coupling）尚未编码。
4. **运行时隔离实现层：** 按策略暂未触发。
   多入口或重型运行时独立资产仍不是当前代码现实，文档不得提前暗示完成。

### 7.4 下一轮具体落盘方案（已固化）

#### Stage B1：契约闭合（下一短周期，CI-safe）

1. 补充更多混合触发声明回归样例（同一 workflow 内混合 quoted key + sequence/object 组合）。
2. 补充 helper 输出断言，确保 workflow 解析 fallback 时 trigger 契约文案仍显式可读。
3. 持续把完整门禁作为每个切片的必需项（`build`、全量测试、audits、diff-check、`obsidian help`、`obsidian-cli help`）。

**出关条件：** 任意 trigger 表达形态漂移都必须先由失败测试暴露；EN/ZH 文档保持同批同步。

#### Stage B2：实现前契约准备（中周期）

1. 在 `esbuild.config.mjs` 维度固化多入口候选研究文档。
2. 在触发 runtime 打包改造前，先定义 `outfile -> outdir` 迁移的 release-helper 契约与回归策略。
3. 扩展 contract-promotion 边界检查，显式标注哪些 workflow/settings/export 叙述依赖 runtime-isolation 前置条件。

**出关条件：** Stage-C 仅可在上述契约“可写入、可测试、可文档化”后开启。

#### Stage C0：受控运行时边界起步（后续）

1. 引入最小可行多入口或独立 render-host 资产分离。
2. 同步更新 `audit:render-host` 与 semantic helper 文案，反映新的“被强制约束真值”。
3. 在同一批次完成三向对齐：实现 + 测试 + maintainer/progress EN/ZH 文档。

**出关条件：** release 与 maintainer 文案不得宣称任何超出构建产物与审计可证明范围的隔离能力。

### 7.5 工作区卫生与主线节奏纪律

- 在 Stage-B2 完成前，保持切片原子化、聚焦 parser/contract 抗漂移。
- 禁止把运行时边界实现与大范围重构混在同一批变更。
- 每次落盘后必须执行 clean 状态复核（`git status --short --branch`）。
