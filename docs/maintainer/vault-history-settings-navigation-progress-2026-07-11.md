# Vault History, Settings Navigation, And Batch Folder Progress

Language: **English** | [简体中文](./vault-history-settings-navigation-progress-2026-07-11.zh-CN.md)

## Architecture Comparison

The previous preview history was a 12-item process-local session list. The current implementation adds a Vault-persisted metadata repository with completion-time ordering, normalized token search, intent/source-format/export filters, pagination, retention, and serialized writes. Pure query behavior now lives in `diagramHistoryQuery.ts`, independently of persistence writes. The in-modal list remains the fast recent-session surface; **Manage Vault history** opens the broader searchable index.

The previous settings page was one sequential renderer with no discovery layer. The current page adds a sticky search/navigation surface and Vault-persisted favorites while retaining existing Obsidian `Setting` controls. Catalog copy is captured at the `Setting.setName/setDesc` declaration boundary rather than scraped from rendered name/description DOM. Favorites resolve IDs from canonical translation paths; localized settings receive canonical English aliases, advanced provider declarations carry structured `advanced` metadata, and dynamic rows receive deterministic fallback IDs.

The previous batch title flow validated the selected path only inside `batchGenerateContentForTitles`, which converted a missing folder into a late generic error and error log. The new preparation boundary runs before the batch: missing folders can be created after consent, empty folders continue, non-empty folders require one batch-level confirmation, file collisions are rejected, and non-interactive callers receive a recoverable result. Only missing-folder auto-creation can be remembered.

## Implemented

- Vault diagram history domain with newest-first query, fuzzy search, filters, 20-item default pages, retention, clone safety, and index-only removal.
- History recording when a preview session is opened and a management modal for search, diagram/source/export filters, configurable page size, page navigation, export availability, and index removal.
- Preview source saves and SVG/PNG/PDF exports now update the same serialized Vault history entry, preserving real artifact paths across plugin reloads.
- The Vault manager now exposes source-note and generated-file open actions, inclusive completion-date filters, and a separately confirmed artifact-trash operation. Removing only the history index remains a distinct non-destructive action, and artifact deletion never includes the source note.
- Persisted editable artifacts can now reconstruct the existing direct-preview pipeline from history. Reopening reuses the original history identity instead of creating a misleading new generation record, while subsequent exports continue updating that record.
- Settings search header, heading navigation, responsive layout, and per-setting favorites saved in plugin data.
- Settings discovery now announces localized visible/total result counts, shows a localized empty state, assigns catalog entries to their nearest heading category, and prunes obsolete or duplicate favorite IDs without disturbing valid saved order.
- `SettingsNavigation.ts` now owns the combined fuzzy-query/favorites visibility calculation and visible-category set, so category buttons disappear when their group has no matching settings rather than presenting dead navigation choices.
- Batch-folder preparation domain and integration before title-generation batch execution.
- Hosts without an interactive preparation callback now use a read-only Vault inspection fallback. Missing, non-empty, or file-collision targets stop before generation with a recoverable interaction-required status; they do not create folders, emit an error log, or authorize writes.
- New defaults: `favoriteSettingIds`, `diagramHistoryRetentionLimit`, `diagramHistoryEntries`, and `autoCreateMissingBatchTargetFolders`.
- Updated English, Simplified Chinese, and every existing localized root README with settings/history/batch guidance. LM Studio `hy-mt2-7b` was used only for the bounded README translation segment.

## Verification State

- Final full verification after declaration-bound catalog capture passed: 220 Jest suites and 1,885 tests, the TypeScript production build, the UI i18n audit, and `git diff --check`.
- The built plugin was copied into the `Study` Vault and `obsidian vault="Study" plugin:reload id=notemd` returned `Reloaded: notemd`.
- The official `obsidian help` CLI surface executed successfully. A separate `obsidian-cli` executable is not installed, so no success is claimed for that compatibility alias.
- After a full Obsidian restart cleared the Electron module cache, official CLI evaluation opened the real `notemd` settings tab and observed 128 settings/favorite controls. Searching `provider` reduced the live result count to 5. A favorite persisted across plugin reload and was then restored to the original empty state.
- A synthetic Vault history record persisted across plugin reload and was removed afterward. Real batch-folder preparation used a dedicated temporary Vault folder: missing-folder confirmation created it, the empty folder returned ready without a prompt, and adding one file produced exactly one batch-level non-empty confirmation. The temporary note/folder were deleted after the check and `dev:errors` remained empty.
- A final one-file batch used the model already configured inside Obsidian, not LM Studio. It processed, generated, and moved 1/1 note with no errors; the generated Common Source Amplifier note contained substantive Chinese technical content, equations, a parameter table, references, and Mermaid diagrams. Both temporary source and completion folders were deleted afterward.
- The final deployed build reopened the real settings tab after restart with no captured errors. Searching the Chinese-rendered settings using the canonical English phrase `model identifier` returned live results, proving declaration-derived English aliases are active without reading rendered name/description DOM.
- History-manager copy is now localized through the shared English/Simplified-Chinese registry. A Frontend Law Auditor strict run based on CSS and contract evidence scored 100/100 after raising critical favorites, filters, and history actions to 44 px targets and adding explicit focus-visible rings. Windows screenshot capture still failed at the platform interface (`0x80004002`), so the score is a code-level gate, not a substitute for future screenshot comparison.
- Automated coverage confirms the repository/query behavior and batch-folder policies. Final clean-worktree evidence is obtained after commit and push.

## Next Direction

1. Consider explicit opt-in CLI authorization flags in a future automation-focused release; the current safe non-interactive behavior intentionally requires interaction for missing or non-empty targets.
2. Preserve the current query, catalog, navigation, and folder-preparation boundaries as new settings and diagram targets are added.
