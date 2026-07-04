# Slidev Export Solution Summary

This document records the current Slidev export truth for NoteMD.

## Current Export Model

NoteMD no longer treats direct `slidev build` as a sufficient proof for the UI export buttons.

The maintained workflow is:

1. The active note is prepared as a Slidev deck when it is not already a Slidev deck.
2. Existing Slidev decks are copied into an isolated prepared working workspace before export verification so the verifier can audit and patch without mutating the source note, and so sibling Slidev support entries plus explicitly referenced local assets can be mirrored into the working copy.
3. The full Slidev skill directory is loaded when available, including `references/*.md`.
4. Generated decks receive presentation guardrails before export, and large Mermaid guardrails no longer overwrite a slide that already declares `zoom`.
5. The local Slidev fork is preferred when present.
6. HTML output directories are recreated before build to avoid stale assets.
7. HTML export attempts native standalone first, records the actual HTML mode, and falls back to server-script-compatible HTML only when native standalone sanity checks find real missing slide loader bindings.
8. Browser rendering is verified with Playwright across the full deck by default.
9. When the Playwright runtime is available, `exportSlidesCommand()` and the maintainer verifier both run the same `convergeSlidevDeckLayout()` loop before final `HTML`/`PDF`/`PNG`/`PPTX`/`MP4` export.

The canonical maintainer workflow is documented in:

```text
docs/maintainer/slidev-export-workflow.md
docs/maintainer/slidev-export-workflow.zh-CN.md
```

The current strict standalone acceptance index for the real `architecture.zh-CN.md` run is:

```text
docs/maintainer/slidev-standalone-acceptance-2026-06-18.md
docs/maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md
```

## HTML Modes

### Standalone HTML

Standalone HTML is the preferred local-inspection path when the installed Slidev CLI supports `--standalone-bundle`.

Expected output:

```text
docs/export/<source-basename>-slides/index-standalone.html
```

This path should be openable directly from the filesystem and is the default mode used by:

```bash
npm run verify:slidev-export
```

When the native standalone bundle is invalid, NoteMD falls back to the server-script-compatible HTML path instead of shipping a broken `index-standalone.html`. Maintainer closure that specifically claims native standalone must use the strict gate, not the compatibility pass.

### Server-Script HTML

Server-script mode remains available for compatibility with normal Slidev SPA builds that need HTTP serving, and it is now the automatic fallback when native standalone bundle sanity checks fail.

Expected output:

```text
docs/export/<source-basename>-slides/index.html
docs/export/<source-basename>-slides/start-server.sh
docs/export/<source-basename>-slides/start-server.bat
docs/export/<source-basename>-slides/README.md
```

Use this mode when a build must be served via localhost instead of opened as a standalone file.

### Strict Native Standalone Gate

Compatibility HTML verification may pass through server-script fallback. Native standalone verification is a stricter claim and must be run with:

```bash
node scripts/verify-slidev-export-workflow.cjs --json --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md
```

Strict pass conditions add:

1. `htmlExport.actualMode = "standalone"`
2. `htmlExport.requiresLocalServer = false`
3. `htmlExport.standaloneAttempt.accepted = true`
4. `htmlExport.standaloneAttempt.loaderGaps = []`
5. `standaloneGate.required = true`
6. `standaloneGate.passed = true`
7. `renderedLayoutGate.required = true`
8. `renderedLayoutGate.passed = true`
9. `tableBodyLayoutGate.passed = true`

The gate exists because a compatibility run with `ok: true` can still mean `actualMode = "server-script-fallback"`. A fast run with `--no-playwright` can also prove only that the native `--standalone-bundle` file was produced; it does not prove that the final standalone artifact has gone through rendered layout convergence. Maintainer closure for standalone HTML must not use `--no-playwright` with `--require-native-standalone`.

Mermaid fences are not split by this gate. The rendered layout gate is about browser-observed artifact correctness, and the table/body gate specifically covers table and primary body-text pages. The same converged prepared deck is then used for the downstream `PDF`, `PNG`, `PPTX`, and `MP4` export paths.

## Local Fork Resolution

Slidev command resolution prefers:

1. `NOTEMD_SLIDEV_BIN`
2. `SLIDEV_CLI_PATH`
3. `$HOME/slidev/packages/slidev/bin/slidev.mjs`
4. `<vault-or-project>/node_modules/.bin/slidev`
5. `npx -y @slidev/cli`

On Jacob's workstation, the maintained verification path should report either the local fork path or a project binary installed from the NoteMD fork release in `environment.slidev.version`. The `npx -y @slidev/cli` entry is only a last-resort probe fallback; it is not the NoteMD install recommendation. The registry package and the fork package both report `@slidev/cli@52.16.0`, so semver alone is not a valid compatibility signal. Environment probing must run `slidev build --help` and require `--out`, `--format`, and `--standalone-bundle`; otherwise Slidev is unavailable for the standalone-required path.

## Fork Release Distribution

The UI install path must point at an npm-installable release artifact, not at a GitHub source tree, blob, or branch URL. A branch URL can show the code but it is not a stable package boundary for `npm install`, and it can drift after the UI has shipped.

Current NoteMD fork package:

```text
https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz
```

The sidebar's copied install command is:

```bash
npm install -D https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz @slidev/theme-default
```

Validation on 2026-06-21 proved that the release asset packs as `@slidev/cli@52.16.0`, installs into a clean npm project, exposes the `slidev` binary, and includes `build --help` support for `--standalone-bundle`. NoteMD's own `package.json` must use this release tarball instead of `^52.16.0` from the npm registry, because the registry build with the same semver does not provide the native standalone bundle option.

The release is intentionally attached to the fork branch that carries the NoteMD standalone fix. Do not replace it with a `tree`, `blob`, raw file, or moving branch link in UI copy. Those links are useful for code review, but they are not package artifacts and do not give npm a stable executable package boundary.

## Editable PPTX Export

NoteMD now supports `pptx` as an export format in addition to HTML, PDF, PNG, and MP4.

The PPTX path is intentionally not a screenshot-only export. It follows the stronger `oh-my-ppt` architecture shape instead of the `huashu-design` source-template-only shape:

1. converge the Slidev deck through the same rendered HTML workflow used by normal export;
2. open the final HTML in Playwright;
3. navigate each Slidev route (`#/1`, `#/2`, ...);
4. extract visible text boxes from the rendered DOM as editable PowerPoint text frames;
5. extract HTML `<table>` elements first into a transparent native DrawingML table structure layer with cell text, row/column geometry, and merge metadata;
6. capture each rendered slide as a visual fallback image layer for complex CSS, Mermaid, SVG, canvas, icons, and layout effects;
7. write a clean-room PresentationML `.pptx` package with `fflate`;
8. write a sidecar `.pptx.report.json` with editability metrics.

The adopted part of `oh-my-ppt` is the pipeline and quality-gate shape, not a byte-for-byte output contract. `oh-my-ppt` hides extracted primitives before background capture and checks for residual text because its native text/table layers are visible. NoteMD currently keeps the frozen background image as the visible layer and writes editable text/table structures as transparent layers, so the background capture must retain visible text. Residue detection should become a hard gate only when a future slice makes native text or native tables visible.

This is not the same as running arbitrary visual HTML through a strict HTML-to-PPTX template converter. The `huashu-design` approach is valuable when the source HTML is authored under PPTX constraints from the start: text must live in paragraph/headline tags, backgrounds must be on container elements, gradients and `background-image` are constrained, and dimensions must match the PowerPoint layout. Slidev output is a SPA with Vue, transforms, Mermaid SVG, and complex CSS, so forcing that route onto generated Slidev HTML would be brittle. NoteMD therefore uses a browser-observed extraction path and reports the parts that remain image fallback.

Expected PPTX outputs:

```text
docs/export/<source-basename>.pptx
docs/export/<source-basename>.pptx.report.json
```

Maintainer command:

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --json
```

PPTX pass conditions add:

1. `environment.capabilities.pptx = true`
2. `pptxInspection.isZip = true`
3. `pptxInspection.slideCount` matches the rendered deck slide count
4. `pptxInspection.textRunCount > 0`
5. `pptxInspection.slidesWithoutEditableText = []` for decks that contain text on every slide
6. decks with HTML tables record `pptxInspection.tableCount`
7. the sidecar report has `editableTextSlideCount`, `textBoxCount`, `tableCount`, `editableTableCellCount`, `imageFallbackCount`, and `pagesWithoutEditableText`

For visual fidelity, run the PPTX render-back gate:

```bash
npm run verify:slidev-export -- --format pptx --source architecture.zh-CN.md --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json
```

This gate extracts the frozen background image from each PPTX slide relationship, renders the PPTX back through LibreOffice -> PDF -> `pdftoppm`, then compares each page with ImageMagick RMSE/AE. It intentionally does not rerun Slidev PNG export as the strict reference, because a second Slidev export is a different rendering instance and can drift in font antialiasing or page state. The hard PPTX visual gate validates that Office preserves the visual layer actually written into the PPTX; HTML/layout correctness remains owned by rendered convergence and browser audit.

The current implementation deliberately treats Mermaid/SVG/canvas and complex decoration as image fallback. That preserves source Mermaid content and visual fidelity, but those graphic parts are not editable PowerPoint shapes. Tables have a native DrawingML structure layer, but it is transparent by default because Office table layout does not yet reliably match Slidev CSS. The user-facing contract is therefore "editable text and transparent table structure over a visual fallback layer", not "perfectly editable reconstruction of every Slidev/Vue/CSS object".

## Real Verification Command

Run:

```bash
npm run verify:slidev-export
```

Default real source:

```text
docs/architecture.zh-CN.md
```

Important pass conditions:

1. `ok: true`
2. `slideSource.skillReferenceCount > 0`
3. `ignoredOutputs: []`
4. no stale deck text
5. no missing-theme marker such as `seriph`
6. every Playwright sample has `failed: false`
7. `layoutAuditSummary.overflowCount = 0`
8. `layoutAuditSummary.unreadableCount = 0`
9. `layoutAuditSummary.lowEffectiveFontCount = 0`
10. quality-margin and content-area findings are either zero or explained by a structural patch attempt
11. source Mermaid fences remain one-to-one with exact fence content in the exported deck unless a human explicitly edits the source

Real maintained baseline as of 2026-06-21:

1. `node scripts/verify-slidev-export-workflow.cjs --json` on `docs/architecture.zh-CN.md` returns `ok: true`
2. the report confirms `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`
3. the report confirms `/home/jacob/slidev/skills/slidev`
4. default HTML verification now audits the full prepared deck, not only representative slides
5. the real `architecture.zh-CN` deck converges to `27` audited slides after bounded patching with `overflowCount = 0`, while preserving the source Mermaid fence count (`3` source fences, `3` exported fences); current reports must also show `mermaidSourcePreservation.passed = true`
6. `PDF` and `PNG` verification on the same real source also return `ok: true` after exporting from the same converged deck
7. the current local Slidev `52.16.0` fork now passes the strict native standalone gate for the real `architecture.zh-CN` HTML export after fixing NoteMD's loader-binding detector to accept minified identifiers such as `$n`; the final real output is `index-standalone.html`, not a fallback-only `index.html`
8. existing Slidev deck fixtures now go through isolated prepared working copies, so maintainer verification no longer under-audits them as single-slide files or loses sibling `layouts/*.vue`
9. rendered audit now includes effective font, SVG text font, table/code minimum font, quality margins, and content-area ratio
10. low effective font, tight margin, and low utilization now create structural patch recommendations for table/code/prose before whole-slide zoom is reduced further; Mermaid keeps the source fence intact by default
11. source preparation now injects a clean-room `SlideLayoutPlan` budget into deterministic outlines and LLM deck prompts
12. rendered audit now reports source-preserved Mermaid fit evidence through `layoutAudit[].mermaidFit` and summary counters for Mermaid review, low zoom, and manual-review cases; the latest real strict run reports `mermaidSlideCount = 3`, `mermaidFitReviewCount = 3`, `mermaidLowZoomCount = 2`, and `mermaidManualReviewCount = 1`
13. mixed Mermaid/prose slides no longer solve fit by keeping low whole-slide zoom on prose; the patcher may move only the non-Mermaid primary content onto a readable slide while preserving every source Mermaid fence opener, metadata, body, and closer as byte-stable content
14. explicit local relative assets referenced by Markdown images, HTML media/link/srcset attributes, and Slidev frontmatter keys are copied next to the prepared deck; local CSS files referenced by the deck are parsed as a local dependency graph, including `url(...)` image/font dependencies and local `@import` stylesheet chains relative to each CSS file location, so isolated `_slidev-sources` workspaces do not break source-relative SVG/PNG/JPEG/background/favicon/poster/font references
15. the local Slidev fork's standalone bundler now preserves first-slide loader bindings when stubbing Vite preload helpers; NoteMD's strict standalone gate remains fail-closed and continues to report real `loaderGaps`
16. HTML export syncs the prepared deck's explicit local file references into the final `<source>-slides/` output directory, and prepared decks default to `fonts.provider: none` unless the source already declares top-level `fonts:`
17. the environment-check UI links to the fork release page and copies an `npm install -D <release .tgz> @slidev/theme-default` command; it must not suggest branch source links or generic official `@slidev/cli` installs for the standalone-required NoteMD path
18. editable PPTX export runs after the same rendered convergence gate, writes a PresentationML package with real `<a:t>` text nodes, and emits a JSON report instead of pretending the whole deck is natively editable
19. the real `architecture.zh-CN.md` PPTX run on 2026-06-21 returned `ok = true`, produced `27` slides, `331` slide XML text runs, `4` native table structures, `27` visual fallback images, and no slides without editable text

Dedicated standalone acceptance evidence is tracked in `docs/maintainer/slidev-standalone-acceptance-2026-06-18.*`. Editable PPTX acceptance evidence is tracked in `docs/maintainer/slidev-editable-pptx-acceptance-2026-06-21.*`. The latest real Stage 15 acceptance archive is `/home/jacob/slidev-export-review/2026-06-21-stage15-final-rerun/`; the current real editable PPTX archive is `/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/`. Generated HTML, screenshots, PPTX files, and install-smoke scratch files remain outside the commit so the main branch does not gain one-off export artifacts.

## Current Rendered Layout Model

The current workflow is now strong enough to reject broken wiring, missing skill references, stale output directories, missing local fork usage, browser-open failures, and visible layout overflow on the real `docs/architecture.zh-CN.md` fixture.

The current render-feedback loop is now:

1. `prepareSlidevExportSource()` still loads the full Slidev skill directory, asks the LLM to preserve source Mermaid fences, rejects LLM deck candidates that change those fences, and asks it to split dense prose, tables, or code before export.
2. `SlideLayoutPlan` estimates dense Markdown blocks before generation and feeds a deterministic layout budget into outlines and LLM prompts.
3. `scripts/verify-slidev-export-workflow.cjs` and the product `exportSlidesCommand()` now share the same convergence workflow, which renders the built HTML in Playwright, waits for visible slide content, and measures the actual `slidev-page` root plus overflow-prone elements.
4. `SlidevOverflowAudit` classifies `overflow`, `unreadable-scale`, `render-error`, `low-effective-font`, `tight-margin`, and `low-content-utilization` from rendered geometry, records source-preserved Mermaid fit status, and also records slot-zone owner rects, content bounds, scroll overflow, and recommended local transform scales instead of relying only on Markdown heuristics.
5. `SlidevDeckPatch` now applies overflow-derived slide `zoom` values, zone-local `<Transform>` scales derived from detected out-of-bounds geometry, and escalates to structural patching for tables, code, prose, or competing component slots when shrinking further would make the slide unreadable or when rendered quality findings recommend splitting.
6. The current structural patcher supports:
   - simple heading + paragraph/list slides
   - Markdown tables, including row-split and width-driven column decomposition
   - pathological width-heavy and long-cell tables through deterministic record-list fallback
   - non-Mermaid fenced code blocks, with TypeScript/JavaScript/Python/Rust top-level tokenizer chunking before generic semantic-block, blank-line, or line-budget fallback
   - generic slot-marked layouts, including explicit `::default::`, supported built-in slot layouts, and custom named slots when the slot content is structurally patchable
   - unique component-heavy slot zones through local `<Transform :scale="...">` wrapping when structural splitting is unavailable
   - multiple unsafe component-heavy named slots through slot-level pagination when local Transform scale would violate the font floor
   - first-slide deck headmatter content when structural splitting is possible
   - mixed Mermaid/prose slides by moving prose/list content away from the diagram slide while preserving each Mermaid fence opener, metadata, body, and closer unchanged
7. The HTML exporter now records structured HTML outcomes, rejects known-bad native standalone bundles, preserves rejected native attempts as `index-standalone.failed.html`, and falls back to server-script-compatible HTML only for the compatibility path.
8. The verifier now audits the full deck by default and keeps retrying within a bounded loop until the rendered deck fits or the retry budget is exhausted.

Mermaid handling has a stricter content-preservation rule than tables, code, or prose. A user-provided Mermaid fence remains one diagram. When the preserved diagram is low-zoom, low-font, or too tight to prove presentation quality automatically, the workflow records `fits`, `source-preserved-fit-review`, or `manual-review` evidence instead of rewriting the source graph into several diagrams.

Operationally this is a hard invariant, not a preference: automated export must not split one source Mermaid fence, derive alternative Mermaid diagrams from it, rewrite its body, change its fence metadata, or reorder it. The automatic path may only fit the rendered diagram, move non-Mermaid neighboring content, add explanation outside the fence, or expose review evidence; changing Mermaid content requires an explicit human source edit.

This is now enforced before the prepared deck is written, not only after export verification: both one-shot LLM deck generation and outline-continuation LLM generation compare every source Mermaid fence against the candidate deck and fall back to deterministic source-preserving preparation if the candidate changes count, order, fence metadata, or body text.

The verifier now enforces that rule with `mermaidSourcePreservation`: each exported Mermaid fence is compared to the corresponding source fence. A block-count-only match is not enough.

Mixed Mermaid/prose slides are different from Mermaid-only slides: low whole-slide zoom is not acceptable because it makes the prose unreadable. The supported repair is to keep the Mermaid source fence byte-stable on a diagram-focused slide and move only the prose/list content to its own readable slide. It is not a license to split one Mermaid diagram into several diagrams. If the slide layout is unsupported and that prose move cannot be done safely, the patcher blocks the low zoom instead of shrinking mixed content.

That rule is also covered by a unit regression now: even if a Mermaid slide is mistakenly routed toward a code structural patch, the patcher must refuse to treat a `mermaid` fence as a splittable code block.

Mixed component/prose slides now follow the same readability-first shape without changing the Mermaid rule: when a custom layout contains one complete component/Vue surface and one Markdown prose/list content block, the patcher separates them into two presentation surfaces before whole-slide zoom is considered. The next rendered audit pass can then wrap only the component block in a measured local `<Transform>`, while the prose page remains readable. If the mixed component slide contains a fence, table, image, directive, existing Transform, or unstable component/prose/component ordering, the patcher blocks the zoom/manual-review path instead of silently shrinking prose.

Stage 13/14 move that unsupported-boundary rule into the production fixture runner. `unsupported-component-table-boundary-stress`, `unsupported-component-fence-boundary-stress`, and `unsupported-component-image-boundary-stress` are expected-failure fixtures: when selected explicitly, the verifier should end with `ok = false`, while native standalone export, browser loading, generated-artifact visibility, the failure-review fingerprint, and Mermaid source preservation all still pass. The image fixture also proves that its local SVG asset survives in both the prepared deck and final standalone export. The default `verify:slidev-layout-fixtures` run remains success-only; use a concrete `--fixture ...` or `--include-expected-failures` to audit fail-transparent boundaries.

The clean-room reference from `ref/infinite-canvas` is still the world-rect and viewport-transform idea: nodes have `{ position, width, height }`, the viewport has `{ x, y, k }`, and visible bounds are derived from transform math. For NoteMD export, that becomes an export-layout camera for a fixed Slidev safe rectangle, not an interactive infinite canvas. Because the reference project is AGPL-3.0 and NoteMD is MIT, implementation must be independent.

Current landed state:

1. `verify:slidev-export` now resolves Jacob's local Slidev fork, Slidev skill references, and Playwright browser cache from workspace-aware paths instead of trusting the current process home blindly.
2. the maintainer verification chain now measures the visible `slidev-page` root with Playwright, captures Mermaid shadow-host bounding boxes, and fails when the actual visible slide root clips content.
3. the patcher is no longer zoom-only: it first applies overflow-derived `zoom`, then structurally splits supported Markdown table, code-fence, and simple text/list slides when rendered evidence says further shrinking would be the wrong move; Mermaid source fences are preserved by default and are not rewritten into several diagrams.
4. the real product export path now converges the prepared working deck before final `HTML`/`PDF`/`PNG`/`MP4` export, instead of keeping the patch/rebuild loop verifier-only.
5. existing Slidev deck working copies now live under `_slidev-sources/<deck-basename>/`, and common sibling support entries such as `layouts/`, `public/`, `setup/`, `components/`, `snippets/`, `styles/`, `global-top.vue`, and `global-bottom.vue` are mirrored there when present.
6. rendered layout audit now also measures direct-text `div`/`section`/`article`/`aside`/`span` blocks, which closes the previous under-audit gap for component-heavy slides.
7. component-heavy slot zones now carry lightweight owner wrappers inside prepared working copies, so rendered measurements can feed slot ownership, zone-level owner geometry, local overflow scale, and slot-owned descendants that are clipped by `overflow-hidden` back into the patch loop instead of relying only on slide-global inference.
8. hard overflow remains rooted in the rendered slide root, while `safeRect` stays the conservative fit target for measured scale recommendations; this keeps the gate tied to actual clipping while still steering shrink decisions away from edge-hugging layouts.
9. `PDF` and `PNG` export now pass `PLAYWRIGHT_BROWSERS_PATH` through the Slidev CLI env so root-run verification can reuse Jacob's browser cache.
10. the real `docs/architecture.zh-CN.md` HTML workflow now passes with a full-deck Playwright audit, `overflowCount = 0`, and bounded retry closure.
11. an additional real maintainer-local structural overflow note now proves that Markdown table decomposition and code-fence chunking can converge through the same verifier path instead of only through unit tests.
12. a real slot/headmatter Slidev deck now proves that native standalone loader gaps are detected and converted into a working `index.html + start-server.* + README.md` fallback instead of being treated as successful standalone output.
13. real maintainer-local decks now also prove:
   - explicit `::default::` slot handling
   - existing Slidev deck working-copy verification
   - pathological table fallback into record-list slides, including long-cell tables where row/column splitting would preserve cramped prose
   - slot-marked custom layouts backed by a real custom `layouts/*.vue` file
   - component-heavy custom slot layouts converging through zone-level owner-geometry-based local `<Transform>` wrapping, including same-slide multi-zone cases where more than one overflowing transformable slot can be wrapped in the same pass while slot signals and rendered text hints stay as bounded fallback for attribution ties
   - a dense two-zone custom layout where slot-owned descendants originally clipped under `overflow-hidden` are now measured correctly and converge to `ok: true` without forcing whole-slide zoom
   - local CSS `transform` / independent `scale` / CSS `zoom` awareness in effective font measurement, so locally transformed content is judged by rendered size
14. the real `docs/architecture.zh-CN.md` strict native standalone run now closes with `actualMode = "standalone"`, `requiresLocalServer = false`, `loaderGaps = []`, `standaloneGate.passed = true`, `29` audited slides, zero hard overflow / unreadable scale / low effective font / quality margin warning / low utilization findings, and bounded retry closure.
15. Mermaid fit review is now explicit report data. It is intentionally separate from hard overflow: a `manual-review` Mermaid status is evidence that source preservation and automatic readability proof are in tension, not permission to auto-split the diagram.
16. the expanded full-deck fixture suite archives native standalone fixtures under `/home/jacob/slidev-export-review/2026-06-20-expanded-layout-fixtures/`: source-layout stress with 52 Slidev skill references, slot/component Transform stress, mixed Mermaid/prose non-diagram content separation, media/nested-slot/ultra-wide-table stress, and frontmatter/cross-directory asset stress.
17. prepared deck export now keeps explicit frontmatter/media/CSS dependency assets available in final HTML output, including imported local CSS dependency chains, and disables remote font providers by default for prepared decks while preserving explicit user font configuration.
18. the final CSS dependency verification archive is `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`: the real `architecture.zh-CN.md` strict standalone report is `ok = true`, uses `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`, loads 52 Slidev skill references, preserves all 3 source Mermaid fences byte-for-byte, and outputs native standalone HTML without local-server fallback.
19. out-of-scope CSS imports/URLs are not copied and are removed or neutralized in copied CSS files, so standalone output does not request rejected paths such as `outside.css` or `outside.svg`.
20. the CSS import/media fixture archive is `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`: the production fixture suite now verifies local CSS `@import` recursion, imported CSS font/background dependencies, local video/audio/track/poster assets, CSS sanitizer behavior, and rejection of out-of-scope imported stylesheets in both prepared workspace and final standalone export.
21. source preparation now rejects both one-shot and outline-continuation LLM deck candidates that split, derive multiple generated diagrams, rewrite, reorder, or only alter metadata on source Mermaid fences, then falls back to deterministic source-preserving preparation instead of writing a mutated deck.
22. historical generated `docs/export/test-slidev-*`, `docs/export/test-slidev.pdf`, `docs/export/test-slidev-video.mp4`, and old `docs/export/slides/` artifacts are no longer tracked in `main`; reusable export guidance remains in `docs/export/README.md` and `docs/export/README.zh-CN.md`.
23. the font-safe slot/code convergence archive is `/home/jacob/slidev-export-review/2026-06-20-competing-slot-zones-final-fixtures-v2/`: production fixtures cover unsafe competing slot pagination, font-floor zoom blocking, and fit-factor code splitting while keeping hard overflow and low effective font at zero.
24. the matching real `architecture.zh-CN.md` strict standalone output is archived at `/home/jacob/slidev-export-review/2026-06-20-font-safe-real/`; `architecture.zh-CN.slidev.md` is the reviewable exported deck and `index-standalone.html` is the native standalone output.
25. the Stage 12 mixed component/prose fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-fixtures/`: the production suite covers a custom `dashboard-shell` Vue component surface plus Markdown prose separation and closes with 3 slides, 2 patch passes, no whole-slide zoom, and preserved component/prose fingerprints.
26. the Stage 12 real `architecture.zh-CN.md` strict standalone output is archived at `/home/jacob/slidev-export-review/2026-06-20-stage12-mixed-component-prose-real/`; `architecture.zh-CN.stage12.slidev.md` is the reviewable exported deck and `architecture.zh-CN-slides/index-standalone.html` is the native standalone output.
27. the Stage 13 expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage13-unsupported-component-boundary-fixture/`: `unsupported-component-table-boundary-stress` is correct only when verifier `ok = false`, `hardOverflowCount > 0`, and the blocked reason says mixed component plus primary Markdown content cannot be repaired with whole-slide `zoom`, while its single source Mermaid fence remains byte-stable in the exported deck.
28. the Stage 13 default success fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage13-success-fixtures/`: all 9 converging production fixtures pass, and expected-failure fixtures are not included in the default green path.
29. the Stage 13 real `architecture.zh-CN.md` strict standalone output is archived at `/home/jacob/slidev-export-review/2026-06-20-stage13-real/`; `architecture.zh-CN.stage13.slidev.md` is the reviewable exported deck and `architecture.zh-CN-slides/index-standalone.html` is the native standalone output. The report is `ok = true`, uses the local Slidev fork and 52 skill references, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, and closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`.
30. the Stage 14 component/fence expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-fence-boundary-fixture/`: `unsupported-component-fence-boundary-stress` is correct only when verifier `ok = false`, the blocked reason says mixed component plus primary Markdown content cannot be repaired with whole-slide `zoom`, no whole-slide zoom is introduced, and its single source Mermaid fence remains byte-stable.
31. the Stage 14 component/image expected-failure fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-unsupported-component-image-boundary-fixture/`: `unsupported-component-image-boundary-stress` proves the same fail-transparent behavior and also verifies `assets/boundary-image.svg` in the prepared deck and final standalone export.
32. the Stage 14 default success fixture archive is `/home/jacob/slidev-export-review/2026-06-20-stage14-success-fixtures/`: all 9 converging production fixtures still pass, and the three expected-failure fixtures stay out of the default green path.
33. the Stage 14 real `architecture.zh-CN.md` strict standalone output is archived at `/home/jacob/slidev-export-review/2026-06-20-stage14-real/`; `architecture.zh-CN.stage14.slidev.md` is the reviewable exported deck and `architecture.zh-CN-slides/index-standalone.html` is the native standalone output. The report is `ok = true`, uses the local Slidev fork and 52 skill references, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, and closes with `hardOverflowCount = 0` and `lowEffectiveFontCount = 0`.
34. the Stage 15 real `architecture.zh-CN.md` strict standalone output is archived at `/home/jacob/slidev-export-review/2026-06-21-stage15-final-rerun/`; `architecture.stage15.slidev.zh-CN.md` is the reviewable exported deck and `architecture.zh-CN-slides/index-standalone.html` is the native standalone output. The report is `ok = true`, uses the local Slidev fork and 52 skill references, preserves all 3 Mermaid fences with `changedFenceIndexes = []`, and closes with `hardOverflowCount = 0`, `lowEffectiveFontCount = 0`, and native standalone accepted. A repo-visible copy of the real exported Slidev Markdown is tracked at `docs/slidev/architecture.stage15.slidev.zh-CN.md`; the generated HTML/assets/screenshots remain outside the commit.
35. on 2026-06-21 the editable PPTX path was closed against the real `architecture.zh-CN.md` fixture with a frozen-background visual reference. The strict run under `docs/export/test-slidev-pptx-frozen-reference-strict/` returned `ok = true`, `pptxVisualGate.passed = true`, `meanRmse = 0.049441916296296295`, `maxRmse = 0.0889364`, `reference.source = pptx-background-images`, 27 slides, 331 editable text runs, 27 picture fallback layers, and 4 native DrawingML table structures.

Current gap:

1. richer custom/component-heavy Slidev layouts beyond the current supported structural set still fall back to conservative/manual-review behavior, especially when there is no stable owner, the component/prose order is ambiguous, or a single non-Mermaid component surface cannot be structurally split or transformed within the font floor; component/table/directive/fence/image boundaries now have explicit blocking coverage;
2. standalone export now has a strict native gate and the real architecture fixture passes it, but correctness still depends on post-build sanity detection; server-script fallback remains a compatibility lane for future bad bundles, not evidence that native standalone passed;
3. full-deck Playwright verification is now more correct, but noticeably slower, so future work should improve patch convergence instead of weakening the audit back to representative sampling;
4. the Obsidian CLI can dispatch `notemd:export-slides`, but it does not expose an export-complete handshake, so host-command smoke is still weaker than the maintainer verifier;
5. editable PPTX is currently a pragmatic extraction layer: text is editable, tables have transparent native DrawingML structure, and strict visual fidelity passes against the frozen background layer, but Mermaid, SVG, canvas, and Vue component internals are not yet reconstructed as editable Office-native objects.

## Next-Level Layout Quality Direction

The current acceptance proves that export does not clip, can pass strict standalone, and follows the real UI-equivalent workflow. It does not by itself prove presentation quality. Under the source-preserving Mermaid constraint, a large source Mermaid diagram may still require low zoom; the workflow should record that tradeoff instead of rewriting the original diagram into several diagrams or deriving substitute diagrams from it.

The next direction should not replace the current render-feedback pipeline. It should:

1. keep `convergeSlidevDeckLayout()` as the final fact gate;
2. add a clean-room `SlideGeometry` / `SlideLayoutPlan` layer before source preparation, borrowing only the world-rect, union-bounds, and viewport-fit ideas from `ref/infinite-canvas` without copying AGPL-3.0 implementation code;
3. keep rendered effective-font, quality-margin, content-area-ratio, low-utilization, and Mermaid fit-review metrics in the verifier report;
4. preserve Mermaid source fences while pre-splitting table/code/prose content so large non-Mermaid content is not solved mainly by low `zoom`;
5. report hard gate and quality gate separately: hard overflow still fails closed, while quality warnings drive splitting, relayout, or manual review.

Detailed progress comparison and implementation direction are tracked in:

```text
docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md
```

## Output Policy

The verification command writes inspectable files under `docs/export/`. They are useful local evidence, but they are not meant to be committed unless a release or documentation task explicitly asks for those generated artifacts.

Before committing, check:

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

For local verification artifacts, `git check-ignore` should print nothing.

## Why The Workflow Was Hardened

The previous workflow missed several failure modes:

1. direct CLI smoke tests did not prove that UI actions called source preparation;
2. non-outline export did not have a durable proof that full Slidev references were available to deck generation;
3. stale output directories allowed old chunks or old deck content to survive rebuilds;
4. LLM-created decks could emit malformed per-slide frontmatter;
5. LLM-created decks could select uninstalled themes;
6. large Mermaid diagrams could overflow the 16:9 canvas;
7. generated output could be hard to inspect if ignored or cleaned too early.

The current verification workflow makes those failure modes explicit.
