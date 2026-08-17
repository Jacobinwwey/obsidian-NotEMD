---
date: 2026-08-16
last_updated: 2026-08-17
topic: diagram-capability-catalog-and-forward-architecture
status: active
canonical_for:
  - diagram-capability-catalog
  - diagram-rendering-forward-architecture
supersedes: []
superseded_by: null
implementation_record: null
---

# Diagram Capability Catalog And Forward Architecture

## Decision Summary

Notemd must expose a capability catalog that is derived from executable runtime definitions. The catalog has three independent axes:

1. **Semantic type**: what the reader is meant to understand.
2. **Render target**: which editable or generated artifact is produced.
3. **Export format**: how a rendered artifact is delivered (`SVG`, `PNG`, `PDF`).

These axes must not be collapsed into a single enum. The reference project in `ref/diagram-design` has a useful 27-type visual taxonomy, but Notemd does not currently implement those layouts. Reference-only types remain candidates until they have a semantic contract, renderer, fixture, preview, persistence mapping, documentation, and automated gate.

## Current Baseline And Risks

The current domain already has an executable ten-type catalog in `src/diagram/diagramTypeCatalog.ts` and one fixture per type in `src/diagram/examples/diagramExampleCatalog.ts`. The settings gallery can render those fixtures through the production renderer, but it only exposes a preview action and does not provide thumbnails in the generation workflow or a generated documentation gallery.

The following defects must be resolved before expanding the selector:

- `src/main.ts` writes sanitized and full settings in two consecutive `saveData` calls. The second write can re-persist provider credentials that were intended to remain device-local.
- `src/diagram/diagramGenerationService.ts` can return the pre-retry `spec` or a target that no longer matches the retried artifact.
- `editable-html-svg` returns HTML without `previewSvg`, while the README promises SVG/PNG/PDF export for it. This causes the preview and CLI export paths to fail closed.
- Target-to-MIME, extension, preview, and export decisions are repeated in separate switches. `editable-html-svg` currently falls back to `.txt` in one save path and `.html` in another.
- The LLM cache key omits endpoint, transport, sampling/reasoning settings, configuration revision, and tenant identity; the global `Map` is unbounded.
- `OperationSchema = Record<string, unknown>` is documentation, not validation. Registry requirements and maintainer CLI arguments currently drift.

These are boundary defects, not cosmetic cleanup. Adding more visual types before fixing them increases the number of invalid combinations and makes backward compatibility harder.

## Target Contracts

### Semantic type

Evolve `ExecutableDiagramTypeDefinition` into a complete `DiagramTypeDefinition` in `src/diagram/diagramTypeCatalog.ts`:

```ts
interface DiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    semanticPattern: string;
    promptProfileId: string;
    visualRoles: readonly string[];
    defaultTarget: RenderTarget;
    compatibleTargets: readonly RenderTarget[];
    exampleFixtureId: string;
}
```

IDs are stable persistence identifiers. Renaming a label is additive; renaming an ID requires an explicit alias/migration. Deprecated types remain readable for old artifacts but leave new selectors.

### Render target

Create one authoritative target descriptor, preferably in `src/rendering/renderTargetCatalog.ts`:

```ts
interface RenderTargetDescriptor {
    target: RenderTarget;
    rendererId: string;
    mimeType: string;
    sourceExtension: string;
    previewKind: 'iframe' | 'svg-companion' | 'source-only';
    exportFormats: readonly DiagramExportFormat[];
    consumerGate: 'none' | 'manual' | 'native-compile';
    fallbackPolicy: 'strict' | 'explicit';
}
```

All save, preview, export, CLI, and capability-manifest code must consume this descriptor. `SVG`, `PNG`, and `PDF` are export formats, never render targets.

### Example fixture

Extend `DiagramExampleDefinition` with `altText`, a stable `selectionRationale`, and a fixture schema version. Fixtures remain executable TypeScript data; documentation and thumbnails are generated from them. Hand-authored duplicate examples are prohibited.

### Capability manifest

Generate a versioned manifest for UI, CLI, and docs:

```ts
interface DiagramCapabilityManifest {
    schemaVersion: 1;
    generatedAt?: string;
    types: readonly DiagramTypeCapability[];
    renderTargets: readonly RenderTargetCapability[];
    exportFormats: readonly ExportFormatCapability[];
    examples: readonly DiagramExampleCapability[];
}
```

`generatedAt` must be omitted from tracked output or normalized to keep diffs deterministic. Unknown manifest versions are preserved by readers and never guessed into a newer schema.

## Phased Implementation Plan

### Phase 0: Correctness foundation

**Files:** `src/main.ts`, `src/diagram/diagramGenerationService.ts`, `src/rendering/renderers/editableHtmlSvgRenderer.ts`, `src/rendering/preview/previewExport.ts`, `scripts/export-diagram-artifact.js`, `src/fileUtils.ts`, `src/llmUtils.ts`.

1. Replace the settings double-write with one sanitized persistence operation and add a regression test asserting that local-only secrets do not reach `data.json`.
2. Make the retried `spec`, `target`, MIME, extension, and content authoritative as one `RenderArtifact` value. A failed retry must return the original artifact or a typed failure, never a mixed result.
3. Return `previewSvg` from `EditableHtmlSvgRenderer.render()` using the existing semantic SVG model. Add renderer, generation, modal/export, and CLI tests for SVG/PNG/PDF.
4. Introduce the target descriptor and delete duplicated extension/MIME/preview switches. Add a matrix test that every target has one descriptor and that every advertised export has a producer.
5. Replace the cache key with a versioned canonical request fingerprint. Include provider ID, transport, endpoint, model, prompt/content hash, temperature, top-p, reasoning/thinking settings, max tokens, and configuration revision. Add bounded size and TTL eviction; do not include raw credentials.

**Gate:** targeted Jest tests fail before each fix and pass after it; `npm run build`; full Jest suite.

### Phase 1: Three-axis executable catalog

**Files:** `src/diagram/diagramTypeCatalog.ts`, `src/diagram/types.ts`, new `src/rendering/renderTargetCatalog.ts`, `src/diagram/examples/diagramExampleCatalog.ts`.

1. Add `defaultTarget` and `compatibleTargets` to each type. Reject incompatible requested combinations at the planner boundary.
2. Add target descriptors for all eight current targets: `mermaid`, `json-canvas`, `vega-lite`, `html`, `editable-html-svg`, `drawio`, `drawnix`, `circuitikz`.
3. Keep the ten shipped semantic types: Mermaid mindmap, Drawnix knowledge map, flowchart, sequence, state, class, entity-relationship, canvas map, data chart, and circuit.
4. Require every shipped type to own one fixture and one production-renderer preview.

**Gate:** catalog invariants, compatibility matrix, fixture coverage, and stable-ID tests.

### Phase 2: Runtime contracts and manifest

**Files:** `src/operations/registry.ts`, `src/operations/contractSchemas.ts` (new), `src/operations/capabilityManifest.ts` (new), `scripts/invoke-maintainer-cli-operation.js`, `scripts/export-diagram-artifact.js`.

The first contract-hardening slice is delivered: `src/operations/contractSchemas.ts` admits JSON-compatible schema shape, `src/cliContracts.ts` rejects malformed registry schemas before export, and `src/maintainerCliBridge.ts` validates host-bound inputs while ignoring unknown legacy fields for forward compatibility. Keep `diagram.generate` aligned around `sourceMarkdown` for the host-neutral core; `sourcePath` remains an explicit host adapter input rather than silently becoming the same contract. `local-knowledge.inspect` remains a maintainer host operation, not a public registry operation, until a host-neutral implementation and safety metadata exist.

The remaining Phase 2 work is deliberately narrower: validate operation result values at the runtime boundary and derive maintainer help metadata from the same schema only where that does not erase human-facing examples or compatibility notes. `OperationSchema` remains a structural TypeScript record for now; the executable admission/validation layer is the runtime authority.

**Gate:** invalid arguments fail before provider calls; registry, CLI, and generated manifest agree byte-for-byte on names and required fields.

### Phase 3: Deterministic preview gallery

**Files:** `src/ui/diagramExampleGallery.ts`, new `scripts/generate-diagram-gallery.js`, new `scripts/lib/diagram-gallery-runtime.js`, `docs/assets/diagrams/` (generated), `docs/maintainer/diagram-capability-catalog.*`.

Use the existing executable fixtures and production renderers. The generator should:

1. Build a temporary browser bundle in `.cache/diagram-gallery/`.
2. Render each fixture through the same preview path used by Obsidian.
3. Capture deterministic SVG and PNG thumbnails with stable filenames based on fixture IDs.
4. Emit the versioned capability manifest and remove stale generated assets.
5. Fail if a shipped type has no preview, if a filename changes unexpectedly, or if the generated manifest differs from the checked-in catalog.

The in-app gallery should gain an inline thumbnail, target/export badges, and a direct “use this type” action in the generation selector. Keep the existing eye-button preview as a keyboard-accessible fallback.

**Gate:** Playwright/browser smoke test at desktop and narrow widths; no network requests from generated previews; all SVGs have `role="img"`, `<title>`, `<desc>`, and stable IDs.

### Phase 4: Bilingual docs and discovery

**Files:** `README.md`, `README_zh.md`, `docs/README*`, `docs/index*`, `docs/.vitepress/config.mts`, `docs/maintainer/diagram-capability-catalog.*`.

Generate the support matrix from the manifest. Separate “shipped”, “partial”, and “reference-only/planned” rows. Link every shipped type to its preview image and fixture ID. Do not claim Draw.io, Drawnix, or Circuitikz external interoperability without the corresponding consumer gate.

### Phase 5: Candidate admission from `diagram-design`

Reference-only candidates include timeline, swimlane, quadrant, radar, loop, nested, tree, org chart, layer stack, Venn, pyramid/funnel, Gantt, scatter, high-level, process, medallion, data flow, DP integration, and DP security matrix. They are not runtime types today.

A candidate can enter the shipped catalog only when it has:

- a semantic intent and bounded input schema;
- a renderer or explicit target mapping;
- deterministic fixture and preview;
- persistence/upgrade behavior;
- bilingual docs and generated support row;
- automated rendering/export tests;
- real consumer evidence when the target depends on an external application.

Prefer implementing `timeline`, `swimlane`, and `quadrant` as new semantic/target slices only after the convergence work is complete. Radar is explicitly blocked until Vega-Lite support is added; a label-only alias would be misleading.

### Phase 6: Convergence and release gates

Execute the active Mermaid normalization plan after Phase 0 and catalog contracts. Then remove Drawnix geometry duplication, decide the fate of the unwired Circuitikz repair loop, and ratchet CI around `npm run build`, Jest, render-host audit, generated-gallery freshness, and `git diff --check`.

External gates remain separate from unit tests:

- Draw.io: open the generated XML in diagrams.net.
- Drawnix: open/import the real `.drawnix` file and inspect the filename-rooted tree.
- Circuitikz: compile native TeX with the pinned toolchain.

## Tradeoffs And Rejected Alternatives

- **Copy the 27 reference types now:** rejected. It would create selector entries with no renderer or persistence contract.
- **Use one `DiagramKind` enum for type, target, and export:** rejected. It creates invalid combinations and makes compatibility migrations ambiguous.
- **Hand-author a second docs gallery:** rejected. It will drift from executable fixtures and renderer behavior.
- **Parse SVG out of HTML at export time:** rejected. It is fragile and changes the artifact boundary. Return an explicit companion SVG from the renderer instead.
- **Expand the LLM prompt to “choose any layout”:** rejected. Semantic intent and target compatibility belong to typed planning, not unconstrained prompt text.
- **Treat all external consumer checks as CI-only:** rejected. Real Draw.io/Drawnix/TeX consumers are compatibility evidence that mocks cannot provide.

## Definition Of Done

The work is complete only when the catalog, runtime manifest, in-app selector, generated docs gallery, and README matrix are derived from the same definitions; unsupported reference types are visibly marked as planned; old IDs and artifacts remain readable; all advertised exports have a tested producer; and build, Jest, browser, external-consumer, and clean-worktree gates have current evidence.
