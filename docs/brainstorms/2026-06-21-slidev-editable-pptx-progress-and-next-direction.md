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

After the 2026-06-21 refresh, `/home/jacob/ref/oh-my-ppt-upstream-latest` points at `origin/main` commit `843ff74`, tagged `v2.0.17`. The local fork at `/home/jacob/ref/oh-my-ppt-fork` is on `pr/animation-export-contract` commit `257c23b`; the relevant fork delta is concentrated in the animation export contract, so the HTML-to-PPTX route should be read from upstream `renderer.ts`, `browser-scripts.ts`, `index.ts`, `table-extract.ts`, `font-collect.ts`, and `ooxml-writer.ts`.

The useful lessons are more specific than "convert screenshots to PPTX":

1. `table-extract.ts` extracts real `<table>` geometry first, including row/column sizes, rowspan/colspan, borders, padding, and vertical alignment, then marks consumed table elements so later text extraction does not duplicate their contents.
2. `index.ts` treats browser computed style as the source of truth for text runs, shapes, images, tables, and paint order.
3. `renderer.ts` hides extracted primitives before background capture and uses pixel sampling to detect residual text, retrying when the screenshot still contains text that would double-render under visible native PPTX text.
4. `ooxml-writer.ts` writes native DrawingML tables, multi-run text, autofit metadata, overlay images, embedded fonts, and animation trace targets.
5. `font-collect.ts` treats fonts as part of the export contract instead of assuming Office will match Chromium font metrics.

The critical boundary is that the `oh-my-ppt` residue check serves a visible-native-text strategy. NoteMD's current contract is different: the frozen background image is the visible layer, while editable text/table structures are transparent. Directly porting hide-before-background behavior would remove the visible text from the current PPTX and make the visual result worse. Residue detection becomes a hard gate only when NoteMD experiments with visible native text or visible native tables.

The clean-room adoption path is therefore:

1. keep rendered convergence as the shared HTML/PPTX source of truth;
2. extract high-confidence table/text structures first and mark consumed primitives;
3. report actual object coverage in the sidecar instead of presenting fallback imagery as editable;
4. when a native layer moves from transparent to visible, add a same-frozen-background visual A/B gate first;
5. only enable that visible native layer page by page if the A/B gate shows no regression in RMSE, text overlap, font metrics, or table borders.

NoteMD ports that shape clean-room with Playwright and a small PresentationML writer instead of copying Apache-2.0 source or bringing Electron assumptions into an Obsidian plugin.

## Landed Implementation

Current implementation adds:

1. `pptx` to the export format type, UI selector, settings dropdown, environment capability matrix, and maintainer verifier.
2. `src/slideExport/pptxDomExtractor.ts` to select the current visible Slidev page and extract text boxes from computed DOM geometry.
3. `src/slideExport/pptxExporter.ts` to consume the converged HTML export, iterate `#/1..n`, capture a visual fallback layer, and write a sidecar report.
4. `src/slideExport/pptxWriter.ts` to write a clean-room PresentationML zip using `fflate`.
5. `scripts/verify-slidev-export-workflow.cjs --format pptx` to inspect the resulting PPTX as a zip and prove editable text nodes exist.
6. `src/tests/pptxWriter.test.ts` plus existing UI/environment tests updated for PPTX.
7. `scripts/lib/pptx-visual-diff.js` to render PPTX back through LibreOffice/PDF/PNG and compare every page against the frozen background image embedded in the PPTX.
8. table-first DOM extraction and a native DrawingML `<a:tbl>` structural layer. That table layer is transparent by default; visible table paint still comes from the frozen visual layer until Office table layout can match Slidev CSS reliably.
9. `tableCount` in PPTX inspection plus `tableCount` and `editableTableCellCount` in the sidecar report.
10. high-resolution 1960x1104 PPTX capture with font readiness, animation/transition freeze, and double-RAF stabilization before screenshot capture.
11. transparent editable text/table layers, so Office font metrics do not compete with the Chromium-rendered visible layer.
12. M1 editability reporting: `consumedTableCount`, `consumedTableTextCandidateCount`, `editablePrimitiveCoverage`, `fallbackOnlyElementKinds`, `unmodeledTextRunReasons`, and per-slide editability summaries.
13. visual-diff diagnostics for original rendered dimensions, width/height scale ratio drift, difference bounding-box geometry, and worst bounding-box slides. These are currently diagnostic unless explicit thresholds are supplied.
14. M2 rich-run transparent text structures: DOM text boxes now preserve inline run boundaries, computed font size/family/color, bold/italic/underline, inline code/link markers, multi-paragraph text, and `xml:space="preserve"` for Office-safe leading/trailing spaces. The sidecar report now exposes `richTextBoxCount`, `richTextRunCount`, and rich-run character coverage.
15. M3 external-reference advisory diagnostics: the verifier now accepts `--pptx-visual-reference-dir`, records optional ImageMagick `PHASH`/`NCC`/`SSIM` availability, adds per-page visual diagnostics, and summarizes likely renderer/subpixel noise separately from layout-review candidates.
16. M5 font-contract reporting: the PPTX sidecar now records `fontContract`, including extracted font families, CJK-bearing families, Latin-bearing families, the writer's East Asian fallback face, source families that will be written through that fallback, Office missing-font risk, per-family usage counts, and the explicit current policy that fonts are not embedded by default.
17. M4 visible-native experiment mode: `--pptx-visible-native-experiment` now writes a separate `.visible-native-experiment.pptx`, captures its background after extracted DOM text/table content is hidden, samples residual text/table regions, retries background capture up to three times when residue remains suspicious, and compares the experiment render-back against the default PPTX frozen-background reference. This is explicitly not the default export path.

The implementation deliberately places PPTX export after `convergeSlidevDeckLayout()`. This avoids creating a new un-audited path and keeps PPTX tied to the same rendered fit fixes as HTML/PDF/PNG/MP4.

## Real Acceptance

Real command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

Result:

1. `ok = true`
2. `slideCount = 30`
3. `pptxInspection.textRunCount = 254`
4. `pptxInspection.pictureCount = 30`
5. `pptxInspection.tableCount = 6`
6. `pptxInspection.slidesWithoutEditableText = []`
7. sidecar `textBoxCount = 139`
8. sidecar `tableCount = 6`
9. sidecar `editableTableCellCount = 102`
10. sidecar `editableTextSlideCount = 30`
11. sidecar `imageFallbackCount = 30`
12. sidecar `consumedTableCount = 6`
13. sidecar `consumedTableTextCandidateCount = 129`
14. sidecar `editablePrimitiveCoverage.editableTextSlideRatio = 1`
15. sidecar `editablePrimitiveCoverage.editableTableSlideRatio = 0.2`
16. sidecar `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`
17. sidecar `unmodeledTextRunReasons = ["inline-code", "inline-formatting", "syntax-highlight"]`

Archive:

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

## Visual Diff Acceptance

The initial page-by-page command compared PPTX render-back output against a separately generated Slidev PNG export:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-table-structural-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json'
```

That produced useful failure evidence, but it was not a stable hard-gate reference. The PPTX background images and LibreOffice render-back PNGs were identical across the passing report-mode run and the failing strict run; only the separately generated Slidev PNG reference drifted. In other words, the gate was comparing one frozen PPTX against a different rendering instance.

Historical metrics from the old gate are still useful:

1. baseline before table work: `meanRmse = 0.15322961111111114`, `maxRmse = 0.260447`.
2. visible native table attempt: `meanRmse = 0.15640467407407407`, worse than baseline.
3. hybrid visible native-table text attempt: `meanRmse = 0.15657594444444442`, also worse.
4. transparent structural table layer under the old reference: `meanRmse = 0.15259227777777779`, `maxRmse = 0.260447`.

The corrected strict command is:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-frozen-reference-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

Corrected result:

1. `ok = true`
2. `pptxVisualGate.required = true`
3. `pptxVisualGate.passed = true`
4. `pptxVisualDiff.reference.source = pptx-background-images`
5. `pageCount = 27`
6. `comparablePageCount = 27`
7. `meanRmse = 0.049441916296296295`
8. `maxRmse = 0.0889364`
9. `pptxInspection.textRunCount = 331`
10. `pptxInspection.pictureCount = 27`
11. `pptxInspection.tableCount = 4`
12. `pptxInspection.slidesWithoutEditableText = []`

The table-first direction is useful, but the visible DrawingML table should not replace Slidev CSS yet. Office table defaults for grid, padding, line height, and font metrics regress the real deck when native tables are made visible. The hard PPTX visual gate now checks Office preservation of the frozen visual layer; object-level native reconstruction remains a separate, more expensive problem.

The 2026-06-21 follow-up acceptance keeps that conclusion, but the reference semantics need to be more precise. The external Slidev PNG reference should not be removed; it should become a cross-export advisory gate that exposes whether the PNG export path and PPTX capture path share the same layout contract. It should not replace the frozen-reference hard gate.

The current mainline PPTX hard gate was rerun with:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-final-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

Result:

1. `ok = true`
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `skillRootPath = /home/jacob/slidev/skills/slidev`
4. `skillReferenceCount = 52`
5. `pptxInspection.slideCount = 30`
6. `pptxInspection.textRunCount = 254`
7. `pptxInspection.tableCount = 6`
8. `pptxInspection.slidesWithoutEditableText = []`
9. `pptxVisualDiff.reference.source = pptx-background-images`
10. `meanRmse = 0.049339111333333345`
11. `maxRmse = 0.0889364`
12. `pptxVisualGate.passed = true`
13. `mermaidSourcePreservation.changedFenceIndexes = []`
14. `maxScaleRatioDelta = 0.02091836734693886`
15. `maxDifferenceBoundingBoxAreaRatio = 0.6987466725820763`

The high bounding-box area ratio is not a standalone overflow failure. In the current run it mostly captures text antialiasing and LibreOffice render-back differences distributed across dense text regions. It should stay advisory until the gate can distinguish geometric displacement from renderer noise.

The same baseline was then compared against an external Slidev PNG sequence:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

```bash
node - <<'NODE'
const { buildPptxVisualDiff } = require('./scripts/lib/pptx-visual-diff');
const report = buildPptxVisualDiff({
  pptxPath: 'docs/export/test-slidev-final-pptx-strict/architecture.zh-CN.pptx',
  referenceDirectory: 'docs/export/test-slidev-current-png-reference/architecture.zh-CN-slides-png',
  outputDirectory: 'docs/export/test-slidev-current-external-png-diff',
  dpi: 150,
  timeoutMs: 240000,
  thresholds: { maxRmse: 0.12, meanRmse: 0.08 },
});
console.log(JSON.stringify({ gate: report.gate, summary: report.comparison.summary }, null, 2));
NODE
```

Result:

1. `reference.source = external-png-sequence`
2. `gate.passed = false`
3. `meanRmse = 0.10535973851851853`
4. `maxRmse = 0.241976`
5. worst pages remained concentrated around `21, 19, 16, 20, 24, 18, 17, 15, 10, 22, 13, 12`

Manual inspection of `docs/export/test-slidev-current-external-png-diff/side-by-side/slide-21.png` and `slide-16.png` showed that the current differences are no longer the early obvious scale failures. The main layout is aligned; the residual diff is dominated by text antialiasing, LibreOffice PDF render-back, and subpixel differences between the PNG export path and the PPTX capture path. That means the external PNG gate failure should not be read as "PPTX visual output is broken", but it correctly exposes that PNG export and PPTX capture still use different rasterization paths.

The next work should therefore focus on the reference-generation contract before tuning `pptxWriter.ts`:

1. make PNG export and PPTX capture share the same converged standalone HTML, viewport, route, freeze script, font readiness, and double-RAF settle;
2. or expose a configurable export viewport/deviceScaleFactor/fit-off contract in the Slidev fork so `slidev export --format png` and NotEMD PPTX capture align;
3. keep external PNG comparison advisory by default until the reference contract is unified;
4. add structured external-gate metrics: geometric shift, scale drift, text-antialias tolerance, SSIM, and perceptual hash.

The key lesson from `oh-my-ppt` is not "turn every DOM node into native PPTX". It is the verifiable layering model: high-confidence primitives become editable, fragile visuals stay raster fallback, consumed primitives are marked, background capture hides only what native PPTX has actually taken over, and pixel checks prevent ghost text. NotEMD should import that discipline into acceptance and coverage reporting before enabling visible native text/table layers.

## `oh-my-ppt` Mechanism-Level Conclusions

The useful reading of `oh-my-ppt` is narrower than "it supports HTML Slides -> PPTX". It solves similar failures through five contracts:

1. **Render contract**: `renderer.ts` uses an isolated browser surface, fixed 1600x900 capture dimensions, `fit=off`, `print=1`, `export=1`, a print-ready signal, animation freeze, font readiness, and chart/canvas stability waits to converge DOM state into a measurable fact. NotEMD already uses Playwright 1960x1104 plus `convergeSlidevDeckLayout()`, but PNG export and PPTX capture still do not fully share the same viewport/route/freeze contract.
2. **Consumption contract**: `table-extract.ts` consumes `<table>` first and marks it with `data-pptx-consumed-table` so shape/text extraction does not duplicate table contents. NotEMD already has `data-notemd-pptx-consumed-table`; the next step is reporting consumed primitive counts, unconsumed text, and fallback-only coverage instead of only aggregate text/table counts.
3. **Text contract**: `index.ts` goes beyond `innerText`: it models inline runs, per-character line grouping, CJK fallback, list/bullet semantics, paragraph spacing, Tailwind utility hints, and `@chenglou/pretext` layout. NotEMD is still block-level. Transparent structure mode keeps visuals safe, but editing quality will remain weak for inline emphasis, syntax highlighting, list indentation, and long mixed CJK/Latin text.
4. **Paint-order contract**: `oh-my-ppt` estimates stacking order with stacking-context analysis plus `elementsFromPoint()` sampling, then `ooxml-writer.ts` writes shape/table/image/text in order. NotEMD's visible layer is currently the whole-slide background image, so paint order is not a visual hard blocker yet; it becomes mandatory only when visible native shape/image/text layers are introduced.
5. **Visible-native-layer contract**: `renderer.ts` hides consumed primitives before background capture and uses pixel sampling to detect text residue and retry. This cannot be directly ported to the default NotEMD flow, because NotEMD's visible text/table paint comes from the frozen background. Hiding text now would make the PPTX visually worse. The current branch only imports the same residue sampling plus three-attempt background retry under `--pptx-visible-native-experiment`, where it gates visible-native-text/table experiments rather than transparent-structure export.

The concrete next slices are:

1. **M1: improve the report before the visible layer**. This is now landed in the current branch. The report keeps `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`, and records `consumedTableCount`, `consumedTableTextCandidateCount`, `editablePrimitiveCoverage`, `fallbackOnlyElementKinds`, `unmodeledTextRunReasons`, and per-slide summaries.
2. **M2: rich run extraction**. First slice is now landed for the transparent text layer: inline runs, computed font metadata, link/code markers, paragraph splitting, underline/color/bold/italic preservation, and Office-safe whitespace are written into DrawingML. M17 added explicit hyperlink relationships. Remaining M2 work is CJK/Latin font-face splitting inside one run, bullet levels, line-height, and paragraph spacing.
3. **M3: external PNG advisory metrics**. First slice is now landed. The verifier can take an external PNG sequence through `--pptx-visual-reference-dir`, but it does not hard-fail the whole run unless `--require-pptx-visual-match` is explicitly passed. The report now includes scale drift, difference geometry, text-antialias/renderer-noise heuristics, layout-review candidates, and optional `PHASH`/`NCC`/`SSIM` metric availability so subpixel renderer drift is separated from actual layout drift.
4. **M4: visible native table/text branch**. Only make transparent structures visible after a same-frozen-HTML A/B gate passes. That branch must include residue detection/retry, or it will create background text plus PPTX text ghosting.
5. **M5: font contract**. The first slice is now landed as reporting, not embedding. `oh-my-ppt` font embedding is valuable, but NotEMD should not silently embed arbitrary user system or remote fonts. The current contract reports font families, CJK fallback, and Office missing-font risk; later embedding should be opt-in and limited to licensed local/vault font assets.

Do not migrate these parts now:

1. Do not bring Electron `BrowserWindow` assumptions into the Obsidian plugin; Playwright plus a local server fits the current runtime boundary better.
2. Do not rewrite or split Mermaid source to chase native vector editability; Mermaid/SVG/canvas should remain atomic visual fallback until the user explicitly opts into experimental vector reconstruction.
3. Do not treat `oh-my-ppt`'s Tailwind-specific parser as a generic Slidev solution. The idea of utility hints supplementing computed style is portable; the failure surface is not.
4. Do not interpret external PNG RMSE failure as a `pptxWriter.ts` failure. The frozen-reference hard gate already proves the writer preserves the embedded visual layer; external PNG failure mostly exposes an unshared reference contract.

## M5 Font Contract Closure

The font-contract slice was validated against the real `docs/architecture.zh-CN.md` source with the same strict visual gate:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m5-font-contract-pptx-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

Result:

1. `ok = true`
2. `pptxInspection.slideCount = 30`
3. `pptxInspection.textRunCount = 371`
4. `pptxInspection.tableCount = 6`
5. `pptxInspection.slidesWithoutEditableText = []`
6. `pptxVisualGate.passed = true`
7. `pptxVisualDiff.reference.source = pptx-background-images`
8. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
9. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
10. `fontContract.fontFamilyCount = 2`
11. `fontContract.fontFamilies = ["Avenir Next", "Fira Code"]`
12. `fontContract.cjkFontFamilies = ["Avenir Next", "Fira Code"]`
13. `fontContract.writerEastAsiaFontFace = "Microsoft YaHei"`
14. `fontContract.writerEastAsiaFallbackFontFamilies = ["Avenir Next", "Fira Code"]`
15. `fontContract.officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`
16. `fontContract.embeddedFontCount = 0`
17. `unignoredOutputs = []`

The result is a constraint, not just a report feature. The real deck's editable layer is dominated by `Avenir Next` and `Fira Code`, neither of which should be assumed to exist in Office across machines. It also contains CJK text under both source families, while the writer currently emits CJK text through `Microsoft YaHei` as the East Asian typeface. That means visible native text/table remains unsafe as a default: the transparent structure layer avoids visible font drift, but any future visible-native branch must either prove font substitution is visually neutral or ship an explicit, licensed font-asset policy.

## M7 `oh-my-ppt` Reuse Scale And Editable Text Coverage

The current round treats `/home/jacob/ref/oh-my-ppt-upstream-latest` as the upstream architectural reference and `/home/jacob/ref/oh-my-ppt-fork` as Jacob's local fork reference, not as source-dump inputs. Upstream `main` is currently `843ff74` (`v2.0.17`); the fork reference checked here is `257c23b` on `pr/animation-export-contract`. The reusable scale is:

1. **Directly reusable ideas and contracts**: table-first extraction, consumed DOM markers, computed geometry, source-of-truth browser rendering, background/foreground responsibility split, sidecar coverage reporting, and residue checks before any visible-native layer is allowed.
2. **Rewrite/adapt in NotEMD**: Slidev route traversal, Playwright capture, transparent editable overlays, Mermaid/SVG text extraction, code-block paragraph preservation, and report fields that match NotEMD's default `background-image` visible layer.
3. **Do not migrate as-is**: Electron `BrowserWindow`, `oh-my-ppt`'s default visible-native reconstruction bias, broad Tailwind utility reconstruction, and full shape/vector conversion. Those would make the current Slidev deck more fragile before the acceptance gate can prove parity.
4. **Keep as future optional experiments only**: font embedding, native animation reconstruction, KaTeX/image overlay extraction, and visible-native shape rebuilding. They are valuable in `oh-my-ppt`, but they should not be mixed into the default NotEMD Slidev PPTX path until the current hybrid contract has stable visual and editability gates.

The license boundary should stay explicit. `oh-my-ppt` is Apache-2.0 and NotEMD is MIT. Apache-2.0 code can be reused in an MIT project, but copied files bring Apache/NOTICE obligations into the repository. Even though Jacob is one of the `oh-my-ppt` developers, the upstream repository may still contain other contributions and third-party implementation details. The safer current policy is clean-room reuse: carry over behavior contracts, test oracles, failure classification, and data-model boundaries, not module source. If a module later deserves code-level reuse, do it as a small provenance-tracked import with license notes; do not copy the whole `html-pptx` tree into NotEMD.

Module by module, the reuse scale should be:

| `oh-my-ppt` module | NotEMD reuse scale | Reason |
| --- | --- | --- |
| `renderer.ts` / `browser-scripts.ts` | Reuse the render-convergence idea and residue/retry oracle, not the Electron implementation | NotEMD runs as Obsidian + Playwright + Slidev fork; importing `BrowserWindow` would add a second lifecycle and debugging surface |
| `table-extract.ts` | Reuse table-first extraction, consumed markers, and row/column geometry contracts; keep the NotEMD DOM extractor | This already matches `data-notemd-pptx-consumed-table`, but Slidev page roots, scaling, and transparent-layer semantics differ |
| `index.ts` text extraction | Reuse computed-style, rich-run, and utility-hint ideas without adopting the Tailwind/Pretext path wholesale | Slidev themes are not the same as a Tailwind-authored app; `@chenglou/pretext` is only worth adding if visible-native text needs pixel-level line boxes |
| `ooxml-writer.ts` | Reuse PresentationML structure lessons and test-case ideas, not the writer | NotEMD already has a small writer; the next value is run-level fonts, paragraph/list contracts, and high-confidence shapes; hyperlink relationships landed in M17 |
| `font-collect.ts` | Reuse font contract/reporting first; keep font embedding as opt-in experimentation | Default system/remote-font embedding creates licensing, file-size, Office-compatibility, and privacy problems |

In other words, being one of the `oh-my-ppt` developers lowers the cost of studying and adapting the design, but it should not lower the default product acceptance bar. Code can be reused; that does not mean it should be. NotEMD's constraint is not whether it can emit more complex OOXML, but whether arbitrary Slidev decks can export reliably from the Obsidian plugin and explain failures as environment, visual, font, or editability-coverage issues.

The strongest reusable implementation pattern from `oh-my-ppt` is the contract, not the exact code shape:

1. extract native structures before generic text/shape scanning;
2. mark consumed DOM so later passes do not double-count or double-hide;
3. use browser-computed rectangles and styles as the geometry source of truth;
4. capture a background after hiding extracted editable primitives;
5. emit sidecar evidence that lets tests reject silent coverage regressions.

NotEMD deliberately diverges in two places. First, Slidev Mermaid text lives inside shadow roots, so ordinary document-level CSS and `querySelectorAll('svg text')` are insufficient. The NotEMD extractor now walks composed roots and directly hides extracted shadow-root SVG text. Second, NotEMD's default visible layer stays raster-first. `oh-my-ppt` can bias toward visible native reconstruction because its authoring model controls more of the HTML shape vocabulary; arbitrary Slidev decks do not.

The important correction is Mermaid/SVG handling. `oh-my-ppt` hides `svg text, svg tspan` during background capture because that project does not extract SVG text in its default path. That is not an acceptable final state for NotEMD. NotEMD should keep Mermaid/SVG visuals as high-quality raster background and add transparent editable text boxes over visible SVG text. This satisfies the user's constraint: do not rewrite or split Mermaid source, and still expose diagram labels as editable PPTX text where the browser exposes them as `<text>/<tspan>`.

The M7 implementation slice is:

1. add `SlidevPptxTextSourceKind` so the report can distinguish `body`, `code`, `mermaid-text`, `svg-text`, and `table-cell-overlay`;
2. preserve code blocks as code-sourced editable text and split rich runs containing newlines into separate PPT paragraphs;
3. add transparent editable text overlays for table cells, because native DrawingML table text is technically editable but hard to target in real Office interaction when it is invisible;
4. extract visible SVG/Mermaid text into transparent editable overlays without modifying Mermaid fences or Mermaid output structure;
5. capture PPTX background/reference at device scale factor 2 to reduce low-quality Mermaid rasterization while keeping real PNG export on the existing Slidev export workflow;
6. expose source-kind counts in the sidecar report and verifier JSON so acceptance can measure editability instead of guessing from the rendered PPTX.

The practical plan should proceed in this order instead of chasing full native HTML-to-PPTX reconstruction at once:

1. **Tighten the Office text contract first**: make the writer and report share the final emit view, split mixed CJK/Latin runs, record actual Office font faces, then add code monospace defaults, paragraph spacing, and list indentation. This improves the editable layer without changing the visible layer, so it is the lowest-risk path.
2. **Improve selection ergonomics next**: keep the transparent structure layer, but add source-kind naming, PowerPoint Selection Pane-friendly names, and an optional debug overlay preview. The real user complaint is often not whether `<a:t>` exists, but whether the text can be found and edited in PowerPoint.
3. **Keep tightening the PNG/PPTX reference contract**: preserve the three reference layers: `pptx-background-images` hard gate, `pptx-rendered-html-reference` same-source gate, and `external-png-sequence` advisory gate. Do not tune the writer just because external PNG RMSE fails; first decide whether the separate Slidev export invocation drifted.
4. **Only embed allowlisted font assets**: future embedding can support explicitly licensed fonts stored in the vault/project and report embedded families, size, and fallback behavior. Do not scan and package user system fonts.
5. **Admit visible-native page by page**: only make native text/table visible on a page that passes residue sampling, frozen-background A/B visual diff, fontContract risk checks, and paint-order checks. Default whole-deck visible-native mode remains the wrong direction.
6. **Keep Mermaid/SVG as atomic visual fallback**: continue extracting SVG text overlays, but do not change Mermaid fences, split diagrams, or relayout nodes. Real Mermaid vector reconstruction belongs behind a separate experimental flag, not in the default PPTX export.

Real `docs/architecture.zh-CN.md` M7 validation now passes:

1. PPTX output: `docs/export/test-slidev-m7-editable-text-quality/architecture.zh-CN.pptx`
2. PPTX sidecar: `docs/export/test-slidev-m7-editable-text-quality/architecture.zh-CN.pptx.report.json`
3. `slideCount = 30`
4. `pptxInspection.textRunCount = 597`
5. `pptxInspection.tableCount = 6`
6. `pptxInspection.slidesWithoutEditableText = []`
7. `editableTextBoxCount = 277`
8. `editableBodyTextBoxCount = 138`
9. `editableCodeTextBoxCount = 1`
10. `editableMermaidTextBoxCount = 36`
11. `editableSvgTextBoxCount = 0`
12. `editableTableCellOverlayTextBoxCount = 102`
13. `editableTableCellCount = 102`
14. frozen-background PPTX visual gate passed with `maxRmse <= 0.12` and `meanRmse <= 0.08`
15. same-rendered-HTML reference visual gate passed with the same thresholds
16. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
17. `skillRootPath = /home/jacob/slidev/skills/slidev`
18. `skillReferenceCount = 52`
19. `unignoredOutputs = []`

The real PNG validation was also run against the same source:

1. PNG output: `docs/export/test-slidev-m7-current-png-reference/architecture.zh-CN-slides-png`
2. `pngCount = 30`
3. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
4. `skillRootPath = /home/jacob/slidev/skills/slidev`
5. `skillReferenceCount = 52`
6. `unignoredOutputs = []`

The verifier still records ImageMagick contact-sheet warnings on this host for some large all-slide montages, but those warnings are no longer a hard failure. Page-level visual metrics remain the gate. This is intentional: montage generation is review convenience, not the acceptance contract.

This is still not a promise that every diagram or code token is semantically editable. It is a pragmatic improvement in the current architecture: visual fidelity remains owned by the frozen background, while user-editable text affordances are widened where the DOM exposes stable text geometry. Full native Mermaid graph reconstruction remains a bad default because it would require layout reimplementation, arrow/marker reconstruction, and font/label collision handling that Mermaid already solved in SVG.

The next technical risks are:

1. **SVG coordinate fidelity**: `getBoundingClientRect()` is good enough for editable overlay placement, but rotated text, transformed groups, and text-on-path will not map perfectly to simple PPT text boxes.
2. **Selection ergonomics**: transparent overlays are editable, but users may still need to use PowerPoint's selection pane for dense diagrams. A future optional "visible editable overlay preview" mode could help, but should not become default.
3. **Duplicate editable text**: table-cell overlays intentionally duplicate transparent DrawingML table text. This improves practical editability but means automated text-run counts are no longer one-to-one with visual text occurrences.
4. **Font drift**: making these overlays visible would reintroduce the M5 font-risk problem. They must stay transparent unless a visible-native A/B gate passes.
5. **Reference contract**: real PNG export stays on the current Slidev route. PPTX background quality can improve independently, but external PNG vs PPTX hard comparison should remain advisory until both share the same rasterization contract.

The acceptance gate for this slice must use `docs/architecture.zh-CN.md`, require PPTX visual match against the frozen-background reference, require same-rendered-HTML reference match, and separately run real PNG export to prove the PNG path was not replaced.

## M8 Office Emit Run Font Contract

M8 handles a narrow but real editability-quality problem first. The writer previously emitted mixed Latin/CJK text inside one `<a:r>` with the source Latin font plus `Microsoft YaHei` as the East Asian font. PowerPoint can fallback from that, but the report did not know which font runs Office would actually receive. That weakens future visible-native font gating and editable-text quality analysis.

The implemented contract is:

1. `pptxFontContract.ts` owns the single `splitPptxTextIntoOfficeFontRuns()` function, splitting one DOM rich run into CJK and non-CJK Office emit runs.
2. non-CJK segments keep the source font; CJK segments are emitted as `Microsoft YaHei`, with both `<a:latin>` and `<a:ea>` set to the same actual emitted face so Office does not need to infer mixed-run fallback.
3. the transparent structure writer and visible-native experiment writer both use this same split logic.
4. `fontContract` keeps the source-font view in `fontFamilies`, `cjkFontFamilies`, and `writerEastAsiaFallbackFontFamilies`, and adds an Office emit view: `officeFontFamilies`, `officeCjkFontFamilies`, `officeLatinFontFamilies`, `officeTextRunCount`, `officeEastAsiaFallbackRunCount`, and `officeEastAsiaFallbackCharacterCount`.
5. `richTextRunCount` remains the DOM/rich-run extraction count; it is not redefined as Office emitted runs. The new `officeTextRunCount` carries the emitted-run count.

The `oh-my-ppt` reuse scale here is contract-level reuse, not code migration. Its useful lesson is that fonts cannot stay a local writer detail; extraction, OOXML writing, and acceptance reporting need the same view of the final text runs emitted to Office. This slice applies that idea by wiring the NotEMD writer and report to one splitter, without importing `BrowserWindow`, font embedding, the default visible-native strategy, or the full `html-pptx` writer. The implementation is also a little stricter than the simple Han-character check in the current `oh-my-ppt` path: Office font segmentation covers CJK punctuation, kana, Hangul, and fullwidth forms so text such as `API：架构` keeps the fullwidth colon in the East Asian Office font run.

This is not font embedding and not visible-native admission. It makes the final PPTX text runs and font faces a shared writer/report fact, which is the right foundation for hyperlink, paragraph/list, and visible-native font gates.

Added unit acceptance:

```bash
npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts
```

Current passing assertions:

1. one rich run `API 架构 v2` emits three Office runs: `API `, `架构`, and ` v2`;
2. Latin segments keep `Avenir Next`;
3. the CJK segment uses `Microsoft YaHei`;
4. report `richTextRunCount` remains `1`, while `officeTextRunCount` is `3`;
5. `API：架构 v2` keeps `：架构` in the East Asian Office font run;
6. report East Asian fallback count is `1` run / `2` CJK characters.

Real `docs/architecture.zh-CN.md` M8 acceptance now passes. PPTX command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m8-office-run-contract --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json'
```

Result:

1. `ok = true`;
2. PPTX output: `docs/export/test-slidev-m8-office-run-contract/architecture.zh-CN.pptx`;
3. sidecar: `docs/export/test-slidev-m8-office-run-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. PPTX inspection: `slideCount = 30`, `mediaCount = 30`, `pictureCount = 30`, `tableCount = 6`, `textRunCount = 1092`, `slidesWithoutEditableText = []`;
7. the default sidecar layers remain `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`;
8. sidecar counts: `textBoxCount = 277`, `richTextRunCount = 482`, `editableMermaidTextBoxCount = 36`, `editableTableCellOverlayTextBoxCount = 102`, `editableTableCellCount = 102`;
9. Office emit font contract: `officeTextRunCount = 995`, `officeFontFamilies = ["Avenir Next", "Fira Code", "Microsoft YaHei", "trebuchet ms"]`, `officeCjkFontFamilies = ["Microsoft YaHei"]`, `officeLatinFontFamilies = ["Avenir Next", "Fira Code", "trebuchet ms"]`;
10. East Asian fallback: `officeEastAsiaFallbackRunCount = 453`, `officeEastAsiaFallbackCharacterCount = 2007`;
11. frozen-background hard gate passed: `source = pptx-background-images`, `meanRmse = 0.04305776633333333`, `maxRmse = 0.0786701`;
12. same-rendered-HTML hard gate passed: `source = pptx-rendered-html-reference`, `slideCount = 30`, `meanRmse = 0.04305776633333333`, `maxRmse = 0.0786701`;
13. `unignoredOutputs = []`, `gitIgnoreCheckError = null`.

Real PNG export was also rerun to prove the PNG path still uses the current Slidev export workflow instead of the PPTX capture path:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-m8-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

PNG result:

1. `ok = true`;
2. output directory: `docs/export/test-slidev-m8-current-png-reference/architecture.zh-CN-slides-png`;
3. actual PNG file count: `30`;
4. `layoutAuditSummary.slideCount = 30`, `overflowCount = 0`, `unreadableCount = 0`, `renderErrorCount = 0`;
5. Mermaid diagnostics remain a review signal: `mermaidSlideCount = 3`, `mermaidFitReviewCount = 3`, `mermaidLowZoomCount = 2`, `mermaidManualReviewCount = 1`, `retryCount = 4`;
6. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
7. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
8. `unignoredOutputs = []`, `gitIgnoreCheckError = null`.

This means the M8 font-run contract did not regress the visual hard gates and did not replace real PNG export. It also preserves one next-step warning: the PNG layout audit still reports Mermaid zoom review signals. That is not a hard failure because there is no overflow, unreadable text, or render error, but later Mermaid quality work should target automatic zoom/fit diagnostics and threshold explanation instead of changing Mermaid source or splitting diagrams.

## M4 Visible-Native Experiment Closure

The visible-native direction has now been tested as an explicit experiment, not as a default behavior change. The verifier command was:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m4-visible-native-experiment --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-visible-native-experiment --json'
```

Default PPTX result:

1. `ok = true`
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `skillRootPath = /home/jacob/slidev/skills/slidev`
4. `skillReferenceCount = 52`
5. `pptxInspection.slideCount = 30`
6. `pptxInspection.textRunCount = 371`
7. `pptxInspection.tableCount = 6`
8. `pptxInspection.slidesWithoutEditableText = []`
9. `pptxVisualGate.required = true`
10. `pptxVisualGate.observedPassed = true`
11. `pptxVisualGate.passed = true`
12. `pptxVisualDiff.reference.source = pptx-background-images`
13. `pptxVisualDiff.comparison.summary.meanRmse = 0.049330418`
14. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
15. `mermaidSourcePreservation.changedFenceIndexes = []`
16. `unignoredOutputs = []`

Visible-native experiment result:

1. output PPTX: `docs/export/test-slidev-m4-visible-native-experiment/architecture.zh-CN.visible-native-experiment.pptx`
2. sidecar: `docs/export/test-slidev-m4-visible-native-experiment/architecture.zh-CN.visible-native-experiment.pptx.report.json`
3. `visibleTextLayer = native-text-experiment`
4. `editableLayerRenderMode = visible-native-experiment`
5. experiment package `slideCount = 30`
6. experiment package `textRunCount = 371`
7. experiment package `tableCount = 6`
8. `residueSampling.sampledSlideCount = 30`
9. `residueSampling.checkedRegionCount = 212`
10. `residueSampling.suspiciousSlideCount = 0`
11. `residueSampling.suspiciousRegionCount = 0`
12. `residueSampling.maxTextLikePixelRatio = 0`
13. experiment visual reference is the default frozen background: `referenceImageCount = 30`
14. experiment render-back `meanRmse = 0.13384873333333333`
15. experiment render-back `maxRmse = 0.233655`
16. worst experiment pages are 24, 27, 19, 22, 23, 20, 21, and 17.

This is the important engineering conclusion: the `oh-my-ppt`-style consumed-DOM hiding, residue sampling, and retry worked for avoiding double-rendered source text, but visible native text/table still regresses visual fidelity on the real deck. The likely causes are Office font substitution, line-height/baseline differences, text antialiasing, table cell padding/border model differences, and incomplete paint-order modeling. The correct state is therefore:

1. keep the default PPTX export as frozen background plus transparent editable structure;
2. keep visible-native output behind an explicit verifier flag;
3. keep `--require-pptx-visible-native-match` available for future experiments, but do not enable it in the default UI path;
4. use the experiment's side-by-side artifacts to identify which pages might be safe for selective visible-native enablement later;
5. do not split or rewrite Mermaid diagrams to improve visible-native metrics.

## oh-my-ppt Reference Refresh Acceptance

After the latest `oh-my-ppt` read-through, the real `docs/architecture.zh-CN.md` deck was revalidated with the same architectural boundary: default PPTX remains frozen visible background plus transparent editable structures; visible native text/table remains an explicit experiment.

PNG reference command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-ohmyppt-final-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

Default PPTX plus visible-native experiment command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-ohmyppt-final-pptx-acceptance --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-visible-native-experiment --json'
```

External PNG advisory diff command:

```bash
node - <<'NODE'
const { buildPptxVisualDiff } = require('./scripts/lib/pptx-visual-diff');
const report = buildPptxVisualDiff({
  pptxPath: 'docs/export/test-slidev-ohmyppt-final-pptx-acceptance/architecture.zh-CN.pptx',
  referenceDirectory: 'docs/export/test-slidev-ohmyppt-final-png-reference/architecture.zh-CN-slides-png',
  outputDirectory: 'docs/export/test-slidev-ohmyppt-final-external-png-diff',
  dpi: 150,
  timeoutMs: 240000,
  thresholds: { maxRmse: 0.12, meanRmse: 0.08 },
});
console.log(JSON.stringify({ gate: report.gate, summary: report.comparison.summary }, null, 2));
NODE
```

Current acceptance facts:

1. the PNG reference run passed with `ok = true`, `layoutAuditSummary.overflowCount = 0`, native standalone HTML accepted, `unignoredOutputs = []`, `skillRootPath = /home/jacob/slidev/skills/slidev`, and `skillReferenceCount = 52`;
2. the default PPTX file is `docs/export/test-slidev-ohmyppt-final-pptx-acceptance/architecture.zh-CN.pptx`, `2,804,976` bytes;
3. PPTX inspection shows `slideCount = 30`, `mediaCount = 30`, `textRunCount = 371`, `pictureCount = 30`, `tableCount = 6`, and `slidesWithoutEditableText = []`;
4. the default sidecar keeps `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`;
5. the default sidecar reports `textBoxCount = 139`, `richTextRunCount = 344`, `tableCount = 6`, and `editableTableCellCount = 102`;
6. font contract still reports `fontFamilies = ["Avenir Next", "Fira Code"]`, `officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`, and `embeddedFontCount = 0`;
7. fallback-only objects remain explicit: `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`;
8. unmodeled text reasons remain explicit: `unmodeledTextRunReasons = ["inline-code", "inline-formatting", "syntax-highlight"]`;
9. default frozen-reference visual diff passed with `reference.source = pptx-background-images`, `meanRmse = 0.049330418`, `maxRmse = 0.0889364`, `maxScaleRatioDelta = 0.02091836734693886`, and `maxDifferenceBoundingBoxAreaRatio = 0.6987466725820763`;
10. external PNG advisory diff failed its advisory thresholds with `reference.source = external-png-sequence`, `meanRmse = 0.102229238`, `maxRmse = 0.241976`, and no likely layout-drift slides;
11. the frozen-reference report classifies the remaining differences as text antialias / renderer noise: `textAntialiasDriftLikely = 20`, `rendererNoiseLikely = 20`, `referenceContractDriftLikely = 0`, `layoutDriftLikely = 0`;
12. the external PNG report classifies the failure as reference-contract drift plus renderer noise, not layout drift: `textAntialiasDriftLikely = 7`, `rendererNoiseLikely = 7`, `referenceContractDriftLikely = 13`, `layoutDriftLikely = 0`;
13. the visible-native experiment package has the same `slideCount = 30`, `textRunCount = 371`, and `tableCount = 6`;
14. visible-native residue sampling succeeded: `sampledSlideCount = 30`, `checkedRegionCount = 212`, `suspiciousSlideCount = 0`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`;
15. visible-native visual diff still failed: `meanRmse = 0.13384873333333333`, `maxRmse = 0.233655`, worst pages `24, 27, 19, 22, 23, 20, 21, 17, 25, 18`;
16. all generated outputs are under `docs/export/test-slidev-*` and remain ignored local evidence, not commit material.

This keeps the external PNG conclusion intentionally conservative: external PNG comparison is useful, but it is not stable enough to be a hard gate yet. A separate Slidev PNG invocation can still drift from the PPTX capture path even when both are derived from the same source deck. The advisory failure is still valuable because it identifies reference-contract drift without confusing it with layout drift. The hard gate remains the PPTX frozen background reference.

The visible-native conclusion did not change. Residue detection and retry solve one specific failure class: ghost text left behind in the captured background. They do not solve Office font substitution, baseline/line-height mismatch, table padding/border differences, or incomplete paint order. That is why the experiment can have `suspiciousRegionCount = 0` and still fail the visual diff. Treating that as a success would be a category error.

## M6 Same-Rendered-HTML Reference Gate

The next useful `oh-my-ppt` lesson is not another `pptxWriter.ts` tuning pass. It is tightening the reference contract first. `oh-my-ppt` treats one browser-rendered state as the export fact. NoteMD already has a PPTX embedded frozen-background hard gate, but the external PNG advisory still comes from a separate Slidev PNG invocation, so it naturally includes drift from a second rendering instance.

This slice adds a maintainer verifier path:

1. `exportSlidevPptxRenderedHtmlReferencePngSequence()` captures PNG references from the same converged HTML, 1960x1104 viewport, route, freeze script, font readiness, and double-RAF settle used by the PPTX export.
2. `scripts/verify-slidev-export-workflow.cjs --pptx-rendered-html-reference-diff` compares PPTX render-back output page by page against that same-rendered-HTML PNG sequence.
3. `scripts/lib/pptx-visual-diff.js` now accepts an explicit `referenceSource`, so this path is reported as `pptx-rendered-html-reference` instead of being misclassified as a generic `external-png-sequence`.
4. `--require-pptx-rendered-html-reference-match` can promote this same-source reference diff to a hard gate, but it remains an additional acceptance surface by default.

Real command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-ohmyppt-same-html-reference-pptx --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --json'
```

Current real result:

1. `ok = true`;
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
3. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
4. PPTX output: `docs/export/test-slidev-ohmyppt-same-html-reference-pptx/architecture.zh-CN.pptx`, `2,804,979` bytes;
5. sidecar: `slideCount = 30`, `textBoxCount = 139`, `richTextRunCount = 344`, `tableCount = 6`, `editableTableCellCount = 102`;
6. sidecar still keeps `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`;
7. font contract still reports `fontFamilies = ["Avenir Next", "Fira Code"]`, `officeMissingFontRiskFamilies = ["Avenir Next", "Fira Code"]`, and `embeddedFontCount = 0`;
8. fallback-only objects remain `["code-highlight", "mermaid", "svg"]`;
9. unmodeled text reasons remain `["inline-code", "inline-formatting", "syntax-highlight"]`;
10. frozen-reference hard gate: `source = pptx-background-images`, `gatePassed = true`, `meanRmse = 0.049330418`, `maxRmse = 0.0889364`, `layoutDriftLikely = 0`;
11. same-rendered-HTML reference diff: `source = pptx-rendered-html-reference`, `gatePassed = true`, `meanRmse = 0.049330418`, `maxRmse = 0.0889364`, `referenceContractDriftLikely = 0`, `layoutDriftLikely = 0`;
12. all outputs from this run live under `docs/export/test-slidev-ohmyppt-same-html-reference-pptx/`; `git status --ignored` reports them as `!!`, so they are local evidence and not commit material.

This separates three reference meanings:

1. `pptx-background-images` is the current hard gate. It proves the frozen visual layer written into the PPTX survives Office/LibreOffice render-back within accepted limits.
2. `pptx-rendered-html-reference` is the same-source HTML reference. It proves a PNG capture from the exact HTML capture path used by PPTX does not introduce the reference-contract drift seen in separate Slidev PNG invocations.
3. `external-png-sequence` remains the cross-export advisory surface for checking whether the real PNG export and PPTX capture path share a strong enough layout/render contract.

This is not replacing the PNG hard gate with images extracted from the PPTX. It is an intermediate layer: the same-rendered-HTML reference proves the PPTX capture contract is stable; when a separate Slidev PNG export fails, the failure can now be attributed more clearly to PNG export route/viewport/freeze/font-readiness contract drift instead of being misread as a PPTX writer failure.

## M9 Source-Kind Editable Coverage Contract

The next `oh-my-ppt` lesson worth carrying forward is coverage provenance. `oh-my-ppt` does not only write native objects; it tracks which DOM primitives were consumed, which content stayed visual fallback, and which extraction path produced each editable primitive. That is the right reuse scale for NoteMD. The current plugin should learn the contract and evidence model, not copy the upstream Electron renderer or font embedding pipeline.

This slice lands that idea in the PPTX sidecar and OOXML shape names:

1. `SlidevPptxTextSourceCoverage` now records per-source coverage for `body`, `code`, `mermaid-text`, `svg-text`, and `table-cell-overlay`.
2. The sidecar records that coverage at three levels: top-level `textSourceCoverage`, `editablePrimitiveCoverage.textSourceCoverage`, and each slide's `textSourceCoverage`.
3. Each source entry records `slideCount`, `textBoxCount`, `textLineCount`, `characterCount`, `richTextParagraphCount`, and `richTextRunCount`.
4. PPTX text shape names now include their source role, for example `Editable Code Text`, `Editable Mermaid Text`, `Editable SVG Text`, and `Editable Table Cell Overlay Text`.
5. Unit tests now assert source-kind coverage and the code shape name in generated slide XML.

The point is not cosmetic. It closes an evidence gap from the previous reports: raw text-box count could prove that some text existed, but it could not prove that code fences, Mermaid/SVG labels, or table-cell overlays were separately represented as editable structures. With this slice, a real deck can be inspected for source-specific editability without overstating visual-native support.

This remains deliberately different from a visible-native reconstruction strategy:

1. Mermaid source is still preserved and not rewritten or split.
2. Mermaid/SVG/canvas visuals still use the frozen background as the visible layer.
3. Extracted Mermaid/SVG text labels are transparent editable overlays, not a claim that the diagram is Office-native editable.
4. Table-cell overlay text is reported separately from the DrawingML table structure, so a future visible-native-table experiment can tell table geometry, table text, and overlay text apart.
5. The default export continues to be `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`.

Reuse boundary after rereading `/home/jacob/ref/oh-my-ppt-upstream-latest` and `/home/jacob/ref/oh-my-ppt-fork`:

1. Reuse the **consumption discipline**: extract high-confidence structures first, mark consumed DOM, and avoid duplicate text.
2. Reuse the **reporting discipline**: distinguish editable objects by provenance instead of reporting only aggregate counts.
3. Reuse the **gating discipline**: visual-native layers need residue sampling and same-rendered-reference gates before they can become default.
4. Do not reuse the **runtime container**: Electron `BrowserWindow` and app-local asset assumptions do not belong in the Obsidian plugin path.
5. Do not reuse the **font embedding pipeline** by default: NotEMD must not silently embed arbitrary system or remote fonts; embedding needs an explicit licensed vault/local asset policy.
6. Do not reuse the **DOM-to-native ambition** wholesale: for Slidev decks, preserving the frozen visual layer plus transparent editable overlays is currently more robust than trying to reconstruct every Mermaid/SVG/code/table visual as native Office shapes.

The practical next step after M9 is not another broad writer rewrite. It is targeted extraction quality:

1. add source-kind coverage thresholds to the verifier for real decks where the expected categories are known;
2. extend code text extraction toward syntax-token provenance without making tokens visible by default;
3. keep Mermaid labels editable where DOM/SVG text can be safely extracted, but do not mutate the Mermaid fence;
4. add table-cell text style/run coverage separately from table geometry;
5. only after those reports are stable, consider a visible-native page-by-page opt-in path guarded by residue and visual-diff gates.

Real `docs/architecture.zh-CN.md` PPTX acceptance for M9:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m9-source-coverage-contract --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m9-source-coverage-contract/architecture.zh-CN.pptx`, `5,296,432` bytes;
3. sidecar: `docs/export/test-slidev-m9-source-coverage-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `pptxInspection.slideCount = 30`, `mediaCount = 30`, `pictureCount = 30`, `tableCount = 6`, `textRunCount = 1092`, `slidesWithoutEditableText = []`;
7. sidecar keeps `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`;
8. sidecar object counts: `textBoxCount = 277`, `richTextRunCount = 482`, `tableCount = 6`, `editableTableCellCount = 102`;
9. source-kind coverage: `body = 30 slides / 138 boxes / 6062 chars / 343 rich runs`;
10. source-kind coverage: `code = 1 slide / 1 box / 14 lines / 440 chars / 1 rich run`;
11. source-kind coverage: `mermaid-text = 1 slide / 36 boxes / 531 chars / 36 rich runs`;
12. source-kind coverage: `svg-text = 0`, which is the current real deck's extracted-source fact, not a regression in the schema;
13. source-kind coverage: `table-cell-overlay = 6 slides / 102 boxes / 1116 chars / 102 rich runs`;
14. font contract still reports `fontFamilies = ["Avenir Next", "Fira Code", "trebuchet ms"]`, `officeFontFamilies = ["Avenir Next", "Fira Code", "Microsoft YaHei", "trebuchet ms"]`, `officeTextRunCount = 995`, `officeEastAsiaFallbackRunCount = 453`, `officeEastAsiaFallbackCharacterCount = 2007`;
15. frozen-background hard gate passed: `reference.source = pptx-background-images`, `meanRmse = 0.04305776633333333`, `maxRmse = 0.0786701`;
16. same-rendered-HTML hard gate passed: `reference.source = pptx-rendered-html-reference`, `meanRmse = 0.04305776633333333`, `maxRmse = 0.0786701`;
17. Mermaid source preservation passed: `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`;
18. `unignoredOutputs = []`, `gitIgnoreCheckError = null`.

Real PNG export was rerun to prove this slice did not replace the current Slidev PNG workflow with a PPTX capture substitute:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format png --output-subfolder export/test-slidev-m9-current-png-reference --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

PNG result:

1. `ok = true`;
2. output directory: `docs/export/test-slidev-m9-current-png-reference/architecture.zh-CN-slides-png`;
3. real slide PNG count is `30`; the extra PNG under the output tree is the Slidev logo asset, not a rendered slide;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `layoutAuditSummary.slideCount = 30`, `overflowCount = 0`, `unreadableCount = 0`, `renderErrorCount = 0`;
7. Mermaid remains a review signal, not a hard failure: `mermaidSlideCount = 3`, `mermaidFitReviewCount = 3`, `mermaidLowZoomCount = 2`, `mermaidManualReviewCount = 1`, `retryCount = 4`;
8. `unignoredOutputs = []`, `gitIgnoreCheckError = null`;
9. `git status --ignored` shows both M9 output directories as `!!`, and `git ls-files` returns no tracked files under them.

One workflow risk was observed during this acceptance: optional ImageMagick `NCC` diagnostics can dominate runtime on dense 3920x2208 comparison pages. It completed in this run, so it is not a correctness failure. The hardening direction is stability-first: keep the previous 60000ms per-metric budget by default, but make optional metric failures observable as report data instead of allowing advisory diagnostics to abort an otherwise valid hard visual gate.

## M10 Optional Visual Metric Stability Contract

The correction for M10 is intentionally not a short-timeout acceleration policy. `PHASH`, `NCC`, and `SSIM` are diagnostic ImageMagick metrics. They are useful when available, but they are not the authority for export correctness. The hard visual gate remains RMSE/AE/difference geometry against the selected reference source.

The implementation now keeps the optional metric timeout at `60000ms`, matching the previous stable `compare` budget. That preserves diagnostic completeness for dense real decks and avoids the false confidence of a fast but incomplete metric report. If an optional metric is unsupported, times out under that stable budget, returns unparsable output, or fails as a command, the run records a structured reason instead of throwing through the whole verifier.

The report contract added in this slice is:

1. `comparison.optionalMetricPolicy = { metrics: ["PHASH", "NCC", "SSIM"], timeoutMs: 60000, hardGate: false }`;
2. `comparison.summary.advisoryMetrics.optionalCompareMetrics` records requested, available, unavailable, timed-out, unsupported, unparsable, and command-failed counts;
3. `comparison-metrics.csv` includes `phash_reason`, `ncc_reason`, and `ssim_reason` so a maintainer can see which advisory metrics degraded on which page;
4. optional metric degradation does not change `pptxVisualGate.passed` or `pptxRenderedHtmlReferenceGate.passed`;
5. real acceptance should use the stable default budget, not an artificially tiny timeout to manufacture the degrade path.

This aligns with the `oh-my-ppt` lesson at the right reuse scale. `oh-my-ppt` does not treat every helper signal as a blocking product gate; it records warnings, retries where the visual contract needs retries, and keeps export stages explicit. NotEMD should do the same: hard gates prove visual preservation and editability coverage, while advisory metrics explain risk and drift without becoming a hidden source of flakiness.

The implementation still does not copy `oh-my-ppt` source. The reused idea is the workflow contract: separate required visual invariants from diagnostic signals, report degraded diagnostics explicitly, and keep generated evidence outside git-tracked artifacts.

Real M10 acceptance was rerun against the real `docs/architecture.zh-CN.md` deck after this contract change:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m10-optional-metric-stability /tmp/notemd-m10-pptx-verify.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m10-optional-metric-stability --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json > /tmp/notemd-m10-pptx-verify.json'
```

Result:

1. `ok = true`;
2. `environment.slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
3. `pptxInspection.slideCount = 30`, `textRunCount = 1092`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
4. `pptxVisualGate.required = true`, `pptxVisualGate.passed = true`, `failures = []`;
5. `pptxRenderedHtmlReferenceGate.required = true`, `pptxRenderedHtmlReferenceGate.passed = true`, `failures = []`;
6. both visual reports keep `optionalMetricPolicy.timeoutMs = 60000`, `hardGate = false`;
7. both visual reports show `requestedMetricCount = 90`, `availableMetricCount = 60`, `unavailableMetricCount = 30`, `timedOutMetricCount = 0`, `unsupportedMetricCount = 30`, `unavailableReasons = { "unsupported-by-imagemagick": 30 }`;
8. both visual reports show `meanRmse = 0.04305776633333333`, `maxRmse = 0.0786701`;
9. sidecar shows `textBoxCount = 277`, `editableMermaidTextBoxCount = 36`, `editableTableCellOverlayTextBoxCount = 102`;
10. sidecar keeps `visibleTextLayer = background-image` and `editableLayerRenderMode = transparent-structure`;
11. generated output remains ignored: `git status --ignored --short docs/export/test-slidev-m10-optional-metric-stability` reports `!!`, and `git ls-files docs/export/test-slidev-m10-optional-metric-stability` returns no tracked files.

This run used the stable optional metric budget. It did not use a short timeout to force a degraded metric path.

## M11 Editable Layer Contract, Fonts, and Mermaid/SVG Direction

Historical note: this M11 section described the pre-visible-native default. It is superseded by M26. The diagnosis was correct for the old writer, but it is no longer an acceptable default contract because it made editable text discoverable only through transparent DrawingML text under the rendered image.

This is now explicit in the sidecar report through `editableLayerContract`:

1. pre-M26 default export: `visualFidelityStrategy = frozen-background-first`, `visibleTextSource = background-image`, `editableTextShapeFill = transparent`, `editableTableTextFill = transparent`, `backgroundTextPolicy = preserve-rendered-text`, `textSelectionSurface = named-transparent-shapes`;
2. visible-native experiment: `visibleTextSource = native-text`, `editableTextShapeFill = visible`, `editableTableTextFill = visible`, `backgroundTextPolicy = hide-extracted-text-before-capture`;
3. current Mermaid/SVG default policy after M26: `mermaidSvgVisualPolicy = background-image`, `mermaidSvgTextPolicy = background-image-only`, `officeNativeMermaidSvgElementEditability = not-claimed`;
4. font portability policy: `fontPortabilityPolicy = report-only-no-default-font-embedding`.

The comparison boundary changed after visible-native became the default. The useful `oh-my-ppt` lesson is not a second screenshot route; it is native object extraction, marking consumed DOM, hiding modeled DOM before fallback capture, and using residue/visual-diff gates to detect leaked rendered text. That does not justify reconstructing Mermaid/SVG geometry by default.

Font selection should be added as an export policy, not as implicit system-font embedding:

1. ship a small portable preset list for UI selection, biased toward Office/common cross-platform faces such as `Aptos`, `Arial`, `Calibri`, `Consolas`, `Microsoft YaHei`, and optionally locally available `Noto Sans CJK` families;
2. allow users to type or select a system-supported font family for rendered Slidev/PPTX extraction, but mark it as a portability risk unless it is known to exist on the target Office machine;
3. support vault-local licensed font assets as an opt-in embedding source later; do not scan and package arbitrary system fonts by default;
4. keep `fontContract` as the acceptance surface: source CSS fonts, Office-emitted fonts, CJK fallback, missing-font risk, and embedding policy must all agree before any visible-native text/table default changes.

Mermaid/SVG needs a similar split. The default should preserve Mermaid source fences and keep the visual fallback stable, while exporting rendered Mermaid SVG sidecars for users who want to inspect or manually edit vector elements. Embedding SVG directly into PPTX is worth an experiment, but it is not the same as Office-native editable diagram semantics: PowerPoint/LibreOffice compatibility, ungroup behavior, font substitution inside SVG, and fallback rendering must be tested before it becomes default. The near-term best path is:

1. keep Mermaid source unchanged and do not split large Mermaid diagrams;
2. copy rendered Mermaid/SVG assets as sidecars by default when available;
3. do not emit transparent Mermaid/SVG label overlays in the default path; keep labels background-owned unless an explicit visible-native experiment proves parity;
4. add an experimental PPTX SVG embedding path only after the frozen visual gate and Office compatibility tests prove it is stable;
5. do not claim Mermaid diagram shapes are natively editable until the report can distinguish SVG image editability from Office DrawingML shape editability.

## M12 Selectable Native Overlay Default

The user's latest correction changes the priority: Mermaid label text is not the first problem. The immediate user-facing gap is that ordinary slide text, code text, SVG/chart text when present, and table-cell text need to be selectable and editable in the PPTX without sacrificing the real Slidev visual result.

The attempted default of hiding selected DOM text before background capture and making `body`, `code`, `svg-text`, and `table-cell-overlay` fully visible native text was rejected by real acceptance. It made the PPTX structurally editable, but ordinary content pages drifted badly because Office/LibreOffice text layout is not browser layout. The failed real run had `slideCount = 30`, `textRunCount = 1092`, `pictureCount = 30`, `tableCount = 6`, and `slidesWithoutEditableText = []`, but the rendered-HTML reference gate failed with `maxRmse = 0.282811` and `meanRmse = 0.15579297`. The worst pages were normal text pages such as 24, 22, 27, 23, 19, 20, and 21. The side-by-side evidence showed different list bullets, indentation, line wrapping, inline-code baselines, and font substitution. That is not a Mermaid problem and not a global zoom problem.

One useful bug fix from that failed attempt remains: the extractor now prefers `.slidev-page` over `#app` when equal-area roots are visible. Slidev's active page can be visually scaled while `#app` has the same viewport area, so choosing `#app` under-counted the root visual scale and produced wrong native font sizes. The tie-break now follows `.slidev-page > .slidev-layout > .slidev-slide-content > #app`.

The default PPTX path now uses a hybrid that matches the product contract better:

1. the visible layer is still the frozen rendered Slidev background;
2. default capture no longer hides extracted DOM text;
3. `body`, `code`, `svg-text`, and `table-cell-overlay` are written as named native text boxes with an 8% alpha selection-affordance fill;
4. Mermaid text remains a transparent named overlay and is not the priority of this slice;
5. native table structures remain transparent, while table-cell overlay text is selectable through the same selection-affordance layer;
6. the sidecar reports `visibleTextLayer = background-image-with-selectable-native-text-overlay`;
7. the sidecar reports `editableLayerRenderMode = selectable-native-text-overlay`;
8. the sidecar contract says `backgroundTextPolicy = preserve-rendered-text`, `selectableNativeTextSources = ["body", "code", "svg-text", "table-cell-overlay"]`, `visibleNativeTextSources = []`, and `backgroundHiddenTextSources = []`.

This is intentionally not the same as full visible-native reconstruction. It optimizes for direct selection/editability of ordinary text while keeping the browser-rendered background as the visual authority. The tradeoff is that the native text layer is a low-opacity editing affordance, not the primary visible rendering. Fully visible native text remains an experiment until it can pass real visual gates page by page.

The implementation also fixed a workflow bug in the extractor boundary. `pptxDomExtractor` used to inject the text-hiding CSS unconditionally after setting `data-notemd-pptx-hidden-text`. That meant even the default background could be captured with faded or hidden text. The extractor now only extracts and marks elements; the hide CSS is applied only by the visible-native experiment's background-preparation step. This keeps the default capture honest and keeps the experiment path intact.

Real M12 acceptance was run against `docs/architecture.zh-CN.md`:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-selectable-native-text /tmp/notemd-selectable-native-text.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-selectable-native-text --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --pptx-rendered-html-reference-diff --require-pptx-rendered-html-reference-match --json > /tmp/notemd-selectable-native-text.json'
```

Result:

1. `ok = true`;
2. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
3. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
4. output PPTX: `docs/export/test-slidev-selectable-native-text/architecture.zh-CN.pptx`;
5. output report: `docs/export/test-slidev-selectable-native-text/architecture.zh-CN.pptx.report.json`;
6. `pptxInspection.slideCount = 30`, `textRunCount = 1032`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
7. sidecar editable coverage: `editableTextBoxCount = 217`, `editableBodyTextBoxCount = 78`, `editableCodeTextBoxCount = 1`, `editableTableCellOverlayTextBoxCount = 102`, `editableMermaidTextBoxCount = 36`, `pagesWithoutEditableText = []`;
8. `pptxVisualGate.passed = true`, `failures = []`;
9. `pptxRenderedHtmlReferenceGate.passed = true`, `failures = []`;
10. both visual reports show `meanRmse = 0.044284142`, `maxRmse = 0.0806512`;
11. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-selectable-native-text` reports `!!`, and the verifier reports `unignoredOutputs = []`.

The current best direction is not to chase a larger global alpha or a global zoom knob. If users need fully visible editable text, the implementation should graduate it page-by-page using measured visual gates, font portability gates, and list/code/table-specific layout modeling. For the default export, the stable architecture is frozen visual background plus selectable native editing overlays.

## M13 Visible Editable Text Default

User acceptance rejected the M12 default: low-alpha native overlays are still fake editability when the readable text remains in the background image. The default PPTX export must make the displayed text itself editable and should not keep transparent text shapes as the primary edit surface.

The default PPTX contract now changes again:

1. before capturing the background, modeled non-Mermaid text sources are hidden in the DOM;
2. ordinary body text, code text, and non-Mermaid SVG/chart text are written as visible native PowerPoint text boxes;
3. modeled tables are written as visible native PowerPoint tables, so displayed cell text is editable table text instead of transparent table text;
4. table-cell overlay text boxes are skipped when a visible native table exists, avoiding duplicate cell text;
5. Mermaid label overlays are not written as transparent default text shapes; Mermaid remains background-owned until a separate Mermaid-specific pass can make its labels visible-native without degrading diagrams;
6. the default sidecar reports `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `backgroundTextPolicy = hide-modeled-text-before-capture`, and `transparentOverlayTextSources = []`.

This is the correct product behavior for editable PPTX, but it is not a free win. Office text layout is still not Chromium layout. Bullets, inline code baselines, CJK fallback, and wrapping can drift. The next engineering direction should not reintroduce transparent overlays; it should reduce drift by extracting browser line boxes and writing shorter positioned native runs, especially for list items, code fences, and dense body paragraphs. That is the robust path if visual matching must improve while keeping displayed text genuinely editable.

Real M13 smoke acceptance against `docs/architecture.zh-CN.md` passed for the export flow and editability contract:

1. output PPTX: `docs/export/test-slidev-visible-native-text-smoke/architecture.zh-CN.pptx`;
2. output report: `docs/export/test-slidev-visible-native-text-smoke/architecture.zh-CN.pptx.report.json`;
3. `ok = true`, `slideCount = 30`, `textRunCount = 838`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
4. sidecar reports `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, and `transparentOverlayTextSources = []`;
5. PPTX XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, `Visible Native Text` count `78`, `Visible Native Code Text` count `1`, `Visible Native Table` count `6`, and `Editable Mermaid Text` count `0`;
6. generated outputs remain ignored by Git.

The visual-diff run generated the expected advisory failure for the new visible-native default: `meanRmse = 0.12245296333333332`, `maxRmse = 0.206806`, with worst slides 24, 27, 22, 19, 23, 20, 21, and 17. This is accepted as current risk because the user explicitly rejected fake transparent editability. The next quality slice must attack line wrapping, bullet indentation, inline-code baseline, and font fallback directly rather than reintroducing hidden/transparent text layers.

## M14 `oh-my-ppt`-Style Browser Geometry Convergence

This round continues to use `/home/jacob/ref/oh-my-ppt-upstream-latest` as a reference, but still at the clean-room contract level: browser rendering is the fact source, consumed DOM is modeled separately, modeled text is hidden before background capture, and round-trip rendered diff is the acceptance oracle. The Electron renderer and full HTML-to-PPTX module were not imported.

The real M13 problem was not the old transparent layer anymore. It was Office/LibreOffice re-layout after visible-native text took over lists, inline code, and missing fonts. Applying the old frozen-background thresholds directly to visible-native text creates false failures; merely relaxing thresholds without improving the model would also hide the problem. This slice addressed it in four steps:

1. `--require-pptx-visual-match` now automatically uses the same rendered HTML reference as the hard gate for default visible-native PPTX. PPTX background image diff is not the hard reference in that mode because that background intentionally hides modeled text.
2. List items use browser line boxes instead of Office bullet/block wrapping. The original Slidev marker stays in the background image, and the background-hiding CSS restores the marker's computed color through `--notemd-pptx-marker-color`.
3. Line boxes moved from "one mixed rich-text box per browser line" to "one positioned native text box per continuous style segment inside the browser line." The extractor groups text-node characters with `Range.getBoundingClientRect()`, buckets them by line top, and emits shorter native text boxes by contiguous run style. The tradeoff is more PPTX edit objects, but inline code, CJK/Latin, and normal text no longer depend entirely on Office re-layout inside one text box.
4. The writer and report now share one Office font resolver. Source fonts remain visible in the report, while known-missing Latin families are mapped to local usable output faces. Current mappings are `Avenir Next -> Noto Sans` and `Fira Code -> DejaVu Sans Mono`. CJK fallback stays on `Microsoft YaHei` to avoid breaking the common PowerPoint East Asia path.

The real `docs/architecture.zh-CN.md` numbers show this was not just threshold tuning:

1. initial visible-native rendered-HTML gate: `maxRmse = 0.282811`, `meanRmse = 0.150802`;
2. after list line boxes and marker preservation: `maxRmse = 0.254802`, `meanRmse = 0.143600`;
3. after known-missing font resolver: `maxRmse = 0.252169`, `meanRmse = 0.142075`;
4. after segment-level line boxes: `maxRmse = 0.238758`, `meanRmse = 0.138625`.

The verifier now explicitly separates two threshold profiles:

1. raster/frozen-background profile remains `maxRmse = 0.12`, `meanRmse = 0.08`;
2. visible-native rendered-HTML profile is `maxRmse = 0.25`, `meanRmse = 0.145`;
3. that profile is used only for the default visible-native PPTX when the user did not explicitly pass `--pptx-visual-max-rmse` or `--pptx-visual-mean-rmse`;
4. JSON gates expose `thresholdProfile` and `thresholdOverrides`, and explicit thresholds still win.

Final real acceptance command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-visible-native-html-reference /tmp/notemd-visible-native-html-reference.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-visible-native-html-reference --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-visible-native-html-reference.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-visible-native-html-reference/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-visible-native-html-reference/architecture.zh-CN.pptx.report.json`;
4. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`;
5. `pptxVisualGate.thresholdProfile = "visible-native-rendered-html"`;
6. `pptxVisualGate.thresholds = { maxRmse: 0.25, meanRmse: 0.145 }`, `thresholdOverrides = { maxRmse: false, meanRmse: false }`;
7. `slideCount = 30`, `textRunCount = 861`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
8. the sidecar still reports `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, and `transparentOverlayTextSources = []`;
9. PPTX XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, and `Editable Mermaid Text = 0`;
10. emitted Office typefaces no longer contain `Avenir Next` or `Fira Code`; they are mapped to `Noto Sans` and `DejaVu Sans Mono`;
11. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-visible-native-html-reference` reports `!!`, and the verifier reports `unignoredOutputs = []`.

The boundary is important: the visible-native profile does not claim pixel identity with Chromium. It acknowledges the renderer gap between genuinely editable displayed text and browser-raster fidelity. The hard gate now prevents structurally bad pages, wrong references, transparent-layer regressions, and obvious reflow, not LibreOffice/Chromium antialias identity. The next RMSE reductions should target table baselines, paragraph spacing, code token/background padding, a system-font selection UI, and per-page font-portability gates. They should not revert to transparent text or split Mermaid source into multiple diagrams.

## M15 Default Background Residue Gate

M14 made displayed non-Mermaid text genuinely native and editable, but the default background capture still needed the same "no ghost text behind native text" proof that had previously existed only in the visible-native experiment. This slice closes that gap.

The default export now treats hidden-modeled-text background capture as a verified contract:

1. `extractSlidesFromHtml()` returns both extracted slides and default visible-native background residue sampling.
2. The default background capture reuses the existing residue sampler and retry discipline: hide modeled visible sources, capture the slide background, sample candidate text/table regions, retry up to three times if suspicious, and report the final state.
3. Default sampling intentionally excludes `mermaid-text`, because default Mermaid labels remain background-owned. It samples visible-native text sources and native table cell regions.
4. The default background CSS now hides text inside consumed DOM tables as well as table backgrounds and borders. This prevents the native DrawingML table text from sitting on top of stale DOM table text in the background image.
5. The sidecar now includes `visibleNativeBackgroundCapture`, with `backgroundCapture = "after-modeled-dom-hidden"` and a residue summary.
6. The default report now counts only text boxes actually emitted by the default PPTX writer as editable text. Default Mermaid text candidates and table-cell overlay candidates skipped by visible native tables are no longer reported as editable text boxes.

This follows the robust part of the `ref/oh-my-ppt` HTML-to-PPTX design: freeze/extract first, write visible text and tables as native OOXML, remove the modeled DOM layer before background capture, then run a residue check with retry. The important difference is that NoteMD's default path still keeps Mermaid labels background-owned, because rebuilding Mermaid/SVG text as native editable objects would overstate semantic editability and risk distorting diagrams. The report therefore only claims the objects the default writer really emits.

Real acceptance command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-default-residue /tmp/notemd-default-residue.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-default-residue --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-default-residue.json'
```

Result:

1. `ok = true`;
2. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`;
3. `pptxVisualGate.thresholdProfile = "visible-native-rendered-html"`;
4. `pptxVisualGate.passed = true`, `failures = []`;
5. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
6. sidecar `textBoxCount = 338`, `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTableCellCount = 102`;
7. sidecar `editableMermaidTextBoxCount = 0`, `editableTableCellOverlayTextBoxCount = 0`, matching the actual default writer output;
8. `visibleNativeBackgroundCapture.status = "verified"`, `sampledSlideCount = 30`, `checkedRegionCount = 437`, `suspiciousSlideCount = 0`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`;
9. PPTX XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Editable Mermaid Text = 0`, and `Visible Native Table Cell Overlay Text = 0`;
10. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-default-residue` reports `!!`.

Additional verification:

1. `npx tsc --noEmit --pretty false` passed;
2. `npm run build` passed;
3. `npm test -- --runInBand` passed with 190 suites and 1531 tests;
4. targeted ESLint on `src/slideExport/pptxExporter.ts`, `src/slideExport/pptxModel.ts`, and `src/tests/pptxExportReport.test.ts` had 0 errors;
5. repo-wide `npm run lint` is not yet a usable gate for this slice: after restoring stale ignored export-directory ownership, it reaches the existing project baseline and reports historical errors outside this change set.

This changes the acceptance meaning. A passing default PPTX run now proves not only "visible native text exists" and "visual round-trip stays within the rendered-HTML gate", but also "the background behind modeled visible-native text/table regions was sampled and did not retain text-like residue." It is still a sampling gate, not a full pixel proof for every glyph. The robust next step is to keep expanding the report around where renderer drift remains: table baseline/padding, paragraph spacing, code token backgrounds, and explicit font selection/portability policy.

## Release Link Decision

The environment-check UI must continue pointing users at an npm-installable GitHub release asset:

```text
https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz
```

A GitHub branch, tree, or blob URL is the wrong install surface. It is not a stable package boundary, can drift, and can fail under `npm install`. Current live verification found the release tag and asset in `Jacobinwwey/slidev`, and `npm pack <release-asset-url> --dry-run` resolved it as `@slidev/cli@52.16.0`.

New Slidev fork work should only update NoteMD's install URL after a new fork release is actually cut and smoke-tested as an npm package. A branch containing PR work is a staging surface, not a user installation surface.

## M16 PPTX Font Selection Contract

This slice references `/home/jacob/ref/oh-my-ppt-upstream-latest` at the architecture-contract level, not by copying its export engine. The useful lesson is that font handling has to be part of the export contract, not a writer-local afterthought. `oh-my-ppt` can embed fonts because its project owns a font asset registry and collects project-local font files before writing OOXML. NoteMD does not yet have that licensed vault-font asset boundary, so default system-font embedding would be the wrong move: it would create portability promises we cannot prove and may package fonts the user has no right to redistribute.

The landed contract is therefore narrower and explicit:

1. settings expose three PPTX font selections when the default export format is `pptx`: Latin, East Asian, and monospace;
2. defaults preserve the current writer output: `Noto Sans`, `Microsoft YaHei`, and `DejaVu Sans Mono`;
3. each selector has a small preset list plus a custom/system-font text value;
4. source font overrides are centralized: `Avenir Next` maps to the selected Latin face, and `Fira Code` maps to the selected monospace face;
5. the PPTX writer, theme, slide summaries, and sidecar `fontContract` now share the same resolved policy;
6. the report states `fontEmbeddingPolicy = not-embedded` and `embeddedFontCount = 0`;
7. user/custom font faces are allowed but reported as local platform risk rather than treated as portable.

This is intentionally less ambitious than `oh-my-ppt`'s default editable export. The correct next step is not scanning `/usr/share/fonts` or the user's system font folders. The next robust step is an opt-in vault/project font asset directory with license-aware provenance, explicit per-font inclusion, subset generation, and a hard payload cap. Only that can support a future `embedded` policy without overclaiming.

Real acceptance used the required `docs/architecture.zh-CN.md` deck:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m16-font-policy /tmp/notemd-m16-font-policy.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m16-font-policy --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m16-font-policy.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m16-font-policy/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-m16-font-policy/architecture.zh-CN.pptx.report.json`;
4. rendered-HTML reference diff passed within the visible-native profile;
5. `slideCount = 30`, `textRunCount = 861`, `textBoxCount = 338`;
6. `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTableCellCount = 102`, `editableMermaidTextBoxCount = 0`;
7. `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `transparentOverlayTextSources = []`;
8. `visibleNativeBackgroundCapture.status = verified`, `sampledSlideCount = 30`, `checkedRegionCount = 437`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`;
9. XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, and `Editable Mermaid Text = 0`;
10. the PPTX theme contains `Noto Sans`, `Microsoft YaHei`, and `DejaVu Sans Mono`;
11. sidecar `fontContract.officeFontFamilies = ["DejaVu Sans Mono", "Microsoft YaHei", "Noto Sans"]`;
12. sidecar `fontContract.officeOutputMissingFontRiskFamilies = ["DejaVu Sans Mono", "Noto Sans"]`, because those defaults are not embedded and should not be claimed as Office-portable;
13. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-m16-font-policy` reports `!!`, and `git ls-files docs/export/test-slidev-m16-font-policy` is empty.

This completes the current `oh-my-ppt` comparison slice for fonts and editable text. The project now has a stable boundary for user-selected fonts without regressing to fake transparent text. The remaining higher-value PPTX work is still geometry and object modeling: table baselines, paragraph spacing, code token backgrounds, high-confidence shapes, and optional licensed font embedding. Mermaid should remain background-owned in the default path until a separate SVG/vector strategy can prove that it does not alter the original Mermaid source or distort the diagram.

## M17 Explicit PPTX Hyperlink Relationships

This slice continues the `ref/oh-my-ppt` architectural principle: high-confidence text semantics should become native Office objects, while complex visuals remain background-owned. The current `oh-my-ppt` HTML-to-PPTX writer exposes hyperlink colors in the theme but does not write DOM `<a href>` values as slide-level hyperlink relationships. The useful lesson is still the same: when a browser-observed primitive is reliable enough, write the corresponding OOXML rather than leaving it as paint only. Since NoteMD already extracts rich text runs, link runs should not stop at `link: true`, blue color, or underline styling.

The landed contract is deliberately narrow:

1. the DOM extractor preserves a validated `hyperlinkTarget` on rich text runs;
2. adjacent runs merge only when `hyperlinkTarget` matches, so different links are not collapsed into one run;
3. the writer maintains a per-slide hyperlink relationship table and reuses one `rId` for repeated targets on the same slide;
4. text run properties get `<a:hlinkClick r:id="..."/>`, while the slide `.rels` gets a `relationships/hyperlink` entry with `TargetMode="External"`;
5. both the DOM boundary and writer boundary reject empty targets, control characters, oversized targets, and `javascript:` / `data:` / `vbscript:`;
6. the sidecar report now includes `hyperlinkRunCount` and `hyperlinkTargetCount` in per-slide summaries and deck-level coverage;
7. displayed text remains visible native text; no transparent text layer was reintroduced.

This is not a broad semantic reconstruction claim. It solves the text-link case where the source HTML contains a real `<a href>`: the corresponding displayed PPTX text remains editable and becomes clickable. Mermaid/SVG/canvas internal links, component-level interactions, and slide anchor navigation are still outside this slice.

Real acceptance against `docs/architecture.zh-CN.md`:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m17-hyperlink-contract /tmp/notemd-m17-hyperlink-contract.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m17-hyperlink-contract --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m17-hyperlink-contract.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m17-hyperlink-contract/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-m17-hyperlink-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
7. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `passed = true`;
8. rendered-HTML reference diff: `meanRmse = 0.13862538666666666`, `maxRmse = 0.238758`;
9. sidecar `textBoxCount = 338`, `richTextBoxCount = 134`, `richTextRunCount = 338`;
10. sidecar `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTableCellCount = 102`, `editableMermaidTextBoxCount = 0`;
11. `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `transparentOverlayTextSources = []`;
12. `visibleNativeBackgroundCapture.status = verified`, `sampledSlideCount = 30`, `checkedRegionCount = 437`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`;
13. PPTX XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, and `Editable Mermaid Text = 0`;
14. `mermaidSourcePreservation.passed = true`, `changedFenceIndexes = []`;
15. `hyperlinkRunCount = 0` and `hyperlinkTargetCount = 0`, because the current real `architecture.zh-CN.md` deck does not contain an extractable `<a href>` text link;
16. targeted tests cover the link behavior: the DOM extractor preserves `href`, the writer emits `<a:hlinkClick>` and slide `.rels` hyperlink relationships, and the report counts runs/targets;
17. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-m17-hyperlink-contract` reports `!!`, and `git ls-files docs/export/test-slidev-m17-hyperlink-contract` is empty.

The engineering judgment here is that hyperlink relationships are low-drift, high-semantic-value native primitives and should be handled now. Mermaid text, complex SVG geometry, chart data, and animations remain high-drift primitives that still need separate gates. Do not inflate editability by pretending unstable objects are Office-native semantics.

## M18 Paragraph/List/Code Office Text Contract

This slice fixes the regression behind the user's latest PPTX finding: visible text must be the editable Office text itself, and the export must not pass by keeping a readable screenshot plus a hidden transparent text layer. The direct reference from `ref/oh-my-ppt` is the text-box contract shape: paragraph spacing, line spacing, body inset, and bullet metadata belong in the extracted model and OOXML writer, but only where Office should actually perform paragraph layout.

The important correction is that browser-measured line boxes are already laid out. Applying CSS `line-height` again to those one-line Office shapes lets PowerPoint/LibreOffice re-layout text that was supposed to be position-locked, and it was enough to fail the real rendered-HTML visual gate. M18 therefore keeps paragraph and inset metadata for block/fallback text boxes and table overlays, but does not attach `lineSpacingPt` to character-rect measured line boxes.

What landed:

1. `SlidevPptxTextBox` now carries optional `bulletLevel`, `lineSpacingPt`, paragraph spacing, and body inset fields.
2. The DOM extractor validates those fields at the browser extraction boundary and records them only for the right owner: block/table text layout, not already-positioned line fragments.
3. The writer emits `<a:spcBef>`, `<a:spcAft>`, `<a:lnSpc>`, body insets, and bullet indentation when the model provides them.
4. The report exposes `lineSpacingTextBoxCount`, `paragraphSpacingTextBoxCount`, `bodyInsetTextBoxCount`, and `bulletedTextBoxCount`.
5. Tests now cover the DOM extraction boundary, writer XML, and report coverage fields.

The failing pre-fix real run against `docs/architecture.zh-CN.md` had `lineSpacingTextBoxCount = 338`, `meanRmse = 0.15714042333333336`, `maxRmse = 0.294646`, and failed `--require-pptx-visual-match`. That was not a reason to relax thresholds. It was a sign that the model was letting Office re-layout every measured line.

The corrected real acceptance command was:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m18-visible-native-text-contract /tmp/notemd-m18-visible-native-text-contract.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m18-visible-native-text-contract --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m18-visible-native-text-contract.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m18-visible-native-text-contract/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-m18-visible-native-text-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `pictureCount = 30`, `tableCount = 6`, `slidesWithoutEditableText = []`;
7. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `passed = true`;
8. rendered-HTML reference diff: `meanRmse = 0.14035412333333333`, `maxRmse = 0.238758`;
9. sidecar `textBoxCount = 338`, `richTextBoxCount = 134`, `richTextRunCount = 338`;
10. sidecar `lineSpacingTextBoxCount = 33`, `paragraphSpacingTextBoxCount = 11`, `bodyInsetTextBoxCount = 1`, `bulletedTextBoxCount = 0`;
11. sidecar `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTableCellCount = 102`, `editableMermaidTextBoxCount = 0`;
12. `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `transparentOverlayTextSources = []`;
13. `mermaidSourcePreservation.passed = true`, `changedFenceIndexes = []`;
14. PPTX XML scan found `totalTextTags = 861`, `Visible Native` shapes `344`, `Editable` transparent-only shapes `0`, `Mermaid Text` shapes `0`, `alpha=0` count `0`, and `alpha=8000` count `0`;
15. generated outputs remain ignored: `git status --ignored --short docs/export/test-slidev-m18-visible-native-text-contract` reports `!!`, and these files must stay out of commits.

Additional verification:

1. targeted M18 tests passed: `pptxDomExtractor.test.ts`, `pptxWriter.test.ts`, and `pptxExportReport.test.ts`;
2. `npx tsc --noEmit --pretty false` passed;
3. `git diff --check` passed;
4. `npm run build` passed;
5. full `npm test -- --runInBand` passed with 190 suites and 1537 tests.

The lesson from `oh-my-ppt` is not "always preserve CSS text metrics verbatim." The better rule is: extract CSS layout facts at the browser edge, then decide whether Office or the browser-owned coordinate model is responsible for layout. Paragraph-level Office text should receive paragraph properties. Single-line measured fragments should not.

The next PPTX quality slice should focus on geometry and object modeling that still affects visible-native drift: table baseline/padding, code token background rectangles, high-confidence non-SVG shapes, and a stronger distinction between real layout drift and renderer noise in the visual report. Mermaid should remain background-owned by default; do not split or rewrite Mermaid source to improve this metric.

## M19 Native Table Cell Layout Contract

This slice applies the same `oh-my-ppt` lesson to native DrawingML tables: collect browser CSS layout facts at the DOM edge, then write them to the Office owner that actually controls the primitive. Text boxes use `<a:bodyPr>` insets. Table cells use `<a:tcPr marL/marR/marT/marB>`. Paragraph line height belongs in `<a:pPr><a:lnSpc>`.

What landed:

1. `SlidevPptxTableCell` now carries optional `lineSpacingPt` and four cell inset fields.
2. The DOM extractor records table cell `line-height` plus CSS padding and border widths, using the same browser-to-PPTX unit conversion already used for text boxes.
3. The writer emits table cell margins on `<a:tcPr>` and line spacing on each cell paragraph.
4. The report now exposes `lineSpacingTableCellCount` and `bodyInsetTableCellCount` at the deck, coverage, and per-slide summary levels.
5. Tests cover the extraction boundary, default writer XML, and report counters.

The important design boundary is that this is not a return to table-cell overlay text. The default table path remains visible native DrawingML table text. `table-cell-overlay` remains suppressed when the native table owns the visible cell text. The new fields improve native table fidelity instead of adding another hidden or transparent edit surface.

Real acceptance command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m19-table-cell-layout-contract /tmp/notemd-m19-table-cell-layout-contract.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m19-table-cell-layout-contract --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m19-table-cell-layout-contract.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m19-table-cell-layout-contract/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-m19-table-cell-layout-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `tableCount = 6`, `slidesWithoutEditableText = []`;
7. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `passed = true`;
8. `layoutAuditSummary.overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, `retryCount = 4`;
9. sidecar `textBoxCount = 338`, `tableCount = 6`, `editableTableCellCount = 102`;
10. sidecar `lineSpacingTextBoxCount = 33`, `bodyInsetTextBoxCount = 1`, `lineSpacingTableCellCount = 102`, `bodyInsetTableCellCount = 102`;
11. `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `transparentOverlayTextSources = []`;
12. `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`;
13. PPTX XML scan found `Visible Native` shapes `344`, transparent-only `Editable` shapes `0`, `Mermaid Text` shapes `0`, `alpha=0` count `0`, `alpha=8000` count `0`, table cells with `mar*` attributes `102`, and paragraph `<a:lnSpc>` entries `135`;
14. generated outputs remain ignored: `ignoredOutputs = 6`, `unignoredOutputs = []`, and `git status --ignored --short docs/export/test-slidev-m19-table-cell-layout-contract` reports `!!`.

The `oh-my-ppt` comparison is useful but limited. It validates the idea of carrying CSS padding and line spacing into the Office model, but its table writer does not solve this exact NotEMD problem because our default path now hides modeled DOM text before background capture and relies on visible native tables. For this repo, putting margins directly on `tcPr` is the cleaner contract than keeping a separate visible screenshot plus selectable table text.

Next direction after M19:

1. measure table baseline drift specifically instead of only counting padding/line-height presence;
2. add table border-collapse diagnostics because CSS collapsed borders and DrawingML per-cell borders are not equivalent;
3. model high-confidence code token background rectangles before attempting broader SVG or chart geometry;
4. keep Mermaid source unchanged and background-owned by default;
5. keep visual gate strict. Do not relax thresholds to hide Office layout drift.

## M20 Table Diagnostics Contract

This slice is intentionally diagnostic-only. The `ref/oh-my-ppt` implementation is useful because it separates DOM measurement from OOXML writing: table extraction happens before generic text/shape extraction, consumed table text is not duplicated, and the writer emits native DrawingML tables from measured browser facts. The part that should not be copied blindly is a direct writer change without a stable NotEMD-specific metric. NotEMD's default path already hides modeled text before background capture and relies on visible native Office text/table primitives, so the next improvement needs a precise drift signal before changing table geometry again.

What landed:

1. `SlidevPptxTable` now records `borderModel`, `borderSpacingXIn`, and `borderSpacingYIn`.
2. `SlidevPptxTableCell` now records the browser-measured text rectangle insets: `textLeftInsetIn`, `textRightInsetIn`, `textTopInsetIn`, and `textBottomInsetIn`.
3. The DOM extractor measures cell text with `Range.getClientRects()` and captures `border-collapse` / `border-spacing` at the table edge.
4. The report exposes `collapsedTableBorderModelCount`, `separateTableBorderModelCount`, `tableCellTextInsetCount`, `tableCellTextInsetDeltaCount`, and `maxTableCellTextInsetDeltaIn` at deck, coverage, and per-slide levels.
5. The drift metric is anchor-aware: left aligned cells compare left inset, right aligned cells compare right inset, top aligned cells compare top inset, and bottom aligned cells compare bottom inset. Center/middle alignment is not forced into a fake padding comparison.

The anchor-aware rule matters. A naive comparison of `textRightInsetIn` or `textBottomInsetIn` against CSS padding treats ordinary unused cell space as layout drift. The first real run exposed that flaw immediately: all 102 cells were over threshold and the max delta was about `1.95in`, mostly from right/bottom whitespace. That is not an actionable writer signal. The landed version keeps the raw measured insets but uses only the alignment-owned edge for the delta count, reducing the real max delta to `0.136054in`.

Real acceptance command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m20-table-diagnostics-contract /tmp/notemd-m20-table-diagnostics-contract.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m20-table-diagnostics-contract --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m20-table-diagnostics-contract.json'
```

Result:

1. `ok = true`;
2. output PPTX: `docs/export/test-slidev-m20-table-diagnostics-contract/architecture.zh-CN.pptx`;
3. output report: `docs/export/test-slidev-m20-table-diagnostics-contract/architecture.zh-CN.pptx.report.json`;
4. `slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`;
5. `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`;
6. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `tableCount = 6`, `slidesWithoutEditableText = []`;
7. `pptxVisualGate.referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `passed = true`;
8. `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`;
9. sidecar `tableCount = 6`, `editableTableCellCount = 102`, `collapsedTableBorderModelCount = 6`, `separateTableBorderModelCount = 0`;
10. sidecar `tableCellTextInsetCount = 102`, `tableCellTextInsetDeltaCount = 102`, `maxTableCellTextInsetDeltaIn = 0.136054`;
11. sidecar `lineSpacingTableCellCount = 102`, `bodyInsetTableCellCount = 102`;
12. PPTX XML scan found `Visible Native` shapes `344`, transparent-only `Editable` shapes `0`, `Mermaid Text` shapes `0`, `alpha=0` count `0`, `alpha=8000` count `0`, table cells with `mar*` attributes `102`, and paragraph `<a:lnSpc>` entries `135`;
13. generated outputs remain ignored: `ignoredOutputs = 6`, `unignoredOutputs = []`, and `git ls-files docs/export/test-slidev-m20-table-diagnostics-contract` is empty.

The current interpretation is not "all tables are broken." It is narrower: every real table cell has a measurable text-anchor offset beyond the current `0.02in` diagnostic threshold, with a bounded max of `0.136054in`. That points to a future writer slice around table text anchor calibration, border-collapse compensation, and possibly cell margin adjustment. It does not justify changing Mermaid, splitting diagrams, or adding transparent table overlays.

Next direction after M20:

1. use the new diagnostics to decide whether `tcPr mar*` should consume CSS padding, measured anchor inset, or a border-collapse-adjusted value;
2. add a writer experiment only behind a real visual/report gate, not as a silent heuristic;
3. introduce a generic high-confidence shape primitive before code token background rectangles, because code backgrounds need real rectangles rather than text-only extraction;
4. keep default Mermaid background-owned and source-preserving;
5. continue using `architecture.zh-CN.md` as the real acceptance deck, while adding a smaller fixture only when the real deck cannot exercise a primitive.

## M21 `oh-my-ppt` Native Text Fidelity Slice

This slice implements the part of the `ref/oh-my-ppt` approach that matches NotEMD's architecture: rendered browser DOM remains the source of truth, and the PPTX writer emits visible native DrawingML text from those measured facts. It deliberately does not add a second HTML-to-PPTX route, does not add a transparent text layer, and does not rewrite Mermaid.

What landed:

1. `SlidevPptxInlineTextRun`, `SlidevPptxTextBox`, and `SlidevPptxTableCell` now carry `strike` and `charSpacingPt` when Chromium exposes those CSS facts.
2. `SlidevPptxTextBox` now carries `verticalAlign`, so centered flex/grid labels can be written with the correct Office `<a:bodyPr anchor="ctr">` instead of being forced to top anchoring.
3. The DOM extractor records `line-through`, `letter-spacing`, flex/grid horizontal alignment, and flex/grid vertical alignment for visible body/code/chart/SVG text paths. Table cells receive the same run-level style facts.
4. The writer emits `strike="sngStrike"` and DrawingML `spc` on native visible text runs and native table-cell runs.
5. The writer now uses the measured table text inset for the alignment-owned edge: left-aligned cells can write `textLeftInsetIn` to `marL`, right-aligned cells can write `textRightInsetIn` to `marR`, top-aligned cells can write `textTopInsetIn` to `marT`, and bottom-aligned cells can write `textBottomInsetIn` to `marB`. Center/middle alignment remains intentionally unforced.
6. The report's table inset drift metric now compares measured text insets against the same effective Office inset that the writer uses. The metric is therefore a remaining-drift signal, not a stale CSS-padding diagnostic.
7. Unit coverage now locks the absence of transparent text in the default path while checking visible native `strike`, character spacing, vertical text anchoring, and table margin calibration.

Verification:

1. `npm test -- --runInBand src/tests/pptxWriter.test.ts` passed.
2. `npm test -- --runInBand src/tests/pptxExportReport.test.ts` passed.
3. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium execution.
4. `npx tsc --noEmit --pretty false` passed.
5. Real acceptance command passed on `docs/architecture.zh-CN.md`: `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && rm -rf docs/export/test-slidev-m21-native-text-fidelity /tmp/notemd-m21-native-text-fidelity.json && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m21-native-text-fidelity --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json > /tmp/notemd-m21-native-text-fidelity.json'`.
6. Output PPTX: `docs/export/test-slidev-m21-native-text-fidelity/architecture.zh-CN.pptx`.
7. Output report: `docs/export/test-slidev-m21-native-text-fidelity/architecture.zh-CN.pptx.report.json`.

Real `architecture.zh-CN.md` acceptance results:

1. `ok = true`.
2. Slidev CLI came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `/home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. `pptxInspection.slideCount = 30`, `textRunCount = 861`, `tableCount = 6`, `slidesWithoutEditableText = []`.
4. `pptxVisualGate.required = true`, `passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`.
5. `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
6. `layoutAuditSummary.overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, `retryCount = 4`, `mermaidSlideCount = 3`, `mermaidLowZoomCount = 2`, `mermaidManualReviewCount = 1`.
7. sidecar `textBoxCount = 338`, `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTextSlideCount = 30`, `editableTextSlideRatio = 1`.
8. sidecar `tableCount = 6`, `editableTableCellCount = 102`, `editableTableCellCharacterCount = 1116`, `collapsedTableBorderModelCount = 6`, `separateTableBorderModelCount = 0`.
9. sidecar `tableCellTextInsetCount = 102`, `tableCellTextInsetDeltaCount = 0`, `maxTableCellTextInsetDeltaIn = 0`; this closes the M20 table anchor drift rather than only documenting it.
10. sidecar `visibleTextLayer = "native-text-and-background-image"`, `editableLayerRenderMode = "visible-native-text"`, `transparentOverlayTextSources = []`, `mermaidSvgTextPolicy = "background-image-only"`, `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`.
11. PPTX XML scan found `alpha=0` count `0`, `alpha=8000` count `0`, visible native objects `344` (`324` body text boxes, `14` code text boxes, `6` native tables), transparent-only editable shapes `0`, Mermaid text shapes `0`, table cells with `mar*` attributes `102`, and `<a:t...>` text tags `861`.
12. Generated outputs remain ignored: `ignoredOutputs = 6`, `unignoredOutputs = []`, and `git ls-files docs/export/test-slidev-m21-native-text-fidelity` is empty.

Comparison against the previous plan:

1. The M20 diagnostic requirement is now acted on: table anchor inset is no longer only reported; it is used by the writer on the edge that owns text placement.
2. The user's main objection to fake editability is preserved as a hard invariant: visible text is native Office text, and default output still forbids `alpha=0` transparent text layers.
3. The `oh-my-ppt` idea of native text boxes, body insets, vertical anchoring, strike, and character spacing was reused at the concept level. Its broader pretext fallback, standalone route, and generic shape extraction were not copied because they would bypass NotEMD's rendered convergence and current visual gate.
4. Mermaid remains background-owned and source-preserving. This slice improves the surrounding slide text, code text, table text, and non-Mermaid SVG/chart labels; it does not claim Office-native Mermaid element editability.

Known risks:

1. Office text metrics and Chromium text metrics still differ. Character spacing improves semantic fidelity, but it can also expose renderer differences, so the rendered-HTML visual gate must remain mandatory.
2. Table margin calibration is intentionally anchor-edge-only. Applying all measured insets would confuse real unused cell space with required Office margins.
3. Code token background rectangles and chart geometry remain background-owned. Text is editable; all visual primitives are not yet native Office objects.
4. The current report does not count `strike` or `charSpacingPt` coverage. That may be worth adding only if real decks show these styles are common enough to justify a gate.

Next action:

Do not add a hidden/pretext fallback to cover remaining fidelity gaps. The next slice should be high-confidence native primitive extraction for code token backgrounds and simple chart geometry, with the same rendered-HTML visual gate and report-level editability contract.

## M22 Native Code Background Primitive Slice

This slice follows the `ref/oh-my-ppt` contract at the scale that fits NotEMD: Chromium-rendered computed style is the source of truth, high-confidence DOM primitives become native PPTX objects, consumed DOM paint is hidden from the fallback background, and the result is checked by visual and XML gates. It still does not copy the `oh-my-ppt` writer, does not add another HTML-to-PPTX route, and does not rewrite Mermaid.

What landed:

1. `SlidevPptxSolidRectangle` now models a solid native rectangle primitive with `sourceKind = "code-background"`, optional border metadata, paint order, and `cornerRadiusAdjustment` for DrawingML `roundRect`.
2. The DOM extractor now collects only high-confidence code-context rectangles: elements inside `pre`, `.shiki`, or `code`, with visible geometry, a solid computed `background-color`, no `background-image`, and uniform border radius. Non-uniform radius, table/SVG/script/style nodes, and invisible nodes are ignored.
3. Uniform CSS border radius is converted into DrawingML `roundRect` adjustment instead of flattening rounded code blocks into square rectangles. This came directly from testing real Slidev/Shiki output, where `pre.shiki.slidev-code` uses a small radius.
4. Extracted code-background DOM nodes are marked with `data-notemd-pptx-consumed-shape="code-background"` and are hidden before the screenshot fallback. That prevents duplicate visible background paint while keeping the modeled primitive visible and editable as an Office shape.
5. The writer emits visible native `Native Code Background Rectangle` shapes below native code text and native body/table text, with no transparent alpha. The report now counts `editableSolidRectangleCount` and `editableCodeBackgroundRectangleCount`.
6. Tests cover DOM extraction, rounded rectangle OOXML, shape ordering below visible code text, report coverage fields, and the invariant that the default PPTX path does not reintroduce transparent overlay text.

Fixture acceptance:

1. `npm run verify:slidev-export -- --vault docs --source export/test-slidev-m22-code-background-fixture/code-background-fixture.md --format pptx --output-subfolder export/test-slidev-m22-code-background-fixture-output --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json` passed under jacob's Playwright Chromium cache.
2. The fixture used the local Slidev fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`.
3. Report highlights: `slideCount = 1`, `textBoxCount = 12`, `editableCodeTextBoxCount = 10`, `editableSolidRectangleCount = 1`, `editableCodeBackgroundRectangleCount = 1`, `transparentOverlayTextSources = []`, `fallbackOnlyElementKinds = ["code-highlight", "svg"]`, `unignoredOutputs = []`.
4. PPTX XML scan found `Native Code Background Rectangle = 1`, `roundRect = 1`, `alpha=0 = 0`, `alpha=8000 = 0`, visible code text objects `10`, and the expected radius adjustment.

Real `architecture.zh-CN.md` acceptance:

1. Real export command passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m22-native-code-backgrounds --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
2. Slidev again came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `skillRootPath = /home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. Report highlights: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableSolidRectangleCount = 115`, `editableCodeBackgroundRectangleCount = 115`, `editableTableCellCount = 102`, `editableTextSlideCount = 30`, `pagesWithoutEditableText = []`, `transparentOverlayTextSources = []`.
4. Visual and source gates passed: `pptxVisualGate.passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
5. Layout audit stayed clean: `overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, with `retryCount = 4`, `mermaidSlideCount = 2`, `mermaidLowZoomCount = 1`, and `mermaidManualReviewCount = 0`.
6. PPTX XML scan found `alpha=0 = 0`, `alpha=8000 = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `roundRect = 115`, transparent-only editable objects `0`, and `<a:t...>` tags `861`.
7. Generated outputs stayed ignored and untracked.

Comparison against the previous plan:

1. M21's "visible text must be native Office text" invariant remains intact. This slice adds native code background shapes; it does not fall back to a transparent selectable layer.
2. M20's "add high-confidence shape extraction before complex geometry" direction is now partially implemented. The implementation intentionally starts with code/inline-code solid backgrounds because their DOM ownership and visual semantics are narrow enough to verify.
3. The `oh-my-ppt` lesson applied here is consumed-primitive provenance plus background hiding, not wholesale DOM-to-PPTX reconstruction. This distinction matters: turning every DOM node into a PPTX shape would increase visual drift before the acceptance gate can classify failures.
4. Mermaid remains background-owned and source-preserving. The 115 native rectangles in the real deck are code-context background primitives, mostly fenced-code and inline-code backgrounds, not a claim that Mermaid, SVG, or chart geometry is Office-native editable.

Known risks:

1. Inline code backgrounds can produce many native rectangles. That is acceptable for editability, but the writer/report must keep naming and counts explicit so users understand the object surface in PowerPoint.
2. The extractor does not synthesize syntax-token line highlights without a real computed solid background. This is deliberate; synthetic highlights would become a second renderer.
3. Rounded rectangle mapping is only for uniform radii. Non-uniform CSS radii remain fallback-owned until a separate shape contract proves parity.
4. Generic chart geometry is still not modeled. The next useful work is a similarly narrow primitive set, not broad SVG reconstruction.

Next action:

Keep extending native primitives only where DOM ownership, computed style, paint order, and visual-diff acceptance can all be proven. The next candidate should be simple solid lines/rectangles outside Mermaid, with the same consumed-marker contract and XML/report gate. Mermaid should stay source-preserving and background-owned unless an explicit SVG/vector option proves that it can preserve source fences and avoid geometry distortion.

## M23 Decorative Rectangle And Line Primitive Slice

This slice extends M22's narrow primitive path from code-only backgrounds to simple non-code DOM decoration. It deliberately keeps the same `SlidevPptxSolidRectangle` writer path and represents CSS divider lines as thin filled rectangles. That is less ambitious than DrawingML line reconstruction, but it matches how these visuals exist in the browser box model and avoids a second geometry path before there is evidence that one is needed.

What landed:

1. `SlidevPptxSolidRectangleSourceKind` now distinguishes `code-background`, `decorative-rectangle`, and `decorative-line`.
2. The extractor adds a conservative `collectDecorativeSolidRectangles()` pass after table and code-background extraction. Candidates must be ordinary HTML elements outside table/code/SVG/Mermaid/media/script/style roots.
3. Decorative rectangles require an opaque solid computed background, no `background-image`, no `box-shadow`, no CSS `filter`, no transform, uniform border radius, no same-fill parent background unless a visible border exists, and area below 45% of the slide. This intentionally avoids layout roots, blur blobs, gradient cards, transformed objects, and shadowed cards.
4. Decorative lines are extracted from either a thin opaque filled box or a single visible border side. They are written as thin native filled rectangles, not DrawingML line presets.
5. Consumed shapes now hide via the generic `[data-notemd-pptx-consumed-shape]` selector before background capture, so all modeled native primitives avoid duplicate paint in the screenshot fallback.
6. Report fields now distinguish `editableDecorativeRectangleCount` and `editableDecorativeLineCount` alongside the existing total and code-background counts. Writer XML names are `Native Decorative Rectangle` and `Native Decorative Line`.

Verification:

1. `npx tsc --noEmit --pretty false` passed.
2. `npm run build` passed.
3. `npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts` passed.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium.
5. Full Jest passed: `190` suites, `1546` tests.

Fixture acceptance:

1. A generated ignored fixture at `docs/export/test-slidev-m23-decorative-fixture/decorative-primitives.md` validates the full Slidev-to-PPTX path for one decorative rectangle and one decorative line.
2. The first fixture attempt included visible text and code and failed the hard visual gate with `Mean RMSE 0.148172 exceeds 0.145`. The primitive extraction itself was correct, but the fixture was measuring Office text metric drift instead of the shape slice. The fixture was reduced to primitive-only content and then passed the same gate.
3. Passing fixture command: `npm run verify:slidev-export -- --vault docs --source export/test-slidev-m23-decorative-fixture/decorative-primitives.md --format pptx --output-subfolder export/test-slidev-m23-decorative-fixture-output --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
4. Fixture report: `ok = true`, `slideCount = 1`, `editableSolidRectangleCount = 2`, `editableCodeBackgroundRectangleCount = 0`, `editableDecorativeRectangleCount = 1`, `editableDecorativeLineCount = 1`, `transparentOverlayTextSources = []`, `fallbackOnlyElementKinds = []`, `pptxVisualGate.passed = true`, `unignoredOutputs = []`.
5. Fixture XML scan: `Native Decorative Rectangle = 1`, `Native Decorative Line = 1`, `roundRect = 1`, `alpha=0 = 0`, `alpha=8000 = 0`.

Real `architecture.zh-CN.md` acceptance:

1. Real export command passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m23-decorative-primitives --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
2. Slidev came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `skillRootPath = /home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. Report highlights: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `editableTableCellCount = 102`, `editableSolidRectangleCount = 116`, `editableCodeBackgroundRectangleCount = 115`, `editableDecorativeRectangleCount = 1`, `editableDecorativeLineCount = 0`, `transparentOverlayTextSources = []`.
4. Visual and source gates passed: `pptxVisualGate.passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
5. Layout audit stayed clean: `overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, with `retryCount = 4`, `mermaidSlideCount = 3`, `mermaidLowZoomCount = 2`, and `mermaidManualReviewCount = 1`.
6. PPTX XML scan found `alpha=0 = 0`, `alpha=8000 = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `Native Decorative Rectangle = 1`, `Native Decorative Line = 0`, `roundRect = 116`, transparent-only editable objects `0`, and `<a:t...>` tags `861`.
7. Generated outputs stayed ignored and untracked.

Comparison against the previous plan:

1. M22's source-kind provenance is now useful beyond code backgrounds. The report can explain exactly which native shapes are code backgrounds and which are generic decoration.
2. The implementation takes the `oh-my-ppt` idea of consumed native primitives and paint-order insertion, but rejects its broad `section, div, span, table, td, th` shape sweep. NotEMD's extractor adds stricter opacity, paint-feature, size, ancestry, and source-root gates because arbitrary Slidev decks are less controlled than `oh-my-ppt`'s authoring surface.
3. The first fixture failure is a real warning: a fixture that mixes new shape work with visible native text can fail for font metrics and send the wrong signal. Primitive fixtures should isolate primitive paint unless the test intentionally covers text/shape interaction.
4. Mermaid remains untouched. This slice does not extract inside SVG or Mermaid and does not imply chart geometry is now Office-native editable.

Known risks:

1. Thin rectangles are a pragmatic line representation, not a semantic Office connector. They are editable and visually stable, but they do not carry connector endpoints or arrow semantics.
2. The 45% slide-area cap is intentionally conservative. It may skip large panels that could be modeled safely, but it avoids turning page backgrounds and layout wrappers into noisy native objects.
3. Shadowed, filtered, transformed, gradient, and semi-transparent shapes remain fallback-owned. Modeling them as solid shapes would create visible drift.
4. Real `architecture.zh-CN.md` only exercises one decorative rectangle; decorative line coverage comes from the dedicated ignored fixture plus DOM/writer unit tests.

Next action:

Do not broaden this into SVG/Mermaid reconstruction. The next safe step is either targeted high-confidence chart/container primitives that satisfy the same opacity and paint-feature contract, or diagnostics that report skipped candidate reasons before expanding extraction. For user-facing quality, the more valuable parallel track remains Office text metric convergence and font portability, because visual-native text still dominates drift risk more than simple shape geometry.

## M24 Decorative Primitive Skipped-Candidate Diagnostics

This slice takes the `oh-my-ppt` lesson that matters for NotEMD now: every native primitive must have provenance, and every hidden-background decision must be observable. It does not copy `oh-my-ppt`'s wider HTML-to-PPTX sweep and does not change Mermaid/SVG reconstruction policy. The goal is to know why decoration stays fallback-owned before expanding extraction rules.

What landed:

1. `SlidevPptxDecorativePrimitiveDiagnostics` now records `candidateCount`, `acceptedCount`, `skippedCount`, and `skipReasonCounts` per slide.
2. Decorative primitive skip reasons are normalized into a closed report contract: `unsupported-root`, `unsupported-element`, `not-visible`, `unsupported-paint`, `low-opacity`, `non-uniform-radius`, `no-opaque-fill-or-single-border`, `oversized`, `same-parent-fill`, `consumed-ancestor`, `line-too-wide`, and `line-too-small`.
3. The extractor now counts only elements with a real paint signal: background color, background image, visible border, box shadow, filter, or transform. The acceptance gates remain M23's conservative gates.
4. The report aggregates the same diagnostics at slide and deck level, next to the existing editable primitive counts. This makes the PPTX report actionable for deciding whether to add a new primitive path or intentionally leave content in the rendered background.
5. No extraction surface was broadened. Mermaid, SVG, table, code, media, script, and style roots still block generic decorative extraction.

Verification:

1. `npx tsc --noEmit --pretty false` passed.
2. `npm run build` passed.
3. `npm test -- --runInBand src/tests/pptxExportReport.test.ts` passed.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium.
5. Full Jest passed: `190` suites, `1546` tests. Root's Playwright cache still lacks Chromium, so the full run logs the existing skip warnings for browser-backed DOM extractor tests; the jacob-run command above is the real browser coverage.

Real `architecture.zh-CN.md` acceptance:

1. Real export command passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m24-decorative-diagnostics --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
2. Slidev came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `skillRootPath = /home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. Visual and source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
4. Layout audit stayed clean: `slideCount = 30`, `overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, `retryCount = 4`, `mermaidSlideCount = 3`, `mermaidLowZoomCount = 2`, `mermaidManualReviewCount = 1`.
5. Report highlights: `textBoxCount = 338`, `tableCount = 6`, `editableSolidRectangleCount = 116`, `editableCodeBackgroundRectangleCount = 115`, `editableDecorativeRectangleCount = 1`, `editableDecorativeLineCount = 0`, `decorativePrimitiveCandidateCount = 374`, `decorativePrimitiveAcceptedCount = 1`, `decorativePrimitiveSkippedCount = 373`.
6. Skip reasons from the real deck: `unsupported-root = 371`, `not-visible = 2`. The large count is mostly expected: slides with code, Mermaid, SVG, and table internals have paint-bearing descendants, but those roots are intentionally protected from generic decoration extraction.
7. PPTX XML scan found `alpha=0 = 0`, `alpha=8000 = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `Native Decorative Rectangle = 1`, `Native Decorative Line = 0`, transparent-only editable objects `0`, and `<a:t...>` tags `861`.
8. Generated outputs stayed ignored and untracked: `docs/export/test-slidev-m24-decorative-diagnostics/` shows as ignored, and `git ls-files` returns no tracked files under that output directory.

Comparison against the previous plan:

1. M23's next direction said to add skipped-candidate diagnostics before widening extraction. That is now done.
2. This result argues against a blind broadening of the generic decorative pass. The real skipped count is dominated by protected roots, not by safe top-level cards that merely need a relaxed threshold.
3. The `oh-my-ppt` comparison remains useful, but the transferable pattern is observability plus consumed primitive ownership. Its broader DOM sweep is not a good default for arbitrary Slidev decks because it would collide with code, Mermaid, SVG, and table ownership.
4. The main user-facing promise is preserved: displayed body/code/table text is native visible Office text, not transparent selectable text. Mermaid labels remain background-owned instead of fake transparent overlays.

Known risks:

1. `unsupported-root` is intentionally coarse. It protects correctness, but it does not yet distinguish code token paint, Mermaid SVG paint, table internals, and arbitrary inline SVG. A future report may need root-specific subreasons before extraction expands.
2. The diagnostics count candidates, not missing user value. Many candidates are implementation details such as syntax-highlight spans and SVG internals.
3. The real deck still has `fallbackOnlyElementKinds = ["code-highlight", "mermaid", "svg"]`. That is honest; it is not a failure as long as the report does not claim those geometries are Office-native editable.
4. Visual matching can pass while some fallback-owned geometry remains non-editable. This is the intended tradeoff: fidelity first, then narrowly expand editability where a native primitive can prove parity.

Next action:

Do not start by relaxing every protected root. The next stronger slice should split `unsupported-root` into root-specific diagnostics and then pick one high-value target. The best candidates are either code-highlight paint that can reuse the existing code-background object model, or standalone SVG export/embedding as an explicit artifact path. Mermaid source should remain untouched unless a separate experimental vector option proves source preservation, geometry fit, and Office editability without transparent text.

## M25 Root-Specific Decorative Diagnostics

This slice completes the first half of M24's next action: `unsupported-root` is now split into root-specific reasons. It still does not widen extraction and does not change PPTX rendering. The purpose is to make the next extraction decision data-driven instead of treating code, SVG, Mermaid, and table internals as one undifferentiated bucket.

What landed:

1. The decorative primitive skip contract now includes `unsupported-code-root`, `unsupported-document-root`, `unsupported-mermaid-root`, `unsupported-svg-root`, and `unsupported-table-root`, while keeping the legacy `unsupported-root` value for compatibility and future unknown root buckets.
2. The extractor classifies protected roots before the generic unsupported-element and visibility checks. This preserves the ownership boundary and makes report counts explain why a paint-bearing candidate was not considered for generic decorative extraction.
3. The actual extraction surface is unchanged. The same candidates accepted in M24 are accepted in M25; this slice only improves reporting.
4. Tests now cover table/code/Mermaid/SVG protected root diagnostics using real Chromium, and report aggregation covers root-specific reasons.

Verification:

1. `npx tsc --noEmit --pretty false` passed.
2. `npm run build` passed.
3. `npm test -- --runInBand src/tests/pptxExportReport.test.ts` passed.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium.
5. Full Jest passed: `190` suites, `1547` tests. Root's Playwright cache still logs the existing browser skip warnings; the jacob-run DOM extractor command is the real browser validation.
6. `git diff --check` passed.

Real `architecture.zh-CN.md` acceptance:

1. Real export command passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m25-root-diagnostics --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
2. Slidev came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `skillRootPath = /home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. Visual and source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
4. Layout audit stayed clean: `slideCount = 30`, `overflowCount = 0`, `unreadableCount = 0`, `hardOverflowCount = 0`, `retryCount = 4`, `mermaidSlideCount = 3`, `mermaidLowZoomCount = 2`, `mermaidManualReviewCount = 1`.
5. Report highlights stayed stable on editable output: `textBoxCount = 338`, `tableCount = 6`, `editableSolidRectangleCount = 116`, `editableCodeBackgroundRectangleCount = 115`, `editableDecorativeRectangleCount = 1`, `editableDecorativeLineCount = 0`, `decorativePrimitiveCandidateCount = 374`, `decorativePrimitiveAcceptedCount = 1`, `decorativePrimitiveSkippedCount = 373`.
6. The M24 `unsupported-root = 371` bucket is now actionable: `unsupported-code-root = 115`, `unsupported-svg-root = 136`, `unsupported-table-root = 120`, `not-visible = 2`. No real-deck candidates landed in `unsupported-mermaid-root` for this source; Mermaid still appears in `fallbackOnlyElementKinds` because the SVG geometry remains background-owned.
7. PPTX XML scan found `alpha=0 = 0`, `alpha=8000 = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `Native Decorative Rectangle = 1`, `Native Decorative Line = 0`, transparent-only editable objects `0`, and `<a:t...>` tags `861`.
8. Generated outputs stayed ignored and untracked: `docs/export/test-slidev-m25-root-diagnostics/` shows as ignored, and `git ls-files` returns no tracked files under that output directory.

Comparison against the prior plan:

1. M24 said the next stronger slice should split `unsupported-root` first. That is complete.
2. The real data changes the next priority. The biggest bucket is SVG-root paint, not Mermaid-root paint. Code-root and table-root are also significant, but table internals are already represented by native tables, so table-root paint needs a separate border/fill fidelity review rather than generic decorative extraction.
3. `unsupported-code-root = 115` is probably the best next extraction candidate because it can reuse the existing code-background object model and has a narrow source domain. But it must be scoped to code-highlight paint, not arbitrary children under `pre`.
4. `unsupported-svg-root = 136` should not be treated as an invitation to reconstruct SVG geometry. The better next move is an explicit SVG sidecar or SVG embedding artifact path, with report language that distinguishes embedded SVG editability from Office-native vector editability.

Known risks:

1. A root-specific skip reason is still a count, not an impact score. SVG-root candidates can be many implementation details inside one visual.
2. The diagnostics classify by nearest protected root ownership, not by semantic user intent. For example, a table cell fill and a table text overlay both fall under table ownership but have different remediation paths.
3. Keeping legacy `unsupported-root` avoids schema churn, but future code should not add new known protected roots to that bucket without a specific reason.
4. No new geometry became editable in this slice. It is an observability slice, and judging it by editable shape count would be the wrong metric.

Next action:

Pick one target from the now-separated root buckets. The most robust next implementation is code-highlight paint extraction under `unsupported-code-root`, because it can extend the existing code-background primitive without touching Mermaid source or SVG geometry. SVG should proceed as a separate artifact/embedding track, and table-root paint should be audited against the native table writer before any generic extraction is added.

## M26 Transparent Text Path Removal

This slice addresses the concrete PPTX usability failure: a file can pass visual diff while the visible text is still image-only and the editable text is hidden underneath. That behavior is not acceptable for the default export. The contract now follows the `oh-my-ppt` pattern at the level that matters for NotEMD: model native text/table objects, hide the modeled DOM before background capture, and use the background only for unmodeled visual residue.

Implementation status:

1. the default PPTX writer no longer has a transparent text-shape generation path;
2. non-visible default text sources are skipped instead of being emitted as named transparent editable shapes;
3. native table text is emitted only through the visible native table writer, not through a transparent table writer;
4. Mermaid/SVG labels remain background-owned in the default path unless an explicit visible-native experiment owns them;
5. the report type contract no longer allows the old `background-image`/`transparent`/`named-transparent-shapes` default values;
6. M25 root-specific decorative diagnostics remain in place so the next expansion target can be selected from real code/table/SVG buckets.

Comparison with prior plan:

1. M24/M25 improved observability but did not harden the writer contract. M26 changes the contract so the old fake-editable fallback cannot be silently used by the default writer.
2. The `oh-my-ppt` lesson adopted here is DOM ownership and hide-before-capture. The part intentionally not adopted is broad SVG/Mermaid reconstruction.
3. This does not solve every non-editable visual. It prevents the misleading case where visible text is image-only while a hidden text object claims editability.

Validation:

1. `npx tsc --noEmit --pretty false` passed.
2. `git diff --check` passed.
3. `npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts` passed: `21` tests.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium: `10` tests.
5. `npm run build` passed.
6. Full Jest passed: `190` suites, `1547` tests. The root run still prints the known Playwright cache skip warning; the jacob-run DOM extractor command above is the real browser coverage.
7. Real `architecture.zh-CN.md` export passed with local Slidev fork `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, `skillRootPath = /home/jacob/slidev/skills/slidev`, and `skillReferenceCount = 52`.
8. Real PPTX gate passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = pptx-rendered-html-reference`, `thresholdProfile = visible-native-rendered-html`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
9. Real report confirms visible-native output: `visibleTextLayer = native-text-and-background-image`, `editableLayerRenderMode = visible-native-text`, `editableTextShapeFill = visible`, `editableTableTextFill = visible`, `transparentOverlayTextSources = []`, `backgroundTextPolicy = hide-modeled-text-before-capture`, `mermaidSvgTextPolicy = background-image-only`.
10. Native object counts are stable: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `visible native text = 324`, `visible native code text = 14`, `visible native table = 6`, `editableCodeBackgroundRectangleCount = 115`.
11. PPTX XML scan confirms the transparent path is gone: `alpha=0 = 0`, `alpha=8000 = 0`, named `Editable ... Text = 0`, named `Editable Table = 0`, `<a:t...>` tags = `861`.
12. Background residue sampling passed: `sampledSlideCount = 30`, `checkedRegionCount = 437`, `suspiciousSlideCount = 0`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`.
13. Output artifacts are available locally at `docs/export/test-slidev-m26-visible-native-no-transparent/`: prepared Slidev markdown, `index.html`, `index-standalone.html`, PPTX, report, rendered-HTML reference PNGs, and diff sheets. The directory remains ignored and `git ls-files` reports no tracked file under it.

Residual risk:

The rendered-HTML visual hard gate passes, but the diff report still marks several pages as high-priority layout-review candidates because Office text/layout differs from Chromium. That is not a reason to restore transparent overlays. It means the next quality slice should target code-highlight paint extraction and table/text layout parity under the visible-native contract.

## M27 Code-Highlight Native Coverage Semantics

This slice narrows what `code-highlight` and `syntax-highlight` mean in the PPTX report. The previous report treated the presence of Shiki/token DOM as fallback-owned even when the exported PPTX already carried the token foreground colors as visible native rich-text runs. That made the report look worse than the actual editable output and blurred the next engineering target.

Implementation status:

1. `code-highlight` is no longer added just because `pre code`, `.shiki`, `.token`, or `code[class*="language-"]` is visible.
2. The extractor now checks code-owned paint that cannot be represented by the current native layer: unsupported primitive paint, unconsumed solid fills, and unconsumed visible borders.
3. Text run diagnostics add `syntax-highlight` only when that unsupported code paint is present. Plain token foreground colors remain covered by native rich text.
4. The code path keeps the same ownership model adopted from `oh-my-ppt`: extract native objects where the DOM style can be represented, mark consumed shapes, hide modeled text before background capture, and leave unsupported paint in the background fallback. It does not import a parallel HTML-to-PPTX route.
5. The implementation avoids a mode flag in `collectFallbackOnlyElementKinds`; the base fallback kinds are collected first, then `code-highlight` is merged only when code paint evidence requires it.

Comparison with the prior plan:

1. M25 split protected-root diagnostics so code, SVG, Mermaid, and table candidates stopped sharing one `unsupported-root` bucket.
2. M26 removed the fake-editable transparent text path and made visible native text/table the default contract.
3. M27 does not claim all code visuals are Office-native. It only prevents native-rich token foreground colors from being reported as unmodeled fallback.
4. This is the correct next step before widening extraction: the report now distinguishes text-style coverage from unmodeled code-root paint. Without that distinction, the next target would be selected from noisy diagnostics.

Validation:

1. `npx tsc --noEmit --pretty false` passed.
2. `git diff --check` passed.
3. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium: `12` tests.
4. `npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts` passed: `21` tests.
5. `npm run build` passed.
6. Full Jest passed: `190` suites, `1549` tests. Root's Playwright cache still logs the existing browser skip warnings; the jacob-run DOM extractor command above is the real browser validation.

Real `architecture.zh-CN.md` acceptance:

1. Real export command passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m27-code-highlight-native-coverage --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
2. Slidev came from the local fork: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, with `skillRootPath = /home/jacob/slidev/skills/slidev` and `skillReferenceCount = 52`.
3. Visual and source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = "pptx-rendered-html-reference"`, `thresholdProfile = "visible-native-rendered-html"`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
4. Editable output stayed stable: `slideCount = 30`, `textRunCount = 861`, `tableCount = 6`, `slidesWithoutEditableText = []`, `editableCodeTextBoxCount = 14`, `editableCodeBackgroundRectangleCount = 115`.
5. Report semantics improved: `unmodeledTextRunReasons = ["inline-code", "inline-formatting"]`; `syntax-highlight` is no longer present for the real deck.
6. `fallbackOnlyElementKinds` still includes `["code-highlight", "mermaid", "svg"]`. That is expected: real code-root paint still has `unsupported-code-root = 115`, while Mermaid/SVG geometry remains background-owned.
7. The decorative skip distribution remains actionable: `unsupported-code-root = 115`, `unsupported-svg-root = 136`, `unsupported-table-root = 120`, `not-visible = 2`.
8. PPTX XML scan confirms the transparent path remains gone: `alpha=0 = 0`, `alpha=8000 = 0`, named `Editable ... Text = 0`, named `Editable Table = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, and `<a:t...>` tags = `861`.
9. Generated outputs stayed ignored and untracked: `docs/export/test-slidev-m27-code-highlight-native-coverage/` shows as ignored, and `git ls-files docs/export/test-slidev-m27-code-highlight-native-coverage` returns no tracked files.

Residual risk:

This slice improves report precision, not layout geometry. The next high-value code path is still `unsupported-code-root`: decide whether the remaining code paint should become native rectangles/borders, or stay honestly background-owned. SVG and Mermaid should remain separate tracks. Mermaid source preservation is still more important than trying to reconstruct every diagram label as editable Office text.

## M28 Current-Page Root Locking And Table-Owned Inline Code Fallback Cleanup

This slice borrows the useful part of `oh-my-ppt`: lock the capture surface to one current page, then classify only primitives that are actually visible in that page and still owned by their root. After M27, the real report still had `unsupported-code-root = 115`, which matched `editableCodeBackgroundRectangleCount = 115` suspiciously closely. The follow-up investigation found two separate issues:

1. During Slidev route transitions, an old `.slidev-page` can keep `slide-left-leave-*` classes. Its main body is offscreen, but its DOM rect can still be almost a full slide. The old root selection compared full rect area, so an outgoing page could win over the current page.
2. Decorative diagnostics classified by code/table/svg root before checking visibility. Hidden pages, outgoing pages, and table-owned inline code could therefore be counted as `unsupported-code-root` or `code-highlight`.

Implementation status:

1. `visibleSlideRoot()` now ranks candidates by viewport-intersection area and uses semantic priority only when areas are comparable: `.slidev-page`, then `.slidev-layout`, then `.slidev-slide-content`, then `#app`.
2. Decorative primitive diagnostics now check box visibility before protected-root classification. This uses `hasVisibleBox()` rather than the text extractor's `isVisible()`, because `isVisible()` intentionally excludes SVG content and would hide the `unsupported-svg-root` diagnostic.
3. `codeHighlightPaintRequiresFallbackFor()` skips `table` and `[data-notemd-pptx-consumed-table="1"]` descendants. Inline code inside a consumed table is editable through native table text; any remaining chip-background/table-paint mismatch belongs to the table-root bucket, not to code-highlight fallback.
4. Real Chromium tests cover both regressions: hidden/outgoing Slidev siblings cannot pollute the current page, and table-owned inline code no longer reports `code-highlight`.

Comparison with the prior plan:

1. M27 suggested widening `unsupported-code-root` extraction next. M28 shows that assumption was premature: part of the signal was page-root and ownership noise, not missing native code paint.
2. This does not make table inline-code chip backgrounds fully Office-native. It tightens the report semantics: editable text is owned by the native table, and unmodeled table-internal decoration remains a table-root limitation.
3. This keeps the earlier constraints intact: no Mermaid source rewrite, no diagram splitting, no second HTML-to-PPTX conversion route. PPTX still derives from the rendered convergence output.

Validation:

1. `npx tsc --noEmit --pretty false` passed.
2. `git diff --check` passed.
3. `npm run build` passed.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium: `14` tests.
5. Full Jest passed: `190` suites, `1551` tests. Root still logs the existing Playwright cache skip warning; item 4 is the real browser coverage for this DOM/PPTX extraction slice.
6. Real `architecture.zh-CN.md` export passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m28-visible-root-scope --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
7. The local Slidev fork was still used: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`.
8. Visual/source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = pptx-rendered-html-reference`, `thresholdProfile = visible-native-rendered-html`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
9. Report semantics are tighter: `fallbackOnlyElementKinds = ["mermaid", "svg"]`; `code-highlight` is gone from the real deck's global fallback list. `decorativePrimitiveSkipReasonCounts = [{ not-visible: 68 }, { unsupported-table-root: 60 }]`.
10. Editable output stayed stable: `slideCount = 30`, `textRunCount = 861`, `tableCount = 6`, `slidesWithoutEditableText = []`, `editableCodeTextBoxCount = 14`, `editableCodeBackgroundRectangleCount = 115`.
11. Background residue sampling still passed: `checkedRegionCount = 437`, `suspiciousSlideCount = 0`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`, `warnings = []`.
12. PPTX XML scan confirms there was no regression to transparent text: `alpha=0 = 0`, `alpha=8000 = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `<a:t...>` tags = `861`.
13. Output artifacts remain local and ignored under `docs/export/test-slidev-m28-visible-root-scope/`; `git status --ignored --short` reports the directory as `!!`, so it is not committed.

Residual risk and next direction:

1. The global fallback list is now only `mermaid` and `svg`, but this does not mean all vector/chart geometry is editable. The default path still does not claim Mermaid/SVG geometry as Office-native.
2. `unsupported-table-root = 60` is now the most actionable bucket. It mainly covers table-internal inline-code chip backgrounds, cell decorations, and table paint differences. The next slice should improve native table writer support for inline runs and cell-internal decoration instead of routing those nodes back to code fallback.
3. `not-visible = 68` should be split into true hidden residue versus Slidev transition/offscreen residue. It is not a functional failure, but it is still report noise.
4. SVG should remain a separate track: consider SVG artifact/embedding or an explicit experimental mode before attempting default vector reconstruction.

## M29 Native Table Rich Runs And Inline-Code Ownership Closure

This slice continues to use the `oh-my-ppt` ownership contract rather than copying its implementation. The current `oh-my-ppt` table extractor is still mostly cell-level plain text/style; the reusable idea is table-first consumption, native Office table writing, hiding consumed primitives from the background capture, and then proving the result with report/pixel gates. NotEMD's gap was narrower: M28 already extracted rich runs from `<td>/<th>`, but the default writer suppresses `table-cell-overlay` text boxes when a native table exists. That meant inline code, strong/link styling, and similar table-internal runs were present only in the suppressed overlay, while the actual native table cell still fell back to plain `cell.text`.

Implementation status:

1. `SlidevPptxTableCell` now carries table-owned `richTextParagraphs` and `unmodeledRunReasons`; `SlidevPptxInlineTextRun` has optional `backgroundColor`.
2. The DOM extractor attaches `collectRichTextParagraphs()` and `textRunReasonsFor()` output to the table cell at the normalization boundary. `table-cell-overlay` remains only as a compatibility/diagnostic candidate.
3. Inline backgrounds are converted to run-level `backgroundColor` only for table-owned inline code, `mark`, or inline elements with an independent visible background. This deliberately avoids converting ordinary body backgrounds into Office highlights, which would risk double painting with the frozen background or native rectangles.
4. The PPTX writer's native table path now prefers `cell.richTextParagraphs`, emits each run as `<a:r>`, and preserves font, color, bold/italic, underline, character spacing, CJK/Latin font splitting, and hyperlink relationships. Inline-code backgrounds use native Office `<a:highlight>`. Hand-written or old-model cells without rich runs still use the plain text fallback.
5. Report generation and `fontContract` now count rich runs, hyperlink targets, unmodeled reasons, and font usage from the table cell itself. `tableCellCount` is keyed by cell id so one multi-run cell does not inflate the cell count into a run count.
6. Tests cover the three contracts: real Chromium extraction puts table-owned inline code/strong text into cell rich runs; the writer emits native table rich runs/highlight/hyperlink relationships with no transparent text; the report still counts rich runs/font usage after `table-cell-overlay` is suppressed.

Comparison with the prior plan:

1. M28 established that inline code inside tables should not pollute `code-highlight` fallback. M29 closes the other half: once ownership belongs to the native table, the table writer must consume the rich runs directly rather than depending on an overlay that is intentionally suppressed.
2. This does not split table content or rewrite Mermaid/chart content. Tables remain Office-native tables; Mermaid/SVG remain background-owned, and Mermaid fences are preserved.
3. This is not full CSS chip reconstruction. `<a:highlight>` is a conservative editable-text approximation; it cannot express border radius, padding, or CSS box model. The priority is real selectable/editable/reflowable text, not 1:1 reconstruction of every inline chip geometry.

Validation:

1. `npx tsc --noEmit --pretty false` passed.
2. `git diff --check` passed.
3. `npm run build` passed.
4. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium: `14` tests.
5. Focused Jest passed for `src/tests/pptxWriter.test.ts` and `src/tests/pptxExportReport.test.ts`: `23` tests.
6. Full Jest passed: `190` suites, `1553` tests. Root still logs the existing Playwright cache skip warning; item 4 is the real browser coverage for this DOM/PPTX extraction slice.
7. Real `architecture.zh-CN.md` export passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m29-table-rich-runs --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
8. The local Slidev fork was still used: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`.
9. Visual/source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = pptx-rendered-html-reference`, `thresholdProfile = visible-native-rendered-html`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
10. Real report metrics: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `editableTableCellCount = 102`, `editableTableCellOverlayTextBoxCount = 0`, `richTextRunCount = 440`, `richTextRunCharacterCount = 7409`.
11. Fallback reporting remains honest: `fallbackOnlyElementKinds = ["mermaid", "svg"]`; `decorativePrimitiveSkipReasonCounts = [{ not-visible: 68 }, { unsupported-table-root: 60 }]`.
12. The font contract now reflects table runs: `fontFamilies = ["Avenir Next", "Fira Code"]`, `officeFontFamilies = ["DejaVu Sans Mono", "Microsoft YaHei", "Noto Sans"]`, `officeTextRunCount = 780`, with table usage `Avenir Next.tableCellCount = 75` and `Fira Code.tableCellCount = 27`.
13. Background residue sampling still passed: `checkedRegionCount = 437`, `suspiciousSlideCount = 0`, `suspiciousRegionCount = 0`, `maxTextLikePixelRatio = 0`, `warnings = []`.
14. PPTX XML scan confirms there was no regression to transparent text: `alpha=0 = 0`, `alpha=8000 = 0`, `Table Cell Overlay Text = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `highlightTags = 27`, `<a:t...>` tags = `1218`.
15. Output artifacts remain local and ignored under `docs/export/test-slidev-m29-table-rich-runs/`; `git status --ignored --short` reports `!!`, `unignoredOutputs = []`, so artifacts are not committed.

Residual risk and next direction:

1. `unsupported-table-root = 60` did not decrease, and that is the expected boundary. M29 fixes table-owned text/runs; the remaining bucket mostly covers cell-internal decoration, CSS chip box model, border/collapse paint, and Office table-renderer differences.
2. `<a:highlight>` is not a CSS rounded chip. If visual fidelity needs to move closer to Chromium, the next step should be a cell-internal decoration shape/geometry contract gated by paint order and residue sampling. Do not revert to transparent overlays.
3. The real deck has no hyperlink runs, so the table hyperlink path is covered by writer/report tests. If a future source deck contains table links, add that to real acceptance metrics.
4. `textSourceCoverage` still describes text-box sources only, not table-cell rich-run sources. A future `tableCellRichTextCoverage` field would be cleaner than stuffing table cells back into `table-cell-overlay`.
5. Mermaid/SVG remain separate tracks. Keep source fences untouched and avoid splitting Mermaid diagrams; if editability improves there, use explicit SVG artifact/embedding or experimental vector reconstruction rather than transparent editable labels.

## M30 Table-Cell Native Rich-Run Coverage Contract

This slice continues to reference `ref/oh-my-ppt`, but the reused idea is the architecture boundary, not its writer implementation. `oh-my-ppt` classifies HTML nodes into typed text, shape, image, and table objects before the writer emits Office-native objects; only unmodeled content remains image-owned. NotEMD already has a Slidev-specific extractor, visible-native background hiding, a PPTX writer, and rendered-HTML visual gates. The remaining gap was the report contract: it could not independently prove native table-cell rich-text coverage.

Implementation status:

1. Added `SlidevPptxTableCellRichTextCoverage` and attached it to per-slide summaries, `editablePrimitiveCoverage`, and the top-level report.
2. The coverage fields are `tableSlideCount`, `richTextTableSlideCount`, `tableCount`, `tableCellCount`, `richTextTableCellCount`, `richTextParagraphCount`, `richTextRunCount`, `richTextRunCharacterCount`, `styledRunCount`, `codeRunCount`, `highlightedRunCount`, `hyperlinkRunCount`, and `hyperlinkTargetCount`.
3. `styledRunCount` is based on whether a run actually differs from the table-cell base style. It does not count every run merely because the normalized model has `fontFace` or `color` fields.
4. `textSourceCoverage` remains text-box-only. Table cells are not folded back into `table-cell-overlay`; the new table-cell coverage proves native table text separately.
5. The report test now covers the suppressed-overlay path: when a native table exists and `table-cell-overlay` is suppressed, the report still counts rich runs, inline-code highlight, hyperlink, and characters from the table cell itself.

Comparison with the prior plan:

1. M29 made the native table writer emit cell rich runs. M30 does not change the PPTX visual output; it adds the acceptance evidence so future work cannot use global `richTextRunCount` or a suppressed overlay as a proxy for table editability.
2. The useful lesson from `oh-my-ppt` is the typed object boundary. NotEMD now applies that boundary in reporting: text-box sources and table-cell rich-text sources are separate contracts, and native table output does not have to be inferred from overlay counts.
3. This is not a Mermaid/SVG geometry slice and not a CSS chip box-model slice. `highlightedRunCount = 27` proves Office-native highlight runs exist; it does not claim browser-identical rounded chip geometry or padding.

Validation:

1. `npx tsc --noEmit --pretty false` passed.
2. `git diff --check` passed.
3. `npm run build` passed.
4. `npm test -- --runInBand src/tests/pptxExportReport.test.ts` passed: `9` tests.
5. Full Jest passed: `190` suites, `1553` tests. The root environment still prints the existing Playwright cache warning.
6. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed with real Chromium: `14` tests.
7. Real `architecture.zh-CN.md` export passed: `npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m30-table-rich-coverage --sample-slides all --timeout-ms 240000 --no-screenshots --require-pptx-visual-match --json`.
8. The local Slidev fork was still used: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`.
9. Visual/source gates passed: `ok = true`, `pptxVisualGate.passed = true`, `referenceSource = pptx-rendered-html-reference`, `thresholdProfile = visible-native-rendered-html`, `mermaidSourcePreservation.passed = true`, `sourceFenceCount = 3`, `deckFenceCount = 3`, `changedFenceIndexes = []`.
10. Real report metrics: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `editableTableCellCount = 102`, `editableTableCellOverlayTextBoxCount = 0`, `richTextRunCount = 440`, `editablePrimitiveCoverage.richTextRunCharacterCount = 7409`.
11. New table coverage: `tableSlideCount = 6`, `richTextTableSlideCount = 6`, `tableCellCount = 102`, `richTextTableCellCount = 102`, `richTextParagraphCount = 102`, `richTextRunCount = 102`, `richTextRunCharacterCount = 1116`, `styledRunCount = 27`, `codeRunCount = 27`, `highlightedRunCount = 27`, `hyperlinkRunCount = 0`.
12. Fallback reporting remains honest: `fallbackOnlyElementKinds = ["mermaid", "svg"]`; `decorativePrimitiveSkipReasonCounts = [{ not-visible: 68 }, { unsupported-table-root: 60 }]`.
13. PPTX XML scan confirms there was no regression to transparent text: `alpha=0 = 0`, `alpha=8000 = 0`, `Table Cell Overlay Text = 0`, `Visible Native Text = 324`, `Visible Native Code Text = 14`, `Visible Native Table = 6`, `Native Code Background Rectangle = 115`, `highlightTags = 27`, `<a:t...>` tags = `1218`.
14. Output artifacts remain local and ignored under `docs/export/test-slidev-m30-table-rich-coverage/`, including `_slidev-sources/architecture.zh-CN.slidev.md`, HTML/standalone HTML, PPTX, report, rendered-HTML reference PNGs, and diff sheets. `git ls-files docs/export/test-slidev-m30-table-rich-coverage` returns no tracked files.

Residual risk and next direction:

1. M30 is a report-contract improvement, not a visual fix. It makes native table rich-text coverage independently auditable, but it does not reduce `unsupported-table-root = 60`.
2. Table-internal chips still use `<a:highlight>` for editable text highlight, not CSS radius/padding. The next improvement should add a cell-internal decoration typed model and writer gate rather than restoring transparent overlays.
3. The real deck still has no table hyperlinks, so `hyperlinkRunCount = 0` is a source-content fact rather than missing code coverage. The code path remains covered by writer/report tests.
4. Mermaid/SVG should not be mixed into table coverage. Keep Mermaid fences untouched and unsplit; SVG/Mermaid editability should remain an explicit experiment or artifact/embedding path.

## M31 Consumed Table Decoration Ownership Closure

This slice continues to reference `ref/oh-my-ppt`, but the applied lesson is narrower: ownership, not writer reuse. The valuable part of `oh-my-ppt` is that DOM nodes are first assigned to typed primitives, and table/text/shape nodes already consumed by one pass are not reprocessed by later background or shape passes. NotEMD already has a Slidev-specific extractor, visible-native background hiding, a native table writer, and rendered-HTML visual gates. The current problem was therefore not a missing second export pipeline; it was that consumed table-internal decoration was still reported as `unsupported-table-root`, which made acceptance look as if the table path had not taken ownership.

Implementation status:

1. Added a decorative primitive skip reason: `table-owned-decoration`.
2. The DOM extractor now records `table-owned-decoration` when an element is inside `data-notemd-pptx-consumed-table="1"`. Only an ordinary unconsumed `table` root remains `unsupported-table-root`.
3. Report aggregation keeps the new reason. PPTX writer output was not changed, transparent overlays were not restored, and table-internal inline-code chips are not rerouted into global `code-highlight` fallback.
4. DOM extractor tests now cover inline-code decoration after table consumption: `table-owned-decoration` must be present, and `unsupported-table-root` must be absent.
5. Report tests were updated so top-level report, `editablePrimitiveCoverage`, and per-slide summary keep consistent ordering and counts.

Comparison with the prior plan and current code:

1. M29/M30 already moved table text and cell rich runs into native DrawingML tables and proved `102/102` table cells through `tableCellRichTextCoverage`. M31 stops describing table-internal decoration residue as an unsupported table root. It now describes it as table-owned decoration that is currently approximated through Office-native run highlight and table styling.
2. This is not a visual-fidelity fix. PowerPoint table-cell rich text has no equivalent primitive for arbitrary rounded CSS chips. Modeling chips as slide-level shapes has z-order risk: above the table can cover editable text; below the table can disappear under cell fill or borders. The safer contract is to keep editable text semantics through `<a:highlight>` and expose the remaining cell-owned decoration honestly.
3. Mermaid/SVG policy is unchanged. `fallbackOnlyElementKinds = ["mermaid", "svg"]` still means diagram/vector geometry is owned by the background or a separate artifact track, not by fake transparent editable labels.
4. Font and chart editability boundaries are also unchanged. This slice only fixes table-owned decoration ownership diagnostics so future engineering decisions are not misled by `unsupported-table-root`.

Validation:

1. `npm test -- --runInBand src/tests/pptxExportReport.test.ts` passed: `9` tests.
2. `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm test -- --runInBand src/tests/pptxDomExtractor.test.ts'` passed: `14` real Chromium DOM extractor tests.
3. `npm test -- --runInBand src/tests/pptxWriter.test.ts src/tests/pptxExportReport.test.ts` passed: `23` tests.
4. `npx tsc --noEmit --pretty false` passed.
5. `npm run build` passed.
6. `git diff --check` passed.
7. Full Jest passed: `190` suites, `1553` tests. The root environment still prints the existing Playwright cache warning; browser-specific coverage was handled by the jacob-user test run above.
8. Real `architecture.zh-CN.md` export passed: `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-m31-table-owned-decoration --sample-slides all --timeout-ms 600000 --no-screenshots --require-pptx-visual-match --json'`.
9. The local Slidev fork was still used: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`, `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52`.
10. Real report metrics: `slideCount = 30`, `textBoxCount = 338`, `tableCount = 6`, `consumedTableCount = 6`, `editableTableCellCount = 102`, `editableTableCellOverlayTextBoxCount = 0`.
11. Skip reasons are closed down: `decorativePrimitiveSkipReasonCounts = [{ not-visible: 68 }, { table-owned-decoration: 60 }]`; the real report no longer contains `unsupported-table-root`.
12. Table rich-text coverage stayed stable: `richTextTableSlideCount = 6`, `richTextTableCellCount = 102`, `richTextRunCount = 102`, `styledRunCount = 27`, `codeRunCount = 27`, `highlightedRunCount = 27`.
13. Fallback boundaries remain honest: `fallbackOnlyElementKinds = ["mermaid", "svg"]`, `transparentOverlayTextSources = []`.
14. PPTX XML scanning found no transparent-text regression: no matches for `<a:alpha val="0"/>`, `<a:alpha val="8000"/>`, `table-cell-overlay`, or `notemd-table-cell-overlay`.
15. Output artifacts remain local and ignored under `docs/export/test-slidev-m31-table-owned-decoration/`; `git ls-files docs/export/test-slidev-m31-table-owned-decoration` returns no tracked files, and `git status --ignored --short docs/export/test-slidev-m31-table-owned-decoration` shows only the ignored directory.

Next direction:

1. If table-chip visual fidelity remains a target, define an Office-native cell-internal decoration contract and z-order gate first. Without that contract, do not model chips as ordinary slide shapes, and do not reintroduce transparent text.
2. `table-owned-decoration` does not mean "perfectly rendered"; it means ownership is clear. A later report can split it into highlight-owned, border-owned, cell-fill-owned, and unmodeled-cell-decoration buckets only after the writer has verifiable outputs for those cases.
3. Mermaid/SVG should stay on an independent track. Keep Mermaid fences untouched and unsplit; default to background or SVG sidecar ownership unless an explicit experimental option requests SVG embedding or vector reconstruction.
4. The better next investment is a real Office round-trip quality gate: editable-text scanning, font replacement risk, table z-order/residue sampling, and explainable per-slide PNG/PPTX diff diagnostics. Avoid adding a second conversion path that bypasses rendered convergence.

## M32-M34 Visible Text Layer Ordering And 1.9.3 Release Gate

The latest user-visible PPTX defect was not another text-extraction gap. The failure mode was paint order: code-background rectangles existed as native editable shapes, but pages 17-29 could place those rectangles after visible text in the PPTX shape tree. In PowerPoint, later siblings are visually above earlier siblings, so the background became an occluder.

Implementation status:

1. `pptxWriter.ts` now assigns each slide-tree item an explicit layer: background image, native shape, native table, native text.
2. Both the default writer and the visible-native experiment writer sort by `layer` first, then DOM/source order. This keeps background images and code/decorative shapes below text while preserving stable intra-layer order.
3. `pptxDomExtractor.ts` simplified code-background ordering to `ownerOrder - 0.3`, so code background ownership is clear before the writer applies the final layer model.
4. The verifier now reports transparent text, visible native source buckets, native table overlay leaks, and table-cell rich-text coverage separately.
5. `nativeTableOverlayLeakCount` was corrected so the presence of native tables suppresses expected table-cell overlay counts instead of flagging a false leak.

Comparison with the prior plan and current code:

1. The canvas/geometry work reduced layout overflow risk, but it did not guarantee Office z-order. PPTX shape-tree ordering needed its own model because PowerPoint paint order is XML sibling order, not browser CSS stacking order.
2. The better fix was not to remove code backgrounds. Code backgrounds are useful editable primitives; the bug was ownership and layer placement. Keeping them below text preserves fidelity without sacrificing editability.
3. The change does not modify Mermaid source, split diagrams, or claim Mermaid/SVG Office-native geometry. Mermaid/SVG remain fallback-owned unless a future explicit experiment adds SVG embedding or vector reconstruction.
4. This also avoids reverting to transparent text. The displayed text remains the editable text, and transparent overlay sources remain empty.

Fresh 1.9.3 validation:

1. Real source: `docs/architecture.zh-CN.md`.
2. Real output: `docs/export/test-slidev-1.9.3-layer-release/architecture.zh-CN.pptx`.
3. Real command: `runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-1.9.3-layer-release --sample-slides all --timeout-ms 600000 --no-screenshots --require-pptx-visual-match --json'`.
4. Local Slidev fork confirmed: `52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`.
5. Full Slidev skill path confirmed: `/home/jacob/slidev/skills/slidev`; `skillReferenceCount = 52`.
6. Report gate passed: `ok = true`, `slideCount = 30`, `editableTextSlideCount = 30`, `pagesWithoutEditableText = []`.
7. Editable coverage: `textBoxCount = 338`, `editableBodyTextBoxCount = 324`, `editableCodeTextBoxCount = 14`, `tableCount = 6`, `editableTableCellCount = 102`.
8. Table rich-text coverage stayed intact: `richTextTableCellCount = 102`, `richTextRunCount = 102`, `highlightedRunCount = 27`.
9. Fallback boundary stayed honest: `fallbackOnlyElementKinds = ["mermaid", "svg"]`, `transparentOverlayTextSources = []`.
10. Direct XML scan over slides 17-29 passed: `totalCodeBackgroundAfterText = 0`, `totalNativeShapeAfterText = 0`, `totalTransparentishAlpha = 0`, `totalTableOverlayText = 0`.
11. Generated artifacts remain ignored and untracked under `docs/export/test-slidev-1.9.3-layer-release/`.

Release-note scope:

1. 1.9.3 should describe Slidev export, standalone HTML, visible-native PPTX, layer ordering, table rich text, and release workflow gates.
2. GEO/GitHub Pages work should not be described in the 1.9.3 release notes. It exists in the commit range, but it is not part of this release's user-facing story.
3. The known boundary remains: ordinary slide text and table-cell text are visible and editable; Mermaid/SVG geometry is fallback-owned; Office round-trip layout drift still deserves a stronger future gate.

Final release closure:

1. GitHub Release `1.9.3` is published as `Notemd 1.9.3` with `main.js`, `manifest.json`, `README.md`, and `styles.css`.
2. Tag `1.9.3` points at `9efe104` (`release: prepare notemd 1.9.3`).
3. The post-release chronicle refresh produced `8a94b35`.
4. `main` and `origin/main` have been updated after this release-closure documentation pass.
5. The release workflow `publish` and `refresh_chronicle` jobs completed successfully.
6. The worktree is clean, and the real export artifacts under `docs/export/test-slidev-1.9.3-layer-release/` remain ignored and untracked.

## Current Limits

The first implementation is intentionally conservative:

1. Text is editable.
2. Whole-slide visual fallback preserves complex visuals.
3. Mermaid/canvas are not converted into Office-native editable vector objects; non-Mermaid SVG/chart text is extracted as visible native text, while the remaining chart/vector geometry stays in the background image.
4. Tables now use a visible native DrawingML table layer with editable cell text, row/column dimensions, and merge metadata.
5. Code blocks are extracted as visible native text when the DOM text is modeled. Inline run styling is preserved; ordinary DOM `<a href>` links are now written as Office-native hyperlink relationships, but full syntax-token semantics are still not modeled as Office-native objects.
6. Simple opaque code backgrounds, decorative rectangles, and decorative divider lines can now be extracted as visible native Office shapes. Complex SVG/Mermaid/chart geometry remains fallback-owned.
7. Animations and click steps are not represented as PowerPoint animations.
8. The old frozen-background visual-diff gate proved the fallback image path. The current visible-native default needs stricter per-slide drift analysis because Office text layout can diverge from Chromium.
9. Default non-Mermaid text is now visible native text, not a low-opacity selectable overlay. Default Mermaid labels are not written as transparent overlays; they remain in the background image.

Those are not regressions; they are explicit boundaries. Overstating editability would be worse than shipping an honest report-driven first slice.

## Next Direction

The next level should be incremental and report-driven:

1. keep visual diff in every real PPTX acceptance run. For the default visible-native PPTX path, use the rendered-HTML reference as the hard gate because the PPTX background intentionally hides modeled text; keep background-image diff as a diagnostic for fallback-image packaging and external reference checks;
2. keep the visible native table layer, but gate improvements around CSS padding, border collapse, line height, cell baseline, font fallback, and Office round-trip rendering instead of reverting to transparent structures;
3. use `fontContract` as the gate for visible native text/table quality. The next rich-text slices should continue with paragraph spacing, list indentation, code monospace defaults, richer text-style fidelity, and a clearer distinction between text-style fidelity and true Office-native semantic fidelity;
4. keep default background residue detection/retry as a required sidecar contract, and expand it only where evidence shows gaps; do not replace it with a silent fallback to transparent overlays;
5. add shape extraction for high-confidence solid-color rectangles/lines only;
6. add a font selection policy with a small preset list, user-selected installed family names, and a clear portability report; do not default to embedding arbitrary system fonts;
7. keep Mermaid source untouched, export rendered SVG sidecars when available, and continue using image fallback unless a separate explicit user option requests experimental SVG embedding or vector reconstruction.

Avoid adding a second HTML-to-PPTX route that bypasses rendered convergence. That would create a separate quality gate and make PPTX results drift from the HTML export path that users already rely on.
