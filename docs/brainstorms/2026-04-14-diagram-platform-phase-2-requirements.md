---
date: 2026-04-14
topic: diagram-platform-phase-2
---

# Diagram Platform Phase 2 Alignment

## Problem Frame

Notemd's diagram-platform roadmap is no longer hypothetical. The repository already contains a substantial spec-first pipeline, multi-target renderers, preview/export helpers, and locale/theme integration. The problem is different now: implementation reality has moved ahead of the roadmap's tracked status, while some architectural promises in the original plan are only partially true in code.

That drift creates two concrete risks:

- future work can waste time rebuilding capabilities that already landed
- future releases can over-claim maturity around runtime isolation, command unification, or renderer stabilization

The next phase should therefore optimize for productization and boundary hardening, not renderer-count growth.

Recent stabilization work already moved part of the remaining Mermaid legacy surface in that direction: render-host bundle audit is now release-gated, command orchestration is partially unified in `src/main.ts`, and shared note-directive parsing / note attachment helpers have started to move out of `src/mermaidProcessor.ts` into `src/diagram/adapters/mermaid/legacyFixerUtils.ts`. The open problem is no longer whether decomposition should start, but how aggressively to finish the remaining sunset boundary without breaking legacy repair coverage.

## Requirements

**Truth-Source Alignment**

- R1. The repository must contain a durable document that states which diagram-platform capabilities are shipped, experimental, partially complete, and intentionally deferred.
- R2. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.md` must be updated section by section so each task reflects current implementation status, evidence, and remaining gaps.
- R3. User-facing and maintainer-facing documentation must not claim renderer isolation, packaging guarantees, or command consolidation beyond what the current code actually delivers.

**Productization Direction**

- R4. The spec-first pipeline must continue preserving current Mermaid behavior by keeping a Mermaid-compatible path available until best-fit routing clears explicit acceptance gates.
- R5. The next implementation batch must prioritize graduating already-landed diagram capabilities from developer-only or experimental surfaces into a stable user path before adding new renderer families.
- R6. Mermaid, JSON Canvas, Vega-Lite, and HTML fallback outputs must keep a documented preview/export contract that states exactly which targets support inline preview, SVG export, PNG export, and raw-source save.
- R7. Diagram preview and export behavior must stay aligned with the plugin's UI locale and resolved Obsidian theme across the shipped locale catalog.

**Architecture Control**

- R8. Follow-on renderer work must reuse `DiagramSpec`, `RendererService`, and target-aware save/export flows instead of adding new diagram logic directly into `src/main.ts`.
- R9. Build/runtime isolation must be treated as a separate hardening milestone; heavier preview runtimes should not be described as isolated until packaging and execution boundaries are actually implemented and verified.
- R10. Advanced engines such as PlantUML, Graphviz, and Draw.io remain deferred until the current platform exits experimental gating and the host/runtime boundary is hardened.

## Success Criteria

- The roadmap and requirements documents reflect current code without obvious false claims.
- A maintainer can decide the next implementation batch from documentation alone without re-reading the full diagram codebase.
- The next batch is explicitly framed around stabilization, command architecture, and runtime boundaries rather than feature sprawl.
- No blocking product questions remain before phase-2 planning or direct execution.

## Scope Boundaries

- This brainstorm pass does not add new renderer implementations.
- This brainstorm pass does not retire the legacy Mermaid fixer path.
- This brainstorm pass does not claim that iframe-host support already isolates heavy runtimes from the main plugin bundle.
- This brainstorm pass does not create a new release or tag by itself.

## Key Decisions

- Update, not replace, the existing roadmap. It is already the implementation anchor and should become the canonical status document.
- Add a dedicated phase-2 requirements document. The roadmap describes execution slices; this document defines what the next phase must optimize for.
- Treat the diagram platform as substantially implemented but not fully productized. Core modules exist, but experimental gating, runtime isolation, and legacy-path reduction remain open.
- Prefer boundary hardening over new renderer expansion. The highest-leverage next move is to stabilize the current platform, not broaden the target list.

## Dependencies / Assumptions

- `README.md` and `docs/releases/1.8.2.md` already document the current experimental diagram feature set and should remain aligned with code.
- `ref/**` remains local reference material only and is outside shipped scope.
- Full repository verification for release-quality changes now uses `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, `npm run audit:render-host`, and `git diff --check`.

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] What exact acceptance gates move best-fit diagram generation from developer-only or experimental status into stable opt-in or default-on behavior?
- [Affects R8][Technical] Which remaining diagram orchestration paths should move out of `src/main.ts` first so the platform stops growing through the plugin entrypoint?
- [Affects R9][Needs research] Should heavier preview runtimes live in inline `srcdoc`, a dedicated bundled frame asset, or a hybrid loader once release asset packaging is formalized?

## Next Steps

-> Proceed directly to work on the phase-2 stabilization batch, or use `/ce:plan` if a more formal execution breakdown is needed first.
