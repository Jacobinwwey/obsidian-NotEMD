---
date: 2026-05-20
last_updated: 2026-05-24
topic: unified-follow-through-matrix
canonical: true
---

# Unified Follow-Through Matrix

> Purpose: keep one current execution matrix that distinguishes the **rewritten live mainline** from the **backup branch that still contains later work**, so future planning does not overclaim shipped progress.

## 1. Source-Of-Truth Rule

From this checkpoint onward:

1. Treat rewritten `origin/main` as the only source of shipped truth.
2. Treat `backup/main-before-origin-force-20260524` as reintegration evidence, not as current release truth.
3. Update this matrix first whenever current progress changes.
4. Do not mark a lane as “landed” on current main unless the code, tests, and docs all exist on the rewritten mainline.

## 2. Audit Baseline

This matrix is grounded in:

1. live `origin/main` after the 2026-05-24 force rewrite (`0227f1b` at audit time);
2. prior current-main documents:
   - `docs/brainstorms/2026-05-07-cli-next-phase-planning.*`
   - `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.*`
   - `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. backup-branch evidence from `backup/main-before-origin-force-20260524`.

## 3. Current Unified Matrix

| Lane | Current `origin/main` truth | Backup-branch evidence | Required next action | Misread to avoid | Priority |
|---|---|---|---|---|---|
| A. Packaging / semantic verification | Live code is still single-entry `main.js` + inline `srcdoc`; helper/docs/tests correctly describe that boundary | Later backup branch had a wider dedicated runtime-asset lane | Keep current single-entry truth explicit; only widen topology with same-batch code + audit + docs proof | Do not keep saying `render-host.mjs` is currently shipped on main | P0 |
| B. CLI / automation surface | Current main has registry-backed config/profile export/import plus capability/invocation contract export surfaces | Backup branch later added a bounded maintainer bridge, shared help-truth source, and narrower public-surface wording | Decide whether to reintegrate bridge/help work in bounded batches after current-main truth is stabilized | Do not describe the backup maintainer bridge as if it still exists on current main | P1 |
| C. User-facing settings / preview / onboarding | Current main still has preview flows, release-note digest in onboarding, provider diagnostics, and canonical diagram wording | Backup branch later added settings reset, concept-note guard, richer preview history/layout, sidebar liveness/activity hardening, and more UX closure | Re-audit which user-facing guardrails must be restored first, then reintegrate in small slices | Do not assume current main still includes every later UX hardening item | P1 |
| D. Regex / file selection / local-KB / chapter split | No current-main code/test evidence for file-selection profiles, local-KB retrieval, or chapter split on the rewritten branch | Backup branch had those features plus tests such as `folderTaskFileSelector`, `localKnowledgeBase`, `localKnowledgeTaskIntegration`, and `chapterSplit` | Treat these as a reintegration program, not as already-shipped functionality | Do not let old roadmap wording imply these features are still on the live mainline | P1/P2 |
| E. Release / repo-saga / clean-state hygiene | Current main has release and repo-saga scripts, but local generated artifacts were not ignored and serial anti-error guardrails are not all preserved | Backup branch later added repo-saga serial lock/test/doc hardening and broader clean-state discipline | Restore guardrails that keep local verification from dirtying the repo and re-encode serial execution rules as needed | Do not confuse “script exists” with “serial safety and clean-state closure are still enforced” | P0 |

## 4. Reconfirmed Current-Main Register

These items are safe to describe as present on current main:

1. packaging / semantic helper and maintainer docs;
2. inline render-host audit and related tests;
3. provider profile export/import command surfaces;
4. welcome-modal release digest;
5. preview artifact save/export helpers.

These items must currently be described as **not proven on rewritten main**:

1. dedicated runtime assets on the shipped path;
2. maintainer bridge help/runtime scripts from the later branch;
3. file-selection profiles and folder-scope regex/glob control;
4. local knowledge-base retrieval;
5. chapter split;
6. settings reset and the later concept-note/synonym/product guardrails from the backup branch.

## 5. Single Execution Order

Unless a regression interrupts the order:

1. **P0**: keep packaging / semantic current-main truth honest
2. **P0**: restore clean-state and repo-saga serial guardrails
3. **P1**: restore bounded CLI / maintainer-surface truth if still desired
4. **P1**: re-audit and selectively reintegrate user-facing guardrails
5. **P1/P2**: reintegrate file-selection, local-KB, and chapter-split only as re-proved current-main slices

## 6. Documentation Sync Rule

For every lane touched, at minimum re-check:

1. `change.md`
2. the topic-specific brainstorm doc
3. this matrix
4. the relevant maintainer doc if automation/verification wording changed

## 7. Verification Gate

Any change that updates this matrix must finish with:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean `git status --short --branch`
