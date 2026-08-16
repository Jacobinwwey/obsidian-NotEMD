---
date: 2026-08-14
topic: diagram-type-catalog-and-drawnix-delivery
status: superseded
superseded_by: 2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.en.md
scope: architecture-and-documentation
related:
  - ../brainstorms/2026-08-14-drawnix-presentation-architecture-review.md
  - ../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md
  - ../architecture.md
---

# Diagram Type Catalog And Drawnix Delivery Design

> Status (2026-08-15): Superseded. The full-board/presentation split inserted replay validation before the primary artifact write and failed during a real Vault run. The active contract is the filename-rooted native Drawnix tree in the [implementation record](./2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.en.md). Keep this document only as the rejected-design record; do not restore its selector, replay metadata, or panel bundle.

## Decision

Introduce an executable-only `DiagramTypeCatalog`. It owns type naming, semantic pattern, prompt profile, renderer binding, visual-role vocabulary, and example-fixture binding. It does not advertise a type until that type has a complete generation, rendering, export, and test path.

Keep `drawnixMindmap` as the persisted compatibility intent. Its catalog-facing name becomes **Drawnix Knowledge Map**. The catalog treats it as a first-class diagram type with a dedicated prompt, board projection, presentation projection, and example family. `drawnix` remains a file/render target, not the user-facing type name.

The current full-board artifact remains the compatibility baseline. A new presentation delivery is a separate operation that derives overview and detail slices from the same semantic graph. A UI selection chooses an operation; no low-level layout function accepts a `mode` flag.

## Scope And Boundaries

This design changes the product model and the documentation architecture. It does not claim that the following runtime work has shipped.

The current shipped contract remains:

```text
DiagramSpec(intent: "drawnixMindmap")
  -> Drawnix mind-map projection
  -> editable .drawnix
  -> full-spread SVG companion
```

The approved target contract is:

```text
DiagramSpec
  -> Drawnix Knowledge Map type profile
  -> buildDrawnixKnowledgeMapBoardProjection()
  -> editable .drawnix

same DiagramSpec
  -> buildDrawnixKnowledgeMapPresentation()
  -> overview + detail slices + fidelity ledger
  -> renderDrawnixKnowledgeMapPresentationSvg()
  -> SVG / PNG / PDF
```

The two chains share stable node IDs, hierarchy ownership, relation endpoints, semantic roles, evidence references, and source provenance. They do not share pixel coordinates. Drawnix's upstream `withMind` runtime places native children after import, while static delivery must optimize for a known viewport.

The design does not embed Drawnix or Plait in the Obsidian production bundle. It does not change Mermaid `mindmap`, its prompt, its renderer, or its fallback behavior.

## Catalog Model

`DiagramTypeCatalog` is a registry rather than another inference switch. A definition has one coherent responsibility:

| Field | Meaning |
|---|---|
| `id` | Stable catalog identifier used by settings, docs, and examples. |
| `family` | Knowledge, behavior, structure, quantitative, or engineering. |
| `semanticPattern` | The load-bearing relationship the reader must understand. |
| `intentBinding` | Current `DiagramIntent` or an explicit future absence. |
| `promptProfile` | Type-specific constraints for the structured `DiagramSpec` response. |
| `rendererBinding` | The concrete renderer operation and its artifact contract. |
| `visualRoles` | Stable semantic role vocabulary; never branch-order colors. |
| `exampleFixture` | A Notemd-owned semantic fixture and its generated example artifact. |
| `availability` | `executable` or `reference-only`; only executable entries reach the UI. |

The catalog is a source of truth for UI labels, documentation tables, prompt routing, and example-gallery metadata. It is not a generic renderer options object. Each renderer keeps its own complete operation and invariants.

## Executable Type Taxonomy

| Family | Catalog type | Current binding | Reference design cue | Availability |
|---|---|---|---|---|
| Knowledge | Mermaid Mind Map | `mindmap` -> Mermaid | Tree hierarchy | executable |
| Knowledge | Drawnix Knowledge Map | `drawnixMindmap` -> Drawnix | Tree + Architecture | executable |
| Behavior | Flowchart | `flowchart` -> Mermaid | Flowchart | executable |
| Behavior | Sequence | `sequence` -> Mermaid | Sequence | executable |
| Behavior | State | `stateDiagram` -> Mermaid | State machine | executable |
| Structure | Class diagram | `classDiagram` -> Mermaid | Technical structure; no new template claim | executable |
| Structure | Entity relationship | `erDiagram` -> Mermaid | ER / data model | executable |
| Structure | Spatial concept map | `canvasMap` -> JSON Canvas | Architecture / tree cues only | executable |
| Quantitative | Data chart | `dataChart` -> Vega-Lite | Bar, line, scatter; pie and table retain their own grammar | executable |
| Engineering | Circuit | `circuit` -> Circuitikz | Circuit-specific template catalog | executable |

Timeline, swimlane, architecture, process, Gantt, layer stack, radar, and the other reference-repository layouts remain `reference-only`. They may appear in the roadmap and selection rationale, never in the current setting selector or example gallery.

## Drawnix Delivery Selection

The UI exposes two named choices under Drawnix Knowledge Map:

| Choice | Operation | Primary output | Use |
|---|---|---|---|
| **Full board** | `generateDrawnixKnowledgeMapBoard()` | Existing `.drawnix` plus full-spread SVG companion | Editing, exhaustive inspection, and preserving the complete visual forest in one artifact. |
| **Presentation** | `generateDrawnixKnowledgeMapPresentation()` | Same `.drawnix`, overview SVG, detail SVGs, and a delivery manifest | Documentation, review, printing, and slide-oriented explanation. |

The selector is a one-click host decision. It dispatches one of those operations. `buildDrawnixKnowledgeMapBoardProjection()` and `buildDrawnixKnowledgeMapPresentation()` remain separate functions with separate result types and tests.

Persist the user preference as `drawnixKnowledgeMapDelivery: 'full-board' | 'presentation'`. It is a routing preference, not a layout argument. Existing settings lack this property and therefore resolve to `full-board`. Existing `preferredDiagramIntent: 'drawnixMindmap'` and `preferredDiagramRenderTarget: 'drawnix'` continue to select the full-board operation.

The preview toolbar also exposes the alternate operation when a semantic replay record exists. It rebuilds the other delivery from persisted semantic data and does not invoke the LLM. A legacy `.drawnix` artifact without that record remains readable as a full board; the UI must say that a presentation set requires regeneration instead of inventing missing semantics.

## Persistence And Naming

New Drawnix exports keep the current source-visual metadata contract unchanged:

```text
metadata.notemd.sourceVisuals@1
```

They add a sibling, forward-compatible replay record:

```text
metadata.notemd.knowledgeMap@1
  - canonical DiagramSpec subset
  - semantic-spec hash
  - catalog type id
  - delivery manifest references
```

The existing validator already permits additional namespaced metadata fields when the v1 `sourceVisuals` structure remains valid. The implementation must validate the new record at the host boundary and leave unknown future records untouched.

Full-board paths keep their current names:

```text
<source>_diagram.drawnix
<source>_diagram.drawnix.svg
```

Presentation output uses a separate, manifest-owned directory so it cannot overwrite the full board or user files:

```text
<source>_diagram.presentation/
  manifest.json
  overview.svg
  detail-01-<cluster>.svg
  detail-02-<cluster>.svg
```

PNG and PDF exports derive from those SVG panels. Cleanup only removes files enumerated in a valid Notemd manifest owned by the same source artifact.

## Drawnix Presentation Planner

The board projection keeps all nodes and relations. The presentation planner consumes the same semantic forest and applies a delivery contract with target dimensions, intended audience, language, and minimum readable type size.

Root placement is graph-aware. It weighs cross-root relation count, relation direction, label importance, and cluster density before aspect-ratio-aware packing. It scores candidate layouts by weighted relation length, crossings, aspect ratio, and label clearance. Scores guide selection; they never reject a graph merely because it is deep, broad, or relation-rich.

When the complete forest cannot satisfy the delivery contract in one viewport, the planner emits:

1. An overview that preserves roots and material root-to-root relations.
2. A detail slice for every dense cluster.
3. A fidelity ledger mapping each node and relation to its visible overview or detail location and recording every summary or clustering decision.

The full `.drawnix` file remains the exhaustive artifact. Presentation slices cannot silently delete semantics.

## Visual Roles And Examples

Reference project examples provide a design vocabulary, not copied assets or fixed node budgets. Notemd-owned examples adopt the useful parts:

- choose the semantic type before choosing its layout;
- use stable visual roles instead of arbitrary branch colors;
- reserve emphasis for a small, explainable set of focal items;
- use orthogonal, independently traceable connectors where the target layout permits them;
- put legends and delivery notes outside the content area;
- verify label clearance, clipping, and viewport readability.

Drawnix Knowledge Map uses roles such as `root`, `domain`, `subsystem`, `component`, `evidence`, `external`, and `cross-relation`. The prompt supplies role-bearing semantic input and concise labels. Deterministic code owns wrapping, role treatment, clustering, routing, and color assignment.

Every executable catalog entry receives a Notemd-owned example package:

```text
selection rationale
-> canonical DiagramSpec fixture
-> generated source artifact
-> generated SVG or PNG thumbnail
-> structural and visual assertions
-> Chinese and English label cases
```

The gallery renders only generated Notemd artifacts. `ref/diagram-design` remains a local design reference; its HTML and screenshots are not bundled as product examples.

## Prompt Design

Drawnix receives an independent prompt profile. It must allow a multi-root forest, preserve source scope per root, use `node.children` for hierarchy, add relation roles only for material cross-branch relationships, and retain concise labels. It must not emit Drawnix JSON or CSS decisions.

The current forced document root becomes an explicit presentation-overview choice. Source coverage retains input hierarchy first. A document root may be introduced by the presentation planner when an overview needs one; it must not replace the board's semantic truth.

Mermaid Mind Map keeps its current prompt profile. No Drawnix-specific root or relation rule leaks into that route.

## Compatibility Rules

1. Existing settings and full-board outputs keep their behavior and paths.
2. A missing replay record never blocks opening or exporting an existing `.drawnix` file.
3. A presentation request on a legacy artifact fails with an actionable regeneration requirement, never with a lossy inferred reconstruction.
4. A newly generated presentation artifact also writes the compatible full-board `.drawnix` file.
5. Mermaid `mindmap` commands, cache keys, fallback traversal, and repair flow remain isolated from Drawnix changes.
6. Unknown catalog IDs and metadata schema versions fail closed at the new boundary while legacy valid exports remain readable.

## Quality Gates

| Surface | Required evidence |
|---|---|
| Catalog | Every executable entry has a prompt profile, renderer binding, example fixture, and localized label. Reference-only entries cannot reach the selector. |
| Board | Stable IDs, hierarchy ownership, relation endpoints, native Drawnix import, and complete semantic preservation. |
| Presentation | No clipped labels, no node/label intersection, traceable connectors, minimum type size in the target viewport, and ledger coverage for all semantic entities. |
| Compatibility | Legacy settings select full board; legacy artifacts stay readable; presentation re-render uses the replay record without an LLM call. |
| Isolation | Mermaid `mindmap` generation, rendering, and fallback tests remain unchanged and pass independently. |

Pin a Drawnix/Plait consumer only in test dependencies for import evidence. SVG structural checks complement consumer testing; neither replaces the other.

## Rejected Alternatives

- Applying the reference repository's 9/12/24-node presentation budgets to the board. Those are editorial constraints, not semantic validity rules.
- Teaching the LLM visual colors, coordinates, or Drawnix file syntax. These belong to deterministic projection and rendering.
- One renderer with a `full`/`presentation` switch. It obscures two different artifact contracts and makes test failures ambiguous.
- Replacing the existing full-board SVG. It would break familiar paths, visual review workflows, and forward compatibility.
- Advertising reference-only types in the UI. That creates a product contract without an implementation.

## Completion Criteria

The shipped increment is complete when a user can select **Full board** or **Presentation** in one action, receive the appropriate owned artifacts, switch between them without regenerating semantic content when replay data exists, and retain all existing Mermaid mind-map behavior. The example gallery must describe only executable types and each thumbnail must be produced by the same renderer path users receive.

The task-level implementation sequence is in [Diagram Type Catalog And Drawnix Delivery Implementation Plan](./2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.en.md).
