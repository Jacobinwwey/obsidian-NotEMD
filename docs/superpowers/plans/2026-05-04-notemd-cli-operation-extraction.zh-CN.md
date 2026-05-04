# Notemd CLI Operation 抽取实施计划

> **给代理执行者：** 在干净 worktree 中执行。把官方 `obsidian` CLI 视为命令触发底座，而不是完整插件自动化协议。

**目标：** 把 Notemd 从“插件命令集合”推进成“可被官方 Obsidian CLI、未来 `obsidian-cli` 包装器以及维护者自动化共同调用的 operation 系统”，且不重复复制 orchestration 逻辑。

**架构：** 强制区分四层：

1. trigger 层：`obsidian command id=...`、命令面板、sidebar、workflow DSL
2. host adapter 层：plugin UI / 官方 CLI / 维护者脚本
3. operation 层：类型化输入、类型化输出、显式副作用
4. contract 层：能力发现、参数 schema、结果 schema、进度语义

**技术栈：** TypeScript、Obsidian Plugin API、官方 Obsidian CLI、Jest、Markdown 文档、可选 JSON-schema 风格类型约束

---

## 问题界定

官方 `obsidian` CLI 现在已经能列出并执行插件注册命令。这件事有价值，但远远不够：

- 当前 Notemd 命令仍大量依赖 `src/main.ts` orchestration
- 很多流程仍绑定 `App`、`Editor`、`MarkdownView`、Notice、modal、active file
- 命令触发层没有类型化参数面、稳定结果契约和能力元数据

如果最终停留在“CLI 可以触发 command ID”，自动化能力仍然会很脆弱。真正的工程目标不是继续扩 command IDs，而是在命令层之下建立稳定的 operation surface。

## 需求追踪

来源文档：

- `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.zh-CN.md`
- `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md`
- `docs/architecture.zh-CN.md`
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`
- `docs/maintainer/notemd-cli-capability-matrix.md`

继承约束：

- 不把当前 command IDs 当成稳定工程 API
- 在抽取过程中保留现有用户侧插件命令行为
- 第一批 CLI-grade contract 不纳入 UI-only 流程
- 随着 CLI 方向推进，`src/main.ts` 要缩小而不是继续膨胀

## 当前主线状态（2026-05-04）

- `src/operations/types.ts` 已承接共享 operation 元数据原语，不再把这些定义埋在 sidebar/workflow 代码里。
- `src/operations/registry.ts` 现在是已抽取 operation definition、command binding、mapping kind 与部分 input/result schema 的中心事实源。
- `src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 现在都从这份 registry 派生，减少了一条主要元数据漂移路径。
- `diagram.generate` 现在已经和 provider diagnostics 一样拥有类型化 invocation contract。
- 现有 Obsidian 命令仍保持注册状态，并继续支持快捷键与官方 CLI 触发，同时底层 operation 层继续演进。

## 短期交付（0-2 周）

### 目标

在不改变产品行为的前提下，建立第一批 CLI-grade seam。

### 工作项

- 定义 operation taxonomy 与 automation-level 词汇表
- 抽取 provider diagnostics 为宿主无关 operation surface
- 冻结当前 `notemd:*` 命令 capability matrix
- 为非交互能力定义第一批类型化结果契约

### 实施单元

**ST1. Operation contract 基础类型**
- 创建 `src/operations/types.ts`
- 定义：
  - `OperationDefinition`
  - `OperationContext`
  - `OperationResult`
  - `ProgressSink`
  - `AutomationLevel`
- 保持这些类型不依赖 Obsidian UI 类
- 实施状态：
  - 共享原语已在 `src/operations/types.ts` 落地
  - workflow 元数据现在改为导入这些原语，而不是在本地重复定义

**ST2. Provider diagnostic operation**
- 将当前 `src/providerDiagnostics.ts` 封装到稳定 operation 入口后面
- 预期输入字段：
  - provider name
  - model override
  - call mode
  - timeout
  - stability runs
  - optional output path
- 预期结果字段：
  - success
  - report path/text
  - elapsed time
  - warnings
  - debug summary
- 当前进展：
  - 共享 operation-input builder 已落地
  - 开发者诊断命令包装层已落地
  - 同一诊断路径现在已经可被设置页按钮、命令面板、快捷键和官方 CLI 命令触发共同复用

**ST3. Capability matrix 作为事实源**
- 将现有插件命令分类为：
  - `safe`
  - `requires-active-file`
  - `requires-selection`
  - `interactive-ui`
- 明确哪些命令今天就适合官方 CLI 触发，哪些不适合

### 验证

- `npm run build`
- full Jest
- provider diagnostics 相关契约测试继续为绿
- 不出现用户侧命令回归

### 最佳实践

- 优先输出文件化证据，而不是 UI Notice
- 优先显式输入对象，而不是读取全局插件状态
- 第一批抽取的 operation 保持小而稳

### 坑点

- 抽了目录但仍然把 `App` 透传到处都是
- operation 结果仍然泄露 UI 文案
- 把“可被 CLI 调用”误判成“已经自动化就绪”

## 中期交付（2-6 周）

### 目标

围绕最高价值能力建立真正可复用的 operation 层。

### 工作项

- 抽出 diagram generation 的类型化 operation contract
- 引入 plugin UI / 官方 CLI 的 host adapters
- 把 workflow metadata 从 sidebar-only 配置升级为复用 registry
- 为 CLI 复用建立 config/profile 语义边界

### 实施单元

**MT1. Diagram generation operation**
- 用稳定 operation 封装 `src/diagram/diagramGenerationService.ts`
- 支持：
  - source markdown input
  - source file path input
  - requested intent
  - compatibility mode
  - output mode（`artifact` / `mermaid`）
  - save/dry-run behavior
- 返回：
  - plan
  - spec
  - artifact metadata
  - saved path
  - render warnings
- 实施状态：
  - 共享 `DiagramOperationInput` 整形已落地
  - `diagram.generate` 现在已进入 registry 驱动的类型化 invocation contract
  - 剩余缺口：把 save/preview 宿主适配逻辑继续从 `src/main.ts` 抽离出去

**MT2. Host adapter 拆分**
- 新增 plugin adapter，负责解析 active file、vault state、settings
- 新增 CLI adapter，负责解析 file path、vault targeting、output path、stdout/stderr 行为
- adapter 保持薄，业务逻辑继续留在 operations

**MT3. Workflow/action registry 加固**
- 把 `src/workflowButtons.ts` 提升为 metadata source，而不只是按钮配置
- 为每个 action 增加：
  - automation level
  - required context
  - side-effect class
  - parameter expectations
- 实施状态：
  - sidebar action metadata 仍是 command-surface 语义的来源
  - 新 operation registry 现在承接跨表面的 command binding、mapping kind（`exact` / `future-target` / `legacy-alias`）以及 manifest/contract 导出输入
  - 旧 command alias 仍保留注册以兼容现有流程，但已刻意排除在 capability-manifest 导出之外

**MT4. Config/profile 边界**
- 将 plugin-owned state 与可导入导出的 automation profile state 分离
- 第一批候选：
  - provider/model selection
  - `preferredDiagramIntent`
  - diagnostic mode/timeouts
  - workflow definitions
- 在所有 export/import 设计中明确保留 `localOnly` 语义

### 验证

- full build + full Jest
- diagram generation output contract 检查
- 现有 command IDs 在官方 CLI 下继续可触发

### 最佳实践

- 先定义 output schema，再暴露自动化入口
- preview 关注点与 generation 关注点分离
- 在增加更多可调用 operation 前先补 capability discovery

### 坑点

- 把 preview/UI 副作用混进 generation operation
- 在 metadata 规范化前就把 workflow DSL 暴露成公共 API
- 混淆 command IDs 与 operation IDs

## 长期交付（6 周以上）

### 目标

在官方 command-trigger 层之上，暴露真正成熟的自动化集成面。

### 工作项

- 引入 capability-discovery command 或 manifest surface
- 为选定 operations 增加类型化 invocation contract
- 支持 machine-readable progress / result emission
- 评估最终 transport 应停留在 command-based、file-based，还是演化成 local bridge

### 实施单元

**LT1. Capability discovery**
- 发布稳定能力元数据：
  - operation ID
  - version
  - required context
  - accepted input schema
  - result schema

**LT2. Typed invocation layer**
- 在 raw command IDs 之上构建稳定 “invoke operation” contract
- 支持确定性 exit codes 与 machine-readable errors

**LT3. 可选 richer transport**
- 评估 command-trigger-only integration 是否已足够
- 只有在 operation contracts 稳定后，才考虑 local REST / IPC / file bridge

### 验证

- 端到端维护者自动化 smoke tests
- 继续保留 backward-compatible command trigger support
- 对不支持的 interactive flows 做清晰文档化

### 最佳实践

- operation contract 独立于 command label 做版本化
- transport 选择永远次于 contract 稳定性
- 以可维护自动化为目标，而不是追求花哨设计

### 坑点

- 在 contract 稳定前先做 transport
- 把某一台维护机的 wrapper 行为硬编码成仓库架构
- 把插件内部对象形状直接泄露成公共自动化 API

## 固定落地顺序

1. provider diagnostic operation
2. capability matrix + automation levels
3. diagram generation operation
4. workflow/action registry hardening
5. config/profile extraction
6. typed invocation layer
7. optional richer transport

进度说明：

- 第 1-4 项已在主线上部分落地。
- 下一步最稳妥的推进点是 MT2：继续把 host adapter 从 `src/main.ts` 中拆出，避免 command wrapper 仍成为进入已抽取 operation 的唯一运行时入口。

## 退出标准

- 至少有一个非交互 Notemd 能力通过宿主无关 operation contract 可调用
- command IDs 继续兼容，但不再是唯一的集成故事
- 维护者能明确指出哪些能力今天适合官方 CLI 触发以及原因
- 仓库已经具备可继续推进 operation extraction 的稳定实施计划，不再需要重新争论架构方向
