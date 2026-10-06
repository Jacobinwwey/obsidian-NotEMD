# Preview and presentation export reliability — 2026-10-06

Language: **English** | [简体中文](./2026-10-06-preview-slidev-reliability.zh-CN.md)

## Scope and constraints

Continue the completed 1.9.12 baseline without replacing published assets. Use CLI only. Preserve source notes and settings. All translations are authored directly, without translation APIs or local language-model services.

## Implemented changes

- Successful diagram export logs use a collapsed disclosure; partial, cancelled, pending, diagnostic-error and history-error runs remain expanded.
- Each preview viewport has an independent lock beside zoom-out. Locked viewports freeze navigation and allow SVG/HTML text selection. Raster images do not acquire selectable text.
- PNG/PDF preview validates binary signatures and awaits the native Obsidian viewer instead of decoding bytes as Markdown.
- Presentation format selection supports multiple formats with old scalar-setting fallback. Source preparation and layout convergence occur once; PNG and MP4 share capture. Per-format failures remain visible.
- Playwright installation, probing and consumers share package/cache resolution. Installation invokes the resolved package CLI and verifies headless launch; an exit code alone is insufficient.
- Obsidian image embeds are converted and copied into the prepared workspace; code literals remain unchanged. Missing or unsupported embeds produce visible diagnostics.
- Only the required Jacobinwwey Slidev fork is eligible. Official npx fallback is removed; installation success requires a fresh probe. Invalid explicit CLI overrides stop installation before npm runs.

## Fork provenance and root cause

The incident used archive `notemd-standalone-v52.16.0-1`, commit `5f600c39cdd89df2a623a6cf2fd57c2c2284ba87`. Its GitHub archive SHA-256:

`c456b934ac563805af13f55106e0779ffd7caaf48c698d8f91dae11bd485ae6a`

All 13 archive files matched the installed vault CLI byte-for-byte. The SHA-512 also matched the npm lockfile. This incident did not run the official CLI.

The fork release lock uses UnoCSS 66.7.0 and MagicString 0.30.21. Its published CLI permits `unocss: ^66.7.0`; the consumer resolved 66.10.5, whose Vite integration uses MagicString 1.4.3. Uno directives edit that instance, then replace the whole original range after removing empty CSS rules. The newer instance retains inserted fragments, producing duplicate bare declarations. Identical transformation with 0.30.21 parses correctly.

A minimal one-slide build reproduces the failure. A narrowly scoped prepared-workspace pre-transform removes empty Slidev client CSS rules before Uno runs; strict CSS minification remains enabled. This is a compatibility measure, not a general fix for the fork dependency contract.

Fork main `bbcb2efae709c2ebaa96bda522cd6c192476817c` has newer standalone/shiki fixes, but a clean packed consumer exposed two further defects. The standalone transformer replaced the entire exports object at a default export, discarding preceding named exports (including Mermaid's layout function). The local fix retains the namespace, assigns only `.default`, and marks it as an ESM namespace for Vue's async component loader. Five executable regression cases failed before the change and passed afterward.

The clean consumer also resolved Twoslash 4.5.0 with FloatingVue 5.4.0; Twoslash's internal component patch failed at `components.Popper`. The working source installation used 4.2.0 with 5.2.2. The fork candidate constrains that pair and resolves their runtime imports from the CLI, so unrelated newer consumer copies cannot replace them. Four UnoCSS catalog entries are pinned to 66.7.0. These constraints are present in the packed CLI manifest, not just the workspace lockfile.

Existing public assets remain immutable. The repaired `-2` fork is published at commit `fc7045268a4e560bc479caef24ca4b73fea1b0cf`; its downloaded release asset matches the tested archive. Plugin 1.9.13 targets that release and rejects the known-broken `-1` archive while retaining future fork compatibility.

## Verification and remaining work

An earlier full Jest run passed 3031 tests (one skipped) and found one outdated website translation-review receipt. After personally checking the changed paragraphs and refreshing only their receipts, all nine website contract tests passed. The override/fork checks passed 46 tests. Fork-wide Vitest passed 22 suites / 241 tests after rebuilding parser/types. The full-format verifier calls the production batch operation with `--format all`.

The production Playwright installer passed a real launch check. Native Obsidian CLI PNG/PDF preview passed without settings changes. The post-fix architecture run passed all five formats with 36 slides, zero layout failures, 11 table slides, three preserved Mermaid fences, and editable PPTX text (`.cache/slidev-all-fork-fixed-20261006.json`). The earlier run also decoded all 36 PNGs, parsed 36 PDF pages and checked MP4 with ffprobe. A real Chromium viewport test confirmed frozen geometry, independent zoom in the other preview, SVG/iframe text selection, and unlocking (`.cache/viewport-lock-acceptance-20261006.json`).

The packed candidate passed minified standalone build without the plugin CSS workaround. The explicit offline fixture (`fonts.provider: none`, `wakeLock: false`) passed headless `file://` rendering with Chinese, code and Mermaid, zero console/page errors and zero failed requests. The default fixture separately retained optional online-font and wake-lock permission errors; these were not suppressed. All 34 website locales built successfully.

The reusable fork archive smoke also passed from a completely new Windows consumer directory, with no inherited lockfile or dependencies. WSL is present but its Node 12.22.9 does not meet the runtime requirement; Linux acceptance is not claimed.

## Fresh-vault acceptance

The disposable vault `E:/NotemdAcceptance-20261006` contains an unchanged copy of `architecture.zh-CN.md`. Before any API test, all 36 provider configurations and the complete effective plugin settings were migrated through the plugin's save/load operations. The normalized settings matched after reload; the temporary credential transfer file was deleted. The source vault settings were not changed. A real API connection test in the new vault succeeded.

The candidate archive `slidev-cli-notemd-standalone-v52.16.0-2.tgz` has SHA-256 `2014844bd8422d6280be155fd46c24f49acb1621e03241a2c3335d0faadc6847`. Local npm archive provenance requires both the pinned lockfile SHA-512 and a matching hash of the actual archive bytes. It does not attest every installed dependency. The fresh vault uses a separate browser cache to exercise installation and repeat detection without inheriting an existing Chromium installation.

The CLI-driven acceptance records sanitized stage logs, binary preview outcomes, all-format export completion, retained sidebar logs, and source/settings restoration. A successful API connectivity test alone is not evidence that deck generation or every export succeeded. The final report must distinguish API-generated decks from fallback preparation.

The real DeepSeek generation and five-format export completed with 32 slides. All 32 PNGs decoded, PDF and PPTX each contained 32 pages, and the H.264 video parsed successfully. PPTX retained 411 editable text boxes and eight editable tables. All three Mermaid blocks remained unchanged. Every standalone HTML page loaded; one headless Wake Lock permission rejection was recorded separately from rendering failures. Task logs were retained, source bytes were unchanged, and temporary settings were restored.

Two fresh browser caches exposed a cold-start probe failure: the outer 15-second process limit killed the first probe after approximately 16.5 seconds without stderr. Subsequent launches completed in 1.7–3.1 seconds. The probe now gives Chromium 30 seconds and the overall process 60 seconds, covering module loading and cleanup. It retains process errors and reports termination without dumping the generated script. Three focused regression cases cover these boundaries. A third fresh cache passed first launch in 12.7 seconds and three later probes in 1.7–2.0 seconds. The public release URL was installed into the acceptance vault and its lockfile integrity matched the tested archive.

Final 1.9.13 local verification passed 314 suites / 3039 tests with one skipped, the production build, the 41-file lint ratchet, UI-string and render-host audits, all 34 website builds, the content audit, and 96 navigation/accessibility page checks with zero failures. The Windows test process used an E: Jest cache and disabled Git fsmonitor through child-process configuration; no system Git settings were changed. GitHub verification precedes main integration; the release publisher verifies asset hashes before publication, followed by explicit Pages deployment. The supported Obsidian CLI executed successfully; the separate `obsidian-cli` executable is not installed.
