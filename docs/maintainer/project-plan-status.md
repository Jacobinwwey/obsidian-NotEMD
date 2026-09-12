---
date: 2026-09-12
last_updated: 2026-09-13
status: current
canonical_for: plan-disposition
audit_commit: 7638cec
---

# Project Plan Status And Engineering Assessment

Language: **English** | [简体中文](./project-plan-status.zh-CN.md)

The [current-progress record](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.md) owns the summary. This register owns individual plan dispositions. The [implementation plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md) and [acceptance record](./reliability-acceptance-2026-09-12.md) own U1–U8 execution and evidence. Historical checklists remain evidence of intent, not an alternative current backlog.

## Audit Scope And Judgment

The original documentation audit inspected `main@7638cec`, plugin `1.9.7`, from a clean worktree. The September 12–13 implementation now closes its four reproduced runtime defects and adds target-specific host/application/compiler evidence. The release tag remains `1.9.7@ef77788`; this is an unreleased mainline improvement. No release/tag or paid provider-example regeneration is included.

Coverage includes all **19 pre-existing English formal plans/design records** under `docs/plans/` and `docs/superpowers/plans/`, their Chinese counterparts, all **32 brainstorm records**, related maintainer plans, runtime registries, high-risk execution/persistence paths, build/test configuration and release workflows. Historical records were reconciled by scope and implementation evidence; their original microsteps were not retroactively replayed or blindly checked off. The new September 12 plan is not included in the 19-plan historical inventory.

The project retains 36 provider presets, 29 operation definitions, 33 executable diagram rows, eight render targets, lexical retrieval, chapter splitting, persistent history and Slidev/PPTX export. Transport-driven dispatch, `DiagramSpec` plus deterministic projections and explicit fallback boundaries remain sound. U1/U2 repair operation ownership; U3/U4 improve regression and evidence integrity. Remaining limits concern specific consumers/devices and measured quality, not missing baseline architecture.

Do not publish a global completion percentage. “Delivered within a finite scope,” “verified in this environment,” and “supported by a real consuming application” are different claims.

## Formal Plan Register

“Delivered” below describes the finite feature scope. The finding dispositions and consumer limits below qualify its acceptance.

| ID | Plan | Reconciled status | Implemented evidence and remaining obligation |
|---|---|---|---|
| P01 | [03-26 AGENTS/provider expansion](../superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md) | Delivered; historical | `llmProviders.ts`, Doubao validation and provider transport tests exist. Preserve metadata/runtime/docs agreement; no second extraction project. |
| P02 | [03-26 China providers, round 2](../superpowers/plans/2026-03-26-china-provider-expansion-round2.en.md) | Delivered; historical | Qwen Code, Z AI and Huawei presets use the shared transport. Upstream model/API maintenance is ongoing maintenance, not an unfinished release phase. |
| P03 | [04-09 language support](../superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md) | Delivered within declared locale coverage | UI locale and task-language policy are separated; 21 plugin locales differ from 34 website locales. Key/fallback tests do not prove linguistic quality or every device. |
| P04 | [04-14 diagram platform roadmap](../superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md) | Core delivered; roadmap partial | Spec, adapters, registry, cache, host and export are present. Task 0 packaging isolation is conditional; Task 2 retains compatibility paths; Task 3 retains the legacy repair body. No automatic obligation to add more engines. |
| P05 | [05-03 mainline stabilization](../superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md) | Finite batch delivered | Command convergence, semantic helper, packaging audit and release-helper work landed. The old “Drawnix future adapter” wording is historical. Release-side CI is not PR CI. |
| P06 | [05-04 CLI extraction](../superpowers/plans/2026-05-04-notemd-cli-operation-extraction.en.md) | Extraction delivered; broad promotion deferred | Registry, host adapters, invocation contracts and bounded maintainer invocation exist. `publicCliSurface.ts` still deliberately filters the safe slice; do not equate 29 definitions with public automation. |
| P07 | [05-05 note-processing registry hardening](../superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md) | Registry and scoped lifecycle hardening delivered | U1 closes the reproduced post-cancel mutation paths with live child state, transport abort and real-host evidence. Non-abortable server work and already-started writes remain explicit limits. |
| P08 | [07-11 history/settings/batch-folder design](../plans/2026-07-11-vault-history-settings-navigation-batch-folder-design.en.md) | Delivered with UI refinement | Repository-backed history, stable settings catalog/navigation and explicit folder preparation exist. The live category selector supersedes the proposed large rail. |
| P09 | [07-11 history/settings/batch-folder implementation](../superpowers/plans/2026-07-11-vault-history-settings-navigation-batch-folder.en.md) | Delivered | The 29 historical checked steps describe this feature scope. History's serialized repository does not protect artifact file writes elsewhere. |
| P10 | [07-19 adaptive preview/history design](../plans/2026-07-19-diagram-popup-adaptive-history-design.en.md) | Delivered as modal architecture | Shared `DiagramHistoryView`, responsive controls and preview/history entry points exist. An internal focus-trapped drawer is a different future interaction change. |
| P11 | [07-19 adaptive preview/history implementation](../superpowers/plans/2026-07-19-diagram-popup-adaptive-history.en.md) | Delivered with documented substitution | Interpret old “drawer” steps through the shipped modal decision; do not restart or claim an internal drawer from checkbox wording. |
| P12 | [08-03 routing/source visuals/DPI](../plans/2026-08-03-drawnix-routing-visuals-dpi-design.en.md) | Delivered; persistence strengthened | U2 serializes overlapping paths and restores only owned text. Conflicts/binaries/creations retain recovery evidence; stale companion directories are no longer blindly deleted. |
| P13 | [08-14 catalog/Drawnix delivery design](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.en.md) | Superseded; rejected design | Do not restore document-tree/full-board/presentation modes or replay-before-save validation. P14 is the replacement contract. |
| P14 | [08-14 catalog/Drawnix implementation record](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.en.md) | Replacement delivered; consumer limits measured | Real Drawnix edit/save/reopen preserves 38 native nodes/one root and semantic relations. Static cross-branch arrows detach after native reflow; the renderer now reports that limitation. |
| P15 | [08-15 Mermaid consolidation](../plans/2026-08-15-mermaid-normalization-consolidation.en.md) | Phases 0–3 delivered | Canonical normalization, shared fences, 35 ordered repair stages, family gating and runtime initialization are tested. This is not complete removal of legacy grammar code; internal aliases need support-scope classification. |
| P16 | [08-16 capability catalog/forward architecture](../superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.en.md) | Foundation and target-specific evaluation delivered | diagrams.net native roundtrip and pinned Circuitikz compilation/visual review pass. Drawnix node editing passes while cross-link attachment remains unsupported. |
| P17 | [08-21 reference expansion](../superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md) | Delivered | 33 variant-aware rows, bounded payload families and deterministic native layouts exist. Five exact reference grammars remain deliberately outside the executable catalog. |
| P18 | [08-29 real-Vault examples](../superpowers/plans/2026-08-29-diagram-examples-implementation.en.md) | Archived evidence set delivered | 33 entries, bilingual inputs, artifacts and machine reports pass the archive checks. The current audit does not rerun those LLM/Vault sessions. |
| P19 | [09-02 truth convergence](../superpowers/plans/2026-09-02-current-main-truth-convergence.en.md) | Completed historical documentation slice | Its progress entry remains current and is updated in place. New defect findings revise confidence and priorities without rewriting the earlier execution history. |

The four upstream design specs in `docs/superpowers/specs/` map to P01, P02, P17 and P18 respectively. They are requirements/design provenance, not four additional independent delivery projects.

## Brainstorm And Progress Record Register

These 32 records retain their historical rationale. Scope-specific documents may remain authoritative for a subsystem; the older global matrices no longer own current priority ordering.

| ID | Record | Current disposition |
|---|---|---|
| B01 | [04-14 diagram phase 2](../brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md) | Core requirement scope implemented; conditional remainder follows P04. |
| B02 | [05-01 LLM compatibility/progress](../brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.md) | Historical transport/token baseline; U1 now adds operation-wide signal/retry ownership. |
| B03 | [05-02 progress audit](../brainstorms/2026-05-02-progress-audit-and-next-direction.md) | Historical snapshot; obsolete counts and old task ordering are not the current backlog. |
| B04 | [05-03 Drawnix feasibility](../brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md) | Native export later shipped; full application embedding remains deferred. |
| B05 | [05-03 stabilization/CI requirements](../brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md) | Release-side scope delivered; U3 adds PR/main Linux/Windows checks and a lint ratchet. |
| B06 | [05-04 CLI extensibility](../brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md) | Implemented to P06's bounded contract depth. |
| B07 | [05-05 CLI mainline sync](../brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md) | Historical sync ledger; retained contract-promotion limits remain relevant. |
| B08 | [05-05 write-heavy contracts](../brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.md) | U1/U2 close the reproduced cancellation/persistence failures; cross-process/crash atomicity remains unclaimed. |
| B09 | [05-07 CLI next phase](../brainstorms/2026-05-07-cli-next-phase-planning.md) | Extraction largely delivered; reject packaging as an unrelated global dependency. |
| B10 | [05-08 packaging/semantic convergence](../brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md) | Inline shipping boundary and semantic verification implemented; split-runtime work conditional. |
| B11 | [05-10 multi-entry candidate](../brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.md) | Candidate remains unshipped. U5 closes the investigation with a measured keep-inline decision. |
| B12 | [05-11 folder filtering](../brainstorms/2026-05-11-folder-task-file-filtering-progress-and-architecture-alignment.md) | Delivered: named profiles, glob/regex, path scope and operation overrides. |
| B13 | [05-12 release chronicle CI](../brainstorms/2026-05-12-release-chronicle-ci-hardening-progress-and-architecture-alignment.md) | Delivered release-helper/locking scope; chronicle jobs remain serial. |
| B14 | [05-12 sidebar/API observability](../brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.md) | UI activity/feedback delivered; activity reporting is not cancellation correctness. |
| B15 | [05-13 mainline 1.8.9](../brainstorms/2026-05-13-mainline-progress-audit-1-8-9-and-next-direction.md) | Historical release/recovery baseline. |
| B16 | [05-20 unified matrix](../brainstorms/2026-05-20-unified-follow-through-matrix.md) | Superseded as global execution authority by B32 and this register. |
| B17 | [05-24 force-rewrite audit](../brainstorms/2026-05-24-mainline-force-rewrite-audit-and-next-direction.md) | Historical recovery record; do not infer missing current features from backup-branch status. |
| B18 | [05-25 post-recovery audit](../brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.md) | Superseded global snapshot; recovered features now exist on the audited mainline. |
| B19 | [05-27 provider settings/discovery](../brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.md) | Bounded implementation delivered; discovery stays transient and manual model selection remains authoritative. |
| B20 | [05-28 mainline/next level](../brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md) | Superseded global snapshot; not a competing packaging-first execution order. |
| B21 | [06-09 chapter split/TOC](../brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md) | Bounded feature delivered: heading-aware split, stable refs and guarded managed reruns. Not a general Vault transaction guarantee. |
| B22 | [06-09 RAG quality/execution](../brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md) | U7 adds frozen independent evaluation, changing-file behavior and real Vault timings; semantic/CJK misses are recorded. |
| B23 | [06-09 retrieval decision](../brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md) | Lexical, in-process, embedding-free boundary remains the accepted baseline. |
| B24 | [06-20 Slidev layout/canvas](../brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.md) | Layout/audit baseline delivered; B25 owns later PPTX fidelity work. |
| B25 | [06-21 editable PPTX](../brainstorms/2026-06-21-slidev-editable-pptx-progress-and-next-direction.md) | U8 fixes native table paint and verifies PowerPoint 16 edit/save/reopen; raster-strict and font fidelity remain limited. |
| B26 | [07-02 CI/GEO/CLI/Slidev closeout](../brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md) | Historical finite closeout; external post-deploy observations and later Office fidelity are separate. |
| B27 | [07-04 reference/figure generation](../brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md) | Native catalog/figure expansion delivered by P16/P17; exact reference grammars and new engines stay scoped. |
| B28 | [07-22 Drawnix quality/delivery](../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md) | Implemented and refined by P14; rejected delivery-mode matrix must not return. |
| B29 | [08-08 diagram/settings integrity](../brainstorms/2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.md) | Its finite scope plus U2 write ownership is delivered; compensation still is not universal transactional safety. |
| B30 | [08-14 presentation architecture review](../brainstorms/2026-08-14-drawnix-presentation-architecture-review.md) | Superseded/rejected architecture; keep as a negative design lesson. |
| B31 | [08-16 mainline diagram audit](../brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.md) | Explicitly superseded by B32; later geometry/presentation fixes remain implemented. |
| B32 | [09-02 current main](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.md) | Current summary, refreshed September 13 with implementation, consumer evidence and bounded next decisions. |

## Maintainer Tracks And External Acceptance

| Track | Current implementation | Open acceptance boundary |
|---|---|---|
| [Circuitikz roadmap](./circuitikz-figure-generation-roadmap.md) and [prototype](./circuitikz-export-prototype.md) | Six deterministic templates, topology checks, diagnostics and maintainer repair SDK; U6 fixes wire/label layout | Tectonic 0.16.9 / Circuitikz 1.4.6 compiled six templates plus five orientation variants; PDFium review passed. The repair SDK remains maintainer-only. |
| [Managed Circuitikz/runtime/history, 07-19](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.md) | Optional pinned runtime, integrity/staging checks, desktop lazy loading and history scroll | A separately bootstrapped cache enabled offline acceptance; cold package downloads exceeded the normal runner timeout. Preserve mobile's dependency-free path. |
| [Circuitikz UI/export/docs, 07-10](./circuitikz-ui-export-and-docs-sync-2026-07-10.md) | Source-format UI, export and bilingual documentation delivered | Maintain target-specific support; compiler availability is not universal. |
| [Generation chain/MDX, 07-19](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.md) | Generation/export chain and website policy documented and implemented | Keep source, preview and real external-consumer claims distinct. |
| [History/settings progress, 07-11](./vault-history-settings-navigation-progress-2026-07-11.md) | P08/P09 feature scope delivered | Rich retention or folder mutation policies require explicit additional scope. |
| [Standalone acceptance](./slidev-standalone-acceptance-2026-06-18.md), [PPTX acceptance](./slidev-editable-pptx-acceptance-2026-06-21.md), [export gate](./slidev-export-workflow.md) | Native table paint fixed; PowerPoint 16 build 14332 edited/saved/reopened ten slides with two native tables | Table-slide RMSE 0.192665 → 0.159463; existing visible-native gate passed. Raster-strict/font fidelity remains limited. |
| [Draw.io visual regression](./drawio-export-visual-regression.md) | diagrams.net 31.4.5 native import/edit/save/reopen | Three vertices/two edges and the edited CJK label survive the recorded fixture; other versions remain separate acceptance. |
| [Drawnix spike](./drawnix-export-spike.md) | Actual Drawnix `9939f452` edit/save/reopen: 38 nodes, 12 semantic relations, one root | Node roundtrip passes. Static arrows detach on reflow; Mind-node bound handles are unsupported by the measured upstream contract. |
| [GEO measurement log](./github-pages-geo-measurement-log.md) | Fresh local build/audit of 34 website locales; historical deployment observations | Search Console indexing and AI-answer visibility need dated external observations; build success cannot supply them. |
| [Release workflow](./release-workflow.md) | Tag publishing remains separate from the new PR/main verification workflow | This batch changes no release assets/tag or branch-protection settings; CI execution evidence belongs to U3. |

## Finding Dispositions

R1–R4 were reproduced against `7638cec` before implementation. Their corrected outcomes now have red/green regressions and real-host acceptance. Source tests and tracked evidence reproduce the checks without depending on the local audit cache or `.trellis/`.

| ID | Priority | Baseline mechanism | Current disposition |
|---|---|---|---|
| R1 | P1 | Cancellation before the first worker left the outer Promise unsettled. | Closed by U1: every worker settles, including cancelled staggering; active counts return to zero. |
| R2 | P1 | Copied child reporter state allowed late LLM responses to modify/move notes after cancellation. | Closed by U1: live child getters and mutation boundaries; real Obsidian late-response probe preserved both notes. |
| R3 | P1 | Transport received the original optional signal instead of the internally created effective signal. | Closed by U1: one signal reaches five transports and retry waits; caller ownership is preserved, non-abortable requests settle logically. |
| R4 | P1 | A failed save restored old bytes over a concurrent successful save and hid recovery failures. | Closed by U2: overlap reservations, atomic ownership-checked text compensation, retained recovery copies and structured failures. |
| R5 | P1 | Plugin tests ran only after a release tag; no PR/main workflow existed. | Closed by U3: Linux/Windows PR checks passed, and the isolated negative PR failed only its intended assertion on both platforms. Compiler/lint negative probes also rejected errors. Branch protection is separate. |
| R6 | P2 | Valid but unrelated PNG bytes passed signature/existence checks. | Closed by U4: committed PNG hashes detect substitution; normalized SVG comparison tolerates checkout line endings. |
| R7 | P2 | Docs tests froze literal audit opinions. | Closed by U4: opinions removed from assertions; source-derived counts, bilingual links and schema contracts retained. |
| R8 | P2 | No named activation/preview/heap budget; manifest support exceeded real-host evidence. | U5 investigation closed with keep-inline desktop budgets. Physical mobile and Obsidian 0.15.0 remain explicitly unverified. |

A green serializer or compiler remains insufficient for visual semantics. U6's PDF review found and fixed crossed/control-wire layouts and mirrored Circuitikz labels; actual Drawnix reflow exposed an upstream attachment limitation that remains reported rather than promoted.

## Architecture Decisions To Keep Or Change

| Decision | Assessment | Practical direction |
|---|---|---|
| Provider registry plus five shared transports | Keep | Fix signal/retry ownership once; preserve protocol-specific streaming and partial diagnostics. More presets are not the main progress metric. |
| Semantic spec plus target projection | Keep | Validate external input at admission and trust internal invariants. Do not introduce a second semantic/presentation persistence model. |
| Single inline render bundle | Keep: measured decision | Activation p95 289.3 ms, dense preview p95 120 ms and warmed heap within provisional desktop budgets. Bundle hashes/sizes are centralized in the acceptance record. |
| History repository write queue | Correct bounded ownership | Apply the ownership principle to artifact persistence; do not assume a history queue serializes unrelated file writes. |
| Artifact write ownership | Bounded guarantee implemented | Reserve complete output sets, serialize overlaps and compensate only owned text. Preserve conflict/binary preimages; no cross-process/crash ACID promise. |
| Lexical MiniSearch retrieval | Keep as baseline | Candidate enumeration and serial file reads rebuild an index per retrieval construction; batch title generation already reuses one retriever. Measure corpus size/read cost and stale-batch behavior before introducing persistence. |
| Compatibility retention | Narrow by supported surface | Persisted schemas and command IDs deserve migration windows; private source re-exports are not public merely because tests import them. |
| Monolith shrinkage as a goal | Reject as a standalone goal | `NotemdSettingTab.ts` is about 4.1k lines, `main.ts` 3.3k, `llmUtils.ts` 3.2k and `fileUtils.ts` 2.4k. Extract only when a concrete invariant/dependency gains a real owner. |

## Direction And Completion Rules

1. **Reliability baseline:** U1/U2 close R1–R4; U3 protects integration with fresh Linux/Windows verification and deliberate failure evidence. Keep every later change subject to these gates.
2. **Measured architecture:** U4 integrity is implemented and U5 closes keep-inline. Investigate repeated development reload retention separately; validate physical mobile/oldest-host behavior before widening support claims.
3. **Consumer admission:** U6 completes target-by-target evaluation. Keep Drawnix cross-link attachment unsupported until an actual upstream/alternative target demonstrates it.
4. **Product depth:** U7 snapshot/evaluation and U8 table-paint lanes are delivered. Future CJK/ranking work needs a new validation split; Office improvements need a named font/renderer defect and unchanged fidelity thresholds.

A plan closes when its finite requirement, implementation, regression evidence and documentation agree. An external gate closes only with a named application/tool version and retained artifacts. A deferred idea reopens only with a concrete use case, owner, acceptance test and maintenance budget. Keep release/history records dated; update this register and the current-progress summary instead of appending another competing global roadmap.
