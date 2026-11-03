# Notemd 1.9.15 acceptance and publication record

[中文](release-1.9.15-acceptance.zh-CN.md)

## Scope and source

Continuation of the October 18 diagram work, not a rewrite. Mermaid identities, typed ER schema/measurements, native saved Drawnix reconstruction, canonical preview fit, receipt selection, Windows Slidev Mermaid discovery/presence checks and source-faithful tree/lane recovery are included. The reviewed case4 presentation, including bottom actors, is preserved. Eighteen files in the focused Vault gallery were rehashed on November 3; case4 PNG/SVG/input pairs remain byte-identical. Cases6/7 keep their source facts and use compact layouts.

## Fresh local verification — November 3, 2026

- TypeScript/esbuild production build passed.
- Full Jest: 330 suites passed, 3185 tests passed, one skipped, zero failures. Report: .cache/release-1915-final-tests.json; elapsed 1122.686 seconds.
- Serial browser/version recheck: 3 suites, 29 tests passed. Documentation/publication contract: 2 suites, 19 tests passed.
- UI-string and packaged render-host audits passed. Lint ratchet and diff hygiene are separate release checks.
- Regenerated the 33-entry repository SVG/PNG gallery; diagram:gallery:check passed. PNG hashes attest to the actual archived bytes, not cross-platform raster identity.
- The full multilingual website build and its navigation/accessibility audits must finish before final website signoff. Source/heading/hash contracts already pass for all 34 website languages. All 31 README versions and footers and the three supported welcome-summary locales are synchronized.

## Windows publisher fixture root cause

The prior 20-second outer spawn budget terminated a real multi-command integration flow, not a failed release assertion. Reproduction passed 44/45 tests; the hidden-draft case returned null status and cleanup EBUSY. The fixture launches real Git/npm and a fake remote transport repeatedly. Targeted successful flows took approximately 52–60 seconds on this Windows host under load. The test now allows 120 seconds, throws the actual process error, hides its subprocess window and retries transient filesystem cleanup. All publication, provenance, immutable-asset and error-handling assertions remain unchanged. The full 45-test publisher suite passed in the final unfiltered run. Production publisher behavior is unchanged.

A first full run overlapped the website build and failed two pre-existing 5-second browser budgets plus incomplete version metadata. Footer/welcome metadata were corrected; serial browser retest and a new full suite passed. No browser interaction assertions or budgets were weakened for those failures.

## Native and evidence boundaries

Obsidian help and version commands returned usable output; installed version is 1.14.5. The optional obsidian-cli executable is absent. A named 1Knowledge path query unexpectedly returned E:/StudyPaper, so it is not evidence of targeting 1Knowledge. No active Vault was changed through that mismatched CLI target. Any deployment must copy only the three matching release files, back up first on E:, verify asset hashes and preserve data.json bytes; native reload is a separate claim.

The focused gallery remains E:/1Knowledge/Notemd-Acceptance/reading-first-cases-4-6-7-20261018/index.html; the original seven-case gallery remains untouched. Historical native tests do not prove fresh native round-trips for every type. Drawnix cross-branch arrows remain static after external rearrangement. Recoverable source warnings retain visuals; unsafe or unrecoverable input can still require repair.

## Publication contract

Push verified source to main without force. Create numeric tag 1.9.15 from a clean checkout only after source verification. Use one checked-in publisher via the Release workflow; verify the public release, source provenance and all four assets (main.js, manifest.json, styles.css, README.md). Explicitly dispatch Pages after the Release is public, then check deployed localized routes. This document records local qualification; workflow success and public availability require their own receipts and are not inferred here.

All controlled build/cache/test/backup outputs are on E:. Existing historical tags/assets, notes, settings and .trellis are preserved. Every affected translation was authored directly by the root agent without translation APIs, local models or delegated translation writing.
