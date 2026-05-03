---
date: 2026-05-03
topic: mainline-stabilization-and-ci-hardening
---

# Mainline Stabilization and CI Hardening

## Problem Frame

Notemd's diagram platform is no longer blocked by missing core architecture. The bigger risks have shifted:

- repository progress docs can drift away from actual code and workflow truth
- maintainers can misread GitHub's commit-status endpoint as a failing `main` CI signal even when `main` has no ordinary workflow
- the release path can stay "green today, broken tomorrow" if GitHub-maintained workflow actions are left on deprecated majors
- Drawnix can be misframed as a near-term host integration target when it is better understood as a data-boundary and conversion-boundary reference

The next durable artifact should therefore not be another broad roadmap rewrite. It should be a concrete requirements document that locks down what needs to stay true on `main`, what the next implementation batch should optimize for, and what Drawnix should and should not influence.

## Requirements

**Truth-Source Control**
- R1. Progress and roadmap documents must be updated section by section so they describe the current codebase, remote workflow behavior, and remaining gaps without overstating maturity.
- R2. Maintainer-facing docs must distinguish ordinary `main` truth from release-tag workflow truth. If GitHub's commit-status endpoint shows `pending` with zero statuses on `main`, the docs must direct maintainers to GitHub Actions runs plus `check-suites` / `check-runs` as the real source of truth.
- R3. The release workflow must stay on currently supported major versions of GitHub-maintained JavaScript actions so deprecation warnings do not silently age into release failures.

**Next-Batch Priorities**
- R4. The next implementation batch must prioritize command-surface consolidation before any new renderer family or host-level integration work.
- R5. The next implementation batch must define a sustainable maintainer-local semantic verification runbook or harness that does not rely on tracked secrets, hard-coded vault paths, or accidentally committed live tests.
- R6. Runtime packaging isolation remains an explicit milestone: heavier preview runtimes must not be described as isolated until they ship through a verified multi-entry or dedicated-asset strategy.

**External Reference Boundary**
- R7. Drawnix must remain a local reference project under `ref/`, not a shipped dependency or embedded host in Notemd.
- R8. Any future Drawnix-related experiment must preserve the spec-first semantic layer. The preferred long-term direction is `DiagramSpec -> DrawnixExportedData` or `DiagramSpec -> PlaitElement[]`, not `DiagramSpec -> Mermaid/Markdown -> Drawnix converter`.

**Repository Hygiene**
- R9. Local analysis/build artifacts such as `ref/**` and `coverage/**` must stay outside shipped scope and outside the committed worktree.

## Success Criteria

- A maintainer can read the updated progress docs and choose the next execution batch without re-auditing the entire codebase.
- The release workflow no longer carries the specific GitHub warning path caused by `actions/checkout@v4` and `actions/setup-node@v4`, and the hardened path is reflected by the successful `1.8.4` release run on 2026-05-03.
- The repository clearly documents that Drawnix is a reference boundary, not a near-term host integration target.
- `main` remains clean and the documented repo-level verification gates still pass.

## Scope Boundaries

- This requirements pass does not add a normal push/PR CI workflow to `main`.
- This requirements pass does not embed the Drawnix host, toolbar system, or browser file-system UX into Notemd.
- This requirements pass does not retire the legacy Mermaid prompt or `mermaidProcessor.ts` fixer path.
- This requirements pass does not create a release or tag by itself.

## Key Decisions

- Treat the apparent `main` CI problem as a truth-source problem first, not as proof of an actual failing branch pipeline.
- Fix the release workflow's future-breakage vector now instead of waiting for GitHub's Node 20 JavaScript-action deprecation schedule to turn a warning into a failure.
- Keep Drawnix at the adapter/data-boundary level; do not let it pull Notemd into a second hosted front-end application boundary.

## Dependencies / Assumptions

- `.github/workflows/release.yml` is the only active GitHub Actions workflow today.
- The successful `1.8.3` repair run (`25215799596`) is the concrete evidence for the older JavaScript-action deprecation warning on this repository.
- The successful `1.8.4` release run (`25274341984`) is the concrete evidence that the hardened `actions/checkout@v6` and `actions/setup-node@v6` path is now green.
- Current upstream releases for `actions/checkout` and `actions/setup-node` provide supported major versions that can replace the older pins without redesigning the release process.

## Outstanding Questions

### Deferred to Planning
- [Affects R4][Technical] Which command ID should become the canonical stable entrypoint once compatibility aliases are preserved?
- [Affects R5][Technical] What is the smallest sustainable maintainer-local semantic verification harness that proves Mermaid, JSON Canvas, and Vega-Lite behavior without tracked secrets?
- [Affects R8][Needs research] If a future board export is added, should Notemd emit `.drawnix` directly or define a more generic Plait adapter boundary first?

## Next Steps

-> Proceed directly to execution for workflow hardening and documentation alignment, then use `/ce:plan` for the next code-moving stabilization batch if a more formal implementation breakdown is needed.
