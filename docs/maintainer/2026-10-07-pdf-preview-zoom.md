# PDF preview zoom: cause, repair and evidence

[简体中文](./2026-10-07-pdf-preview-zoom.zh-CN.md)

## Cause

The binary preview rendered each PDF page once, at most 1.5 pixels per PDF unit and within a document-wide base raster budget. The shared viewport then scaled that canvas with CSS up to 8×. Vectors in the original PDF were therefore displayed as enlarged low-resolution pixels. This was a preview defect, not a change in exported PDF page size.

Several local architecture PDFs exist. The third page of `slidev-acceptance-20261006-final/architecture.zh-CN.pdf` contains the Mermaid architecture diagram: 36 pages, page dimensions 735.12 × 414, 289 `constructPath` operations, 80 text items, no bitmap paint operations. The similarly named fork-fixed acceptance PDF has a title-only third page and was not used as proof of diagram sharpness. The currently open Drawnix PDF is a separate single-page file.

## Implementation

`DiagramPreviewViewport` publishes zoom, device pixel ratio and the visible source rectangle after anchored scroll offsets have settled. It clips against the viewport, window and scroll ancestors, and reports visibility/outer-scroll changes even when navigation is locked.

`PdfPreviewDetailRenderer` owns one active PDF render per document. It renders the visible region with a 64 CSS-pixel margin, cancels stale tasks, checks revisions before displaying a result, and reuses a tile for small pans. Page and text-layer coordinates remain stable. Detail canvases do not intercept pointer events and remain below the original text-layer DOM.

Base canvases retain approximately 32 million pixels per document. Detail canvases have an 8-million-pixel/8192-pixel-side limit and a shared 24-million-pixel budget including in-flight replacements. Base canvases also obey the side limit: an area budget alone cannot protect against a synthetic 1,000,000 × 100 page. This synthetic case is a compatibility test, not the user's PDF. Close cancels work and releases canvases and PDF resources. Original files and exported page geometry are unchanged.

## Evidence

- New tests first failed for absent adaptive rendering. Relevant implementation suites passed, and the added narrow-page regression first reproduced a 200,000-pixel-wide canvas before the limit was applied.
- Native Obsidian CLI: 36 independent pages; third-page zoom 8×, simulated DPR 1 and 2; respective tile densities 8 and 16; 807,975 and 3,231,900 pixels; only one detail canvas present in the measured viewport.
- Independent PDF.js reference comparison: DPR 2 mean absolute channel difference 0.00587 on a 0–255 scale, explained by serialized CSS fractional-coordinate rounding. Acceptance tolerance is 0.05. Old magnified base comparison: 3.43954. Saved canvas images visibly distinguish sharp labels and paths from the blurred base image.
- Rapid pan replaced the tile; the text-layer identity remained stable. Alt prevented zoom/scroll while DOM Range selection worked. Scrolling away released the tile. Closing zeroed all tracked canvases. Source SHA-256 and settings were unchanged.
- CLI ran in a background vault and temporarily simulated visible geometry/DPR; both properties were restored. This is native PDF.js canvas evidence, not a desktop screenshot or proof of physical pointer selection.
- Receipts: `.cache/pdf-source-inventory.json`, `.cache/pdf-zoom-native.json`, `.cache/pdf-zoom-native-page3-sharp.png`, `.cache/pdf-zoom-native-page3-old-magnified.png`. The standalone Drawnix PDF and PNG also passed the binary preview/Alt checks.
- The first full integration run passed 315 suites and found one documentation pairing failure. The missing separate Chinese multi-format document was added; its focused documentation suite passed. Final release checks are recorded separately when complete.

## Limits

The preview can redraw PDF vectors sharply at the requested density, subject to its canvas budget. It cannot recover detail absent from embedded bitmap sources. Extremely large displays may require reduced sampling. No OCR is added. Preview zoom and exported PNG PPI remain independent.

## Release candidate checks

Fresh plugin build, UI-string audit, render-host audit, diff hygiene and the lint ratchet passed (20 changed TypeScript files, zero regressions). All 34 website locales built; the website content audit passed after its obsolete single-format menu checks were updated to the checkbox workflow. Navigation/accessibility audit: 96 pages, zero failures. Translation route, heading and source-hash tests passed.

The final local full run executed 316 suites: 313 passed and three encountered process/browser timeouts under concurrent build load (3065 tests passed, 12 failed, one skipped). After the website build finished, the failed publisher case passed in 12.7 seconds; both affected browser files passed all 23 tests in 18.9 seconds. No timeout thresholds or product code were changed to obtain those retries. This is a full run plus successful isolated retries, not a single uninterrupted green full run. Remote Linux/Windows checks remain the integration gate.
