# 章节拆分 + TOC 提取

![章节拆分 + TOC 效果图](./assets/chapter-split-toc-showcase.svg)

当一篇笔记已经长到不适合继续在单文件里维护时，这个功能会在原文件旁生成章节文件、TOC 和一份 manifest。

它按标题结构拆分内容，保留章节之间的链接关系，也给重复执行留出了边界。你不需要手工复制标题，也不用自己维护目录文件。

## 输出结构

执行后会生成下面这组文件：

```text
Docs/Platform.md
└─ Docs/Platform_chapters/
   ├─ Platform_TOC.md
   ├─ 01-overview.md
   ├─ 02-delivery.md
   └─ .notemd-chapter-split.json
```

## TOC 示例片段

```md
---
notemdGenerated: true
notemdArtifactKind: "chapter-split-toc"
sourcePath: "Docs/Platform.md"
requestedSplitHeadingLevel: "auto"
resolvedSplitHeadingLevel: 2
chapterCount: 2
---

# Platform TOC

- [[Docs/Platform_chapters/01-overview|01. Overview]]
- [[Docs/Platform_chapters/01-overview#^notemd-scope|Scope]]
- [[Docs/Platform_chapters/02-delivery|02. Delivery]]
```

这里有几个实现上的关键点：

- TOC 带 front matter，能明确标识源文件、拆分层级和章节数量。
- 子标题链接会写稳定 block ref，例如 `#^notemd-scope`，便于在 TOC 里直接深链。
- 生成产物会记录到 `.notemd-chapter-split.json`，再次执行时可以识别旧文件并做清理。

## 适合什么时候用

- 研究笔记已经很长，单文件内查找开始变慢。
- 项目计划需要保留总览，同时把每一章拆成独立文件。
- 你需要一份可引用的 TOC，而不是临时整理一次就丢掉。

## 行为边界

- 拆分层级可以选 `Auto`，也可以强制指定 `H1` 到 `H6`。
- 如果你强制指定了某个层级，但源文档里没有这个层级，任务会直接报错，不会自动猜。
- 再次执行时会清理陈旧产物；如果某个已生成文件被手工改过，系统不会直接覆盖。

## 入口与设置

- 命令 / sidebar 入口：`章节拆分`
- 输出真值：`<basename>_chapters`、`<basename>_TOC.md`、`.notemd-chapter-split.json`
- 设置项：`章节拆分 -> 拆分标题层级`
