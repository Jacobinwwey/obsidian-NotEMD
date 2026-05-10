---
date: 2026-05-10
last_updated: 2026-05-10
topic: multi-entry-candidate-contract-and-stage-c-gate
---

# Stage-B2 Multi-Entry Candidate Contract And Stage-C Start Gate

## 1. Purpose And Scope

This document lands a concrete Stage-B2 contract artifact for the packaging/semantic convergence stream.  
It does not change runtime packaging yet. It defines the evidence boundary that must be true before Stage-C runtime work can begin.

Reference requirement sources:

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md` (R1-R6 + acceptance criteria)
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
3. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md`

## 2. Current Code Truth Snapshot (Mainline Evidence)

### 2.1 Build Boundary Truth (`esbuild.config.mjs`)

- `entryPoints: ["src/main.ts"]`
- `outfile: "main.js"`
- no `outdir` declared

Conclusion: current build truth is still a single-entry/single-output plugin bundle model.

### 2.2 Runtime Host Packaging Truth (`scripts/audit-render-host-bundle.js`)

- audit requires render-host markers inside `main.js`
- audit rejects standalone host artifacts:
  - `render-host.html`
  - `render-host.js`
  - `rendering-webview/index.html`
- audit rejects references that imply external host assets

Conclusion: the enforced boundary still proves inline `srcdoc` host containment, not dedicated host package isolation.

### 2.3 Release Asset Contract Truth (`scripts/release/publish-github-release.js`)

- `REQUIRED_RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'README.md']`
- release tag must match numeric `x.x.x` format

Conclusion: release contract still assumes `main.js` as the primary runtime delivery artifact.

### 2.4 Semantic Contract Truth (`scripts/diagram-semantic-verification.js`)

- helper template includes:
  - `Packaging Boundary`
  - `Packaging Contract`
  - `Contract Promotion Boundary`
  - `Implementation Readiness Contract`
- helper now encodes:
  - output-target truth (`outfile` vs `outdir`)
  - release asset contract truth
  - Stage-B2 runtime-isolation precondition mapping

Conclusion: semantic-layer contract expression is mature enough to gate Stage-C start, but runtime isolation is intentionally still a non-claim.

## 3. Deep Comparison: Prior Requirements vs Current Architecture Progress

| Requirement Track | Prior expectation | Current evidence | Progress | Gap to close before Stage-C |
|---|---|---|---|---|
| PRD R1 | No overclaim on heavy-runtime isolation | Build/audit/release all still anchored to `main.js` + inline host truth | Closed and stable | none |
| PRD R2 | Do not reopen operation semantic surfaces | convergence slices stay in helper/tests/docs scope | Closed and stable | none in this track |
| PRD R3/R5 | Durable contract checks with anti-drift coverage | helper + script tests + docs are aligned and expanding | Closed and stable | continue fail-first for parser/contract edits |
| PRD R4 | Doc claims must follow code truth | EN/ZH maintainer + progress/superpowers docs synchronized | Closed and stable | keep same-batch sync discipline |
| Superpowers Task 3 intent | Clarify runtime packaging boundary honestly | boundary language now explicit and enforced by audit/helper | Closed at truth-clarification level | actual multi-entry runtime split not started |
| Stage-B2 readiness intent | Materialize implementation-readiness contract before runtime work | helper now has readiness section and precondition map | Partially closed | add dedicated multi-entry candidate + migration contract gates |

## 4. Stage-B2 Candidate Contract (What Must Be Explicit Before Runtime Changes)

### 4.1 Candidate Packaging Direction (Pre-Implementation)

Candidate direction for Stage-C evaluation:

1. transition from single `outfile` to controlled `outdir` ownership
2. split dedicated host/runtime artifacts only when release/audit contracts are upgraded in the same batch
3. keep `main.js` compatibility expectations explicit during migration

This remains a candidate contract statement, not a landed implementation claim.

### 4.2 Required Contract Updates For `outfile -> outdir` Transition

If Stage-C starts, the same batch must include:

1. build truth update (`esbuild.config.mjs`) with explicit output ownership
2. audit truth update (`scripts/audit-render-host-bundle.js`) for allowed/disallowed artifact set
3. release contract update (`REQUIRED_RELEASE_ASSETS` and related tests/docs)
4. semantic helper wording/tests update to prevent stale single-entry claims

### 4.3 Promotion Claims Blocked By Runtime-Isolation Preconditions

Until runtime boundary implementation is actually delivered and verified, keep promotion claims blocked for tracked workflow/settings/export-adjacent operation narratives that depend on host isolation assumptions.

## 5. Stage-C Start Gate (All Must Pass)

Stage-C runtime-boundary implementation may start only when all gate conditions below are true:

1. **Contract Gate:** Stage-B2 candidate contract is written in docs and mirrored in helper wording.
2. **Test Gate:** fail-first regression cases exist for planned contract transitions.
3. **Audit Gate:** `audit:render-host` truth model for new asset topology is defined before build edits land.
4. **Release Gate:** release asset ownership and notes contract remain explicit after migration.
5. **Docs Gate:** maintainer + progress + superpowers EN/ZH docs are updated in the same batch as code truth changes.
6. **Repo Gate:** full verification chain passes (`build`, full tests, audits, `git diff --check`, `obsidian help`, `obsidian-cli help`).

## 6. Concrete Next Steps (Post-Document Landing)

1. Add focused fail-first fixtures for candidate transition semantics (`outfile` to `outdir`) in semantic helper script tests.
2. Draft explicit audit contract deltas for standalone host assets before changing build outputs.
3. Draft release-helper asset transition test cases to preserve `main.js` ownership semantics during migration.
4. Keep each slice atomic and CI-safe, then run the full gate chain.

## 7. Non-Claims (Guardrail)

This document does **not** claim:

- runtime isolation has already been implemented
- multi-entry build output is already shipped
- standalone render-host assets are already release-approved

Current truth remains: single-entry `src/main.ts -> main.js`, with inline host containment enforced by existing audit and release contracts.
