# Obsidian PNG compatibility — implementation plan

## Scope and evidence

Continue from ec4f2e7. Streaming PNG encoding and independent preview zoom are complete. Valid PNG structure is insufficient for Obsidian ImageView decoding. The architecture export is 14913 × 52341 RGBA8 pixels (3,122,245,332 decoded bytes); both ImageView and the Vault resource decoder reject it in Chromium 142.0.7444.265. Matching Chromium source has a signed 32-bit decoded-size overflow guard in ImageDecoder::SetSize.

## Delivery contract

- Default-on diagramObsidianCompatiblePng setting; old configurations migrate to true, explicit false remains false.
- Render the requested original at 72–600 PPI once. When enabled, verify it using the host Image decoder. On failure, rasterize the original SVG at a lower PPI and verify that candidate. The initial candidate uses a conservative 256 MiB decoded RGBA budget and 32767 edge heuristic; neither is claimed as a host hard limit. Shrink failed candidates until decoding succeeds. Compatibility copies may go below 72 PPI, down to 1; requested export remains unchanged.
- Save stem_300ppi.png and, only when necessary, stem_obsidian_87ppi.png. The selected PPI and actual compatibility PPI are embedded in each file and filename. The verified copy is the default history/open path.
- Disabling compatibility performs no decoder check and saves only the requested original.
- Automatic and manual whole/panel exports share the same PNG delivery rules. Multi-file history preserves every original and companion. Do not overwrite older exports.
- Manifest v4 freezes the setting and exact delivery paths/densities. V1–v3 recovery keeps its original single-PNG behavior and locations. SHA-256 receipts protect partial deliveries, cancellations and retries. Compatibility failure retains the original and remains visible and retryable.

## Verification and rollout

1. Failing integration tests first: default-on, off, unnecessary-copy avoidance, compatibility failure preservation, retry and tampering.
2. Test real browser decoding and low-PPI pixel geometry/density; check cancellation and resource cleanup.
3. Build, full Jest suite, lint ratchet, UI-string/render-host audits; manually author all locale updates.
4. Load the normal bundle using Obsidian CLI into 1Knowledge; export the existing architecture artifact through the plugin, then open/decode the saved compatibility PNG through ImageView and Vault resource paths. Do not call a provider or alter source notes.
5. Update manuals and all diagram website locales, build/audit website, push main and verify CI/Pages. Published 1.9.9 assets remain immutable.
