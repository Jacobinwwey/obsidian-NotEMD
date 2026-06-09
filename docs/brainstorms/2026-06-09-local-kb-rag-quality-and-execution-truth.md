---
date: 2026-06-09
topic: local-kb-rag-quality-and-execution-truth
canonical: true
---

# Local KB RAG Quality And Execution Truth

## 1. Why This Document Exists

The current local knowledge-base retrieval slice is already shipped on `main`, but its clearest execution-chain and quality-evaluation framing originally lived under:

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/rag-quality-evaluation.md`

That development artifact is useful, but it is still local workflow state rather than repo-owned truth.

This document mirrors the execution facts that current `main` actually ships and the evaluation lens that should guide further Stage-C quality work.

## 2. Current Runtime Boundary

The shipped retrieval path is intentionally narrow:

1. plugin-native
2. local-only
3. in-process
4. server-free
5. GPU-free
6. embedding-free
7. lexical-first rather than semantic/vector retrieval

Concrete implementation files:

- `src/localKnowledgeBase.ts`
- `src/markdownSectionUtils.ts`
- `src/fileUtils.ts`
- `src/searchUtils.ts`
- `src/main.ts`
- `src/operations/diagramGenerateOperation.ts`

Correct interpretation:

1. this is a bounded prompt-augmentation path, not a generalized RAG platform;
2. current `main` should not be described as already carrying a vector store, reranker, or background retrieval service;
3. future semantic retrieval work would be a new architecture decision, not a hidden extension of the current lane.

## 3. Actual Execution Chain

### 3.1 Settings gate

The retrieval path is only active when the settings surface enables it.

Current relevant controls include:

1. `enableLocalKnowledgeRetrieval`
2. default knowledge-base paths
3. per-task enablement and path overrides for:
   - `Generate from title`
   - `Batch generate from titles`
   - `Research & summarize`
   - `Generate diagram`
4. retrieval controls:
   - `localKnowledgeTopK`
   - `localKnowledgeSlidingWindowSize`
   - `localKnowledgeMaxSnippetChars`
   - `localKnowledgeExcludeCurrentFile`

### 3.2 Candidate file enumeration

The runtime enumerates vault files through the Obsidian vault API and narrows them to configured vault-relative paths.

Current file-selection truth:

1. configured file paths and folder paths can coexist in the same knowledge-base list;
2. retrieval stays bounded to those configured sources instead of scanning the whole vault by default;
3. non-retrievable or irrelevant files do not fail the task path; they are just excluded from retrieval candidates.

### 3.3 Heading-aware chunking

Search units are section-level rather than whole-file.

Current code truth:

1. Markdown is split through heading-aware section parsing;
2. fenced code blocks are preserved for excerpt fidelity but removed from search text;
3. retrieval therefore works on section-level documents rather than entire notes.

This matters because the current quality bar is better than whole-file stuffing even though it is still lexical-first.

### 3.4 Search normalization and indexing

The runtime normalizes search text and builds a lexical MiniSearch index.

Current index truth:

1. indexed fields include:
   - `fileTitle`
   - `heading`
   - `breadcrumb`
   - `content`
2. search remains lexical, with bounded prefix/fuzzy behavior;
3. field boosts still prioritize title/heading/breadcrumb matches over raw body text.

### 3.5 Query execution and window expansion

Current query behavior is deliberately modest:

1. lexical search runs first;
2. the retained hits can expand through `localKnowledgeSlidingWindowSize`;
3. adjacent sections are appended conservatively and deduplicated so the same note region is not injected repeatedly.

This is the key current-main compromise:

1. it improves local neighborhood recall without jumping to a heavier semantic stack;
2. it preserves a bounded runtime and prompt-shaping surface.

### 3.6 Prompt injection and result telemetry

Retrieved context is formatted and injected only into the supported task paths.

Current task-scoped injection truth:

1. `Generate from title`
   - queries from the note title
2. `Batch generate from titles`
   - queries from each title item while reusing a shared retriever when possible
3. `Research & summarize`
   - queries from the explicit topic or source basename
4. `Generate diagram`
   - derives a diagram-source retrieval query from the file stem plus bounded source content

Current observability truth:

1. machine-readable retrieval summaries now exist on the title-generation, research, and artifact-mode diagram result paths;
2. current summaries cover indexed counts, matched/returned section counts, expanded section counts, source paths, requested `topK`, sliding-window size, current-file exclusion telemetry, index-build timing, query timing, and final context size;
3. `local-knowledge.inspect` remains the richer maintainer-only explainability seam for effective path/query/context debugging.

## 4. Current Quality Judgment

### 4.1 What the current design does well

1. runtime fit is excellent for an Obsidian plugin;
2. section-level retrieval is materially better than whole-note stuffing;
3. disabled retrieval and empty-context cases fall back conservatively to the legacy task path;
4. the operational blast radius stays low because there is no daemon, cloud service, vector DB, or model bootstrap layer.

### 4.2 What the current design does poorly

1. retrieval quality is still lexical-first;
2. synonym and paraphrase matching remain weaker than embedding + rerank systems;
3. there is still no reranker;
4. there is still no persisted longitudinal relevance harness;
5. freshness remains rebuild-only rather than incremental.

Correct interpretation:

1. the current retrieval slice is maintainable and bounded;
2. it is not yet a mature metric-driven RAG subsystem.

## 5. `ragas` And `RAGPerf` As Evaluation References

### 5.1 Why `ragas` matters

`ragas` is not a runtime implementation candidate for current `main`.

It matters because it asks the right product-quality questions:

1. did retrieval improve factual grounding;
2. did retrieval improve completeness;
3. which query classes still regress;
4. where lexical retrieval misses synonym or paraphrase intent.

Current Notemd gap exposed by `ragas`:

1. there is no answer-grounding scorecard inside the repo's regular verification flow;
2. current confidence still comes from tests, real-note fixtures, and operator inspection rather than a formal judged-answer harness.

The right near-term move is to borrow the evaluation mindset off the hot path, not to embed `ragas` into the plugin runtime.

### 5.2 Why `RAGPerf` matters

`RAGPerf` is also not a runtime implementation candidate for current `main`.

It matters because it asks the right system-quality questions:

1. how much latency does retrieval add;
2. how does index-build cost change with corpus size;
3. how much prompt growth does sliding-window expansion cause;
4. how should retrieval overhead be separated from LLM latency.

Current Notemd gap exposed by `RAGPerf`:

1. the runtime is lightweight by architecture, but not yet formally benchmarked by corpus size or phase decomposition;
2. current evidence is still bounded telemetry plus real-note fixtures rather than a benchmarking harness.

The right near-term move is to borrow its decomposition discipline:

1. keep indexed-file and indexed-section counts explicit;
2. keep build/query timing explicit;
3. keep prompt-size inflation observable;
4. avoid turning that evaluation layer into a new runtime dependency.

## 6. Repo-Owned Guidance

Unless a later explicit architecture decision changes the lane:

1. keep describing current local-KB as a plugin-native MiniSearch lexical retriever with task-scoped prompt injection;
2. keep using `npm run verify:local-kb-fixtures` as the main offline evidence surface for real-note/query diversity;
3. keep `local-knowledge.inspect` maintainer-only unless a future public-promotion batch lands matching contract, docs, and tests;
4. do not overclaim semantic/vector retrieval or a server-backed RAG subsystem;
5. treat any future semantic/vector expansion as a new architecture lane that must re-prove runtime fit, packaging fit, and maintenance cost.
