# Notemd CLI 能力矩阵

> 更新：2026-05-24

## 当前状态说明（2026-05-24）

简短结论：当前恢复回 `main` 的 CLI 工作是刻意收敛的。

已经在 current `main` 落地的内容：

- registry-backed operation 元数据
- 类型化 capability / invocation 导出
- 边界清晰的 export-only 公共安全切片
- 同时覆盖 public-safe exports 与受控 path-based 维护操作的 repo-local maintainer helper

当前没有宣称的内容：

- 面向用户的宽口径 CLI API
- 针对可变笔记处理流程的宽口径 public CLI API

这是一份维护者控制文档，用来区分：

- 今天已经可以被官方 `obsidian` CLI 触发的命令
- 哪些命令适合自动化，哪些只适合人工触发
- 哪些更低层的 Notemd 能力应先抽成 first-class operations，再谈更广泛 CLI 暴露

## Automation Levels

| Level | 含义 |
|---|---|
| `safe` | 非交互，足够确定，可脚本化触发 |
| `requires-active-file` | 需要活动笔记/文件上下文，当前不应视作通用自动化端点 |
| `requires-selection` | 依赖编辑器选区或交互式编辑器状态 |
| `interactive-ui` | 依赖 modal、picker、preview、split-pane 或其它人工 UI 流程 |

## 官方 CLI 触发表面

当前宿主事实：

- `obsidian commands filter=notemd` 可以列出当前插件命令
- 官方 CLI 可以通过 `obsidian command id=<command-id>` 触发这些命令
- 但这仍然只是触发表面，不是成熟的类型化集成层
- 现在 registry 导出的 capability manifest 已把命令面板、快捷键、官方 CLI 三种触发表面统一挂到同一套 command binding 元数据上

## 当前收敛后的公共安全切片

当前 public-safe slice 被刻意限制，只包含满足以下条件的命令：

- `safe`
- `requiredContext=none`
- `mappingKind=exact`
- 暴露在官方 CLI trigger surface 上
- input schema 为空对象

当前这一 slice 中的命令 ID 明确只有：

- `notemd:export-provider-profiles-redacted`
- `notemd:export-cli-capability-manifest`
- `notemd:export-cli-invocation-contract`
- `notemd:export-cli-public-surface`

约束规则：

- 原始 provider export 因为带有 `outputHandlingTags=contains-provider-credentials` 被排除在外
- redacted provider export 会主动拒绝导入，避免脱敏文件被误当成可回灌的 live settings 快照
- redacted export 仍可能暴露私有/custom `baseUrl` 基础设施信息，所以它只是比 raw export 更安全，不等于可无审查公开分享

## Repo-Local Maintainer Helper

仓库现在还带有一个很小的 maintainer helper，底层仍然是 `obsidian-cli native eval`：

- help：`npm run cli:help`
- invoke：`npm run cli:invoke -- --vault <vault> --operation <operation-id> [--input-file <path> | --input-json '<json>'] [--pretty]`
- 当前仅支持的 operation id：
  - `content.batch-generate-from-titles`
  - `content.split-note-by-chapters`
  - `research.summarize-topic`
  - `diagram.generate`
  - `provider.profile.export-redacted`
  - `cli.capability-manifest.export`
  - `cli.invocation-contract.export`
  - `cli.public-surface.export`

边界：

- 这是 maintainer-grade repo 工具，不是 public CLI API
- 操作目录统一收敛在 `scripts/lib/maintainer-cli-operation-help.js`，作为共享帮助元数据
- export operations 仍然只接受空 payload；受控内容操作必须显式提供 JSON 输入

## 当前命令矩阵

| Command ID | 当前用途 | Automation Level | 为什么它现在还不是稳定工程 API | Registry operation 映射 |
|---|---|---|---|---|
| `notemd:test-llm-connection` | 检查当前 provider 连通性 | `safe` | 现在已经具备类型化 input/result schema，但交互式 busy/reporter 路径与 notice 文案仍属于宿主 UI 语义 | `provider.connection.test`（`exact`） |
| `notemd:run-developer-provider-diagnostic` | 运行长请求 provider 诊断 | `safe` | 现在已经具备类型化 input/result schema，但长请求网络行为与诊断报告落盘仍更接近 maintainer-grade surface，而不是稳定 public API | `provider.diagnostic.run`（`exact`） |
| `notemd:run-developer-provider-stability-diagnostic` | 运行多次 provider 稳定性诊断 | `safe` | 现在已经具备类型化 input/result schema，但重复真实 provider 调用仍更接近 maintainer-grade diagnostic surface，而不是稳定 public API | `provider.diagnostic.stability-run`（`exact`） |
| `notemd:export-provider-profiles` | 导出原始 provider profile 快照 | `safe` | 确定性且 machine-readable，但导出文件本身包含 provider 凭据，因此仍是 maintainer-sensitive surface，不属于 public-safe slice | `provider.profile.export` |
| `notemd:export-provider-profiles-redacted` | 导出脱敏后的 provider profile 快照 | `safe` | 属于当前收敛后的 public-safe slice。确定性、machine-readable、会去掉 API Key，且会被主动拒绝导入，但仍可能暴露私有/custom endpoint 元数据 | `provider.profile.export-redacted` |
| `notemd:import-provider-profiles` | 导入 provider profile 快照 | `safe` | machine-readable，但会改动 active provider 状态与插件设置 | `provider.profile.import` |
| `notemd:export-cli-capability-manifest` | 导出命令 capability manifest | `safe` | 属于当前收敛后的 public-safe slice。导出确定，但仍绑定插件 config-path 写入语义 | `cli.capability-manifest.export` |
| `notemd:export-cli-invocation-contract` | 导出类型化 invocation contract | `safe` | 属于当前收敛后的 public-safe slice。导出确定，但仍绑定插件 config-path 写入语义 | `cli.invocation-contract.export` |
| `notemd:export-cli-public-surface` | 导出当前收敛后的公共 CLI 表面 | `safe` | 属于当前收敛后的 public-safe slice。该导出会自描述当前真正支持的官方 CLI 安全子集 | `cli.public-surface.export` |
| `notemd:notemd-generate-diagram` | 从活动文件生成 spec-first artifact | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope，并额外包含显式 follow-through 细节（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`followThrough`、`outputPath`、`previewOpened`），但 active-file 依赖、插件状态与保存/打开副作用仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=artifact`） |
| `notemd:notemd-summarize-as-mermaid` | 为活动文件保存 Mermaid 输出 | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope，并额外包含显式 follow-through 细节（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`followThrough`、`outputPath`、`previewOpened`），但 active-file 依赖与插件管理的保存语义仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=mermaid`） |
| `notemd:notemd-preview-diagram` | 预览已保存/已生成图表 | `interactive-ui` | 现在已经具备类型化 input/result schema 来描述 preview artifact 边界，但打开 preview modal 仍属于 UI-only 流程，不具备自动化稳定性 | `diagram.preview`（`exact`） |
| `notemd:process-with-notemd` | 处理当前文件并加链接 | `requires-active-file` | 结构化文件结果已存在，但 active-file 依赖、概念笔记创建、输出路径策略与 vault 改写副作用仍阻碍稳定自动化 | `file.process-add-links` |
| `notemd:process-folder-with-notemd` | 批量处理文件夹 | `interactive-ui` | 结构化批量结果已存在，且包含 `savedCount` / `errors` / `cancelled`，但文件夹选择、批量改写执行与后置 Mermaid auto-fix 仍由宿主驱动 | `file.process-folder-add-links` |
| `notemd:generate-content-from-title` | 从标题生成内容 | `requires-active-file` | 结构化结果已存在，但 active-file 依赖、内容回写语义与可选 research 副作用仍绑定插件宿主 | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | 批量标题生成 | `interactive-ui` | 结构化批量结果已存在，且包含 complete-folder move 语义与聚合错误，但文件夹选择、进度 UI 与 vault 改写仍需要宿主协调 | `content.batch-generate-from-titles` |
| `notemd:research-and-summarize-topic` | 对选中文本 / 活动笔记标题做研究总结 | `requires-selection` | 依赖活动编辑器或活动笔记标题 | `research.summarize-topic` |
| `notemd:translate-file` | 翻译当前活动笔记 | `requires-active-file` | 结构化结果与宿主接管的成功 notice 已存在，但 active-file 依赖、设置驱动的输出路径策略与 vault 写入副作用仍阻碍稳定自动化 | `translate.file` |
| `notemd:batch-translate-folder` | 批量翻译文件夹 | `interactive-ui` | 文件夹选择仍然是交互式流程；结构化批量结果与宿主接管的成功 notice 已存在，但 folder picker 依赖与批量写入执行仍不适合稳定自动化 | `translate.folder-batch` |
| `notemd:extract-concepts-from-current-file` | 从活动文件提取概念 | `requires-active-file` | 依赖活动文件和 note-creation 副作用 | `concept.extract-file` |
| `notemd:batch-extract-concepts-from-folder` | 从文件夹批量提取概念 | `interactive-ui` | 文件夹选择和进度 UI 仍宿主绑定 | `concept.extract-folder` |
| `notemd:extract-original-text` | 从活动文件提取配置好的原文片段 | `requires-active-file` | 现在已有结构化结果，但 active-file 依赖与输出路径持久化仍绑定宿主/设置 | `content.extract-original-text` |
| `notemd:extract-concepts-and-generate-titles` | 提取概念并生成标题的复合流程 | `requires-active-file` | 复合 workflow 尚无显式 typed contract | `workflow.extract-and-generate` |
| `notemd:create-wiki-link-and-generate-from-selection` | 基于选区创建概念笔记并生成内容 | `requires-selection` | 编辑器选区是内生依赖 | `editor.create-link-and-generate` |
| `notemd:batch-mermaid-fix` | 批量 Mermaid 修复 | `interactive-ui` | 结构化批量结果现已存在，但文件夹选择、可变修复流程、报告生成与可选错误文件移动仍需要交互式宿主语义 | `mermaid.batch-fix` |
| `notemd:fix-formula-formats` | 修复当前文件公式格式 | `requires-active-file` | 结构化文件结果已存在，但 active-file 依赖与直接 vault 改写副作用仍阻碍稳定自动化 | `formula.fix-file` |
| `notemd:batch-fix-formula-formats` | 批量公式修复 | `interactive-ui` | 结构化批量结果已存在，但文件夹选择与批量改写执行仍需要交互式宿主语义 | `formula.batch-fix` |
| `notemd:check-for-duplicates` | 检查当前笔记重复项 | `requires-active-file` | 结果目前偏 console/notice 输出 | `duplicate.check-file` |
| `notemd:check-and-remove-duplicate-concept-notes` | 删除重复概念笔记 | `interactive-ui` | 结构化扫描/删除结果现已存在，确认流程也已上提到 host，但破坏性确认与文件夹范围改写仍不适合稳定自动化 | `concept.dedupe` |

## Registry 当前状态

- `src/operations/registry.ts` 已成为已抽取 operation、command binding、mapping kind 与部分 input/result schema 的中心元数据源。
- `src/operations/capabilityManifest.ts` 现在从同一 registry 展平 capability manifest。
- capability/public-surface 元数据现在也会携带 handling tags，使调用方无需额外硬编码规则就能区分 secret-bearing export 与 redacted/public-safe export。
- `src/cliContracts.ts` 现在也从同一 registry 生成 invocation contract，减少了文档、命令发现与契约导出之间的漂移路径。
- registry 现在也已纳入主要 note-processing、utility、selection 与 export operations：`editor.create-link-and-generate`、`file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`research.summarize-topic`、`translate.file`、`translate.folder-batch`、`concept.extract-file`、`concept.extract-folder`、`content.extract-original-text`、`workflow.extract-and-generate`、`duplicate.check-file`、`concept.dedupe`、`mermaid.batch-fix`、`formula.fix-file`、`formula.batch-fix`、`provider.profile.export`、`provider.profile.export-redacted`、`provider.profile.import`、`cli.capability-manifest.export`、`cli.invocation-contract.export` 与 `cli.public-surface.export`。
- `src/operations/publicCliSurface.ts` 现在会从同一套 registry/capability/contract 组合直接推导 bounded public-safe slice，而不是维护另一份并行 allowlist。
- `file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`mermaid.batch-fix`、`concept.dedupe`、`translate.*`、`formula.*` 与 `content.extract-original-text` 现在已经组成当前已验证的 write-heavy contract-enrichment proof set：utility core 返回结构化结果，host adapter 接管本地化成功/no-file/confirmation 语义，registry 直接导出 richer schema。
- `diagram.generate` 现在已经在宿主无关 generation core 之下携带显式 typed follow-through：`followThrough.kind` 用来区分 Mermaid 保存、artifact 保存与 preview 完成，同时继续保留向后兼容的顶层 `outputPath` / `previewOpened`。
- 第一份已检入的 semantic-verification helper 现在也已经存在：`npm run verify:diagram-semantics` 会把维护者 runbook 落成可复用、无 secrets 的检查模板，而不是继续停留在纯文字指引层面。
- 下一阶段 contract deepening 顺序现在也已更精确：先把 `diagram.generate` 保持为宿主无关 generation core，并把其下的 typed follow-through 视作已落地，再处理 packaging / semantic verification 的后续收敛，最后才重开更强的 CLI/public surface 声明。
- 旧命令别名仍保留注册以保证兼容，但会被刻意排除在 capability manifest 导出之外。

## 下一批抽取目标

这些是下一阶段最值得优先纳入 registry-backed 或继续宿主去耦的能力。

| 优先级 | 候选能力 | 为什么先做 | 现有基础 |
|---|---|---|---|
| P0 | Packaging / semantic-verification 收敛后续 | 第一批 convergence slice 现已落地：`npm run verify:diagram-semantics` 已会生成带 packaging-boundary 提醒的维护者检查模板，runbook 已与之对齐，对应测试也已锁定这套真值。下一步更高杠杆的工作，是在保持这套真值稳定的同时，判断下一个应落地的是实际的 heavy-runtime isolation，还是后续某个 contract promotion 决策 | `scripts/diagram-semantic-verification.js`、`docs/maintainer/*`、`src/tests/diagramSemanticVerificationScript.test.ts`、`src/operations/diagramCommandExecution.ts` |
| P1 | selection/export 与 config flow 的 contract 增强 | 这些 operation 已建模，但未来 operation invoker 需要比 command-trigger 对等更丰富的 path/context 语义 | `src/operations/registry.ts`, `src/operations/configProfileCommands.ts`, `src/operations/noteProcessingCommandHostAdapter.ts` |
| P1 | workflow/settings 打包 | Workflow DSL 与 output-path toggles 仍是有价值 metadata，但还不是稳定公共接口 | `src/workflowButtons.ts`, 设置驱动的输出控制 |
| P2 | 重型运行时打包隔离实现 | 仓库现在已经明确写清当前是单入口 `main.js` + 内联 `srcdoc` 契约。剩余的打包缺口已经不再是“继续补 runbook 文案”，而是真正的多入口或独立资产隔离实现本身 | `esbuild.config.mjs`、`scripts/audit-render-host-bundle.js`、render-host 打包路径 |

## 设置就绪度

| 设置 / 区域 | CLI 复用就绪度 | 说明 |
|---|---|---|
| Provider name / model | High | 显式且已有 task scope |
| `preferredDiagramIntent` | High | 天然适合作为 operation input |
| Developer diagnostic mode / timeout / runs | High | 结构化程度已较高 |
| `localOnly` 语义 | Medium-high | export/import/profile contract 必须保留 |
| Workflow DSL | Medium | 适合做 metadata source，但还不是稳定公共 API |
| Output path toggles | Medium | 有价值，但目前仍和插件写回行为耦合 |
| UI locale / notices / modal text | Low | 纯 UI 关注点 |

## 推荐工程规则

不要因为 `obsidian command id=<id>` 可以运行，就把某个 Notemd 命令提升为“CLI supported”。

也不要因为它支持快捷键绑定，就把它视为稳定契约。命令面板、快捷键、官方 CLI 只是触发表面，不等于工程接口。

只有当以下条件全部成立时，才应提升：

1. 输入显式
2. 输出 machine-readable
3. 副作用已文档化
4. 进度与失败语义是确定性的
5. 不再隐式依赖活动编辑器 / UI 状态
