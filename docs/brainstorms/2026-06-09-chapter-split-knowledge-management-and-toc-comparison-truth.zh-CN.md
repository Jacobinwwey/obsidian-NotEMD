---
date: 2026-06-09
topic: chapter-split-knowledge-management-and-toc-comparison-truth
canonical: true
---

# Chapter Split 的知识管理与 TOC 对比真值

## 1. 为什么需要这份文档

当前 chapter-split 与 TOC 产品切片已经发货到 `main`，但最清晰的外部对比最初主要落在：

- `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/knowledge-management-and-toc-comparison.md`

这份研究仍然有价值，但它属于本地 workflow state，而不是 repo-owned 真值。

这份文档的目的，是把当前 chapter split 写入契约、最相关的对比结论，以及 current `main` 应继续保持的有界提升方向，正式镜像进仓库文档。

## 2. 当前 Notemd 的 Chapter Split 真值

相关实现文件：

- `src/markdownSectionUtils.ts`
- `src/chapterSplit.ts`

当前 shipped 语义：

1. heading-aware section parsing
2. 显式 split-level 控制（`Auto` / `H1`-`H6`）
3. 拆分结果写到源笔记旁边的 `<basename>_chapters/`
4. TOC 输出为 `<basename>_TOC.md`
5. 生成文件清单为 `.notemd-chapter-split.json`
6. rerun 时会清理陈旧生成章节文件
7. guarded rerun 会阻止静默覆盖用户手改过的生成工件
8. 支持面向重复标题的稳定 nested block ref
9. 具备确定性的 TOC front-matter metadata

正确解释：

1. 这不只是 TOC insertion；
2. 这是一条 managed-artifact 写入契约；
3. 当前 `main` 应把 chapter split 描述为“确定性的笔记物化 + TOC 提取”，而不是临时文本转换 helper。

## 3. 对比结论

### 3.1 `andrej-karpathy-skills`

这个参考的价值不在 TOC 生成本身。

它真正有价值的是知识消费纪律：

1. 指令简短而明确；
2. tradeoff 公开透明；
3. success criteria 可验证；
4. speculative abstraction 被约束住。

与当前 Notemd 的对比：

1. Notemd 在真正面向 vault 的转换能力上更强，因为它已经能写出可复用的 Obsidian 文件；
2. Notemd 在显式消费纪律上更弱，因为仓库里对下游 agent/workflow 应优先读取：
   - TOC
   - chapter notes
   - 原始源笔记
   的说明还不够系统。

Repo-owned 结论：

1. 借鉴这种纪律，而不是照搬其包装方式；
2. 让 chapter-split 文档与 maintainer 示例继续明确 generated-artifact 契约与建议的消费顺序。

### 3.2 `kpm`

`kpm` 的价值在于，它把知识当成有结构、有层级、近似工件的对象来管理。

有价值的点：

1. hierarchy 是一等概念；
2. entry file 用来概括和路由子知识；
3. 生成出的知识模块被当成 install artifact，而不是随手编辑的普通笔记。

与当前 Notemd 的对比：

1. Notemd 更适合 live-vault 迭代，因为它几乎零仪式地把工件写到源笔记旁边；
2. Notemd 在 package-like metadata 与 curated entry-file 语义上更弱；
3. 当前 TOC 文件虽然实用，但故意保持得比 package index 更轻。

Repo-owned 结论：

1. 继续把 chapter 输出当成 managed artifact，而不是假装它们是普通 source note；
2. 继续把 manifest 作为 rerun 与 cleanup 的权威来源；
3. 借鉴组织纪律，但不要引入 package-management 负担。

### 3.3 `markdown-toc`（JavaScript）

这个参考的价值在于，它在 heading parsing 与 TOC ergonomics 上很成熟。

有价值的点：

1. repeated-heading handling
2. code-block-safe parsing
3. filter/max-depth 这类选项
4. 明确的 slug/anchor 控制

与当前 Notemd 的对比：

1. Notemd 更强，因为它超越了原地插入 TOC，能够物化 chapter notes 与 manifest；
2. Notemd 更弱，因为当前在 TOC depth 与 slug 策略上的可配置性仍更少。

Repo-owned 结论：

1. 继续保持“源笔记与生成 TOC 分离”的默认行为，因为对 vault 笔记更安全；
2. 在考虑可选 TOC-depth 变体之前，继续优先用测试加固 repeated-heading 与 anchor 语义。

### 3.4 `markdown-toc`（Java）

这个参考的价值在于，它强调目录/批处理与特殊字符处理。

有价值的点：

1. subtree traversal awareness
2. 特殊字符鲁棒性
3. 可选编号与输出模式控制

与当前 Notemd 的对比：

1. Notemd 在 Obsidian-native 导航与 managed-artifact 生命周期上更强；
2. Notemd 更弱，因为 chapter split 现在刻意保持 active-file scoped，而不是 folder-batch capable。

Repo-owned 结论：

1. current `main` 上继续保持 chapter split 为 active-file scoped；
2. 在 managed-artifact 语义仍需重度回归锁定时，不要重开 folder-batch mutation；
3. 优先做 parser/anchor 正确性与 docs/showcase 对齐，而不是继续扩 command 数量。

## 4. 当前指导原则

除非未来有新的显式架构决策改变这条轨道：

1. 继续把 chapter split 描述为 managed-artifact workflow，而不是单纯的 TOC insertion；
2. 在文档与测试里持续明确 deterministic TOC front matter、stable block refs、manifest-backed reruns 与 stale-file cleanup；
3. 持续让 showcase docs 与 generated-artifact 示例跟实际写入契约保持一致；
4. 当前继续保持 chapter split 为 active-file scoped；
5. 如果未来要加 richer TOC-depth 或 batch 变体，必须同批补齐契约、文档与回归证明。
