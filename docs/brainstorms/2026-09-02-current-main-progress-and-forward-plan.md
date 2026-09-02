---
date: 2026-09-02
last_updated: 2026-09-02
topic: current-main-progress-and-forward-plan
status: current
canonical_for:
  - current-main-progress
  - plan-status-convergence
supersedes: ./2026-08-16-mainline-diagram-architecture-progress-and-next-direction.md
superseded_by: null
---

# Current Main Progress And Forward Plan

This is the current-main execution record. It separates shipped implementation, active convergence work, deferred external evidence, and historical plans. Runtime registries, manifests, and checked-in verification output are the sources of truth; checkbox counts in older plans are not completion evidence.

## Executive Judgment

`main` is releaseable and internally well covered. The project is no longer blocked by missing diagram primitives. The dominant risk is truth drift: documentation can claim more than the current build, a compatibility alias can outlive its migration window, and a passing serializer or public API consumer can be mistaken for application interoperability.

The next engineering move is controlled convergence, not another renderer expansion. Keep the current single-entry `main.js` plus inline `srcdoc` packaging contract until a measured need justifies a new asset boundary. Promote a target only when its runtime, persistence, preview, documentation, and consumer evidence move together.

## Current Source Counts

| Surface | Current count | Source of truth |
|---|---:|---|
| Executable diagram catalog rows | 33 | `src/diagram/diagramTypeCatalog.ts` |
| Semantic diagram intents | 30 | `src/diagram/types.ts` |
| Render targets | 8 | `src/rendering/renderTargetCatalog.ts` |
| Image export formats | 3 (`SVG`, `PNG`, `PDF`) | `src/rendering/renderTargetCatalog.ts` |
| Provider definitions | 36 | `src/llmProviders.ts` |
| Plugin UI locales | 21 | `src/i18n/uiLocales.ts` |
| Published website locales | 34 | `website/src/lib/publishedLocales.mjs` |
| Registered operation contracts | 29 | `src/operations/registry.ts` |
| Real-Vault example entries | 33, all `passed` | `docs/diagram-examples/manifest.json` |
| Reference-only diagram grammars | 5 | `src/diagram/diagramCapabilityManifest.ts` |

The 33 catalog rows are not 33 independent rendering engines. Several rows share bounded payload-family adapters, and the three explicit quantitative variants intentionally share the Vega-Lite target. This distinction must remain visible in docs and release notes.

## Verification Snapshot

Verified on 2026-09-02 against the current `main` implementation; clean-worktree status is a final publication gate:

- `npm.cmd run build`: passed.
- `npm.cmd test -- --runInBand`: 275 suites passed; 2511 tests passed; 1 skipped.
- `npm.cmd run docs:build`: passed.
- `npm.cmd --prefix website run build`: passed for all 34 published locales.
- `npm.cmd --prefix website run audit:build`: passed.
- `npm.cmd run diagram:examples:check`: 33 entries passed.
- `npm.cmd run diagram:gallery:check`: 33 fixture assets passed.
- `npm.cmd run audit:i18n-ui`: passed.
- `npm.cmd run audit:render-host`: passed.
- `npm.cmd run verify:local-kb-fixtures`: 9 tests passed.
- `npm.cmd run diagram:consumer:drawnix`: Plait public-API consumer passed with 20 nodes, 12 relations, and one root.
- `npm.cmd run lint`: failed on repository baseline debt (`231` errors, `1374` warnings); this is not a release-blocking feature regression until a changed-lines ratchet is introduced.

The remote `1.9.7` Release is published with `main.js`, `manifest.json`, `README.md`, and `styles.css`. Its body is independently readable in English and Simplified Chinese, with only `Highlights` / `Fixes And Robustness` and `重点更新` / `修复与鲁棒性` sections.

## Plan Status Matrix

| Plan family | Status on current main | Actual remaining work |
|---|---|---|
| Provider expansion rounds | Shipped / historical | Keep provider metadata, discovery, docs, and tests synchronized as upstream APIs change. |
| Language support multiphase | Shipped / historical | No implementation phase remains; preserve offline Codex-authored release translation policy. |
| Mainline stabilization and CI hardening | Shipped / historical | Keep the clean-worktree and release-helper gates; do not reopen completed wrapper work. |
| CLI operation extraction and registry hardening | Shipped at current contract depth | Packaging-aware contract promotion remains a separate decision; current operation bindings are not automatically public APIs. |
| Diagram rendering roadmap | Active with deferred boundaries | Heavy-runtime packaging isolation and full Mermaid legacy decomposition remain open; PlantUML/Graphviz/Draw.io remain deferred. |
| Vault history, settings navigation, batch folder | Shipped | Regression maintenance only. Folder-batch mutation and richer history retention require a new contract. |
| Diagram preview/history adaptation | Shipped modal architecture | A focus-trapped internal drawer would be a new interaction-system change, not an unfinished bug fix. |
| Mermaid normalization consolidation | Phases 0-3 shipped | Inventory consumers before removing compatibility exports; parser-backed admission for unknown families remains conservative. |
| Diagram capability catalog and forward architecture | Runtime foundation shipped; external gates active | Draw.io and real Drawnix application evidence are unavailable; the Plait gate is not an application claim. |
| Reference expansion | Completed | 33 executable rows, bounded payloads, deterministic adapters, preview/gallery/docs gates all pass. |
| Real-Vault diagram examples | Completed | Regenerate only when provider or renderer evidence changes; keep failures explicit rather than replacing them with fixtures. |
| Local KB retrieval and chapter split | Shipped bounded design | Current implementation is lexical MiniSearch plus managed artifacts; semantic/vector retrieval is a new architecture lane. |
| Slidev editable PPTX | Active quality track | Office font substitution, table baseline, paragraph spacing, and native geometry fidelity remain measurable gaps. |
| GEO/GitHub Pages/release | Operationally shipped | Search Console and AI-visibility observations remain external post-deploy evidence. |

Older plan documents retain their checklists and rationale for traceability. Their status headers and progress sections must be read together with this matrix; an unchecked historical TDD step does not mean the corresponding production behavior is absent.

## Evidence And Non-Claims

| Boundary | Evidence | Claim permitted |
|---|---|---|
| Mermaid | Canonical normalizer, 35-stage legacy registry, family gate, idempotency tests, runtime SVG safety | Shipped Mermaid path with conservative legacy compatibility |
| Native editable SVG | Deterministic renderers, layout diagnostics, Chromium gallery gate, 33 fixture assets | Shipped native family previews under the tested host/presentation contract |
| Drawnix | `.drawnix` serializer plus `@plait/*` public API consumer gate | Plait public-API compatibility; real Drawnix application import remains unclaimed |
| Draw.io | Exporter and XML tests only; no diagrams.net executable in this workspace | Serializer contract only; no application interoperability claim |
| Circuitikz | Six golden templates and local native compiler evidence | Constrained native compile path; CI tool/version evidence still required |
| Render host | `main.js` inline `srcdoc`, render-host audit, fail-closed runtime module resolver | Self-contained current packaging; not independent heavy-runtime isolation |
| Local KB | MiniSearch, heading-aware chunks, offline fixtures, inspect diagnostics | Plugin-native lexical retrieval; not vector/RAG service semantics |
| Slidev/PPTX | Native standalone export and rendered layout audits | Bounded editability with explicit image fallback; not pixel-identical Office round-trip fidelity |

## Compatibility Inventory And Ponytail Audit

The repo-wide over-engineering audit found no production dependency that can be removed safely in this convergence slice. The bounded candidates are:

| Candidate | Current consumers/evidence | Decision |
|---|---|---|
| `src/rendering/preview/mermaidDefinitionShared.ts` | Compatibility re-export; no current production import; older source consumers are not provably absent | Keep until an external migration window is recorded |
| `src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts` | Deprecated re-export consumed by focused routing tests | Keep; tests are the current compatibility evidence |
| `routeDrawnixCrossRootRelation()` | No production caller; canonical router and compatibility tests still reference it | Keep as explicit compatibility-only API; do not advertise as the production route |
| `mergeDrawnixSourceCoverage()` | Maintainer documentation and tests still reference the alias | Keep until downstream callers migrate to `enrichDrawnixSourceCoverage()` |
| `rewriteLegacyTrailingDoubleDashArrow` | Alias appears unreferenced inside the repository; external scripts cannot be ruled out | Do not delete without an external-consumer check |
| `runCircuitikzRepairLoop()` | Focused tests and maintainer acceptance docs consume the SDK | Keep maintainer-only; never wire it as normal-generation fallback |
| `stripWrappingDoubleQuotes()` / `stripWrappedQuotedLabel()` | Byte-identical private implementations in `legacyFixerUtils.ts` | Small future shrink candidate; defer to a behavior-preserving focused change |

The audit therefore recommends a migration ledger and changed-lines lint ratchet, not a speculative deletion pass. This is the smallest change that reduces future debt without invalidating old artifacts or hidden consumers.

## Ordered Forward Plan

### Phase A: Truth control plane

1. Keep this document and its Chinese counterpart as the current-main entry.
2. Derive numeric claims from runtime manifests in tests; do not hand-maintain a second catalog.
3. Keep every plan in one of `current`, `active`, `shipped`, `deferred`, `historical`, or `superseded` and record the evidence path.
4. Treat release body, checked-in release notes, tag tree, and release assets as separate but cross-checked artifacts.

Exit gate: docs contract tests, both docs builds, full Jest, clean Git state.

### Phase B: Packaging decision, only if measurements justify it

1. Measure `main.js` size, startup cost, preview load time, and mobile pressure across representative targets.
2. If the current inline host remains within budget, keep it; reducing source-file size alone is not a justification for a second asset.
3. If isolation is justified, land build output, runtime loader, audit rules, release assets, workflow, maintainer docs, and real Obsidian evidence in one atomic batch.

Exit gate: no claim of heavy-runtime isolation until the release artifact and runtime-consumption chain prove it.

### Phase C: Compatibility sunset

1. Inventory production, tests, maintainer scripts, and external consumers for `mermaidDefinitionShared.ts`, `drawnixCrossRootRouter.ts`, `mergeDrawnixSourceCoverage()`, `routeDrawnixCrossRootRelation()`, and legacy Mermaid aliases.
2. Add a deprecation window and migration diagnostics before deleting any export.
3. Keep `runCircuitikzRepairLoop()` maintainer-only; an LLM repair loop must never become an implicit normal-generation fallback.

Exit gate: consumer inventory, migration coverage, focused regression tests, and a documented removal version.

### Phase D: Consumer evidence

1. Add a real diagrams.net open/import gate when a stable executable or CI container is available.
2. Add real Drawnix application open/import evidence; keep the Plait public-API gate as a lower-level contract.
3. Pin Circuitikz compiler/tool versions in CI and archive logs with input/output hashes.

Exit gate: distinguish serializer, public-API, and application-level statuses in the capability catalog.

### Phase E: Quality depth without runtime sprawl

1. Local KB: build an offline query corpus and measure recall, context inflation, latency, stale-index behavior, and low-signal navigation notes before considering embeddings.
2. Slidev: prioritize Office table/font/baseline fidelity over broadening native object extraction.
3. Lint: introduce baseline-plus-changed-lines ratcheting; do not apply a repository-wide autofix sweep during feature work.

Exit gate: each quality change has before/after measurements and no regression in the existing release gates.

### Phase F: New engines only after convergence

PlantUML, Graphviz, Draw.io runtime integration, vector Mermaid reconstruction, and semantic/vector retrieval remain deferred. Demand evidence and the Phase B-D gates must precede implementation.

## Risk Controls

- Unknown fields remain accepted for forward compatibility, but required fields and known types fail closed at boundaries.
- Cache state is an optimization, never artifact identity or correctness authority.
- Provider discovery remains bounded and generation-oriented; do not surface embedding/reranker/speech rows as generation models.
- Real-Vault `passed` means one provider/environment run; it does not prove all providers, themes, or mobile hosts.
- A green website build proves route/build integrity, not post-deploy Search Console or AI-answer visibility.

## Decision

The next release-sized work should be a truth/packaging/consumer convergence batch, not another catalog expansion. Any proposal that cannot name its owner, invariant, evidence artifact, and rollback/deferral condition is not ready for implementation.
