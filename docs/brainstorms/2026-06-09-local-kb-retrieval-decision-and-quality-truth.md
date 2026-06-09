---
date: 2026-06-09
topic: local-kb-retrieval-decision-and-quality-truth
canonical: true
---

# Local KB Retrieval Decision And Quality Truth

## 1. Why This Document Exists

The current local knowledge-base retrieval slice is already shipped on `main`, but the clearest comparison research and evaluation framing originally lived under:

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/local-kb-retrieval-options.md`
- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/rag-quality-evaluation.md`
- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/knowledge-management-and-toc-comparison.md`

Those files are useful development context, but `.trellis/` is local workflow state rather than repo-owned truth.

This document mirrors the decision that current `main` actually ships and the evaluation lens that should guide future work.

The deeper execution-chain and chapter-split comparison details are now mirrored into tracked repo docs as well:

1. `docs/brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md`
2. `docs/brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md`

## 2. Current Runtime Truth

The shipped local-KB path is:

1. plugin-native
2. local-only
3. in-process
4. server-free
5. GPU-free
6. embedding-free

Concrete implementation files:

- `src/localKnowledgeBase.ts`
- `src/markdownSectionUtils.ts`
- `src/fileUtils.ts`
- `src/searchUtils.ts`
- `src/main.ts`
- `src/operations/diagramGenerateOperation.ts`

The retrieval design is not a generalized semantic RAG system. It is a bounded prompt-augmentation path built on:

1. vault-relative file/folder path selection
2. heading-aware section parsing
3. lexical MiniSearch indexing
4. optional sliding-window section expansion
5. task-scoped prompt injection for:
   - `Generate from title`
   - `Batch generate from titles`
   - `Research & summarize`
   - `Generate diagram`

## 3. Candidate Comparison Outcome

### 3.1 Chosen implementation base

**MiniSearch** remains the correct implementation base for current `main`.

Why:

1. TypeScript-native and directly embeddable into the Obsidian plugin runtime
2. no server / daemon / companion process
3. no vector database bootstrap
4. no Python runtime dependency
5. small enough operational blast radius for the bounded current-main slice

### 3.2 Rejected as direct runtime bases

These remain reference systems, not direct implementation bases for the shipped lane:

1. **LightRAG**
   - strong RAG/KG feature set
   - rejected because it is Python-first and operationally much heavier than an in-plugin retrieval slice
2. **txtai**
   - mature semantic search framework
   - rejected because it pushes the architecture toward a Python / service / model-management lane
3. **Mem0 / Embedchain**
   - useful memory/retrieval framing
   - rejected because it assumes a larger dependency and storage surface than current `main` should carry

### 3.3 Product references, not implementation bases

These remain useful references for future direction, but still not the right base for the current shipped lane:

1. **Smart Connections**
   - useful vault-centric retrieval product reference
   - still heavier in runtime assumptions than the bounded Notemd slice
2. **Smart Composer**
   - useful future reference for richer embedding / DB-assisted local knowledge
   - still outside the maintainability budget of current `main`
3. **notebook-navigator**
   - useful engineering-discipline and documentation reference
   - not a retrieval implementation reference

## 4. Quality Truth

### 4.1 What the current design does well

1. Runtime fit is excellent for an Obsidian plugin
2. heading-aware sectioning is materially better than whole-file stuffing
3. failure mode is conservative:
   - disabled retrieval keeps legacy behavior
   - empty retrieval keeps legacy behavior
4. operation cost is low and packaging-safe

### 4.2 What the current design does poorly

1. retrieval quality is still lexical-first
2. synonym/paraphrase matching is weaker than embedding+rerank systems
3. there is no reranker
4. there is no persisted longitudinal relevance harness
5. freshness is rebuild-only rather than incremental

### 4.3 How to judge the next improvement

`ragas` and `RAGPerf` remain evaluation references rather than runtime dependencies.

They are useful because they force the right questions:

1. Did retrieval improve grounding?
2. Did retrieval improve completeness?
3. What query classes regress?
4. How much latency and prompt inflation does retrieval add?

The correct current-main response is:

1. keep the runtime lightweight
2. borrow the evaluation mindset off the hot path
3. continue improving offline evidence through `npm run verify:local-kb-fixtures`

## 5. Current Guidance

Unless a later explicit architecture decision changes the lane:

1. continue describing current local-KB as a plugin-native MiniSearch lexical retriever with task-scoped prompt injection
2. do not overclaim semantic/vector retrieval
3. do not imply that current `main` already carries a server-backed or embedding-backed RAG subsystem
4. treat any future semantic/vector expansion as a new architecture lane that must re-prove runtime fit, packaging fit, and maintenance cost
