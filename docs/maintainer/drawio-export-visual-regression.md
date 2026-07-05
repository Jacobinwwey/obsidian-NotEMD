# draw.io Export Visual Regression Runbook

Language: **English** | [简体中文](./drawio-export-visual-regression.zh-CN.md)

This runbook covers the maintainer-local validation layer for Notemd's deterministic draw.io exporter. The exporter is intentionally a library boundary: it converts the internal `SemanticFigureModel` into uncompressed draw.io XML that can be opened by diagrams.net Desktop or the web app. It does not embed diagrams.net, Drawnix, or Plait in the plugin runtime.

`diagrams.net Desktop` is **not a normal CI dependency**. CI should keep using unit and contract tests for deterministic XML, visible label parity, sampled style mapping, `data-drawio-type` continuity, and `editable-html-svg` preview behavior. Visual inspection remains local maintainer evidence because diagrams.net import/render behavior is external desktop software.

## When To Run

Run this check when a change touches any of these surfaces:

- `src/diagram/adapters/editableSvg/semanticFigureModel.ts`
- `src/diagram/adapters/drawio/drawioExporter.ts`
- `src/rendering/renderers/editableHtmlSvgRenderer.ts`
- draw.io style mappings, visible label logic, or edge/source/target mapping
- `editable-html-svg` preview or source artifact export behavior

## Repo Gates

Run the focused gates first:

```bash
npm test -- --runInBand src/tests/drawioExporter.test.ts src/tests/editableHtmlSvgRenderer.test.ts src/tests/editableHtmlSvgPreview.playwright.test.ts src/tests/drawioExportDocsContract.test.ts --runTestsByPath
```

Before release or mainline closure, also run:

```bash
npm run build
npm test -- --runInBand
git diff --check
```

## Local Visual Check

1. Generate or capture a draw.io XML artifact from `exportSemanticFigureModelToDrawioXml(...)`.
2. Save it as a local `.drawio` file outside tracked source paths, for example under a temp directory.
3. Open the file in diagrams.net Desktop or import it into the diagrams.net web app.
4. Confirm every expected node and edge is visible.
5. Confirm each visible label matches the original `SemanticFigureModel` label exactly.
6. Confirm node fill/stroke choices match the sampled role mapping.
7. Confirm edge direction, source/target anchoring, arrowheads, and dashed async relations are visually correct.
8. Capture a screenshot or short note with the file path, commit, and observed result.

Do not commit generated screenshots or `.drawio` files unless a future task explicitly introduces fixture artifacts.

## Supported primitives

- Rectangular rounded nodes with visible labels.
- Node roles: `actor`, `boundary`, `processor`, `process`, `state`, plus a neutral fallback style.
- Directed edges with `source` and `target` references.
- Edge labels from `SemanticFigureEdge.label`, falling back to relation when no label exists.
- Async-like edge relations mapped to dashed draw.io edges.
- Uncompressed XML suitable for deterministic diffs and text review.
- Label escaping for XML-sensitive characters.

## Unsupported

- Arbitrary draw.io stencil libraries.
- Swimlanes, containers, collapsed groups, embedded images, and custom icons.
- Mermaid import/export round-trips.
- Full diagrams.net layout engine parity.
- Pixel-perfect parity with `editable-html-svg`; the two targets share semantic model data, not a browser rendering engine.
- Desktop automation in normal CI.

## Acceptance Notes

The strongest automated evidence is:

- `collectDrawioVisibleLabelMismatches(xml, model)` returns no mismatches.
- XML contract tests prove deterministic `mxfile` structure.
- sampled style tests prove role and edge relation mappings.
- `editable-html-svg` tests prove `data-drawio-type` annotations remain present before draw.io export hardening consumes the same model.

The strongest manual evidence is a saved local import result from diagrams.net Desktop showing visible label parity and correct sampled styles.
