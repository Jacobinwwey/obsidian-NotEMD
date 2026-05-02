---
date: 2026-05-02
topic: progress-audit-next-direction
---

# Progress Audit and Next Direction (v1.8.3+)

## Current State: Code vs Plan Requirements

Reference documents:
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md`
- `docs/brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.md`

### Roadmap Task Status

| Task | Plan Target | Current Reality | Gap |
|---|---|---|---|
| Task 0 | Build/packaging substrate | Delivered with limits. `srcdoc` host in `main.js`. Smoke gate active. Multi-entry build deferred. | Heavy-runtime packaging not started. No blocker. |
| Task 1 | Diagram domain model | Delivered. `DiagramIntent`, `DiagramSpec`, validators, planner all landed. | None. |
| Task 2 | Spec-first pipeline | Partial. Internal orchestration unified (`generateDiagramCommand`). Public command surface still has 3 IDs. `promptUtils.ts` legacy prompt still present. | Command consolidation + prompt retirement. Hard constraint: must preserve original scenario usability. |
| Task 3 | Mermaid adapter V2 | Partial. Subtype adapters cover all 6 Mermaid intents. `legacyFixerUtils.ts` extracted. `mermaidProcessor.ts` still owns too much. | Hard constraint: each sub-task must be verified in real Obsidian with saved images. |
| Task 4 | Rendering platform | Delivered. Registry, service, cache, iframe/inline hosts, preview modal all landed. | None. |
| Task 5 | JSON Canvas | Delivered. `.canvas` output, layout, save, preview. | None. |
| Task 6 | Vega-Lite | Delivered with limits. `dataChart` intent, iframe-host preview with sandbox. Runtime through main bundle bridge. | Packaging boundary (Task 0). |
| Task 7 | Theme/export/release | Delivered. Theme resolution, SVG/PNG/source export, support matrix. | None. |
| Task 8 | Advanced engines | Correctly deferred (R10). | Evaluation gate not met. |

### Notebook-Navigator Cross-Reference Completion

All 5 patterns from `docs/brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.md` are now implemented:

| # | Pattern | Status | Evidence |
|---|---|---|---|
| 1 | Service layer + DI | Deferred | Architectural refactoring, not blocking |
| 2 | LLM response caching | Done | `src/llmUtils.ts` — 5-min TTL Map cache |
| 3 | Per-setting sync toggle | Done | `localOnly` flag, localStorage isolation |
| 4 | Batch pipeline with resume | Done | `src/batchProgressStore.ts` — atomic JSON state |
| 5 | Architecture overview doc | Done | `docs/architecture.md` + `.zh-CN.md` with Mermaid diagrams |

### Additional Deliverables (v1.8.3+)

| Feature | Status | Evidence |
|---|---|---|
| Welcome modal (first install) | Done | `src/ui/WelcomeModal.ts`, 22 locales |
| Sponsor support (GitHub Star + ko-fi) | Done | Settings + welcome modal + README badges |
| Cline-aligned token resolution | Done | `resolveProviderTokenLimit` unknown-model fallback |
| Diagram edge field normalization | Done | `normalizeSpec` handles source/target → from/to |
| Preferred diagram intent selector | Done | Settings dropdown + sidebar quick-access |
| README i18n alignment contract test | Done | 121 tests covering all 30 README files |
| Live diagram intent testing | Done | All 8 intents verified against live DeepSeek API |

### Architecture Advancement Since v1.8.2

**LLM Layer:**
- Response caching reduces API costs for repeated calls
- Token resolution now Cline-aligned for unknown models
- Provider config isolation (`localOnly`) for security
- 25 providers, 5 transports, 22 locales — all stable

**Diagram Platform:**
- 8 diagram intents with live-verified output
- Intent selector in both settings and sidebar
- Edge normalization handles multiple LLM JSON conventions
- Iframe-host preview with sandbox for Vega-Lite
- JSON Canvas as first-class non-Mermaid target

**Infrastructure:**
- Batch progress store for interrupt-resume
- Architecture documentation with Mermaid diagrams
- README alignment contract test (121 tests)
- Welcome modal with full i18n

## Current Architecture Map

```
src/
├── main.ts (2212 lines) — Plugin entrypoint, command orchestration
├── llmProviders.ts — 25 provider definitions, KNOWN_MODEL table
├── llmUtils.ts — Transport dispatch, token resolution, cache, retry
├── batchProgressStore.ts — Interrupt-resume batch state
├── fileUtils.ts — File processing, Mermaid repair
├── searchUtils.ts — Web research
├── translate.ts — Translation pipeline
├── promptUtils.ts — Task prompts (legacy + spec-first)
├── providerDiagnostics.ts — LLM diagnostics
├── types.ts — Settings, provider config types
├── diagram/
│   ├── types.ts — DiagramIntent, DiagramSpec, DiagramEdge
│   ├── spec.ts — Validator, assertValidDiagramSpec
│   ├── planner.ts — Intent inference, plan building
│   ├── diagramGenerationService.ts — Orchestrator
│   ├── diagramSpecResponseParser.ts — JSON parser + normalizer
│   ├── prompts/diagramSpecPrompt.ts — LLM prompt
│   └── adapters/
│       ├── mermaid/ — 6 subtype adapters + validator + legacy utils
│       ├── canvas/ — JSON Canvas adapter
│       └── vega/ — Vega-Lite adapter + schema
├── rendering/
│   ├── rendererRegistry.ts — Renderer registration
│   ├── rendererService.ts — Dispatch to renderers
│   ├── cache/renderCache.ts — Diagram render cache
│   ├── host/ — InlineRenderHost, IframeRenderHost
│   ├── renderers/ — Mermaid, JSON Canvas, Vega-Lite, HTML
│   ├── preview/ — SVG/PNG export
│   └── webview/ — Iframe bootstrap, page, renderFrame
├── ui/
│   ├── NotemdSettingTab.ts — Settings UI
│   ├── NotemdSidebarView.ts — Workbench
│   ├── WelcomeModal.ts — First-install modal
│   ├── DiagramPreviewModal.ts — Diagram preview
│   └── ... — ProgressModal, ErrorModal, modals
├── i18n/
│   ├── index.ts — getI18nStrings, locale resolution
│   ├── taskLanguagePolicy.ts — Per-task language
│   └── locales/ — en, zh_cn, zh_tw, additional (18 locales)
└── tests/ — 110 suites, 708 tests
```

## Verification Gate

All CI-equivalent checks pass:
- `npm run build` ✓
- `npm test -- --runInBand` ✓ (110 suites, 708 tests)
- `npm run audit:i18n-ui` ✓
- `npm run audit:render-host` ✓
- `git diff --check` ✓
- Live DeepSeek API: all 8 diagram intents verified ✓

## Hard Constraints (Still Active)

1. **MermaidProcessor decomposition**: Each sub-task must be individually verified in real Obsidian with saved/checked images. Unit tests insufficient.
2. **Legacy prompt retirement**: Original `promptUtils.ts` Mermaid prompt was specifically tuned. Extensions must fully preserve original scenario usability.
3. **Backward compatibility**: Existing provider configs, transports, and settings must work unchanged.

## Next Direction

Priority order for post-v1.8.3 work, respecting hard constraints:

### Immediate (can proceed without real Obsidian testing)

1. **Command surface consolidation** — Unify `summarize-as-mermaid`, `generate-experimental-diagram`, `preview-experimental-diagram` into a single `generate-diagram` command with mode parameter. Keep old IDs as aliases for backward compat.
   - Effort: Medium. Risk: Low (aliased old IDs).
   - Files: `src/main.ts`, `src/ui/NotemdSidebarView.ts`, `src/workflowButtons.ts`

2. **Runtime packaging (Task 0 remaining)** — Multi-entry build for Vega-Lite heavy runtime.
   - Effort: High. Risk: Medium (release asset packaging changes).
   - Files: `esbuild.config.mjs`, release workflow, `src/rendering/webview/`

### Blocked by Hard Constraints

3. **Legacy prompt retirement** — Requires real Obsidian verification of original Mermaid scenario.
4. **MermaidProcessor sunset** — Requires real Obsidian verification with saved image validation.
5. **PlantUML evaluation** — Deferred per R10 until platform exits experimental gating.

## Next Commit Plan

1. Write this progress document (bilingual)
2. Update roadmap docs with latest status
3. Update audit doc with final state
4. Verify CI clean
5. Commit and push to main

## Acceptance Criteria: Diagram Generation

All 8 diagram intents MUST pass the following acceptance gate before release:

### Gate: Live LLM Verification

Run: `npm test -- --runInBand src/tests/liveAllDiagramIntents.test.ts`

| Intent | Render Target | Node Labels | Edge References | Content Non-Empty |
|---|---|---|---|---|
| `mindmap` | mermaid | ✓ required | ✓ required | ✓ required |
| `flowchart` | mermaid | ✓ required | ✓ required | ✓ required |
| `sequence` | mermaid | ✓ required | ✓ required | ✓ required |
| `classDiagram` | mermaid | ✓ required | ✓ required | ✓ required |
| `erDiagram` | mermaid | ✓ required | ✓ required | ✓ required |
| `stateDiagram` | mermaid | ✓ required | ✓ required | ✓ required |
| `canvasMap` | json-canvas | ✓ required | ✓ required | ✓ required |
| `dataChart` | vega-lite | N/A (data-driven) | N/A | ✓ required |

### Last Verified: 2026-05-02

All 8 intents passed against live DeepSeek API (deepseek-v4-pro).
Total duration: ~226 seconds.

### Regression Gate

Any change to `src/diagram/` must re-run this test suite before merge.
CI should block PRs that modify `src/diagram/` without passing this gate.

### Hard Constraints (Reminder)

1. MermaidProcessor decomposition: each sub-task requires real Obsidian verification with saved/checked images
2. Legacy prompt retirement: must preserve original scenario usability
3. All 8 diagram intents must pass live verification before release
