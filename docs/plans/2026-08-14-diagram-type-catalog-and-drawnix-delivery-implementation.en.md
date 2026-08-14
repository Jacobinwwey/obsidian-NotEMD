# Diagram Type Catalog And Drawnix Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for inline task-by-task implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an executable diagram type catalog and let Drawnix Knowledge Map users switch in one action between the compatibility full-board delivery and a separate presentation delivery.

**Architecture:** Keep `DiagramSpec` as the semantic boundary. The catalog resolves a type to a dedicated prompt and renderer operation. Full-board and presentation delivery use separate projections and artifacts; the UI chooses one operation. New Drawnix metadata stores a validated semantic replay record so the alternate delivery can be rebuilt without another LLM call.

**Tech Stack:** TypeScript, Jest, Obsidian plugin APIs, existing Drawnix JSON subset, SVG, Playwright consumer tests, VitePress documentation.

## Global Constraints

- Preserve the existing Mermaid `mindmap` command, renderer, prompt, cache, fallback, and repair behavior.
- Preserve valid Drawnix hierarchy, stable IDs, relation endpoints, source-visual metadata, and no-semantic-quota policy.
- Do not add Drawnix, Plait, or React runtime dependencies to the production plugin bundle; consumer integration is test-only.
- Do not add a `full`/`presentation` flag to a shared layout function. Expose separate operations and result types.
- Legacy settings without the new preference select full board. Legacy `.drawnix` artifacts remain readable.
- Do not advertise reference-only visual types in settings or the example gallery.
- Keep documentation paired in English and Chinese under `docs/`.

---

## Implementation Status (2026-08-14)

The task steps below preserve the original execution sequence. Their unchecked boxes are not a completion signal; the task headings and this record are the current source of truth.

| Task | State | Delivered boundary |
|---|---|---|
| 1. Executable type catalog | Implemented | Catalog-owned intent, renderer, example, and compatibility resolver; missing or invalid delivery settings resolve to `full-board`. |
| 2. Semantic input split | Implemented | Drawnix owns a dedicated prompt and multi-root source-coverage policy; Mermaid `mindmap` stays isolated. |
| 3. Independent projections | Implemented | Full board and presentation use different projection operations; presentation centers fitting overview grids, scopes detail relation context, and recursively turns an over-wide child hierarchy into bounded continuation slices with a fidelity ledger. |
| 4. Replay and persistence | Implemented | Namespaced replay metadata and transactional presentation bundles preserve legacy `.drawnix` readability. |
| 5. One-click selection | Implemented | Settings choose the next delivery; preview can replay the alternate delivery in memory without an LLM call or file write. |
| 6. Consumer and regression gates | Implemented and verified | Pinned test-only Plait ESM consumer harness, CLI coverage, visual invariants, and legacy/Mermaid isolation tests are present. |

### Verification Record (2026-08-14)

- `npm run build`: PASS.
- `npm test -- --runInBand`: PASS, 251 suites; 2,201 tests passed and 1 was skipped. Provider transport retry fixtures emit expected warning/error logs.
- `npm run docs:build`: PASS.
- `git diff --check`: PASS.
- The presentation planner regression suite covers a single deep hierarchy: it emits bounded continuation slices, keeps every node in the ledger, and renders continuation anchors with a dashed border.
- The local architecture demonstration regenerated a presentation bundle from the fixture derived from `docs/architecture.zh-CN.md`: 6 roots, 25 nodes, 10 relations, and 0 validation errors.
- `obsidian help`: PASS; the installed Obsidian CLI exposed its command surface.
- `obsidian-cli help`: unavailable on this workstation (`CommandNotFoundException`). This is an environment gap, not CLI validation evidence.

---

### Task 1: Establish The Executable Type Catalog [Implemented]

**Files:**
- Create: `src/diagram/diagramTypeCatalog.ts`
- Modify: `src/diagram/types.ts`
- Modify: `src/types.ts`
- Modify: `src/constants.ts`
- Modify: `src/diagram/diagramPreferenceCompatibility.ts`
- Test: `src/tests/diagramTypeCatalog.test.ts`
- Test: `src/tests/diagramOperationInput.test.ts`

**Interfaces:**

```ts
export type DiagramCatalogTypeId =
    | 'mermaid-mindmap'
    | 'drawnix-knowledge-map'
    | 'flowchart'
    | 'sequence'
    | 'state'
    | 'class'
    | 'entity-relationship'
    | 'canvas-map'
    | 'data-chart'
    | 'circuit';

export type DrawnixKnowledgeMapDelivery = 'full-board' | 'presentation';

export interface ExecutableDiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: 'knowledge' | 'behavior' | 'structure' | 'quantitative' | 'engineering';
    promptProfileId: string;
    rendererOperationId: string;
    exampleFixtureId: string;
}

export function getExecutableDiagramType(id: DiagramCatalogTypeId): ExecutableDiagramTypeDefinition;
export function findDiagramTypeByIntent(intent: DiagramIntent): ExecutableDiagramTypeDefinition;
export function resolveDrawnixKnowledgeMapDelivery(settings: Pick<NotemdSettings, 'drawnixKnowledgeMapDelivery'>): DrawnixKnowledgeMapDelivery;
```

- [ ] **Step 1: Write failing catalog and compatibility tests**

```ts
expect(findDiagramTypeByIntent('drawnixMindmap').id).toBe('drawnix-knowledge-map');
expect(resolveDrawnixKnowledgeMapDelivery({})).toBe('full-board');
expect(EXECUTABLE_DIAGRAM_TYPES.every(type => type.exampleFixtureId)).toBe(true);
```

- [ ] **Step 2: Run targeted tests and verify the missing catalog/default failures**

Run: `rtk npx jest src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts --runInBand`

Expected: failure because the catalog and `drawnixKnowledgeMapDelivery` do not exist.

- [ ] **Step 3: Implement the registry and settings default**

Add the setting as optional persisted data, resolve absent/invalid values to `full-board`, and keep `applyDiagramIntentPreference()` backward-compatible. Do not use `preferredDiagramRenderTarget` to select presentation; it remains a legacy artifact-format preference.

- [ ] **Step 4: Re-run targeted tests**

Run: `rtk npx jest src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit the catalog contract**

Run: `rtk git add src/diagram/diagramTypeCatalog.ts src/diagram/types.ts src/types.ts src/constants.ts src/diagram/diagramPreferenceCompatibility.ts src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts && rtk git commit -m "feat(diagram): add executable type catalog"`

### Task 2: Split Drawnix Semantic Input From Presentation Policy [Implemented]

**Files:**
- Create: `src/diagram/prompts/drawnixKnowledgeMapPrompt.ts`
- Modify: `src/diagram/prompts/diagramSpecPrompt.ts`
- Modify: `src/diagram/diagramGenerationService.ts`
- Modify: `src/diagram/adapters/drawnix/drawnixSourceCoverage.ts`
- Test: `src/tests/diagramSpecPrompt.test.ts`
- Test: `src/tests/drawnixSourceCoverage.test.ts`
- Test: `src/tests/diagramGenerationService.test.ts`

**Interfaces:**

```ts
export function buildDrawnixKnowledgeMapPromptRules(options: {
    sourcePath?: string;
    targetLanguage?: string;
}): string;

export function buildSourceCoverageForest(spec: DiagramSpec, sourceMarkdown: string, sourcePath?: string): DiagramSpec;

export function buildDocumentRootedKnowledgeMap(spec: DiagramSpec, sourceLabel: string): DiagramSpec;
```

- [ ] **Step 1: Write failing multi-root and Mermaid-isolation tests**

```ts
expect(buildDiagramSpecPrompt({ requiredIntent: 'drawnixMindmap' }))
    .toContain('multiple independent roots');
expect(buildDiagramSpecPrompt({ requiredIntent: 'drawnixMindmap' }))
    .not.toContain('exactly one top-level document root');
expect(buildDiagramSpecPrompt({ preferredIntent: 'mindmap' }))
    .not.toContain('Drawnix knowledge-map rules');
```

- [ ] **Step 2: Run targeted tests and observe the one-root prompt failure**

Run: `rtk npx jest src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts --runInBand`

Expected: failure on the old forced root contract.

- [ ] **Step 3: Move root synthesis behind the explicit overview operation**

Keep source coverage responsible for hierarchy completion and ID preservation. The Drawnix prompt requests root scopes, role-bearing nodes, concise labels, and material cross-branch relations. It must not mention Drawnix JSON, color, coordinate, or presentation layout decisions.

- [ ] **Step 4: Re-run target tests and a generation-service regression**

Run: `rtk npx jest src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts src/tests/diagramGenerationService.test.ts --runInBand`

Expected: PASS; Mermaid `mindmap` assertions still pass.

- [ ] **Step 5: Commit the semantic-boundary split**

Run: `rtk git add src/diagram/prompts src/diagram/diagramGenerationService.ts src/diagram/adapters/drawnix/drawnixSourceCoverage.ts src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts src/tests/diagramGenerationService.test.ts && rtk git commit -m "feat(drawnix): separate source coverage from overview policy"`

### Task 3: Create Independent Board And Presentation Projections [Implemented]

**Files:**
- Modify: `src/diagram/adapters/drawnix/drawnixMindMapProjection.ts`
- Create: `src/diagram/adapters/drawnix/drawnixKnowledgeMapPresentation.ts`
- Create: `src/diagram/adapters/drawnix/drawnixKnowledgeMapPresentationTypes.ts`
- Create: `src/rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer.ts`
- Test: `src/tests/drawnixMindMapRenderer.test.ts`
- Test: `src/tests/drawnixKnowledgeMapPresentation.test.ts`
- Test: `src/tests/drawnixMindMapLayout.playwright.test.ts`

**Interfaces:**

```ts
export function buildDrawnixKnowledgeMapBoardProjection(spec: DiagramSpec): DrawnixMindMapProjection;

export interface DrawnixKnowledgeMapPresentation {
    overview: DrawnixKnowledgeMapPresentationSlice;
    details: DrawnixKnowledgeMapPresentationSlice[];
    ledger: DrawnixKnowledgeMapFidelityLedger;
}

export function buildDrawnixKnowledgeMapPresentation(
    spec: DiagramSpec,
    contract: DrawnixKnowledgeMapPresentationContract
): DrawnixKnowledgeMapPresentation;

export function renderDrawnixKnowledgeMapPresentationSvg(
    slice: DrawnixKnowledgeMapPresentationSlice
): string;
```

- [ ] **Step 1: Add failing semantic-preservation and ledger-coverage fixtures**

```ts
const presentation = buildDrawnixKnowledgeMapPresentation(complexForestSpec, desktopPresentationContract);
expect(presentation.ledger.nodeLocations).toHaveLength(allNodeIds.size);
expect(presentation.ledger.relationLocations).toHaveLength(allRelationIds.size);
expect(presentation.overview.nodes.every(node => node.id)).toBe(true);
```

- [ ] **Step 2: Run target tests and verify the missing planner failure**

Run: `rtk npx jest src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapRenderer.test.ts --runInBand`

Expected: failure because no presentation planner exists.

- [ ] **Step 3: Implement graph-aware presentation planning**

Keep the existing board geometry as the full-board operation. Build a root-cluster graph for presentation using cross-root relation count, direction, and label importance. Use deterministic candidate ordering and aspect-ratio-aware packing. Split only when the requested viewport cannot satisfy type-size and clearance constraints. Record every collapse, summary, and slice location in the ledger.

- [ ] **Step 4: Implement stable role treatment and SVG rendering**

Use node roles such as `root`, `domain`, `subsystem`, `component`, `evidence`, `external`, and `cross-relation`. Remove branch-index business color semantics from the presentation path. Preserve long-label wrapping and CJK measurement coverage.

- [ ] **Step 5: Run planner, full-board, and browser geometry tests**

Run: `rtk npx jest src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixMindMapLayout.playwright.test.ts --runInBand`

Expected: PASS; full-board topology and no-quota tests remain intact.

- [ ] **Step 6: Commit the separate projections**

Run: `rtk git add src/diagram/adapters/drawnix src/rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapLayout.playwright.test.ts && rtk git commit -m "feat(drawnix): add presentation delivery projection"`

### Task 4: Persist Replay Data And Save Presentation Artifacts Safely [Implemented]

**Files:**
- Modify: `src/diagram/adapters/drawnix/drawnixExporter.ts`
- Modify: `src/rendering/renderers/drawnixRenderer.ts`
- Create: `src/rendering/renderers/drawnixKnowledgeMapPresentationRenderer.ts`
- Modify: `src/rendering/types.ts`
- Modify: `src/operations/diagramCommandExecution.ts`
- Modify: `src/operations/diagramCommandHostAdapter.ts`
- Test: `src/tests/drawnixExporter.test.ts`
- Test: `src/tests/saveDiagramArtifactFile.test.ts`
- Test: `src/tests/diagramCommandHostAdapter.test.ts`

**Interfaces:**

```ts
export interface DrawnixKnowledgeMapReplayRecord {
    version: 1;
    catalogTypeId: 'drawnix-knowledge-map';
    semanticSpec: PersistedDrawnixKnowledgeMapSpec;
    semanticSpecHash: string;
    deliveryManifestPaths: string[];
}

export function readDrawnixKnowledgeMapReplayRecord(data: unknown): DrawnixKnowledgeMapReplayRecord | null;
export function renderDrawnixKnowledgeMapPresentationArtifact(spec: DiagramSpec): Promise<RenderArtifact>;
```

- [ ] **Step 1: Write failing metadata and transactional-save tests**

```ts
expect(exported.metadata?.notemd.knowledgeMap?.version).toBe(1);
expect(readDrawnixKnowledgeMapReplayRecord(legacyExport)).toBeNull();
expect(savedPaths).toEqual([
    'Architecture_diagram.drawnix',
    'Architecture_diagram.presentation/manifest.json',
    'Architecture_diagram.presentation/overview.svg'
]);
```

- [ ] **Step 2: Run target tests and verify that replay data is absent**

Run: `rtk npx jest src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts --runInBand`

Expected: failure on the missing replay record and presentation paths.

- [ ] **Step 3: Add namespaced replay metadata without changing source-visual v1 semantics**

Validate a canonical, bounded `DiagramSpec` subset at the exporter boundary. Hash the canonical JSON. Keep unknown namespaced metadata untouched. Do not store raw source Markdown or credential-bearing settings.

- [ ] **Step 4: Add a dedicated presentation artifact bundle**

The presentation renderer writes the compatible full board plus `manifest.json`, `overview.svg`, and deterministic detail panels below `<source>_diagram.presentation/`. Associate every created path with the manifest. Reuse existing transactional write/rollback behavior across the entire bundle.

- [ ] **Step 5: Re-run persistence and host-adapter tests**

Run: `rtk npx jest src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts src/tests/diagramCommandHostAdapter.test.ts --runInBand`

Expected: PASS; legacy exports still validate and load.

- [ ] **Step 6: Commit artifact persistence**

Run: `rtk git add src/diagram/adapters/drawnix/drawnixExporter.ts src/rendering src/operations/diagramCommandExecution.ts src/operations/diagramCommandHostAdapter.ts src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts src/tests/diagramCommandHostAdapter.test.ts && rtk git commit -m "feat(drawnix): persist replayable presentation artifacts"`

### Task 5: Add One-Click Selection And Executable Example Gallery [Implemented]

**Files:**
- Modify: `src/ui/NotemdSettingTab.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/i18n/locales/experimentalDiagramPipeline.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh_cn.ts`
- Create: `src/diagram/examples/diagramExampleCatalog.ts`
- Create: `src/diagram/examples/drawnixKnowledgeMapExamples.ts`
- Test: `src/tests/providerSettingsBehavior.test.ts`
- Test: `src/tests/diagramExampleCatalog.test.ts`
- Test: `src/tests/diagramCommandHostAdapter.test.ts`

**Interfaces:**

```ts
export interface DiagramExampleDefinition {
    typeId: DiagramCatalogTypeId;
    fixtureId: string;
    title: string;
    selectionRationale: string;
    sourceIntent: DiagramIntent;
}

export function getExecutableDiagramExamples(): readonly DiagramExampleDefinition[];
```

- [ ] **Step 1: Write failing UI preference and gallery-completeness tests**

```ts
expect(settings.drawnixKnowledgeMapDelivery).toBe('presentation');
expect(getExecutableDiagramExamples().map(example => example.typeId))
    .toContain('drawnix-knowledge-map');
expect(getExecutableDiagramExamples().some(example => example.typeId === 'timeline')).toBe(false);
```

- [ ] **Step 2: Run target tests and verify the selector/gallery failure**

Run: `rtk npx jest src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts --runInBand`

Expected: failure because no delivery selector or executable-only gallery exists.

- [ ] **Step 3: Add the two-choice delivery control and commands**

Render a compact segmented control for Full board and Presentation only when Drawnix Knowledge Map is selected. Persist the host routing preference. Give the preview toolbar explicit alternate-delivery actions. A missing replay record produces a regeneration notice and does not trigger an LLM call or overwrite files.

- [ ] **Step 4: Add generated examples and localized selection copy**

Every catalog entry receives its own selection rationale and fixture. Render thumbnails through the real renderer path. Add English, Simplified Chinese, and Traditional Chinese strings directly; retain the existing extension fallback for the remaining locales.

- [ ] **Step 5: Re-run UI and command tests**

Run: `rtk npx jest src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts src/tests/diagramCommandHostAdapter.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit the user-facing catalog**

Run: `rtk git add src/ui src/i18n src/diagram/examples src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts src/tests/diagramCommandHostAdapter.test.ts && rtk git commit -m "feat(diagram): add Drawnix delivery selection and examples"`

### Task 6: Add Consumer Evidence And Regression Gates [Implemented and verified]

**Files:**
- Modify: `package.json`
- Create: `src/tests/drawnixConsumerImport.test.tsx`
- Create: `src/tests/drawnixKnowledgeMapPresentationVisual.test.ts`
- Modify: `src/tests/drawnixMindMapLayout.playwright.test.ts`
- Modify: `src/tests/diagramArtifactExportCli.test.ts`
- Modify: `src/tests/drawnixExportDocsContract.test.ts`

- [ ] **Step 1: Add failing consumer and visual-invariant tests**

```ts
expect(consumerNodeIds).toEqual(expect.arrayContaining(expectedNodeIds));
expect(consumerRelationEndpoints).toEqual(expectedRelationEndpoints);
expect(visualReport.clippedLabels).toEqual([]);
expect(visualReport.nodeLabelIntersections).toEqual([]);
expect(visualReport.missingLedgerEntities).toEqual([]);
```

- [ ] **Step 2: Run targeted consumer tests and confirm the missing integration failure**

Run: `rtk npx jest src/tests/drawnixConsumerImport.test.tsx src/tests/drawnixKnowledgeMapPresentationVisual.test.ts --runInBand`

Expected: failure until the test-only consumer harness and report are present.

- [ ] **Step 3: Pin a test-only Drawnix/Plait consumer and implement geometry reports**

Mount a read-only fixture. Assert hierarchy, IDs, relation endpoints, relation text, and visible bounds. Keep consumer rectangles as consumer evidence; do not compare them to Notemd's static coordinates. SVG tests must account for transforms, CJK labels, and actual text bounds rather than raw string lengths.

- [ ] **Step 4: Add Mermaid isolation and legacy-artifact tests**

Assert that Drawnix changes do not alter `mindmap` prompt contents, Mermaid target selection, or fallback traversal. Assert that legacy metadata loads, resolves to full board, and returns a clear regeneration requirement for presentation.

- [ ] **Step 5: Run the full verification set**

Run: `rtk npm run build`

Run: `rtk npm test -- --runInBand`

Run: `rtk npm run docs:build`

Run: `rtk git diff --check`

Expected: all checks pass; no test restores a depth, node-count, or relation-count rejection quota.

- [ ] **Step 6: Commit verification and documentation updates**

Run: `rtk git add package.json package-lock.json src/tests docs && rtk git commit -m "test(drawnix): verify presentation and compatibility contracts"`

## Coverage Review

| Requirement | Plan task |
|---|---|
| Executable-only type classification and examples | Tasks 1 and 5 |
| Independent Drawnix prompt, projection, and rendering | Tasks 2 and 3 |
| One-click full-board/presentation switch | Task 5 |
| Forward compatibility for settings and artifacts | Tasks 1 and 4 |
| No semantic quotas for complex graphs | Tasks 3 and 6 |
| Mermaid mind-map stability | Tasks 2 and 6 |
| Real consumer import evidence | Task 6 |
| Bilingual documentation | Task 6 |

## Plan Review

- No task depends on a UI-only representation of a future type.
- Board and presentation have separate owners, result types, persistence semantics, and tests.
- The replay record is additive and namespaced; it does not reinterpret legacy data.
- The plan does not use reference-project budgets as validation limits.
- Every runtime task begins with a failing focused test and ends with a meaningful verification cycle.
