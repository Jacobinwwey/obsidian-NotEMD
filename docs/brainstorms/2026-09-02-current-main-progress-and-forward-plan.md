---
date: 2026-09-02
last_updated: 2026-09-12
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

Language: **English** | [简体中文](./2026-09-02-current-main-progress-and-forward-plan.zh-CN.md)

The [plan register](../maintainer/project-plan-status.md) reconciles all 19 pre-existing formal plans, 32 brainstorm records, and the related maintainer tracks. The [reliability and evidence plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md) owns the proposed next implementation units. This file remains the current-progress entry; the September 2 convergence implementation remains a completed historical slice.

## Executive Judgment

The audited baseline is `main@7638cec`, version `1.9.7`. Build and existing tests pass, but the September 2 judgment that internal coverage was sufficient was too strong. Four deterministic local probes reproduce cancellation and persistence defects: a cancelled queue can remain unsettled, active parallel tasks can write after cancellation, an internally created abort signal does not reach transport, and a failed save can overwrite a concurrent successful save during rollback. These defects are open; this audit changes documentation only.

The next patch should fix operation cancellation and artifact-write ownership, with PR verification protecting the changes. Keep the single-entry `main.js` plus inline `srcdoc` contract while measuring its actual cost. Packaging isolation is conditional optimization, not a prerequisite for correctness fixes, retrieval evaluation, or bounded CLI contracts. Additional renderers have lower priority than trustworthy existing operations.

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

Reverified on 2026-09-12 on Windows x64, Node `22.19.0`, against production source at `7638cec`. Repository commands ran through `rtk proxy npm.cmd`; the dedicated `rtk npm` runner could not resolve npm on this machine.

- `npm.cmd run build`: passed.
- `npm.cmd test -- --runInBand`: 275 suites passed; 2515 tests passed; 1 skipped.
- VitePress documentation build (`1.6.4`, offline): passed.
- `npm.cmd --prefix website run build`: passed for all 34 published locales.
- `npm.cmd --prefix website run audit:build`: passed.
- `npm.cmd run diagram:examples:check`: 33 archived entries passed consistency/hash checks; no new provider or Vault generation was performed.
- `npm.cmd run diagram:gallery:check`: 33 fixtures passed the current gate. SVG content is compared; PNG checking currently verifies signature/existence, not pixel equivalence or PNG hashes.
- `npm.cmd run audit:i18n-ui`: passed.
- `npm.cmd run audit:render-host`: passed.
- Local KB offline fixture suite: 9 tests passed within the full Jest run; an evaluation corpus already exists.
- `npm.cmd run diagram:consumer:drawnix -- --input docs/diagram-examples/drawnix-knowledge-map/artifact.drawnix`: Plait public-API consumer passed with 38 nodes, 12 relations, and one root. This uses the archived example, not the earlier 20-node generated fixture.
- ESLint, using the same `eslint . --ext .ts` scope as `npm.cmd run lint`: failed with `231` errors and `1374` warnings across 512 inspected files. The baseline is unchanged; there is still no ratchet enforcing improvement.
- Isolated fault probes: four observations confirmed against production functions, using fake timers and in-memory Vault/HTTP boundaries. Passing these probes reproduces the defects; it does not mean they are fixed.
- Production `main.js`: `10,056,115` bytes; gzip: `3,728,761` bytes. These are artifact sizes, not startup-time or memory measurements.

The local `1.9.7` tag points to `ef77788`; production source has not changed between that tag and this audit baseline. The September 2 audit recorded a published bilingual GitHub Release with `main.js`, `manifest.json`, `README.md`, and `styles.css`. Remote release assets, branch protection, live providers, actual Obsidian application behavior, Drawnix/Draw.io applications, and Office rendering were not revalidated in this audit. Local release CI uses Node 20 and website CI uses Node 24; this local Node 22 result does not replace either CI environment.

## Plan Status Matrix

| Plan family | Status on current main | Actual remaining work |
|---|---|---|
| Provider expansion rounds | Shipped / historical | Keep provider metadata, discovery, docs, and tests synchronized as upstream APIs change. |
| Language support multiphase | Shipped / historical | No implementation phase remains; preserve offline Codex-authored release translation policy. |
| Mainline stabilization and CI hardening | Release-side scope shipped | Only tag-release and website-deploy workflows exist. Plugin PR build/test verification is open work. |
| CLI operation extraction and registry hardening | Registry/host extraction shipped; lifecycle hardening partial | 29 operations are not 29 public-safe APIs. Fix cancellation before expanding mutation contracts; packaging is not a universal dependency. |
| Diagram rendering roadmap | Core shipped; selected follow-ups conditional | Measure packaging cost; retain conservative Mermaid compatibility. PlantUML/Graphviz/Draw.io runtime remain deferred. |
| Vault history, settings navigation, batch folder | Finite feature scope shipped | History has its own write queue. Artifact persistence does not inherit that protection; batch cancellation and artifact rollback need separate fixes. |
| Diagram preview/history adaptation | Shipped modal architecture | A focus-trapped internal drawer would be a new interaction-system change, not an unfinished bug fix. |
| Mermaid normalization consolidation | Phases 0-3 shipped | Inventory consumers before removing compatibility exports; parser-backed admission for unknown families remains conservative. |
| Diagram capability catalog and forward architecture | Runtime foundation shipped; external gates active | Draw.io and real Drawnix application evidence are unavailable; the Plait gate is not an application claim. |
| Reference expansion | Completed | 33 executable rows, bounded payloads, deterministic adapters, preview/gallery/docs gates all pass. |
| Real-Vault diagram examples | Archived evidence set completed | Refresh intentionally when relevant inputs/runtime change; a hash check does not rerun the provider or prove all hosts. |
| Local KB retrieval and chapter split | Shipped bounded design | Current implementation is lexical MiniSearch plus managed artifacts; semantic/vector retrieval is a new architecture lane. |
| Slidev editable PPTX | Active quality track | Office font substitution, table baseline, paragraph spacing, and native geometry fidelity remain measurable gaps. |
| GEO/GitHub Pages/release | Operationally shipped | Search Console and AI-visibility observations remain external post-deploy evidence. |

Older plan documents retain their checklists and rationale for traceability. The individual dispositions and evidence owners are in the [plan register](../maintainer/project-plan-status.md). Neither unchecked historical TDD steps nor completed documentation tasks determine current runtime reliability.

## Evidence And Non-Claims

| Boundary | Evidence | Claim permitted |
|---|---|---|
| Mermaid | Canonical normalizer, 35-stage legacy registry, family gate, idempotency tests, runtime SVG safety | Shipped Mermaid path with conservative legacy compatibility |
| Native editable SVG | Deterministic renderers, layout diagnostics, Chromium gallery gate, 33 fixture assets | Shipped native family previews under the tested host/presentation contract |
| Drawnix | `.drawnix` serializer plus `@plait/*` public API consumer gate | Plait public-API compatibility; real Drawnix application import remains unclaimed |
| Draw.io | Exporter and XML tests; no new application run in this audit | Serializer contract only; no application interoperability claim |
| Circuitikz | Six golden templates, regression coverage, historical local compiler evidence | Constrained native compile path; fresh CI tool/version evidence still required |
| Render host | `main.js` inline `srcdoc`, render-host audit, fail-closed runtime module resolver | Self-contained current packaging; not independent heavy-runtime isolation |
| Local KB | MiniSearch, heading-aware chunks, offline fixtures, inspect diagnostics | Plugin-native lexical retrieval; not vector/RAG service semantics |
| Slidev/PPTX | Native standalone export and rendered layout audits | Bounded editability with explicit image fallback; not pixel-identical Office round-trip fidelity |

## Compatibility Inventory And Ponytail Audit

The September 2 audit reported "no production dependency that can be removed safely" in its convergence slice. That was a scoped non-deletion decision, not proof that every internal export is a supported public API. The updated inventory separates persisted contracts, documented maintainer APIs, and internal source imports:

| Candidate | Current consumers/evidence | Decision |
|---|---|---|
| `src/rendering/preview/mermaidDefinitionShared.ts` | Compatibility re-export; no current production import recorded | Classify support scope; unknown hypothetical consumers alone cannot justify indefinite retention |
| `src/diagram/adapters/drawnix/drawnixCrossRootRouter.ts` | Deprecated re-export consumed by focused routing tests | Migrate internal tests with callers; tests alone do not establish a public compatibility promise |
| `routeDrawnixCrossRootRelation()` | Compatibility router/tests reference it | Keep this audit non-destructive; decide removal from documented support and real consumers |
| `mergeDrawnixSourceCoverage()` | Maintainer documentation and tests reference the alias | Migrate known references to `enrichDrawnixSourceCoverage()` before removal |
| `rewriteLegacyTrailingDoubleDashArrow` | No repository consumer recorded | Check documented supported exports; require a deprecation window only if such a contract exists |
| `runCircuitikzRepairLoop()` | Focused tests and maintainer acceptance docs consume the SDK | Keep maintainer-only; never wire it as normal-generation fallback |
| `stripWrappingDoubleQuotes()` / `stripWrappedQuotedLabel()` | Byte-identical private implementations in `legacyFixerUtils.ts` | Small future shrink candidate; defer to a behavior-preserving focused change |

Persisted setting IDs, command IDs, and artifact schemas still require explicit migration discipline. Private TypeScript re-exports do not automatically need an external sunset program. Current docs tests also pin the old audit wording; future tests should assert contracts and references, not engineering opinions. No compatibility code is deleted in this audit.

## Ordered Forward Plan

### Next patch: operation correctness and PR verification

1. Give a running operation one cancellation lifetime. Settle a queue cancelled before its first timer, propagate the live cancellation state to every child, forward the effective signal to abortable transports, and prevent new writes/moves after cancellation is observed.
2. Serialize overlapping artifact writes at the persistence owner. Restore only writes still owned by the failed operation; report rollback conflicts/failures with recovery evidence. Compensation is not crash-atomic multi-file storage.
3. Add a secret-free PR build/test job and a lint baseline ratchet. Keep release publishing tag-scoped.

Exit gate: the four reproduced failures become passing regression cases for corrected behavior; Linux/Windows checks run; existing full-suite, build, i18n and packaging gates remain green. These are proposed fixes, not completed work.

### Following slice: evidence quality and measured budgets

1. Verify gallery PNG identity separately from visual fidelity, and remove tests that freeze audit conclusions.
2. Measure startup, cold/warm preview latency and memory on named Obsidian versions and devices. The manifest allows mobile and declares `minAppVersion: 0.15.0`; mocks do not prove that support range.
3. If measurements justify runtime isolation, change build/loader/release/audit/host evidence together. Otherwise close the investigation with an explicit keep-inline decision.
4. Add application import/edit/reopen evidence per target when the relevant application is available. Missing consumer evidence blocks only that capability claim.

Exit gate: versioned inputs, environment, hashes, scope and failure states accompany every evidence record; no universal packaging prerequisite is imposed on unrelated work.

### Product depth: retrieval first, Office fidelity when export demand warrants it

1. Extend the existing lexical retrieval corpus with held-out multilingual, low-signal and changing-Vault cases. Measure retrieval quality and context cost before choosing persistent indexing or embeddings.
2. Improve PPTX font/table/baseline behavior against a named Office renderer; preserve explicit Mermaid/SVG fallback.
3. Maintain provider presets and locales through shared metadata. Admit a new engine only for a demonstrated unmet use case with a bounded runtime and consumer contract.

Owners, alternatives, dependencies, test paths and stop conditions are specified in the [implementation plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md).

## Risk Controls

- Unknown fields remain accepted for forward compatibility, but required fields and known types fail closed at boundaries.
- Cache state is an optimization, never artifact identity or correctness authority.
- Provider discovery remains bounded and generation-oriented; do not surface embedding/reranker/speech rows as generation models.
- Real-Vault `passed` means one provider/environment run; it does not prove all providers, themes, or mobile hosts.
- A green website build proves route/build integrity, not post-deploy Search Console or AI-answer visibility.

## Decision

Prioritize cancellation, artifact persistence, and PR verification. The main constraint is preserving user work through failure and cancellation, not missing diagram types. Keep optimization and external capability expansion conditional on measurements; do not turn unknown consumers or broad architectural preferences into permanent blockers.
