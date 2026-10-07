# Binary diagram preview and Alt lock verification

## English

The PNG/PDF route in 1.9.13 validated file signatures, then opened a native Obsidian split. Its regression test asserted that split, so it did not cover the required diagram window. Binary previews now have an explicit host operation and a modal that owns decoding and disposal, while the existing viewport owns navigation. Binary files are not represented as editable SVG sources.

PNG uses the browser image decoder and releases its object URL on close. PDF uses Obsidian's PDF.js, sequential page rendering, a 32-million-pixel document raster budget, and a selectable text layer through either supported text-layer API. Print-intent snapshot rendering avoids display animation-frame suspension in hidden vault windows. Closing during loading cancels rendering and releases resources. PNG and image-only PDFs have no text to select without OCR.

Alt temporarily locks navigation without changing the persistent lock button. Mouse entry recognizes an already-held modifier; starting a lock cancels pointer capture. Releasing Alt or losing window focus clears the temporary state. Parent-window blur caused by focusing the embedded preview is distinguished from leaving the application. Unlocking preserves the current scale and position. The visible control hint is translated directly in all existing viewport locales.

## Verification

### October 7: independent PDF pages

Each PDF page now creates a separate labeled panel and `DiagramPreviewViewport` in the dialog's bounded scroll region. Its dimensions describe only that page, so initial fit and subsequent zoom or lock operations do not affect adjacent pages. PNG retains one viewport. Resource cleanup destroys every created viewport exactly once, including after cancellation or a later page fails to load. Focused regression tests cover mixed page sizes, one page per viewport, PNG compatibility and cleanup.

The 14 focused tests and fresh build passed. Obsidian CLI verified 32 pages in 32 independent viewports in the acceptance vault and 36 pages in 36 viewports in 1Knowledge. Every viewport contained exactly one canvas and text layer; changing the second page's zoom left every other page unchanged. Persistent lock, Alt selection/release, outer scrolling and canvas disposal passed. Source PDFs and settings remained unchanged. Local receipts: `.cache/pdf-page-viewports-NotemdAcceptance-20261006.json` and `.cache/pdf-page-viewports-1Knowledge.json`.

### October 6: binary preview and Alt behavior

- Failing routing and Alt regression tests were recorded before implementation. Final focused run: 12 tests passed.
- Full suite: 315 suites, 3046 tests passed, one skipped. Fresh build, lint ratchet (zero regressions), UI-string audit and render-host audit passed.
- Headless browser: real SVG mouse selection under Alt, independent panels, persistent locks, zoom, pan and cleanup passed. Iframe modifier/selection-range checks passed. Continuous iframe pointer-drag automation stalled, including with the pre-existing persistent lock and without Alt; **real iframe pointer-drag acceptance is not claimed**.
- Obsidian CLI: acceptance vault loaded a PNG and 32 PDF pages with 2007 text spans. 1Knowledge loaded a PNG and 36 PDF pages with 973 text spans. The user's `architecture.zh-CN_drawnix-10.pdf` rendered one page and 675 text spans; `architecture.zh-CN_drawnix-10_obsidian_108ppi.png` decoded successfully. Each route opened the diagram modal without a native file split. PDF Alt state and DOM selection checks passed. These native checks use CLI evaluation, not simulated physical mouse gestures.
- Existing settings were preserved. No API calls, translation services or computer-use automation were needed. The local candidate bundle and stylesheet were copied into 1Knowledge after backing up its installed files; public 1.9.13 assets remain unchanged.

Local receipts are stored under `.cache/binary-preview-*.json`, `.cache/diagram-preview-viewport/receipt.json`, and `.cache/binary-preview-full-tests.log`. They are acceptance evidence, not portable fixtures or release assets.
