# Slidev Editable PPTX Acceptance, 2026-06-21

Language: **English** | [简体中文](./slidev-editable-pptx-acceptance-2026-06-21.zh-CN.md)

This record covers the first real NoteMD `HTML Slides -> editable PPTX` acceptance run against `docs/architecture.zh-CN.md`.

## Scope

The accepted contract is not screenshot-only PPTX. It is:

1. render and converge the Slidev deck through the same HTML workflow used by the UI export path;
2. extract visible rendered text into editable PowerPoint text frames;
3. preserve complex Slidev/Mermaid/CSS visuals through a slide-level image fallback layer;
4. generate a real `.pptx` zip with PresentationML slide XML and `<a:t>` text nodes;
5. write a sidecar JSON report so editability is measurable rather than implied.

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
