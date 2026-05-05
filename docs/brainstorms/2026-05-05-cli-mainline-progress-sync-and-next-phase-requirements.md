---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI Mainline Progress Sync And Next-Phase Requirements

## Problem Frame

As of May 5, 2026, Notemd's CLI-oriented mainline has moved past the "command trigger only" stage:

- latest remote `main` already includes the operation registry, capability/contract export, and the first diagram / provider / config-profile host-adapter extractions
- this clean-worktree round further moved translation, concept extraction, original-text extraction, and the `extract-concepts-and-generate-titles` composite command into `src/operations/noteProcessingCommandHostAdapter.ts`
- `src/fileUtils.ts` and `src/extractOriginalText.ts` no longer require the concrete `NotemdPlugin` class and now accept narrower runtime contexts
- the composite command had two real defects before this round: outer `isBusy` short-circuited the inner extraction command, and batch generation did not force the configured concept folder. Both are now fixed

This is still not the CLI-ready end state. The remaining gaps have shifted from "too much wrapper code in `src/main.ts`" to three harder boundaries:

1. `src/operations/registry.ts` still models diagnostics / diagram / profile flows only and does not yet include note-processing capabilities.
2. `src/translate.ts`, `src/fileUtils.ts`, and `src/extractOriginalText.ts` still own `App` / `Notice` / `ProgressModal` / vault-write side effects, so the operation contract is not clean enough yet.
3. `src/main.ts` is materially thinner, but it still keeps inline orchestration for duplicate cleanup, batch Mermaid fix, and formula-fix commands.

The next phase therefore should not focus on "more CLI commands". It should turn the extracted host adapters into a discoverable, typed, constrained operation surface.

## Requirements

**Truth sync**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*` and `docs/architecture*` must be updated paragraph-by-paragraph to the May 5, 2026 code reality: translation/extraction host adapters are landed, the composite-command bug is fixed, and the remaining gap is now registry plus utility side-effect boundaries.
- R2. No document may continue to describe "translation/extraction wrappers still live in `src/main.ts`" as a current fact.

**Next-phase priority**
- R3. The next phase must prioritize onboarding note-processing capabilities into `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` before adding new CLI subcommands.
- R4. The first modeled candidates must be:
  - `translate-current-file`
  - `batch-translate-folder`
  - `extract-concepts-current`
  - `extract-concepts-folder`
  - `extract-original-text`
  - `extract-concepts-and-generate-titles`
- R5. Those models must explicitly define `automationLevel`, `requiredContext`, `sideEffectClass`, input schema, result schema, and which bindings remain interactive aliases only.

**Host-side effect tightening**
- R6. The batch-translation path in `src/translate.ts` must stop treating `ProgressModal` as the only valid execution carrier. The next phase must lift reporter injection and host choice upward so CLI and maintainer automation have a non-UI path.
- R7. `src/fileUtils.ts` and `src/extractOriginalText.ts` must keep pulling `Notice`, vault persistence, folder creation, and output-name collision logic toward explicit host effects or result objects instead of leaking UI wording from operation cores.
- R8. Flows that still depend on active file, folder picker, or preview UI must not be mislabeled as `safe`; until contracts are complete they remain `requires-active-file`, `requires-vault-path`, or `interactive-ui`.

**Remaining `src/main.ts` slimming**
- R9. The next extraction order for `src/main.ts` must be fixed as:
  1. duplicate / concept-note cleanup command
  2. batch Mermaid fix
  3. single / batch formula fix
  4. any remaining command that still owns reporter/notice lifecycle inline
- R10. That order must be driven by automation value and host-side effect complexity, not by arbitrary file grouping.

**Mainline and workspace hygiene**
- R11. `main` integration must continue to happen from a clean worktree or clean branch. Do not clean or reuse the dirty root worktree.
- R12. Delivery is only complete when the active execution worktree returns to a clean state with fresh build/test/audit evidence.

## Success Criteria

- A maintainer can read the latest requirements, progress, and architecture docs and distinguish clearly between landed host-adapter extraction and the still-open registry / utility side-effect work.
- Note-processing capabilities are explicitly queued for the next operation-onboarding phase instead of staying as loose command descriptions.
- Documentation no longer reports the old `extractConceptsAndGenerateTitles` behavior; the composite flow now uses the shared host-adapter path and the configured concept folder.
- All mainline sync and code work happens in a clean worktree and passes the full repository verification gate.

## Scope Boundaries

- These requirements do not directly add new `obsidian-cli` subcommands.
- These requirements do not promote write-heavy note-processing flows to stable public CLI APIs yet.
- These requirements do not clean the dirty root `main` worktree.
- These requirements do not force preview/modal-driven flows into the capability manifest as `safe`.

## Key Decisions

- Finish note-processing registry onboarding first, then revisit deeper CLI transport expansion.
- Host-adapter extraction is now mature enough that repeating `src/main.ts` wrapper moves would be low leverage; the next real problems are schema, capability, and side-effect boundaries.
- The composite-command bug proved that "delegator extraction only" is insufficient; shared busy-state and chained-command behavior must be validated explicitly.

## Dependencies And Assumptions

- The clean worktree is already based on the latest remote `main` and already contains the registry, capability-contract, and first provider/diagram/config-profile extraction work.
- `src/operations/noteProcessingCommandHostAdapter.ts` now carries the process / generate / research / translate / extract command wrappers for note-processing flows.
- The capability registry still does not include note-processing operation definitions, and that remains the primary structural gap.

## Open Questions

### Deferred To Planning
- [R3][Technical] Should note-processing operation IDs be normalized by task family or modeled one-to-one from current commands?
- [R6][Technical] Should `batchTranslateFolder()` be refactored around injected reporters, or should it first gain a non-UI branch?
- [R7][Technical] Should original-text extraction and concept-extraction file writes be normalized into result objects before further CLI exposure?

## Next Step

-> Move into the next implementation plan: note-processing registry onboarding, translation/extraction utility side-effect tightening, and the next `src/main.ts` command-host slimming slice.
