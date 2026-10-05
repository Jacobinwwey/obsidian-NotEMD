# Release 1.9.11 acceptance

## Scope

Publish the Drawnix relationship placement/routing, general SVG-to-PDF preparation, session log retention and default-collapsed diagnostic groups. The [recovery acceptance](./drawnix-export-recovery-acceptance.md) contains root causes, unchanged-input measurements and actual Obsidian 1.13.7 CLI export evidence. No computer-use or desktop UI automation is used.

## Documentation

Version metadata, the English/Chinese release notes, all 31 root README manuals and 34 website locales are updated together. Diagram and configuration manuals explain the same behavior. Translations were authored and reviewed directly by the root assistant without translation APIs, LM Studio or delegated translation. Locale review hashes cover the exact source and authored text; independent native-speaker review is not claimed.

## Verification and publication

The focused diagnostic regression failed against the flat list and passed after grouping: 42 tests in two suites. Real Obsidian CLI inspection of the candidate confirms 10 records in three initially closed groups, with every message retained; panel height decreases from about 953 px expanded to 184 px collapsed.

Production build, UI/render-host audits and the lint ratchet passed. The first release full-suite run found stale README footers/welcome digests and two timing failures under concurrent website compilation (a 20-second publisher subprocess and browser teardown). Version surfaces were corrected; the version contract, SVG security suite and publisher success path passed on targeted reruns. A clean full CI run is required before publication. The 99 changed locale review receipts match their source and translated text. Website build/navigation checks and remote publication are pending at this candidate commit.

After the release commit, require a clean checkout and the main Linux/Windows verification workflow. Push the matching tag to let the single Release Actions workflow run the checked-in publisher; do not run a competing local publisher. It verifies downloaded hashes for main.js, manifest.json, styles.css and README.md before publication. Verify the public release and chronicle follow-up, then explicitly dispatch deploy-docs.yml on main and check the published version and localized pages.

## Completed release checks

- Candidate commit: `473eae05f89310cdcdcb74107164221a20bd1887`, integrated into remote main without divergence.
- [Candidate CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37266034837) and [main CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37267099683) both passed on Linux and Windows. Each ran 306 suites; Linux passed all 2,977 tests, Windows passed 2,976 with one platform skip. The 21-file lint ratchet reported zero regressions.
- The complete 34-locale website build and build audit passed. Navigation/accessibility checks covered 96 pages with zero failures.
- Offline publisher preflight passed from the clean candidate checkout. Native diagnostic acceptance used the installed 1.9.11 candidate; the subsequent welcome-digest-only update is covered by version-contract tests and both full CI runs.
- The first Release workflow attempt created a draft but did not see it on the immediate follow-up API read. Inspection confirmed matching provenance and no assets. The same publisher was retried against the unchanged tag; no public assets were replaced.

## Publication

[Notemd 1.9.11](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.11) is public. The [Release workflow](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37267164141) completed on its second attempt, including the chronicle refresh (`a495a0d0`). An independent download matched all four provenance hashes:

| Asset | SHA-256 |
| --- | --- |
| main.js | `74bbbdf6f423ebe89e7d581624dc3617efb134fa11b896b14db05c855c5908a7` |
| manifest.json | `5f2c326586b4b5c3ba8e0f2f5d7f14ba2e6558aa615574bc83152cfe3f986e24` |
| styles.css | `56c855d9e8f3f2bdbee8b7b75ae90ffeff00001f296bae6dbed345d52ed401ee` |
| README.md | `0d8fb1b136a413247ad4fd45e4f3348785e221a341146009a039d1b8c187bd31` |

The first automatic Pages build passed but its deployment correctly refused the then-unpublished release. Explicit post-publication deployment uses [deploy-docs.yml](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/workflows/deploy-docs.yml); the published guide is [1.9.11](https://jacobinwwey.github.io/obsidian-NotEMD/docs/releases/1.9.11). Historical 1.9.10 assets remain untouched.

## Retained limits

Native Drawnix arrows remain static after rearrangement. Layout optimization is bounded, not globally optimal. Logs survive session actions and view rebuilding, not plugin reloads. Oversized PDF pages scale proportionally. Existing settings, sources, generated files, sanitizer rules and export contracts remain intact.
