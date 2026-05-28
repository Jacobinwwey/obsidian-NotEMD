---
date: 2026-05-08
last_updated: 2026-05-24
topic: packaging-semantic-convergence-progress-and-next-steps
---

# Packaging / Semantic Convergence 进展深度对比与下一步落地方案

## 1. 范围与基线

在 2026-05-24 远端 `main` 被强制改写之后，这份文档新增了一个必须承担的职责：

1. 描述 **当前 `origin/main` 真正发货的边界**；
2. 防止先前晚于当前主线的分支进展被继续误写成“当前主线已落地”；
3. 继续把 packaging / semantic-verification 轨道维持为当前最关键的架构主线。

主要对比来源：

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.*`
4. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`
5. 当前 `origin/main` 上的真实代码
6. 仅用于审计参考的本地备份分支 `backup/main-before-origin-force-20260524`

工作规则：

- **当前发货真值** 只能来自重写后的 `origin/main`。
- **备份分支真值** 只用于后续 reintegration 规划，不能再直接写成“当前主线已发货”。

## 2. 以当前 `origin/main` 为准的需求映射

### PRD R1-R6 映射

| 需求 | 当前重写后 `main` 上的证据 | 状态 | 说明 |
|---|---|---|---|
| R1 保持真实架构边界，不夸大隔离程度 | `esbuild.config.mjs`、`scripts/audit-render-host-bundle.js`、`docs/maintainer/release-workflow*.md`、`docs/maintainer/diagram-semantic-verification*.md` | 已满足 | 当前真值仍是单入口 `main.js` + 内联 `srcdoc`，不是已发货的独立运行时资产 |
| R2 本轨道不重开 `diagram.generate` / `diagram.preview` / `provider.connection.test` 契约深度 | 当前语义改动仍限定在 helper/docs/tests，operation 表面保持独立 | 已满足 | packaging 轨道仍是契约与边界真值工作，不是 operation 语义重构 |
| R3 维持可复用的 packaging-boundary 检查清单 | `scripts/diagram-semantic-verification.js` | 已满足 | helper 仍从真实构建配置与 release workflow 推导 packaging 真值 |
| R4 保持 release / semantic 文档一致 | `docs/maintainer/diagram-semantic-verification*.md`、`docs/maintainer/release-workflow*.md` | 已满足 | 当前维护者文档对单入口 `srcdoc` 边界描述一致 |
| R5 增加防漂移回归覆盖 | `src/tests/diagramSemanticVerificationScript.test.ts`、`src/tests/renderHostBundleAuditScript.test.ts`、`src/tests/iframeRenderHost.test.ts` | 已满足 | 当前回归测试仍锁定 helper 解析与 inline render-host 消费真值 |
| R6 保持 host/CLI 结论诚实 | helper/docs 仍要求真实执行 `obsidian help` 与 `obsidian-cli help`，而不是推断成功 | 已满足 | 未在没有实测证据时扩大 desktop-session 结论 |

### Acceptance Criteria 映射

| 验收项 | 证据 | 状态 |
|---|---|---|
| 模板包含显式 packaging-boundary 区块并描述当前真值 | `npm run verify:diagram-semantics` | 已满足 |
| maintainer 文档与模板真值一致 | `docs/maintainer/*` 文案 | 已满足 |
| 测试锁住 helper/docs/runtime-consumption 形态 | 定向 semantic + render-host 测试 | 已满足 |
| 不引入 command/operation 语义漂移 | 当前 diff 范围 + operation 文件未被本轨道重开 | 已满足 |

## 3. 2026-05-24 校正：当前主线到底在发什么

### 3.1 当前代码真值

当前 `origin/main` 真正发货的是：

1. `esbuild.config.mjs` 中的单入口 `entryPoints: ["src/main.ts"]` 与 `outfile: "main.js"`；
2. `IframeRenderHost` 生成的自包含 `htmlSrcdoc` 预览负载；
3. `scripts/audit-render-host-bundle.js` 对构建后 `main.js` 中 inline render-host 标记的审计；
4. maintainer 文档中明确写出的结论：`audit:render-host` 只能证明自包含的 `main.js + inline srcdoc` 契约。

### 3.2 哪些内容不能再被写成“当前主线已落地”

以下内容现在必须被降级为 **备份分支证据**，而不是当前 `main` 真值：

1. 已发货的 `main.js + render-host.mjs` 双资产运行时通道；
2. 任何“当前主线已经进入 Stage-C dedicated runtime asset lane”的表述；
3. 任何假定当前 release 资产或当前构建输出中包含 `render-host.mjs` 的进度文案。

### 3.3 为什么这次校正必须做

如果继续沿用先前更晚分支上的描述，文档会直接误导后续推进：

1. 维护者会误以为 packaging topology 已经比实际代码更成熟；
2. 后续 reintegration 工作可能跳过本应重新验证的契约门禁；
3. release 验证会逐步停止审视当前真正的单入口边界。

## 4. 相对先前方案的深度对比

### 4.1 当前 `main` 上真正仍然成立的部分

1. semantic helper 仍然是有效的 anti-drift 控制面；
2. packaging-boundary 文案仍然显式且边界真实；
3. inline render-host 路径仍然被代码与测试锁定；
4. 下一条架构关键路径仍然是 packaging/runtime topology，而不是再做泛化 UI 摇摆。

### 4.2 没有保留在当前 `main` 上的部分

相较于本地备份分支：

1. 更晚的 dedicated runtime-asset 通道没有保留下来；
2. 更晚的 unified follow-through 进度文档没有保留下来；
3. 更晚的 maintainer-bridge help-truth 收口没有保留下来；
4. 因此，更晚的 Stage-C 进展文案现在只能作为 reintegration 输入，不能继续充当当前主线证据。

### 4.3 当前正确解释

对重写后的 `main`，应统一理解为：

1. 当前 live 轨道仍是 Stage-B packaging / semantic convergence；
2. 当前 runtime 真值比后来的备份分支更窄；
3. 未来任何拓宽都必须重新在当前主线上补齐代码、测试、审计与文档证明。

## 5. 下一阶段具体落盘方案

### Priority 0：先把“当前主线真值”重新对齐

1. 保持本文件、maintainer 文档与新的统一推进矩阵都对齐到当前单入口 `srcdoc` 真值。
2. 不要再把备份分支文案原样拿来当当前主线结论。
3. 每次 packaging 文案变化，都同步检查 `change.md` 与所有当前进度文档。

### Priority 0.5：补齐 clean-state 守护

1. 忽略本地 vault/runtime 生成物，避免每次本机 Obsidian 验证后都把仓库弄脏。
2. 保持发布级验证收尾必须看到真正 clean 的 `git status --short --branch`。

### Priority 1：继续做有界 packaging 跟进

1. 在当前 `main` 上继续维持 helper/parser/test/doc 的一致性。
2. 只有当 build graph、release assets 与 runtime-consumption 路径同批变动时，才允许拓宽 packaging topology。
3. 如果未来再次引入 `render-host.mjs`，必须把它当成“当前主线上的新实现切片”重新落地，而不是视为旧结论天然有效。
4. 在当前单入口主线上，latent runtime helper 必须保持 fail-closed：除非 dedicated asset 被显式配置且同批真实发货，否则不要在 helper 代码里默认合成 `render-host.mjs` 运行时路径。

### 2026-05-28 增量：helper 现已显式覆盖 fail-closed 的 latent runtime helper 真值

这条当前主线上的 anti-drift 缺口现已在代码、测试与维护文档中补齐：

1. `src/rendering/preview/renderHostRuntimeClient.ts` 不再默认合成任何 standalone runtime URL/path；它只会返回显式配置的 module specifier，否则返回 `null`。
2. `scripts/diagram-semantic-verification.js` 现在会直接读取 `src/rendering/preview/renderHostRuntimeClient.ts`，并在 packaging-boundary 检查清单中把这条 fail-closed 真值变成可执行检查项。
3. `src/tests/diagramSemanticVerificationScript.test.ts` 现在同时回归锁定：
   - 当前仓库真值（未显式配置时 `resolveBundledRenderHostRuntimeModuleSpecifier()` 返回 `null`）；
   - helper 源文件无法读取时的 fallback 文案。
4. 维护者 runbook 现已把这条新增真值源写清，确保 release/semantic verification 不再只停留在 build-output + audit 真值层面。

### Priority 2：把备份分支的 Stage-C 工作视为 reintegration 候选

以下切片未来仍可能值得回灌，但都必须在当前 `main` 上重新证明：

1. dedicated runtime asset 跟进；
2. maintainer-bridge help-truth 收口；
3. 任何依赖后续 packaging 通道的更广 CLI/public-surface 加固。

## 6. 风险与控制

1. **风险：** 文档又回到更晚分支的措辞。
   **控制：** 每条“已落地”的 packaging 结论都必须绑定当前 `esbuild.config.mjs`、当前 maintainer 文档与当前测试。
2. **风险：** 后续 reintegration 误以为缺失代码仍在当前主线。
   **控制：** 在每一份路线图/进度文档里持续区分“当前 `main` 真值”与“备份分支证据”。
3. **风险：** 本地验证持续污染工作区，掩盖真实 diff。
   **控制：** 持续忽略本地 vault/runtime 生成物，并在批次末尾验证 clean status。

## 7. 结论

当前被重写后的 `main` 仍然处于一个有效且可验证的 packaging / semantic-verification 状态，但它 **比后来的备份分支更窄**：

1. live 发货边界仍是单入口 `main.js` + inline `srcdoc`；
2. semantic/helper/doc 的 anti-drift 控制面仍然真实存在；
3. 下一步最有意义的架构推进仍然是 packaging-boundary follow-through，只是这次必须在 force rewrite 之后更严格地区分当前主线真值。
