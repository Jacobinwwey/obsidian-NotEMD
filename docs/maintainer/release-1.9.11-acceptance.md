# Release 1.9.11 acceptance

## Scope

Publish the Drawnix relationship placement/routing, general SVG-to-PDF preparation, session log retention and default-collapsed diagnostic groups. The [recovery acceptance](./drawnix-export-recovery-acceptance.md) contains root causes, unchanged-input measurements and actual Obsidian 1.13.7 CLI export evidence. No computer-use or desktop UI automation is used.

## Documentation

Version metadata, the English/Chinese release notes, all 31 root README manuals and 34 website locales are updated together. Diagram and configuration manuals explain the same behavior. Translations were authored and reviewed directly by the root assistant without translation APIs, LM Studio or delegated translation. Locale review hashes cover the exact source and authored text; independent native-speaker review is not claimed.

## Verification and publication

The focused diagnostic regression failed against the flat list and passed after grouping: 42 tests in two suites. Real Obsidian CLI inspection of the candidate confirms 10 records in three initially closed groups, with every message retained; panel height decreases from about 953 px expanded to 184 px collapsed.

Production build, UI/render-host audits and the lint ratchet passed. The first release full-suite run found stale README footers/welcome digests and two timing failures under concurrent website compilation (a 20-second publisher subprocess and browser teardown). Version surfaces were corrected; the version contract, SVG security suite and publisher success path passed on targeted reruns. A clean full CI run is required before publication. The 99 changed locale review receipts match their source and translated text. Website build/navigation checks and remote publication are pending at this candidate commit.

After the release commit, require a clean checkout and the main Linux/Windows verification workflow. Push the matching tag to let the single Release Actions workflow run the checked-in publisher; do not run a competing local publisher. It verifies downloaded hashes for main.js, manifest.json, styles.css and README.md before publication. Verify the public release and chronicle follow-up, then explicitly dispatch deploy-docs.yml on main and check the published version and localized pages.

## Retained limits

Native Drawnix arrows remain static after rearrangement. Layout optimization is bounded, not globally optimal. Logs survive session actions and view rebuilding, not plugin reloads. Oversized PDF pages scale proportionally. Existing settings, sources, generated files, sanitizer rules and export contracts remain intact.
