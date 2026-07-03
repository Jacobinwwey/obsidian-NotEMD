# Documentation Index

This is the thin root-level entrypoint for repository documentation.

The full documentation catalog now lives under [`docs/`](docs/README.md). Historical one-off root reports were moved into [`docs/archive/root-history/`](docs/archive/root-history/) so the repository root no longer acts as an unbounded report dump.

## Start Here

- [README.md](README.md) - Product overview and user-facing quick start
- [docs/README.md](docs/README.md) - Canonical repository docs hub
- [docs/README.zh-CN.md](docs/README.zh-CN.md) - Canonical repository docs hub (简体中文)
- [docs/maintainer/repository-document-layout.md](docs/maintainer/repository-document-layout.md) - Current documentation layout and root-file policy
- [docs/archive/README.md](docs/archive/README.md) - Archive index for historical or one-off docs

## Current Mainline Truth

- [docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md](docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md) - Canonical current-main progress audit
- [docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md](docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md) - 中文 current-main progress audit
- [docs/brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md](docs/brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md) - Current closeout plan for CI, GEO, CLI, and Slidev
- [GEO_ROADMAP.md](GEO_ROADMAP.md) - Root-retained GEO roadmap still consumed by current website audit/test flows

## Root-Level Markdown Policy

Root-level Markdown should now be limited to repository contract or discovery surfaces:

- `README*.md`
- `AGENTS.md`
- `GEMINI.md`
- `change.md`
- `GEO_ROADMAP.md`
- `DOCUMENTATION_INDEX.md`

New one-off progress reports, investigations, and closure notes should go under `docs/brainstorms/`, `docs/maintainer/`, or `docs/archive/` instead of returning to the repository root.
