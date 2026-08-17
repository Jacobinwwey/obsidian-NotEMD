---
date: 2026-08-16
last_updated: 2026-08-18
status: current-contract
canonical_for: diagram-capability-catalog
---

# Diagram Capability Catalog

This document is the human-readable view of the current executable catalog. The runtime source of truth is `src/diagram/diagramTypeCatalog.ts` plus `src/diagram/examples/diagramExampleCatalog.ts`; this file must be regenerated or reconciled when those definitions change.

The target descriptor is the runtime authority for artifact mechanics. Its `exportFormats` field contains only image exports (`SVG`, `PNG`, `PDF`); the source artifact is described separately by `sourceExtension` and `vaultExtension`. The tables below keep those axes explicit so a source file is not mistaken for an image export.

## Shipped Semantic Types

| Type ID | User intent | Render target | Example fixture | Preview status | Export |
|---|---|---|---|---|---|
| `mermaid-mindmap` | Concept hierarchy | Mermaid | `mermaid-mindmap-basics` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `drawnix-knowledge-map` | Editable filename-rooted knowledge tree with material cross-branch relations | Drawnix | `drawnix-knowledge-map-architecture` | SVG companion / Drawnix artifact | `.drawnix`, SVG, PNG, PDF |
| `flowchart` | Control flow and decisions | Mermaid | `flowchart-release` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `sequence` | Ordered participant interactions | Mermaid | `sequence-request` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `state` | Lifecycle states and transitions | Mermaid | `state-lifecycle` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `class` | Type ownership and associations | Mermaid | `class-domain` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `entity-relationship` | Entities, fields, and cardinality | Mermaid | `entity-relationship-schema` | Settings preview action | source `.md`, SVG, PNG, PDF |
| `canvas-map` | Spatially grouped concepts | JSON Canvas | `canvas-map-domains` | Iframe / Canvas artifact | source `.canvas`, SVG, PNG, PDF |
| `data-chart` | Measured comparison over an axis | Vega-Lite | `data-chart-trend` | Sandboxed iframe | source `.json` / Vault `.md`, SVG, PNG, PDF |
| `timeline` | Ordered milestones over time | Mermaid | `timeline-roadmap` | Mermaid iframe | source `.md`, SVG, PNG, PDF |
| `swimlane` | Cross-functional responsibility flow | Mermaid | `swimlane-release` | Mermaid iframe | source `.md`, SVG, PNG, PDF |
| `quadrant` | Two-axis prioritization matrix | Mermaid | `quadrant-priorities` | Mermaid iframe | source `.md`, SVG, PNG, PDF |
| `circuit` | Electrical components and nets | Circuitikz | `circuit-cmos-inverter` | SVG companion / source | `.tex`, SVG, PNG, PDF* |

`*` Circuitikz PDF/PNG claims require the pinned native compiler gate. Source artifacts and image exports are separate capabilities; editable HTML/SVG uses a self-contained HTML source artifact plus the descriptor's SVG/PNG/PDF image exports.

## Render Targets

| Target | Artifact boundary | Preview | Export formats | External gate |
|---|---|---|---|---|
| `mermaid` | fenced Mermaid source (`.md`) | iframe | SVG, PNG, PDF | none |
| `json-canvas` | JSON Canvas (`.canvas`) | iframe | SVG, PNG, PDF | none |
| `vega-lite` | Vega-Lite JSON (`.json`, Vault `.md`) | sandboxed iframe | SVG, PNG, PDF | none |
| `html` | generic HTML fallback | iframe | source | none |
| `editable-html-svg` | self-contained HTML with semantic inline SVG (`.html`) | SVG companion | SVG, PNG, PDF | none |
| `drawio` | Draw.io XML (`.drawio`) plus review companions | SVG companion | SVG, PNG, PDF | diagrams.net open/import |
| `drawnix` | one filename-rooted `.drawnix` tree plus SVG companion | SVG companion | SVG, PNG, PDF | Drawnix open/import |
| `circuitikz` | validated `.tex` plus review companion | SVG companion/source | SVG, PNG, PDF | native TeX compile |

## Reference-Only / Planned Types

The following names come from `ref/diagram-design` and are not currently selectable in Notemd: architecture, IT current-state, radar/spider, loop/flywheel, nested, tree, org chart, layer stack, Venn, pyramid/funnel, bar, line, Gantt, scatter, high-level, process, medallion, data flow, DP integration, and DP security matrix. Timeline, swimlane, and quadrant have crossed the candidate gate as Mermaid-only types; they are not advertised as editable HTML/SVG, Draw.io, or Drawnix targets.

## Preview and Gallery Contract

The settings gallery and generated docs gallery are executable and use the production renderer. The generated gallery produces:

- `docs/assets/diagrams/<fixture-id>.svg`
- `docs/assets/diagrams/<fixture-id>.png`
- a versioned capability manifest
- bilingual matrix rows linked to the same fixture IDs

The generator must use the production fixture catalog, fail on missing previews or stale assets, and keep filenames stable. It must not duplicate fixture data in documentation scripts.

## Consumer Gates

Unit tests prove the Notemd artifact contract. They do not prove external interoperability:

- open Draw.io XML in diagrams.net;
- open/import Drawnix JSON in a real Drawnix consumer;
- compile Circuitikz TeX with the pinned compiler.
