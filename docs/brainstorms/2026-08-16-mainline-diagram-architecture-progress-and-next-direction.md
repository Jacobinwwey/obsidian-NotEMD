---
date: 2026-08-16
last_updated: 2026-08-17
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

The platform has crossed the most important architectural threshold: generation is spec-first, renderers are registry-backed, examples are executable, and the selector/docs gallery are sourced from production renderers. The remaining work is contract convergence, Mermaid normalization, and external-consumer evidence, not a broad “add more diagram types” push.

The reference repository `ref/diagram-design` should influence selection UX and documentation discipline, not be treated as a feature checklist. It defines 27 visual layouts; Notemd currently ships ten semantic types across eight render targets and three export formats.

## Status Matrix

| Area | Status | Evidence / gap |
|---|---|---|
| `DiagramSpec` / spec-first domain | Delivered | `src/diagram/types.ts`, planner/parser, authoritative retry artifact; `diagramGenerationFallbacks.test.ts` |
| Ten-type executable catalog | Delivered | `src/diagram/diagramTypeCatalog.ts` |
| Executable examples | Delivered | `src/diagram/examples/diagramExampleCatalog.ts`, production renderer preview in settings |
| Generation-flow discoverability | Delivered | Inline renderer-backed thumbnails and “use this type” action; `diagramExamplePreview.test.ts`, provider settings coverage |
| Static docs gallery | Delivered | `scripts/generate-diagram-gallery.js`, ten SVG/PNG pairs, `docs/assets/diagrams/manifest.json`, responsive smoke and freshness check |
| Eight-renderer registry | Delivered | `RendererRegistry` and target-specific renderers |
| Single target descriptor | Delivered | `src/rendering/renderTargetCatalog.ts`; preview/file persistence consume it; matrix tests |
| Export pipeline | Delivered for shipped targets | Editable HTML/SVG now carries `previewSvg`; CLI and preview exports use production renderer output; external consumer gates remain explicit |
| Drawnix one-root contract | Delivered | Filename-rooted native tree, `.drawnix` + SVG companion + Markdown wrapper |
| Circuitikz constrained templates | Delivered | Native source/templates; real compiler gate remains external |
| Mermaid normalization | Active plan, unimplemented | Render and preview still use divergent normalization surfaces |
| Operation executable contracts | Partial / converging | `src/operations/contractSchemas.ts` validates schema shape at contract export and maintainer inputs at the host boundary; result-value enforcement and schema-derived help metadata remain |
| Settings schema and secrets | Delivered for current persistence boundary | `saveSettings()` performs one sanitized write; local-only credential regression tests cover the invariant; migration policy remains a separate concern |
| LLM gateway and cache | Delivered as bounded optimization | Versioned credential-free fingerprint, five-minute TTL, 128-entry LRU; explicit invalidation on profile revision is future hardening |
| PR CI / lint gate | Pending final release run | Gallery/docs/build/Jest/lint gates are wired; current turn must record fresh outputs |
| Documentation discovery | Delivered | README, docs hubs, indexes, VitePress nav/sidebar, and bilingual gallery are linked |

## Verification Snapshot (2026-08-17)

- `npm run diagram:gallery:check`: passed; 10 entries, no stale assets.
- `npm run docs:build`: passed; VitePress client/server build and page rendering completed.
- `npm run build`: passed after constraining the root TypeScript include to `src/**/*.ts`; the browser gallery entry remains an esbuild-owned script input.
- `npm test -- --runInBand`: passed; 255 suites, 2,228 passed, 1 skipped. The Phase 2 focused set also passed: 3 suites, 18 tests.
- `npm run lint`: remains blocked by the repository baseline (231 errors, 1,329 warnings); the new gallery entry and contract/cache/catalog files have no lint errors, while existing touched legacy files still report baseline findings.
- `git diff --check`: passed; only Git's LF-to-CRLF normalization warnings remain on Windows.

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
5. **Contract drift:** registry schemas and maintainer CLI help can still diverge in fields and result semantics; the schema admission and input boundary are now executable, but result-value enforcement is not yet universal.

Items 1–4 are now resolved in the working tree and covered by focused regression tests. Item 5 is reduced but remains P1: schema shape admission and maintainer input validation are delivered and unknown legacy fields remain forward-compatible, while result validation and help/schema derivation still need convergence.

## Ordered Next Direction

1. Completed correctness foundation: settings persistence, retry artifact identity, Editable preview/export, target descriptors, cache policy, and Vega chart sizing.
2. Completed the three-axis catalog and stable IDs, including a versioned manifest with `shipped` and `reference-only` lifecycles.
3. Completed deterministic SVG/PNG previews, generation-selector thumbnails, and direct type selection.
4. Completed bilingual gallery/docs discovery and explicit comparison with the pinned `diagram-design` revision.
5. Delivered the first contract-hardening slice: shared schema shape validation, registry export admission, maintainer input validation, and forward-compatible unknown-field handling; keep `diagram.generate`'s sourcePath host adapter distinct from its sourceMarkdown core contract.
6. Add runtime result-value validation and derive maintainer help metadata from the same schema only where the richer metadata can be represented without weakening human-facing examples.
7. Execute Mermaid normalization convergence; then remove Drawnix layout duplication and resolve the Circuitikz repair-loop boundary.
8. Admit reference candidates only after the full evidence checklist is satisfied.

## Superseded Documentation Corrections

- The 2026-08-15 Mermaid plan remains active, but its Drawnix comparison must describe the current one-root native contract and must not reference the deleted presentation module.
- `docs/maintainer/drawnix-export-spike.*` must say one filename-rooted document root, not one or more roots.
- The 2026-07-22 Drawnix brainstorm's full-board/presentation and replay addendum is superseded by the 2026-08-14 implementation record.
- The 2026-08-03 Drawnix routing plan is historical for the inline-default / `.assets` opt-in correction.
- `docs/README*`, `docs/index*`, and VitePress navigation must point to this audit, the architecture pair, the 2026-08-14 Drawnix record, and the active 2026-08-15 Mermaid plan.

## Acceptance Criteria

This audit is current only while the status table links to executable evidence and distinguishes shipped behavior from planned work. Each implementation increment must update the relevant rows, add fresh test/build evidence, and keep the English and Chinese files synchronized. Schema admission and maintainer input validation are delivered; universal result-value validation, help/schema derivation, and Mermaid normalization remain intentionally open.
