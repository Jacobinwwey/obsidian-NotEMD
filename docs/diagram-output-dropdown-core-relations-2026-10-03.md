# Diagram output dropdown and core relationships

## English

### Scope and implementation plan

Continue the unreleased work after `c021976`; do not regenerate the completed presentation/export demonstration or change release 1.9.8. Keep diagram generation and presentation export settings, libraries and execution independent.

1. Replace the flat diagram output checklist with one compact multi-select dropdown in Settings and Workbench. Retain supported-first ordering, inactive requests, latest-choice coordination and the production-rendered type preview.
2. Select a readable Drawnix overview at the renderer boundary. Preserve the full semantic tree and retain omitted relationships, without inventing labels for legacy arrows.
3. Verify through the official Obsidian CLI in the open `1Knowledge` vault, including settings popouts. Back up existing artifacts, restore test preferences, run the complete verification suite and update remote main without a release/tag.

### Implementation and trade-offs

- `diagramOutputSelector` owns the trigger, checkbox groups, document-local portal, Obsidian keyboard scope and lifecycle cleanup. Native checkboxes preserve multi-selection semantics; arrow keys, Home/End, Escape and Tab remain usable. The menu shows a compact selection summary and short inactive status, with extended explanations in tooltips.
- Existing preference resolution and serialized persistence remain the source of compatibility decisions. The dropdown does not merge presentation formats into diagram generation. Diagram HTML is the SVG presentation; structured-summary HTML represents text/structure/evidence. Neither name promises a browser diagram editor.
- Settings may move to a separate document. Escape must be intercepted through Obsidian's scope before host modal handling. A cached thumbnail may resolve before its popout has layout; a disposable `ResizeObserver` delays geometry validation until the SVG is visible. The geometry gate remains enforced.
- `selectDrawnixCoreRelations` keeps at most six explicit directed predicates, at most three touching one node. Blank/generic, duplicate/parallel, hierarchy and excess edges remain in `metadata.notemd.omittedRelations` with reasons. Model ordering supplies importance; this is a reading budget, not a node/semantic capacity limit.
- The router reserves a nearby label and short orthogonal route together when obstacles allow. It avoids earlier local routes and their labels; exterior reserved lanes remain available for dense layouts. SVG and native arrows share the same polyline and label position. This reduces detours, but does not claim zero crossings for every graph or automatic attachment after native Drawnix reflow.
- Generation prompts require an explicit source-to-target predicate, evidence-supported direction and historical uncertainty. Structural validation cannot prove semantic truth. The reviewed sample omitted an unsupported hydrogen-fusion-to-supernova inference and corrected the DNA/RNA direction; no modern scientific claim was substituted for the historical source.

### Walkthrough and evidence

The specified Chinese artifact keeps all 24 original nodes and their hierarchy. Its 10 unlabeled arrows become five core labeled relationships; the original ten records remain in metadata and the original native/SVG files are backed up. The five paths contain 4, 8, 6, 4 and 4 points, versus up to 18 before. Its companion SVG was updated through `app.vault.modify`; source Markdown was not edited. The earlier English map and presentation exports were not regenerated.

Local evidence is under `.cache/diagram-dropdown-20261002/` (ignored, not release content): `host-ui.json`, `sidebar-ui.json`, `map-installation.json`, `original-map-backup/`, `runtime-backup/`, `reviewed-map.png`, `sidebar-live.png`, `settings-dark-live.png`, and the test/audit logs. Runtime backups can contain user configuration and must not be published.

- Official CLI verification: `1Knowledge`, plugin idle, installed bundle equality and unchanged settings on reload; multi-select persistence, Escape focus restoration, portal cleanup and preference restoration.
- Host measurements: 44 CSS-pixel trigger/row targets; seven visible menu options with internal scrolling; menu-open synchronous acknowledgment p95 5.8 ms over 25 observations. This timing excludes disk persistence and is not a cross-device performance guarantee.
- Real-browser regression: 320 × 480 viewport bounds, native Tab exit, keyboard scope lifetime, focus during reordering, latest settings-object ownership and serialized save recovery. Hidden-popout preview regression verifies delayed measurement rather than bypassing safety.
- Geometry regressions cover local routes, native/SVG label equality and dense trees up to 383 nodes. The CLI benchmark retains 137 nodes and all 32 semantic relationships: six visible, 26 in metadata.

### Frontend law audit

**Fast gate failures:** none among measured checks. The audit reports 68.42/100, zero failed principles and twelve unknown principles; this is partial evidence, not strict-gate certification.

**Law diagnosis:** the flat checklist increased concurrent choice load (Hick); disclosure and supported-first groups reduce it. Closing the entire settings window on Escape violated familiar menu behavior (Jakob); host keyboard scope ownership fixes it. Premature invisible-SVG measurement produced a false failure instead of a stable preview (Peak-End); visibility-driven validation fixes it.

**Priority fixes:** P1 host Escape and invisible-popout preview defects are fixed. P2 maintain 44px targets, a maximum of seven simultaneously visible options and no popup clipping at 320px width. There are no remaining observed failures. Reachability/task-end placement, grouping ratios, broader focal hierarchy, multi-step progress, motion, parsing and heuristic simplicity metrics remain unmeasured or outside this single-control flow; do not fill them with template defaults.

**Recheck:** rerun keyboard/persistence/preview and route tests; inspect light/dark host screenshots; rerun `law_audit.py` with measured evidence. Do not convert unknowns to passes merely to raise the score.

### Verification and rollout

Commands: `npm run build`; `npm test -- --runInBand`; `npm run lint:regressions -- --base-ref origin/main`; `npm run audit:i18n-ui`; `npm run audit:render-host`; `git diff --check`. Shell commands use RTK; Windows npm uses `rtk proxy npm.cmd`.

Final local verification: build passed; all 296 test suites passed (2,829 passed, one existing skipped test); lint ratchet reported zero regressions; UI-string/render-host audits and diff hygiene passed. The benchmark now verifies semantic retention separately from visible density. The existing history-browser teardown timeout did not recur in its focused rerun or the final complete run. Documentation uses paired language files as required by the repository. Integration targets remote main and verifies the exact pushed commit's Windows/Linux CI; no package/version/tag/release mutation.
