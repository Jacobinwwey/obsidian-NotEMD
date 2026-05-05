---
date: 2026-05-05
topic: cli-write-heavy-contract-tightening
---

# CLI Write-Heavy Contract Tightening Requirements

## Problem Frame

The last three CLI-oriented requirements passes already resolved the broad extraction questions:

- `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` established that operation-first boundary work must come before public CLI exposure
- `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` narrowed the open gap from registry coverage to result/side-effect/direct-surface hardening
- the current code on `main` now proves that the project can enrich one write-heavy flow end to end: `content.extract-original-text` already returns a structured result and moved its success notice to `src/operations/noteProcessingCommandHostAdapter.ts`

What remains is no longer ambiguous. Verified current code shows three concrete pressure points:

- `src/translate.ts` still owns `ProgressModal` fallback, success `Notice`, folder-creation fallback, and path-only result semantics
- `src/fileUtils.ts` still concentrates the heaviest write-side behavior for processed-file saving, title generation, concept-note creation, duplicate cleanup, Mermaid repair, and error-log persistence
- `src/main.ts` still keeps non-trivial direct command surfaces for provider connection test, diagram save/generation, and Vega-Lite preview

The next durable move is therefore not "add more commands" and not "finish every remaining wrapper move first". The next move is to harden the write-heavy operation contracts in an order that reduces carrying cost instead of creating a premature global abstraction.

## Comparison Against Prior Requirements

| Prior artifact | What it correctly predicted | What current code now verifies |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | CLI exposure should wait for host-neutral operations | Broad operation coverage now exists; the blocker has moved from extraction breadth to contract depth |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | The remaining gap would become result/side-effect tightening and remaining direct surfaces | Correct; `content.extract-original-text` is now the first concrete enriched contract, but `translate.*`, `formula.*`, and `fileUtils.ts` still lag |
| `docs/superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md` | Registry onboarding should complete before broader automation claims | Correct; registry onboarding is no longer the highest-leverage theme |

## Approaches Considered

### Approach 1: Contract-first by smallest write-heavy families

Start with `translate.file`, `translate.folder-batch`, `formula.fix-file`, and `formula.batch-fix`, then move into the larger `src/fileUtils.ts` slice after the result-shape pattern is proven twice.

- Pros: smallest safe slice, immediate value for CLI contracts, low risk of cross-cutting churn
- Cons: `src/main.ts` still keeps some direct surfaces for one more round
- Risks: inconsistent result naming if the first two families diverge
- Best when: the goal is steady architectural compaction with proof before abstraction

### Approach 2: Finish remaining `src/main.ts` direct surfaces first

Prioritize `testLlmConnectionCommand`, diagram save/generate, and preview flows so `src/main.ts` becomes thinner before deeper utility work.

- Pros: visible entrypoint slimming, less command logic inline
- Cons: weak write-heavy result contracts remain weak, so CLI discoverability still stalls
- Risks: more wrapper movement without solving the deeper contract problem
- Best when: command-entrypoint cleanliness matters more than automation semantics

### Approach 3: Introduce a shared global result envelope now

Define one universal operation result shape before touching more families, then retrofit translation, formula, process, and generate flows into it.

- Pros: strongest consistency story if it works
- Cons: high abstraction risk before enough result-shape evidence exists
- Risks: overfitting a generic envelope too early and slowing real delivery
- Best when: existing families are already semantically aligned, which they are not yet

## Recommended Direction

Choose Approach 1.

It matches the verified code reality best: `content.extract-original-text` already demonstrates that host-side success semantics can move upward without a global rewrite. The next highest-leverage proof is to apply the same pattern to the smallest remaining write-heavy families, not to reopen every direct surface or force a universal envelope before the semantics are stable.

## Requirements

**Current-State Truth**
- R1. Current progress and architecture docs must describe operation coverage as broadly complete for the current command families and must stop implying that raw registry onboarding is still the primary gap.
- R2. Current docs must name the verified remaining direct surfaces precisely: `testLlmConnectionCommand`, `generateDiagramCommand` plus its save/artifact branches, and `previewExperimentalDiagramCommand` in `src/main.ts`.

**Short-Term Hardening**
- R3. The next P0 implementation batch must prioritize `translate.file`, `translate.folder-batch`, `formula.fix-file`, and `formula.batch-fix` before reopening the larger `src/fileUtils.ts` families.
- R4. Translation flows must return structured results that capture source/output paths, target language, overwrite/create behavior where applicable, translated counts, and collected per-file errors; success notices and modal lifecycle must belong to host adapters rather than `src/translate.ts`.
- R5. Formula-fix flows must return structured file/folder results instead of boolean-only or count-only semantics, and localized user notices must live in host adapters rather than `src/formulaFixer.ts`.
- R6. `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` must be updated to reflect the richer result schemas from R4-R5, with optional inputs only where they remain deterministic and non-UI-bound.

**Mid-Term Convergence**
- R7. After the translation/formula batch, the next implementation batch must tighten `src/fileUtils.ts` write-heavy flows, especially `processFile`, `generateContentForTitle`, `batchGenerateContentForTitles`, and `checkAndRemoveDuplicateConceptNotes`.
- R8. Those flows must converge on explicit result semantics for created/overwritten/moved artifacts, concept-note side effects, cancellation, and aggregated errors before any stronger CLI-readiness claim is made.
- R9. Happy-path success notices and reporter lifecycle for those flows must live in `src/operations/*HostAdapter.ts`, not inside `src/fileUtils.ts`.

**Long-Term Command-Surface Convergence**
- R10. Only after the write-heavy result semantics stabilize should the project finish the remaining `src/main.ts` direct surfaces into operation/host-adapter form or explicitly classify them as command-only surfaces.
- R11. Diagram save/generate/preview and provider connection test flows must either gain the same operation/result discoverability as the other families or be explicitly documented as outside the automation-grade CLI contract.
- R12. Public CLI exposure must remain phased: internal operation contract first, maintainer-grade invocation second, stable user-facing CLI API last.

**Documentation And Hygiene**
- R13. `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.*`, `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`, `docs/architecture*`, and `docs/maintainer/notemd-cli-capability-matrix*` must be updated section by section to reflect the short/mid/long direction above.
- R14. Delivery must end on latest `origin/main` with fresh build/test/audit evidence and a clean worktree.

## Success Criteria

- A maintainer can explain the next three architectural waves without re-reading code archaeology: `translate/formula` first, `fileUtils` second, remaining direct surfaces last.
- No current doc claims that translation batch flows still need host-adapter extraction; the docs instead describe the verified remaining issue as contract/result/side-effect depth.
- The next planning pass can start directly on the `translate/formula` batch without having to rediscover the why, the ordering, or the scope boundaries.

## Scope Boundaries

- This requirements pass does not add new `obsidian-cli` subcommands.
- This requirements pass does not force a universal result envelope across every operation family yet.
- This requirements pass does not attempt a single-batch rewrite of all `src/fileUtils.ts` write-heavy flows.
- This requirements pass does not clean or reuse the dirty root worktree.

## Key Decisions

- Use the smallest remaining write-heavy families to prove the contract-enrichment pattern before touching the largest utility core.
- Prefer family-specific result objects first; defer a shared global envelope until at least two more families expose stable semantics.
- Treat remaining `src/main.ts` direct surfaces as a later convergence problem, not the first one, because their extraction alone does not improve CLI contracts enough.

## Dependencies / Assumptions

- Current truth was verified against `src/main.ts`, `src/translate.ts`, `src/fileUtils.ts`, `src/formulaFixer.ts`, `src/operations/registry.ts`, `docs/architecture.md`, and the current May 2026 brainstorm documents.
- `content.extract-original-text` already demonstrates the intended pattern: richer result object out of the utility core, success notice in the host adapter.
- The current registry already covers the operation IDs needed for the short-term batch; the remaining work is mostly contract depth and host-side effect relocation.

## Outstanding Questions

### Deferred To Planning
- [Affects R4][Technical] Should `translate.file` distinguish `created`, `overwritten`, and `openedInWorkspace` explicitly, or is `outputPath` plus an overwrite flag sufficient for the first batch?
- [Affects R5][Technical] Should formula-fix results mirror the future Mermaid/process result style, or should they stay family-local until more write-heavy families are enriched?
- [Affects R10][Technical] After `translate/formula` and `fileUtils`, should the next convergence target be diagram command surfaces or provider connection test?

## Next Steps

-> /ce:plan for the `translate/formula` contract-tightening batch
