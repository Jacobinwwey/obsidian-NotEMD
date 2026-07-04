---
date: 2026-07-02
topic: mainline-ci-geo-cli-slidev-closeout-plan
canonical: true
status: completed
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
| 8 | Commit and push to `main`, then watch the Pages workflow because `website/**` changed | Completed on 2026-07-03 (`b09d286`, workflow run `28641376675`) |
| 9 | Confirm final local worktree is clean and aligned with `origin/main` | Completed on 2026-07-03 |

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

## 2026-07-03 Remote Closeout Result

The follow-through after push is now also closed:

1. commit `b09d286` (`chore(mainline): close out process alignment and archive root docs`) landed on `main`;
2. `Deploy Docusaurus to GitHub Pages` run `28641376675` completed successfully after this push;
3. both workflow jobs passed:
   - `build` job `84938128239`
   - `deploy` job `84938347473`
4. the remaining GitHub-side warning is not a source failure: Actions reported Node 20 deprecation notices for `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, and `actions/deploy-pages@v4`, all forced onto Node 24 by GitHub's runner policy.

## 2026-07-04 Reopened Slidev Export Verification

The later standalone-bundle review found a real process gap rather than a Mermaid-layout gap: the fast native-standalone command could return `ok: true` with `--no-playwright --require-native-standalone`, even though that mode had not rendered the final `index-standalone.html` and therefore had not proven table/body overflow convergence. The fix is now fail-closed: strict native standalone requires both `standaloneGate.passed = true` and `renderedLayoutGate.passed = true`; a fast no-Playwright run can prove bundle creation only, and must not be used as maintainer closure for standalone delivery.

The table/body gate is now explicit and separate from Mermaid source preservation. `tableBodyLayoutGate` records audited slides, table slides, body-text slides, failed slides, and the concrete failures. It fails on rendered table/body content findings, while Mermaid-only fit review remains governed by `mermaidSourcePreservation` and `mermaidFit`; this keeps the user's Mermaid no-split invariant intact and focuses automatic pagination/repair on tables, prose, and non-Mermaid dense content.

The current architecture direction is therefore narrower than "make everything fit by rewriting slides." The owner remains the shared convergence path: `convergeSlidevDeckLayout()` prepares and patches the deck once, `exportSlidesCommand()` and the maintainer verifier consume that converged deck, and HTML/PDF/PNG/PPTX/MP4 are checked against the same rendered fact source. The exporter must not introduce a separate fast path that bypasses rendered layout audit when the output claim is strict standalone or final delivery quality.

Local evidence from this reopen:

1. `--format html --html-mode standalone --require-native-standalone --no-playwright` now returns `ok: false`, with `renderedLayoutGate.passed = false` and the reason `Playwright disabled by --no-playwright`;
2. full standalone HTML over `docs/architecture.zh-CN.md` returns `ok: true`, audits all 32 slides, reports 8 table slides and 32 body-text slides, and has `tableBodyLayoutGate.failureCount = 0`;
3. the user-reported local artifact path `docs/export/verify-html-fork-fast/architecture.zh-CN-slides/index-standalone.html` has been regenerated with strict rendered audit, not the previous fast no-Playwright shortcut;
4. PDF, PNG, PPTX, and MP4 all pass through the same convergence sequence before their final export;
5. PPTX reports 339 editable text boxes, 8 native tables, 106 editable table cells, and rich table-cell coverage for all 8 table slides;
6. Mermaid preservation remains structural: source fences `3`, exported deck fences `3`, and `changedFenceIndexes = []`.

The documentation-site CI failure mode was also tightened during this reopen. VitePress now excludes generated/export/archive-output trees (`archive/root-history/**`, `export/**`, and `dist/**`) from source scanning, and the archive index no longer publishes dead links into the excluded root-history area. This preserves the repo rule that generated Slidev export artifacts are local evidence, not GitHub Pages source content.

## Remaining Work After This Batch

The remaining work is external measurement and future product scope, not the current source fix:

1. submit or refresh `sitemap.xml` and `zh-CN/sitemap.xml` in Search Console;
2. inspect canonical root, zh-CN root, FAQ, provider overview, one provider detail, and one unpublished zh-CN fallback;
3. rerun English and Chinese AI visibility prompts after crawl;
4. keep zh-CN expansion tied to translated, reviewed, declared pages;
5. evaluate any future public CLI promotion through schemas, side-effect documentation, deterministic failures, and user docs in the same batch.
