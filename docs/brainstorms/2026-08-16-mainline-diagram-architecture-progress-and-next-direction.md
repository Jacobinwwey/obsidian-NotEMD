---
date: 2026-08-16
last_updated: 2026-08-16
topic: mainline-diagram-architecture-progress-and-next-direction
status: active
canonical_for:
  - current-diagram-progress
  - diagram-architecture-audit
supersedes: ./2026-05-28-mainline-progress-audit-and-next-level-direction.md
superseded_by: null
---

# Mainline Diagram Architecture: Progress Audit And Next Direction

This is the current progress record for the diagram platform. It supersedes the 2026-05-28 audit as the discovery entry for current state; the older document remains historical.

## Executive Assessment

The platform has crossed the most important architectural threshold: generation is spec-first, renderers are registry-backed, and examples are executable. The remaining work is convergence and truthfulness, not a broad “add more diagram types” push.

The reference repository `ref/diagram-design` should influence selection UX and documentation discipline, not be treated as a feature checklist. It defines 27 visual layouts; Notemd currently ships ten semantic types across eight render targets and three export formats.

## Status Matrix

| Area | Status | Evidence / gap |
|---|---|---|
| `DiagramSpec` / spec-first domain | Delivered | `src/diagram/types.ts`, planner and parser; retry identity defect remains open |
| Ten-type executable catalog | Delivered | `src/diagram/diagramTypeCatalog.ts` |
| Executable examples | Delivered in settings | `src/diagram/examples/diagramExampleCatalog.ts`, preview action in settings |
| Generation-flow discoverability | Partial | No inline thumbnails or “use this type” flow |
| Static docs gallery | Not implemented | No generated preview assets or manifest |
| Eight-renderer registry | Delivered | `RendererRegistry` and target-specific renderers |
| Single target descriptor | Not implemented | MIME, extension, preview, export switches still duplicated |
| Export pipeline | Mostly delivered | Editable HTML/SVG production artifact lacks `previewSvg` despite README claim |
| Drawnix one-root contract | Delivered | Filename-rooted native tree, `.drawnix` + SVG companion + Markdown wrapper |
| Circuitikz constrained templates | Delivered | Native source/templates; real compiler gate remains external |
| Mermaid normalization | Active plan, unimplemented | Render and preview still use divergent normalization surfaces |
| Operation executable contracts | Partial / drifting | Registry metadata is not runtime validation; CLI and registry fields differ |
| Settings schema and secrets | Partial; P0 open | Consecutive save writes can defeat local-only isolation |
| LLM gateway and cache | Partial; P0/P1 open | Cache fingerprint incomplete and unbounded |
| PR CI / lint gate | Incomplete | Build/Jest gates exist; lint baseline remains noisy and needs ratchet |
| Documentation discovery | Stale | Current architecture and active plans are not the top-level VitePress path |

## Three-Axis Comparison With `diagram-design`

| Axis | Reference project | Notemd current truth | Decision |
|---|---|---|---|
| Semantic selection | Semantic patterns route to visual types | `DiagramIntent` plus type catalog | Preserve intent-first routing |
| Visual type | 27 layout grammars | Ten executable semantic types | Add candidates only through admission gates |
| Artifact/export | Self-contained HTML/SVG/PNG | Eight render targets, SVG/PNG/PDF exports vary by target | Keep target and export independent |
| Preview | Example HTML assets | Production renderer fixture preview in settings | Generate docs thumbnails from the same fixtures |
| Governance | Type references and complexity budgets | Registry/tests/docs are split | Generate a versioned manifest and contract matrix |

The reference taxonomy contains architecture, IT current-state, timeline, swimlane, quadrant, radar, loop, nested, tree, org chart, layers, Venn, pyramid, bar, line, Gantt, scatter, medallion, process, data flow, DP integration, and DP security matrix, among others. Notemd must label these as reference-only/planned until implementation evidence exists. Gallery variants such as OAuth sequence, animated examples, imports, and high-level vertical are workflows or variants, not additional semantic types.

## Defects That Block Expansion

1. **Artifact identity drift:** a retry can return old `spec` metadata with new content/target. This breaks reproducibility and makes downstream export unsafe.
2. **Target mapping drift:** `editable-html-svg` has HTML content but no explicit SVG companion, and save extension logic is not centralized.
3. **Credential persistence drift:** settings are saved twice, allowing a sanitized local-only view to be overwritten by the full settings object.
4. **Cache isolation drift:** provider endpoint and runtime parameters are absent from the cache key, so semantically different requests can collide.
5. **Contract drift:** registry schemas are descriptive records rather than executable validators; CLI help and runtime behavior can diverge.

These are P0/P1 because they cross persistence, compatibility, or security boundaries. They should be resolved before type expansion.

## Ordered Next Direction

1. Correct settings persistence, retry artifact identity, Editable preview/export, target descriptors, and cache policy.
2. Formalize the three-axis catalog and stable IDs.
3. Derive executable operation contracts and a versioned capability manifest.
4. Generate deterministic SVG/PNG previews and integrate thumbnails into the generation selector.
5. Generate bilingual README/docs matrices and update discovery navigation.
6. Execute Mermaid normalization convergence; then remove Drawnix layout duplication and resolve the Circuitikz repair-loop boundary.
7. Admit reference candidates only after the full evidence checklist is satisfied.

## Superseded Documentation Corrections

- The 2026-08-15 Mermaid plan remains active, but its Drawnix comparison must describe the current one-root native contract and must not reference the deleted presentation module.
- `docs/maintainer/drawnix-export-spike.*` must say one filename-rooted document root, not one or more roots.
- The 2026-07-22 Drawnix brainstorm's full-board/presentation and replay addendum is superseded by the 2026-08-14 implementation record.
- The 2026-08-03 Drawnix routing plan is historical for the inline-default / `.assets` opt-in correction.
- `docs/README*`, `docs/index*`, and VitePress navigation must point to this audit, the architecture pair, the 2026-08-14 Drawnix record, and the active 2026-08-15 Mermaid plan.

## Acceptance Criteria

This audit is current only while the status table links to executable evidence and distinguishes shipped behavior from planned work. When Phase 0 begins, update this document section by section: change only the relevant row, add the test/build evidence, and keep the English and Chinese files synchronized.
