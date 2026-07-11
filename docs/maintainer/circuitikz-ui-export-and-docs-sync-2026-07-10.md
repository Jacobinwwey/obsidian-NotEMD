---
date: 2026-07-11
topic: circuitikz-ui-export-and-docs-sync
---

# Diagram Source Formats, CircuitikZ, And Docs Sync Plan

Language: **English** | [简体中文](./circuitikz-ui-export-and-docs-sync-2026-07-10.zh-CN.md)

## Product Model

The user interface must expose three separate decisions:

1. **Diagram type** describes meaning: flowchart, sequence diagram, circuit diagram, or data chart.
2. **Source format** describes the editable/reusable artifact: Mermaid, JSON Canvas, Draw.io, Drawnix, or CircuitikZ.
3. **Export format** describes the visual deliverable: SVG, PNG, or PDF. Saving the source artifact remains available separately.

Draw.io and Drawnix are source formats, not diagram types. CircuitikZ is the constrained source format for circuit diagrams. PNG and PDF must not be added to `RenderTarget`; they remain conversions from `RenderArtifact.previewSvg` through the shared preview exporter.

## CircuitikZ Generation Boundary

The LLM must not produce raw TeX. It produces validated `DiagramSpec(intent: "circuit", circuitSpec)` JSON. `CircuitikzRenderer` then deterministically writes the complete TeX document, including `\usepackage{circuitikz}`, `\begin{document}`, and `\begin{circuitikz}`. This preserves topology validation and keeps source, preview, and export behavior consistent.

The investigated mind-map failure had four distinct causes:

- the old circuit prompt still exposed every diagram intent and provided no complete `CircuitSpec` example;
- an explicit CircuitikZ target without an explicit circuit intent could pass compatibility checks until renderer failure;
- `legacy-mermaid` conflicts with circuit output by design;
- the legacy **Summarise as Mermaid diagram** command always remains a Mermaid operation.

The prompt fix therefore narrows explicit circuit requests to the circuit intent and includes a complete `CircuitSpec` example. Golden-template fallback is only a bounded safety net for six recognized circuit families; it must never be presented as general free-form CircuitikZ generation.

## UI Implementation Progress

| Stage | Status | Evidence |
|---|---|---|
| Rename circuit diagram type | Implemented locally | The option is now `Circuit diagram`, without a source-format suffix. |
| Rename render target | Implemented locally | The field is now `Preferred source format`. |
| Clarify source targets | Implemented locally | Draw.io, Drawnix, and CircuitikZ are labeled as source files. |
| Expose exports | Implemented locally | Settings and sidebar state that source, SVG, PNG, and PDF are available from preview. |
| Compatibility matrix | Implemented | Circuit selection pins `best-fit` + CircuitikZ; leaving circuit clears a stale CircuitikZ preference; operation input rejects explicit incompatible combinations. |
| Real Obsidian run | Verified | Obsidian 1.12.7 CLI reloaded the plugin and the configured provider generated the reported Chinese common-source NMOS request as a complete `.tex` document. |

## Website And MDX Decision

Localized MDX is currently a publication input, not a disposable build artifact. GitHub Pages builds from the tracked English page and 33 tracked locale mirrors. Removing the locale files without redesigning the publishing pipeline would fail the localization audit.

For this feature, update only `website/docs/features/diagrams.mdx` and its matching localized pages. Do not regenerate unrelated routes. Never commit `website/build`, `website/.docusaurus`, `node_modules`, translation debug output, or temporary model responses.

The public diagrams page must become a user guide containing only:

- the distinction between diagram type, source format, and export format;
- when to choose Mermaid, Draw.io, Drawnix, or CircuitikZ;
- generation, preview, source saving, and SVG/PNG/PDF export steps;
- short troubleshooting guidance.

Schemas, confidence thresholds, renderer internals, golden fixtures, compile flags, smoke algorithms, and repair contracts belong in maintainer documentation. `website/scripts/audit-build.cjs` must be changed accordingly so it tests the user contract instead of forcing maintainer details into the public page.

LM Studio `hy-mt2-7b` is reserved for bounded documentation translation batches. Circuit generation tests use the provider and model already configured in Obsidian.

## Verification Matrix

- explicit circuit type + CircuitikZ source format + best-fit;
- automatic type + explicit CircuitikZ source format;
- circuit type + legacy Mermaid conflict messaging;
- Chinese common-source NMOS request matching the reported example;
- generated `.tex` envelope and topology assertions;
- SVG, PNG, PDF, and source export from the same preview;
- `obsidian help`, plugin discovery, and available Obsidian CLI plugin/command operations;
- targeted Jest tests, full Jest suite, TypeScript build, website build/audit, and `git diff --check`.

## Final Verification Evidence

- Root cause reproduced in Obsidian: with `best-fit`, the model returned a circuit intent but an invalid drain path; validation threw before the constrained fallback could run.
- Control-flow fix: supported explicit CircuitikZ requests now apply the bounded deterministic template when the returned CircuitSpec is invalid. Unsupported circuit requests still fail instead of being silently substituted.
- Real output: `Notemd CLI Tests/CircuitikZ common-source NMOS 2026-07-11_diagram.tex` contains the package declaration, document envelope, `american voltages`, VDD-to-RD-to-M1 drain path, source ground, gate input, and drain output.
- Obsidian CLI: official `Obsidian.com help`, plugin reload, command discovery, command execution, and developer error/console inspection succeeded. The plugin exposes 30 `notemd:*` command IDs; the exported capability, invocation-contract, and public-surface manifests remain available in the test vault.
- Repository gates after the fix: 216 Jest suites and 1,855 tests passed; the production TypeScript/esbuild build passed; diagram semantic verification executed; the existing 34-language website build passed and `audit:build` passed.
- MDX decision: the 33 localized diagram pages are tracked publication sources under the current Docusaurus contract. They are intentionally synchronized for this route only; generated `build/` and `.docusaurus/` outputs remain untracked.
- Visual audit follow-up: the CircuitikZ SVG companion inherited the stage stroke on every text glyph, while the internal circuit-kind subtitle overlapped the VDD label. Preview renderer `0.2.0` removes maintainer-only metadata, prevents text strokes, normalizes math-like labels for screen display, reduces line/font weight, and preserves the TeX source contract. A 300-PPI PNG recheck confirmed separated labels and clean glyph rendering.
