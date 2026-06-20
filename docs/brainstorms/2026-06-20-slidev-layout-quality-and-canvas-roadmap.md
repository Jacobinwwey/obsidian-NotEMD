---
date: 2026-06-20
last_updated: 2026-06-20
topic: slidev-layout-quality-and-canvas-roadmap
canonical: false
status: stage6-css-import-media-and-mermaid-preservation-gate-implemented
---

# Slidev Layout Quality And Canvas Roadmap

This document is the English pair for the Chinese canonical roadmap. The Chinese file remains the operational source of truth for the current implementation thread; this file exists so the repository keeps a bilingual documentation surface while preserving the same engineering constraints.

## Current Baseline

The Slidev export work has moved past "the buttons can invoke an export" and is now gated on whether the generated deck is structurally usable, locally reproducible, and visually defensible.

Current landed facts:

1. `prepareSlidevExportSource()` generates a real Slidev deck before exporting a non-Slidev note.
2. The source preparation path loads the complete Slidev skill directory, including reference files, not only `SKILL.md`.
3. Jacob's local environment prefers `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`.
4. `convergeSlidevDeckLayout()` is shared by product export and maintainer verification.
5. Native standalone HTML has a strict gate; server-script fallback is reported separately and cannot masquerade as native standalone success.
6. Playwright audits the full prepared deck by default in maintainer verification.
7. Rendered audit reports hard overflow, effective font size, SVG/table/code minimum font, margin quality, content utilization, slot owner geometry, local transform scale recommendations, and Mermaid fit evidence.
8. `SlideLayoutPlan` is injected into deterministic outline generation, one-shot deck generation, and outline-continuation generation.
9. The real `docs/architecture.zh-CN.md` strict standalone run is the recurring acceptance source for actual export behavior.

The current slice adds explicit CSS asset dependency graph copying:

1. Markdown images, HTML media/link/srcset attributes, and Slidev frontmatter local file keys are copied into the prepared deck workspace.
2. Local CSS files explicitly referenced by the deck are parsed for local `url(...)` dependencies and local `@import` stylesheet chains.
3. CSS dependencies are resolved relative to the current CSS file directory at every step in the chain.
4. CSS `../media/foo.svg` and imported sibling stylesheets are allowed only when the resolved path remains inside the deck base directory.
5. Remote and fragment references are not copied as local dependencies; absolute paths, null bytes, and out-of-scope traversal are rejected.
6. Copied CSS files preserve in-scope local imports/URLs and remote or fragment references, but remove or neutralize rejected local imports/URLs so standalone output does not request missing local files.
7. Local video/audio/source/track/poster assets referenced by deck HTML are covered by the full-deck fixture path.
8. After native standalone or server-script HTML build, the exporter syncs those explicit local file references and CSS dependencies into the final output directory.
9. Prepared decks inject `fonts.provider: none` unless the source already declares top-level `fonts:`.

Closeout evidence:

1. Full fixture archive: `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final-fixtures/`.
2. Real `architecture.zh-CN.md` strict standalone archive: `/home/jacob/slidev-export-review/2026-06-20-css-asset-dependencies-final/`.
3. CSS import/media fixture archive: `/home/jacob/slidev-export-review/2026-06-20-css-import-media-fixtures/`.
4. The real report is `ok = true`, uses `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`, loads 52 Slidev skill references, preserves all 3 Mermaid fences, reports `actualMode = "standalone"`, and does not require a local server.
5. Historical generated `docs/export/test-slidev-*`, `docs/export/test-slidev.pdf`, `docs/export/test-slidev-video.mp4`, and old `docs/export/slides/` artifacts are removed from Git tracking; future generated outputs should stay as external evidence packages unless explicitly reviewed for commit.

## Mermaid Boundary

The Mermaid rule is stricter than the table/code/prose rule.

One source Mermaid fence remains one source Mermaid fence. The workflow must not split one user-provided Mermaid diagram into several generated diagrams, must not rewrite the diagram body to force layout success, and must not treat a count-only match as enough. Source preparation rejects one-shot and outline-continuation LLM deck candidates that change Mermaid fence count, order, metadata, or body text before `_slidev-sources` is written. The verifier then compares each source Mermaid fence against the exported deck fence; changed content, order, fence metadata, or split diagrams must fail the report.

Mixed Mermaid/prose slides are handled differently from Mermaid-only slides. Low whole-slide zoom is not acceptable for mixed content because prose becomes unreadable. The allowed repair is to move only non-Mermaid prose/list content to a readable slide while keeping the Mermaid fence byte-stable on a diagram-focused slide. If that move is not safe for the layout, the patcher should block low whole-slide zoom and surface review evidence instead of silently shrinking mixed content.

Mermaid-only slides may use measured low zoom to keep the full preserved diagram visible. That is not a quality pass by itself. The risk must remain visible through `mermaidFit`, especially `source-preserved-fit-review` and `manual-review`.

## Requirements Versus Implementation

| Requirement | Current state | Direction |
|---|---|---|
| The two UI Slidev export buttons must run the real workflow | Command palette and sidebar paths share `exportSlidesCommand()` and the same convergence pipeline | Keep UI tests and real verifier aligned |
| Non-outline export must include the Slidev skill | Source preparation loads the complete skill references | Keep reference count in verifier output |
| The local Slidev fork must be used | CLI resolution prefers Jacob's local fork path | Continue checking actual CLI path in real runs |
| Standalone must be real standalone | `actualMode`, `requiresLocalServer`, `loaderGaps`, and strict gate are reported | Keep server-script fallback explicit |
| Test export files must not enter main | Generated exports are archived outside the repository and ignored under `docs/export` | Commit only reusable docs/tests/source changes |
| Zoom must come from measurement | Overflow patching derives scale from rendered geometry | Continue treating low zoom as a risk signal, not a default solution |
| Mermaid content must not be modified | Prompt, plan, patcher, tests, source-preparation LLM candidate rejection, and verifier are source-preserving | Keep exact fence comparison as a required gate |
| Mixed Mermaid/prose must not use low whole-slide zoom | Only non-Mermaid content may move; Mermaid fences remain byte-stable | Improve outer layout and prose movement only |
| Local assets must not disappear in standalone output | Markdown, HTML, frontmatter, CSS `url(...)`, CSS `@import`, and local media dependencies are copied explicitly; rejected local CSS references are sanitized in copied CSS | Extend only through explicit dependency parsing, not whole-directory copying |
| Remote fonts must not be required for verification | Prepared decks default to `fonts.provider: none` | Use explicit local assets for branded fonts |

## Architecture Direction

The current ownership split is still right:

1. `prepareSlidevExportSource()` owns deck preparation, skill loading, working-copy isolation, and support-entry mirroring.
2. `convergeSlidevDeckLayout()` owns build, browser audit, patch, and retry.
3. `slidevLayoutAudit.ts` owns rendered measurement and patch recommendations.
4. `exportSlidevHtmlWithOutcome()` owns native standalone and fallback outcome reporting.

Do not collapse this back into a prompt-only workflow. The better direction is to strengthen the planning and rendered feedback loop:

1. Keep the render-feedback loop as the final fact gate.
2. Continue using clean-room world-rect and viewport-fit ideas from `ref/infinite-canvas`, without copying AGPL-3.0 code or embedding an infinite-canvas UI into Slidev export.
3. Model fixed slide safe rectangles, content bounds, local transform ownership, and readable scale thresholds explicitly.
4. For table/code/prose, prefer structural splitting when quality gates say zoom would harm readability.
5. For Mermaid, preserve the source fence and surface `manual-review` when complete visibility and projector readability cannot both be proven automatically.

## Verification Baseline

Required verification before closing a slice:

1. Targeted Jest tests for the changed surfaces.
2. Full `npm test -- --runInBand`.
3. `npm run build`.
4. Full fixture verification with `npm run verify:slidev-layout-fixtures`.
5. Real strict standalone verification on `docs/architecture.zh-CN.md`.
6. Archive real generated deck/report/output under `/home/jacob/slidev-export-review/...`.
7. Clean generated `docs/export/_slidev-sources` and `docs/export/*-slides` before commit.
8. Confirm `mermaidSourcePreservation.passed = true` for real Mermaid sources.

## Next Steps

The next useful slices are:

1. Add more real failure fixtures for custom Vue layouts, unsupported layouts, and documents with competing transformable zones.
2. Keep Mermaid source-preserved fit review as a first-class report surface; do not introduce automatic Mermaid splitting.
3. Extend parser-light code splitting only where it preserves semantic blocks better than line budgets.
4. Consider an upstream Slidev skill PR only for general guardrails: complete references, source-preserved Mermaid fit review, browser-check expectations, standalone/fallback distinction, and no automatic user-diagram splitting.

Avoid these directions:

1. Copying `ref/infinite-canvas` implementation code.
2. Making one function switch between hard gate and quality gate through flags.
3. Solving dense prose/table/code primarily with lower zoom.
4. Treating Mermaid `manual-review` as a hard failure or a silent pass.
5. Asking the LLM to rewrite user Mermaid diagrams as the default fit strategy.
