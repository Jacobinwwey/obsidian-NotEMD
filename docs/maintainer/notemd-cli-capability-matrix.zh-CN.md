# Notemd CLI 能力矩阵

> 更新：2026-05-05

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

## 当前命令矩阵

| Command ID | 当前用途 | Automation Level | 为什么它现在还不是稳定工程 API | Registry operation 映射 |
|---|---|---|---|---|
| `notemd:test-llm-connection` | 检查当前 provider 连通性 | `safe` | 现在已经具备类型化 input/result schema，但交互式 busy/reporter 路径与 notice 文案仍属于宿主 UI 语义 | `provider.connection.test`（`exact`） |
| `notemd:run-developer-provider-diagnostic` | 运行长请求 provider 诊断 | `safe` | 现在已经具备类型化 input/result schema，但长请求网络行为与诊断报告落盘仍更接近 maintainer-grade surface，而不是稳定 public API | `provider.diagnostic.run`（`exact`） |
| `notemd:run-developer-provider-stability-diagnostic` | 运行多次 provider 稳定性诊断 | `safe` | 现在已经具备类型化 input/result schema，但重复真实 provider 调用仍更接近 maintainer-grade diagnostic surface，而不是稳定 public API | `provider.diagnostic.stability-run`（`exact`） |
| `notemd:export-provider-profiles` | 导出 provider profile 快照 | `safe` | 确定性且 machine-readable，但仍绑定插件管理的 config 路径语义 | `provider.profile.export` |
| `notemd:import-provider-profiles` | 导入 provider profile 快照 | `safe` | machine-readable，但会改动 active provider 状态与插件设置 | `provider.profile.import` |
| `notemd:export-cli-capability-manifest` | 导出命令 capability manifest | `safe` | 导出确定，但仍绑定插件 config-path 写入语义 | `cli.capability-manifest.export` |
| `notemd:export-cli-invocation-contract` | 导出类型化 invocation contract | `safe` | 导出确定，但仍绑定插件 config-path 写入语义 | `cli.invocation-contract.export` |
| `notemd:notemd-generate-diagram` | 从活动文件生成 spec-first artifact | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`outputPath`、`previewOpened`），但 active-file 依赖、插件状态与保存/打开副作用仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=artifact`） |
| `notemd:notemd-summarize-as-mermaid` | 为活动文件保存 Mermaid 输出 | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`outputPath`、`previewOpened`），但 active-file 依赖与插件管理的保存语义仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=mermaid`） |
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
- `src/cliContracts.ts` 现在也从同一 registry 生成 invocation contract，减少了文档、命令发现与契约导出之间的漂移路径。
- registry 现在也已纳入主要 note-processing、utility、selection 与 export operations：`editor.create-link-and-generate`、`file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`research.summarize-topic`、`translate.file`、`translate.folder-batch`、`concept.extract-file`、`concept.extract-folder`、`content.extract-original-text`、`workflow.extract-and-generate`、`duplicate.check-file`、`concept.dedupe`、`mermaid.batch-fix`、`formula.fix-file`、`formula.batch-fix`、`provider.profile.export`、`provider.profile.import`、`cli.capability-manifest.export` 与 `cli.invocation-contract.export`。
- `file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`mermaid.batch-fix`、`concept.dedupe`、`translate.*`、`formula.*` 与 `content.extract-original-text` 现在已经组成当前已验证的 write-heavy contract-enrichment proof set：utility core 返回结构化结果，host adapter 接管本地化成功/no-file/confirmation 语义，registry 直接导出 richer schema。
- 下一阶段 contract deepening 顺序现在也已明确：先处理剩余 direct-read/sidebar surfaces，再做 packaging / semantic verification 的后续收敛，最后才重开更强的 CLI/public surface 声明。
- 旧命令别名仍保留注册以保证兼容，但会被刻意排除在 capability manifest 导出之外。

## 下一批抽取目标

这些是下一阶段最值得优先纳入 registry-backed 或继续宿主去耦的能力。

| 优先级 | 候选能力 | 为什么先做 | 现有基础 |
|---|---|---|---|
| P0 | Diagram/provider command-core 收敛 | 公共 provider-test 与 diagram command wrapper 已经改为通过 host adapter 代理，`provider.connection.test` 与 `diagram.preview` 已具备 typed contract，`diagram.generate` 也已暴露完整 wrapper envelope，而不只是内部 generation payload。当前剩余缺口是 `src/operations/diagramCommandExecution.ts` 中内部 save/artifact 分支是否还值得继续拆成更细的 typed boundary | `src/operations/diagramCommandHostAdapter.ts`、`src/operations/diagramCommandExecution.ts`、`src/operations/providerConnectionTestCommandHostAdapter.ts` |
| P1 | selection/export 与 config flow 的 contract 增强 | 这些 operation 已建模，但未来 operation invoker 需要比 command-trigger 对等更丰富的 path/context 语义 | `src/operations/registry.ts`, `src/operations/configProfileCommands.ts`, `src/operations/noteProcessingCommandHostAdapter.ts` |
| P1 | workflow/settings 打包 | Workflow DSL 与 output-path toggles 仍是有价值 metadata，但还不是稳定公共接口 | `src/workflowButtons.ts`, 设置驱动的输出控制 |
| P2 | maintainer 语义验证与打包硬化 | 重型运行时隔离与维护者本地 runbook 仍重要，但在命令面收口后才是下一层问题 | `docs/maintainer/*`, render-host bundle 流程, release 验证路径 |

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
