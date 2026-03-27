# China Provider Expansion Round 2 Design

**Date:** 2026-03-26

## Scope

This design covers the next provider-expansion pass for Notemd after the initial China-focused provider rollout:

1. Add `Qwen Code` as a dedicated coding-oriented preset instead of forcing users to overload the general `Qwen` preset.
2. Add `Z AI` as a separate preset for the international GLM/Zhipu entrypoint while keeping the existing `GLM` preset for the mainland China endpoint.
3. Add `Huawei Cloud MaaS` as a first-class preset for users who access hosted models through Huawei Cloud's OpenAI-compatible endpoint.
4. Update tests, documentation, and release materials so these providers ship with the same quality bar as existing presets.

This round explicitly excludes providers that require new authentication schemes, provider-specific SDK logic, or a new transport type. The goal is to expand Chinese and China-adjacent provider support without increasing protocol complexity.

## Architecture

The provider system should continue to use `src/llmProviders.ts` as the single source of truth for preset metadata. All three new providers should be implemented as registry entries and should reuse the existing `openai-compatible` transport path in `src/llmUtils.ts`.

No new transport should be introduced. Runtime calls should continue to flow through the shared OpenAI-compatible request builder and the centralized retry/fallback logic. Connection testing should continue to use provider metadata to decide whether a preset probes `/models` first or goes straight to `chat/completions`.

This means the implementation remains additive:

- new registry entries in `src/llmProviders.ts`
- new provider assertions in test files
- documentation updates in `README.md`, `README_zh.md`, and `change.md`
- a patch release using the existing bilingual release-note workflow

## Provider Decisions

### 1. Qwen Code

`Qwen Code` should be added as its own preset rather than hidden as a suggested model under `Qwen`.

Rationale:

- latest Cline exposes it separately from general Qwen
- users looking for coding-specialized models expect a direct preset
- it fits the existing OpenAI-compatible transport and chat-first API testing model

Expected shape:

- transport: `openai-compatible`
- category: `cloud`
- API key mode: `required`
- API test mode: `chat-only`
- base URL: DashScope compatible-mode endpoint
- default model: a Qwen coding model such as `qwen3-coder-plus`

### 2. Z AI

`Z AI` should be added as a distinct preset even though Notemd already includes `GLM`.

Rationale:

- latest Cline treats `Z AI` as a first-class provider rather than a duplicate label
- the current `GLM` preset is mainland-China oriented and points at `open.bigmodel.cn`
- a separate `Z AI` preset gives users an international endpoint without changing existing `GLM` behavior

Expected shape:

- transport: `openai-compatible`
- category: `cloud`
- API key mode: `required`
- API test mode: `chat-only`
- base URL: international `https://api.z.ai/api/paas/v4`
- default model: `glm-5`

### 3. Huawei Cloud MaaS

`Huawei Cloud MaaS` should be added as a first-class preset for users running hosted DeepSeek/Qwen-class models behind Huawei Cloud.

Rationale:

- latest Cline includes it directly
- it is a meaningful net-new entrypoint, not just a rename of an existing preset
- its documented endpoint fits the current OpenAI-compatible runtime

Expected shape:

- transport: `openai-compatible`
- category: `cloud`
- API key mode: `required`
- API test mode: `chat-only`
- base URL: `https://api.modelarts-maas.com/v1`
- default model: a stable Huawei-hosted model identifier such as `DeepSeek-V3`

## Components

### 1. Provider Registry

Modify `src/llmProviders.ts` to:

- add `Qwen Code`, `Z AI`, and `Huawei Cloud MaaS`
- place them in a sensible order near related providers
- provide accurate descriptions and setup hints
- preserve existing provider ordering semantics used by the settings UI

### 2. Runtime And Connection Testing

No new runtime branch should be added if the provider can route through `openai-compatible`.

The implementation should rely on current shared behavior:

- `callLLM()` transport dispatch for OpenAI-compatible requests
- `testAPI()` provider-aware OpenAI-compatible probing
- transient network fallback for both runtime calls and connection tests

The new providers therefore need metadata, not custom runtime code paths, unless implementation review reveals a provider-specific incompatibility that is impossible to express through current metadata.

### 3. Documentation

Update:

- `README.md`
- `README_zh.md`
- `change.md`

Documentation should explain:

- that `Qwen Code` is a coding-focused preset
- that `Z AI` complements rather than replaces `GLM`
- that `Huawei Cloud MaaS` is available as a hosted OpenAI-compatible option

The provider lists, setup guidance, and preset-coverage sections should stay synchronized across both README files.

### 4. Release

This work should ship as patch version `1.7.6` if no other unrelated feature lands first.

Release workflow requirements remain unchanged:

- bilingual GitHub release body with complete English and Chinese sections
- release assets must include `main.js`, `manifest.json`, `styles.css`, and `README.md`

## Error Handling

The new providers should inherit the existing shared retry and transient-failure fallback behavior.

This design does not add provider-specific error normalization. If any of the new providers later proves to need a unique response parser or nonstandard auth header, that should be handled in a separate design because it would expand protocol scope beyond this round.

The current rule stays in place:

- do not retry fatal client-status failures as transient network problems
- do retry transient disconnects through the existing stable fallback path

## Testing Strategy

### Provider Registry Tests

Extend `src/tests/llmProviders.test.ts` to:

- assert the presence of `Qwen Code`, `Z AI`, and `Huawei Cloud MaaS`
- assert their `transport` and `apiTestMode`
- confirm they are treated as OpenAI-compatible providers

### Runtime Routing Tests

Extend `src/tests/llmUtilsProviderSupport.test.ts` to:

- assert `callLLM()` routes each new provider through the OpenAI-compatible runtime
- assert the expected endpoint, auth header, and model value are used

### Connection Test Coverage

Extend `src/tests/llmUtilsProviderSupport.test.ts` to:

- assert `testAPI()` probes the expected `chat/completions` path for each new provider
- assert transient disconnect fallback also works for these new presets during connection testing

### Full Verification

Before release:

- run targeted provider tests first during TDD
- run `npm test -- --runInBand`
- run `npm run build`
- run `git diff --check`
- run the existing Obsidian CLI checks and report environment limits explicitly if they still fail in this machine context

## Review Notes

This design intentionally chooses only providers whose documented endpoints can be represented inside the current OpenAI-compatible transport. Providers requiring a dedicated SDK, signing flow, or new protocol layer are deferred.

A dedicated spec-review subagent was not used here because this session does not have explicit user authorization to delegate sub-agent work. This design was self-reviewed against the repository's current provider registry, test layout, and release rules, plus the latest public Cline provider catalog and provider docs consulted during design.
