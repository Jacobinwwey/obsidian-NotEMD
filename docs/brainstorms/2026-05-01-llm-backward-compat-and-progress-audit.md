---
date: 2026-05-01
topic: llm-backward-compat-progress-audit
---

# LLM Calling Backward Compatibility and Progress Audit (v1.8.2)

## Problem Frame

The LLM calling layer has been updated with:
1. Cline-aligned `KNOWN_MODEL_MAX_OUTPUT_TOKENS` metadata table
2. `resolveProviderTokenLimit` with model-aware clamping
3. Provider-specific UI controls (DeepSeek thinking toggle, Azure API version, etc.)
4. Edge field normalization in diagram spec parser

These changes must NOT break existing user configurations: providers configured under v1.8.1 must continue working identically under v1.8.2 without reconfiguration.

## Backward Compatibility Audit

### `resolveProviderTokenLimit` Behavior Matrix

| Scenario | v1.8.1 | v1.8.2 | Compat? |
|---|---|---|---|
| Known model + default maxTokens | 8192 (global) | known-model-max (e.g., 128K for Claude) | **Enhanced** — better cap, no breakage |
| Known model + custom maxTokens (below ceiling) | user value | user value (unchanged) | ✓ |
| Known model + provider maxOutputTokens override | override (unclamped) | min(override, known-max) | **Enhanced** — safer clamp |
| Unknown model + default maxTokens | 8192 | undefined (API decides, Cline-aligned) | **Behavior change** — API default may differ from 8192 |
| Unknown model + custom maxTokens | user value | user value (unchanged) | ✓ |
| Connection test | 1 | 1 (unchanged) | ✓ |

**Risk assessment for the "behavior change" cell:**
- Users who relied on `maxTokens: 8192` default for unknown/new models will now get the API provider's default instead.
- For OpenAI-compatible endpoints, this typically means the model's own default (often higher than 8192).
- This is a soft improvement: the old 8192 cap was arbitrary and potentially limiting.
- Zero config changes required from users.

### Transport-Level Backward Compatibility

| Transport | v1.8.1 | v1.8.2 | Change? |
|---|---|---|---|
| OpenAI-compatible | Shared runtime via `callOpenAICompatibleApi` | Same, plus `resolveProviderTokenLimit` | Only token resolution |
| Anthropic | Native Messages API | Same | Only token resolution |
| Google | Native Gemini API | Same | Only token resolution |
| Azure OpenAI | Deployment mode | Same | Only token resolution |
| Ollama | Native Ollama API | Same | Only token resolution |

No transport routing changes. No protocol changes. All existing API keys, base URLs, and model IDs continue working unchanged.

### Provider Definition Backward Compatibility

All 25 provider definitions preserved. The only additions are:
- `KNOWN_MODEL_MAX_OUTPUT_TOKENS` table (read-only lookup, does not affect provider configs)
- `maxOutputTokens` field on `LLMProviderConfig` (optional, defaults to undefined — no effect on existing configs)

### UI Setting Tab Backward Compatibility

- Provider-specific controls (DeepSeek thinking, Azure API version) are gated by provider name
- Non-OpenAI transports show `maxOutputTokens` field (new, optional)
- All existing settings fields preserved in identical positions
- No settings migration required

### Diagram Pipeline Backward Compatibility

- `normalizeSpec` in `diagramSpecResponseParser.ts` now handles `source`/`target` → `from`/`to`
- `buildDiagramSpecPrompt` now explicitly instructs LLMs about edge field names
- Existing Mermaid output unchanged; only LLM-generated specs benefit from normalization
- Legacy Mermaid fixer path untouched

## Current Architecture Progress vs Plan Requirements

Reference documents:
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md`

### Task 0: Build And Packaging Substrate — Delivered with explicit limits

| Requirement | Status | Evidence |
|---|---|---|
| Render host self-contained in main.js | ✓ | `scripts/audit-render-host-bundle.js` passes |
| Smoke gate enforces no external host assets | ✓ | Release workflow includes audit |
| Multi-entry build strategy | ✗ | `esbuild.config.mjs` still single-entry |

**Next:** Heavy-runtime packaging remains the open boundary. Not blocking current release.

### Task 1: Diagram Domain Model And Intent Router — Delivered

All types, validators, planner, intent router landed. Tests pass.

### Task 2: Spec-First Pipeline Integration — Partial

| Requirement | Status | Evidence |
|---|---|---|
| Shared `generateDiagramCommand` executor | ✓ | `src/main.ts` uses unified path |
| Legacy/compat dual tracks converged | ✓ | Internal orchestration unified |
| Public command surfaces consolidated | ✗ | Dual command IDs still coexist (`summarize-as-mermaid` + `generate-experimental-diagram`) |
| `promptUtils.ts` legacy Mermaid prompt retired | ✗ | Still contains `mindmap`-bound legacy prompt |

**Hard Constraint:** The legacy Mermaid prompt in `promptUtils.ts` was specifically tuned for the original scenario. Any extension or retirement MUST fully preserve the original scenario's usability. Cross-version stability and user experience continuity take priority over cleanup. Command ID consolidation remains the next target; prompt retirement requires real Obsidian verification first. Not blocking v1.8.2.

### Task 3: Mermaid Adapter V2 — Partial (excluded per user directive)

Per user instruction, MermaidProcessor decomposition is deferred for robustness.

**Hard Constraint:** Each sub-task MUST be individually verified in a real Obsidian instance before proceeding. Diagram output images MUST be saved, checked, and confirmed complete and correct. Unit tests alone are not sufficient to advance beyond any sub-task boundary. Current state:
- Subtype adapters cover mindmap, flowchart, sequence, class, ER, state
- Pipe-label escaping in adapter emit
- `legacyFixerUtils.ts` extracted from `mermaidProcessor.ts`
- Full decomposition not completed — by design for v1.8.2 stability

### Task 4: Rendering Platform Skeleton — Delivered

RendererRegistry, RendererService, RenderCache, InlineRenderHost, IframeRenderHost, DiagramPreviewModal all landed.

### Task 5: JSON Canvas Output — Delivered

.canvas output, baseline layout, save flows, preview support landed.

### Task 6: Vega-Lite Output — Delivered with explicit limits

| Requirement | Status | Evidence |
|---|---|---|
| dataChart intent routing | ✓ | Planner routes to Vega-Lite |
| Iframe-host preview routing | ✓ | `iframeRenderHost.ts` with target-specific sandbox |
| Controlled chart templates (bar, line, area, scatter, pie) | ✓ | `vegaLiteAdapter.ts` template set |
| Heavy-runtime packaging | ✗ | Still through main bundle bridge |

### Task 7: Theme, Export And Release Hardening — Delivered

Theme resolution, locale strings, SVG/PNG/source export, README alignment landed.

### Task 8: Advanced Engines — Correctly Deferred

PlantUML, Graphviz, Draw.io remain deferred per R10 of phase-2 requirements.

## LLM Provider Architecture: Current State

### Known Model Coverage

`KNOWN_MODEL_MAX_OUTPUT_TOKENS` covers 15 provider namespaces:
- DeepSeek, OpenAI, Anthropic, Google, Azure OpenAI
- Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax
- Mistral, xAI, Groq, Fireworks, Huawei Cloud MaaS
- OpenRouter, Requesty (router compatibility)

Total: ~140 model entries across all namespaces.

### Provider Definitions

25 provider definitions in `LLM_PROVIDER_DEFINITIONS`:
- 14 cloud providers
- 3 gateway/routers
- 2 local providers
- 6 Chinese ecosystem providers (Qwen, Doubao, Moonshot, GLM, Z AI, MiniMax, Baidu Qianfan, SiliconFlow, Huawei Cloud MaaS)

### Transport Architecture

4 transport runtimes:
- `openai-compatible` — shared for 21 providers
- `anthropic` — native Messages API
- `google` — native Gemini API
- `azure-openai` — deployment mode
- `ollama` — native Ollama API

### Token Resolution Pipeline

```
User config (maxTokens, provider.maxOutputTokens)
  → resolveProviderTokenLimit()
    → KNOWN_MODEL_MAX_OUTPUT_TOKENS lookup
    → clamp/clip logic
    → return number | undefined
  → transport-specific API call
    → max_tokens / maxOutputTokens / num_predict
```

## Current Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Unknown model + default maxTokens behavior change | Low | Cline-aligned; API default typically better than arbitrary 8192 |
| Dual command surface (legacy + experimental) | Medium | Internal orchestration unified; public surface awaits consolidation |
| `src/main.ts` still grows with diagram orchestration | Medium | Deferred to post-v1.8.2 convergence batch |
| Heavy-runtime packaging gap | Low | Not blocking current release; srcdoc host stable |

## Next Direction

Priority order for post-v1.8.2 work:

1. **Command convergence** — Unify `summarize-as-mermaid` and `generate-experimental-diagram` command surfaces
2. **Legacy prompt retirement** — Remove `mindmap`-bound prompt from `promptUtils.ts`
3. **Runtime packaging** — Multi-entry build for heavy preview runtimes (Vega-Lite, future PlantUML)
4. **MermaidProcessor sunset** — Complete the decomposition started in `legacyFixerUtils.ts`
5. **PlantUML evaluation gate** — Only after Tasks 1-4 are complete, per R10

Scope boundaries for v1.8.2:
- No command consolidation (too risky near release)
- No prompt retirement 
- No new provider additions
- No build system changes
- Only: LLM token resolution hardening + diagram edge normalization

## Verification Gate

All CI-equivalent checks pass:
- `npm run build` ✓
- `npm test -- --runInBand` ✓ (111 suites, 592 tests)
- `npm run audit:i18n-ui` ✓
- `npm run audit:render-host` ✓
- `git diff --check` ✓

## Decisions

1. **Cline-aligned unknown model behavior**: When `maxTokens` is at default (8192) and model is unknown, return `undefined` → API provider decides. User-custom values preserved.
2. **Edge field normalization**: Always normalize `source`/`target` → `from`/`to` in diagram spec parsing, regardless of LLM's preferred convention.
3. **MermaidProcessor deferral**: Per explicit user directive, skip decomposition for v1.8.2 stability.
4. **No transport changes**: All 5 transport runtimes unchanged. Only token resolution logic modified.

## Next Steps

Commit to main. Tag v1.8.2 when ready. Begin command convergence in next batch.


## Cross-Reference: notebook-navigator Design Patterns

Reference: `https://github.com/johansan/notebook-navigator` (v2.5.6)

notebook-navigator is a notes browser plugin (React, IndexedDB, virtual scrolling, 100K+ notes scale). It has zero LLM integration. The cross-reference value is in its **engineering patterns**, not its feature surface.

### Pattern 1: Service Layer with Dependency Injection

**NN approach:** 23 service classes in `src/services/` organized into sub-directories. `ServicesContext` provides singleton access via React contexts. Each service has single ownership, clear lifetime, and explicit dependencies.

**NotEMD gap:** `src/llmUtils.ts` (~3000 lines) and `src/fileUtils.ts` are monolithic utility files with no service boundaries. All functions are exported globally with no dependency injection.

**Improvement angle:** Extract a `LlmService` (wrapping `callLLM`, `testAPI`, `resolveProviderTokenLimit`) and a `FileProcessingService` (wrapping `processFile`, batch ops, concept extraction). Keep the existing exported function signatures for backward compat; add service-class wrappers that delegate to them internally.

**Priority:** Low. Not blocking v1.8.2. Value is in maintainability, not user-facing behavior.

### Pattern 2: Layered Storage with Cache Invalidation

**NN approach:** IndexedDB (persistent) → MemoryFileCache (synchronous mirror) → LRU caches (preview text, feature images). mtime-based incremental updates. Cache rebuild on vault change.

**NotEMD gap:** No caching layer. LLM responses are re-fetched on every call. Diagram outputs are regenerated from scratch. `RenderCache` exists for diagram rendering but is in-memory only, session-scoped.

**Improvement angle:** Persist LLM responses keyed by (provider, model, prompt hash, content hash) to reduce API costs for repeated processing. Cache diagram specs keyed by (markdown hash, intent, target). Obsidian's `localStorage` or vault-adjacent JSON files are sufficient (IndexedDB is overkill for NotEMD's single-file processing model).

**Priority:** Medium. Cost savings on API calls, faster re-processing. Post-v1.8.2.

### Pattern 3: Per-Setting Sync Toggle

**NN approach:** Each setting has a sync toggle (cloud icon). When enabled → `data.json` (synced across devices). When disabled → `localStorage` (device-specific). No global sync flag; per-setting granularity.

**NotEMD gap:** All settings stored in `data.json`. Provider API keys sync across devices (potential security concern if vault is shared). Workflow preferences also sync (may not be desired).

**Improvement angle:** Add a `localOnly` flag to `LLMProviderConfig`. When set, the provider config (including API key) is stored in Obsidian's `localStorage` instead of `data.json`. This keeps API keys device-local while allowing workflow settings to sync.

**Priority:** Low-Medium. Security improvement. Not urgent.

### Pattern 4: Pipeline Processing with Completion Signals

**NN approach:** Metadata pipeline has three layers (vault sync → derived content → tree indexing) with explicit completion signals. Background processing with progress tracking.

**NotEMD gap:** Batch processing (`processFolder`, `batchTranslate`, `batchGenerateContent`) runs sequentially with basic progress reporting. No pipeline stages, no completion signals, no resume-after-interrupt.

**Improvement angle:** Structure batch processing as pipeline stages: (1) file discovery + mtime check, (2) LLM processing with retry, (3) file write + metadata update. Track per-file completion so interrupted batches can resume. Add a progress store (vault-adjacent JSON) to persist batch state across Obsidian restarts.

**Priority:** Medium. Resilient batch processing. Post-v1.8.2.

### Pattern 5: Architecture Documentation

**NN approach:** 8 dedicated architecture docs covering startup process, metadata pipeline, storage architecture, rendering architecture, scroll orchestration, service architecture. All include Mermaid diagrams. Updated with dates.

**NotEMD state:** 36 docs pages. Strong on plans/brainstorms/roadmaps. Weaker on architecture walkthroughs. No single-page architecture overview showing the full system.

**Improvement angle:** Add a `docs/architecture.md` (bilingual) showing: provider registry → token resolution → transport dispatch → LLM call → response parsing, and diagram pipeline: spec prompt → LLM invocation → spec parse → renderer dispatch → preview/export. Include Mermaid diagrams. This makes the system understandable without reading source.

**Priority:** Low. Documentation quality. Not urgent.

### Improvement Priority Summary

| # | Pattern | Priority | Effort | Blocking v1.8.2? |
|---|---|---|---|---|
| 1 | Service layer + DI | Low | High | No |
| 2 | LLM response caching | Medium | Medium | No |
| 3 | Per-setting sync toggle | Low-Medium | Low | No |
| 4 | Batch pipeline with resume | Medium | Medium | No |
| 5 | Architecture overview doc | Low | Low | No |

None block v1.8.2. All are post-release improvements.
