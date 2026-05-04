# Notemd Architecture Overview

> Updated: 2026-05-02

## System Architecture

```mermaid
flowchart TB
    subgraph User["Obsidian User Interface"]
        CMD["Command Palette"]
        SIDEBAR["Notemd Workbench"]
        SETTINGS["Settings Tab"]
    end

    subgraph Plugin["NotemdPlugin (src/main.ts)"]
        LOAD["loadSettings / saveSettings"]
        DISPATCH["Command Dispatch"]
        BATCH["Batch Processing"]
    end

    subgraph LLM["LLM Pipeline"]
        PROV["Provider Registry<br/>(src/llmProviders.ts)"]
        TOKEN["Token Resolution<br/>(resolveProviderTokenLimit)"]
        CACHE["Response Cache<br/>(llmResponseCache)"]
        TRANS["Transport Layer<br/>5 runtimes"]
    end

    subgraph Diagram["Diagram Platform"]
        PROMPT["Spec Prompt<br/>(diagramSpecPrompt)"]
        GEN["Generation Service<br/>(generateDiagramArtifact)"]
        PARSE["Spec Parser<br/>(parseDiagramSpecResponse)"]
        RENDER["Renderer Service<br/>(RendererRegistry)"]
        HOST["Preview Host<br/>(IframeRenderHost)"]
    end

    subgraph Output["Output"]
        VAULT["Vault Files<br/>(.md, .canvas, .json)"]
        PREVIEW["Diagram Preview Modal"]
        EXPORT["SVG / PNG Export"]
    end

    CMD --> DISPATCH
    SIDEBAR --> DISPATCH
    SETTINGS --> LOAD

    DISPATCH --> PROV
    PROV --> TOKEN
    TOKEN --> CACHE
    CACHE --> TRANS
    TRANS --> GEN
    TRANS --> BATCH

    GEN --> PROMPT
    PROMPT --> PARSE
    PARSE --> RENDER
    RENDER --> HOST
    HOST --> PREVIEW
    HOST --> EXPORT
    RENDER --> VAULT
    BATCH --> VAULT
```

## LLM Calling Pipeline

```mermaid
sequenceDiagram
    participant User
    participant Plugin as NotemdPlugin
    participant Provider as Provider Registry
    participant Token as Token Resolution
    participant Cache as Response Cache
    participant Transport as Transport Layer
    participant API as LLM API

    User->>Plugin: Execute action (process, translate, generate)
    Plugin->>Provider: getLLMProviderDefinition(name)
    Provider-->>Plugin: LLMProviderDefinition (transport, apiKeyMode, ...)
    Plugin->>Token: resolveProviderTokenLimit(provider, model, maxTokens)
    Token->>Token: KNOWN_MODEL_MAX_OUTPUT_TOKENS lookup
    Token-->>Plugin: token limit (number | undefined)
    Plugin->>Cache: buildCacheKey(provider, model, prompt, content)
    Plugin->>Cache: getCachedResponse(cacheKey)
    
    alt Cache hit
        Cache-->>Plugin: cached response
        Plugin-->>User: result
    else Cache miss
        Plugin->>Transport: callLLM(provider, prompt, content, settings)
        Note over Transport: Routes to one of 5 runtimes<br/>openai-compatible | anthropic | google<br/>azure-openai | ollama
        Transport->>API: HTTP request (with retry logic)
        API-->>Transport: response
        Transport-->>Plugin: result
        Plugin->>Cache: setCachedResponse(cacheKey, result)
        Plugin-->>User: result
    end
```

### Token Resolution Logic

```
User config (maxTokens, provider.maxOutputTokens)
  → resolveProviderTokenLimit()
    → Connection test? → return 1
    → Provider maxOutputTokens override set?
      → Known model? → min(override, knownModelMax)
      → Unknown model? → override (as-is)
    → Global maxTokens set?
      → Known model?
        → maxTokens === DEFAULT? → knownModelMax (auto)
        → Otherwise → min(maxTokens, knownModelMax)
      → Unknown model?
        → maxTokens === DEFAULT? → undefined (API decides, Cline-aligned)
        → Otherwise → maxTokens (user value)
    → Otherwise → knownModelMax ?? undefined
```

### Supported Transports

| Transport | Provider Count | Protocol |
|---|---|---|
| `openai-compatible` | 21 providers | OpenAI Chat Completions API |
| `anthropic` | 1 | Anthropic Messages API |
| `google` | 1 | Google Gemini API |
| `azure-openai` | 1 | Azure OpenAI Deployment API |
| `ollama` | 1 | Ollama Native API |

## Diagram Rendering Platform

```mermaid
flowchart LR
    subgraph Input["Input"]
        MD["Markdown Content"]
        INTENT["Preferred Intent<br/>(optional)"]
    end

    subgraph Spec["Spec Plane"]
        PLAN["DiagramPlan<br/>(intent inference)"]
        PROMPT2["DiagramSpec Prompt"]
        LLM["LLM Invocation"]
        PARSE2["Spec Parser"]
        VALIDATE["Spec Validator"]
    end

    subgraph Render["Render Plane"]
        REGISTRY["RendererRegistry<br/>7 renderers"]
        SERVICE["RendererService"]
        CACHE2["RenderCache"]
    end

    subgraph Target["Output Targets"]
        MERMAID["Mermaid<br/>(flowchart, sequence, class, ER, state, mindmap)"]
        CANVAS["JSON Canvas<br/>(canvasMap)"]
        VEGA["Vega-Lite<br/>(dataChart)"]
        HTML["HTML Fallback"]
    end

    subgraph Host["Preview Layer"]
        IFRAME["IframeRenderHost"]
        MODAL["DiagramPreviewModal"]
        EXPORT2["SVG / PNG Export"]
    end

    MD --> PLAN
    INTENT --> PLAN
    PLAN --> PROMPT2
    PROMPT2 --> LLM
    LLM --> PARSE2
    PARSE2 --> VALIDATE
    VALIDATE --> SERVICE
    SERVICE --> REGISTRY
    REGISTRY --> MERMAID
    REGISTRY --> CANVAS
    REGISTRY --> VEGA
    REGISTRY --> HTML
    MERMAID --> IFRAME
    CANVAS --> IFRAME
    VEGA --> IFRAME
    IFRAME --> MODAL
    MODAL --> EXPORT2
```

### Supported Diagram Intents

| Intent | Render Target | Renderer | Preview | Export |
|---|---|---|---|---|
| `mindmap` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `flowchart` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `sequence` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `classDiagram` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `erDiagram` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `stateDiagram` | mermaid | MermaidRenderer | modal/iframe | SVG, PNG |
| `canvasMap` | json-canvas | JsonCanvasRenderer | modal/iframe | SVG, source |
| `dataChart` | vega-lite | VegaLiteRenderer | modal/iframe (sandboxed) | SVG, source |

## Module Map

| Module | Responsibility |
|---|---|
| `src/main.ts` | Plugin entrypoint, command registration, orchestration |
| `src/llmProviders.ts` | 25 provider definitions, metadata, KNOWN_MODEL table |
| `src/llmUtils.ts` | Transport dispatch, token resolution, retry, response cache |
| `src/fileUtils.ts` | File processing, Mermaid repair, concept extraction |
| `src/searchUtils.ts` | Web research, Tavily/DuckDuckGo integration |
| `src/translate.ts` | Translation pipeline with chunking |
| `src/promptUtils.ts` | Task-specific prompts (legacy + spec-first) |
| `src/diagram/` | Diagram domain model, adapters, renderers |
| `src/rendering/` | Render host, preview, export, theme |
| `src/ui/` | Settings tab, sidebar, modals, welcome screen |
| `src/i18n/` | 22 locales, task language policy |
| `src/batchProgressStore.ts` | Interrupt-resume batch state persistence |
| `src/providerDiagnostics.ts` | LLM provider connection diagnostics |

## CLI Boundary Reality

Current host evidence matters:

- the local stable wrapper `obsidian-cli` on this machine exposes desktop/debug entrypoints such as `help`, `version`, `vaults`, `vault`, `doctor`, `native`, `gui`, and `debug`
- the underlying official `obsidian` CLI already supports `commands` and `command id=<command-id>`, and it can list/execute plugin-registered commands
- however, this is still only a **command trigger surface**, not a mature plugin integration protocol with typed arguments, result contracts, capability metadata, or stable automation semantics

That means Notemd's future CLI story still cannot stop at "reuse sidebar buttons from the terminal". The real extraction targets are lower-level capabilities that already have partial independent shape:

- `src/providerDiagnostics.ts`
- `src/diagram/diagramGenerationService.ts`
- `src/workflowButtons.ts`
- `src/batchProgressStore.ts`
- config/profile semantics such as `LLMProviderConfig.localOnly`

The architectural gap is that `src/main.ts` still owns too much orchestration, UI lifecycle, and Obsidian runtime coupling. Until a host-neutral operation layer exists, plugin command IDs can be triggered from the official CLI, but they still remain product surfaces rather than stable engineering APIs.

## Key Design Decisions

1. **Spec-first diagram generation**: LLM emits structured `DiagramSpec` JSON, not raw Mermaid syntax. Decouples intent from renderer.
2. **Transport-driven dispatch**: 21 OpenAI-compatible providers share one runtime. No per-provider code paths.
3. **Cline-aligned token resolution**: Unknown models defer to API provider. Known models use metadata table.
4. **Iframe-host preview**: Vega-Lite and HTML rendered in sandboxed iframe. Mermaid rendered inline.
5. **LocalOnly provider storage**: API keys can be device-local while workflow settings sync.
6. **Response caching**: Identical LLM calls within 5-minute TTL return cached results.

## Verification

- `npm run build` — TypeScript compilation + esbuild bundle
- `npm test -- --runInBand` — 109 suites, 585 tests
- `npm run audit:i18n-ui` — No hardcoded UI strings
- `npm run audit:render-host` — Render host self-contained in main.js
- `git diff --check` — Whitespace hygiene
