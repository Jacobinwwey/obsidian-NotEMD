---
date: 2026-08-16
last_updated: 2026-08-23
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
| Semantic domain | 33 executable semantic diagram types (15 original rows, 3 explicit quantitative variants, and 15 reference-derived native/quantitative rows) | `src/diagram/diagramTypeCatalog.ts`, `src/diagram/examples/diagramExampleCatalog.ts` |
| Render targets | 8 registered targets; target identity is separate from export format | `src/rendering/rendererRegistry.ts`, `src/rendering/renderTargetCatalog.ts` |
| Export formats | SVG/PNG/PDF where the target supports them; editable HTML/SVG carries `previewSvg` | target catalog and renderer integration tests |
| Discoverability | Settings and workbench selectors expose executable types; selection opens one production-renderer preview panel; reference-only taxonomy stays outside UI | `src/ui/diagramTypePreviewPanel.ts`, `diagramCapabilityManifest.test.ts`, `diagramExamplePreview.test.ts` |
| Static gallery | 33 SVG/PNG pairs generated from production fixtures; stale assets fail the check | `scripts/generate-diagram-gallery.js`, `npm run diagram:gallery:check` |
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

22. Admitted `radar-chart` as the first non-Mermaid Phase 5 candidate after a real Vega-Lite browser render. `radarSpec` enforces bounded axes and complete per-series axis coverage; the adapter computes deterministic polar coordinates and emits grid, axis, closed profile-line, point, and label layers. The same production fixture now feeds settings, docs SVG/PNG, and the explicit HTML table fallback. `dataChart` `chartType: radar` remains rejected.

23. Replaced the flattened reference gallery with a shared selection-driven `diagramTypePreviewPanel.ts`. Settings and the generation workbench expose executable types only; after a user selects one, the panel calls `renderDiagramExampleThumbnail()` and renders the production SVG. The `ref/diagram-design` checkout remains development-only taxonomy/quality evidence; no original screenshot, data URL, selector row, or reference-preview API enters the plugin runtime.

24. Completed the release verification slice for the selection-driven preview. `npm.cmd run build`, targeted Jest (57 tests), full Jest (263 suites, 2307 passed, 1 skipped), `npm.cmd run docs:build`, `npm.cmd run diagram:gallery:check`, and `npm.cmd run audit:i18n-ui` all pass. The existing `1Knowledge` Obsidian process was reloaded through the CLI/eval plugin lifecycle after deployment; runtime evidence showed one preview panel, zero legacy gallery nodes, zero reference images, 16 selector options, a ready production SVG, a 44px selector target, and a 16:9 canvas. Frontend-law-auditor strict gate scored 91.32/100 with no failures; p95 timing and mobile screenshot evidence remain explicit data gaps.

25. Closed the Settings selector synchronization gap found during release review. Intent changes now update the visible render-target dropdown locally, preserving progressive disclosure without re-rendering the whole settings page; the behavior is covered by `providerSettingsBehavior.test.ts`. The final full Jest run remains 263 suites, 2307 passed, 1 skipped.

## Comparison With `diagram-design`

| Axis | Reference project | Notemd current truth | Engineering decision |
|---|---|---|---|
| Semantic selection | Pattern pages map to visual layouts | `DiagramIntent` routes to a typed catalog | Preserve intent-first routing |
| Visual taxonomy | 27 layout grammars | 33 executable semantic types; 5 exact reference grammars remain roadmap-only | Admit candidates only through evidence gates |
| Artifact/export | Self-contained HTML/SVG/PNG examples | 8 targets and independently declared export capabilities | Keep target and export orthogonal |
| Preview | Example HTML assets | Selection-driven production fixture preview panel; reference taxonomy remains outside settings/workbench | Keep production and reference evidence visibly distinct |
| Governance | Type references and complexity budgets | Versioned capability/target manifests plus tests | Treat manifests and tests as the contract |
| Contract boundary | Human-readable command examples sit beside pattern docs | Pure schema runtime plus registry admission; host/core schemas stay explicit | Fail closed on malformed contracts without collapsing UI and CLI context |

The reference taxonomy supplied architecture, current-state, loop, nested, tree, org chart, layers, Venn, pyramid, bar, line, Gantt, scatter, medallion, process, data flow, and security/integration matrix candidates. Those approved candidates now have shipped payloads, fixtures, and production previews. Five exact grammars remain reference-only; Mermaid-only timeline, swimlane, and quadrant are intentionally not evidence of editable HTML/SVG, Draw.io, or Drawnix support. Gallery variants such as OAuth sequence, animation, imports, and vertical orientation are workflows or variants, not new semantic types.

## Gap Against Earlier Plans

| Earlier requirement | Current evidence | Remaining boundary |
|---|---|---|
| One executable source for operation contracts | Registry schemas are validated by a registry-independent runtime and exported into CLI contracts | Maintainer host metadata is intentionally separate from host-neutral schemas; a generated pure-data catalog is still a future migration |
| Reference layouts must have real semantics, not aliases | All 18 approved expansion rows have bounded payloads, adapters, fixtures, previews, and tests | Five exact reference grammars remain gated until their distinct layout contract and evidence exist |
| External interoperability must be proven by a consumer | Plait public-API consumer and pinned Circuitikz compiler gates pass | Draw.io and a real Drawnix application are unavailable, so application-level compatibility is not claimed |
| Documentation must expose support and previews | Bilingual docs expose 33 production SVG/PNG pairs; the runtime manifest exposes executable capabilities and five reference-only roadmap rows, while the UI renders only the selected production preview | New types and reference-asset changes must keep asset availability, UI status, docs parity, and gallery freshness gates in the same change |

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
5. **Drawnix convergence:** the production source-coverage and relation-router names are canonical; the old source-coverage export and router module are compatibility-only. Shared rectangle/polyline, text measurement/wrapping, and relation-label measurement primitives are centralized, and the standalone Plait consumer gate proves the production fixture crosses the public consumer boundary. Real Drawnix desktop/app import remains a separate external gate.
6. **Circuitikz convergence:** the six golden renderers share the standalone-document and component-label helpers, and common/dual/buffer port coordinates are explicit layout helpers while preserving deterministic output. Keep `runCircuitikzRepairLoop()` as a maintainer-only acceptance SDK boundary; normal generation remains deterministic and does not invoke an LLM repair loop. Wire a real CLI/desktop caller only as a separately authorized repair command with fresh compile/render evidence.

### Convergence follow-through (2026-08-18)

- `drawnixRelationLabelLayout.ts` is now the canonical relation-label measurement boundary. Projection and lane reservation both consume the same deterministic wrapping, width, height, and line-height contract; the SVG/native geometry remains byte-stable and has focused regression coverage.
- Circuitikz no longer carries a byte-identical `dualInputPortX()` helper. NAND/NOR inputs use the shared extended-port rule, while the buffer's intentionally wider right gutter is named `bufferPortX()` and drives both input and output placement. This removes hidden coordinate coupling without pretending the six golden templates share one topology.
- `runCircuitikzRepairLoop()` is explicitly retained as a maintainer-only, one-attempt acceptance SDK. No normal generation path invokes it; adoption still requires topology equality plus fresh compile/render evidence and an explicit caller.
7. **Reference admission:** all 18 new expansion rows are now shipped behind bounded payloads and deterministic adapters: three quantitative variants and fifteen native editable HTML/SVG layouts. The previously shipped Mermaid-only families (`timeline`, `swimlane`, `quadrant`) and bounded Vega-Lite `radar` remain unchanged. Five exact reference grammars remain reference-only because their layout contract is not yet claimed.
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

Final post-change verification: 265 Jest suites passed (2,339 tests passed, 1 skipped); TypeScript/esbuild build passed; VitePress docs build passed; gallery generation/check passed with 33 SVG/PNG pairs; render-host audit, i18n audit, Drawnix public-API consumer gate, and `git diff --check` passed. Full repository lint remains a separate baseline debt track (229 errors / 1,361 warnings, including one pre-existing class of unused/legacy code findings). Draw.io and a real Drawnix desktop application are unavailable in this workspace, so no application-level interoperability claim is made.

## Reference Expansion Decision Record (2026-08-21)

The next expansion was reviewed and approved as a staged route: engineering/data-platform layouts first, quantitative layouts second, and structural expression layouts third. This is a design decision and roadmap entry; it is not evidence that the reference-only layouts are already shipped.

### Current code truth versus the approved design

| Boundary | Current code | Approved forward change |
|---|---|---|
| Catalog identity | One intent maps to one catalog row | Stable catalog IDs may share an intent through an explicit variant; ambiguous legacy lookup fails closed |
| Spec shape | Wide `DiagramSpec` with optional specialized fields | Versioned canonical `payload` union with a legacy read projection |
| Prompt routing | Type-specific conditionals in `diagramSpecPrompt.ts` | Versioned pure-data prompt profiles selected by catalog metadata |
| Geometry | Existing Mermaid/Vega/Drawnix/Circuitikz adapters | Finite native SVG payload-family adapters; model never emits coordinates |
| Chart variants | `layoutHints.chartType` plus one `data-chart` row | `quantitative.chartType` with explicit bar/line/scatter IDs; old data-chart remains readable |
| Preview | Production fixture preview for 33 shipped types | New types enter selector only after the same renderer, fixture, gallery, and accessibility gates |
| Reference checkout | Development-only taxonomy and quality evidence | Remains outside runtime; screenshots and original HTML are never product assets |

### Approved batch order

1. Batch 0: variant-aware catalog, canonical schema boundary, prompt profiles, presentation defaults, and renderer admission; no new selector rows.
2. Batch 1A: `architecture`, `current-state`, `integration-topology`.
3. Batch 1B: `data-flow`, `access-matrix`.
4. Batch 2: `bar-chart`, `line-chart`, `scatter-plot`, `gantt`.
5. Batch 3A: `layer-stack`, `venn`, `ranked-funnel`, `loop`.
6. Batch 3B: `nested`, `tree`, `process`, `medallion`, `high-level`.

Every batch must update this file and its Chinese counterpart before the next batch starts. The detailed bilingual design and implementation documents are:

- `docs/superpowers/specs/2026-08-21-diagram-reference-expansion-design.en.md`
- `docs/superpowers/specs/2026-08-21-diagram-reference-expansion-design.zh-CN.md`
- `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md`
- `docs/superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.zh-CN.md`

### Non-claims and gates

The roadmap does not add Mermaid compatibility merely because a layout can be approximated as a flowchart. Matrix, Venn, Gantt, and topology types require native deterministic renderers; Draw.io, Drawnix, and Circuitikz compatibility remains unavailable until a real consumer gate exists. A selector row is admitted only when its payload, prompt profile, validator, renderer, production fixture, preview SVG, gallery SVG/PNG, bilingual docs row, and regression tests pass together.

### Worktree state

At the start of this decision record, `main` matched `origin/main` and `git status --porcelain=v1 -b` reported only `## main...origin/main`. Future batch commits must preserve `.trellis/`, never reset unrelated work, and finish with the same clean status after build, full Jest, docs, gallery, i18n, render-host, and `git diff --check` gates.

## Batch 0 Progress (2026-08-21)

Batch 0 is now implemented as a compatibility foundation; it does not add selector rows or claim new reference layouts as shipped.

- Catalog definitions now carry `payloadKind` and `layoutProfileId`, and lookup supports explicit variants while the legacy default lookup remains available.
- `DiagramSpec` accepts `schemaVersion`, canonical `payload`, `presentation`, and namespaced `extensions` without removing the legacy fields consumed by existing renderers.
- The generation merge boundary normalizes legacy v1 specs to schema v2 metadata with a `legacy` or `quantitative` payload. Unknown schema versions fail closed.
- A profile catalog now owns prompt profile IDs, versions, payload family, hard limits, semantic rules, target rules, and invalid-output rules. Existing circuitikz and Drawnix specialized prompt contracts remain intact.
- Capability manifest rows expose the new payload/layout ownership metadata; the manifest schema remains additive and reference-only rows remain outside the selector.

Evidence for this increment: focused catalog/payload/parser/prompt tests passed (30 tests), `npm.cmd run build` passed, and the pre-existing 15-type production gallery and renderer contracts remained unchanged at the Batch 0 boundary. Batches 1A through 3B subsequently passed their native fixture and preview/gallery gates; the complete delivery record is below.

## Full Reference Expansion Delivery (2026-08-21)

The staged implementation is now complete in the runtime and production evidence chain. The catalog contains 33 executable IDs: the original 15, three explicit quantitative variants, and 15 reference-derived layout capabilities. Five exact reference grammars remain roadmap-only (`flowchart`, `sequence`, `state-machine`, `er-data-model`, and `pyramid-funnel`) because their reference layout contracts are not identical to an already shipped semantic type.

### Delivered payload families

| Family | Shipped IDs | Target | Evidence |
|---|---|---|---|
| `topology` | `architecture`, `current-state`, `integration-topology`, `high-level` | editable HTML/SVG + HTML | deterministic zones, bounded nodes, orthogonal routes, production fixtures |
| `lane-grid` | `data-flow`, `process` | editable HTML/SVG + HTML | bounded lanes/steps, explicit cells, empty-cell omission, focal handoff |
| `access-matrix` | `access-matrix` | editable HTML/SVG + HTML | closed permission levels, bounded role/component grid, focal-cell validation |
| `quantitative` | `bar-chart`, `line-chart`, `scatter-plot` | Vega-Lite + HTML | canonical chart payload, legacy projection, browser gallery rendering |
| `schedule` | `gantt` | editable HTML/SVG + HTML | deterministic task timeline and milestone marker; v1 has no dependency arrows |
| `ordered-stack` | `layer-stack`, `medallion` | editable HTML/SVG + HTML | bounded four-to-six layer stack and focal layer |
| `set-overlap` | `venn` | editable HTML/SVG + HTML | two-to-three sets and explicit intersection membership |
| `ranked-segments` | `ranked-funnel` | editable HTML/SVG + HTML | bounded pyramid/funnel segments and focal segment |
| `cycle` | `loop` | editable HTML/SVG + HTML | five-to-eight stations, one hub, circular return path |
| `nested` / `tree` | `nested`, `tree` | editable HTML/SVG + HTML | bounded containment levels and one-root hierarchy |

### Runtime and compatibility changes

- `diagramSpecResponseParser` preserves canonical payloads and presentation dials; `normalizeDiagramSpecPayload` projects quantitative payloads back to the legacy `dataSeries/layoutHints` fields so existing Vega-Lite callers remain valid.
- `validateCanonicalDiagramPayload` enforces family budgets and cross-reference invariants at the boundary. Renderers do not guess missing nodes, dates, permissions, or geometry.
- The prompt profile registry now covers all 33 catalog rows. New profiles request semantic payloads only; they prohibit model-generated coordinates, SVG, CSS, and fabricated numbers.
- `EditableHtmlSvgRenderer` owns one deterministic family adapter for topology, lane-grid, matrix, schedule, stack, overlap, ranked, cycle, nested, and tree layouts. Production preview and gallery use the same artifact path.
- Intent inference recognizes explicit reference-layout vocabulary, while explicit native-only requests override the global legacy-Mermaid preference instead of being misrouted to a mindmap.
- The capability manifest now has 33 shipped rows and only five reference-only rows. No Draw.io, Drawnix, or Circuitikz compatibility is implied for the new types.

### Evidence snapshot

`npm.cmd run diagram:gallery` generated 33 SVG/PNG pairs; gallery screenshots were visually inspected for topology, lane-grid, matrix, schedule, cycle, nested, tree, and ranked layouts. Focused native-layout tests cover deterministic SVG, accessibility metadata, malformed payload rejection, invalid references, schedule ordering, and budget rejection. The final full regression, docs, gallery, i18n, consumer, render-host, and diff-check gates all passed before commit.

## Variant Discoverability Follow-up (2026-08-22)

The completion audit found a compatibility gap in the first delivery: the catalog contained 33 IDs, but Settings and Workbench deduplicated rows by semantic intent, so `bar-chart`, `line-chart`, and `scatter-plot` could not be selected independently. This is now closed.

- All 33 catalog IDs are exposed through the shared selector and production preview panel.
- `preferredDiagramTypeId` is the stable persisted selector identity; old `preferredDiagramIntent` values remain readable and resolve to their default catalog row.
- Explicit quantitative variants carry `requestedVariant` through operation input, planner, prompt profile, generation, and Vega-Lite rendering. They force `best-fit`/Vega-Lite instead of silently falling through the legacy Mermaid path.
- Maintainer `diagram.generate` accepts `requestedTypeId`; operation registry and generated help metadata include the new field.
- Incompatible persisted target/type combinations are cleared to Auto at the settings boundary; stale catalog IDs fall back to the legacy semantic preference.

Final evidence after this follow-up: 266 Jest suites passed (2,349 tests passed, 1 skipped); build passed; gallery check passed with 33 entries; VitePress docs, render-host audit, i18n audit, Drawnix public-API consumer gate, and `git diff --check` passed. Repository lint remains baseline debt and is not reclassified as a feature failure.

## Layout Safety Closure (2026-08-23)

The visual audit found that a valid canonical payload was not sufficient evidence of a readable figure. Reference SVGs still used character-count wrapping, fixed node heights, midpoint edge labels, and fixed canvas sizes; these allowed labels to overlap, become occluded by nodes, or lose their referent in dense diagrams. This increment closes that architecture gap.

- Added `src/diagram/layout/layoutSafety.ts` as the shared deterministic geometry contract. It measures wide glyphs conservatively, splits no-space identifiers, bounds line count, detects padded rectangle overlap, and exposes a versioned `LAYOUT_SAFETY_VERSION`.
- Added `src/diagram/layout/layoutDiagnostics.ts`. Core labels that would require truncation are errors; optional subtitles/details are warnings. The generation path therefore fails closed before persisting an unreadable artifact instead of silently clipping text.
- Updated the editable semantic SVG model and all native reference families to consume measured text geometry. Node/row heights expand from actual line count; topology edge labels search deterministic clearance candidates; matrix headers/rows, lane cells, schedule bars, stacks, overlap, cycle, nested, and tree labels have explicit vertical budgets.
- `RenderArtifact` now carries additive `layoutSafetyVersion` metadata. `RendererService` attaches layout diagnostics and rejects core overflow while preserving legacy artifacts without the field.
- Prompt profiles now expose numeric density budgets (`maxLabelWidth`, line limits, family caps) without exposing renderer coordinates. This aligns the LLM contract with the renderer contract and keeps optional detail elision explicit.
- Preview iframes now have a title, load error handling, and an eight-second readiness timeout with localized feedback. A blank iframe is no longer treated as a successful preview.
- `scripts/lib/diagram-gallery-runtime.js` now runs a browser `getBBox()` gate for native SVG: text must stay inside the viewBox, node text must stay inside its node, nodes may not overlap, edge labels may not intersect nodes, and core truncation is rejected. Vega/Mermaid remain covered by their own runtime validators because they do not carry the native geometry marker.

Evidence for this closure: production gallery regeneration and `diagram:gallery:check` pass for all 33 executable fixtures; native layout and preview focused tests pass; six representative PNGs were visually inspected after the gate caught and fixed access-matrix header collision and topology edge-label clearance regressions. This is renderer/headless evidence, not a claim of manual acceptance for every Obsidian host theme.
