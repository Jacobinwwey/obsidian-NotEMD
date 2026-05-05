---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI 写入型契约收口需求

> 更新（2026-05-05，当天稍后）：第一批 direct-surface wrapper 已经落地。`testLlmConnectionCommand`、`generateDiagramCommand` 与 `previewExperimentalDiagramCommand` 现在都通过 host adapter 代理，并返回结构化结果。当前开放问题已经下移到 diagram/provider command-core 收敛。
>
> 更新（2026-05-05，当天更晚）：registry/capability/contract 路径现在也已导出 `provider.connection.test` 与 `diagram.preview` 的 typed operation surface。剩余问题不再是这些 seam 要不要存在，而是 diagram wrapper 之下的 save/artifact 分支是否值得继续提升为额外 typed boundary。

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
- `src/fileUtils.ts` 的剩余尾部也已落地：
  - `batchFixMermaidSyntaxInFolder()` 返回 `BatchMermaidFixResult`
  - `checkAndRemoveDuplicateConceptNotes()` 返回 `ConceptDedupeResult`
  - Mermaid 无文件处理与 duplicate deletion confirmation 现在都已进入 utility host adapter，而不是留在 utility core
  - `src/operations/registry.ts` 现在也已导出 `mermaid.batch-fix` 与 `concept.dedupe` 的 richer result schema

这意味着，write-heavy 批次已经不再是未完成工作。当前真正的压力点只剩：

- `src/main.ts`，这里仍保留 provider connection test 后续流程、diagram save/generation、Vega-Lite preview 等更深层 command-core 逻辑
- selection/export 与 workflow/settings 表面，它们的 contract 深度仍落后于 write-heavy proof set
- 以及一个典型误区：在更大的写入型家族还没稳定之前，就过早引入全局统一结果 envelope

因此，下一步最稳妥的动作应是保持 write-heavy 家族闭环，转向剩余 direct command surfaces，而不是回头重开已经落地的切片，也不是现在就强行上全局抽象。

## 与先前需求的对比

| 先前文档 | 当时判断 | 当前代码已验证 |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | public CLI 暴露必须晚于 host-neutral operation | 结论成立；operation 覆盖广度已基本到位，当前阻塞点变成 contract 深度 |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | 最小剩余证明批次应先做 `translate.*` 与 `formula.*`，再进入更大的 write-heavy 工作 | 结论成立，而且现在已经交付 |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | registry onboarding 应先于更强自动化声明完成 | 结论成立；registry 覆盖广度已不再是当前最高杠杆主题 |

## 方案比较

### 方案一：继续重开 write-heavy 家族

继续回头微调 Mermaid repair / duplicate cleanup 结果词汇，再去碰剩余 direct command surfaces。

- 优点：局部一致性更强
- 缺点：会重开已经交付的批次
- 风险：制造 churn，却不推进当前主线瓶颈
- 适用：只有当当前 write-heavy 批次还没闭环时才成立，而现在已不成立

### 方案二：先清空剩余 `src/main.ts` 直连面

优先处理 `testLlmConnectionCommand`、diagram save/generate、preview 流，因为 write-heavy 家族已经不再是主阻塞。

- 优点：直接攻击当前剩余瓶颈
- 缺点：要在 diagram surfaces 与 provider connection-test 之间谨慎挑第一个 seam
- 风险：diagram / preview 这组表面包含更多 save/open 分叉，容易过度抽象
- 适用：如果当前最核心目标是 entrypoint 清洁，而不是 operation 语义

### 方案三：现在就上全局统一结果 envelope

先定义一套通用 operation result shape，再把 `src/fileUtils.ts`、translation、formula、process、generate 一起往里套。

- 优点：如果成功，一次性获得最强一致性叙事
- 缺点：在最大家族尚未建模时就上抽象，风险最高
- 风险：过早固化通用 envelope，反而拖慢交付
- 适用：只有当多个更大的家族都已经语义稳定时才合适，而当前并不是

## 推荐方向

选择方案二。

`content.extract-original-text`、`translate.*`、`formula.*` 与完整的 write-heavy `src/fileUtils.ts` 家族已经提供了清晰 proof slice。现在最缺的证据不再是 write-heavy family 能否成立，而是剩余 direct command surfaces 能否也被推进到同等级的 operation/result 边界。

## 需求

**当前事实同步**
- R1. 当前进度文档与架构文档必须把完整 write-heavy 家族描述为已交付 proof，而不是待完成工作。
- R2. 当前文档必须精确点名剩余更深层 seam：`src/main.ts` 中的 `executeSaveMermaidDiagramCommand`、`executeArtifactDiagramCommand`，以及已经落地的 `provider.connection.test` / `diagram.preview` typed wrapper 之下仍然存在的 save/artifact follow-through。

**短期收口**
- R3. 下一批 P0 实施必须优先处理 `src/main.ts` 中剩余更深层的 diagram/provider command core，重点包括 `executeSaveMermaidDiagramCommand`、`executeArtifactDiagramCommand`，以及已经落地 wrapper 之下仍然存在的 save/artifact follow-through。
- R4. 这些更深层 seam 要么返回可比于 write-heavy proof set 的结构化结果与显式副作用边界，要么被明确标记为现有 typed operation 之下的 internal command-core branch。
- R5. 这些流程的成功 notice、preview-only 文案与 save/open 分叉应继续向 host adapter 或 operation-layer boundary 收口，而不是继续内联保留在 `src/main.ts` 中。
- R6. `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 只有在更深层 save/artifact seam 足够 deterministic 时才应继续扩展；`diagram.preview` 仍应保持 `interactive-ui`，`provider.connection.test` 仍应保持 `safe`。

**中期收敛**
- R7. 更深层 diagram/provider command-core 批次之后，下一批实施必须转向 packaging isolation 与 maintainer-local semantic verification 的后续硬化。
- R8. diagram save/generate/preview 与 provider connection-test 要么在现有 wrapper 之下继续深化 operation/result discoverability，要么在文档中明确声明为 automation-grade CLI contract 之外的 internal command-core branch。
- R9. 在至少有一条 `src/fileUtils.ts` 家族和一条 direct-surface 家族都稳定之前，项目应继续优先 family-local result object，而不是急着合并成全局 envelope。

**长期命令面收敛**
- R10. 只有在更大的 write-heavy 语义稳定后，项目才应重开全局统一结果 envelope 或更强 public CLI 声明。
- R11. packaging isolation、maintainer-local semantic verification 与 live runbook hardening 仍是有效后续工作，但不能挤占当前 operation-contract 优先级。
- R12. public CLI 暴露仍必须分阶段推进：先 internal operation contract，再 maintainer-grade invocation，最后才是稳定用户 CLI API。

**文档与卫生**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`、`docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`、`docs/architecture*` 与 `docs/maintainer/notemd-cli-capability-matrix*` 必须逐段更新，对齐“proof slice 已交付 + 新的短中长期方向”。
- R14. 交付必须结束在最新 `origin/main`，并附 fresh build/test/audit 证据与 clean worktree。

## 成功标准

- 维护者不需要再做代码考古，就能直接说清楚后三波架构推进顺序：先剩余 direct surfaces，再 packaging / semantic verification 后续硬化，最后 broader CLI/public-surface 决策。
- 当前文档不再把 translation 或 formula contract tightening 写成待办。
- 下一轮 planning 可以直接从剩余 direct-surface batch 开始，而不需要重新发明 why、ordering 或 scope boundary。

## 范围边界

- 本轮 requirements 不新增 `obsidian-cli` 子命令。
- 本轮 requirements 还不会强行在所有 operation family 之上建立全局统一结果 envelope。
- 本轮 requirements 不尝试在同一批次里重写全部剩余 direct command surfaces。
- 本轮 requirements 不清理或复用 dirty root worktree。

## 关键决策

- 把已交付的 write-heavy 切片当成证明，而不是下一目标。
- 继续优先 family-specific result object；等更大的 `src/fileUtils.ts` 家族与至少一条更深层 diagram/provider seam 都建模成功后，再决定是否值得上全局 envelope。
- 把剩余 `src/main.ts` diagram/provider command-core branch 视为 `src/fileUtils.ts` 之后的下一收敛问题，而不是之前。

## 依赖 / 假设

- 当前事实已通过 `src/main.ts`、`src/translate.ts`、`src/formulaFixer.ts`、`src/fileUtils.ts`、`src/operations/registry.ts` 与 2026-05 的 brainstorm 文档核对。
- `content.extract-original-text`、`translate.*`、`formula.*`、`mermaid.batch-fix`、`concept.dedupe` 与 process/generate 子切片已经提供目标模式：utility core 输出 richer result，成功/no-file/confirmation 语义交给 host adapter。
- 当前 registry 已覆盖下一批所需 operation IDs，也已包含 `provider.connection.test` 与 `diagram.preview`；剩余工作主要是这些 typed seam 之下更深层的 contract 深度与 host-side effect 上提。

## 未决问题

### 延后到规划阶段
- [影响 R4][Technical] 哪些更深层 diagram save/artifact 分支已经足够 deterministic，值得继续提升为额外 typed operation boundary？
- [影响 R5][Technical] 第一个更深层 seam 应该先做 save-Mermaid、artifact generation，还是先做两者共享的更小公共边界？
- [影响 R8][Technical] direct-surface 批次之后，workflow/settings packaging 与 maintainer semantic verification 谁的杠杆更高？

## 下一步

-> `/ce:plan` for 剩余 direct-surface batch
