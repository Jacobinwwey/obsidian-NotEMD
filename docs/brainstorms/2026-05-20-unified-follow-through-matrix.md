---
date: 2026-05-20
last_updated: 2026-05-25
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

1. live `origin/main` after the 2026-05-24 force rewrite, updated through the bounded-recovery sync now on `d81d84d`;
2. prior current-main documents:
   - `docs/brainstorms/2026-05-07-cli-next-phase-planning.*`
   - `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.*`
   - `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. backup-branch evidence from `backup/main-before-origin-force-20260524`.

## 3. Current Unified Matrix

| Lane | Current `origin/main` truth | Backup-branch evidence | Required next action | Misread to avoid | Priority |
|---|---|---|---|---|---|
| A. Packaging / semantic verification | Live build/audit truth is still single-entry `main.js` + inline `srcdoc`; source still contains render-host runtime candidate modules, but current execution and audit truth now explicitly keep them non-shipped by rejecting stray `render-host.mjs` assets/references | Later backup branch had a wider dedicated runtime-asset lane | Keep the current source-only decision explicit until a future batch ships a real multi-entry contract with build + release + audit + docs all updated together | Do not keep saying `render-host.mjs` is currently shipped on main just because candidate runtime code exists in `src/` | P0 |
| B. CLI / automation surface | Current main now has registry-backed config/profile export/import, redacted provider export, public-surface export, registry-backed typed `content.split-note-by-chapters`, and repo-local maintainer help/invoke scripts for bounded path-based operations plus exports | Backup branch also carried broader maintainer-bridge aspirations, but the current reintegration keeps the surface intentionally narrow | Keep maintainer helper scope explicit and only promote path-based operations to broader/public CLI status with same-batch contract/test/doc proof | Do not describe the current surface as a general-purpose public CLI or a free-form maintainer mutation API | P1 |
| C. User-facing settings / preview / onboarding | Current main now has preview flows, preview history, release-note digest in onboarding, provider diagnostics, settings reset, concept-note prerequisite guidance, API liveness/activity UI, and saved-artifact-aware preview recovery with `1.8.9` version truth resynced | Backup branch carried additional UX closure work, but the recovered slice is now re-proved on current main | Keep sidebar/preview/settings wording, i18n, saved-artifact behavior, and release-facing version truth aligned as the user-facing truth source | Do not regress to “these UX guardrails are missing on current main,” but also do not overclaim unrecovered UX ideas | P1 |
| D. Regex / file selection / local-KB / chapter split | Current main now has file-selection profiles, folder regex/glob filtering, `relativePath` / `basename` matching, optional subfolder inclusion control, local-KB retrieval, chapter split, their regression tests, and machine-readable retrieval summaries plus timing/size telemetry on the title-generation and research result paths | Backup branch provided the original recovery evidence; current main now carries the bounded product slice directly and the latest Stage C follow-through work | Treat the next step as remaining chapter-split / diagram-adjacent result framing and offline retrieval-quality evaluation follow-through, not existence re-proof | Do not keep writing these capabilities as backup-only or absent from live mainline, and do not flatten retrieval back down to boolean-only signaling in docs or contracts | P1 |
| E. Release / repo-saga / clean-state hygiene | Current main now has release/repo-saga scripts plus shared repo-saga execution lock, tests, docs, and local-artifact ignore guardrails | Backup branch motivated the guardrails; the bounded serial-safety slice is now back on current main | Preserve serial execution discipline for repo-saga refresh flows and keep clean-state proof as part of finish criteria | Do not confuse “script still exists” with permission to run repo-saga refresh paths in parallel | P0 |

## 4. Reconfirmed Current-Main Register

These items are safe to describe as present on current main:

1. packaging / semantic helper and maintainer docs;
2. inline render-host audit and related tests;
3. provider profile export/import command surfaces;
4. welcome-modal release digest;
5. preview artifact save/export helpers;
6. redacted/public-safe CLI export surfaces plus repo-local maintainer help/invoke for bounded path-based operations;
7. settings reset, concept-note prerequisite guidance, and concept synonym suppression;
8. file-selection profiles and folder-scope regex/glob control;
9. local knowledge-base retrieval, including machine-readable retrieval summaries on the title-generation and research result paths;
10. chapter split;
11. `1.8.9` release-facing version truth resync across package metadata, welcome digest, and README family.

These items must currently be described as **not proven on rewritten main**:

1. dedicated runtime assets on the shipped path;
2. any broader maintainer mutation surface beyond the current bounded path-based helper path;
3. any dedicated-runtime claim that bypasses the current single-entry `main.js` + inline `srcdoc` truth.

## 5. Single Execution Order

Unless a regression interrupts the order:

1. **P0**: keep packaging / semantic current-main truth honest
2. **P0**: restore clean-state and repo-saga serial guardrails
3. **P0/P1**: resolve the current source/build ambiguity around latent render-host runtime sources before widening packaging claims
4. **P1**: keep the bounded CLI / maintainer-surface truth narrow and well-tested, then decide whether any path-based operation merits bounded public promotion
5. **P1**: keep recovered user-facing settings / preview guardrails aligned across code, i18n, docs, and release-facing version truth
6. **P1/P2**: deepen file-selection, local-KB, and chapter-split quality only as bounded current-main work

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
