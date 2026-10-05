# Drawnix export recovery acceptance

## Scope and recovery state

Continue the failed `architecture.zh-CN_drawnix-9` run on `codex/drawnix-layout-pdf-task-logs`, based on `55a3560b70a8`. The preceding 1.9.10 release was already complete and was not republished. Original source and generated artifacts were preserved; the frozen specification supplied all 179 nodes and 24 relationships without another LLM request.

## Root causes and changes

- **Placement:** sibling order came directly from the source and ignored relationship distance. `drawnixMindMapProjection.ts` now evaluates deterministic sibling/root swaps against physical Manhattan distance, including subtree dimensions and forest rows. Parentage, labels and relationships stay intact. The 10,000-candidate budget bounds computation, not content.
- **Routing:** compact paths treated every earlier connector as an impassable wall, while reserved paths ignored congestion. `drawnixRelationRouter.ts` now distinguishes costly parallel overlap from ordinary crossings, offers separate endpoint ports, and reuses ingress calculations. Existing obstacle and label checks remain authoritative.
- **PDF CSS:** svg2pdf splits selector lists without tracking functional parentheses. Valid scoped `:is(...)` rules consequently became invalid `insertRule` calls. `pdfSvgStyles.ts` resolves sanitized declarations in an isolated browser document, using the browser cascade instead of another selector parser. Declaration tokens retain `currentColor`, relative units and inheritance in reusable definitions. Temporary documents are disposed in `finally`; the SVG security boundary is unchanged.
- **PDF geometry:** SVGs without a viewBox could be clipped during CSS-pixel-to-point conversion. Oversized page sides could also be clamped independently by jsPDF. `pdfPreview.ts` supplies the missing source coordinate system and proportionally fits pages to the 14,400-point limit while retaining vectors.
- **Logs:** reporter acquisition, progress resets and sidebar rebuilding cleared transcripts. `main.ts`, `NotemdSidebarView.ts` and `ProgressModal.ts` now retain session/task logs through these transitions, including logging while the sidebar is unmounted. **Clear log** explicitly clears the sidebar transcript. This is session retention, not a new persistent log database.

## Real-file measurements

Measurements cover the 24 explicit cross-relationships; they do not count hierarchy branches as semantic cross-links.

| Measure | Before | After |
| --- | ---: | ---: |
| Nodes / relationships | 179 / 24 | 179 / 24 |
| Endpoint Manhattan distance | 74,338 | 29,963 |
| Connector length | 152,805 | 40,582.5 |
| Pairwise collinear overlap length | 12,163.5 | 32 |
| Perpendicular intersections | 141 | 20 |
| Compact local routes | 10 | 19 |

This is a deterministic bounded optimization, not a claim of a globally optimal or crossing-free graph. The independent 383-node/35-edge stress projection completed in approximately 1.2 seconds on this machine; timings are observations, not universal thresholds.

## Verification

- Production build passed.
- Full Jest: **306 suites passed; 2,968 tests passed, 1 skipped**.
- `lint:regressions -- --base-ref origin/main`: **0 regressions**.
- `audit:i18n-ui`, `audit:render-host` and `git diff --check` passed.
- PDF regressions cover nested SVG, functional/comma selectors, specificity, `!important`, inline overrides, inherited colors in `<use>`, gradients, clipping, Chinese text, absence of external requests, missing viewBoxes and oversized page dimensions.
- Drawnix tests cover dense trees, complete relationships, native/SVG geometry agreement, node/label avoidance and separated ports. Sidebar chaining/default workflows remain covered by the full suite.

Official Obsidian CLI ran against **1.13.7 (installer 1.12.7)**, reloaded the built plugin in `1Knowledge`, and used the installed plugin's export host. The separate `obsidian-cli` executable is not installed. No computer-use or desktop/browser UI automation was used; headless rendering tests and native APIs were invoked through CLI.

Native outputs were saved under:

`E:/1Knowledge/NoteMD-verification-20261005-1791171318495/`

Drawnix, HTML, SVG, 300 PPI PNG, a verified 101 PPI PNG companion and PDF all completed. The unchanged original SVG also exported successfully to PDF under `original-svg-recovery/`. Obsidian's PDF runtime decoded all **179 node labels** with no omissions and rendered the complete single-page PDF (216,049 bytes; 4088.25 × 8203.5 points). Preview retained the preceding task transcript in storage and in the visible log panel. Source/artifact hash checks passed. Provider/export preferences were unchanged; preview/export history entries were added as expected.

Installed and built `main.js` SHA-256:

`0b485e83840d650a00fb5a3e3762ae94eecf0375360ad98fd823d6234deba312`

The evidence above predates the final 1.9.11 release build. The user subsequently authorized publication and requested less dense diagnostics. Preview diagnostics now use native, initially closed disclosures grouped by tag, retaining complete messages, advice and severity counts. The focused regression ran red before the change, then passed all 42 tests across the preview and diagnostic suites.

Version metadata, README manuals and the website are being updated for 1.9.11. All changed prose is authored directly in each language without translation APIs or LM Studio. Release verification and publication are tracked separately in [1.9.11 acceptance](./release-1.9.11-acceptance.md); the public 1.9.10 assets remain unchanged.
