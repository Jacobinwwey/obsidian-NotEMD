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
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

The tests verify:

- deterministic common-source LaTeX;
- constrained CMOS inverter output;
- topology rejection before export;
- CLI exposure through `package.json`;
- UTF-8 BOM input handling;
- no output file is written for invalid topology.

## Non-Goals

This prototype does not compile LaTeX, call TikZJax, run screenshot inspection, or use rendered-image feedback. Those are later gates. It also does not accept arbitrary natural-language circuit requests. The important current claim is narrower: validated `CircuitSpec` input can produce stable, readable circuitikz for two high-value golden families.
