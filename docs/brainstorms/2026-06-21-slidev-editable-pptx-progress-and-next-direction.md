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

The current editability problem is real, but the likely root cause is not a leftover debug artifact. The default writer intentionally emits transparent DrawingML text (`<a:alpha val="0"/>`) because the visible layer is the frozen rendered background. That strategy keeps the visual gate stable, but it makes direct text editing less discoverable: users often need PowerPoint's selection pane or shape selection to pick the transparent text boxes.

This is now explicit in the sidecar report through `editableLayerContract`:

1. default export: `visualFidelityStrategy = frozen-background-first`, `visibleTextSource = background-image`, `editableTextShapeFill = transparent`, `editableTableTextFill = transparent`, `backgroundTextPolicy = preserve-rendered-text`, `textSelectionSurface = named-transparent-shapes`;
2. visible-native experiment: `visibleTextSource = native-text`, `editableTextShapeFill = visible`, `editableTableTextFill = visible`, `backgroundTextPolicy = hide-extracted-text-before-capture`;
3. Mermaid/SVG default policy: `mermaidSvgVisualPolicy = background-image`, `mermaidSvgTextPolicy = transparent-editable-label-overlays`, `officeNativeMermaidSvgElementEditability = not-claimed`;
4. font portability policy: `fontPortabilityPolicy = report-only-no-default-font-embedding`.

This is the right comparison boundary with `oh-my-ppt`. `oh-my-ppt` hides already extracted primitives before background capture because its target path is visible native reconstruction. NotEMD's default path must not hide those primitives, because the frozen background is still the visual source of truth. The useful lesson is not "make all text visible now"; it is to keep native visibility behind a residue/visual-diff gate and make the transparent-layer tradeoff observable.

Font selection should be added as an export policy, not as implicit system-font embedding:

1. ship a small portable preset list for UI selection, biased toward Office/common cross-platform faces such as `Aptos`, `Arial`, `Calibri`, `Consolas`, `Microsoft YaHei`, and optionally locally available `Noto Sans CJK` families;
2. allow users to type or select a system-supported font family for rendered Slidev/PPTX extraction, but mark it as a portability risk unless it is known to exist on the target Office machine;
3. support vault-local licensed font assets as an opt-in embedding source later; do not scan and package arbitrary system fonts by default;
4. keep `fontContract` as the acceptance surface: source CSS fonts, Office-emitted fonts, CJK fallback, missing-font risk, and embedding policy must all agree before any visible-native text/table default changes.

Mermaid/SVG needs a similar split. The default should preserve Mermaid source fences and keep the visual fallback stable, while exporting rendered Mermaid SVG sidecars for users who want to inspect or manually edit vector elements. Embedding SVG directly into PPTX is worth an experiment, but it is not the same as Office-native editable diagram semantics: PowerPoint/LibreOffice compatibility, ungroup behavior, font substitution inside SVG, and fallback rendering must be tested before it becomes default. The near-term best path is:

1. keep Mermaid source unchanged and do not split large Mermaid diagrams;
2. copy rendered Mermaid/SVG assets as sidecars by default when available;
3. continue extracting Mermaid/SVG text labels into transparent named overlays;
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
3. Mermaid/canvas are not converted into Office-native editable vector objects; non-Mermaid SVG/chart text is extracted as visible native text, while the remaining chart/vector geometry stays in the background image.
4. Tables now use a visible native DrawingML table layer with editable cell text, row/column dimensions, and merge metadata.
5. Code blocks are extracted as visible native text when the DOM text is modeled. Inline run styling is preserved, but full syntax-token semantics and explicit hyperlink relationships are still not modeled as Office-native objects.
6. Animations and click steps are not represented as PowerPoint animations.
7. The old frozen-background visual-diff gate proved the fallback image path. The current visible-native default needs stricter per-slide drift analysis because Office text layout can diverge from Chromium.
8. Default non-Mermaid text is now visible native text, not a low-opacity selectable overlay. Default Mermaid labels are not written as transparent overlays; they remain in the background image.

Those are not regressions; they are explicit boundaries. Overstating editability would be worse than shipping an honest report-driven first slice.

## Next Direction

The next level should be incremental and report-driven:

1. keep visual diff in every real PPTX acceptance run, with `pptx-background-images` as the hard-gate reference source; also keep `--pptx-rendered-html-reference-diff` as a reference-contract regression check so future changes do not reintroduce HTML capture drift;
2. keep the visible native table layer, but gate improvements around CSS padding, border collapse, line height, cell baseline, font fallback, and Office round-trip rendering instead of reverting to transparent structures;
3. use `fontContract` as the gate for visible native text/table quality. The next rich-text slices should split mixed CJK/Latin runs only when the writer/report agree on the final Office faces, then add paragraph spacing, list indentation, code monospace defaults, explicit hyperlink relationships, and a clearer distinction between text-style fidelity and true Office-native semantic fidelity;
4. add background residue detection/retry for the default path now that visible native text owns the display layer. Hiding modeled DOM text before screenshot capture must be verified so ghost text does not remain behind editable text.
5. add shape extraction for high-confidence solid-color rectangles/lines only;
6. add a font selection policy with a small preset list, user-selected installed family names, and a clear portability report; do not default to embedding arbitrary system fonts;
7. keep Mermaid source untouched, export rendered SVG sidecars when available, and continue using image fallback unless a separate explicit user option requests experimental SVG embedding or vector reconstruction.

Avoid adding a second HTML-to-PPTX route that bypasses rendered convergence. That would create a separate quality gate and make PPTX results drift from the HTML export path that users already rely on.
