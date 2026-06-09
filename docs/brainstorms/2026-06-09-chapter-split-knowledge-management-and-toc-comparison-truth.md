---
date: 2026-06-09
topic: chapter-split-knowledge-management-and-toc-comparison-truth
canonical: true
---

# Chapter Split Knowledge Management And TOC Comparison Truth

## 1. Why This Document Exists

The chapter-split and TOC product slice is already shipped on `main`, but its clearest external comparison originally lived under:

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/knowledge-management-and-toc-comparison.md`

That research is still useful, but it is local workflow state rather than repo-owned truth.

This document mirrors the current chapter-split contract, the most relevant comparison conclusions, and the bounded improvement direction that current `main` should keep.

## 2. Current Notemd Chapter-Split Truth

Relevant implementation files:

- `src/markdownSectionUtils.ts`
- `src/chapterSplit.ts`

Current shipped semantics:

1. heading-aware section parsing
2. explicit split-level control (`Auto` / `H1`-`H6`)
3. split output emitted beside the source note under `<basename>_chapters/`
4. TOC output emitted as `<basename>_TOC.md`
5. generated-file manifest emitted as `.notemd-chapter-split.json`
6. stale generated chapter files removed on rerun
7. guarded rerun protection against silently overwriting manually edited generated artifacts
8. repeated-heading-safe nested block references
9. deterministic TOC front-matter metadata

Correct interpretation:

1. this is not just TOC insertion;
2. this is a managed-artifact write contract;
3. current `main` should describe chapter split as deterministic note materialization plus TOC extraction, not as an ad hoc text transform helper.

## 3. Comparison Outcome

### 3.1 `andrej-karpathy-skills`

What matters from this reference is not TOC generation.

Its useful contribution is knowledge-consumption discipline:

1. instructions stay short and opinionated;
2. tradeoffs stay explicit;
3. success criteria stay verifiable;
4. speculative abstraction stays constrained.

Comparison with current Notemd:

1. Notemd is stronger on actual vault-facing transformation because it already writes reusable Obsidian files;
2. Notemd is weaker on explicit consumption discipline because the repo has only partial guidance on how downstream agents or workflows should prefer:
   - TOC
   - chapter notes
   - original source note

Repo-owned conclusion:

1. borrow the discipline, not the packaging model;
2. keep chapter-split docs and maintainer examples explicit about the generated-artifact contract and intended consumption order.

### 3.2 `kpm`

`kpm` matters because it treats knowledge as structured, hierarchical, and artifact-like.

Useful ideas:

1. hierarchy is first-class;
2. entry files summarize child knowledge;
3. generated knowledge modules are treated as install artifacts rather than casual hand-edited notes.

Comparison with current Notemd:

1. Notemd is stronger for live-vault iteration because it writes artifacts beside the source note with almost no ceremony;
2. Notemd is weaker on package-like metadata and curated entry-file semantics;
3. the current TOC file is useful, but intentionally lighter than a full package index model.

Repo-owned conclusion:

1. keep chapter outputs as managed artifacts rather than pretending they are ordinary source notes;
2. preserve the manifest as the authority for reruns and cleanup;
3. borrow organizational discipline without importing package-management burden.

### 3.3 `markdown-toc` (JavaScript)

This reference matters because it is mature at heading parsing and TOC ergonomics.

Useful ideas:

1. repeated-heading handling
2. code-block-safe parsing
3. options such as filter/max-depth
4. explicit slug/anchor control

Comparison with current Notemd:

1. Notemd is stronger because it goes beyond in-file TOC insertion and materializes chapter notes plus a manifest;
2. Notemd is weaker because it still exposes less configurability around TOC depth and slug strategy.

Repo-owned conclusion:

1. keep the current default separation between source note and generated TOC because it is safer for vault notes;
2. continue hardening repeated-heading and anchor semantics with tests before considering optional TOC-depth variants.

### 3.4 `markdown-toc` (Java)

This reference matters because it emphasizes directory/batch processing and special-character handling.

Useful ideas:

1. subtree traversal awareness
2. special-character robustness
3. optional numbering and output-mode control

Comparison with current Notemd:

1. Notemd is stronger on Obsidian-native navigation and managed-artifact lifecycle;
2. Notemd is weaker because chapter split is intentionally active-file scoped rather than folder-batch capable.

Repo-owned conclusion:

1. keep chapter split active-file scoped on current `main`;
2. do not reopen folder-batch mutation until managed-artifact semantics remain heavily regression-locked;
3. prefer parser/anchor correctness and docs/showcase alignment over command-count expansion.

## 4. Current Guidance

Unless a later explicit architecture decision changes the lane:

1. continue describing chapter split as a managed-artifact workflow, not merely TOC insertion;
2. keep deterministic TOC front matter, stable block refs, manifest-backed reruns, and stale-file cleanup explicit in docs and tests;
3. keep showcase docs and generated-artifact examples synchronized with the actual write contract;
4. keep chapter split active-file scoped for now;
5. if richer TOC depth or batch variants are ever added, land them only with same-batch contract, docs, and regression proof.
