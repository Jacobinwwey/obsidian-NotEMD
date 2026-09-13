# Notemd Release Workflow (Maintainers)

Language: **English** | [简体中文](./release-workflow.zh-CN.md)

This document is for maintainers and contributors, not end users.

## 1. Regression Baseline

Capture a before-change baseline:

```bash
npm run regression:language-baseline
```

After implementation, compare with the latest baseline:

```bash
npm run regression:language-compare
```

## 2. Verification Gate Before Release

Run:

```bash
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
npm run lint:regressions -- --base-ref origin/main
obsidian help
obsidian-cli help
git diff --check
```

After the Release is public, run `npm run chronicle:sync-repo-saga` and `npm run chronicle:update -- --tag <tag>` serially, or let the release workflow refresh it. They share `.cache/repo-saga-*` state and enforce `.cache/.repo-saga-execution.lock`; if a stale lock remains behind, verify that no repo-saga sync/update process is still running before removing it. Do not relabel old chronicle evidence with an unpublished version.

If `obsidian-cli` is unavailable in the local environment, record it in release notes or release-handoff evidence.
If the change affects diagram semantics, also run the maintainer-local semantic layer in `docs/maintainer/diagram-semantic-verification.md`.
If the change affects Slidev export wiring, Slidev settings, source preparation, local fork detection, or HTML/PDF/PNG/MP4 export behavior, also run the maintainer-local workflow in `docs/maintainer/slidev-export-workflow.md`:
```bash
npm run verify:slidev-export
```
That command intentionally writes inspectable artifacts under `docs/export/`; do not include those generated files in a commit unless the release task explicitly asks for them.
Recommended helper:
```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```
If you omit `--output`, the helper prints the checklist to stdout for quick review; unsupported `--surface` values fail fast instead of quietly generating a partial template.
The helper reads packaging entry/output facts from `esbuild.config.mjs` and, when needed, the shared `scripts/lib/esbuild-bundle-config.js` helper, latent runtime-module specifier facts from `src/rendering/preview/renderHostRuntimeClient.ts`, render-host audit facts from `scripts/audit-render-host-bundle.js` backed by shared marker/output/reference rules in `scripts/lib/packaging-contract.js`, runtime-consumption facts from `src/main.ts`, `src/ui/DiagramPreviewModal.ts`, `src/rendering/webview/page.ts`, and `src/rendering/webview/renderFrame.ts`, release packaging contract facts from `scripts/release/publish-github-release.js`, release trigger/tag-guard/workflow-branch/chronicle-target facts from `.github/workflows/release.yml`, and operation-promotion boundary facts from `src/operations/registry.ts`; keep those files as packaging/contract truth sources when evaluating renderer-boundary claims.
Treat the helper's packaging-boundary, render-host audit, render-host runtime-consumption, implementation-readiness, packaging-contract, contract-promotion-boundary, and Stage-C gate sections as required truth maintenance for renderer-affecting changes: `npm run audit:render-host` does not prove true heavy-runtime isolation; it only proves the current self-contained `main.js` + inline `srcdoc` host contract and rejects stray `render-host.mjs` assets/references on current `main` through the shared packaging contract.
On the current single-entry lane, that packaging-boundary truth also requires the latent runtime helper to stay fail-closed: no default standalone `render-host.mjs` module specifier may be synthesized unless a dedicated runtime asset is explicitly configured and shipped in the same batch.
It also requires `createRenderHostBundleBuildOptions()` to remain candidate-only on current `main`: the production `esbuild.config.mjs` path must not consume it unless standalone render-host release assets, audit logic, and maintainer/release docs move together.
The packaging-contract section records numeric tag policy, workflow tag-trigger glob policy, offline preview, candidate provenance, draft verification, workflow-source branch, and chronicle-target branch. Treat these as one release contract.

## 3. Version Synchronization

Before publishing, ensure version references are aligned:

- `package.json`
- `package-lock.json` (root version and root package version)
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

Release tags must use numeric `x.x.x` format. Do not add a `v` prefix: Obsidian community plugin publishing expects numeric tags only.

## 4. Documentation Translation Delivery

For 1.9.8 and subsequent work under this policy, Codex authors and reviews translations directly. Do not call LM Studio, an external translation API, or the legacy `translate-*.cjs --write` commands. This authoring policy does not change LM Studio support as a plugin provider.

1. Verify the English source against commands, defaults and supported behavior before translating.
2. Freeze the source revision, then update every affected published locale. The website has 34 locales; the plugin UI has 21. Preserve that distinction.
3. Keep each language independently readable. Preserve executable code, command IDs, URLs, MDX and table structure; translate prose even when an older guide placed it inside a code fence.
4. Record source revisions and review the changed content in each language. AI authorship is not independent native-speaker review and does not by itself qualify a locale for search indexing.
5. Run `npm --prefix website run build` and `npm --prefix website run audit:build`, the repository documentation checks, and `git diff --check`. Inspect representative RTL, CJK and narrow layouts.

Tools may enumerate files, check structure and render the authored content. They must not generate translations through external models. Keep the current indexability policy until each additional locale has independent publication evidence.

## 5. Release Notes Contract

Release notes now live in two complete checked-in files:

- English: `docs/releases/<tag>.md`
- Simplified Chinese: `docs/releases/<tag>.zh-CN.md`

Each file must be independently readable. The GitHub release helper composes those two files into one bilingual release body at publish time.

## 6. GitHub Release Requirements

Required release assets:

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 7. Publish Command

```bash
npm run release:github -- <tag>
```

For maintainer-side verification, `npm run release:github -- <tag> --dry-run` is the checked-in no-network proof path: it validates local version metadata, required assets and bilingual notes, then reports the source commit, working-tree state and asset SHA-256 values as JSON. It does not rebuild, query GitHub, or claim to know whether a release exists. Unknown, duplicated or extra arguments fail before external commands.

The publishing operation owns the full transaction:

- Require a clean checkout at the local tag, matching version metadata, and an identical remote tag commit. Annotated tags are dereferenced. Authentication, network and server failures are fatal; a by-tag 404 also checks authenticated draft listings.
- Rebuild from the clean tagged sources. The workflow uses locked dependencies and Linux Node 20 as the authoritative publishing environment; Windows has separate behavioral verification. A pre-existing ignored `main.js` is not provenance.
- Freeze the exact upload bytes, compose both note files, and record source commit and SHA-256 values in a hidden candidate-provenance comment in the release body.
- Create a draft with `--verify-tag`, upload all four assets, download them again, and verify their state and hashes before making the release public. A failed upload or hash check leaves the release in draft.
- Resume only a candidate with the same provenance and bilingual notes. Draft assets may be replaced with those same candidate bytes. Existing public assets must match and are never overwritten; a retry may only fill missing assets. Historical releases without matching provenance cannot be repaired by this publisher.

Same-tag Actions runs are serialized. Local publication uses `.cache/.release-<tag>.lock`; a crash may leave it behind. Verify the recorded process is no longer active before removing that exact lock. Use one publisher, not concurrent local and Actions publishing. Public code fixes require a new patch version; never move a published tag or silently replace its binaries.

## 8. CI Automation

The repository also ships `.github/workflows/release.yml`:

- Push a git tag to publish the release automatically.
- Use `workflow_dispatch` with a numeric `x.x.x` `tag` input to repair an existing release from CI.
- The same workflow now regenerates the quarterly development chronicle after publish, refreshes every root `README*.md` chronicle block, rewrites each localized `docs/repo-saga/notemd-development-history.<locale>.svg`, refreshes the English alias `docs/repo-saga/notemd-development-history.svg`, and pushes that documentation-only update back to `main`.
- `npm run chronicle:sync-repo-saga` assembles `.cache/repo-saga-upstream` from the two upstream `repo-saga` branches we currently depend on: `feat/timeline-granularity` for quarter slicing and `feat-locale-i18n` for locale expansion.
- `.github/workflows/verify-plugin.yml` verifies ordinary PRs and pushes on Linux and Windows, including build, full Jest, audits, lint regression comparison and diff hygiene. These runs are separate from the tag-triggered publisher.
- Inspect Actions runs and check-runs for the actual candidate commit. Workflow presence does not prove branch protection or a required check; do not infer failure from the legacy commit-status API returning no statuses.
- The workflow now pins `actions/checkout@v6` and `actions/setup-node@v6` so the release path does not keep the older Node 20 JavaScript-action runtime warning alive.
- The publish job runs `npm ci`, installs the pinned Chromium revisions for both Playwright packages, builds, runs the full Jest suite and audits, checks diff hygiene, and invokes the publisher. The publisher rebuilds again to prove the origin of the ignored bundle.
- The follow-up chronicle job runs `node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"` on `main`, then commits the refreshed `README*.md` blocks plus localized quarterly SVG set if anything changed.
- The workflow-source checkout branch and chronicle push target are now named explicitly as `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH` and `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH` in the workflow, while the repo-side default contract lives in `scripts/lib/packaging-contract.js`. GitHub Actions still needs bootstrap env values before the first checkout, but scripts, helper output, and tests now treat those branch names as release-contract truth instead of independent release-script defaults.
- The release workflow tag trigger intentionally remains the GitHub Actions bootstrap literal `*.*.*`, but the owner of that literal is now `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB` in `scripts/lib/packaging-contract.js`; `RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS` keeps `v*.*.*` / `V*.*.*` out of the trigger list. The wildcard only decides whether the workflow starts. The checked-in tag validator remains the numeric `x.x.x` enforcement point.
- The chronicle refresh script itself now rebuilds its local `repo-saga` cache by copying the granularity branch as the base and overlaying the locale/i18n branch files before invoking the `repo-saga` CLI.
- The chronicle refresh script now also enforces a single execution lock at `.cache/.repo-saga-execution.lock`, so overlapping local/CI runs fail fast instead of corrupting shared cache state.
- That same script now hardens package-manager fallback as well: if the environment only has `corepack` or `bun x pnpm`, it creates an inheritable local `pnpm` shim so the upstream `repo-saga` workspace build can still execute nested `pnpm` script calls inside CI.
- The checked-in `scripts/release/commit-chronicle-refresh.js` entrypoint is now also process-level regression-locked for clean no-op runs, explicit `--target-branch` overrides, missing-argument failures, and git-status failure propagation.
- The checked-in `scripts/repo-saga/update-quarterly-saga.mjs` entrypoint is now also process-level regression-locked for `--sync-only` stamp-respecting success, active execution-lock refusal, an isolated `--no-readme --tag <tag>` generation path that produces localized chronicle SVGs without mutating README files, and fail-fast rejection of missing `--tag` values or unknown options.
- The workflow now validates tags through the checked-in `scripts/release/validate-release-tag.js` helper before checking out the release ref, so CI and repo-owned release helpers reuse the same numeric tag contract and still reject `v1.8.2`-style tags.

The workflow intentionally reuses checked-in release helpers instead of duplicating asset lists, release-note logic, tag validation, or chronicle target defaults inside YAML-local script fragments.

Deploy Pages explicitly after Release and chronicle verification. A Release or push created with `GITHUB_TOKEN` does not automatically trigger another release/push workflow. Confirm the public Release is downloadable before promoting it as the stable version on Pages; verify the live site's version, canonical links, language policy and deployment source revision.

## 9. Diagram Semantic Layer

Renderer-affecting changes need one more layer beyond repo CI:

- use `docs/maintainer/diagram-semantic-verification.md`
- generate a reusable checklist with `npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md` when you need a durable handoff artifact
- verify affected Mermaid / JSON Canvas / Vega-Lite flows in a real local vault
- record evidence in release handoff or PR notes

Automated checks alone are not sufficient when the change touches diagram generation or preview behavior.
