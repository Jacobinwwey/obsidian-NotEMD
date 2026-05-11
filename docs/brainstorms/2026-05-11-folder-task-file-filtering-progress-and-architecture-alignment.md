---
date: 2026-05-11
last_updated: 2026-05-11
topic: folder-task-file-filtering-progress-and-architecture-alignment
---

# Folder-Task File Filtering Delivery: Deep Comparison, Progress, And Next Direction

## 1. Scope And Requirement Baseline

This document lands the concrete plan and implementation status for folder-task file filtering, based on the latest requirement refinements:

1. folder tasks must support configurable file filtering (regex/glob/contains/no-filter).
2. `includeSubfolders` must be optional because translation currently behaves differently.
3. filter target must be user-selectable between `relativePath` and `basename`.
4. existing behavior must remain stable and robust by default.
5. implementation must align with mainline stabilization discipline (CI-safe, contract-first, no regression on shipped paths).

## 2. Pre-Change Reality And Root Cause Analysis

Before this slice, folder-level file collection was fragmented across multiple modules and behavior diverged by task:

- recursive-by-prefix for most folder tasks (`process folder`, `extract concepts folder`, `batch extract original text`, `batch generate`, `batch Mermaid fix`, `batch formula fix`).
- direct-child only for `batchTranslateFolder` (`folder.children` behavior).

Root-cause summary:

1. **No shared folder-file selection contract** led to per-command ad hoc logic and drift risk.
2. **Special-character limitations were mostly not Obsidian input limitations** for this feature path; the key blocker was missing plugin-side selection/filter architecture, not raw text entry capability.
3. **No explicit compatibility mode** existed to preserve translation-specific legacy scope while allowing future recursive behavior.

## 3. Implementation Mapping (Requirement -> Code Evidence)

| Requirement | Code evidence | Status |
|---|---|---|
| Introduce shared folder-task selector | `src/folderTaskFileSelector.ts` | Landed |
| Support filter mode `none/contains/regex/glob` | `FolderTaskFileFilterMode`, matcher compiler, glob compiler | Landed |
| Support target `relativePath/basename` | `FolderTaskFileFilterTarget`, target resolver | Landed |
| Support optional `includeSubfolders` with compatibility default | `FolderTaskIncludeSubfoldersMode` + `legacy` task map (translation default non-recursive) | Landed |
| Keep default behavior stable | `DEFAULT_SETTINGS.folderTaskIncludeSubfoldersMode = "legacy"`, `folderTaskFileFilterMode = "none"` | Landed |
| Avoid silent regex failure | explicit regex compile `try/catch` and deterministic error | Landed |
| Integrate across folder tasks | `noteProcessingCommandHostAdapter.ts`, `fileUtils.ts`, `translate.ts`, `formulaFixer.ts` | Landed |
| Expose user settings | `NotemdSettingTab` folder-task filter section + i18n keys (EN/ZH-CN/ZH-TW) | Landed |
| Lock behavior with regression tests | `folderTaskFileSelector.test.ts`, `translateContract.test.ts`, host adapter and contract tests | Landed |
| Add operation-level optional override (global default unchanged) | `applyFolderTaskSelectionOverride`, host-adapter option plumb-through, operation input schema extension | Landed |

## 4. Architecture Advancement Assessment

This change is aligned with previously approved “stabilization before expansion” direction:

1. **From scattered logic to one selector contract**
   file-scope selection moved into a shared utility that can be reused by all folder tasks.
2. **Compatibility-first migration**
   `legacy` subfolder mode avoids breaking translation defaults while enabling explicit opt-in recursion.
3. **Boundary-hardening, not feature sprawl**
   this is a structural consistency upgrade in task orchestration, not a runtime-packaging detour.
4. **Error semantics tightened**
   invalid regex now fails explicitly rather than producing hidden false-positive/false-negative processing sets.

## 5. Deep Comparison Against Prior Plan Tracks

### 5.1 Against `mainline-stabilization-next-batch` intent

Alignment:

- keeps command/task behavior predictable via shared contract logic.
- preserves CI-safe incremental delivery discipline.
- avoids reopening unrelated renderer/runtime packaging scopes.

Difference:

- this slice extends settings/task orchestration, not diagram command surface.
- still consistent with the same boundary-hardening philosophy.

### 5.2 Against packaging/semantic convergence track

Alignment:

- same anti-drift pattern: centralize truth + add tests + update docs in the same batch.
- same gate policy (`build`, full tests, audits, diff-check, Obsidian CLI checks).

Difference:

- folder-task filtering concerns content-processing scope selection, not release packaging boundary semantics.

## 6. Risk Register And Controls

1. **Risk:** regex misconfiguration causes accidental broad processing.
   **Control:** deterministic compile error path; no silent fallback.
2. **Risk:** `invert` with empty pattern could exclude all files unexpectedly.
   **Control:** empty-pattern mode is treated as no-op even when invert is enabled.
3. **Risk:** extension detection drift in mocked/edge file objects.
   **Control:** extension fallback parsing from `name/path` when `file.extension` is absent.
4. **Risk:** translation regression from recursive default changes.
   **Control:** translation remains legacy non-recursive unless user explicitly sets include mode.

## 7. Verification Evidence (This Delivery Slice)

Executed and passed:

1. `npm run build`
2. `npm test -- --runInBand` (full suite, green)
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

## 8. Incremental Progress Update (Operation-Level Override Slice)

This follow-up slice is now landed on top of the baseline global filtering release:

1. operation input schemas for folder-scope operations now expose optional override fields:
   `includeSubfoldersMode`, `fileFilterMode`, `fileFilterPattern`, `fileFilterTarget`, `fileFilterCaseSensitive`, `fileFilterInvert`.
2. note-processing and utility host adapters now support scoped override inputs and resolve effective settings through a shared helper (`applyFolderTaskSelectionOverride`), avoiding duplicated merge logic.
3. default behavior is unchanged when override input is absent; translation legacy non-recursive behavior is still preserved under `legacy`.
4. regression coverage was expanded across selector helper, CLI contracts, operations registry metadata, and host adapter behavior.
5. sidebar/workflow execution paths now consistently pass folder overrides for additional folder actions (`extract-concepts-folder`, `batch-extract-original-text`, `batch-fix-formula`) when workflow context already has a resolved target folder.

## 9. Next Direction (Concrete)

1. keep `legacy` compatibility default until telemetry/feedback confirms a safe migration window.
2. if external automation surface binding is expanded, map these override fields to canonical operation execution paths directly (without bypassing host adapter validation/guardrails).
3. add focused UX hints for regex/glob examples and invalid-pattern guidance without blocking advanced syntax.
4. continue the planned packaging / semantic-verification convergence track without reopening unrelated runtime scope.

## 10. Incremental Progress Update (Batch Extract Original Text Operation Contract)

This slice closes the previously identified operation-layer gap for folder-scope original-text extraction:

1. operation `content.batch-extract-original-text` is now registered in `src/operations/registry.ts`.
2. command binding is now canonicalized to `batch-extract-original-text`, with metadata sourced from workflow-side action semantics (`interactive-ui`, `folder-selection`, `batch-write`).
3. input schema now exposes folder selection overrides:
   `includeSubfoldersMode`, `fileFilterMode`, `fileFilterPattern`, `fileFilterTarget`, `fileFilterCaseSensitive`, `fileFilterInvert`.
4. result schema now aligns with `BatchExtractOriginalTextResult` shape:
   `folderPath`, `processedFileCount`, `extractedCount`, `cancelled`, `fileResults`, `errors`.
5. regression tests were expanded and now lock this operation through:
   `operationsRegistry`, `cliContracts`, and `cliCapabilityManifest` coverage.

## 11. Incremental Progress Update (Filter Syntax Guidance And Early Regex Warning)

The next low-risk UX hardening slice from the plan is now landed:

1. settings now include an explicit pattern-syntax guidance row under folder-task filtering, with canonical regex/glob examples and target-alignment reminder.
2. when filter mode is set to `regex`, pattern edits and mode-switch now run non-blocking compile validation in settings.
3. invalid regex now surfaces an immediate localized notice in settings, but values are still saved to avoid blocking advanced editing workflows.
4. this keeps runtime behavior unchanged while reducing delayed failure discovery (users no longer need to run a full folder task before seeing syntax issues).
5. i18n and regression coverage were updated to lock the new keys and settings-tab key usage.

## 12. Mainline And Workspace Hygiene Outcome

This slice is ready for mainline landing under existing CI discipline:

- concrete plan is persisted to docs.
- progress and architecture comparison are persisted and traceable.
- next-step direction is explicit.
- branch is intended to be merged/pushed on `main` with post-push clean-status verification.
