# Diagram Popup And Adaptive History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rebuild the diagram preview and Vault history popup surfaces around one shared adaptive history view, add always-available command/sidebar entry points, and raise the measured popup UX gate without changing rendering or history data semantics.

**Architecture:** Extract a host-independent `DiagramHistoryView` that receives a history store, locale, and host callbacks. Use it in a preview-owned right drawer and a thin standalone `DiagramHistoryModal`; move repository construction and complete callbacks into `NotemdPlugin.openDiagramHistory()` so every host shares one owner. Replace the preview rail with a canvas-first header and native Obsidian export menu.

**Tech Stack:** TypeScript, Obsidian `Modal`/`Menu`/`setIcon`, existing Jest mocks, CSS variables and media queries, existing diagram history repository and render/export functions.

## Global Constraints

- Keep Vault history ordering, query fields, retention, index-only removal, artifact deletion boundaries, and export path persistence unchanged.
- Preserve SVG/PNG/PDF render and PPI behavior; UI changes must call existing export functions.
- Every critical control must have a minimum 44px hit area and localized accessible name.
- Default visible choices must remain at or below 7; advanced filters are progressively disclosed.
- Use existing Obsidian primitives and project styles; add no UI framework or runtime dependency.
- Keep English and Simplified-Chinese copy in separate locale sections and update both README/progress references only when behavior changes require it.
- Before real-machine tests, build and deploy `main.js`, `manifest.json`, and `styles.css` to the configured Study Vault, then reload through `Obsidian.com`.
- Finish with production build, full Jest, i18n/render audits, Frontend Law Auditor strict gate, clean worktree, and synchronized `main`.

---

### Task 1: Define Shared History View Contracts

**Files:**
- Create: `src/ui/DiagramHistoryView.ts`
- Modify: `src/ui/DiagramHistoryModal.ts`
- Test: `src/tests/diagramHistoryView.test.ts`
- Modify: `src/tests/diagramHistoryModal.test.ts`

**Interfaces:**
- Consumes the existing `DiagramHistoryEntry` and `DiagramHistoryQuery` types and a store with `loadPage`, `removeEntry`, optional `deleteArtifacts`, and optional `reopenArtifact` callbacks.
- Produces `DiagramHistoryViewOptions` and a `mountDiagramHistoryView(parent, options): DiagramHistoryViewController` operation. The controller exposes `destroy()`, `focusSearch()`, and `refresh()` so hosts own lifecycle and focus.

- [x] **Step 1: Write failing tests for the shared view.**

  Add tests that mount the view in the existing Obsidian mock and assert:

  ```ts
  const controller = mountDiagramHistoryView(root, {
      uiLocale: 'zh-CN',
      store: { loadPage, removeEntry },
      onClose: close
  });
  await controller.refresh();
  expect(root.querySelector('[data-notemd-history-search]')).toBeTruthy();
  expect(root.querySelector('[data-notemd-history-filters-toggle]')).toHaveTextContent('筛选');
  expect(root.querySelectorAll('[data-notemd-history-filter]')).toHaveLength(0);
  ```

  Cover filter disclosure, reset-to-page-one behavior, localized labels, loading/empty/no-results/error states, retry, action callbacks, and `destroy()` removing listeners.

- [x] **Step 2: Run the focused test and verify RED.**

  Run:

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts
  ```

  Expected: failure because the shared view module and host-independent controller do not exist.

- [x] **Step 3: Implement the view with explicit regions.**

  Use a root structure with `data-notemd-history-view`, a header containing search/count/filter toggle, a filter region initially hidden, a list region, and a pager footer. Keep the existing query object and call `loadPage({ ...query })` after every state change. Render records as:

  ```text
  article[data-notemd-history-entry]
    header[data-notemd-history-entry-header] -> title + source
    div[data-notemd-history-entry-meta] -> time + intent + source format
    div[data-notemd-history-entry-artifacts] -> artifact/export state
    div[data-notemd-history-entry-actions] -> reopen/navigation/index/delete
  ```

  Use `setIcon` only for icon-only controls and set both `aria-label` and `title`. Keep destructive deletion confirmation in the existing callback path; the view must not delete Vault files directly.

- [x] **Step 4: Run focused tests and update modal tests.**

  Run:

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryModal.test.ts
  ```

  Expected: PASS, including existing index/artifact ownership tests moved to the shared view contract.

- [x] **Step 5: Commit the shared view.**

  ```text
  rtk git add src/ui/DiagramHistoryView.ts src/ui/DiagramHistoryModal.ts src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryModal.test.ts
  rtk git commit -m "refactor(ui): share adaptive diagram history view"
  ```

### Task 2: Centralize History Store And Direct Hosts

**Files:**
- Modify: `src/main.ts:258-306` and `src/main.ts:onload command registration`
- Modify: `src/ui/DiagramHistoryModal.ts`
- Modify: `src/ui/NotemdSidebarView.ts:onOpen`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/diagramHistoryEntryPoints.test.ts`

**Interfaces:**
- Consumes `mountDiagramHistoryView` from Task 1.
- Produces `public openDiagramHistory(host?: DiagramHistoryHostOptions): void` on `NotemdPlugin`, an always-available command id `notemd-open-diagram-history`, and a sidebar action with no active-file precondition.

- [x] **Step 1: Write failing entry-point tests.**

  Assert the command registration exposes an unconditional callback, the plugin constructs one repository callback set, the sidebar action calls `plugin.openDiagramHistory()`, and the standalone host renders the shared view. Include English and Chinese command/sidebar labels.

- [x] **Step 2: Run tests and verify RED.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryEntryPoints.test.ts
  ```

- [x] **Step 3: Extract repository construction.**

  Add a private `createDiagramHistoryStore()` beside `openDiagramPreviewModal()` returning the existing `loadPage`, `removeEntry`, `recordArtifactPath`, `recordExportPath`, `deleteArtifacts`, and `reopenArtifact` callbacks. Add:

  ```ts
  public openDiagramHistory(hostOptions: DiagramHistoryHostOptions = {}): void {
      new DiagramHistoryModal(this.app, this.createDiagramHistoryStore(), this.settings.uiLocale, hostOptions).open();
  }
  ```

  Make preview use this same factory rather than rebuilding repository callbacks inline. Register `notemd-open-diagram-history` with `callback` and no `checkCallback`.

- [x] **Step 4: Add the sidebar entry.**

  In the sidebar generation section, render a non-processing button using the history icon and localized label. Its callback is `this.plugin.openDiagramHistory()`. It must not be placed in `SIDEBAR_ACTION_DEFINITIONS`, because it is a read-only navigation action rather than an active-file workflow.

- [x] **Step 5: Run entry-point and regression tests.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryEntryPoints.test.ts src/tests/diagramPreviewModal.test.ts src/tests/workflowButtons.test.ts
  ```

- [x] **Step 6: Commit direct entry points.**

  ```text
  rtk git add src/main.ts src/ui/DiagramHistoryModal.ts src/ui/NotemdSidebarView.ts src/i18n/locales/en.ts src/i18n/locales/zh_cn.ts src/tests/diagramHistoryEntryPoints.test.ts
  rtk git commit -m "feat(diagrams): add direct history entry points"
  ```

### Task 3: Rebuild Preview As Canvas-First Surface And Drawer

**Files:**
- Modify: `src/ui/DiagramPreviewModal.ts`
- Create: `src/ui/DiagramHistoryDrawer.ts`
- Modify: `src/main.ts`
- Test: `src/tests/diagramPreviewModal.test.ts`
- Test: `src/tests/diagramHistoryDrawer.test.ts`

**Interfaces:**
- Consumes the shared view controller and centralized store from Tasks 1-2.
- Produces a preview header with one export menu and a drawer host that restores focus to its trigger.

- [x] **Step 1: Write failing preview/drawer tests.**

  Assert that the preview has one `Export` button, no six-button left rail, icon controls have 44px wrappers and accessible labels, SVG/PNG/PDF still invoke the existing functions, the history trigger opens an internal drawer rather than a second Modal, Escape closes the drawer first, and focus returns to the trigger.

- [x] **Step 2: Run tests and verify RED.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts
  ```

- [x] **Step 3: Implement the header and export menu.**

  Replace the rail action column with a header toolbar. Keep the current export functions, but register them under an Obsidian `Menu` anchored to the single export button. Preserve disabled/loading labels and notices. Keep source path and diagnostics adjacent to the canvas.

- [x] **Step 4: Implement the drawer host.**

  Add `DiagramHistoryDrawer` with `open()`, `close()`, `toggle()`, and `destroy()`. Mount the shared view into an `aside`, add an internal backdrop and close button, set `role="dialog"`, `aria-modal="true"`, and a localized label, and restore the trigger focus on close. Use a keydown listener scoped to the drawer; do not call `new Modal()`.

- [x] **Step 5: Run preview/export/drawer tests.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts src/tests/diagramPreview.test.ts src/tests/previewExport.test.ts
  ```

- [x] **Step 6: Commit the canvas-first preview.**

  ```text
  rtk git add src/ui/DiagramPreviewModal.ts src/ui/DiagramHistoryDrawer.ts src/main.ts src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts
  rtk git commit -m "refactor(ui): make diagram preview canvas first"
  ```

### Task 4: Apply Responsive Popup Visual System

**Files:**
- Modify: `styles.css:355-660,2107-2124`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Test: `src/tests/providerSettingsStyles.test.ts`
- Test: `src/tests/diagramPopupAccessibility.test.ts`

**Interfaces:**
- Consumes the DOM classes emitted by Tasks 1-3.
- Produces desktop and narrow-layout CSS contracts with no dependency on viewport-specific JavaScript.

- [x] **Step 1: Write failing CSS/accessibility tests.**

  Assert selectors for preview header, export menu, drawer, drawer backdrop, entry sections, focus-visible states, reduced motion, and narrow full-width behavior. Parse CSS declarations to require `min-height: 44px` on all critical action selectors and a media query that changes drawer width to `100%`.

- [x] **Step 2: Run tests and verify RED.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  ```

- [x] **Step 3: Implement restrained visual tokens.**

  Use existing `--notemd-*` variables, `color-mix`, and Obsidian surfaces. Remove the old preview rail rules, define header/canvas/drawer regions, use a single accent for export and active history state, and add explicit `:focus-visible`. Avoid gradients, new rounded-card nesting, and fixed heights that can clip translated labels.

- [x] **Step 4: Add responsive and reduced-motion rules.**

  ```css
  @media (max-width: 760px) {
      .notemd-diagram-history-drawer { inset: 0; width: 100%; }
      .notemd-diagram-preview-toolbar { flex-wrap: wrap; }
  }
  @media (prefers-reduced-motion: reduce) {
      .notemd-diagram-history-drawer,
      .notemd-diagram-history-backdrop { transition: none; }
  }
  ```

- [x] **Step 5: Run style and i18n audits.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  rtk cmd /c npm run audit:i18n-ui
  ```

- [x] **Step 6: Commit the visual system.**

  ```text
  rtk git add styles.css src/i18n/locales/en.ts src/i18n/locales/zh_cn.ts src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  rtk git commit -m "style(ui): refine diagram popup hierarchy"
  ```

### Task 5: Documentation And Contracts

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Modify: all existing supported root README locale mirrors only where the new command/sidebar entry needs user guidance
- Modify: `docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.md`
- Modify: `docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.zh-CN.md`
- Test: `src/tests/diagramDocsContract.test.ts`
- Test: `src/tests/docsBilingualSupport.test.ts`

**Interfaces:**
- Consumes the finalized command id, labels, and popup behavior from Tasks 2-4.
- Produces concise user-facing guidance: preview first, Export menu, right history drawer, command palette/sidebar direct entry, Vault persistence, and artifact/index deletion distinction.

- [x] **Step 1: Write failing documentation contracts.**

  Require every supported README locale to mention the direct **Open diagram history** command, sidebar entry, right drawer, and export menu without exposing implementation-only details.

- [x] **Step 2: Run RED documentation tests.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramDocsContract.test.ts src/tests/docsBilingualSupport.test.ts
  ```

- [x] **Step 3: Update concise English/Chinese user guidance and progress evidence.**

  Keep technical architecture in the maintainer progress documents; keep README sections task-oriented and avoid syncing unrelated MDX publication files.

- [x] **Step 4: Re-run documentation contracts and commit.**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramDocsContract.test.ts src/tests/docsBilingualSupport.test.ts
  rtk git add README.md README_zh.md docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.md docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.zh-CN.md src/tests/diagramDocsContract.test.ts
  rtk git commit -m "docs(diagrams): explain direct history access"
  ```

### Task 6: Full Verification, Visual Audit, And Main Delivery

**Files:**
- Modify only files required by test/audit failures.
- Evidence: `.cache/popup-frontend-evidence.json`, `.cache/popup-frontend-audit.md` (local ignored evidence only)

- [x] **Step 1: Build and run focused regression suites.**

  ```text
  rtk cmd /c npm run build
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryDrawer.test.ts src/tests/diagramHistoryEntryPoints.test.ts src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryModal.test.ts src/tests/diagramPopupAccessibility.test.ts src/tests/diagramDocsContract.test.ts
  ```

- [x] **Step 2: Deploy before real-machine testing.**

  ```text
  rtk cmd /c powershell -NoProfile -Command "Copy-Item -LiteralPath 'main.js','manifest.json','styles.css' -Destination 'E:\Knowledge\Study\.obsidian\plugins\notemd' -Force"
  rtk "C:\Program Files\Obsidian\Obsidian.com" plugin:reload id=notemd vault=Study
  ```

  Compare SHA-256 hashes before interacting with the Vault.

- [x] **Step 3: Exercise direct entry points and preview drawer.**

  Use official CLI `eval`/DOM inspection to open the sidebar, execute `notemd-open-diagram-history`, open a valid preview, toggle the drawer, expand filters, search, reopen a record, and invoke SVG/PNG/PDF exports. Capture desktop (`1500x855`) and narrow (`<=760px`) screenshots.

- [x] **Step 4: Run strict Frontend Law Auditor.**

  Update the evidence with measured target sizes, visible choice count, drawer reachability, focus return, feedback timing, and completion states. Run:

  ```text
  rtk python C:\Users\jacob\.codex\skills\frontend-law-auditor\scripts\law_audit.py --input .cache/popup-frontend-evidence.json --output .cache/popup-frontend-audit.md --json-out .cache/popup-frontend-audit.json
  rtk python C:\Users\jacob\.codex\skills\frontend-law-auditor\scripts\law_audit.py --input .cache/popup-frontend-evidence.json --strict --fail-threshold 85
  ```

  Expected: zero fast-gate failures, score >=85, and no unresolved P0/P1 unknowns.

- [x] **Step 5: Run full gates and error inspection.**

  ```text
  rtk cmd /c npm test -- --runInBand
  rtk cmd /c npm run audit:i18n-ui
  rtk cmd /c npm run audit:render-host
  rtk git diff --check
  rtk "C:\Program Files\Obsidian\Obsidian.com" dev:errors vault=Study
  rtk "C:\Program Files\Obsidian\Obsidian.com" dev:console level=error limit=50 vault=Study
  ```

  Expected: all tests/build/audits pass, no visible error modal/notice, no captured plugin errors, and no error-level console messages.

- [x] **Step 6: Clean temporary state and deliver main.**

  Remove temporary Vault notes/history/export files, confirm `favoriteSettingIds` and unrelated settings are unchanged, inspect the complete diff, commit verification fixes, push `main`, fetch `origin/main`, and verify `HEAD == origin/main` with a clean worktree.
