# Diagram output preferences and resilient multi-format delivery

[中文](2026-10-02-diagram-output-implementation.zh-CN.md)

Status: P0–P4 implemented; local acceptance complete. Remote acceptance is the matching commit's Linux/Windows Verify plugin run. This plan supersedes the October 1 design's manual conflict-recovery behavior; the latest user decisions require graceful degradation and supported choices first.

## Contract

- Presentation export and diagram generation keep separate settings, capability catalogs, environment checks and execution paths. A shared extension is not evidence of shared capabilities.
- Chart type remains single-select; diagram outputs become multi-select. Native sources, diagram HTML/SVG/PNG/PDF and structured-summary HTML have distinct delivery identifiers.
- Display directly compatible choices first, then choices requiring automatic adjustment, then unsupported choices. Never hide incompatible entries. Only genuinely unsupported entries are disabled; checked entries remain removable.
- The latest explicit selection wins. Selecting a type preserves requested outputs but makes incompatible ones inactive. Selecting an output can select a compatible type. There is no required reset/exit step.
- Persist requested outputs; snapshot the effective plan before generation. Report inactive outputs and fallback explicitly. If none of the requested outputs can execute, use the effective compatible renderer's default source output, preserving existing renderer affinity when coverage ties. Never claim an unavailable source format was delivered as an image.
- One canonical specification feeds the chosen native renderer and its derivatives. A compatible structured-summary renderer can consume the same specification. Multiple native requests may be retained, but only one native target is active per run; latest compatible native selection wins.
- Reuse intermediates within a run; keep success files after partial failure/cancellation; retry failed formats without another LLM call. Native-source and derived-output paths must be distinguished.
- Keep existing Unicode streaming protection and offline SVG/font handling intact. Preserve original notes and unrelated user settings in live verification.

## Phases and evidence

| Phase | Implementation boundary | Required evidence | State |
| --- | --- | --- | --- |
| P0 | Output catalog, pure plan resolution, versioned preference migration and atomic selection transitions | Catalog-wide compatibility/degradation tests, legacy renderer affinity, unknown schemas/fields, latest-operation precedence, presentation isolation | Complete |
| P1 | Shared settings/sidebar selector with localized state reasons, stable supported-first ordering and focus preservation | Chromium keyboard/focus/serial-save tests, both surface wiring tests, live settings/reload verification | Complete |
| P2 | Generation snapshot and multi-format executor; native/HTML/SVG/PNG/PDF; structured-summary route | Shared rendering, real file signatures, partial failure/cancellation, companion recovery and collision safety | Complete |
| P3 | Preview/history/CLI parity and recoverable output status | Live history reopening, provider-call sentinel at zero, unchanged output hashes, history-write-failure regression | Complete |
| P4 | Real 1Knowledge CLI verification, bilingual docs, full suite/build/lint/audits and integration | 294 suites passed, 2818 tests passed / 1 skipped; build, audits, lint ratchet and diff checks passed; original settings restored byte-for-byte | Local acceptance complete; remote gate is commit CI |

## Ownership and rollout

Existing type/target catalogs own capabilities. A diagram-specific preference planner owns effective plans and compatibility projections; settings and sidebar do not duplicate compatibility rules. Generation owns its immutable request. An export operation owns intermediate reuse, verified writes and per-format outcomes. Existing presentation modules are not imported into this planner or executor.

Validate persisted input once, retain safe unknown identifiers as inactive preferences, migrate without an eager disk write, and retain old target affinity for compatibility. Old single-format calls retain their behavior when no multi-output request exists. Do not claim downgrade safety merely because old fields remain; test the current serializer and preserve unknown setting fields.

Unknown preference versions and extension fields survive ordinary add/remove operations. Their saved requests remain isolated from execution; use the supported default route and show the version warning. This avoids silently interpreting a future schema as v1. It is a bounded compatibility behavior, not a universal backward-compatibility guarantee.

Trade-offs: one native target per run limits conversion ambiguity and retains editable semantics; it does not promise simultaneous native conversions. A persisted specification/cache costs disk space but enables deterministic retry without provider access. Obsidian `DataAdapter.process()` serializes existing-manifest updates with compare-before-write; new outputs use verified staging and rename. This protects the live host contract without claiming filesystem-wide transactional or power-loss guarantees.

Implement and validate in the above sequence, then enable the cohesive path together. Do not expose a multi-select UI that silently saves only one format. No new public release/tag is part of this work. Existing authorization covers integration into remote main after verification.

## Completion audit

Completion requires evidence for every phase, not only a green unit suite. Record exact commands, current commit, real-host behavior, remaining limitations and actual delivered formats in bilingual walkthrough documentation. Development remains active until the user-facing selection, execution, recovery and isolation contracts all hold.

See [implementation and validation walkthrough](../walkthroughs/2026-10-02-diagram-output.en.md).
