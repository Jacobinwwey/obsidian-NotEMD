# Notemd 文档中心

语言: [English](./README.md) | **简体中文**

此目录保存仓库级文档，面向维护者与贡献者。

## 用户与维护者入口

- [语言中心](./i18n/README_zh.md)
- [发布流程](./maintainer/release-workflow.zh-CN.md)
- [1.8.2 发布说明](./releases/1.8.2.zh-CN.md)

## 工程规划文档

- [Diagram Platform Phase 2 Requirements](./brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md)
- [Diagram Rendering Platform Roadmap](./superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.md)
- [Language Support Multiphase Plan](./superpowers/plans/2026-04-09-language-support-first-principles-multiphase.md)
- [AGENTS And Provider Expansion Plan](./superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN.md)
- [China Provider Expansion Round 2 Plan](./superpowers/plans/2026-03-26-china-provider-expansion-round2.zh-CN.md)

## 文档语言约定

- 以英文为源文档的文件，使用 `name.md`，并提供 `name.zh-CN.md` 作为简体中文完整译本。
- 以中文为源文档的规划账本文档，使用 `name.md`，并提供 `name.en.md` 作为英文完整译本。
- 发布说明必须拆分为英文与简体中文两个完整文件；发布 GitHub Release 时再由辅助脚本组合成一个双语 release body。
- 不要再向活跃文档里追加行内双语摘要块。每种语言都应维护独立完整文件。
