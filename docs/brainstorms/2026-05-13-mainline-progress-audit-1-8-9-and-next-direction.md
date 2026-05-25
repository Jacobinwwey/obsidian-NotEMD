---
date: 2026-05-13
last_updated: 2026-05-13
topic: mainline-progress-audit-1-8-9-and-next-direction
---

# Mainline Progress Audit After 1.8.9: Deep Comparison, Current State, And Next Direction

## 1. Scope And Baseline

This document records the current-state audit requested after the `1.8.9` release boundary and compares live code truth against the earlier mainline plans.

Primary comparison sources:

1. `.trellis/tasks/05-07-sync-main-progress-audit/prd.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
4. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md`
5. `docs/brainstorms/2026-05-12-release-chronicle-ci-hardening-progress-and-architecture-alignment.md`
6. `docs/brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.md`
7. shipped release truth in `docs/releases/1.8.9.md`, `change.md`, `README.md`, and `src/ui/welcomeReleaseNotes.ts`

Audit intent:

1. distinguish shipped convergence from still-open architecture work;
2. prevent the progress docs from overclaiming packaging/runtime advancement;
3. persist a concrete next-step plan grounded in the current `main` codebase.

## 2. Current Code Truth Snapshot

### 2.1 Diagram preview boundary

Current preview behavior is materially stronger than the earlier “saved artifact fallback” baseline:

1. `src/operations/diagramCommandHostAdapter.ts` now keeps `Preview diagram` on a canonical direct-preview path for supported saved artifacts instead of assuming re-generation.
2. `src/ui/DiagramPreviewModal.ts` is now a reusable preview shell rather than only a one-shot post-generation view:
   - vertical action rail
   - history panel
   - frame-safe layout that keeps controls visible without unnecessary horizontal scrolling
3. `src/ui/diagramPreviewHistory.ts` adds a bounded in-memory preview-session history (`MAX_DIAGRAM_PREVIEW_HISTORY = 12`) keyed by saved-source truth instead of only modal-open order.
4. `src/tests/diagramPreviewModal.test.ts`, `src/tests/diagramCommandHostAdapter.test.ts`, and `src/tests/diagramCommandExecution.test.ts` lock the direct-preview and reopen behavior.

Important non-claim:

- this is preview-surface convergence, not a new renderer/runtime topology.
- current code still does not prove heavy-runtime packaging isolation or detached preview assets.

### 2.2 Release chronicle / repo-saga hardening boundary

Release follow-up hardening has moved beyond one-off retry logic:

1. `scripts/release/commit-chronicle-refresh.js` already owns tracked/untracked chronicle staging plus bounded push-recovery behavior.
2. `scripts/lib/repo-saga-execution-lock.js` now adds an executable serial lock for repo-saga chronicle operations.
3. `scripts/repo-saga/update-quarterly-saga.mjs` now acquires that lock before touching the shared repo-saga cache roots.
4. `src/tests/repoSagaExecutionLock.test.ts` locks:
   - first-acquire success
   - active-lock refusal
   - stale-lock cleanup and reacquire behavior
5. `docs/maintainer/release-workflow*.md` and `AGENTS.md` now treat `chronicle:sync-repo-saga` and `chronicle:update` as explicit serial gates rather than an operator convention.

Important non-claim:

- this does not make repo-saga parallel-safe.
- it turns the existing serial requirement into a runtime-enforced and doc-enforced rule.

### 2.3 Release truth synchronization boundary

The `1.8.9` release boundary is internally aligned:

1. `docs/releases/1.8.9.md`
2. `docs/releases/1.8.9.zh-CN.md`
3. `change.md`
4. `README.md`
5. `README_zh.md`
6. `src/ui/welcomeReleaseNotes.ts`

That alignment now captures two distinct truths together:

1. saved Mermaid reopen behavior no longer drifts between first preview and later manual preview;
2. the welcome-modal “latest two releases” digest has advanced to `1.8.9` / `1.8.8`.

## 3. Deep Comparison Against Prior Plan Tracks

### 3.1 Against `mainline-stabilization-next-batch`

What the plan asked for:

1. boundary-hardening over scope creep;
2. code/tests/docs landing in the same batch;
3. honest differentiation between landed product stabilization and future packaging work.

What current `main` now proves:

1. preview truth convergence is landed, not merely planned;
2. release follow-up recovery and repo-saga serial safety are both repo-owned and regression-locked;
3. release-version truth, preview UX truth, and welcome-modal truth are aligned at `1.8.9`.

What is still open:

1. Stage-B2 -> Stage-C packaging work remains the real next critical path;
2. current preview progress should not be misread as a reason to defer packaging/semantic convergence again.

Interpretation:

- `1.8.9` is a boundary-convergence release.
- it is not a renderer-expansion release.

### 3.2 Against `diagram-rendering-platform-roadmap`

What the roadmap asked for:

1. canonical preview entrypoints;
2. a reusable preview/render host surface;
3. explicit truth about supported preview/export targets;
4. later runtime-boundary isolation only after contract/pipeline convergence.

What current code now proves:

1. canonical preview entrypoints are real and reused by saved-artifact preview flows;
2. `DiagramPreviewModal` has moved from “minimum skeleton” toward a product-usable host shell;
3. history switching and frame-safe controls are now part of the preview boundary, not external workaround behavior;
4. the roadmap’s “support is explicit, not universal” constraint still holds.

What is still open:

1. no dedicated render-host asset bundle exists;
2. no multi-entry packaging topology exists;
3. no new claim should imply universal renderer parity or detached heavy-runtime delivery.

Interpretation:

- Task-4/Task-5 style preview convergence advanced materially.
- Stage-C runtime-boundary work still has not started in code truth.

### 3.3 Against `packaging-semantic-convergence`

What the convergence track asked for:

1. keep current `main.js + inline srcdoc` truth explicit;
2. avoid reopening operation boundaries while hardening helper/docs/tests;
3. only move to runtime packaging after contract-definition gates are written and locked.

What current `main` now proves:

1. none of the `1.8.9` preview/release work contradicts the current packaging truth;
2. the repo still ships single-entry bundling;
3. the release and preview convergence slices did not accidentally overstate runtime isolation.

What is still open:

1. Stage-B2 packaging-contract promotion still needs to convert the current documented intent into tighter implementation-readiness artifacts;
2. Stage-C runtime work remains blocked on those contracts by design.

Interpretation:

- the packaging track is still the correct next phase.
- preview and release hardening should now stop stealing that critical path unless a regression forces it.

### 3.4 Against release-chronicle / CI hardening

What the earlier chronicle hardening solved:

1. bounded push retry and rebase recovery after remote `500` failures;
2. repo-owned helper instead of inline-shell commit/push logic.

What current code adds on top:

1. repo-saga chronicle commands now have an executable serial lock, not only prose warnings;
2. maintainer workflow guidance and AGENTS-level guardrails explicitly encode the serial rule;
3. current hardening now covers both:
   - release follow-up push recovery
   - shared-cache mutation safety

Interpretation:

- the release-chronicle track has progressed from transport recovery to concurrency-risk containment.

## 4. Architecture Advancement Assessment

### 4.1 What has genuinely advanced

1. **Preview truth moved from ephemeral state to persisted-source truth**
   manual `Preview diagram` now reopens the saved Mermaid source path rather than relying on stale in-memory artifact assumptions.
2. **Preview UI became a reusable operator surface**
   the modal now supports repeated inspection and switching, not just “show once after generation.”
3. **Release chronicle safety moved from etiquette to enforcement**
   repo-saga serial execution is now guarded in code and in maintainer workflow rules.

### 4.2 What has not advanced and must stay explicit

1. heavy-runtime packaging isolation is still not landed;
2. multi-entry output topology is still not landed;
3. preview history is in-memory session state, not a cross-session persisted catalog;
4. repo-saga concurrency is still prevented, not solved through isolated caches or parallel-safe design.

## 5. Risks And Controls

1. **Risk:** future docs treat preview convergence as evidence that the runtime-boundary roadmap is basically complete.
   **Control:** keep `main.js + inline srcdoc` truth explicit in every packaging-facing doc.
2. **Risk:** maintainers later parallelize repo-saga steps in CI because the current lock “usually works.”
   **Control:** keep the serial rule in `AGENTS.md`, release-workflow docs, and runtime lock helper together; do not loosen one without changing all three.
3. **Risk:** preview-history UX grows into state persistence without a real contract.
   **Control:** keep history in-memory until there is an explicit PRD for persisted preview history semantics.
4. **Risk:** a generic Mermaid fixer path is reintroduced into preview reopening and breaks non-flowchart diagrams again.
   **Control:** preserve the current type-aware preview path and keep broad fixer logic out of saved-preview reopening unless it is regression-locked by diagram subtype.

## 6. Concrete Next Direction

### Priority 1: resume packaging / semantic critical path

1. continue Stage-B2 implementation-readiness contracts from the already-landed semantic helper truth;
2. do not reopen preview UI work unless a user-visible regression appears;
3. keep future packaging claims constrained to what `esbuild.config.mjs`, audits, and tests can prove.

### Priority 2: treat preview as convergence maintenance, not open-ended feature expansion

1. only add persisted preview history if a real cross-session workflow needs it;
2. keep preview entrypoints canonical across command/sidebar/workflow surfaces;
3. avoid branching the preview path by artifact subtype unless a concrete regression requires it.

### Priority 3: keep repo-saga hardening conservative

1. preserve serial execution for shared-cache chronicle commands;
2. if parallelism is ever needed, isolate cache roots first and only then revisit lock scope;
3. keep repo-mutating release follow-up steps helper-first and regression-locked.

## 7. Mainline State Interpretation

This audit should be read as follows:

1. `1.8.9` closed a real preview-truth/preview-UX/release-truth slice on `main`;
2. the repo-saga serial anti-error rule is now both documented and executable;
3. the repository is more converged at the product boundary and the release-ops boundary than it was at `1.8.8`;
4. the next meaningful architecture step is still packaging-boundary convergence, not further broad UI churn.
