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
implementation_record: src/tests/mermaidNormalizationConvergence.test.ts
---

# Mainline Diagram Architecture: Progress Audit And Next Direction

This is the current evidence-backed progress record for the diagram platform. It is the discovery entry for current state; older audits remain historical.

## Executive Verdict

The platform has crossed the architectural threshold that matters: generation is spec-first, renderers are registry-backed, target descriptors are shared by preview and persistence, and the generation selector plus documentation gallery use production renderer fixtures.

The correct next move is convergence. Adding more visual types before closing contract, Mermaid, and external-consumer gates would increase compatibility debt. `ref/diagram-design` is a taxonomy and UX reference, not a feature backlog.

## Delivered Truth Matrix

| Area | Current state | Evidence |
|---|---|---|
| Semantic domain | 10 executable semantic diagram types | `src/diagram/diagramTypeCatalog.ts`, `src/diagram/examples/diagramExampleCatalog.ts` |
| Render targets | 8 registered targets; target identity is separate from export format | `src/rendering/rendererRegistry.ts`, `src/rendering/renderTargetCatalog.ts` |
| Export formats | SVG/PNG/PDF where the target supports them; editable HTML/SVG carries `previewSvg` | target catalog and renderer integration tests |
| Discoverability | Settings selector shows deterministic thumbnails and a direct “use this type” action | `docs/assets/diagrams/manifest.json`, `diagramExamplePreview.test.ts` |
| Static gallery | 10 SVG/PNG pairs generated from production fixtures; stale assets fail the check | `scripts/generate-diagram-gallery.js`, `npm run diagram:gallery:check` |
| Drawnix | Filename-rooted native tree, `.drawnix` plus SVG companion and Markdown wrapper | Drawnix implementation record and export tests |
| Circuitikz | Constrained native templates and CLI compiler path; real TeX consumer remains a separate gate | `src/diagram/adapters/circuitikz`, `scripts/export-circuitikz.js` |
| Operation contracts | Schema shape admission, maintainer input validation, runtime result validation, and help/schema field derivation are now executable | `src/operations/contractSchemas.ts`, `src/operations/maintainerCliContractMetadata.json`, bridge tests |
| Mermaid | Diagram-level normalization, 35-stage legacy registry, family gating, shared scanner, canonical fence ownership, and validation-runtime initialization are converged | `src/diagram/adapters/mermaid/normalize.ts`, `src/mermaidProcessor.ts`, `src/diagram/adapters/mermaid/runtime.ts` |
| Public CLI boundary | `local-knowledge.inspect` remains maintainer-only; it is not a public CLI expansion | `src/maintainerCliBridge.ts`, capability/public-surface tests |

## Implementation Delta (2026-08-17)

1. Added a JSON input-contract source consumed by both the TypeScript validator and the Node maintainer help script. Required/optional field lists now derive from one source; summaries and examples remain explicit human-facing overrides.
2. Added `assertOperationResult()`. Non-null maintainer bridge results are validated against the registry schema; unknown fields remain allowed for forward compatibility, while `null` keeps its existing cancellation/no-result meaning.
3. Moved Mermaid normalization into a runtime-free diagram-layer module. It handles BOM/CRLF, fenced and unfenced input, backtick and tilde fences, family detection, ER entity/cardinality repairs, and trailing whitespace.
4. Kept `mermaidDefinitionShared.ts` as a compatibility re-export and changed preview/render-host consumers to import the neutral module directly.
5. Hardened the markdown repair scanner to recognize both fence styles and preserve ER braces.
6. Exposed the legacy repair chain as 35 stable stage IDs without changing execution order. Flowchart-biased stages are gated to `flowchart`/`unknown`; sequence and ER content fail closed, and the whole chain has an idempotency regression contract.
7. Added the shared `extractMermaidBlocks`/`mapMermaidBlocks` scanner plus `openMermaidFence`/`closeMermaidFence`/`fenceMermaidDefinition`, removing duplicate fence output ownership from validation, repair, and renderer paths.
8. Added `ensureMermaidInitialized()` for the plugin validation runtime. It initializes once per `mermaid.initialize` function identity; preview webviews keep their separate theme-specific `deps.initialize()` lifecycle.
9. Expanded the Mermaid family registry to cover the currently shipped Mermaid 11 declarations (`architecture-beta`, `block-beta`, C4, journey, kanban, packet, pie, quadrant, radar, requirement, sankey, timeline, treemap, xychart, and ZenUML). These families now fail closed before the legacy flowchart repair chain; genuinely unknown headers remain the explicit compatibility escape hatch.
10. Made the semantic catalog authoritative for planner defaults and explicit target admission. Best-fit planning now rejects an intent/target pair that has no declared renderer contract (for example, `dataChart -> mermaid`) before LLM generation; legacy Mermaid mode remains an explicit compatibility escape hatch. A fixture-backed contract test now checks every advertised target against its production renderer's `supports()` implementation.
11. Renamed the production Drawnix source-coverage operation to `enrichDrawnixSourceCoverage()`. The old `mergeDrawnixSourceCoverage()` export remains as a deprecated compatibility alias for maintainer scripts and older tests, while the generation path uses the canonical name.
12. Renamed the production Drawnix routing module to `drawnixRelationRouter.ts`. The old `drawnixCrossRootRouter.ts` path remains a deprecated re-export for source compatibility; the projection imports the canonical module, and no topology or coordinate contract changed.
13. Extracted `drawnixGeometry.ts` as the shared geometry boundary for rectangle inflation, strict-interior overlap checks, and orthogonal polyline interpolation. Router and projection code now consume the same primitives; edge-touching behavior and measured path-length label placement are covered by focused tests.
14. Parameterized the six Circuitikz golden renderers through one standalone-document wrapper and one component-label lookup helper. Existing voltage conventions, topology, layout hints, and exact golden output remain unchanged; the refactor removes repeated preamble/label plumbing without adding a new rendering mode.
15. Extracted `drawnixTextLayout.ts` as the deterministic width estimator and wrapping contract shared by Drawnix headers, nodes, and relation labels. The projection no longer owns a second copy of that algorithm, and focused tests lock ASCII, wide-character, whitespace, and long-word behavior.

## Comparison With `diagram-design`

| Axis | Reference project | Notemd current truth | Engineering decision |
|---|---|---|---|
| Semantic selection | Pattern pages map to visual layouts | `DiagramIntent` routes to a typed catalog | Preserve intent-first routing |
| Visual taxonomy | 27 layout grammars | 10 executable semantic types | Admit candidates only through evidence gates |
| Artifact/export | Self-contained HTML/SVG/PNG examples | 8 targets and independently declared export capabilities | Keep target and export orthogonal |
| Preview | Example HTML assets | Production renderer fixture thumbnails in settings and docs | Generate both from the same fixture |
| Governance | Type references and complexity budgets | Versioned capability/target manifests plus tests | Treat manifests and tests as the contract |

The reference taxonomy includes architecture, current-state, timeline, swimlane, quadrant, radar, loop, nested, tree, org chart, layers, Venn, pyramid, bar, line, Gantt, scatter, medallion, process, data flow, and security/integration matrices. These remain `reference-only/planned` until an implementation, preview, export, and consumer gate exist. Gallery variants such as OAuth sequence, animation, imports, and vertical orientation are workflows or variants, not new semantic types.

## Risk Register And Tradeoffs

- **Mermaid legacy chain:** `mermaidProcessor.ts` remains a large flowchart-biased repair surface, but the order is now explicit as 35 stable stages with a family gate and idempotency coverage. The known Mermaid 11 family registry now fails closed for non-flowchart declarations; only genuinely unknown headers retain the compatibility escape hatch. This is controlled debt, not a reason to route more diagram families through the chain.
- **Mermaid global state:** plugin-side validation initialization is now module-scoped per `initialize` function identity. Preview webviews intentionally retain theme-specific initialization because they own separate runtimes; collapsing those lifecycles would create theme regressions.
- **External interoperability:** Draw.io, Drawnix, and Circuitikz consumer evidence must be real-consumer evidence, not mocks or serializer snapshots. Missing tools remain explicit blockers.
- **Forward compatibility:** Unknown contract fields are accepted intentionally. Required fields and known field types are strict at the boundary; loosening them would make downstream failures harder to localize.
- **Cache:** The response cache remains an optimization. It must never become an authority for artifact identity or correctness.

## External Consumer Gate Status

| Consumer | Current evidence | Status |
|---|---|---|
| Draw.io | No diagrams.net/Draw.io executable is available in this workspace | Not claimed; add a manual or CI gate before promotion |
| Drawnix | Native tree fixtures and serializer tests exist; no independent Drawnix application gate is available here | Not claimed; fixture evidence only |
| Circuitikz | `pdflatex` compiled all 6 golden fixtures; each produced a non-empty PDF with 0 errors and 0 warnings | Passed local consumer gate; keep tool/version in CI evidence |

## Forward Plan

1. **Mermaid Phase 2: completed.** The legacy chain is a 35-stage ordered registry with stable IDs, known-family fail-closed gating, and idempotency coverage. The family registry covers current Mermaid 11 declarations while preserving `unknown` for forward-compatible syntax; parser-backed admission remains required before treating an unknown family as flowchart-safe.
2. **Mermaid Phase 3: completed.** Shared scanning, canonical fence formatting, and plugin validation-runtime initialization are converged. Keep preview webview theme initialization as a separate runtime contract.
3. **Consumer evidence:** run real Draw.io/Drawnix/Circuitikz gates where tooling exists; record unavailable tools rather than claiming interoperability.
4. **Drawnix convergence:** the production source-coverage and relation-router names are canonical; the old source-coverage export and router module are compatibility-only. Shared rectangle/polyline and text measurement/wrapping primitives are now centralized. Extract further measurement/layout helpers only where duplication is demonstrated, then remove the legacy cross-root implementation after call-site proof and a replacement route contract.
5. **Circuitikz convergence:** the six golden renderers now share the standalone-document and component-label helpers while preserving deterministic output. Keep `runCircuitikzRepairLoop()` as a maintainer-only acceptance SDK boundary; normal generation remains deterministic and does not invoke an LLM repair loop. Decide whether to wire a real CLI/desktop caller only when an explicit repair command requires it.
6. **Reference admission:** candidate layouts such as timeline, swimlane, and quadrant are preferred only after the complete evidence checklist passes. Radar remains blocked until a real Vega-Lite adapter exists.

## Acceptance Gates

- `npm run diagram:gallery:check`
- `npm run docs:build`
- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:render-host`
- `npm run lint` (currently repository-baseline blocked; do not relabel this as a feature failure)
- `git diff --check`
- External consumer records must identify tool/version/input/output and must not be replaced by unit mocks.

## Verification Snapshot

Fresh verification for this increment: 259 Jest suites passed, 2,263 tests passed, 1 skipped; TypeScript/esbuild build passed; VitePress 1.6.4 docs build passed; gallery check passed (10 entries); render-host audit passed; Circuitikz smoke passed with TeX Live 2023 `pdflatex` (6/6 PDFs, 0 errors/0 warnings); focused Drawnix text-layout and Circuitikz suites passed (58/58 and 71/71 tests); targeted ESLint passed with 0 errors and 23 existing warnings; and `git diff --check` passed. The full repository lint remains non-zero at 229 errors and 1,330 warnings, all outside the changed-file error set and tracked as pre-existing debt.
