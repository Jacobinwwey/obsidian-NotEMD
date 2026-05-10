date: 2026-05-08
last_updated: 2026-05-10
topic: packaging-semantic-convergence-progress-and-next-steps
---

# Packaging / Semantic Convergence Deep Comparison And Next-Step Plan

## 1. Scope And Baseline

This comparison reconciles current `main` with prior requirement sources:

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md` (R1-R6 + acceptance criteria)
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.*`
4. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`

Goals:

- verify doc claims vs shipped code truth
- verify helper/test/docs anti-drift closure
- define the transition gate from convergence hardening to real packaging-boundary implementation

## 2. Requirement Mapping (Code Evidence)

### PRD R1-R6 Mapping

| Requirement | Current evidence | Status | Notes |
|---|---|---|---|
| R1 Preserve architecture truth and avoid overclaiming isolation | `scripts/diagram-semantic-verification.js` checklist + `docs/maintainer/release-workflow*.md` | Met | Explicitly states `audit:render-host` only proves `main.js + srcdoc` containment |
| R2 Do not reopen `diagram.generate/preview/provider.connection.test` contract depth | Recent diffs touch helper/tests/docs only | Met | No operation semantic changes |
| R3 Upgrade helper with durable packaging-boundary checklist | `buildPackagingBoundaryChecklistLines()` | Met | Covers `outfile/outdir/unknown/ambiguous` states |
| R4 Keep release/semantic docs aligned | `docs/maintainer/diagram-semantic-verification*.md` + `release-workflow*.md` | Met | Bilingual docs synced |
| R5 Add regression coverage to prevent silent drift | `src/tests/diagramSemanticVerificationScript.test.ts` | Met | Covers array/object/backtick/unknown/ambiguous/context-scope |
| R6 Keep host/CLI claims honest | Gate always records `obsidian help` and `obsidian-cli help` execution evidence | Met | Maintains evidence-first host validation |

### Acceptance Criteria Mapping

| Criterion | Evidence | Status |
|---|---|---|
| Template includes explicit packaging-boundary section with current truth | `npm run verify:diagram-semantics` output | Met |
| Maintainer docs remain aligned with template truth | `docs/maintainer/*` wording sync | Met |
| Tests lock helper/docs shape | focused script test + full suite | Met |
| No command/operation semantic drift | diff scope + full gate | Met |

## 3. Architecture Progress vs Prior Plans

### Completed convergence layer

1. **Helper evolved into a stateful boundary checker**
   `outputTargetStatus` now distinguishes `outfile`, `outdir`, `unknown`, and `ambiguous`.
2. **Parser hardening landed**
   Supports `"..."`, `'...'`, and `` `...` `` literals; supports array/object `entryPoints`; scopes parsing to `esbuild.context({...})` options to avoid decoy keys.
3. **Verification closure is now repeatable**
   helper behavior -> regression tests -> maintainer doc sync -> release wording alignment.
4. **Stage-B contract definition has started with executable release-truth wiring**
   The helper template now includes a `Packaging Contract` section that derives required release assets from `scripts/release/publish-github-release.js`, keeps dual-language release-note file expectations explicit, records numeric-tag + create/upload mode contract truth, and checks tag-only release workflow trigger guardrails from `.github/workflows/release.yml`.
5. **Stage-B contract promotion boundary is now executable**
   The helper template now includes a `Contract Promotion Boundary` section that derives workflow/settings/selection/export/config-adjacent operation constraints (`automationLevel`, `requiredContext`, `sideEffectClass`) from `src/operations/registry.ts`.
6. **Contract-promotion parser hardening now covers registry literal variants**
   Contract metadata extraction now tolerates mixed quote literals (`"..."`, `'...'`, `` `...` ``) in registry operation definitions, with regression coverage that locks this behavior for tracked selection/config/export operations.
7. **Contract-promotion tracking now supports prefix wildcard expansion**
   `file.process-*` and `concept.extract-*` are now expanded from live registry operation IDs rather than maintained as static manual lists, while missing-registry fallback IDs keep checklist output stable.
8. **Release workflow trigger parsing is now less quote-fragile**
   Tag-trigger contract checks now parse `tags:` list items with mixed quote styles and explicitly treat `v*.*.*` wildcard patterns as guardrail violations, reducing drift from YAML formatting-only edits.
9. **Release tag-trigger scope is now explicit**
   Trigger detection now only trusts `on.push.tags` and ignores unrelated `tags:` blocks in other workflow sections, reducing false positives from matrix/env metadata keys.
10. **Inline push tag syntax is now parsed**
   Release trigger checks now also parse inline push object forms (for example `push: { tags: ["*.*.*"] }`), reducing drift risk when workflow YAML is compacted.
11. **Inline top-level `on` object syntax is now parsed**
   Release trigger checks now also parse compact top-level `on` object forms (for example `on: { push: { tags: ["*.*.*"] }, workflow_dispatch: {} }`), preserving trigger-guard truth when event declarations are fully inlined.
12. **`on` event-sequence workflow dispatch detection is now parsed**
   Release trigger checks now also detect `workflow_dispatch` from sequence and inline-array event declarations (for example `on` with `- workflow_dispatch`, or `on: [push, workflow_dispatch]`), reducing drift when workflow event syntax changes without changing intent.
13. **`on` sequence push-mapping tag syntax is now parsed**
   Release trigger checks now also parse `on` sequence entries that use push mappings (for example `- push:` with nested `tags`), preserving tag-trigger truth under alternate event declaration styles.
14. **Quoted YAML event keys are now parsed**
   Release trigger checks now also accept quoted workflow event keys and nested trigger keys (for example `'push':`, `"tags":`, and `'workflow_dispatch':`), reducing drift when workflows normalize key quoting styles.
15. **Quoted inline top-level `on` object forms are now regression-locked**
   Regression coverage now explicitly locks quoted inline top-level `on` object forms (for example `'on': { 'push': { "tags": [...] }, "workflow_dispatch": {} }`), keeping compact quoted declarations from silently regressing.
16. **`on` sequence workflow-dispatch mapping forms are now parsed**
   Release trigger checks now also parse `on` sequence mapping forms for workflow dispatch (for example `- workflow_dispatch: {}` and `- 'workflow_dispatch': {}`), reducing drift under sequence-map event declarations.
17. **Nested non-event workflow-dispatch keys are now guarded from false positives**
   Event-key detection is now constrained to top-level `on` mappings, preventing nested keys such as `workflow_call.inputs.workflow_dispatch` from being misinterpreted as release-trigger events.
18. **Inline push nested tags are now guarded from false positives**
   Inline `push` trigger parsing now only trusts top-level `push.tags` fields, preventing nested keys such as `push.filters.tags` from being misinterpreted as release-tag triggers.
19. **Multiline push nested tags are now guarded from false positives**
   Multiline `push` trigger parsing now only trusts first-level `push` mapping keys for `tags`, preventing nested blocks such as `push.filters.tags` from being misinterpreted as release-tag triggers.
20. **Multiline push tags nested-list shapes are now guarded from false positives**
   Multiline `push.tags` parsing now only trusts direct-list item shapes, preventing nested structures such as `push.tags.include` lists from being misinterpreted as release-tag triggers.
21. **On-sequence inline-object event mappings are now parsed**
   Release trigger checks now also parse `on` sequence inline-object forms (for example `- { push: { tags: [...] }, workflow_dispatch: {} }`) while still rejecting nested non-event keys inside those inline objects.
22. **Inline on-array object event items are now parsed**
   Release trigger checks now also parse inline `on` array object items (for example `on: [{ push: { tags: [...] } }, { workflow_dispatch: {} }]`) while still rejecting nested non-event keys inside those object items.

### Still open beyond convergence hardening

1. **True heavy-runtime packaging isolation**
   Not implemented yet; current truth is still single-entry `main.js + inline srcdoc`.
2. **Broader Stage-B contract promotion**
   Release and operation-promotion boundary truth are now captured in the helper, and the first broader selection/config/export metadata slice is now covered; deeper path/context semantics still depend on later packaging-boundary implementation constraints and host-adapter contract work.

## 4. Concrete Next-Step Plan (Persisted)

### Stage A: keep convergence stable (short cycle)

1. Require test-first updates for helper changes in `diagramSemanticVerificationScript.test.ts`.
2. Require bilingual maintainer doc sync for boundary wording changes.
3. Keep current full gate chain: `build + full test + audits + diff-check + obsidian/obsidian-cli checks`.

### Stage B: pre-implementation packaging research (mid cycle)

1. Define minimum viable multi-entry/dedicated-asset packaging direction in `esbuild.config.mjs` terms without immediate runtime rollout.
2. Define release-asset, install write-out, and fallback contracts before implementation.
3. Persist those contracts in the next PRD before touching runtime packaging.

### Stage C: real packaging-boundary implementation (later)

1. Land minimal multi-entry or dedicated host asset path.
2. Extend `audit:render-host` and semantic helper wording to the new truth.
3. Re-run doc/test/implementation three-way alignment in the same batch.

## 5. Risks And Controls

1. **Risk:** helper parser regresses on future config/registry shapes
   **Control:** add representative regression fixtures before merging parser changes.
2. **Risk:** docs outpace implementation again  
   **Control:** every “landed” statement must cite code paths and test surfaces.
3. **Risk:** premature heavy-runtime packaging work destabilizes CI  
   **Control:** finish Stage B contract definition before Stage C runtime changes.

## 6. Conclusion

Current `main` has reached a stable packaging/semantic convergence layer:

- helper communicates boundary truth with explicit exceptional-state handling
- docs/tests/script stay aligned
- CI gate remains green and repeatable

Next leverage should move to Stage B -> Stage C real packaging boundary work, not reopening already converged semantic-layer mechanics.

## 7. 2026-05-10 Deep Delta Audit And Concrete Landing Plan

### 7.1 Mainline Evidence Checkpoint

Current `main` now includes an uninterrupted anti-drift commit chain for release-trigger parsing:

- `087cd1a`: nested non-event key guard on top-level `on` mapping.
- `605a282`: inline push nested-tag false-positive guard.
- `5188ad3`: multiline push nested-tag false-positive guard.
- `63ad325`: multiline `push.tags` nested-list false-positive guard.
- `b545f91`: `on` sequence inline-object event mapping support.
- `5b55fba`: inline `on` array object-item event mapping support.

These slices stayed inside `scripts/diagram-semantic-verification.js` + `src/tests/diagramSemanticVerificationScript.test.ts` + progress docs, and did not reopen operation-layer contracts (`diagram.generate`, `diagram.preview`, `provider.connection.test`).

### 7.2 Prior-Requirement vs Code-Truth Deep Mapping

| Source requirement focus | Current code evidence | Progress state | Remaining gap |
|---|---|---|---|
| PRD R1: do not overclaim runtime isolation | `buildPackagingBoundaryChecklistLines()` + maintainer release wording still states single-entry `main.js + inline srcdoc` | Closed and stable | none in convergence layer |
| PRD R2: no operation-surface reopening | commit/file scope remains helper/tests/docs only | Closed and stable | none in this track |
| PRD R3/R5: durable helper + anti-drift tests | release-trigger parser now covers top-level inline/sequence/array/object variants with nested-key false-positive guards | Expanded and stable | keep adding fixtures before parser changes |
| PRD R4: docs aligned with helper truth | EN/ZH maintainers + EN/ZH progress docs track identical boundary claims | Closed and stable | maintain same-batch doc sync discipline |
| Stage-B contract-promotion extension intent | helper already derives operation contract metadata and wildcard expansions | Partially completed | deeper path/context semantics are still pending |
| Stage-C packaging intent | no multi-entry build/runtime split exists yet | Not started by design | requires Stage-B contract gate completion first |

### 7.3 Architecture Advancement Status (Layered)

1. **Contract-definition layer:** mature and executable.
   The semantic helper now encodes packaging boundary truth, release contract truth, workflow trigger contract truth, and contract-promotion boundary truth.
2. **Parser-resilience layer:** expanded with representation guards.
   Trigger parsing now tolerates compact YAML forms while rejecting nested non-event keys that previously produced false positives.
3. **Promotion-governance layer:** in progress.
   Coverage is broad for metadata truth extraction, but deeper cross-layer promotion constraints (path-level/runtime-level coupling) are not yet encoded.
4. **Runtime-isolation layer:** intentionally untouched.
   Multi-entry or dedicated heavy-runtime assets remain out of current code reality and must not be implied by docs.

### 7.4 Concrete Landing Plan (Persisted For Next Iteration)

#### Stage B1: Contract Closure (next short cycle, CI-safe)

1. Add regression fixtures for additional mixed-shape trigger declarations that combine quoted keys + sequence/object hybrids in one workflow.
2. Add helper-output assertions that ensure trigger-contract wording remains explicit when workflow parsing falls back.
3. Keep full gate chain mandatory per slice (`build`, full test, audits, diff-check, `obsidian help`, `obsidian-cli help`).

**Exit gate:** no trigger-shape drift without a failing test first; docs remain bilingual and same-batch synchronized.

#### Stage B2: Implementation Readiness Contracts (mid cycle)

1. Materialize a dedicated contract-research note for multi-entry candidate packaging in `esbuild.config.mjs` terms.
2. Define migration-safe release-helper contract updates for `outfile -> outdir` transition scenarios before touching runtime packaging.
3. Extend contract-promotion boundary checks to explicitly track which workflow/settings/export claims require runtime-isolation preconditions.

**Exit gate:** Stage-C work may start only after these contracts are written, testable, and documented.

#### Stage C0: Controlled Runtime-Boundary Start (later)

1. Introduce the minimum viable multi-entry or dedicated render-host asset split.
2. Update `audit:render-host` + semantic helper wording to match the new enforced truth.
3. Re-run three-way alignment in one batch: implementation + tests + EN/ZH maintainer/progress docs.

**Exit gate:** no release/maintainer wording claims isolation beyond what build outputs and audits prove.

### 7.5 Workspace Hygiene And Mainline Discipline

- Keep slices atomic and parser-focused until Stage-B2 contracts are complete.
- Never mix runtime-boundary implementation with broad refactor work in the same change batch.
- Require post-push clean-status verification (`git status --short --branch`) after every landed slice.
