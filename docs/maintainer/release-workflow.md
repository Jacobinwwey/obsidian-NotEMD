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
npm run chronicle:sync-repo-saga
npm run chronicle:update
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
obsidian help
obsidian-cli help
git diff --check
```

Run `npm run chronicle:sync-repo-saga` and `npm run chronicle:update` serially. They share `.cache/repo-saga-*` state and now enforce `.cache/.repo-saga-execution.lock`; if a stale lock remains behind, verify that no repo-saga sync/update process is still running before removing it.

If `obsidian-cli` is unavailable in the local environment, record it in release notes or release-handoff evidence.
If the change affects diagram semantics, also run the maintainer-local semantic layer in `docs/maintainer/diagram-semantic-verification.md`.
Recommended helper:
```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```
If you omit `--output`, the helper prints the checklist to stdout for quick review; unsupported `--surface` values fail fast instead of quietly generating a partial template.
The helper reads packaging entry/output facts from `esbuild.config.mjs` and, when needed, the shared `scripts/lib/esbuild-bundle-config.js` helper, latent runtime-module specifier facts from `src/rendering/preview/renderHostRuntimeClient.ts`, render-host audit facts from `scripts/audit-render-host-bundle.js` backed by shared marker/output/reference rules in `scripts/lib/packaging-contract.js`, runtime-consumption facts from `src/main.ts`, `src/ui/DiagramPreviewModal.ts`, `src/rendering/webview/page.ts`, and `src/rendering/webview/renderFrame.ts`, release packaging contract facts from `scripts/release/publish-github-release.js`, release trigger/tag-guard/workflow-branch/chronicle-target facts from `.github/workflows/release.yml`, and operation-promotion boundary facts from `src/operations/registry.ts`; keep those files as packaging/contract truth sources when evaluating renderer-boundary claims.
Treat the helper's packaging-boundary, render-host audit, render-host runtime-consumption, implementation-readiness, packaging-contract, contract-promotion-boundary, and Stage-C gate sections as required truth maintenance for renderer-affecting changes: `npm run audit:render-host` does not prove true heavy-runtime isolation; it only proves the current self-contained `main.js` + inline `srcdoc` host contract and rejects stray `render-host.mjs` assets/references on current `main` through the shared packaging contract.
On the current single-entry lane, that packaging-boundary truth also requires the latent runtime helper to stay fail-closed: no default standalone `render-host.mjs` module specifier may be synthesized unless a dedicated runtime asset is explicitly configured and shipped in the same batch.
It also requires `createRenderHostBundleBuildOptions()` to remain candidate-only on current `main`: the production `esbuild.config.mjs` path must not consume it unless standalone render-host release assets, audit logic, and maintainer/release docs move together.
The packaging-contract section now also records numeric tag policy, workflow tag-trigger glob policy, create/upload mode behavior, tag-only trigger guardrails, workflow-source branch, and chronicle-target branch; treat those as part of the same release-truth contract rather than informal release habits.

## 3. Version Synchronization

Before publishing, ensure version references are aligned:

- `package.json`
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

Release tags must use numeric `x.x.x` format. Do not add a `v` prefix: Obsidian community plugin publishing expects numeric tags only.

## 4. Release Notes Contract

Release notes now live in two complete checked-in files:

- English: `docs/releases/<tag>.md`
- Simplified Chinese: `docs/releases/<tag>.zh-CN.md`

Each file must be independently readable. The GitHub release helper composes those two files into one bilingual release body at publish time.

## 5. GitHub Release Requirements

Required release assets:

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 6. Publish Command

```bash
npm run release:github -- <tag>
```

For maintainer-side verification, `npm run release:github -- <tag> --dry-run` is the checked-in no-network proof path: it still validates the numeric tag, required assets, checked-in bilingual release notes, release-exists branch selection, and composed `gh release ...` command shape without performing the publish.

The helper now enforces the required packaged assets plus both checked-in release-note files before invoking GitHub:

- If the release does not exist yet, it combines `docs/releases/<tag>.md` and `docs/releases/<tag>.zh-CN.md`, then runs `gh release create ... --verify-tag`.
- If the release already exists, it first rewrites the existing release body/title from those checked-in bilingual notes and then runs `gh release upload ... --clobber`.
- If the tag is not numeric `x.x.x`, it fails immediately.

That second path is the repair path for cases where a release body drifted from checked-in notes or plugin assets were not uploaded.

## 7. CI Automation

The repository also ships `.github/workflows/release.yml`:

- Push a git tag to publish the release automatically.
- Use `workflow_dispatch` with a numeric `x.x.x` `tag` input to repair an existing release from CI.
- The same workflow now regenerates the quarterly development chronicle after publish, refreshes every root `README*.md` chronicle block, rewrites each localized `docs/repo-saga/notemd-development-history.<locale>.svg`, refreshes the English alias `docs/repo-saga/notemd-development-history.svg`, and pushes that documentation-only update back to `main`.
- `npm run chronicle:sync-repo-saga` assembles `.cache/repo-saga-upstream` from the two upstream `repo-saga` branches we currently depend on: `feat/timeline-granularity` for quarter slicing and `feat-locale-i18n` for locale expansion.
- This workflow does **not** run automatically for ordinary `main` pushes or PRs; pre-merge verification is still a local maintainer responsibility.
- `main` currently has no branch protection and no ordinary push/PR workflow. If the commit-status API shows `pending` with zero statuses on `main`, treat GitHub Actions runs plus `check-suites` / `check-runs` as the real source of truth; release-tag runs may still attach successful checks to the same commit.
- The workflow now pins `actions/checkout@v6` and `actions/setup-node@v6` so the release path does not keep the older Node 20 JavaScript-action runtime warning alive.
- The publish job runs `npm ci`, `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, `npm run audit:render-host`, `git diff --check`, and finally `npm run release:github -- "$TAG_NAME"`.
- The follow-up chronicle job runs `node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"` on `main`, then commits the refreshed `README*.md` blocks plus localized quarterly SVG set if anything changed.
- The workflow-source checkout branch and chronicle push target are now named explicitly as `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH` and `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH` in the workflow, while the repo-side default contract lives in `scripts/lib/packaging-contract.js`. GitHub Actions still needs bootstrap env values before the first checkout, but scripts, helper output, and tests now treat those branch names as release-contract truth instead of independent release-script defaults.
- The release workflow tag trigger intentionally remains the GitHub Actions bootstrap literal `*.*.*`, but the owner of that literal is now `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB` in `scripts/lib/packaging-contract.js`; `RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS` keeps `v*.*.*` / `V*.*.*` out of the trigger list. The wildcard only decides whether the workflow starts. The checked-in tag validator remains the numeric `x.x.x` enforcement point.
- The chronicle refresh script itself now rebuilds its local `repo-saga` cache by copying the granularity branch as the base and overlaying the locale/i18n branch files before invoking the `repo-saga` CLI.
- The chronicle refresh script now also enforces a single execution lock at `.cache/.repo-saga-execution.lock`, so overlapping local/CI runs fail fast instead of corrupting shared cache state.
- That same script now hardens package-manager fallback as well: if the environment only has `corepack` or `bun x pnpm`, it creates an inheritable local `pnpm` shim so the upstream `repo-saga` workspace build can still execute nested `pnpm` script calls inside CI.
- The checked-in `scripts/release/commit-chronicle-refresh.js` entrypoint is now also process-level regression-locked for clean no-op runs, explicit `--target-branch` overrides, missing-argument failures, and git-status failure propagation.
- The checked-in `scripts/repo-saga/update-quarterly-saga.mjs` entrypoint is now also process-level regression-locked for `--sync-only` stamp-respecting success and active execution-lock refusal, without depending on a live upstream network run.
- The workflow now validates tags through the checked-in `scripts/release/validate-release-tag.js` helper before checking out the release ref, so CI and repo-owned release helpers reuse the same numeric tag contract and still reject `v1.8.2`-style tags.

The workflow intentionally reuses checked-in release helpers instead of duplicating asset lists, release-note logic, tag validation, or chronicle target defaults inside YAML-local script fragments.

## 8. Diagram Semantic Layer

Renderer-affecting changes need one more layer beyond repo CI:

- use `docs/maintainer/diagram-semantic-verification.md`
- generate a reusable checklist with `npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md` when you need a durable handoff artifact
- verify affected Mermaid / JSON Canvas / Vega-Lite flows in a real local vault
- record evidence in release handoff or PR notes

Automated checks alone are not sufficient when the change touches diagram generation or preview behavior.
