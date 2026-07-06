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

When compile or render diagnostics identify a visual failure, the same topology reference can also produce a constrained repair brief:

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --topology-reference cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-log cmos-inverter.log \
  --repair-brief-output cmos-inverter.repair-brief.json
```

The repair brief uses schema `notemd.circuitikz.repair-brief.v1`. It records the topology signature, source `CircuitSpec`, compile/render diagnostics, allowed changes such as labels and layout hints, and prohibited changes such as `circuitKind`, `goldenReferenceId`, nets, component ids, component types, terminals, and connections. It also includes a structured `repairPrompt` with role `topology-preserving-circuitikz-repair`, a `diagnosticFocus` list derived from the compile/render diagnostics, and `acceptanceCriteria` that require candidate validation plus fresh compile and render-smoke checks. This is the handoff format for a later topology-preserving repair loop; it is not an autonomous visual repair engine yet.

A repaired candidate can then be checked against the brief without carrying the original reference spec:

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --repair-brief cmos-inverter.repair-brief.json \
  --output repaired-cmos-inverter.tex
```

`--repair-brief` validates the candidate's canonical topology signature against the brief before writing output. It is mutually exclusive with `--topology-reference` so automation has a single source of topology truth for each run. Passing this gate only proves topology preservation; the candidate must still be re-rendered and checked with compile diagnostics and render-smoke gates before it is accepted visually.

When `--repair-brief` is used, the CLI result now also includes `repairAcceptance` with schema `notemd.circuitikz.repair-acceptance.v1`. This report records the `topology-signature`, `compile-diagnostics`, and `render-smoke` gates as `passed`, `failed`, or `missing`, exposes `blockingDiagnostics`, and lists `remainingChecks`. `readyForVisualAcceptance` is `true` only when topology, compile diagnostics, and render-smoke have all passed in the same candidate run; a topology-only candidate remains explicitly not ready for visual acceptance.

To persist this gate evidence for CI or release records, add `--repair-acceptance-output`:

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --repair-brief cmos-inverter.repair-brief.json \
  --output repaired-cmos-inverter.tex \
  --repair-acceptance-output repaired-cmos-inverter.repair-acceptance.json
```

`--repair-acceptance-output` requires `--repair-brief`. It writes only the acceptance evidence JSON and does not change repair behavior or replace compile/render-smoke verification.

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

This path uses direct process execution with an argument array (`shell: false`). It does not concatenate a shell command, so Windows, Linux, and macOS avoid shell-specific quoting and resolution differences. `--compile-executable` must be the renderer binary or wrapper path only; pass every flag through repeated `--compile-arg` values. Empty executables fail with `compile-executable-invalid`, missing binaries fail with `compile-executable-not-found`, and shell-command-shaped executables such as `pdflatex -halt-on-error` receive advice to split arguments instead of relying on platform-specific shell parsing. Supported placeholders are:

| Placeholder | Value |
|---|---|
| `{tex}` | absolute path to the generated `.tex` file |
| `{outputDir}` | absolute output directory for the generated artifact |
| `{jobName}` | generated `.tex` basename without extension |

When `--expected-artifact` is provided, the runner also performs render-smoke artifact checks. For opaque artifacts such as PDF, it verifies that the expected file exists and is non-empty. For `.svg` artifacts, it additionally checks for an `<svg>` root, positive dimensions or `viewBox`, at least one visible drawing element, any repeated `--expected-svg-text` tokens, obvious elements outside the `viewBox`, and obvious overlapping `<text>` labels. Expected text is searched in visible text plus decoded SVG accessibility metadata such as `aria-label`, `<title>`, and `<desc>`, so renderers that preserve semantic labels outside visible `<text>` can still satisfy text-token smoke without requiring OCR. SVG elements hidden through attribute or inline-style `display:none`, `visibility:hidden`, `visibility:collapse`, or overall `opacity:0` do not count as visible output. The SVG geometry pass is transform-aware geometry for common group and element `transform` attributes, so translated, scaled, rotated, skewed, and matrix-transformed boxes are checked after transform composition. If expected text is not searchable and the SVG uses reusable path glyphs, the report records `pathOnlyGlyphUseCount` and emits `render-svg-text-path-only` so automation can route the artifact to the later screenshot/OCR gate:

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

For `.png` screenshot artifacts, the smoke check decodes non-interlaced 1/2/4/8-bit indexed-color PNG output, 1/2/4/8/16-bit grayscale PNG output, and 8/16-bit RGB, grayscale-alpha, or RGBA PNG output. Indexed-color and sub-byte grayscale images support packed samples; indexed-color images also support PLTE palette entries and optional tRNS alpha; grayscale/RGB images support tRNS transparent samples. 16-bit direct samples are normalized into the same 8-bit RGBA comparison space used by the smoke checks. It verifies positive dimensions, records the foreground pixel bounding box as `foregroundBounds`, records foreground density inside that box as `foregroundDensity`, and requires at least one pixel that differs from the top-left background color. Blank screenshots fail with `render-png-blank`; foreground content that touches the image boundary fails with `render-png-content-clipped`; foreground pixels that are unusually dense inside a non-trivial bounding box fail with `render-png-foreground-dense`; malformed PNGs fail with `render-png-invalid`; unsupported PNGs fail with `render-png-unsupported` and format-specific guidance for Adam7 interlaced PNGs and unsupported indexed-color bit depths.

The result is recorded as `compileExecution.renderSmoke`. Missing or empty artifacts add `render-artifact-missing` or `render-artifact-empty`; SVG structure failures add diagnostics such as `render-svg-invalid`, `render-svg-dimension-missing`, `render-svg-no-visible-elements`, `render-svg-text-missing`, `render-svg-text-path-only`, `render-svg-out-of-bounds`, `render-svg-text-overlap`, `render-svg-label-overlap`, or `render-svg-path-glyph-overlap`; PNG screenshot failures add diagnostics such as `render-png-blank`, `render-png-content-clipped`, or `render-png-foreground-dense`.

The SVG bounded-canvas, path-only label classification, path-only glyph placement, text-overlap, and label-vs-drawing overlap checks are intentionally conservative. They parse common SVG coordinates in `path`, `line`, `polyline`, `polygon`, `rect`, `circle`, `ellipse`, positioned `text`, positioned `tspan`, and `<use href="#...">` elements, then compose common group and element transforms before checking boxes. Hidden groups and elements are skipped consistently during visible-element counting and box collection. Expected text can also be proven by decoded accessibility metadata (`aria-label`, `<title>`, and `<desc>`), but that only proves label identity metadata exists; it does not prove a path-only visual label is readable. The path parser covers line-style commands, close-path current-point resets for `Z/z`, A/a arc extrema, and exact Bezier curve bounds for C/S/Q/T curve extrema so curved circuit symbols can still contribute arc interior geometry to bounded-canvas checks and relative commands after closed subpaths do not produce false out-of-bounds boxes. The geometry pass is also stroke-width-aware for presentation attributes and inline `style` declarations, so thick wires or component outlines can fail `render-svg-out-of-bounds` when their visible stroke is clipped and can participate in `render-svg-label-overlap` when that stroke covers a label. Definition-only glyph paths inside `<defs>` are not counted as visible drawing elements; referenced glyph uses are resolved for bounded-canvas checks so path-only labels can still fail with `render-svg-out-of-bounds` when their placed geometry escapes the `viewBox`. Path-only glyph definitions also apply their own definition-local `transform` before `<use>` placement, which keeps scaled or mirrored dvisvgm-style glyph geometry from being under-counted during bounded-canvas and overlap checks. Multiple positioned `tspan` labels emitted under one `<text>` parent are treated as separate label boxes so LaTeX-style SVG output can still trigger `render-svg-text-overlap`. Label-vs-drawing overlap uses a small stroke tolerance around drawing boxes so thin wires and polygonal component outlines can still be treated as potential label-legibility failures. Path-only glyph labels resolved from `<use href="#...">` are compared against drawing boxes as a separate legibility gate and fail with `render-svg-path-glyph-overlap` when reusable glyph geometry overlaps wires or components. Path-only label classification detects reusable glyph paths, not the text value encoded by those glyph shapes. These checks catch obvious fixture failures before screenshot review, but they do not replace OCR, precise pixel-level overlap detection, full SVG path coverage, or final image-based visual inspection.

Path-only glyph definitions can now be direct paths or grouped/symbol containers inside `<defs>`. The smoke pass resolves child path geometry from `<g id="...">` and `<symbol id="...">` before `<use>` placement, so renderers that wrap reusable glyph paths still feed `pathOnlyGlyphUseCount`, bounded-canvas diagnostics, and `render-svg-path-glyph-overlap`.

Positioned SVG `text` and `tspan` boxes now respect `text-anchor` values `start`, `middle`, and `end` from attributes or inline style. This keeps centered and right-aligned LaTeX/dvisvgm labels in text/text and label-vs-drawing overlap checks. It is still a structural smoke approximation, not browser-grade text layout or pixel-perfect typography.

The runner lives in `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts`. It reads the generated `{jobName}.log` from `{outputDir}`, reuses the same diagnostics parser, and returns `compileExecution` plus `compileDiagnostics` in the CLI JSON result. Artifact checks live in `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` so SVG structure rules remain testable without spawning a renderer. A non-ok diagnostic report still makes the CLI exit nonzero.

If `--repair-brief-output` is provided, it must be paired with `--topology-reference` and either `--compile-log` or `--compile-executable`. The brief is written after diagnostics are available, and it reuses the same topology signature check before writing any repair handoff. If `--repair-brief` is provided, the candidate spec is compared with the topology signature embedded in the brief before any output is written.

The embedded `repairPrompt` is deliberately schema-level guidance, not an LLM call. Its instructions require a revised `CircuitSpec` JSON object instead of free-form TikZ, preserve `topologySignature` exactly, limit edits to presentation fields inside the same golden template, and address each `diagnosticFocus` item with the smallest local change. The acceptance criteria explicitly point automation back to `assertCircuitikzRepairCandidateMatchesBrief`, a single topology guard for the run (`--repair-brief` or `--topology-reference`), compile diagnostics, and render-smoke diagnostics before any repaired artifact can be accepted.

The SVG geometry parser now follows SVG number grammar for supported elements, including leading-dot decimals and explicit plus signs, so dvisvgm output such as `.5`, `-.5`, or `+.5` is not misread as integer coordinates or skipped during bounded-canvas checks.

## Maintainer Smoke Fixtures

The repository now includes maintainer fixtures for every supported golden family:

| Fixture | Circuit family |
|---|---|
| `docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json` | `common-source-amplifier` |
| `docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json` | `cmos-inverter` |
| `docs/maintainer/fixtures/circuitikz/cmos-buffer-v1.json` | `cmos-buffer` |
| `docs/maintainer/fixtures/circuitikz/cmos-nand2-v1.json` | `cmos-nand2` |
| `docs/maintainer/fixtures/circuitikz/cmos-nor2-v1.json` | `cmos-nor2` |

Run every fixture through the same explicit renderer configuration with:

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

If the maintainer machine does not have a renderer configured yet, the same runner can still produce release-audit evidence without guessing a platform shell or silently skipping the fixtures:

```bash
npm run diagram:smoke-circuitikz -- \
  --output-dir docs/export/circuitikz-smoke \
  --report-output docs/export/circuitikz-smoke/renderer-availability.json
```

In that mode the runner writes the deterministic `.tex` artifacts for every fixture, returns `ok: false`, and records `rendererAvailability.status` as `missing-configuration` with a `compile-executable-invalid` diagnostic. This proves the fixture specs still export and makes the missing renderer an explicit environment gate; it is not a compile, render-smoke, or visual-acceptance pass.

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
| `cmos-buffer` | `cmos-buffer-v1` | Two-stage CMOS buffer with first-stage inverted node `vmid`, second-stage restored output, `vin`, and `vout` |
| `cmos-nand2` | `cmos-nand2-v1` | Two-input CMOS NAND with parallel PMOS pull-up devices, series NMOS pull-down devices, `va`, `vb`, and `vout` |
| `cmos-nor2` | `cmos-nor2-v1` | Two-input CMOS NOR with series PMOS pull-up devices, parallel NMOS pull-down devices, `va`, `vb`, and `vout` |

The adapter validates the structural invariant first, then emits a fixed layout. For example, the CMOS inverter requires:

- `MP` as `pmos` and `MN` as `nmos`;
- `VDD -> MP.S`;
- `MN.S -> GND`;
- `vin -> MP.G` and `vin -> MN.G`;
- `MP.D` and `MN.D` on the shared output drain path;
- both transistor drains connected to `vout`.

The CMOS buffer template composes two locked inverter stages. The first stage requires `MP1` / `MN1` to share the `vmid` drain path and `vin` to drive both first-stage gates. The second stage requires `vmid` to drive both `MP2.G` and `MN2.G`, `MP2` / `MN2` to share the output drain path, and both second-stage drains to connect to `vout`. `layoutHints.inputSide` and `layoutHints.outputSide` remain presentation-only and do not change the topology signature.

The CMOS NAND template adds a stronger digital-logic invariant: `MPA` and `MPB` must be PMOS devices in the parallel pull-up network from `VDD` to `vout`; `MNA` and `MNB` must be NMOS devices in a series pull-down stack from `vout` to `GND`; `va` must drive `MPA.G` and `MNA.G`; and `vb` must drive `MPB.G` and `MNB.G`. `layoutHints.inputSide` and `layoutHints.outputSide` only move the input/output ports and presentation routing; they do not change the topology signature.

The CMOS NOR template mirrors the digital-logic constraint in the opposite networks: `MPA` and `MPB` must be PMOS devices in a series pull-up stack from `VDD` to `vout`; `MNA` and `MNB` must be NMOS devices in the parallel pull-down network from `vout` to `GND`; `va` must drive `MPA.G` and `MNA.G`; and `vb` must drive `MPB.G` and `MNB.G`. The same layout-hint projection rule applies: port placement can move, but the topology signature cannot.

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

For the current golden templates, `layoutHints.inputSide` and `layoutHints.outputSide` are projected into deterministic input/output port placement. A topology-preserving repair can move input or output ports to the other side through layout hints while keeping the same `topologySignature`; the exporter rewrites only the presentation route and node anchor. This is not a general autorouter. It is a constrained layout projection for the supported golden families.

## Verification

Canonical regression commands:

```bash
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzCompileDiagnostics.test.ts src/tests/circuitikzRenderSmoke.test.ts src/tests/circuitikzCompileRunner.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

The tests verify:

- deterministic common-source LaTeX;
- constrained CMOS inverter, buffer, NAND, and NOR output;
- deterministic `layoutHints.inputSide` and `layoutHints.outputSide` projection for supported templates;
- topology rejection before export;
- CLI exposure through `package.json`;
- UTF-8 BOM input handling;
- topology-preserving repair checks through `--topology-reference`, `createCircuitTopologySignature`, and `assertCircuitTopologyUnchanged`;
- compile-log diagnostics for missing packages, unknown keys, undefined control sequences, and overfull layout warnings;
- diagnostics JSON output and nonzero CLI exit when a compile log contains errors;
- shell-free compile execution with placeholder-expanded argument arrays;
- render-smoke artifact existence and non-empty checks through `--expected-artifact`;
- topology-preserving repair brief output through `--repair-brief-output` and schema `notemd.circuitikz.repair-brief.v1`;
- `repairPrompt`, `diagnosticFocus`, `acceptanceCriteria`, and `topology-preserving-circuitikz-repair` handoff content inside repair briefs;
- `repairAcceptance`, `notemd.circuitikz.repair-acceptance.v1`, `readyForVisualAcceptance`, and `remainingChecks` evidence when validating repair candidates through `--repair-brief`;
- persisted repair acceptance evidence through `--repair-acceptance-output`;
- repair candidate validation against an existing brief through `--repair-brief`;
- SVG artifact structure checks and optional text-token checks through repeated `--expected-svg-text`;
- decoded SVG accessibility metadata checks through `aria-label`, `<title>`, and `<desc>`;
- hidden and transparent SVG element exclusion for visible-output smoke;
- path-only SVG label classification through `pathOnlyGlyphUseCount` and `render-svg-text-path-only`;
- grouped/symbol path-only glyph definition resolution for `<use href="#...">` placement, bounded-canvas checks, and `render-svg-path-glyph-overlap`;
- SVG close-path current-point handling for bounded relative commands after `Z/z`;
- bounded SVG viewBox, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, stroke-width-aware SVG bounds and label overlap checks, obvious text-overlap, positioned `tspan` label overlap, path-only glyph label overlap, and label-vs-drawing overlap checks, including transform-aware geometry for common SVG transforms;
- PNG screenshot smoke checks for positive dimensions, non-background pixels, foreground bounds, foreground density, edge-touching clipped content, and unusually dense foreground blocks;
- maintainer fixture discovery, aggregate smoke execution, and explicit missing-renderer availability reports through `src/tests/circuitikzSmokeFixturesCli.test.ts`;
- no output file is written for invalid topology.

## Non-Goals

This prototype does not bundle LaTeX, call TikZJax as an Obsidian runtime dependency, OCR path-only glyph text, run precise pixel-level overlap detection, cover unsupported SVG path geometry, or use rendered-image feedback for automatic repair. Those are later gates. It also does not accept arbitrary natural-language circuit requests. The important current claim is narrower: validated `CircuitSpec` input can produce stable, readable circuitikz for five golden families, existing compile logs can be converted into actionable diagnostics, and an explicitly configured local renderer can be executed without shell-specific command parsing while optionally proving that a concrete output artifact was created and, for SVG or PNG output, structurally renderable enough for later visual inspection. SVG output now includes transform-aware geometry for common SVG transforms, exact arc bounds for A/a arc extrema, exact Bezier curve bounds for C/S/Q/T curve extrema, positioned `tspan` label geometry, path-only label classification, path-only glyph overlap detection, and conservative label-vs-drawing overlap detection; PNG output exposes foreground bounds, foreground density, and format-specific unsupported-export guidance needed to reject obvious canvas clipping, first-pass pixel crowding, Adam7 interlaced PNGs, and unsupported indexed-color bit depths before a topology-preserving repair loop.
