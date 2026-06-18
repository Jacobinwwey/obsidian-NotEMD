# Slidev Export Solution Summary

This document records the current Slidev export truth for NoteMD.

## Current Export Model

NoteMD no longer treats direct `slidev build` as a sufficient proof for the UI export buttons.

The maintained workflow is:

1. The active note is prepared as a Slidev deck when it is not already a Slidev deck.
2. The full Slidev skill directory is loaded when available, including `references/*.md`.
3. Generated decks receive presentation guardrails before export.
4. The local Slidev fork is preferred when present.
5. HTML output directories are recreated before build to avoid stale assets.
6. Browser rendering is verified with Playwright for representative slides.

The canonical maintainer workflow is documented in:

```text
docs/maintainer/slidev-export-workflow.md
docs/maintainer/slidev-export-workflow.zh-CN.md
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

### Server-Script HTML

Server-script mode remains available for compatibility with normal Slidev SPA builds that need HTTP serving.

Expected output:

```text
docs/export/<source-basename>-slides/index.html
docs/export/<source-basename>-slides/start-server.sh
docs/export/<source-basename>-slides/start-server.bat
docs/export/<source-basename>-slides/README.md
```

Use this mode when a build must be served via localhost instead of opened as a standalone file.

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

## Next-Level Rendered Layout Plan

The current workflow is now strong enough to reject broken wiring, missing skill references, stale output directories, missing local fork usage, and browser-open failures. It is not yet strong enough to reject all visually bad decks.

The remaining architecture gap is a render-feedback loop:

1. `prepareSlidevExportSource()` loads the full Slidev skill directory and asks the LLM to split dense sections, but `applySlidevPresentationGuardrails()` still uses text-level heuristics, mainly Mermaid fence line counts and static `zoom` values.
2. `exportSlidevHtml()`, `exportSlidevPdf()`, and `exportSlidevPng()` invoke Slidev and return paths; they do not measure rendered geometry.
3. `scripts/verify-slidev-export-workflow.cjs` samples browser pages and screenshots, but the current `ok` value is based on browser errors, output existence, stale-text checks, and `.gitignore` visibility. It does not fail on clipped tables, cropped Mermaid SVGs, or unreadably small text.

The next design should add three owned pieces:

1. `SlidevRenderedMeasure`: Playwright-based measurement of fonts, images, Mermaid SVGs, tables, code blocks, and slide scroll state after render.
2. `SlidevOverflowAudit`: deterministic classification of overflow, clipped SVG/viewBox content, table/code natural-width overflow, edge-pixel risk, stale deck text, and unreadable scale.
3. `SlidevDeckPatch`: bounded retry logic that patches deck Markdown by splitting dense slides, decomposing tables/diagrams, or applying readable `zoom`/`Transform` values. It should fail closed after two retries.

The clean-room reference from `ref/infinite-canvas` is the world-rect and viewport-transform idea: nodes have `{ position, width, height }`, the viewport has `{ x, y, k }`, and visible bounds are derived from transform math. For NoteMD export, that becomes an export-layout camera for a fixed Slidev safe rectangle, not an interactive infinite canvas. Because the reference project is AGPL-3.0 and NoteMD is MIT, implementation must be independent.

Current landed state:

1. `verify:slidev-export` now resolves Jacob's local Slidev fork, Slidev skill references, and Playwright browser cache from workspace-aware paths instead of trusting the current process home blindly.
2. the maintainer verification chain now measures the visible `slidev-page` root with Playwright, captures Mermaid shadow-host bounding boxes, and fails when the actual visible slide root clips content.
3. the first patcher is zoom-only and bounded; it rewrites per-slide `zoom` in the prepared deck and rebuilds until sampled HTML slides fit, which is now proven on the real `docs/architecture.zh-CN.md` standalone export.
4. `PDF` and `PNG` export now pass `PLAYWRIGHT_BROWSERS_PATH` through the Slidev CLI env so root-run verification can reuse Jacob's browser cache.

Current gap:

1. the patcher does not yet split dense slides or decompose oversized diagrams/tables;
2. default verification still audits representative slides rather than the full deck.

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
