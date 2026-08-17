---
date: 2026-08-15
last_updated: 2026-08-17
topic: mermaid-normalization-consolidation
status: active
canonical_for:
  - mermaid-normalization
supersedes: []
superseded_by: null
implementation_record: src/tests/mermaidNormalizationConvergence.test.ts
---

# Mermaid Normalization Consolidation Plan (2026-08-15)

## 1. Status And Scope

This plan consolidates the Mermaid normalization/fix surfaces that currently disagree with each other and with the documented roadmap. It is the implementation slice for the roadmap's "dual stack" risk control and Task 3 sunset boundary (`docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`).

Scope: diagram-level Mermaid normalization shared by render, preview, and note-repair paths. Out of scope: adding new diagram types, changing the legacy fix chain order, packaging/host work.

## 2. Audit Findings And Corrections

### 2.1 Historical audit baseline (captured 2026-08-15)

The findings in this subsection describe the pre-implementation state. The diagram-level divergence was closed on 2026-08-17; the remaining open items are listed in Section 11.

- `validator.normalizeMermaidDefinition` — `src/diagram/adapters/mermaid/validator.ts:29-39` — render path via `validateMermaidDefinition` (`:41-56`) into `src/rendering/renderers/mermaidRenderer.ts:55`. Lacks the ER repairs.
- `mermaidDefinitionShared.normalizeMermaidDefinition` — `src/rendering/preview/mermaidDefinitionShared.ts:92-101` — preview path via `mermaidPreview.ts:22,36` and `renderHostEntry.ts:119`. Adds `repairBraceLessErEntityBlocks` + `repairTruncatedErRelationCardinality` (`:84-87`).
- `mermaidProcessor.refineMermaidBlocks` — `src/mermaidProcessor.ts:67-279` — markdown-level repair for note content, called from `fileUtils.ts:1006,1328,1671` and `searchUtils.ts:372`.

Before Phase 0, the same input normalized differently on render vs preview for `erDiagram` (brace-less entities, truncated cardinalities). That user-visible divergence is now covered by `mermaidNormalizationConvergence.test.ts` and the canonical normalize module.

### 2.2 Corrections to the earlier code-slop audit

- `runCircuitikzCompile` is NOT dead code: `scripts/export-circuitikz.js:151,171` calls it on the production CLI path. The earlier "tests-only" verdict grepped `src/` only. Reframed as a duplicate compile implementation (CLI spawnSync vs desktop spawn), severity 3 -> 1-2.
- `runCircuitikzRepairLoop` (`src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts:93`) still has no production caller, but the roadmap documents it as an "opt-in Phase E execution boundary" — the CLI implements repair-brief/acceptance itself (`scripts/export-circuitikz.js:253,307-324`). The finding stands (unwired module), severity 3 -> 2, framed as a doc-vs-code gap, not a missing feature.

### 2.3 Supporting findings that shape the design

- Fence ownership historically diverged across `checkMermaidErrors`, `validator`, `refineMermaidBlocks`, and a hand-built fallback fence. The canonical diagram normalizer now accepts both backtick and tilde fences; single-owner fencing and the fallback path remain Phase 3 work.
- `refineMermaidBlocks` historically stripped `(){}` from every Mermaid block line. The current path preserves ER grammar braces; the legacy deep-debug chain still requires family gating.
- The 30-step `deepDebugMermaid` chain (`mermaidProcessor.ts:356-498`) is flowchart-biased: `fixMermaidNotes` rewrites `note right of` (valid sequence syntax), `fixMermaidPipes`/`fixMisplacedPipes` touch `|` (ER cardinality syntax).
- `mermaid.initialize` is called per invocation in `validator.ts:47` and `checkMermaidErrors` (`mermaidProcessor.ts:48`); `mermaid.initialize` resets global config, so repeated calls can clobber other consumers.
- Dead exports in `legacyFixerUtils.ts`: `rewriteLegacyTrailingDoubleDashArrow` (`:412`), four unimported `parse*` exports, byte-identical `stripWrappingDoubleQuotes`/`stripWrappedQuotedLabel` (`:36-42`/`:44-50`).
- Drawnix geometry duplication (audit, outside this plan's scope but tracked here): the current one-root native projection still has duplicated measurement/layout helpers; `routeDrawnixCrossRootRelation` (`drawnixCrossRootRouter.ts:823`, ~250 lines) has no production caller; `mergeDrawnixSourceCoverage` (`drawnixSourceCoverage.ts:575-582`) is a deprecated tests-only alias. The deleted presentation module and presentation delivery bundle are not part of the current contract.

## 3. Problem Analysis: Four Contract Conflicts

Merging is not "delete duplicates"; four contracts must be settled or the duplication regrows:

1. **Fence contract**: normalize must return inner content; fence ownership belongs to callers, through one `fenceMermaid(inner)`.
2. **Level contract**: `refineMermaidBlocks` is markdown-level; `normalizeMermaidDefinition` is diagram-level. The merge unit is diagram-level; the markdown scanner stays but delegates block repair.
3. **Type blindness**: the legacy chain is flowchart-biased and unsafe for `erDiagram`/`stateDiagram-v2`/sequence. The pipeline needs family detection and gating.
4. **Config lifecycle**: `mermaid.initialize` must be a module-level once.

## 4. Target Architecture

`src/diagram/adapters/mermaid/normalize.ts` (no mermaid runtime import):

```
normalizeMermaidDiagram(input, opts?) -> { content, family }
  Stage 0 decode       : CRLF -> LF, trim
  Stage 1 defence      : unified fence regex (absorbs ~~~ and trailing-\n semantics), returns inner + fence info
  Stage 2 detectFamily : first-line intent detection after skipping %% / --- comment lines
  Stage 3 legacyRepair : deepDebugMermaid chain, byte-stable, only when opts.repair && family allowed
  Stage 4 erRepair     : repairBraceLessErEntityBlocks + repairTruncatedErRelationCardinality (family === erDiagram)
  Stage 5 sanitize     : per-line trimEnd + the two ER regex repairs common to both copies
```

Consumers:
- `validateMermaidDefinition` = normalize + `mermaid.parse` + `fenceMermaid` (render path).
- `mermaidPreview`/`renderHostEntry` = normalize (re-export); the private copy in `mermaidDefinitionShared.ts` is deleted.
- `refineMermaidBlocks` = markdown-level scanner + delegate block repair to normalize when `errorCount > 0`.

Dependency direction: normalize lives in `diagram/adapters/mermaid/`; `rendering/preview` imports it (already proven direction via `mermaidRenderer.ts` -> `validator.ts`). Do NOT put normalize in `rendering/preview` and have the diagram layer import upward.

## 5. Integration Strategy

- Keep the 30-step `deepDebugMermaid` chain byte-identical; migrate its host and expose stages as an ordered registry (`{id, run}`) — the accounting unit for the roadmap sunset boundary.
- 29 legacy fixers stay in `legacyFixerUtils.ts` as stage implementations; delete dead exports listed in 2.3.
- Type gating at Stage 3: skip the whole legacy chain for families outside the safe set (notably `erDiagram`, `stateDiagram-v2`); Stage 4/5 still run. This also fixes the `:195` `(){}` stripping bug.
- The only intended behavior change: render path gains the ER repairs, matching preview. Guard with a Phase 0 divergence fixture.

## 6. Tradeoffs And Rejected Alternatives

| Option | Cost | Verdict |
|---|---|---|
| A. Neutral normalize + stage pipeline | one migration + full regression | Chosen: resolves all four contracts |
| B. validator as superset, shared delegates | minimal diff | Rejected: wrong dependency direction; validator's role is validation, not repair |
| C. Two copies + cross-comment | zero | Rejected: already diverged once (ER repairs) |
| D. Render path imports shared directly | minimal diff | Rejected: normalize would live in rendering/preview; diagram layer would depend upward |

Challenge: ER repairs are a guessing rewrite; they currently run only in preview, so mermaid.parse has never validated their output. On merge, run `mermaid.parse` on the repaired output and fall back to the un-repaired content on failure (fail-closed to today's render behavior).

Challenge: first-line family detection is fragile (BOM, leading blank lines, \%\%{init} headers). Stage 2 runs after Stage 1 and skips comments; unknown family defaults to the safe set (no legacy chain).

## 7. Pitfalls

1. **Fence tail anchor shift**: legacy chain ran in fenced context; on inner text, trailing-newline count moves `$`/`^` matches. Lock `fenceMermaid` tail first, then run the full mermaidFix regression — order matters.
2. **Idempotency**: `fixConcatenatedLabels`/`fixDoubledID` are heuristic and can re-rewrite on a second pass (`mermaidFixChain.test.ts` already asserts some `toBe(input)` cases). Add a whole-chain double-run invariant test.
3. **mermaid.parse cost**: `checkMermaidErrors` parses every block; keep the errorCount gate; never introduce parse into the preview hot path.
4. **getValidNodeIDs context** (`mermaidProcessor.ts:1158`): must stay inside the stage that needs it, not globalized.
5. **Test surface is the behavior contract**: ~25 `mermaidFix*`/`deepDebug*`/`mermaidProcessor.test.ts` files must pass unchanged after migration. A failing test means the migration broke behavior, not that the test should change.
6. **`diagramGenerationService:580` hand-built fence** (fenced mermaid + spec.intent as first line) emits an invalid diagram on the error-fallback path; replace with `fenceMermaid` + a valid fallback body.
7. **`~~~` fences**: the unified fence regex must absorb `~~~` or the fix chain silently skips those blocks (current bug at `mermaidProcessor.ts:253`).

## 8. Phases And Verification Gates

- **Phase 0 — divergence fixture (test first)**: erDiagram brace-less entity + truncated cardinality fixture asserting render output == preview output. Red today; defines the only intended behavior change.
- **Phase 1 — neutral normalize module**: port normalize + ER repairs from shared (with mermaid.parse fallback); validator re-exports. Gate: `mermaidSanitization`/`mermaidValidator`/`mermaidErAdapter` suites green.
- **Phase 2 — legacy chain staging**: deepDebug 30 steps -> stage array, byte-identical; type gating; clean legacyFixerUtils dead exports. Gate: all ~25 mermaidFix suites + `mermaidProcessor.test.ts` green.
- **Phase 3 — fence and config convergence**: single `fenceMermaid`; kill `:580` hand-built fence; `ensureMermaidInitialized()` module-level once. Gate: render/preview/export integration (`renderExportFlow`, `diagramPreviewModal`).
- **Final gates**: `npm run build`; `npm test -- --runInBand`; `npm run audit:render-host`; snapshot diff allowed only for erDiagram artifacts.

## 9. Progress Comparison With Prior Plans

### vs Diagram Rendering Platform Roadmap (2026-04-14)

| Task | Requirement | Current state | Gap |
|---|---|---|---|
| 0. Build/packaging substrate | render-host smoke gate, single main.js + inline srcdoc | gate exists (`audit:render-host`); single-entry enforced | candidate-only guard remains outside production esbuild path (2026-06-09 status unchanged) |
| 1. Diagram domain model + intent router | DiagramSpec + DiagramPlan | done (`architecture.md:188-203`) | none |
| 2. Spec-first generation | DiagramSpecPrompt replaces raw mermaid text | done | command-surface convergence remains |
| 3. Mermaid adapter V2 + mermaidProcessor decomposition | single adapter, legacy-fixer sunset | diagram-level normalize converged; legacy-fixer staging/type gating and Mermaid config lifecycle remain | **this plan, Phase 2-3** |
| 4. Rendering platform skeleton | registry/host/cache/preview | done (8 renderers) | none |
| 5. JSON Canvas | first non-Mermaid target | done | none |
| 6. Vega-Lite | done (sandboxed iframe preview) | done | none |
| 7. Theme/export/release hardening | SVG/PNG/PDF + release discipline | done (1.8.x-1.9.x) | none |
| 8. Deferred advanced engines | hold | held (correct) | none |

Roadmap "Recommended Next Batch" (convergence, not new targets) is still the correct direction; this plan now tracks the remaining Task 3 Phase 2-3 work rather than the already-closed diagram-level divergence.

### vs Drawnix Knowledge-Map Quality And Delivery Plan (2026-07-22) + Implementation Record (2026-08-14)

Implemented: projection, reserved-lane routing with grid fallback (verified live: `routeDrawnixRelationThroughReservedLane` -> `findGridReservedLaneRoute`, `drawnixCrossRootRouter.ts:627-635`), source coverage, and the single-root implementation record (2026-08-14). Documented behavior in `architecture.md:203` is accurate.

Gaps (audit): duplicated measurement/layout helpers within the current projection path; dead `routeDrawnixCrossRootRelation` engine (~250 lines); deprecated `mergeDrawnixSourceCoverage` alias. These are the next Drawnix convergence slice after this plan.

### vs circuitikz Figure Generation Roadmap

Phases A-F: A documented; B/C constrained prototype done (circuitSpec + exporter + golden templates); D render feedback wired via `runCircuitikzCompile` (CLI, corrected); E repair loop unwired (opt-in boundary with no entry; CLI implements acceptance itself); F managed desktop environment done. Gaps: 6x template/validation near-copies (`circuitikzExporter.ts:205-778`), byte-identical `extendedPortX`/`dualInputPortX` (`:45-50`), hard-coded `(7.2,1.2) node[right]` in the buffer template, and a decision on `runCircuitikzRepairLoop` (wire or delete, then fix the doc claim).

### vs Diagram Platform Robustness And Settings Integrity Plan (2026-08-08)

Phases 0-6 implemented (1.9.5). The semantic/geometry/delivery contracts are documented; the current projection still has helper duplication, but there is no second presentation delivery contract. No other contract violations found in the audit.

## 10. Follow-up Direction

1. Complete the remaining Phase 2-3 work: stage/type-gate the legacy chain, centralize fence ownership, and make Mermaid initialization module-scoped.
2. Drawnix convergence slice: extract one shared measurement/layout module for the native projection; delete the dead router engine and deprecated alias.
3. circuitikz: template parameterization; decide `runCircuitikzRepairLoop` fate; sync docs with the decision.
4. Repo-wide helper convergence (escapeHtml x10, error-message ternary x94, FNV-1a x5, isRecord x6, slugify x3, enum guards x4, indexOf-dedupe x7) as the closing sweep of the convergence batch, with the roadmap's support-matrix discipline.
5. Keep the roadmap's rule: convergence before new targets.

## 11. Implementation Update (2026-08-17)

Phase 0 and the diagram-level portion of Phase 1 are now landed.

- `src/diagram/adapters/mermaid/normalize.ts` is the runtime-free canonical boundary. It normalizes BOM/CRLF, extracts both backtick and tilde fences, detects the Mermaid family, sanitizes line endings, and applies the existing ER repairs.
- `validator.ts`, `mermaidPreview.ts`, and `renderHostEntry.ts` consume the same implementation. `mermaidDefinitionShared.ts` is retained only as a compatibility re-export.
- `refineMermaidBlocks` recognizes both fence styles and no longer removes ER grammar braces. Its legacy deep-debug order is unchanged.
- `src/tests/mermaidNormalizationConvergence.test.ts` proves that render validation and preview receive byte-identical ER content, including brace-less entities and truncated cardinality repair.

The remaining gap is intentionally narrower than the original audit: Phase 2 must stage and gate the 30-step legacy chain, and Phase 3 must converge fence ownership and Mermaid initialization. No new Mermaid layout or target is admitted until those gates and the external consumer evidence are recorded.
