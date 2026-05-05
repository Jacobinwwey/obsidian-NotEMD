---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI Mainline Progress Sync And Next-Phase Requirements

## Problem Frame

As of May 5, 2026, Notemd's CLI-oriented mainline is no longer blocked on broad operation extraction:

- latest remote `main` already includes the operation registry, capability/contract export, and the first diagram / provider / config-profile host-adapter extractions
- the clean-worktree round already moved translation, concept extraction, original-text extraction, and the `extract-concepts-and-generate-titles` composite command into `src/operations/noteProcessingCommandHostAdapter.ts`
- the same round also landed note-processing registry onboarding, the first utility-command registry batch, the long-tail process / generate / research registry batch, and the selection/export registry batch
- `src/fileUtils.ts` and `src/extractOriginalText.ts` no longer require the concrete `NotemdPlugin` class and now accept narrower runtime contexts
- the composite command defects are already fixed: outer `isBusy` no longer short-circuits the inner extraction flow, and batch generation now respects the configured concept folder
- the latest follow-up slice has now completed the smallest remaining write-heavy proof batch too:
  - `translateFile()` returns `TranslateFileResult`
  - `batchTranslateFolder()` returns `BatchTranslateFolderResult` with per-file outputs and aggregated errors
  - `fixFormulaFormatsInFile()` returns `FormulaFixFileResult`
  - `batchFixFormulaFormatsInFolder()` returns `BatchFormulaFixResult` with per-file results, aggregated errors, and `replacementCount`
  - translation and formula success notices now live in `src/operations/noteProcessingCommandHostAdapter.ts` and `src/operations/utilityCommandHostAdapter.ts`, not inside the utility cores
  - `src/operations/registry.ts` now exports richer result schemas for `translate.*` and `formula.*`

The remaining problem is now narrower and harder:

1. `src/fileUtils.ts` is the largest remaining write-heavy core. Processed-file saving, title generation, Mermaid repair, duplicate cleanup, and error-log persistence still expose uneven result semantics and mixed host side effects.
2. `src/main.ts` still owns the highest-value remaining direct command surfaces: `testLlmConnectionCommand`, `generateDiagramCommand` plus its save/artifact branches, and `previewExperimentalDiagramCommand`.
3. Packaging isolation and maintainer-local semantic verification still matter, but they are now downstream of operation-contract hardening rather than blockers for it.

The next phase therefore should not focus on "more CLI commands" and should no longer focus on `translate/formula` as an open batch. The next durable move is to harden the larger `src/fileUtils.ts` family first, then finish the remaining direct command surfaces.

## Requirements

**Truth sync**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`, `docs/architecture*`, and `docs/maintainer/notemd-cli-capability-matrix*` must be aligned to the May 5, 2026 code reality: `translate.*` and `formula.*` now expose structured results and host-owned success notices.
- R2. No document may continue to describe `translate/formula` contract tightening as merely planned or in-progress.

**Next-phase priority**
- R3. The next implementation order is now fixed as `src/fileUtils.ts` write-heavy families -> remaining direct command surfaces in `src/main.ts` -> packaging / semantic-verification convergence`.
- R4. The first landed registry-backed operation batches now include:
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
- R5. The next contract-tightening batch must now target the larger `src/fileUtils.ts` flows, especially `processFile`, `generateContentForTitle`, `batchGenerateContentForTitles`, `batchFixMermaidSyntaxInFolder`, and `checkAndRemoveDuplicateConceptNotes`, with richer result semantics and explicit aggregated errors.

**Host-side effect tightening**
- R6. `translate.*`, `formula.*`, and `content.extract-original-text` now act as proof slices. Preserve their family-local result objects and host-owned success semantics unless at least one larger `src/fileUtils.ts` family demonstrates the same stability.
- R7. `src/fileUtils.ts` must keep moving `Notice`, vault persistence, folder creation, output collision handling, and destructive-confirmation semantics toward explicit host effects or structured result objects instead of leaking UI wording from operation cores.
- R8. Flows that still depend on active file, folder picker, destructive confirmation, or preview UI must not be mislabeled as `safe`; until contracts are complete they remain `requires-active-file`, `interactive-ui`, or another constrained level.

**Remaining `src/main.ts` slimming**
- R9. Note-processing and utility host-adapter extraction is now broad enough that reopening those families would be low leverage. The next `src/main.ts` slimming slice should target only the remaining high-value direct surfaces.
- R10. Diagram save/generate/preview and provider connection-test flows must either gain the same discoverable operation/result boundary as the extracted families or be documented explicitly as command-only surfaces.

**Mainline and workspace hygiene**
- R11. `main` integration must continue to happen from a clean worktree or clean branch. Do not clean or reuse the dirty root worktree.
- R12. Delivery is only complete when the active execution worktree returns to a clean state with fresh build/test/audit evidence.

## Success Criteria

- A maintainer can read the latest requirements, progress, and architecture docs and distinguish clearly between the delivered proof slice (`translate.*`, `formula.*`, `content.extract-original-text`) and the still-open `src/fileUtils.ts` / direct-surface work.
- Documentation no longer reports the old execution order; the next wave is now `src/fileUtils.ts` first and direct surfaces second.
- All mainline sync and code work happens in a clean worktree and passes the full repository verification gate.

## Scope Boundaries

- These requirements do not add new `obsidian-cli` subcommands directly.
- These requirements do not promote write-heavy note-processing flows to stable public CLI APIs yet.
- These requirements do not force a global result envelope across every operation family yet.
- These requirements do not clean the dirty root `main` worktree.

## Key Decisions

- The `translate/formula` contract-tightening proof slice is now delivered; reopening it before the larger `src/fileUtils.ts` batch would be churn, not progress.
- Family-local result objects remain the preferred modeling choice for now. A shared global envelope is still premature.
- Direct-surface slimming remains important, but it follows the next write-heavy batch because wrapper movement alone would not improve CLI contracts enough.

## Dependencies And Assumptions

- The clean worktree is already based on the latest remote `main` and already contains the registry, capability-contract, and first provider/diagram/config-profile extraction work.
- `src/operations/noteProcessingCommandHostAdapter.ts` now carries the process / generate / research / translate / extract command wrappers for note-processing flows.
- `src/operations/utilityCommandHostAdapter.ts` now carries duplicate cleanup, Mermaid batch fix, and formula-fix command wrappers.
- The capability registry already covers note-processing, process/generate/research, utility, selection, and export operation batches; the primary structural gap has moved to larger write-heavy result semantics plus the remaining direct surfaces.

## Open Questions

### Deferred To Planning
- [R5][Technical] Which `src/fileUtils.ts` result families should distinguish `created`, `overwritten`, `moved`, and `skipped` explicitly in the first batch, and which can remain aggregate-only?
- [R7][Technical] Should Mermaid repair and duplicate cleanup keep family-local result objects, or should they converge on a shared write-heavy result vocabulary after the first `src/fileUtils.ts` slice lands?
- [R10][Technical] After the `src/fileUtils.ts` batch, should the next convergence target be diagram command surfaces or provider connection-test flows?

## Next Step

-> Move into `/ce:plan` for the `src/fileUtils.ts` contract-tightening batch.
