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
obsidian help
obsidian-cli help
git diff --check
```

If `obsidian-cli` is unavailable in the local environment, record it in release notes or release-handoff evidence.

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
- The workflow runs `npm ci`, `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, `npm run audit:render-host`, `git diff --check`, and finally `npm run release:github -- "$TAG_NAME"`.
- The workflow validates `^[0-9]+\.[0-9]+\.[0-9]+$` before checkout and publish, so `v1.8.2`-style tags are rejected.

The workflow intentionally reuses the checked-in release helper instead of duplicating asset lists or release-note logic inside YAML.
