---
date: 2026-07-04
topic: diagram-reference-integration-and-figure-generation-plan
---

# Diagram Reference Integration And Figure Generation Plan

## Scope And Evidence

This document answers a narrow question: can Notemd extend its figure/diagram generation capability by learning from `cloudy-liu/cloudy-tech-diagrams-skill` and `plait-board/drawnix`, and if yes, where should that work enter the existing architecture?

Reference baselines inspected locally:

| Reference | Local path | Baseline | Evidence read |
|---|---|---|---|
| `cloudy-liu/cloudy-tech-diagrams-skill` | `ref/cloudy-tech-diagrams-skill` | `main@719a5be` | `SKILL.md`, `README*.md`, `assets/template.html`, `references/runtime-mechanism-mode.md`, Draw.io export tests |
| `plait-board/drawnix` | `ref/drawnix` | `develop@9939f45` | `README_en.md`, `package.json`, `packages/drawnix/src/data/types.ts`, `packages/drawnix/src/data/json.ts`, `components/ttd-dialog/*-to-drawnix.tsx` |
| Notemd current main | repository root | `main@562074f` | `src/diagram/types.ts`, `src/rendering/rendererRegistry.ts`, `src/rendering/rendererService.ts`, roadmap and Drawnix audit docs |

The conclusion is conditional: extending figure generation is technically possible, but the correct extension is not "embed a whiteboard" and not "add another Mermaid converter." The durable path is to keep `DiagramSpec` as the semantic boundary, then add explicit target adapters for editable HTML/SVG and, later, board export.

## Current Notemd Architecture Position

Notemd already has the important part that most diagram generators lack: a spec-first semantic layer. `DiagramSpec` captures intent, title, nodes, edges, sections, callouts, data series, layout hints, language, and evidence references. `RendererRegistry` resolves renderers by `RenderTarget`, and `RendererService` owns cache, in-flight dedupe, render-host delegation, and preview session preparation.

Current `RenderTarget` values are:

```ts
'mermaid' | 'json-canvas' | 'vega-lite' | 'html'
```

That matters. Cloudy and Drawnix should not be treated as new prompt styles. They imply new artifact targets:

| Candidate target | Best interpretation | Why |
|---|---|---|
| Cloudy-style output | Editable technical HTML/SVG report target | It is a browser-first SVG sheet plus semantic Draw.io export metadata. |
| Drawnix output | Optional `.drawnix` board export target | Drawnix's cleanest reusable boundary is `DrawnixExportedData`, not its React host. |
| Mermaid-to-Drawnix converter | Experimental bridge only | It downgrades `DiagramSpec` back to string syntax, which conflicts with Notemd's direction. |

## Reference Findings

### Cloudy Tech Diagrams

Cloudy is an instruction-and-template system for self-contained technical diagrams:

- Browser artifact: standalone HTML with inline SVG and CSS.
- Visual system: warm editorial paper canvas, flat fills, semantic color roles, open chevron arrows, and strict spacing.
- Export model: Draw.io export is product-critical and based on semantic SVG annotations such as `data-drawio-type`, `data-drawio-role`, `data-drawio-id`, `data-drawio-source`, and `data-drawio-target`.
- Runtime mechanism mode: asks for trigger, participants, boundaries, carriers, transformations, state/stores, observable outputs, and causal flow.
- Verification model: structural Draw.io coverage, visible-label mismatch checks, sampled edge/style mapping, exporter versioning, and optional visual regression against diagrams.net Desktop.

The useful idea is not the warm palette itself. The useful idea is the separation:

```text
semantic diagram intent -> annotated SVG sheet -> editable Draw.io-native export
```

This fits Notemd better than forcing every explanatory diagram through Mermaid. It is especially relevant for architecture, runtime mechanism, security boundary, deployment, and process views where SVG layout and editability matter more than Mermaid syntax compatibility.

### Drawnix

Drawnix is not a renderer library. It is a full React/Nx/Plait whiteboard product:

- React 19 + Vite + Nx monorepo.
- Plait stack: `@plait/core`, `@plait/draw`, `@plait/layouts`, `@plait/mind`, `@plait/text-plugins`.
- Browser product assumptions: DOM, browser file APIs, local browser storage, toolbar/popover/dialog UI, mobile detection.
- Export boundary: `DrawnixExportedData` is clear JSON: `type`, `version`, `source`, `elements`, `viewport`, `theme`.
- Conversion dialogs lazy-load `@plait-board/mermaid-to-drawnix` and `@plait-board/markdown-to-drawnix`, then insert `PlaitElement[]` into a live board.

The reusable boundary is the data shape and layering pattern. The full host is a poor fit for an Obsidian plugin main bundle. The converters are interesting, but they are string-to-board bridges; they should not become Notemd's primary route because they erase the semantic advantage of `DiagramSpec`.

## Critical Direction

The best direction is a two-stage extension:

1. Add an editable HTML/SVG figure target first.
2. Treat Drawnix as a later board-export adapter, not a host embed.

This is deliberately conservative. The hard part in figure generation is not producing more syntax strings. The hard part is owning layout, editability, validation, and export fidelity without exploding the plugin bundle.

## Proposed Architecture

### Stage 1: Editable HTML/SVG Figure Target

Add a target that produces a self-contained HTML artifact with an annotated SVG sheet:

```text
DiagramSpec
  -> SemanticFigureModel
  -> AnnotatedSvgSheet
  -> EditableHtmlSvgArtifact
```

Candidate code ownership:

| Area | Proposed owner |
|---|---|
| Semantic projection from `DiagramSpec` | `src/diagram/adapters/editableSvg/` |
| Template assembly and export UI | `src/rendering/renderers/editableHtmlSvgRenderer.ts` |
| Draw.io annotation validation | `src/rendering/drawio/` or renderer-local validator |
| Artifact save / preview integration | existing diagram command execution and renderer service paths |

Do not copy Cloudy's whole template blindly. If code is copied, preserve MIT attribution and isolate the exporter block so version drift is testable. Prefer extracting the contract and writing a Notemd-owned renderer that follows the same semantics.

Minimum shipped artifact:

- `.html` source artifact saved into the configured diagram output folder.
- Browser preview through the existing HTML/iframe preview path.
- In-page export actions for PNG and Draw.io only after the semantic export audit passes.
- No default `.drawio` file generation until export fidelity is proven.

### Stage 2: Draw.io Export Contract

Before promising Draw.io as a supported output, lock these checks:

- Every visible meaningful SVG element is annotated or explicitly ignored with a reason.
- Visible SVG text cannot be silently overridden by `data-drawio-label`.
- Open arrowheads, dashed strokes, fill/stroke, rounded corners, font size, and font weight map to editable Draw.io cells.
- Exporter version is embedded and tested.
- Optional visual regression is manual/release-gated, not mandatory CI, because diagrams.net/font rendering can be environment-sensitive.

This should be stricter than normal HTML preview tests. Otherwise the feature will degrade into "HTML looks good but editable export is unreliable," which is exactly the problem Cloudy is trying to solve.

### Stage 3: Drawnix Export Target

Only after Stage 1 is stable, add an experimental `.drawnix` export target:

```text
DiagramSpec
  -> PlaitElementProjection
  -> DrawnixExportedData
  -> .drawnix JSON artifact
```

Rules:

- Do not embed the Drawnix React host in Notemd.
- Do not make `DiagramSpec -> Mermaid -> mermaid-to-drawnix` the mainline path.
- Start with a small subset: mindmap, flowchart, simple architecture node/edge diagrams.
- Own geometry generation explicitly: points, bounding boxes, viewport defaults, text wrapping, and theme mapping.
- Keep dependencies out of `main.js` until the heavy-runtime packaging boundary is real. A plain JSON writer is preferable to importing the Plait runtime in the plugin bundle.

## Implementation Plan

### Phase A: Contract-Only Planning

- [x] Clone and update `cloudy-tech-diagrams-skill` into `ref/cloudy-tech-diagrams-skill`.
- [x] Clone and update `drawnix` into `ref/drawnix`.
- [x] Record reference baselines and current Notemd architectural fit.
- [x] Add a tracked renderer contract test that keeps this plan discoverable from the docs hub.

### Phase B: Editable HTML/SVG Prototype

- [x] Define `SemanticFigureModel` as an internal renderer model, not a public prompt contract.
- [x] Add an `editable-html-svg` target after naming was reviewed against existing `html`.
- [x] Implement a first renderer for architecture/process/runtime-mechanism views from existing `DiagramSpec` fields.
- [x] Add annotation coverage tests modeled after Cloudy's `data-drawio-type` contract.
- [x] Add Playwright preview checks for nonblank render, text bounds, and mobile/desktop framing.
- [x] Keep the feature behind the existing experimental diagram pipeline until preview/export quality is proven.

Phase B implementation status on 2026-07-05: `editable-html-svg` is now an explicit render target, not a default planner route. The prototype uses `src/diagram/adapters/editableSvg/semanticFigureModel.ts` as the internal renderer model and `src/rendering/renderers/editableHtmlSvgRenderer.ts` as the self-contained HTML/SVG renderer. Annotation coverage, iframe preview pass-through, source artifact `.html` export, and desktop/mobile Playwright preview checks are covered by `src/tests/editableHtmlSvgRenderer.test.ts`, `src/tests/editableHtmlSvgPreview.playwright.test.ts`, `src/tests/diagramPreview.test.ts`, `src/tests/previewExport.test.ts`, and the semantic-verification helper tests.

### Phase C: Draw.io Export Hardening

- [x] Add a deterministic exporter block or library boundary.
- [x] Add visible-label mismatch tests.
- [x] Add sampled edge/style mapping tests.
- [x] Add a local-only visual regression runbook; do not make diagrams.net Desktop a required normal CI dependency.
- [x] Document exporter limitations and supported primitives.

Phase C implementation status on 2026-07-05: draw.io export hardening is implemented as `src/diagram/adapters/drawio/drawioExporter.ts`, consuming the internal `SemanticFigureModel` and producing deterministic uncompressed draw.io XML. `src/tests/drawioExporter.test.ts` covers XML structure, visible-label mismatch detection, and sampled node/edge style mapping. `docs/maintainer/drawio-export-visual-regression.md` and `docs/maintainer/drawio-export-visual-regression.zh-CN.md` define the local-only diagrams.net Desktop visual check, supported primitives, and unsupported scope; `src/tests/drawioExportDocsContract.test.ts` keeps the bilingual runbook boundary from drifting.

### Phase D: Drawnix Board Export Spike

- [x] Define the supported `DrawnixExportedData` subset.
- [x] Build `DiagramSpec -> DrawnixExportedData` without importing the full Drawnix host.
- [x] Test `.drawnix` JSON validity; record the simple open/import behavior as a local Drawnix manual-evidence boundary.
- [x] Decide whether a Plait dependency is worth the bundle cost only after Task 0 packaging isolation is no longer candidate-only.

Phase D implementation status on 2026-07-05: the Drawnix spike is implemented as `src/diagram/adapters/drawnix/drawnixExporter.ts`. It exports a minimal `DrawnixExportedData` subset using top-level `type/version/source/elements/viewport/theme`, `geometry` rectangle nodes, and `arrow-line` edges without importing Drawnix, Plait, or Plait Board packages. `src/tests/drawnixExporter.test.ts` covers JSON validity, stable `.drawnix` serialization, unsupported subset rejection, and the no-runtime-dependency source contract. `docs/maintainer/drawnix-export-spike.md` and `docs/maintainer/drawnix-export-spike.zh-CN.md` record the manual open/import evidence boundary through Drawnix and the current decision to avoid a Plait runtime dependency until bundle isolation and release packaging are proven beyond candidate-only status.

## Tradeoffs

| Decision | Benefit | Cost |
|---|---|---|
| HTML/SVG target before Drawnix | Fastest path to richer figures and editable export | Requires owning SVG layout and text fitting |
| Drawnix as export target only | Avoids full whiteboard host complexity | No in-plugin board editing |
| Keep `DiagramSpec` primary | Preserves semantic quality and testability | Requires writing target adapters instead of reusing converters blindly |
| Manual/release visual gate | Avoids flaky CI from diagrams.net/font differences | Maintainer must run richer checks before release claims |

## Pitfalls To Avoid

- Do not let "supports Drawnix" mean "bundles Drawnix." That would be a host mistake, not a renderer improvement.
- Do not route production `DiagramSpec` through Mermaid text just to reuse converters. That reintroduces the old string-surgery failure mode.
- Do not promise Draw.io editability without structural coverage tests. A pretty SVG download is not an editable Draw.io continuation path.
- Do not add Google Fonts as a hard runtime dependency inside Obsidian preview. Use system fallbacks and keep external font loading optional.
- Do not put heavy export code in `main.js` until packaging isolation is real.
- Do not widen `DiagramSpec` prematurely. Use an internal `SemanticFigureModel` first; only promote fields after two or more targets need them.

## Best-Practice Boundary

The correct mental model is:

```text
LLM output remains semantic.
Adapters own target-specific geometry.
Renderers own host/export behavior.
Operations own artifact save and user workflow.
Verification owns claims.
```

Cloudy is valuable because it proves a disciplined HTML/SVG + Draw.io export contract can work. Drawnix is valuable because it proves the board data boundary is clean enough to target later. Neither should override Notemd's current architecture.

## Recommended Next Move

Do not start by adding dependencies. Start by adding a minimal editable HTML/SVG renderer behind the experimental diagram path and prove:

1. current `DiagramSpec` can express a useful architecture/runtime mechanism figure;
2. the renderer can generate a self-contained nonblank HTML artifact;
3. visible text fits and remains searchable/editable;
4. Draw.io export coverage can be audited structurally;
5. the existing Mermaid, JSON Canvas, Vega-Lite, and HTML renderers are unaffected.

Only after those claims are verified should Notemd consider a `.drawnix` target. Drawnix is a good future export format, not a reason to embed a whiteboard product in the plugin.
