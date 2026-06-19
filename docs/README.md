# Notemd Docs Hub

Language: **English** | [简体中文](./README.zh-CN.md)

This directory contains repository-level documentation for maintainers and contributors.

## User And Maintainer Entry Points

- [Language Hub](./i18n/README.md)
- [Chapter Split + TOC Extraction](./chapter-split-toc.md)
- [Release Workflow](./maintainer/release-workflow.md)
- [Release Notes 1.8.2](./releases/1.8.2.md)

## Slide Export Documentation

- [Slidev Standalone Acceptance, 2026-06-18](./maintainer/slidev-standalone-acceptance-2026-06-18.md) - Real `architecture.zh-CN.md` strict native standalone acceptance
- [Slidev Export Workflow Verification](./maintainer/slidev-export-workflow.md) - Maintainer gate for UI-equivalent export workflow
- [Standalone Bundle Fix](./STANDALONE_BUNDLE_FIX.md) - Earlier export transformation bug fix (2026-06-16)
- [Single-File Bundler](./SINGLE_FILE_BUNDLER.md) - Architecture and implementation overview
- [Slidev Solution Summary](./SLIDEV_SOLUTION.md) - Current standalone-first export truth
- [Slidev HTML Fix](./SLIDEV_HTML_FIX.md) - Original problem analysis and testing

## Engineering Planning Docs

- [Diagram Platform Phase 2 Requirements](./brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md)
- [Local KB Retrieval Decision And Quality Truth](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md)
- [Local KB RAG Quality And Execution Truth](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md)
- [Chapter Split Knowledge Management And TOC Comparison Truth](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md)
- [Diagram Rendering Platform Roadmap](./superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md)
- [Language Support Multiphase Plan](./superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md)
- [AGENTS And Provider Expansion Plan](./superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md)
- [China Provider Expansion Round 2 Plan](./superpowers/plans/2026-03-26-china-provider-expansion-round2.en.md)

## Documentation Language Convention

- Plan docs under `docs/superpowers/plans/` use explicit locale suffixes: `name.en.md` and `name.zh-CN.md`.
- Outside the plan directory, older source docs may still use `name.md` plus a companion language file until they are migrated.
- Release notes are stored as two complete files, one English and one Simplified Chinese. GitHub release publishing composes those two files into one bilingual release body at publish time.
- Do not add inline bilingual summary blocks to active docs. Keep each language in its own complete file.
