# Unicode transport and real-Vault export verification

[中文](2026-10-01-unicode-export-walkthrough.zh-CN.md)

## Scope and outcome

Continued from the completed 1.9.8 documentation/release work without repeating it. Loaded the current plugin into the already open `1Knowledge` Vault using the official Obsidian CLI. The separately named `obsidian-cli` executable was unavailable; the working command was `C:/Program Files/Obsidian/Obsidian.com`. All application interaction used CLI evaluation; no desktop computer-use automation was used.

Generated Drawnix maps from both requested `full_processed` Markdown notes using the configured provider, then produced presentation exports from their Slidev decks. Deliverables live under the source folder's `notemd-export-demo-20261001/{zh-CN,en}/` directory:

| Artifact | Chinese | English |
| --- | --- | --- |
| Drawnix source, SVG, HTML viewer | 24 nodes, 10 relations | 24 nodes, 4 relations |
| PDF and editable-text PPTX | 22 pages/slides | 20 pages/slides |
| PNG sequence | 22 files | 20 files |
| Standalone HTML presentation | Offline resource check passed | Offline resource check passed |
| H.264/yuv420p MP4, 5 seconds per slide | 110.04 seconds | 100.04 seconds |

The source is a historical science excerpt that starts and ends mid-discussion. The curated decks carry a historical-context note. Their source files remain available for editing. Original input notes were not rewritten. Failed/intermediate exports created in this run were moved to the repository's ignored cache, not deleted.

## Fixes in the actual user path

### Stateful Unicode decoding

Desktop HTTP streams previously decoded each Buffer independently with `toString('utf8')`. A TCP boundary inside a Chinese character or emoji caused replacement characters before the SSE/JSON parser received the text. This affected normal user generation through `callLLM`, not only a sample artifact.

`src/llmUtils.ts` now retains one streaming `TextDecoder` per response in both desktop transport paths and flushes it on completion. `scripts/lib/llm-provider-diagnostic.js` uses the corresponding stateful `StringDecoder`. The browser-fetch path already used streaming decoding and gained regression coverage.

Tests send every byte separately across OpenAI, DeepSeek, Anthropic, Google, Azure OpenAI, Ollama, and JSON fallback responses. Additional cases cover browser fetch, interrupted diagnostic text, and a provider intentionally returning U+FFFD. Intentional text remains intact; the fix does not strip or replace suspect characters. The affected Chinese deck was regenerated through the loaded plugin after the fix rather than repaired by replacing text in the output.

### Standalone stylesheet resources

The pinned Slidev bundler hoisted CSS into HTML but left relative KaTeX font URLs pointing beside the HTML while files remained in `assets/`. `src/slideExport/slidevExporter.ts` now embeds local stylesheet resources at the production standalone-export boundary. It checks lexical and real-path containment and rejects missing/out-of-root files. Already embedded, remote, and fragment references are preserved.

The installed plugin's actual `exportSlidesCommand` produced an HTML file with 60 embedded font resources. Its in-app layout audit reported unavailable Playwright runtime; the independent repository verifier supplied the full-page rendered layout checks instead. This distinction is retained in the evidence.

### CJK layout measurement

Tall CJK glyphs can exceed their CSS line box while remaining visible. The old audit treated any scroll-size difference as clipping. `slidevLayoutWorkflow.ts` now captures each axis's computed overflow; `slidevLayoutAudit.ts` distinguishes visible text from clipped/scrolling boxes. Text bounds outside the slide still fail, and old measurements without the new fields retain conservative checking.

### External-Vault verification

`scripts/verify-slidev-export-workflow.cjs` no longer asks the repository's Git ignore rules to classify external Vault files. It records them separately while still rejecting unignored outputs inside the repository. A regression test checks mixed external and internal paths.

## Verification evidence

Local evidence is under `.cache/export-demo-20261001/`; it is intentionally not committed because runtime backups include private provider settings.

- Fresh `rtk proxy npm.cmd run build` succeeded. The installed `main.js`, `manifest.json`, and `styles.css` match the working repository hashes.
- Final `rtk proxy npm.cmd test -- --runInBand`: **290 suites passed, 2731 tests passed, 1 skipped** (`full-tests-final.log`).
- `audit:i18n-ui` and `audit:render-host` passed. Lint regression comparison covered all nine changed TypeScript files with zero regressions; staged diff hygiene passed.
- Both Drawnix sources passed production validation; offline HTML zoom/download checks passed (`map-browser-checks.json`).
- Full-page layout checks passed for 22 Chinese and 20 English slides. Native PowerPoint visual gates and editable-text checks passed.
- The original Chinese native report has `ok:false` solely because of the former external-Git-ignore check. `zh-CN-verification-reassessment.json` preserves that fact, rechecks repository classification with the corrected verifier, and combines it with the original passing functional gates. It does not claim a fresh native rendering run. The English native verifier completed with `ok:true`.
- Artifact checks verify PDF page counts, PNG sizes/nonblank content, PPTX editable text, video encoding/duration, every video's page against PNG, offline HTML resources, and SHA-256 hashes. Maximum normalized video-frame RMSE: Chinese **0.019049**, English **0.0187318**, below the **0.08** gate.
- Contact sheets for all pages and actual rendered PDF pages were visually inspected. The headless browser may report a non-blocking “Wake Lock permission request denied” message; reports retain this separately. No failed resource requests or rendering errors remained.
- Plugin preferences remained identical. The only persisted state change was two expected `diagramHistoryEntries`. Temporary host environment variables were restored; the plugin was idle at final runtime inspection.

Production and diagnostic regression tests first failed against the old behavior and then passed after their respective fixes. The source changes are restricted to those transport/export boundaries and the corresponding tests.

## Limits and follow-up design

This resolves the reproduced chunk-boundary corruption; it cannot reconstruct text already damaged by an upstream provider. Offline formula resources are embedded, while ordinary text uses the deck's configured system-font fallback. Drawnix validation establishes source serialization and static relationships, not native attached-arrow behavior after arbitrary edits. This run used the repository's pinned standalone-capable Slidev fork; generic upstream Slidev is not interchangeable for that export mode.

The requested bidirectional compatibility and multiple-output behavior is documented in [the design](plans/2026-10-01-diagram-output-compatibility-design.en.md). It is proposed future UI/execution work, not part of this fix. No new release version, tag, or published 1.9.8 asset is created or replaced.
