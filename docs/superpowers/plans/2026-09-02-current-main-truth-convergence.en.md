---
date: 2026-09-02
last_updated: 2026-09-02
topic: current-main-truth-convergence
status: completed
canonical_for:
  - current-main-progress
  - plan-status-convergence
superseded_by: null
---

# Current Main Truth Convergence Implementation Plan

> **For agentic workers:** Execute inline in the current checkout. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile repository plans, capability documentation, and executable evidence with the current `main` implementation, then lock the resulting truth with automated contracts and release gates.

**Architecture:** Keep runtime registries and manifests as the only numeric sources of truth. Add one bilingual progress record for cross-plan status, update stale maintainer and plan metadata without rewriting historical rationale, and add a narrow contract test that fails when counts, paths, or release claims drift.

**Tech Stack:** TypeScript, Jest, Node.js CommonJS scripts, Markdown, VitePress, Docusaurus, GitHub release helper.

## Global Constraints

- Do not broaden target or consumer claims beyond checked-in evidence.
- Preserve the existing LM Studio release workflow as a documented compatibility path; the 1.9.7 Codex offline path is an explicit supplement.
- Keep English and Simplified Chinese documents semantically equivalent.
- Do not delete compatibility shims until repository and external-consumer call sites are inventoried.
- Use `apply_patch` for manual edits and prefix repository commands with `rtk`.
- Run the same build, test, docs, gallery, i18n, render-host, and clean-worktree gates before publishing.

---

### Task 1: Establish the canonical current-main progress record

**Files:**
- Create: `docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.md`
- Create: `docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md`

**Interfaces:**
- Consumes: executable catalog, provider registry, UI/site locale catalogs, operation registry, diagram examples manifest, release and packaging contracts.
- Produces: bilingual status matrix, evidence snapshot, deferred boundaries, risk register, and ordered forward plan.

- [x] **Step 1: Record the source counts and release baseline.**
- [x] **Step 2: Classify each active plan as shipped, active, deferred, historical, or superseded.**
- [x] **Step 3: State external consumer claims separately from serializer and public-API evidence.**
- [x] **Step 4: Mirror the complete record in Simplified Chinese.**

### Task 2: Reconcile stale documentation and plan metadata

**Files:**
- Modify: `docs/maintainer/diagram-capability-catalog.md`
- Modify: `docs/maintainer/diagram-capability-catalog.zh-CN.md`
- Modify: `docs/architecture.md`
- Modify: `docs/architecture.zh-CN.md`
- Modify: `docs/plans/2026-08-15-mermaid-normalization-consolidation.en.md`
- Modify: `docs/plans/2026-08-15-mermaid-normalization-consolidation.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.en.md`
- Modify: `docs/superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md`
- Modify: `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-08-29-diagram-examples-implementation.en.md`
- Modify: `docs/superpowers/plans/2026-08-29-diagram-examples-implementation.zh-CN.md`

**Interfaces:**
- Consumes: Task 1 current-main record and runtime manifests.
- Produces: accurate shipped/deferred wording while preserving historical design rationale.

- [x] **Step 1: Expand the capability catalog to all 33 executable rows and correct the five reference-only rows.**
- [x] **Step 2: Update architecture counts to 36 providers, 21 plugin locales, and the current target/catalog counts.**
- [x] **Step 3: Add explicit completion/follow-up status to the August diagram plans without deleting their checklists or rationale.**
- [x] **Step 4: Keep all bilingual counterparts aligned.**

### Task 3: Add the anti-drift contract test

**Files:**
- Create: `src/tests/currentMainProgressDocsContract.test.ts`

**Interfaces:**
- Consumes: `src/diagram/diagramTypeCatalog.ts`, `src/diagram/diagramCapabilityManifest.ts`, `src/llmProviders.ts`, `src/i18n/uiLocales.ts`, `website/src/lib/publishedLocales.mjs`, `docs/diagram-examples/manifest.json`, and Task 1/2 documents.
- Produces: a deterministic Jest failure when source counts, bilingual files, example coverage, or stale claims diverge.

- [x] **Step 1: Assert catalog, provider, target, locale, and example counts from runtime sources.**
- [x] **Step 2: Assert each executable diagram has bilingual example inputs and a manifest entry.**
- [x] **Step 3: Assert the capability catalog and current-main record contain the current count/status markers and do not contain known stale claims.**
- [x] **Step 4: Run the focused test, then the full Jest suite.**

### Task 4: Bound compatibility-layer cleanup

**Files:**
- Inspect only: `src/diagram/adapters/mermaid/legacyFixerUtils.ts`, `src/diagram/adapters/drawnix/drawnixRelationRouter.ts`, `src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts`, `src/diagram/adapters/drawnix/drawnixSourceCoverage.ts`, `src/rendering/preview/mermaidDefinitionShared.ts`, `src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts`.

**Interfaces:**
- Consumes: repository search and test call graphs.
- Produces: a documented migration decision; no deletion without a proven consumer-free boundary and focused regression coverage.

- [x] **Step 1: Inventory production, test, script, and documentation consumers.**
- [x] **Step 2: Keep compatibility exports that still have tests or maintainer callers.**
- [x] **Step 3: Record any deletion candidate in the current-main progress record instead of deleting by assumption.**

### Task 5: Verify and publish the convergence slice

**Files:**
- Verify: plugin source/tests, docs, website, release metadata, and clean Git state.

- [x] **Step 1: Run focused contract/docs tests.**
- [x] **Step 2: Run `npm.cmd run build`, full Jest, gallery/i18n/render-host/local-KB/consumer gates, and both docs builds.**
- [x] **Step 3: Run release dry-run and verify the remote 1.9.7 release remains bilingual with four required assets.**
- [x] **Step 4: Run `git diff --check` and confirm `main` is clean and ahead/behind status is understood.**
- [x] **Step 5: Commit the changes and push `origin/main`.**

## Completion Record (2026-09-02)

The convergence slice is complete. The remaining open items are intentionally external or future-scope: real Draw.io/Drawnix application import evidence, an Obsidian CLI installation suitable for host validation, a changed-lines lint ratchet, and any compatibility-shim deletion after an external migration window. No runtime feature is being marked complete solely from a stale checklist.
