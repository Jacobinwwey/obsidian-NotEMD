---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI Write-Heavy Contract Tightening Requirements

> Update (2026-05-05, later same day): the first direct-surface wrapper batch is now landed. `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` now delegate through host adapters and return structured results. The open problem moved one layer deeper to diagram/provider command-core convergence.
>
> Update (2026-05-05, later later same day): the registry/capability/contract path now also exports typed operation surfaces for `provider.connection.test` and `diagram.preview`. The remaining question is no longer whether those seams should exist, but whether deeper save/artifact branches under the current diagram wrappers deserve additional typed boundaries.
>
> Update (2026-05-05, still later): `src/operations/diagramCommandExecution.ts` now owns Mermaid-save and artifact-save execution below `src/main.ts`, and `diagram.generate` now exports `outputPath` and `previewOpened` in its typed result schema. The remaining question has narrowed further to whether the internal save/artifact branches under that operation should split into additional typed boundaries.

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

- `src/main.ts`, which now mostly keeps thin diagram/provider delegators while the remaining deeper question sits inside the operation layer for diagram save/generation follow-through and Vega-Lite preview
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
- R2. Current docs must name the verified remaining deeper seams precisely: the internal save/artifact follow-through now living in `src/operations/diagramCommandExecution.ts`, plus the already-landed `provider.connection.test` / `diagram.preview` typed wrappers and the richer `diagram.generate` result shape.

**Short-Term Hardening**
- R3. The next P0 implementation batch must prioritize the remaining deeper diagram/provider command core in `src/operations/diagramCommandExecution.ts`, especially any save/artifact follow-through that still sits below the already-landed wrappers.
- R4. Those deeper seams must either gain structured results and explicit side-effect boundaries comparable to the write-heavy proof set, or be documented deliberately as internal command-core branches beneath existing typed operations.
- R5. Success notices, preview-only messaging, and any remaining save/open branching for those deeper seams must keep converging toward host adapters or operation-layer boundaries rather than drifting back inline into `src/main.ts`.
- R6. `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` must be extended only where the deeper save/artifact seams become deterministic enough for richer typed invocation contracts; `diagram.preview` should remain `interactive-ui`, `provider.connection.test` should remain `safe`, and `diagram.generate` should already describe saved-output follow-through through `outputPath` / `previewOpened`.

**Mid-Term Convergence**
- R7. After the deeper diagram/provider command-core batch, the next implementation batch must shift toward packaging isolation and maintainer-local semantic verification hardening.
- R8. Diagram save/generate/preview and provider connection-test flows must either deepen the current operation/result discoverability beneath existing wrappers or be explicitly documented as internal command-core branches outside the automation-grade CLI contract.
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
- Prefer family-specific result objects first; defer a shared global envelope until the larger `src/fileUtils.ts` family and at least one deeper diagram/provider seam are modeled successfully.
- Treat remaining `src/main.ts` diagram/provider command-core branches as the next convergence problem after the larger write-heavy batch, not before it.

## Dependencies / Assumptions

- Current truth was verified against `src/main.ts`, `src/translate.ts`, `src/formulaFixer.ts`, `src/fileUtils.ts`, `src/operations/registry.ts`, and the May 2026 brainstorm documents.
- `content.extract-original-text`, `translate.*`, `formula.*`, `mermaid.batch-fix`, `concept.dedupe`, and the process/generate sub-slice already demonstrate the target pattern: richer result object out of the utility core, success/no-file/confirmation semantics in the host adapter.
- The current registry already covers the operation IDs needed for the next batch, including `provider.connection.test`, `diagram.preview`, and the richer `diagram.generate` result fields; the remaining work is mostly deeper contract depth and host-side effect relocation beneath those typed seams.

## Outstanding Questions

### Deferred To Planning
- [Affects R4][Technical] Which deeper diagram save/artifact branches inside `src/operations/diagramCommandExecution.ts` are deterministic enough to deserve additional typed operation boundaries, and which should remain internal beneath `diagram.generate` / `diagram.preview`?
- [Affects R5][Technical] Should the first deeper seam now focus on save-Mermaid follow-through, artifact-save follow-through, or a minimal shared boundary below both wrappers?
- [Affects R8][Technical] After the direct-surface batch, is workflow/settings packaging or maintainer semantic verification the higher-leverage follow-up?

## Next Steps

-> `/ce:plan` for the remaining direct-surface batch
