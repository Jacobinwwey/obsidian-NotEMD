---
date: 2026-07-05
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## Contract

`scripts/export-diagram-artifact.js` is the offline CLI boundary for the diagram figure work that came from the Cloudy-style technical-diagram reference and the Drawnix reference spike.

It accepts a checked `DiagramSpec` JSON file and writes one artifact without requiring Obsidian, `obsidian-cli`, diagrams.net Desktop, Drawnix, or Plait. SVG and source targets are pure TypeScript exports. PNG and PDF targets use Playwright Chromium to render the same standalone SVG into fixed-size visual evidence. The input may be UTF-8 with or without a BOM, which keeps files produced by Windows PowerShell usable without a separate normalization step.

```bash
npm run diagram:export-artifact -- --input spec.json --target editable-html-svg --output figure.html
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg
npm run diagram:export-artifact -- --input spec.json --target drawnix --output figure.drawnix --preview-svg-output figure.drawnix.svg --preview-png-output figure.drawnix.png --preview-pdf-output figure.drawnix.pdf --ppi 300
npm run diagram:export-artifact -- --input spec.json --target svg --output figure.svg
npm run diagram:export-artifact -- --input spec.json --target png --output figure.png --ppi 300
npm run diagram:export-artifact -- --input spec.json --target pdf --output figure.pdf --ppi 300
```

Direct entrypoint:

```bash
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg --preview-png-output figure.drawio.png --preview-pdf-output figure.drawio.pdf --ppi 300
```

`--ppi` controls raster density for PNG/PDF output. The default is `300`; values above `600` are clamped to `600`. SVG stays vector-sized and ignores this value.

PNG output also writes or replaces the `pHYs` physical pixel density chunk, so the selected PPI is visible to image viewers and layout tools instead of only being reflected in pixel dimensions.

## Targets

| Target | Output | Source model | Verification in CLI |
|---|---|---|---|
| `editable-html-svg` | self-contained `.html` with inline SVG | `DiagramSpec -> SemanticFigureModel -> EditableHtmlSvgRenderer` | annotation gaps from `collectEditableSvgAnnotationGaps()` must be empty |
| `drawio` | uncompressed diagrams.net `mxfile` XML, optionally with `--preview-svg-output`, `--preview-png-output`, and `--preview-pdf-output` companions | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawioXml()` plus `renderSemanticFigureSvg()` | visible label mismatches must be empty |
| `drawnix` | minimal `.drawnix` JSON subset, optionally with `--preview-svg-output`, `--preview-png-output`, and `--preview-pdf-output` companions | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawnixData()` plus `renderSemanticFigureSvg()` | subset validation errors must be empty |
| `svg` | Obsidian-viewable `.svg` generated from the same semantic model | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg()` | semantic node/edge annotations must be present |
| `png` | `.png` visual evidence rendered from the same standalone SVG | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright screenshot` | output dimensions follow SVG CSS size at the selected PPI, with `pHYs` metadata aligned to the selected density |
| `pdf` | single-page `.pdf` visual evidence rendered from the same standalone SVG | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright PDF` | page size follows SVG CSS size; `--ppi` controls raster/screenshot companions |

## Obsidian Preview Companion Contract

Draw.io, Drawnix, and circuitikz source files are useful interchange formats, but Obsidian does not render `.drawio`, `.drawnix`, or raw `.tex` as figures by default. The plugin-side save path therefore treats SVG as the reviewable companion artifact when the renderer can supply one:

```text
Topic_diagram.drawio
Topic_diagram.drawio.svg
Topic_diagram.drawio.md
```

The Markdown wrapper embeds the SVG with `![[Topic_diagram.drawio.svg]]` and links back to the source artifact. The Preview diagram command also searches these generated wrapper/source/SVG paths when the active source note has no inline diagram fence, so maintainers can verify previously generated local artifacts without regenerating them.

## Why This Boundary

This CLI is deliberately artifact-first:

- It proves the figure exporters work outside the Obsidian UI.
- It keeps the plugin runtime free from Drawnix, Plait, and diagrams.net Desktop dependencies.
- It exercises the same TypeScript exporters used by tests by bundling a temporary internal exporter with `esbuild`.
- It gives CI and maintainers a concrete command that can generate all supported Cloudy-style and Drawnix-relevant artifacts from one `DiagramSpec`.

The temporary bundle is created under the operating system temp directory and removed after the export. In short: no Obsidian runtime is required.

## Supported Evidence

The canonical regression test is:

```bash
npm test -- --runInBand src/tests/diagramArtifactExportCli.test.ts --runTestsByPath
```

The test writes a single `DiagramSpec` and verifies:

- `editable-html-svg` includes semantic `data-drawio-*` annotations.
- normalized node IDs stay unique after whitespace normalization.
- `drawio` XML preserves visible node and edge labels.
- `drawnix` JSON contains supported `geometry` and `arrow-line` elements.
- `drawio` and `drawnix` can produce SVG companion files for Obsidian preview validation.
- `svg` emits the same annotated semantic figure sheet directly.
- `png` and `pdf` are part of the public CLI target list, use `--ppi`, and clamp oversized PPI values to `600`.
- unsupported targets fail before writing an output file.

## Non-Goals

This CLI does not run a full Drawnix web app import or automate diagrams.net Desktop. Those are separate local visual/import runbook checks. The CLI proves deterministic artifact generation and structural validation; it does not prove every editor UI behavior.
