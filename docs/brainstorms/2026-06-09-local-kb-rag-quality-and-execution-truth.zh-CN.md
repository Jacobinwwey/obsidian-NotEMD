---
date: 2026-06-09
topic: local-kb-rag-quality-and-execution-truth
canonical: true
---

# Local KB RAG 质量与执行链路真值

## 1. 为什么需要这份文档

当前本地知识库检索切片已经发货到 `main`，但最清晰的执行链路与质量评估视角最初主要落在：

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/rag-quality-evaluation.md`

这份开发工件对实现很有价值，但它仍属于本地 workflow state，而不是 repo-owned 真值。

这份文档的目的，是把当前 `main` 真正发货的执行事实，以及后续 Stage-C 质量提升应遵循的评估视角，正式镜像进仓库文档。

## 2. 当前运行时边界

当前 shipped 的检索路径刻意保持收窄：

1. plugin-native
2. local-only
3. in-process
4. server-free
5. GPU-free
6. embedding-free
7. lexical-first，而不是 semantic/vector retrieval

对应实现文件：

- `src/localKnowledgeBase.ts`
- `src/markdownSectionUtils.ts`
- `src/fileUtils.ts`
- `src/searchUtils.ts`
- `src/main.ts`
- `src/operations/diagramGenerateOperation.ts`

正确解释：

1. 这是一条有界的 prompt augmentation 路径，不是通用 RAG 平台；
2. 当前 `main` 不应被描述为已经带有 vector store、reranker 或后台检索服务；
3. 未来如果要做 semantic retrieval，必须视为新的架构决策，而不是当前轨道的隐式延伸。

## 3. 实际执行链路

### 3.1 设置门

只有在设置面明确打开后，检索链路才会生效。

当前相关控制项包括：

1. `enableLocalKnowledgeRetrieval`
2. 默认知识库路径列表
3. 面向以下任务的按任务开关与路径覆盖：
   - `从标题生成`
   - `从标题批量生成`
   - `研究与总结`
   - `生成图形`
4. 检索控制项：
   - `localKnowledgeTopK`
   - `localKnowledgeSlidingWindowSize`
   - `localKnowledgeMaxSnippetChars`
   - `localKnowledgeExcludeCurrentFile`

### 3.2 候选文件枚举

运行时通过 Obsidian vault API 枚举文件，再收窄到配置的 vault-relative 路径。

当前文件选择真值：

1. 文件路径与文件夹路径可以混合出现在同一份知识库列表里；
2. 检索默认只作用于这些配置源，不会默认扫全 vault；
3. 不可检索或无关文件不会让任务失败，只会被排除在候选集之外。

### 3.3 基于标题的分段

搜索单位是 section，而不是整篇文件。

当前代码真值：

1. Markdown 通过 heading-aware section parsing 进行切分；
2. fenced code block 会保留在 excerpt 里，但会从搜索文本中移除；
3. 因此索引与检索作用在 section 级文档，而不是 whole-note。

这点很关键，因为即使当前仍是 lexical-first，它也已经明显优于整文件 stuffing。

### 3.4 搜索归一化与索引

运行时会对搜索文本做归一化，再构建 lexical MiniSearch 索引。

当前索引真值：

1. 索引字段包括：
   - `fileTitle`
   - `heading`
   - `breadcrumb`
   - `content`
2. 搜索仍然是 lexical 为主，只带有有界 prefix/fuzzy 行为；
3. 当前字段 boost 仍然优先 title/heading/breadcrumb，而不是裸 body text。

### 3.5 查询执行与窗口扩展

当前查询行为刻意保持克制：

1. 先执行 lexical search；
2. 命中的结果可以通过 `localKnowledgeSlidingWindowSize` 做相邻 section 扩展；
3. 相邻片段会被保守合并并去重，避免同一区域被重复塞进 prompt。

这是 current-main 的关键折中：

1. 它能在不引入更重 semantic stack 的前提下提升局部语境召回；
2. 同时保住有界 runtime 与 prompt-shaping 面。

### 3.6 Prompt 注入与结果遥测

检索到的上下文会被格式化，并只注入到受支持的任务路径中。

当前 task-scoped injection 真值：

1. `从标题生成`
   - 查询来自 note title
2. `从标题批量生成`
   - 查询来自每个 title，并在可能时复用 shared retriever
3. `研究与总结`
   - 查询来自显式 topic 或 source basename
4. `生成图形`
   - 从 file stem 加有界 source content 推导 diagram-source retrieval query

当前可观测性真值：

1. 标题生成、研究总结与 artifact-mode 图形结果路径上，已经存在 machine-readable retrieval summaries；
2. 当前摘要包含 indexed 数量、matched/returned section 数、expanded section 数、source paths、请求的 `topK`、sliding-window 大小、current-file exclusion telemetry、index-build timing、query timing 与最终 context size；
3. `local-knowledge.inspect` 仍然是更丰富的 maintainer-only explainability seam，用于检查 effective path/query/context。

## 4. 当前质量判断

### 4.1 当前设计做得好的地方

1. 对 Obsidian 插件来说，runtime fit 很好；
2. section-level retrieval 明显优于 whole-note stuffing；
3. 关闭检索或检索为空时，会保守回退到 legacy task path；
4. 运维 blast radius 很低，因为没有 daemon、cloud service、vector DB 或模型 bootstrap 层。

### 4.2 当前设计做得不好的地方

1. 检索质量仍然是 lexical-first；
2. 同义词与近义改写匹配能力明显弱于 embedding + rerank 系统；
3. 当前仍没有 reranker；
4. 当前仍没有长期持久化的 relevance harness；
5. freshness 仍是 rebuild-only，而不是 incremental。

正确解释：

1. 当前检索切片是可维护且有边界的；
2. 它还不是一个成熟的、指标驱动的 RAG 子系统。

## 5. 把 `ragas` 与 `RAGPerf` 作为评测参考

### 5.1 为什么 `ragas` 有价值

`ragas` 不是 current `main` 的 runtime 实现候选。

它有价值，是因为它逼我们问出正确的产品质量问题：

1. retrieval 是否真的改善了 factual grounding；
2. retrieval 是否真的改善了 completeness；
3. 哪些 query class 仍然会回归；
4. lexical retrieval 在哪些 synonym/paraphrase 场景下会失手。

`ragas` 暴露出的当前 Notemd 缺口：

1. 仓库常规验证流里还没有 answer-grounding scorecard；
2. 当前信心主要仍来自测试、真实笔记夹具与维护者 inspect，而不是正式 judged-answer harness。

正确的近期动作，是在线路外借用这种评估视角，而不是把 `ragas` 嵌进插件运行时。

### 5.2 为什么 `RAGPerf` 有价值

`RAGPerf` 同样不是 current `main` 的 runtime 实现候选。

它有价值，是因为它逼我们问出正确的系统质量问题：

1. retrieval 额外增加了多少延迟；
2. index-build 成本如何随 corpus 大小变化；
3. sliding-window expansion 会让 prompt 膨胀多少；
4. 应如何把 retrieval overhead 与 LLM latency 分开观察。

`RAGPerf` 暴露出的当前 Notemd 缺口：

1. 从架构上看 runtime 很轻，但还没有正式的 corpus-size 或 phase-decomposition benchmark；
2. 当前证据仍是有界 telemetry 加真实笔记夹具，而不是 benchmarking harness。

正确的近期动作，是借用它的分解思路：

1. 持续显式记录 indexed-file 与 indexed-section 数；
2. 持续显式记录 build/query timing；
3. 持续显式观察 prompt-size inflation；
4. 不要把这套评估层做成新的 runtime dependency。

## 6. Repo-Owned 指导原则

除非未来有新的显式架构决策改变这条轨道：

1. 继续把当前 local-KB 描述为 plugin-native 的 MiniSearch lexical retriever，加上 task-scoped prompt injection；
2. 继续把 `npm run verify:local-kb-fixtures` 作为 real-note/query diversity 的主要离线证据面；
3. 继续把 `local-knowledge.inspect` 保持为 maintainer-only，除非未来单独有一批 public-promotion 工作同批补齐契约、文档与测试；
4. 不要高估 semantic/vector retrieval，也不要暗示存在 server-backed RAG 子系统；
5. 任何未来 semantic/vector 扩张都必须视为新的架构轨道，并重新证明 runtime fit、packaging fit 与 maintenance cost。
