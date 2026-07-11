# Vault History, Settings Navigation, And Batch Folder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Vault-persistent diagram history, fuzzy-searchable settings with category navigation and favorites, safe batch target-folder preparation, and synchronized multilingual README guidance.

**Architecture:** Add focused domain modules for history queries, setting catalog/search, and batch-folder policy. Existing Obsidian UI classes consume those modules and remain responsible only for rendering and user interaction. Plugin settings persist lightweight indexes and preferences; generated artifacts stay as Vault files.

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, existing i18n registry, Markdown README localization.

## Global Constraints

- Default history order is completion time descending and default page size is 20.
- History is Vault-scoped and stores paths/metadata, never duplicated binary or SVG bodies.
- Missing batch folders may be auto-created only after explicit opt-in; non-empty folders require one confirmation per batch invocation.
- CLI/non-interactive calls never silently create or authorize a non-empty folder.
- Every design, plan, and progress document has separate English and Simplified Chinese files.
- Use TDD for every behavior change and finish with fresh build, full Jest, `git diff --check`, Obsidian CLI integration, push to `main`, and a clean worktree.

---

### Task 1: Persistent Diagram History Domain

**Files:**
- Create: `src/diagram/history/diagramHistoryRepository.ts`
- Create: `src/diagram/history/diagramHistoryQuery.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Test: `src/tests/diagramHistoryRepository.test.ts`

**Interfaces:**
- Produces `DiagramHistoryEntry`, `DiagramHistoryQuery`, `DiagramHistoryPage`.
- Produces `createDiagramHistoryRepository(load, save)` with `recordCompleted`, `query`, `get`, and `removeIndexEntry`.

- [ ] Write failing tests proving descending ordering, normalized fuzzy text, filters, 20-item paging, retention pruning, and clone-safe results.
- [ ] Run `npm test -- --runInBand src/tests/diagramHistoryRepository.test.ts` and confirm failures are caused by missing modules.
- [ ] Implement pure query functions and serialized repository writes; pruning must remove index records only.
- [ ] Re-run the targeted tests and commit `feat(diagrams): persist vault diagram history`.

### Task 2: History Recording And Management UI

**Files:**
- Create: `src/ui/DiagramHistoryModal.ts`
- Modify: `src/ui/diagramPreviewHistory.ts`
- Modify: `src/ui/DiagramPreviewModal.ts`
- Modify: `src/main.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/diagramPreviewModal.test.ts`
- Test: `src/tests/diagramHistoryModal.test.ts`

**Interfaces:**
- Consumes the Task 1 repository.
- Produces a modal query state `{search, intent, target, exportKind, sourcePath, from, to, page, pageSize}`.

- [ ] Write failing tests for recording only completed renders, recent-history limits, opening the full manager, filter reset, next/previous page boundaries, and index-only deletion.
- [ ] Verify the tests fail before implementation.
- [ ] Implement compact recent history in the preview and a dedicated Vault history modal with search, filters, paging, reopen, source-note navigation, export availability, and separately confirmed artifact deletion.
- [ ] Run both targeted suites and commit `feat(diagrams): add vault history manager`.

### Task 3: Stable Settings Catalog And Fuzzy Search

**Files:**
- Create: `src/ui/settings/settingCatalog.ts`
- Create: `src/ui/settings/settingSearch.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Test: `src/tests/settingCatalog.test.ts`
- Test: `src/tests/providerSettingsBehavior.test.ts`

**Interfaces:**
- Produces `SettingCatalogEntry {id, categoryId, name, description, aliases, advanced}`.
- Produces `searchSettingCatalog(entries, query)` with normalized substring plus ordered-token fuzzy matching.

- [ ] Write failing tests for stable unique IDs, required category coverage, Chinese/English query normalization, typo-tolerant ordered matching, and empty-query behavior.
- [ ] Verify RED with the targeted Jest command.
- [ ] Implement catalog/search without reading DOM text and annotate existing setting groups with stable IDs.
- [ ] Re-run tests and commit `feat(settings): add searchable setting catalog`.

### Task 4: Category Rail And Favorites

**Files:**
- Create: `src/ui/settings/SettingsNavigation.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `styles.css`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/providerSettingsBehavior.test.ts`
- Test: `src/tests/providerSettingsStyles.test.ts`

**Interfaces:**
- Consumes stable setting/category IDs from Task 3.
- Persists `favoriteSettingIds: string[]` in `NotemdSettings`.

- [ ] Write failing UI contract tests for category navigation, favorites surviving locale changes, unknown-ID suppression, search result grouping, keyboard focus, and narrow-layout adaptation.
- [ ] Run tests and confirm expected failures.
- [ ] Implement the Codex-inspired compact rail, favorites entry, search header, result counts, and responsive horizontal navigation while preserving Obsidian Setting controls.
- [ ] Run targeted UI/style tests and commit `feat(settings): add navigation and favorites`.

### Task 5: Batch Target Folder Preparation

**Files:**
- Create: `src/operations/batchTargetFolderPreparation.ts`
- Modify: `src/operations/noteProcessingCommandHostAdapter.ts`
- Modify: `src/fileUtils.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/batchTargetFolderPreparation.test.ts`
- Test: `src/tests/noteProcessingCommands.test.ts`

**Interfaces:**
- Produces `prepareBatchTargetFolder(request): Promise<{status:'ready'|'cancelled'|'requires-interaction'; path:string}>`.
- Host supplies `inspectPath`, `createFolder`, and one batch-level `confirm` operation.

- [ ] Write failing tests for missing/empty/non-empty/file collision, remembered missing-folder creation, one confirmation for a non-empty batch, cancellation without error logging, and non-interactive recoverable outcomes.
- [ ] Run targeted tests and confirm failures.
- [ ] Implement edge validation and call it before title-generation enumeration; remove the late generic invalid-folder failure for this command path.
- [ ] Re-run tests and commit `fix(batch): prepare configured target folders safely`.

### Task 6: README And Multilingual Documentation

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: existing localized `README*.md` files
- Create: `docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.md`
- Create: `docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.zh-CN.md`
- Modify: `src/tests/docsBilingualSupport.test.ts`

**Interfaces:**
- Documents the same setting categories and stable user-facing behavior implemented in Tasks 1-5.

- [ ] Write failing documentation contract assertions for history management, settings search/navigation/favorites, missing-folder auto-create, and per-batch non-empty confirmation across all supported README locales.
- [ ] Run the contract test and confirm missing guidance failures.
- [ ] Update English canonical sections, translate bounded sections to every existing README locale, and add bilingual progress/architecture comparison documents.
- [ ] Re-run documentation tests and commit `docs: explain settings and history workflows`.

### Task 7: Integration, Visual Audit, And Main Delivery

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run targeted suites for all six tasks.
- [ ] Run `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, and `git diff --check`.
- [ ] Reload the plugin with `Obsidian.com`, verify history survives reload, exercise search/favorites, and test missing plus non-empty batch folders with the configured model.
- [ ] Update both progress documents with exact evidence and remaining architectural direction.
- [ ] Inspect the complete diff, commit any verification fixes, push `main`, and confirm `git status` is clean.

