---
date: 2026-07-05
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## Contract

`scripts/export-diagram-artifact.js` is the offline CLI boundary for the diagram figure work that came from the Cloudy-style technical-diagram reference and the Drawnix reference spike.

It accepts a checked `DiagramSpec` JSON file and writes one artifact without requiring Obsidian, `obsidian-cli`, diagrams.net Desktop, Drawnix, Plait, or a browser runtime. The input may be UTF-8 with or without a BOM, which keeps files produced by Windows PowerShell usable without a separate normalization step.

```bash
npm run diagram:export-artifact -- --input spec.json --target editable-html-svg --output figure.html
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
npm run diagram:export-artifact -- --input spec.json --target drawnix --output figure.drawnix
```

Direct entrypoint:

```bash
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio
```

## Targets

| Target | Output | Source model | Verification in CLI |
|---|---|---|---|
| `editable-html-svg` | self-contained `.html` with inline SVG | `DiagramSpec -> SemanticFigureModel -> EditableHtmlSvgRenderer` | annotation gaps from `collectEditableSvgAnnotationGaps()` must be empty |
| `drawio` | uncompressed diagrams.net `mxfile` XML | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawioXml()` | visible label mismatches must be empty |
| `drawnix` | minimal `.drawnix` JSON subset | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawnixData()` | subset validation errors must be empty |

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
- unsupported targets fail before writing an output file.

## Non-Goals

This CLI does not run a full Drawnix web app import or automate diagrams.net Desktop. Those are separate local visual/import runbook checks. The CLI proves deterministic artifact generation and structural validation; it does not prove every editor UI behavior.
