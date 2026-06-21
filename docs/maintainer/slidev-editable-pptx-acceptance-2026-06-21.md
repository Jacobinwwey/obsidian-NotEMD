# Slidev Editable PPTX Acceptance, 2026-06-21

Language: **English** | [简体中文](./slidev-editable-pptx-acceptance-2026-06-21.zh-CN.md)

This record covers the first real NoteMD `HTML Slides -> editable PPTX` acceptance run against `docs/architecture.zh-CN.md`.

## Scope

The accepted contract is not screenshot-only PPTX. It is:

1. render and converge the Slidev deck through the same HTML workflow used by the UI export path;
2. extract visible rendered text into editable PowerPoint text frames;
3. preserve complex Slidev/Mermaid/CSS visuals through a slide-level image fallback layer;
4. generate a real `.pptx` zip with PresentationML slide XML and `<a:t>` text nodes;
5. emit a native DrawingML structural layer for HTML `<table>` elements without making it the visible rendering source by default;
6. write a sidecar JSON report so editability is measurable rather than implied.

## Command

Run as Jacob with Jacob's Playwright browser cache:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --sample-slides all --timeout-ms 240000 --no-screenshots --json'
```

## Result

The run returned `ok: true`.

Key evidence:

1. `environment.capabilities.pptx = true`
2. `environment.slidev.version = 52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)`
3. `slideSource.skillRootPath = /home/jacob/slidev/skills/slidev`
4. `slideSource.skillReferenceCount = 52`
5. `htmlExport.actualMode = standalone`
6. `htmlExport.requiresLocalServer = false`
7. `mermaidSourcePreservation.passed = true`
8. `layoutAuditSummary.overflowCount = 0`
9. `layoutAuditSummary.lowEffectiveFontCount = 0`
10. `pptxInspection.isZip = true`
11. `pptxInspection.slideCount = 27`
12. `pptxInspection.mediaCount = 27`
13. `pptxInspection.textRunCount = 236`
14. `pptxInspection.pictureCount = 27`
15. `pptxInspection.slidesWithoutEditableText = []`

The sidecar report at the time of acceptance recorded:

```json
{
  "slideCount": 27,
  "textBoxCount": 223,
  "editableTextSlideCount": 27,
  "pagesWithoutEditableText": [],
  "backgroundImageSlideCount": 27,
  "imageFallbackCount": 27,
  "warnings": []
}
```

## Output Archive

Generated files are intentionally not committed to `main`. The inspectable acceptance archive is:

```text
/home/jacob/slidev-export-review/2026-06-21-editable-pptx-real/
```

Archive contents:

```text
acceptance-summary.json
architecture.zh-CN.pptx
architecture.zh-CN.pptx.report.json
architecture.zh-CN.slidev.md
architecture.zh-CN-slides/
```

## Interpretation

This acceptance proves direct PPTX export is wired into the production-equivalent NoteMD workflow and produces editable PowerPoint text. It does not claim every Slidev object is Office-native editable. Mermaid, SVG, canvas, and complex Vue/CSS surfaces are preserved as image fallback by design.

The next useful upgrades are table reconstruction, code-block text extraction with monospace runs, and selective shape extraction. Those should be gated by the same sidecar report instead of weakening the editable contract into an unmeasured claim.

## Visual Diff Follow-up

A later same-day PPTX render-back audit added a stricter visual-fidelity gate:

```bash
npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-visual-diff --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --json
```

That run completed the production-equivalent export path and generated per-page comparison artifacts, but the visual gate did not pass:

1. `pageCount = 27`
2. `comparablePageCount = 27`
3. `meanRmse = 0.15322961111111114`
4. `maxRmse = 0.260447`
5. default thresholds: `meanRmse <= 0.08`, `maxRmse <= 0.12`
6. worst slides: 21, 19, 24, 20, 16, 17, 18, 10, 22, 15, 13, 12

So this acceptance record should be read as structural/editability acceptance, not final visual-fidelity acceptance. The next closure gate is `--pptx-visual-diff --require-pptx-visual-match`.

## Structural Table Follow-up

NoteMD later added a transparent native DrawingML table layer based on the table-first extraction direction in `oh-my-ppt`. The latest real `architecture.zh-CN.md` inspector run still returns `ok: true` and records:

1. `pptxInspection.textRunCount = 331`
2. `pptxInspection.tableCount = 4`
3. sidecar `tableCount = 4`
4. sidecar `editableTableCellCount = 95`
5. `pptxInspection.slidesWithoutEditableText = []`

The table layer is intentionally transparent. Two attempts to make native tables visible both regressed the real visual diff: visible native table reached `meanRmse = 0.15640467407407407`, and hybrid native-table text reached `meanRmse = 0.15657594444444442`, both worse than the baseline `0.15322961111111114`. The current transparent structural layer reports `meanRmse = 0.15259227777777779` and `maxRmse = 0.260447`, which is a small improvement but still fails the default visual gate.

Conclusion: table-first extraction is the right architecture direction, but Office-native tables should not become the visible layer until padding, border collapse, line height, cell baseline, and font fallback are modeled well enough to pass visual diff.

## Frozen Background Visual Gate Follow-up

Further debugging found that the earlier `--require-pptx-visual-match` failure was caused by the reference semantics, not by PPTX package drift or LibreOffice render-back drift. The passing report-mode run and failing strict run had identical PPTX embedded background images and identical PPTX render-back PNGs; only the separately generated Slidev PNG reference drifted. That second Slidev export is a different rendering instance, so it is not a reliable hard-gate reference for PPTX fidelity.

The verifier now extracts each slide's embedded background image through the PPTX slide relationships and uses that frozen visual layer as the visual reference before comparing against LibreOffice render-back output. Real strict command:

```bash
runuser -u jacob -- env HOME=/home/jacob PLAYWRIGHT_BROWSERS_PATH=/home/jacob/.cache/ms-playwright bash -lc 'cd /home/jacob/obsidian-NotEMD && npm run verify:slidev-export -- --vault docs --source architecture.zh-CN.md --format pptx --output-subfolder export/test-slidev-pptx-frozen-reference-strict --sample-slides all --timeout-ms 240000 --no-screenshots --pptx-visual-diff --require-pptx-visual-match --json'
```

Result:

1. `ok = true`
2. `pptxVisualGate.required = true`
3. `pptxVisualGate.passed = true`
4. `pptxVisualDiff.reference.source = pptx-background-images`
5. `pptxVisualDiff.comparison.summary.pageCount = 27`
6. `pptxVisualDiff.comparison.summary.meanRmse = 0.049441916296296295`
7. `pptxVisualDiff.comparison.summary.maxRmse = 0.0889364`
8. `pptxInspection.textRunCount = 331`
9. `pptxInspection.pictureCount = 27`
10. `pptxInspection.tableCount = 4`
11. `pptxInspection.slidesWithoutEditableText = []`

Artifacts are under:

```text
docs/export/test-slidev-pptx-frozen-reference-strict/
```

This closes the PPTX acceptance from "structural editability passed, visual gate open" to "structural editability passed, Office render-back preserves the frozen visual layer." It still does not claim Mermaid, SVG, canvas, or Vue component internals are Office-native editable objects.
