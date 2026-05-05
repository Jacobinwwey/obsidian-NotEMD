---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI 主线进展同步与下一阶段需求

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

剩余问题现在已经更窄，也更难：

1. `src/fileUtils.ts` 是当前最大的 write-heavy core。processed-file 保存、标题生成、Mermaid 修复、重复清理与 error-log persistence 仍然暴露出不均衡的结果语义与混杂的宿主副作用。
2. `src/main.ts` 仍持有最高价值的剩余 direct command surfaces：`testLlmConnectionCommand`、`generateDiagramCommand` 及其 save/artifact 分支、以及 `previewExperimentalDiagramCommand`。
3. 打包隔离与 maintainer-local semantic verification 仍然重要，但它们现在已经是 operation-contract 收口之后的后续问题，而不是前置阻塞。

因此，下一阶段重点不应再是“继续加 CLI 命令”，也不应再把 `translate/formula` 当成未完成批次。真正的下一步应先收紧更大的 `src/fileUtils.ts` 家族，再处理剩余 direct command surfaces。

## 需求

**事实同步**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`、`docs/architecture*` 与 `docs/maintainer/notemd-cli-capability-matrix*` 必须对齐到 2026-05-05 的代码现实，明确写出：`translate.*` 与 `formula.*` 现在都已具备结构化结果与宿主接管的成功 notice。
- R2. 任何文档都不得继续把 `translate/formula` contract tightening 写成仅处于计划中或进行中。

**下一阶段优先级**
- R3. 下一阶段固定顺序现在改为 `src/fileUtils.ts` 写入型家族 -> `src/main.ts` 剩余 direct command surfaces -> packaging / semantic-verification 收敛`。
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
- R5. 下一批 contract-tightening 现在必须转向更大的 `src/fileUtils.ts` 流程，重点覆盖 `processFile`、`generateContentForTitle`、`batchGenerateContentForTitles`、`batchFixMermaidSyntaxInFolder` 与 `checkAndRemoveDuplicateConceptNotes`，并补齐 richer result semantics 与显式 aggregated errors。

**宿主副作用收口**
- R6. `translate.*`、`formula.*` 与 `content.extract-original-text` 现在应被视作已交付 proof slice。除非至少再有一条更大的 `src/fileUtils.ts` 家族同样稳定，否则不要急着把它们改造成全局统一 envelope。
- R7. `src/fileUtils.ts` 必须继续把 `Notice`、vault 落盘、目录创建、输出冲突处理与破坏性确认语义，向显式 host effect 或结构化结果对象收口，避免 operation core 泄漏 UI 文案。
- R8. 仍依赖 active file、folder picker、破坏性确认或 preview UI 的流程，不得误标为 `safe`；在 contract 未补齐前只能维持为 `requires-active-file`、`interactive-ui` 或其它受限等级。

**剩余 `src/main.ts` 瘦身**
- R9. note-processing 与 utility host-adapter 抽离现在已经足够完整，回头重开这些家族只会制造 churn。下一批 `src/main.ts` 瘦身应只瞄准剩余高价值 direct surfaces。
- R10. diagram save/generate/preview 与 provider connection-test 要么获得与已抽取家族同等级的 discoverable operation/result 边界，要么在文档中明确声明为 command-only surface。

**主线与工作区卫生**
- R11. `main` 集成必须继续在干净 worktree 或干净分支上完成，不能清理或复用 dirty root worktree。
- R12. 交付完成时，当前执行 worktree 必须重新回到 clean 状态，并附 fresh build/test/audit 证据。

## 成功标准

- 维护者只看最新 requirements / progress / architecture 文档，就能清楚区分已交付 proof slice（`translate.*`、`formula.*`、`content.extract-original-text`）与仍未完成的 `src/fileUtils.ts` / direct-surface 工作。
- 文档不再报错旧顺序；下一波推进现在已经明确是 `src/fileUtils.ts` 优先、direct surfaces 次之。
- 所有主线同步与代码工作都在干净工作树中完成，并通过完整仓库验证门。

## 范围边界

- 本次 requirements 不直接新增新的 `obsidian-cli` 子命令。
- 本次 requirements 不会把 write-heavy note-processing 流程提前宣告为稳定公共 CLI API。
- 本次 requirements 还不会强行在所有 operation family 之上建立全局统一结果 envelope。
- 本次 requirements 不会清理 dirty root `main` worktree。

## 关键决策

- `translate/formula` contract-tightening proof slice 现已交付；在更大的 `src/fileUtils.ts` 批次之前重开它们只会制造 churn，而不是推进。
- 当前仍优先接受 family-local result object；共享全局 envelope 依然过早。
- direct-surface slimming 仍重要，但它排在下一批 write-heavy contract 之后，因为单纯搬 wrapper 并不能显著改善 CLI contract。

## 依赖与假设

- 当前 clean worktree 已基于最新远端 `main`，并已包含 registry、capability-contract 与第一批 provider/diagram/config-profile 抽离成果。
- `src/operations/noteProcessingCommandHostAdapter.ts` 现在已经承接 process / generate / research / translate / extract 这批 note-processing command wrapper。
- `src/operations/utilityCommandHostAdapter.ts` 现在已经承接 duplicate cleanup、Mermaid batch fix 与 formula-fix command wrapper。
- capability registry 已覆盖 note-processing、process/generate/research、utility、selection 与 export operation batches；主要结构缺口已转向更大的 write-heavy 结果语义与剩余 direct surfaces。

## 未决问题

### 延后到规划阶段
- [影响 R5][Technical] `src/fileUtils.ts` 的哪些结果家族应在第一批里显式区分 `created`、`overwritten`、`moved`、`skipped`，哪些可以先保持 aggregate-only？
- [影响 R7][Technical] Mermaid repair 与 duplicate cleanup 应继续保持 family-local result object，还是在第一批 `src/fileUtils.ts` 收口后再统一 write-heavy 结果词汇？
- [影响 R10][Technical] `src/fileUtils.ts` 之后，下一批更该先做 diagram command surfaces，还是 provider connection-test flows？

## 下一步

-> 进入 `/ce:plan`，规划 `src/fileUtils.ts` contract-tightening batch。
