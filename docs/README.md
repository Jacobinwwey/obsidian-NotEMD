# Notemd Docs Hub

Language: **English** | [简体中文](./README.zh-CN.md)

This directory contains repository-level documentation for maintainers and contributors.

## User And Maintainer Entry Points

- [Language Hub](./i18n/README.md)
- [Release Workflow](./maintainer/release-workflow.md)
- [Release Notes 1.8.2](./releases/1.8.2.md)

## Engineering Planning Docs

- [Diagram Platform Phase 2 Requirements](./brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md)
- [Diagram Rendering Platform Roadmap](./superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md)
- [Language Support Multiphase Plan](./superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md)
- [AGENTS And Provider Expansion Plan](./superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md)
- [China Provider Expansion Round 2 Plan](./superpowers/plans/2026-03-26-china-provider-expansion-round2.en.md)

## Documentation Language Convention

- Plan docs under `docs/superpowers/plans/` use explicit locale suffixes: `name.en.md` and `name.zh-CN.md`.
- Outside the plan directory, older source docs may still use `name.md` plus a companion language file until they are migrated.
- Release notes are stored as two complete files, one English and one Simplified Chinese. GitHub release publishing composes those two files into one bilingual release body at publish time.
- Do not add inline bilingual summary blocks to active docs. Keep each language in its own complete file.
