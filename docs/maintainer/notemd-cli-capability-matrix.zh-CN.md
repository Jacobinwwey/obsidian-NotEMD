# Notemd CLI 能力矩阵

> 更新：2026-05-28

## 当前状态说明（2026-05-25）

简短结论：当前 `main` 上的 CLI 现状是刻意分层的两级模型，而不是单一放大的总入口。

已经在 current `main` 落地的内容：

- registry-backed operation 元数据
- 类型化 capability / invocation 导出
- 收敛后的 public-safe export 切片
- 覆盖同一 export 切片并额外支持显式 JSON / 文件 payload 的 path-based maintainer helper

当前没有宣称的内容：

- 面向用户的宽口径 CLI API
- 将当前 path-based maintainer operations 直接提升为 public-safe slice
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
  - `local-knowledge.inspect`
  - `provider.profile.export-redacted`
  - `cli.capability-manifest.export`
  - `cli.invocation-contract.export`
  - `cli.public-surface.export`

边界：

- 这是 maintainer-grade repo 工具，不是 public CLI API
- 操作目录统一收敛在 `scripts/lib/maintainer-cli-operation-help.js`，作为共享帮助元数据，并为 path-based operations 提供简洁 example payload
- 已检入的 `scripts/invoke-maintainer-cli-operation.js` 入口现在也具备 process-level 回归锁定：`--help`、`--input-json`、`--input-file`、`--pretty`、子进程 stderr 透传，以及无法解析的 `obsidian-cli native eval` 失败路径都已覆盖，而不依赖真实桌面会话
- export operations 仍然只接受空 payload；受控内容操作必须显式提供 JSON 输入
- 最小 inspect 示例：`npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["maintainer","superpowers"]}' --pretty`
- 对 `--vault docs` 来说，`sourcePath` 与 `knowledgePaths` 都必须写成 vault-relative 路径；应使用 `index.zh-CN.md`、`maintainer`，而不是 `docs/index.zh-CN.md`、`docs/maintainer`
- `local-knowledge.inspect` 是刻意保持 maintainer-only 的 explainability surface：它会暴露 task scope、实际生效的知识库路径解析结果、显式或自动派生的 query、query diagnostics、current-file exclusion 输入、retrieval options、候选文件路径、原始格式化 context、结构化 `contextBlocks` 证据，以及结构化 retrieval 摘要，但不会因此扩大 public CLI 契约
- `local-knowledge.inspect` 当前会把三条 query 派生路径明确暴露出来并由测试锁定：`explicit`（直接研究查询）、`basename`（标题/批量标题任务作用域）以及 `diagram-source`（由图形生成任务的源文件 basename + stripped note content 共同派生）。inspect 结果现在还会补充有界 query diagnostics，例如对 `index.*` 这类低信号导航文件名给出 generic navigation-basename caution
- `local-knowledge.inspect` 现在还支持临时 `knowledgePaths` override 数组，维护者可以在不改动已保存 settings 快照的前提下，用临时文件/文件夹路径列表检查 task-scoped retrieval 行为
- `local-knowledge.inspect` 现在还会把失败态 explainability 明确保留下来，而不是把所有未命中都压成同一种空结果：`retrieverBuildStatus` 会区分 `no-paths`、`no-candidate-files`、`no-retrievable-sections` 与 `ready`，同时继续保留 `candidateFilePaths` 与结构化 retrieval 摘要供维护者定位问题
- 现在还补上了更贴近真实 task-scoped retrieval 链路、并可直接复现 failure-state 的 inspect 示例，而不再只有 diagram lane：
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"batchGenerateFromTitles","sourcePath":"index.zh-CN.md"}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"task-scoped retrieval behavior","knowledgePaths":["maintainer"]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"chapter split TOC managed artifacts guarded reruns","knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"real-note query diversity beyond chapter split showcase","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"MiniSearch ragas RAGPerf execution chain maintainer-only offline evidence","knowledgePaths":["brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"managed-artifact kpm markdown-toc active-file scoped stable block refs","knowledgePaths":["brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"batchGenerateFromTitles","sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"missing path coverage","knowledgePaths":[]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"svg-only repo saga scope","knowledgePaths":["repo-saga"]}' --pretty`
- `content.split-note-by-chapters` 现在还支持可选 `splitHeadingLevel`（`auto`、`h1`-`h6`），脚本可避免继续隐式依赖当前 settings 快照
- `content.split-note-by-chapters` 的结果现在还会显式带出 `requestedSplitHeadingLevel`、`chapterNotePaths`、`managedArtifactPaths`、`removedStalePaths`、确定性的 `tocMetadata` 以及稳定的 `nestedHeadings[].blockId`，自动化调用方不必再靠文件名规则或重复标题的歧义去反推 managed artifact 集合、TOC front-matter metadata 与 TOC 目标；rerun 时若 manifest 管理的生成文件已被手改，当前实现也会拒绝静默覆盖或删除
- 这些 path-based 维护操作在副作用、输出契约与失败语义没有作为公共契约一并锁定前，仍应保持 maintainer-only

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
| `notemd:notemd-generate-diagram` | 从活动文件生成 spec-first artifact | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope，并额外包含显式 follow-through 细节（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`followThrough`、`outputPath`、`previewOpened`）；对于 artifact-generation modes，还会显式带出 machine-readable 的本地知识库检索摘要（`localKnowledgeContextUsed`、`localKnowledgeRetrieval`），但 active-file 依赖、插件状态与保存/打开副作用仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=artifact`） |
| `notemd:notemd-summarize-as-mermaid` | 为活动文件保存 Mermaid 输出 | `requires-active-file` | 类型化结果现在已暴露完整 wrapper envelope，并额外包含显式 follow-through 细节（`kind`、`executionMode`、`sourcePath`、`actionLabel`、`operationInput`、`generation`、`followThrough`、`outputPath`、`previewOpened`），但 active-file 依赖与插件管理的保存语义仍使它不能直接宣称为稳定 public API | `diagram.generate`（`exact`，`defaultInput.outputMode=mermaid`） |
| `notemd:notemd-preview-diagram` | 预览已保存/已生成图表 | `interactive-ui` | 现在已经具备类型化 input/result schema 来描述 preview artifact 边界，但打开 preview modal 仍属于 UI-only 流程，不具备自动化稳定性 | `diagram.preview`（`exact`） |
| `notemd:process-with-notemd` | 处理当前文件并加链接 | `requires-active-file` | 结构化文件结果已存在，但 active-file 依赖、概念笔记创建、输出路径策略与 vault 改写副作用仍阻碍稳定自动化 | `file.process-add-links` |
| `notemd:process-folder-with-notemd` | 批量处理文件夹 | `interactive-ui` | 结构化批量结果已存在，且包含 `savedCount` / `errors` / `cancelled`，但文件夹选择、批量改写执行与后置 Mermaid auto-fix 仍由宿主驱动 | `file.process-folder-add-links` |
| `notemd:generate-content-from-title` | 从标题生成内容 | `requires-active-file` | 结构化结果现在还会显式带出 `localKnowledgeContextUsed` 与 machine-readable 的 `localKnowledgeRetrieval` 摘要（`matchedSectionCount`、`returnedHitCount`、`sourcePaths`、sliding-window / current-file-exclusion telemetry、index/query timing、context-char count），但 active-file 依赖、内容回写语义与可选 research 副作用仍绑定插件宿主 | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | 批量标题生成 | `interactive-ui` | 结构化批量结果现在也会为每个文件带出同样的 local-KB retrieval 摘要及 timing/size telemetry，并继续保留 complete-folder move 语义与聚合错误，但文件夹选择、进度 UI 与 vault 改写仍需要宿主协调 | `content.batch-generate-from-titles` |
| `notemd:split-note-by-chapters` | 将当前活动笔记拆分为章节文件并生成 TOC/manifest | `requires-active-file` | 现在已经有 registry/contract 覆盖，maintainer helper 也可用显式 `sourcePath` 加可选 `splitHeadingLevel` 调同一 operation；类型化结果还会直接描述 managed artifact 集合，为 TOC 暴露确定性的 front-matter metadata，并为重复标题 TOC 目标暴露稳定 nested block ref，同时在 rerun 时防止静默覆盖用户手改过的生成文件，但面向用户的命令触发仍依赖 active file，且本质仍是 write-heavy 改写流程 | `content.split-note-by-chapters` |
| `notemd:research-and-summarize-topic` | 对选中文本 / 活动笔记标题做研究总结 | `requires-selection` | path-based 结果现在已显式带出 `outputPath`、`sourceLabel`、`researchContextUsed`、`localKnowledgeContextUsed` 与带 timing/size telemetry 的 machine-readable `localKnowledgeRetrieval` 摘要，但面向用户的命令触发仍依赖活动编辑器或活动笔记状态 | `research.summarize-topic` |
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
- registry 现在也已纳入主要 note-processing、utility、selection 与 export operations：`editor.create-link-and-generate`、`file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`content.split-note-by-chapters`、`research.summarize-topic`、`translate.file`、`translate.folder-batch`、`concept.extract-file`、`concept.extract-folder`、`content.extract-original-text`、`workflow.extract-and-generate`、`duplicate.check-file`、`concept.dedupe`、`mermaid.batch-fix`、`formula.fix-file`、`formula.batch-fix`、`provider.profile.export`、`provider.profile.export-redacted`、`provider.profile.import`、`cli.capability-manifest.export`、`cli.invocation-contract.export` 与 `cli.public-surface.export`。
- `src/operations/publicCliSurface.ts` 现在会从同一套 registry/capability/contract 组合直接推导 bounded public-safe slice，而不是维护另一份并行 allowlist。
- `file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`mermaid.batch-fix`、`concept.dedupe`、`translate.*`、`formula.*` 与 `content.extract-original-text` 现在已经组成当前已验证的 write-heavy contract-enrichment proof set：utility core 返回结构化结果，host adapter 接管本地化成功/no-file/confirmation 语义，registry 直接导出 richer schema。
- `content.generate-from-title`、`content.batch-generate-from-titles`、`research.summarize-topic` 以及 artifact-mode 的 `diagram.generate` 现在也已直接暴露 machine-readable 的 local-KB retrieval 摘要，而不再只剩一个 boolean 侧记。当前摘要会带出 indexed counts、matched/returned section counts、expanded section counts、source paths、请求的 `topK`、sliding-window size、current-file exclusion telemetry、index-build ms、query ms 与最终 context-char count。
- 现在也已有专用的离线 retrieval-quality fixture：`npm run verify:local-kb-fixtures`。它直接复用线上 MiniSearch runtime path 跑一组小型维护者夹具，而不是再造一条只给评测用的分叉 retriever；当前 Stage-C 收口还把 task-scoped 的 batch-title / research inspect case、exact-file-vs-folder retrieval 边界，包含重复/空白 override path、非 Markdown 干扰文件、无关文件夹与空 searchable section 候选的 noisy mixed-corpus scope、real-note-style 的 chapter-split showcase retrieval，以及 chapter-split showcase 之外的真实 note/query 多样性一并纳入，而不再只覆盖单个 diagram 示例。
- `content.split-note-by-chapters` 现在也更明确地遵循同一方向：结果结构会直接命名请求的 heading level、章节文件路径、完整 managed artifact 集合、确定性的 TOC front-matter metadata、stale removal 明细以及稳定的 nested-heading block-ref id，而不是继续逼调用方只靠 count、文件名或重复标题文本间接推断；若既有生成文件已被手改，rerun 还会 fail fast。
- `diagram.generate` 现在已经在宿主无关 generation core 之下携带显式 typed follow-through：`followThrough.kind` 用来区分 Mermaid 保存、artifact 保存与 preview 完成，同时继续保留向后兼容的顶层 `outputPath` / `previewOpened`；artifact-generation modes 还会沿同一结构化结果暴露 local-KB retrieval telemetry。
- 第一份已检入的 semantic-verification helper 现在也已经存在：`npm run verify:diagram-semantics` 会把维护者 runbook 落成可复用、无 secrets 的检查模板，而不是继续停留在纯文字指引层面。
- 下一阶段 contract deepening 顺序现在也已更精确：先把 `diagram.generate` 保持为宿主无关 generation core，并把其下的 typed follow-through 视作已落地，再处理 packaging / semantic verification 的后续收敛，最后才重开更强的 CLI/public surface 声明。
- 旧命令别名仍保留注册以保证兼容，但会被刻意排除在 capability manifest 导出之外。

## 下一批抽取目标

这些是下一阶段最值得优先纳入 registry-backed 或继续宿主去耦的能力。

| 优先级 | 候选能力 | 为什么先做 | 现有基础 |
|---|---|---|---|
| P0 | 围绕潜在 render-host runtime lane 的 source/build 收敛 | 当前源码仍保留可复用的 runtime helper（`src/rendering/runtime/renderHostEntry.ts`、`src/rendering/preview/renderHostRuntimeClient.ts`），但 build/audit 真值仍只证明 `main.js` 单资产发货。当前主线已让这条 latent lane 以 fail-closed 方式保持 source-only：除非显式配置，否则不会再返回默认的 standalone runtime-module specifier；production build 路径也会把 `createRenderHostBundleBuildOptions()` 保持在 `esbuild.config.mjs` 之外的 candidate-only 状态。下一步最高杠杆工作不再只是“把 source-only 写清楚”，而是持续守住这条可执行 guard，直到未来某个批次选择继续保持 source-only，或同批补齐 build、release assets、audit 与 docs 后真正发货多入口边界 | `esbuild.config.mjs`、`scripts/audit-render-host-bundle.js`、`scripts/lib/esbuild-bundle-config.js`、`src/rendering/runtime/renderHostEntry.ts`、`src/rendering/preview/renderHostRuntimeClient.ts` |
| P1 | 显式 path-based operations 的有界 public-CLI 提升 | maintainer helper 已证明 path-based operations 有真实需求，但只有当写入副作用与输出契约足够稳定、可文档化、可回归锁定时，才应该进入 public-safe slice | `src/maintainerCliBridge.ts`、`scripts/lib/maintainer-cli-operation-help.js`、`src/operations/registry.ts`、`src/tests/maintainerCliBridge.test.ts` |
| P1 | retrieval / chapter-split 写入路径的契约与结果加固 | 面向 retrieval 的 note-processing 结果现在已为标题生成、研究总结以及 artifact-mode 的 `diagram.generate` 显式暴露带 timing/size telemetry 的 machine-readable `localKnowledgeRetrieval` 摘要，shared maintainer helper 也已补上简洁 payload 示例，并新增专门的 `local-knowledge.inspect` explainability seam 用于检查 effective path/query/context、三种 query 派生路径（`explicit`、`basename`、`diagram-source`）、以及通过 `retrieverBuildStatus` 区分 `no-paths` / `no-candidate-files` / `no-retrievable-sections` 的失败态 explainability；它还支持临时 `knowledgePaths` override 数组做 task-scoped retrieval 调参检查。`npm run verify:local-kb-fixtures` 还锁定了一组覆盖 exact/prefix/current-file-exclusion 类别、task-scoped batch-title / research inspect case、包含重复/空白 override path、非 Markdown 干扰文件、无关文件夹与空 searchable section 候选的 noisy mixed-corpus scope、real-note-style chapter-split showcase retrieval、跨文件夹任务契约检索与低信号导航源 diagnostics 的更宽离线 retrieval-quality fixture。chapter split 也已补上 repeated-heading-safe 的 nested block ref、确定性的 TOC front-matter metadata 与 guarded rerun overwrite 语义；下一步成熟度提升点应继续转向更多真实 note/query 多样性与 chapter-split showcase 对齐，而不是继续扩操作数量 | `src/chapterSplit.ts`、`src/localKnowledgeBase.ts`、`src/fileUtils.ts`、`src/searchUtils.ts`、`src/main.ts`、`src/tests/localKnowledgeEvaluationFixture.test.ts`、`scripts/lib/maintainer-cli-operation-help.js`、`src/tests/chapterSplit.test.ts`、`src/tests/localKnowledgeTaskIntegration.test.ts`、`src/tests/diagramCommandArchitecture.test.ts`、`src/tests/localKnowledgeBase.test.ts`、`src/tests/maintainerCliBridge.test.ts` |
| P2 | workflow/settings 打包 | Workflow DSL 与 output-path toggles 仍是有价值 metadata，但还不是稳定公共接口 | `src/workflowButtons.ts`, 设置驱动的输出控制 |

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
