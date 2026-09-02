---
date: 2026-08-16
last_updated: 2026-09-02
status: current-contract
canonical_for: diagram-capability-catalog
---

# Diagram Capability Catalog

This document is the human-readable view of the current executable catalog. The runtime sources of truth are `src/diagram/diagramTypeCatalog.ts`, `src/diagram/examples/diagramExampleCatalog.ts`, `src/rendering/renderTargetCatalog.ts`, and `src/diagram/diagramCapabilityManifest.ts`. Reconcile this document whenever those definitions change.

The catalog has three independent axes: semantic type, render target, and export format. A catalog row is an executable user-facing choice; a render target describes the artifact boundary; `SVG`, `PNG`, and `PDF` are image exports. The source extension and Vault extension are intentionally listed separately from image exports.

## Shipped Semantic Types

The 33 rows below are the complete executable catalog. Variant rows such as `bar-chart`, `line-chart`, and `scatter-plot` are separate stable choices but share the bounded Vega-Lite renderer.

| Type ID | Semantic intent | Render target | Example fixture | Output contract |
|---|---|---|---|---|
| `mermaid-mindmap` | Concept hierarchy | Mermaid | `mermaid-mindmap-basics` | `.md`, SVG, PNG, PDF |
| `drawnix-knowledge-map` | Filename-rooted knowledge tree with cross-branch relations | Drawnix | `drawnix-knowledge-map-architecture` | `.drawnix`, SVG, PNG, PDF |
| `flowchart` | Control flow and decision path | Mermaid | `flowchart-release` | `.md`, SVG, PNG, PDF |
| `sequence` | Ordered participant interaction | Mermaid | `sequence-request` | `.md`, SVG, PNG, PDF |
| `state` | State transition lifecycle | Mermaid | `state-lifecycle` | `.md`, SVG, PNG, PDF |
| `class` | Type relationship and ownership | Mermaid | `class-domain` | `.md`, SVG, PNG, PDF |
| `entity-relationship` | Entity cardinality and attributes | Mermaid | `entity-relationship-schema` | `.md`, SVG, PNG, PDF |
| `canvas-map` | Spatially grouped concepts | JSON Canvas | `canvas-map-domains` | `.canvas`, SVG, PNG, PDF |
| `data-chart` | Measured comparison over a shared axis | Vega-Lite | `data-chart-trend` | `.json` / Vault `.md`, SVG, PNG, PDF |
| `radar-chart` | Multi-axis profile comparison | Vega-Lite | `radar-capability-profile` | `.json` / Vault `.md`, SVG, PNG, PDF; HTML table fallback |
| `org-chart` | Ownership hierarchy with accountable reporting paths | Mermaid | `org-chart-support-ownership` | `.md`, SVG, PNG, PDF; HTML table fallback |
| `timeline` | Ordered milestones over time | Mermaid | `timeline-roadmap` | `.md`, SVG, PNG, PDF |
| `swimlane` | Cross-functional responsibility flow | Mermaid | `swimlane-release` | `.md`, SVG, PNG, PDF |
| `quadrant` | Two-axis prioritization matrix | Mermaid | `quadrant-priorities` | `.md`, SVG, PNG, PDF |
| `circuit` | Electrical components and nets | Circuitikz | `circuit-cmos-inverter` | `.tex`, SVG, PNG, PDF* |
| `bar-chart` | Discrete category comparison (`variant: bar`) | Vega-Lite | `bar-chart-adoption` | `.json` / Vault `.md`, SVG, PNG, PDF |
| `line-chart` | Continuous trend over an ordered axis (`variant: line`) | Vega-Lite | `line-chart-render-time` | `.json` / Vault `.md`, SVG, PNG, PDF |
| `scatter-plot` | Correlation between paired values (`variant: scatter`) | Vega-Lite | `scatter-plot-quality` | `.json` / Vault `.md`, SVG, PNG, PDF |
| `architecture` | Components grouped by boundary and connected by topology | Editable HTML/SVG | `architecture-platform` | `.html`, SVG, PNG, PDF |
| `current-state` | Legacy landscape with handoffs and bottlenecks | Editable HTML/SVG | `current-state-legacy-pipeline` | `.html`, SVG, PNG, PDF |
| `integration-topology` | Sources and consumers connected to a platform core | Editable HTML/SVG | `integration-topology-platform` | `.html`, SVG, PNG, PDF |
| `data-flow` | Role-scoped data movement through pipeline stages | Editable HTML/SVG | `data-flow-platform` | `.html`, SVG, PNG, PDF |
| `access-matrix` | Role-to-component permission matrix | Editable HTML/SVG | `access-matrix-platform` | `.html`, SVG, PNG, PDF |
| `gantt` | Tasks and milestones on an execution timeline | Editable HTML/SVG | `gantt-release-plan` | `.html`, SVG, PNG, PDF |
| `layer-stack` | Ordered abstraction layers with a focal layer | Editable HTML/SVG | `layer-stack-platform` | `.html`, SVG, PNG, PDF |
| `venn` | Overlap between two or three explicit sets | Editable HTML/SVG | `venn-platform` | `.html`, SVG, PNG, PDF |
| `ranked-funnel` | Ranked hierarchy or conversion drop-off | Editable HTML/SVG | `ranked-funnel-release` | `.html`, SVG, PNG, PDF |
| `loop` | Reinforcing cycle writing durable state to a hub | Editable HTML/SVG | `loop-operating-model` | `.html`, SVG, PNG, PDF |
| `nested` | Scope and containment through nested boundaries | Editable HTML/SVG | `nested-scope` | `.html`, SVG, PNG, PDF |
| `tree` | Parent-to-child hierarchy | Editable HTML/SVG | `tree-ownership` | `.html`, SVG, PNG, PDF |
| `process` | Multi-actor staged process with handoffs | Editable HTML/SVG | `process-release` | `.html`, SVG, PNG, PDF |
| `medallion` | Data quality tiers and promotion paths | Editable HTML/SVG | `medallion-data-quality` | `.html`, SVG, PNG, PDF |
| `high-level` | End-to-end platform overview across stack tiers | Editable HTML/SVG | `high-level-platform` | `.html`, SVG, PNG, PDF |

`*` Circuitikz PDF/PNG claims require the pinned native compiler gate. A source artifact and its image exports are separate capabilities.

## Render Targets

| Target | Artifact boundary | Preview | Export formats | External gate |
|---|---|---|---|---|
| `mermaid` | fenced Mermaid source (`.md`) | iframe | SVG, PNG, PDF | none |
| `json-canvas` | JSON Canvas (`.canvas`) | iframe | SVG, PNG, PDF | none |
| `vega-lite` | Vega-Lite JSON (`.json`, Vault `.md`) | sandboxed iframe | SVG, PNG, PDF | none |
| `html` | generic HTML fallback | iframe | source | none |
| `editable-html-svg` | self-contained HTML with semantic inline SVG (`.html`) | SVG companion | SVG, PNG, PDF | none |
| `drawio` | Draw.io XML (`.drawio`) plus review companions | SVG companion | SVG, PNG, PDF | diagrams.net open/import |
| `drawnix` | filename-rooted `.drawnix` tree plus SVG companion | SVG companion | SVG, PNG, PDF | Drawnix open/import |
| `circuitikz` | validated `.tex` plus review companion | SVG companion/source | SVG, PNG, PDF | native TeX compile |

## Reference-Only / Planned Types

Exactly five reference grammars remain outside the selector and production gallery:

- `diagram-design:flowchart`
- `diagram-design:sequence`
- `diagram-design:state-machine`
- `diagram-design:er-data-model`
- `diagram-design:pyramid-funnel`

They are retained in `referenceOnlyLayouts` for roadmap accounting. They do not ship screenshots, data URLs, selector rows, or preview API entries. Promotion requires a typed input contract, production renderer, fixture, target/export matrix, accessibility evidence, documentation row, and an automated gate. The executable `flowchart`, `sequence`, `state`, and `ranked-funnel` rows are separate contracts and do not automatically promote these exact reference grammars.

## Preview and Gallery Contract

The Settings page and generation workbench use `src/ui/diagramTypePreviewPanel.ts`. The selector exposes only executable catalog entries; after selection, one fixed-size panel renders the chosen production fixture through `renderDiagramExampleThumbnail()`. The docs gallery is generated from the same production fixture catalog and writes:

- `docs/assets/diagrams/<fixture-id>.svg`
- `docs/assets/diagrams/<fixture-id>.png`
- a versioned capability manifest
- bilingual matrix rows linked to the same fixture IDs

The generator fails on missing previews or stale assets and keeps fixture filenames stable. It must not duplicate fixture data in documentation scripts. `docs/diagram-examples/` is a separate real-Vault evidence set with bilingual input notes, provider/model metadata, generated artifacts, hashes, and explicit `passed`/`failed` status; a passed entry is evidence of a loaded plugin run, not a static fixture claim.

## Consumer Gates

Unit tests prove the Notemd artifact contract. They do not prove external interoperability:

- open Draw.io XML in diagrams.net;
- run `npm run diagram:consumer:drawnix` to consume the production fixture through public Plait APIs, then open/import the same `.drawnix` JSON in a real Drawnix application when one is available;
- compile Circuitikz TeX with the pinned compiler.

The current Plait consumer gate is green. Draw.io application import and a full Drawnix application round trip remain external evidence, not implied by serializer or public-API tests.
