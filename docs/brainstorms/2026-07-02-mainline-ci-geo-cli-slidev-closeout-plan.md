---
date: 2026-07-02
topic: mainline-ci-geo-cli-slidev-closeout-plan
canonical: false
status: local-verification-complete
---

# Mainline CI, GEO, CLI, And Slidev Closeout Plan

Language: **English** | [简体中文](./2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.zh-CN.md)

## Scope

This plan closes the current `main` alignment batch. It covers four coupled surfaces:

1. remote `main` CI and GitHub Pages deployment truth;
2. GEO / public documentation-site source truth;
3. CLI and maintainer automation command-resolution truth;
4. Slidev export environment probing and HTML export path truth.

It does not promote maintainer-only CLI operations into a public user API, and it does not reopen the Slidev layout-quality roadmap except where the process-launch bug affected environment detection.

## Baseline Findings

| Area | Finding | Current interpretation |
|---|---|---|
| Remote Pages CI | Failed run `27451762938` failed inside `actions/deploy-pages@v4` with `HttpError: Not Found` and GitHub's "enable Pages" instruction | Historical repository settings / Pages availability issue, not a current source failure |
| Recent Pages deploys | Recent `main` Pages workflow runs are green, including `28281641014` | Pages source gate is currently healthy |
| Current baseline commit | `eb777ef` had no check-runs and no legacy statuses attached during triage | No current failing CI context was found |
| Windows Slidev probe | Obsidian reported `spawn EINVAL` during environment detection | Direct Windows process launch did not handle `.cmd` / `.bat` shims |
| Linux/macOS behavior | Direct exec worked on POSIX | Do not add a shell layer where direct exec is already the correct primitive |
| Windows shell fallback | Blanket `shell: true` can corrupt JSON, quote-heavy, and `code=...=>...` arguments | Use an isolated batch-file adapter only for resolved `.cmd` / `.bat` files |

## Implementation Plan

| Step | Concrete action | Status |
|---|---|---|
| 1 | Centralize Node-side cross-platform command execution in `scripts/lib/cross-platform-command.js` | Implemented |
| 2 | Update release, repo-saga, maintainer, package-manager, and Slidev verification scripts to use the shared command adapter | Implemented |
| 3 | Harden plugin-side Slidev environment probing in `src/slideExport/platformUtils.ts` with direct exec first, Windows `PATH` + `PATHEXT` resolution, Node-script routing through `process.execPath`, and batch-shim routing through quoted `cmd.exe /d /s /c call` | Implemented |
| 4 | Move HTML `index.html` output discovery into `src/slideExport/htmlExportPaths.ts` so Windows and POSIX path separators are handled consistently | Implemented |
| 5 | Keep Mermaid post-fit injection owned by the exporter path instead of duplicating standalone HTML mutation in `src/main.ts` | Implemented |
| 6 | Update CLI, Slidev workflow, GEO roadmap, Pages measurement log, website README, and `llms.txt` to reflect the new source truth | Implemented in this documentation batch |
| 7 | Run source verification: Jest, plugin build, Pages build/audit, diff whitespace check, and Obsidian CLI/runtime smoke checks | Verified locally on 2026-07-03 |
| 8 | Commit and push to `main`, then watch the Pages workflow because `website/**` changed | Pending commit/push |
| 9 | Confirm final local worktree is clean and aligned with `origin/main` | Pending push |

## Architecture Direction

The command-resolution architecture should stay split by responsibility:

1. `src/slideExport/platformUtils.ts` owns plugin/runtime process execution for Slidev export probing and export subprocesses.
2. `scripts/lib/cross-platform-command.js` owns Node script execution for release, maintainer, repo-saga, and package-manager automation.
3. Windows batch execution is an adapter for `.cmd` / `.bat` shims, not the default execution model.
4. POSIX continues to use direct exec because it preserves normal executable and shebang behavior.
5. Public CLI promotion remains contract-driven, not convenience-driven.

## Verification Plan

Required local checks for this batch:

1. `npm test -- --runInBand`
2. `npm run build`
3. `npm --prefix website run build`
4. `npm --prefix website run audit:build`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help` if installed; otherwise record the absence explicitly
8. `obsidian command id=notemd:probe-slide-export-environment`
9. `obsidian dev:errors`

Remote closeout after push:

1. confirm the push lands on `main`;
2. watch the `Deploy Docusaurus to GitHub Pages` workflow triggered by `website/**`;
3. record the workflow conclusion and URL in the final status.

## 2026-07-03 Local Verification Results

Local verification is now complete for the source-side closeout:

1. full Jest passed through the checked-in local Node runtime: 193 suites and 1570 tests green;
2. plugin build passed through `tsc -noEmit -skipLibCheck` plus production esbuild bundling;
3. `npm --prefix website run build` passed;
4. `npm --prefix website run audit:build` passed;
5. `git diff --check` passed after the documentation-layout cleanup;
6. `obsidian help`, `obsidian commands filter=notemd`, and `obsidian dev:errors` all returned successfully, while the host warned that the installed Obsidian CLI package is old and exposes limited CLI support;
7. standalone `obsidian-cli` is not installed in this Windows environment, so its absence is now explicitly part of the closeout evidence instead of an unresolved ambiguity;
8. `obsidian command id=notemd:probe-slide-export-environment` returned through the official `obsidian` trigger surface with the same installer-age warning, which is enough to show the trigger surface exists even though this host does not expose richer command output.

## Remaining Work After This Batch

The remaining work is external measurement and future product scope, not the current source fix:

1. submit or refresh `sitemap.xml` and `zh-CN/sitemap.xml` in Search Console;
2. inspect canonical root, zh-CN root, FAQ, provider overview, one provider detail, and one unpublished zh-CN fallback;
3. rerun English and Chinese AI visibility prompts after crawl;
4. keep zh-CN expansion tied to translated, reviewed, declared pages;
5. evaluate any future public CLI promotion through schemas, side-effect documentation, deterministic failures, and user docs in the same batch.
