# 1.9.10 candidate acceptance — 2026-10-04

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

## Real Vault evidence and current release gate

The official Obsidian CLI successfully reloaded the candidate into the already open 1Knowledge Vault. A subsequent eval confirmed version 1.9.10, default PNG compatibility true and App.saveLocalStorage available. The observed host reports Obsidian 1.12.7 / Electron 39.8.3 / Chromium 142.0.7444.265.

The final compiled main.js, manifest.json and styles.css were subsequently copied to the Vault plugin directory again, with matching repository/Vault SHA-256 hashes recorded in .cache/obsidian-png-compatibility/audit-installed-bundle-hashes.json. Runtime reload of that final bundle is still pending; the earlier eval does not verify these final bytes.

The next multi-format native probe did not complete: the official CLI transport timed out, including subsequent help/version requests, then reported that it could not find the running Obsidian instance. Therefore live source-companion preview, native SVG/HTML/PNG/PDF delivery and settings failure injection are **not accepted yet**. The separate obsidian-cli executable is not installed. No forced app termination or computer-use was performed.

SHA-256 checks confirm that architecture.zh-CN.md, architecture.zh-CN_diagram.drawnix, its existing recovery manifest and architecture.zh-CN_drawnix-3/-4/-5.png remain unchanged. The intended unique audit fixture parent was not created. The prior PNG real-host evidence remains valid for its delivered baseline, and is not relabeled as evidence for this candidate's new sanitizer.

Remote main push, numeric 1.9.10 tag, public Release and Pages deployment are pending the native gate. Do not claim publication or use the older CI/Pages successes as candidate proof. Once the existing host CLI is responsive, rerun the recorded .cache/obsidian-png-compatibility/audit-live-code.txt probe with a unique fixture path and an existing parent, restore settings, finish semantic checks, then follow the single-publisher release workflow. The native gate can only be relaxed through an explicit documented release decision.
