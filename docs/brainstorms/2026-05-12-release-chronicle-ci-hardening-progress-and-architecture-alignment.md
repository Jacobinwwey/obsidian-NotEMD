---
date: 2026-05-12
last_updated: 2026-05-13
topic: release-chronicle-ci-hardening-progress-and-architecture-alignment
---

# Release Chronicle CI Hardening: Deep Comparison, Progress, And Next Direction

## 1. Scope And Requirement Baseline

This document lands the concrete plan and current-state assessment for the `Release` workflow hardening slice that followed the `1.8.7` release.

Primary requirement sources:

1. `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`
3. `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md`
4. the failed `Release` workflow run for `1.8.7` (`25675613652`) and the successful repair-validation rerun (`25718241272`)

Delivery goals for this slice:

1. remove the single-shot fragility in the release chronicle follow-up push path;
2. keep the release workflow truth checked into the repository rather than hidden in inline shell;
3. preserve CI-safe discipline: code, tests, maintainer docs, and real workflow replay must agree;
4. leave `main` clean and synchronized after the repair path lands.

## 2. Failure Reality And Root Cause

The latest remote failure was not in the plugin build/test path.

- `publish` job succeeded.
- `refresh_chronicle` failed at the `Commit chronicle refresh` step.
- the actual failing operation was `git push origin HEAD:main`, which received a GitHub remote `500 Internal Server Error`.

Root-cause summary:

1. **The workflow used a one-shot push assumption**
   after generating chronicle artifacts, the workflow committed once and pushed once, with no recovery path for transient remote failures.
2. **The chronicle-commit logic only lived as inline shell**
   this made the most failure-prone part of the release path hard to test and easy to drift from documentation.
3. **Change detection was narrower than the real artifact surface**
   the old path relied on `git diff --quiet` for tracked files only, while chronicle refresh can legitimately involve tracked and untracked artifact candidates.

## 3. Implementation Mapping (Requirement -> Code Evidence)

| Requirement / Need | Code evidence | Status |
|---|---|---|
| Replace fragile inline chronicle push logic with checked-in helper | `scripts/release/commit-chronicle-refresh.js` | Landed |
| Detect chronicle changes via tracked + untracked status | `hasChronicleChanges()` using `git status --porcelain --untracked-files=all` | Landed |
| Stage only expected chronicle artifacts | `CHRONICLE_PATHS` + `stageChronicleFiles()` | Landed |
| Exit cleanly when nothing remains to commit | `commitChronicleRefresh()` no-op / staged-noop branches | Landed |
| Retry transient push failures | `pushChronicleCommitWithRetries()` | Landed |
| Recover if remote already contains the commit | `remoteContainsCommit()` + already-present success path | Landed |
| Recover if `main` advanced remotely | `fetchRemoteBranch()` + `rebaseOntoRemote()` + retry loop | Landed |
| Keep workflow truth aligned with checked-in helper | `.github/workflows/release.yml` calls helper directly | Landed |
| Lock behavior with regression tests | `src/tests/commitChronicleRefreshScript.test.ts` | Landed |
| Lock workflow contract against future inline-shell regression | `src/tests/githubReleaseWorkflow.test.ts` | Landed |
| Keep maintainer docs aligned with real recovery path | `docs/maintainer/release-workflow*.md` | Landed |

## 4. Architecture Advancement Assessment

This slice is materially better than the prior release-path state in three ways:

1. **Workflow shell -> repository-owned helper**
   the release-follow-up commit/push semantics are now first-class repository code, not ad hoc YAML shell.
2. **Best-effort push -> stateful recovery path**
   the chronicle publish path now distinguishes:
   - no-op
   - local commit + direct push success
   - remote already contains commit
   - remote advanced but can be rebased and retried
3. **Local green-only confidence -> real remote replay confidence**
   the repair was not left at local tests; the `Release` workflow was replayed against the existing `1.8.7` tag and completed successfully.

## 5. Deep Comparison Against Prior Plan Tracks

### 5.1 Against `mainline-stabilization-and-ci-hardening` requirements

Alignment:

1. **R1 truth-source control** is stronger now because the real release-follow-up behavior is explicitly checked into repo code and maintainer docs.
2. **R2 maintainer-facing CI truth distinction** remains intact; this change does not add ordinary `main` push/PR CI and stays inside the release-workflow truth model.
3. **R3 supported release path durability** is extended beyond action-major pinning into release-follow-up transport recovery.
4. **R9 repository hygiene** is preserved because only expected chronicle artifacts are staged/pushed.

Net effect:

- the original requirements were satisfied at the "workflow shape" level before;
- they are now satisfied at the "recovery behavior under real remote failure" level as well.

### 5.2 Against `mainline-stabilization-next-batch` intent

Alignment:

1. this is boundary hardening, not product-surface expansion;
2. it keeps the same CI-safe rule: checked-in truth + regression lock + full gates before landing;
3. it reduces release-path drift without reopening unrelated renderer/runtime packaging topology.

Difference:

- this slice advances the release automation boundary rather than end-user command/workflow behavior.

### 5.3 Against packaging / semantic convergence track

Alignment:

1. the same anti-drift pattern is used: centralize truth in helper code, then lock it with tests and docs;
2. the fix stays inside the release/verification boundary instead of prematurely expanding Stage-C runtime packaging work.

Difference:

- this slice does not implement packaging-boundary topology changes; it hardens the release-ops path that surrounds those later phases.

## 6. Risk Register And Controls

1. **Risk:** future chronicle refreshes generate a valid commit, but remote push returns intermittent transport/server failures again.
   **Control:** bounded retry with fetch/rebase/backoff and remote-contains-commit recovery path.
2. **Risk:** future workflow edits bypass the helper and reintroduce inline-shell drift.
   **Control:** workflow-contract regression now asserts the helper invocation and rejects the old direct `git push origin HEAD:main` pattern.
3. **Risk:** chronicle change detection misses untracked artifacts.
   **Control:** status-based change detection now includes `--untracked-files=all`.
4. **Risk:** follow-up chronicle docs lag behind the actual checked-in recovery behavior.
   **Control:** maintainer release docs were updated in the same landing batch.

## 7. Verification Evidence

### 7.1 Local gates

Executed and passed:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

### 7.2 Real remote validation

1. failing historical evidence:
   `Release` run `25675613652` failed in `refresh_chronicle` because the chronicle commit push hit remote `500`.
2. repair validation:
   `Release` workflow rerun `25718241272` completed successfully end-to-end.
3. post-rerun outcome:
   workflow follow-up chronicle commit landed on `main`, and local `main` was fast-forwarded back to the same tip.

## 8. Current Progress And Mainline State

Current mainline evidence:

1. repair commit: `2da94e0` (`fix(ci): harden chronicle release push recovery`)
2. workflow-generated follow-up chronicle commit: `c28bcee`
3. `main` and `origin/main` are synchronized at the same SHA after fast-forward pull

This means the repository is not left in a half-fixed state:

- helper landed;
- tests landed;
- docs landed;
- real workflow rerun passed;
- follow-up chronicle artifacts are already merged;
- working tree is clean.

## 9. Next Direction

1. Keep release-automation recovery logic centralized in checked-in helpers, not YAML shell, for any future post-publish step that mutates `main`.
2. If future release jobs add more repo-mutating follow-up steps, require the same standard as this slice:
   helper-first, regression-locked, real workflow replay before closing.
3. Continue the existing Stage-B2 packaging / semantic-verification convergence path without mixing heavy runtime-topology changes into release-ops hardening slices.

## 10. 2026-05-13 Serial-Execution Safety Addendum

The original `2026-05-12` chronicle hardening closed the remote-push recovery gap. Current `main` now adds a second, different protection layer that should be tracked explicitly:

### 10.1 What was still weak after the first repair

Even after `commit-chronicle-refresh.js` became recovery-aware, the repo-saga chronicle path still depended on operator discipline for one important assumption:

1. `npm run chronicle:sync-repo-saga`
2. `npm run chronicle:update`

These commands share `.cache/repo-saga-sources/` and `.cache/repo-saga-upstream/`. Parallel execution could still corrupt clone state or leave stale git lock files.

### 10.2 What current code now adds

1. `scripts/lib/repo-saga-execution-lock.js` adds a checked-in serial-execution lock with:
   - active-process refusal
   - stale-lock cleanup
   - explicit operator-facing error text
2. `scripts/repo-saga/update-quarterly-saga.mjs` now acquires that lock before mutating the shared cache roots.
3. `src/tests/repoSagaExecutionLock.test.ts` locks the serial-safety behavior directly.
4. `AGENTS.md` and `docs/maintainer/release-workflow*.md` now encode the same serial rule at the workflow layer.

### 10.3 Architecture interpretation

This is not “parallel repo-saga support.” It is a stricter and more honest boundary:

1. the shared-cache chronicle path is still serial by design;
2. the serial rule is now runtime-enforced instead of being a prose-only warning;
3. release-chronicle hardening therefore now covers both:
   - remote follow-up push recovery
   - shared-cache mutation safety

### 10.4 Forward rule

If future work genuinely needs concurrent repo-saga jobs, the right next step is not weakening the lock. The right next step is isolating cache roots and redefining the concurrency contract first.

Cross-reference for the broader current-state audit:

- `docs/brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.md`
