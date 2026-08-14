---
date: 2026-08-14
topic: drawnix-presentation-architecture-review
status: implemented
related:
  - 2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md
  - 2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.md
---

# Drawnix Presentation Architecture Review

## Decision

`drawnixMindmap` is already an independent diagram intent, not a Mermaid output alias: `DiagramSpec` enters a dedicated projection, emits `.drawnix`, then emits an SVG companion. Standard Mermaid `mindmap` continues through `MermaidRenderer` and must remain unchanged.

The present issue is not semantic capacity. The fixed benchmark exports eight roots, 136 nodes, and 32 relations with zero validation errors. The failure appears when that complete knowledge graph is presented as one static SVG: roots are packed in source order, cross-root relations move into lower lanes, the canvas becomes very wide, and the visual reading order degrades.

Do not trade node, depth, or relation caps for a cleaner screenshot. The editable `.drawnix` board must retain full semantics. Static delivery should derive an overview and focused slices from the same semantic graph. These are separate product boundaries, not a `layoutMode` parameter.

## Implemented Delivery Selection

The implementation includes a user-facing one-click selection between **Full board** and **Presentation**. The selection dispatches separate host operations rather than changing behavior inside a shared projection function.

- Full board preserves the current `.drawnix` and full-spread SVG contract. It is the default for legacy settings and artifacts.
- Presentation writes the same compatible board plus overview/detail static slices and a fidelity ledger.
- New artifacts persist a validated semantic replay record. The alternate delivery can then be rebuilt without another LLM call.
- Older artifacts without that record stay readable as full boards. Presentation requires regeneration; no lossy reconstruction is attempted.

The setting stores `drawnixKnowledgeMapDelivery`; an absent or invalid persisted value resolves to Full board. The preview control replays only a validated `metadata.notemd.knowledgeMap.semanticSpec`, so toggling replaces the in-memory preview session without an LLM request, settings mutation, or artifact write. Presentation saves the compatible board plus a manifest-linked overview/detail SVG bundle. The Plait consumer proof runs through pinned public ESM packages in a test-only harness.

The complete catalog, compatibility, persistence, and example-gallery design is in [Diagram Type Catalog And Drawnix Delivery Design](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.en.md).

## Evidence

| Observation | Code evidence | Consequence |
|---|---|---|
| The prompt requires one document root | `src/diagram/prompts/diagramSpecPrompt.ts:143-145` | The model cannot emit an independent subsystem forest. |
| Source coverage always synthesizes a document root | `src/diagram/adapters/drawnix/drawnixSourceCoverage.ts:557-584` | Multiple valid input roots are collapsed before projection. |
| The projection supports multiple roots | `src/diagram/adapters/drawnix/drawnixMindMapProjection.ts:796-965` | Product capability and generation policy disagree. |
| Root packing is source-order with a fixed 6400 width | `drawnixMindMapProjection.ts:786-826` | Cross-root relation weight is ignored, producing long relation lanes. |
| Native serialization gives points only to roots | `drawnixMindMapProjection.ts:514-531` | The upstream `withMind` layout places children; SVG child coordinates cannot be treated as native-board pixel truth. |
| SVG styling is depth and branch-index driven | `src/rendering/renderers/drawnixMindMapSvgRenderer.ts:148-189` | `node.kind` has no visual meaning and branch ordering changes color semantics. |
| The official Drawnix file-open path fits the viewport | `ref/drawnix/packages/drawnix/src/components/toolbar/app-toolbar/app-menu-items.tsx:75-96` | `viewport.zoom = 1` is not the main cause of the official import result; it matters only for consumers that skip fitting. |

The local SVG benchmark is at `.cache/diagram-design-comparison/drawnix-knowledge-map-benchmark.svg`. It retains topology but renders as two broad rows with long relation tunnels. That supports a missing presentation layer, not semantic compression.

## `diagram-design` Assessment

The local reference repository is `ref/diagram-design` at `a5e3978`. It is an agent skill, HTML/SVG templates, and heuristic checks. It is not a general graph IR, layout solver, or Drawnix renderer.

Useful ideas:

* Fix medium, size, audience, and detail before drawing; size drives both canvas and type scale.
* Express paper, ink, muted, accent, and link through semantic tokens instead of scattered colors.
* Publish a fidelity ledger for merges, collapses, and clusters in static output.
* Treat connector, label, and node clearance as testable geometry contracts.

Do not copy these parts into Notemd:

* Its 9/12/24 node budgets fit a single presentation page, not a knowledge graph or editable board.
* Its draw.io/Mermaid import deliberately redraws and drops source coordinates; that fits slide redesign but not Drawnix interoperability.
* `verify-geometry.py` relies mainly on SVG label rectangles and string parsing. It does not replace transform-aware, font-aware, curved-path, or real-consumer validation.

There is also a concrete Windows defect. `drawio_extract.py:851` and `mermaid_extract.py:1280` write directly to `sys.stdout`. Under the default cp1252 environment, the reference Mermaid and draw.io import gates fail on Unicode `U+23CE`; both pass with `PYTHONUTF8=1`. The parser is sound in that run, but the CLI boundary is not cross-platform robust.

## Target Boundaries

```text
Markdown / Mermaid / source evidence
  -> semantic knowledge graph
  -> Drawnix board projection
  -> editable .drawnix

semantic knowledge graph
  -> presentation planner
  -> overview + focused presentation slices
  -> SVG / PNG / PDF
```

The chains share stable node IDs, hierarchy ownership, relation endpoints, evidence references, and semantic roles. They do not need pixel-identical coordinates. Forcing coordinate identity leaks upstream `withMind` auto-layout constraints into static export and blocks target-aware presentation layout.

Recommended owners:

| Owner | Input | Output | Invariant |
|---|---|---|---|
| `buildDrawnixKnowledgeMapBoardProjection()` | Complete semantic forest | `.drawnix`-compatible tree and relations | No node or relation deletion; stable IDs; consumer can open it. |
| `buildKnowledgeMapPresentation()` | Complete semantic forest plus delivery contract | Overview and focused static slices | Every collapse enters the fidelity ledger; the complete board remains available. |
| `renderKnowledgeMapPresentationSvg()` | Placed presentation slice | SVG/PNG/PDF | Target size, type scale, label clearance, and viewport readability are satisfied. |

These are separate operations. Do not place board layout, overview, and slide layout behind a boolean, enum, or options bag.

## Delivery Sequence

### Phase 0: Correct semantic policy and documentation

Split source coverage into two operations: `buildSourceCoverageForest()` adds source structure only; `buildDocumentRootedKnowledgeMap()` creates a document root only for an explicitly requested document overview. Update the Drawnix prompt to allow independent subsystems as roots and retain each root's source scope. A static overview may use a document root, but it must not replace the board's semantic truth.

Retire broad claims that native Drawnix and SVG have the same geometry. The implementation can prove shared relation-label calculation; full node-coordinate parity requires a real Plait consumer check.

### Phase 1: Freeze the board interoperability contract

Pin the upstream Drawnix/Plait version in test-only dependencies, not the production plugin bundle. Mount a minimal read-only board from the fixture and assert root/child structure, stable IDs, relation endpoints, relation text, and visible bounds. Record consumer rectangles, but do not compare them with Notemd SVG coordinate snapshots.

Treat `viewport` as a suggested opening state. The official file-open route already calls `fitViewport`, so viewport work should not precede root clustering, presentation slicing, or consumer evidence.

### Phase 2: Add a presentation planner

Build a root-cluster graph whose weights use cross-root relation count, direction, and label importance. Order and group roots by that graph, then pack them for the target aspect ratio. Optimize weighted relation length, crossings, excessive aspect ratio, and label clearance. These are scores, not complexity-rejection quotas.

When the full tree cannot preserve minimum type size in the requested medium, emit:

* one overview retaining root-to-root relations;
* a detail slice for each dense cluster;
* a ledger listing clustering, summary, and the nodes routed to detail.

The complete `.drawnix` board retains every node and relation. Static output links or names back to it.

### Phase 3: Add visual semantics and target-specific prompts

Generate a small semantic token set from `node.kind`, relation type, and evidence role. Root, subsystem, component, evidence, and cross-relation need stable, explainable treatment; `branchIndex` must not cycle through business colors. Prompts should ask for complete trees, relation roles, and concise labels. Deterministic code owns color, wrapping, clustering, and routing.

Maintain Drawnix prompt examples for multi-root architecture, deep taxonomy, cross-branch dependency, long labels, and Chinese/English mixed labels. Examples should show expected `DiagramSpec`, never train the model to emit Drawnix JSON.

### Phase 4: Quality gates

Keep the current no-semantic-quota tests. Add:

* board fixtures for full semantic preservation and real-consumer import;
* planner fixtures that compare candidate scores against a source-order baseline without regressing hard constraints;
* SVG checks for minimum type size in the actual viewport, clipping, node/label intersections, and traceable connectors;
* overview/detail ledger coverage so every source node is locatable in the output set;
* an isolated Mermaid `mindmap` regression suite proving Drawnix does not take over its route.

Do not delete existing tests to admit complex graphs. Remove only historical depth, relation-count, and fixed-fallback expectations. Tests protecting IDs, ownership, obstacle avoidance, or determinism remain valuable.

## Risks And Tradeoffs

* Applying `diagram-design`'s deletion-first rule directly to the board damages Notemd's knowledge-retention value. Deletion belongs only to ledger-backed presentation slices.
* Full Drawnix-host embedding remains unjustified. It adds React/Plait lifecycle and bundle risk without replacing provenance or presentation planning.
* Router-only changes cannot fix a wide canvas. Graph-aware root placement and medium-aware slicing determine most readability before routing.
* An LLM prompt cannot guarantee visual quality. It can improve semantic input; deterministic planning and consumer tests must guarantee layout behavior.

## Completion Definition

After Phase 1, the editable board and static presentation have independent, verifiable contracts. Complex forests are not truncated for presentation. When one SVG cannot carry the map legibly, the exporter creates a traceable overview/detail set. Mermaid mindmap commands, rendering, and fallback behavior remain unchanged.
