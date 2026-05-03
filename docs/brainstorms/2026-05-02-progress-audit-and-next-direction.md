---
date: 2026-05-03
topic: progress-audit-next-direction
---

# Progress Audit and Next Direction (v1.8.3+)

## Current State: Code vs Plan Requirements

Reference documents:
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.md`
- `docs/brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.md`
- `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md`
- `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`

## Reality Corrections (2026-05-03)

This audit is not a redesign pass. It is a repo-truth alignment pass. The biggest risks are now documentation drift and overstated gates, not missing platform ideas.

1. **Remote `main` does not currently have a normal push/PR CI pipeline.**
   `.github/workflows/release.yml` runs only for numeric `x.x.x` tag pushes and `workflow_dispatch`. `main@c2d3511` has no failing status. The recent red runs came from the `1.8.3` release flow and were already repaired by the successful follow-up release run on 2026-05-01.

2. **The `pending` commit-status response on `main` is not a real failing check.**
   As of 2026-05-03, `commits/main/status` returns `state: pending` with `statuses: []`, while `check-runs`, `check-suites`, and branch protection are all empty for `main`. In this repository, GitHub Actions runs are the authoritative CI signal, not the commit-status endpoint by itself.

3. **The release workflow had a future failure vector even after the last successful repair run.**
   The latest successful `1.8.3` release run still emitted GitHub's Node 20 JavaScript-action deprecation warning for `actions/checkout@v4` and `actions/setup-node@v4`. This pass upgrades those actions to `v6` so the release path does not drift toward a time-bomb CI failure.

4. **"Live verification for all 8 intents" is not a tracked repo gate today.**
   The live test files such as `src/tests/liveAllDiagramIntents.test.ts` were removed from mainline in `92d3ad3` as accidentally committed live tests. The 2026-05-02 DeepSeek run is historical local evidence, not a stable repo-enforced gate.

5. **Runtime support for 8 intents is not the same thing as UI exposure.**
   `SUPPORTED_DIAGRAM_INTENTS` still includes `mindmap / flowchart / sequence / classDiagram / erDiagram / stateDiagram / canvasMap / dataChart`, but the settings/sidebar selector currently exposes only `auto + flowchart + sequence + classDiagram + erDiagram + stateDiagram + dataChart`. `mindmap` and `canvasMap` remain runtime capabilities, not current first-class UI choices.

6. **Command orchestration is partially unified, not fully unified.**
   Legacy Mermaid save and experimental save still route through shared diagram orchestration, but `previewExperimentalDiagramCommand` now reads a local `vega-lite` fenced block and previews it directly. That matches the current saved artifact shape for `dataChart`, but it is not the final command-surface end state.

## Roadmap Task Status

| Task | Plan Target | Current Reality | Gap |
|---|---|---|---|
| Task 0 | Build/packaging substrate | Delivered with limits. `srcdoc` host is inside `main.js`, and the render-host smoke gate is in place. | Real multi-entry / heavy-runtime isolation has not started. |
| Task 1 | Diagram domain model | Delivered. `DiagramIntent`, `DiagramSpec`, validators, and planner are on the mainline. | None. |
| Task 2 | Spec-first pipeline | Partial. Shared orchestration exists, but public command surface still exposes 3 IDs, preview now has a local `vega-lite` branch, and the legacy Mermaid prompt still exists in `promptUtils.ts`. | Command consolidation + prompt retirement while preserving original Mermaid usability. |
| Task 3 | Mermaid adapter V2 | Partial. All 6 Mermaid subtype adapters landed and `legacyFixerUtils.ts` extracted part of the fixer load. | `mermaidProcessor.ts` still owns too much; each split step requires real Obsidian image verification. |
| Task 4 | Rendering platform | Delivered. Registry, service, cache, preview modal, inline host, and iframe host landed. | None. |
| Task 5 | JSON Canvas | Delivered. `.canvas` artifact, layout, save, and preview path are usable. | None. |
| Task 6 | Vega-Lite | Delivered with limits. `dataChart` uses iframe-host preview and now saves as Markdown fenced `vega-lite`. | Still depends on the single-entry main-bundle bridge. |
| Task 7 | Theme / export / release | Delivered, with current hardening applied. Theme resolution, SVG/PNG/source export, release asset rules, and release workflow action pins are in place. | No major product gap, but ordinary `main` CI is still intentionally absent. |
| Task 8 | Advanced engines | Correctly deferred (R10). | Evaluation gate still not met. |

## notebook-navigator Cross-Reference Completion

| # | Pattern | Status | Notes |
|---|---|---|---|
| 1 | Service layer + DI | Deferred | Architectural refactor, not blocking |
| 2 | LLM response caching | Done | Landed in `src/llmUtils.ts` |
| 3 | Per-setting sync toggle | Done | `localOnly` isolation exists |
| 4 | Batch pipeline with resume | Done | `src/batchProgressStore.ts` landed |
| 5 | Architecture overview doc | Done | `docs/architecture.md` + `.zh-CN.md` |

## Additional Delivered Capability (v1.8.3+)

| Feature | Status | Notes |
|---|---|---|
| Welcome modal (first install) | Done | 22 locales |
| Sponsor support (GitHub Star + ko-fi) | Done | Settings + welcome modal + README |
| Cline-aligned token resolution | Done | Unknown-model default cap now defers to provider |
| Diagram edge normalization | Done | `source/target/sourceId/targetId/start/end -> from/to` |
| Preferred diagram intent selector | Partial | UI exposes a subset, not every runtime intent |
| README i18n alignment contract test | Done | Stable repo-level gate |
| 8-intent live API verification | Historical local evidence only | Not a tracked repo gate today |

## Architecture Advancement

**LLM layer**
- Response caching reduces repeated API cost.
- Unknown-model output token resolution now matches Cline semantics.
- Provider config can stay local instead of forcing all sensitive values into sync.

**Diagram platform**
- The runtime still supports 8 intents.
- The main extension seam is now `DiagramSpec -> adapter -> renderer`, not direct Mermaid text generation.
- `dataChart` is no longer just "save JSON"; it now saves a Markdown fenced `vega-lite` artifact and previews locally.
- `canvasMap` is supported but intentionally not exposed as a current preferred selector option, which is a healthy separation between runtime capability and product surface.

**Infrastructure**
- Progress persistence, architecture docs, release workflow, and README alignment tests are all on mainline.
- The release path now has a specific hardening rule: keep GitHub-maintained workflow actions on supported majors, or release CI will fail for reasons unrelated to plugin code.
- The missing piece is now a secret-free, machine-free live verification harness, not another generic unit-test layer.

## Verification Gates

### Sustainable repo-level gates

These can be reproduced from the repository today and should be treated as the actual mainline gates:

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

For remote truth:

- normal `main` pushes currently have no automatic GitHub Actions workflow
- release-tag truth comes from `.github/workflows/release.yml`
- `commits/<sha>/status` is not authoritative here when it only returns `pending` plus zero statuses

### Historical local evidence, not current CI

These are useful directional signals, but they should no longer be documented as hard automated repo gates:

- A local DeepSeek verification run covered all 8 intents on 2026-05-02
- The harness was removed from mainline because it depended on a local vault path, live secrets, and nondeterministic network calls

## Drawnix Reference Conclusion

See: `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`

Short version:

1. **Do not embed the full Drawnix host into Notemd.**
   It is an Nx monorepo + React 19 + Plait/Slate + browser-fs-access + browser-storage whiteboard application stack. That is far outside the current Obsidian plugin boundary.

2. **What is useful is the data boundary and conversion boundary.**
   The `.drawnix` export model, the lazy-loaded `markdown-to-drawnix` / `mermaid-to-drawnix` converters, and the app-shell / board / text-renderer layering are all good reference material.

3. **If Notemd ever wants board-style export, the right move is `DiagramSpec -> PlaitElement[]`, not `DiagramSpec -> Mermaid -> mermaid-to-drawnix`.**
   Otherwise the current spec-first semantic layer gets downgraded back into a string round-trip.

## Hard Constraints (Still Active)

1. **MermaidProcessor decomposition**: each sub-task must be verified independently in real Obsidian with saved image checks. Unit tests alone are not enough.
2. **Legacy prompt retirement**: the original Mermaid prompt in `promptUtils.ts` was tuned for the old scenario. Any retirement or merge must preserve that usability.
3. **Backward compatibility**: existing provider configs, transports, and settings must remain intact.

## Next Direction

### Immediate

1. **Command surface consolidation**
   Collapse `summarize-as-mermaid`, `generate-experimental-diagram`, and `preview-experimental-diagram` into one coherent command surface. Old IDs can survive only as aliases.

2. **Create a sustainable live verification runbook / harness**
   Convert "one maintainer's local proof" into a repeatable maintainer workflow that does not depend on hard-coded vault paths or private secrets in tracked files.

3. **Runtime packaging (Task 0 remainder)**
   Build a real multi-entry or isolated-asset strategy for heavy runtimes such as Vega-Lite.

4. **Release workflow maintenance**
   Treat GitHub workflow action-major refresh as part of release-path ownership. Do not wait for deprecation warnings to turn into actual failed release jobs.

5. **Keep workspace hygiene**
   `ref/` and `coverage/` are local analysis/build artifacts, not repo deliverables. The mainline expectation is a clean worktree.

### Blocked by hard constraints

6. **Legacy prompt retirement**
   Requires real Obsidian regression verification of the original Mermaid scenario.

7. **MermaidProcessor sunset**
   Must be split incrementally with screenshot/file validation, not just Jest coverage.

8. **Drawnix integration**
   Today it is a reference source and a possible future export target, not a mainline priority.

## Acceptance Criteria: Diagram Platform

Release readiness should satisfy two layers:

### Layer 1: repo-enforced gates

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

### Layer 2: maintainer-local semantic verification

When a change touches `src/diagram/`, `src/mermaidProcessor.ts`, or actual render behavior:

- sample Mermaid / JSON Canvas / Vega-Lite behavior in real Obsidian
- save and inspect output files or images
- explicitly record this as "maintainer-local semantic verification", not as current automated CI

The next missing deliverable is not "add another live test file". It is turning that semantic check into a repeatable maintainer process.
