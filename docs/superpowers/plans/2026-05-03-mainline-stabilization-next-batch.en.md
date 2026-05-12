# Notemd Mainline Stabilization Next-Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current repo-truth audit into a stable execution batch that consolidates the diagram command surface, adds a sustainable maintainer-local semantic verification runbook, and defines the real packaging boundary for heavy render runtimes without regressing legacy Mermaid behavior.

**Architecture:** Treat this batch as a boundary-hardening pass, not a renderer-expansion pass. Keep `src/main.ts` orchestration-compatible for shipped commands, move command-surface decisions toward one canonical diagram pathway, document semantic verification outside CI, and keep heavy preview runtime isolation explicit until the build system actually enforces it.

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, npm scripts, GitHub Actions release workflow, Markdown documentation

---

## Problem Frame

The codebase now has a real diagram platform, but the remaining risks are boundary risks:

- command surfaces still expose three partially overlapping diagram entrypoints
- maintainer verification expectations still mix repo-enforced gates with historical one-off live proofs
- heavy runtime packaging is still described in terms of intent, not in terms of a delivered asset boundary
- Drawnix is now understood well enough to constrain scope, but not yet turned into an execution-level non-goal

This batch should therefore stabilize what already exists instead of expanding into new engines or host integrations.

## Roadmap Cross-Validation

Cross-checking against `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md` narrows the true next-batch scope further:

- the platform itself is no longer the thing to build
- the active gap is maturity at the command, verification, and packaging boundaries
- future expansion work should remain explicitly downstream of those boundaries

That means this plan is not a detour from the roadmap. It is the current execution form of the roadmap.

## Requirement Traceability

Source documents:

- `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md`
- `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.md`
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`

Carried-forward constraints:

- preserve legacy Mermaid usability while consolidating command surfaces
- do not describe heavy runtime isolation as complete until packaging boundaries are real
- keep Drawnix as a reference boundary, not a shipped dependency or embedded host
- keep `ref/` and other local analysis artifacts out of shipped scope

## Implementation Units

### Task 1: Command Surface Consolidation Plan

**Files:**
- Modify: `src/main.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/workflowButtons.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`
- Test: `src/tests/sidebarButtonTriggerChains.test.ts`
- Test: `src/tests/workflowButtons.test.ts`

- [x] **Step 1: Write failing tests for the intended stable command model**
Add coverage that describes the canonical command mapping, alias behavior, and the expected relationship between sidebar/workflow IDs and plugin command IDs.

- [x] **Step 2: Verify the focused failures**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts src/tests/workflowButtons.test.ts
```
Expected: FAIL for the new canonical-surface expectations.

- [x] **Step 3: Implement the smallest orchestration change**
Keep old IDs as compatibility aliases where needed, but route user-facing labeling and internal execution toward one coherent diagram surface.

- [x] **Step 4: Re-run focused tests**
Run the same command and confirm the new surface contract passes.

- [x] **Step 5: Re-check command documentation drift**
Update any user-facing strings or maintainer notes that still imply three independent long-term diagram commands.

### Task 2: Maintainer-Local Semantic Verification Runbook

**Files:**
- Create: `docs/maintainer/diagram-semantic-verification.md`
- Create: `docs/maintainer/diagram-semantic-verification.zh-CN.md`
- Modify: `docs/maintainer/release-workflow.md`
- Modify: `docs/maintainer/release-workflow.zh-CN.md`
- Test/Verify: `README.md`, `README_zh.md` only if wording needs alignment

- [x] **Step 1: Define the maintained semantic verification scope**
Document what must be checked locally when changes touch `src/diagram/`, `src/mermaidProcessor.ts`, or renderer behavior: Mermaid, JSON Canvas, and Vega-Lite sample flows.

- [x] **Step 2: Keep the runbook secret-free**
The runbook must not require tracked credentials, checked-in vault paths, or committed live test files. It should describe operator-owned setup and evidence capture, not automate unsafe local secrets.

- [x] **Step 3: Define evidence expectations**
Specify what counts as sufficient evidence: output file checks, screenshots, or saved artifacts, and how maintainers should record that evidence in release handoff or PR context.

- [x] **Step 4: Cross-link release workflow**
Make the release workflow document explicitly distinguish repo-enforced gates from maintainer-local semantic verification.

- [x] **Step 5: Check in a reusable helper**
Add a secret-free `npm run verify:diagram-semantics` helper that generates the Markdown checklist template, repo gates, vault-aware CLI checks, and Mermaid / JSON Canvas / Vega-Lite evidence sections without launching Obsidian or relying on tracked vault paths.

### Task 3: Runtime Packaging Boundary Audit

**Files:**
- Modify: `esbuild.config.mjs`
- Modify: `scripts/audit-render-host-bundle.js`
- Test: `src/tests/renderHostBundleAuditScript.test.ts`
- Test: any packaging-focused test already covering render host delivery
- Docs: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`

- [x] **Step 1: Write failing audit coverage for the intended boundary**
Describe the packaging fact you want to be true next, such as explicit heavy-runtime asset ownership or a clearer single-bundle guarantee.

- [x] **Step 2: Verify failure**
Run the focused packaging audit tests before changing build logic.

- [x] **Step 3: Implement the minimal packaging clarification or isolation step**
Either tighten the current single-bundle contract or introduce the first real multi-entry boundary. Do not claim more isolation than the build now proves.

- [x] **Step 4: Re-run audit and build checks**
At minimum:
```bash
npm run build
npm test -- --runInBand src/tests/renderHostBundleAuditScript.test.ts
npm run audit:render-host
```

- [x] **Step 5: Update roadmap wording to match the new reality**
Packaging still remains single-entry today. The roadmap and supporting docs now say that plainly: the current enforced boundary is a self-contained `srcdoc` host carried inside `main.js`, not a shipped standalone render-host asset package.

### Task 4: Drawnix Boundary Capture As A Stable Non-Goal

**Files:**
- Modify: `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- Modify: `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- Modify: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [x] **Step 1: Keep the code-backed conclusions explicit**
Preserve the verified evidence: Drawnix export model, browser file-system boundary, browser persistence, app-shell UI complexity, and lazy-loaded conversion modules.

- [x] **Step 2: Turn the research result into scope control**
Make the documents explicit that Drawnix integration is not the next batch, and that the only plausible near-future work is adapter/data-boundary experimentation after command/runtime stabilization.

- [x] **Step 3: Avoid accidental host creep**
Remove or rewrite any wording that implies full-host embedding is under active consideration for the next release batch.

## Ordered Execution Rule

This plan should be executed in this order unless a later code reality invalidates the sequence:

1. Task 1: command surface consolidation
2. Task 2: maintainer-local semantic verification runbook
3. Task 3: runtime packaging boundary audit
4. only after Tasks 1-3, resume any legacy prompt or MermaidProcessor reduction
5. only after those, reopen board-style export or advanced-engine exploration

## Test Strategy

Repo-enforced gates for this batch:

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

Focused regression surfaces:

- `src/tests/sidebarDomButtonClicks.test.ts`
- `src/tests/sidebarButtonTriggerChains.test.ts`
- `src/tests/workflowButtons.test.ts`
- `src/tests/renderHostBundleAuditScript.test.ts`

Maintainer-local semantic verification remains a separate recorded layer, not a CI replacement.

## Risks And Controls

- **Risk:** command consolidation accidentally breaks user muscle memory or workflow button bindings.
  **Control:** preserve alias behavior where needed and test sidebar/workflow routing explicitly.

- **Risk:** documentation claims outrun implementation again.
  **Control:** update plan, brainstorm, and maintainer docs in the same batch as code or audit changes.

- **Risk:** heavy-runtime packaging is described too optimistically.
  **Control:** only document boundaries that are enforced by build output and audit scripts.

- **Risk:** Drawnix scope creep distracts from stabilization work.
  **Control:** treat Drawnix only as a reference boundary until Tasks 1-3 are complete.

## Exit Criteria

- command-surface direction is encoded in tests and reflected in shipped command wiring
- a maintainer-local semantic verification runbook exists in both English and Simplified Chinese
- runtime packaging wording is aligned with what build output actually proves
- Drawnix is documented as a constrained future adapter/export reference, not an immediate host integration target
- full repo verification gates pass on the resulting branch

## Progress Update

This implementation plan is no longer purely forward-looking. The planned batch is now materially landed on `main` at the current scope:

- Task 1 is landed at the intended compatibility-preserving depth: canonical `generate-diagram` / `preview-diagram` workflow/sidebar IDs are live, user-visible wording is converged, and the legacy `*-experimental-diagram` tokens remain only as compatibility aliases.
- Task 2 is landed beyond prose-only status: the repo now ships `npm run verify:diagram-semantics`, and the maintainer runbooks plus release workflow docs are aligned to the same secret-free verification path.
- Task 3 is landed as a truth-tightening slice rather than true multi-entry isolation: the helper template and maintainer docs now explicitly record that `audit:render-host` proves the current single-entry `main.js` + inline `srcdoc` contract, not finished heavy-runtime isolation.
- Task 4 is landed as scope control: the roadmap/progress docs now keep Drawnix as a constrained future adapter/export reference instead of an active embedding target.
- The release-side CI hardening that supported this batch is also no longer theoretical: `repo-saga` chronicle refresh now has a checked-in package-manager runtime helper plus regression coverage so GitHub Actions can rebuild the upstream workspace even when `pnpm` is only reachable through `corepack`-style fallbacks.
- Follow-up hardening is now also landed for anti-drift durability: the semantic helper packaging checklist derives its entry/output facts from `esbuild.config.mjs`, tests lock that config alignment, and the package-manager fallback path now retries candidate runners (`pnpm`, `corepack pnpm`, `bun x pnpm`) per-execution to keep chronicle refresh resilient in CI.
- Additional semantic-helper hardening is now landed: packaging output-target status is explicitly tracked (`outfile` / `outdir` / `unknown` / `ambiguous`), parser coverage now includes backtick literals, and parsing now scopes to `esbuild.context({...})` options so decoy same-name keys in the file cannot silently skew boundary facts.
- Stage-B contract-definition progress is now also executable: the semantic helper template includes a `Packaging Contract` section that derives required release assets from `scripts/release/publish-github-release.js`, keeps the dual-language release-note file contract explicit, records numeric-tag plus create/upload mode contract truth, and verifies tag-only release workflow trigger guardrails from `.github/workflows/release.yml` in maintainer verification.
- Stage-B contract-promotion boundaries are now also executable: the helper template includes a `Contract Promotion Boundary` section that derives workflow/settings/export-adjacent operation constraints from `src/operations/registry.ts`.
- Stage-B contract-promotion coverage is now widened in a CI-safe slice: helper tracking now also includes selection/config-adjacent metadata (`editor.create-link-and-generate`, `file.process-*`, `concept.extract-*`), and registry parsing now tolerates mixed quote literals with regression tests so operation-truth extraction is less brittle.
- Stage-B anti-drift tightening continues: contract-promotion tracking now expands wildcard prefixes (`file.process-*`, `concept.extract-*`) from live registry IDs with stable fallback IDs, reducing manual list churn while keeping checklist generation deterministic when registry loading fails.
- Stage-B release-trigger guardrail checks are now less YAML-format fragile: workflow tag parsing accepts mixed quote styles in `tags:` entries and explicitly treats `v*.*.*` wildcard patterns as contract violations.
- Stage-B release-trigger checks now also tighten scope: tag trigger detection is constrained to `on.push.tags`, preventing unrelated `tags:` keys in other workflow sections from producing false contract signals.
- Stage-B release-trigger parsing now also handles compact inline push forms (`push: { tags: [...] }`) in addition to multiline YAML blocks, so format-only compaction keeps contract checks stable.
- Stage-B release-trigger parsing now also handles fully inlined top-level `on` objects (for example `on: { push: { tags: [...] }, workflow_dispatch: {} }`), preserving trigger-guard checks under compact workflow declarations.
- Stage-B release-trigger parsing now also detects `workflow_dispatch` from `on` sequence/inline-array event forms (for example `on` with `- workflow_dispatch`, or `on: [push, workflow_dispatch]`), reducing drift from event-declaration style rewrites.
- Stage-B release-trigger parsing now also supports `on` sequence push-mapping forms (for example `- push:` with nested `tags`), keeping tag-trigger contract checks stable across alternate event-list YAML styles.
- Stage-B release-trigger parsing now also accepts quoted YAML keys for both event declarations and nested trigger keys (for example `'push':`, `"tags":`, `'workflow_dispatch':`), reducing format-only drift from key-quoting normalization.
- Stage-B regression coverage now explicitly locks quoted inline top-level `on` object declarations (for example `'on': { 'push': { "tags": [...] }, "workflow_dispatch": {} }`) so compact quoted forms remain contract-stable.
- Stage-B release-trigger parsing now also handles `on` sequence workflow-dispatch mapping forms (for example `- workflow_dispatch: {}` and `- 'workflow_dispatch': {}`), reducing drift from sequence-map event declarations.
- Stage-B release-trigger detection now also scopes workflow event-key matching to top-level `on` mappings, preventing nested non-event keys (for example `workflow_call.inputs.workflow_dispatch`) from generating false positives.
- Stage-B inline push-trigger parsing now only trusts top-level `push.tags` keys, preventing nested keys (for example `push.filters.tags`) from generating false release-tag trigger signals.
- Stage-B multiline push-trigger parsing now only trusts first-level `push` mapping keys for `tags`, preventing nested blocks (for example `push.filters.tags`) from generating false release-tag trigger signals.
- Stage-B multiline `push.tags` parsing now only trusts direct list-item shapes, preventing nested structures (for example `push.tags.include` lists) from generating false release-tag trigger signals.
- Stage-B release-trigger parsing now also handles `on` sequence inline-object event mappings (for example `- { push: { tags: [...] }, workflow_dispatch: {} }`) while still ignoring nested non-event keys inside those inline objects.
- Stage-B release-trigger parsing now also handles inline `on` array object items (for example `on: [{ push: { tags: [...] } }, { workflow_dispatch: {} }]`) while still ignoring nested non-event keys inside those object items.
- Stage-B release-trigger parsing now also handles multiline flow-style top-level `on` objects (for example first line `on: {` followed by event mappings on next lines) while still ignoring nested non-event keys.
- Stage-B release-trigger parsing now also handles multiline flow-style top-level `on` objects whose opening line includes a trailing comment (for example `on: { # ...`), preserving trigger checks under comment-annotated compact declarations.
- Stage-B `push.tags` parsing now treats comment-only key-line values (for example `tags: # ...`) as multiline tag-list declarations, preventing both top-level and sequence `push` mappings from losing `*.*.*` trigger detection due inline-comment formatting.
- Stage-B release-workflow fallback wording now remains contract-explicit: when workflow inspection cannot resolve trigger facts, checklist text still records expected trigger and tag-guard truths instead of only saying inspection is incomplete.
- Stage-B regression coverage now also locks mixed quoted-key sequence/object hybrid trigger declarations in one workflow, including nested non-event noise guards, so contract extraction remains top-level scoped under representation churn.
- Stage-B `on`-key parsing now also treats comment-only key-line values (for example `on: # ...`) as trigger-block declarations, preserving both mapping and sequence trigger detection under inline-comment formatting.
- Stage-B release-trigger parsing now also supports multiline flow-style `on` arrays by collecting continuation lines until closure, keeping top-level trigger extraction stable for both scalar event items and inline object event items.
- Stage-B `push.tags` parsing now also supports multiline flow-style arrays by collecting continuation lines until closure, keeping numeric-tag trigger detection and v-prefixed wildcard guard behavior stable for both top-level and sequence `push` mappings.
- Stage-B `push` flow-object parsing now also normalizes comma-delimited `tags` field values (for example `tags: ["*.*.*"],`), preventing field-delimiter formatting from masking numeric-tag detection or v-prefixed wildcard guard behavior.
- Stage-B multiline flow-style `push.tags` continuation parsing now also normalizes closure-line field-delimiter commas (for example `],` inside `push: { ... }`), preventing compact flow-object formatting from masking numeric-tag detection or v-prefixed wildcard guard behavior.
- Stage-B mixed quoted-key sequence/object hybrid regression coverage now also locks multiline `push` flow-object `tags` arrays whose closure line carries `],`, while preserving nested non-event noise guards.
- Stage-B release packaging-contract checks now also encode explicit `outfile -> outdir` transition readiness truth: checklist output is anchored to current `esbuild.config.mjs` output-target facts and now requires explicit `main.js` release-asset ownership plus same-batch release-helper test/docs updates before migration-readiness claims.
- Stage-B contract-promotion checks now also encode a Stage-B2 runtime-isolation precondition map for workflow/settings/export-adjacent operation IDs, keeping runtime-isolation promotion claims blocked until Stage-C runtime-boundary implementation is actually landed and verified.
- Stage-B implementation-readiness checks now also encode explicit multi-entry candidate contract truth: helper output includes an `Implementation Readiness Contract` section anchored to current `esbuild.config.mjs` single-entry facts, keeping multi-entry/dedicated-asset direction as pre-implementation contract language until Stage-C runtime-boundary delivery is proven.

The remaining work after this plan is therefore not “finish creating the runbook” or “finish the first packaging clarification.” Those pieces now exist. The remaining work is to preserve that checked-in truth while deciding whether the next real implementation step is heavy-runtime packaging isolation or a later contract-promotion slice.

## 2026-05-10 Concrete Convergence Execution Blueprint

To keep CI stable while moving from convergence hardening toward packaging-boundary implementation, execution should now be explicitly staged:

1. **B1 parser/contract closure slices (short cycle)**
   - keep changes scoped to semantic helper + focused tests + bilingual docs
   - require fail-first trigger-shape fixtures before parser edits
   - preserve the full repo gate chain per landed slice
2. **B2 implementation-readiness contracts (mid cycle)**
   - write an explicit multi-entry candidate contract against `esbuild.config.mjs`
   - define release-helper migration contracts for output-target transitions
   - mark which promotion claims are blocked on runtime-isolation preconditions
3. **C0 runtime-boundary start gate (later)**
   - only after B2 contracts are testable and documented
   - land minimum viable multi-entry/dedicated-asset split
   - update audits/helper/docs in the same batch before any release-facing claim

This blueprint keeps the current anti-drift momentum without converting Stage-C runtime work into uncontrolled CI risk.

## 2026-05-10 Stage-B2 Progress Alignment Update

The plan now has a concrete Stage-B2 landing artifact, not only a staged intention:

- `docs/brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.md`
- `docs/brainstorms/2026-05-10-multi-entry-candidate-contract-and-stage-c-gate.zh-CN.md`

This closes the execution-level planning gap between:

1. current build/audit/release truth (`main.js`-anchored single-entry delivery)
2. future Stage-C runtime-boundary implementation intent (candidate `outfile -> outdir` transition with dedicated asset ownership)

As a result, this plan should now treat Stage-B2 as:

1. a contract-to-test conversion phase (fail-first fixtures + migration contract deltas)
2. a strict prerequisite gate before any runtime packaging topology edits

Mainline discipline remains unchanged:

- keep slices atomic
- run full repo gates before each landing
- keep docs/tests/helper truth synchronized in the same batch

## 2026-05-10 Stage-B2 Contract-To-Test Slice (Landed)

Execution has moved from Stage-B2 contract prose into executable safeguards:

1. implementation-readiness checklist wording is now entrypoint-count aware for multi-entry candidate facts
2. `outfile -> outdir` candidate promotion now explicitly requires an `audit:render-host` contract delta definition first
3. regression tests now lock both constraints in `src/tests/diagramSemanticVerificationScript.test.ts`

This keeps the plan aligned with the same CI-safe rule: encode contract truth into fail-first tests before runtime-boundary topology changes.

Latest Stage-B2 hardening also landed:

1. release-contract checklist now blocks `outfile -> outdir` migration promotion when required release assets do not include `main.js`
2. implementation-readiness checklist now mirrors the same block condition until replacement ownership contracts/tests/workflow checks/docs are landed together
3. regression tests lock both guardrails to prevent silent release-helper asset-list drift from weakening migration gates
4. release-helper runtime enforcement now includes `validateRequiredReleaseAssets()` and fails fast when `main.js` is missing from required assets, with dedicated coverage in `src/tests/githubReleaseWorkflow.test.ts`
5. semantic-helper release-contract checks now verify that runtime ownership guard is active and emit explicit incomplete-inspection wording when it cannot be confirmed
6. runtime ownership-guard detection is now structurally keyed (`RELEASE_ASSET_OWNERSHIP_GUARD_CODE` / `isReleaseAssetOwnershipGuardError`) with legacy message matching only as fallback, reducing wording-coupled drift risk in helper verification

## 2026-05-11 Cross-Track Alignment Update

An additional stabilization slice is now landed on `main` for folder-task processing consistency:

1. a shared folder-task file selector contract is introduced (`src/folderTaskFileSelector.ts`) and wired into process/extract/translate/fix folder paths.
2. compatibility behavior is preserved by default via `includeSubfolders = legacy`, keeping translation non-recursive unless explicitly configured otherwise.
3. filter semantics (`none|contains|regex|glob`, `relativePath|basename`, case-sensitivity, invert) are now settings-driven and regression-locked.
4. progress and architecture comparison are persisted in:
   - `docs/brainstorms/2026-05-11-folder-task-file-filtering-progress-and-architecture-alignment.md`
   - `docs/brainstorms/2026-05-11-folder-task-file-filtering-progress-and-architecture-alignment.zh-CN.md`

This remains aligned with the plan’s stabilization philosophy: consolidate boundaries, prevent drift, and avoid unrelated runtime-packaging scope expansion in the same slice.

### 2026-05-11 Extension (Contract + UX Hardening)

The same folder-task track advanced in two additional CI-safe increments:

1. operation contract parity is now complete for original-text folder workflows via `content.batch-extract-original-text` in `src/operations/registry.ts`, with contract/capability coverage in `operationsRegistry`, `cliContracts`, and `cliCapabilityManifest` tests.
2. settings UX hardening now adds explicit regex/glob syntax guidance and non-blocking early regex validation notices under folder-task filtering (`src/ui/NotemdSettingTab.ts`).
3. i18n and settings-audit coverage were extended in the same slice, preserving locale-safe behavior while reducing delayed pattern-failure discovery.
4. regex precheck semantics are now converged through a shared selector-layer helper (`getFolderTaskRegexValidationError`), and host-adapter tests now lock batch-extract override behavior plus base-settings non-mutation guarantees.

## 2026-05-11 Release-Alignment Update (1.8.7)

Mainline stabilization now includes a release-boundary convergence milestone for this track:

1. version boundary synchronized to `1.8.7` across package metadata, manifest compatibility map, changelog, README markers, and welcome-modal latest-two digest (`1.8.7`/`1.8.6`);
2. bilingual release notes now capture the finalized contract-level behavior for folder-task filtering, operation-level overrides, and shared regex validation semantics;
3. progress docs now include deep comparison against prior plan requirements, explicit architecture-advancement status, residual-risk controls, and post-release direction;
4. this remains within the stabilization-only envelope and does not broaden into runtime packaging topology changes.

Plan-status interpretation after `1.8.7`:

1. folder-task filtering convergence is now release-complete for the current scope;
2. next critical path remains packaging / semantic-verification convergence under existing Stage-B2 guardrails;
3. CI discipline remains unchanged: full gates required before each mainline landing.

## 2026-05-12 Release-Chronicle CI Hardening Alignment Update

Mainline stabilization now also includes a release-ops recovery hardening slice, and the evidence is specific:

1. the actual failure in `Release` run `25675613652` was not build/test packaging drift; `publish` passed, while `refresh_chronicle` failed at `git push origin HEAD:main` with a remote `500 Internal Server Error`
2. that failure path is now repository-owned in `scripts/release/commit-chronicle-refresh.js`, with tracked+untracked chronicle detection, bounded push retries, remote-contains-commit recovery, and fetch/rebase retry handling
3. workflow anti-drift coverage now locks both the helper behavior and the YAML contract in `src/tests/commitChronicleRefreshScript.test.ts` and `src/tests/githubReleaseWorkflow.test.ts`
4. the repaired remote replay `25718241272` completed successfully end-to-end, including `refresh_chronicle`

Plan interpretation:

1. this advances the stabilization plan at the release-automation boundary, not at the runtime-packaging boundary
2. it uses the same landing rule already required elsewhere in this plan: checked-in truth, regression lock, bilingual maintainer-doc sync, then real workflow validation
3. next critical-path work still remains Stage-B2 packaging / semantic-verification convergence; this slice should not be misread as a Stage-C topology start

## 2026-05-12 Sidebar API Observability Alignment Update

Mainline stabilization now also includes a product-side observability hardening slice, and the boundary is explicit:

1. the footer `Log output` area now exposes a quick `Deep debug` toggle wired directly to `enableApiErrorDebugMode`, reducing debug friction during live support triage
2. sidebar progress now includes a typed API liveness indicator backed by runtime events (`request-start`, `response-headers`, `response-chunk`, `request-complete`, `request-error`)
3. retry semantics are now explicit at the UI boundary via `retrying: true/false`, preventing transient attempt failures from flashing as terminal interruptions
4. concurrent and batch/folder request paths are now request-keyed and aggregation-safe because runtime events carry stable `requestId` continuity across retries, sidebar state derives from a request map instead of only counts, and batch mini-reporters forward liveness events back to the primary reporter
5. deep debug mode now emits structured per-request liveness lines (`requestId`, logical request attempt, phase, transport, status when known) so support work no longer has to infer retry boundaries from generic progress logs
6. sidebar now exposes a first request-scoped API activity surface plus copyable activity report derived from the same live liveness record model, so support work no longer has to reconstruct the chain only from raw logs
7. the concrete deep-comparison progress artifact for this slice is now checked in at:
   - `docs/brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.md`
   - `docs/brainstorms/2026-05-12-sidebar-api-observability-progress-and-architecture-alignment.zh-CN.md`

Plan interpretation:

1. this is a stabilization/operability boundary hardening slice, not a packaging-topology slice
2. it remains aligned with the same repo truth rule used elsewhere in this plan: typed contract, focused tests, full gates, bilingual doc sync
3. next deeper work should extend per-request observability depth from this landed report/drill-down baseline rather than adding more global UI state branches, because `requestId`, acceptance-vs-body distinction, baseline structured liveness traces, and the first export surface are now already landed
