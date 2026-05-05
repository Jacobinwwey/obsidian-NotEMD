---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI Write-Heavy Contract Tightening Requirements

## Problem Frame

The previous requirements passes already answered the broad extraction question, and the most recent code now closes the smallest proof batch as well:

- `content.extract-original-text` already returns a structured result and moved its success notice into `src/operations/noteProcessingCommandHostAdapter.ts`
- `translate.file` and `translate.folder-batch` now return structured translation results, and translation success notices now live in the note-processing host adapter
- `formula.fix-file` and `formula.batch-fix` now return structured file/folder results, and formula success notices now live in the utility host adapter
- `src/operations/registry.ts` now exports richer result schemas for those write-heavy families instead of flattening them into path-only or count-only shapes

That means the next write-heavy batch is no longer ambiguous. The real pressure points are now:

- `src/fileUtils.ts`, which still concentrates the heaviest mixed write-side behavior for processed-file saving, title generation, Mermaid repair, duplicate cleanup, and error-log persistence
- `src/main.ts`, which still keeps non-trivial direct command surfaces for provider connection test, diagram save/generation, and Vega-Lite preview
- the temptation to introduce a shared global result envelope before the larger write-heavy family has stabilized

The next durable move is therefore to prove the same contract-tightening pattern on `src/fileUtils.ts`, not to reopen the already-landed translate/formula slice and not to force a universal abstraction yet.

## Comparison Against Prior Requirements

| Prior artifact | What it predicted | What current code now verifies |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | CLI exposure should wait for host-neutral operations | Correct; broad operation coverage exists and the blocking theme is now contract depth |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | The smallest remaining proof batch should be `translate.*` plus `formula.*` before larger write-heavy work | Correct, and now delivered |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | Registry onboarding should complete before broader automation claims | Correct; registry breadth is no longer the highest-leverage theme |

## Approaches Considered

### Approach 1: Tighten `src/fileUtils.ts` next

Move directly into `processFile`, `generateContentForTitle`, `batchGenerateContentForTitles`, `batchFixMermaidSyntaxInFolder`, and `checkAndRemoveDuplicateConceptNotes`, then revisit direct command surfaces after the larger write-heavy semantics stabilize.

- Pros: attacks the highest remaining side-effect concentration directly
- Cons: `src/main.ts` still keeps some direct surfaces for one more round
- Risks: the first `src/fileUtils.ts` slice could expose result-shape inconsistency across multiple behaviors at once
- Best when: the goal is real contract depth rather than visible wrapper movement

### Approach 2: Finish remaining `src/main.ts` direct surfaces first

Prioritize `testLlmConnectionCommand`, diagram save/generate, and preview flows so `src/main.ts` becomes thinner before the larger utility core is tightened.

- Pros: visible entrypoint slimming, less command logic inline
- Cons: weak write-heavy result contracts remain weak, so CLI discoverability still stalls
- Risks: more wrapper movement without reducing the largest side-effect concentration
- Best when: command-entrypoint cleanliness matters more than operation semantics

### Approach 3: Introduce a shared global result envelope now

Define one universal operation result shape before touching `src/fileUtils.ts`, then retrofit translation, formula, process, and generate flows into it.

- Pros: strongest consistency story if it works
- Cons: highest abstraction risk before the largest family is modeled
- Risks: overfitting a generic envelope too early and slowing delivery
- Best when: multiple larger families already share stable semantics, which they do not yet

## Recommended Direction

Choose Approach 1.

The proof slice is already in place for `content.extract-original-text`, `translate.*`, and `formula.*`. The next missing evidence is whether the same host-owned-success plus family-local-result pattern survives the larger `src/fileUtils.ts` family. That is a much more valuable question than another wrapper move or another abstraction layer.

## Requirements

**Current-State Truth**
- R1. Current progress and architecture docs must describe `translate.*` and `formula.*` as delivered proof slices, not as pending work.
- R2. Current docs must name the verified remaining direct surfaces precisely: `testLlmConnectionCommand`, `generateDiagramCommand` plus its save/artifact branches, and `previewExperimentalDiagramCommand` in `src/main.ts`.

**Short-Term Hardening**
- R3. The next P0 implementation batch must prioritize `src/fileUtils.ts` write-heavy flows, especially `processFile`, `generateContentForTitle`, `batchGenerateContentForTitles`, `batchFixMermaidSyntaxInFolder`, and `checkAndRemoveDuplicateConceptNotes`.
- R4. Those flows must return structured results that capture created/overwritten/moved/skipped behavior where relevant, output paths where relevant, aggregated errors, and destructive side effects explicitly enough for maintainer automation.
- R5. Happy-path success notices, reporter lifecycle, and destructive-confirmation wording for those flows must live in host adapters rather than inside `src/fileUtils.ts`.
- R6. `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` must be updated to reflect the richer result schemas from R4-R5, with optional inputs only where they remain deterministic and non-UI-bound.

**Mid-Term Convergence**
- R7. After the `src/fileUtils.ts` batch, the next implementation batch must tighten the remaining direct command surfaces in `src/main.ts`.
- R8. Diagram save/generate/preview and provider connection-test flows must either gain the same operation/result discoverability as other families or be explicitly documented as command-only surfaces outside the automation-grade CLI contract.
- R9. The project should continue to prefer family-local result objects until at least one `src/fileUtils.ts` family and one direct-surface family both demonstrate stable semantics.

**Long-Term Command-Surface Convergence**
- R10. Only after the larger write-heavy semantics stabilize should the project revisit a shared global result envelope or stronger public CLI claims.
- R11. Packaging isolation, maintainer-local semantic verification, and live-runbook hardening remain valid follow-up work, but they must not displace the current operation-contract priority.
- R12. Public CLI exposure must remain phased: internal operation contract first, maintainer-grade invocation second, stable user-facing CLI API last.

**Documentation And Hygiene**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`, `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`, `docs/architecture*`, and `docs/maintainer/notemd-cli-capability-matrix*` must be updated section by section to reflect the delivered proof slice and the new short/mid/long direction above.
- R14. Delivery must end on latest `origin/main` with fresh build/test/audit evidence and a clean worktree.

## Success Criteria

- A maintainer can explain the next three architectural waves without re-reading code archaeology: `src/fileUtils.ts` first, remaining direct surfaces second, packaging/semantic-verification follow-up third.
- No current doc claims that translation or formula contract tightening is still pending.
- The next planning pass can start directly on the `src/fileUtils.ts` batch without rediscovering the why, the ordering, or the scope boundaries.

## Scope Boundaries

- This requirements pass does not add new `obsidian-cli` subcommands.
- This requirements pass does not force a universal result envelope across every operation family yet.
- This requirements pass does not attempt a single-batch rewrite of all remaining direct command surfaces.
- This requirements pass does not clean or reuse the dirty root worktree.

## Key Decisions

- Use the delivered `translate/formula` slice as proof, not as the next work target.
- Prefer family-specific result objects first; defer a shared global envelope until the larger `src/fileUtils.ts` family is modeled successfully.
- Treat remaining `src/main.ts` direct surfaces as the next convergence problem after the larger write-heavy batch, not before it.

## Dependencies / Assumptions

- Current truth was verified against `src/main.ts`, `src/translate.ts`, `src/formulaFixer.ts`, `src/fileUtils.ts`, `src/operations/registry.ts`, and the May 2026 brainstorm documents.
- `content.extract-original-text`, `translate.*`, and `formula.*` already demonstrate the target pattern: richer result object out of the utility core, success notice in the host adapter.
- The current registry already covers the operation IDs needed for the next batch; the remaining work is mostly contract depth and host-side effect relocation.

## Outstanding Questions

### Deferred To Planning
- [Affects R4][Technical] Which `src/fileUtils.ts` families should distinguish `created` vs `overwritten` vs `moved` in the first batch, and which should stay aggregate-only?
- [Affects R5][Technical] Should Mermaid repair and duplicate cleanup converge on a shared result vocabulary immediately, or stay family-local until the batch stabilizes?
- [Affects R8][Technical] After `src/fileUtils.ts`, should the next convergence target be diagram command surfaces or provider connection test?

## Next Steps

-> `/ce:plan` for the `src/fileUtils.ts` contract-tightening batch
