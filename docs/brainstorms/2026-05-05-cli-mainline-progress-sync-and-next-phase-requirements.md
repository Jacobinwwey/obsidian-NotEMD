---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI Mainline Progress Sync And Next-Phase Requirements

## Problem Frame

As of May 5, 2026, Notemd's CLI-oriented mainline has moved past the "command trigger only" stage:

- latest remote `main` already includes the operation registry, capability/contract export, and the first diagram / provider / config-profile host-adapter extractions
- this clean-worktree round further moved translation, concept extraction, original-text extraction, and the `extract-concepts-and-generate-titles` composite command into `src/operations/noteProcessingCommandHostAdapter.ts`
- the same clean-worktree round also landed note-processing registry onboarding, the first utility-command registry batch, the long-tail process / generate / research registry batch, injected batch-translation reporters, output-path returns for original-text extraction, and a new `src/operations/utilityCommandHostAdapter.ts` for duplicate checks / duplicate cleanup / Mermaid fix / formula fix command orchestration
- this follow-up slice also closed the remaining selection/export registry gap: `editor.create-link-and-generate`, `provider.profile.export`, `provider.profile.import`, `cli.capability-manifest.export`, and `cli.invocation-contract.export` now participate in the shared registry/capability/contract surface
- the next follow-up slice has now started contract enrichment too: `extractOriginalText()` returns a richer machine-readable result object, and the success notice moved out of the utility core into `src/operations/noteProcessingCommandHostAdapter.ts`
- `src/fileUtils.ts` and `src/extractOriginalText.ts` no longer require the concrete `NotemdPlugin` class and now accept narrower runtime contexts
- the composite command had two real defects before this round: outer `isBusy` short-circuited the inner extraction command, and batch generation did not force the configured concept folder. Both are now fixed

This is still not the CLI-ready end state. The remaining gaps have shifted again from "too much wrapper code in `src/main.ts`" to three harder boundaries:

1. `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` now cover the process / generate / research / translation / extraction / utility / selection / export command families, but many write-heavy operations still expose only shallow schemas rather than richer machine-readable result semantics. `content.extract-original-text` is now the first concrete example of that enrichment path.
2. `src/translate.ts`, `src/fileUtils.ts`, `src/extractOriginalText.ts`, and `src/formulaFixer.ts` still own `App` / `Notice` / vault-write side effects, so the operation contract is cleaner than before but still not host-neutral.
3. `src/main.ts` is materially thinner, but a long tail of direct execution surfaces and sidebar-specific read paths still remains after the note-processing and utility-host extraction rounds.

The next phase therefore should not focus on "more CLI commands". It should turn the extracted host adapters into a discoverable, typed, constrained operation surface.

## Requirements

**Truth sync**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*` and `docs/architecture*` must be updated paragraph-by-paragraph to the May 5, 2026 code reality: translation/extraction host adapters are landed, the composite-command bug is fixed, and the remaining gap is now registry plus utility side-effect boundaries.
- R2. No document may continue to describe "translation/extraction wrappers still live in `src/main.ts`" as a current fact.

**Next-phase priority**
- R3. The next phase must prioritize tightening the already-onboarded operation contracts, side-effect seams, and remaining direct-read command surfaces before adding new CLI subcommands.
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
- R5. The next contract-tightening batch must extend the same modeling discipline from mere coverage into richer result semantics for write-heavy operations, optional path/context overrides where justified, and explicit alias policy for any remaining direct-read/sidebar surfaces.

**Host-side effect tightening**
- R6. The batch-translation path in `src/translate.ts` has now stopped treating `ProgressModal` as the only valid execution carrier by accepting injected reporters; the next phase must continue lifting notice shaping and result semantics upward so CLI and maintainer automation have a cleaner non-UI path.
- R7. `src/fileUtils.ts`, `src/extractOriginalText.ts`, and `src/formulaFixer.ts` must keep pulling `Notice`, vault persistence, folder creation, and output-name collision logic toward explicit host effects or result objects instead of leaking UI wording from operation cores.
- R8. Flows that still depend on active file, folder picker, or preview UI must not be mislabeled as `safe`; until contracts are complete they remain `requires-active-file`, `folder-selection`, or `interactive-ui`.

**Remaining `src/main.ts` slimming**
- R9. The current-file duplicate check, duplicate / concept-note cleanup, batch Mermaid fix, and single / batch formula fix command families are now extracted into `src/operations/utilityCommandHostAdapter.ts`.
- R10. The next `src/main.ts` slimming slice should therefore target the remaining long-tail command surfaces that still own reporter/notice lifecycle inline, rather than reopening already-extracted families.

**Mainline and workspace hygiene**
- R11. `main` integration must continue to happen from a clean worktree or clean branch. Do not clean or reuse the dirty root worktree.
- R12. Delivery is only complete when the active execution worktree returns to a clean state with fresh build/test/audit evidence.

## Success Criteria

- A maintainer can read the latest requirements, progress, and architecture docs and distinguish clearly between landed host-adapter extraction and the still-open registry / utility side-effect work.
- Process / generate / research / translation / extraction / utility / selection / export capabilities are now registry-backed instead of staying as loose command descriptions, and the next operation phase is now narrowed to deeper result/side-effect boundaries plus the remaining direct-read/sidebar surfaces.
- Documentation no longer reports the old `extractConceptsAndGenerateTitles` behavior; the composite flow now uses the shared host-adapter path and the configured concept folder.
- All mainline sync and code work happens in a clean worktree and passes the full repository verification gate.

## Scope Boundaries

- These requirements do not directly add new `obsidian-cli` subcommands.
- These requirements do not promote write-heavy note-processing flows to stable public CLI APIs yet.
- These requirements do not clean the dirty root `main` worktree.
- These requirements do not force preview/modal-driven flows into the capability manifest as `safe`.

## Key Decisions

- Note-processing registry onboarding, the first utility registry batch, the long-tail process / generate / research registry batch, and the selection/export registry batch are now complete; the next highest-leverage work is deeper result/side-effect cleanup.
- Host-adapter extraction is now mature enough that repeating `src/main.ts` wrapper moves blindly would be low leverage; the next real problems are schema, capability, and side-effect boundaries.
- The composite-command bug proved that "delegator extraction only" is insufficient; shared busy-state and chained-command behavior must be validated explicitly.

## Dependencies And Assumptions

- The clean worktree is already based on the latest remote `main` and already contains the registry, capability-contract, and first provider/diagram/config-profile extraction work.
- `src/operations/noteProcessingCommandHostAdapter.ts` now carries the process / generate / research / translate / extract command wrappers for note-processing flows.
- The capability registry now includes note-processing, process/generate/research, utility, selection, and export operation batches; the primary structural gap has moved to richer result semantics and deeper host-side effect cleanup.

## Open Questions

### Deferred To Planning
- [R5][Technical] Should the remaining long-tail command IDs be normalized by task family before onboarding them into the registry?
- [R6][Technical] Should `batchTranslateFolder()` stop emitting success notices directly once the host layer owns more result semantics?
- [R7][Technical] Should original-text extraction, concept-note creation, and formula-fix file writes be normalized into richer result objects before further CLI exposure?

## Next Step

-> Move into the next implementation plan: deeper utility side-effect tightening, richer write-heavy contracts, and the next remaining `src/main.ts` / sidebar command-host slimming slice.
