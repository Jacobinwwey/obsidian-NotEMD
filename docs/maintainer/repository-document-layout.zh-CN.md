# 仓库文档布局规则

语言: [English](./repository-document-layout.md) | **简体中文**

本文档定义当前仓库文档真值应当落在哪些目录，以及哪些 Markdown 文件仍允许保留在仓库根目录。

## 为什么需要这份文档

到 2026-07-02 为止，仓库里的当前主线真值其实已经主要落在 `docs/brainstorms/`、`docs/maintainer/` 和 `docs/README.md` 下，但仓库根目录仍然堆积了大量历史性一次性报告。这会带来两个问题：

1. 已经过期的根目录说明看起来比当前 canonical docs 更像“官方答案”；
2. 新的进度汇报很容易再次回流到根目录，而不是进入结构化的 `docs/` 体系。

## 当前布局决策

### 当前活跃真值文档

以下位置现在承载活跃文档真值：

- `docs/README.md` 与 `docs/README.zh-CN.md` - 仓库文档入口
- `docs/maintainer/` - 维护者控制文档与工作流契约
- `docs/brainstorms/` - 带日期的进度审计、收口分析与后续方向文档
- `docs/superpowers/plans/` - 长周期计划与路线图
- `docs/releases/` - 发布说明

### 归档文档

历史性的根目录报告现在统一放到：

- `docs/archive/root-history/`

这些文件仍然保留，但不再是当前主线行为的默认真值来源。

### 仍保留在根目录的 Markdown

根目录 Markdown 现在应只保留仓库契约或发现入口：

- `README*.md`
- `AGENTS.md`
- `GEMINI.md`
- `change.md`
- `GEO_ROADMAP.md`
- `DOCUMENTATION_INDEX.md`

`GEO_ROADMAP.md` 目前仍保留在根目录，是因为当前网站构建与审计流程仍然直接从这个路径读取它。

## 2026-07-03 根目录瘦身范围

2026-07-03 这轮清理把以下一次性根目录文档迁入了 `docs/archive/root-history/`：

- 进度或收口报告，例如 `PROGRESS_SINCE_1.9.2.md`、`WORK_SUMMARY_2026-06-23.md`、`DEVELOPMENT_PHASE_COMPLETION.md`
- 贡献者清理与 GitHub 缓存调查，例如 `ROOT_CAUSE_CLAUDE_CONTRIBUTOR.md`、`GIT_AUTHOR_HYGIENE*.md`、`BACKUP_CONFIRMATION.md`、`GITHUB_SUPPORT_REQUEST_TEMPLATE.md`
- 旧 standalone bundle 总结/参考文档，例如 `BUNDLE_SCRIPTS_README.md`、`CHANGELOG_STANDALONE_BUNDLE.md`、`SUMMARY.md`、`COMPLETE_SOLUTION_SUMMARY.md`
- 一次性 bug 记录，例如 `CSS_PRELOAD_FIX.md` 与 `EXTERNAL_PRELOAD_BUG_FIX.md`

## 后续写作规则

- 如果文档描述的是当前已发货行为，应放到 `docs/maintainer/`、`docs/brainstorms/` 或其他结构化 `docs/` 子目录。
- 如果文档是临时调查、收口说明或历史迁移记录，应直接放到 `docs/archive/`，或在当前批次结束后迁入归档。
- 除非仓库构建、网站或发布流程明确依赖某个根目录路径，否则不要再新增根目录级的 summary/status Markdown。
