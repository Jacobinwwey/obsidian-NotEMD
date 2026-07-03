# Repository Documentation Layout

Language: **English** | [简体中文](./repository-document-layout.zh-CN.md)

This document defines where current documentation truth belongs in this repository and which Markdown files are still allowed to remain at the repository root.

## Why This Exists

By 2026-07-02, the repository already had canonical current-main truth under `docs/brainstorms/`, `docs/maintainer/`, and `docs/README.md`, but the root path still carried a large pile of historical one-off reports. That created two failure modes:

1. stale root notes looked more authoritative than the current canonical docs;
2. new progress reporting could drift back into root-level Markdown instead of the structured docs tree.

## Current Layout Decision

### Canonical active docs

These locations now carry active documentation truth:

- `docs/README.md` and `docs/README.zh-CN.md` - repository docs hub
- `docs/maintainer/` - maintainer control docs and workflow contracts
- `docs/brainstorms/` - dated progress audits, closure analysis, and bounded-direction docs
- `docs/superpowers/plans/` - longer-running plans and roadmaps
- `docs/releases/` - release notes

### Archive docs

Historical root-level reports now live under:

- `docs/archive/root-history/`

Those files are preserved for reference, but they are not the default source of truth for current-main behavior.

### Root-level Markdown that stays

Root Markdown should now be limited to repository contract or discovery surfaces:

- `README*.md`
- `AGENTS.md`
- `GEMINI.md`
- `change.md`
- `GEO_ROADMAP.md`
- `DOCUMENTATION_INDEX.md`

`GEO_ROADMAP.md` intentionally stays at the root for now because current website/build audit flows still read it from that path.

## 2026-07-03 Root Cleanup Scope

The 2026-07-03 cleanup moved these one-off root docs into `docs/archive/root-history/`:

- progress or closure reports such as `PROGRESS_SINCE_1.9.2.md`, `WORK_SUMMARY_2026-06-23.md`, and `DEVELOPMENT_PHASE_COMPLETION.md`
- contributor-cleanup and GitHub-cache investigations such as `ROOT_CAUSE_CLAUDE_CONTRIBUTOR.md`, `GIT_AUTHOR_HYGIENE*.md`, `BACKUP_CONFIRMATION.md`, and `GITHUB_SUPPORT_REQUEST_TEMPLATE.md`
- old standalone-bundle summary/reference notes such as `BUNDLE_SCRIPTS_README.md`, `CHANGELOG_STANDALONE_BUNDLE.md`, `SUMMARY.md`, and `COMPLETE_SOLUTION_SUMMARY.md`
- one-off bug notes such as `CSS_PRELOAD_FIX.md` and `EXTERNAL_PRELOAD_BUG_FIX.md`

## Future Authoring Rule

- If a doc describes current shipped behavior, put it under `docs/maintainer/`, `docs/brainstorms/`, or another structured `docs/` subtree.
- If a doc is a temporary investigation, closure note, or historical migration record, either put it directly in `docs/archive/` or move it there once the active batch closes.
- Do not create new root-level summary or status Markdown files unless the repository build, website, or release process explicitly consumes that path.
