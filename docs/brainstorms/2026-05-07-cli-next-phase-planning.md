---
date: 2026-05-07
topic: cli-next-phase-planning
---

# CLI Next-Phase Planning

> Update (2026-05-07, later): the recommended direction in this planning note is now landed at the current contract depth. `diagram.generate` still acts as the host-neutral generation core, and the command-completion layer beneath it is now explicit through a typed `followThrough` result shape. The next wave should focus on packaging / semantic-verification convergence and only revisit larger exported boundaries if a later branch proves genuinely host-neutral.

## Problem Frame

The May 4-5 brainstorm set already settled the broad question:

- Notemd should extract host-neutral operations before making bigger CLI/public-surface claims.
- The write-heavy note-processing proof set is already landed.
- The first diagram/provider wrapper extraction round is already landed.

That means the next CLI phase is no longer "add more commands" and it is no longer "finish broad registry onboarding". The remaining problem is narrower:

- `diagram.generate`, `diagram.preview`, and `provider.connection.test` already exist as typed, registry-backed seams.
- `runDiagramGenerateOperation()` is already a host-neutral generation core.
- the remaining mixed behavior now lives in `src/operations/diagramCommandExecution.ts` and `src/operations/diagramCommandHostAdapter.ts`, where generated artifacts are saved, reopened, previewed, auto-fixed, and announced to the user.
- the actual shipped commands still truthfully inherit `requires-active-file`, `write-file`, or `interactive-ui` semantics from `src/workflowButtons.ts`.

The next planning step therefore was a layering decision: make the core-generation contract and host follow-through contract explicit without reopening already-landed write-heavy families or prematurely multiplying top-level operation IDs. That decision has now been implemented; the rest of this document remains useful as the rationale for why the current shape looks the way it does.

## Code Truth Snapshot

### `diagram.generate` already has a real core

`src/operations/diagramGenerateOperation.ts` accepts explicit markdown input and runtime dependencies, then returns a `DiagramGenerationResult`. It does not save files, open previews, or emit notices. This is the strongest current evidence that the project already has a host-neutral diagram-generation seam.

### The remaining side effects happen after generation

`src/operations/diagramCommandExecution.ts` runs the generation core and then calls into `src/operations/diagramCommandHostAdapter.ts`.

That host adapter layer currently owns the meaningful follow-through:

- save Mermaid outputs
- save artifact outputs
- optionally auto-fix saved Mermaid
- reopen saved files
- open previews
- emit notices

Those are real host/file/UI semantics. They should not be collapsed back into the same abstraction as the pure generation core.

### The registry already shows the split, but not yet perfectly

`src/operations/registry.ts` exports `diagram.generate` as `safe` / `read-only`, while the command bindings mapped from `src/workflowButtons.ts` still carry the actual shipped command semantics:

- `notemd-generate-diagram` -> `requires-active-file` / `write-file`
- `notemd-summarize-as-mermaid` -> `requires-active-file` / `write-file`
- `notemd-preview-diagram` -> `interactive-ui` / `preview-ui`

That split was directionally correct, and the follow-up implementation now makes the meaning more explicit by adding a typed `followThrough` shape beneath the exported `diagram.generate` result while keeping the command bindings unchanged.

### `provider.connection.test` is the local reference pattern

`src/operations/providerConnectionTestCommandHostAdapter.ts` already separates:

- a typed test path
- an optional interactive wrapper that adds busy/reporter behavior

This is the most mature reference inside the repo for how the remaining diagram/provider command-core layering should evolve.

## Comparison Against Prior Brainstorm Docs

| Prior artifact | What it established | What this document refines |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | Extract operations before stronger CLI claims | Confirms that the remaining work is now mostly contract layering, not new extraction families |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | Deeper diagram/provider command-core work is next | Clarifies that the next move should prefer typed internal completion/follow-through contracts before new top-level operation IDs |
| `docs/brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.md` | The write-heavy proof set is complete and no longer the bottleneck | Confirms that reopening those families would now be churn, not progress |

## Approaches Considered

### Approach 1: Add more top-level diagram operations immediately

Examples would be `diagram.save-mermaid`, `diagram.save-artifact`, or `diagram.preview-artifact`.

- Pros: looks explicit at first glance
- Cons: hard-codes host file/UI follow-through as if it were already a host-neutral engineering boundary
- Risks: overexpands the public contract before the code proves those paths are actually command-independent

### Approach 2: Keep the current mixed wrapper shape and do nothing

- Pros: cheapest short-term path
- Cons: leaves the core-vs-command layering blurry
- Risks: future maintainers may misread operation-level `safe` metadata or keep pushing more wrapper semantics into the exported contract

### Approach 3: Keep the top-level operation surface stable and formalize the internal completion/follow-through layer

- Pros: preserves the correct top-level seams while making the remaining ambiguity explicit
- Cons: requires a more careful internal contract design
- Risks: still needs discipline to avoid turning host-side completion helpers into a hidden second API

## Recommended Direction

Choose Approach 3.

The next CLI phase should keep `diagram.generate`, `diagram.preview`, and `provider.connection.test` as the stable top-level frame, then make the diagram completion/follow-through layer explicit and typed beneath that frame.

That explicit follow-through layer is now landed.

In practice, that means:

1. keep the host-neutral generation core separate from save/open/preview follow-through
2. prefer internal typed execution/result structures before inventing new top-level operation IDs
3. treat `provider.connection.test` as the reference pattern for core-vs-interactive layering
4. keep broader CLI/public-surface growth, packaging isolation, and maintainer semantic verification as later waves

## Concrete Landing Plan

### Stage 1: Make the current layer split explicit

1. Keep `diagram.generate` defined as the host-neutral `sourceMarkdown -> DiagramGenerationResult` contract.
2. Audit the current exported result fields (`operationInput`, `generation`, `outputPath`, `previewOpened`) and decide which belong to the core result versus the follow-through layer.
3. Document that the command bindings keep the real shipped trigger semantics even when the operation-level metadata stays `safe` / `read-only`.

### Stage 2: Type the follow-through layer beneath the core

1. Introduce clearer internal execution/result structures around:
   - Mermaid save completion
   - artifact save completion
   - preview follow-through
   - reopen/auto-fix/notice side effects
2. Keep these as internal typed execution boundaries first.
3. Promote any branch to a new top-level operation only if it proves to be host-neutral and command-independent.

Implementation update:
- `diagram.generate` now returns `followThrough.kind`, `followThrough.outputPath`, `followThrough.previewOpened`, `followThrough.autoFixAttempted`, and `followThrough.artifactTarget`
- backward-compatible top-level `outputPath` and `previewOpened` remain exported for now

### Stage 3: Lock the boundary in metadata and tests

1. Keep `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` aligned to the intended layer they describe.
2. Add or refine tests so operation-core metadata cannot silently drift into command-trigger semantics.
3. Re-validate maintainer docs so they no longer imply that the next CLI phase is command-count growth.

### Stage 4: Only then move to the next wave

1. packaging / heavy-runtime isolation
2. maintainer-local semantic verification hardening
3. selection/export and workflow/settings contract enrichment
4. broader CLI/public-surface decisions

This stage is now the active next-wave direction.

## Requirements

- R1. The next implementation batch must preserve the current phase ordering: diagram/provider contract layering first, packaging/semantic-verification next, broader CLI/public-surface claims last.
- R2. `diagram.generate` must continue to mean host-neutral generation, not active-file command execution.
- R3. Mermaid-save, artifact-save, preview-open, reopen-saved-file, auto-fix, and notice semantics must be treated as a distinct completion/follow-through layer.
- R4. The next implementation batch must make that follow-through layer explicit and typed. New top-level operation IDs are only justified when a branch becomes host-neutral and command-independent.
- R5. Registry/capability-manifest/contract metadata must stay honest about which layer they describe: core operation versus command binding.
- R6. Add tests that lock the intended layering and prevent future drift.
- R7. Maintain the already-landed write-heavy proof set unchanged unless a deeper diagram/provider refactor forces a clearly justified alignment update.
- R8. Do not use this phase to add new `obsidian-cli` subcommands.

## Success Criteria

- A maintainer can explain why `diagram.generate` can stay `safe` / `read-only` while the real shipped diagram commands remain `requires-active-file` / `write-file`.
- The next implementation PRD can now start from the landed `followThrough` contract and state whether that structure is sufficient or whether any larger exported contract is justified later.
- The repo docs no longer describe the next CLI phase as command-count growth.

## Scope Boundaries

- This planning pass does not add new `obsidian-cli` subcommands.
- This planning pass does not reopen the write-heavy note-processing contract batch.
- This planning pass does not implement packaging isolation.
- This planning pass does not promote interactive preview/file-save flows to `safe`.

## Key Decisions

- Keep the top-level operation frame stable for now.
- Prefer typed internal completion/follow-through structures before new top-level operation IDs. This preference is now reflected in the landed implementation.
- Use `provider.connection.test` as the local reference for how typed core contracts and interactive wrappers should coexist.

## Dependencies / Assumptions

- Current truth was checked against `src/operations/diagramGenerateOperation.ts`, `src/operations/diagramCommandExecution.ts`, `src/operations/diagramCommandHostAdapter.ts`, `src/operations/providerConnectionTestCommandHostAdapter.ts`, `src/operations/registry.ts`, `src/cliContracts.ts`, and `src/workflowButtons.ts`.
- The existing May 4-5 brainstorm docs remain valid and should be treated as lineage, not replaced history.
- The capability matrix remains the maintainer-facing control surface for automation-level truth and should stay aligned with this planning direction.

## Outstanding Questions

### Deferred To Implementation Planning

- Should `diagram.generate` keep the backward-compatible top-level `outputPath` and `previewOpened` fields long-term, or should a later cleanup rely only on the clearer `followThrough` shape?
- Which diagram completion branches are typed enough to deserve stronger internal execution contracts first?
- After the layering correction has landed, is selection/export/workflow contract enrichment or packaging/maintainer verification the higher-leverage next follow-up?

## Next Step

-> Use this document plus the task-local research note as history/rationale, then start the next implementation PRD from packaging / semantic-verification convergence unless a newly discovered host-neutral boundary justifies reopening deeper diagram contract work.
