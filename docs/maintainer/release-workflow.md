# Notemd Release Workflow (Maintainers)

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
obsidian help
obsidian-cli help
git diff --check
```

If `obsidian-cli` is unavailable in the local environment, record it in release notes/handoff evidence.

## 3. Version Synchronization

Before publishing, ensure version references are aligned:

- `package.json`
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

## 4. GitHub Release Requirements

Release description must be fully bilingual:

- One complete English section.
- One complete Chinese section.
- Each section must be independently readable.

Required release assets:

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 5. Publish Command

```bash
npm run release:github -- <tag>
```

The helper enforces the required packaged assets and `docs/releases/<tag>.md` before invoking GitHub:

- If the release does not exist yet, it runs `gh release create ... --verify-tag`.
- If the release already exists, it runs `gh release upload ... --clobber`.

That second path is the repair path for cases where a release body was published but plugin assets were not uploaded.
