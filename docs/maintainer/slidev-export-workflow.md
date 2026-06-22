# Slidev Export Workflow Verification

Language: **English** | [简体中文](./slidev-export-workflow.zh-CN.md)

This document is for maintainers. It defines the verification workflow for the NoteMD Slidev export UI path.

## Why This Workflow Exists

Directly running `slidev build` proves the local Slidev CLI can build a deck, but it does not prove the NoteMD export buttons work.

The NoteMD workflow must verify all of these steps together:

1. The active Markdown note is converted into a real Slidev deck before export.
2. The full Slidev skill directory is discovered, including `references/*.md`, not only `SKILL.md`.
3. The local Slidev fork is preferred when present.
4. Existing Slidev decks are copied into an isolated prepared working workspace before verification so patch/retry never mutates the source note directly and sibling Slidev support entries plus explicitly referenced local assets can be mirrored into the working copy.
5. The output directory is recreated before each HTML build so stale chunks cannot survive.
6. Generated deck guardrails normalize theme and slide frontmatter, strip generated Mermaid slide `zoom` so rendered audit owns measured fit, and reject LLM-generated decks that change source Mermaid fences before the prepared deck is written.
7. HTML export attempts native standalone first, records the actual HTML mode, and falls back to server-script-compatible HTML only when the generated standalone bundle really misses slide loader bindings.
8. The final HTML output is opened by a real browser check, auditing the full deck by default.
9. Generated inspection artifacts remain inspectable on disk but ignored by Git, so verifier runs do not accidentally stage one-off export files.

## Maintainer Command

Run the real workflow against the docs vault and the architecture note:

```bash
npm run verify:slidev-export
```

The default source is:

```text
docs/architecture.zh-CN.md
```

The command writes the same kind of artifacts the UI writes:

```text
docs/export/_slidev-sources/architecture.zh-CN.slidev.md
docs/export/architecture.zh-CN-slides/index-standalone.html
or docs/export/architecture.zh-CN-slides/index.html when standalone falls back
docs/export/architecture.zh-CN-slides/slide-*-workflow.png
```

For editable PPTX:

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --json
```

The PPTX run writes:

```text
docs/export/architecture.zh-CN.pptx
docs/export/architecture.zh-CN.pptx.report.json
```

The verifier also opens the `.pptx` as a zip and checks slide XML for editable `<a:t>` text nodes. It counts native DrawingML tables through `pptxInspection.tableCount`. Treat image-only PPTX output as a failure for this path.

The PPTX sidecar report must be read as part of the export contract. It reports the visible layer strategy (`visibleTextLayer = "background-image"`), transparent editable-layer strategy, table consumption counts, editability coverage, fallback-only visual kinds, unmodeled text-run reasons, and per-slide summaries. This is deliberate: complex Slidev/Mermaid/SVG/canvas content is still allowed to be raster fallback, but the report must not imply it is Office-native editable.

To compare every PPTX page against the frozen visual reference written into the PPTX:

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json
```

This run writes:

```text
docs/export/architecture.zh-CN-pptx-visual-diff/pptx-visual-diff.report.json
docs/export/architecture.zh-CN-pptx-visual-diff/comparison-metrics.csv
docs/export/architecture.zh-CN-pptx-visual-diff/pptx-background-reference/slide-*.png
docs/export/architecture.zh-CN-pptx-visual-diff/all-side-by-side-sheet.png
docs/export/architecture.zh-CN-pptx-visual-diff/all-diff-sheet.png
```

The hard gate extracts embedded background images from the PPTX slide relationships. It does not rerun Slidev PNG export as the strict reference, because that would be a second rendering instance and can drift in font antialiasing or page state.

The report also includes diagnostic geometry metrics such as `maxScaleRatioDelta`, `maxDifferenceBoundingBoxAreaRatio`, and `worstDifferenceBoundingBoxSlides`. Keep those advisory unless explicit thresholds are passed. Dense text antialiasing can produce large diff bounding boxes without actual slide overflow.

Report mode records `pptxVisualDiff.gate.passed` but does not fail the whole verifier when visual thresholds are exceeded. For strict closure, add:

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json
```

For a quieter machine-readable run:

```bash
npm run verify:slidev-export -- --no-screenshots --json
```

To make a native standalone claim, do not rely on the compatibility default alone. Run the strict gate:

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

This must report `htmlExport.actualMode: "standalone"` and `standaloneGate.passed: true`.

To test another vault-relative source:

```bash
npm run verify:slidev-export -- --source path/to/source.md
```

To run the heavier synthetic full-deck layout fixtures without committing generated files:

```bash
npm run verify:slidev-layout-fixtures -- --archive /home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures
```

This command creates temporary vaults outside the repository, runs the production verifier, and archives the source fixture, final deck, report, and standalone export. Use it when layout audit, Mermaid fit, table/code splitting, text measurement, or slot Transform behavior changes.

The current expanded fixture archive is:

```text
/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/
```

The current Stage 12 fixture archive is:

```text
/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/
```

It adds `mixed-component-prose-stress`, proving that a custom `dashboard-shell` slide with one complete Vue component surface and one Markdown prose/list content block can first be separated into independent presentation surfaces. The component page can then converge through measured local `<Transform>`, while the prose page does not inherit whole-slide `zoom`. The suite still requires Mermaid fences to remain byte-stable, must not split one source Mermaid diagram into several diagrams, and must not rewrite fence metadata or diagram bodies.

Stage 13/14 add expected-failure fixtures for unsafe component/table, component/fence, and component/image boundaries:

```bash
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-table-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture --timeout-ms 300000
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-fence-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture --timeout-ms 300000
npm run verify:slidev-layout-fixtures -- --fixture unsupported-component-image-boundary-stress --archive /home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture --timeout-ms 300000
```

These fixtures pass only when the production verifier reports `ok = false`, the blocked reason includes `mixed component and primary Markdown content cannot be fixed with whole-slide zoom`, and native standalone export, browser loading, Git-visible artifacts, the failure fingerprint, and Mermaid source preservation all remain valid. The image fixture also requires the local SVG asset to exist in both the prepared deck and final standalone export. The default fixture suite excludes expected failures; pass `--include-expected-failures` only when explicitly auditing fail-transparent boundaries.

For a live desktop-session smoke against the real Obsidian command path:

```bash
obsidian open path=architecture.zh-CN.md vault=/home/jacob/obsidian-NotEMD/docs
obsidian command id=notemd:export-slides vault=/home/jacob/obsidian-NotEMD/docs
```

On 2026-06-18 this command executed successfully in Jacob's docs vault. It is a real host-command smoke, not a DOM click automation pass.

The strict standalone acceptance index for the real `architecture.zh-CN.md` run is tracked in:

```text
docs/maintainer/slidev-standalone-acceptance-2026-06-18.md
```

## Passing Criteria

Treat the command as passing only when the final JSON report has:

1. `ok: true`
2. `environment.capabilities.html: true`
3. `environment.slidev.version` showing the local fork path when the fork is installed
4. `slideSource.skillRootPath` set to the resolved Slidev skill directory
5. `slideSource.skillReferenceCount` greater than zero
6. `deck.theme` equal to the configured theme, normally `default`
7. `deck.containsKnownStaleText: false`
8. `deck.containsMissingTheme: false`
9. every `playwright[].failed` value equal to `false`
10. `unignoredOutputs: []`
11. `layoutAuditSummary.overflowCount: 0`
12. `layoutAuditSummary.unreadableCount: 0`
13. for strict native standalone closure, `htmlExport.actualMode: "standalone"`
14. for strict native standalone closure, `htmlExport.requiresLocalServer: false`
15. for strict native standalone closure, `htmlExport.standaloneAttempt.loaderGaps: []`
16. for strict native standalone closure, `standaloneGate.passed: true`
17. when the source contains Mermaid fences, the exported deck preserves the same Mermaid fence count, order, fence metadata, and exact fence body unless a human explicitly edits the source.
18. mixed Mermaid/prose slides must not retain low whole-slide zoom; if non-Mermaid content can be moved, the Mermaid fence opener, metadata, body, and closer stay byte-stable on a Mermaid-focused slide and only non-Mermaid prose moves to a readable slide.
19. existing local `<Transform>` wrappers, including non-slot single-surface wrappers, must not be compounded with later whole-slide `zoom`.
20. mixed component/prose slides must not retain whole-slide zoom when a safe component/prose boundary exists; if the boundary is unsafe, the patcher should block whole-slide zoom and surface blocked/manual-review instead of shrinking prose.
21. expected-failure fixtures should not be treated as normal regressions just because verifier `ok = false`; they must prove the intended failure reason, native standalone environment, artifact visibility, and source preservation. The default success suite must still contain only `ok = true` converging fixtures.
22. for PPTX closure, `environment.capabilities.pptx: true`
23. for PPTX closure, `pptxInspection.isZip: true`
24. for PPTX closure, `pptxInspection.textRunCount > 0`
25. for PPTX closure, `pptxInspection.slidesWithoutEditableText` is empty when every source slide contains text
26. for PPTX closure on decks with tables, `pptxInspection.tableCount > 0`
27. for PPTX closure, the sidecar report records `textBoxCount`, `tableCount`, `consumedTableCount`, `consumedTableTextCandidateCount`, `editableTableCellCount`, `editableTextSlideCount`, `imageFallbackCount`, `pagesWithoutEditableText`, `editablePrimitiveCoverage`, `fallbackOnlyElementKinds`, `unmodeledTextRunReasons`, and per-slide summaries
28. for PPTX visual closure, run with `--pptx-visual-diff --require-pptx-visual-match`
29. for PPTX visual closure, `pptxVisualDiff.reference.source: "pptx-background-images"`
30. for PPTX visual closure, `pptxVisualDiff.comparison.summary.missingReferenceSlides: []`
31. for PPTX visual closure, `pptxVisualDiff.comparison.summary.missingRenderedSlides: []`
32. for PPTX visual closure, `pptxVisualDiff.comparison.summary.maxRmse <= 0.12`
33. for PPTX visual closure, `pptxVisualDiff.comparison.summary.meanRmse <= 0.08`
34. for PPTX visual diagnostics, review `pptxVisualDiff.comparison.summary.maxScaleRatioDelta` and `maxDifferenceBoundingBoxAreaRatio`, but do not promote them to hard failures until the thresholds distinguish layout displacement from renderer noise

If any check fails, fix the NoteMD workflow before relying on the exported files.

## Rendered Layout Quality Gate

The current workflow proves that the UI-equivalent export path creates a deck and that the full prepared deck can open in a browser. That is necessary because dense architecture notes can still build successfully while Mermaid diagrams, tables, code blocks, or long text are clipped by Slidev's fixed 16:9 canvas.

The current implementation now includes a shared render-feedback gate after deck generation, used by maintainer verification and by the real product export command whenever Playwright is available:

1. wait for `document.fonts.ready`, image decode, and Mermaid rendering before measuring;
2. inspect every audited slide for DOM bounding boxes outside the actual visible slide root, scroll overflow, Mermaid container overflow, table natural width overflow, and code block overflow;
3. classify each finding as `overflow`, `unreadable-scale`, `stale-output`, or `render-error`;
4. patch and retry the prepared working deck with bounded rendered-evidence rewrites, currently up to 6 passes;
5. fail closed with an audit report when the visible slide root still clips content after those retries.

Use `ref/infinite-canvas` only as a clean-room design reference. The useful idea is not to embed an infinite canvas in Slidev export; it is to model generated slide elements as measurable world rectangles, compute union bounds, and derive a fit camera for the fixed Slidev safe rectangle. When fitting would make content unreadable, only non-Mermaid table/code/prose/component presentation surfaces may be structurally split or locally transformed. Mermaid must remain one source fence to one exported fence, with `source-preserved-fit-review` or `manual-review` surfacing quality risk. Do not copy AGPL-3.0 implementation code into this MIT project.

The report shape now separates the hard gate from the quality gate. It records:

```text
layoutAudit[].slide
layoutAudit[].findings[]
layoutAudit[].safeRect
layoutAudit[].contentBounds
layoutAudit[].effectiveMinFontPx
layoutAudit[].svgTextMinFontPx
layoutAudit[].tableBodyMinFontPx
layoutAudit[].codeMinFontPx
layoutAudit[].qualityMargins
layoutAudit[].contentAreaRatio
layoutAudit[].mermaidFit.status
layoutAudit[].mermaidFit.reason
layoutAudit[].mermaidFit.pageScale
layoutAudit[].mermaidFit.fitScale
layoutAudit[].mermaidFit.nextZoom
layoutAudit[].mermaidFit.diagramBounds
layoutAudit[].mermaidFit.effectiveMinFontPx
layoutAudit[].mermaidFit.svgTextMinFontPx
layoutAudit[].mermaidFit.qualityMargins
layoutAudit[].mermaidFit.contentAreaRatio
layoutAudit[].mermaidFit.lowZoom
layoutAudit[].mermaidFit.lowFont
layoutAudit[].mermaidFit.tightMargin
layoutAudit[].recommendedPatch
layoutAuditSummary.hardOverflowCount
layoutAuditSummary.unreadableScaleCount
layoutAuditSummary.lowEffectiveFontCount
layoutAuditSummary.qualityMarginWarningCount
layoutAuditSummary.lowContentUtilizationCount
layoutAuditSummary.preSplitCount
layoutAuditSummary.postPatchCount
layoutAuditSummary.mermaidSlideCount
layoutAuditSummary.mermaidFitReviewCount
layoutAuditSummary.mermaidLowZoomCount
layoutAuditSummary.mermaidManualReviewCount
layoutAuditSummary.retryCount
mermaidSourcePreservation.required
mermaidSourcePreservation.passed
mermaidSourcePreservation.sourceFenceCount
mermaidSourcePreservation.deckFenceCount
mermaidSourcePreservation.changedFenceIndexes
```

For Mermaid, `mermaidFit.status` is source-preserving evidence, not permission to rewrite or split a user diagram. `fits` means the preserved diagram satisfies the current rendered thresholds. `source-preserved-fit-review` means the deck remains structurally valid but should be visually reviewed, usually because zoom is low or margins are tight. `manual-review` means the preserved source diagram and presentation readability are in tension; the workflow must surface that fact instead of silently splitting the diagram.

`mermaidSourcePreservation` is a stricter structural gate: when the source note has Mermaid fences, the verifier compares each exported Mermaid fence against the corresponding source fence. A count-only match is not enough; changed content, reordered fences, changed fence metadata, or one source diagram rewritten as several diagrams must fail the report.

The same invariant is enforced earlier in source preparation: one-shot LLM generation and outline-continuation LLM generation compare source and candidate Mermaid fences before writing `_slidev-sources`. If the candidate changes count, order, fence metadata, or body text, the workflow falls back to deterministic source-preserving deck preparation.

The detailed implementation direction is tracked in `docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md`. That route keeps the current render-feedback loop as the final fact gate, adds a clean-room layout planning IR before generation, and translates the world-rect / viewport-fit ideas from `ref/infinite-canvas` into NoteMD-owned geometry logic instead of copying AGPL-3.0 implementation code or embedding an infinite-canvas UI in Slidev export.

Current landed truth as of 2026-06-20:

1. default HTML verification audits the full prepared deck when `--sample-slides` is not provided;
2. the patcher derives `zoom` from measured overflow instead of fixed export constants;
3. the patcher preserves source Mermaid fences by default; structural splitting applies to Markdown tables, pathological width-heavy or long-cell tables through record-list fallback, non-Mermaid fenced code blocks, simple heading + paragraph/list slides, generic slot-marked layouts (including explicit `::default::`), and first-slide deck headmatter content when structural splitting is possible;
4. generated Mermaid slide guardrails no longer seed or trust LLM-chosen `zoom`; generated Mermaid zoom is stripped before `_slidev-sources` is written, while existing user-authored Slidev decks keep their explicit source settings in the isolated working copy;
5. existing Slidev decks now use isolated prepared working-copy directories under `_slidev-sources/<deck-basename>/`, and common sibling Slidev support entries such as `layouts/`, `public/`, `setup/`, `components/`, `snippets/`, `styles/`, `global-top.vue`, and `global-bottom.vue` are mirrored into that workspace when present;
6. rendered layout audit now also measures direct-text `div`/`section`/`article`/`aside`/`span` blocks, so component-heavy slides do not silently under-audit as empty layouts;
7. component-heavy slot zones now carry lightweight owner wrappers inside prepared working copies, and rendered measurement now records zone-level owner rects, content bounds, scroll overflow, and recommended local transform scales for those zones;
8. slot-owned descendants are now measured even when `overflow-hidden` clips them out of the current viewport, so the audit no longer silently undercounts component-heavy slot content just because the slot container hides the overflow;
9. component-heavy custom slot layouts can now fall back to local `<Transform :scale=\"...\">` wrapping for overflowing slot zones when structural splitting is unavailable; that scale is derived from the detected out-of-bounds geometry and scroll overflow of the current slot-owner surface instead of fixed constants or manual LLM choice; when several component-heavy zones overflow independently, the patcher can now wrap each transformable zone in the same pass, and when a unique owner still must be chosen it prefers zone-level geometry first and falls back to slot signals / rendered text hints only when geometry ties;
10. hard overflow findings still use the rendered slide root as the pass/fail boundary, while `safeRect` remains the fit target for measured scale recommendations; this keeps edge-aligned layouts from being over-rejected while still letting the patcher derive conservative shrink factors;
11. the shared `convergeSlidevDeckLayout()` workflow now runs inside `exportSlidesCommand()` and the maintainer verifier, so HTML/PDF/PNG/MP4 export all reuse the same converged prepared deck;
12. the HTML exporter now returns a structured outcome with `requestedMode`, `actualMode`, fallback state, and standalone sanity details; known-bad native attempts are preserved as `index-standalone.failed.html` before compatibility fallback;
13. the real `docs/architecture.zh-CN.md` strict native standalone workflow now closes with `ok: true`, `actualMode: "standalone"`, `requiresLocalServer: false`, `standaloneGate.passed: true`, `27` audited slides, and zero hard overflow / unreadable scale / low effective font / quality margin warning / low utilization findings with `retryCount = 4`; the preserve-Mermaid run kept the source and exported deck at `3` Mermaid fences, and current verifier reports must also show `mermaidSourcePreservation.passed = true`; the current Stage 14 evidence package is stored at `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`;
14. `PDF` and `PNG` verification on the same source also return `ok: true`, and now export from the same converged deck instead of the raw prepared source;
15. rendered layout audit now reports effective minimum font, SVG text font, table/code minimum font, quality margins, and content-area ratio alongside hard overflow;
16. low effective font, tight margin, and low content utilization findings now carry structural `recommendedPatch` values for table/code/prose; Mermaid low-font metrics are recorded while preserving the source fence instead of automatically splitting one diagram into several diagrams;
17. source preparation now builds a clean-room `SlideLayoutPlan` and injects its deterministic layout budget into generated outlines, one-shot Slidev deck prompts, and outline-continuation prompts.
18. rendered layout audit now also reports `mermaidFit` and the matching summary counters so low Mermaid zoom, low Mermaid font, and manual-review cases remain visible without mutating the original Mermaid fence; the real `architecture.zh-CN.md` rerun reports `mermaidSlideCount = 3`, `mermaidFitReviewCount = 3`, `mermaidLowZoomCount = 2`, and `mermaidManualReviewCount = 1`.
19. table/code quality splitting now has a second structural slice: long table cells convert to key-value record-list slides, and code fences split by semantic blocks before falling back to blank-line or line-budget chunking.
20. effective font measurement now multiplies each text sample by local CSS `transform`, independent `scale`, and CSS `zoom` from the text node up to the slide root, so content wrapped in local `<Transform>` is judged by its rendered size instead of its unscaled computed font size.
21. TypeScript and JavaScript code fences now use a lightweight top-level tokenizer before generic semantic splitting, so contiguous import groups and top-level type/function/class/const declarations stay intact when a dense code slide is distributed across several slides.
22. Mermaid source preservation now has explicit regression tests: even if a Mermaid slide is mistakenly routed toward a code structural patch, the patcher must not treat one `mermaid` fence as a splittable code block; if one-shot or outline-continuation LLM generation changes source Mermaid fences, source preparation must reject the candidate before writing the prepared deck.
23. Python and Rust code fences now also use lightweight top-level tokenizers before generic semantic splitting, preserving Python import groups, decorators, top-level class/function blocks, Rust use groups, attributes, and top-level struct/enum/trait/impl/fn/mod items.
24. Stage 5 fixture coverage now separates `source-preserved-fit-review` from `manual-review` for preserved Mermaid diagrams and uses a Playwright measurement fixture to prove record-list table fallback renders as readable text instead of an overflowing table.
25. synthetic full-deck layout fixtures now run through the production verifier: `source-layout-stress` covers full skill references, native standalone, preserved Mermaid fences, record-list fallback, and code splitting; `slot-component-stress` covers component-heavy slot Transform convergence without whole-slide zoom stacking. The 2026-06-20 archive is `/home/jacob/slidev-export-review/2026-06-20-full-deck-layout-fixtures/`.
26. text overflow measurement now uses text-node Range glyph rectangles for text elements instead of block-level element boxes, so layouts are not failed because an `h1` block is wider than its actual visible text.
27. Mermaid-only slides may apply a measured low zoom to keep one preserved source diagram fully visible; the readability risk is surfaced through `mermaidFit.manual-review` instead of splitting or rewriting the source diagram.
28. mixed Mermaid/prose slides now move non-Mermaid primary content before permitting source-preserved Mermaid fit; every source Mermaid fence remains one byte-stable fence with unchanged opener, metadata, body, and closer, and unsupported mixed layouts block low whole-slide zoom instead of shrinking prose.
29. prepared deck workspaces now copy explicit local relative assets referenced by Markdown images, HTML media/link/srcset attributes, and Slidev frontmatter keys such as `background`, `image`, `src`, `favicon`, `poster`, and `download`; local CSS files referenced by the deck are then parsed as a local dependency graph, including `url(...)` image/font dependencies and local `@import` stylesheet chains relative to each CSS file location. URLs, absolute paths, null bytes, and out-of-scope traversal are rejected, copied CSS removes or neutralizes those rejected local references, and the source directory is not copied wholesale.
30. the local Slidev fork's standalone bundler now uses brace-balanced function replacement when stubbing Vite preload helpers, preventing the first slide loader binding from being deleted. The NoteMD strict standalone gate remains fail-closed and still reports loader gaps instead of accepting fallback output as native standalone.
31. after native standalone or server-script HTML build, the exporter syncs the prepared deck's explicit local file references, CSS `url(...)` dependencies, and local CSS `@import` chains into the final `<source>-slides/` directory so frontmatter backgrounds, image layouts, favicons, posters, linked CSS files, imported CSS files, local fonts, and local CSS background images do not resolve back to the temporary prepared workspace; rejected CSS imports/URLs are removed or neutralized in the copied CSS so standalone output does not request missing local files.
32. prepared decks inject `fonts.provider: none` when no explicit top-level `fonts:` config exists, avoiding strict standalone verification failures caused by remote Google Fonts fetches; explicit user font configuration is preserved.
33. the 2026-06-20 CSS asset dependency closeout archive is `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`; the real `architecture.zh-CN.md` strict standalone report is `ok = true`, `actualMode = "standalone"`, `requiresLocalServer = false`, `standaloneGate.passed = true`, `skillReferenceCount = 52`, and `mermaidSourcePreservation.passed = true`.
34. the 2026-06-20 CSS import/media fixture archive is `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`; the production fixture suite now covers recursive local CSS `@import`, imported CSS font/background dependencies, local video/audio/track/poster assets, CSS sanitizer behavior, and rejection of out-of-scope imported stylesheets in both prepared workspace and final standalone export.
35. generated test export artifacts are no longer tracked under `docs/export/test-slidev-*`, `docs/export/test-slidev.pdf`, `docs/export/test-slidev-video.mp4`, or the old `docs/export/slides/`; keep future generated Slidev outputs as external evidence packages unless a task explicitly asks to commit a reviewed artifact.
36. the 2026-06-20 font-safe slot/code convergence archive is `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`; slot-zone audit now records each zone's minimum effective font and minimum readable local Transform scale, and both local `<Transform>` and whole-slide `zoom` reject scale values that would push non-Mermaid text below the font floor.
37. multiple component-heavy named slots that cannot be locally transformed at a readable scale are split into independent default canvases while preserving `data-notemd-slot-zone` evidence; table/code structural splitting also triggers when the font floor rejects zoom, with chunk count derived from the measured fit factor.
38. the matching real `architecture.zh-CN.md` strict standalone archive is `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`; the report is `ok = true`, uses Jacob's local Slidev fork, loads 52 skill references, outputs native standalone HTML, passes Mermaid source preservation, and archives the reviewable `architecture.zh-CN.slidev.md`.
39. bounded raw HTML/component single-surface custom layouts can now use measured local `<Transform>` convergence without `data-notemd-slot-zone` wrappers. The `custom-single-surface-component-stress` fixture keeps `layout: surface-shell`, preserves the component surface content, and rejects the previous regression where a local Transform was compounded with whole-slide `zoom`.
40. the Stage 9 real `architecture.zh-CN.md` strict standalone archive is `/home/jacob/slidev-export-review/2026-06-20-stage9-architecture-real/`; the report is `ok = true`, uses Jacob's local Slidev fork, loads 52 skill references, outputs native standalone HTML, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, and archives the reviewable `architecture.zh-CN.stage9.slidev.md`.
41. bounded component-only Vue tree surfaces can now use the same measured local `<Transform>` convergence path. The `custom-vue-component-tree-stress` fixture covers multiline component openers, multiline prop arrays, nested components, and named template slots while keeping `layout: dashboard-shell`, avoiding `data-notemd-slot-zone`, and avoiding whole-slide `zoom`.
42. the Stage 10 real `architecture.zh-CN.md` strict standalone archive is `/home/jacob/slidev-export-review/2026-06-20-stage10-architecture-real/`; the report is `ok = true`, uses Jacob's local Slidev fork, loads 52 skill references, outputs native standalone HTML, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`, and archives the reviewable `architecture.zh-CN.stage10.slidev.md`.
43. the Stage 11 Mermaid source-boundary archive is `/home/jacob/slidev-export-review/2026-06-20-stage11-mermaid-source-boundary/`; new regression tests cover inline Mermaid fence metadata after mixed Mermaid/prose content movement and reject LLM candidates that only change Mermaid fence metadata. The real `architecture.zh-CN.md` strict native standalone report is `ok = true`, `actualMode = "standalone"`, `requiresLocalServer = false`, `mermaidSourcePreservation.passed = true`, `changedFenceIndexes = []`, `hardOverflowCount = 0`, and `lowEffectiveFontCount = 0`, with the reviewable `architecture.zh-CN.stage11.slidev.md` archived.
44. the Stage 12 mixed component/prose closeout archive is `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`; it adds `mixed-component-prose-stress`, and the full production fixture suite now covers 9 fixtures. `mixed-component-prose-stress` converges to 3 slides in 2 patch passes, preserves `layout: dashboard-shell`, preserves prose/component fingerprints, avoids whole-slide `zoom`, and converges the component page with measured local `<Transform>`.
45. the Stage 12 real `architecture.zh-CN.md` strict native standalone archive is `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`; the report is `ok = true`, uses `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` and `/home/jacob/slidev/skills/slidev` with 52 references, reports `actualMode = "standalone"`, `requiresLocalServer = false`, `standaloneGate.passed = true`, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`, and archives the reviewable `architecture.zh-CN.stage12.slidev.md` plus `architecture.zh-CN-slides/index-standalone.html`.
46. the Stage 13 expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture/`; `unsupported-component-table-boundary-stress` proves an unsupported component/table boundary is not silently repaired with whole-slide `zoom`, while one source Mermaid fence remains one exported Mermaid fence.
47. the Stage 13 default success fixture suite is archived at `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`; all 9 converging production fixtures pass, and expected-failure fixtures are excluded by default.
48. the Stage 13 real `architecture.zh-CN.md` strict native standalone archive is `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`; the report is `ok = true`, uses the local Slidev fork and 52 skill references, reports `actualMode = "standalone"`, `requiresLocalServer = false`, `standaloneGate.passed = true`, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`, and archives the reviewable `architecture.zh-CN.stage13.slidev.md` plus `architecture.zh-CN-slides/index-standalone.html`.
49. the Stage 14 component/fence expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture/`; `unsupported-component-fence-boundary-stress` proves an unsupported component/fence boundary is not silently repaired with whole-slide `zoom`, while one source Mermaid fence remains one exported Mermaid fence.
50. the Stage 14 component/image expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture/`; `unsupported-component-image-boundary-stress` proves the image boundary also fails transparently and verifies `assets/boundary-image.svg` in both the prepared deck and final standalone export.
51. the Stage 14 default success fixture suite is archived at `/home/jacob/slidev-export-review/2026-06-20-stage14-success-fixtures/`; all 9 converging production fixtures pass, and the three expected-failure fixtures are excluded by default.
52. the Stage 14 real `architecture.zh-CN.md` strict native standalone archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`; the report is `ok = true`, uses the local Slidev fork and 52 skill references, reports `actualMode = "standalone"`, `requiresLocalServer = false`, `standaloneGate.passed = true`, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`, and archives the reviewable `architecture.zh-CN.stage14.slidev.md` plus `architecture.zh-CN-slides/index-standalone.html`.

Current limitation:

1. effective font measurement now accounts for common local CSS transform/scale/zoom chains, but the browser rendered audit remains the authority for complex Vue layouts; do not replace it with static Markdown estimates;
2. richer custom/component-heavy Slidev layouts beyond the current supported structural set still remain conservative/manual-review paths, especially when no stable owner surface exists, when component/prose/component ordering is unstable, or when content cannot be safely paginated. Stage 14 covers component/table/fence/image fail-transparent behavior and component/directive zoom blocking is covered by unit tests; it is not proof that arbitrary Vue component trees can be transformed safely;
3. native standalone export now has a strict gate and the real architecture fixture passes it, but correctness still depends on post-build sanity detection; server-script fallback remains a compatibility lane and must not be counted as native standalone success;
4. full-deck Playwright verification is deliberately slower than representative sampling, so future work should improve convergence rather than weaken the audit;
5. `obsidian command id=notemd:export-slides` is still only a dispatch-level smoke because the Obsidian CLI does not expose an export-complete handshake.
6. Mermaid `manual-review` evidence is not a hard gate failure. It is the correct fail-transparent outcome when preserving the original Mermaid source and guaranteeing projector-level readability cannot both be proven automatically.
7. code splitting is still parser-light. TypeScript/JavaScript/Python/Rust now have top-level tokenizers, but full AST splitting and more language-specific splitters remain future work.
8. The Mermaid no-split constraint does not mean Mermaid presentation quality automatically passes. If a very large source diagram can only remain complete at low zoom, the workflow should surface `source-preserved-fit-review` or `manual-review` instead of silently rewriting or splitting the diagram.
9. the current full-deck fixtures cover long-table, wide-table, mixed-code, Mermaid source-preserved fit, component-heavy slot Transform boundaries, mixed Mermaid/prose non-diagram content movement, local image assets, nested slot components, ultra-wide tables, frontmatter background/image/favicon assets, cross-directory assets, CSS `url(...)` image/font dependencies, local CSS `@import` chains, local video/audio/track assets, offline font-provider boundaries, bounded raw HTML/component single-surface slides, bounded component-only Vue tree surfaces, clear-boundary mixed component/prose, and unsupported component/table/fence/image expected failures, but they are not exhaustive; add more fixture sources for complex Vue components and unsupported layouts as they fail in real documents.

## Output Policy

The generated files under `docs/export/` are maintainer inspection artifacts. They are intentionally useful for local visual review, but they should not be committed unless a release or documentation task explicitly asks for that artifact.

Before committing Slidev-export work, inspect:

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

Expected maintainer-local state:

1. generated files may appear as untracked;
2. `git check-ignore` should print nothing for the current verification artifacts;
3. the final commit should include source/workflow/docs changes, not ad hoc generated test output.

## UI Contract

The command palette export action and the sidebar export action both enter `exportSlidesCommand()`.

That method must keep the order:

1. probe environment;
2. prepare a Slidev export source;
3. export the prepared source in the selected format;
4. report the concrete output path.

Settings must expose the default export format (`HTML`, `PDF`, `PNG`, `MP4`) and the HTML mode when HTML is selected. A UI change that hides format selection regresses the export workflow.

## When To Run

Run `npm run verify:slidev-export` whenever a change touches:

1. `src/main.ts` export command wiring;
2. `src/ui/NotemdSidebarView.ts` or Slidev export controls;
3. `src/ui/NotemdSettingTab.ts` Slidev settings;
4. `src/slideExport/*`;
5. local Slidev fork resolution;
6. Slidev skill loading or prompt preparation;
7. output cleanup, bundling, or browser-launch behavior.

Run `npm run verify:slidev-layout-fixtures` as well when a change touches:

1. rendered layout measurement;
2. Mermaid fit/manual-review handling;
3. table/code structural splitting;
4. slot-zone measurement or local Transform patching;
5. any rule intended to avoid whole-slide low zoom for non-Mermaid content.

For code changes, also run:

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm test -- --runInBand src/tests/slidevRenderedMeasurement.test.ts
PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright npm run verify:slidev-layout-fixtures -- --timeout-ms 300000
npm run build
git diff --check
```

## Slidev Skill PR Assessment

A PR to the shared Slidev skill is worthwhile only for generic guidance that applies beyond NoteMD.

Good upstream skill candidates:

1. when converting long-form technical documents into Slidev decks, use the full skill reference set instead of relying only on the top-level `SKILL.md`;
2. prefer built-in or configured themes unless the project explicitly declares an installed custom theme;
3. close per-slide frontmatter before slide body content;
4. keep user Mermaid diagrams intact and let rendered browser audit derive any required Mermaid zoom or review state, while tables and dense code blocks use structural splits, `zoom`, or `Transform` according to measured overflow;
5. verify exported decks by building and opening rendered slides in a browser, not only by checking that Markdown was generated;
6. clear or recreate output directories before rebuilds when stale assets can affect browser output.

Keep these project-local instead of upstreaming:

1. `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` fork discovery;
2. NoteMD's vault-relative output paths;
3. the exact `architecture.zh-CN.md` smoke fixture;
4. NoteMD-specific stale text checks such as `快速定位`.

Recommendation: prepare a small upstream Slidev skill PR for the generic deck-conversion/export guardrails after this NoteMD workflow stabilizes. Do not upstream NoteMD-specific path or vault behavior.
