---
date: 2026-07-22
version: 1.9.4
topic: drawnix-knowledge-map-quality-and-delivery
status: implemented
---

# Drawnix Knowledge-Map Quality And Delivery Plan

## Decision

The implemented Drawnix route is a native knowledge-map projection with geometry-derived capacity. It preserves hierarchy and uses the upstream mind-map element model without embedding the Drawnix application shell, toolbars, persistence layer, or browser file APIs in the Obsidian bundle.

Standard Mermaid `mindmap` remains unchanged. Drawnix is a separate `drawnixMindmap` intent with its own prompt profile, validation, exporter, SVG companion, and fallback mapping that copies the spec rather than flattening it.

## Implemented Result

```text
DiagramSpec(intent: "drawnixMindmap")
  -> DrawnixMindMapProjection
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (notemd-drawnix-mindmap-svg@1.0.0)
```

The delivered contract is one or more top-level roots, nested `node.children` forests, `mindmap`/`mind_child` elements, and `arrow-line` cross-branch relationships. It has no fixed depth or relation-count quota. The projection sizes relation lanes from measured label boxes, expands the canvas for those lanes, and rejects only invalid semantics or geometry that cannot remain inside the canvas without entering protected regions. Large forests are packed into deterministic bounded-width rows so an unbounded root count cannot create a single-line canvas. The CLI routes Drawnix before constructing the generic `SemanticFigureModel`; other targets keep their existing path. Full Drawnix host embedding and a Plait preview remain deferred.

## Current Routing And Source-Coverage Update (2026-08-14)

The initial Drawnix policy used a numeric depth budget and a small relation quota. Those rules rejected valid architecture maps and are gone. The current pipeline separates semantic validation, forest placement, lane allocation, and route ingress:

```text
semantic validation
  -> forest layout
  -> preliminary gutter reservation from measured labels
  -> placed-node relation lane allocation
  -> endpoint ingress routing
  -> shared native/SVG label geometry validation
```

The preliminary pass centers the forest inside enough horizontal space for the widest relation label. After nodes have coordinates, the allocator resolves each endpoint relative to its root. A same-side relation receives a pair of tracks in that side's exterior gutter and a deterministic row near its two endpoints. A cross-forest relation receives the existing lower lane. This avoids sending a same-side dependency through the whole diagram merely because a wider sibling branch blocks the first local column.

The router still treats nodes, the header band, other label rectangles, and canvas bounds as hard obstacles. Native Drawnix text and the SVG label use the same allocated rectangle; a mismatch fails the projection. The implementation does not trade those invariants for route availability.

Source coverage follows the same semantic policy. Markdown heading chains and unmatched model branches retain their full hierarchy and IDs. Diagnostics describe actual node merges or dropped invalid, duplicate, or hierarchy-ownership edges; they are not a depth-compression path. The regression fixture includes a sixth-level source heading and a model branch beyond the former cap, then verifies that its cross relation keeps the original endpoint IDs.

The regression surface is layered. The lane unit tests verify dynamic relation allocation, exterior corridor selection, and explicit failure when the supplied canvas cannot hold the geometry. The routing fixture covers a multi-branch architecture map, deterministic output, node/header/canvas safety, and local same-side routes. Renderer tests cover native/SVG geometry and header wrapping. Source-coverage tests verify deep hierarchy preservation and valid relation endpoints. The tests do not encode a maximum depth, maximum relation count, a required fallback strategy, or a historical canvas width.

The operational baseline now includes `npm run benchmark:drawnix-knowledge-map`: a fixed 8-root, 136-node, 32-relation forest exported through the same artifact CLI. It records structural counts, artifact sizes, and cold end-to-end time without imposing a machine-dependent duration quota. Release candidates must retain real upstream import evidence against the pinned Drawnix baseline. A performance regression must be fixed with layout or routing work, not with a new semantic quota.

## Review Addendum (2026-08-14)

The independent `drawnixMindmap` intent, dedicated projection, no-semantic-quota policy, and Mermaid isolation remain valid. The new benchmark verifies that eight roots, 136 nodes, and 32 relations retain topology. It also exposes a presentation gap: emitting the complete forest as one SVG combines source-order root packing with lower cross-root lanes and produces an excessively wide canvas.

The follow-up must not reopen the full Drawnix host or repair the image by limiting depth, nodes, or relations. It needs a separate presentation planner: the board projection retains complete `.drawnix` semantics while static delivery emits overview and detail slices with a fidelity ledger for each summary or cluster. A document root must move from mandatory source coverage to an optional presentation policy so the existing multi-root projection can be used.

One documentation claim also needs tightening. The Notemd SVG uses a local placed projection, while exported native MindElements give points only to roots and let upstream `withMind` place children. "Same native/SVG geometry" is therefore a consumer contract to verify, not a conclusion from the serialization shape. The official Drawnix file-open route calls `fitViewport`, so a fixed `viewport.zoom = 1` is not the main cause of the broad canvas.

See [Drawnix Presentation Architecture Review](./2026-08-14-drawnix-presentation-architecture-review.md) for the full comparison, phases, and `diagram-design` assessment.

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
- Support cross-branch relationships after tree placement whenever independent lanes and safe endpoint ingress can be allocated. Cross relationships are annotations, not the primary structure.
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
Create one or more top-level root nodes. Keep independent subsystems as separate roots instead of inventing a container node.
Keep the hierarchy as deep as the source requires. Do not flatten a meaningful taxonomy to meet an arbitrary depth budget.
Use node.children for ownership and taxonomy.
Do not duplicate parent-child relationships in edges.
Use edges only for cross-branch runtime dependencies. Preserve every material relationship needed to explain the source; the renderer allocates adaptive relation lanes.
Use concise labels. Keep operational detail in leaves, not in the root.
For architecture notes, organize the tree by subsystem first. Treat request/data flow as cross-branch relationships.
```

The parser and validator enforce the parts that can be checked mechanically: at least one root, unique ids, valid child references, valid relation endpoints, and no edge that duplicates hierarchy ownership. The renderer rejects an invalid or unsafe mind-map projection; an explicitly requested Drawnix target must never flatten into the shared grid or silently become Mermaid.

## Delivery Sequence

### Stage 0: Compatibility probe and fixtures (completed for the supported subset)

Inspect the pinned `ref/drawnix` baseline to obtain a minimal mind-map fixture created by the upstream editor. Record the exact element shape, theme object, viewport semantics, and import behavior. Add the resulting fixture under tracked test fixtures with provenance. `ref/` itself remains local analysis material and cannot become a test dependency.

### Stage 1: Mind-map projection and export (completed)

Add the projection, deterministic branch layout, adaptive relation-lane routing, exporter, SVG companion renderer, and target-specific prompt profile. Narrow `DrawnixRenderer.supports()` to the delivered `mindmap` contract. Preserve other render targets and the default best-fit behavior.

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
| Layout | Root/branch separation, bounded label width, lane allocation, and obstacle-safe routing assertions |
| Export | JSON matches the pinned mind-map fixture contract; no generic rectangle-grid marker remains |
| SVG companion | Uses the same node ids and coordinates as the export; snapshot includes the architecture-note fixture |
| Prompt/parser | Target profile requests a valid tree; malformed hierarchy, duplicate ownership edge, or unsafe geometry fails before rendering |
| Integration | Existing command route produces `.drawnix` plus SVG companion from `docs/architecture.zh-CN.md` |
| Consumer check | Pinned upstream Drawnix opens the artifact, with a saved screenshot or import log recorded as maintainer-local evidence |

Run targeted Jest tests during implementation, then `npm run build`, `npm test -- --runInBand`, `npm run audit:render-host`, `git diff --check`, `obsidian help`, and `obsidian-cli help`. The final two commands confirm the documented CLI surface; they do not prove Drawnix rendering by themselves.

## Risks And Guardrails

- Upstream JSON validation is permissive. Treat upstream import as an interoperability check, not as a quality oracle.
- `theme: "default"` is not a `PlaitTheme` object. Stage 0 must establish an imported theme fixture before the exporter claims theme parity.
- LLMs often produce flat graphs. The prompt improves inputs, but deterministic projection validation is the real guardrail.
- Labels need multilingual width handling. Branch layout must measure/wrap text deterministically rather than use the current fixed card dimensions.
- Cross-branch edges can destroy a mind map when they share geometry. Preserve hierarchy as the primary reading order, give each relation an independent lane, and reject only when no safe geometry exists.
- Do not make a generic `layoutMode` switch that hides two unrelated algorithms. Keep mind-map and future architecture-canvas projections as separate owners.
- Do not add a Plait dependency merely to import types. It would couple the bundle to a runtime the initial path does not execute.

## Completion Criteria

The initial delivery is complete only when the exported architecture knowledge map has visible root trees, stable subsystem branches, no flattened parent-child structure, no overlapping node boxes, and no generic three-column layout. The `.drawnix` artifact must import into the pinned upstream baseline, the SVG companion must match its geometry, and the public target documentation must state that Drawnix currently supports editable knowledge-map forests rather than all graph intents.
