# Slidev Editable PPTX Progress And Next Direction, 2026-06-21

## Problem Statement

The requested feature is not "export a `.pptx` file". A PPTX containing one screenshot per slide is easy, but it does not satisfy the editable-PPTX requirement. The useful target is an export path where PowerPoint users can edit slide text directly while still preserving the rendered Slidev visual result.

## Reference Project Comparison

`huashu-design` is strong when the source HTML is authored specifically for PPTX conversion. Its constraints are reasonable for that domain: text should be wrapped in paragraph/headline tags, visual containers should own backgrounds and borders, gradients/background images are constrained, and the canvas should match `LAYOUT_WIDE`. That model is not a good direct fit for generated Slidev HTML, because Slidev is a routed Vue SPA with transforms, Mermaid SVG, canvas/SVG/icons, generated CSS, and runtime state.

`oh-my-ppt` is the better architectural reference for NoteMD because it observes rendered browser state and extracts text, images, tables, formulas, paint order, and fallback imagery before writing OOXML. The key idea worth adopting is not Electron itself, but the pipeline shape:

1. render the HTML in a real browser;
2. extract editable primitives where confidence is high;
3. rasterize complex primitives where Office-native reconstruction is fragile;
4. write an OOXML package;
5. report warnings and editability coverage.

The refreshed local reference checkout `ref/oh-my-ppt-upstream-fresh-20260621` points at `origin/main` commit `843ff74`, tagged `v2.0.17`. The useful lessons for this slice are table-first extraction, marking consumed primitives before background capture, native DrawingML table output, and residue-aware background capture. NoteMD ports that shape clean-room with Playwright and a small PresentationML writer instead of copying Apache-2.0 source or bringing Electron assumptions into an Obsidian plugin.

## Landed Implementation

Current implementation adds:

1. `pptx` to the export format type, UI selector, settings dropdown, environment capability matrix, and maintainer verifier.
2. `src/slideExport/pptxDomExtractor.ts` to select the current visible Slidev page and extract text boxes from computed DOM geometry.
3. `src/slideExport/pptxExporter.ts` to consume the converged HTML export, iterate `#/1..n`, capture a visual fallback layer, and write a sidecar report.
4. `src/slideExport/pptxWriter.ts` to write a clean-room PresentationML zip using `fflate`.
5. `scripts/verify-slidev-export-workflow.cjs --format pptx` to inspect the resulting PPTX as a zip and prove editable text nodes exist.
6. `src/tests/pptxWriter.test.ts` plus existing UI/environment tests updated for PPTX.
7. `scripts/lib/pptx-visual-diff.js` to render PPTX back through LibreOffice/PDF/PNG and compare every page against Slidev PNG output.
8. table-first DOM extraction and a native DrawingML `<a:tbl>` structural layer. That table layer is transparent by default; visible table paint still comes from DOM-derived text/fallback until Office table layout can match Slidev CSS reliably.
9. `tableCount` in PPTX inspection plus `tableCount` and `editableTableCellCount` in the sidecar report.

The implementation deliberately places PPTX export after `convergeSlidevDeckLayout()`. This avoids creating a new un-audited path and keeps PPTX tied to the same rendered fit fixes as HTML/PDF/PNG/MP4.

## Real Acceptance

Real command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

Result:

1. `ok = true`
2. `slideCount = 27`
3. `pptxInspection.textRunCount = 331`
4. `pptxInspection.pictureCount = 27`
5. `pptxInspection.tableCount = 4`
6. `pptxInspection.slidesWithoutEditableText = []`
7. sidecar `textBoxCount = 223`
8. sidecar `tableCount = 4`
9. sidecar `editableTableCellCount = 95`
10. sidecar `editableTextSlideCount = 27`
11. sidecar `imageFallbackCount = 27`

Archive:

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

## Visual Diff Acceptance

The stricter page-by-page command is:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-table-structural-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json'
```

Current measured result:

1. `ok = true`, because export, inspection, and visual-diff artifact generation succeeded.
2. `pptxVisualDiff.gate.passed = false`, because visual fidelity is still below the default closure threshold.
3. baseline before table work: `meanRmse = 0.15322961111111114`, `maxRmse = 0.260447`.
4. visible native table attempt: `meanRmse = 0.15640467407407407`, worse than baseline.
5. hybrid visible native-table text attempt: `meanRmse = 0.15657594444444442`, also worse.
6. current transparent structural table layer: `meanRmse = 0.15259227777777779`, `maxRmse = 0.260447`.

The table-first direction is useful, but the visible DrawingML table should not replace Slidev CSS yet. Office table defaults for grid, padding, line height, and font metrics currently regress the real deck on table slides.

## Release Link Decision

The environment-check UI must continue pointing users at an npm-installable GitHub release asset:

```text
https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz
```

A GitHub branch, tree, or blob URL is the wrong install surface. It is not a stable package boundary, can drift, and can fail under `npm install`. Current live verification found the release tag and asset in `Jacobinwwey/slidev`, and `npm pack <release-asset-url> --dry-run` resolved it as `@slidev/cli@52.16.0`.

New Slidev fork work should only update NoteMD's install URL after a new fork release is actually cut and smoke-tested as an npm package. A branch containing PR work is a staging surface, not a user installation surface.

## Current Limits

The first implementation is intentionally conservative:

1. Text is editable.
2. Whole-slide visual fallback preserves complex visuals.
3. Mermaid/SVG/canvas are not converted into Office-native editable vector objects.
4. Tables now have a native DrawingML structural layer with editable cell text, row/column dimensions, and merge metadata, but that layer is transparent by default and is not the visible rendering source.
5. Code blocks are extracted as text when visible DOM text is selected, but syntax-highlighted run fidelity is not yet modeled.
6. Animations and click steps are not represented as PowerPoint animations.
7. The visual-diff gate still does not pass; editable text plus fallback images are not enough to claim final visual fidelity.

Those are not regressions; they are explicit boundaries. Overstating editability would be worse than shipping an honest report-driven first slice.

## Next Direction

The next level should be incremental and report-driven:

1. keep visual diff in every real PPTX acceptance run;
2. keep the table structural layer, but do not make it visible until CSS padding, border collapse, line height, cell baseline, font fallback, and Office round-trip rendering are modeled tightly enough to beat the fallback visual layer;
3. upgrade text extraction from block-level text frames to richer runs with CJK font fallback, paragraph spacing, list indentation, code monospace, and inline emphasis;
4. add residue detection/retry before accepting background screenshots;
5. add shape extraction for high-confidence solid-color rectangles/lines only;
6. keep Mermaid source untouched and continue using image fallback unless a separate explicit user option requests experimental vector reconstruction.

Avoid adding a second HTML-to-PPTX route that bypasses rendered convergence. That would create a separate quality gate and make PPTX results drift from the HTML export path that users already rely on.
