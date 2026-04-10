# China Provider Expansion Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Qwen Code`, `Z AI`, and `Huawei Cloud MaaS` as fully supported Notemd provider presets with runtime coverage, connection-test coverage, documentation updates, and a patch release.

**Architecture:** Keep all three providers on the existing `openai-compatible` transport so the implementation remains metadata-driven. Extend the provider registry first, then lock behavior in with targeted routing and connection-test coverage, and finally update docs and ship a bilingual release with the required assets.

**Tech Stack:** TypeScript, Jest, Obsidian plugin APIs, existing Notemd provider registry/runtime, GitHub Releases

---

## File Structure

### Core Provider Metadata
- Modify: `src/llmProviders.ts`
- Responsibility: Add the new provider presets, descriptions, setup hints, ordering, default models, and API-test metadata.

### Runtime And Connection Test Coverage
- Modify: `src/tests/llmProviders.test.ts`
- Modify: `src/tests/llmUtilsProviderSupport.test.ts`
- Responsibility: Lock registry exposure, transport routing, probe endpoints, and transient-failure fallback behavior for the new providers.

### Documentation And Release Material
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: `change.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `manifest.json`
- Modify: `versions.json`
- Responsibility: Keep provider docs, changelog, and release metadata synchronized for `1.7.6`.

### Verification And Release
- Rebuild generated artifact: `main.js`
- Publish assets: `main.js`, `manifest.json`, `styles.css`, `README.md`
- Responsibility: Produce a clean patch release with bilingual release notes and required assets.

---

### Task 1: Add Registry Coverage For New Providers

**Files:**
- Modify: `src/tests/llmProviders.test.ts`
- Modify: `src/llmProviders.ts`
- Verify: `src/tests/llmProviders.test.ts`

- [ ] **Step 1: Write the failing registry assertions**

Add test expectations for:
- provider presence: `Qwen Code`, `Z AI`, `Huawei Cloud MaaS`
- transport: `openai-compatible`
- API test mode: `chat-only`
- openai-compatible classification

Expected additions belong in:
- the expanded provider-set assertion
- the transport metadata assertion
- the China-focused/openai-compatible metadata assertion block

- [ ] **Step 2: Run the focused registry test and verify it fails**

Run:

```bash
npx jest src/tests/llmProviders.test.ts --runInBand
```

Expected:
- failure because the three providers are not yet present in `src/llmProviders.ts`

- [ ] **Step 3: Implement the minimal registry entries**

Update `src/llmProviders.ts` to add:
- `Qwen Code`
- `Z AI`
- `Huawei Cloud MaaS`

Use these defaults unless official docs reviewed during implementation force a safer value:
- `Qwen Code`
  - base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
  - model: `qwen3-coder-plus`
- `Z AI`
  - base URL: `https://api.z.ai/api/paas/v4`
  - model: `glm-5`
- `Huawei Cloud MaaS`
  - base URL: `https://api.modelarts-maas.com/v1`
  - model: `DeepSeek-V3`

All three should use:
- category: `cloud`
- transport: `openai-compatible`
- apiKeyMode: `required`
- apiTestMode: `chat-only`

- [ ] **Step 4: Re-run the focused registry test and verify it passes**

Run:

```bash
npx jest src/tests/llmProviders.test.ts --runInBand
```

Expected:
- PASS

- [ ] **Step 5: Commit the registry slice**

```bash
git add src/llmProviders.ts src/tests/llmProviders.test.ts
git commit -m "feat: add round 2 china provider presets"
```

---

### Task 2: Add Runtime Routing Tests For The New Providers

**Files:**
- Modify: `src/tests/llmUtilsProviderSupport.test.ts`
- Verify: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: Write the failing `callLLM()` tests**

Add focused tests that assert `callLLM()` routes:
- `Qwen Code` to DashScope compatible `chat/completions`
- `Z AI` to `https://api.z.ai/api/paas/v4/chat/completions`
- `Huawei Cloud MaaS` to `https://api.modelarts-maas.com/v1/chat/completions`

Each test should assert:
- URL
- `Authorization` header
- model passthrough
- successful extraction through the existing OpenAI-compatible response parser

- [ ] **Step 2: Run the focused provider-support test and verify it fails**

Run:

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

Expected:
- failure because the new providers are not yet covered in the routing assertions or because unsupported provider names are not yet recognized by the metadata path used by tests

- [ ] **Step 3: Add the minimal test-backed runtime coverage**

Update only what is required so the new provider names flow through the existing `openai-compatible` path.

Important:
- do not add a new transport
- do not add provider-name-specific runtime branches unless implementation proves a shared path is impossible

- [ ] **Step 4: Re-run the focused provider-support test and verify the new routing tests pass**

Run:

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

Expected:
- PASS for the new `callLLM()` cases

- [ ] **Step 5: Commit the runtime-routing slice**

```bash
git add src/tests/llmUtilsProviderSupport.test.ts src/llmProviders.ts src/llmUtils.ts
git commit -m "test: cover runtime routing for new china providers"
```

---

### Task 3: Add Connection-Test And Transient-Fallback Coverage

**Files:**
- Modify: `src/tests/llmUtilsProviderSupport.test.ts`
- Verify: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: Write the failing `testAPI()` tests**

Add tests for:
- successful `testAPI()` probing for `Qwen Code`
- successful `testAPI()` probing for `Z AI`
- successful `testAPI()` probing for `Huawei Cloud MaaS`
- transient `ERR_CONNECTION_CLOSED` fallback during `testAPI()` for each new provider

Each test should assert:
- `chat/completions` probe path
- expected call count after fallback
- `success: true` after retry recovery

- [ ] **Step 2: Run the focused provider-support test and verify it fails for the new connection cases**

Run:

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

Expected:
- failure in the new `testAPI()` coverage until the registry metadata and test fixtures are complete

- [ ] **Step 3: Implement the minimal connection-test support**

Keep the implementation metadata-driven:
- `apiTestMode: chat-only`
- existing `requestUrlForConnectionTest()` fallback path

Do not add a separate connection-test function for these providers unless a provider-specific incompatibility is proven.

- [ ] **Step 4: Re-run the focused provider-support test and verify it passes**

Run:

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

Expected:
- PASS

- [ ] **Step 5: Commit the connection-test slice**

```bash
git add src/tests/llmUtilsProviderSupport.test.ts src/llmProviders.ts src/llmUtils.ts
git commit -m "test: cover connection probes for new china providers"
```

---

### Task 4: Update Documentation For Provider Expansion

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: `change.md`

- [ ] **Step 1: Write a doc checklist before editing**

Confirm each file will mention:
- `Qwen Code` as a coding-focused preset
- `Z AI` as an international complement to `GLM`
- `Huawei Cloud MaaS` as a hosted OpenAI-compatible preset
- updated provider coverage list

- [ ] **Step 2: Update the English README**

Edit `README.md` to update:
- feature/preset coverage bullets
- provider configuration section
- supported provider table/list

- [ ] **Step 3: Update the Chinese README**

Edit `README_zh.md` to mirror the same meaning in Chinese.

- [ ] **Step 4: Update the changelog**

Add a new `1.7.6` section in `change.md` describing:
- new presets
- provider test coverage
- any runtime behavior note that changed for this release

- [ ] **Step 5: Commit the documentation slice**

```bash
git add README.md README_zh.md change.md
git commit -m "docs: add round 2 provider coverage"
```

---

### Task 5: Prepare And Verify Release 1.7.6

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `manifest.json`
- Modify: `versions.json`
- Build: `main.js`

- [ ] **Step 1: Update version metadata to `1.7.6`**

Sync:
- `package.json`
- `package-lock.json`
- `manifest.json`
- `versions.json`
- any visible version strings that should change in `README.md` and `README_zh.md`

- [ ] **Step 2: Run the full repository verification**

Run:

```bash
npm test -- --runInBand
npm run build
git diff --check
obsidian help
obsidian-cli help
```

Expected:
- Jest passes
- build exits `0`
- `git diff --check` is clean
- Obsidian CLI results are reported honestly, including environment limitations if they still fail in this machine context

- [ ] **Step 3: Commit the release-prep slice**

```bash
git add package.json package-lock.json manifest.json versions.json README.md README_zh.md change.md main.js
git commit -m "chore: release 1.7.6"
```

- [ ] **Step 4: Push, tag, and create the GitHub release**

Use non-interactive git and GitHub CLI commands:

```bash
git push origin main
git tag -a 1.7.6 -m "Release 1.7.6"
git push origin 1.7.6
gh release create 1.7.6 main.js manifest.json styles.css README.md --title 1.7.6 --notes-file /tmp/notemd-release-1.7.6.md --verify-tag
```

Release notes requirements:
- complete English section
- complete Chinese section
- both independently readable

- [ ] **Step 5: Verify the published release**

Run:

```bash
git status --short --branch
gh release view 1.7.6 --json tagName,name,url,body,assets
```

Expected:
- clean worktree
- correct tag/name
- four required assets uploaded
- bilingual release body present

---

## Review Notes

This plan intentionally keeps implementation metadata-driven. If one of the target providers turns out to require a nonstandard auth header, signature, or protocol flow, stop and split that provider into a separate design instead of forcing it into the shared transport path.

A dedicated plan-review subagent was not used here because this session does not have explicit user authorization to delegate sub-agent work. This plan was self-reviewed against the approved spec at `docs/superpowers/specs/2026-03-26-china-provider-expansion-round2-design.md`, the current test layout, and the repository's codified release rules.
