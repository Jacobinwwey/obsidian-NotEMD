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
- the current follow-up slice has now landed the first `src/fileUtils.ts` contract-tightening pass too:
  - `processFile()` returns `ProcessFileResult`
  - `runProcessWithNotemdCommandWithHost()` now returns that structured file result directly
  - `runProcessFolderWithNotemdCommandWithHost()` now returns `BatchProcessFolderResult` with `savedCount`, `fileResults`, `errors`, and `cancelled`
  - `generateContentForTitle()` returns `GenerateContentForTitleResult`
  - `batchGenerateContentForTitles()` returns `BatchGenerateContentForTitlesResult` with complete-folder move semantics and aggregated errors
  - the no-file batch-generation notice now lives in `src/operations/noteProcessingCommandHostAdapter.ts`, not inside `src/fileUtils.ts`
- the current follow-up slice has now landed the remaining `src/fileUtils.ts` tail as well:
  - `batchFixMermaidSyntaxInFolder()` returns `BatchMermaidFixResult`
  - `checkAndRemoveDuplicateConceptNotes()` returns `ConceptDedupeResult`
  - duplicate-deletion confirmation is now injected from `src/operations/utilityCommandHostAdapter.ts`
  - batch Mermaid no-file notice now also lives in `src/operations/utilityCommandHostAdapter.ts`
  - `src/operations/registry.ts` now exports richer result schemas for `mermaid.batch-fix` and `concept.dedupe`

The remaining problem is now narrower and harder:

1. The previous highest-value public direct command surfaces are no longer inlined. `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` now delegate through host adapters and return structured results.
2. The real remaining gap is one layer deeper: substantive save/artifact execution now lives in `src/operations/diagramCommandExecution.ts`, and the typed contract decision for `diagram.preview` plus provider connection-test is already landed. The remaining question is how much deeper save/artifact branch contract depth should move below the current `diagram.generate` wrapper-result shape now that the envelope fields (`kind`, `executionMode`, `sourcePath`, `actionLabel`, `operationInput`, `generation`, `outputPath`, `previewOpened`) are exported too.
3. Selection/export and workflow/settings surfaces still need further contract depth beyond command-trigger parity.
4. Packaging isolation and maintainer-local semantic verification still matter, but they are now downstream of the deeper diagram/provider contract decision rather than blockers for it.

The next phase therefore should not focus on "more CLI commands" and should no longer focus on any write-heavy `src/fileUtils.ts` batch as open work. The next durable move is to finish the deeper diagram/provider command-core convergence first, then converge packaging/semantic-verification follow-up work.

## Requirements

**Truth sync**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`, `docs/architecture*`, and `docs/maintainer/notemd-cli-capability-matrix*` must be aligned to the May 5, 2026 code reality: process/generate/translate/formula/mermaid/dedupe flows now expose structured results, and the relevant success/no-file/confirmation semantics now live in host adapters.
- R2. No document may continue to describe any write-heavy `src/fileUtils.ts` contract pass as merely planned or in-progress.

**Next-phase priority**
- R3. The next implementation order is now fixed as `deeper diagram/provider command-core convergence -> packaging / semantic-verification convergence -> broader CLI/public-surface refinement`.
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
- R5. The next contract-tightening batch must now target the deeper diagram/provider command core, especially the internal save/artifact branches now housed in `src/operations/diagramCommandExecution.ts`, and any richer branch contract depth beyond the newly-landed `diagram.generate` wrapper envelope plus the `diagram.preview` / `provider.connection.test` schemas, while keeping the wrapper batch and write-heavy proof set stable, documented, and registry-aligned.

**Host-side effect tightening**
- R6. `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, `mermaid.batch-fix`, `concept.dedupe`, `translate.*`, `formula.*`, and `content.extract-original-text` now act as proof slices. Preserve their family-local result objects and host-owned success/no-file/confirmation semantics while the remaining direct surfaces catch up.
- R7. `src/fileUtils.ts` must keep moving `Notice`, vault persistence, folder creation, output collision handling, and destructive-confirmation semantics toward explicit host effects or structured result objects instead of leaking UI wording from operation cores.
- R8. Flows that still depend on active file, folder picker, destructive confirmation, or preview UI must not be mislabeled as `safe`; until contracts are complete they remain `requires-active-file`, `interactive-ui`, or another constrained level.

**Remaining `src/main.ts` slimming**
- R9. Note-processing and utility host-adapter extraction is now broad enough that reopening those families would be low leverage. The next `src/main.ts` slimming slice should target only the remaining deeper diagram/provider helpers.
- R10. Diagram save/generate/preview and provider connection-test flows must either gain the same discoverable operation/result boundary as the extracted families or be documented explicitly as command-only surfaces. The public wrappers, typed `diagram.preview` / `provider.connection.test` contracts, and the deeper `diagram.generate` wrapper-result fields are now landed; the open question is whether the remaining save/artifact internals deserve additional typed boundaries.

**Mainline and workspace hygiene**
- R11. `main` integration must continue to happen from a clean worktree or clean branch. Do not clean or reuse the dirty root worktree.
- R12. Delivery is only complete when the active execution worktree returns to a clean state with fresh build/test/audit evidence.

## Success Criteria

- A maintainer can read the latest requirements, progress, and architecture docs and distinguish clearly between the delivered write-heavy proof set, the now-landed direct-surface wrapper batch, and the still-open deeper diagram/provider contract work.
- Documentation no longer reports the old execution order; the next wave is now deeper diagram/provider contract work first and packaging/semantic-verification second.
- All mainline sync and code work happens in a clean worktree and passes the full repository verification gate.

## Scope Boundaries

- These requirements do not add new `obsidian-cli` subcommands directly.
- These requirements do not promote write-heavy note-processing flows to stable public CLI APIs yet.
- These requirements do not force a global result envelope across every operation family yet.
- These requirements do not clean the dirty root `main` worktree.

## Key Decisions

- The full write-heavy contract-tightening batch is now delivered, and the first direct-surface wrapper batch is now delivered too; reopening either before the deeper diagram/provider contract work would be churn, not progress.
- Family-local result objects remain the preferred modeling choice for now. A shared global envelope is still premature.
- Direct-surface slimming remains important, but it follows the next write-heavy batch because wrapper movement alone would not improve CLI contracts enough.

## Dependencies And Assumptions

- The clean worktree is already based on the latest remote `main` and already contains the registry, capability-contract, and first provider/diagram/config-profile extraction work.
- `src/operations/noteProcessingCommandHostAdapter.ts` now carries the process / generate / research / translate / extract command wrappers for note-processing flows.
- `src/operations/utilityCommandHostAdapter.ts` now carries duplicate cleanup, Mermaid batch fix, and formula-fix command wrappers.
- The capability registry already covers note-processing, process/generate/research, utility, selection, and export operation batches; the primary structural gap has moved to the deeper diagram/provider contract decision plus the packaging/semantic-verification follow-up work.

## Open Questions

### Deferred To Planning
- [R5][Technical] Should the next deeper contract batch split the save/artifact execution that now lives in `src/operations/diagramCommandExecution.ts` into additional typed operation boundaries, or keep those branches internal beneath `diagram.generate` / `diagram.preview`?
- [R7][Technical] Which direct surfaces should become registry-backed operations versus remain intentionally command-only?
- [R10][Technical] After the direct-surface batch, should workflow/settings packaging or maintainer semantic verification be the next higher-leverage follow-up?

## Next Step

-> Move into `/ce:plan` for the deeper diagram/provider contract batch.
