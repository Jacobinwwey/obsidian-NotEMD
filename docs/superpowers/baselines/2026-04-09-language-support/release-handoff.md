# Language Support Release Handoff (2026-04-09)

## Scope

This handoff covers the first-principles language support rollout:

- Language domain model (`uiLocale` + task language policy).
- UI i18n infrastructure with locale fallback.
- Runtime string migration for settings/sidebar/error notices.
- Unified language decision path in prompt and processing flows.
- Locale-aware timestamp formatting and RTL-safe style guards.
- Scripted baseline/compare regression workflow.

## Before/After Comparison Summary

- Baseline build was previously unstable due to `ref/**` being included in TypeScript compile scope (`TS6059`).
- Current build scope excludes `ref/**`; final `npm run build` is PASS.
- Targeted behavior matrix remained PASS before and after migration.
- Full `npm test -- --runInBand` is PASS after integration.
- No `git diff --check` formatting issues detected.

## Final Verification Evidence

- Build: `task9-build-after-docs.txt`
- Targeted matrix: `task9-targeted-matrix.txt`
- Full test: `task9-full-runInBand.txt`
- Regression scripts: `task9-regression-baseline.txt`, `task9-regression-compare.txt`
- Patch quality: `task9-git-diff-check.txt`
- Obsidian command checks: `task9-obsidian-help.txt`, `task9-obsidian-cli-help.txt`

All files are in:

- `docs/superpowers/baselines/2026-04-09-language-support/`

## Residual Risks

- Environment dependency: `obsidian-cli` is unavailable in this execution environment (`command not found`), so CLI verification is partial.
- Host/runtime dependency: `obsidian help` behavior can vary in headless/desktop-limited environments.

## Release Readiness Notes

- Code and docs are synchronized for language architecture and regression process.
- README and README_zh both include maintainer release requirements:
  - bilingual release description (independent EN + ZH sections),
  - required release assets include `README.md`.
- Recommended release gate remains:
  - `npm run build`
  - `npm test -- --runInBand`
  - `npm run regression:language-compare`
