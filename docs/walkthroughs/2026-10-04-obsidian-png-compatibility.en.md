# Obsidian PNG compatibility verification — 2026-10-04

## Continued work

The clean starting commit was ec4f2e7. Existing Drawnix routing, PNG streaming and independent zoom work were retained. The earlier Linux/Windows verification and Pages runs completed successfully. This follow-up addresses the decoder availability gap reported for architecture.zh-CN_drawnix-3/4/5.png.

## Implementation

- Added default-on diagramObsidianCompatiblePng setting with directly authored translations for every UI locale.
- Shared requested/compatible PNG delivery operations render actual lower-PPI pixels and verify them with the Obsidian Image decoder. The original is retained. Names expose requested and compatibility PPI.
- Manifest v4 freezes the preference and exact companion density; partial SHA-256 receipts, cancellation, edited-file protection and legacy v1–v3 recovery are covered.
- Automatic export, whole-preview export and individual/batch panel paths use the same contract. Preview saves record all delivered paths in history.
- Updated all README manuals, all 34 diagram website locales, bilingual plans and maintainer documentation without translation APIs.

## CLI and native evidence

The normal build was loaded into the open 1Knowledge vault using Obsidian.com plugin:reload. No source notes or existing outputs were modified. Reused the saved architecture generation; no model call was needed.

- Compatible run: architecture.zh-CN_drawnix-6_300ppi.png plus architecture.zh-CN_drawnix-6_obsidian_87ppi.png. Original SHA-256 matches the previous 300-PPI PNG exactly. Both receipts verified.
- ImageView and separate Vault resource decode both succeeded on the compatible copy at 4325 × 15179.
- Disabled run: architecture.zh-CN_drawnix-7_300ppi.png only.
- Already-compatible small run: architecture.zh-CN_drawnix-8_300ppi.png only.
- Actual preview menu → PNG → source-folder confirmation saved architecture.zh-CN_preview_300ppi.png and architecture.zh-CN_preview_obsidian_87ppi.png. Both were registered in history; ImageView decode succeeded.
- Root cause: all three reported original PNGs are RGBA8 14913 × 52341 (3,122,245,332 decoded bytes), violating Chromium 142.0.7444.265's signed decoded-size guard. Candidate budgets are conservative heuristics; 87 PPI is this geometry's verified choice, not a global fallback.

Evidence is retained locally in .cache/obsidian-png-compatibility/ (live-export.json, live-manual-export.json, input-dimensions.json, matching Chromium source and jest-report-final.json). Test harness collection errors were corrected without regenerating successful outputs.

## Verification

Full Jest: 300 suites, 2922 passed tests, one skipped. Build, lint ratchet (zero regressions), UI-string and render-host audits passed. The website built all 34 locales and passed its build audit. Navigation verification covered 96 pages with zero failures. Published 1.9.9 assets remain immutable; this fix is shipped through main and normal Pages deployment.
