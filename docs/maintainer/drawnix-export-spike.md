# Drawnix Export Spike

Language: **English** | [简体中文](./drawnix-export-spike.zh-CN.md)

This spike records the narrow Drawnix export path that Notemd can support without embedding Drawnix, Plait, or the Drawnix React host.

The reference baseline is `ref/drawnix` on `develop@9939f45`. The relevant file contract is `packages/drawnix/src/data/types.ts`: `DrawnixExportedData` has the top-level shape `type/version/source/elements/viewport/theme`. The corresponding `isValidDrawnixData(...)` check in `packages/drawnix/src/data/json.ts` validates only `type === "drawnix"`, `Array.isArray(elements)`, and object-like `viewport`.

## Implemented Subset

Notemd exports a minimal `.drawnix` JSON subset from `SemanticFigureModel`:

- top-level `DrawnixExportedData` fields: `type/version/source/elements/viewport/theme`
- `type: "drawnix"`
- `version: 1`
- `source: "web"`
- `viewport: { zoom: 1, offsetX: 0, offsetY: 0 }`
- `theme: "default"`
- node elements as `geometry` rectangles
- edge elements as `arrow-line`
- text payloads as Slate-like `{ children: [{ text }] }`
- stable pretty JSON serialization for `.drawnix` files

The exporter intentionally has **no Plait dependency** and no Drawnix runtime dependency. This keeps the plugin bundle isolated and prevents a spike from silently becoming a large runtime integration.

## Automated Evidence

Automated tests cover the part that can be proven without a Drawnix host:

```bash
npm test -- --runInBand src/tests/drawnixExporter.test.ts src/tests/drawnixExportDocsContract.test.ts --runTestsByPath
```

These tests verify:

- top-level `DrawnixExportedData` shape
- supported `geometry` and `arrow-line` element subset
- stable `.drawnix` JSON serialization
- rejection of unsupported subset drift
- source-level absence of `@drawnix/*`, `@plait/*`, and `@plait-board/*` imports

## Manual open/import Boundary

The Drawnix app loads board state through `localforage` in the web app and file import through `loadFromBlob(...)`. A real manual open/import check still requires running Drawnix itself:

1. Generate `.drawnix` JSON with `stringifyDrawnixExportedData(...)`.
2. Save it as a local `.drawnix` file outside tracked source paths.
3. Open Drawnix or the Drawnix web app from `ref/drawnix`.
4. Import/open the file.
5. Confirm geometry rectangles, arrow-line edges, and visible labels appear.
6. Record the file path, Drawnix commit, Notemd commit, and result.

Do not treat the Jest JSON test as proof of full Drawnix UI import. It proves validity against the checked reference top-level contract and the Notemd-supported subset only.

## Dependency Decision

Current decision: keep Drawnix as an export target spike only. Do not add Plait or Drawnix packages to Notemd's runtime bundle.

Revisit this only if all of the following become true:

- users need editable board round-tripping, not only `.drawnix` handoff
- bundle isolation for heavy render runtimes is no longer candidate-only
- release assets, audit logic, and docs move together
- the Drawnix supported subset expands beyond simple `geometry` and `arrow-line` elements

Until then, a small deterministic exporter is the better engineering boundary.
