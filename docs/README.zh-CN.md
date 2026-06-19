# Notemd 文档中心

语言: [English](./README.md) | **简体中文**

此目录保存仓库级文档，面向维护者与贡献者。

## 用户与维护者入口

- [语言中心](./i18n/README_zh.md)
- [章节拆分 + TOC 提取](./chapter-split-toc.zh-CN.md)
- [发布流程](./maintainer/release-workflow.zh-CN.md)
- [1.8.2 发布说明](./releases/1.8.2.zh-CN.md)

## Slide Export 文档

- [Slidev Standalone 验收记录，2026-06-18](./maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md) - 真实 `architecture.zh-CN.md` strict native standalone 验收
- [Slidev 导出工作流验证](./maintainer/slidev-export-workflow.zh-CN.md) - UI 等价导出工作流的维护者 gate
- [Slidev Solution Summary](./SLIDEV_SOLUTION.md) - 当前 standalone 优先、server-script 兼容的方案真值
- [Slidev HTML Fix](./SLIDEV_HTML_FIX.md) - 原始问题分析与测试记录

## 工程规划文档

- [Diagram Platform Phase 2 Requirements](./brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md)
- [Local KB Retrieval 方案决策与质量真值](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md)
- [Local KB RAG 质量与执行链路真值](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md)
- [Chapter Split 的知识管理与 TOC 对比真值](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md)
- [Diagram Rendering Platform Roadmap](./superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md)
- [Language Support Multiphase Plan](./superpowers/plans/2026-04-09-language-support-first-principles-multiphase.zh-CN.md)
- [AGENTS And Provider Expansion Plan](./superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md)
- [China Provider Expansion Round 2 Plan](./superpowers/plans/2026-03-26-china-provider-expansion-round2.zh-CN.md)

## 文档语言约定

- `docs/superpowers/plans/` 下的计划文档统一使用显式语言后缀：`name.en.md` 与 `name.zh-CN.md`。
- 计划目录之外的旧文档，在迁移完成前仍可能保留 `name.md` 加配对语种文件的形式。
- 发布说明必须拆分为英文与简体中文两个完整文件；发布 GitHub Release 时再由辅助脚本组合成一个双语 release body。
- 不要再向活跃文档里追加行内双语摘要块。每种语言都应维护独立完整文件。
