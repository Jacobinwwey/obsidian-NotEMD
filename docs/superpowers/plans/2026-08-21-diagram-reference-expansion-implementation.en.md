# Diagram Reference Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add diagram-design-inspired layout capabilities without breaking the original 15 shipped types, Mermaid legacy files, target compatibility, or production preview evidence. The implementation now delivers 33 executable catalog rows while retaining those compatibility guarantees.

**Architecture:** Introduce variant-aware catalog lookup, a versioned canonical payload boundary, finite payload families, and profile-driven prompts. Native editable SVG adapters own geometry; Vega-Lite owns quantitative charts; HTML is the accessible fallback; reference layouts remain outside runtime until all evidence gates pass.

**Tech Stack:** TypeScript 5.9, Jest 29, esbuild, Mermaid 11, Vega-Lite 6, Playwright gallery generation, VitePress documentation, Obsidian plugin runtime.

## Execution Status (2026-08-21)

The runtime work for Batch 0 through Batch 3B is implemented in the current delivery. The detailed task checklists below remain the design decomposition; this status table is authoritative for completion and commit granularity.

| Phase | Status | Evidence |
|---|---|---|
| Batch 0 foundation | Complete | variant-aware catalog, schema-v2 payload boundary, prompt profiles, manifest metadata |
| Batch 1A topology | Complete | topology payload/renderer, 3 fixtures, SVG/PNG gallery output |
| Batch 1B data-flow and access matrix | Complete | lane-grid and access-matrix validators/renderers, 2 fixtures |
| Batch 2 quantitative and schedule | Complete | bar/line/scatter variants, quantitative projection, Gantt renderer |
| Batch 3A structural | Complete | ordered-stack, set-overlap, ranked-segments, cycle renderers |
| Batch 3B structural | Complete | nested, tree, process, medallion, high-level renderers |
| Final verification and mainline delivery | In progress | 270 Jest suites, 2,375 passed / 1 skipped; build/gallery/docs/render-host/i18n gates pass; Vault bundle reload/CLI evidence pending; lint remains baseline debt |

### Post-plan discoverability hardening (2026-08-22)

The original batches were complete, but the audit found that the UI still collapsed catalog rows back to semantic intents. This follow-up closes that contract gap:

- Settings and Workbench now expose all 33 catalog IDs; explicit `bar-chart`, `line-chart`, and `scatter-plot` rows are independently selectable and previewable.
- `preferredDiagramTypeId` is persisted as the stable catalog identity; `preferredDiagramIntent` remains an additive legacy projection for older settings.
- Operation planning carries the selected variant into prompt profile selection, planner target resolution, and generation; explicit quantitative variants force Vega-Lite/best-fit instead of silently degrading to Mermaid.
- `diagram.generate` accepts `requestedTypeId` at the maintainer boundary, with registry and help metadata derived from the same operation contract.
- Stale catalog IDs fall back to the legacy semantic intent; incompatible persisted target/type pairs clear to Auto before generation.

Evidence: focused variant/UI/operation/CLI tests pass; the full regression and release gates below must be rerun after this follow-up.

## Global Constraints

- Preserve the original 15 executable types, legacy Mermaid output, Drawnix/Circuitikz behavior, and old JSON inputs while adding the 18 new rows through additive contracts.
- Keep `ref/diagram-design` development-only; never bundle its screenshots, HTML assets, CDN fonts, or runtime APIs.
- Use `apply_patch` for edits and prefix repository commands with `rtk`.
- Keep semantic intent, catalog ID, layout profile, render target, and export format as separate axes.
- Validate once at parser/planner boundaries; renderer internals rely on validated payload invariants.
- Every shipped type requires a fixture, production preview, gallery assets, bilingual docs row, and automated tests.
- Unknown schema versions fail closed; unknown namespaced extension fields are preserved but never interpreted by renderers.
- Do not claim Draw.io, Drawnix, or Circuitikz compatibility without a real consumer gate.

---

### Task 1: Add variant-aware catalog identity

**Files:**
- Modify: `src/diagram/types.ts`
- Modify: `src/diagram/diagramTypeCatalog.ts`
- Modify: `src/diagram/diagramCapabilityManifest.ts`
- Test: `src/tests/diagramTypeCatalog.test.ts`
- Test: `src/tests/diagramCapabilityManifest.test.ts`

**Interfaces:**
- Consumes: existing `DiagramIntent`, `DiagramCatalogTypeId`, and `EXECUTABLE_DIAGRAM_TYPES`.
- Produces: `getDiagramType(id)`, `findDiagramType(intent, variant?)`, `findDefaultDiagramType(intent)`, and an ambiguity-safe compatibility wrapper.

- [x] **Step 1: Write failing tests** for two catalog rows sharing `dataChart`, explicit variant lookup, default lookup, and an ambiguity error from the legacy lookup.
- [x] **Step 2: Run the focused tests** with `rtk npm.cmd test -- --runInBand src/tests/diagramTypeCatalog.test.ts src/tests/diagramCapabilityManifest.test.ts`; expect failures because intent lookup is currently one-to-one.
- [x] **Step 3: Add `variant?: string` and `payloadKind` to the type definition**, replace the intent map with `Map<DiagramIntent, DiagramTypeDefinition[]>`, and keep all existing IDs unchanged.
- [x] **Step 4: Add the explicit lookup functions** and make the old lookup throw `AMBIGUOUS_DIAGRAM_INTENT` when multiple variants exist.
- [x] **Step 5: Extend manifest rows** with variant/layout/payload metadata while retaining `schemaVersion: 1` reader compatibility through an additive field policy.
- [x] **Step 6: Run the focused tests and `rtk npm.cmd run build`**; expected result is PASS with the existing catalog count unchanged.
- [x] **Step 7: Commit** with `git add src/diagram src/tests && git commit -m "refactor(diagrams): make catalog lookup variant aware"`.

### Task 2: Introduce canonical payloads and legacy normalization

**Files:**
- Create: `src/diagram/payloads/types.ts`
- Create: `src/diagram/payloads/legacyPayload.ts`
- Modify: `src/diagram/types.ts`
- Modify: `src/diagram/diagramSpecResponseParser.ts`
- Modify: `src/diagram/spec.ts`
- Test: `src/tests/diagramSpecResponseParser.test.ts`
- Test: `src/tests/diagramSpecValidation.test.ts`

**Interfaces:**
- Consumes: legacy `DiagramSpec` fields and the payload kind from Task 1.
- Produces: `VersionedDiagramSpec`, `DiagramPayload`, `normalizeLegacyDiagramSpec()`, and payload-family validation.

- [x] **Step 1: Add failing normalization tests** covering old `dataSeries`, `layoutHints.chartType`, timeline, swimlane, quadrant, radar, and circuit payloads.
- [x] **Step 2: Run those tests** with `rtk npm.cmd test -- --runInBand src/tests/diagramSpecResponseParser.test.ts src/tests/diagramSpecValidation.test.ts`; expect missing canonical payload failures.
- [x] **Step 3: Define discriminated payload interfaces** in `src/diagram/payloads/types.ts`; keep the first implementation limited to `legacy`, `quantitative`, `topology`, `lane-grid`, and `access-matrix` contracts needed by the staged roadmap.
- [x] **Step 4: Add `schemaVersion` and optional `payload`** while preserving the legacy projection for current callers.
- [x] **Step 5: Implement one parser boundary** that maps legacy fields to canonical payloads, normalizes numeric aliases, preserves evidence, and rejects unknown schema versions.
- [x] **Step 6: Make `validateDiagramSpec()` validate canonical payloads first** and legacy projections only after normalization. Do not scatter null checks into renderers.
- [x] **Step 7: Run focused tests, full build, and full Jest**; expected result is PASS with byte-identical Mermaid artifacts for existing fixtures.
- [x] **Step 8: Commit** with `git add src/diagram src/tests && git commit -m "feat(diagrams): add versioned canonical payload boundary"`.

### Task 3: Replace prompt conditionals with profile catalog

**Files:**
- Create: `src/diagram/prompts/diagramPromptProfileCatalog.ts`
- Modify: `src/diagram/prompts/diagramSpecPrompt.ts`
- Modify: `src/diagram/planner.ts`
- Test: `src/tests/diagramPrompt.test.ts`
- Test: `src/tests/diagramPlanner.test.ts`

**Interfaces:**
- Consumes: catalog `promptProfileId`, selected variant, target, and presentation defaults.
- Produces: `getDiagramPromptProfile(id)`, profile admission, and a common/profile-composed prompt.

- [x] **Step 1: Write failing tests** asserting every executable catalog row has one profile, profiles declare required fields and hard limits, and prompts contain source delimiters plus no renderer syntax request.
- [x] **Step 2: Run focused tests** with `rtk npm.cmd test -- --runInBand src/tests/diagramPrompt.test.ts src/tests/diagramPlanner.test.ts`; expect profile lookup failures.
- [x] **Step 3: Create the pure-data profile catalog** for all 33 catalog rows and the payload families; each profile must declare `version`, `payloadKind`, required fields, limits, semantic rules, target rules, and invalid examples.
- [x] **Step 4: Refactor `buildDiagramSpecPrompt()`** to compose common contract + selected profile + target/presentation rules, retaining exact circuitikz and Drawnix safety constraints.
- [x] **Step 5: Add source-note delimiters and explicit anti-invention rules** without changing existing language behavior.
- [x] **Step 6: Run focused tests and inspect generated prompts** for Mermaid/Drawnix/Circuitikz regression strings; then run `rtk npm.cmd run build`.
- [x] **Step 7: Commit** with `git add src/diagram src/tests && git commit -m "refactor(diagrams): drive generation prompts from profiles"`.

### Task 4: Add presentation and renderer admission contracts

**Files:**
- Create: `src/diagram/presentation.ts`
- Create: `src/rendering/renderTargetCatalog.ts`
- Modify: `src/rendering/rendererRegistry.ts`
- Modify: `src/rendering/types.ts`
- Modify: `src/diagram/diagramGenerationService.ts`
- Test: `src/tests/renderTargetCatalog.test.ts`
- Test: `src/tests/rendererRegistry.test.ts`

**Interfaces:**
- Consumes: canonical spec and existing renderer implementations.
- Produces: `DiagramPresentation`, target descriptors, preview mode admission, and duplicate renderer ownership checks.

- [x] **Step 1: Write failing matrix tests** for target descriptors, default presentation, missing preview mode, duplicate `(target, payloadKind)` ownership, and explicit incompatible-target rejection.
- [x] **Step 2: Run the focused tests** with `rtk npm.cmd test -- --runInBand src/tests/renderTargetCatalog.test.ts src/tests/rendererRegistry.test.ts`; expect failures because descriptor admission is incomplete.
- [x] **Step 3: Add descriptors** for all current targets without changing their public IDs; include MIME, extension, preview kind, export formats, and fallback policy.
- [x] **Step 4: Add registry admission** that rejects duplicate target ownership and a renderer that advertises unsupported preview behavior.
- [x] **Step 5: Thread presentation defaults through `RenderOptions`** without changing existing artifact cache identity unless a presentation value is explicitly supplied.
- [x] **Step 6: Run the focused tests, `rtk npm.cmd run audit:render-host`, and build**.
- [x] **Step 7: Commit** with `git add src/diagram src/rendering src/tests && git commit -m "feat(rendering): admit targets and presentation contracts"`.

### Task 5: Ship Batch 1A topology types

**Files:**
- Create: `src/diagram/payloads/topology.ts`
- Create: `src/diagram/adapters/editableSvg/topologyRenderer.ts`
- Modify: `src/diagram/diagramTypeCatalog.ts`
- Modify: `src/diagram/prompts/diagramPromptProfileCatalog.ts`
- Modify: `src/diagram/examples/diagramExampleCatalog.ts`
- Modify: `src/rendering/renderers/editableHtmlSvgRenderer.ts`
- Modify: `src/diagram/diagramCapabilityManifest.ts`
- Test: `src/tests/topologyPayload.test.ts`
- Test: `src/tests/topologyRenderer.test.ts`
- Test: `src/tests/diagramExampleCatalog.test.ts`

**Interfaces:**
- Consumes: canonical `topology` payload and presentation options.
- Produces: deterministic SVG for `architecture`, `current-state`, and `integration-topology` with HTML fallback.

- [x] **Step 1: Add failing payload tests** for zone bounds, stable node IDs, edge references, focal cap, and orthogonal routing constraints.
- [x] **Step 2: Add the production fixture for each of the three IDs** using the same catalog-owned fixture contract; no reference screenshots are copied.
- [x] **Step 3: Implement deterministic topology geometry** with zone layout, text wrapping, orthogonal connectors, stable SVG IDs, and light/dark token resolution.
- [x] **Step 4: Register the native renderer and compatible targets**; do not add Mermaid, Drawio, Drawnix, or Circuitikz compatibility.
- [x] **Step 5: Add preview/gallery tests** and update both support matrices.
- [x] **Step 6: Run `rtk npm.cmd run diagram:gallery` followed by `rtk npm.cmd run diagram:gallery:check`, build, full Jest, docs build, and i18n audit.
- [x] **Step 7: Append a bilingual progress entry** recording the three IDs, target claims, fixture hashes, and unavailable external consumers.
- [x] **Step 8: Commit** with `git add src docs scripts && git commit -m "feat(diagrams): add topology layout capabilities"`.

### Task 6: Ship Batch 1B data-flow and access matrix

**Files:**
- Create: `src/diagram/payloads/laneGrid.ts`
- Create: `src/diagram/payloads/accessMatrix.ts`
- Create: `src/diagram/adapters/editableSvg/laneGridRenderer.ts`
- Create: `src/diagram/adapters/editableSvg/accessMatrixRenderer.ts`
- Modify: catalog, prompt profiles, fixtures, manifest, preview and docs files from Task 5.
- Test: focused payload, renderer, preview, and gallery tests for both types.

**Interfaces:**
- Consumes: `lane-grid` and `access-matrix` canonical payloads.
- Produces: production SVG plus HTML table fallback; no Mermaid compatibility claim.

- [x] **Step 1: Write failing tests** for lane/step/cell bounds, empty-cell omission, focal handoff uniqueness, matrix role/component limits, closed permission levels, and focal-cell uniqueness.
- [x] **Step 2: Implement validators before renderers** so renderers can trust the invariants.
- [x] **Step 3: Implement fixed geometry** based on the reference formulas, including data-type chips and permission cell categories without accepting arbitrary renderer styles from the model.
- [x] **Step 4: Add fixtures, production previews, gallery assets, bilingual docs, and manifest rows.**
- [x] **Step 5: Run focused tests, gallery check, docs build, full build, full Jest, and `git diff --check`.**
- [x] **Step 6: Append progress in both languages and commit** with `feat(diagrams): add data-flow and access-matrix layouts`.

### Task 7: Ship Batch 2 quantitative variants and Gantt

**Files:**
- Create: `src/diagram/payloads/quantitative.ts`
- Create: `src/diagram/payloads/schedule.ts`
- Create: `src/diagram/adapters/editableSvg/scheduleRenderer.ts`
- Modify: `src/diagram/adapters/vega/vegaLiteAdapter.ts`
- Modify: catalog, planner, parser, prompt profiles, fixtures, manifest, preview and docs.
- Test: chart variant migration, Vega-Lite renderer, schedule renderer, and gallery tests.

**Interfaces:**
- Consumes: `quantitative.chartType` and `schedule` payloads.
- Produces: bar/line/scatter Vega-Lite artifacts, Gantt native SVG, and HTML table fallback.

- [x] **Step 1: Add failing migration tests** proving old `data-chart` and `layoutHints.chartType` remain readable.
- [x] **Step 2: Add chart caps and honest-data validation**; reject missing numeric data rather than inventing it.
- [x] **Step 3: Route explicit chart variants to the existing Vega-Lite adapter** and keep `data-chart` as auto/legacy.
- [x] **Step 4: Implement deterministic Gantt geometry** with phases, task bars, milestones, and no dependency arrows in v1.
- [x] **Step 5: Add fixtures, previews, gallery assets, bilingual docs, and support matrix rows.
- [x] **Step 6: Run full regression and commit** with `feat(diagrams): add quantitative variants and gantt`.

### Task 8: Ship Batch 3 structural layouts

**Files:**
- Create: `src/diagram/payloads/orderedStack.ts`, `setOverlap.ts`, `rankedSegments.ts`, `cycle.ts`
- Create: corresponding deterministic editable SVG adapters.
- Modify: catalog, prompt profiles, validators, fixtures, manifest, preview and bilingual docs.
- Test: one validator/renderer/preview/gallery suite per payload family.

**Interfaces:**
- Consumes: finite payload families for layer stack, Venn, pyramid/funnel, loop, nested, tree, process, medallion, and high-level.
- Produces: only types whose fixtures and geometry gates pass; unresolved candidates remain reference-only.

- [x] **Step 1: Admit only 2–4 IDs per batch** and reject layouts whose geometry requires an unbounded graph algorithm.
- [x] **Step 2: Implement each family with explicit budgets**: stack 4–6 layers, Venn 2–3 sets, ranked segments 4–6, loop 5–8 stations plus one hub.
- [x] **Step 3: Keep circular loop arcs as a documented type-specific exception**; all other non-axis connectors remain orthogonal.
- [x] **Step 4: Add production fixtures, preview/gallery evidence, bilingual docs, and progress entries.
- [x] **Step 5: Run all gates and commit each independently** so a failed family does not block already shipped families.

### Task 9: Final documentation, release evidence, and clean mainline

**Files:**
- Modify: `docs/brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.md`
- Modify: `docs/brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.zh-CN.md`
- Modify: `docs/diagram-gallery.md`
- Modify: `docs/diagram-gallery.zh-CN.md`
- Modify: `docs/architecture.md`
- Modify: `docs/architecture.zh-CN.md`

**Interfaces:**
- Consumes: generated gallery manifest, capability manifest, test outputs, and external consumer records.
- Produces: bilingual progress truth, support matrix, and a clean `main` branch.

- [x] **Step 1: Update progress after every batch**, separating shipped, partial, reference-only, and unavailable consumer evidence.
- [x] **Step 2: Run `rtk npm.cmd run diagram:gallery:check`, `rtk npm.cmd run docs:build`, `rtk npm.cmd run build`, `rtk npm.cmd test -- --runInBand`, `rtk npm.cmd run audit:i18n-ui`, and `rtk git diff --check`.
- [x] **Step 3: Confirm generated assets are current and `main.js` remains ignored/generated.
- [x] **Step 4: Run `rtk proxy git status --porcelain=v1 -b`; expected output is only `## main...origin/main`.
- [x] **Step 5: Commit documentation/release evidence** and push to `origin/main` only after all gates pass.

## Self-Review Checklist

- The plan covers catalog variants, canonical payloads, prompt profiles, presentation, renderers, preview/gallery, every staged reference family, bilingual docs, and clean mainline evidence.
- No step relies on a generic “implement later” placeholder; each task names files, interfaces, tests, commands, and expected outcomes.
- Existing IDs and public targets are preserved; new chart variants do not require a breaking migration.
- New fallback claims are explicit and do not imply Mermaid/Drawio/Drawnix interoperability without evidence.
