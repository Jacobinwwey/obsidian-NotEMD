# AGENTS And Provider Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-level `AGENTS.md`, improve Doubao settings validation, and extend Notemd with Baidu Qianfan and SiliconFlow provider support.

**Architecture:** Keep provider metadata centralized in `src/llmProviders.ts`, keep runtime dispatch transport-driven in `src/llmUtils.ts`, and add a small pure validation helper for settings UI warnings. Repository workflow rules live in a new root `AGENTS.md` without modifying `GEMINI.md`.

**Tech Stack:** TypeScript, Jest, Obsidian plugin settings UI, GitHub Releases

---

### Task 1: Add Project-Level AGENTS Guide

**Files:**
- Create: `AGENTS.md`
- Test/Verify: `README.md`, `README_zh.md`, release workflow in local git history

- [ ] **Step 1: Draft the guide content**
Write a concise but authoritative `AGENTS.md` covering project overview, key files, build/test commands, release steps, documentation sync, provider-extension rules, and Git safety.

- [ ] **Step 2: Ensure release asset rule is explicit**
Document that GitHub release assets must include `main.js`, `manifest.json`, `styles.css`, and `README.md`.

- [ ] **Step 3: Self-review for overlap**
Confirm the guide is complete enough for agent execution while avoiding unnecessary duplication of `GEMINI.md`.

### Task 2: Add Doubao Validation Test First

**Files:**
- Create: `src/tests/providerValidation.test.ts`
- Modify: `src/llmProviders.ts`

- [ ] **Step 1: Write failing tests**
Add tests that describe the expected warning behavior for Doubao placeholder/invalid endpoint-like models and a no-warning path for valid-looking values.

- [ ] **Step 2: Run targeted test to verify failure**
Run: `npm test -- --runInBand src/tests/providerValidation.test.ts`
Expected: FAIL because validation helper does not exist yet.

- [ ] **Step 3: Implement minimal validation helper**
Add a small pure helper in `src/llmProviders.ts` that returns warnings based on provider config.

- [ ] **Step 4: Re-run targeted test**
Run: `npm test -- --runInBand src/tests/providerValidation.test.ts`
Expected: PASS.

### Task 3: Surface Doubao Validation In Settings UI

**Files:**
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `styles.css`

- [ ] **Step 1: Add failing UI-oriented test or helper-consumer test if needed**
If pure UI testing is too heavy, add a helper-level assertion plus a focused behavior test around connection-test gating.

- [ ] **Step 2: Implement warning rendering**
Render a visible warning callout when the active provider has validation warnings.

- [ ] **Step 3: Gate connection test for obviously invalid Doubao config**
If warnings exist for the active provider, show a Notice and skip the remote test request.

- [ ] **Step 4: Re-run affected tests**
Run relevant Jest tests covering provider validation and settings behavior.

### Task 4: Add Qianfan And SiliconFlow Tests First

**Files:**
- Modify: `src/tests/llmProviders.test.ts`
- Modify: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: Extend registry tests**
Add failing assertions for `Baidu Qianfan` and `SiliconFlow` provider presence and metadata.

- [ ] **Step 2: Extend runtime/API tests**
Add failing tests asserting both providers route through the openai-compatible runtime and use chat-first API probing.

- [ ] **Step 3: Run targeted tests to verify failure**
Run: `npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
Expected: FAIL until provider definitions are added.

### Task 5: Implement Provider Registry And Runtime Support

**Files:**
- Modify: `src/llmProviders.ts`
- Modify: `src/llmUtils.ts`
- Modify: `src/ui/NotemdSettingTab.ts`

- [ ] **Step 1: Add provider definitions**
Add `Baidu Qianfan` and `SiliconFlow` with official base URLs, representative model IDs, metadata, and chat-first API-test mode.

- [ ] **Step 2: Reuse transport-driven runtime**
Ensure both providers work through the existing openai-compatible runtime and connection-test path.

- [ ] **Step 3: Update settings copy if needed**
Mention the expanded provider surface in the settings callout or related provider descriptions.

- [ ] **Step 4: Re-run targeted provider tests**
Run: `npm test -- --runInBand src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts`
Expected: PASS.

### Task 6: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`

- [ ] **Step 1: Update provider lists and configuration notes**
Document `Baidu Qianfan` and `SiliconFlow`, and clarify Doubao endpoint-ID guidance.

- [ ] **Step 2: Update release-process guidance if appropriate**
Make sure repository documentation is consistent with the new `AGENTS.md` release asset rule.

### Task 7: Final Verification

**Files:**
- Verify: repository root and touched source/test/docs files

- [ ] **Step 1: Run build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Run full test suite**
Run: `npm test -- --runInBand`
Expected: PASS with the known Jest open-handle warning only if it remains unchanged.

- [ ] **Step 3: Check git diff quality**
Run: `git diff --check`
Expected: PASS.

- [ ] **Step 4: Commit implementation**
```bash
git add AGENTS.md docs/superpowers/specs/2026-03-26-agents-and-provider-expansion-design.md docs/superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md docs/superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md README.md README_zh.md src/llmProviders.ts src/llmUtils.ts src/ui/NotemdSettingTab.ts src/tests/llmProviders.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerValidation.test.ts styles.css
git commit -m "feat: add agent guide and expand provider presets"
```
