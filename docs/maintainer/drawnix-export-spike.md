# Drawnix Native Knowledge-Map Export

Language: **English** | [简体中文](./drawnix-export-spike.zh-CN.md)

This document records the bounded Drawnix path that Notemd supports without embedding Drawnix, Plait, or the Drawnix React host.

The reference baseline is `ref/drawnix` at `develop@9939f45`. Its `DrawnixExportedData` envelope has the top-level contract `type/version/source/elements/viewport/theme`; `theme` is optional and Notemd omits it because no compatible imported theme object has been verified. The upstream JSON check is envelope-level only, so the plugin validates the native mind-map subset before writing it.

## Implemented Contract

The public route is an independent `drawnixMindmap` diagram intent:

```text
DiagramSpec(intent: "drawnixMindmap")
  -> DrawnixMindMapProjection
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (SVG companion)
```

The projection preserves one or more top-level roots and `node.children` ownership as a Drawnix forest:

- root elements: each top-level node becomes `type: "mindmap"`
- descendants: `type: "mind_child"`
- cross-branch relations: `type: "arrow-line"`
- maximum depth 3
- at most 4 cross-branch relationships
- deterministic coordinates and label wrapping
- large forests are packed into deterministic rows with a bounded row width
- preview renderer version: `notemd-drawnix-mindmap-svg@1.0.0`

The exporter writes `type: "drawnix"`, `version: 1`, `source: "web"`, a fixed viewport, one or more nested element trees, and any validated cross-relation arrows. It has no `SemanticFigureModel` dependency and no Plait dependency. The standard Mermaid `mindmap` intent remains a separate Mermaid path; Drawnix fallback maps a copied spec to Mermaid and never flattens the original forest.

## Automated Evidence

The focused regression command is:

```bash
npm test -- --runInBand src/tests/drawnixExporter.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixExportDocsContract.test.ts --runTestsByPath
```

The tests verify:

- the `DrawnixExportedData` envelope and native `mindmap`/`mind_child` hierarchy
- deterministic projection layout, node rectangle separation, depth, and relation limits
- stable `.drawnix` JSON serialization and `arrow-line` validation
- the dedicated SVG companion uses the same node ids and projection geometry
- source-level absence of `SemanticFigureModel`, `@drawnix/*`, `@plait/*`, and `@plait-board/*` imports

## Manual open/import Boundary

The Drawnix web app loads board state through `localforage` and imports files through `loadFromBlob(...)`. A real manual open/import check still requires running Drawnix itself:

1. Generate a `.drawnix` file through `scripts/export-diagram-artifact.js --target drawnix`.
2. Keep the generated file outside tracked source paths.
3. Open Drawnix or the Drawnix web app from `ref/drawnix`.
4. Import or open the file.
5. Confirm the root, nested branches, cross-branch arrows, and visible labels appear.
6. Record the file path, Drawnix commit, Notemd commit, and result in maintainer-local evidence.

Jest proves the checked contract and deterministic output. It does not prove full Drawnix UI import.

## Dependency Decision

Keep Drawnix at the adapter/data boundary. Do not add Plait or Drawnix packages to the Notemd runtime bundle, and do not embed the Drawnix editor, toolbar, persistence layer, or browser file APIs. A full host or read-only Plait preview remains a separate future phase that requires bundle isolation and its own acceptance evidence.

## Remaining Phase Decisions

Architecture-canvas decision: rejected. Do not add `DrawnixArchitectureProjection` without a separate product requirement and acceptance fixtures for grouping, routing, labels, and collision handling. Architecture flowcharts continue through Draw.io or Mermaid.

Stage 4 decision: deferred. The repository has no verified heavy-runtime bundle isolation. Keep the dedicated SVG companion and no Plait dependency until lazy loading, failure recovery, bundle-size budgets, and Obsidian lifecycle coverage exist.
