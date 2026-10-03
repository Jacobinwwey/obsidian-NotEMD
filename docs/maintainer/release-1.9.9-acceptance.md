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

Local receipts are retained under `.cache/release199-*` and `.cache/verification/{website-navigation,release199-navigation-1,release199-navigation-2}`.

## Publication receipts

- Release source and immutable tag `1.9.9`: [`e2d696f3a39cc53eaf252ccb5c62ce6dbe4510bc`](https://github.com/Jacobinwwey/obsidian-NotEMD/commit/e2d696f3a39cc53eaf252ccb5c62ce6dbe4510bc). [Linux/Windows verification](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37122671653) passed both jobs.
- [Release workflow](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37123106601) completed both publication and chronicle refresh on attempt 2. Attempt 1 created the correct empty draft, but the immediate readback did not find it. A later authenticated read verified its matching provenance; retry resumed that draft without moving the tag or creating another release.
- [Notemd 1.9.9](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.9) was published at `2026-10-03T12:42:12Z` and independently verified as public, stable and latest. All four required assets were downloaded again; their sizes and SHA-256 hashes match the publisher's provenance and GitHub asset digests.
- The workflow's serial chronicle refresh produced [`28737855da274ea596ddf790c163faba7196f64a`](https://github.com/Jacobinwwey/obsidian-NotEMD/commit/28737855da274ea596ddf790c163faba7196f64a), fast-forwarded into the local main branch. The release's README remains the immutable tagged edition; main subsequently updates the chronicle timestamp.
- [Initial Pages deployment](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37122671617) succeeded from the release source. Live HTTP checks passed all 34 localized release routes, English/Chinese homepages, `llms.txt` and sitemap: 38 URLs, valid UTF-8, correct release version, canonical/alternate metadata and unchanged indexing policy.
- [Explicit post-release Pages deployment](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37124523550) passed build, audit, browser checks and deployment from chronicle revision `28737855da274ea596ddf790c163faba7196f64a`. All 38 live URL checks passed again after deployment. The final receipt-only documentation commit does not change the deployed website sources or the immutable release.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `main.js` | 10136209 | `f4a34d74156c9d43108ae1cafd89d996f81576bb9b636a6f33b454d314b01b21` |
| `manifest.json` | 406 | `f5fa1d09105ee6b1f6f63a23eca907595e8f181de6ded1f20fe3edde91ea2d8c` |
| `styles.css` | 81537 | `f83670cf3fa12371cd252af0069b57d3071728cbd1d73523a2615ad7f532af51` |
| `README.md` | 105757 | `f8e396c33fa9b184f86f59e9b4fa82753436cb7236d2ee381a56a4b15ea8a73a` |

The published CSS uses LF; the local Windows candidate used CRLF. Their text is identical after line-ending normalization. The published JavaScript and manifest match the locally loaded candidate exactly. No public 1.9.8 assets or historical release notes were changed.

## Limits

Real-Vault evidence covers the documented desktop CLI scenarios, not every platform or every possible model response. Physical mobile devices and Obsidian 0.15.0 remain unverified. Presentation exports retain their separate dependencies. Existing test evidence must not be relabeled as a new run of all native consumers.
