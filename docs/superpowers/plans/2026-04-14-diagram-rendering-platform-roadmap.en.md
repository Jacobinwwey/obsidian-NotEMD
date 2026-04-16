# Notemd Diagram Rendering Platform Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Notemd from a single Mermaid-text generation path into an extensible diagram platform built around intent detection, structured specs, specialized renderers, and multi-format output inside Obsidian.

**Architecture:** Use four layers: an `Intent Plane` to decide the best diagram expression, a `Spec Plane` to make the LLM emit structured `DiagramSpec` data instead of syntax text, an `Adapter Plane` to generate and validate concrete targets, and a `Rendering Plane` to handle host execution, caching, preview, theme, and export. The roadmap deliberately borrows registry / host / cache ideas from the markdown-viewer stack without cloning that codebase wholesale into an Obsidian plugin.

**Tech Stack:** TypeScript, Obsidian Plugin API, Mermaid, Jest, ESLint, esbuild, iframe-based render host, JSON Canvas, Vega-Lite, SVG/HTML preview pipeline

---

## Execution Status (2026-04-14)

This roadmap is no longer just a speculative plan. `main` already contains the diagram domain model, spec-first generation, Mermaid subtype adapters, renderer registry/service, JSON Canvas, Vega-Lite, preview/export, and theme/i18n integration. The documentation lag is now the real risk:

- already-delivered capabilities can be mistaken for "not started"
- experimental or partial boundaries can be mistaken for complete platform maturity

The purpose of this update is therefore not to redefine direction, but to turn the roadmap into a real progress ledger and the control point for the next execution batch.

Phase-2 requirements snapshot:

- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md`

### Current Snapshot

| Task | Status | Current reality |
|---|---|---|
| Task 0 | Delivered with explicit limits | `src/rendering/webview/*` and `src/rendering/host/iframeRenderHost.ts` have landed with an inline `srcdoc` host. `scripts/audit-render-host-bundle.js`, the release workflow, and tests now lock the requirement that the render host must ship self-contained inside `main.js`. `esbuild.config.mjs` is still single-entry, so true heavy-runtime isolation is not complete. |
| Task 1 | Delivered | `DiagramIntent`, `DiagramSpec`, validators, planner logic, and intent inference rules are on the mainline with tests. |
| Task 2 | Partial | The spec-first prompt and service pipeline are landed, and `src/main.ts` now uses a shared `generateDiagramCommand` executor. Legacy Mermaid save, experimental save, and experimental preview have converged onto one orchestration path internally, but public command surfaces still preserve compatibility-era dual tracks. |
| Task 3 | Partial | Mermaid subtype adapters and `mermaid.parse` validation are shipped. Flowchart pipe-label escaping moved into adapter emit, and a large share of note-directive parsing / edge-label helpers have started moving into `src/diagram/adapters/mermaid/legacyFixerUtils.ts`. `src/mermaidProcessor.ts` still owns too much legacy fixer work. |
| Task 4 | Delivered | Renderer registry/service, cache, inline host, iframe preview session, and unified preview modal are all landed. |
| Task 5 | Delivered | `.canvas` output, baseline deterministic layout, save flows, and preview support are all landed. |
| Task 6 | Partial | Controlled Vega-Lite templates, planner chart defaults, preview, and export are landed, but the "iframe host isolates rendering dependencies" claim is still only partially true. |
| Task 7 | Delivered with explicit limits | Theme, locale, SVG/PNG/source export, and the support matrix are aligned with current code. HTML still promises only iframe fallback preview and raw source save. |
| Task 8 | Deferred by design | Advanced DSL / renderer evaluation remains intentionally postponed. |

### Evidence Index

- Spec-first domain layer:
  - `src/diagram/types.ts`
  - `src/diagram/intent.ts`
  - `src/diagram/spec.ts`
  - `src/diagram/planner.ts`
  - `src/diagram/diagramGenerationService.ts`
- Mermaid subtype adapters:
  - `src/diagram/adapters/mermaid/mindmapAdapter.ts`
  - `src/diagram/adapters/mermaid/flowchartAdapter.ts`
  - `src/diagram/adapters/mermaid/sequenceAdapter.ts`
  - `src/diagram/adapters/mermaid/classAdapter.ts`
  - `src/diagram/adapters/mermaid/erAdapter.ts`
  - `src/diagram/adapters/mermaid/stateAdapter.ts`
  - `src/diagram/adapters/mermaid/validator.ts`
- Rendering platform:
  - `src/rendering/rendererRegistry.ts`
  - `src/rendering/rendererService.ts`
  - `src/rendering/cache/renderCache.ts`
  - `src/rendering/host/inlineRenderHost.ts`
  - `src/rendering/host/iframeRenderHost.ts`
  - `scripts/audit-render-host-bundle.js`
  - `.github/workflows/release.yml`
  - `src/ui/DiagramPreviewModal.ts`
- Non-Mermaid targets:
  - `src/diagram/adapters/canvas/canvasAdapter.ts`
  - `src/diagram/adapters/vega/vegaLiteAdapter.ts`
  - `src/rendering/renderers/jsonCanvasRenderer.ts`
  - `src/rendering/renderers/vegaLiteRenderer.ts`
  - `src/rendering/renderers/htmlRenderer.ts`
- Docs/tests already enforcing current behavior:
  - `src/tests/diagramGenerationService.test.ts`
  - `src/tests/diagramGenerationFallbacks.test.ts`
  - `src/tests/canvasAdapter.test.ts`
  - `src/tests/vegaLiteAdapter.test.ts`
  - `src/tests/rendererService.test.ts`
  - `src/tests/diagramPreviewModal.test.ts`
  - `src/tests/previewExport.test.ts`
  - `src/tests/diagramDocsContract.test.ts`
  - `src/tests/renderHostBundleAuditScript.test.ts`

## Why This Plan Exists

The original motivation still matters, but the current state is no longer "these capabilities do not exist." The pressure is now concentrated in legacy paths, command-surface convergence, and runtime boundaries:

- `src/main.ts` still mixes legacy Mermaid flow, experimental diagram flow, command registration, and UI orchestration, even though the diagram domain already exists.
- `src/promptUtils.ts` still contains a legacy Mermaid prompt that hard-binds output to `mindmap`, even though the spec-first path avoids that limitation.
- `src/mermaidProcessor.ts` remains a giant post-fixer, which means the system is still using string surgery to compensate for modeling and prompt weaknesses.
- The build still produces a single `main.js`; `esbuild.config.mjs` has not yet defined packaging rules for heavier iframe/webview assets or dedicated render bundles.

If future work continues as "write more prompts + add more regex fixes + support a few more syntaxes," complexity will grow linearly while stability degrades exponentially.

## Product North Star

Notemd's diagram capability should serve three core job families, not merely maximize the number of supported formats:

1. Structural understanding.
   Turn long notes, research material, and technical proposals into diagrams optimized for reading and review.
2. Knowledge organization.
   Convert concepts, relationships, causality, hierarchy, and spatial structure into artifacts that fit Obsidian workflows.
3. Data expression.
   When notes contain metrics, time series, distributions, or comparisons, generate charts instead of forcing everything into Mermaid.

In practical terms, Notemd needs routing across output formats, not more Mermaid-only accretion.

## Current Constraints In Repo

### Code Reality

- `src/main.ts` is already too large and still acts as command registration, orchestration, legacy Mermaid flow, and experimental diagram flow.
- `src/fileUtils.ts` mixes file saving, Mermaid repair, batch processing, and error-file movement.
- `src/mermaidProcessor.ts` concentrates detection, fixing, syntax cleaning, and deep-debug behavior that should be decomposed.
- `src/promptUtils.ts` still contains legacy format-bound prompting alongside the newer spec-first route.

### Build Reality

- `esbuild.config.mjs` only bundles `src/main.ts -> main.js`; there is still no multi-entry strategy, static asset copy path, or generated iframe page contract.
- `manifest.json` ships a general desktop/mobile plugin; the platform must not promise rendering capabilities that require a desktop-only runtime without an explicit fallback.

### Testing Reality

- The Jest suite already exists and is good enough for domain-model, adapter, and service-level testing.
- The real gap is not the absence of a framework; it is the absence of stable, testable boundaries in legacy Mermaid generation and repair.

## Architecture Decision Summary

### Decision 1: Build `DiagramSpec` first and stop asking the LLM for final renderer syntax

Recommended shared representations:

- `DiagramIntent`
- `DiagramSpec`
- `RenderTarget`
- `RenderArtifact`

`DiagramSpec` should at least cover:

- title
- summary
- nodes
- edges
- sections
- callouts
- dataSeries
- layoutHints
- sourceLanguage
- outputLanguage
- evidenceRefs

Reasons:

- It decouples content understanding from target syntax generation.
- Mermaid, Canvas, and Vega-Lite can all reuse the same semantic input.
- Validation moves forward into structure instead of waiting until string output is already malformed.

### Decision 2: Build `RendererRegistry + RenderHost` before piling on third-party engines

Minimum recommended platform pieces:

- `RendererRegistry`
- `RendererService`
- `RenderHost` interface
- `InlineRenderHost` or `IframeRenderHost`
- `RenderCache`

Reasons:

- Without a unified host, multi-format support collapses into "generate different code blocks" with no preview, export, caching, or theme contract.
- The real lesson from `markdown-viewer-extension` is its registry / host / theme / cache architecture, not the raw number of renderers it supports.

### Decision 3: First-wave expansion targets should be Mermaid subtype + JSON Canvas + Vega-Lite, not PlantUML

| Priority | Target | Why | Notes |
|---|---|---|---|
| P0 | Mermaid subtypes | Lowest migration cost, strongest user continuity, existing dependencies already point here | Fix the `mindmap` monopoly first |
| P1 | JSON Canvas | Native Obsidian asset format; best fit for concept maps and spatial organization | Does not require a heavy runtime |
| P1 | Vega-Lite | Correct medium for numeric and comparative notes | Needs chart adapters and preview |
| P2 | HTML/SVG infographics | Valuable for summary cards, KPI views, and roadmap visuals | Needs stronger theme/export support |
| P3 | PlantUML / Graphviz / Draw.io | Large syntax surface, heavy dependencies, high maintenance cost | Revisit only after platform maturity |

### Decision 4: Prefer `iframe host`, but only with a progressive packaging plan

Recommended route:

- Stage 1: allow `InlineRenderHost` to serve Mermaid and local SVG preview.
- Define the `RenderHost` interface immediately so later host migrations do not force upstream rewrites.
- Stage 2: let `IframeRenderHost` take on Vega-Lite, HTML/SVG cards, and other heavier front-end rendering responsibilities.

Reasons:

- The current build system is not ready for a full worker/offscreen architecture immediately.
- `iframe host` provides useful isolation without fighting Obsidian plugin constraints.
- Copying the full `markdown-viewer` host stack into Notemd would be unjustified complexity at this stage.

## Target Module Layout

Recommended boundaries to add or separate:

- `src/diagram/types.ts`
- `src/diagram/intent.ts`
- `src/diagram/spec.ts`
- `src/diagram/planner.ts`
- `src/diagram/prompts/diagramSpecPrompt.ts`
- `src/diagram/validators/specValidator.ts`
- `src/diagram/adapters/mermaid/base.ts`
- `src/diagram/adapters/mermaid/mindmapAdapter.ts`
- `src/diagram/adapters/mermaid/flowchartAdapter.ts`
- `src/diagram/adapters/mermaid/sequenceAdapter.ts`
- `src/diagram/adapters/mermaid/erAdapter.ts`
- `src/diagram/adapters/mermaid/validator.ts`
- `src/diagram/adapters/canvas/canvasAdapter.ts`
- `src/diagram/adapters/vega/vegaLiteAdapter.ts`
- `src/rendering/types.ts`
- `src/rendering/rendererRegistry.ts`
- `src/rendering/rendererService.ts`
- `src/rendering/cache/renderCache.ts`
- `src/rendering/host/renderHost.ts`
- `src/rendering/host/inlineRenderHost.ts`
- `src/rendering/host/iframeRenderHost.ts`
- `src/rendering/webview/index.html`
- `src/rendering/webview/bootstrap.ts`
- `src/rendering/webview/renderFrame.ts`
- `src/ui/DiagramPreviewModal.ts`
- `src/ui/components/diagramPreviewToolbar.ts`

Legacy files that should be progressively reduced:

- `src/main.ts`
- `src/fileUtils.ts`
- `src/mermaidProcessor.ts`
- `src/promptUtils.ts`

---

## Execution Plan

### Task 0: Build And Packaging Substrate For Dedicated Rendering

**Files:**
- Existing runtime host: `src/rendering/webview/contract.ts`
- Existing runtime host: `src/rendering/webview/page.ts`
- Existing runtime host: `src/rendering/webview/renderFrame.ts`
- Create: `scripts/audit-render-host-bundle.js`
- Modify: `package.json`
- Modify: `.github/workflows/release.yml`
- Test: `src/tests/renderHostBundleAuditScript.test.ts`

**Status:** Delivered with explicit limits

The repository now carries an inline `srcdoc` preview host through `src/rendering/webview/contract.ts`, `src/rendering/webview/page.ts`, `src/rendering/webview/renderFrame.ts`, and `src/rendering/host/iframeRenderHost.ts`. In other words, the render page still ships embedded inside the main bundle, not as copied static assets.

The missing smoke gate is now in place: `scripts/audit-render-host-bundle.js` inspects built `main.js` directly and requires key markers such as `htmlSrcdoc`, `Notemd Render Host`, `notemd-render-shell`, and `notemd-html-preview-theme-shim`. It also rejects undeclared external render-host asset dependencies such as `rendering-webview/index.html`. `.github/workflows/release.yml` already includes that audit in the release gate.

Remaining limitation: `esbuild.config.mjs` is still single-entry. The current smoke gate proves only that the existing `srcdoc` host stays self-contained; it does not prove that a truly independent heavy-runtime bundle can be packaged and installed correctly.

- [x] Define the render-asset directory contract so future HTML/JS/CSS does not sprawl into the plugin root.
- [x] Lock the production bundle-carrying behavior so preview pages continue shipping inside `main.js`.
- [x] Add the minimum smoke test that proves the bundled render page and required scripts are present.

**Decisions:**

- Obsidian community-plugin releases guarantee only `main.js`, `manifest.json`, and `styles.css`; do not base runtime correctness on assumptions about extra directories being installed.
- Phase 1 should use `iframe srcdoc` or another inline-page contract so the preview host is self-contained inside `main.js`.
- If a later phase truly needs a heavier independent runtime bundle, release packaging and installation write-out must be designed at the same time.
- The smoke gate should continue to enforce the self-contained `srcdoc` host until the release asset model changes deliberately.

**Exit Criteria:**

- Built artifacts reliably carry the render page, and automated audit blocks regressions into undeclared external host assets.
- Current plugin loading behavior remains unaffected.

### Task 1: Introduce Diagram Domain Model And Intent Router

**Files:**
- Create: `src/diagram/types.ts`
- Create: `src/diagram/intent.ts`
- Create: `src/diagram/spec.ts`
- Create: `src/diagram/planner.ts`
- Modify: `src/types.ts`
- Test: `src/tests/diagramIntent.test.ts`
- Test: `src/tests/diagramSpecValidation.test.ts`

**Status:** Delivered

The real boundary now exists in `src/diagram/types.ts`, `src/diagram/spec.ts`, `src/diagram/intent.ts`, and `src/diagram/planner.ts`. The remaining question is no longer whether a domain model exists, but whether every future command path continues to reuse it.

- [x] Define `DiagramIntent` covering at least `mindmap`, `flowchart`, `sequence`, `classDiagram`, `erDiagram`, `stateDiagram`, `canvasMap`, and `dataChart`.
- [x] Define a minimal `DiagramSpec` structure and validator.
- [x] Move "which diagram type fits this note" logic out of the Mermaid prompt.

**Decisions:**

- Use a hybrid of rules plus prompt hints for the initial intent router; do not start with a heavyweight auto-classifier.
- When confidence is low, fall back to `mindmap` or let the user choose a target in UI.

**Exit Criteria:**

- The new logic can be unit-tested as "note -> intent" without involving rendering.
- Mermaid prompting is no longer hard-bound as the only diagram type.

### Task 2: Replace Raw Mermaid Prompting With Spec-First Generation

**Files:**
- Create: `src/diagram/prompts/diagramSpecPrompt.ts`
- Modify: `src/promptUtils.ts`
- Modify: `src/main.ts`
- Test: `src/tests/diagramPromptAssembly.test.ts`
- Test: `src/tests/diagramPlannerFlow.test.ts`
- Test: `src/tests/diagramCommandArchitecture.test.ts`

**Status:** Partial

`src/diagram/prompts/diagramSpecPrompt.ts`, `src/diagram/diagramSpecResponseParser.ts`, and `src/diagram/diagramGenerationService.ts` have landed the spec-first prompt plus the `spec -> validate -> render` pipeline. Recent work also converged three diagram command paths in `src/main.ts` around a shared `generateDiagramCommand` executor for busy-state, reading, provider selection, and error handling.

The real unfinished part is now public-surface convergence, not internal pipeline divergence. Legacy Mermaid command surfaces, experimental generation, and experimental preview still coexist so older workflows and sidebar/custom workflow action IDs keep working.

- [x] Add the prompt that asks the LLM for `DiagramSpec` JSON.
- [x] Evolve `summarizeToMermaidCommand` into `generateDiagramCommand`, while keeping old command names as compatibility entrypoints.
- [x] Introduce the service-level pipeline: generate spec -> validate spec -> hand off to adapter.

**Decisions:**

- Keep current Mermaid command entrypoints usable so existing workflows do not break abruptly.
- The UI may still say "Summarise as Mermaid diagram" initially while the internal pipeline has already generalized.
- First unify the internal executor. Only then decide whether public command IDs, sidebar action IDs, and workflow DSL should migrate.

**Exit Criteria:**

- Generation no longer depends on the LLM directly emitting final Mermaid.
- The new pipeline can produce a reusable spec without involving a renderer.

### Task 3: Mermaid Adapter V2 And Decomposition Of `mermaidProcessor.ts`

**Files:**
- Create: `src/diagram/adapters/mermaid/base.ts`
- Create: `src/diagram/adapters/mermaid/mindmapAdapter.ts`
- Create: `src/diagram/adapters/mermaid/flowchartAdapter.ts`
- Create: `src/diagram/adapters/mermaid/sequenceAdapter.ts`
- Create: `src/diagram/adapters/mermaid/erAdapter.ts`
- Create: `src/diagram/adapters/mermaid/validator.ts`
- Modify: `src/mermaidProcessor.ts`
- Test: `src/tests/mermaidMindmapAdapter.test.ts`
- Test: `src/tests/mermaidFlowchartAdapter.test.ts`
- Test: `src/tests/mermaidValidator.test.ts`

**Status:** Partial

Mermaid subtype adapters now cover `mindmap`, `flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, and `stateDiagram-v2`, and the renderer validates with `mermaid.parse` before returning output. The value of this work is already real.

The latest progress is that syntax safeguards are moving forward into adapters. For example, flowchart edge labels containing `|` are now escaped inside `src/diagram/adapters/mermaid/flowchartAdapter.ts` instead of depending on global post-fixers such as `fixMermaidPipes`.

The original roadmap goal was more aggressive, and that part remains unfinished: `src/mermaidProcessor.ts` is still a large legacy fixer. Adapter-driven emit + validate is real, local syntax defenses are moving earlier, and a meaningful share of note parsing / edge-label surgery has already moved into `src/diagram/adapters/mermaid/legacyFixerUtils.ts`, but full fixer decomposition is not done yet.

- [ ] Break Mermaid repair out of "global text patching" and into adapter-specific emit + validate + fix.
- [ ] Push common utilities down into small shared helpers and diagram-specific rules into the relevant adapters.
- [ ] Keep batch Mermaid repair only as a legacy fallback, not as the required mainline generation path.
- [x] Move flowchart pipe-label escaping into the adapter emit stage.
- [x] Push generic bracket-block protect/restore helpers down into shared utilities.
- [x] Push targeted note cleanup and note-node line formatting down into shared utilities.
- [x] Push note-directive parsing and directional edge-label attachment into shared utilities.
- [x] Push double-arrow merge, unquoted-edge-label quoting, and quoted-label-after-semicolon rewrite helpers into shared utilities.

**Decisions:**

- Keep only minimal fix strategies such as fence repair and a few low-risk cleanup rules.
- Remove global destructive rules such as "delete all brackets" because they damage valid Mermaid syntax.

**Exit Criteria:**

- At least `mindmap`, `flowchart`, `sequenceDiagram`, and `erDiagram` are supported through the new path.
- Pass rates through `mermaid.parse` improve substantially for generated output.

### Task 4: Rendering Platform Skeleton With Registry, Host, Cache And Preview

**Files:**
- Create: `src/rendering/types.ts`
- Create: `src/rendering/rendererRegistry.ts`
- Create: `src/rendering/rendererService.ts`
- Create: `src/rendering/cache/renderCache.ts`
- Create: `src/rendering/host/renderHost.ts`
- Create: `src/rendering/host/inlineRenderHost.ts`
- Create: `src/ui/DiagramPreviewModal.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Test: `src/tests/rendererRegistry.test.ts`
- Test: `src/tests/rendererService.test.ts`
- Test: `src/tests/diagramPreviewModal.test.ts`

**Status:** Delivered

`RendererRegistry`, `RendererService`, `RenderCache`, `InlineRenderHost`, `IframeRenderHost`, and `DiagramPreviewModal` already provide the minimum preview/render/export platform skeleton. Cache keys already include `spec + target + theme`.

- [x] Build the platform interfaces first, then attach heavier renderers incrementally.
- [x] Provide a unified preview entrypoint for Mermaid output instead of scattering preview logic across business commands.
- [x] Add a simple cache keyed at least by `spec + target + theme`.

**Decisions:**

- First-stage preview only needs to open, refresh, copy source, and save results; full export families can wait.
- Keep caching simple at first, using memory or lightweight vault-local state instead of early persistence infrastructure.

**Exit Criteria:**

- Callers access rendering through `RendererService`, not directly through Mermaid APIs.
- Mermaid preview is already routed through the unified platform path.

### Task 5: Add JSON Canvas As First Non-Mermaid Output

**Files:**
- Create: `src/diagram/adapters/canvas/canvasAdapter.ts`
- Create: `src/diagram/adapters/canvas/layout.ts`
- Modify: `src/fileUtils.ts`
- Modify: `src/main.ts`
- Test: `src/tests/canvasAdapter.test.ts`
- Test: `src/tests/canvasLayout.test.ts`

**Status:** Delivered for baseline scope

`.canvas` output, deterministic baseline layout, save flows, and preview/export support are all landed. The implementation still stops at initial auto-layout and does not attempt full round-trip editing semantics, which matches the original scope.

- [x] Add `.canvas` as an output target.
- [x] Cover concept maps, knowledge-organization diagrams, research maps, and task breakdowns first.
- [x] Support the basic mapping from `DiagramSpec` to node/edge/position layout.

**Decisions:**

- Initial layout may remain deterministic auto-layout; drag/writeback is not required in v1.
- Canvas is a native Obsidian asset and should prioritize save/open/vault integration.

**Exit Criteria:**

- Users can emit a `.canvas` file from the same diagram pipeline.
- The generated canvas opens directly in Obsidian.

### Task 6: Add Vega-Lite For Numeric And Comparative Notes

**Files:**
- Create: `src/diagram/adapters/vega/vegaLiteAdapter.ts`
- Create: `src/diagram/adapters/vega/schema.ts`
- Create: `src/rendering/host/iframeRenderHost.ts`
- Modify: `src/rendering/webview/bootstrap.ts`
- Modify: `src/rendering/webview/renderFrame.ts`
- Test: `src/tests/vegaLiteAdapter.test.ts`
- Test: `src/tests/iframeRenderHost.test.ts`

**Status:** Partial

`dataChart` intent, controlled Vega-Lite templates, planner chart defaults, preview/export, and HTML fallback are all landed. The product direction is therefore already proven: numeric and comparative notes do not need to be squeezed into Mermaid.

What remains unfinished is the runtime boundary. `IframeRenderHost` currently carries preview-session and `srcdoc` shell concerns, but Vega-Lite SVG rendering still happens inside plugin runtime through `src/rendering/preview/vegaLitePreview.ts`, which dynamically loads `vega-lite` and `vega`. "Vega-Lite is supported" is true; "Vega-Lite rendering dependencies are isolated through the iframe host" is not fully true yet.

- [x] Route notes with clear data points, trends, comparisons, or shares into `dataChart`.
- [ ] Isolate Vega-Lite rendering dependencies through the iframe host.
- [x] Support six high-value chart templates first: bar, line, area, scatter, pie, and table-like summary.

**Decisions:**

- Do not allow unconstrained freeform Vega authoring from the model; keep to a controlled subset and templates.
- Chart generation must require explicit data evidence instead of allowing invented numbers.

**Exit Criteria:**

- Vega-Lite is a first-class supported non-Mermaid preview path.
- Rendering failures fall back to spec/source JSON instead of silently disappearing.

### Task 7: Theme, Export And Release Hardening

**Files:**
- Modify: `src/rendering/rendererService.ts`
- Modify: `src/ui/DiagramPreviewModal.ts`
- Modify: `styles.css`
- Modify: `README.md`
- Modify: `docs/releases/*.md`
- Test: `src/tests/renderThemeConfig.test.ts`
- Test: `src/tests/renderExportFlow.test.ts`

**Status:** Delivered with explicit support limits

Preview/export theme resolution, UI locale strings, SVG/PNG/source export, and README/release docs are all aligned with current code. The important constraint is that support is now explicit, not universal. HTML currently promises only iframe fallback preview and raw source save, and that must stay aligned in both docs and implementation.

- [x] Align UI language, Obsidian theme, diagram theme, and export options.
- [x] Ship PNG, SVG, and raw source export for supported targets.
- [x] Update docs with support matrix, limitations, downgrade behavior, and troubleshooting.

**Decisions:**

- Promise only the most stable export combinations first; do not rush into PDF, DOCX, or bulk snapshot commitments.
- Docs must clearly distinguish generated files from previewable rendered results.

**Exit Criteria:**

- Users can preview, copy source, and export at least one image format.
- The support matrix for languages, themes, and targets is documented.

### Task 8: Deferred Advanced Engines Evaluation

**Files:**
- Create later if approved: `src/diagram/adapters/plantuml/*`
- Create later if approved: `src/diagram/adapters/graphviz/*`
- Test later: `src/tests/plantumlAdapter.test.ts`

**Status:** Correctly deferred

This is the boundary worth preserving. The platform's real weakness is not a lack of DSL variety; it is incomplete build/runtime isolation, incomplete command convergence, and an unfinished Mermaid-legacy sunset boundary. Adding PlantUML, Graphviz, or Draw.io right now would spread unresolved platform debt onto more DSLs.

- [ ] Evaluate PlantUML, Graphviz, and Draw.io only after the preceding platform tasks are complete.
- [ ] Gather demand evidence before deciding whether implementation should begin.

**Decision Gate:**

- Only proceed when all of the following are true:
  - the renderer platform is stable
  - Mermaid / Canvas / Vega-Lite cover most real demand
  - users have clear scenarios needing more specialized DSLs
  - rendering and distribution strategy is explicit, rather than "generate code first and figure it out later"

## Short, Mid, Long Term Direction Control

### Short Term

Target window: the next diagram-platform convergence batch after current `main`

Focus:

- Keep Task 0's render-host smoke gate intact so future runtime work cannot bypass release/installation constraints
- Finish Task 2's missing command-architecture convergence so legacy and experimental command tracks do not coexist indefinitely
- Finish Task 3's missing `mermaidProcessor.ts` responsibility reduction and sunset boundary
- Decide in Task 6 whether Vega-Lite runtime should stay in plugin runtime or move into a real bundled host

Success markers:

- The next batch no longer mistakes "add more renderers" for the primary problem.
- The boundary between best-fit routing and legacy Mermaid is clearer.
- `src/main.ts` stops being the permanent expansion point for diagram orchestration.

### Mid Term

Target window: `1.9.x`

Focus:

- Move JSON Canvas and Vega-Lite from "functionality exists" to "users can understand and maintain this as a stable product surface"
- Land the packaging and runtime strategy for heavier renderers
- Decide whether HTML/SVG infographic output should graduate from fallback to formal target
- Bind docs, tests, release notes, and support matrix to one truth source

Success markers:

- Experimental diagram functionality no longer requires too much maintainer-only context to understand.
- Non-Mermaid output is not merely possible; it has explainable stability boundaries and failure modes.
- Docs no longer lag behind actual implementation and limitations.

### Long Term

Target window: `2.0+`

Focus:

- Evaluate richer infographic targets only after host/runtime boundaries are fully real
- Evaluate heavy DSLs such as PlantUML and Graphviz only after support-matrix and release discipline are mature
- Consider a unified diagram workspace, batch rendering, and asset indexing

Success markers:

- The diagram platform becomes its own capability domain rather than a sidecar to one command.
- The project has a clear target support matrix, theme contract, render failure model, and release discipline.

## Key Risks And How To Control Them

### Risk: too many new diagram types arrive before the platform abstraction is ready

Control:

- Build the platform interfaces first and land the first two non-Mermaid targets.
- Require every new target format to reuse `DiagramSpec` and `RendererService`.

### Risk: copy `markdown-viewer-extension` wholesale and exceed Notemd's current carrying capacity

Control:

- Borrow only the registry / host / cache design ideas.
- Do not clone offscreen runtimes, multi-end bridges, DOCX export, or the full renderer set.

### Risk: Vega-Lite or HTML heavy-runtime work quietly reintroduces undeclared external host-asset dependencies

Control:

- Keep phase-1 host behavior self-contained inside `main.js`, with continuous bundle smoke audit.
- If a standalone host asset becomes necessary, define release packaging, installation write-out, and capability fallback before implementation.

### Risk: the model invents data while generating specs

Control:

- Require evidence/data extraction for `dataChart`.
- Without explicit numbers, allow only structural diagrams or textual summary cards, not fabricated charts.

### Risk: too much legacy fallback remains and the system becomes a permanent dual stack

Control:

- Give the old Mermaid fixer chain an explicit sunset boundary.
- Every completed adapter should reduce one part of legacy fixer responsibility instead of allowing indefinite coexistence.

## Anti-Goals

The following should not enter the mainline now:

- direct raster AI image generation
- immediate Draw.io round-trip editing
- promising "many chart types" without renderer runtime support
- paths that introduce service-side or license-heavy dependencies for PlantUML / Graphviz
- piling more diagram business logic into `src/main.ts`

## Recommended Next Batch

If work continues now, it should be a convergence batch, not a new-target batch:

1. Finish Task 2's remaining command-architecture convergence
2. Finish Task 3's remaining `mermaidProcessor.ts` responsibility reduction and legacy-fixer sunset boundary
3. Finish Task 6's remaining decision on Vega-Lite heavy-runtime host boundaries
4. Keep strengthening Task 7 so the support matrix is bound more tightly to docs and release contracts
5. Treat Task 0's smoke gate as a hard regression boundary; any move to standalone host assets must upgrade release/install design first

Reason:

- The primary gap is no longer whether `DiagramSpec` or a renderer registry exists; it is whether those capabilities are actually productized.
- Until that gap is closed, every new renderer will stack on unresolved runtime/command/legacy debt and raise future rework cost.

## Verification Gate For Each Phase

Every phase should at least include:

- `npm run build`
- target unit tests pass
- `npm run audit:render-host`
- current Mermaid regression set passes
- clear error surfaces for new renderer failure scenarios
- manual verification of artifact path, preview entrypoint, and export result

Additional requirements for rendering-layer work:

- at least one desktop preview verification record
- at least one mobile-path or fallback-strategy verification record
- docs updated with support matrix and limitations

## Final Recommendation

The best direction is neither "keep strengthening Mermaid fixes" nor "add ten more diagram types immediately."

First productize the diagram platform that already exists. Only then decide what more it should carry.

If this strategy needs a one-line summary:

`spec-first, adapter-driven, productized boundaries before expansion`
