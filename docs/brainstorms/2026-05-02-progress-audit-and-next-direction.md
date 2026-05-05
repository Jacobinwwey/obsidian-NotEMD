---
date: 2026-05-04
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

## Reality Corrections (2026-05-05)

This audit is not a redesign pass. It is a repo-truth alignment pass. The biggest risks are now documentation drift and overstated gates, not missing platform ideas.

1. **Remote `main` does not currently have a normal push/PR CI pipeline.**
   `.github/workflows/release.yml` runs only for numeric `x.x.x` tag pushes and `workflow_dispatch`. As of 2026-05-04, `main` points to `dd77126` (`fix(diagram): land command surface and verification runbook`) and there is still no ordinary push/PR workflow for that branch. The recent red runs came from the `1.8.3` release flow and were later superseded by the successful `1.8.4` release run (`25274341984`) on 2026-05-03.

2. **The `pending` commit-status response on `main` is not a real failing check.**
   As of 2026-05-04, `commits/main/status` still returns `state: pending` with `statuses: []`, while branch protection is disabled and no ordinary branch-scoped required checks exist. The same pattern still holds on `main@dd77126`: zero statuses and zero check suites on the branch tip do not indicate a real failing branch pipeline. In this repository, GitHub Actions runs plus release-driven checks are the authoritative CI signal when they exist; the commit-status endpoint by itself is not.

3. **The release workflow had a future failure vector even after the last successful repair run.**
   The earlier successful `1.8.3` repair run (`25215799596`) still emitted GitHub's Node 20 JavaScript-action deprecation warning for `actions/checkout@v4` and `actions/setup-node@v4`. The current `.github/workflows/release.yml` now pins `actions/checkout@v6` and `actions/setup-node@v6`, and the newer `1.8.4` release run (`25274341984`) completed successfully on that hardened path.

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

## Roadmap Long-Horizon Cross-Check

Reading `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md` as a long-horizon document, the remaining work now falls into three clearly different buckets:

1. **Platform foundations already delivered**
   `DiagramSpec`, renderer registry/service, Mermaid subtype adapters, JSON Canvas, Vega-Lite preview, theme/export alignment, and release hardening are no longer speculative goals. They are mainline reality and should be treated as finished foundation, not future roadmap work.

2. **Boundary-hardening work still required**
   The roadmap's still-live technical debt is now concentrated in command-surface canonicalization, maintainer-local semantic verification, and true packaging isolation for heavy runtimes. These are the only medium-term items that still materially block "platform maturity" as opposed to "feature existence".

3. **Longer-term optional extensions**
   Service-layer decomposition, richer board-style export, and advanced engines remain valid future directions, but they are now downstream of the stability work above. They should not compete with the current stabilization batch for ownership or attention.

This means the roadmap should no longer be interpreted as "build the platform". It should be interpreted as "finish hardening the platform, then decide whether to extend it".

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

**CLI extensibility**
- The local stable wrapper `obsidian-cli` is still mainly a debug/desktop wrapper, but the underlying official `obsidian` CLI now supports `commands` and `command id=<command-id>` for plugin-registered commands.
- The meaningful CLI-ready seams in Notemd are lower-level pieces such as `src/providerDiagnostics.ts`, `src/diagram/diagramGenerationService.ts`, `src/workflowButtons.ts`, `src/batchProgressStore.ts`, and selected serialization/config semantics like `localOnly`.
- The project is therefore still not ready to treat current plugin command IDs or sidebar actions as a stable engineering CLI surface. First extract host-neutral operations; only then define typed CLI invocation contracts above the command-trigger layer.
- The first concrete delivery is now in place for provider diagnostics: a shared operation-input builder exists, and developer diagnostic commands are registered so the same path can be reached from command palette, hotkey bindings, settings UI, and official CLI command triggering.
- The extraction line is now materially stronger: `src/operations/types.ts`, `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` now centralize operation metadata, command-binding mapping kind, capability discovery, and typed contract export.
- `diagram.generate` is no longer just a future note in the plan; it now participates in the typed invocation contract, while preview remains intentionally outside the non-interactive contract set.
- The first MT2 host-adapter slice is now landed: `src/operations/diagramGenerateOperation.ts` carries the reusable diagram execution path, and `src/operations/providerDiagnosticCommand.ts` carries provider-diagnostic command orchestration below `src/main.ts`.
- The second MT2 host-adapter slice is now landed as well: `src/operations/diagramCommandHostAdapter.ts` owns Mermaid/artifact save completion and direct Vega-Lite preview orchestration below `src/main.ts`.
- The first config/profile slice is now landed too: `src/operations/configProfileCommands.ts` owns provider-profile import/export and CLI capability/contract export orchestration, and the settings tab now reuses the same command path instead of keeping a parallel implementation.
- Provider-diagnostic report persistence is now landed too: `src/operations/providerDiagnosticReportPersistence.ts` owns collision-safe diagnostic report file creation, so `src/main.ts` no longer carries that file-path policy inline.
- Provider-diagnostic host adaptation is now landed too: `src/operations/providerDiagnosticCommandHostAdapter.ts` owns settings loading, report-persistence wiring, and user-surface notice shaping for developer diagnostics, so `src/main.ts` no longer carries that orchestration inline.
- Config/profile host adaptation is now landed too: `src/operations/configProfileCommandHostAdapter.ts` owns import/export state persistence, CLI export notice shaping, and import/export error mapping, so `src/main.ts` no longer carries that CLI-adjacent orchestration inline either.
- Provider connection-test host adaptation is now landed too: `src/operations/providerConnectionTestCommandHostAdapter.ts` now backs both `test-llm-connection` and the settings-tab provider test flow, so neither surface keeps a parallel `testAPI` orchestration path anymore.
- The first note-processing host-adapter slice is now landed too: `src/operations/noteProcessingCommandHostAdapter.ts` now owns the busy guard, reporter lifecycle, and notice/error-log orchestration for `process-current-add-links`, `process-folder-add-links`, `batch-generate-from-titles`, `generate-from-title`, and `research-and-summarize`, so `src/main.ts` no longer carries those inline wrappers.
- The second note-processing host-adapter slice is now landed too: the same file now additionally owns command-host orchestration for `translate-current-file`, `batch-translate-folder`, `extract-concepts-current`, `extract-concepts-folder`, `extract-original-text`, and `extract-concepts-and-generate-titles`, so the translation/extraction wrappers in `src/main.ts` are now thin delegators.
- The composite command path is now corrected as well: `extract-concepts-and-generate-titles` no longer blocks itself on outer `isBusy`, and it no longer ignores the configured concept-note folder during batch generation.
- Note-processing registry onboarding is now landed too: `src/operations/registry.ts`, `src/operations/capabilityManifest.ts`, and `src/cliContracts.ts` now expose `translate.file`, `translate.folder-batch`, `concept.extract-file`, `concept.extract-folder`, `content.extract-original-text`, and `workflow.extract-and-generate` as first-class operation metadata instead of leaving them as loose command descriptions only.
- The long-tail note-processing registry batch is now landed too: the same registry/manifest/contract path now also exposes `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, and `research.summarize-topic`, which clears the old process / generate / research placeholder mappings in the CLI capability matrix.
- The selection/export registry batch is now landed too: the same operation surface now also covers `editor.create-link-and-generate`, `provider.profile.export`, `provider.profile.import`, `cli.capability-manifest.export`, and `cli.invocation-contract.export`, so the old "selection/export surfaces still missing" gap is no longer current.
- Translation/extraction utility boundary work has moved another step as well: `batchTranslateFolder()` now accepts an injected reporter instead of treating `ProgressModal` as the only carrier, and `extractOriginalText()` now returns a structured result object while the host adapter owns the success notice explicitly.
- The next host-adapter batch is now landed too: `src/operations/utilityCommandHostAdapter.ts` now carries duplicate cleanup, batch Mermaid fix, and single/batch formula-fix command orchestration, so those wrappers in `src/main.ts` are now thin delegators as well.
- The smallest remaining write-heavy contract batch is now landed too: `src/translate.ts` now returns `TranslateFileResult` / `BatchTranslateFolderResult`, `src/formulaFixer.ts` now returns `FormulaFixFileResult` / `BatchFormulaFixResult`, host adapters now own their success notices, and `src/operations/registry.ts` exports the richer `translate.*` / `formula.*` result schemas directly.
- The first `src/fileUtils.ts` contract slice is now landed too: `processFile()` returns `ProcessFileResult`, `generateContentForTitle()` returns `GenerateContentForTitleResult`, `batchGenerateContentForTitles()` returns `BatchGenerateContentForTitlesResult`, `runProcessFolderWithNotemdCommandWithHost()` now reports `savedCount` / `errors` / `cancelled`, and the batch-generate no-file branch is now a host-owned notice rather than a utility-owned pseudo-success path.
- The remaining `src/fileUtils.ts` tail is now landed too: `batchFixMermaidSyntaxInFolder()` returns `BatchMermaidFixResult`, `checkAndRemoveDuplicateConceptNotes()` returns `ConceptDedupeResult`, the duplicate-deletion confirmation is now host-injected, and `mermaid.batch-fix` / `concept.dedupe` now export richer schemas from the registry as well.
- `src/fileUtils.ts` and `src/extractOriginalText.ts` now accept narrower runtime contexts instead of the concrete `NotemdPlugin` class. Boundary work has therefore advanced from "wrapper extraction" into "utility host-coupling reduction".
- The remaining architectural gap has moved again: the next phase should target the still-inline sidebar/direct-read command surfaces in `src/main.ts`, then the packaging/semantic-verification follow-up work, rather than reopening already-landed write-heavy families or doing more wrapper-only moves.

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
   The `.drawnix` export model from `ref/drawnix/packages/drawnix/src/data/types.ts`, the browser file import/export boundary in `ref/drawnix/packages/drawnix/src/data/json.ts`, the lazy-loaded `markdown-to-drawnix` / `mermaid-to-drawnix` converters, and the app-shell / board / text-renderer layering are all good reference material.

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

6. **Move the next phase toward the remaining direct command surfaces**
   Note-processing registry onboarding, utility host extraction, the `translate/formula` proof slice, the process/generate sub-slice, and the remaining `src/fileUtils.ts` tail are now complete enough. The next step should converge `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` onto the same discoverable operation/result boundary expectations where feasible.

7. **Keep draining the remaining high-value direct command surfaces after that**
   The verified highest-value remaining direct surfaces are now `testLlmConnectionCommand`, `generateDiagramCommand` plus its save/artifact branches, and `previewExperimentalDiagramCommand`. They matter more than reopening already-extracted utility families before the write-heavy result contracts are tightened.

### Ordered landing sequence

The most defensible future landing order, after cross-checking roadmap intent against current code, is:

1. first converge the remaining direct command surfaces in `src/main.ts`, with `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` as the highest-value targets
2. then continue follow-up hardening for maintainer-local semantic verification and heavy-runtime packaging boundaries
3. after those boundary items stabilize, continue selection/export contract enrichment and workflow/settings packaging cleanup
4. after those boundary items, reopen legacy prompt retirement, MermaidProcessor sunset, or richer first-class CLI exposure
5. only after that, re-evaluate board-style export and advanced-engine exploration

That sequence preserves the roadmap's long-term intent while respecting what the codebase has already delivered.

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
