---
date: 2026-07-10
topic: circuitikz-ui-export-and-docs-sync
---

# circuitikz UI, Export, And Docs Sync Plan

Language: **English** | [简体中文](./circuitikz-ui-export-and-docs-sync-2026-07-10.zh-CN.md)

This note records the current-main comparison for circuitikz support, the front-end visibility fix, the export boundary, and the website MDX synchronization decision.

## Current Code Evidence

The circuitikz work is already present in the codebase. The missing product behavior was discoverability, not the renderer itself.

| Requirement | Current evidence |
|---|---|
| Front-end circuit option | `Preferred diagram type` includes `Circuit (Circuitikz)` and `Preferred render target` includes `Circuitikz + SVG preview`. These settings are now visible without Developer mode. |
| Constrained generation | `DiagramSpec(intent: "circuit", circuitSpec)` is validated before `CircuitikzRenderer` writes output. Raw free-form TikZ remains out of scope. |
| Source artifact | Circuitikz output is saved as deterministic `.tex`. |
| Preview artifact | The renderer attaches an SVG companion derived from the validated `CircuitSpec`. |
| Multi-format export | Preview/export surfaces can export the companion as SVG, PNG, and PDF; the CLI can also write circuitikz plus SVG/PNG/PDF review evidence from one `DiagramSpec`. |
| Maintainer smoke | `npm run diagram:export-circuitikz` and `npm run diagram:smoke-circuitikz` provide the optional LaTeX/TikZJax evidence boundary without making either runtime mandatory in the plugin. |

## UI Decision

Circuit diagrams are a user-facing diagram mode, so hiding the diagram type and render target behind Developer mode made the implementation look absent. The settings page should expose the diagram pipeline controls to normal users:

- `Enable spec-first Mermaid pipeline`
- `Experimental compatibility mode`
- `Preferred diagram type`
- `Preferred render target`
- `Diagram image export PPI`

Developer mode still owns diagnostics, relaxed input gates, and advanced file-selection controls. The circuitikz labels remain deliberately precise: the product exposes `Circuitikz + SVG preview`, not a promise of in-plugin LaTeX compilation.

## Website And MDX Sync Decision

The many localized `website/i18n/**/features/diagrams.mdx` files should not be treated as pollution by default. The website's publishing policy requires every public documentation locale to mirror every English docs route before deployment.

The review rule is stricter:

- Commit localized MDX only after the English source page is stable.
- Keep `website/docs/features/diagrams.mdx` as the main authored source.
- Use `website/scripts/generate-localized-docs.cjs` for broad regeneration and focused scripts such as `website/scripts/sync-diagrams-locale-delta.cjs` only for reviewed deltas.
- For LM Studio-assisted translation deltas, keep batches bounded to 12 locales or fewer and keep the estimated batch context below the configured 32k model window. Finish and validate one batch before injecting the next batch.
- Do not commit debug-output folders, partial locale files, or temporary model responses.

This means localized MDX is a published artifact, not a build cache. It belongs in the repository when it is reviewed and passes the website contract tests.

## Next Direction

The remaining circuitikz work should focus on visual confidence rather than adding arbitrary syntax breadth:

- Keep `CircuitSpec` constrained to the validated golden families.
- Add OCR-level or screenshot-level checks only after the structural SVG/PNG smoke checks stop producing obvious false positives.
- Keep LaTeX/TikZJax optional and explicit.
- Treat automatic topology-preserving repair as a later phase gated by compile diagnostics, render smoke, and topology signature preservation.
- Keep the docs site aligned with the exact UI wording so users can find `Circuit (Circuitikz)` and understand the SVG/PNG/PDF export boundary.
