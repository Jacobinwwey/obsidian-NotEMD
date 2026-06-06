---
date: 2026-05-25
last_updated: 2026-06-06
topic: post-bounded-recovery-audit-and-next-level-direction
canonical: true
---

# Post-Bounded-Recovery Audit And Next-Level Direction

## 1. Why This Document Exists

The repository is no longer at the same interpretive checkpoint as either:

1. the `1.8.9` release-boundary audit on 2026-05-13;
2. the force-rewrite baseline audit on 2026-05-24.

Since then, current `main` has regained a bounded but meaningful subset of the backup-branch breadth, shipped through the `1.9.2` boundary, and pushed Stage C follow-through further on the local-KB / chapter-split side. That changes the next-question set again:

- not “did recovery actually happen?”
- not even only “is the bounded product slice re-landed?”
- but “which architecture lanes are now materially converged, which ones are still structurally behind, and what is the real next-level control-plane work after the bounded recovery?”

Primary comparison sources:

1. `docs/brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.md`
2. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.md`
3. `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.md`
4. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
5. `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md`
6. `.trellis/tasks/05-27-provider-settings-model-discovery/prd.md`
7. live code on `main` after the `1.9.2` release boundary and post-release contract/evidence follow-through

Current-reading note:

1. this document remains the post-bounded-recovery checkpoint;
2. the newer current-main truth source is `docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md`;
3. the unified execution matrix remains `docs/brainstorms/2026-05-20-unified-follow-through-matrix.md`.

## 2. Current Code Truth After Recovery

### 2.1 Packaging / runtime truth

Current shipping truth is still narrower than the source tree might imply:

1. `esbuild.config.mjs` still builds a single `main.js` output.
2. `scripts/audit-render-host-bundle.js` still enforces the `main.js` + inline `srcdoc` host contract and rejects standalone render-host output files.
3. source still contains runtime-candidate files such as:
   - `src/rendering/runtime/renderHostEntry.ts`
   - `src/rendering/preview/renderHostRuntimeClient.ts`
   - shared Mermaid / Vega-Lite preview runtime helpers
4. those files are therefore a **latent implementation lane**, not yet a shipped build boundary.
5. current execution-path convergence explicitly keeps that lane dormant on `main`:
   - default Mermaid / Vega-Lite preview loading stays on package runtime
   - `audit:render-host` rejects stray `render-host.mjs` assets and built-bundle references on current `main`
   - `resolveBundledRenderHostRuntimeModuleSpecifier()` remains fail-closed unless an explicit runtime module specifier is configured
   - `createRenderHostBundleBuildOptions()` remains candidate-only and outside the production `esbuild.config.mjs` path unless build, release assets, audit, and docs move together

Interpretation:

- architecture has advanced at the source-organization layer;
- architecture has **not** advanced at the release-asset boundary yet.
- source/build split is now guarded by executable checks rather than only planning prose.

### 2.2 CLI / automation truth

The CLI story is now explicitly two-tier:

1. the public-safe export slice remains narrow and registry-derived;
2. the repo-local maintainer helper is wider, but still bounded and explicit.

Concrete current truth:

1. `npm run cli:help` now advertises:
   - `content.batch-generate-from-titles`
   - `content.split-note-by-chapters`
   - `research.summarize-topic`
   - `diagram.generate`
   - `local-knowledge.inspect`
   - plus the export surfaces
2. `src/maintainerCliBridge.ts` implements those path-based maintainer operations with explicit JSON/file payloads.
3. the maintainer-only `local-knowledge.inspect` seam now exposes effective path resolution, derived/explicit query, candidate file paths, raw formatted context, structured `contextBlocks` evidence, structured retrieval summaries, and temporary `knowledgePaths` override arrays for task-scoped local-KB debugging without widening the public-safe slice.
4. `content.split-note-by-chapters` is now also registry-backed and typed in `src/operations/registry.ts` / `src/cliContracts.ts`, while still remaining outside the current public-safe slice.
5. `content.split-note-by-chapters` maintainer invocation now supports optional `splitHeadingLevel` override instead of depending only on the current settings snapshot.
6. `content.split-note-by-chapters` typed results now also expose the managed artifact contract directly (`requestedSplitHeadingLevel`, `chapterNotePaths`, `managedArtifactPaths`, `removedStalePaths`) instead of forcing callers to reconstruct it from naming conventions.
7. `scripts/lib/maintainer-cli-operation-help.js` is the shared help/operation truth for that helper surface.
8. the public-safe export slice is still intentionally narrower than the maintainer helper.

Interpretation:

- current main is no longer “export-only maintainer helper”;
- it is still not a broad public CLI API.

### 2.3 Product-surface truth

The previously recovered product slices are now real current-main facts and no longer just backup-branch evidence:

1. local knowledge retrieval is wired for:
   - `Generate from title`
   - `Batch generate from titles`
   - `Research & Summarize`
   - `Generate diagram`
2. local knowledge retrieval settings now support mixed vault-relative file/folder path lists plus per-task override lists, with blank task overrides falling back to the default path list.
3. chapter split is live, with TOC/manifest output, deterministic TOC front-matter metadata, repeated-heading-safe nested block refs inside generated chapter notes/TOC targets, manifest-backed guarded rerun overwrite semantics, and stale generated-file cleanup.
4. preview history and saved-artifact-aware reopening are live in the reusable preview shell.
5. settings reset, concept-note prerequisite guidance, concept synonym suppression, and folder file-selection profiles are already back on current main.
6. retrieval-dependent note-processing results now expose machine-readable `localKnowledgeRetrieval` summaries for title generation and research, including matched/returned counts, source paths, requested `topK`, sliding-window size, current-file exclusion telemetry, index/query timing, and context-char count.
7. a dedicated offline retrieval-quality maintainer fixture now exists as `npm run verify:local-kb-fixtures`; it exercises the live MiniSearch-based retriever against a broader mixed-note/query regression corpus, task-scoped inspect cases, and real-note/query diversity beyond the chapter-split showcase instead of introducing a separate evaluation-only retrieval path.

Code-backed evidence includes:

1. `src/localKnowledgeBase.ts`
2. `src/chapterSplit.ts`
3. `src/ui/diagramPreviewHistory.ts`
4. `src/tests/localKnowledgeTaskIntegration.test.ts`
5. `src/tests/chapterSplit.test.ts`
6. `src/tests/diagramPreviewModal.test.ts`

### 2.4 Release / version / chronicle truth

Release-facing truth is aligned again on current main:

1. `package.json`, `manifest.json`, and `versions.json` are at `1.9.2`;
2. `src/ui/welcomeReleaseNotes.ts` now carries the `1.9.2` onboarding digest;
3. the root `README*.md` family carries synced `1.9.2` version/badge/footer state;
4. `docs/releases/1.9.2.md` and `docs/releases/1.9.2.zh-CN.md` are part of the current shipped truth surface;
5. `scripts/release/commit-chronicle-refresh.js` and `scripts/lib/repo-saga-contributor-normalization.js` are present again on current main;
6. repo-saga serial safety remains enforced by the lock helper plus docs;
7. release workflow assets, tag trigger, workflow-source branch, and chronicle-target branch truth now share `scripts/lib/packaging-contract.js` ownership instead of living only as YAML-local assumptions.

### 2.5 Provider settings / model-discovery truth

This lane has moved from planning/bootstrap into bounded breadth maintenance:

1. `src/llmProviders.ts` now carries shared provider-field taxonomy metadata for `core`, `contextual`, `advanced`, and `developer` fields.
2. `src/ui/NotemdSettingTab.ts` now renders provider settings from that metadata instead of treating provider-name branching as the main field-taxonomy owner.
3. the panel still keeps the flat `LLMProviderConfig` shape, preserving import/export and existing `data.json` compatibility while making `model` the persisted source-of-truth string.
4. advanced disclosure now derives from metadata plus persisted overrides, so existing explicit advanced values remain visible instead of being hidden by simplification.
5. current main includes bounded in-settings model discovery with a transient helper rather than a persisted remote model catalog.
6. discovery/runtime now share endpoint-family and header ownership seams for the current verified provider families.
7. discovered-model token metadata can guide provider-scoped output-token autofill, while arbitrary generic gateway ownership inference remains intentionally out of bounds.
8. Cherry Studio analysis now gives a concrete comparison target:
   - the strategy-registry and parser/fallback separation are worth reusing
   - the persisted `provider.models[]` lifecycle and heavier provider-domain state are too heavy for Notemd's current architecture
9. the remaining boundary is now intentionally product-scoped, not implementation-scoped:
   - no persisted `provider.models[]` catalog
   - no model CRUD subsystem
   - no broad all-provider discovery claim beyond the verified bounded family batch

Interpretation:

- provider settings/model discovery is no longer an unlanded UX architecture gap;
- the next product-facing control-plane work is not first delivery, but bounded breadth maintenance and truth discipline;
- this lane is no longer just a planning or isolated-implementation topic; the bounded provider-settings control-plane convergence is now landed on current main.

## 3. Deep Comparison Against Prior Requirement Tracks

### 3.1 Against `mainline-stabilization-next-batch`

What that plan asked for:

1. boundary hardening before new scope growth;
2. semantic verification as a maintained discipline rather than ad-hoc memory;
3. honest packaging language that matches real build truth;
4. Drawnix kept as a reference boundary rather than active scope creep.

What current code now proves:

1. command/help/preview follow-through is materially more converged than the original plan minimum;
2. semantic helper/runbook truth is landed and checked in;
3. Drawnix is still not being overclaimed as the next batch;
4. packaging wording is now backed by executable guardrails, but true multi-entry runtime shipping remains unresolved;
5. provider/runtime breadth and provider-settings metadata now share a bounded control plane, so the remaining risk is boundary drift rather than first implementation.

What remains open:

1. the next bottleneck is no longer “write the runbook”;
2. the first next-level bottleneck is still “decide whether the latent runtime lane stays dormant or becomes a real packaged boundary”;
3. the second next-level bottleneck is “keep provider discovery widening on shared family/shape seams without turning it into a persisted catalog or all-provider claim.”

### 3.2 Against the local-KB / chapter-split Stage-B2CD PRD

PRD requirement status on current `main`:

| Requirement | Status | Notes |
|---|---|---|
| R1 local KB retrieval for targeted tasks | Landed | Implemented through `src/localKnowledgeBase.ts` and task-specific integration paths, including `Generate from title` |
| R2 local-only / no cloud / no daemon / no GPU | Landed | Current implementation uses in-plugin MiniSearch indexing |
| R3 no regression when retrieval disabled | Landed | Guarded by optional settings and integration tests |
| R4 settings-driven / conservative defaults | Landed | Current settings path is user-visible and opt-in, with default file/folder source paths plus task-scoped overrides |
| R5 comparison research against candidate OSS | Landed | Recorded under `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/` |
| R6 add `章节拆分` action | Landed | Command/sidebar wiring exists on current main |
| R7 heading-based split + TOC artifact | Landed | `src/chapterSplit.ts` plus tests |
| R8 no regression to packaging / semantic truth | Landed | Build/audit still prove `main.js`-only shipping |
| R9 tests/docs/progress artifacts compare current code to prior plans | Landed, and now deeper | This document, the matrix updates, and `verify:local-kb-fixtures` together cover narrative progress alignment plus a bounded offline retrieval-quality regression check |
| R10 keep CI green and stability bar intact | Landed at current checkpoint | Verified by current repo gates |

Interpretation:

- the Stage-B2CD PRD is functionally landed on current main;
- the next work after this is quality/depth follow-through, not existence re-proof.

### 3.3 Against the provider-settings simplification / model-discovery PRD

Current requirement status:

| Requirement | Status | Notes |
|---|---|---|
| R1 provider settings must distinguish required/core from advanced fields | Landed | Current main now renders provider settings from shared core/contextual/advanced/developer field grouping metadata |
| R2 distinction must come from shared provider metadata | Landed | `LLMProviderDefinition` now carries `settingFields` metadata used by the settings panel |
| R3 preserve runtime behavior and import/export compatibility | Already aligned in the current data model | The flat persisted provider config keeps compatibility pressure low for the future refactor |
| R4 support Azure-specific required fields without forcing them onto others | Landed | `apiVersion` visibility is now expressed through provider metadata without changing the flat persisted shape |
| R5 keep common setup fast and visible | Landed in bounded form | Current main now defaults to core-first provider controls and pushes secondary tuning behind explicit advanced disclosure |
| R6 deeply analyze Cherry Studio model fetch design | Landed as research | `.trellis/tasks/05-27-provider-settings-model-discovery/research/cherry-studio-model-discovery.md` |
| R7 degrade gracefully to manual model entry | Landed | Discovery is additive/transient; manual `model` entry remains the persisted truth path and still works when discovery is unavailable or fails |
| R8 `model` must remain core/default-visible | Landed in current behavior | `model` is already a first-class visible field |
| R9 auto-expand advanced if persisted advanced values already exist | Landed | Current main now derives advanced expansion from persisted provider overrides |
| R10 reuse Cherry Studio selectively rather than cloning its whole architecture | Landed in bounded form | Current main uses transient discovery metadata/service rather than a persisted `provider.models[]` subsystem |

Interpretation:

1. the first provider-settings/model-discovery implementation is now landed on current main;
2. the plan should now be read as a control-plane contract and maintenance boundary;
3. the work remaining is bounded provider-family extension, parser/header/token-guidance discipline, and documentation truth maintenance.

### 3.4 Against the 2026-05-20 unified matrix

What has changed since the earlier matrix wording:

1. lane C should now carry `1.9.2` release-facing version truth, not `1.8.9`, `1.9.0`, or `1.9.1`;
2. the matrix needs an explicit provider-settings / model-discovery lane because that landed bounded surface is now large enough to distort future prioritization if it stays hidden under general settings wording;
3. lane D should remain “quality/depth next” rather than drifting back into “prove the feature exists” language.

## 4. Architecture Advancement Assessment

### 4.1 What genuinely advanced

1. **Transport-driven provider runtime deepened**
   provider breadth, test modes, known-model token metadata, and connection-test semantics are more mature than the earlier provider-expansion plans.
2. **Bounded product slices re-landed without widening packaging claims**
   local-KB, chapter split, preview history, and saved-artifact reopening came back without forcing docs to pretend packaged runtime isolation already exists.
3. **Cherry Studio comparison removed a large planning blind spot**
   the repo now has a concrete answer for what to reuse, what to reject, and why.
4. **The provider-settings lane is now a landed current-main capability**
   the architectural ambiguity has been resolved into a bounded shipped implementation instead of remaining a planning-only or isolated-lane topic.
5. **Release truth moved again after this checkpoint**
   `1.9.2` plus post-release contract follow-through made sidebar observability, inspect explainability, and release workflow contract ownership part of current-main truth.

### 4.2 What is structurally tense right now

1. **Source/build truth is no longer perfectly aligned**
   source contains render-host runtime candidates; build and audit still prove no shipped detached runtime asset.
2. **Provider discovery breadth now needs maintenance discipline**
   the control plane can scale through shared metadata, but only if new providers continue to use family/shape/header seams instead of ad hoc provider-name branches.
3. **A naive model-discovery feature would overshoot scope**
   copying Cherry Studio wholesale would create a second provider-state subsystem that Notemd does not need.
4. **The flat config shape is both a strength and a constraint**
   it preserves import/export and `data.json` compatibility, but it must not be stretched into a hidden persisted remote catalog.
5. **The next blocker is now scope discipline, not implementation bootstrap**
   the first-batch helper is landed, so the risk shifts from “can we converge this lane?” to “do we keep the discovery boundary lightweight and honest as provider breadth grows?”.

### 4.3 Correct interpretation

Current main is best described as:

1. past the “recovery existence proof” stage for the bounded product slice;
2. still before true Stage-C packaged runtime convergence;
3. past the first bounded provider-settings control-plane convergence milestone on current main, while still intentionally short of a heavy provider-model catalog subsystem;
4. still before any broad public CLI promotion.

## 5. Concrete Next-Level Plan

### Batch A: packaging source/build convergence decision

Priority: `P0`

Goal:

1. decide whether runtime-candidate source files stay explicitly non-shipped for now, or
2. move to a real packaged multi-entry boundary in one batch.

Required rule:

- do not keep a long-lived ambiguous middle state where source suggests `render-host.mjs` but build/release truth keeps denying it without explicit documentation.

Acceptance:

1. `esbuild.config.mjs`, `audit:render-host`, release-asset docs, and tests all agree;
2. README / maintainer docs stop carrying mixed signals;
3. `git status` stays clean after local verification.

Current decision on `main`:

- keep the render-host lane source-only for now, and enforce that truth in runtime loading plus audit coverage rather than partially reviving a shipped multi-entry contract.

### Batch B: bounded public-CLI promotion review

Priority: `P1`

Goal:

1. review whether any existing path-based maintainer operation is ready for a bounded public promotion;
2. keep non-ready operations maintainer-only on purpose.

Evaluation rule:

Promote only when:

1. inputs are explicit;
2. side effects are documented;
3. outputs are machine-readable enough for automation;
4. failure/progress semantics are deterministic.

### Batch C: local-KB / chapter-split quality follow-through

Priority: `P1`

Goal:

1. improve explainability and operator control without changing the local-only architecture;
2. keep the current lightweight retriever shape unless a better local-only fit is proven.

Likely areas:

1. keep extending richer result/evidence framing to the remaining chapter-split helper/example paths now that deterministic TOC front-matter metadata and repeated-heading-safe TOC block refs are landed alongside retrieval summaries plus timing telemetry for title-generation, research, and artifact-mode diagram generation;
2. the shared maintainer helper now carries compact payload examples for the retrieval-dependent paths, and current `main` now also includes a bounded `local-knowledge.inspect` seam for effective path/query/context inspection plus temporary override-path tuning; the next step is to keep those maintainer examples and inspect outputs aligned as result schemas evolve;
3. keep tuning/documentation around sliding-window size, snippet shaping, and folder-scope expectations, but treat the offline fixture as a broader landed baseline across exact/prefix/current-file-exclusion classes plus mixed file/folder task-scoped inspect cases, and shift the remaining chapter-split gap toward deeper corpus expansion rather than re-proving that the harness should exist.

### Batch D: provider-settings simplification + lightweight model discovery

Priority: `P1`

Goal:

1. keep the default provider panel core-first and metadata-driven;
2. keep `model` in the core/default-visible surface;
3. keep non-core tuning knobs behind explicit advanced disclosure while preserving visibility for persisted overrides;
4. keep optional model discovery as a lightweight transient helper, not as a second persisted provider-state system;
5. widen support only when endpoint semantics, header ownership, token-guidance behavior, tests, and docs move together.

Implementation shape:

1. preserve `LLMProviderDefinition` as the shared field/discovery metadata owner;
2. preserve `src/ui/NotemdSettingTab.ts` metadata-driven provider-field rendering rather than returning taxonomy decisions to provider-name branching;
3. keep `LLMProviderConfig.model` as the source-of-truth persisted string;
4. keep discovery services aligned with runtime/base-URL/header semantics;
5. future discovery additions should stay bounded through shared family/shape support rather than broad all-provider claims;
6. do **not** persist remote model catalogs in `data.json`;
7. keep manual model entry available even when discovery exists;
8. use an isolated worktree/branch for substantial widening batches, then merge only after docs/tests/verification agree.

Acceptance:

1. provider definitions keep expressing core/contextual/advanced/developer field grouping;
2. current users with persisted advanced values do not lose visibility of active behavior;
3. model-discovery failure never blocks manual configuration;
4. tests cover metadata-driven rendering, backward compatibility, discovery fallback, parser shapes, header ownership, and token-guidance behavior touched by the batch;
5. docs describe the exact capability boundary and do not overclaim Cherry Studio parity.

## 6. Task And Documentation Follow-Through Rule

For the next batch, keep these artifacts aligned together:

1. task-local Trellis artifact (`.trellis/tasks/...`)
2. current canonical progress matrix
3. this audit doc
4. the dedicated provider-settings/model-discovery topic doc
5. maintainer control docs if automation or packaging wording changes

## 7. Verification Gate

The next-level batch should continue to require:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. final clean `git status --short --branch`

## 8. Bottom Line

Current main is no longer mainly missing the bounded recovery slice.

Current main is now mainly carrying two next-level architecture questions:

1. keep the latent runtime lane explicitly dormant and documented as non-shipped, or promote it into a real packaged boundary with matching build, audit, docs, and release truth;
2. keep the landed provider settings/model-discovery control plane shared-core and lightweight as support widens, or let provider-specific exceptions and catalog-like state creep back in.

Those are now the actual next-level moves.
