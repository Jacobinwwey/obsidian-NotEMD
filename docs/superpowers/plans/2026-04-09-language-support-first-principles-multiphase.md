# Notemd Language Support First-Principles Multiphase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不破坏现有功能鲁棒性的前提下，分阶段把 Notemd 从“任务输出语言配置”升级为“UI i18n + 统一语言策略 + 可回归验证”的完整语言支持体系。

**Architecture:** 采用“语言域建模 -> i18n 基础设施 -> UI 文案迁移 -> 任务语言策略收敛 -> 回归门禁”五层架构。UI Locale 与 Task Output Language 明确分离，所有任务语言决策统一收口到策略层，所有改动按阶段执行并强制执行前后同口径比对。

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, ESLint, npm scripts, Obsidian CLI (`obsidian`/`obsidian-cli`)

---

## Execution Status (2026-04-09)

This plan has been implemented on `main` in commit `88202c5`.

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
- `obsidian help`: executed with local desktop/config caveats captured in logs
- `obsidian-cli help`: unavailable in current environment (`command not found`), captured in logs

## Phase Boundaries And Robustness Rule (Must Follow)

- 每个阶段都必须执行：`修改前基线 -> 最小改动 -> 修改后回归 -> 基线对比 -> 提交`。
- 每个阶段至少保留两份日志：`*-before.txt` 与 `*-after.txt`，放到 `docs/superpowers/baselines/<date>-language-support/`。
- 如果阶段回归失败，禁止进入下一阶段；先在当前阶段内修复并重新比对。
- 对同一功能使用同一测试入口做前后对比，避免“换口径通过”。

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
Expected: 命令可执行（允许 Obsidian CLI 输出本地配置告警）。

- [ ] **Step 2: Capture build baseline**
Run:
```bash
cd /home/jacob/obsidian-NotEMD
npm run build
```
Expected: 当前基线允许失败，但必须记录失败原因（当前已知：`ref/notebook-navigator` 被 `tsconfig` include 扫入导致 `TS6059`）。

- [ ] **Step 3: Capture targeted functional baseline**
Run:
```bash
cd /home/jacob/obsidian-NotEMD
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts
```
Expected: PASS；作为语言支持改造期间的关键行为基线。

---

### Task 1: Introduce Language Domain Model (Single Source Of Truth)

**Files:**
- Create: `src/i18n/languageContext.ts`
- Create: `src/i18n/taskLanguagePolicy.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Test: `src/tests/languagePolicy.test.ts`

- [ ] **Step 1: Write failing tests for policy rules**
覆盖：全局语言、按任务语言、禁用自动翻译、Translate 任务例外、Mermaid 特殊策略。

- [ ] **Step 2: Run tests to verify failure**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
Expected: FAIL（策略层尚未实现）。

- [ ] **Step 3: Implement minimal policy layer**
实现统一入口：`resolveTaskLanguage(taskKey, settings)` 与 `resolveUiLocale(settings, obsidianLocale)`。

- [ ] **Step 4: Re-run tests**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
Expected: PASS。

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

- [ ] **Step 1: Write failing tests for fallback chain**
覆盖：`zh-CN -> zh -> en`、缺失 key 回退、变量插值、缓存稳定性。

- [ ] **Step 2: Verify failure**
Run:
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
Expected: FAIL。

- [ ] **Step 3: Implement i18n core**
参考：`ref/notebook-navigator/src/i18n/index.ts` 的 `LANGUAGE_MAP + deep-merge fallback` 模式，但保持 Notemd 自身简洁边界。

- [ ] **Step 4: Re-run tests**
Run:
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
Expected: PASS。

- [ ] **Step 5: Compare with pre-change baseline**
保存并对比本任务前后日志，确认 i18n 引入没有影响既有 provider/mermaid/workflow 测试。

---

### Task 3: Migrate Settings UI Strings To i18n (High Impact Surface)

**Files:**
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/providerDiagnostics.test.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **Step 1: Capture before snapshot (settings-related tests)**
Run:
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt 2>&1
```

- [ ] **Step 2: Replace hardcoded UI labels with `strings` access**
范围：Language settings、Developer diagnostics、Workflow builder、Provider config notices。

- [ ] **Step 3: Run same tests after change**
Run:
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt 2>&1
```
Expected: PASS。

- [ ] **Step 4: Diff compare**
Run:
```bash
diff -u docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt | sed -n '1,200p'
```
Expected: 只接受文案相关差异，不接受行为失败差异。

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
包括：hero 标题、按钮文本、取消提示、log 操作提示、错误模态按钮文案。

- [ ] **Step 3: Re-run same tests**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task4-after.txt 2>&1
```
Expected: PASS。

- [ ] **Step 4: Compare and gate**
只要出现 FAIL 或 open-handle 恶化，必须回滚到本阶段内修复。

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

- [ ] **Step 1: Capture before behavior tests**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-before.txt 2>&1
```

- [ ] **Step 2: Remove scattered language decisions**
将 `fileUtils/searchUtils/promptUtils` 内分散逻辑收敛到 `taskLanguagePolicy`。

- [ ] **Step 3: Add explicit assertions for previously implicit behavior**
确保 `disableAutoTranslation`、task-specific language、translate task 例外逻辑可测。

- [ ] **Step 4: Run same test set after change**
Run:
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-after.txt 2>&1
```
Expected: PASS。

- [ ] **Step 5: Compare before/after**
仅允许预期日志文本差异；禁止功能路径变化导致断言减少。

---

### Task 6: Add Locale Formatting And RTL Safety

**Files:**
- Modify: `styles.css`
- Create: `src/i18n/localeFormat.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **Step 1: Add RTL and text-direction safe rules**
引入最小必要规则，避免破坏现有 panel 布局。

- [ ] **Step 2: Add formatting helper tests**
新增日期/时间格式 fallback 基础测试。

- [ ] **Step 3: Validate sidebar layout tests**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts
```
Expected: PASS（尤其是 docked footer / log 区域可见性相关断言）。

---

### Task 7: Build Regression Harness For Before/After Comparisons

**Files:**
- Create: `scripts/regression/language-support-baseline.sh`
- Create: `scripts/regression/language-support-compare.sh`
- Modify: `package.json`
- Create: `docs/superpowers/baselines/README.md`
- Test: `src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **Step 1: Script baseline capture command**
把关键命令统一封装，确保团队可重复执行。

- [ ] **Step 2: Script compare gate**
自动检查 PASS/FAIL 统计和关键错误关键字（`TS6059`, `ERR_CONNECTION_CLOSED`, `socket hang up` 仅允许在 mock 日志中出现）。

- [ ] **Step 3: Verify scripts locally**
Run:
```bash
npm run test -- --runInBand src/tests/llmUtilsProviderSupport.test.ts
bash scripts/regression/language-support-baseline.sh
bash scripts/regression/language-support-compare.sh
```
Expected: compare script 返回 0 才允许继续。

---

### Task 8: Documentation And Release Process Sync

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: `docs/superpowers/plans/2026-04-09-language-support-first-principles-multiphase.md`

- [ ] **Step 1: Document language support architecture**
包含 UI Locale vs Task Output Language 的定义与使用方式。

- [ ] **Step 2: Document regression workflow**
明确每个阶段必须保存 before/after logs。

- [ ] **Step 3: Release note requirement sync**
确保发布说明继续保持中英双语独立段落要求。

---

### Task 9: Final Verification Gate (No Halfway Delivery)

**Files:**
- Verify: modified files in `src/`, `styles.css`, `README.md`, `README_zh.md`, `scripts/regression/`, `docs/superpowers/`

- [ ] **Step 1: Restore build sanity for cloned `ref/` directory**
若保留 `ref/notebook-navigator` 在仓库中，需在 `tsconfig.json` 排除 `ref/**`，确保构建不受参考仓库影响。

- [ ] **Step 2: Run build**
Run:
```bash
npm run build
```
Expected: PASS。

- [ ] **Step 3: Run targeted regression matrix**
Run:
```bash
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts src/tests/languagePolicy.test.ts src/tests/i18nFallback.test.ts
```
Expected: PASS。

- [ ] **Step 4: Run full tests**
Run:
```bash
npm test -- --runInBand
```
Expected: PASS（若存在已知 open-handle warning，需记录并确保未恶化）。

- [ ] **Step 5: Obsidian CLI sanity check**
Run:
```bash
obsidian help
obsidian-cli help
```
Expected: 命令可执行。

- [ ] **Step 6: Diff quality check**
Run:
```bash
git diff --check
```
Expected: PASS。

- [ ] **Step 7: Commit by phase**
每个阶段独立提交，禁止跨阶段混杂提交。

- [ ] **Step 8: Release handoff**
版本发布前必须附带：测试摘要、before/after 对比结论、风险余项。

---

## Execution Notes For Engineers

- 参考实现：`/home/jacob/obsidian-NotEMD/ref/notebook-navigator/src/i18n/index.ts`。
- 但 Notemd 不做全量照抄；只迁移“可维护的最小核心”（map + fallback + centralized strings + tests）。
- 每个阶段都要先跑“阶段前”测试并保存日志，任何“先改再补日志”的流程视为不合规。
