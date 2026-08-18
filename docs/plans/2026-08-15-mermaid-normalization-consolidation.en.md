---
date: 2026-08-15
last_updated: 2026-08-18
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

Scope: diagram-level Mermaid normalization shared by render, preview, and note-repair paths, plus the legacy chain's explicit ownership boundaries. The original convergence slice did not add new diagram types; the follow-up catalog admission recorded in Section 11 adds only bounded Mermaid adapters after these gates closed.

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

- Fence ownership historically diverged across `checkMermaidErrors`, `validator`, `refineMermaidBlocks`, and a hand-built fallback fence. `extractMermaidBlocks`/`mapMermaidBlocks` now provide the shared scanner, while `fenceMermaidDefinition` owns canonical output for both backtick and tilde input.
- `refineMermaidBlocks` historically stripped `(){}` from every Mermaid block line. The current path preserves ER grammar braces and the legacy deep-debug chain is gated to `flowchart`/`unknown` families.
- The historical audit called the `deepDebugMermaid` chain “30-step” (`mermaidProcessor.ts:356-498`), but the executable registry now records 35 stable stage IDs. It remains flowchart-biased: `fixMermaidNotes` rewrites `note right of` (valid sequence syntax), while `fixMermaidPipes`/`fixMisplacedPipes` touch `|` (ER cardinality syntax).
- `ensureMermaidInitialized` now owns plugin validation initialization. It calls `mermaid.initialize` once per function identity; preview webviews retain a separate theme-specific `deps.initialize()` lifecycle.
- Dead exports in `legacyFixerUtils.ts`: `rewriteLegacyTrailingDoubleDashArrow` (`:412`), four unimported `parse*` exports, byte-identical `stripWrappingDoubleQuotes`/`stripWrappedQuotedLabel` (`:36-42`/`:44-50`).
- Drawnix geometry duplication (audit, outside this plan's scope but tracked here): the current one-root native projection still has remaining measurement/layout helpers, but shared rectangle/polyline primitives now live in `drawnixGeometry.ts` and deterministic text measurement/wrapping lives in `drawnixTextLayout.ts`. `routeDrawnixCrossRootRelation` in canonical `drawnixRelationRouter.ts` has no production caller and is explicitly compatibility-only; the old `drawnixCrossRootRouter.ts` path is a deprecated re-export. `enrichDrawnixSourceCoverage` is the canonical production operation and `mergeDrawnixSourceCoverage` remains a deprecated compatibility alias. The deleted presentation module and presentation delivery bundle are not part of the current contract.

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

- Keep the frozen legacy execution order and expose it as an ordered registry (`{id, run}`); the registry is the accounting unit for the roadmap sunset boundary and currently contains 35 IDs.
- Stage implementations remain in `mermaidProcessor.ts`/`legacyFixerUtils.ts`; no dead export is removed without call-site proof.
- Type gating skips the whole legacy chain for families outside the safe set (`flowchart`/`unknown`); normalization and ER repairs still run. This also fixes the historical `(){}` stripping bug.
- The only intended semantic behavior change remains the render path receiving the ER repairs that preview already had. The Phase 0 divergence fixture and the stage-registry regression tests protect that boundary.

## 6. Tradeoffs And Rejected Alternatives

| Option | Cost | Verdict |
|---|---|---|
| A. Neutral normalize + stage pipeline | one migration + full regression | Chosen: resolves all four contracts |
| B. validator as superset, shared delegates | minimal diff | Rejected: wrong dependency direction; validator's role is validation, not repair |
| C. Two copies + cross-comment | zero | Rejected: already diverged once (ER repairs) |
| D. Render path imports shared directly | minimal diff | Rejected: normalize would live in rendering/preview; diagram layer would depend upward |

Historical challenge (closed): ER repairs were guessing rewrites that originally ran only in preview, so the render path never validated their output. The landed canonical normalizer now sends the repaired content through `mermaid.parse` and falls back to the unrepaired content on parse failure, preserving a fail-closed boundary.

Challenge: first-line family detection is fragile (BOM, leading blank lines, \%\%{init} headers). Stage 2 runs after Stage 1 and skips comments; unknown family defaults to the safe set (no legacy chain).

## 7. Pitfalls

1. **Fence tail anchor shift**: legacy chain ran in fenced context; on inner text, trailing-newline count moves `$`/`^` matches. Lock `fenceMermaid` tail first, then run the full mermaidFix regression — order matters.
2. **Idempotency**: `fixConcatenatedLabels`/`fixDoubledID` are heuristic and can re-rewrite on a second pass (`mermaidFixChain.test.ts` already asserts some `toBe(input)` cases). Add a whole-chain double-run invariant test.
3. **mermaid.parse cost**: `checkMermaidErrors` parses every block; keep the errorCount gate; never introduce parse into the preview hot path.
4. **getValidNodeIDs context** (`mermaidProcessor.ts:1158`): must stay inside the stage that needs it, not globalized.
5. **Test surface is the behavior contract**: ~25 `mermaidFix*`/`deepDebug*`/`mermaidProcessor.test.ts` files must pass unchanged after migration. A failing test means the migration broke behavior, not that the test should change.
6. **Historical fallback-fence hazard (closed)**: an earlier `diagramGenerationService` error fallback hand-built a fenced block with `spec.intent` as the first line. Keep the canonical `fenceMermaidDefinition` boundary and a valid fallback body covered by regression tests.
7. **`~~~` fences (closed)**: the unified scanner now absorbs `~~~`; keep this regression covered so future repair-chain edits cannot silently skip wave-fenced blocks.

## 8. Phases And Verification Gates

- **Phase 0 — divergence fixture (complete)**: the erDiagram brace-less entity + truncated cardinality fixture now asserts render output == preview output and records the only intended semantic behavior change.
- **Phase 1 — neutral normalize module (complete)**: normalize + ER repairs moved to the diagram layer; validator, preview, and render-host consumers share it. Gate: `mermaidSanitization`/`mermaidValidator`/`mermaidErAdapter` suites are green.
- **Phase 2 — legacy chain staging (complete)**: frozen execution order is represented by a 35-ID stage registry; family gating and whole-chain idempotency are covered. Gate: focused legacy suites and build are green; dead exports remain pending call-site proof.
- **Phase 3 — fence and config convergence (complete)**: shared scanner and canonical fence helpers own markdown block boundaries; `ensureMermaidInitialized()` initializes the plugin validation runtime once per `initialize` identity. Preview webview theme initialization remains intentionally separate.
- **Final gates**: `npm run build`; `npm test -- --runInBand`; `npm run audit:render-host`; snapshot diff allowed only for erDiagram artifacts.

## 9. Progress Comparison With Prior Plans

### vs Diagram Rendering Platform Roadmap (2026-04-14)

| Task | Requirement | Current state | Gap |
|---|---|---|---|
| 0. Build/packaging substrate | render-host smoke gate, single main.js + inline srcdoc | gate exists (`audit:render-host`); single-entry enforced | candidate-only guard remains outside production esbuild path (2026-06-09 status unchanged) |
| 1. Diagram domain model + intent router | DiagramSpec + DiagramPlan | done (`architecture.md:188-203`) | none |
| 2. Spec-first generation | DiagramSpecPrompt replaces raw mermaid text | done | command-surface convergence remains |
| 3. Mermaid adapter V2 + mermaidProcessor decomposition | single adapter, legacy-fixer sunset | diagram-level normalize, 35-stage registry/type gating, shared scanner/fence ownership, and validation config lifecycle converged | external consumer evidence and eventual legacy-fixer deletion remain |
| 4. Rendering platform skeleton | registry/host/cache/preview | done (8 renderers) | none |
| 5. JSON Canvas | first non-Mermaid target | done | none |
| 6. Vega-Lite | done (sandboxed iframe preview) | done | none |
| 7. Theme/export/release hardening | SVG/PNG/PDF + release discipline | done (1.8.x-1.9.x) | none |
| 8. Deferred advanced engines | hold | held (correct) | none |

Roadmap "Recommended Next Batch" (convergence, not new targets) is still the correct direction; this plan now records the completed Task 3 Phase 2-3 work and tracks the remaining consumer-evidence and renderer-convergence gates rather than reopening diagram-level divergence.

### vs Drawnix Knowledge-Map Quality And Delivery Plan (2026-07-22) + Implementation Record (2026-08-14)

Implemented: projection, reserved-lane routing with an internal grid fallback (verified live: `drawnixMindMapProjection.ts` calls `routeDrawnixRelationThroughReservedLane()` from `drawnixRelationRouter.ts`), source coverage, and the single-root implementation record (2026-08-14). Documented behavior in `architecture.md:203` is accurate.

Gaps (audit, updated 2026-08-18): relation-label measurement/layout duplication in the current projection path is closed by `drawnixRelationLabelLayout.ts`; projection and lane reservation now consume one wrapping/size contract. The compatibility-only `routeDrawnixCrossRootRelation` engine and deprecated `mergeDrawnixSourceCoverage` alias remain intentionally source-compatible until downstream migration evidence exists. Shared rectangle/polyline and text geometry are centralized. Real Drawnix application interoperability remains an external evidence gate.

### vs circuitikz Figure Generation Roadmap

Phases A-F: A documented; B/C constrained prototype done (circuitSpec + exporter + golden templates); D render feedback wired via `runCircuitikzCompile` (CLI, corrected); E is an explicit one-attempt maintainer-only acceptance boundary; F managed desktop environment done. The byte-identical `dualInputPortX` helper and hard-coded buffer port literals are closed: NAND/NOR use `extendedPortX`, while `bufferPortX` names the wider right gutter and drives both buffer ports. The remaining template-specific validation/render code is intentionally explicit because each golden family has different topology and diagnostics; collapsing it into a generic mode switch would weaken reviewability and golden-output ownership.

### vs Diagram Platform Robustness And Settings Integrity Plan (2026-08-08)

Phases 0-6 implemented (1.9.5). The semantic/geometry/delivery contracts are documented; Drawnix relation-label measurement is now centralized, and there is no second presentation delivery contract. No other contract violations found in the audit.

## 10. Follow-up Direction

1. Record real external consumer evidence where tooling exists; do not convert fixture or serializer evidence into an interoperability claim.
2. Drawnix convergence slice: relation-label measurement is now centralized in `drawnixRelationLabelLayout.ts`; keep the old router engine and source-coverage alias only as compatibility shims until call-site and migration evidence supports removal. Do not infer real Drawnix application interoperability from the Plait public-API gate.
3. circuitikz: shared document/label template plumbing and port-coordinate helpers are parameterized; keep `runCircuitikzRepairLoop` as a maintainer-only acceptance SDK. A future caller must be an explicit repair command with persisted acceptance evidence, not a silent normal-generation fallback.
4. Repo-wide helper convergence (escapeHtml x10, error-message ternary x94, FNV-1a x5, isRecord x6, slugify x3, enum guards x4, indexOf-dedupe x7) as the closing sweep of the convergence batch, with the roadmap's support-matrix discipline.
5. Keep the roadmap's rule: convergence before new targets.

## 11. Implementation Update (2026-08-17)

Phases 0 through 3 are now landed. Phase 0 and the diagram-level portion of Phase 1 closed the render/preview divergence; Phase 2 and Phase 3 completed legacy-chain, fence, and validation-runtime convergence.

- `src/diagram/adapters/mermaid/normalize.ts` is the runtime-free canonical boundary. It normalizes BOM/CRLF, extracts both backtick and tilde fences, detects the Mermaid family, sanitizes line endings, and applies the existing ER repairs.
- `validator.ts`, `mermaidPreview.ts`, and `renderHostEntry.ts` consume the same implementation. `mermaidDefinitionShared.ts` is retained only as a compatibility re-export.
- `refineMermaidBlocks` recognizes both fence styles and no longer removes ER grammar braces. Its legacy chain is represented by 35 stable stages, gated to `flowchart`/`unknown`, and covered by an idempotency invariant.
- `src/tests/mermaidNormalizationConvergence.test.ts` proves that render validation and preview receive byte-identical ER content, including brace-less entities and truncated cardinality repair.
- `extractMermaidBlocks`/`mapMermaidBlocks` are now shared by validation and repair paths; `fenceMermaidDefinition` is the canonical output boundary.
- `ensureMermaidInitialized()` protects the plugin validation runtime from repeated global-config resets. Preview webviews retain separate theme-specific initialization by design.

The remaining gap is intentionally narrower than the original audit: external consumer evidence, Drawnix geometry convergence, and Circuitikz template convergence. No new unbounded Mermaid layout or target is admitted without the same schema, renderer, persistence, gallery, and consumer evidence gates; the narrow Mermaid-only candidate admission in the 2026-08-18 update is the explicit exception already recorded below.

### Drawnix and Circuitikz convergence (2026-08-17)

The Drawnix production boundary now has a canonical relation-router module and a compatibility-only old path. `drawnixGeometry.ts` owns rectangle inflation, strict overlap semantics, and path-length interpolation so SVG projection and relation routing cannot drift on those primitives. The legacy cross-root router remains exported only for source compatibility and focused tests; production routing is reserved-lane-first and owns native label placement.

The Circuitikz exporter now shares one standalone-document wrapper and one component-label lookup helper across all six golden renderers. This is a structural refactor with an exact-output contract: topology, voltage conventions, layout hints, and golden fixtures remain unchanged. The repair loop remains a maintainer-only acceptance boundary.

### Convergence follow-through (2026-08-18)

The Drawnix projection now imports `measureDrawnixRelationLabel()` from `drawnixRelationLabelLayout.ts` for both lane reservation and native label metadata. This closes the last proven measurement duplication without merging the projection's collision policy into the router. The Circuitikz exporter uses one extended-port helper for common/dual-input families and a named buffer-port helper for its intentionally wider right gutter. These are source-level convergence changes; deterministic golden output and topology validation remain unchanged.

### Candidate admission after convergence (2026-08-18)

The convergence gates are now sufficient for a narrow catalog expansion. `timeline`, `swimlane`, and `quadrant` each have typed payload fields, parser-backed Mermaid adapters, intent/planner routing, persistence-compatible spec reads, deterministic fixtures, bilingual gallery rows, and focused tests. Their `compatibleTargets` set is deliberately `['mermaid']`; no editable HTML/SVG, Draw.io, or Drawnix claim is made. `org-chart` is also admitted as a bounded ownership intent with one-root/cycle/depth/direct-report validation, a Mermaid adapter, an HTML semantic-table fallback, and deterministic gallery evidence. The webview presentation registry also now keeps Mermaid/Vega-Lite host shells, HTML document passthrough, and source-only fallback behind one keyed contract.
