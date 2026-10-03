# Notemd 1.9.9 implementation and acceptance

## Scope and rollout

Continue from implementation commit `3a7f7169662612ac79c61018456ae799f1f6d6e6`. Update the current manuals, 31 README editions, all 34 public website locales, release metadata and bilingual notes. Translations are authored directly by the root Codex session; no translation API, LM Studio or delegated translation is used. Historical release pages and evidence remain intact.

Validate the plugin and both documentation builds before pushing main. Wait for Linux/Windows verification, then publish tag `1.9.9` through the existing release workflow as the sole publisher. It rebuilds from clean tagged sources, uploads a draft and verifies downloaded SHA-256 hashes before public promotion. After the release and serial chronicle refresh complete, dispatch Pages from main and verify the served version, release route and locale metadata.

## Implementation evidence

- Multi-type generation, independent outputs, type-specific filenames, compact live preview, storage and relation-label fixes were completed before release preparation; see [implementation and real-Vault evidence](../multiple-diagrams-implementation.md).
- The implementation passed 298 suites, 2,870 tests with one existing skip, and [Linux/Windows CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37115852934).
- This release preserves the 1.9.8 public assets and existing user Vault files/settings. No repeated model generation is required for documentation preparation.

## Candidate verification

- Plugin production build passed. The final isolated Jest run passed 298 suites and 2,874 tests, with one existing skip. The first run, concurrent with the full website build, hit two browser-suite hook timeouts and an obsolete documentation assertion. After correcting the assertion and removing build contention, the full rerun passed. Subsequent maintainer-document changes passed nine focused contract tests.
- Lint regression comparison, UI-string audit, render-host packaging audit and `git diff --check` passed without new diagnostics.
- VitePress built successfully. Docusaurus built all 34 locales on Node 24.14.0: 25 source guides per locale, 850 published guide pages. The standard generated-HTML NUL cleanup and website content/metadata audit passed.
- Browser navigation and accessibility checks passed all 816 scenarios across 34 locales at 390, 768 and 1440 pixels, including release routes and dark-mode provider pages. The three reports contain 96, 360 and 360 scenarios with no failures.
- The final bundle was reloaded through the official Obsidian CLI into the open `1Knowledge` Vault. It reported version `1.9.9`, no active task and unchanged settings bytes. The loaded `main.js`, `manifest.json` and `styles.css` match the release candidate byte for byte. The separate `obsidian-cli` executable is not installed; this check used `Obsidian.com`.
- All 272 affected website pages and 31 README editions were updated with directly authored translations. Source-review hashes were refreshed after comparison with that content. Website indexing remains limited to English and Simplified Chinese; translation authorship does not establish independent native review.

Local receipts are retained under `.cache/release199-*` and `.cache/verification/{website-navigation,release199-navigation-1,release199-navigation-2}`. Remote CI, public release and Pages receipts remain pending until those operations complete.

## Limits

Real-Vault evidence covers the documented desktop CLI scenarios, not every platform or every possible model response. Physical mobile devices and Obsidian 0.15.0 remain unverified. Presentation exports retain their separate dependencies. Existing test evidence must not be relabeled as a new run of all native consumers.
