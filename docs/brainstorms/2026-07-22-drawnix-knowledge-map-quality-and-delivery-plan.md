---
date: 2026-07-22
version: 1.9.4
topic: drawnix-knowledge-map-quality-and-delivery
status: implemented
---

# Drawnix Knowledge-Map Quality And Delivery Plan

## Decision

The implemented Drawnix route is a bounded native knowledge-map projection. It preserves hierarchy and uses the upstream mind-map element model without embedding the Drawnix application shell, toolbars, persistence layer, or browser file APIs in the Obsidian bundle.

Standard Mermaid `mindmap` remains unchanged. Drawnix is a separate `drawnixMindmap` intent with its own prompt profile, validation, exporter, SVG companion, and fallback mapping that copies the spec rather than flattening it.

## Implemented Result

```text
DiagramSpec(intent: "drawnixMindmap")
  -> DrawnixMindMapProjection
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (notemd-drawnix-mindmap-svg@1.0.0)
```

The delivered contract is one root, nested `node.children`, `mindmap`/`mind_child` elements, maximum depth 3, and at most 4 cross-branch relationships represented by `arrow-line`. The CLI routes Drawnix before constructing the generic `SemanticFigureModel`; other targets keep their existing path. Full Drawnix host embedding and a Plait preview remain deferred.

## Original Audit (Historical)

| Surface | Current code | Consequence | Required correction |
|---|---|---|---|
| Semantic projection | `buildSemanticFigureModel()` flattens `DiagramNode.children` and assigns all nodes to a fixed three-column grid | Parent/child meaning is discarded before export | Build a Drawnix-specific hierarchy projection directly from `DiagramSpec.nodes` |
| Geometry | Every node is a 240 x 104 rectangle; edge anchors use nearest rectangle sides | Long cross-row edges intersect cards and each other | Let the mind-map projection own branch placement, node size, and relationship routing |
| Drawnix data | Exporter permits only `geometry` rectangles and `arrow-line` | The result contains no upstream mind-map elements or grouping semantics | Export a pinned, tested `MindElement`-compatible subset after a compatibility probe |
| Preview | `DrawnixRenderer` uses the generic editable-SVG renderer | Preview and imported Drawnix board are separate rendering systems | Use the same Drawnix projection for the SVG companion; keep a real Plait preview out of the initial bundle |
| Prompt | `buildDiagramSpecPrompt()` has a CircuitikZ profile only | LLM output is free to produce a flat graph, even for a Drawnix request | Add a target-specific mind-map prompt profile and validate its hierarchy contract |
| Validation | The upstream `isValidDrawnixData()` check is envelope-level only | A JSON file can pass while remaining visually unusable | Test hierarchy, layout constraints, SVG companion geometry, and real-import evidence separately |

The artifact generated from `docs/architecture.zh-CN.md` demonstrates the defect: it contains 18 same-sized rectangle elements at three fixed x positions and 17 two-point arrow lines. That output is the direct result of the shared grid model, not a layout failure inside Drawnix.

## Comparison With Earlier Plans

The 2026-05-03 Drawnix audit correctly rejected full-host embedding and Mermaid/Markdown string round trips as the production architecture. It did not evaluate whether the shipped minimal subset was visually suitable for a user-facing Drawnix target.

The 2026-07-04 reference-integration plan correctly retained `DiagramSpec -> target-specific adapter -> artifact` as the boundary. Its status language now needs one correction: Drawnix is no longer only a future candidate. A public `drawnix` target exists, but its current quality contract is below the advertised editable-canvas expectation.

The original phase-2 requirements still apply:

1. reuse `DiagramSpec`, `RendererService`, and target-aware artifact saving;
2. keep heavy runtime isolation as a separate packaging decision;
3. do not add target-specific orchestration to `src/main.ts`;
4. do not claim stable behavior from importer tolerance alone.

The old roadmap ordering is therefore refined, not discarded. Full Drawnix host embedding remains deferred. A bounded export-quality correction now precedes any expansion of Drawnix intent coverage.

## Options Considered

### 1. Convert `DiagramSpec` to Markdown or Mermaid and call an upstream converter

This is fast for a prototype, but it loses source-level roles and turns the current semantic model into a text round trip. It also makes output quality depend on two parsers and an unpinned conversion package. Reject for the production path. An isolated probe may use the converter to obtain golden upstream fixtures.

### 2. Bundle the Drawnix application as an Obsidian preview host

This would expose the upstream board renderer, but imports React, Plait, Slate, DOM overlays, browser storage, and file-picker assumptions. It creates a second application inside the plugin and couples release size to an editor UI that Notemd does not own. Reject.

### 3. Create native, target-specific projections

Build a `DrawnixMindMapProjection` from `DiagramSpec`, serialize a constrained `MindElement`-compatible subset, and render the same projection into the SVG companion. Keep the upstream JSON fixture and import verification as compatibility evidence. This preserves the existing spec-first boundary and keeps production dependencies out of the main bundle. Adopt.

## Target Architecture

```text
DiagramSpec
  -> DrawnixMindMapProjectionBuilder
  -> DrawnixMindMapLayout
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (preview companion)
```

The projection builder owns hierarchy and visual roles. The layout owns coordinates. The exporter only serializes fully placed elements. The SVG companion consumes the same placed projection. No generic `SemanticFigureModel` is allowed on the mind-map path.

### Scope Of The First Delivery

- Accept only `intent: "drawnixMindmap"` in `DrawnixRenderer`.
- Preserve `DiagramNode.children` as the primary tree. Do not recreate parent-child relations as ordinary edges.
- Support a bounded set of cross-branch relationships after tree placement. Cross relationships are annotations, not the primary structure.
- Keep output deterministic for the same `DiagramSpec`.
- Generate a stand-alone SVG companion from the placed mind-map projection.
- Open imported `.drawnix` files manually in the pinned upstream Drawnix baseline as a maintainer verification step.

### Explicit Non-Goals

- No full Drawnix editor or toolbar in Obsidian.
- No React/Plait/Slate production dependency in the initial slice.
- No claim that sequence, ER, class, state, or arbitrary flowcharts are Drawnix-native output. Those targets stay on Mermaid or Draw.io until a dedicated projection exists.
- No new public CLI command. Existing Obsidian command invocation remains an end-to-end verification surface only.

## Prompt And Semantic Contract

The Drawnix profile belongs in `diagramSpecPrompt.ts` and activates only for the Drawnix mind-map route. It must require the existing structured fields instead of adding raw Drawnix JSON to LLM output.

```text
Target: editable Drawnix knowledge map.
Required intent: drawnixMindmap.
Create one root node and 3-6 first-level branches.
Each branch has 2-5 children; maximum hierarchy depth is 3.
Use node.children for ownership and taxonomy.
Do not duplicate parent-child relationships in edges.
Use edges only for cross-branch runtime dependencies; emit at most 4.
Use concise labels. Keep operational detail in leaves, not in the root.
For architecture notes, organize the tree by subsystem first. Treat request/data flow as cross-branch relationships.
```

The parser and validator must enforce the parts that can be checked mechanically: one root, bounded depth, unique ids, valid child references, and a cross-relation limit. The renderer must reject an invalid mind-map projection and fall back to the ordinary requested target; it must never silently flatten the tree into the existing grid.

## Delivery Sequence

### Stage 0: Compatibility probe and fixtures (completed for the supported subset)

Inspect the pinned `ref/drawnix` baseline to obtain a minimal mind-map fixture created by the upstream editor. Record the exact element shape, theme object, viewport semantics, and import behavior. Add the resulting fixture under tracked test fixtures with provenance. `ref/` itself remains local analysis material and cannot become a test dependency.

### Stage 1: Mind-map projection and export (completed)

Add the projection, deterministic branch layout, bounded relationship routing, exporter, SVG companion renderer, and target-specific prompt profile. Narrow `DrawnixRenderer.supports()` to the delivered `mindmap` contract. Preserve other render targets and the default best-fit behavior.

### Stage 2: Product exposure and CLI verification (completed)

Expose `mindmap` as a first-class diagram choice only after Stage 1 passes. Use the existing Obsidian CLI command bridge to generate a `.drawnix` artifact from `docs/architecture.zh-CN.md` with an explicit mind-map intent. This verifies the real command/artifact route without overclaiming a public CLI API.

### Stage 3: Architecture-canvas decision (closed: rejected)

Stage 3 decision: rejected. Do not add a `DrawnixArchitectureProjection` without a separate product requirement and acceptance fixture for grouped modules, orthogonal routing, edge-label placement, and collision handling. The current evidence does not justify a second Drawnix algorithm. Route architecture flowcharts to Draw.io or Mermaid and keep Drawnix focused on knowledge maps. The mind-map adapter must not acquire a mode flag.

### Stage 4: Optional read-only Plait preview (closed gate: deferred)

Stage 4 decision: deferred. The repository does not provide verified heavy-runtime bundle isolation, so a Plait preview cannot enter the production plugin safely. Keep the dedicated SVG companion and no Plait dependency. Reopen this gate only when bundle isolation, lazy-load failure handling, bundle-size budgets, and an Obsidian lifecycle test exist. A read-only preview remains an optional enhancement, not a prerequisite for editable `.drawnix` export.

## Test And Verification Matrix

| Layer | Required evidence |
|---|---|
| Projection | Tree is retained, branch order is stable, all nodes receive one placement, no rectangle overlap |
| Layout | Root/branch separation, bounded label width, cross-edge count and routing assertions |
| Export | JSON matches the pinned mind-map fixture contract; no generic rectangle-grid marker remains |
| SVG companion | Uses the same node ids and coordinates as the export; snapshot includes the architecture-note fixture |
| Prompt/parser | Target profile requests a valid tree; malformed tree or excess cross-relations fails before rendering |
| Integration | Existing command route produces `.drawnix` plus SVG companion from `docs/architecture.zh-CN.md` |
| Consumer check | Pinned upstream Drawnix opens the artifact, with a saved screenshot or import log recorded as maintainer-local evidence |

Run targeted Jest tests during implementation, then `npm run build`, `npm test -- --runInBand`, `npm run audit:render-host`, `git diff --check`, `obsidian help`, and `obsidian-cli help`. The final two commands confirm the documented CLI surface; they do not prove Drawnix rendering by themselves.

## Risks And Guardrails

- Upstream JSON validation is permissive. Treat upstream import as an interoperability check, not as a quality oracle.
- `theme: "default"` is not a `PlaitTheme` object. Stage 0 must establish an imported theme fixture before the exporter claims theme parity.
- LLMs often produce flat graphs. The prompt improves inputs, but deterministic projection validation is the real guardrail.
- Labels need multilingual width handling. Branch layout must measure/wrap text deterministically rather than use the current fixed card dimensions.
- Cross-branch edges can destroy a mind map. Cap them and preserve the hierarchy as the primary reading order.
- Do not make a generic `layoutMode` switch that hides two unrelated algorithms. Keep mind-map and future architecture-canvas projections as separate owners.
- Do not add a Plait dependency merely to import types. It would couple the bundle to a runtime the initial path does not execute.

## Completion Criteria

The initial delivery is complete only when the exported architecture knowledge map has a visible root, stable subsystem branches, no flattened parent-child structure, no overlapping node boxes, and no generic three-column layout. The `.drawnix` artifact must import into the pinned upstream baseline, the SVG companion must match its geometry, and the public target documentation must state that Drawnix currently supports editable knowledge maps rather than all graph intents.
