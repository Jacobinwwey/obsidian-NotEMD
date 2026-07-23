---
date: 2026-07-04
topic: diagram-reference-integration-and-figure-generation-plan
---

# Diagram Reference Integration And Figure Generation Plan

## Implemented Drawnix Boundary

The planned board-export boundary is now implemented for knowledge maps: `DiagramSpec(intent: "drawnixMindmap") -> DrawnixMindMapProjection -> native .drawnix -> notemd-drawnix-mindmap-svg@1.0.0`. Standard Mermaid `mindmap` remains a separate renderer path. The Drawnix host and Plait runtime are still excluded from the plugin bundle.

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

### Phase E: Offline Artifact Export CLI

- [x] Add a repo-local CLI that exports Cloudy-style editable HTML/SVG, Draw.io XML, and Drawnix JSON from one `DiagramSpec`.
- [x] Keep the CLI independent of Obsidian runtime and `obsidian-cli` so CI and local automation can exercise the exporters directly.
- [x] Reuse the existing TypeScript `SemanticFigureModel`, `EditableHtmlSvgRenderer`, Draw.io exporter, and Drawnix exporter rather than duplicating a second JavaScript implementation.
- [x] Add CLI contract tests that verify real files are written and unsupported targets fail before output creation.
- [x] Add bilingual maintainer runbooks and docs hub discoverability.

Phase E implementation status on 2026-07-05: `scripts/export-diagram-artifact.js` and `npm run diagram:export-artifact` now provide an offline artifact exporter. The CLI reads a `DiagramSpec` JSON file, validates the requested target, builds a temporary internal `esbuild` bundle from the existing TypeScript exporters, and writes `editable-html-svg`, `drawio`, or `drawnix` output. `src/tests/diagramArtifactExportCli.test.ts` verifies real HTML/XML/JSON output, normalized-id collision handling, Draw.io visible-label preservation, Drawnix `geometry`/`arrow-line` output, and unsupported-target failure semantics. `docs/maintainer/diagram-artifact-export-cli.md` and `docs/maintainer/diagram-artifact-export-cli.zh-CN.md` document the command contract and explicitly state that no Obsidian runtime is required.

### Phase F: Constrained circuitikz Prototype

- [x] Keep circuit diagrams outside `DiagramSpec` until the circuit-specific topology/layout fields prove reusable.
- [x] Define a minimal `CircuitSpec` with `circuitKind`, named nets, typed components, terminal references, layout hints, style, and `goldenReferenceId`.
- [x] Add deterministic golden-template export for `common-source-amplifier` and `cmos-inverter`.
- [x] Add an offline CLI that writes `.tex` without Obsidian, TikZJax, LaTeX, or browser runtime dependencies.
- [x] Add topology-rejection tests so invalid circuits fail before output creation.
- [x] Add bilingual maintainer docs and website progress notes.
- [x] Add compile-log diagnostics that parse existing LaTeX/TikZJax logs without shelling out to a compiler.
- [x] Expand compile-log diagnostics for TikZ path syntax failures and runaway arguments exposed by real renderer logs.
- [x] Add optional shell-free local renderer execution with placeholder-expanded argument arrays.
- [x] Add structured renderer executable diagnostics for empty executables, missing binaries, and shell-command-shaped `--compile-executable` values.
- [x] Add optional render-smoke artifact existence and non-empty checks through `--expected-artifact`.
- [x] Add SVG render-smoke structure checks and optional repeated `--expected-svg-text` label-token checks.
- [x] Add decoded SVG accessibility metadata checks for `aria-label`, `<title>`, and `<desc>` so semantic label identity can survive renderers that move text out of visible `<text>` nodes.
- [x] Add PNG screenshot smoke checks for positive dimensions, non-background pixels, foreground bounds, and edge-touching clipped content.
- [x] Add first pixel-level PNG crowding smoke through `foregroundDensity` and `render-png-foreground-dense`.
- [x] Add a conservative PNG foreground-footprint smoke gate through `render-png-foreground-too-small` so large screenshots with only a few foreground pixels do not pass as visually reviewable artifacts.
- [x] Add non-interlaced 1/2/4/8-bit indexed-color PNG smoke support through packed sample decoding, PLTE palette decoding, and optional tRNS alpha.
- [x] Add non-interlaced 1/2/4/8/16-bit grayscale PNG smoke support through packed/direct sample decoding and normalized gray values.
- [x] Add non-interlaced 16-bit grayscale-alpha/RGB/RGBA PNG smoke support through direct sample normalization.
- [x] Add grayscale/RGB PNG `tRNS` transparent sample handling so transparent-only pixels are not counted as visible foreground.
- [x] Add format-specific `render-png-unsupported` guidance for Adam7 interlaced PNGs and unsupported indexed-color bit depths.
- [x] Add conservative SVG bounded-canvas and obvious text-overlap diagnostics.
- [x] Add transform-aware geometry for common SVG group and element transforms before bounded-canvas/text-overlap checks.
- [x] Add conservative SVG label-vs-drawing overlap diagnostics through `render-svg-label-overlap`.
- [x] Add path-only SVG label classification through `pathOnlyGlyphUseCount` and `render-svg-text-path-only`.
- [x] Add path-only glyph placement checks by resolving `<use href="#...">` boxes for bounded-canvas diagnostics.
- [x] Add `polyline` / `polygon` SVG drawing geometry checks for bounded-canvas and label-vs-drawing diagnostics.
- [x] Add positioned `tspan` label geometry so LaTeX-style SVG output with multiple labels under one `<text>` parent can trigger text-overlap diagnostics.
- [x] Add `text-anchor`-aware positioned text geometry for `start`, `middle`, and `end` labels so centered and right-aligned SVG text can participate in text/text and label-vs-drawing overlap diagnostics.
- [x] Add path-only glyph label-vs-drawing overlap diagnostics through `render-svg-path-glyph-overlap`.
- [x] Add exact arc bounds for A/a arc extrema so curved circuit-symbol arc interiors participate in bounded-canvas diagnostics.
- [x] Add exact Bezier curve bounds for C/S/Q/T curve extrema so dvisvgm curve interiors participate in bounded-canvas diagnostics.
- [x] Add SVG number grammar support for leading-dot decimals and explicit plus signs so dvisvgm coordinates are not misread or silently skipped.
- [x] Add stroke-width-aware SVG bounds and label-vs-drawing overlap checks so thick wires or component outlines can fail smoke when their visible stroke is clipped or covers a label.
- [x] Add a front-end artifact diagnostics surface in the diagram preview modal.
- [x] Add source-only preview fallback for non-inline artifacts so future circuitikz, Draw.io, and Drawnix sources can expose content and diagnostics without pretending to be visually rendered.
- [x] Add circuitikz source-only front-end preview for saved `.tex` / `.tikz` artifacts without promoting circuitikz into the generic `DiagramSpec` render-target planner.
- [x] Add Draw.io and Drawnix source-only front-end preview for saved `.drawio` / `.drawnix` artifacts without embedding diagrams.net or the Drawnix whiteboard host.
- [x] Project `layoutHints.inputSide` and `layoutHints.outputSide` into deterministic circuitikz input/output port placement for supported golden templates.
- [x] Add maintainer smoke fixtures and an aggregate runner for every supported circuitikz golden family.
- [x] Add a constrained `cmos-buffer` / `cmos-buffer-v1` golden family with two cascaded inverter stages, intermediate node `vmid`, deterministic LaTeX export, layout-hint port projection, and a maintainer fixture.
- [x] Add a constrained `cmos-transmission-gate` / `cmos-transmission-gate-v1` golden family with parallel PMOS/NMOS pass devices, complementary `phib` / `phi` controls, deterministic LaTeX export, layout-hint port projection, and a maintainer fixture.
- [x] Add a constrained `cmos-nand2` / `cmos-nand2-v1` golden family with parallel PMOS pull-up validation, series NMOS pull-down validation, dual inputs `va` / `vb`, deterministic LaTeX export, layout-hint port projection, and a maintainer fixture.
- [x] Add a constrained `cmos-nor2` / `cmos-nor2-v1` golden family with series PMOS pull-up validation, parallel NMOS pull-down validation, dual inputs `va` / `vb`, deterministic LaTeX export, layout-hint port projection, and a maintainer fixture.
- [x] Add explicit missing-renderer availability reports to the aggregate runner so release evidence can record `rendererAvailability.status: "missing-configuration"` without shell probing or silent fixture skips.
- [x] Add a topology-preserving repair guard through `--topology-reference`, `createCircuitTopologySignature`, and `assertCircuitTopologyUnchanged`.
- [x] Add a topology-preserving repair brief handoff through `--repair-brief-output` and schema `notemd.circuitikz.repair-brief.v1`.
- [x] Add structured `repairPrompt` handoff content with `diagnosticFocus`, `acceptanceCriteria`, and role `topology-preserving-circuitikz-repair`.
- [x] Add repair candidate validation against an existing brief through `--repair-brief`.
- [x] Add `repairAcceptance` gate evidence for `--repair-brief` candidate runs through schema `notemd.circuitikz.repair-acceptance.v1`.
- [x] Add `--repair-acceptance-output` so CI and release workflows can persist repair acceptance evidence as JSON.
- [x] Add reusable `RenderArtifact.diagnostics` summary counts and show them in the preview diagnostics panel and preview history entries.
- [x] Add locale-aware `RenderArtifact.diagnostics` summary labels so preview diagnostics and preview history do not fall back to English for advertised UI locales.
- [x] Add definition-local `transform` handling for reusable path-only SVG glyphs so dvisvgm-style scaled or mirrored label geometry is checked before `<use>` placement.
- [x] Add grouped and `symbol` path-only SVG glyph definition resolution so `<use href="#...">` labels keep bounded-canvas and overlap coverage when renderers wrap glyph paths.
- [x] Add SVG close-path current-point handling so relative commands after `Z/z` continue from the subpath start instead of causing false bounded-canvas failures.
- [x] Add SVG hidden/transparent element handling so `display:none`, `visibility:hidden/collapse`, and overall `opacity:0` elements do not satisfy visible-artifact smoke.

Phase F implementation status on 2026-07-05: `src/diagram/adapters/circuitikz/circuitSpec.ts` and `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now implement a constrained `CircuitSpec -> circuitikz` prototype. `scripts/export-circuitikz.js` and `npm run diagram:export-circuitikz` export deterministic LaTeX for `common-source-nmos-v1`, `cmos-inverter-v1`, `cmos-buffer-v1`, `cmos-transmission-gate-v1`, `cmos-nand2-v1`, and `cmos-nor2-v1`. `src/diagram/adapters/circuitikz/circuitikzExporter.ts` also exposes `createCircuitTopologySignature` and `assertCircuitTopologyUnchanged`, and `scripts/export-circuitikz.js` exposes that guard through `--topology-reference` so topology-preserving repair candidates can change labels/layout while being rejected before output if they add, remove, or rewire electrical topology. `src/diagram/adapters/circuitikz/circuitikzRepairBrief.ts`, `--repair-brief-output`, and `--repair-brief` now produce and consume schema `notemd.circuitikz.repair-brief.v1`, a repair handoff that carries the source `CircuitSpec`, topology signature, compile/render diagnostics, allowed changes, prohibited topology changes, next verification steps, and a candidate validation gate that can reject repaired specs before output is written. `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` parses existing compile logs into actionable diagnostics for missing packages, unknown TikZ keys, undefined control sequences, generic LaTeX errors, emergency stops, and overfull layout warnings. `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts` can run an explicitly configured local renderer without shell parsing, feed the generated `{jobName}.log` back into diagnostics, and optionally require a concrete non-empty output artifact through `--expected-artifact`. `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now adds SVG-specific checks for root/dimensions/visible drawing elements, optional text tokens through `--expected-svg-text`, decoded accessibility metadata checks through `aria-label`, `<title>`, and `<desc>`, path-only label classification through `pathOnlyGlyphUseCount` and `render-svg-text-path-only`, conservative bounded-canvas diagnostics through `render-svg-out-of-bounds`, obvious text-overlap diagnostics through `render-svg-text-overlap`, positioned `tspan` label geometry for LaTeX-style SVG output, path-only glyph label-vs-drawing overlap diagnostics through `render-svg-path-glyph-overlap`, definition-local `transform` handling for reusable path-only glyphs before `<use>` placement, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, SVG number grammar for leading-dot decimals and explicit plus signs, stroke-width-aware SVG bounds and label-vs-drawing overlap checks, transform-aware geometry for common group and element transforms, plus PNG screenshot checks for dimensions, non-background pixels, 1/2/4/8-bit indexed-color PLTE palettes with optional tRNS alpha, grayscale/RGB `tRNS` transparent sample handling, format-specific `render-png-unsupported` guidance for Adam7 interlaced PNGs and unsupported indexed-color bit depths, 1/2/4/8/16-bit grayscale samples, 8/16-bit grayscale-alpha/RGB/RGBA direct samples, `foregroundBounds`, `foregroundDensity`, too-small foreground footprints through `render-png-foreground-too-small`, edge-touching clipped content through `render-png-content-clipped`, and dense foreground blocks through `render-png-foreground-dense`. `docs/maintainer/fixtures/circuitikz/` now stores every supported golden-family `CircuitSpec` fixture, including `docs/maintainer/fixtures/circuitikz/cmos-buffer-v1.json`, `docs/maintainer/fixtures/circuitikz/cmos-transmission-gate-v1.json`, `docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json`, and `docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json`, and `scripts/run-circuitikz-smoke-fixtures.js` / `npm run diagram:smoke-circuitikz` runs them through the same explicit shell-free renderer configuration, returns aggregate per-fixture evidence, and can now persist a missing-renderer availability report with `rendererAvailability.status: "missing-configuration"` and `compile-executable-invalid` while still exporting fixture `.tex` artifacts. `src/rendering/diagnostics.ts` now summarizes `RenderArtifact.diagnostics` into error/warning/info counts, and `src/ui/DiagramPreviewModal.ts` shows those counts alongside generic diagnostics, diagnostics-aware preview history entries, and source-only fallback for non-inline artifacts, so circuitikz smoke, future renderer checks, repair hints, and raw external-renderer sources have a user-visible surface without forcing TikZJax/LaTeX into the plugin runtime or faking visual rendering. `src/tests/circuitikzExporter.test.ts`, `src/tests/circuitikzRepairBrief.test.ts`, `src/tests/circuitikzCompileDiagnostics.test.ts`, `src/tests/circuitikzRenderSmoke.test.ts`, `src/tests/circuitikzCompileRunner.test.ts`, `src/tests/circuitikzExportCli.test.ts`, `src/tests/circuitikzSmokeFixturesCli.test.ts`, `src/tests/diagramPreview.test.ts`, `src/tests/diagramPreviewModal.test.ts`, and `src/tests/renderArtifactDiagnostics.test.ts` verify deterministic output, topology rejection, topology-preserving repair guard, repair brief generation, and repair candidate validation behavior, package-script exposure, UTF-8 BOM input handling, shell-free compile execution, render-smoke artifact checks, SVG smoke diagnostics, accessibility metadata expected-text checks, path-only SVG label classification, path-only glyph transform handling, path-only glyph overlap diagnostics, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, transform-aware SVG geometry, stroke-width-aware SVG bounds and label overlap checks, positioned `tspan` label geometry, PNG blank screenshot diagnostics, indexed-color PNG packed sample decoding and palette alpha handling, grayscale/RGB `tRNS` transparent sample handling, format-specific unsupported PNG diagnostics, grayscale PNG packed/direct sample decoding, 16-bit direct sample normalization, PNG foreground-bound and foreground-density reporting, PNG too-small foreground diagnostics, PNG clipped-content diagnostics, dense-foreground diagnostics, bounded SVG viewBox checks, obvious SVG text-overlap checks, maintainer fixture discovery, aggregate execution, missing-renderer availability reports, preview diagnostics visibility, diagnostic summary counts, source-only preview fallback, diagnostics-aware history entries, diagnostics JSON output, and nonzero CLI exit for logs or smoke reports with errors. The implementation deliberately stops before automatic renderer installation/discovery, OCR recognition for path-only visual text, precise pixel-level overlap detection, full SVG path coverage, and automated visual repair execution.

2026-07-07 PNG foreground footprint increment: `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now reports `render-png-foreground-too-small` when a sufficiently large PNG screenshot has fewer than four foreground pixels. This closes the gap between “not blank” and “visually reviewable” without introducing OCR, screenshot semantics, or platform-specific renderer behavior. `src/tests/circuitikzRenderSmoke.test.ts` covers a 20x20 PNG with a single foreground pixel so under-rendered screenshots fail before topology-preserving visual repair.

2026-07-07 CMOS buffer family increment: `src/diagram/adapters/circuitikz/circuitSpec.ts` and `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now support `cmos-buffer` with golden reference `cmos-buffer-v1`. The validator locks the first inverter stage from `vin` to `vmid`, the second inverter stage from `vmid` to `vout`, and the shared VDD/GND rails; the exporter emits deterministic circuitikz and projects `layoutHints.inputSide` / `layoutHints.outputSide` into presentation-only ports. `docs/maintainer/fixtures/circuitikz/cmos-buffer-v1.json` adds the maintainer smoke fixture, and `src/tests/circuitikzExporter.test.ts` / `src/tests/circuitikzSmokeFixturesCli.test.ts` cover validation, topology-preserving layout projection, second-stage `vmid` rejection, and aggregate fixture execution.

2026-07-07 CMOS transmission gate family increment: `src/diagram/adapters/circuitikz/circuitSpec.ts` and `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now support `cmos-transmission-gate` with golden reference `cmos-transmission-gate-v1`. The validator locks a bidirectional pass path between `vin` and `vout`, requires `MP.S` / `MN.D` to share the input pass node, requires `MP.D` / `MN.S` to share the output pass node, and requires complementary `phib` / `phi` gate controls. The exporter emits deterministic circuitikz and projects `layoutHints.inputSide` / `layoutHints.outputSide` into presentation-only bidirectional ports. `docs/maintainer/fixtures/circuitikz/cmos-transmission-gate-v1.json` adds the maintainer smoke fixture, and `src/tests/circuitikzExporter.test.ts` / `src/tests/circuitikzSmokeFixturesCli.test.ts` cover validation, topology-preserving layout projection, missing complementary-control rejection, and aggregate fixture execution.

2026-07-07 circuitikz source-only preview increment: saved `.tex` and `.tikz` files that contain `\usepackage{circuitikz}` or `\begin{circuitikz}` now open through the canonical Preview diagram command as `circuitikz` source-only artifacts. `src/operations/diagramCommandHostAdapter.ts` detects those artifacts without shell probing; `src/ui/diagramPreview.ts` and `src/ui/DiagramPreviewModal.ts` keep them on the source-only path; `src/rendering/targetLabel.ts`, `src/rendering/preview/previewExport.ts`, and `src/fileUtils.ts` give them a dedicated UI label and `.tex` save path. This is intentionally front-end artifact support, not LaTeX compilation, TikZJax invocation, or a generic `DiagramSpec` render target.

2026-07-07 Draw.io/Drawnix source-only preview increment: saved `.drawio` files that look like Draw.io XML (`mxfile` or `mxGraphModel`) and saved `.drawnix` files that parse as Drawnix JSON with `type: "drawnix"` plus an `elements` array now open through the canonical Preview diagram command as source-only artifacts. `src/rendering/targetLabel.ts`, `src/rendering/preview/previewExport.ts`, and `src/fileUtils.ts` give those artifacts stable labels and native `.drawio` / `.drawnix` save paths. This is not diagrams.net embedding, Drawnix host embedding, or proof of visual editability inside the plugin.

2026-07-08 Obsidian SVG companion increment: Draw.io and Drawnix have moved from saved/source-only artifact handling into explicit `SUPPORTED_RENDER_TARGETS` entries, implemented by `src/rendering/renderers/drawioRenderer.ts` and `src/rendering/renderers/drawnixRenderer.ts`. `RenderArtifactTarget` still remains the broader source-artifact union for targets such as circuitikz that are previewable but not generic `DiagramSpec` render targets. The renderers still do not embed diagrams.net, Drawnix, Plait, or a browser whiteboard host; they consume the same `SemanticFigureModel` used by editable HTML/SVG and emit `.drawio` / `.drawnix` source content plus a `RenderArtifact.previewSvg` companion from `renderSemanticFigureSvg()`. `saveDiagramArtifactFile()` now persists three reviewable files when a preview SVG exists: the native source artifact, `<source>.svg`, and an Obsidian wrapper `<source>.md` that embeds the SVG with `![[...svg]]` and links back to the source. `runPreviewDiagramCommandWithHost()` now falls through from direct current-file detection to generated wrapper/source/SVG candidate lookup, so clicking Preview diagram on the original source note can preview a locally generated figure without regenerating it. This addresses Obsidian's inability to render `.drawio`, `.drawnix`, or raw `.tex` directly while preserving the distinction between source interchange files and verified SVG review artifacts. `scripts/export-diagram-artifact.js` now supports `--preview-svg-output` and a direct `svg` target for offline validation.

2026-07-07 compile-log diagnostics increment: `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` now recognizes TikZ path syntax failures such as `Package tikz Error: Giving up on this path. Did you forget a semicolon?` and runaway argument clusters such as `Runaway argument?` / `Paragraph ended before ... was complete.`. The parser emits `tikz-path-syntax` and `runaway-argument` diagnostics with repair advice before any visual repair step, and it de-duplicates the runaway cluster so a single unterminated path does not inflate error counts. `src/tests/circuitikzCompileDiagnostics.test.ts` covers the red/green regression.

2026-07-07 diagnostic localization increment: `src/rendering/diagnostics.ts` now formats `RenderArtifact.diagnostics` summaries with injectable labels instead of hardcoded English. `src/ui/DiagramPreviewModal.ts` passes `i18n.previewModal.diagnosticSummary` into both the diagnostics panel and preview-history metadata, and `src/i18n/locales/en.ts`, `zh_cn.ts`, `zh_tw.ts`, plus `src/i18n/locales/previewModal.ts` define labels for every advertised UI locale. `src/tests/renderArtifactDiagnostics.test.ts`, `src/tests/diagramPreviewModal.test.ts`, `src/tests/runtimeI18nAudit.test.ts`, and `src/tests/supportedUiLocalePreviewModalCoverage.test.ts` cover Chinese panel/history output and guard against locale fallback regressions.

2026-07-07 CMOS NOR family increment: `src/diagram/adapters/circuitikz/circuitSpec.ts` and `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now support `cmos-nor2` with golden reference `cmos-nor2-v1`. The validator locks the series PMOS pull-up stack, the parallel NMOS pull-down network, and the two input nets `va` / `vb`; the exporter emits deterministic circuitikz and projects `layoutHints.inputSide` / `layoutHints.outputSide` into presentation-only ports. `docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json` adds the maintainer smoke fixture, and `src/tests/circuitikzExporter.test.ts` / `src/tests/circuitikzSmokeFixturesCli.test.ts` cover validation, topology-preserving layout projection, PMOS-stack rejection, and aggregate fixture execution.

2026-07-07 CMOS NAND family increment: `src/diagram/adapters/circuitikz/circuitSpec.ts` and `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now support `cmos-nand2` with golden reference `cmos-nand2-v1`. The validator locks the parallel PMOS pull-up network, the series NMOS pull-down stack, and the two input nets `va` / `vb`; the exporter emits deterministic circuitikz and projects `layoutHints.inputSide` / `layoutHints.outputSide` into presentation-only ports. `docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json` adds the maintainer smoke fixture, and `src/tests/circuitikzExporter.test.ts` / `src/tests/circuitikzSmokeFixturesCli.test.ts` cover validation, topology-preserving layout projection, and aggregate fixture execution.

2026-07-06 grouped/symbol glyph increment: `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now resolves path-only glyph definitions when a renderer wraps glyph paths in `<defs><g id="...">...</g></defs>` or `<defs><symbol id="...">...</symbol></defs>`. The smoke pass unions child path geometry before `<use>` placement, preserving `pathOnlyGlyphUseCount`, bounded-canvas checks, and `render-svg-path-glyph-overlap` coverage without claiming OCR-level label identity or pixel-perfect overlap detection. `src/tests/circuitikzRenderSmoke.test.ts` covers grouped definitions that escape the `viewBox` and symbol definitions that overlap drawing elements.

2026-07-06 close-path parser increment: `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now tracks SVG subpath starts, resets the current point on `Z/z`, and treats implicit coordinate pairs after the first `M/m` as `L/l`. This prevents bounded SVG paths with relative commands after close-path from being misreported as `render-svg-out-of-bounds`. `src/tests/circuitikzRenderSmoke.test.ts` covers the regression without changing the broader non-goal around full SVG path coverage.

2026-07-06 visibility smoke increment: `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now applies one hidden-element predicate to visible-element counting, SVG geometry collection, text boxes, glyph-use boxes, and group/defs traversal. Attribute or inline-style `display:none`, `visibility:hidden`, `visibility:collapse`, and overall `opacity:0` no longer make an otherwise blank SVG artifact pass visible-output smoke. `src/tests/circuitikzRenderSmoke.test.ts` covers invisible path, line, and group-contained rect output.

2026-07-06 repair prompt handoff increment: `src/diagram/adapters/circuitikz/circuitikzRepairBrief.ts` now embeds a structured `repairPrompt` in schema `notemd.circuitikz.repair-brief.v1`. The role is `topology-preserving-circuitikz-repair`; `diagnosticFocus` is derived from compile/render diagnostics; `acceptanceCriteria` requires `assertCircuitikzRepairCandidateMatchesBrief`, re-export through one topology guard for the run (`--repair-brief` or `--topology-reference`), fresh compile diagnostics, and render-smoke diagnostics. This advances Phase E handoff quality without claiming automated visual repair execution.

2026-07-06 layout projection increment: `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now makes `layoutHints.inputSide` and `layoutHints.outputSide` executable for `common-source-amplifier` and `cmos-inverter`. The projection moves `v_{in}` and `v_{out}` ports and rewrites only presentation routing; `createCircuitTopologySignature` remains unchanged for layout-only repair candidates. This closes the gap where repair briefs allowed layout-hint edits but the exporter previously ignored them.

2026-07-06 repair acceptance evidence increment: `scripts/export-circuitikz.js` now returns `repairAcceptance` when `--repair-brief` validates a candidate. The schema `notemd.circuitikz.repair-acceptance.v1` records `topology-signature`, `compile-diagnostics`, and `render-smoke` gates as `passed`, `failed`, or `missing`, includes `blockingDiagnostics`, and reports `remainingChecks`. `readyForVisualAcceptance` stays false until all three gates pass in the same candidate run.

2026-07-06 repair acceptance output increment: `scripts/export-circuitikz.js` now accepts `--repair-acceptance-output` with `--repair-brief`, writing the same `repairAcceptance` JSON to disk for CI or release records. This persists evidence without changing repair behavior or relaxing compile/render-smoke requirements.

2026-07-06 renderer availability evidence increment: `scripts/run-circuitikz-smoke-fixtures.js` now accepts `--output-dir` plus optional `--report-output` without `--compile-executable`. The runner exports each fixture `.tex`, returns `ok: false`, and records `rendererAvailability.status: "missing-configuration"` with a `compile-executable-invalid` diagnostic. This makes missing local renderer setup auditable without shell probing, silent skips, or claiming compile/render-smoke success.

2026-07-06 accessibility metadata label increment: `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` now includes decoded SVG accessibility metadata from `aria-label`, `<title>`, and `<desc>` in `--expected-svg-text` checks. This lets metadata-preserving SVG renderers prove semantic label identity even when visible text is converted to paths, while still routing path-only visual text without metadata to the later OCR/screenshot gate. `src/tests/circuitikzRenderSmoke.test.ts` covers XML entity decoding in `aria-label`.

2026-07-06 SVG text-anchor geometry increment: positioned SVG `text` and `tspan` boxes now honor `text-anchor` values `start`, `middle`, and `end` from attributes or inline style. This makes centered and right-aligned labels participate in the same bounded-canvas, text-overlap, and `render-svg-label-overlap` checks as start-anchored labels, while still avoiding a browser-grade text-layout claim.

## 2026-07-22 Drawnix Quality Correction

The original reference decision remains correct: do not embed the Drawnix host and do not regress `DiagramSpec` through Mermaid or Markdown text. The current production exporter exposed a missing condition in that decision: a tolerated `.drawnix` envelope is insufficient evidence of an editable-canvas-quality artifact.

Current code exports a generic `SemanticFigureModel` grid as `geometry` rectangles and `arrow-line` elements. It flattens `DiagramNode.children`, ignores Drawnix-relevant layout intent, and renders the SVG companion through the same generic grid path. The result is a valid narrow subset but not an upstream mind-map projection.

The corrective delivery is recorded in `docs/brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md`:

1. initial Drawnix support is narrowed to an editable `mindmap` contract;
2. a native target-specific projection owns hierarchy and deterministic layout;
3. the SVG companion consumes the same projection;
4. architecture canvas, full intent coverage, and read-only Plait preview remain separate follow-on decisions.

This is a quality correction for a shipped target. It does not authorize a full Drawnix host integration or bypass the existing packaging-isolation constraints.

## 2026-07-09 circuitikz UI And Artifact Export Increment

The previous architecture deliberately kept circuitikz outside the generic planner until the topology contract was strong enough. That condition is now met for the constrained path, so the implementation advances without changing the core rule: Notemd still does not accept arbitrary TikZ from the LLM.

Implemented changes:

- `DiagramIntent` now includes `circuit`; `RenderTarget` now includes `circuitikz`.
- UI settings and the sidebar selector expose **Circuit (Circuitikz)** and **Circuitikz + SVG preview**.
- `DiagramSpec` can carry `circuitSpec` only when `intent` is `circuit`; validation rejects missing circuit payloads and rejects circuit payloads attached to non-circuit intents.
- `buildDiagramSpecPrompt()` asks for structured `CircuitSpec` output and known golden references when the user selects circuit/circuitikz, instead of asking for raw TikZ.
- `CircuitikzRenderer` emits deterministic `.tex` through the existing circuitikz exporter and supplies a white-background SVG preview companion from the same `CircuitSpec`. The canvas background is now an inline `fill="#ffffff"` contract, not only a CSS class, so standalone viewers that strip style blocks do not show a transparent canvas as black.
- `scripts/export-diagram-artifact.js` accepts `--target circuitikz` and can write SVG/PNG/PDF companions from the circuit preview SVG. Direct `svg`, `png`, and `pdf` targets also support `intent: "circuit"` by using the same preview companion.
- The artifact CLI accepts both explicit long-option arguments and the npm 11 positional fallback shape observed on Windows (`input target output previewSvg previewPng previewPdf ppi`), while the maintainer runbook recommends the direct `node` entrypoint for warning-free smoke scripts.
- Preview/export keeps the distinction between source and visual evidence: the SVG/PNG/PDF companion is Obsidian-viewable validation output, not a LaTeX/TikZJax compile result.

Architecture comparison against prior requirements:

| Requirement | Current state | Assessment |
|---|---|---|
| Do not generate free-form TikZ | Prompt and validation require `CircuitSpec`; renderer rejects non-circuit specs | Satisfied |
| Make circuitikz discoverable in UI | Settings and sidebar render target/intent options are wired | Satisfied |
| Support Obsidian-viewable outputs for non-renderable source formats | circuitikz now follows Draw.io/Drawnix with `previewSvg`, PNG, and PDF companions | Satisfied for preview evidence |
| Preserve cross-platform execution discipline | The new path does not add shell execution; existing compile runner remains `shell: false` for optional real renderers; npm 11 positional argument rewriting is handled at the CLI boundary | Satisfied |
| Prove real LaTeX rendering quality | Still optional maintainer smoke evidence, not plugin runtime behavior | Open by design |

MDX synchronization policy:

Do not blindly commit every generated localized MDX file for each feature increment. The Docusaurus i18n tree is a published website surface, but all-locale generated churn makes code review noisy and hides product changes. Commit localized MDX when route/frontmatter/heading contracts or visible published behavior require parity. For this increment, update the English source page and the explicit zh-CN page that the user called out; leave the rest of the generated locale tree untouched unless website build or localization contract tests require regeneration.

## Current Architecture Progress Audit

| Prior requirement | Current code evidence | Status | Next direction |
|---|---|---|---|
| Keep model output semantic instead of free-form renderer text | `DiagramSpec`, `SemanticFigureModel`, and constrained `DiagramSpec.circuitSpec` for `intent: "circuit"` keep renderer syntax behind adapters | Implemented for current targets | Keep rejecting free-form TikZ; promote circuit fields only when another non-circuit target needs them |
| Keep editor integrations at artifact boundaries | Draw.io XML, Drawnix JSON, editable HTML/SVG, circuitikz, and SVG companions all export through CLI or render artifacts without embedding third-party editors | Implemented | Add richer primitives only when structural editability tests exist |
| Make renderer execution cross-platform | `circuitikzCompileRunner.ts` uses `shell: false` with placeholder-expanded argument arrays and structured executable diagnostics; `run-circuitikz-smoke-fixtures.js` records missing renderer configuration as JSON evidence instead of probing shell resolution; `export-diagram-artifact.js` accepts npm 11 stripped-flag positional arguments | Implemented | Keep Windows/POSIX behavior in argument arrays, not shell command strings; keep renderer discovery optional unless it can preserve that contract |
| Verify circuit output before visual repair | Compile-log diagnostics, topology-preserving repair guard, structured repair prompt handoff, repair acceptance evidence, deterministic layout-hint projection, SVG structural smoke, accessibility metadata label checks through `aria-label`, `<title>`, and `<desc>`, 1/2/4/8-bit indexed-color, grayscale/RGB `tRNS` transparent samples, format-specific Adam7/interlaced and indexed bit-depth rejection guidance, 1/2/4/8/16-bit grayscale, and 8/16-bit grayscale-alpha/RGB/RGBA PNG foreground smoke are in place | Partially implemented | Add OCR-level recognition for path-only visual text, precise pixel overlap gates, and automated topology-preserving repair execution |
| Expose diagnostics to users without pretending source is rendered | `RenderArtifact.diagnostics`, localized diagnostic summary counts, preview history entries, source-only fallback, and explicit `previewSvg` companions are implemented; circuitikz preview companions are labeled as semantic preview evidence and carry an inline white canvas background | Implemented | Connect external renderer artifacts only when evidence distinguishes raw source from rendered output |

## Tradeoffs

| Decision | Benefit | Cost |
|---|---|---|
| HTML/SVG target before Drawnix | Fastest path to richer figures and editable export | Requires owning SVG layout and text fitting |
| Drawnix as export target only | Avoids full whiteboard host complexity | No in-plugin board editing |
| Keep `DiagramSpec` primary | Preserves semantic quality and testability | Requires writing target adapters instead of reusing converters blindly |
| Separate `CircuitSpec` for circuitikz | Keeps terminal/topology rules explicit and testable | Requires a second spec boundary until common fields prove reusable |
| Manual/release visual gate | Avoids flaky CI from diagrams.net/font differences | Maintainer must run richer checks before release claims |

## Pitfalls To Avoid

- Do not let "supports Drawnix" mean "bundles Drawnix." That would be a host mistake, not a renderer improvement.
- Do not route production `DiagramSpec` through Mermaid text just to reuse converters. That reintroduces the old string-surgery failure mode.
- Do not promise Draw.io editability without structural coverage tests. A pretty SVG download is not an editable Draw.io continuation path.
- Do not add Google Fonts as a hard runtime dependency inside Obsidian preview. Use system fallbacks and keep external font loading optional.
- Do not put heavy export code in `main.js` until packaging isolation is real.
- Do not widen `DiagramSpec` prematurely. Use an internal `SemanticFigureModel` first; only promote fields after two or more targets need them.
- Do not treat `diagram:export-circuitikz` as proof of visual rendering. It proves topology-constrained LaTeX export, not TikZJax compilation or screenshot quality.

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

The HTML/SVG, Draw.io, Drawnix, and first circuitikz export boundaries now exist. The next move should still avoid adding runtime dependencies by default:

1. expand compile-log diagnostics as real renderer logs expose more failure shapes;
2. add screenshot/OCR-level checks beyond structural SVG coordinates, including OCR recognition for path-only glyph text and more precise pixel-level overlap than the current foreground-density and label-vs-drawing box heuristics;
3. keep topology locked during any repair prompt so visual repair cannot change the circuit;
4. connect source-only preview sessions to external artifact outputs only after the renderer evidence is available, keeping raw source and real visual render states distinct;
5. expand circuit families only when the golden-reference topology and companion-preview contracts can be validated together; keep real LaTeX/TikZJax visual acceptance behind explicit renderer evidence.

Drawnix remains a good export format, not a reason to embed a whiteboard product in the plugin. circuitikz remains a constrained circuit target, not a reason to accept arbitrary TikZ from the LLM.
