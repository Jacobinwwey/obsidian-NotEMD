# Diagram Preview And Adaptive Vault History Design

Language: **English** | [简体中文](./2026-07-19-diagram-popup-adaptive-history-design.zh-CN.md)

## Goal

Make diagram inspection and export the shortest reliable path, while making Vault history reachable without first opening a preview. The preview and history experiences must share one history view and one set of actions, but adapt their host surface: a right drawer inside preview and a standalone management window from the command palette or sidebar.

## Current Friction

- The preview modal uses a tall left rail with six full-width text buttons, making secondary actions compete with the rendered diagram.
- SVG, PNG, and PDF exports appear as three equal-level controls instead of one clear export task.
- The history manager is reachable only through the preview's **Manage Vault history** button; there is no always-available command or sidebar entry.
- Opening history creates a second modal above preview. The live 1500x855 measurement showed 30px critical controls, 10 visible preview actions, and 13 history controls.
- The history toolbar exposes every filter immediately, while records mix title, metadata, file paths, export state, and actions without stable visual grouping.

## Selected Architecture

`DiagramHistoryView` becomes a host-independent view component. It owns query state, loading, retry, empty/no-result states, progressive filters, record rendering, pagination, and action callbacks. It must not construct or close a Modal itself.

`DiagramHistoryModal` becomes a thin standalone host for command-palette and sidebar entry points. `DiagramPreviewModal` renders the same view inside a right-side drawer within the existing preview modal. The drawer is not a nested Modal: it has an internal backdrop, focus entry/return, Escape handling, and responsive full-width behavior below the narrow-layout breakpoint.

`main.ts` owns creation of the Vault history repository and its complete callback set. A public `openDiagramHistory()` operation is used by the command palette, sidebar, and preview drawer host. This keeps persistence, artifact deletion, reopen behavior, and error policy in one owner.

## Preview Layout

The preview modal changes from a two-column rail/stage layout to a canvas-first surface:

1. Header: diagram target, source path, compact icon actions, one primary **Export** menu, and the native close affordance.
2. Main stage: the SVG/iframe/source preview occupies the available width and remains the only dominant visual focus.
3. Optional diagnostic region: warnings and errors stay close to the stage, but do not displace the header actions.
4. History drawer: a fixed-width right drawer overlays the stage without shrinking the rendered artifact. On narrow windows it becomes a full-width internal panel.

Copy source, save source, and open history use 44px hit areas with localized accessible labels and tooltips. Export opens the native Obsidian menu with SVG, PNG, and PDF entries. The existing export functions and PPI setting remain unchanged.

## History View

The default history surface shows search, total count, newest-first hint, and records. A single **Filters** control progressively reveals intent, source format, export format, and completion-date controls. Each record has stable sections for title/source, completion metadata, artifact/export state, primary reopen action, navigation actions, non-destructive index removal, and separately confirmed artifact deletion.

The view provides stable loading skeleton space, a Vault-specific empty state, a no-results reset action, and an inline retry state. Reopen success closes the host and opens preview; reopen failure stays in the record and does not steal focus. Index removal never deletes files. Artifact deletion never includes the source note and removes the index only after every requested artifact deletion succeeds.

## Direct Entry Points

- Register an always-available command named **Open diagram history**.
- Add a matching text-plus-history-icon action in the sidebar diagram section. It remains available without an active source file and can show the current Vault record count when readable.
- Both entry points open the standalone host using the same `DiagramHistoryView` and repository callbacks.
- The preview history action opens the internal drawer and returns focus to its trigger when closed.

## Accessibility And Responsive Rules

- Every critical button, select, search input, drawer close control, and pager control has at least a 44px hit area.
- The drawer traps focus while open, labels itself, and restores focus to the trigger.
- Primary/secondary/danger actions use consistent role tokens; danger actions are visually separated and never share the primary style.
- Default visible choices stay at or below seven; advanced filters are hidden until requested.
- Long titles and paths use bounded two-line truncation with a title/tooltip for the full value.
- At narrow widths the drawer becomes full width, filters stack, and actions remain reachable without horizontal scrolling.
- Respect reduced-motion preferences; drawer transitions use transform/opacity only.

## Verification Plan

- Add unit/UI contracts for shared view rendering, filter disclosure, drawer open/close and focus return, command/sidebar entry wiring, responsive class selection, export menu actions, loading/empty/error states, and destructive-action boundaries.
- Run the existing diagram preview/history, i18n, settings-style, and command registration suites plus the full Jest suite and production build.
- Run the Frontend Law Auditor with real DOM measurements at desktop and narrow widths. Acceptance targets: zero fast-gate failures, score at least 85, critical targets >=44px, default visible choices <=7, one visual focal point, and no unknown P0/P1 evidence.
- Deploy the built plugin to the configured Study Vault before real tests, reload through `Obsidian.com`, inspect both direct entry points and preview drawer, and verify visible error surfaces, `dev:errors`, and error-level `dev:console` are empty.
- Remove all temporary Vault records/files after acceptance and verify the source/deployed bundle hashes and clean Git worktree.

## Out Of Scope

This change does not alter history schema, renderer output, export encoding, provider behavior, README localization, or long-term diagram engine roadmap items. It does not convert the history into a persistent Obsidian workspace leaf.

## Implementation Status — 2026-07-19

All planned phases are complete for the shipped modal-based architecture. The always-available command and sidebar history entry already route to the shared repository-backed `DiagramHistoryView`. The implementation now also aligns the history toolbar class with its accessibility/responsive stylesheet, adds semantic search/list/status regions, exposes full long titles and paths through native tooltips, gives preview/history controls 44px targets and visible keyboard focus, and strengthens preview heading hierarchy without changing renderer or export behavior.

The preview retains its direct Vault-history button and in-session preview history. A nested history modal remains the current host because replacing it with a focus-trapped internal drawer would be a separate interaction-system change; the delivered structure instead prevents control crowding, preserves all existing callbacks, and keeps the rendered diagram as the dominant surface.
