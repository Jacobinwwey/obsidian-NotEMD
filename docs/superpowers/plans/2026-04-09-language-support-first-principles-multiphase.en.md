# Notemd Language Support First-Principles Multiphase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Notemd, in phases and without weakening existing robustness, from "task output language settings" into a complete language-support system covering UI i18n, a unified language policy, and reproducible regression gates.

**Architecture:** Use a five-layer architecture: language-domain modeling -> i18n infrastructure -> UI-string migration -> task-language-policy convergence -> regression gates. `UI Locale` and `Task Output Language` are explicitly separated, all task-language decisions converge in one policy layer, and every phase must follow the same before/after comparison discipline.

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, ESLint, npm scripts, Obsidian CLI (`obsidian` / `obsidian-cli`)

---

## Execution Status (2026-04-09)

This plan has already been implemented on `main` in commit `88202c5`.

### Evidence Index

- Baseline and phase logs:
  - `docs/superpowers/baselines/2026-04-09-language-support/`
- Final verification artifacts:
  - `task9-build-after-docs.txt`
  - `task9-targeted-matrix.txt`
  - `task9-full-runInBand.txt`
  - `task9-regression-baseline.txt`
  - `task9-regression-compare.txt`
  - `task9-git-diff-check.txt`
  - `task9-obsidian-help.txt`
  - `task9-obsidian-cli-help.txt`

### Final Gate Outcome

- `npm run build`: PASS
- Targeted regression matrix: PASS
- Full `npm test -- --runInBand`: PASS
- `npm run regression:language-compare`: PASS
- `git diff --check`: PASS
- `obsidian help`: executed, with local desktop/config caveats captured in logs
- `obsidian-cli help`: unavailable in the current environment (`command not found`), captured in logs

## Phase Boundaries And Robustness Rule (Must Follow)

- Every phase must follow: `before-change baseline -> minimal change -> after-change regression -> baseline comparison -> commit`.
- Every phase must preserve at least two logs, `*-before.txt` and `*-after.txt`, under `docs/superpowers/baselines/<date>-language-support/`.
- If regression fails in a phase, do not move to the next phase; fix the current phase first and rerun the comparison.
- Use the same test entrypoints before and after changes so the pass signal does not come from changing the measurement method.

---

### Task 0: Freeze Baseline Snapshot (Current Reality)

**Files:**
- Create/Update: `docs/superpowers/baselines/2026-04-09-language-support/environment-before.txt`
- Create/Update: `docs/superpowers/baselines/2026-04-09-language-support/build-before.txt`
- Create/Update: `docs/superpowers/baselines/2026-04-09-language-support/targeted-tests-before.txt`

- [ ] **Step 1: Capture environment baseline**
Run:
```bash
cd /home/jacob/obsidian-NotEMD
obsidian help
obsidian-cli help
node -v
npm -v
```
Expected: the commands are executable, while allowing local Obsidian CLI caveats.

- [ ] **Step 2: Capture build baseline**
Run:
```bash
cd /home/jacob/obsidian-NotEMD
npm run build
```
Expected: the current baseline may fail, but the failure cause must be recorded. The known cause at the time was `TS6059` from `ref/notebook-navigator` being pulled into `tsconfig` include scope.

- [ ] **Step 3: Capture targeted functional baseline**
Run:
```bash
cd /home/jacob/obsidian-NotEMD
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts
```
Expected: PASS. This is the critical behavior baseline during the language-support migration.

---

### Task 1: Introduce Language Domain Model (Single Source Of Truth)

**Files:**
- Create: `src/i18n/languageContext.ts`
- Create: `src/i18n/taskLanguagePolicy.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Test: `src/tests/languagePolicy.test.ts`

- [ ] **Step 1: Write failing tests for policy rules**
Cover global language, per-task language, disable-auto-translation behavior, translate-task exceptions, and Mermaid-specific policy behavior.

- [ ] **Step 2: Run tests to verify failure**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
Expected: FAIL because the policy layer does not exist yet.

- [ ] **Step 3: Implement the minimal policy layer**
Implement unified entrypoints: `resolveTaskLanguage(taskKey, settings)` and `resolveUiLocale(settings, obsidianLocale)`.

- [ ] **Step 4: Re-run tests**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
Expected: PASS.

- [ ] **Step 5: Before/after comparison**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task1-after.txt 2>&1
```
Compare:
```bash
grep -E "PASS|FAIL" docs/superpowers/baselines/2026-04-09-language-support/task1-after.txt
```

---

### Task 2: Build UI i18n Infrastructure (Catalog + Fallback)

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/en.ts`
- Create: `src/i18n/locales/zh_cn.ts`
- Create: `src/i18n/locales/zh_tw.ts`
- Modify: `src/main.ts`
- Test: `src/tests/i18nFallback.test.ts`

- [ ] **Step 1: Write failing fallback-chain tests**
Cover `zh-CN -> zh -> en`, missing-key fallback, variable interpolation, and cache stability.

- [ ] **Step 2: Verify failure**
Run:
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement the i18n core**
Use the `LANGUAGE_MAP + deep-merge fallback` pattern seen in `ref/notebook-navigator/src/i18n/index.ts`, but keep Notemd's own boundary small and maintainable.

- [ ] **Step 4: Re-run tests**
Run:
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
Expected: PASS.

- [ ] **Step 5: Compare with the pre-change baseline**
Save and compare before/after logs for this task, and confirm the i18n introduction does not regress existing provider / Mermaid / workflow tests.

---

### Task 3: Migrate Settings UI Strings To i18n (High-Impact Surface)

**Files:**
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/providerDiagnostics.test.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **Step 1: Capture the before snapshot for settings-related tests**
Run:
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt 2>&1
```

- [ ] **Step 2: Replace hardcoded UI labels with `strings` access**
Scope: language settings, developer diagnostics, workflow builder, and provider-configuration notices.

- [ ] **Step 3: Run the same tests after the change**
Run:
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt 2>&1
```
Expected: PASS.

- [ ] **Step 4: Diff comparison**
Run:
```bash
diff -u docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt | sed -n '1,200p'
```
Expected: only copy-related differences are acceptable; behavior failures are not.

---

### Task 4: Migrate Sidebar And Notice Strings (Runtime UX Surface)

**Files:**
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/ui/ErrorModal.ts`
- Modify: `src/main.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`
- Test: `src/tests/sidebarButtonTriggerChains.test.ts`

- [ ] **Step 1: Record runtime UI baseline tests**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task4-before.txt 2>&1
```

- [ ] **Step 2: Migrate runtime-facing strings**
Cover hero title, button text, cancellation notices, log-operation notices, and error-modal button copy.

- [ ] **Step 3: Re-run the same tests**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task4-after.txt 2>&1
```
Expected: PASS.

- [ ] **Step 4: Compare and gate**
Any FAIL or worse open-handle behavior must be fixed before moving on.

---

### Task 5: Unify Task Language Decision In Prompt And Processing Paths

**Files:**
- Modify: `src/promptUtils.ts`
- Modify: `src/fileUtils.ts`
- Modify: `src/searchUtils.ts`
- Modify: `src/main.ts`
- Modify: `src/i18n/taskLanguagePolicy.ts`
- Test: `src/tests/languagePolicy.test.ts`
- Test: `src/tests/processFile.test.ts`
- Test: `src/tests/workflowButtons.test.ts`

- [ ] **Step 1: Capture before-change behavior tests**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-before.txt 2>&1
```

- [ ] **Step 2: Remove scattered language decisions**
Converge language logic from `fileUtils`, `searchUtils`, and `promptUtils` into `taskLanguagePolicy`.

- [ ] **Step 3: Add explicit assertions for previously implicit behavior**
Make `disableAutoTranslation`, task-specific language, and translate-task exception behavior directly testable.

- [ ] **Step 4: Run the same test set after the change**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-after.txt 2>&1
```
Expected: PASS.

- [ ] **Step 5: Compare before/after**
Only expected log-text differences are acceptable; assertion coverage must not shrink because of path changes.

---

### Task 6: Add Locale Formatting And RTL Safety

**Files:**
- Modify: `styles.css`
- Create: `src/i18n/localeFormat.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **Step 1: Add RTL-safe and text-direction rules**
Introduce only the minimum CSS required so existing panel layout does not regress.

- [ ] **Step 2: Add formatting-helper tests**
Add baseline tests for date/time-format fallback behavior.

- [ ] **Step 3: Validate sidebar-layout tests**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts
```
Expected: PASS, especially for docked footer and log-surface assertions.

---

### Task 7: Build Regression Harness For Before/After Comparisons

**Files:**
- Create: `scripts/regression/language-support-baseline.sh`
- Create: `scripts/regression/language-support-compare.sh`
- Modify: `package.json`
- Create: `docs/superpowers/baselines/README.md`
- Test: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: Script the baseline-capture command**
Wrap the critical commands so the team can rerun them reproducibly.

- [ ] **Step 2: Script the compare gate**
Automatically check PASS/FAIL counts and key error keywords. `TS6059`, `ERR_CONNECTION_CLOSED`, and `socket hang up` are only acceptable inside mock logs.

- [ ] **Step 3: Verify scripts locally**
Run:
```bash
npm run test -- --runInBand src/tests/llmUtilsProviderSupport.test.ts
bash scripts/regression/language-support-baseline.sh
bash scripts/regression/language-support-compare.sh
```
Expected: the compare script returns `0` before work may continue.

---

### Task 8: Documentation And Release Process Sync

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: `docs/superpowers/plans/2026-04-09-language-support-first-principles-multiphase.md`

- [ ] **Step 1: Document the language-support architecture**
Explain the definitions and usage of `UI Locale` versus `Task Output Language`.

- [ ] **Step 2: Document the regression workflow**
Explicitly require every phase to preserve before/after logs.

- [ ] **Step 3: Sync release-note requirements**
Ensure the release-description rule still requires independent English and Chinese sections.

---

### Task 9: Final Verification Gate (No Halfway Delivery)

**Files:**
- Verify: modified files in `src/`, `styles.css`, `README.md`, `README_zh.md`, `scripts/regression/`, `docs/superpowers/`

- [ ] **Step 1: Restore build sanity for cloned `ref/` directories**
If `ref/notebook-navigator` stays in the repository, exclude `ref/**` from `tsconfig.json` so the reference repo cannot break normal builds.

- [ ] **Step 2: Run build**
Run:
```bash
npm run build
```
Expected: PASS.

- [ ] **Step 3: Run the targeted regression matrix**
Run:
```bash
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts src/tests/languagePolicy.test.ts src/tests/i18nFallback.test.ts
```
Expected: PASS.

- [ ] **Step 4: Run full tests**
Run:
```bash
npm test -- --runInBand
```
Expected: PASS. If a known open-handle warning remains, record it and confirm it has not worsened.

- [ ] **Step 5: Obsidian CLI sanity check**
Run:
```bash
obsidian help
obsidian-cli help
```
Expected: the commands are executable.

- [ ] **Step 6: Diff-quality check**
Run:
```bash
git diff --check
```
Expected: PASS.

- [ ] **Step 7: Commit by phase**
Each phase must be committed independently. Do not mix phases in one commit.

- [ ] **Step 8: Release handoff**
Before release, include a test summary, before/after comparison conclusion, and remaining risk items.

---

## Execution Notes For Engineers

- Reference implementation: `/home/jacob/obsidian-NotEMD/ref/notebook-navigator/src/i18n/index.ts`.
- Notemd should not copy it wholesale. Only migrate the maintainable minimal core: map + fallback + centralized strings + tests.
- Every phase must run the "before phase" tests and preserve logs first. "Change first, add logs later" is non-compliant.
