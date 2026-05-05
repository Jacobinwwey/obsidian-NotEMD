---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI Write-Heavy Contract Tightening Requirements

> Update (2026-05-05, later same day): the first direct-surface wrapper batch is now landed. `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` now delegate through host adapters and return structured results. The open problem has moved one layer deeper to diagram/provider command-core convergence and the typed-contract decision for preview/provider-test exposure.

## Problem Frame

The previous requirements passes already answered the broad extraction question, and the most recent code now closes the smallest proof batch as well:

- `content.extract-original-text` already returns a structured result and moved its success notice into `src/operations/noteProcessingCommandHostAdapter.ts`
- `translate.file` and `translate.folder-batch` now return structured translation results, and translation success notices now live in the note-processing host adapter
- `formula.fix-file` and `formula.batch-fix` now return structured file/folder results, and formula success notices now live in the utility host adapter
- `src/operations/registry.ts` now exports richer result schemas for those write-heavy families instead of flattening them into path-only or count-only shapes
- the first `src/fileUtils.ts` process/generate sub-slice is now landed too:
  - `processFile()` returns `ProcessFileResult`
  - `generateContentForTitle()` returns `GenerateContentForTitleResult`
  - `batchGenerateContentForTitles()` returns `BatchGenerateContentForTitlesResult`
  - `runProcessFolderWithNotemdCommandWithHost()` now returns `BatchProcessFolderResult` with `savedCount`, `errors`, and `cancelled`
  - the no-file batch-generation notice now lives in the host adapter rather than the utility core
- the remaining `src/fileUtils.ts` tail is now landed too:
  - `batchFixMermaidSyntaxInFolder()` returns `BatchMermaidFixResult`
  - `checkAndRemoveDuplicateConceptNotes()` returns `ConceptDedupeResult`
  - Mermaid no-file handling and duplicate-deletion confirmation now live in the utility host adapter rather than the utility core
  - `src/operations/registry.ts` now exports richer result schemas for `mermaid.batch-fix` and `concept.dedupe`

That means the write-heavy batch is no longer open work. The real pressure points are now:

- `src/main.ts`, which still keeps non-trivial direct command surfaces for provider connection test, diagram save/generation, and Vega-Lite preview
- selection/export and workflow/settings surfaces, which still have shallower contract depth than the write-heavy proof set
- the temptation to introduce a shared global result envelope before the larger write-heavy family has stabilized

The next durable move is therefore to leave the write-heavy family closed, move into the remaining direct command surfaces, and only then revisit broader abstractions.

## Comparison Against Prior Requirements

| Prior artifact | What it predicted | What current code now verifies |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | CLI exposure should wait for host-neutral operations | Correct; broad operation coverage exists and the blocking theme is now contract depth |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | The smallest remaining proof batch should be `translate.*` plus `formula.*` before larger write-heavy work | Correct, and now delivered |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | Registry onboarding should complete before broader automation claims | Correct; registry breadth is no longer the highest-leverage theme |

## Approaches Considered

### Approach 1: Keep reopening the write-heavy family

Return to Mermaid repair or duplicate cleanup for another result-shape pass before touching the remaining direct command surfaces.

- Pros: maximizes local consistency inside one family
- Cons: reopens a batch that is already delivering structured results, host-owned user-surface semantics, and registry coverage
- Risks: churn without moving the mainline bottleneck
- Best when: the current write-heavy batch is still incomplete, which it no longer is

### Approach 2: Finish remaining `src/main.ts` direct surfaces first

Prioritize `testLlmConnectionCommand`, diagram save/generate, and preview flows so `src/main.ts` becomes thinner now that the write-heavy family is no longer the blocker.

- Pros: attacks the real remaining bottleneck
- Cons: requires choosing carefully between diagram surfaces and provider connection-test as the first direct-surface seam
- Risks: diagram and preview flows have mixed save/open side effects and are easier to overgeneralize than batch utilities
- Best when: command-entrypoint cleanliness matters more than operation semantics

### Approach 3: Introduce a shared global result envelope now

Define one universal operation result shape before touching `src/fileUtils.ts`, then retrofit translation, formula, process, and generate flows into it.

- Pros: strongest consistency story if it works
- Cons: highest abstraction risk before the largest family is modeled
- Risks: overfitting a generic envelope too early and slowing delivery
- Best when: multiple larger families already share stable semantics, which they do not yet

## Recommended Direction

Choose Approach 2.

The proof slice is already in place for `content.extract-original-text`, `translate.*`, `formula.*`, and the full write-heavy `src/fileUtils.ts` family. The next missing evidence is how far the remaining direct command surfaces can be pushed toward the same host-neutral operation/result boundary without damaging product behavior.

## Requirements

**Current-State Truth**
- R1. Current progress and architecture docs must describe the full write-heavy family as delivered proof, not as pending work.
- R2. Current docs must name the verified remaining direct surfaces precisely: `testLlmConnectionCommand`, `generateDiagramCommand` plus its save/artifact branches, and `previewExperimentalDiagramCommand` in `src/main.ts`.

**Short-Term Hardening**
- R3. The next P0 implementation batch must prioritize the remaining direct command surfaces in `src/main.ts`, especially `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand`.
- R4. Those surfaces must either gain structured results and explicit side-effect boundaries comparable to the write-heavy proof set, or be documented deliberately as command-only surfaces.
- R5. Success notices, preview-only messaging, and any remaining save/open branching for those surfaces must keep converging toward host adapters rather than staying inline in `src/main.ts`.
- R6. `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` must be extended only where the new direct-surface seams become deterministic enough for typed invocation contracts.

**Mid-Term Convergence**
- R7. After the direct-surface batch, the next implementation batch must shift toward packaging isolation and maintainer-local semantic verification hardening.
- R8. Diagram save/generate/preview and provider connection-test flows must either gain the same operation/result discoverability as other families or be explicitly documented as command-only surfaces outside the automation-grade CLI contract.
- R9. The project should continue to prefer family-local result objects until at least one direct-surface family also demonstrates stable semantics.

**Long-Term Command-Surface Convergence**
- R10. Only after the larger write-heavy semantics stabilize should the project revisit a shared global result envelope or stronger public CLI claims.
- R11. Packaging isolation, maintainer-local semantic verification, and live-runbook hardening remain valid follow-up work, but they must not displace the current operation-contract priority.
- R12. Public CLI exposure must remain phased: internal operation contract first, maintainer-grade invocation second, stable user-facing CLI API last.

**Documentation And Hygiene**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`, `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`, `docs/architecture*`, and `docs/maintainer/notemd-cli-capability-matrix*` must be updated section by section to reflect the delivered proof slice and the new short/mid/long direction above.
- R14. Delivery must end on latest `origin/main` with fresh build/test/audit evidence and a clean worktree.

## Success Criteria

- A maintainer can explain the next three architectural waves without re-reading code archaeology: remaining direct surfaces first, packaging/semantic-verification follow-up second, broader CLI/public-surface decisions third.
- No current doc claims that any write-heavy contract-tightening slice is still pending.
- The next planning pass can start directly on the direct-surface batch without rediscovering the why, the ordering, or the scope boundaries.

## Scope Boundaries

- This requirements pass does not add new `obsidian-cli` subcommands.
- This requirements pass does not force a universal result envelope across every operation family yet.
- This requirements pass does not attempt a single-batch rewrite of all remaining direct command surfaces.
- This requirements pass does not clean or reuse the dirty root worktree.

## Key Decisions

- Use the delivered write-heavy slices as proof, not as the next work target.
- Prefer family-specific result objects first; defer a shared global envelope until the larger `src/fileUtils.ts` family is modeled successfully.
- Treat remaining `src/main.ts` direct surfaces as the next convergence problem after the larger write-heavy batch, not before it.

## Dependencies / Assumptions

- Current truth was verified against `src/main.ts`, `src/translate.ts`, `src/formulaFixer.ts`, `src/fileUtils.ts`, `src/operations/registry.ts`, and the May 2026 brainstorm documents.
- `content.extract-original-text`, `translate.*`, `formula.*`, `mermaid.batch-fix`, `concept.dedupe`, and the process/generate sub-slice already demonstrate the target pattern: richer result object out of the utility core, success/no-file/confirmation semantics in the host adapter.
- The current registry already covers the operation IDs needed for the next batch; the remaining work is mostly contract depth and host-side effect relocation.

## Outstanding Questions

### Deferred To Planning
- [Affects R4][Technical] Which direct surfaces are deterministic enough to deserve registry-backed typed results first, and which should remain command-only?
- [Affects R5][Technical] Should the first direct-surface seam be diagram save/generate/preview, provider connection-test, or a minimal shared adapter boundary across both?
- [Affects R8][Technical] After the direct-surface batch, is workflow/settings packaging or maintainer semantic verification the higher-leverage follow-up?

## Next Steps

-> `/ce:plan` for the remaining direct-surface batch
