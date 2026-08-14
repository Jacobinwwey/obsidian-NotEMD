---
date: 2026-07-05
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## Contract

`scripts/export-diagram-artifact.js` is the offline CLI boundary for the diagram figure work that came from the Cloudy-style technical-diagram reference and the Drawnix reference spike.

It accepts a checked `DiagramSpec` JSON file and writes one artifact without requiring Obsidian, `obsidian-cli`, diagrams.net Desktop, Drawnix, or Plait. SVG and source targets are pure TypeScript exports. PNG and PDF targets use Playwright Chromium to render the same standalone SVG into fixed-size visual evidence. The input may be UTF-8 with or without a BOM, which keeps files produced by Windows PowerShell usable without a separate normalization step.

Recommended direct entrypoint:

```bash
node scripts/export-diagram-artifact.js --input spec.json --target editable-html-svg --output figure.html
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg --preview-png-output figure.drawio.png --preview-pdf-output figure.drawio.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target drawnix --output figure.drawnix --preview-svg-output figure.drawnix.svg --preview-png-output figure.drawnix.png --preview-pdf-output figure.drawnix.pdf --ppi 300
node scripts/export-diagram-artifact.js --input knowledge-map.json --target drawnix --output architecture.drawnix --drawnix-delivery presentation
node scripts/export-diagram-artifact.js --input circuit-spec.json --target circuitikz --output circuit.tex --preview-svg-output circuit.svg --preview-png-output circuit.png --preview-pdf-output circuit.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target svg --output figure.svg
node scripts/export-diagram-artifact.js --input spec.json --target png --output figure.png --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target pdf --output figure.pdf --ppi 300
```

The package script stays available for existing automation:

```bash
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
```

On npm 11, especially on Windows, npm may rewrite long options after `npm run ... --` into ordered positional arguments and print warning lines. The CLI therefore accepts both the explicit flag form and this positional fallback: `input target output previewSvg previewPng previewPdf ppi`. Prefer the direct `node` entrypoint in maintainer smoke scripts when warning-free output matters.

`--ppi` controls raster density for PNG/PDF output. The default is `300`; values above `600` are clamped to `600`. SVG stays vector-sized and ignores this value.

PNG output also writes or replaces the `pHYs` physical pixel density chunk, so the selected PPI is visible to image viewers and layout tools instead of only being reflected in pixel dimensions.

## Drawnix Delivery

`--drawnix-delivery` applies only to `--target drawnix`. It accepts `full-board` (the default) and `presentation`. The command still writes the same compatible `.drawnix` board in both cases. Presentation additionally writes a sibling bundle named after the output path without its `.drawnix` suffix:

```text
architecture.drawnix
architecture.drawnix.svg
architecture.presentation/
  manifest.json
  overview.svg
  detail-01-<root>.svg
```

`architecture.drawnix.svg` remains the full-board companion for compatibility. Use `architecture.presentation/overview.svg` and the detail panels for a slide or documentation delivery. The board metadata records the absolute manifest path only after the bundle is committed, so a failed board write cannot leave a referenced partial bundle behind.

## Output Summary

Each successful invocation prints one JSON summary. For `drawnix`, `rootCount`, `nodeCount`, and `edgeCount` describe the native forest: `nodeCount` traverses every top-level `mindmap` root, while `edgeCount` counts only `arrow-line` cross-relations. This keeps a multi-root knowledge map from being reported as a single tree or from treating additional roots as relationships.

## Targets

| Target | Output | Source model | Verification in CLI |
|---|---|---|---|
| `editable-html-svg` | self-contained `.html` with inline SVG | `DiagramSpec -> SemanticFigureModel -> EditableHtmlSvgRenderer` | annotation gaps from `collectEditableSvgAnnotationGaps()` must be empty |
| `drawio` | uncompressed diagrams.net `mxfile` XML, optionally with `--preview-svg-output`, `--preview-png-output`, and `--preview-pdf-output` companions | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawioXml()` plus `renderSemanticFigureSvg()` | visible label mismatches must be empty |
| `drawnix` | native `.drawnix` knowledge-map forest; `presentation` also writes overview/detail SVG panels and a manifest | `DiagramSpec(intent: "drawnixMindmap") -> DrawnixRenderer -> DrawnixMindMapProjection -> notemd-drawnix-mindmap-svg@1.0.0` for the compatible full board, plus `buildDrawnixKnowledgeMapPresentation()` for the optional presentation bundle | native roots, hierarchy, relation lanes, presentation fidelity ledger, and label geometry must validate |
| `circuitikz` | constrained `.tex` circuitikz source, optionally with SVG/PNG/PDF preview companions | `DiagramSpec(intent: "circuit") -> CircuitSpec -> CircuitikzRenderer -> exportCircuitSpecToCircuitikz()` plus `renderCircuitSpecPreviewSvg()` | `CircuitSpec` validation must pass before TeX or companion output is written |
| `svg` | Obsidian-viewable `.svg` generated from the same semantic model, or from a circuit preview companion when `intent` is `circuit` | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg()` or `CircuitSpec -> renderCircuitSpecPreviewSvg()` | semantic node/edge annotations or validated circuit preview metadata must be present |
| `png` | `.png` visual evidence rendered from the same standalone SVG or circuit preview SVG | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright screenshot`, or `CircuitSpec -> renderCircuitSpecPreviewSvg() -> Playwright screenshot` | output dimensions follow SVG CSS size at the selected PPI, with `pHYs` metadata aligned to the selected density |
| `pdf` | single-page `.pdf` visual evidence rendered from the same standalone SVG or circuit preview SVG | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright PDF`, or `CircuitSpec -> renderCircuitSpecPreviewSvg() -> Playwright PDF` | page size follows SVG CSS size; `--ppi` controls raster/screenshot companions |

The offline CLI accepts a validated `DiagramSpec` and intentionally has no Vault boundary, so it does not resolve source-note Mermaid fences or image embeds. Source-visual preservation is verified through the Obsidian command host: the native `.drawnix` metadata index points to the scoped `.assets` companions, and the generated Markdown wrapper embeds the source Mermaid, sanitized SVG, and binary image files.

## Obsidian Preview Companion Contract

Draw.io, Drawnix, and circuitikz source files are useful interchange formats, but Obsidian does not render `.drawio`, `.drawnix`, or raw `.tex` as figures by default. The plugin-side save path therefore treats SVG as the reviewable companion artifact when the renderer can supply one:

```text
Topic_diagram.drawio
Topic_diagram.drawio.svg
Topic_diagram.drawio.md
```

The Markdown wrapper embeds the SVG with `![[Topic_diagram.drawio.svg]]` and links back to the source artifact. The Preview diagram command also searches these generated wrapper/source/SVG paths when the active source note has no inline diagram fence, so maintainers can verify previously generated local artifacts without regenerating them.

For circuitikz, the SVG companion is intentionally a semantic preview derived from the same validated `CircuitSpec`, not a LaTeX/TikZJax compile result. It exists so Obsidian can display and export reviewable SVG/PNG/PDF evidence even though raw `.tex` is not rendered by Obsidian by default. Real LaTeX/TikZJax compile evidence still belongs to `scripts/export-circuitikz.js` and the circuitikz smoke runner.

## Why This Boundary

This CLI is deliberately artifact-first:

- It proves the figure exporters work outside the Obsidian UI.
- It keeps the plugin runtime free from Drawnix, Plait, and diagrams.net Desktop dependencies.
- It routes `drawnixMindmap` directly to the native Drawnix projection before any generic `SemanticFigureModel` is built.
- It exercises the same TypeScript exporters used by tests by bundling a temporary internal exporter with `esbuild`.
- It gives CI and maintainers a concrete command that can generate all supported Cloudy-style and Drawnix-relevant artifacts from one `DiagramSpec`.

The temporary bundle is created under the operating system temp directory and removed after the export. In short: no Obsidian runtime is required.

## Local Drawnix Visual Check

The artifact CLI and the Obsidian CLI have different responsibilities. The artifact CLI exports a checked `DiagramSpec`; the Obsidian CLI can only trigger an installed plugin command and should not be treated as proof for an undeployed source checkout. Keep generated demo material local.

The current architecture demo uses a local-only spec derived from `docs/architecture.zh-CN.md` and writes ignored files under `.cache/drawnix-architecture-demo/`:

```bash
node scripts/export-diagram-artifact.js --input .cache/drawnix-architecture-demo/architecture.drawnix.spec.json --target drawnix --output .cache/drawnix-architecture-demo/notemd-architecture.drawnix --drawnix-delivery presentation
```

Inspect `notemd-architecture.presentation/overview.svg` and its detail panels before using them as release evidence. `notemd-architecture.drawnix.svg` remains the full-board companion. Same-side relations should remain in their branch-side gutter; cross-forest relations may use lower lanes. The `.cache` inputs and outputs are not repository deliverables.

## Drawnix Scale Benchmark

Run `npm run benchmark:drawnix-knowledge-map` to export a representative forest with 8 roots, 136 nodes, and 32 labelled cross-relations. It writes the spec, `.drawnix` artifact, and SVG companion to the ignored `.cache/drawnix-knowledge-map-benchmark/` directory, then reports structural counts, artifact sizes, and cold end-to-end export time.

The benchmark has no runtime pass/fail threshold. Its elapsed time includes the temporary exporter bundle and varies by machine; use it to compare a routing or layout change on the same host. Structural counts and zero validation errors are the regression contract.

## Supported Evidence

The canonical regression test is:

```bash
npm test -- --runInBand src/tests/diagramArtifactExportCli.test.ts --runTestsByPath
```

The test writes a single `DiagramSpec` and verifies:

- `editable-html-svg` includes semantic `data-drawio-*` annotations.
- normalized node IDs stay unique after whitespace normalization.
- `drawio` XML preserves visible node and edge labels.
- `drawnix` JSON contains one or more `mindmap` roots, nested `mind_child` elements, and validated `arrow-line` cross relations.
- Drawnix projection layout is deterministic, packs large forests into bounded-width rows, accepts source-required hierarchy depth and material cross-branch relationships without a fixed numeric quota, allocates same-side gutter and cross-forest lower lanes after placement, and emits the dedicated SVG companion.
- `--drawnix-delivery presentation` preserves that board, writes a manifest-linked overview/detail bundle, and keeps the full-board SVG companion for existing consumers.
- `drawio`, `drawnix`, and `circuitikz` can produce SVG companion files for Obsidian preview validation.
- `circuitikz` emits constrained TeX only after `DiagramSpec.circuitSpec` validates, and can export SVG/PNG/PDF preview companions from the same circuit payload.
- `svg` emits the same annotated semantic figure sheet directly, or a validated circuit preview companion for `intent: "circuit"`.
- `png` and `pdf` are part of the public CLI target list, use `--ppi`, default to `300`, and clamp oversized PPI values to `600`.
- unsupported targets fail before writing an output file.

## Non-Goals

This CLI does not run a full Drawnix web app import or automate diagrams.net Desktop. Those are separate local visual/import runbook checks. The CLI proves deterministic artifact generation and structural validation; it does not prove every editor UI behavior. Standard Mermaid `mindmap` generation remains a separate target and is not rewritten by the Drawnix route.
