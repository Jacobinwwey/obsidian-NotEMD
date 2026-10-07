# PDF preview acceptance in the visible Obsidian window

[简体中文](./2026-10-07-pdf-preview-native-acceptance.zh-CN.md)

## Scope and installed candidate

Before publishing 1.9.14, the matching `main.js`, `manifest.json` and `styles.css` were backed up and installed into the local `1Knowledge` vault through the CLI. Reloading the plugin reported version 1.9.14. The three installed files matched the local candidate, and both the persisted configuration and in-memory settings were unchanged. The source commit was `11884b12fb0f75f12435081c54d1a78f4633b5b7`.

This acceptance supplements the earlier simulated-density checks in [the repair record](./2026-10-07-pdf-preview-zoom.md). It used Obsidian 1.13.7 with a genuinely visible 2064 × 1220 CSS-pixel window and the native device pixel ratio of 1.5. Neither `document.hidden` nor `devicePixelRatio` was overridden. An initial attempt observed a temporarily hidden window and stopped; only the subsequent visible-window run is counted as passing.

The official `Obsidian.com` CLI performed opening, plugin reload, DOM checks and `dev:screenshot` capture. No computer-use or desktop input automation was used. The separate `obsidian-cli` executable was unavailable.

## Source and measured results

The tested file was `slidev-acceptance-20261006-final/architecture.zh-CN.pdf`: 36 pages, each 735.12 × 414 PDF units. Page three contains the Mermaid architecture diagram, with 289 vector path operations, 80 text items and no bitmap paint operations. Its SHA-256 was `1d13653287a2e9773d0ca8c8293023b91ab5b5d84a870cc79598dd390846aa54` before and after acceptance.

| View | Pixels per PDF unit | Canvas size | Mean absolute channel difference from independent PDF.js render |
| --- | ---: | ---: | ---: |
| Fit (1× on this window) | 1.5 | 1103 × 621 | 0 |
| 1:1 | 1.5 | 1103 × 621 | 0 |
| 2× | 3 | 1795 × 1012 | 0.000990 / 255 |
| 4× | 6 | 1795 × 1012 | 0.007687 / 255 |
| 8× | 12 | 1795 × 1012 | 0.003830 / 255 |

The detail canvas covers the visible part of the page with overscan, so its pixel dimensions remain bounded while the source-space rectangle gets smaller. No measured view required budget-driven downsampling. The acceptance tolerance was 0.05 / 255; small differences arise from serialized fractional CSS coordinates. At 8×, the old magnified base image differed by 3.405559 / 255 from the new detail image.

Panning at 8× replaced and released the previous tile; the replacement differed from the independent reference by 0.000658 / 255. The text-layer DOM stayed intact. Every page retained independent controls, and changing page three left other pages unchanged. Alt prevented movement and zoom while DOM Range selection remained possible; releasing Alt restored navigation. Persistent lock survived an Alt press/release and could be explicitly unlocked. Offscreen tiles were released, and closing the test modal zeroed all tracked canvases.

## Visual review and evidence

The root agent inspected the real CLI screenshots at 4× and 8× and the original-resolution detail canvas. Labels, arrowheads and curved connectors were sharp; cropping at high zoom followed the viewport. The next page retained its own 100% controls. The saved selection screenshot and DOM assertions document the text-layer state, not a claim of physical mouse-drag testing.

Local receipts are `.cache/native-real-install.json`, `.cache/native-real-acceptance.json`, `.cache/native-real-window-page3-{fit,1,2,4,8}.png`, `.cache/native-real-window-alt-selected.png` and `.cache/native-real-page3-8-{actual,reference,old-magnified,panned}.png`. Screenshots contain local vault context and are not published as repository assets. Old plugin files remain in the local acceptance backup. No vault configuration or credentials are included in this record.

The local Windows stylesheet has mixed line endings; normalizing CRLF to LF yields the Linux release candidate hash `5adce9f393348babb544c946cff733a28ab38932fad8d954624e6424f793f11b`. This is a byte-format difference, with identical CSS rules. The JavaScript and manifest already match the release candidate hashes.

## Release boundary

The first Release workflow stopped immediately after creating an empty draft, before uploading assets, because the publisher could not recover the expected draft in its immediate query. A later authenticated REST listing returned the unique 1.9.14 draft (ID 405541894) with the expected provenance and no publication timestamp. The underlying GitHub visibility timing is not established by the available logs. The existing publisher can resume this matching draft without changing the tag or replacing public assets. Pages was confirmed cancelled while native acceptance was pending. Publication status must be verified separately from this acceptance record.

After acceptance, [Release run 37593312768](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37593312768), attempt 2, passed the build, full test suite, audits and publisher. Version 1.9.14 became public at 2026-10-07 10:01:46 UTC with all four required assets. A separate CLI download verified all four hashes. The three installed plugin files were then aligned byte-for-byte with the public assets and reloaded; only stylesheet line endings differed from the tested candidate, and CSS rules and configuration remained unchanged. The final local receipt is `.cache/native-real-public-install.json`.

This acceptance passed for the actual screen and source above. It does not add OCR, restore detail missing from embedded raster images, or establish behavior for every possible monitor configuration. Preview zoom remains separate from export PPI.
