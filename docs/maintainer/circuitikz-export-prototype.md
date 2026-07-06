---
date: 2026-07-05
topic: circuitikz-export-prototype
---

# circuitikz Export Prototype

Language: **English** | [简体中文](./circuitikz-export-prototype.zh-CN.md)

## Contract

`scripts/export-circuitikz.js` is the offline export boundary for the first constrained circuit-diagram prototype.

It accepts a checked `CircuitSpec` JSON file and writes deterministic `circuitikz` LaTeX without requiring Obsidian, TikZJax, a LaTeX installation, or a browser runtime:

```bash
npm run diagram:export-circuitikz -- --input cmos-inverter.json --output cmos-inverter.tex
```

Direct entrypoint:

```bash
node scripts/export-circuitikz.js --input common-source.json --output common-source.tex
```

Input may be UTF-8 with or without a BOM, so JSON written from Windows PowerShell remains usable.

## Topology-Preserving Repair Guard

Visual repair is allowed to change labels, title text, layout hints, and routing coordinates, but it must not change electrical topology. The exporter now exposes a repair guard through `--topology-reference`:

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --topology-reference cmos-inverter.json \
  --output cmos-inverter.tex
```

The guard compares canonical topology signatures before any `.tex` output is written. The signature is produced by `createCircuitTopologySignature` and includes `circuitKind`, `goldenReferenceId`, normalized nets, component ids/types/terminals, and undirected connection endpoints. It intentionally ignores labels, title text, layout hints, connection ordering, and connection labels so a repair pass can improve readability without being blocked by non-electrical edits.

`assertCircuitTopologyUnchanged` rejects candidate specs whose topology signature differs from the reference. This catches repair drift such as adding a short, removing a terminal connection, changing a transistor type, or moving a component terminal to a different net even if the template's minimal family validation still passes. The CLI reports `Circuit topology drift detected` and does not write the output file.

## Compile-Log Diagnostics

The exporter can also parse an existing LaTeX/TikZJax compile log and return machine-readable diagnostics without executing a local compiler:

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-log cmos-inverter.log \
  --diagnostics-output cmos-inverter.diagnostics.json
```

This path is intentionally log-driven. It does not resolve shell commands, spawn `pdflatex`, or require TikZJax in the plugin runtime. If the log contains compile errors, the CLI still writes the deterministic `.tex` artifact, writes diagnostics when requested, prints the diagnostic summary to stderr, and exits nonzero so automation can stop before screenshot or visual repair gates.

Current diagnostics include:

- missing LaTeX packages such as `circuitikz.sty`;
- unknown TikZ/circuitikz keys such as misspelled component names;
- undefined control sequences;
- generic LaTeX errors and emergency stops;
- advisory overfull `\hbox` warnings for later visual review.

The parser lives in `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` so the diagnostic rules remain testable outside the CLI wrapper.

## Optional Local Compile Execution

The CLI can optionally run a local renderer command after writing the `.tex` file:

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-executable pdflatex \
  --compile-arg -interaction=nonstopmode \
  --compile-arg -halt-on-error \
  --compile-arg -output-directory={outputDir} \
  --compile-arg {tex} \
  --expected-artifact {outputDir}/{jobName}.pdf \
  --diagnostics-output cmos-inverter.diagnostics.json
```

This path uses direct process execution with an argument array (`shell: false`). It does not concatenate a shell command, so Windows, Linux, and macOS avoid shell-specific quoting and resolution differences. Supported placeholders are:

| Placeholder | Value |
|---|---|
| `{tex}` | absolute path to the generated `.tex` file |
| `{outputDir}` | absolute output directory for the generated artifact |
| `{jobName}` | generated `.tex` basename without extension |

When `--expected-artifact` is provided, the runner also performs render-smoke artifact checks. For opaque artifacts such as PDF, it verifies that the expected file exists and is non-empty. For `.svg` artifacts, it additionally checks for an `<svg>` root, positive dimensions or `viewBox`, at least one visible drawing element, any repeated `--expected-svg-text` tokens, obvious elements outside the `viewBox`, and obvious overlapping `<text>` labels. The SVG geometry pass is transform-aware geometry for common group and element `transform` attributes, so translated, scaled, rotated, skewed, and matrix-transformed boxes are checked after transform composition. If expected text is not searchable and the SVG uses reusable path glyphs, the report records `pathOnlyGlyphUseCount` and emits `render-svg-text-path-only` so automation can route the artifact to the later screenshot/OCR gate:

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-executable dvisvgm \
  --compile-arg ... \
  --expected-artifact {outputDir}/{jobName}.svg \
  --expected-svg-text v_{in} \
  --expected-svg-text v_{out}
```

For `.png` screenshot artifacts, the smoke check decodes non-interlaced 8-bit grayscale, RGB, grayscale-alpha, or RGBA PNG output, verifies positive dimensions, records the foreground pixel bounding box as `foregroundBounds`, records foreground density inside that box as `foregroundDensity`, and requires at least one pixel that differs from the top-left background color. Blank screenshots fail with `render-png-blank`; foreground content that touches the image boundary fails with `render-png-content-clipped`; foreground pixels that are unusually dense inside a non-trivial bounding box fail with `render-png-foreground-dense`; malformed or unsupported PNGs fail with `render-png-invalid` or `render-png-unsupported`.

The result is recorded as `compileExecution.renderSmoke`. Missing or empty artifacts add `render-artifact-missing` or `render-artifact-empty`; SVG structure failures add diagnostics such as `render-svg-invalid`, `render-svg-dimension-missing`, `render-svg-no-visible-elements`, `render-svg-text-missing`, `render-svg-text-path-only`, `render-svg-out-of-bounds`, `render-svg-text-overlap`, `render-svg-label-overlap`, or `render-svg-path-glyph-overlap`; PNG screenshot failures add diagnostics such as `render-png-blank`, `render-png-content-clipped`, or `render-png-foreground-dense`.

The SVG bounded-canvas, path-only label classification, path-only glyph placement, text-overlap, and label-vs-drawing overlap checks are intentionally conservative. They parse common SVG coordinates in `path`, `line`, `polyline`, `polygon`, `rect`, `circle`, `ellipse`, positioned `text`, positioned `tspan`, and `<use href="#...">` elements, then compose common group and element transforms before checking boxes. The path parser covers line-style commands, A/a arc endpoints, and exact Bezier curve bounds for C/S/Q/T curve extrema so curved circuit symbols can still contribute endpoint geometry to bounded-canvas checks. Definition-only glyph paths inside `<defs>` are not counted as visible drawing elements; referenced glyph uses are resolved for bounded-canvas checks so path-only labels can still fail with `render-svg-out-of-bounds` when their placed geometry escapes the `viewBox`. Multiple positioned `tspan` labels emitted under one `<text>` parent are treated as separate label boxes so LaTeX-style SVG output can still trigger `render-svg-text-overlap`. Label-vs-drawing overlap uses a small stroke tolerance around drawing boxes so thin wires and polygonal component outlines can still be treated as potential label-legibility failures. Path-only glyph labels resolved from `<use href="#...">` are compared against drawing boxes as a separate legibility gate and fail with `render-svg-path-glyph-overlap` when reusable glyph geometry overlaps wires or components. Path-only label classification detects reusable glyph paths, not the text value encoded by those glyph shapes. These checks catch obvious fixture failures before screenshot review, but they do not replace OCR, precise pixel-level overlap detection, exact arc bounds, full SVG path coverage, or final image-based visual inspection.

The runner lives in `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts`. It reads the generated `{jobName}.log` from `{outputDir}`, reuses the same diagnostics parser, and returns `compileExecution` plus `compileDiagnostics` in the CLI JSON result. Artifact checks live in `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` so SVG structure rules remain testable without spawning a renderer. A non-ok diagnostic report still makes the CLI exit nonzero.

## Maintainer Smoke Fixtures

The repository now includes maintainer fixtures for every supported golden family:

| Fixture | Circuit family |
|---|---|
| `docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json` | `common-source-amplifier` |
| `docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json` | `cmos-inverter` |

Run both fixtures through the same explicit renderer configuration with:

```bash
npm run diagram:smoke-circuitikz -- \
  --output-dir docs/export/circuitikz-smoke \
  --compile-executable pdflatex \
  --compile-arg -interaction=nonstopmode \
  --compile-arg -halt-on-error \
  --compile-arg -output-directory={outputDir} \
  --compile-arg {tex} \
  --expected-artifact {outputDir}/{jobName}.pdf
```

The runner is `scripts/run-circuitikz-smoke-fixtures.js`. It discovers the fixture JSON files, writes one `.tex` artifact per fixture, invokes `scripts/export-circuitikz.js` for each fixture, and returns an aggregate JSON report with `fixtureCount`, per-fixture `compileExecution`, and per-fixture `compileDiagnostics`.

For SVG-producing renderers or wrapper executables, use the same expected-artifact and text-token gates:

```bash
npm run diagram:smoke-circuitikz -- \
  --output-dir docs/export/circuitikz-smoke \
  --compile-executable <explicit-renderer-or-wrapper> \
  --compile-arg ... \
  --expected-artifact {outputDir}/{jobName}.svg \
  --expected-svg-text v_{in} \
  --expected-svg-text v_{out}
```

This is the first real-environment smoke boundary. It still does not make LaTeX or TikZJax mandatory for normal CI or plugin startup; it gives maintainers a repeatable command for local release evidence when a renderer is installed. The command stays cross-platform because the fixture runner delegates to the existing shell-free compile runner instead of resolving a platform shell.

## Supported Circuit Families

This is not a generic TikZ generator. The current prototype supports only golden-reference families whose topology and layout can be validated before export:

| `circuitKind` | `goldenReferenceId` | Template |
|---|---|---|
| `common-source-amplifier` | `common-source-nmos-v1` | NMOS common-source amplifier with `R_D`, `VDD`, `vin`, `vout`, and grounded source |
| `cmos-inverter` | `cmos-inverter-v1` | PMOS-over-NMOS CMOS inverter with shared gate input and shared drain output |

The adapter validates the structural invariant first, then emits a fixed layout. For example, the CMOS inverter requires:

- `MP` as `pmos` and `MN` as `nmos`;
- `VDD -> MP.S`;
- `MN.S -> GND`;
- `vin -> MP.G` and `vin -> MN.G`;
- `MP.D` and `MN.D` on the shared output drain path;
- both transistor drains connected to `vout`.

## Why `CircuitSpec` Is Separate

`DiagramSpec` is intentionally not widened for circuit diagrams yet. Circuit diagrams need topology, terminal references, layout lanes, and package conventions that generic flowcharts and data charts do not use.

The boundary is:

```text
CircuitSpec
  -> topology/template validation
  -> deterministic golden-reference circuitikz adapter
  -> .tex artifact
```

This keeps the model-facing contract narrow and makes topology drift testable. The exporter rejects invalid topology before writing an output file.

## Verification

Canonical regression commands:

```bash
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzCompileDiagnostics.test.ts src/tests/circuitikzRenderSmoke.test.ts src/tests/circuitikzCompileRunner.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

The tests verify:

- deterministic common-source LaTeX;
- constrained CMOS inverter output;
- topology rejection before export;
- CLI exposure through `package.json`;
- UTF-8 BOM input handling;
- topology-preserving repair checks through `--topology-reference`, `createCircuitTopologySignature`, and `assertCircuitTopologyUnchanged`;
- compile-log diagnostics for missing packages, unknown keys, undefined control sequences, and overfull layout warnings;
- diagnostics JSON output and nonzero CLI exit when a compile log contains errors;
- shell-free compile execution with placeholder-expanded argument arrays;
- render-smoke artifact existence and non-empty checks through `--expected-artifact`;
- SVG artifact structure checks and optional text-token checks through repeated `--expected-svg-text`;
- path-only SVG label classification through `pathOnlyGlyphUseCount` and `render-svg-text-path-only`;
- bounded SVG viewBox, arc path endpoint geometry for A/a arc endpoints, exact Bezier curve bounds for C/S/Q/T curve extrema, obvious text-overlap, positioned `tspan` label overlap, path-only glyph label overlap, and label-vs-drawing overlap checks, including transform-aware geometry for common SVG transforms;
- PNG screenshot smoke checks for positive dimensions, non-background pixels, foreground bounds, foreground density, edge-touching clipped content, and unusually dense foreground blocks;
- maintainer fixture discovery and aggregate smoke execution through `src/tests/circuitikzSmokeFixturesCli.test.ts`;
- no output file is written for invalid topology.

## Non-Goals

This prototype does not bundle LaTeX, call TikZJax as an Obsidian runtime dependency, OCR path-only glyph text, run precise pixel-level overlap detection, compute exact arc bounds or cover unsupported SVG path geometry, or use rendered-image feedback for automatic repair. Those are later gates. It also does not accept arbitrary natural-language circuit requests. The important current claim is narrower: validated `CircuitSpec` input can produce stable, readable circuitikz for two high-value golden families, existing compile logs can be converted into actionable diagnostics, and an explicitly configured local renderer can be executed without shell-specific command parsing while optionally proving that a concrete output artifact was created and, for SVG or PNG output, structurally renderable enough for later visual inspection. SVG output now includes transform-aware geometry for common SVG transforms, arc path endpoint geometry for A/a arc endpoints, exact Bezier curve bounds for C/S/Q/T curve extrema, positioned `tspan` label geometry, path-only label classification, path-only glyph overlap detection, and conservative label-vs-drawing overlap detection; PNG output exposes foreground bounds and foreground density needed to reject obvious canvas clipping and first-pass pixel crowding before a topology-preserving repair loop.
