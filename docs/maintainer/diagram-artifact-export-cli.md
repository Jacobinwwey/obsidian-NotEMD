---
date: 2026-08-15
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## Contract

`scripts/export-diagram-artifact.js` exports a checked `DiagramSpec` without an Obsidian runtime. It is a `no Obsidian runtime` boundary and does not load Drawnix, Plait, or diagrams.net Desktop. Source and SVG targets are TypeScript exports; PNG and PDF use Playwright Chromium to rasterize the same standalone SVG. The input accepts UTF-8 with or without a BOM.

Use the direct entrypoint for predictable Windows argument handling:

```bash
node scripts/export-diagram-artifact.js --input spec.json --target editable-html-svg --output figure.html
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg --preview-png-output figure.drawio.png --preview-pdf-output figure.drawio.pdf --ppi 300
node scripts/export-diagram-artifact.js --input rooted-drawnix-spec.json --target drawnix --output architecture.drawnix --preview-svg-output architecture.drawnix.svg --preview-png-output architecture.drawnix.png --preview-pdf-output architecture.drawnix.pdf --ppi 300
node scripts/export-diagram-artifact.js --input circuit-spec.json --target circuitikz --output circuit.tex --preview-svg-output circuit.svg --preview-png-output circuit.png --preview-pdf-output circuit.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target svg --output figure.svg
node scripts/export-diagram-artifact.js --input spec.json --target png --output figure.png --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target pdf --output figure.pdf --ppi 300
```

The package wrapper remains available:

```bash
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
```

`--ppi` defaults to `300` and is clamped to `600`. PNG output contains a `pHYs` density chunk. npm 11 can reorder long options after `npm run ... --` on Windows; use the direct `node` command when that warning matters.

## Drawnix Path

The offline CLI accepts an already rooted `DiagramSpec(intent: "drawnixMindmap")` and calls `DrawnixRenderer` directly:

```text
DiagramSpec -> DrawnixMindMapProjection -> native .drawnix
                                      -> notemd-drawnix-mindmap-svg@1.0.0 SVG
```

`rootCount`, `nodeCount`, and `edgeCount` in the JSON summary describe the written native board. The CLI does not parse Markdown or perform source coverage. For the normal filename-rooted generation path, invoke the installed plugin through the maintainer bridge instead:

```bash
node scripts/invoke-maintainer-cli-operation.js --vault 1Knowledge --operation diagram.generate --input-json '{"sourcePath":"architecture.zh-CN.md","executionMode":"save-artifact","requestedIntent":"drawnixMindmap","requestedRenderTarget":"drawnix","targetLanguage":"zh-CN"}' --pretty
```

That route supplies the source path to `enrichDrawnixSourceCoverage()`. It creates the `architecture.zh-CN` root, preserves headings as branches, and places unmatched model branches under `Additional concepts`. The former `mergeDrawnixSourceCoverage()` name remains a deprecated compatibility alias only.

The retired `--drawnix-delivery` and `--source-label` options remain parse-compatible for older scripts. They do not select layouts or mutate output. New artifacts never contain replay metadata or presentation bundles.

## Targets

| Target | Output | Source model | CLI validation |
|---|---|---|---|
| `editable-html-svg` | self-contained HTML with inline editable SVG | `DiagramSpec -> SemanticFigureModel` | annotation gaps must be empty |
| `drawio` | uncompressed diagrams.net XML plus optional SVG/PNG/PDF companions | `DiagramSpec -> SemanticFigureModel` | visible labels must match |
| `drawnix` | native `.drawnix` and optional SVG/PNG/PDF companions | `DiagramSpec(intent: "drawnixMindmap") -> DrawnixMindMapProjection` | native hierarchy, `arrow-line` endpoints, label bounds, and source visual metadata validate |
| `circuitikz` | constrained `.tex` plus optional SVG/PNG/PDF companions | `DiagramSpec.circuitSpec` | circuit specification validates before write |
| `svg`, `png`, `pdf` | review artifact from the semantic model or circuit preview | `SemanticFigureModel` or circuit preview | output dimensions and metadata match the target |

The Drawnix route deliberately bypasses `SemanticFigureModel`. It preserves nested `mindmap` and `mind_child` elements, while cross-branch relationships use native `arrow-line` elements.

## Obsidian Preview Companion

Obsidian does not render `.drawio`, `.drawnix`, or raw `.tex` as figures. The plugin save path writes a reviewable SVG companion and Markdown wrapper:

```text
Topic_diagram.drawnix
Topic_diagram.drawnix.svg
Topic_diagram.drawnix.md
```

The wrapper embeds the SVG and links to the source artifact. The Preview diagram command can reopen these local artifacts without regenerating them.

The plugin save path honors the existing custom Mermaid output-directory setting. When it is enabled, diagram artifacts also go there. Disable it when a maintainer needs the `.drawnix`, SVG, and wrapper beside the source note; a stale test directory otherwise looks like a failed source-sibling write.

## Benchmark And Evidence

`npm run benchmark:drawnix-knowledge-map` writes ignored files under `.cache/drawnix-knowledge-map-benchmark/`. Its fixture has one `architecture.zh-CN` root, eight subsystem branches, 137 nodes, and 32 labelled cross-branch relationships. It is a regression workload, not a runtime budget: structural counts and zero validation errors are the contract.

Run the focused checks after changing this path:

```bash
npm test -- --runInBand src/tests/diagramArtifactExportCli.test.ts src/tests/drawnixKnowledgeMapBenchmark.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixMindMapRouting.test.ts
```

The artifact CLI proves deterministic export. A real Drawnix consumer opening the `.drawnix` file is separate local evidence. The standard Mermaid `mindmap` target remains independent.
