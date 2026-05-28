---
date: 2026-05-27
last_updated: 2026-05-28
topic: provider-settings-simplification-and-model-discovery-plan
canonical: true
---

# Provider Settings Simplification And Model Discovery Plan

## 1. Why This Lane Exists Now

The current repository already has broad provider runtime coverage, but the settings control plane has not converged with that growth.

That mismatch is now a real architecture problem:

1. current provider runtime breadth is no longer small enough to tolerate field-by-field hardcoded UI logic;
2. users now explicitly want a core-vs-advanced provider settings split;
3. users also want model discovery, but only if it remains lightweight, backward-compatible, and operationally honest.

This document records the concrete implementation plan that should guide that work.

## 2. Current Code Truth

### 2.1 Settings rendering is still hardcoded

`src/ui/NotemdSettingTab.ts` still decides provider field rendering through direct branching:

1. API key is shown according to `apiKeyMode`;
2. `baseUrl`, `model`, and `temperature` are rendered directly;
3. `maxOutputTokens` is rendered only when developer mode is enabled or a persisted override exists;
4. `topP` / `reasoningEffort` are rendered only for OpenAI-compatible providers;
5. `thinkingEnabled` is rendered only for `DeepSeek`;
6. `apiVersion` is rendered only for `Azure OpenAI`.

This is operationally fine but structurally weak:

1. there is no reusable field taxonomy;
2. there is no shared advanced disclosure model;
3. adding or changing providers keeps expanding the settings file instead of the provider schema.

### 2.2 Provider metadata is runtime-oriented, not UI-oriented

`src/llmProviders.ts` currently exposes:

1. provider name;
2. category;
3. transport;
4. API key mode;
5. API test mode;
6. description/setup hint;
7. default config.

What it does not expose yet:

1. field visibility groups;
2. core vs contextual vs advanced vs developer-only classification;
3. model discovery capability metadata;
4. provider-specific discovery endpoint family or fallback order;
5. optional provider-specific disable reason for manual-first presets.

### 2.3 Config shape is compatible, but too flat to drive richer UI

`src/types.ts` keeps `LLMProviderConfig` flat:

1. `apiKey`
2. `baseUrl`
3. `model`
4. `temperature`
5. optional `topP`
6. optional `reasoningEffort`
7. optional `thinkingEnabled`
8. optional `maxOutputTokens`
9. optional `localOnly`
10. optional `apiVersion`

This is good for:

1. `data.json` backward compatibility;
2. import/export stability;
3. keeping `model` as the single persisted source-of-truth string.

This is weak for:

1. deriving advanced auto-expand logic;
2. expressing provider-specific field grouping without another metadata layer.

### 2.4 Model-discovery foundations are partial, not productized

`src/llmUtils.ts` already contains reusable pieces:

1. OpenAI-compatible base-URL normalization;
2. `apiTestMode=models-then-chat`;
3. `GET /models` probing in connection testing.

That means the runtime already knows enough to avoid starting model discovery from zero.

What is still missing:

1. a first-class `discoverProviderModels()` service;
2. provider-family-specific parsers;
3. UI integration in settings;
4. manual-entry-safe fallback behavior at the product surface.

## 3. Requirements Status Against The Current Repo

| Requirement | Current status | Practical conclusion |
|---|---|---|
| Show only required/default-visible fields by default | Landed | Current main now renders provider settings through shared field grouping metadata, with core controls shown by default |
| Keep `model` in the default surface | Already true | Must be preserved during refactor |
| Hide secondary knobs behind advanced settings | Landed | Secondary tuning controls now sit behind explicit advanced disclosure |
| Auto-expand advanced when persisted advanced values exist | Landed | Expansion is now derived from persisted provider override state |
| Reuse Cherry Studio selectively | Landed in bounded form | The landed implementation reuses discovery strategy ideas without copying a persisted provider-model catalog |
| Support optional model discovery without blocking manual setup | Landed | Discovery is additive/transient and manual `model` entry remains the persisted truth |

## 3.5 Landed implementation checkpoint

As of the 2026-05-27 closeout, the work from the isolated `feat/provider-settings-model-discovery` lane has been verified and merged back into current main.

What is now present on current main:

1. `src/llmProviders.ts` now carries draft provider-field taxonomy metadata (`core`, `contextual`, `advanced`, `developer`) and per-provider model-discovery metadata.
2. a new `src/providerModelDiscovery.ts` implements transient discovery for:
   - selected official OpenAI-compatible `GET /models` presets
   - OpenRouter's bounded chat + embedding catalog merge
   - Together's dedicated `/models` array response
   - Anthropic `GET /models`
   - Ollama tag listing
   - Google model listing
3. `src/ui/NotemdSettingTab.ts` has a draft metadata-driven provider-panel refactor, including:
   - default/core field rendering
   - contextual field rendering
   - advanced disclosure
   - derived auto-expand when persisted advanced values exist
   - optional fetch-models UI wiring
4. matching locale keys, README/update-surface sync, and focused tests cover the new control-plane behavior.
5. current main also now carries bounded provider-breadth follow-through for this lane:
   - canonical provider alias normalization for legacy persisted names such as `Xiaomi` -> `Xiaomi MiMo`
   - additional OpenAI-compatible presets aligned to the shared runtime (`LiteLLM`, `Nebius`, `Cerebras`, `Hugging Face`, `Vercel AI Gateway`, `AIHubMix`, `GitHub Models`, `PPIO`, `New API`, `OVMS`)
   - provider-family-specific discovery handling for Vercel AI Gateway's bounded `/v1/models` + `v3/ai/config` merge, xAI's dedicated `/v1/language-models` registry with bounded `/v1/models` fallback, Huawei Cloud MaaS's `v2/models` registry endpoint, Together's array-style `/models` response, LiteLLM's explicit proxy-family `/models` + `/model/info` merge, PPIO's bounded chat + embedding + reranker registry merge, and OVMS's preferred local `/v3/models` with bounded `/v1/config` fallback
   - a bounded OpenRouter chat + embedding catalog merge instead of pretending the gateway is just another generic `/models` endpoint
   - provider-specific discovery disable reasons for manual-first presets such as Azure OpenAI, so the settings UI can explain why Fetch model list stays unavailable instead of only saying "not supported"
   - model-aware token guidance in settings, so the active model's known max output-token cap is surfaced beside `Model`, provider override, and global `Max tokens`
   - bounded gateway-model token inference for provider-prefixed model IDs and explicit gateway presets, so fetched models such as `openai/gpt-4o` or `anthropic/claude-sonnet-4.5` can still drive the `Max tokens` / chunk-size guidance without pretending that bare model IDs are universally attributable across all custom gateways
   - broader OpenAI-compatible payload parsing for `list` / `items`, object-shaped proxy catalogs, nested gateway `specification.modelId`, and endpoint-type-aware listing metadata
   - additional shared fetch-model-list robustness for wider real-world registry drift, including provider-mapped `provider_models` object catalogs, broader `nextPageUrl` / `next_page_url` pagination hints, provider-correct `after_id` continuation handling, and richer generation/modality metadata such as `supportedOutputModalities`, nested `supportedGenerationMethods`, and limit objects
   - discovered-model token guidance now also consumes real hosted registry token-cap fields such as `top_provider.max_completion_tokens`, `per_request_limits`, and `limits.max_output_tokens`, so `Fetch model list -> Use` can keep model-aware `Max tokens` and chunk-size defaults aligned even when the static provider token registry does not know the fetched model yet
   - transient discovered-model metadata preservation for display labels, owner/provider hints, and max-output-token hints, plus richer capability/modality/status-aware filtering so broader registries do not leak unavailable, audio-only, or image-only entries into text-generation suggestions, while alias-only fallback identifiers recover malformed upstream rows without expanding every alias into a separate picker entry
   - AIHubMix discovery now prefers the hosted `?type=llm` registry shape instead of pulling the full mixed multimodal catalog and relying only on local filtering
   - shared OpenAI-compatible endpoint normalization across runtime and discovery, including `/responses` endpoint forms, plus query/hash-tolerant pasted endpoint roots and generic-host auto-upgrade for OVMS-style local `/v3` endpoints instead of collapsing every local host into the LiteLLM proxy bucket
   - family-specific discovery normalization now also tolerates users pasting official discovery endpoints instead of provider roots, including OpenRouter `/models` or `/embeddings/models`, and Vercel AI Gateway `/v3/ai/config` or `/v1/ai/models`, so fetch-model-list can still recover the right bounded registry flow
   - generic/custom gateways can now also reuse upstream token-cap metadata for bare model ids when the fetched registry row exposes an explicit owner/provider hint such as `owned_by`, `publisher`, or `provider`, while arbitrary bare-model guessing remains intentionally out of scope

What remains intentionally out of scope:

1. persisted remote provider model catalogs;
2. model CRUD / health-check management UI;
3. broad all-provider model discovery claims beyond the verified first batch.
4. pretending that every OpenAI-compatible gateway should expose the same `/models` semantics.

## 4. Cherry Studio Comparison

Reference repo: `/home/jacob/ref/cherry-studio`

What Cherry Studio gets right:

1. strategy-registry model fetching;
2. parser separation by endpoint family;
3. graceful fallback behavior;
4. real regression coverage for endpoint normalization.

What does not fit Notemd:

1. persisted `provider.models[]` lifecycle;
2. heavyweight provider-domain state;
3. model CRUD / catalog management as a first-class product subsystem.

Conclusion:

1. reuse the discovery strategy pattern;
2. do not reuse the persisted catalog architecture.

## 5. Target Architecture

### 5.1 Field taxonomy

Add shared provider-field metadata so each field can be classified as one of:

1. `core`
2. `contextual`
3. `advanced`
4. `developer`

Recommended semantics:

1. `apiKey`, `baseUrl`, `model` are `core`;
2. `apiVersion` is `core` only for providers that require it, such as Azure OpenAI;
3. `temperature`, `topP`, `reasoningEffort`, `thinkingEnabled` are `advanced`;
4. `maxOutputTokens` is `developer`, but still shown when a persisted override exists.

### 5.2 Discovery capability metadata

Add per-provider discovery metadata to `LLMProviderDefinition`:

1. discovery supported or not;
2. discovery family:
   - `openai-compatible`
   - `ollama`
   - `google`
3. optional provider-specific notes or disable reason.

### 5.3 Keep persistence simple

Do not add a second provider-state tree.

Keep these invariants:

1. `LLMProviderConfig.model` remains the persisted truth;
2. discovery results are transient suggestions;
3. import/export format remains unchanged.

## 6. Implementation Plan

### Phase 1: metadata uplift

Files:

1. `src/llmProviders.ts`
2. `src/types.ts` if helper types are needed

Deliverables:

1. field taxonomy metadata;
2. discovery capability metadata;
3. helpers to determine whether persisted advanced values exist for a provider.

Risk:

1. over-encoding UI behavior into the runtime registry.

Mitigation:

1. keep metadata declarative and field-scoped;
2. do not move rendering code into the provider registry.

Current checkpoint:

1. landed on current main;
2. the metadata shape remains declarative and field-scoped.
3. backward compatibility now also includes canonicalization of legacy provider names during settings load and provider-profile import/export flows.

### Phase 2: settings renderer refactor

Files:

1. `src/ui/NotemdSettingTab.ts`

Deliverables:

1. core-only default surface;
2. explicit advanced disclosure;
3. auto-expand when persisted advanced values already exist;
4. preserve manual `model` editing as the default control.

Risk:

1. backward-compatibility regressions for existing persisted provider config.

Mitigation:

1. derive advanced expansion from current config presence;
2. preserve all existing field values and save semantics.

Current checkpoint:

1. landed on current main;
2. default/core, contextual, and advanced sections are wired through shared metadata;
3. CSS/layout support and focused style tests are now part of the shipped surface.
4. provider settings now surface model-aware token guidance and refresh immediately after `model`, global `Max tokens`, or chunk-size edits commit.

### Phase 3: lightweight discovery service

Suggested new file:

1. `src/providerModelDiscovery.ts`

Deliverables:

1. transient model discovery service;
2. support the current bounded verified family batch:
   - selected OpenAI-compatible `GET /models` presets
   - OpenRouter bounded chat + embedding registry merge
   - LiteLLM proxy-family `/models` + `/model/info`
   - Together `/models`
   - Anthropic `GET /models`
   - Ollama `GET /api/tags`
   - Google Gemini `GET v1beta/models`
   - Huawei Cloud MaaS `v2/models`
   - Vercel AI Gateway bounded `/v1/models` + `v3/ai/config`
   - AIHubMix hosted registry
   - GitHub Models `catalog/models` + `/v1/models`
   - PPIO bounded chat + embedding + reranker merge
   - OVMS `/v3/models` with bounded `/v1/config` fallback
   - xAI `/v1/language-models`
3. shared error normalization with graceful empty-result fallback.
4. bounded multi-page traversal for paginated provider registries such as Google `nextPageToken` and Anthropic `has_more` / `last_id`.

Risk:

1. misleading users into thinking discovery is authoritative for providers where it is not.

Mitigation:

1. support only endpoint families with stable enough semantics in the first batch;
2. keep manual model input always available;
3. never persist remote catalogs.

Current checkpoint:

1. landed on current main for the current bounded family batch, including Anthropic, LM Studio, OpenRouter, LiteLLM proxy-family, Together, Huawei Cloud MaaS, Vercel AI Gateway, AIHubMix, GitHub Models, PPIO, OVMS, and xAI in addition to the earlier OpenAI-compatible/Ollama/Google base;
2. it keeps manual `model` entry as the persisted source of truth;
3. unsupported providers still degrade to manual entry rather than a heavy catalog subsystem.
4. the bounded gateway split is now explicit: Vercel AI Gateway now uses a bounded `/v1/models` + `v3/ai/config` merge, OpenRouter now uses a bounded chat + embedding catalog merge, LiteLLM uses an explicit proxy-family `/models` + `/model/info` merge, Huawei Cloud MaaS uses its dedicated `v2/models` registry endpoint, PPIO uses a bounded chat + embedding + reranker registry merge, OVMS prefers the current local `/v3/models` endpoint and only falls back to `/v1/config` when needed, New API reuses the shared bounded OpenAI-compatible `/models` path, and Hugging Face now joins that same bounded `/models` path instead of staying manual-first.
5. Google and Anthropic now also traverse bounded pages when the provider exposes a paginated model catalog, so fetch-model-list does not silently stop at the first page.
6. shared parser hardening now also covers broader wrapped catalog shapes such as `provider_models`, `providerModels`, `publisherModels`, `registry`, `registries`, and `services`, plus conservative resource-name normalization for `models/<id>` and `publishers/<owner>/models/<id>`.

### Phase 4: UI integration

Deliverables:

1. lightweight “fetch models” or suggestion surface near the `model` field;
2. no blocking dependency between discovery and save flow;
3. if discovery fails, keep the exact current manual workflow usable.

Current checkpoint:

1. fetch-models UI wiring and transient suggestion state are now on current main;
2. styling support for the new provider-panel surfaces is landed;
3. README/update surfaces now describe the same bounded behavior.
4. apply-success feedback and collapse-state persistence are now covered by focused behavior tests.
5. discovery results are now also bounded toward generation-ready models, so obvious embedding / reranker / speech / classifier entries do not crowd the settings picker when providers expose wider registries, including object-shaped proxy catalogs and endpoint-type-aware listings.
6. discovery/runtime compatibility headers are now explicitly kept aligned for shared OpenAI-compatible provider families, avoiding false-negative fetch-model-list failures on providers that also rely on `X-Api-Key` or provider-specific compatibility headers.
7. gateway/provider-prefixed fetched models now also feed bounded token-cap guidance when the ownership is explicit enough to be inferred safely, while generic bare-model guesses remain intentionally conservative for custom `OpenAI Compatible` endpoints.
8. the generic `OpenAI Compatible` preset now also reuses official-provider token-cap metadata for bare model IDs when the configured base URL points at a known trusted host such as OpenAI, DashScope/Qwen, Xiaomi MiMo, Fireworks, or Hugging Face, instead of requiring provider-prefixed gateway model IDs in those cases.
9. global model-aware token guidance is no longer only a same-number heuristic: current main now persists an explicit `globalModelAwareMaxTokensTracking` marker so `Fetch model list -> Use`, manual model edits, runtime request token ceilings, and reset/reload behavior all share the same auto-managed baseline truth.
10. shared discovery/runtime header ownership is now explicit through the same endpoint-family seam, so fetch-model-list no longer drifts away from runtime behavior on providers that rely on compatibility headers beyond plain `Authorization`.
11. transient owner/provider hints returned by model registries now also participate in bounded bare-model token guidance for generic/custom gateways, so a discovered row like `gpt-4.1` plus `owned_by: "openai"` can safely drive `Max tokens` / chunk-size defaults without forcing the saved model id to become provider-prefixed.

### Phase 5: tests and documentation

Required test coverage:

1. provider metadata regression coverage;
2. UI rendering coverage for core/advanced grouping;
3. advanced auto-expand coverage from persisted advanced values;
4. discovery success/fallback coverage for supported endpoint families.
5. registry-shape coverage for wrapped provider/publisher catalogs and resource-name normalization.

Required docs:

1. `README.md`
2. `README_zh.md`
3. this document
4. current canonical matrix/audit docs if status meaning changes during implementation

Current checkpoint:

1. focused i18n/test updates are landed on current main;
2. canonical docs now describe the lane as landed current-main truth rather than isolated implementation progress;
3. verification evidence now includes targeted provider-settings/model-discovery tests plus full repository gates.
4. the current settings surface also documents the relationship between global `Max tokens` and provider-specific output-token overrides, to reduce confusion around the two token caps.
5. current docs now need to be read as current-main truth maintenance artifacts, not as a pre-landing implementation sketch.

## 7. Explicit Non-Goals

Do not do these in the first batch:

1. persist provider model catalogs;
2. add model CRUD management;
3. copy Cherry Studio’s provider domain whole;
4. claim full provider-model discovery coverage for every provider;
5. move this implementation directly into the main worktree before the isolated lane is verified.
6. widen generic `OpenAI Compatible` token ownership inference beyond trusted hosts, explicit provider prefixes, or other boundedly provable cases.

## 8. Execution Rule

Execution should follow this split:

1. `main` keeps the docs/progress truth and stays clean;
2. bounded implementation can proceed in isolated lanes first when the control-plane blast radius is large;
3. only verified, bounded implementations get merged back.

Verification evidence for this lane:

1. targeted provider-settings/model-discovery tests;
2. full `npm run build`;
3. full `npm test -- --runInBand`;
4. `npm run audit:i18n-ui`;
5. `npm run audit:render-host`;
6. `git diff --check`.

That preserved planning truth during development and avoided landing half-verified control-plane changes on current main.
