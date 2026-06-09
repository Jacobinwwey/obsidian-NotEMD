---
date: 2026-05-08
last_updated: 2026-06-06
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

### 2026-06-06 增量：render-host packaging contract 现在有了单一代码真值源

source/build/audit 边界上另一处 anti-drift 缺口现在也已经补齐：

1. `scripts/lib/packaging-contract.js` 现在定义了共享的 packaging contract 常量，覆盖：
   - 当前主 bundle 输出文件；
   - inline render-host 审计所要求的标记；
   - 当前单入口 lane 上禁止出现的 standalone render-host 输出文件；
   - 构建后 bundle 内禁止出现的 standalone render-host 引用正则。
2. `esbuild.config.mjs` 现在会复用这份共享 contract，在构建前清理 stale 的 standalone render-host 输出。
3. `scripts/audit-render-host-bundle.js` 现在也复用同一份共享 contract，不再自己维护第二套 render-host marker、standalone output filename 或 standalone reference regex 副本。
4. `scripts/diagram-semantic-verification.js` 在无法直接读取 audit script 时，也会回退到同一份共享 contract 常量，而不再保留第三套彼此分离的默认副本。
5. 定向回归测试现在已显式锁定这条 ownership 边界：
   - `src/tests/renderHostBundleAuditScript.test.ts` 会验证 audit helper 确实复用了共享 contract 常量，包括 reference regex；
   - `src/tests/diagramSemanticVerificationScript.test.ts` 会验证 helper 推导出的 audit facts 继续与这份共享 contract 对齐。

正确解释：

1. 当前发货 topology 没有变化；
2. 真正重要的变化是 ownership discipline：未来如果再改 render-host packaging boundary，常量真值不再散落在三处手工副本里，而是只有一个 canonical source。

### 2026-06-06 后续增量：semantic packaging facts 现在会跟着真实 bundle-config owner 走

这次 ownership 收口还顺带暴露并补齐了另一处真实 anti-drift 问题：

1. 当前 `esbuild.config.mjs` 已不再保留顶层字面量 `entryPoints` / `outfile`，而是把 build 真值委托给 `scripts/lib/esbuild-bundle-config.js`。
2. `scripts/diagram-semantic-verification.js` 现在已经反映这条架构真值，而不再假定所有字面量只会存在于 `esbuild.config.mjs`。
3. packaging facts 的推导现在采用两段式有界策略：
   - 如果 `esbuild.config.mjs` 里仍有字面量 entry/output 字段，就直接解析；
   - 如果顶层配置只是委托给共享 helper，就回退到 `scripts/lib/esbuild-bundle-config.js` 继续解析。
4. `src/tests/diagramSemanticVerificationScript.test.ts` 现在同时回归锁定当前仓库形态与 helper-fallback 形态，避免 semantic verifier 再次落后于真实 build owner。

正确解释：

1. 这批工作依旧没有拓宽 packaging topology；
2. 但它进一步收紧了 source/build/helper contract：semantic verifier 现在跟随真实 build owner，而不再依赖已经过时的文件形态假设。

### 2026-06-06 最终增量：release tag 与 release-notes 真值也已进入同一份 shared packaging contract

当前 packaging/release 边界上的另一处 anti-drift 缺口现在也已补齐：

1. `scripts/lib/packaging-contract.js` 现在还负责承载：
   - 数字版 release tag 的 regex source；
   - 规范的 release-notes 目录与中英文文件后缀；
   - 一个可按 tag 推导英文 / 简体中文 release-notes 路径的 helper。
2. `scripts/release/publish-github-release.js` 现在会从同一份 shared packaging contract 派生：
   - `OBSIDIAN_RELEASE_TAG_PATTERN`；
   - `<tag>.md` / `<tag>.zh-CN.md` 这两条 release notes 路径；
   而不再各自手写一份本地副本。
3. `scripts/diagram-semantic-verification.js` 现在也会使用同一份 shared release-tag pattern 与 release-notes path resolver，在 packaging-contract checklist 中输出 release 真值。
4. 定向回归测试现在已锁定这条 contract：
   - `src/tests/githubReleaseWorkflow.test.ts` 会验证 release helper 复用的是共享的 release-asset 与 release-tag contract；
   - `src/tests/diagramSemanticVerificationScript.test.ts` 会验证 semantic helper 推导出的 release-contract facts 与 release-notes checklist 文案继续和这份 shared contract 对齐。

正确解释：

1. 当前 release 行为没有变化；
2. 但 ownership model 更紧了：release assets、release tag 规则与 release-notes 路径真值现在会一起演进，不再在 helper、测试和文档之间各自漂移。

### 2026-06-06 Workflow 增量：CI tag 校验现在也复用已检入 helper 路径

当前 release-truth 上最后一处明显的重复定义现在也被移除了：

1. `.github/workflows/release.yml` 不再把一段 YAML 内联 shell regex 当成唯一的 release-tag 权威校验入口。
2. publish workflow 现在会先 checkout 仓库中的 workflow sources，再在 checkout release ref 之前执行 `node scripts/release/validate-release-tag.js "$TAG_NAME"`。
3. 这个 wrapper 会继续委托 `scripts/release/publish-github-release.js` 里的 `validateReleaseTag(...)`，而后者本身已经从 `scripts/lib/packaging-contract.js` 派生 regex 真值。
4. `src/tests/githubReleaseWorkflow.test.ts` 现在会同时锁定：
   - workflow 已改为调用 checked-in 的 tag-validation helper；
   - wrapper 自身对纯数字 tag 与 `v` 前缀 tag 的 pass/fail 行为。

正确解释：

1. 从维护者视角看，release 行为没有变化；
2. 但关键变化在于：CI 现在消费的是同一个 repo-owned tag-validation entrypoint，而不再在 YAML 里 shadow 一段本地 regex。

### 2026-06-06 Branch-Target 增量：workflow source 与 chronicle target 现在共享 release contract 真值

下一个 release/chronicle anti-drift 缺口现在也已补齐，而且没有改变发货拓扑：

1. `scripts/lib/packaging-contract.js` 现在同时拥有：
   - `RELEASE_WORKFLOW_SOURCE_BRANCH`；
   - `RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH`。
2. `.github/workflows/release.yml` 现在通过显式 workflow env 名表达这两个分支角色：
   - `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH`；
   - `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH`。
3. `scripts/release/commit-chronicle-refresh.js` 现在从 shared contract 派生默认 push 目标，并支持 `--target-branch` 供显式修复流程使用。
4. `scripts/diagram-semantic-verification.js` 现在会按配置化分支契约验证 workflow-source checkout 与 chronicle refresh 链路，而不是在 helper 内部继续硬编码 `main` 检查。
5. 回归覆盖现在锁定了这条边界：
   - `src/tests/githubReleaseWorkflow.test.ts` 检查 workflow env contract 与 target-branch handoff；
   - `src/tests/commitChronicleRefreshScript.test.ts` 检查 chronicle helper 的 shared 默认值与显式 override 解析；
   - `src/tests/diagramSemanticVerificationScript.test.ts` 检查 semantic helper 的 configured-branch facts 与文档引用。

正确解释：

1. 当前 release 行为仍然以 `main` 为目标；
2. 真正变化的是 ownership：workflow-source 与 chronicle-target 分支真值现在会跟 release assets、tag 与 notes 真值一起演进；
3. GitHub Actions 在首次 checkout 前仍需要 bootstrap env 值，因此 workflow 不可能在那一步直接 import 仓库 JS；防止 YAML-local 漂移的是仓库内 contract 与测试。

### 2026-06-06 Trigger-Glob 增量：release workflow 的 tag trigger 现在也由 contract 支撑

上一轮 branch-target 收口之后，release workflow 里仍留着一个小但真实的重复定义：YAML trigger list 还在独自拥有 tag wildcard 字面量。

这次以有界方式补齐了这处缺口：

1. `scripts/lib/packaging-contract.js` 现在拥有：
   - `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB`；
   - `RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS`。
2. `.github/workflows/release.yml` 仍保留 `*.*.*` 字面量，因为 GitHub Actions 必须在 checkout 仓库 JavaScript 之前解析 event triggers。
3. `scripts/diagram-semantic-verification.js` 现在从 shared contract 推导 workflow trigger facts，并能识别 `v*.*.*` / `V*.*.*` 这类被禁止的 trigger 漂移。
4. 回归覆盖现在同时锁住两条路径：
   - `src/tests/githubReleaseWorkflow.test.ts` 验证 workflow bootstrap 字面量与 shared contract 一致，且不包含被禁止的 trigger glob；
   - `src/tests/diagramSemanticVerificationScript.test.ts` 验证 helper 输出、fallback facts 与 drift fixture 都继续对齐同一份 contract。
5. 维护者文档现在明确区分 trigger-start 行为与 release 准入：
   - wildcard 只决定 release workflow 是否启动；
   - 已检入的 tag validator 仍是真正的纯数字 `x.x.x` 准入点。

正确解释：

1. 当前 release 行为没有变化；
2. 这次补齐的是 ownership 缺口，并没有假装 GitHub Actions YAML 能在 checkout 前动态 import 仓库 JavaScript；
3. release workflow trigger、tag validation、release notes、release assets、workflow-source branch 与 chronicle-target branch 现在都处在同一条 repo-side anti-drift contract 下。

### 2026-06-06 Production-Build 增量：render-host build helper 继续保持 candidate-only

下一处 source/build 歧义现在也已经通过代码、helper 输出与文档锁住：

1. `src/tests/esbuildBundleConfig.test.ts` 现在证明 production `esbuild.config.mjs` 路径只消费 `createMainBundleBuildOptions()`，不消费 `createRenderHostBundleBuildOptions()`。
2. 同一个测试还会验证 candidate render-host 输出文件继续列在 `RENDER_HOST_STANDALONE_OUTPUT_FILES` 中，并且不在 `REQUIRED_RELEASE_ASSET_FILES` 中。
3. `scripts/diagram-semantic-verification.js` 现在会生成一条 packaging-boundary 检查项，要求 `createRenderHostBundleBuildOptions()` 保持 candidate-only；除非 standalone render-host release assets、audit logic 与 docs 同批前进，否则不能把它写成当前发货路径。
4. maintainer semantic-verification 与 release-workflow 文档现在也明确写出这条 helper 分层，避免后续仅因为源码里存在候选 helper，就误判当前已经发货 standalone runtime。

正确解释：

1. 当前发货 topology 仍未改变：`main.js` + inline `srcdoc`；
2. 这次真正收紧的是：source-only render-host build helper 的候选状态现在已经是可执行 contract，而不再只是路线图文案；
3. 如果未来要提升 `render-host.mjs`，必须同批修改 production build、release assets、audit rules 与 docs。

### 2026-06-09 Helper-Entrypoint 增量：真实 semantic-verification CLI 行为现在也有 process-level 证明

helper 契约现在又往上补了一层，不再只依赖模块内部函数测试：

1. `src/tests/diagramSemanticVerificationScript.test.ts` 现在会直接执行真实的 `node scripts/diagram-semantic-verification.js ...` 入口，而不只是 import helper 函数。
2. 这层 process-level 覆盖现在会证明三条面向维护者的真实行为：
   - 省略 `--output` 时，stdout 模式仍会输出完整检查清单；
   - `--output <path>` 仍会把渲染后的检查清单写到目标文件，并保持请求的 surface 过滤；
   - 不受支持的 `--surface` 值仍会以非零退出码快速失败，而不是静默输出误导性的残缺模板。
3. maintainer runbook 现在也明确写出：stdout 模式适合快速审阅，而显式文件输出仍是耐久交接路径。

正确解释：

1. 这次仍然没有扩大 packaging topology；
2. 但它又关闭了一处漂移缝隙：现在被证明的是已检入 helper 的真实 CLI 行为，而不只是其内部格式化函数。

### 2026-06-09 Release-Helper Entrypoint 增量：release helper 与 tag validator 现在也有 process-level 证明

release 这条线现在也在模块内部测试之外补上了同类型的入口级证明：

1. `src/tests/githubReleaseWorkflow.test.ts` 现在会直接执行真实的已检入脚本入口：
   - `node scripts/release/validate-release-tag.js`
   - `node scripts/release/publish-github-release.js <tag> --dry-run`
2. 这层 process-level 覆盖现在会证明：
   - 纯数字 tag 会通过，而 `v` 前缀 tag 与缺失 tag 会通过真实 wrapper 入口快速失败；
   - release dry-run 在组合命令前仍会校验必需资产与已检入的双语 release notes；
   - helper 仍会根据 `gh release view` 的结果选择正确的 create / repair 命令形态；
   - dry-run 结束后仍会清理临时组合出的 release-notes 文件。
3. maintainer release 文档现在也明确把 `--dry-run` 写成已检入的无网络证明路径，而不再把它留作隐含 helper 功能。

正确解释：

1. 当前 release 行为仍然没有变化；
2. 真正收紧的是：现在被更强地证明的是已检入 release helper 的真实 CLI 行为，而不只是其内部 command planner。

### 2026-06-09 Chronicle-Helper Entrypoint 增量：chronicle refresh helper 现在也有 process-level 证明

相邻的 release-follow-through helper 现在也补上了同类缺口：

1. `src/tests/commitChronicleRefreshScript.test.ts` 现在会通过 `PATH` 上的 fake `git` 直接执行真实的 `node scripts/release/commit-chronicle-refresh.js ...` 入口。
2. 这层 process-level 覆盖现在会证明：
   - clean no-op 时会输出 `Chronicle already up to date.`；
   - 显式 `--target-branch` override 会真正进入已检入的 push 路径；
   - 缺失 `--target-branch` 的值时，会在调用 `git` 前快速失败；
   - git status 失败会继续沿已检入的 `createGitCommandError(...)` 格式透传，而不是退化成模糊脚本错误。
3. maintainer release 文档现在也明确记录：被回归锁定的是这条已检入 chronicle helper 的真实入口，而不只是它的模块级重试逻辑。

正确解释：

1. 当前 release / chronicle 行为仍然没有变化；
2. 真正收紧的是：现在被更强地证明的是已检入 chronicle helper 的真实 CLI 行为，而不只是其内部 retry 逻辑。

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
