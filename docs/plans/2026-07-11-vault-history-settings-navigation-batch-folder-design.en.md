# Vault Diagram History, Settings Navigation, And Batch Folder Safety Design

Language: **English** | [ç®€ä½“ä¸­æ–‡](./2026-07-11-vault-history-settings-navigation-batch-folder-design.zh-CN.md)

## Outcome

Notemd will provide a Vault-scoped diagram asset history, a searchable and navigable settings experience with favorites, and a safe batch-output folder preparation flow. The work keeps Obsidian-native controls and separates persistence, indexing, policy, and rendering responsibilities.

## Current Architecture And Gaps

- `src/ui/diagramPreviewHistory.ts` stores preview history in a module-level array. It supports recent-session selection but has no Vault persistence, search, filters, paging, deletion policy, or artifact management.
- `src/ui/DiagramPreviewModal.ts` renders the entire history list inside the preview modal. This is suitable for recent items, not a Vault-wide management surface.
- `src/ui/NotemdSettingTab.ts` renders a long sequential settings page. Setting labels are translated strings rather than stable identities, so DOM-text search or text-keyed favorites would drift across locales.
- Batch title generation reaches `src/fileUtils.ts` with a configured folder path and throws when the folder does not exist. Creation and non-empty-folder consent are UI policy decisions and must be resolved before the batch operation begins.
- README files describe major features but do not provide a complete, searchable catalog for the growing settings surface.

## Chosen Architecture

### 1. Vault Diagram History Index

Create a persistent history repository owned by the plugin and stored through Obsidian plugin data. Each record contains a stable ID, completion timestamp, source note path, diagram intent, source/render target, title, source artifact path, available export paths, status, and lightweight error metadata. Large SVG, PNG, PDF, and TeX bodies are never duplicated inside plugin settings.

The repository exposes complete operations: record completion, query a page, get one entry, remove only the index entry, and remove an entry plus selected artifacts after explicit confirmation. Queries support free text, diagram intent, source format, export availability, source note, completion range, page number, and page size. Default order is completion time descending; page size defaults to 20.

The preview modal keeps a compact recent-history section and links to a dedicated Vault history modal. The management modal owns search, filters, paging, reopen/preview, reveal source note, export actions, and deletion.

### 2. Settings Catalog, Search, Navigation, And Favorites

Introduce a settings catalog with stable IDs, category IDs, localized names/descriptions, search aliases, and optional advanced/developer classification. Categories are: General, Providers & models, Note processing, Diagrams, Batch processing, Slides, and Developer.

The setting tab renders an Obsidian-native two-column shell: a compact category/favorites rail and the existing controls in the content column. On narrow containers the rail becomes a horizontal selector. Fuzzy search operates on normalized localized name, description, aliases, and category text. Search results remain grouped by category and show why each result matched. Favorite IDs are persisted per Vault and remain stable across locale changes.

Settings continue to use their existing controls and save behavior. The catalog adds identity and discovery; it does not duplicate configuration state or introduce a second settings backend.

### 3. Batch Folder Preparation Boundary

Create a folder preparation operation used before a batch starts:

- Missing folder: ask once whether to create it. The dialog offers â€œAutomatically create missing batch target folders in the future.â€
- Existing empty folder: proceed without prompting.
- Existing non-empty folder: show item count and a small sample, then ask once for the whole batch.
- Existing file at the path: reject with a specific actionable error.
- Cancellation: stop cleanly without an error log or writes.
- CLI/non-interactive host: return a structured recoverable outcome; never create or use a non-empty folder without explicit policy input.

The persisted preference applies only to missing-folder creation. Non-empty folders always require one confirmation per batch invocation, never one confirmation per generated file.

### 4. README Synchronization

Add a user-facing settings directory covering the new navigation, favorites, history, batch folder behavior, and currently under-documented settings. English remains canonical. Existing localized README files are synchronized from bounded translation segments while preserving Markdown structure and links. Repository tests verify locale coverage and critical setting identifiers without committing translation responses or generated site output.

## Data And Compatibility

- Existing in-memory preview sessions migrate into the repository when completed; no old persisted history exists to migrate.
- History retention is bounded by a configurable maximum with a safe default. Pruning removes index entries only, never user files.
- New settings use explicit names such as `favoriteSettingIds`, `autoCreateMissingBatchTargetFolders`, and `diagramHistoryRetentionLimit`.
- Unknown or removed favorite IDs are ignored during rendering and retained only when still registered.
- All filesystem paths are Vault-relative and normalized at the boundary.

## Error Handling And Safety

Persistence writes are serialized to avoid lost updates. A failed history-index write does not invalidate the generated artifact; it produces a user-visible warning and diagnostic entry. Search never mutates settings. Artifact deletion requires a separate confirmation from index deletion and validates every resolved path is inside the Vault.

## Verification

- Repository unit tests cover ordering, fuzzy query, filters, pagination, retention, and deletion boundaries.
- Setting catalog tests cover stable IDs, category coverage, locale-independent favorites, fuzzy matching, and responsive navigation state.
- Batch folder tests cover missing, empty, non-empty, file collision, remembered auto-create, cancellation, and non-interactive outcomes.
- Obsidian integration checks cover plugin reload persistence, history reopen/export, settings search/favorite navigation, and one-time non-empty-folder confirmation.
- README and localization contract tests verify all supported README locales contain the new user guidance.

## Delivery Stages

1. Persistent history repository and query contract.
2. History management UI and preview integration.
3. Settings catalog, fuzzy search, category rail, and favorites.
4. Batch folder preparation flow and command-host integration.
5. README multilingual synchronization, full verification, real Obsidian checks, and main deployment.

