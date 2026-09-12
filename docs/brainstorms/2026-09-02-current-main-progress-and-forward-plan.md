---
date: 2026-09-02
last_updated: 2026-09-13
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

The [plan register](../maintainer/project-plan-status.md) reconciles all 19 pre-existing formal plans, 32 brainstorm records, and the related maintainer tracks. The [reliability and evidence plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md) and [acceptance record](../maintainer/reliability-acceptance-2026-09-12.md) own the September 12–13 implementation and measurements. This file remains the current-progress entry; earlier convergence work remains a completed historical slice.

## Executive Judgment

The `main@7638cec` audit found four operation-lifetime defects despite green tests. The implementation now settles cancelled queues, propagates live cancellation through all five transports and prevents overlapping saves from undoing each other's outputs. New fault-schedule regressions and a real Obsidian 1.13.7 cancellation/conflicting-write probe establish those corrected behaviors. Version remains `1.9.7`; these are unreleased mainline changes, not a new release.

Linux/Windows verification and a lint ratchet now protect this work; remote acceptance belongs to the linked execution record. Keep the single-entry `main.js` plus inline `srcdoc`: the measured desktop activation/preview/heap costs fit provisional budgets. Retrieval snapshot semantics, native PowerPoint table paint and Circuitikz wiring/labels were also improved within bounded scopes. Additional renderers and generic transaction/index frameworks remain lower priority than these measured outcomes.

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

The [acceptance record](../maintainer/reliability-acceptance-2026-09-12.md) and [measurement JSON](../maintainer/evidence/2026-09-12/verification.json) own exact test counts, bundle hashes and consumer versions. Local execution uses Windows x64 / Node 22.19.0; the new CI matrix uses Node 20 on Linux and Windows. Build, full Jest, lint-regression, i18n/render-host, gallery/examples and both documentation build gates are recorded there with their scope.

- Cancellation is covered before dispatch, during retry/transport and after late responses; real desktop HTTP and non-desktop fetch integration tests supplement mocks.
- Artifact failures preserve competing edits, expose recovery failures and leave the per-Vault output queue usable. Atomic text compensation uses `Vault.process`; older hosts receive recovery copies.
- The 33 gallery entries now verify committed PNG hashes and normalized SVG contents. The 33 real-Vault examples remain archived provider evidence; no paid generation refresh was performed.
- Real Obsidian 1.13.7: activation p95 289.3 ms; dense Mermaid p95 120 ms; heap 62.92 → 66.30 → 66.58 MB across two 30-preview groups. Thirty mobile-emulation cycles passed; physical mobile and 0.15.0 are unverified.
- diagrams.net, Drawnix, Tectonic/Circuitikz and PowerPoint have named application/compiler records. Drawnix cross-link attachment failed; compiler success is accompanied by PDFium visual review.
- The original global lint debt was 231 errors / 1374 warnings. The diagnostic-level ratchet prevents new errors and selected correctness warnings; it does not claim that global lint debt is cleared.

The local `1.9.7` tag remains `ef77788`. This work changes neither release metadata nor remote release assets. Branch protection is an independent administrative setting; a workflow alone does not require checks for every administrator push. Website CI's Node 24 environment remains distinct from local Node 22 and plugin CI's Node 20.

## Plan Status Matrix

| Plan family | Status on current main | Actual remaining work |
|---|---|---|
| Provider expansion rounds | Shipped / historical | Keep provider metadata, discovery, docs, and tests synchronized as upstream APIs change. |
| Language support multiphase | Shipped / historical | No implementation phase remains; preserve offline Codex-authored release translation policy. |
| Mainline stabilization and CI hardening | Release scope plus PR/main verification implemented | Maintain Linux/Windows locked installs, dual Chromium revisions, lint regression evidence and separate tag publishing. |
| CLI operation extraction and registry hardening | Registry/host extraction and bounded lifecycle fixes delivered | 29 operations are not 29 public-safe APIs. Mutation-contract promotion still needs a concrete caller and contract. |
| Diagram rendering roadmap | Core delivered; keep-inline measurement completed | Desktop budgets passed. Physical mobile/oldest host remain unverified; new engines and packaging isolation require measured justification. |
| Vault history, settings navigation, batch folder | Finite scope plus operation reliability delivered | History and artifact writes have distinct owners. Artifact overlap serialization is per Vault, not cross-process/crash ACID. |
| Diagram preview/history adaptation | Shipped modal architecture | A focus-trapped internal drawer would be a new interaction-system change, not an unfinished bug fix. |
| Mermaid normalization consolidation | Phases 0-3 shipped | Inventory consumers before removing compatibility exports; parser-backed admission for unknown families remains conservative. |
| Diagram capability catalog and forward architecture | Runtime foundation and target-specific consumer evaluation delivered | diagrams.net passed; Drawnix nodes roundtrip but cross-branch arrows do not attach. Gate each supported claim independently. |
| Reference expansion | Completed | 33 executable rows, bounded payloads, deterministic adapters, preview/gallery/docs gates all pass. |
| Real-Vault diagram examples | Archived evidence set completed | Refresh intentionally when relevant inputs/runtime change; a hash check does not rerun the provider or prove all hosts. |
| Local KB retrieval and chapter split | Bounded design and snapshot/evaluation lane delivered | Top-3 positive recall 7/9 with 51.9% macro precision on the frozen synthetic corpus. Validate future CJK/ranking changes on a new split. |
| Slidev editable PPTX | Bounded table-paint fidelity lane delivered | PowerPoint 16 edit/save/reopen and the existing visible-native profile pass; fonts, baselines and raster-strict fidelity remain separate work. |
| GEO/GitHub Pages/release | Operationally shipped | Search Console and AI-visibility observations remain external post-deploy evidence. |

Older plan documents retain their checklists and rationale for traceability. The individual dispositions and evidence owners are in the [plan register](../maintainer/project-plan-status.md). Neither unchecked historical TDD steps nor completed documentation tasks determine current runtime reliability.

## Evidence And Non-Claims

| Boundary | Evidence | Claim permitted |
|---|---|---|
| Mermaid | Canonical normalizer, 35-stage legacy registry, family gate, idempotency tests, runtime SVG safety | Shipped Mermaid path with conservative legacy compatibility |
| Native editable SVG | Deterministic renderers, layout diagnostics, Chromium gallery gate, 33 fixture assets | Shipped native family previews under the tested host/presentation contract |
| Drawnix | Real application at `9939f452`, Plait 0.93.1; native edit/save/reopen | 38 nodes/one root and semantic relation records survive; fixed arrows detach after reflow, reported by `drawnix-static-cross-relations` |
| Draw.io | diagrams.net 31.4.5 import/edit/download/reopen | Three native vertices and two edges preserved in the recorded fixture |
| Circuitikz | Tectonic 0.16.9 / Circuitikz 1.4.6, six templates and five orientation variants, PDFium review | Readable bounded templates with preserved topology; compiler availability/package versions remain explicit |
| Render host | Inline `srcdoc`, bundle audit, actual Obsidian 1.13.7 timing/heap controls | Keep inline within measured desktop budgets; no physical mobile/oldest-host claim |
| Local KB | Frozen 13-query corpus, immutable per-batch snapshot tests, 65 real Vault rebuilds | Measured lexical retrieval and explicit stale-snapshot behavior; no semantic-quality guarantee |
| Slidev/PPTX | PowerPoint 16 build 14332, ten slides, native table edit/save/reopen | Bounded native editability and improved table paint; fonts differ from Chromium and geometry fallbacks remain images |

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

Persisted setting IDs, command IDs, and artifact schemas still require explicit migration discipline. Private TypeScript re-exports do not automatically need an external sunset program. U4 removed tests that pinned the old audit conclusions while retaining source-derived counts, bilingual links and catalog contracts. This batch does not delete compatibility APIs.

## Ordered Forward Plan

The September implementation units and their acceptance boundaries are recorded in the [plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md). The following are subsequent, separately scoped decisions rather than unfinished microsteps in U1–U8.

| Priority / owner | Next concrete question | Acceptance and stop condition |
|---|---|---|
| Host lifecycle, render host | Does retained memory after repeated development plugin reloads reproduce under normal enable/disable use? | Isolate renderer reuse/listener ownership with a fresh-Vault control. Fix only a reproduced lifecycle leak; the stable ordinary preview path does not justify an asset-loader rewrite. |
| Support boundary, host verification | Do the cancellation, recovery and preview contracts hold on physical mobile and the oldest intended Obsidian version? | Run the disposable-Vault marker-gated harness where supported; record device/host/API availability. Change support metadata only with explicit compatibility evidence. |
| Retrieval owner | Can CJK segmentation, navigation suppression or lexical ranking improve recall without sacrificing precision/context budget? | Use a new validation split; compare with the frozen 13-query report. Keep per-batch snapshot reuse. Embeddings need a demonstrated semantic gap plus privacy/storage/install budgets. |
| Native export owner | Is attached editable cross-link support available upstream for Mind nodes? | Require real Drawnix node movement/save/reopen evidence. Until then use SVG for faithful connectivity or an existing native target with edge binding; do not rename metadata fields into unsupported handles. |
| Office export owner | Which remaining font/baseline drift materially affects editable presentations? | Fix one measured family against a named Office/font set, retain before/after renders and fallback ownership. Preserve the visible-native thresholds; do not declare raster equivalence. |

Maintain CI with locked dependencies and the two browser revisions. Branch protection is a repository policy decision, not an inference from passing YAML. Continue provider/locale upkeep through shared registries. A new engine needs an unmet use case and a bounded consumer contract.

## Risk Controls

- Unknown fields remain accepted for forward compatibility, but required fields and known types fail closed at boundaries.
- Cache state is an optimization, never artifact identity or correctness authority.
- Provider discovery remains bounded and generation-oriented; do not surface embedding/reranker/speech rows as generation models.
- Real-Vault `passed` means one provider/environment run; it does not prove all providers, themes, or mobile hosts.
- A green website build proves route/build integrity, not post-deploy Search Console or AI-answer visibility.

## Decision

The September reliability work establishes operation ownership and stronger evidence. Keep the measured inline architecture, preserve explicit consumer limits and choose the next change from observed failures or new user needs. A completed implementation unit, a passing structural check and an application capability remain distinct claims.
