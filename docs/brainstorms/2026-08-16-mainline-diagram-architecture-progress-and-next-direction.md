---
date: 2026-08-16
last_updated: 2026-08-18
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
| Semantic domain | 13 executable semantic diagram types | `src/diagram/diagramTypeCatalog.ts`, `src/diagram/examples/diagramExampleCatalog.ts` |
| Render targets | 8 registered targets; target identity is separate from export format | `src/rendering/rendererRegistry.ts`, `src/rendering/renderTargetCatalog.ts` |
| Export formats | SVG/PNG/PDF where the target supports them; editable HTML/SVG carries `previewSvg` | target catalog and renderer integration tests |
| Discoverability | Settings selector shows deterministic thumbnails and a direct “use this type” action | `docs/assets/diagrams/manifest.json`, `diagramExamplePreview.test.ts` |
| Static gallery | 13 SVG/PNG pairs generated from production fixtures; stale assets fail the check | `scripts/generate-diagram-gallery.js`, `npm run diagram:gallery:check` |
| Drawnix | Filename-rooted native tree, `.drawnix` plus SVG companion and Markdown wrapper | Drawnix implementation record, export tests, and `npm run diagram:consumer:drawnix` |
| Circuitikz | Constrained native templates and CLI compiler path; six golden fixtures compile under TeX Live 2023 | `src/diagram/adapters/circuitikz`, `scripts/export-circuitikz.js`, smoke report |
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
16. Added the generic `TargetAdapterRegistry` plus preview and render-host adapter registries. Preview/export and bundled render-host dispatch no longer switch on target; unknown JSON payload targets fail closed at the registry boundary. Target-specific webview markup remains a separate presentation-layer contract.
17. Admitted `timeline`, `swimlane`, and `quadrant` through bounded payload schemas, deterministic Mermaid adapters, planner/intent routing, fixtures, gallery assets, and bilingual capability rows. Their compatible target set is intentionally Mermaid-only until an editable or external consumer contract exists.
18. Added the keyed webview presentation registry. Mermaid and Vega-Lite host shells, HTML document passthrough, and source-only fallbacks now resolve through one target contract; unknown targets fail closed and MIME mismatches fall back to source-only markup.
19. Added `npm run diagram:consumer:drawnix`. Without an input path it bundles the production Drawnix architecture fixture, validates the native envelope, and feeds the temporary `.drawnix` artifact to `scripts/test-drawnix-plait-consumer.mjs`, which uses the public `@plait/core`, `@plait/draw`, and `@plait/mind` APIs. The gate passed with one filename-rooted root, 20 recognized nodes, and 12 native relations; it is consumer-contract evidence, not a claim that a Drawnix desktop application is installed.
20. Moved the shared Drawnix polyline-length primitive into `drawnixGeometry.ts` and kept `DrawnixPoint` source-compatible through the projection re-export. Router label placement and candidate ordering now use one length definition, with a focused 30-unit multi-segment regression.
21. Split the JSON-compatible schema/value validator into `schemaRuntime.ts` and added `operationContractRegistry.ts`. The registry now fails closed during module admission on malformed required/property relationships, duplicate enum/required entries, duplicate operation or command IDs, missing input/result schemas, and malformed trigger surfaces. Unknown operation payload fields remain accepted; operation-level capability metadata and command-binding context remain separate by design.

## Comparison With `diagram-design`

| Axis | Reference project | Notemd current truth | Engineering decision |
|---|---|---|---|
| Semantic selection | Pattern pages map to visual layouts | `DiagramIntent` routes to a typed catalog | Preserve intent-first routing |
| Visual taxonomy | 27 layout grammars | 13 executable semantic types | Admit candidates only through evidence gates |
| Artifact/export | Self-contained HTML/SVG/PNG examples | 8 targets and independently declared export capabilities | Keep target and export orthogonal |
| Preview | Example HTML assets | Production renderer fixture thumbnails in settings and docs | Generate both from the same fixture |
| Governance | Type references and complexity budgets | Versioned capability/target manifests plus tests | Treat manifests and tests as the contract |
| Contract boundary | Human-readable command examples sit beside pattern docs | Pure schema runtime plus registry admission; host/core schemas stay explicit | Fail closed on malformed contracts without collapsing UI and CLI context |

The reference taxonomy still supplies architecture, current-state, radar, loop, nested, tree, org chart, layers, Venn, pyramid, bar, line, Gantt, scatter, medallion, process, data flow, and security/integration matrix candidates. Timeline, swimlane, and quadrant have now passed the bounded Mermaid-only admission gate; they are not evidence of editable HTML/SVG, Draw.io, or Drawnix support. Gallery variants such as OAuth sequence, animation, imports, and vertical orientation are workflows or variants, not new semantic types.

## Gap Against Earlier Plans

| Earlier requirement | Current evidence | Remaining boundary |
|---|---|---|
| One executable source for operation contracts | Registry schemas are validated by a registry-independent runtime and exported into CLI contracts | Maintainer host metadata is intentionally separate from host-neutral schemas; a generated pure-data catalog is still a future migration |
| Reference layouts must have real semantics, not aliases | Timeline, swimlane, and quadrant have bounded payloads, adapters, fixtures, previews, and tests | Radar still needs a real Vega-Lite adapter; the other reference layouts remain planned |
| External interoperability must be proven by a consumer | Plait public-API consumer and pinned Circuitikz compiler gates pass | Draw.io and a real Drawnix application are unavailable, so application-level compatibility is not claimed |
| Documentation must expose support and previews | Manifest-driven bilingual gallery contains 13 production SVG/PNG pairs | New types must keep the gallery freshness gate and bilingual row in the same change |

## Risk Register And Tradeoffs

- **Mermaid legacy chain:** `mermaidProcessor.ts` remains a large flowchart-biased repair surface, but the order is now explicit as 35 stable stages with a family gate and idempotency coverage. The known Mermaid 11 family registry now fails closed for non-flowchart declarations; only genuinely unknown headers retain the compatibility escape hatch. This is controlled debt, not a reason to route more diagram families through the chain.
- **Mermaid global state:** plugin-side validation initialization is now module-scoped per `initialize` function identity. Preview webviews intentionally retain theme-specific initialization because they own separate runtimes; collapsing those lifecycles would create theme regressions.
- **Target adapter boundary:** preview/export and render-host dispatch resolve through keyed target adapters, and webview markup now resolves through `presentationRegistry.ts` with duplicate target behavior avoided by construction. Adding a new target still requires an explicit presentation mode or deliberate source-only fallback.
- **External interoperability:** Draw.io, Drawnix, and Circuitikz consumer evidence must be real-consumer evidence, not mocks or serializer snapshots. Missing tools remain explicit blockers.
- **Forward compatibility:** Unknown contract fields are accepted intentionally. Required fields and known field types are strict at the boundary; loosening them would make downstream failures harder to localize.
- **Contract runtime boundary:** Schema validation is now pure and reusable, while operation declarations remain in the TypeScript registry for local context. Do not force command binding context to equal operation capability metadata; they describe different invocation surfaces.
- **Cache:** The response cache remains an optimization. It must never become an authority for artifact identity or correctness.

## External Consumer Gate Status

| Consumer | Current evidence | Status |
|---|---|---|
| Draw.io | No diagrams.net/Draw.io executable is available in this workspace | Not claimed; add a manual or CI gate before promotion |
| Drawnix | `npm run diagram:consumer:drawnix` builds the production architecture fixture and consumes it through the public `@plait/*` APIs; no independent Drawnix application is available here | Plait consumer contract passed; real application interoperability not claimed |
| Circuitikz | `pdflatex` compiled all 6 golden fixtures; each produced a non-empty PDF with 0 errors and 0 warnings | Passed local consumer gate; keep tool/version in CI evidence |

## Forward Plan

1. **Mermaid Phase 2: completed.** The legacy chain is a 35-stage ordered registry with stable IDs, known-family fail-closed gating, and idempotency coverage. The family registry covers current Mermaid 11 declarations while preserving `unknown` for forward-compatible syntax; parser-backed admission remains required before treating an unknown family as flowchart-safe.
2. **Mermaid Phase 3: completed.** Shared scanning, canonical fence formatting, and plugin validation-runtime initialization are converged. Keep preview webview theme initialization as a separate runtime contract.
3. **Target adapter dispatch: completed.** Preview/export, render-host, and webview presentation now use keyed target contracts; keep the source-only fallback explicit for targets without an embedded runtime.
4. **Consumer evidence:** run real Draw.io/Drawnix/Circuitikz gates where tooling exists; record unavailable tools rather than claiming interoperability.
5. **Drawnix convergence:** the production source-coverage and relation-router names are canonical; the old source-coverage export and router module are compatibility-only. Shared rectangle/polyline and text measurement/wrapping primitives are centralized, and the standalone Plait consumer gate proves the production fixture crosses the public consumer boundary. Real Drawnix desktop/app import remains a separate external gate.
6. **Circuitikz convergence:** the six golden renderers share the standalone-document and component-label helpers while preserving deterministic output. Keep `runCircuitikzRepairLoop()` as a maintainer-only acceptance SDK boundary; normal generation remains deterministic and does not invoke an LLM repair loop. Wire a real CLI/desktop caller only as a separately authorized repair command with fresh compile/render evidence.
7. **Reference admission:** timeline, swimlane, and quadrant are shipped as Mermaid-only types with deterministic fixtures and parser-backed gallery evidence. Radar remains blocked until a real Vega-Lite adapter exists; all other reference layouts remain gated.
8. **Operation contract convergence:** keep the registry-independent schema runtime and registry admission as the fail-closed boundary. Only migrate declarations into generated JSON when the generator can preserve host/core contract separation, human examples, and stable unknown-field behavior.

## Acceptance Gates

- `npm run diagram:gallery:check`
- `npm run docs:build`
- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:render-host`
- `npm run diagram:consumer:drawnix`
- `src/tests/renderTargetAdapterRegistry.test.ts`
- `src/tests/contractSchemas.test.ts`
- `npm run lint` (currently repository-baseline blocked; do not relabel this as a feature failure)
- `git diff --check`
- External consumer records must identify tool/version/input/output and must not be replaced by unit mocks. The Plait gate is a checked-in public-API consumer contract; real Drawnix application import remains a separate manual/CI record.

## Verification Snapshot

Fresh verification for this increment: 261 Jest suites passed (2,284 tests passed, 1 skipped); TypeScript/esbuild build passed; VitePress docs build passed; production gallery check passed with 13 SVG/PNG pairs; render-host audit and i18n audit passed; the standalone Drawnix Plait consumer gate passed with 20 nodes, 1 root, and 12 relations; semantic verification helper passed; and Circuitikz smoke passed with TeX Live 2023 `pdflatex` (6/6 PDFs, 0 errors/0 warnings). `git diff --check` passed. Draw.io and a real Drawnix desktop application are unavailable in this workspace, so no application-level interoperability claim is made. Full repository lint remains a separate baseline debt track.
