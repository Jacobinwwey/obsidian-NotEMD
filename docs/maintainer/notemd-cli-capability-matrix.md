# Notemd CLI Capability Matrix

> Updated: 2026-05-28

## Status Call (2026-05-25)

Short answer: current `main` now carries a deliberate two-tier CLI story, not a single widened surface.

What is landed on current `main`:

- registry-backed operation metadata
- typed capability / invocation export
- a bounded public-safe export slice
- a repo-local maintainer helper that covers the same export slice plus explicit path-based maintainer operations with JSON/file payload input

What is intentionally not claimed:

- broad user-facing CLI support for active-file, selection, or preview flows
- promotion of the current path-based maintainer operations into the public-safe slice
- a broad public CLI API over mutable note-processing flows

This matrix is a maintainer control document. It distinguishes:

- commands that the official `obsidian` CLI can already trigger today
- commands that are safe for automation versus only safe for manual invocation
- lower-level Notemd capabilities that should become first-class operations before wider CLI exposure

## Automation Levels

| Level | Meaning |
|---|---|
| `safe` | Non-interactive, deterministic enough for scripted triggering |
| `requires-active-file` | Needs an active note/file context and should not be treated as a general automation endpoint yet |
| `requires-selection` | Depends on editor selection or interactive editor state |
| `interactive-ui` | Depends on modal, picker, preview, split-pane, or human-facing UI flow |

## Official CLI Trigger Surface

Observed host facts:

- `obsidian commands filter=notemd` lists current plugin commands
- official CLI can trigger them with `obsidian command id=<command-id>`
- this is a trigger surface only, not a mature typed integration layer
- the registry-backed capability export now keeps command palette, hotkey, and official CLI trigger surfaces attached to the same command bindings

## Current Bounded Public Slice

The current public-safe slice is intentionally narrow. It only includes commands that are:

- `safe`
- `requiredContext=none`
- `mappingKind=exact`
- exposed on the official CLI trigger surface
- backed by an empty-object input schema

Current command IDs in this slice:

- `notemd:export-provider-profiles-redacted`
- `notemd:export-cli-capability-manifest`
- `notemd:export-cli-invocation-contract`
- `notemd:export-cli-public-surface`

Guardrails:

- raw provider export is excluded because it carries `outputHandlingTags=contains-provider-credentials`
- redacted provider export is intentionally non-importable, so sanitized payloads cannot be mistaken for live settings snapshots
- redacted export still may reveal private/custom `baseUrl` infrastructure, so it is safer than raw export, not automatically safe for public sharing

## Repo-Local Maintainer Helper

The repo now also carries a small maintainer helper over `obsidian-cli native eval`:

- help: `npm run cli:help`
- invoke: `npm run cli:invoke -- --vault <vault> --operation <operation-id> [--input-file <path> | --input-json '<json>'] [--pretty]`
- supported operation ids:
  - `content.batch-generate-from-titles`
  - `content.split-note-by-chapters`
  - `research.summarize-topic`
  - `diagram.generate`
  - `local-knowledge.inspect`
  - `provider.profile.export-redacted`
  - `cli.capability-manifest.export`
  - `cli.invocation-contract.export`
  - `cli.public-surface.export`

Boundary:

- this is maintainer-grade repo tooling, not a public CLI API
- the operation catalog lives in `scripts/lib/maintainer-cli-operation-help.js` as shared maintainer helper metadata, including compact example payloads for the path-based operations
- export operations remain empty-payload only; bounded content operations accept explicit JSON input
- minimal inspect example: `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["maintainer","superpowers"]}' --pretty`
- for `--vault docs`, all `sourcePath` and `knowledgePaths` values are vault-relative; use `index.zh-CN.md` and `maintainer`, not `docs/index.zh-CN.md` or `docs/maintainer`
- `local-knowledge.inspect` is intentionally maintainer-only explainability surface: it exposes task scope, effective knowledge-base path resolution, derived or explicit query, query diagnostics, current-file exclusion inputs, retrieval options, candidate file paths, raw formatted context, structured `contextBlocks` evidence, and the structured retrieval summary without widening the public CLI contract
- `local-knowledge.inspect` currently makes three query-derivation paths visible and test-backed: `explicit` (for direct research queries), `basename` (for title/batch-title task scopes), and `diagram-source` (for diagram generation derived from source basename plus stripped note content). The inspect result now also surfaces bounded query diagnostics, including generic navigation-basename cautions for low-signal sources such as `index.*`
- `local-knowledge.inspect` now also accepts a temporary `knowledgePaths` override array, so maintainers can inspect task-scoped retrieval against ad hoc file/folder path lists without mutating the saved settings snapshot
- `local-knowledge.inspect` also keeps failure-state explainability explicit instead of collapsing every miss into the same empty result: `retrieverBuildStatus` distinguishes `no-paths`, `no-candidate-files`, `no-retrievable-sections`, and `ready`, while `candidateFilePaths` and the structured retrieval summary stay available for debugging
- additional inspect examples now cover the real task-scoped retrieval lanes, plus reproducible failure-state probes, not only the diagram lane:
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"batchGenerateFromTitles","sourcePath":"index.zh-CN.md"}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"task-scoped retrieval behavior","knowledgePaths":["maintainer"]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"chapter split TOC managed artifacts guarded reruns","knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"real-note query diversity beyond chapter split showcase","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"batchGenerateFromTitles","sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"missing path coverage","knowledgePaths":[]}' --pretty`
  - `npm run cli:invoke -- --vault docs --operation local-knowledge.inspect --input-json '{"taskScope":"researchSummarize","query":"svg-only repo saga scope","knowledgePaths":["repo-saga"]}' --pretty`
- `content.split-note-by-chapters` also accepts optional `splitHeadingLevel` (`auto`, `h1`-`h6`) so scripts can avoid depending on the current settings snapshot
- `content.split-note-by-chapters` results now also expose `requestedSplitHeadingLevel`, `chapterNotePaths`, `managedArtifactPaths`, `removedStalePaths`, deterministic `tocMetadata`, and stable `nestedHeadings[].blockId` values so automation can reason about the managed artifact set, TOC front-matter metadata, and repeated-heading-safe TOC targets without re-deriving them from filenames or ambiguous heading text; reruns now also refuse to overwrite or delete manifest-managed artifacts whose contents drifted from the last generated snapshot
- path-based maintainer operations stay maintainer-only until their side effects, output schemas, and failure semantics are promoted as part of a public contract batch

## Current Command Matrix

| Command ID | Current Purpose | Automation Level | Why It Is Not Yet a Stable Engineering API | Registry Operation Mapping |
|---|---|---|---|---|
| `notemd:test-llm-connection` | Test active provider connectivity | `safe` | Typed input/result schemas now exist, but the interactive busy/reporter path and notice wording still belong to the host UI | `provider.connection.test` (`exact`) |
| `notemd:run-developer-provider-diagnostic` | Run long-request provider diagnostic | `safe` | Typed input/result schemas now exist, but long-running network behavior and report persistence still make this a maintainer-grade surface rather than a stable public API | `provider.diagnostic.run` (`exact`) |
| `notemd:run-developer-provider-stability-diagnostic` | Run repeated provider stability diagnostic | `safe` | Typed input/result schemas now exist, but repeated live-provider execution still behaves like a maintainer-grade diagnostic surface rather than a stable public API | `provider.diagnostic.stability-run` (`exact`) |
| `notemd:export-provider-profiles` | Export raw provider profile snapshot | `safe` | Deterministic and machine-readable, but the exported file contains provider credentials and remains a maintainer-sensitive surface rather than part of the public-safe slice | `provider.profile.export` |
| `notemd:export-provider-profiles-redacted` | Export redacted provider profile snapshot | `safe` | Part of the bounded public-safe slice. Deterministic, machine-readable, strips API keys, and is intentionally non-importable, but may still expose private/custom endpoint metadata | `provider.profile.export-redacted` |
| `notemd:import-provider-profiles` | Import provider profile snapshot | `safe` | Machine-readable, but mutates active provider state and plugin settings | `provider.profile.import` |
| `notemd:export-cli-capability-manifest` | Export command capability manifest | `safe` | Part of the bounded public-safe slice. Deterministic export, but still tied to plugin config-path write semantics | `cli.capability-manifest.export` |
| `notemd:export-cli-invocation-contract` | Export typed invocation contract | `safe` | Part of the bounded public-safe slice. Deterministic export, but still tied to plugin config-path write semantics | `cli.invocation-contract.export` |
| `notemd:export-cli-public-surface` | Export bounded public CLI surface | `safe` | Part of the bounded public-safe slice. Self-describes the currently supported official-CLI-safe subset | `cli.public-surface.export` |
| `notemd:notemd-generate-diagram` | Generate spec-first artifact from active file | `requires-active-file` | Typed result now exposes the wrapper envelope plus explicit follow-through details (`kind`, `executionMode`, `sourcePath`, `actionLabel`, `operationInput`, `generation`, `followThrough`, `outputPath`, `previewOpened`) and a machine-readable local-KB retrieval summary (`localKnowledgeContextUsed`, `localKnowledgeRetrieval`) for artifact-generation modes, but active-file dependency, plugin state, and save/open side effects still keep this below a stable public API | `diagram.generate` (`exact`, `defaultInput.outputMode=artifact`) |
| `notemd:notemd-summarize-as-mermaid` | Save Mermaid output for active file | `requires-active-file` | Typed result now exposes the wrapper envelope plus explicit follow-through details (`kind`, `executionMode`, `sourcePath`, `actionLabel`, `operationInput`, `generation`, `followThrough`, `outputPath`, `previewOpened`), but active-file dependency plus plugin-managed save/output semantics still keep this below a stable public API | `diagram.generate` (`exact`, `defaultInput.outputMode=mermaid`) |
| `notemd:notemd-preview-diagram` | Preview saved/sourced diagram | `interactive-ui` | Typed input/result schemas now describe the preview artifact boundary, but opening the preview modal is still UI-bound and not automation-stable | `diagram.preview` (`exact`) |
| `notemd:process-with-notemd` | Process current file and add links | `requires-active-file` | Structured file result now exists, but active-file dependency, concept-note creation, output-path policy, and vault mutation still block stable automation | `file.process-add-links` |
| `notemd:process-folder-with-notemd` | Batch process folder | `interactive-ui` | Structured batch result now exists with `savedCount` / `errors` / `cancelled`, but folder selection, mutating batch execution, and post-process Mermaid auto-fix remain host driven | `file.process-folder-add-links` |
| `notemd:generate-content-from-title` | Generate note content from title | `requires-active-file` | Structured result now also exposes `localKnowledgeContextUsed` plus a machine-readable `localKnowledgeRetrieval` summary (`matchedSectionCount`, `returnedHitCount`, `sourcePaths`, sliding-window/current-file-exclusion telemetry, index/query timing, context-char count), but active-file dependency, writeback semantics, and optional research side effects still bind it to the plugin host | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | Batch title generation | `interactive-ui` | Structured batch result now carries the same per-file local-KB retrieval summary, including timing/size telemetry, in addition to complete-folder move semantics and aggregated errors, but folder selection, progress UI, and vault mutation still require host coordination | `content.batch-generate-from-titles` |
| `notemd:split-note-by-chapters` | Split the active note into chapter files plus TOC/manifest | `requires-active-file` | Registry/contract coverage now exists and the maintainer helper can invoke the same operation with explicit `sourcePath` plus optional `splitHeadingLevel`; the typed result now also describes the managed artifact set directly, exposes deterministic TOC front-matter metadata plus stable nested block refs for repeated-heading-safe TOC targets, and guards reruns against silently overwriting manually edited generated files, but the user-facing command trigger is still active-file-bound and remains a write-heavy mutation flow | `content.split-note-by-chapters` |
| `notemd:research-and-summarize-topic` | Research selected text / active note title | `requires-selection` | The path-based result now exposes `outputPath`, `sourceLabel`, `researchContextUsed`, `localKnowledgeContextUsed`, and a machine-readable `localKnowledgeRetrieval` summary with timing/size telemetry, but the user-facing command still depends on active editor or active note state | `research.summarize-topic` |
| `notemd:translate-file` | Translate current active note | `requires-active-file` | Structured result and host-owned success notice now exist, but active-file dependency, settings-driven output-path policy, and vault-write side effects still block stable automation | `translate.file` |
| `notemd:batch-translate-folder` | Batch translate a folder | `interactive-ui` | Folder selection remains interactive; structured batch results and host-owned success notices now exist, but folder-picker dependency and mutating batch execution still keep it out of stable automation | `translate.folder-batch` |
| `notemd:extract-concepts-from-current-file` | Extract concepts from active file | `requires-active-file` | Active file + note-creation side effects | `concept.extract-file` |
| `notemd:batch-extract-concepts-from-folder` | Extract concepts across folder | `interactive-ui` | Folder selection and progress UI still host-bound | `concept.extract-folder` |
| `notemd:extract-original-text` | Extract configured source snippets from active file | `requires-active-file` | Structured result now exists, but active-file dependency and output-path persistence remain host/settings bound | `content.extract-original-text` |
| `notemd:extract-concepts-and-generate-titles` | Compound extract+generate flow | `requires-active-file` | Composite workflow without explicit typed contract | `workflow.extract-and-generate` |
| `notemd:create-wiki-link-and-generate-from-selection` | Selection-driven concept note generation | `requires-selection` | Editor selection is intrinsic | `editor.create-link-and-generate` |
| `notemd:batch-mermaid-fix` | Batch Mermaid repair | `interactive-ui` | Structured batch result now exists, but folder selection, mutable repair flow, report generation, and optional error-file moves still require interactive host semantics | `mermaid.batch-fix` |
| `notemd:fix-formula-formats` | Fix formulas in current file | `requires-active-file` | Structured file result now exists, but active-file dependency and inline vault mutation still block stable automation | `formula.fix-file` |
| `notemd:batch-fix-formula-formats` | Batch formula repair | `interactive-ui` | Structured batch result now exists, but folder selection and mutating batch execution still require interactive host semantics | `formula.batch-fix` |
| `notemd:check-for-duplicates` | Check current note duplicates | `requires-active-file` | Result is console/notice-oriented | `duplicate.check-file` |
| `notemd:check-and-remove-duplicate-concept-notes` | Remove duplicate concept notes | `interactive-ui` | Structured scan/delete result now exists and confirmation is host-owned, but destructive confirmation plus folder-scoped mutation still keep it out of stable automation | `concept.dedupe` |

## Registry Status

- `src/operations/registry.ts` is now the central metadata source for extracted operations, command bindings, mapping kind, and selected input/result schemas.
- `src/operations/capabilityManifest.ts` now flattens those command bindings into the exported capability manifest.
- capability/public-surface metadata now also carries handling tags, so callers can distinguish secret-bearing exports from redacted/public-safe ones without a second hard-coded rule
- `src/cliContracts.ts` now builds the invocation contract from the same registry, which removes one major drift path between docs, command discovery, and contract export.
- The registry now includes the main note-processing, utility, selection, and export operation batches as well: `editor.create-link-and-generate`, `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, `content.split-note-by-chapters`, `research.summarize-topic`, `translate.file`, `translate.folder-batch`, `concept.extract-file`, `concept.extract-folder`, `content.extract-original-text`, `workflow.extract-and-generate`, `duplicate.check-file`, `concept.dedupe`, `mermaid.batch-fix`, `formula.fix-file`, `formula.batch-fix`, `provider.profile.export`, `provider.profile.export-redacted`, `provider.profile.import`, `cli.capability-manifest.export`, `cli.invocation-contract.export`, and `cli.public-surface.export`.
- `src/operations/publicCliSurface.ts` now derives the bounded public-safe slice from the same registry/capability/contract pair instead of maintaining a parallel command allowlist.
- `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, `mermaid.batch-fix`, `concept.dedupe`, `translate.*`, `formula.*`, and `content.extract-original-text` now form the current proof set for write-heavy contract enrichment: utility cores return structured results, host adapters own localized success/no-file/confirmation semantics, and the registry exports the richer schemas directly.
- `content.generate-from-title`, `content.batch-generate-from-titles`, `research.summarize-topic`, and artifact-mode `diagram.generate` now also expose machine-readable local-KB retrieval summaries instead of reducing retrieval to a boolean-only side note. Current summaries include indexed counts, matched/returned section counts, expanded section counts, source paths, requested `topK`, sliding-window size, current-file exclusion telemetry, index-build ms, query ms, and final context-char count.
- a dedicated offline retrieval-quality fixture now exists as `npm run verify:local-kb-fixtures`; it reuses the live MiniSearch-based runtime path against a small maintainer fixture set instead of introducing a separate evaluation-only retriever, and the current Stage-C slice now also covers task-scoped batch-title and research inspect cases, exact-file-vs-folder retrieval boundaries, noisy mixed-corpus scope handling with duplicate/whitespace override paths, non-Markdown distractions, unrelated folders, empty-section candidates, real-note-style chapter-split showcase retrieval, and cross-folder real-note/query diversity beyond the chapter-split showcase instead of only one diagram-oriented example.
- `content.split-note-by-chapters` now follows the same direction more explicitly: the result shape names the requested heading level, chapter note paths, full managed artifact set, deterministic TOC front-matter metadata, stale removals, and stable nested-heading block-ref ids instead of forcing callers to infer them indirectly from counts, filenames, or duplicate heading text, and reruns now fail fast when previously generated artifacts were manually edited.
- `diagram.generate` now carries an explicit typed follow-through layer beneath the host-neutral generation core: `followThrough.kind` differentiates Mermaid save, artifact save, and preview completion while preserving backward-compatible top-level `outputPath` / `previewOpened`, and artifact-generation modes now also surface the local-KB retrieval telemetry through the same structured result.
- The first checked-in semantic-verification helper now exists as `npm run verify:diagram-semantics`; it turns the maintainer runbook into a reusable, secret-free checklist artifact instead of leaving semantic verification as prose-only guidance.
- The next contract-deepening order is now more precise: keep `diagram.generate` as the host-neutral generation core, treat the follow-through shape beneath it as landed, then move to packaging/semantic-verification convergence and only after that revisit broader CLI/public-surface claims.
- Legacy aliases remain registered for compatibility, but they are intentionally excluded from capability-manifest export.

## Next Extraction Targets

These are the best remaining candidates for registry-backed or more host-neutral operations.

| Priority | Candidate | Why First | Existing Building Blocks |
|---|---|---|---|
| P0 | Packaging source/build convergence around the latent render-host runtime lane | Current source still contains reusable runtime helpers (`src/rendering/runtime/renderHostEntry.ts`, `src/rendering/preview/renderHostRuntimeClient.ts`), but build/audit truth still proves `main.js`-only shipping. Current main keeps that latent lane fail-closed by returning no default standalone runtime-module specifier unless one is configured explicitly, and the production build path keeps `createRenderHostBundleBuildOptions()` candidate-only outside `esbuild.config.mjs`. The next higher-leverage step is no longer to merely document source-only status; it is to preserve that executable guard until a future batch either keeps the lane source-only or ships a true multi-entry boundary with build, release assets, audit, and docs moving together | `esbuild.config.mjs`, `scripts/audit-render-host-bundle.js`, `scripts/lib/esbuild-bundle-config.js`, `src/rendering/runtime/renderHostEntry.ts`, `src/rendering/preview/renderHostRuntimeClient.ts` |
| P1 | Bounded public-CLI promotion for explicit path-based operations | The maintainer helper already proves there is demand for path-based operations, but public promotion should happen only for operations whose write semantics and output contracts are stable enough to document and regression-lock | `src/maintainerCliBridge.ts`, `scripts/lib/maintainer-cli-operation-help.js`, `src/operations/registry.ts`, `src/tests/maintainerCliBridge.test.ts` |
| P1 | Contract/result hardening for retrieval and chapter-split writes | Retrieval-dependent note-processing results, including artifact-mode `diagram.generate`, now expose machine-readable `localKnowledgeRetrieval` summaries with timing/size telemetry, the shared maintainer helper now carries compact payload examples plus a dedicated `local-knowledge.inspect` seam for effective path/query/context inspection, query-derivation visibility (`explicit`, `basename`, `diagram-source`), explicit failure-state explainability through `retrieverBuildStatus`, temporary `knowledgePaths` override arrays for task-scoped retrieval tuning, and `npm run verify:local-kb-fixtures` now locks a broader offline retrieval-quality fixture set across exact/prefix/current-file-exclusion classes, task-scoped batch-title and research inspect cases, noisy mixed-corpus scope handling with duplicate/whitespace override paths, non-Markdown distractions, unrelated folders, empty-section candidates, real-note-style chapter-split showcase retrieval, cross-folder task-contract retrieval, and low-signal navigation-source diagnostics. Chapter split also emits repeated-heading-safe nested block refs, deterministic TOC front-matter metadata, plus guarded rerun overwrite semantics. The next maturity gain is to keep expanding additional real-note/query diversity and chapter-split showcase alignment rather than broadening the surface count | `src/chapterSplit.ts`, `src/localKnowledgeBase.ts`, `src/fileUtils.ts`, `src/searchUtils.ts`, `src/main.ts`, `src/tests/localKnowledgeEvaluationFixture.test.ts`, `scripts/lib/maintainer-cli-operation-help.js`, `src/tests/chapterSplit.test.ts`, `src/tests/localKnowledgeTaskIntegration.test.ts`, `src/tests/diagramCommandArchitecture.test.ts`, `src/tests/localKnowledgeBase.test.ts`, `src/tests/maintainerCliBridge.test.ts` |
| P2 | Workflow/settings packaging | Workflow DSL and output-path toggles remain useful metadata but not yet stable public interfaces | `src/workflowButtons.ts`, settings-driven output controls |

## Settings Readiness

| Setting / Area | CLI Reuse Readiness | Notes |
|---|---|---|
| Provider name / model | High | Explicit and already task-scoped |
| `preferredDiagramIntent` | High | Natural operation input |
| Developer diagnostic mode / timeout / runs | High | Already structured |
| `localOnly` semantics | Medium-high | Must be preserved in export/import/profile contract |
| Workflow DSL | Medium | Good metadata source, not yet stable public API |
| Output path toggles | Medium | Useful, but currently tangled with plugin writeback behavior |
| UI locale / notices / modal text | Low | UI-only concern |

## Recommended Engineering Rule

Do not promote a Notemd command to “CLI supported” only because `obsidian command id=<id>` works.

Do not promote it only because it is hotkey-bindable either. Command palette, hotkey, and official CLI triggering are useful surfaces, but they are still not the contract.

Promote it only when all of the following are true:

1. inputs are explicit
2. outputs are machine-readable
3. side effects are documented
4. progress/failure semantics are deterministic
5. no hidden dependency on active editor/UI state remains
