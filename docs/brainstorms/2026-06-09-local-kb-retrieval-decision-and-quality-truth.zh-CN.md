---
date: 2026-06-09
topic: local-kb-retrieval-decision-and-quality-truth
canonical: true
---

# Local KB Retrieval 方案决策与质量真值

## 1. 为什么要新增这份文档

当前本地知识库检索切片已经发货到 `main`，但最清晰的方案比较与质量评估最初主要落在：

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/local-kb-retrieval-options.md`
- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/rag-quality-evaluation.md`
- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/knowledge-management-and-toc-comparison.md`

这些文件对开发有用，但 `.trellis/` 仍然属于本地 workflow state，而不是 repo-owned 真值。

本文的目的，是把当前 `main` 真正采用的实现决策，以及后续应如何评估其质量，正式镜像进仓库跟踪文档。

更深一层的执行链路与 chapter split 对比细节，现在也已经单独镜像到 repo 跟踪文档：

1. `docs/brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md`
2. `docs/brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md`

## 2. 当前运行时真值

当前 shipped 的 local-KB 路径具有以下边界：

1. plugin-native
2. local-only
3. in-process
4. server-free
5. GPU-free
6. embedding-free

对应实现文件：

- `src/localKnowledgeBase.ts`
- `src/markdownSectionUtils.ts`
- `src/fileUtils.ts`
- `src/searchUtils.ts`
- `src/main.ts`
- `src/operations/diagramGenerateOperation.ts`

当前这条检索路径并不是一个广义 semantic RAG 系统，而是一条有界的 prompt augmentation 路径，核心组成是：

1. vault-relative 文件/文件夹路径选择
2. heading-aware section parsing
3. lexical MiniSearch indexing
4. 可选的 sliding-window 相邻 section 扩展
5. 面向以下任务的 task-scoped prompt injection：
   - `从标题生成`
   - `从标题批量生成`
   - `研究与总结`
   - `生成图形`

## 3. 候选方案比较结论

### 3.1 当前选定的实现基座

**MiniSearch** 仍是当前主线上最合适的实现基座。

原因：

1. TypeScript 原生，可直接嵌入 Obsidian 插件运行时
2. 不需要 server / daemon / companion process
3. 不需要 vector database bootstrap
4. 不依赖 Python runtime
5. 对 current-main 这条有界切片来说，运维与打包 blast radius 最小

### 3.2 仍被排除为直连 runtime 基座的方案

以下系统仍然只应作为参考，不应直接成为当前 shipped lane 的实现基座：

1. **LightRAG**
   - RAG/KG 能力很强
   - 但它是 Python-first，且运维形态明显重于插件内检索切片
2. **txtai**
   - 语义检索框架成熟
   - 但会把架构推向 Python / service / model-management 方向
3. **Mem0 / Embedchain**
   - memory/retrieval framing 有参考价值
   - 但其依赖面和存储假设都超出了 current `main` 应承载的范围

### 3.3 仍是产品/UX 参考，而不是实现基座的方案

以下项目仍可作为未来方向参考，但依旧不是当前主线的实现基座：

1. **Smart Connections**
   - 适合作为 vault-centric retrieval 的产品参考
   - 但运行时假设仍重于当前 Notemd 的有界切片
2. **Smart Composer**
   - 适合作为未来 embedding / 本地 DB 辅助知识库的参考
   - 但明显超出 current `main` 的 maintainability budget
3. **notebook-navigator**
   - 适合作为工程纪律和文档治理参考
   - 不适合作为 retrieval 实现参考

## 4. 当前质量真值

### 4.1 当前设计做得好的地方

1. 对 Obsidian 插件而言，runtime fit 很好
2. heading-aware sectioning 明显优于整文件 stuffing
3. failure mode 保守：
   - 检索关闭时保留 legacy 行为
   - 检索为空时保留 legacy 行为
4. 运行成本低，且对打包边界友好

### 4.2 当前设计做得不好的地方

1. 检索质量仍然是 lexical-first
2. 对同义词 / 近义改写的匹配能力弱于 embedding+rerank 系统
3. 当前没有 reranker
4. 没有长期持久化的 relevance harness
5. freshness 仍然是 rebuild-only，而不是增量式

### 4.3 后续应如何评估

`ragas` 与 `RAGPerf` 仍应视为评测参考，而不是 runtime 依赖。

它们的价值在于逼出正确的问题：

1. retrieval 是否真的改善了 grounding？
2. retrieval 是否真的改善了 completeness？
3. 哪些 query class 仍然会回归？
4. retrieval 给延迟和 prompt 膨胀带来了多少成本？

对 current main 来说，正确动作是：

1. 保持 runtime 轻量
2. 在线路外借用这些评测思维
3. 继续通过 `npm run verify:local-kb-fixtures` 扩充离线证据

## 5. 当前指导原则

除非未来有新的显式架构决策改变这条线：

1. 继续把当前 local-KB 描述为 plugin-native 的 MiniSearch lexical retriever，加上 task-scoped prompt injection
2. 不要高估 semantic/vector retrieval
3. 不要暗示 current `main` 已经具备 server-backed 或 embedding-backed 的 RAG 子系统
4. 任何未来 semantic/vector 扩张，都必须被视为新的架构轨道，并重新证明 runtime fit、packaging fit 与 maintenance cost
