---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI 主线进展同步与下一阶段需求

> 更新（2026-05-07，更晚一些）：这一步 follow-through 决策现已落地。`diagram.generate` 继续保持为宿主无关 generation core，而 Mermaid/artifact 的保存与 preview 完成现在通过显式的类型化 `followThrough` 结果结构暴露出来，同时保留向后兼容的顶层 `outputPath` / `previewOpened`。下一轮实现应转向 packaging / semantic-verification 收敛，除非后续真的出现足够宿主无关的新导出边界。

## 问题框架

截至 2026-05-05，Notemd 的 CLI 相关主线已经不再卡在“大范围 operation 抽取”阶段：

- 最新远端 `main` 已包含 operation registry、capability/contract 导出，以及第一批 diagram / provider / config-profile host-adapter 抽离
- clean worktree 这一轮已经把翻译、概念提取、原文提取与 `extract-concepts-and-generate-titles` 组合命令下沉到 `src/operations/noteProcessingCommandHostAdapter.ts`
- 同一轮也已落地 note-processing registry onboarding、第一批 utility-command registry、process / generate / research 长尾 registry batch，以及 selection/export registry batch
- `src/fileUtils.ts` 与 `src/extractOriginalText.ts` 不再强耦合具体 `NotemdPlugin` 类，而是改为接受更窄的 runtime context
- 组合命令的两个真实缺陷也已修复：外层 `isBusy` 不再短路内部提取流程，批量生成也已对齐配置中的概念目录
- 最新跟进切片现在也已完成最小写入型证明批次：
  - `translateFile()` 返回 `TranslateFileResult`
  - `batchTranslateFolder()` 返回 `BatchTranslateFolderResult`，包含逐文件输出与聚合错误
  - `fixFormulaFormatsInFile()` 返回 `FormulaFixFileResult`
  - `batchFixFormulaFormatsInFolder()` 返回 `BatchFormulaFixResult`，包含逐文件结果、聚合错误与 `replacementCount`
  - 翻译与公式修复的成功 notice 现在分别由 `src/operations/noteProcessingCommandHostAdapter.ts` 与 `src/operations/utilityCommandHostAdapter.ts` 承接，不再留在 utility core
  - `src/operations/registry.ts` 现在也已导出 `translate.*` 与 `formula.*` 的 richer result schema
- 当前跟进切片也已落下第一批 `src/fileUtils.ts` contract-tightening pass：
  - `processFile()` 返回 `ProcessFileResult`
  - `runProcessWithNotemdCommandWithHost()` 现在会直接返回该结构化文件结果
  - `runProcessFolderWithNotemdCommandWithHost()` 现在返回带 `savedCount`、`fileResults`、`errors` 与 `cancelled` 的 `BatchProcessFolderResult`
  - `generateContentForTitle()` 返回 `GenerateContentForTitleResult`
  - `batchGenerateContentForTitles()` 返回带 complete-folder move 语义与聚合错误的 `BatchGenerateContentForTitlesResult`
  - 批量生成的无文件 notice 现在改由 `src/operations/noteProcessingCommandHostAdapter.ts` 承接，不再留在 `src/fileUtils.ts`
- 当前跟进切片也已落下 `src/fileUtils.ts` 的剩余尾部：
  - `batchFixMermaidSyntaxInFolder()` 返回 `BatchMermaidFixResult`
  - `checkAndRemoveDuplicateConceptNotes()` 返回 `ConceptDedupeResult`
  - duplicate deletion confirmation 现在由 `src/operations/utilityCommandHostAdapter.ts` 注入
  - batch Mermaid 的无文件 notice 现在也由 `src/operations/utilityCommandHostAdapter.ts` 承接
  - `src/operations/registry.ts` 现在也已导出 `mermaid.batch-fix` 与 `concept.dedupe` 的 richer result schema

剩余问题现在已经更窄，也更难：

1. 先前最高价值的公共 direct command surface 已不再内联。`testLlmConnectionCommand`、`generateDiagramCommand` 与 `previewExperimentalDiagramCommand` 现在都通过 host adapter 代理，并返回结构化结果。
2. 更深层的 diagram command-core 切片现在又前进了一步：实质性的 save/artifact execution 已进入 `src/operations/diagramCommandExecution.ts`，而 `diagram.generate` 现在也会返回显式的 `followThrough` 细节（`kind`、`outputPath`、`previewOpened`、`autoFixAttempted`、`artifactTarget`），并继续保留已有的 wrapper-result 字段。
3. selection/export 与 workflow/settings surfaces 仍需要超出 command-trigger parity 的更深 contract depth。
4. packaging isolation 与 maintainer-local semantic verification 现在已经成为下一批更高杠杆工作，因为“把 `diagram.generate` 之下的 follow-through 类型化”这一步已经不再只是计划。

因此，下一阶段重点不应再是“继续加 CLI 命令”，也不应再把任何 write-heavy `src/fileUtils.ts` 批次当成未完成范围。真正的下一步应把 diagram/provider command-core 分层视作已达到当前 contract 深度，然后收口 packaging / semantic-verification 后续工作。

## 需求

**事实同步**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`、`docs/architecture*` 与 `docs/maintainer/notemd-cli-capability-matrix*` 必须对齐到 2026-05-05 的代码现实，明确写出：process/generate/translate/formula/mermaid/dedupe 流程现在都已具备结构化结果，相关成功/no-file/confirmation 语义也已进入 host adapter。
- R2. 任何文档都不得继续把任何 write-heavy `src/fileUtils.ts` contract pass 写成仅处于计划中或进行中。

**下一阶段优先级**
- R3. 下一阶段固定顺序现在改为 `更深层的 diagram/provider command-core 分层 -> packaging / semantic-verification 收敛 -> 更广的 CLI/public surface refinement`。
- R4. 当前已经落地的 registry-backed operation 第一批包括：
  - `editor.create-link-and-generate`
  - `translate.file`
  - `translate.folder-batch`
  - `concept.extract-file`
  - `concept.extract-folder`
  - `content.extract-original-text`
  - `workflow.extract-and-generate`
  - `file.process-add-links`
  - `file.process-folder-add-links`
  - `content.generate-from-title`
  - `content.batch-generate-from-titles`
  - `research.summarize-topic`
  - `duplicate.check-file`
  - `concept.dedupe`
  - `mermaid.batch-fix`
  - `formula.fix-file`
  - `formula.batch-fix`
  - `provider.profile.export`
  - `provider.profile.import`
  - `cli.capability-manifest.export`
  - `cli.invocation-contract.export`
- R5. 下一批 contract-tightening 现在必须先保持这批新落地的更深层 diagram/provider command core 稳定：`src/operations/diagramCommandExecution.ts` 现在已经会在 `diagram.generate` 之下返回显式 typed follow-through。后续工作只需判断这一已落地结构是否已经足够，还是未来真的有某个分支值得提升为新的导出 operation boundary。

**宿主副作用收口**
- R6. `file.process-add-links`、`file.process-folder-add-links`、`content.generate-from-title`、`content.batch-generate-from-titles`、`mermaid.batch-fix`、`concept.dedupe`、`translate.*`、`formula.*` 与 `content.extract-original-text` 现在应被视作已交付 proof slice。当前应保留这些 family-local result object 与 host-owned success/no-file/confirmation 语义，等待剩余 direct surfaces 补齐。
- R7. `src/fileUtils.ts` 必须继续把 `Notice`、vault 落盘、目录创建、输出冲突处理与破坏性确认语义，向显式 host effect 或结构化结果对象收口，避免 operation core 泄漏 UI 文案。
- R8. 仍依赖 active file、folder picker、破坏性确认或 preview UI 的流程，不得误标为 `safe`；在 contract 未补齐前只能维持为 `requires-active-file`、`interactive-ui` 或其它受限等级。
- R8.1. 当 `safe` / `read-only` 描述的是宿主无关可复用 core 时，operation-level 上继续使用这些元数据仍可能是正确的；即便如此，映射过去的 shipped command 仍必须保留 `requires-active-file` / `write-file` 等真实产品语义。`diagram.generate` 就是当前的参照案例，文档必须把这层分裂说明白。

**剩余 `src/main.ts` 瘦身**
- R9. note-processing 与 utility host-adapter 抽离现在已经足够完整，回头重开这些家族只会制造 churn。下一批 `src/main.ts` 瘦身应只瞄准剩余更深层的 diagram/provider helper。
- R10. diagram save/generate/preview 与 provider connection-test 要么获得与已抽取家族同等级的 discoverable operation/result 边界，要么在文档中明确声明为 command-only surface。公共 wrapper、typed `diagram.preview` / `provider.connection.test` contract，以及带显式 `followThrough` 的更丰富 `diagram.generate` result shape 现已落地；当前开放问题只剩未来是否还有分支值得继续提升为额外 exported boundary。

**主线与工作区卫生**
- R11. `main` 集成必须继续在干净 worktree 或干净分支上完成，不能清理或复用 dirty root worktree。
- R12. 交付完成时，当前执行 worktree 必须重新回到 clean 状态，并附 fresh build/test/audit 证据。

## 成功标准

- 维护者只看最新 requirements / progress / architecture 文档，就能清楚区分已交付 write-heavy proof set、已落地的 direct-surface wrapper 批次，以及仍未完成的更深层 diagram/provider contract 工作。
- 文档不再报错旧顺序；下一波推进现在已经明确是更深层 diagram/provider contract 优先、packaging/semantic-verification 次之。
- 所有主线同步与代码工作都在干净工作树中完成，并通过完整仓库验证门。

## 范围边界

- 本次 requirements 不直接新增新的 `obsidian-cli` 子命令。
- 本次 requirements 不会把 write-heavy note-processing 流程提前宣告为稳定公共 CLI API。
- 本次 requirements 还不会强行在所有 operation family 之上建立全局统一结果 envelope。
- 本次 requirements 不会清理 dirty root `main` worktree。

## 关键决策

- 整个 write-heavy contract-tightening 批次现已交付，第一批 direct-surface wrapper 也已交付；在更深层 diagram/provider contract 工作之前重开它们只会制造 churn，而不是推进。
- 当前仍优先接受 family-local result object；共享全局 envelope 依然过早。
- direct-surface slimming 仍重要，但当前更准确的重点已经落地：`diagram.generate` core 之下的 follow-through 现已显式类型化，所以下一批更高杠杆工作应转向 packaging/semantic-verification，而不是追求命令数量增长或过早引入新的 operation ID。

## 依赖与假设

- 当前 clean worktree 已基于最新远端 `main`，并已包含 registry、capability-contract 与第一批 provider/diagram/config-profile 抽离成果。
- `src/operations/noteProcessingCommandHostAdapter.ts` 现在已经承接 process / generate / research / translate / extract 这批 note-processing command wrapper。
- `src/operations/utilityCommandHostAdapter.ts` 现在已经承接 duplicate cleanup、Mermaid batch fix 与 formula-fix command wrapper。
- capability registry 已覆盖 note-processing、process/generate/research、utility、selection 与 export operation batches；主要结构缺口已转向更深层的 diagram/provider contract 决策，以及 packaging/semantic-verification 后续工作。

## 未决问题

### 延后到规划阶段
- [影响 R5][Technical] 新落地的 `diagram.generate.followThrough` 形态是否已经足够满足当前 contract 深度，还是未来真的会有某个分支成熟到值得升级为额外的导出 operation boundary？
- [影响 R7][Technical] 哪些 direct surfaces 值得升级为 registry-backed operations，哪些应继续保留 command-only 语义？
- [影响 R10][Technical] direct-surface 批次之后，selection/export contract 增强与 maintainer semantic verification 谁的杠杆更高？

## 下一步

-> 进入 `/ce:plan`，规划更深层的 diagram/provider contract 批次。
