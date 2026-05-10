# Notemd 主线稳定化下一批执行计划

> **给代理执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐步执行本计划。步骤继续使用复选框 `- [ ]` 语法跟踪。

**目标：** 将当前“仓库真相审计”转化为一批可执行的稳定化工作：收口图表命令表面、建立可持续的维护者本地语义核验 runbook，并明确重型渲染运行时的真实打包边界，同时不回退 legacy Mermaid 可用性。

**架构：** 这批工作是边界加固，不是 renderer 扩张。保持 `src/main.ts` 对现有发货命令的兼容编排，把命令表面逐步收敛到一个规范图表路径，把语义核验明确放在 CI 之外记录，并在构建系统真正落实之前，继续把重型预览运行时隔离状态视为显式未完成项。

**技术栈：** TypeScript、Obsidian Plugin API、Jest、npm scripts、GitHub Actions release workflow、Markdown 文档

---

## 问题界定

代码库现在已经具备真实的图表平台，但剩余风险主要是边界风险：

- 命令表面仍暴露 3 个部分重叠的图表入口
- 维护者验证预期仍把仓库硬门和历史一次性 live proof 混在一起
- 重型运行时打包仍更多停留在“意图表述”，而不是已发货的资产边界
- Drawnix 虽然已经研究清楚，但还没有被真正固化为执行层面的明确非目标

因此，这一批次应优先稳定已有能力，而不是继续扩展新引擎或新宿主集成。

## 与 Roadmap 的交叉印证

结合 `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md` 的中长期目标回看，本计划进一步收窄了真实的下一批范围：

- 需要继续“建设”的已经不是平台本身
- 当前真正的缺口是命令、验证、打包这三类边界成熟度
- 所有未来扩展工作都应显式后置于这些边界完成之后

因此，这份计划不是偏离 roadmap，而是 roadmap 在当前阶段的具体执行形态。

## 需求追踪

来源文档：

- `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.zh-CN.md`
- `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`
- `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md`
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

继承约束：

- 在收口命令表面时必须保留 legacy Mermaid 可用性
- 在打包边界真正落地前，不得把重型运行时隔离描述为已完成
- Drawnix 继续作为参考边界，而不是发货依赖或嵌入宿主
- `ref/` 与其他本地分析产物继续保持在发货范围之外

## 实施单元

### 任务 1：命令表面收口计划

**文件：**
- 修改：`src/main.ts`
- 修改：`src/ui/NotemdSidebarView.ts`
- 修改：`src/workflowButtons.ts`
- 修改：`src/ui/NotemdSettingTab.ts`
- 测试：`src/tests/sidebarDomButtonClicks.test.ts`
- 测试：`src/tests/sidebarButtonTriggerChains.test.ts`
- 测试：`src/tests/workflowButtons.test.ts`

- [x] **步骤 1：先写失败测试，定义稳定命令模型**
补齐覆盖 canonical command mapping、alias 行为，以及 sidebar/workflow ID 与插件 command ID 之间的预期关系。

- [x] **步骤 2：确认聚焦失败**
执行：
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts src/tests/workflowButtons.test.ts
```
预期：针对新的命令收口预期出现 FAIL。

- [x] **步骤 3：实现最小编排调整**
必要时保留旧 ID 作为兼容别名，但把用户可见标签和内部执行逐步统一到一个清晰的图表命令表面。

- [x] **步骤 4：重跑聚焦测试**
重新执行相同命令，确认新的命令表面契约通过。

- [x] **步骤 5：回查命令文档漂移**
更新仍把 3 个命令表述为长期独立入口的用户文案或维护者说明。

### 任务 2：维护者本地语义核验 Runbook

**文件：**
- 创建：`docs/maintainer/diagram-semantic-verification.md`
- 创建：`docs/maintainer/diagram-semantic-verification.zh-CN.md`
- 修改：`docs/maintainer/release-workflow.md`
- 修改：`docs/maintainer/release-workflow.zh-CN.md`
- 测试/验证：仅当措辞需要对齐时，再评估 `README.md`、`README_zh.md`

- [x] **步骤 1：定义受维护的语义核验范围**
明确当改动触及 `src/diagram/`、`src/mermaidProcessor.ts` 或 renderer 行为时，本地必须抽样验证 Mermaid、JSON Canvas 与 Vega-Lite。

- [x] **步骤 2：保持 runbook 无秘密依赖**
文档不得依赖已跟踪密钥、已提交 vault 路径或误提交的 live test 文件。它应描述维护者自持环境与证据采集方式，而不是自动化不安全的本地 secrets。

- [x] **步骤 3：定义证据标准**
明确什么算足够证据：输出文件检查、截图、保存产物，以及这些证据应如何记录到 release handoff 或 PR 上下文中。

- [x] **步骤 4：与发布流程交叉引用**
让 release workflow 文档明确区分“仓库内硬门”和“维护者本地语义核验”。

- [x] **步骤 5：检入可复用 helper**
新增一个无 secrets 的 `npm run verify:diagram-semantics` helper，用来生成 Markdown 检查模板、仓库硬门、vault 感知的 CLI 检查命令，以及 Mermaid / JSON Canvas / Vega-Lite 的证据区块；它不会启动 Obsidian，也不依赖仓库中跟踪的 vault 路径。

### 任务 3：运行时打包边界审计

**文件：**
- 修改：`esbuild.config.mjs`
- 修改：`scripts/audit-render-host-bundle.js`
- 测试：`src/tests/renderHostBundleAuditScript.test.ts`
- 测试：已有覆盖 render host 交付边界的打包测试
- 文档：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [x] **步骤 1：先写失败审计覆盖，定义下一层打包事实**
把下一步真正希望成立的打包事实写进测试，例如更明确的重型运行时资产所有权，或更严格的单 bundle 契约。

- [x] **步骤 2：确认失败**
在修改构建逻辑前，先运行聚焦的打包审计测试并确认失败。

- [x] **步骤 3：实现最小打包澄清或隔离步骤**
要么进一步加固当前单 bundle 契约，要么落地第一个真实多入口边界。不要让文档声称的隔离程度超过构建实际证明的程度。

- [x] **步骤 4：重跑审计与构建检查**
至少执行：
```bash
npm run build
npm test -- --runInBand src/tests/renderHostBundleAuditScript.test.ts
npm run audit:render-host
```

- [x] **步骤 5：同步更新路线图表述**
当前打包仍然是单入口，这一点现在已经在路线图和配套文档中明确写清：当前真正落地并被强制约束的边界，是由 `main.js` 自包含携带的 `srcdoc` host，而不是已发布的独立 render-host 资产包。

### 任务 4：把 Drawnix 边界固化为稳定非目标

**文件：**
- 修改：`docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- 修改：`docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`
- 修改：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- 修改：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [x] **步骤 1：保留代码支撑的结论**
保留已经核实的证据：Drawnix 导出模型、浏览器文件系统边界、浏览器持久化、app shell UI 复杂度，以及惰性加载的转换模块。

- [x] **步骤 2：把研究结论转化为范围控制**
明确文档层面的结论：Drawnix 不是下一批次工作，近期唯一合理的方向也只能是在命令/运行时稳定化之后，再做 adapter / data-boundary 级实验。

- [x] **步骤 3：避免宿主级范围蔓延**
删除或重写任何暗示“下一版可能整体嵌入宿主”的表述。

## 固定执行顺序

除非后续代码现实直接推翻该序列，否则这份计划应按以下顺序执行：

1. 任务 1：命令表面收口
2. 任务 2：维护者本地语义核验 runbook
3. 任务 3：运行时打包边界审计
4. 完成任务 1-3 后，才恢复 legacy prompt 或 MermaidProcessor 的收缩工作
5. 再之后，才重新打开 board-style export 或高级引擎探索

## 测试策略

本批次仓库内硬门：

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

聚焦回归表面：

- `src/tests/sidebarDomButtonClicks.test.ts`
- `src/tests/sidebarButtonTriggerChains.test.ts`
- `src/tests/workflowButtons.test.ts`
- `src/tests/renderHostBundleAuditScript.test.ts`

维护者本地语义核验仍是单独记录层，不替代 CI。

## 风险与控制

- **风险：** 命令收口误伤用户肌肉记忆或 workflow button 绑定。
  **控制：** 在必要处保留 alias 行为，并显式测试 sidebar/workflow 路由。

- **风险：** 文档再次跑在实现前面。
  **控制：** 代码或审计变更必须与计划、brainstorm、维护者文档同批更新。

- **风险：** 重型运行时打包边界被写得过于乐观。
  **控制：** 只记录构建产物和审计脚本真正能证明的边界。

- **风险：** Drawnix 范围蔓延，分散稳定化注意力。
  **控制：** 在任务 1-3 完成前，坚持把 Drawnix 仅视为参考边界。

## 退出标准

- 命令表面方向已写入测试，并反映到实际命令 wiring 中
- 维护者本地语义核验 runbook 已有英文和简体中文版本
- 运行时打包表述已与构建真实边界对齐
- Drawnix 被文档化为受约束的未来 adapter/export 参考，而不是近期宿主集成目标
- 最终分支通过完整仓库验证门

## 推进进度更新

这份执行计划现在已经不再只是前瞻性清单。计划中的这一批工作已按当前范围实质性落到 `main`：

- 任务 1 已按“保兼容收口”的目标落地：canonical `generate-diagram` / `preview-diagram` workflow/sidebar ID 已经生效，用户可见文案已收口，而旧的 `*-experimental-diagram` token 只作为兼容别名保留。
- 任务 2 已不再停留在纯 prose：仓库现在已提供 `npm run verify:diagram-semantics`，维护者 runbook 与 release workflow 文档也已对齐到同一条无 secrets 的核验路径。
- 任务 3 已以“真值收紧切片”形式落地，而不是真正多入口隔离：helper 模板与维护者文档现在都明确记录，`audit:render-host` 证明的是当前单入口 `main.js` + 内联 `srcdoc` 契约，而不是真正完成了 heavy-runtime isolation。
- 任务 4 已以范围控制方式落地：路线图和进度文档现已把 Drawnix 固定为受约束的未来 adapter/export 参考，而不是活跃的整体宿主集成目标。
- 支撑这一批的 release 侧 CI hardening 也已不再只是计划：`repo-saga` 编年史刷新现在已有检入的 package-manager runtime helper 与回归测试，因此在 GitHub Actions 里即使 `pnpm` 只能通过 `corepack` 一类 fallback 访问，也能继续重建上游 workspace。
- 后续防漂移硬化也已落地：semantic helper 的 packaging 清单会从 `esbuild.config.mjs` 自动提取入口/输出事实，对应测试已锁定该对齐关系；同时 package-manager fallback 现在会按执行失败逐候选重试（`pnpm`、`corepack pnpm`、`bun x pnpm`），以保持 CI 编年史刷新链路稳健。
- 语义 helper 的额外加固也已落地：打包输出目标状态已显式建模（`outfile` / `outdir` / `unknown` / `ambiguous`），解析覆盖已支持反引号字面量，且解析范围已优先收敛到 `esbuild.context({...})` 选项块，避免文件内同名 decoy 字段造成静默误判。
- Stage B 契约定义推进也已具备可执行形态：semantic helper 模板新增 `Packaging Contract` 区块，从 `scripts/release/publish-github-release.js` 同步 release 必需资产，并在维护者核验中显式保留双语 release notes 文件契约，同时记录数字 tag 与 create/upload 模式契约真值，并校验 `.github/workflows/release.yml` 的 tag-only 触发防护约束。
- Stage B 契约提升边界也已具备可执行形态：helper 模板新增 `Contract Promotion Boundary` 区块，从 `src/operations/registry.ts` 提取 workflow/settings/export 邻近操作的约束真值。
- Stage B 契约提升覆盖也在 CI 安全切片中继续扩展：helper 追踪范围新增 selection/config 邻近元数据（`editor.create-link-and-generate`、`file.process-*`、`concept.extract-*`），同时 registry 解析支持混合引号字面量并由回归测试锁定，降低操作真值提取脆弱性。
- Stage B 防漂移收敛继续推进：契约提升追踪现在会从实时 registry ID 自动展开前缀通配（`file.process-*`、`concept.extract-*`），并保留稳定回退 ID，在 registry 读取失败时仍保持 checklist 生成确定性，减少手工列表维护抖动。
- Stage B release-trigger 防护检查也继续加固：workflow `tags:` 条目解析现在支持混合引号样式，并显式把 `v*.*.*` 通配模式识别为契约违规，降低 YAML 格式变更导致的检测脆弱性。
- Stage B release-trigger 检查作用域也进一步收敛：tag 触发检测现在限定为 `on.push.tags`，避免工作流其他区块里的 `tags:` 字段产生错误契约信号。
- Stage B release-trigger 解析现在也支持紧凑内联 push 形式（`push: { tags: [...] }`），与多行 YAML 块写法一起保持契约检测稳定。
- Stage B release-trigger 解析现在也支持完全内联的顶层 `on` 对象写法（例如 `on: { push: { tags: [...] }, workflow_dispatch: {} }`），在紧凑 workflow 声明下仍可保持触发防护检测稳定。
- Stage B release-trigger 解析现在也可从 `on` 事件序列/内联数组写法识别 `workflow_dispatch`（例如 `on` 下使用 `- workflow_dispatch`，或 `on: [push, workflow_dispatch]`），降低事件声明风格改写带来的真值漂移。
- Stage B release-trigger 解析现在也支持 `on` 事件序列里的 push 映射写法（例如 `- push:` + 嵌套 `tags`），在替代事件列表 YAML 风格下保持 tag 触发契约检测稳定。
- Stage B release-trigger 解析现在也支持带引号的 YAML 键（用于事件声明与嵌套触发键，例如 `'push':`、`"tags":`、`'workflow_dispatch':`），降低仅因键名引号规范化改写带来的格式漂移风险。
- Stage B 回归覆盖现在也显式锁定带引号的顶层内联 `on` 对象声明（例如 `'on': { 'push': { "tags": [...] }, "workflow_dispatch": {} }`），确保紧凑带引号写法维持契约稳定。
- Stage B release-trigger 解析现在也支持 `on` 事件序列中的 workflow_dispatch 映射写法（例如 `- workflow_dispatch: {}` 与 `- 'workflow_dispatch': {}`），降低序列映射式事件声明带来的真值漂移风险。

因此，这份计划之后真正剩下的工作已经不再是“补第一版 runbook”或“补第一版 packaging 澄清”。这些基础片段现在已经检入。剩余工作是保持这套已检入真值不漂移，并进一步判断下一个真实实现批次应优先落在 heavy-runtime packaging isolation，还是后续更窄的 contract-promotion 切片。
