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
2. **M2: rich run extraction**. First slice is now landed for the transparent text layer: inline runs, computed font metadata, link/code markers, paragraph splitting, underline/color/bold/italic preservation, and Office-safe whitespace are written into DrawingML. Remaining M2 work is CJK/Latin font-face splitting inside one run, bullet levels, line-height, paragraph spacing, and explicit hyperlink relationships.
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
| `ooxml-writer.ts` | Reuse PresentationML structure lessons and test-case ideas, not the writer | NotEMD already has a small writer; the next value is run-level fonts, hyperlink relationships, paragraph/list contracts, not a writer swap |
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

1. **Tighten the Office text contract first**: make the writer and report share the final emit view, split mixed CJK/Latin runs, record actual Office font faces, then add explicit hyperlink relationships, code monospace defaults, paragraph spacing, and list indentation. This improves the editable layer without changing the visible layer, so it is the lowest-risk path.
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
5. Code blocks are extracted as text when visible DOM text is selected. Inline run styling is now preserved in the transparent structure layer, but full syntax-token semantics and explicit hyperlink relationships are still not modeled as Office-native objects.
6. Animations and click steps are not represented as PowerPoint animations.
7. The frozen-background visual-diff gate passes; that proves Office preserves the written visual layer, not that complex objects are Office-native editable.

Those are not regressions; they are explicit boundaries. Overstating editability would be worse than shipping an honest report-driven first slice.

## Next Direction

The next level should be incremental and report-driven:

1. keep visual diff in every real PPTX acceptance run, with `pptx-background-images` as the hard-gate reference source; also keep `--pptx-rendered-html-reference-diff` as a reference-contract regression check so future changes do not reintroduce HTML capture drift;
2. keep the table structural layer, but do not make it visible until CSS padding, border collapse, line height, cell baseline, font fallback, and Office round-trip rendering are modeled tightly enough to avoid regressing the frozen visual layer;
3. use `fontContract` as the gate before visible native text/table work. The next rich-text slices should split mixed CJK/Latin runs only when the writer/report agree on the final Office faces, then add paragraph spacing, list indentation, code monospace defaults, explicit hyperlink relationships, and a clearer distinction between text-style fidelity and true Office-native semantic fidelity;
4. if a future slice makes native text or table layers visible, add background residue detection/retry before accepting those screenshots. The current transparent-structure mode should not hide text from the frozen background; residue sampling only becomes mandatory when visible native text takes over the visual layer.
5. add shape extraction for high-confidence solid-color rectangles/lines only;
6. keep Mermaid source untouched and continue using image fallback unless a separate explicit user option requests experimental vector reconstruction.

Avoid adding a second HTML-to-PPTX route that bypasses rendered convergence. That would create a separate quality gate and make PPTX results drift from the HTML export path that users already rely on.
