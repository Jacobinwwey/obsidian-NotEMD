# Slidev Export Solution Summary

This document records the current Slidev export truth for NoteMD.

## Current Export Model

NoteMD no longer treats direct `slidev build` as a sufficient proof for the UI export buttons.

The maintained workflow is:

1. The active note is prepared as a Slidev deck when it is not already a Slidev deck.
2. Existing Slidev decks are copied into an isolated prepared working workspace before export verification so the verifier can audit and patch without mutating the source note, and so sibling Slidev support entries can be mirrored into the working copy.
3. The full Slidev skill directory is loaded when available, including `references/*.md`.
4. Generated decks receive presentation guardrails before export, and large Mermaid guardrails no longer overwrite a slide that already declares `zoom`.
5. The local Slidev fork is preferred when present.
6. HTML output directories are recreated before build to avoid stale assets.
7. HTML export attempts native standalone first, records the actual HTML mode, and falls back to server-script-compatible HTML only when native standalone sanity checks find real missing slide loader bindings.
8. Browser rendering is verified with Playwright across the full deck by default.
9. When the Playwright runtime is available, `exportSlidesCommand()` and the maintainer verifier both run the same `convergeSlidevDeckLayout()` loop before final `HTML`/`PDF`/`PNG`/`MP4` export.

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

The gate exists because a compatibility run with `ok: true` can still mean `actualMode = "server-script-fallback"`.

## Local Fork Resolution

Slidev command resolution prefers:

1. `NOTEMD_SLIDEV_BIN`
2. `SLIDEV_CLI_PATH`
3. `$HOME/slidev/packages/slidev/bin/slidev.mjs`
4. `npx -y @slidev/cli`

On Jacob's workstation, the maintained verification path should report the local fork path in `environment.slidev.version`.

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

Real maintained baseline as of 2026-06-18:

1. `node scripts/verify-slidev-export-workflow.cjs --json` on `docs/architecture.zh-CN.md` returns `ok: true`
2. the report confirms `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`
3. the report confirms `/home/jacob/slidev/skills/slidev`
4. default HTML verification now audits the full prepared deck, not only representative slides
5. the real `architecture.zh-CN` deck converges to `28` slides after bounded patching with `overflowCount = 0`
6. `PDF` and `PNG` verification on the same real source also return `ok: true` after exporting from the same converged deck
7. the current local Slidev `52.16.0` fork now passes the strict native standalone gate for the real `architecture.zh-CN` HTML export after fixing NoteMD's loader-binding detector to accept minified identifiers such as `$n`; the final real output is `index-standalone.html`, not a fallback-only `index.html`
8. existing Slidev deck fixtures now go through isolated prepared working copies, so maintainer verification no longer under-audits them as single-slide files or loses sibling `layouts/*.vue`

Dedicated standalone acceptance evidence is tracked in `docs/maintainer/slidev-standalone-acceptance-2026-06-18.*`. The large generated HTML and screenshot output remains archived outside the repo under `/home/jacob/slidev-export-review/2026-06-18/standalone-strict/` so the main branch does not gain new one-off export artifacts.

## Current Rendered Layout Model

The current workflow is now strong enough to reject broken wiring, missing skill references, stale output directories, missing local fork usage, browser-open failures, and visible layout overflow on the real `docs/architecture.zh-CN.md` fixture.

The current render-feedback loop is now:

1. `prepareSlidevExportSource()` still loads the full Slidev skill directory and asks the LLM to split dense sections before export.
2. `scripts/verify-slidev-export-workflow.cjs` and the product `exportSlidesCommand()` now share the same convergence workflow, which renders the built HTML in Playwright, waits for visible slide content, and measures the actual `slidev-page` root plus overflow-prone elements.
3. `SlidevOverflowAudit` classifies `overflow`, `unreadable-scale`, and `render-error` from rendered geometry, and now also records slot-zone owner rects, content bounds, scroll overflow, and recommended local transform scales instead of relying only on Markdown heuristics.
4. `SlidevDeckPatch` now applies overflow-derived slide `zoom` values, zone-local `<Transform>` scales derived from detected out-of-bounds geometry, and escalates to content-level patching when shrinking further would make the slide unreadable or when the rendered finding already recommends structural splitting.
5. The current structural patcher supports:
   - Mermaid `flowchart` / `graph` / `mindmap`
   - Mermaid `sequenceDiagram` with repeated participant declarations
   - simple heading + paragraph/list slides
   - Markdown tables, including row-split and width-driven column decomposition
   - pathological width-heavy tables through deterministic record-list fallback
   - non-Mermaid fenced code blocks with vertical chunking
   - generic slot-marked layouts, including explicit `::default::`, supported built-in slot layouts, and custom named slots when the slot content is structurally patchable
   - unique component-heavy slot zones through local `<Transform :scale="...">` wrapping when structural splitting is unavailable
   - first-slide deck headmatter content when structural splitting is possible
6. The HTML exporter now records structured HTML outcomes, rejects known-bad native standalone bundles, preserves rejected native attempts as `index-standalone.failed.html`, and falls back to server-script-compatible HTML only for the compatibility path.
7. The verifier now audits the full deck by default and keeps retrying within a bounded loop until the rendered deck fits or the retry budget is exhausted.

The clean-room reference from `ref/infinite-canvas` is still the world-rect and viewport-transform idea: nodes have `{ position, width, height }`, the viewport has `{ x, y, k }`, and visible bounds are derived from transform math. For NoteMD export, that becomes an export-layout camera for a fixed Slidev safe rectangle, not an interactive infinite canvas. Because the reference project is AGPL-3.0 and NoteMD is MIT, implementation must be independent.

Current landed state:

1. `verify:slidev-export` now resolves Jacob's local Slidev fork, Slidev skill references, and Playwright browser cache from workspace-aware paths instead of trusting the current process home blindly.
2. the maintainer verification chain now measures the visible `slidev-page` root with Playwright, captures Mermaid shadow-host bounding boxes, and fails when the actual visible slide root clips content.
3. the patcher is no longer zoom-only: it first applies overflow-derived `zoom`, then structurally splits supported Mermaid, Markdown table, code-fence, and simple text/list slides when rendered evidence says further shrinking would be the wrong move.
4. the real product export path now converges the prepared working deck before final `HTML`/`PDF`/`PNG`/`MP4` export, instead of keeping the patch/rebuild loop verifier-only.
5. existing Slidev deck working copies now live under `_slidev-sources/<deck-basename>/`, and common sibling support entries such as `layouts/`, `public/`, `setup/`, `components/`, `snippets/`, `styles/`, `global-top.vue`, and `global-bottom.vue` are mirrored there when present.
6. rendered layout audit now also measures direct-text `div`/`section`/`article`/`aside`/`span` blocks, which closes the previous under-audit gap for component-heavy slides.
7. component-heavy slot zones now carry lightweight owner wrappers inside prepared working copies, so rendered measurements can feed slot ownership, zone-level owner geometry, local overflow scale, and slot-owned descendants that are clipped by `overflow-hidden` back into the patch loop instead of relying only on slide-global inference.
8. hard overflow remains rooted in the rendered slide root, while `safeRect` stays the conservative fit target for measured scale recommendations; this keeps the gate tied to actual clipping while still steering shrink decisions away from edge-hugging layouts.
9. `PDF` and `PNG` export now pass `PLAYWRIGHT_BROWSERS_PATH` through the Slidev CLI env so root-run verification can reuse Jacob's browser cache.
10. the real `docs/architecture.zh-CN.md` HTML workflow now passes with a full-deck Playwright audit, `28` audited slides, `overflowCount = 0`, and bounded retry closure at `retryCount = 4`.
11. an additional real maintainer-local structural overflow note now proves that Markdown table decomposition and code-fence chunking can converge through the same verifier path instead of only through unit tests.
12. a real slot/headmatter Slidev deck now proves that native standalone loader gaps are detected and converted into a working `index.html + start-server.* + README.md` fallback instead of being treated as successful standalone output.
13. real maintainer-local decks now also prove:
   - explicit `::default::` slot handling
   - existing Slidev deck working-copy verification
   - pathological table fallback into record-list slides
   - slot-marked custom layouts backed by a real custom `layouts/*.vue` file
   - component-heavy custom slot layouts converging through zone-level owner-geometry-based local `<Transform>` wrapping, including same-slide multi-zone cases where more than one overflowing transformable slot can be wrapped in the same pass while slot signals and rendered text hints stay as bounded fallback for attribution ties
   - a dense two-zone custom layout where slot-owned descendants originally clipped under `overflow-hidden` are now measured correctly and converge to `ok: true` without forcing whole-slide zoom
14. the real `docs/architecture.zh-CN.md` strict native standalone run now closes with `actualMode = "standalone"`, `requiresLocalServer = false`, `loaderGaps = []`, `standaloneGate.passed = true`, `28` audited slides, `overflowCount = 0`, `unreadableCount = 0`, `renderErrorCount = 0`, and `retryCount = 4`.

Current gap:

1. richer custom/component-heavy Slidev layouts beyond the current supported structural set still fall back to conservative zoom/manual-review behavior, especially when multiple competing component-heavy slot zones remain near-tied even after zone-level geometry scoring but not every overflowing zone is safely transformable, or when the owner surface does not expose a stable transform/split target;
2. standalone export now has a strict native gate and the real architecture fixture passes it, but correctness still depends on post-build sanity detection; server-script fallback remains a compatibility lane for future bad bundles, not evidence that native standalone passed;
3. full-deck Playwright verification is now more correct, but noticeably slower, so future work should improve patch convergence instead of weakening the audit back to representative sampling;
4. the Obsidian CLI can dispatch `notemd:export-slides`, but it does not expose an export-complete handshake, so host-command smoke is still weaker than the maintainer verifier.

## Next-Level Layout Quality Direction

The current acceptance proves that export does not clip, can pass strict standalone, and follows the real UI-equivalent workflow. It does not yet prove presentation quality. The real `architecture.zh-CN.md` output still contains low-zoom slides such as `zoom: 0.285`, `0.384`, and `0.40`; those can pass the hard overflow gate while still being too small, under-used, or tight at the edges.

The next direction should not replace the current render-feedback pipeline. It should:

1. keep `convergeSlidevDeckLayout()` as the final fact gate;
2. add a clean-room `SlideGeometry` / `SlideLayoutPlan` layer before source preparation, borrowing only the world-rect, union-bounds, and viewport-fit ideas from `ref/infinite-canvas` without copying AGPL-3.0 implementation code;
3. add rendered effective-font, quality-margin, content-area-ratio, and low-utilization metrics;
4. pre-split Mermaid/table/code content so large content is not solved mainly by low `zoom`;
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
