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

- [ ] **步骤 1：先写失败测试，定义稳定命令模型**
补齐覆盖 canonical command mapping、alias 行为，以及 sidebar/workflow ID 与插件 command ID 之间的预期关系。

- [ ] **步骤 2：确认聚焦失败**
执行：
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts src/tests/workflowButtons.test.ts
```
预期：针对新的命令收口预期出现 FAIL。

- [ ] **步骤 3：实现最小编排调整**
必要时保留旧 ID 作为兼容别名，但把用户可见标签和内部执行逐步统一到一个清晰的图表命令表面。

- [ ] **步骤 4：重跑聚焦测试**
重新执行相同命令，确认新的命令表面契约通过。

- [ ] **步骤 5：回查命令文档漂移**
更新仍把 3 个命令表述为长期独立入口的用户文案或维护者说明。

### 任务 2：维护者本地语义核验 Runbook

**文件：**
- 创建：`docs/maintainer/diagram-semantic-verification.md`
- 创建：`docs/maintainer/diagram-semantic-verification.zh-CN.md`
- 修改：`docs/maintainer/release-workflow.md`
- 修改：`docs/maintainer/release-workflow.zh-CN.md`
- 测试/验证：仅当措辞需要对齐时，再评估 `README.md`、`README_zh.md`

- [ ] **步骤 1：定义受维护的语义核验范围**
明确当改动触及 `src/diagram/`、`src/mermaidProcessor.ts` 或 renderer 行为时，本地必须抽样验证 Mermaid、JSON Canvas 与 Vega-Lite。

- [ ] **步骤 2：保持 runbook 无秘密依赖**
文档不得依赖已跟踪密钥、已提交 vault 路径或误提交的 live test 文件。它应描述维护者自持环境与证据采集方式，而不是自动化不安全的本地 secrets。

- [ ] **步骤 3：定义证据标准**
明确什么算足够证据：输出文件检查、截图、保存产物，以及这些证据应如何记录到 release handoff 或 PR 上下文中。

- [ ] **步骤 4：与发布流程交叉引用**
让 release workflow 文档明确区分“仓库内硬门”和“维护者本地语义核验”。

### 任务 3：运行时打包边界审计

**文件：**
- 修改：`esbuild.config.mjs`
- 修改：`scripts/audit-render-host-bundle.js`
- 测试：`src/tests/renderHostBundleAuditScript.test.ts`
- 测试：已有覆盖 render host 交付边界的打包测试
- 文档：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [ ] **步骤 1：先写失败审计覆盖，定义下一层打包事实**
把下一步真正希望成立的打包事实写进测试，例如更明确的重型运行时资产所有权，或更严格的单 bundle 契约。

- [ ] **步骤 2：确认失败**
在修改构建逻辑前，先运行聚焦的打包审计测试并确认失败。

- [ ] **步骤 3：实现最小打包澄清或隔离步骤**
要么进一步加固当前单 bundle 契约，要么落地第一个真实多入口边界。不要让文档声称的隔离程度超过构建实际证明的程度。

- [ ] **步骤 4：重跑审计与构建检查**
至少执行：
```bash
npm run build
npm test -- --runInBand src/tests/renderHostBundleAuditScript.test.ts
npm run audit:render-host
```

- [ ] **步骤 5：同步更新路线图表述**
如果打包仍是单入口，就明确写清；如果第一个隔离边界已经真实存在，就写出具体的资产边界。

### 任务 4：把 Drawnix 边界固化为稳定非目标

**文件：**
- 修改：`docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- 修改：`docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`
- 修改：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- 修改：`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [ ] **步骤 1：保留代码支撑的结论**
保留已经核实的证据：Drawnix 导出模型、浏览器文件系统边界、浏览器持久化、app shell UI 复杂度，以及惰性加载的转换模块。

- [ ] **步骤 2：把研究结论转化为范围控制**
明确文档层面的结论：Drawnix 不是下一批次工作，近期唯一合理的方向也只能是在命令/运行时稳定化之后，再做 adapter / data-boundary 级实验。

- [ ] **步骤 3：避免宿主级范围蔓延**
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
