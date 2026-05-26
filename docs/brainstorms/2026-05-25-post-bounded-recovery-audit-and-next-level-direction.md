---
date: 2026-05-25
last_updated: 2026-05-25
topic: post-bounded-recovery-audit-and-next-level-direction
canonical: true
---

# Post-Bounded-Recovery Audit And Next-Level Direction

## 1. Why This Document Exists

The repository is no longer at the same interpretive checkpoint as either:

1. the `1.8.9` release-boundary audit on 2026-05-13;
2. the force-rewrite baseline audit on 2026-05-24.

Since then, current `main` has regained a bounded but meaningful subset of the backup-branch breadth, and the shipped version-facing surfaces have been resynchronized again. That means the right next-step document now has to answer a different question:

- not “is the missing recovery slice real?”
- but “what is the current code truth after recovery, how far did it move relative to the earlier plans, and what is the real next-level critical path?”

Primary comparison sources:

1. `docs/brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.md`
2. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.md`
3. `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.md`
4. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
5. `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md`
6. live code on `main` after `d81d84d`

## 2. Current Code Truth After Recovery

### 2.1 Packaging / runtime truth

Current shipping truth is still narrower than the source tree might imply:

1. `esbuild.config.mjs` still builds a single `main.js` output.
2. `scripts/audit-render-host-bundle.js` still enforces the `main.js + inline srcdoc` host contract and rejects standalone render-host output files.
3. source now contains runtime-candidate files such as:
   - `src/rendering/runtime/renderHostEntry.ts`
   - `src/rendering/preview/renderHostRuntimeClient.ts`
   - shared Mermaid / Vega-Lite preview runtime helpers
4. those files are therefore a **latent implementation lane**, not yet a shipped build boundary.
5. current execution-path convergence now explicitly keeps that lane dormant on `main`:
   - default Mermaid / Vega-Lite preview loading stays on package runtime
   - `audit:render-host` rejects stray `render-host.mjs` assets and built-bundle references on current `main`

Interpretation:

- architecture has advanced at the source-organization layer;
- architecture has **not** advanced at the release-asset boundary yet.

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
   - plus the export surfaces
2. `src/maintainerCliBridge.ts` implements those path-based maintainer operations with explicit JSON/file payloads.
3. `content.split-note-by-chapters` is now also registry-backed and typed in `src/operations/registry.ts` / `src/cliContracts.ts`, while still remaining outside the current public-safe slice.
4. `content.split-note-by-chapters` maintainer invocation now supports optional `splitHeadingLevel` override instead of depending only on the current settings snapshot.
5. `content.split-note-by-chapters` typed results now also expose the managed artifact contract directly (`requestedSplitHeadingLevel`, `chapterNotePaths`, `managedArtifactPaths`, `removedStalePaths`) instead of forcing callers to reconstruct it from naming conventions.
6. `scripts/lib/maintainer-cli-operation-help.js` is the shared help/operation truth for that helper surface.
7. the public-safe export slice is still intentionally narrower than the maintainer helper.

Interpretation:

- current main is no longer “export-only maintainer helper”;
- it is still not a broad public CLI API.

### 2.3 Product-surface truth

The previously recovered product slices are now real current-main facts and no longer just backup-branch evidence:

1. local knowledge retrieval is wired for:
   - `Batch generate from titles`
   - `Research & Summarize`
   - `Generate diagram`
2. chapter split is live, with TOC/manifest output, repeated-heading-safe nested block refs inside generated chapter notes/TOC targets, and stale generated-file cleanup.
3. preview history and saved-artifact-aware reopening are live in the reusable preview shell.
4. settings reset, concept-note prerequisite guidance, concept synonym suppression, and folder file-selection profiles are already back on current main.
5. retrieval-dependent note-processing results now expose machine-readable `localKnowledgeRetrieval` summaries for title generation and research, including matched/returned counts, source paths, requested `topK`, sliding-window size, current-file exclusion telemetry, index/query timing, and context-char count.
6. a dedicated offline retrieval-quality maintainer fixture now exists as `npm run verify:local-kb-fixtures`; it exercises the live MiniSearch-based retriever against a small regression corpus instead of introducing a separate evaluation-only retrieval path.

Code-backed evidence includes:

1. `src/localKnowledgeBase.ts`
2. `src/chapterSplit.ts`
3. `src/ui/diagramPreviewHistory.ts`
4. `src/tests/localKnowledgeTaskIntegration.test.ts`
5. `src/tests/chapterSplit.test.ts`
6. `src/tests/diagramPreviewModal.test.ts`

### 2.4 Release / version / chronicle truth

Release-facing truth is again aligned on current main:

1. `package.json`, `manifest.json`, and `versions.json` are back at `1.8.9`;
2. `src/ui/welcomeReleaseNotes.ts` now advances the onboarding digest to `1.8.9` / `1.8.8`;
3. the root `README*.md` family again carries the synced version/badge/footer state;
4. `scripts/release/commit-chronicle-refresh.js` and `scripts/lib/repo-saga-contributor-normalization.js` are present again on current main;
5. repo-saga serial safety remains enforced by the lock helper plus docs.

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
4. packaging wording is mostly honest again, but source/build ambiguity has re-entered through latent runtime candidate code.

What remains open:

1. the next bottleneck is no longer “write the runbook”;
2. the next bottleneck is “decide whether the latent runtime lane stays dormant or becomes a real packaged boundary.”

### 3.2 Against the local-KB / chapter-split Stage-B2CD PRD

PRD requirement status on current `main`:

| Requirement | Status | Notes |
|---|---|---|
| R1 local KB retrieval for targeted tasks | Landed | Implemented through `src/localKnowledgeBase.ts` and task-specific integration paths |
| R2 local-only / no cloud / no daemon / no GPU | Landed | Current implementation uses in-plugin MiniSearch indexing |
| R3 no regression when retrieval disabled | Landed | Guarded by optional settings and integration tests |
| R4 settings-driven / conservative defaults | Landed | Current settings path is user-visible and opt-in |
| R5 comparison research against candidate OSS | Landed | Recorded under `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/` |
| R6 add `章节拆分` action | Landed | Command/sidebar wiring exists on current main |
| R7 heading-based split + TOC artifact | Landed | `src/chapterSplit.ts` plus tests |
| R8 no regression to packaging / semantic truth | Landed | build/audit still prove `main.js`-only shipping |
| R9 tests/docs/progress artifacts compare current code to prior plans | Landed, and now deeper | This document, the matrix updates, and `verify:local-kb-fixtures` together now cover both narrative progress alignment and a bounded offline retrieval-quality regression check |
| R10 keep CI green and stability bar intact | Landed at current checkpoint | Verified by current repo gates |

Interpretation:

- the PRD is functionally landed on current main;
- the next work after this is quality/depth follow-through, not existence re-proof.

### 3.3 Against the 2026-05-20 unified matrix

What has changed since the earlier matrix wording:

1. lane B should no longer be described as export-only maintainer tooling;
2. lane A should now explicitly mention that runtime-candidate source files exist while build truth still does not ship them;
3. lane C now also has a recovered release-facing version-truth alignment story, not only UX guardrails;
4. lane D is now clearly in a “quality/depth next” state rather than “recover the feature existence” state.

## 4. Architecture Advancement Assessment

### 4.1 What genuinely advanced

1. **Registry-centered orchestration deepened**
   maintainer helper metadata, public-safe export surfaces, and operation identifiers are more coherent than the earlier recovered baseline.
2. **Product slices re-landed without widening release claims**
   local-KB, chapter split, preview history, and saved-artifact reopening came back without forcing the docs to pretend packaged runtime isolation already exists.
3. **Runtime-candidate code is now more reusable**
   shared preview runtime helpers reduce future Stage-C cost if multi-entry delivery is eventually chosen.

### 4.2 What is structurally tense right now

1. **Source/build truth is no longer perfectly aligned**
   source contains render-host runtime candidates; build and audit still prove no shipped detached runtime asset.
2. **Maintainer helper breadth exceeds public CLI breadth**
   that is acceptable by design, but it must remain explicit.
3. **Local-KB quality is still bounded by simple local indexing**
   the implementation is intentionally lightweight; future work is about tuning/explainability, not “more infrastructure.”

### 4.3 Correct interpretation

Current main is best described as:

1. past the “recovery existence proof” stage for the bounded product slice;
2. still before true Stage-C packaged runtime convergence;
3. still before any broad public CLI promotion.

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

1. keep extending richer result/evidence framing to the remaining chapter-split paths now that repeated-heading-safe TOC block refs are landed alongside retrieval summaries plus timing telemetry for title-generation, research, and artifact-mode diagram generation;
2. the shared maintainer helper now carries compact payload examples for the retrieval-dependent paths, so the next step is to keep those examples aligned as result schemas evolve;
3. keep tuning/documentation around sliding-window size, snippet shaping, and folder-scope expectations, but treat the offline fixture as landed baseline work and shift the remaining chapter-split gap toward overwrite-policy / optional metadata hardening plus richer query-class coverage rather than re-proving that the harness should exist.

## 6. Task And Documentation Follow-Through Rule

For the next batch, keep all four layers aligned together:

1. task-local Trellis artifact (`.trellis/tasks/...`)
2. current canonical progress matrix
3. topic-specific brainstorm / next-level audit doc
4. maintainer control docs if automation or packaging wording changes

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

Current main is now mainly carrying a new architectural question:

1. keep the latent runtime lane explicitly dormant and documented as non-shipped, or
2. promote it into a real packaged boundary with matching build, audit, docs, and release truth.

That is the actual next-level move.
