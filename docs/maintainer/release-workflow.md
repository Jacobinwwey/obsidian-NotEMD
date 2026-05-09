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

If `obsidian-cli` is unavailable in the local environment, record it in release notes or release-handoff evidence.
If the change affects diagram semantics, also run the maintainer-local semantic layer in `docs/maintainer/diagram-semantic-verification.md`.
Recommended helper:
```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```
The helper reads packaging entry/output facts from `esbuild.config.mjs`, release packaging contract facts from `scripts/release/publish-github-release.js`, release trigger/tag-guard facts from `.github/workflows/release.yml`, and operation-promotion boundary facts from `src/operations/registry.ts`; keep those files as packaging/contract truth sources when evaluating renderer-boundary claims. Operation-promotion checks now cover workflow/settings/selection/export/config-adjacent metadata (including `editor.create-link-and-generate`, `file.process-*`, `concept.extract-*`, and export/import surfaces), with wildcard-prefix expansion for `file.process-*` and `concept.extract-*` against current registry IDs.
Treat the helper's packaging-boundary and packaging-contract sections as required truth maintenance for renderer-affecting changes: `npm run audit:render-host` does not prove true heavy-runtime isolation; it only proves the current self-contained `main.js` + inline `srcdoc` host contract.
The packaging-contract section now also records numeric tag policy, create/upload mode behavior, and tag-only trigger guardrails; treat those as part of the same release-truth contract rather than informal release habits.

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

The helper now enforces the required packaged assets plus both checked-in release-note files before invoking GitHub:

- If the release does not exist yet, it combines `docs/releases/<tag>.md` and `docs/releases/<tag>.zh-CN.md`, then runs `gh release create ... --verify-tag`.
- If the release already exists, it runs `gh release upload ... --clobber`.
- If the tag is not numeric `x.x.x`, it fails immediately.

That second path is the repair path for cases where a release body was published but plugin assets were not uploaded.

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
- The chronicle refresh script itself now rebuilds its local `repo-saga` cache by copying the granularity branch as the base and overlaying the locale/i18n branch files before invoking the `repo-saga` CLI.
- That same script now hardens package-manager fallback as well: if the environment only has `corepack` or `bun x pnpm`, it creates an inheritable local `pnpm` shim so the upstream `repo-saga` workspace build can still execute nested `pnpm` script calls inside CI.
- The workflow validates `^[0-9]+\.[0-9]+\.[0-9]+$` before checkout and publish, so `v1.8.2`-style tags are rejected.

The workflow intentionally reuses the checked-in release helper instead of duplicating asset lists or release-note logic inside YAML.

## 8. Diagram Semantic Layer

Renderer-affecting changes need one more layer beyond repo CI:

- use `docs/maintainer/diagram-semantic-verification.md`
- generate a reusable checklist with `npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md` when you need a durable handoff artifact
- verify affected Mermaid / JSON Canvas / Vega-Lite flows in a real local vault
- record evidence in release handoff or PR notes

Automated checks alone are not sufficient when the change touches diagram generation or preview behavior.
