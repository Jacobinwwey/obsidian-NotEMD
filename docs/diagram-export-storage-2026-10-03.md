# Diagram export storage — 2026-10-03

[简体中文](./diagram-export-storage-2026-10-03.zh-CN.md)

## Contract

- Requested formats are user deliverables. New multi-format runs write them directly beside the source note, or directly inside the selected output folder (including the Vault root).
- Recovery manifests, cached rendering intermediates, staging files and native attachments use a separate storage location. The default is `notemd_assert` beside the source Markdown, even when final outputs use a custom folder.
- Settings → Diagram preview & export → Diagram intermediate files folder accepts a shared Vault-relative folder. Empty restores the per-note default. Invalid paths remain visibly invalid without replacing the previous saved setting.
- Settings are snapshotted for a generation/preview request. Changing the location affects future requests; retry follows the persisted manifest and never migrates existing successful outputs.

## Implementation and trade-offs

The v2 manifest records the output filename stem separately from its own location. Output filenames retain the batch UUID to prevent overwriting another run or a user's edits. Native source, graphic HTML and structured HTML have distinct suffixes.

Drawnix source metadata, visual manifests and companion records are rewritten together to scoped Vault-relative attachment paths. The existing saved-artifact preview reader supports these paths. Only owned `.pending` files are removed after publication; recovery records and attachments are retained because they support retry and source visuals.

The v1 decoder preserves legacy directory layouts and hash receipts. Publication still uses verified staging followed by rename; checkpoints use the host's serialized `adapter.process` boundary. Folder initialization tolerates concurrent creation by independent batches. Presentation export retains its separate configuration and environment dependencies.

## Verification

Targeted tests cover sibling outputs, custom/root output locations, cache overrides, Unicode, companion references, cancellation, hash conflicts, concurrent folder creation, frozen settings and legacy recovery. Settings tests exercise invalid input retention and clearing the folder back to its default.

## Vector PDF relationship labels

The reported PDF contained all five Chinese relationship strings in its text layer, yet each label interior contained zero visible dark pixels. The SVG requested stroke-before-fill for a 4px white text halo; svg2pdf always emitted fill-then-stroke (`2 Tr`), covering the glyphs. New Drawnix renders omit the redundant halo because the labels already have a background box. The PDF parser also disables the halo for marked, boxed relationship labels in older cached SVGs, including their tspans. Unrelated outlined text remains unchanged. A real Chromium/svg2pdf regression checks the emitted PDF text operators; host raster inspection verifies visible glyphs separately from text extraction.

## Completed verification

- Fresh build; 297 Jest suites passed, 2,855 tests passed and one existing test skipped. Lint ratchet: zero regressions; UI-string and render-host audits passed.
- In the open `1Knowledge` Vault, the production export adapter wrote Drawnix/SVG/PNG/PDF/HTML beside the original Markdown. Recovery data used `notemd_assert`. Custom output folders, Vault-root output, and a separate shared cache were verified without moving existing outputs.
- The real preview's selected-format action, maintainer CLI retry, and v1 in-place retry passed. Reopening a saved native Drawnix source successfully loaded its SVG companion from the shared cache. Source text and user preferences were preserved; normal export-history updates were expected.
- The actual settings input saved a normalized Windows path on Enter, rejected traversal inline, and restored the default when cleared. Original settings bytes were restored after the UI test.
- A new PDF exported by the loaded plugin from the old SVG snapshot retained all five Chinese relation strings and rendered visible glyphs. Per-label dark-pixel counts changed from 0 to 1,687 / 2,547 / 2,895 / 2,536 / 2,089; visual crops confirmed the result.

Local evidence: `.cache/diagram-storage-20261003/` contains host export receipts, the settings screenshot/report, native-companion reopen proof, full logs, and PDF before/after crops. These runtime files are intentionally untracked. This is a main-branch development change; published release assets were not modified.
