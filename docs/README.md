# Notemd Docs Hub

Language: **English** | [简体中文](./README.zh-CN.md)

This directory contains repository-level documentation for maintainers and contributors.

## Current Truth And Layout

- [Mainline Progress Audit And Next-Level Direction](./brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md)
- [Mainline CI, GEO, CLI, And Slidev Closeout Plan](./brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md)
- [Repository Documentation Layout](./maintainer/repository-document-layout.md)
- [Documentation Archive](./archive/README.md)

## User And Maintainer Entry Points

- [Language Hub](./i18n/README.md)
- [GitHub Pages Language And GEO Workflow](./maintainer/github-pages-language-geo-workflow.md)
- [GitHub Pages GEO Measurement Log](./maintainer/github-pages-geo-measurement-log.md)
- [Draw.io Export Visual Regression](./maintainer/drawio-export-visual-regression.md)
- [Drawnix Export Spike](./maintainer/drawnix-export-spike.md)
- [Chapter Split + TOC Extraction](./chapter-split-toc.md)
- [Release Workflow](./maintainer/release-workflow.md)
- [Release Notes 1.8.2](./releases/1.8.2.md)

## Slide Export Documentation

- [Slidev Standalone Acceptance, 2026-06-18](./maintainer/slidev-standalone-acceptance-2026-06-18.md) - Real `architecture.zh-CN.md` strict native standalone acceptance
- [Slidev Editable PPTX Acceptance, 2026-06-21](./maintainer/slidev-editable-pptx-acceptance-2026-06-21.md) - Real `architecture.zh-CN.md` editable-text PPTX acceptance
- [Slidev Export Workflow Verification](./maintainer/slidev-export-workflow.md) - Maintainer gate for UI-equivalent export workflow
- [Standalone Bundle Fix](./STANDALONE_BUNDLE_FIX.md) - Earlier export transformation bug fix (2026-06-16)
- [Single-File Bundler](./SINGLE_FILE_BUNDLER.md) - Architecture and implementation overview
- [Slidev Solution Summary](./SLIDEV_SOLUTION.md) - Current standalone-first export truth
- [Slidev HTML Fix](./SLIDEV_HTML_FIX.md) - Original problem analysis and testing
- [Slidev Editable PPTX Progress](./brainstorms/2026-06-21-slidev-editable-pptx-progress-and-next-direction.md) - Reference-project comparison and next implementation direction

## Engineering Planning Docs

- [Diagram Reference Integration And Figure Generation Plan](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md)
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
- Root-level one-off reports belong in `docs/archive/root-history/`, not in the repository root.
