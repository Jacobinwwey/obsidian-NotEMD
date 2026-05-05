---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI 写入型契约收口需求

## 问题框架

前几轮需求已经把“大范围抽取”问题解决掉，而最新代码也已经把最小证明批次补齐：

- `content.extract-original-text` 已经返回结构化结果，且成功 notice 已移动到 `src/operations/noteProcessingCommandHostAdapter.ts`
- `translate.file` 与 `translate.folder-batch` 现在都会返回结构化翻译结果，翻译成功 notice 也已移到 note-processing host adapter
- `formula.fix-file` 与 `formula.batch-fix` 现在都会返回结构化 file/folder 结果，公式修复成功 notice 也已移到 utility host adapter
- `src/operations/registry.ts` 现在也已导出这些 write-heavy 家族的 richer result schema，不再把它们压平成仅路径或仅计数语义
- 第一批 `src/fileUtils.ts` 的 process/generate 子切片也已落地：
  - `processFile()` 返回 `ProcessFileResult`
  - `generateContentForTitle()` 返回 `GenerateContentForTitleResult`
  - `batchGenerateContentForTitles()` 返回 `BatchGenerateContentForTitlesResult`
  - `runProcessFolderWithNotemdCommandWithHost()` 现在返回带 `savedCount`、`errors` 与 `cancelled` 的 `BatchProcessFolderResult`
  - 批量生成的无文件 notice 现在改由 host adapter 承接，而不是留在 utility core

这意味着，下一批 write-heavy 工作已经不再模糊。当前真正的压力点只剩：

- `src/fileUtils.ts` 的剩余尾部，这里 Mermaid 修复、重复清理以及破坏性/报告语义仍落后于已经落地的 process/generate 契约
- `src/main.ts`，这里仍保留 provider connection test、diagram save/generation、Vega-Lite preview 等非平凡 direct command surfaces
- 以及一个典型误区：在更大的写入型家族还没稳定之前，就过早引入全局统一结果 envelope

因此，下一步最稳妥的动作应是完成 `src/fileUtils.ts` 的剩余尾部，而不是回头重开已经落地的 process/generate/translate/formula 切片，也不是现在就强行上全局抽象。

## 与先前需求的对比

| 先前文档 | 当时判断 | 当前代码已验证 |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | public CLI 暴露必须晚于 host-neutral operation | 结论成立；operation 覆盖广度已基本到位，当前阻塞点变成 contract 深度 |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | 最小剩余证明批次应先做 `translate.*` 与 `formula.*`，再进入更大的 write-heavy 工作 | 结论成立，而且现在已经交付 |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | registry onboarding 应先于更强自动化声明完成 | 结论成立；registry 覆盖广度已不再是当前最高杠杆主题 |

## 方案比较

### 方案一：下一批直接完成 `src/fileUtils.ts` 剩余尾部

直接进入 `batchFixMermaidSyntaxInFolder` 与 `checkAndRemoveDuplicateConceptNotes`，保持新落地的 process/generate 契约稳定，等写入型尾部语义稳定后，再回头处理 direct command surfaces。

- 优点：在不重开已完成切片的前提下，收掉同一家族里最后一个高杠杆缺口
- 缺点：`src/main.ts` 还会继续保留少量 direct surfaces 一轮
- 风险：Mermaid/dedupe 语义可能诱导过早的统一结果抽象
- 适用：目标是实质 contract 深度，而不是表面 wrapper 迁移

### 方案二：先清空剩余 `src/main.ts` 直连面

优先处理 `testLlmConnectionCommand`、diagram save/generate、preview 流，让 `src/main.ts` 先更薄。

- 优点：入口层肉眼更干净
- 缺点：write-heavy 结果契约仍然薄，CLI discoverability 仍然不会实质改善
- 风险：继续搬 wrapper，却没有消化最大副作用集中区
- 适用：如果当前最核心目标是 entrypoint 清洁，而不是 operation 语义

### 方案三：现在就上全局统一结果 envelope

先定义一套通用 operation result shape，再把 `src/fileUtils.ts`、translation、formula、process、generate 一起往里套。

- 优点：如果成功，一次性获得最强一致性叙事
- 缺点：在最大家族尚未建模时就上抽象，风险最高
- 风险：过早固化通用 envelope，反而拖慢交付
- 适用：只有当多个更大的家族都已经语义稳定时才合适，而当前并不是

## 推荐方向

选择方案一。

`content.extract-original-text`、`translate.*`、`formula.*` 与 `src/fileUtils.ts` 的 process/generate 子切片已经提供了清晰 proof slice。现在最缺的证据不是“还能不能再搬 wrapper”，而是同样的 host-owned-success + family-local-result 模式能否在 Mermaid repair 与 destructive concept dedupe 上稳定成立。

## 需求

**当前事实同步**
- R1. 当前进度文档与架构文档必须把 process/generate/translate/formula 流程描述为已交付 proof slice，而不是待完成工作。
- R2. 当前文档必须精确点名剩余 direct surfaces：`src/main.ts` 中的 `testLlmConnectionCommand`、`generateDiagramCommand` 及其 save/artifact 分支、`previewExperimentalDiagramCommand`。

**短期收口**
- R3. 下一批 P0 实施必须优先处理 `src/fileUtils.ts` 的剩余尾部，重点包括 `batchFixMermaidSyntaxInFolder` 与 `checkAndRemoveDuplicateConceptNotes`，同时保住新落地的 `processFile`、`generateContentForTitle` 与 `batchGenerateContentForTitles` 契约。
- R4. 剩余流程必须返回与 process/generate 子切片可比的结构化结果；在适用场景下显式覆盖报告/输出路径、聚合错误、`skipped` / `removed` 语义，以及对自动化足够可见的破坏性副作用。
- R5. 这些流程的 happy-path success notice、reporter 生命周期与 destructive-confirmation 文案必须留在 host adapter，而不是继续写在 `src/fileUtils.ts` 中。
- R6. `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 必须同步更新，以承接 R4-R5 的 richer result schema，同时保留新落地的 process/generate schemas；只有在 deterministic、非 UI 绑定时才允许引入可选输入。

**中期收敛**
- R7. `src/fileUtils.ts` 之后，下一批实施必须转向 `src/main.ts` 中剩余 direct command surfaces。
- R8. diagram save/generate/preview 与 provider connection-test 要么获得与其它家族同等级的 operation/result discoverability，要么在文档中明确声明为 automation-grade CLI contract 之外的 command-only surface。
- R9. 在至少有一条 `src/fileUtils.ts` 家族和一条 direct-surface 家族都稳定之前，项目应继续优先 family-local result object，而不是急着合并成全局 envelope。

**长期命令面收敛**
- R10. 只有在更大的 write-heavy 语义稳定后，项目才应重开全局统一结果 envelope 或更强 public CLI 声明。
- R11. packaging isolation、maintainer-local semantic verification 与 live runbook hardening 仍是有效后续工作，但不能挤占当前 operation-contract 优先级。
- R12. public CLI 暴露仍必须分阶段推进：先 internal operation contract，再 maintainer-grade invocation，最后才是稳定用户 CLI API。

**文档与卫生**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`、`docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`、`docs/architecture*` 与 `docs/maintainer/notemd-cli-capability-matrix*` 必须逐段更新，对齐“proof slice 已交付 + 新的短中长期方向”。
- R14. 交付必须结束在最新 `origin/main`，并附 fresh build/test/audit 证据与 clean worktree。

## 成功标准

- 维护者不需要再做代码考古，就能直接说清楚后三波架构推进顺序：先 `src/fileUtils.ts` 剩余尾部，再剩余 direct surfaces，最后 packaging / semantic verification 后续硬化。
- 当前文档不再把 translation 或 formula contract tightening 写成待办。
- 下一轮 planning 可以直接从 `src/fileUtils.ts` 剩余尾部开始，而不需要重新发明 why、ordering 或 scope boundary。

## 范围边界

- 本轮 requirements 不新增 `obsidian-cli` 子命令。
- 本轮 requirements 还不会强行在所有 operation family 之上建立全局统一结果 envelope。
- 本轮 requirements 不尝试在同一批次里重写全部剩余 direct command surfaces。
- 本轮 requirements 不清理或复用 dirty root worktree。

## 关键决策

- 把已交付的 process/generate/translate/formula 切片当成证明，而不是下一目标。
- 继续优先 family-specific result object；等更大的 `src/fileUtils.ts` 家族也建模成功后，再决定是否值得上全局 envelope。
- 把剩余 `src/main.ts` direct surfaces 视为 `src/fileUtils.ts` 之后的下一收敛问题，而不是之前。

## 依赖 / 假设

- 当前事实已通过 `src/main.ts`、`src/translate.ts`、`src/formulaFixer.ts`、`src/fileUtils.ts`、`src/operations/registry.ts` 与 2026-05 的 brainstorm 文档核对。
- `content.extract-original-text`、`translate.*`、`formula.*` 与 process/generate 子切片已经提供目标模式：utility core 输出 richer result，成功/no-file notice 交给 host adapter。
- 当前 registry 已覆盖下一批所需 operation IDs；剩余工作主要是 contract 深度与 host-side effect 上提。

## 未决问题

### 延后到规划阶段
- [影响 R4][Technical] Mermaid repair 与 duplicate cleanup 的哪些输出在第一批尾部里必须显式暴露报告路径或 `skipped` / `removed` 语义？
- [影响 R5][Technical] Mermaid repair 与 duplicate cleanup 是否要立即靠拢 process/generate 结果词汇，还是先保持 family-local 直到尾部批次稳定？
- [影响 R8][Technical] `src/fileUtils.ts` 之后，下一批更该先做 diagram command surfaces，还是 provider connection test？

## 下一步

-> `/ce:plan` for `src/fileUtils.ts` 剩余尾部
