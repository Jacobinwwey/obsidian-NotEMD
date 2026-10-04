# Obsidian PNG compatibility

Requested diagram PNG exports keep the selected integer 72–600 PPI (default 300). The **Generate images compatible with Obsidian** setting is on by default. It checks the original using the host image decoder. If decoding fails, Notemd preserves the original and generates a separate copy from the SVG with fewer pixels; the copy must pass actual decoding. Disabling the setting bypasses checks and exports only the requested original. SVG and vector PDF geometry are unaffected. Presentation exports remain a separate pipeline.

## Names and opening behavior

A 300-PPI Drawnix export is named note_drawnix_300ppi.png. If needed, a compatible copy may be named note_drawnix_obsidian_87ppi.png. Both remain beside the source note or in the explicitly selected export folder; manifests and staging remain in the configured cache folder. The default open/history path points to the verified compatible copy. Existing exports receive collision suffixes. Compatibility copies can go below 72 PPI for exceptionally large figures; the original retains the requested PPI.

## Root cause

The reported architecture.zh-CN_drawnix-3/4/5.png files are each 14913 × 52341, 8-bit RGBA PNGs. Encoding and CRC/zlib validation succeeded, but the decoded frame requires 3,122,245,332 bytes. Obsidian 1.12.7 / Electron 39.8.3 / Chromium 142.0.7444.265 rejected both ImageView and Vault resource decoding.

Matching Chromium sources trace PNG through PngImageDecoder and SkiaImageDecoderBase into ImageDecoder::SetSize. Its SizeCalculationMayOverflow checks the decoded byte size against signed 32-bit arithmetic, marking the image failed before accepting the dimensions. This accounts for these files; successful PNG writing or a CLI Opened response cannot prove decoder availability. Other images may also fail for memory-dependent reasons.

Primary source tag: 142.0.7444.265, paths under third_party/blink/renderer/platform/image-decoders:

- png/png_image_decoder.cc
- skia/skia_image_decoder_base.cc
- image_decoder.cc
- image_decoder.h

## Runtime and recovery

The first compatibility candidate uses a conservative 256 MiB RGBA decoded-byte budget and a 32767-pixel edge heuristic, then decreases PPI after failed decoding. These budgets choose candidates; they are not asserted as universal Obsidian limits or the highest decodable PPI. Requested originals are never replaced or rescaled. Every candidate changes both physical pixels and pHYs density. Decoder checks run serially, have a timeout and release Image/Blob URLs on completion or cancellation.

Manifest v4 snapshots the setting and companion PPI. Every delivered file has a SHA-256 receipt. Partial retry verifies preserved files and retains the frozen companion path, while v1–v3 recovery preserves earlier single-file behavior. All-failed compatibility or a converter failure keeps the requested original and reports a retryable error. Whole-preview and individual/batch-panel PNG exports use the same delivery operations and register both paths in Vault history.

## Validation

Use the normal plugin bundle and Obsidian CLI in 1Knowledge. Export the existing architecture artifact without calling a model, then open the delivered companion and call decode() on the ImageView image and a separate Vault resource Image. Assert positive dimensions, check IHDR/pHYs and verify file hashes and untouched source files. Also cover disabled mode, a small already-compatible PNG, partial receipts, cancellation, historical manifests and tampering.
