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

When `--expected-artifact` is provided, the runner also performs render-smoke artifact checks. For opaque artifacts such as PDF, it verifies that the expected file exists and is non-empty. For `.svg` artifacts, it additionally checks for an `<svg>` root, positive dimensions or `viewBox`, at least one visible drawing element, and any repeated `--expected-svg-text` tokens:

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

The result is recorded as `compileExecution.renderSmoke`. Missing or empty artifacts add `render-artifact-missing` or `render-artifact-empty`; SVG structure failures add diagnostics such as `render-svg-invalid`, `render-svg-dimension-missing`, `render-svg-no-visible-elements`, or `render-svg-text-missing`.

The runner lives in `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts`. It reads the generated `{jobName}.log` from `{outputDir}`, reuses the same diagnostics parser, and returns `compileExecution` plus `compileDiagnostics` in the CLI JSON result. Artifact checks live in `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` so SVG structure rules remain testable without spawning a renderer. A non-ok diagnostic report still makes the CLI exit nonzero.

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
- compile-log diagnostics for missing packages, unknown keys, undefined control sequences, and overfull layout warnings;
- diagnostics JSON output and nonzero CLI exit when a compile log contains errors;
- shell-free compile execution with placeholder-expanded argument arrays;
- render-smoke artifact existence and non-empty checks through `--expected-artifact`;
- SVG artifact structure checks and optional text-token checks through repeated `--expected-svg-text`;
- no output file is written for invalid topology.

## Non-Goals

This prototype does not bundle LaTeX, call TikZJax as an Obsidian runtime dependency, run screenshot inspection, or use rendered-image feedback. Those are later gates. It also does not accept arbitrary natural-language circuit requests. The important current claim is narrower: validated `CircuitSpec` input can produce stable, readable circuitikz for two high-value golden families, existing compile logs can be converted into actionable diagnostics, and an explicitly configured local renderer can be executed without shell-specific command parsing while optionally proving that a concrete output artifact was created and, for SVG output, structurally renderable enough for later screenshot inspection.
