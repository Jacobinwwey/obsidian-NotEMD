# Notemd CLI 能力矩阵

> 更新：2026-05-04

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
| `notemd:test-llm-connection` | 检查当前 provider 连通性 | `safe` | 当前输出仍偏 UI，而不是结果契约 | `provider.diagnostic.run`（`future-target`） |
| `notemd:run-developer-provider-diagnostic` | 运行长请求 provider 诊断 | `safe` | 比 `test-llm-connection` 更接近自动化，但仍缺少公开的类型化结果表面 | `provider.diagnostic.run`（`exact`） |
| `notemd:run-developer-provider-stability-diagnostic` | 运行多次 provider 稳定性诊断 | `safe` | 比纯 UI 诊断更适合自动化，但仍缺少公开的类型化结果表面 | `provider.diagnostic.stability-run`（`exact`） |
| `notemd:notemd-generate-diagram` | 从活动文件生成 spec-first artifact | `requires-active-file` | 依赖活动文件、插件状态和保存/打开副作用 | `diagram.generate`（`exact`，`defaultInput.outputMode=artifact`） |
| `notemd:notemd-summarize-as-mermaid` | 为活动文件保存 Mermaid 输出 | `requires-active-file` | 依赖活动文件与插件管理的保存语义 | `diagram.generate`（`exact`，`defaultInput.outputMode=mermaid`） |
| `notemd:notemd-preview-diagram` | 预览已保存/已生成图表 | `interactive-ui` | Preview modal 属于 UI-only 流程，不具备自动化稳定性 | `diagram.preview`（`exact`） |
| `notemd:process-with-notemd` | 处理当前文件并加链接 | `requires-active-file` | 依赖活动文件和插件侧内容改写流程 | `file.process.add-links` |
| `notemd:process-folder-with-notemd` | 批量处理文件夹 | `interactive-ui` | 依赖 folder selection 和 batch UX | `file.process-folder.add-links` |
| `notemd:generate-content-from-title` | 从标题生成内容 | `requires-active-file` | 使用活动文件并回写内容 | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | 批量标题生成 | `interactive-ui` | 文件夹选择、完成目录和进度 UI 仍然绑定宿主 | `content.batch-generate-from-titles` |
| `notemd:research-and-summarize-topic` | 对选中文本 / 活动笔记标题做研究总结 | `requires-selection` | 依赖活动编辑器或活动笔记标题 | `research.summarize-topic` |
| `notemd:translate-file` | 翻译当前笔记/选区 | `requires-selection` | 当前命令契约本质上是 editor-context first | `translate.file` |
| `notemd:batch-translate-folder` | 批量翻译文件夹 | `interactive-ui` | 文件夹选择和进度 UI 需要先拆 adapter | `translate.folder-batch` |
| `notemd:extract-concepts-from-current-file` | 从活动文件提取概念 | `requires-active-file` | 依赖活动文件和 note-creation 副作用 | `concept.extract-file` |
| `notemd:batch-extract-concepts-from-folder` | 从文件夹批量提取概念 | `interactive-ui` | 文件夹选择和进度 UI 仍宿主绑定 | `concept.extract-folder` |
| `notemd:extract-concepts-and-generate-titles` | 提取概念并生成标题的复合流程 | `requires-active-file` | 复合 workflow 尚无显式 typed contract | `workflow.extract-and-generate` |
| `notemd:create-wiki-link-and-generate-from-selection` | 基于选区创建概念笔记并生成内容 | `requires-selection` | 编辑器选区是内生依赖 | `editor.create-link-and-generate` |
| `notemd:batch-mermaid-fix` | 批量 Mermaid 修复 | `interactive-ui` | 文件夹选择、内容改写和报告副作用都仍然绑定宿主 | `mermaid.batch-fix` |
| `notemd:fix-formula-formats` | 修复当前文件公式格式 | `requires-active-file` | 活动文件内容改写契约尚未外部化 | `formula.fix-file` |
| `notemd:batch-fix-formula-formats` | 批量公式修复 | `interactive-ui` | 文件夹选择和进度/报告副作用仍存在 | `formula.batch-fix` |
| `notemd:check-for-duplicates` | 检查当前笔记重复项 | `requires-active-file` | 结果目前偏 console/notice 输出 | `duplicate.check-file` |
| `notemd:check-and-remove-duplicate-concept-notes` | 删除重复概念笔记 | `interactive-ui` | 破坏性流程需要更强的契约和确认模型 | `concept.dedupe` |

## Registry 当前状态

- `src/operations/registry.ts` 已成为已抽取 operation、command binding、mapping kind 与部分 input/result schema 的中心元数据源。
- `src/operations/capabilityManifest.ts` 现在从同一 registry 展平 capability manifest。
- `src/cliContracts.ts` 现在也从同一 registry 生成 invocation contract，减少了文档、命令发现与契约导出之间的漂移路径。
- 旧命令别名仍保留注册以保证兼容，但会被刻意排除在 capability manifest 导出之外。

## 第一批抽取目标

这些是最值得优先抽成宿主无关 operations 的能力。

| 优先级 | 候选能力 | 为什么先做 | 现有基础 |
|---|---|---|---|
| P0 | Provider diagnostics | 已接近 operation 形态；输入输出清晰 | `src/providerDiagnostics.ts`, `src/llmUtils.ts` |
| P0 | Diagram generation | spec-first core 已存在 | `src/diagram/diagramGenerationService.ts`, `src/diagram/*` |
| P1 | Capability discovery | 在扩大自动化表面之前必须补齐 | `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, `src/cliContracts.ts` |
| P1 | Config/profile export | 让 CLI 使用可复现 | `src/types.ts`, `src/constants.ts`, provider settings |
| P2 | Batch execution state | 价值高，但需要先清理 adapter 耦合 | `src/batchProgressStore.ts`, `src/main.ts` 中 batch flows |

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
