---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI 写入型契约收口需求

## 问题框架

前面三轮 CLI 相关需求其实已经把大方向问题解掉了：

- `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` 已明确 public CLI 暴露必须晚于 operation-first 边界抽取
- `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` 已把主缺口从 registry 覆盖面收敛到 result/side-effect/direct-surface 收口
- 当前 `main` 上的代码也已经证明一条完整样板是可行的：`content.extract-original-text` 已返回结构化结果，且成功 notice 已上提到 `src/operations/noteProcessingCommandHostAdapter.ts`

现在剩余问题已经不模糊，代码里有三处非常具体的压力点：

- `src/translate.ts` 仍然自己持有 `ProgressModal` fallback、成功 `Notice`、目录创建 fallback，以及仅返回 path/null 的浅结果语义
- `src/fileUtils.ts` 仍然集中了最重的写入侧行为：processed-file 保存、title generation、concept-note creation、duplicate cleanup、Mermaid repair、error-log persistence
- `src/main.ts` 仍然保留 provider connection test、diagram save/generate、Vega-Lite preview 这些非平凡 direct command surfaces

所以下一步既不该是“再加更多命令”，也不该是“先把所有剩余 wrapper 全部搬完”。真正应该做的是按能降低维护成本的顺序，把写入型 operation contract 继续收紧，而不是过早引入全局大抽象。

## 与先前需求的对比

| 先前文档 | 已被证明正确的判断 | 当前代码新验证出的剩余差值 |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | public CLI 暴露必须晚于 host-neutral operation | 现在 operation 覆盖面已基本到位，阻塞点已从“抽得不够多”转成“契约不够深” |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | 剩余缺口会转成 result/side-effect 收口与剩余 direct surfaces | 结论成立；`content.extract-original-text` 已成第一条 enriched contract，但 `translate.*`、`formula.*` 与 `fileUtils.ts` 仍落后 |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | registry onboarding 应先于更强自动化声明完成 | 结论成立；registry onboarding 已不再是当前最高杠杆主题 |

## 方案比较

### 方案一：先收口最小写入型家族

先做 `translate.file`、`translate.folder-batch`、`formula.fix-file`、`formula.batch-fix`，等结果形态连续验证两次以后，再进入更大的 `src/fileUtils.ts` 切片。

- 优点：切片最小、最安全，能立刻增强 CLI contract，跨文件扰动低
- 缺点：`src/main.ts` 还会继续保留少量 direct surfaces 一轮
- 风险：如果前两家族命名不统一，可能先制造局部语义漂移
- 适用：目标是稳步压实架构边界，而不是追求表面行数变化

### 方案二：先清空剩余 `src/main.ts` 直连面

优先处理 `testLlmConnectionCommand`、diagram save/generate、preview 流，让 `src/main.ts` 先进一步变薄。

- 优点：入口层肉眼可见更干净
- 缺点：写入型 contract 仍然薄，CLI 可发现性问题并不会实质改善
- 风险：继续搬 wrapper，却没有解决更深层的 contract 问题
- 适用：如果当前最核心目标是 entrypoint 清洁，而不是自动化语义

### 方案三：先上全局统一结果 envelope

先定义一套通用 operation result shape，再把 translation、formula、process、generate 全部往里套。

- 优点：如果成功，一次性获得最强一致性叙事
- 缺点：在语义还没稳定时就上抽象，风险最高
- 风险：过早固化通用 envelope，反而拖慢真实交付
- 适用：只有当现有家族语义已经高度一致时才合适，而当前并不是

## 推荐方向

选择方案一。

原因很直接：`content.extract-original-text` 已经证明“utility core 返回 richer result，host adapter 承接成功语义”这条路是成立的。现在最高杠杆不是重开所有 direct surfaces，也不是强上全局 envelope，而是把同样模式先复制到最小、最清晰的写入型家族上，再决定是否抽象。

## 需求

**当前事实同步**
- R1. 当前进度文档与架构文档必须把 operation coverage 描述为“当前 command family 范围内已基本完成”，不能继续把 raw registry onboarding 写成主缺口。
- R2. 当前文档必须精确点名剩余 direct surfaces：`src/main.ts` 中的 `testLlmConnectionCommand`、`generateDiagramCommand` 及其 save/artifact 分支、`previewExperimentalDiagramCommand`。

**短期收口**
- R3. 下一批 P0 实施必须优先处理 `translate.file`、`translate.folder-batch`、`formula.fix-file` 与 `formula.batch-fix`，而不是先重开更大的 `src/fileUtils.ts` 家族。
- R4. Translation flows 必须返回结构化结果，至少覆盖 source/output path、target language、覆盖/创建行为、translated count 与 per-file errors；成功 notice 与 modal 生命周期必须上提到 host adapter，而不是继续留在 `src/translate.ts`。
- R5. Formula-fix flows 必须从 boolean-only / count-only 语义升级到结构化 file/folder result，localized user notices 必须留在 host adapter，而不是继续写在 `src/formulaFixer.ts`。
- R6. `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 必须同步更新，以承接 R4-R5 的 richer result schema；只有在保持 deterministic、非 UI 绑定时才允许引入可选输入。

**中期收敛**
- R7. Translation/formula 之后，下一批实施必须转向 `src/fileUtils.ts` 的写入型主家族，重点包括 `processFile`、`generateContentForTitle`、`batchGenerateContentForTitles` 与 `checkAndRemoveDuplicateConceptNotes`。
- R8. 这些流程在进一步 CLI 暴露前，必须先形成显式结果语义，覆盖 created/overwritten/moved artifact、concept-note side effect、cancellation 与 aggregated errors。
- R9. 这些流程的 happy-path success notice 与 reporter 生命周期必须留在 `src/operations/*HostAdapter.ts`，而不是继续写在 `src/fileUtils.ts`。

**长期命令面收敛**
- R10. 只有在写入型结果语义稳定后，项目才应继续把剩余 `src/main.ts` direct surfaces 收进 operation/host-adapter 形态，或明确把它们归类为 command-only surfaces。
- R11. Diagram save/generate/preview 与 provider connection test 要么获得与其它家族同等级的 operation/result discoverability，要么在文档中明确声明为 automation-grade CLI contract 之外。
- R12. Public CLI 暴露仍必须分阶段推进：先 internal operation contract，再 maintainer-grade invocation，最后才是稳定用户 CLI API。

**文档与卫生**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`、`docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`、`docs/architecture*` 与 `docs/maintainer/notemd-cli-capability-matrix*` 必须逐段更新，对齐上述短中长期方向。
- R14. 交付必须结束在最新 `origin/main`，并附 fresh build/test/audit 证据与 clean worktree。

## 成功标准

- 维护者不需要再做代码考古，就能直接说清楚后三波架构推进顺序：先 `translate/formula`，再 `fileUtils`，最后剩余 direct surfaces。
- 当前文档不再把 batch translation 写成“还缺 host-adapter 抽取”；文档必须准确表述真正问题已经变成 contract/result/side-effect 深度不足。
- 下一轮 planning 可以直接从 `translate/formula` batch 开始，而不需要重新发明 why、ordering 或 scope boundary。

## 范围边界

- 本轮 requirements 不新增 `obsidian-cli` 子命令。
- 本轮 requirements 不强行先造一个覆盖所有 operation family 的全局结果 envelope。
- 本轮 requirements 不尝试在同一批次里重写全部 `src/fileUtils.ts` 写入型流程。
- 本轮 requirements 不清理或复用 dirty root worktree。

## 关键决策

- 先用最小剩余写入型家族验证 contract-enrichment 模式，再动最大的 utility core。
- 先接受 family-specific result object，等至少再有两条家族语义稳定后，再判断是否值得上全局 envelope。
- 把剩余 `src/main.ts` direct surfaces` 视为后续收敛问题，而不是第一问题，因为单纯抽它们并不能显著提升 CLI contract。

## 依赖 / 假设

- 当前事实已通过 `src/main.ts`、`src/translate.ts`、`src/fileUtils.ts`、`src/formulaFixer.ts`、`src/operations/registry.ts`、`docs/architecture.md` 与当前 2026-05 brainstorm 文档核对。
- `content.extract-original-text` 已经提供目标样板：utility core 输出 richer result，成功 notice 交给 host adapter。
- 当前 registry 已覆盖短期批次所需 operation IDs；剩余工作主要是 contract 深度与 host-side effect 上提。

## 未决问题

### 延后到规划阶段
- [影响 R4][Technical] `translate.file` 第一批是否需要显式区分 `created`、`overwritten`、`openedInWorkspace`，还是先用 `outputPath` 加 overwrite flag 就够？
- [影响 R5][Technical] formula-fix 的结果语义应先保持 family-local，还是立即向未来 Mermaid/process 风格靠拢？
- [影响 R10][Technical] 在 `translate/formula` 与 `fileUtils` 之后，下一批更该先做 diagram command surfaces，还是 provider connection test？

## 下一步

-> /ce:plan for the `translate/formula` contract-tightening batch
