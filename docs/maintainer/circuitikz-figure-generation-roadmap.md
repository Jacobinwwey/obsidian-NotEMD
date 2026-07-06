---
date: 2026-07-05
topic: circuitikz-figure-generation-roadmap
---

# circuitikz Figure Generation Roadmap

Language: **English** | [简体中文](./circuitikz-figure-generation-roadmap.zh-CN.md)

This document records the circuit-diagram extension direction after the Cloudy-style editable figure work and the Drawnix export spike.

The short version: circuit diagrams should not enter Notemd as "LLM writes arbitrary TikZ." The useful target is a constrained `CircuitSpec -> circuitikz` adapter with golden-reference templates, compile feedback, and screenshot review. That is the only path likely to produce readable CMOS, analog, and digital-circuit figures reliably.

## Current Figure Stack

The current diagram work has already moved Notemd away from renderer-specific prompt strings:

| Area | Current state |
|---|---|
| Semantic input | `DiagramSpec` remains the model-facing boundary for general diagrams. |
| Internal figure model | `SemanticFigureModel` powers editable HTML/SVG, Draw.io XML, and Drawnix JSON artifact export. |
| Obsidian UI control | Developer settings and the sidebar expose `preferredDiagramIntent` and `preferredDiagramRenderTarget`; artifact/preview commands can explicitly select Mermaid, JSON Canvas, Vega-Lite, HTML, or editable HTML/SVG. |
| CLI artifact export | `npm run diagram:export-artifact` exports `editable-html-svg`, `drawio`, and `drawnix` without Obsidian runtime. |
| Verification | Tests check semantic annotations, visible-label parity, stable IDs, Drawnix subset validity, and CLI file output. |

The render-target override is intentionally scoped to artifact and preview commands. The legacy Mermaid command stays pinned to Mermaid-compatible output, while Draw.io and Drawnix stay CLI/export-boundary targets until plugin-runtime rendering and editing contracts are proven.

This architecture is the right precedent for circuit diagrams: the model should produce structured intent, not raw final syntax, and the UI should select a renderer only after the semantic spec is stable.

## Why circuitikz Is Different

`circuitikz` is the right syntax family for electrical circuits in Obsidian TikZJax, especially when notes need MOSFETs, resistors, supplies, grounds, voltage probes, or analog/digital teaching diagrams.

The hard problem is not syntax availability. The hard problem is layout quality under constraints:

- LLMs can produce a topologically correct circuit that is visually unreadable.
- Anchors such as `M1.G`, `M1.D`, and `M1.S` are easy to misuse if the model invents geometry late.
- Complex circuits need routing lanes, not ad hoc wire segments.
- TikZJax/LaTeX failures are often compile-log failures, while readability failures require rendered-image inspection.
- A working small example does not generalize to larger CMOS blocks unless the generator owns placement and routing rules.

## Recommended Architecture

```text
source note / prompt
  -> CircuitSpec
  -> topology validation
  -> layout projection
  -> circuitikz template adapter
  -> TikZJax or LaTeX render
  -> compile-log + screenshot feedback
  -> constrained repair pass
```

### `CircuitSpec`

`CircuitSpec` should be separate from `DiagramSpec` at first. Do not widen `DiagramSpec` until two or more non-circuit targets need the same fields.

Minimum useful shape:

| Field | Purpose |
|---|---|
| `circuitKind` | `cmos-inverter`, `common-source`, `logic-gate`, `rc-network`, etc. |
| `nodes` | named electrical nets such as `VDD`, `GND`, `vin`, `vout`, `drain`, `source` |
| `components` | typed parts with ids, terminals, labels, and optional model metadata |
| `connections` | topology edges between terminals/nets |
| `layoutHints` | grid positions, orientation, input/output side, routing lanes |
| `style` | `american voltages`, label policy, voltage/current marker convention |
| `goldenReferenceId` | template family used as the visual and syntax baseline |

### Golden Reference First

A golden reference is mandatory for reliable circuit generation. It should define:

- the package preamble;
- coordinate scale;
- anchor style;
- component orientation;
- input/output side conventions;
- wire routing pattern;
- label placement rules.

For example, the common-source amplifier reference should keep the working pattern:

```latex
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american voltages]
\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [R, l=$R_D$] (3,3)
  to [short, *-o] (5,3) node[right]{$v_{out}$}
  (3,3) to [short] (3,2.2)
  node[nmos, anchor=D] (M1) {$M_1$}
  (M1.S) to [short] (3,0.5)
  node[ground]{}
  (M1.G) to [short, -o] (0.8,2.2)
  node[left]{$v_{in}$};
\draw
  (3,0.5) node[below right]{$S$};
\end{circuitikz}
\end{document}
```

A CMOS inverter template should then constrain the model explicitly:

- `pmos` above `nmos`;
- `VDD` above, `GND` below;
- common input gate routed from the left;
- common drain output routed to the right;
- no diagonal wires;
- named anchors for each transistor terminal.

## Validation Strategy

Do not accept "it compiled" as enough.

| Gate | What it catches |
|---|---|
| Spec validation | missing nets, disconnected terminals, impossible terminal references |
| Template validation | missing package preamble, invalid circuit kind, unsupported component |
| Compile-log parsing | LaTeX/TikZJax syntax and package failures |
| Screenshot inspection | overlaps, unreadable labels, bad routing, excessive whitespace |
| Golden-reference diff | drift from known-good orientation and routing conventions |

Screenshot feedback can be manual first. Automated screenshot checks should start with simple rules: nonblank render, bounded canvas, expected labels visible, and no obvious label overlap boxes.

## Implementation Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| A. Prompt/runbook | Document constrained circuit prompts and golden references | website and maintainer docs explain circuitikz limits and usage |
| B. `CircuitSpec` prototype | Add parser/types/tests for simple MOS circuits | common-source and CMOS inverter specs validate without rendering |
| C. circuitikz adapter | Emit deterministic LaTeX for golden templates | generated LaTeX matches stable snapshots and contains required anchors |
| D. render feedback | Add optional local TikZJax/LaTeX smoke path | compile failures return actionable diagnostics |
| E. visual repair loop | Feed rendered image or overlap report back into repair prompt | repeated layout errors are corrected without changing topology |

## Implementation Status

Phase A is documented. Phase B/C now have a constrained repository prototype:

- `src/diagram/adapters/circuitikz/circuitSpec.ts` defines the separate circuit-only spec boundary.
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` validates topology and emits deterministic `circuitikz` LaTeX for `common-source-amplifier`, `cmos-inverter`, `cmos-nand2` / `cmos-nand2-v1`, and `cmos-nor2` / `cmos-nor2-v1`. It now projects `layoutHints.inputSide` and `layoutHints.outputSide` into constrained port placement for those golden templates, so layout-only repair candidates can move input/output ports without changing topology. The CMOS NAND template locks the parallel PMOS pull-up network, the series NMOS pull-down stack, and dual input nets `va` / `vb` before export; the CMOS NOR template locks the complementary series PMOS pull-up stack and parallel NMOS pull-down network before export.
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` now also exposes `createCircuitTopologySignature` and `assertCircuitTopologyUnchanged` so topology-preserving repair can reject electrical drift while allowing label and layout changes.
- `scripts/export-circuitikz.js` and `npm run diagram:export-circuitikz` provide the offline export command, including `--topology-reference` for repair candidates.
- `src/diagram/adapters/circuitikz/circuitikzRepairBrief.ts`, `--repair-brief-output`, and `--repair-brief` produce and consume schema `notemd.circuitikz.repair-brief.v1`, a topology-preserving repair handoff that carries the source `CircuitSpec`, topology signature, compile/render diagnostics, allowed changes, prohibited topology changes, next verification steps, and a structured `repairPrompt`. The prompt role is `topology-preserving-circuitikz-repair`; it includes `diagnosticFocus` items derived from diagnostics and `acceptanceCriteria` that require candidate validation plus fresh compile and render-smoke checks. Candidate specs can be checked against the brief signature before output is written, and `--repair-brief` now returns `repairAcceptance` evidence with schema `notemd.circuitikz.repair-acceptance.v1`, `readyForVisualAcceptance`, gate-level status, blocking diagnostics, and `remainingChecks`. `--repair-acceptance-output` can persist the same evidence as a JSON file for CI or release records.
- `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` parses existing LaTeX/TikZJax compile logs into actionable diagnostics without spawning a compiler or depending on shell command resolution.
- `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts` can run an explicitly configured local renderer with `shell: false`, placeholder-expanded arguments, structured executable diagnostics for empty, missing, or invalid renderer commands, generated-log diagnostics, and optional `--expected-artifact` render-smoke checks.
- `scripts/run-circuitikz-smoke-fixtures.js` and `npm run diagram:smoke-circuitikz` now also produce explicit renderer availability evidence when no renderer is configured. The missing-configuration path still exports the deterministic fixture `.tex` artifacts, returns `ok: false`, and records `rendererAvailability.status: "missing-configuration"` with a `compile-executable-invalid` diagnostic instead of relying on platform shell discovery or silently skipping smoke evidence.
- `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` inspects expected render artifacts. PDF and other opaque artifacts are checked for existence/non-empty output; SVG artifacts are additionally checked for an `<svg>` root, positive dimensions or `viewBox`, visible drawing elements after hidden/transparent element exclusion, optional repeated `--expected-svg-text` tokens, `render-svg-text-path-only` / `pathOnlyGlyphUseCount` classification for path-only labels, path-only glyph placement through resolved `<use href="#...">` geometry, definition-local transforms on reusable glyph paths, path-only glyph overlap diagnostics through `render-svg-path-glyph-overlap`, close-path current-point resets for relative commands after `Z/z`, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, stroke-width-aware SVG bounds and label overlap checks, `polyline` / `polygon` drawing geometry, positioned `tspan` label geometry, bounded-canvas/text-overlap diagnostics, label-vs-drawing overlap diagnostics through `render-svg-label-overlap`, and transform-aware geometry for common group and element transforms; PNG screenshot artifacts are decoded for positive dimensions, non-background pixels, 1/2/4/8-bit indexed-color packed samples with PLTE/tRNS palette data, grayscale/RGB tRNS transparent samples, 1/2/4/8/16-bit grayscale samples, 8/16-bit grayscale-alpha/RGB/RGBA direct samples, foreground bounds, `foregroundDensity`, edge-touching clipped content through `render-png-content-clipped`, unusually dense foreground blocks through `render-png-foreground-dense`, and format-specific `render-png-unsupported` guidance for Adam7 interlaced PNGs and unsupported indexed-color bit depths.
- SVG expected-text smoke now also searches decoded accessibility metadata from `aria-label`, `<title>`, and `<desc>`. This can prove semantic label identity when a renderer preserves metadata, but it still does not prove path-only visual label legibility without the later OCR/screenshot gate.
- SVG positioned text geometry now respects `text-anchor` values `start`, `middle`, and `end` from attributes or inline style, so centered and right-aligned labels can trigger text/text and label-vs-drawing overlap diagnostics.
- Grouped and `symbol` path-only glyph definitions inside `<defs>` are now resolved before `<use>` placement, so wrapped glyph paths still participate in `pathOnlyGlyphUseCount`, bounded-canvas checks, and `render-svg-path-glyph-overlap`.
- `src/rendering/diagnostics.ts` summarizes `RenderArtifact.diagnostics` into error/warning/info counts, and `src/ui/DiagramPreviewModal.ts` uses that summary in both the artifact diagnostics panel and preview history entries. Any render target can attach diagnostics to `RenderArtifact.diagnostics`; the preview UI shows the summary, severity, kind, message, and advice without requiring TikZJax or LaTeX in the plugin runtime.
- `src/tests/circuitikzExporter.test.ts`, `src/tests/circuitikzRepairBrief.test.ts`, `src/tests/circuitikzCompileDiagnostics.test.ts`, `src/tests/circuitikzRenderSmoke.test.ts`, `src/tests/circuitikzCompileRunner.test.ts`, and `src/tests/circuitikzExportCli.test.ts` verify deterministic output, topology rejection, topology-preserving repair brief generation and candidate validation, package-script exposure, UTF-8 BOM handling, diagnostic parsing, shell-free compile execution, structured `compile-executable-invalid` / `compile-executable-not-found` diagnostics, diagnostics JSON output, render artifact existence/non-empty smoke checks, SVG structure checks, path-only SVG label classification, path-only glyph placement checks, definition-local glyph transform checks, path-only glyph overlap diagnostics, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, stroke-width-aware SVG bounds and label overlap checks, `polyline` / `polygon` drawing geometry checks, positioned `tspan` label geometry checks, transform-aware SVG geometry checks, SVG label-vs-drawing overlap checks, PNG blank screenshot checks, indexed-color and grayscale PNG packed sample decoding, indexed-color PNG palette decoding, grayscale/RGB PNG tRNS transparent sample handling, format-specific unsupported PNG diagnostics, 16-bit direct PNG sample normalization, PNG foreground-bound and foreground-density reporting, PNG clipped-content diagnostics, dense-foreground diagnostics, and nonzero CLI exit for logs or smoke reports with errors.
- `src/tests/diagramPreviewModal.test.ts` verifies that artifact diagnostics are visible in the diagram preview modal and that preview history does not collapse entries with different diagnostics.

Phase D now has log parsing, opt-in local renderer execution, explicit missing-renderer availability reports for fixture smoke evidence, artifact-level smoke checks, SVG structure smoke checks with hidden/transparent element exclusion, accessibility metadata expected-text checks through `aria-label`, `<title>`, and `<desc>`, transform-aware geometry, path-only label classification, path-only glyph placement checks, path-only glyph overlap diagnostics, close-path current-point handling, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, stroke-width-aware SVG bounds and label overlap checks, `polyline` / `polygon` geometry coverage, positioned `tspan` label geometry, `text-anchor`-aware positioned text geometry, text/text and label/drawing overlap diagnostics, first PNG screenshot nonblank, indexed-color and grayscale packed-sample decoding, grayscale/RGB tRNS transparent sample handling, format-specific unsupported PNG guidance for Adam7 interlace and indexed bit-depth failures, 16-bit direct sample normalization, edge-clipping, and dense-foreground checks, deterministic layout-hint projection for input/output ports, a topology-preserving repair guard, a topology-preserving repair brief handoff with candidate validation, structured `repairPrompt` / `diagnosticFocus` guidance, `repairAcceptance` gate evidence for repair candidates, and a front-end diagnostics surface, but the implementation still deliberately stops before automatic renderer installation/discovery, OCR recognition for path-only glyph text, precise pixel-level overlap detection, full SVG path coverage, browser-grade text layout, and automated Phase E repair execution. It does not bundle LaTeX, make TikZJax a plugin runtime dependency, or run a visual repair loop.

The SVG geometry smoke also covers SVG number grammar for leading-dot decimals and explicit plus signs. This is a small but important renderer-compatibility gate because dvisvgm can emit compact decimals that should remain fractional during bounds checks.

## Best Current Practice

Until `CircuitSpec` exists, use constrained prompts:

1. Provide a renderable golden reference.
2. Ask for a named circuit family, not a vague "draw circuit."
3. Lock orientation, anchors, and input/output sides.
4. Require a topology checklist before LaTeX.
5. Render once, then use the screenshot or compile log for a repair pass.

This will outperform unconstrained ChatGPT/Gemini TikZ generation because it limits the model's freedom to the parts that matter: choosing components and topology, not inventing every coordinate and route from scratch.

## Risks

- Pulling TikZJax into the plugin runtime would create a hard dependency on another Obsidian plugin. Keep integration optional.
- A generic "TikZ renderer" would be too broad. Start with circuitikz and only a small set of circuit families.
- Visual feedback without topology locking can repair layout by accidentally changing the circuit. The repair prompt must treat topology as invariant.
- circuitikz package versions can vary. Golden references must record the expected package behavior and renderer environment.
