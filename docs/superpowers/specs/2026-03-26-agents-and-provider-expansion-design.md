# AGENTS And Provider Expansion Design

**Date:** 2026-03-26

## Scope

This design covers three related changes for Notemd:

1. Add a project-level `AGENTS.md` as the execution authority for Codex/agent workflows without rewriting `GEMINI.md`.
2. Add front-end validation guidance for the `Doubao` preset so users get explicit feedback when the model field still looks like an unset Ark endpoint placeholder.
3. Extend the centralized LLM provider registry with `Baidu Qianfan` and `SiliconFlow`, including runtime support, API connection testing, documentation, and regression tests.

These changes are grouped because they all improve agent/operator reliability: one at repository workflow level, one at provider UX level, and one at provider surface level.

## Architecture

The provider architecture should continue to use `src/llmProviders.ts` as the single source of truth for provider metadata. New providers must be represented by registry definitions and flow through transport-driven dispatch in `src/llmUtils.ts` instead of adding more provider-name branching.

Provider validation should be implemented as a small pure helper that returns warnings for UI consumers. The settings tab can render those warnings and gate connection tests when the provider configuration is obviously incomplete. This keeps the validation logic testable and reusable without embedding brittle UI-only conditionals.

The new `AGENTS.md` should be repository-local and opinionated about Notemd's build, verification, documentation, release, and asset-upload workflow. It should explicitly document that GitHub releases for this plugin must include `README.md` in addition to `main.js`, `manifest.json`, and `styles.css`.

## Components

### 1. Repository Guidance
- Create `AGENTS.md` at repository root.
- Keep `GEMINI.md` unchanged.
- Include project overview, key files, build/test commands, release workflow, documentation sync rules, provider-extension rules, and Git safety rules.

### 2. Provider Validation
- Add a small validation helper near the provider registry.
- Detect when `Doubao` still uses the placeholder endpoint model, or when the configured model does not resemble an Ark endpoint ID.
- Surface warnings in the settings UI before users run tasks or connection tests.

### 3. Provider Expansion
- Add `Baidu Qianfan` and `SiliconFlow` presets to the registry.
- Keep them on the existing `openai-compatible` transport.
- Assign API-test metadata so the connection test validates the actual configured model.
- Update docs in both `README.md` and `README_zh.md`.

## Error Handling

The connection-test path should keep current behavior for runtime/API errors. The new provider-validation layer should only handle obviously incomplete local configuration and produce user-facing warnings. It should not attempt to guess or auto-rewrite provider models.

For `Doubao`, the UX should nudge users toward a valid Ark endpoint configuration while leaving room for provider-side model naming changes. A warning is safer than destructive normalization.

## Testing Strategy

- Add unit tests for provider validation warnings.
- Extend provider registry tests to assert presence of `Baidu Qianfan` and `SiliconFlow`.
- Extend provider runtime/API tests to assert both providers use the openai-compatible runtime and chat-first API probing.
- Re-run full build and Jest suite after implementation.

## Review Notes

A dedicated spec-review subagent was not used here because this session does not have explicit user authorization to delegate sub-agent work. This design was self-reviewed against the repository's current provider architecture and release workflow.
