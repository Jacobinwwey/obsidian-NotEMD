---
date: 2026-05-04
topic: progress-audit-next-direction
---

# 进展审计与后续方向 (v1.8.3+)

## 当前状态：代码 vs 方案要求

参考文档：
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md`
- `docs/brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.zh-CN.md`
- `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.zh-CN.md`
- `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`

## 仓库事实校正（2026-05-04）

这次审计重点不是重新设计 diagram platform，而是把“代码真实状态、远端 workflow、进度文档、外部参考项目结论”重新对齐。以下几项必须明确写清：

1. **远端 `main` 当前没有常规 push/PR CI。**
   `.github/workflows/release.yml` 只在数字 `x.x.x` tag push 或 `workflow_dispatch` 时运行。截至 `2026-05-04`，`main` 指向 `dd77126`（`fix(diagram): land command surface and verification runbook`），该分支本身仍没有普通 push/PR workflow。最近的红灯来自 `1.8.3` 发布流，随后已被 `2026-05-03` 的 `1.8.4` 成功 release run（`25274341984`）覆盖。

2. **`main` 上的 commit-status `pending` 不是一个真实失败检查。**
   截至 `2026-05-04`，`commits/main/status` 仍返回 `state: pending` 且 `statuses: []`，同时 `main` 没有 branch protection，也没有普通分支级 required checks。这个模式在 `main@dd77126` 上也继续成立：零 status、零 check suite 并不等于“主分支有真实失败流水线”。对这个仓库来说，当 release-driven checks 存在时，GitHub Actions runs 才是远端 CI 真值源，单独看 commit-status API 会误判。

3. **release workflow 在最新成功 run 后仍带有未来失效风险。**
   更早那次成功的 `1.8.3` 修复 run（`25215799596`）仍携带 GitHub 官方的 Node 20 JavaScript-action 弃用告警，指向 `actions/checkout@v4` 与 `actions/setup-node@v4`。当前 `.github/workflows/release.yml` 已固定为 `actions/checkout@v6` 与 `actions/setup-node@v6`，而新的 `1.8.4` release run（`25274341984`）已在这条加固后的路径上成功完成。

4. **“8 种图表意图实时验证”目前不是仓库内受控门槛。**
   相关 live test 文件（如 `src/tests/liveAllDiagramIntents.test.ts`）已在 `92d3ad3` 以“accidentally committed live test files”名义移出主线。2026-05-02 的 DeepSeek 实时验证应视为一次本地历史证据，而不是当前仓库能持续执行、CI 能强制覆盖的门槛。

5. **运行时支持 8 种意图，不等于 UI 首选项全部暴露。**
   `SUPPORTED_DIAGRAM_INTENTS` 仍覆盖 `mindmap / flowchart / sequence / classDiagram / erDiagram / stateDiagram / canvasMap / dataChart`，但设置页与侧边栏当前只暴露 `auto + flowchart + sequence + classDiagram + erDiagram + stateDiagram + dataChart`。`mindmap` 与 `canvasMap` 仍属运行时能力，不是当前 UI 首选图表选择器的一部分。

6. **命令编排“部分统一”，不是“完全统一”。**
   `generateExperimentalDiagramCommand` 与 legacy Mermaid 保存命令仍经过共享 `generateDiagramCommand` 编排，但 `previewExperimentalDiagramCommand` 现在直接读取当前 Markdown 中的 `vega-lite` 围栏并本地预览，不再走共享 LLM 生成路径。这是为了匹配当前 `dataChart` 产物以 Markdown fenced block 保存的现实，而不是最终命令收口形态。

## 路线图任务状态

| 任务 | 方案目标 | 当前实际 | 差距 |
|---|---|---|---|
| 任务 0 | 构建与打包底座 | 已交付（有限制）。`srcdoc` 宿主在 `main.js` 中，`audit:render-host` 烟雾门已存在。 | 真正的多入口 / 重型运行时隔离尚未开始。 |
| 任务 1 | 图表领域模型 | 已交付。`DiagramIntent`、`DiagramSpec`、验证器、规划器已进入主线。 | 无。 |
| 任务 2 | 规格优先管道 | 部分完成。共享执行器已存在，但公共命令表面仍保留 3 个 ID，preview 路径也已针对 `vega-lite` fenced artifact 做局部分叉。`promptUtils.ts` 旧版 Mermaid 提示仍在。 | 命令收口 + 旧提示退役；且必须保留原 Mermaid 场景可用性。 |
| 任务 3 | Mermaid 适配器 V2 | 部分完成。6 个 Mermaid 子类型 adapter 已落地，`legacyFixerUtils.ts` 已抽出一部分职责。 | `mermaidProcessor.ts` 仍过重；每个拆分子任务都需要真实 Obsidian 图像核验。 |
| 任务 4 | 渲染平台 | 已交付。registry / service / cache / preview modal / inline + iframe host 已落地。 | 无。 |
| 任务 5 | JSON Canvas | 已交付。`.canvas` 产物、基础 layout、保存与预览链路已可用。 | 无。 |
| 任务 6 | Vega-Lite | 已交付（有限制）。`dataChart` 使用 iframe-host 预览，保存产物为 Markdown fenced `vega-lite`。 | 仍依赖单入口主 bundle bridge；重型运行时未独立打包。 |
| 任务 7 | 主题 / 导出 / release | 已交付，并已补当前加固。主题、SVG/PNG/source 导出、release 资产约束与 workflow action pin 已存在。 | 没有重大产品差距，但普通 `main` CI 仍是刻意缺失状态。 |
| 任务 8 | 高级引擎 | 按设计推迟（R10）。 | 评估门未满足。 |

## Roadmap 长周期交叉印证

如果把 `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md` 视为一份中长期路线图来读，当前剩余工作已经清晰分成三层：

1. **平台底座已交付**
   `DiagramSpec`、renderer registry/service、Mermaid 子类型 adapters、JSON Canvas、Vega-Lite 预览、theme/export 对齐，以及 release 加固，都不再是“未来目标”，而是主线现实。它们应被视为已完成底座，而不是待建能力。

2. **仍待完成的边界加固**
   路线图里真正还活着的技术债，现在集中在命令表面 canonical 化、维护者本地语义核验、以及重型运行时的真实打包隔离。这三类问题仍然阻碍“平台成熟度”，但已经不再阻碍“平台是否存在”。

3. **更长期的可选扩展**
   服务层拆分、更完整的 board-style export、以及高级引擎探索，仍然是有效方向，但它们已经后置于上述稳定化工作，不应再与当前批次争夺优先级。

这意味着，这份路线图不应再被解读为“继续建设平台”，而应被解读为“先把平台硬化完成，再决定要不要向外扩展”。

## notebook-navigator 交叉参考完成情况

| # | 模式 | 状态 | 说明 |
|---|---|---|---|
| 1 | 服务层 + DI | 延期 | 属于架构重构，不阻塞当前交付 |
| 2 | LLM 响应缓存 | ✓ | 已落地到 `src/llmUtils.ts` |
| 3 | 逐项设置同步开关 | ✓ | 已有 `localOnly` 隔离 |
| 4 | 批量管道含中断恢复 | ✓ | `src/batchProgressStore.ts` 已落地 |
| 5 | 架构总览文档 | ✓ | `docs/architecture.md` 与 `docs/architecture.zh-CN.md` |

## v1.8.3+ 已落地主能力

| 功能 | 状态 | 备注 |
|---|---|---|
| 欢迎弹窗（首次安装） | ✓ | 22 种语言 |
| 赞助方支持（GitHub Star + ko-fi） | ✓ | 设置页 + 欢迎弹窗 + README |
| Cline 对齐令牌解析 | ✓ | 未知模型默认 8192 改为 provider 决策 |
| 图表边缘字段规范化 | ✓ | `source/target/sourceId/targetId/start/end -> from/to` |
| 首选图表类型选择器 | 部分完成 | 当前 UI 暴露子集，不等于全部运行时意图 |
| README i18n 对齐合约测试 | ✓ | 仓库内稳定门槛 |
| 8 意图实时 API 验证 | 仅本地历史证据 | 当前不属于仓库内可持续执行门槛 |

## 架构推进现状

**LLM 层：**
- 响应缓存已落地，可减少重复 API 成本。
- 未知模型输出 token 决策已与 Cline 对齐。
- 提供商配置支持本地隔离，不强制所有敏感配置参与同步。

**图表平台：**
- 运行时仍支持 8 种图表意图。
- `DiagramSpec -> adapter -> renderer` 的主链已经成立，核心扩展点不再绑死在 Mermaid 文本。
- `dataChart` 已经不再只是“保存 JSON”，而是保存为 Markdown fenced `vega-lite` 并支持本地预览。
- `canvasMap` 是已支持但未在当前 UI 中首选暴露的目标，说明“运行时能力”和“产品默认表面”已开始分层。

**基础设施：**
- 进度状态持久化、架构文档、release workflow、README 对齐测试都在主线。
- release 路径现在还多了一条维护要求：GitHub 官方 workflow actions 的 major 版本要跟上支持窗口，不能等弃用告警演变成真实失败。
- 当前真正缺的是“secret-free / machine-free”的 live verification harness，而不是更多单元测试框架。

**CLI 扩展性：**
- 本机上的稳定包装器 `obsidian-cli` 仍主要是调试/桌面入口，但底层官方 `obsidian` CLI 现在已经支持 `commands` 与 `command id=<command-id>`，可列出并触发插件注册命令。
- Notemd 里真正有 CLI 潜力的 seam 在更低层：`src/providerDiagnostics.ts`、`src/diagram/diagramGenerationService.ts`、`src/workflowButtons.ts`、`src/batchProgressStore.ts`，以及 `localOnly` 这类设置/序列化语义。
- 因此，项目当前仍不能把插件 command IDs 或 sidebar actions 直接当成稳定工程 CLI 表面。必须先抽宿主无关 operation，再在 command-trigger 层之上定义类型化 CLI 调用契约。
- 第一批具体交付已经落地在 provider diagnostics：现在已有共享 operation-input builder，并新增了开发者诊断命令，因此同一实现路径已经可被命令面板、快捷键绑定、设置页按钮和官方 CLI 命令触发共同复用。

## 当前验证门

### 仓库内可持续执行门

以下门槛可以在当前仓库中稳定复现，应视为主线真实门槛：

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

对应远端真值：

- 普通 `main` push 当前没有自动 GitHub Actions workflow
- release-tag 真值来自 `.github/workflows/release.yml`
- 当 `commits/<sha>/status` 只返回 `pending` 与零条 status 时，它不是这个仓库的权威 CI 信号

### 本地历史证据，不等于当前 CI 门

以下结论可以作为方向判断的参考，但不能再被文档表述成“仓库当前的硬性自动门槛”：

- 2026-05-02 曾对全部 8 种图表意图做过一次实时 DeepSeek API 验证
- 相关 harness 已从主线删除，原因是它依赖本地 vault 路径、真实密钥和非确定性网络调用

## Drawnix 外部参考结论

详见：`docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`

短结论：

1. **不应把 Drawnix 整体宿主嵌入 Notemd。**
   它是 Nx monorepo + React 19 + Plait/Slate + browser-fs-access + browser storage 的完整白板应用栈，明显超出当前 Obsidian 插件边界。

2. **真正值得借鉴的是数据边界和转换边界。**
   Drawnix 在 `ref/drawnix/packages/drawnix/src/data/types.ts` 中定义的 `.drawnix` 导出模型、`ref/drawnix/packages/drawnix/src/data/json.ts` 中的浏览器文件导入/导出边界、`markdown-to-drawnix` / `mermaid-to-drawnix` 的惰性加载方式，以及 app shell / board / text renderer 分层思想，都有参考价值。

3. **如果未来要支持 board-style 导出，应该直接做 `DiagramSpec -> PlaitElement[]` 适配器，而不是 `DiagramSpec -> Mermaid -> mermaid-to-drawnix` 的绕路方案。**
   否则会把现有 spec-first 语义层重新降级回字符串中间态。

## 硬性约束（仍生效）

1. **MermaidProcessor 分解**：每个子任务必须在真实 Obsidian 中独立验证并保存图像核验。仅靠单元测试不足以推进。
2. **旧版提示退役**：`promptUtils.ts` 原 Mermaid 提示词为旧场景专门调优，任何退役或合并都必须保留旧场景可用性。
3. **向后兼容性**：现有 provider 配置、transport 协议和设置项不能被破坏。

## 后续推进方向

### 立即可推进

1. **命令表面整合**
   将 `summarize-as-mermaid`、`generate-experimental-diagram`、`preview-experimental-diagram` 收口为统一 command surface，旧 ID 仅保留别名职责。

2. **建立可持续的 live verification runbook / harness**
   先把“本地一次性验证”升级为不依赖硬编码 vault 路径和私钥文件的维护者流程，再决定是否需要恢复受控的集成测试。

3. **运行时打包（任务 0 剩余）**
   为 Vega-Lite 等重型运行时建立真正的多入口或独立资产策略。

4. **release workflow 维护**
   将 GitHub workflow action major 版本更新视为 release 路径所有权的一部分，不要等弃用告警演变成真实失败 job。

5. **工作区卫生保持**
   `ref/` 与 `coverage/` 应视为本地分析 / 构建产物，而不是待提交内容。主线需要持续保持干净工作树。

6. **从 operation 边界启动 CLI 能力抽取**
   不要把 Notemd 直接绑定到 `obsidian-cli` 的命令名上。应先抽出可复用的非 UI operation，用于 diagnostics、diagram generation、workflow metadata 和 config/profile 处理。

### 建议落地顺序

结合 roadmap 原始长期意图与当前代码现实，最稳妥的未来落地顺序应为：

1. 先把命令表面 canonical 化
2. 再把维护者本地语义核验 runbook 正式落盘
3. 然后收紧重型运行时的打包边界
4. 再抽出面向未来 CLI 的宿主无关 operations
5. 完成以上四项后，再重开 legacy prompt 退役与 MermaidProcessor sunset
6. 最后才重新评估 board-style export、高级引擎探索，或 first-class CLI command 暴露

这个顺序既保留了 roadmap 的长期目标，也尊重了当前主线已经交付的事实。

### 受硬性约束阻塞

6. **旧版提示退役**
   必须先用真实 Obsidian 回归原 Mermaid 场景。

7. **MermaidProcessor sunset**
   必须逐块拆分、逐块截图验收，不能只靠 Jest。

8. **Drawnix 集成**
   当前只适合作为外部参考和未来导出目标候选，不应抢占主线优先级。

## 验收标准：图表平台

发布前至少需要同时满足两层验收：

### 层 1：仓库内硬门

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

### 层 2：维护者本地语义核验（当改动触及 `src/diagram/`、`src/mermaidProcessor.ts` 或实际渲染行为时）

- 真实 Obsidian 中抽样验证 Mermaid / JSON Canvas / Vega-Lite
- 保存并检查输出图像或产物文件
- 明确记录这是“本地语义核验”，而不是仓库当前自动 CI

当前最需要补的不是“再写一批 live test 文件”，而是把这层核验从一次性个人脚本，升级为可重复执行的维护者流程。
