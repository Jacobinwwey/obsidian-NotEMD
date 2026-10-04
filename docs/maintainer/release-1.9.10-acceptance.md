# 1.9.10 candidate acceptance — updated 2026-10-05

## Scope

Community scanner triage and ponytail architecture review follow the already delivered PNG compatibility baseline d99309780679. The candidate does not repeat that work or overwrite existing user artifacts. The community scan contained 646 findings grouped into 108 rule/message groups; confirmed issues and rejected assumptions are in [the audit](../audits/2026-10-04-community-ponytail.md).

## Completed work

Browser SVG sanitation and per-panel CSS isolation; safe parent-bridge SVG returns; lazy desktop imports and real mobile browser bundle loading; Vault-local provider persistence with explicit legacy import and failure rejection; corrected local-only setting visibility; favorites rollback and awaited clipboard feedback; FileManager deletion preferences; loopback server Host/Origin/path controls and concurrent/pending lifecycle; patched Mermaid and smaller direct dependency set. The implementation remains in the modules owning the boundary, with separate presentation and graphics workflows.

Translations were authored directly: 21 UI locales for new persistence messages, 31 root README files, 34 website locale release/configuration/diagram pages, and independent complete English/Chinese audit, plan and release notes. Source/authored hashes are recorded in website/i18n/source-review.json; independent native-speaker review is not claimed. Old 1.9.9 release assets and original historical guide remain unchanged.

## Verification

- Production build passes.
- Fresh final-source regression: 304 suites passed, 2,954 tests passed, 1 existing test skipped (2,955 total). Result: .cache/obsidian-png-compatibility/audit-delivery-tests.json, 268.878 seconds. This includes the parent-bridge boundary and stable repeated CSS export checks.
- Real Chromium tests reproduce/remove active SVG content and host CSS leakage, retain gradients/markers/internal references, verify independent multi-panel computed colors, prevent reused scope interference, and retain visible Chinese foreignObject text.
- Actual HTTP listeners verify exact host/origin checks, UTF-8, encoded containment, concurrent acquisitions, shared release, pending shutdown and busy-port binding.
- Website builds all 34 locales. Build audit passes; navigation/accessibility audit checks 96 pages with zero failures.
- UI-string and self-contained render-host audits pass. The lint ratchet has zero regressions; final parent-bridge run is retained locally. Diff hygiene passes.

Continuation checks: the final three installed files still match the repository SHA-256 hashes. The README/version and website documentation contract checks passed (2 suites, 14 tests), followed by git diff --check. Current manuals now consistently describe Vault deletion preferences, local-only provider storage and Drawnix relationships without a fixed quota. A bounded CLI connectivity probe again returned “The CLI is unable to find Obsidian.” Evidence: .cache/obsidian-png-compatibility/audit-resume-checkpoint.json.

## Resumed verification — 2026-10-05

Recovered session 01a0f563-c6c7-78f0-940b-e783d1fe8a9b at candidate ef197278. Git diff against d99309780679 was reviewed at the SVG, provider storage, preview/export and server lifecycle boundaries. No product source changes were needed during this continuation.

- Fresh production build and full regression pass: **304 suites, 2,954 passed tests, zero failures, one existing skipped test**, 521.871 seconds. Report: .cache/obsidian-png-compatibility/resume-regression-tests.json.
- Provider transports, workflows, output preferences, export recovery, browser SVG security, mobile bundle loading and actual HTTP server tests all pass. UI-string and render-host audits pass; the lint ratchet reports **zero regressions across 31 changed TypeScript files**.
- Rebuilt main.js still matches the installed bundle. All three installed file hashes match audit-installed-bundle-hashes.json. The final plugin instance was reloaded through the official CLI, with object identity checked before and after.

## Accepted real Vault evidence

The official CLI reports **Obsidian 1.13.7 (installer 1.12.7)** in 1Knowledge. The user-agent version describes the installer and was insufficient to identify the application version in the earlier record. The separate obsidian-cli executable is not installed.

The native acceptance fixture is Notemd CLI Tests/Audit-1.9.10-native-1791156334109. Report: .cache/obsidian-png-compatibility/resume-native-acceptance.json.

- The source .drawnix companion SVG opens in the real preview. Event attributes and external/executable URLs are removed, outside host UI remains visible, and Chinese foreignObject/vector text is retained.
- SVG, HTML diagram, PNG and PDF outputs all complete beside the fixture source. The PNG decodes in Obsidian at 225 × 105 pixels for the 300 × 140 CSS-pixel fixture at 72 PPI. HTML embeds a sanitized SVG retaining Chinese text; the PDF has a valid PDF header.
- A dummy local-only provider survives save/load in Vault-scoped storage. Injected local write failure rejects with the expected error. In-memory settings, persisted settings and the exact prior local record, including its absence, are restored before acceptance is marked passed.
- Two real preview windows preserve independent zoom: 1:1 changes to 125% in one window while the other stays unchanged. The existing architecture.zh-CN_drawnix-6_obsidian_87ppi.png decodes at 4325 × 15179 pixels. Report: .cache/obsidian-png-compatibility/resume-native-zoom.json.
- SHA-256 checks preserve architecture.zh-CN.md, architecture.zh-CN_diagram.drawnix, its original recovery manifest and architecture.zh-CN_drawnix-3/-4/-5.png. Only uniquely named test fixtures were created.

## CLI recovery and reproducibility

Passing the entire old fixture as a native Windows CLI argument caused the Obsidian main-process receiver to reject malformed request JSON before the fixture ran. The error dialog blocked later CLI requests. The user dismissed it; no application was forcibly terminated. Subsequent work used CLI only.

Invoke the installed Obsidian.com with Node execFileSync and an argument array, a bounded timeout and windowsHide:true. Keep the eval argument short: load the reviewed local fixture with require('node:fs').readFileSync, then evaluate it. Check semantic output as well as the exit code: CLI eval can return an Error: string with exit code zero. Poll the fixture's explicit status rather than treating command submission as completion.

The inherited fixture also used a nonexistent preview selector, the unsupported output ID html instead of html-diagram, and incomplete restoration of an absent local record. Correcting those probe assumptions resolved the false failures without weakening product behavior or changing the plugin bundle.

## Release gate

The final candidate's native gate is **accepted**. Publish only after the corresponding main commit passes both Linux and Windows CI. Use one numeric 1.9.10 tag and the single Actions publisher, verify the public four-asset provenance and complete bilingual notes, then verify chronicle and explicitly deploy Pages. Publication evidence belongs to those observed workflow and asset results; the native acceptance alone is not a publication claim.
