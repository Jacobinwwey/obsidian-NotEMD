---
date: 2026-09-12
last_updated: 2026-09-12
status: current
canonical_for: plan-disposition
audit_commit: 7638cec
---

# Project Plan Status And Engineering Assessment

Language: **English** | [简体中文](./project-plan-status.zh-CN.md)

The [current-progress record](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.md) owns the verification snapshot. This register owns individual plan dispositions. The [next implementation plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md) owns proposed work. Historical checklists remain evidence of intent, not an alternative current backlog.

## Audit Scope And Judgment

Audited local `main@7638cec`, plugin `1.9.7`, with an initially clean worktree. The local release tag is `1.9.7@ef77788`; subsequent changes through this baseline concern documentation and documentation tests, not production runtime. No remote fetch, live provider generation, deployment, application import, Office render, commit, or release is part of this audit.

Coverage includes all **19 pre-existing English formal plans/design records** under `docs/plans/` and `docs/superpowers/plans/`, their Chinese counterparts, all **32 brainstorm records**, related maintainer plans, runtime registries, high-risk execution/persistence paths, build/test configuration and release workflows. Historical records were reconciled by scope and implementation evidence; their original microsteps were not retroactively replayed or blindly checked off. The new September 12 plan is not included in the 19-plan historical inventory.

The project has substantial implemented breadth: 36 provider presets, 29 operation definitions, 33 executable diagram rows, eight render targets, lexical retrieval, chapter splitting, persistent history and Slidev/PPTX export. The strongest architecture decisions are transport-driven provider dispatch, `DiagramSpec` plus deterministic target projections, and explicit fallback/reporting boundaries. The main deficit is operation-lifetime correctness and the strength of evidence used to call work complete.

Do not publish a global completion percentage. “Delivered within a finite scope,” “verified in this environment,” and “supported by a real consuming application” are different claims.

## Formal Plan Register

“Delivered” below describes the finite feature scope. The open findings later in this document still apply to the affected execution paths.

| ID | Plan | Reconciled status | Implemented evidence and remaining obligation |
|---|---|---|---|
| P01 | [03-26 AGENTS/provider expansion](../superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md) | Delivered; historical | `llmProviders.ts`, Doubao validation and provider transport tests exist. Preserve metadata/runtime/docs agreement; no second extraction project. |
| P02 | [03-26 China providers, round 2](../superpowers/plans/2026-03-26-china-provider-expansion-round2.en.md) | Delivered; historical | Qwen Code, Z AI and Huawei presets use the shared transport. Upstream model/API maintenance is ongoing maintenance, not an unfinished release phase. |
| P03 | [04-09 language support](../superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md) | Delivered within declared locale coverage | UI locale and task-language policy are separated; 21 plugin locales differ from 34 website locales. Key/fallback tests do not prove linguistic quality or every device. |
| P04 | [04-14 diagram platform roadmap](../superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md) | Core delivered; roadmap partial | Spec, adapters, registry, cache, host and export are present. Task 0 packaging isolation is conditional; Task 2 retains compatibility paths; Task 3 retains the legacy repair body. No automatic obligation to add more engines. |
| P05 | [05-03 mainline stabilization](../superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md) | Finite batch delivered | Command convergence, semantic helper, packaging audit and release-helper work landed. The old “Drawnix future adapter” wording is historical. Release-side CI is not PR CI. |
| P06 | [05-04 CLI extraction](../superpowers/plans/2026-05-04-notemd-cli-operation-extraction.en.md) | Extraction delivered; broad promotion deferred | Registry, host adapters, invocation contracts and bounded maintainer invocation exist. `publicCliSurface.ts` still deliberately filters the safe slice; do not equate 29 definitions with public automation. |
| P07 | [05-05 note-processing registry hardening](../superpowers/plans/2026-05-05-notemd-note-processing-registry-hardening.en.md) | Registry delivered; side-effect hardening partial | Task 1 registry and Task 3 host extraction are implemented. Task 2 must not be called fully robust while cancellation can permit writes/moves. U1 owns that gap. |
| P08 | [07-11 history/settings/batch-folder design](../plans/2026-07-11-vault-history-settings-navigation-batch-folder-design.en.md) | Delivered with UI refinement | Repository-backed history, stable settings catalog/navigation and explicit folder preparation exist. The live category selector supersedes the proposed large rail. |
| P09 | [07-11 history/settings/batch-folder implementation](../superpowers/plans/2026-07-11-vault-history-settings-navigation-batch-folder.en.md) | Delivered | The 29 historical checked steps describe this feature scope. History's serialized repository does not protect artifact file writes elsewhere. |
| P10 | [07-19 adaptive preview/history design](../plans/2026-07-19-diagram-popup-adaptive-history-design.en.md) | Delivered as modal architecture | Shared `DiagramHistoryView`, responsive controls and preview/history entry points exist. An internal focus-trapped drawer is a different future interaction change. |
| P11 | [07-19 adaptive preview/history implementation](../superpowers/plans/2026-07-19-diagram-popup-adaptive-history.en.md) | Delivered with documented substitution | Interpret old “drawer” steps through the shipped modal decision; do not restart or claim an internal drawer from checkbox wording. |
| P12 | [08-03 routing/source visuals/DPI](../plans/2026-08-03-drawnix-routing-visuals-dpi-design.en.md) | Delivered; later contract refines it | Source visuals, scoped companions, native routing and DPI support exist. The multi-file rollback is compensating only; U2 addresses the reproduced concurrent rollback defect. |
| P13 | [08-14 catalog/Drawnix delivery design](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.en.md) | Superseded; rejected design | Do not restore document-tree/full-board/presentation modes or replay-before-save validation. P14 is the replacement contract. |
| P14 | [08-14 catalog/Drawnix implementation record](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.en.md) | Replacement delivered | Filename-rooted native tree, hierarchy preservation and exterior relation lanes are present. Actual Drawnix application interoperability remains unproven here. |
| P15 | [08-15 Mermaid consolidation](../plans/2026-08-15-mermaid-normalization-consolidation.en.md) | Phases 0–3 delivered | Canonical normalization, shared fences, 35 ordered repair stages, family gating and runtime initialization are tested. This is not complete removal of legacy grammar code; internal aliases need support-scope classification. |
| P16 | [08-16 capability catalog/forward architecture](../superpowers/plans/2026-08-16-diagram-capability-catalog-and-forward-architecture.en.md) | Local foundation delivered; external acceptance open | Catalog/target/export axes, fixtures, gallery and docs are implemented. External application and compiler gates remain target-specific obligations. |
| P17 | [08-21 reference expansion](../superpowers/plans/2026-08-21-diagram-reference-expansion-implementation.en.md) | Delivered | 33 variant-aware rows, bounded payload families and deterministic native layouts exist. Five exact reference grammars remain deliberately outside the executable catalog. |
| P18 | [08-29 real-Vault examples](../superpowers/plans/2026-08-29-diagram-examples-implementation.en.md) | Archived evidence set delivered | 33 entries, bilingual inputs, artifacts and machine reports pass the archive checks. The current audit does not rerun those LLM/Vault sessions. |
| P19 | [09-02 truth convergence](../superpowers/plans/2026-09-02-current-main-truth-convergence.en.md) | Completed historical documentation slice | Its progress entry remains current and is updated in place. New defect findings revise confidence and priorities without rewriting the earlier execution history. |

The four upstream design specs in `docs/superpowers/specs/` map to P01, P02, P17 and P18 respectively. They are requirements/design provenance, not four additional independent delivery projects.

## Brainstorm And Progress Record Register

These 32 records retain their historical rationale. Scope-specific documents may remain authoritative for a subsystem; the older global matrices no longer own current priority ordering.

| ID | Record | Current disposition |
|---|---|---|
| B01 | [04-14 diagram phase 2](../brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md) | Core requirement scope implemented; conditional remainder follows P04. |
| B02 | [05-01 LLM compatibility/progress](../brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.md) | Historical transport/token baseline; cancellation findings R2/R3 qualify present reliability. |
| B03 | [05-02 progress audit](../brainstorms/2026-05-02-progress-audit-and-next-direction.md) | Historical snapshot; obsolete counts and old task ordering are not the current backlog. |
| B04 | [05-03 Drawnix feasibility](../brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md) | Native export later shipped; full application embedding remains deferred. |
| B05 | [05-03 stabilization/CI requirements](../brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md) | Bounded release-side scope delivered; PR CI remains missing. |
| B06 | [05-04 CLI extensibility](../brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md) | Implemented to P06's bounded contract depth. |
| B07 | [05-05 CLI mainline sync](../brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md) | Historical sync ledger; retained contract-promotion limits remain relevant. |
| B08 | [05-05 write-heavy contracts](../brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.md) | Side-effect ownership improved; cancellation/persistence acceptance is still partial. |
| B09 | [05-07 CLI next phase](../brainstorms/2026-05-07-cli-next-phase-planning.md) | Extraction largely delivered; reject packaging as an unrelated global dependency. |
| B10 | [05-08 packaging/semantic convergence](../brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.md) | Inline shipping boundary and semantic verification implemented; split-runtime work conditional. |
| B11 | [05-10 multi-entry candidate](../brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.md) | Candidate remains unshipped. U5 must establish a measured reason before activation. |
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
| B22 | [06-09 RAG quality/execution](../brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md) | Execution model implemented; evaluation depth remains open under U7. |
| B23 | [06-09 retrieval decision](../brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md) | Lexical, in-process, embedding-free boundary remains the accepted baseline. |
| B24 | [06-20 Slidev layout/canvas](../brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.md) | Layout/audit baseline delivered; B25 owns later PPTX fidelity work. |
| B25 | [06-21 editable PPTX](../brainstorms/2026-06-21-slidev-editable-pptx-progress-and-next-direction.md) | Text/tables and bounded shapes delivered; Office round-trip quality remains partial. |
| B26 | [07-02 CI/GEO/CLI/Slidev closeout](../brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md) | Historical finite closeout; external post-deploy observations and later Office fidelity are separate. |
| B27 | [07-04 reference/figure generation](../brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md) | Native catalog/figure expansion delivered by P16/P17; exact reference grammars and new engines stay scoped. |
| B28 | [07-22 Drawnix quality/delivery](../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md) | Implemented and refined by P14; rejected delivery-mode matrix must not return. |
| B29 | [08-08 diagram/settings integrity](../brainstorms/2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.md) | Its finite hardening scope delivered; R4 prevents interpreting that as universal transactional safety. |
| B30 | [08-14 presentation architecture review](../brainstorms/2026-08-14-drawnix-presentation-architecture-review.md) | Superseded/rejected architecture; keep as a negative design lesson. |
| B31 | [08-16 mainline diagram audit](../brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.md) | Explicitly superseded by B32; later geometry/presentation fixes remain implemented. |
| B32 | [09-02 current main](../brainstorms/2026-09-02-current-main-progress-and-forward-plan.md) | Current summary, refreshed September 12; prioritizes operation reliability. |

## Maintainer Tracks And External Acceptance

| Track | Current implementation | Open acceptance boundary |
|---|---|---|
| [Circuitikz roadmap](./circuitikz-figure-generation-roadmap.md) and [prototype](./circuitikz-export-prototype.md) | Six deterministic templates, topology signatures, compile diagnostics, render smoke and one-attempt repair SDK | The SDK is maintainer-only, without a normal-generation caller. A real repair command is optional new scope. Compiler CI and path-only label legibility need separate evidence. |
| [Managed Circuitikz/runtime/history, 07-19](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.md) | Optional pinned Tectonic installation, integrity/staging/rollback checks, desktop lazy loading, history scroll fix | Historical native-host acceptance exists; no new install or compile run in this audit. Preserve mobile's dependency-free path. |
| [Circuitikz UI/export/docs, 07-10](./circuitikz-ui-export-and-docs-sync-2026-07-10.md) | Source-format UI, export and bilingual documentation delivered | Maintain target-specific support; compiler availability is not universal. |
| [Generation chain/MDX, 07-19](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.md) | Generation/export chain and website policy documented and implemented | Keep source, preview and real external-consumer claims distinct. |
| [History/settings progress, 07-11](./vault-history-settings-navigation-progress-2026-07-11.md) | P08/P09 feature scope delivered | Rich retention or folder mutation policies require explicit additional scope. |
| [Standalone acceptance](./slidev-standalone-acceptance-2026-06-18.md), [PPTX acceptance](./slidev-editable-pptx-acceptance-2026-06-21.md), [export gate](./slidev-export-workflow.md) | Standalone export and visible editable text/table layers have historical real-note evidence | Office fonts, cell baselines, paragraph layout and reopened documents are U8's measurable gap. |
| [Draw.io visual regression](./drawio-export-visual-regression.md) | Serializer/XML contracts | Actual diagrams.net open/edit/save/reopen evidence is outstanding. |
| [Drawnix spike](./drawnix-export-spike.md) | Serializer and a fresh Plait public-API check of the archived example: 38 nodes, 12 relations, one root | `createBoard`/type recognition is not a Drawnix application import or native visual layout test. |
| [GEO measurement log](./github-pages-geo-measurement-log.md) | Fresh local build/audit of 34 website locales; historical deployment observations | Search Console indexing and AI-answer visibility need dated external observations; build success cannot supply them. |
| [Release workflow](./release-workflow.md) | Numeric tags, bilingual notes, required four assets and serial chronicle workflow implemented | Current remote asset state/branch protection were not inspected; PR CI is a separate missing repository workflow. |

## Reproduced Defects And Verification Gaps

R1–R4 were reproduced against production functions without altering tracked source. Fake timers and in-memory Vault/HTTP boundaries make the schedules deterministic and avoid touching user notes or making network requests. Local probe programs/results live in `.cache/plan-audit-2026-09-12/`; the mechanisms below and the future regression paths are sufficient to reproduce them without depending on that local directory.

| ID | Priority | Evidence and observed mechanism | Required outcome |
|---|---|---|---|
| R1 | P1 | `utils.ts#createConcurrentProcessor`: cancel after scheduling, before the first timer; every timer skips its body, no worker resolves the outer Promise. Probe observes zero executed tasks, zero remaining timers and an unsettled Promise. | U1: terminal cancellation settles even when no worker ever started. |
| R2 | P1 | `fileUtils.ts#batchGenerateContentForTitles`: child reporters copy `cancelled` and `abortController`. Start two pending LLM calls, cancel the parent, then complete responses. Both children still see `false`; two notes are modified and moved while the batch result says cancelled. | U1: a live shared cancellation lifetime reaches every child; late results cannot initiate writes/moves. |
| R3 | P1 | `llmUtils.ts#getAbortSignal` creates/stores a controller, but provider executors destructure only `controller` and pass the original optional `signal`. With no caller-supplied signal, cancelling the reporter does not call the mocked desktop request's `destroy`; rejection occurs only after a late response. | U1: pass the effective signal to every abortable transport; accurately document non-abortable host calls. |
| R4 | P1 | `fileUtils.ts#saveDiagramArtifactFile`: A snapshots/updates files and pauses at wrapper write; B saves successfully to the same paths; A's wrapper fails and its unconditional rollback restores old bytes over B. Rollback errors can also be swallowed. | U2: overlapping writes have one owner, failed operations cannot roll back another operation's output, and recovery failures remain visible. |
| R5 | P1 | `.github/workflows/` contains only `release.yml` and `deploy-docs.yml`; the former runs plugin tests after tag creation. Remote branch protection is unknown. | U3: a PR can fail on plugin regressions before merge/tagging, without credentials or publication privileges. |
| R6 | P2 | `generate-diagram-gallery.js#verifyCommittedGallery` compares SVG bytes but only checks PNG existence/signature; `buildGalleryManifest` records SVG hashes only. | U4: asset integrity and visual regression have separate explicit evidence; an unrelated valid PNG must fail integrity checking. |
| R7 | P2 | `currentMainProgressDocsContract.test.ts` asserts literal audit conclusions such as “no production dependency that can be removed safely.” | U4: tests assert executable facts and link/schema coverage; an updated engineering judgment does not require preserving a false conclusion. |
| R8 | P2 | No startup/preview-memory budget is established. Manifest permits mobile and declares Obsidian `0.15.0`; local tests mock host APIs. | U5: named host/device evidence and performance budgets precede packaging or support-range claims. |

Existing green tests explain the blind spots: `parallelBatch.test.ts` uses an always-false cancellation getter, the rollback test checks mock calls rather than competing stored state, and transport coverage does not establish this default-signal ownership path. Keep those tests, but add behavior-level cases at the real seams.

## Architecture Decisions To Keep Or Change

| Decision | Assessment | Practical direction |
|---|---|---|
| Provider registry plus five shared transports | Keep | Fix signal/retry ownership once; preserve protocol-specific streaming and partial diagnostics. More presets are not the main progress metric. |
| Semantic spec plus target projection | Keep | Validate external input at admission and trust internal invariants. Do not introduce a second semantic/presentation persistence model. |
| Single inline render bundle | Keep pending measurement | `main.js` is 10,056,115 bytes (3,728,761 gzip). This justifies profiling, not an automatic new loader/asset system. |
| History repository write queue | Correct bounded ownership | Apply the ownership principle to artifact persistence; do not assume a history queue serializes unrelated file writes. |
| Snapshot-based artifact rollback | Insufficient concurrency guarantee | It compensates a single invocation, but is not ACID storage. Avoid both blind restoration and a project-wide transaction framework. |
| Lexical MiniSearch retrieval | Keep as baseline | Candidate enumeration and serial file reads rebuild an index per retrieval construction; batch title generation already reuses one retriever. Measure corpus size/read cost and stale-batch behavior before introducing persistence. |
| Compatibility retention | Narrow by supported surface | Persisted schemas and command IDs deserve migration windows; private source re-exports are not public merely because tests import them. |
| Monolith shrinkage as a goal | Reject as a standalone goal | `NotemdSettingTab.ts` is about 4.1k lines, `main.ts` 3.3k, `llmUtils.ts` 3.2k and `fileUtils.ts` 2.4k. Extract only when a concrete invariant/dependency gains a real owner. |

## Direction And Completion Rules

1. **Next patch:** U1 cancellation, U2 persistence, U3 PR verification. Treat R1–R4 as known next-patch blockers; none are fixed by this documentation update.
2. **Next measured slice:** U4 evidence integrity and U5 host/performance characterization. Close the packaging investigation if the inline design meets a documented budget.
3. **Conditional admission:** U6 real consumer gates per target. Unavailable external tools limit their capability claims; they do not block unrelated correctness work.
4. **Product depth:** prefer U7 retrieval quality because it improves four existing task families. Choose U8 Office fidelity when export demand or concrete defect reports justify that cost. Do not run both as an unbounded feature-expansion program.

A plan closes when its finite requirement, implementation, regression evidence and documentation agree. An external gate closes only with a named application/tool version and retained artifacts. A deferred idea reopens only with a concrete use case, owner, acceptance test and maintenance budget. Keep release/history records dated; update this register and the current-progress summary instead of appending another competing global roadmap.
