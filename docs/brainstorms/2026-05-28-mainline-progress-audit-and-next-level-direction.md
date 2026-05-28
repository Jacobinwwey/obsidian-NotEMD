---
date: 2026-05-28
last_updated: 2026-05-28
topic: mainline-progress-audit-and-next-level-direction
canonical: true
---

# Mainline Progress Audit And Next-Level Direction

## 1. Why This Document Exists

The repository has moved again since the 2026-05-25 bounded-recovery audit.

The mainline is no longer best described as:

1. still proving whether bounded recovery landed;
2. still only carrying the first provider-settings/model-discovery milestone;
3. still lacking a stable description of the current control-plane boundaries.

The current need is narrower and more operational:

1. restate current-main truth after the latest provider-settings and discovery convergence work;
2. compare that truth against the earlier plan language and identify where those documents are now stale;
3. define the next bounded direction without re-opening already-closed existence questions.

Primary comparison sources:

1. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.md`
2. `docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.md`
3. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.md`
4. `.trellis/spec/claude-dev/frontend/provider-settings-model-discovery.md`
5. live code in:
   - `src/llmProviders.ts`
   - `src/providerModelDiscovery.ts`
   - `src/openaiCompatibleEndpointFamily.ts`
   - `src/providerRequestHeaders.ts`
   - `src/ui/NotemdSettingTab.ts`
   - `src/main.ts`
   - `src/llmUtils.ts`

## 2. Current Mainline Truth

### 2.1 Packaging / runtime truth is still intentionally narrow

No meaningful change in shipping boundary happened in this lane:

1. current build truth is still single-entry `main.js`;
2. `audit:render-host` still enforces inline/runtime-host truth rather than a shipped detached render-host asset;
3. source continues to contain latent render-host/runtime candidates, but they are still source-organization truth, not release truth.

Interpretation:

1. packaging is still a separate architecture lane;
2. provider-settings/model-discovery progress must not be allowed to blur packaging truth.

### 2.2 CLI / automation truth is unchanged in boundary, not in importance

The recent provider work did not widen the public CLI surface.

Current truth remains:

1. the public-safe export slice is still deliberately narrow;
2. maintainer/helper surfaces remain wider but bounded;
3. provider-settings/model-discovery improvements are still product-surface and settings-surface work, not evidence of a broader public CLI contract.

Interpretation:

1. do not let new provider helper capabilities leak into public-CLI claims;
2. CLI expansion remains a separate decision gate.

### 2.3 Product-surface truth remains materially ahead of the old recovery baseline

The earlier bounded-recovery slices remain landed on current main:

1. preview history and saved-artifact-aware reopening;
2. onboarding release digest;
3. settings reset;
4. concept-note prerequisite guidance;
5. local knowledge-base retrieval for the bounded task set;
6. chapter split plus deterministic managed-artifact behavior;
7. regex/file-selection profiles and batch-input control;
8. API liveness/activity UI and related operator feedback surfaces.

Interpretation:

1. the current progress bottleneck is no longer “did the user-facing guardrails come back?”;
2. the next bottleneck is control-plane convergence and bounded breadth management.

### 2.4 Provider settings and model discovery are now the main current-main control-plane truth shift

Current `main` now directly carries a broader bounded convergence than the earlier 2026-05-25 audit language captured.

What is materially true now:

1. `src/llmProviders.ts` is no longer only transport/runtime metadata:
   - it now carries shared `settingFields` taxonomy (`core`, `contextual`, `advanced`, `developer`);
   - it now carries per-provider `modelDiscovery` metadata;
   - it now resolves provider-specific/manual-first discovery disable reasons;
   - it now supports canonical provider-name normalization and host-aware known-model token lookup.
2. `src/ui/NotemdSettingTab.ts` is no longer primarily provider-name-driven for settings taxonomy:
   - the provider panel now renders through shared field metadata;
   - advanced disclosure open/close state persists across re-renders in the settings session;
   - persisted advanced/developer overrides still force visibility when needed;
   - discovered-model selection now updates the model field, gives apply feedback, collapses the discovered-model panel, and participates in model-aware token syncing.
3. `src/providerModelDiscovery.ts` is no longer only a minimal first-batch helper:
   - it now supports a bounded verified family set that includes OpenAI-compatible presets, OpenRouter, LiteLLM proxy-family, Together, Anthropic, Ollama, Google, Huawei Cloud MaaS, Vercel AI Gateway, AIHubMix, GitHub Models, PPIO, OVMS, and xAI;
   - it now tolerates broader wrapped catalogs such as `provider_models`, `providerModels`, `publisherModels`, `registry`, `registries`, and `services`;
   - it now preserves transient discovered-model metadata such as label, owner/provider hints, and max-output-token hints;
   - it now performs conservative resource-name normalization for `models/<id>` and `publishers/<owner>/models/<id>`;
   - it now filters wider registries toward generation-relevant models instead of indiscriminately surfacing every embedding/reranker/speech row.
4. `src/openaiCompatibleEndpointFamily.ts` and `src/providerRequestHeaders.ts` now act as shared control-plane seams:
   - family detection distinguishes local OVMS-style `/v3` endpoints from LiteLLM-style local proxies;
   - runtime and discovery reuse the same compatibility-header ownership for headers such as `Authorization`, `X-Api-Key`, OpenRouter/Requesty referer-title headers, AIHubMix `APP-Code`, GitHub Models API versioning, and Cerebras integration headers.
5. model-aware token guidance is now explicit state, not only heuristic coincidence:
   - `globalModelAwareMaxTokensTracking` persists the current auto-managed baseline;
   - `Fetch model list -> Use`, manual model edits, settings reloads, reset behavior, and runtime request ceiling selection now all share the same token-guidance truth path;
   - generic/custom gateways can now also reuse upstream token-cap metadata for bare model ids when the registry itself returns an explicit owner/provider hint, while arbitrary bare-model guessing still remains out of bounds.

Interpretation:

1. the lane is now past “bootstrap the architecture”;
2. the lane is now in bounded breadth management and truth-maintenance mode.

### 2.5 Clean-state closure is now re-proved, not still pending

The older audit language that treated clean-state as still pending is now stale.

Current truth is:

1. the provider-settings/model-discovery closure work has already been committed onto `main`;
2. the repository is currently back to a clean `main...origin/main` state after that lane landed;
3. clean-state is therefore no longer the next unresolved bottleneck for this lane.

Correct interpretation:

1. clean-state must still remain a finish gate for every later batch;
2. it should no longer be described here as an unclosed prerequisite blocking the next-direction discussion.

## 3. Deep Comparison Against Earlier Plan Language

### 3.1 What the 2026-05-25 audit now understates

The earlier bounded-recovery audit is now stale in one important way:

1. it still describes the provider lane as if current main had only the first bounded convergence milestone;
2. it still uses old language that contrasts metadata-driven settings against hardcoded settings rendering as if that refactor were still pending;
3. it still frames the discovery batch around a narrower OpenAI-compatible/Ollama/Google surface.

Current code disproves that older wording:

1. metadata-driven settings rendering is already landed;
2. provider-specific discovery disable reasons are already landed;
3. bounded discovery now extends well beyond the original three-family starter batch;
4. runtime/discovery header and endpoint-family alignment are already landed;
5. discovered-model token metadata now directly affects settings defaults.

Correct interpretation:

1. the older audit is still useful for packaging and lane ordering;
2. it is no longer sufficient as the provider-lane truth source.

### 3.2 What the 2026-05-27 provider plan still gets right

The provider-specific plan remains structurally correct on several points:

1. keep persistence simple;
2. keep manual `model` as the only persisted provider-side truth;
3. prefer shared family semantics over provider-name branching;
4. reuse Cherry Studio strategy ideas, not its persisted catalog subsystem;
5. keep documentation honest about what is and is not supported.

Those remain valid and should not be loosened.

### 3.3 What the 2026-05-27 provider plan now understates

That document now undersells current main in several places:

1. it still phrases Phase 3 as if the delivery surface were mainly the initial first batch;
2. it does not fully foreground the newer parser-widening work for wrapped registries and resource-name normalization;
3. it does not clearly distinguish between:
   - trusted-host bare-model token reuse for generic `OpenAI Compatible`;
   - registry-owner-hint bare-model token reuse for transient discovered rows on generic gateways;
   - prefixed gateway-model token inference;
   - globally consistent fallback that is intentionally much narrower.

Correct interpretation:

1. the plan should now be read as a control-plane contract document, not a “future implementation sketch”;
2. the next work item is bounded extension and truth-maintenance, not first delivery.

### 3.4 What the unified matrix must now protect

The unified matrix now needs to protect against three recurrent misreads:

1. treating wider bounded discovery as permission to claim all-provider discovery;
2. treating host-aware bare-model token lookup as permission to infer ownership for arbitrary custom gateways;
3. treating the presence of shared parser seams as permission to persist remote catalogs later without a new explicit architecture decision.

### 3.5 What the packaging and CLI planning documents still get right

The earlier packaging and CLI planning documents remain directionally correct on two key points:

1. current shipped renderer truth is still `main.js` plus inline `srcdoc`, not a shipped dedicated runtime asset;
2. the correct CLI boundary is still “host-neutral core first, host/file/UI follow-through second,” not broad public command-count growth.

Current code continues to support those earlier decisions:

1. `esbuild.config.mjs`, `scripts/audit-render-host-bundle.js`, and the maintainer docs still lock the single-entry shipping boundary;
2. `src/operations/diagramGenerateOperation.ts`, `src/operations/diagramCommandExecution.ts`, `src/operations/diagramCommandHostAdapter.ts`, `src/operations/publicCliSurface.ts`, and `src/maintainerCliBridge.ts` still preserve the bounded split between:
   - typed core operations;
   - bounded public-safe export commands;
   - wider but explicitly maintainer-only path-based helper flows.

Correct interpretation:

1. provider-lane closure reduced one control-plane risk, but it did not replace packaging or bounded CLI promotion discipline as the next architecture questions;
2. next-level planning should now rotate back to packaging/semantic convergence first, then bounded CLI/public-surface decisions, with provider widening treated as ongoing maintenance instead of the central narrative.

## 4. Architecture Advancement Assessment

### 4.1 What has genuinely advanced

1. The provider control plane now scales through shared metadata instead of only through hand-edited settings branches.
2. Discovery and runtime semantics are more converged at the endpoint-family and header-owner layers.
3. Token guidance is no longer just a UI hint; it is now tied into persisted settings state and runtime ceiling behavior.
4. The discovery parser is meaningfully more robust against real registry drift, wrapped catalogs, and resource-style names than the initial landed helper.

### 4.2 What remains structurally constrained

1. Packaging truth is still intentionally narrower than source organization.
2. Discovery remains transient by design; there is still no persisted remote model catalog.
3. The bounded discovery family set is broad enough to need discipline, but not broad enough to justify “generic provider discovery” claims.
4. Generic `OpenAI Compatible` still requires conservative ownership inference; beyond trusted hosts, explicit registry-provided owner hints, and explicit prefixes, token ceilings must remain unresolved.

### 4.3 Main risk if the lane drifts now

The biggest risk is no longer lack of implementation. It is loss of boundary discipline.

Likely failure modes:

1. ad hoc provider-name special-casing starts replacing family-based shared logic;
2. docs begin overstating parity with Cherry Studio;
3. settings/discovery token guidance logic and runtime token-ceiling logic drift apart again;
4. a future “just persist the fetched list” shortcut silently creates a second provider-state subsystem.

### 4.4 Where the actual mainline bottleneck moved

After the latest provider closure, the highest-leverage unresolved bottlenecks are now adjacent lanes:

1. packaging / semantic-verification still carries the main source-vs-shipped-boundary ambiguity because source contains reusable runtime candidates while the shipped contract remains single-entry;
2. CLI / automation still carries a deliberate public-vs-maintainer split that has to stay explicit if any path-based operation is later promoted;
3. file-selection / local-KB / chapter-split Stage C now needs deeper evaluation coverage and example alignment, not another “does this feature exist?” recovery cycle.

## 5. Concrete Next Direction

### Batch A: finish packaging / semantic-verification convergence before widening any claims

Priority: `P0`

Goal:

1. keep the current `main.js` + inline `srcdoc` shipping truth explicit and executable;
2. resolve the current source/build ambiguity around latent render-host runtime candidates before anyone widens packaging claims.

Required rule:

1. if a later batch wants a dedicated runtime asset again, build graph, release assets, audit logic, maintainer docs, and release docs must move together in the same batch.

### Batch B: keep bounded CLI / public-surface promotion separate and explicit

Priority: `P1`

Goal:

1. preserve the current split between bounded public-safe exports and explicitly maintainer-only path-based helper flows;
2. only promote any path-based operation when its contract, automation level, context requirements, tests, and docs all justify broader exposure.

Likely work:

1. keep `cli.public-surface.export` aligned with current registry metadata;
2. keep `npm run cli:help` and maintainer docs aligned with the bounded helper surface;
3. resist turning maintainer-only mutation/introspection seams into implied public CLI support.

### Batch C: deepen Stage-C quality on file selection / local-KB / chapter split without reopening existence questions

Priority: `P1`

Goal:

1. treat current-main retrieval and batch-input capabilities as landed product slices;
2. spend the next effort on broader corpus-quality evidence, maintainer examples, and regression depth instead of recovery rhetoric.

Likely work:

1. expand mixed file/folder, mixed query-shape, and exclusion-behavior fixture coverage where current contracts already justify it;
2. keep maintainer examples and retrieval-inspection guidance synchronized with the real task-scoped retrieval path;
3. preserve deterministic managed-artifact and rerun-guard semantics while broadening evaluation depth.

Current-main delta already landed during this Stage-C follow-through:

1. the offline fixture now also regression-locks task-scoped `batchGenerateFromTitles` and `researchSummarize` retrieval cases instead of treating diagram generation as the only maintainer inspect proof path;
2. maintainer helper help/examples now surface all three currently supported inspect query-derivation modes in practice: `basename`, `explicit`, and `diagram-source`;
3. exact-file-vs-folder configured knowledge-path boundaries are now checked in the same offline fixture lane, which reduces the risk of docs/examples drifting away from real retrieval behavior.

### Batch D: keep the provider lane in bounded breadth-maintenance mode

Priority: `P1/P2`

Goal:

1. continue widening support only through shared family semantics or wrapped-catalog shape support;
2. resist reintroducing provider-name-only branches unless the transport or discovery contract is genuinely distinct.

Required rule:

1. every new provider/discovery addition must specify family mode, header ownership, endpoint normalization, token-guidance behavior, and tests/docs in the same batch.

### Batch E: keep documentation/tests and clean-state as ongoing guardrails

Priority: `P0`

Goal:

1. prevent future sessions from downgrading current-main truth back to outdated plan wording;
2. keep clean-state proof as a maintained invariant instead of letting it slip back into deferred cleanup debt.

Current audit reality:

1. the repository is clean today, so clean-state recovery is no longer an open action item in this audit;
2. the real requirement is to preserve that finish discipline while the next packaging / CLI / Stage-C batches land;
3. the matrix, topic docs, README/change surfaces, and focused regression checks still act as the practical anti-drift guardrail.

Required follow-through:

1. re-check the current truth documents whenever packaging, CLI surface, or provider/discovery boundaries change;
2. keep `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, `npm run audit:render-host`, `git diff --check`, and clean `git status --short --branch` as the minimum closure bundle.

## 6. Documentation Sync Rule

Any future change that updates the provider-settings/model-discovery lane must re-check, at minimum:

1. `change.md`
2. `README.md`
3. `README_zh.md`
4. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.*`
5. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
6. this audit document

## 7. Verification Gate

Any update that changes the truth claims in this document should still finish with:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean `git status --short --branch`

## 8. Bottom Line

Current `main` no longer needs another “did the provider settings lane really land?” argument.

The real current questions are now:

1. can packaging/source organization and shipped render-host truth stay aligned without overclaiming a runtime topology that current main does not ship;
2. can the current bounded CLI split stay explicit while any future path-based promotion remains contract-first rather than convenience-first;
3. can Stage-C local-KB / file-selection / chapter-split work deepen quality evidence instead of relitigating feature existence;
4. can the widened bounded provider discovery surface remain shared-core, lightweight, and honest as a maintenance lane rather than becoming the excuse for broader architectural claims.
