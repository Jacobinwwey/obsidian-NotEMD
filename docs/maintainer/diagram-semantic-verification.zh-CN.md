# Notemd 图表语义核验（维护者）

语言: [English](./diagram-semantic-verification.md) | **简体中文**

此文档定义图表相关改动的维护者本地语义核验层。它补充仓库内硬门，不替代它们。

模板辅助命令：

```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```

这个 helper 不依赖 secrets。它只会生成 Markdown 核验模板、vault 感知的 CLI 命令清单、显式的 packaging-boundary、render-host audit、render-host runtime-consumption、implementation-readiness、packaging-contract、contract-promotion-boundary 与 Stage-C gate 区块，以及各语义表面的证据区块；不会启动 Obsidian、不会读取本地凭据，也不会依赖仓库中跟踪的 vault 路径。
其中 packaging-boundary 首行现在会优先从 `esbuild.config.mjs` 解析当前主线的 build 真值；如果顶层配置只是把入口/输出委托给共享 bundle-config helper，则会自动回退到 `scripts/lib/esbuild-bundle-config.js`；若两者都无法解析，helper 才会输出显式占位提示，避免边界真值静默漂移。
如果已解析到 `entryPoints`，但无法确定 `outfile` 与 `outdir`，检查清单会额外生成一条“必须人工确认输出目标”的提示，再允许下结论。
如果输出目标已成功识别，清单会明确标记当前依据来自 `outfile` 还是 `outdir`，避免打包边界结论含糊。
如果同时识别到 `outfile` 和 `outdir`，清单会将其视为歧义状态，并要求先人工确认有效输出目标，再给出打包结论。
其中 packaging-boundary 区块也会把 `createRenderHostBundleBuildOptions()` 视为当前 `main` 上的 candidate-only 入口：除非 standalone render-host release assets、audit logic 与 docs 在同一批次一起前进，否则它不能被 production `esbuild.config.mjs` 路径消费。
其中 packaging-boundary 区块现在还会检查 `src/rendering/preview/renderHostRuntimeClient.ts`，把当前主线的 fail-closed 真值也显式化：在当前单入口主线上，`resolveBundledRenderHostRuntimeModuleSpecifier()` 只能暴露显式配置过的 module specifier，否则必须返回 `null`，不能默认合成 `render-host.mjs` 路径。
其中 render-host audit 区块会从 `scripts/audit-render-host-bundle.js` 读取当前 bundle markers、standalone-reference pattern 禁止规则与 standalone-output 禁止规则，把发布边界从“口头描述”变成可执行真值。这些 marker / output / reference 规则统一归 `scripts/lib/packaging-contract.js` 所有，而不是散落在脚本内部的临时正则副本里。
其中 runtime-consumption 区块会通过 `src/main.ts`、`src/ui/DiagramPreviewModal.ts`、`src/rendering/webview/page.ts` 与 `src/rendering/webview/renderFrame.ts` 保持 command entry → preview modal → iframe `srcdoc` → webview bridge 链路的当前真值显式化。
其中 implementation-readiness 区块会把当前主线真实 shipped packaging lane 与 release 证据边界固定下来，避免后续误把未落地拓扑当成当前能力。
其中 packaging-contract 区块会从 `scripts/release/publish-github-release.js` 同步 release 资产、release tag 规则、发布模式和 release notes 契约真值，并从 `.github/workflows/release.yml` 同步 release 触发、tag 防护、workflow-source 分支与 chronicle-target 分支契约真值，保证 Stage B 的契约定义与发布约束保持一致。release workflow 的 tag-trigger glob 与禁止的 `v` 前缀 glob 现在分别由 `scripts/lib/packaging-contract.js` 中的 `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB` 与 `RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS` 统一拥有；YAML 仍保留 bootstrap 字面量，因为 GitHub Actions 会在 checkout 仓库 JavaScript 之前解析 tag trigger，仓库内测试负责把这条字面量锁定到 shared contract。
其中 contract-promotion-boundary 区块会从 `src/operations/registry.ts` 读取 workflow/settings/export 邻近操作的当前元数据，确保能力提升结论仍绑定真实 `automationLevel` / `requiredContext` / `sideEffectClass`。
其中 Stage-C gate 区块用于明确阻断后续拓扑扩张，除非 packaging boundary、render-host audit、runtime-consumption、release contract 与 contract-promotion boundary 五层真值一起前进。

## 1. 何时必须使用本 Runbook

当改动触及以下任一范围时，必须执行本核验：

- `src/diagram/**`
- `src/mermaidProcessor.ts`
- `src/rendering/**`
- 会改变图表生成、预览、保存或导出行为的命令 wiring

如果改动仅限文档、静态文案或与图表无关的 provider 逻辑，则不需要执行本 runbook。

## 2. 仓库内 CI 已经证明什么

仓库级硬门只能证明构建完整性与部分自动化行为：

```bash
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
git diff --check
```

这些检查**不能**证明 Mermaid 产物在真实 Obsidian 会话中视觉上仍然正确，也不能证明 JSON Canvas / Vega-Lite 在桌面宿主中的端到端行为没有退化。

它们也**不等于**重型运行时已经被真正隔离为独立打包资产。`npm run audit:render-host` 当前只能证明一条已强制的发布事实：内联 `srcdoc` host 仍然自包含地随 `main.js` 一起发布，同时当前主线会通过共享 packaging contract 拒绝残留的 `render-host.mjs` 资产或引用。helper 的 packaging-boundary 区块会在此基础上再补一层显式 anti-drift 检查：当前单入口主线上的 latent runtime helper 不能悄悄重新引入默认 standalone runtime-module 路径。
它现在还会为 source/build split 增加第二层 anti-drift 检查：render-host bundle build helper 可以继续作为未来候选代码留在源码里，但当前 production build 与 release contract 必须继续把它的输出视为 non-shipped。

## 3. 环境规则

- 使用维护者自持的本地 vault，不依赖仓库中跟踪的固定 vault 路径。
- 如需实时 LLM 生成，使用仓库外部保存的维护者自持 API 凭据。
- 不要提交 secrets、vault 专属配置、包含私有笔记的截图，或临时 live test 文件。
- 环境检查优先使用稳定包装入口 `obsidian-cli`，但当需要验证真正的桌面命令表面时，应使用原生 `obsidian` CLI。

可用环境检查：

```bash
obsidian help
obsidian-cli help
obsidian vaults verbose
obsidian plugin id=notemd vault=<vault-name>
obsidian commands vault=<vault-name> filter=notemd
```

## Public CLI Surface Contract

当前 public-safe CLI slice 仍然保持刻意收敛。准确的命令 ID 只有：

- `notemd:export-provider-profiles-redacted`
- `notemd:export-cli-capability-manifest`
- `notemd:export-cli-invocation-contract`
- `notemd:export-cli-public-surface`

排除规则：

- `notemd:export-provider-profiles` 仍然不能进入 public-safe slice，因为它带有 `outputHandlingTags=contains-provider-credentials`
- 当前 public-safe slice 的说明以 `docs/maintainer/notemd-cli-capability-matrix.zh-CN.md` 为准，并与同一套 registry-backed capability / contract 元数据保持同步

## 4. 必测语义表面

对符合条件的改动，必须覆盖受影响的以下三类表面：

### Mermaid

至少验证一个会产出 Mermaid 的笔记。

检查项：

- 生成流程能完成，没有意外 fallback 失败
- 保存后的产物可以在 Obsidian 中打开
- 渲染图表在视觉上完整可用
- 如果预期会触发 Mermaid auto-fix，保存后的文件应体现修复结果

建议证据：

- 保存后的输出文件路径
- Mermaid 预览截图，或等效的视觉确认记录

### JSON Canvas

至少验证一个会产出 `.canvas` 的笔记。

检查项：

- 输出文件按预期扩展名创建成功
- Canvas 可在 Obsidian 中打开且无加载错误
- 节点/边存在，而不是空白或损坏图

建议证据：

- 保存后的 `.canvas` 文件路径
- 打开的 canvas 截图

### Vega-Lite

至少验证一个会产出 `vega-lite` 的笔记。

检查项：

- 保存产物包含预期的 fenced `vega-lite` block
- 预览可通过插件预览路径正常打开
- 图表实际渲染，而不是空白或 broken host 输出

建议证据：

- 保存文件路径
- 预览模态框或图表渲染截图

## 5. 最小核验流程

除非改动范围更窄，否则按以下顺序执行：

1. 先跑仓库内硬门。
   或先生成一份可直接填写的检查模板：
   ```bash
   npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
   ```
2. 在本地测试 vault 中 reload 插件。
3. 通过 CLI 确认插件可用与命令暴露状态。
4. 在真实 Obsidian 中实际走受影响的图表路径。
5. 保存每个受影响表面的证据。
6. 将结果记录到 PR 说明、release handoff 或维护者日志中。

helper 现在还会额外生成 packaging-boundary、render-host audit、render-host runtime-consumption、implementation-readiness、packaging-contract、contract-promotion-boundary 与 Stage-C gate 七个区块。只要改动触及 render-host、preview、workflow/settings 或更重的运行时行为，就不应跳过这些段落：它们会明确提醒当前打包模型、命令入口链路与 release / 操作契约约束必须一起保持同步。

## 6. 证据格式

至少记录以下内容：

- 使用的 vault 名称
- 插件版本 / 分支 / commit
- 受影响表面：Mermaid、JSON Canvas、Vega-Lite
- 使用的命令
- 产物文件路径
- 结果：pass/fail
- 截图路径，或说明已进行实时视觉检查

示例：

```text
Vault: test
Commit: <sha>
Surface: Vega-Lite
Command: notemd-preview-diagram
Artifact: Notes/Topic.md
Result: PASS
Evidence: screenshot saved locally at ~/tmp/notemd-vega-preview.png
```

## 7. 与发布流程文档的关系

本 runbook 需要与 `docs/maintainer/release-workflow.md` 配合使用。

- `release-workflow.md` 负责定义仓库内硬门与 CI 行为。
- 本 runbook 负责定义 renderer 相关改动所需的本地语义核验层。

如果一个改动触及图表语义，但没有任何语义核验证据，即使自动化检查全绿，也应视为发布准备不完整。
