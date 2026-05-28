---
date: 2026-05-20
last_updated: 2026-05-28
topic: unified-follow-through-matrix
canonical: true
---

# Unified Follow-Through Matrix

> Purpose: keep one current execution matrix that distinguishes the **rewritten live mainline** from the **backup branch that still contains later work**, so future planning does not overclaim shipped progress or hide the next structural bottleneck.

## 1. Source-Of-Truth Rule

From this checkpoint onward:

1. Treat rewritten `origin/main` as the only source of shipped truth.
2. Treat `backup/main-before-origin-force-20260524` as reintegration evidence, not as current release truth.
3. Update this matrix first whenever current progress changes.
4. Do not mark a lane as “landed” on current main unless the code, tests, and docs all exist on the rewritten mainline.

## 2. Audit Baseline

This matrix is grounded in:

1. live `origin/main` after the 2026-05-24 force rewrite, audited against the current `main` working tree on 2026-05-28;
2. prior current-main documents:
   - `docs/brainstorms/2026-05-07-cli-next-phase-planning.*`
   - `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.*`
   - `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
   - `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
3. backup-branch evidence from `backup/main-before-origin-force-20260524`.

## 3. Current Unified Matrix

| Lane | Current `origin/main` truth | Backup-branch evidence | Required next action | Misread to avoid | Priority |
|---|---|---|---|---|---|
| A. Packaging / semantic verification | Live build/audit truth is still single-entry `main.js` + inline `srcdoc`; source still contains render-host runtime candidate modules, but current execution and audit truth explicitly keep them non-shipped by rejecting stray `render-host.mjs` assets/references | Later backup branch had a wider dedicated runtime-asset lane | Treat this again as the primary current-main architecture bottleneck: keep the current source-only decision explicit until a future batch ships a real multi-entry contract with build + release + audit + docs all updated together | Do not keep saying `render-host.mjs` is currently shipped on main just because candidate runtime code exists in `src/` | P0 |
| B. CLI / automation surface | Current main now has registry-backed config/profile export/import, redacted provider export, public-surface export, registry-backed typed `content.split-note-by-chapters`, and repo-local maintainer help/invoke scripts for bounded path-based operations plus exports, including maintainer-only `local-knowledge.inspect` retrieval introspection | Backup branch also carried broader maintainer-bridge aspirations, but the current reintegration keeps the surface intentionally narrow | Keep maintainer helper scope explicit and only promote path-based operations to broader/public CLI status with same-batch contract/test/doc proof; do not let recent provider/settings progress blur this split | Do not describe the current surface as a general-purpose public CLI or a free-form maintainer mutation API | P1 |
| C. User-facing settings / preview / onboarding | Current main now has preview flows, preview history, release-note digest in onboarding, provider diagnostics, settings reset, concept-note prerequisite guidance, API liveness/activity UI, saved-artifact-aware preview recovery, and `1.9.0` release-facing version truth resynced | Backup branch carried additional UX closure work, but the recovered slice is now re-proved on current main | Keep sidebar/preview/settings wording, i18n, saved-artifact behavior, and release-facing version truth aligned as the user-facing truth source | Do not regress to “these UX guardrails are missing on current main,” but also do not overclaim unrecovered UX ideas | P1 |
| D. Regex / file selection / local-KB / chapter split | Current main now has file-selection profiles, folder regex/glob filtering, `relativePath` / `basename` matching, optional subfolder inclusion control, local-KB retrieval for `Generate from title`, `Batch generate from titles`, `Research & Summarize`, and `Generate diagram`, mixed vault-relative file/folder knowledge-base path support, per-task knowledge-base override lists with default fallback semantics, chapter split, repeated-heading-safe TOC block refs, deterministic TOC front-matter metadata, manifest-backed guarded rerun overwrite semantics, their regression tests, machine-readable retrieval summaries plus timing/size telemetry on the title-generation, research, and artifact-mode diagram result paths, a maintainer-only retrieval inspect seam for effective path/query/context debugging, temporary `knowledgePaths` override arrays for ad hoc task-scoped retrieval inspection, and a broader dedicated offline fixture via `npm run verify:local-kb-fixtures` that also covers mixed file/folder task-scoped inspect cases | Backup branch provided the original recovery evidence; current main now carries the bounded product slice directly plus later Stage C follow-through work | Treat the next step as broader mixed-note/query corpus coverage, maintainer example alignment, and evaluation-depth follow-through, not existence re-proof | Do not keep writing these capabilities as backup-only or absent from live mainline, do not drop the single-title/task-scoped retrieval contract from docs, and do not flatten retrieval back down to boolean-only signaling in docs or contracts | P1 |
| E. Provider settings / model discovery | Current main now has a metadata-driven provider settings panel backed by shared field taxonomy in `src/llmProviders.ts`, explicit core/contextual/advanced/developer grouping, derived advanced auto-expand for persisted overrides, and bounded in-settings model discovery for a verified batch of OpenAI-compatible presets plus OpenRouter, LiteLLM proxy-family, Together, Anthropic, Ollama, Google, Huawei Cloud MaaS, Vercel AI Gateway, AIHubMix, GitHub Models, PPIO, OVMS, and xAI. Runtime and discovery now also share endpoint-family normalization plus compatibility-header ownership, transient discovered-model token guidance, wrapped registry/catalog parsing, and conservative resource-name normalization, while still keeping manual `model` as the only persisted provider-side source of truth | There was no meaningful backup-branch shipped implementation to restore here; the lane landed by combining current-main provider/runtime truth, Cherry Studio comparison research under `.trellis/tasks/05-27-provider-settings-model-discovery/`, and the verified isolated implementation lane | Treat this lane as bounded breadth-maintenance now: keep the lightweight discovery boundary honest, continue widening support through shared family/shape semantics instead of provider-name branching, and only add new families when endpoint semantics, header contracts, fallback behavior, token metadata, and tests/docs are all explicit | Do not over-claim full Cherry Studio parity, a persisted remote model catalog, or broad all-provider discovery coverage just because the bounded helper is now substantially wider than the original first batch | P1/P2 |
| F. Release / repo-saga / clean-state hygiene | Current main now has release/repo-saga scripts plus shared repo-saga execution lock, tests, docs, and local-artifact ignore guardrails; the current branch is clean again after the latest provider-lane closure | Backup branch motivated the guardrails; the bounded serial-safety slice is now back on current main | Preserve serial execution discipline for repo-saga refresh flows and keep clean-state proof as a maintained finish invariant rather than letting it slip back into deferred cleanup work | Do not confuse “script still exists” with permission to run repo-saga refresh paths in parallel, and do not reintroduce “we will clean it up later” finish drift | P0 |

## 4. Reconfirmed Current-Main Register

These items are safe to describe as present on current main:

1. packaging / semantic helper and maintainer docs;
2. inline render-host audit and related tests;
3. provider profile export/import command surfaces;
4. welcome-modal release digest;
5. preview artifact save/export helpers;
6. redacted/public-safe CLI export surfaces plus repo-local maintainer help/invoke for bounded path-based operations;
7. settings reset, concept-note prerequisite guidance, concept synonym suppression, and API liveness/activity UI;
8. file-selection profiles and folder-scope regex/glob control;
9. local knowledge-base retrieval, including single-title plus task-scoped enablement, mixed file/folder source paths, machine-readable retrieval summaries on the title-generation, research, and artifact-mode diagram result paths, the maintainer-only `local-knowledge.inspect` seam for effective path/query/context debugging, temporary `knowledgePaths` override arrays for ad hoc task-scoped inspection, plus the bounded offline fixture exposed as `npm run verify:local-kb-fixtures`, widened to include mixed file/folder task-scoped inspect cases;
10. chapter split, including repeated-heading-safe TOC block refs, deterministic TOC front-matter metadata, and guarded rerun overwrite semantics;
11. `1.9.0` release-facing version truth resync across package metadata, welcome digest, README family, and release-note artifacts;
12. transport-driven provider registry growth plus connection-test semantics such as OpenAI-compatible base-URL normalization and `models-then-chat` probing, while still keeping manual model entry as the live configuration truth;
13. schema-driven provider-settings field grouping, derived advanced auto-expand, and in-plugin provider model discovery suggestions for the current bounded family batch, including OpenAI-compatible presets, OpenRouter, LiteLLM proxy-family, Together, Anthropic, Ollama, Google, Huawei Cloud MaaS, Vercel AI Gateway, AIHubMix, GitHub Models, PPIO, OVMS, and xAI;
14. host-aware and discovery-aware token-cap guidance, including trusted-host reuse for bare `OpenAI Compatible` model IDs, a global auto-managed baseline for typed model changes, and transient discovered-model max-output-token hints that drive provider-scoped output-token autofill without silently rewriting global `Max tokens`.

These items must currently be described as **not proven on rewritten main**:

1. dedicated runtime assets on the shipped path;
2. any broader maintainer mutation surface beyond the current bounded path-based helper path;
3. any dedicated-runtime claim that bypasses the current single-entry `main.js` + inline `srcdoc` truth;
4. a persisted provider model catalog or Cherry Studio-style model CRUD subsystem on current main;
5. all-provider remote model discovery coverage or any claim that arbitrary custom gateways automatically get authoritative model discovery, token metadata, or provider ownership inference.

## 5. Single Execution Order

Unless a regression interrupts the order:

1. **P0**: keep packaging / semantic current-main truth honest
2. **P0/P1**: resolve the current source/build ambiguity around latent render-host runtime sources before widening packaging claims
3. **P1**: keep the bounded CLI / maintainer-surface truth narrow and well-tested, then decide whether any path-based operation merits bounded public promotion
4. **P1**: deepen file-selection, local-KB, and chapter-split quality through broader corpus evaluation and maintainer-example alignment instead of feature-existence re-proof
5. **P1/P2**: keep the landed provider-settings/model-discovery control plane honest as a maintenance lane, and only widen families through explicit shared-core semantics
6. **P1**: keep recovered user-facing settings / preview guardrails aligned across code, i18n, docs, and `1.9.0` release-facing version truth
7. **P0**: preserve repo-saga serial guardrails and clean-state proof as finish criteria across every batch

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
