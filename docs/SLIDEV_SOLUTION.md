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
6. Browser rendering is verified with Playwright across the full deck by default.

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
7. `layoutAuditSummary.overflowCount = 0`
8. `layoutAuditSummary.unreadableCount = 0`

Real maintained baseline as of 2026-06-18:

1. `node scripts/verify-slidev-export-workflow.cjs --json` on `docs/architecture.zh-CN.md` returns `ok: true`
2. the report confirms `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`
3. the report confirms `/home/jacob/slidev/skills/slidev`
4. default HTML verification now audits the full prepared deck, not only representative slides
5. the real `architecture.zh-CN` deck converges to `27` slides after bounded patching with `overflowCount = 0`
6. `PDF` and `PNG` verification on the same real source also return `ok: true`

## Current Rendered Layout Model

The current workflow is now strong enough to reject broken wiring, missing skill references, stale output directories, missing local fork usage, browser-open failures, and visible layout overflow on the real `docs/architecture.zh-CN.md` fixture.

The current render-feedback loop is now:

1. `prepareSlidevExportSource()` still loads the full Slidev skill directory and asks the LLM to split dense sections before export.
2. `scripts/verify-slidev-export-workflow.cjs` now renders the built HTML in Playwright, waits for visible slide content, and measures the actual `slidev-page` root plus overflow-prone elements.
3. `SlidevOverflowAudit` classifies `overflow`, `unreadable-scale`, and `render-error` from rendered geometry instead of relying only on Markdown heuristics.
4. `SlidevDeckPatch` now applies overflow-derived `zoom` values and escalates to content-level patching when shrinking further would make the slide unreadable or when the rendered finding already recommends structural splitting.
5. The current structural patcher supports:
   - Mermaid `flowchart` / `graph` / `mindmap`
   - Mermaid `sequenceDiagram` with repeated participant declarations
   - simple heading + paragraph/list slides
6. The verifier now audits the full deck by default and keeps retrying within a bounded loop until the rendered deck fits or the retry budget is exhausted.

The clean-room reference from `ref/infinite-canvas` is still the world-rect and viewport-transform idea: nodes have `{ position, width, height }`, the viewport has `{ x, y, k }`, and visible bounds are derived from transform math. For NoteMD export, that becomes an export-layout camera for a fixed Slidev safe rectangle, not an interactive infinite canvas. Because the reference project is AGPL-3.0 and NoteMD is MIT, implementation must be independent.

Current landed state:

1. `verify:slidev-export` now resolves Jacob's local Slidev fork, Slidev skill references, and Playwright browser cache from workspace-aware paths instead of trusting the current process home blindly.
2. the maintainer verification chain now measures the visible `slidev-page` root with Playwright, captures Mermaid shadow-host bounding boxes, and fails when the actual visible slide root clips content.
3. the patcher is no longer zoom-only: it first applies overflow-derived `zoom`, then structurally splits supported Mermaid and simple text/list slides when rendered evidence says further shrinking would be the wrong move.
4. `PDF` and `PNG` export now pass `PLAYWRIGHT_BROWSERS_PATH` through the Slidev CLI env so root-run verification can reuse Jacob's browser cache.
5. the real `docs/architecture.zh-CN.md` HTML workflow now passes with a full-deck Playwright audit, `27` audited slides, `overflowCount = 0`, and bounded retry closure.

Current gap:

1. the patcher still does not decompose oversized tables or code-heavy slides;
2. custom Slidev slot layouts, first-slide deck headmatter, and richer component slides still fall back to conservative zoom/manual-review behavior;
3. full-deck Playwright verification is now more correct, but noticeably slower, so future work should improve patch convergence instead of weakening the audit back to representative sampling.

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
