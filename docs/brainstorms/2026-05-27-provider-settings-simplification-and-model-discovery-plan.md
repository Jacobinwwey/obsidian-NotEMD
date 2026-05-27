---
date: 2026-05-27
last_updated: 2026-05-27
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
4. provider-specific discovery endpoint family or fallback order.

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
| Show only required/default-visible fields by default | Not landed | Current UI is still a flat provider panel |
| Keep `model` in the default surface | Already true | Must be preserved during refactor |
| Hide secondary knobs behind advanced settings | Not landed | Needs metadata + UI refactor |
| Auto-expand advanced when persisted advanced values exist | Not landed | Needs derived expansion helper from live provider config |
| Reuse Cherry Studio selectively | Planned with concrete research | Safe to implement without copying the whole architecture |
| Support optional model discovery without blocking manual setup | Not landed | Discovery must be additive and ephemeral |

## 3.5 Current isolated implementation-lane checkpoint

As of the 2026-05-27 audit, the isolated worktree/branch `feat/provider-settings-model-discovery` has moved this lane beyond pure planning, but not into current-main truth yet.

What is already present there:

1. `src/llmProviders.ts` now carries draft provider-field taxonomy metadata (`core`, `contextual`, `advanced`, `developer`) and per-provider model-discovery metadata.
2. a new `src/providerModelDiscovery.ts` implements transient discovery for:
   - OpenAI-compatible `GET /models`
   - Ollama tag listing
   - Google model listing
3. `src/ui/NotemdSettingTab.ts` has a draft metadata-driven provider-panel refactor, including:
   - default/core field rendering
   - contextual field rendering
   - advanced disclosure
   - derived auto-expand when persisted advanced values exist
   - optional fetch-models UI wiring
4. matching locale keys and focused tests were added for the new control-plane behavior.

What is still not done there:

1. the isolated worktree has not finished verification yet and was not bootstrapped with local dependencies when checked;
2. CSS/layout polish for the new provider-panel surfaces is still incomplete;
3. current-main truth remains unchanged until that lane passes verification and merges.

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

1. implemented in the isolated lane, not merged;
2. the metadata shape stays declarative and field-scoped so far.

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

1. a metadata-driven renderer attempt now exists in the isolated lane;
2. default/core, contextual, and advanced sections are partially wired there;
3. verification, CSS polish, and merge gating remain open.

### Phase 3: lightweight discovery service

Suggested new file:

1. `src/providerModelDiscovery.ts`

Deliverables:

1. transient model discovery service;
2. support first batch only:
   - OpenAI-compatible `GET /models`
   - Ollama `GET /api/tags`
   - Google Gemini `GET v1beta/models`
3. shared error normalization with graceful empty-result fallback.

Risk:

1. misleading users into thinking discovery is authoritative for providers where it is not.

Mitigation:

1. support only endpoint families with stable enough semantics in the first batch;
2. keep manual model input always available;
3. never persist remote catalogs.

Current checkpoint:

1. a transient discovery helper exists in the isolated lane for the planned first batch;
2. it keeps manual `model` entry as the persisted source of truth;
3. it is still unmerged and unverified.

### Phase 4: UI integration

Deliverables:

1. lightweight “fetch models” or suggestion surface near the `model` field;
2. no blocking dependency between discovery and save flow;
3. if discovery fails, keep the exact current manual workflow usable.

Current checkpoint:

1. fetch-models UI wiring and transient suggestion state exist in the isolated lane;
2. styling and user-surface validation are still open;
3. this is not yet current-main behavior.

### Phase 5: tests and documentation

Required test coverage:

1. provider metadata regression coverage;
2. UI rendering coverage for core/advanced grouping;
3. advanced auto-expand coverage from persisted advanced values;
4. discovery success/fallback coverage for supported endpoint families.

Required docs:

1. `README.md`
2. `README_zh.md`
3. this document
4. current canonical matrix/audit docs if status meaning changes during implementation

Current checkpoint:

1. focused i18n/test updates already exist in the isolated lane;
2. current-main canonical docs are now being updated to reflect the real split between mainline truth and isolated implementation progress;
3. the merge gate still requires isolated-lane bootstrap plus targeted and full verification.

## 7. Explicit Non-Goals

Do not do these in the first batch:

1. persist provider model catalogs;
2. add model CRUD management;
3. copy Cherry Studio’s provider domain whole;
4. claim full provider-model discovery coverage for every provider;
5. move this implementation directly into the main worktree before the isolated lane is verified.

## 8. Execution Rule

Execution should follow this split:

1. `main` keeps the docs/progress truth and stays clean;
2. implementation proceeds in the isolated worktree/branch lane created for this task;
3. only a verified, bounded implementation is merged back.

Concrete merge gate for the isolated lane:

1. bootstrap the isolated worktree so build/test tooling actually resolves project dependencies;
2. run targeted provider-settings/model-discovery tests there first, then full `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, and `git diff --check`;
3. close the remaining CSS/layout gaps in the provider settings surface;
4. merge back only after the lane is green and current-main docs can truthfully switch from “isolated implementation in progress” to “landed”.

That keeps the planning truth honest while avoiding half-landed control-plane changes on current main.
