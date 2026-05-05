# Notemd CLI Capability Matrix

> Updated: 2026-05-05

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

## Current Command Matrix

| Command ID | Current Purpose | Automation Level | Why It Is Not Yet a Stable Engineering API | Registry Operation Mapping |
|---|---|---|---|---|
| `notemd:test-llm-connection` | Test active provider connectivity | `safe` | Current output is UI-oriented rather than contract-oriented | `provider.diagnostic.run` (`future-target`) |
| `notemd:run-developer-provider-diagnostic` | Run long-request provider diagnostic | `safe` | Better suited for automation than `test-llm-connection`, but still lacks a public typed result surface | `provider.diagnostic.run` (`exact`) |
| `notemd:run-developer-provider-stability-diagnostic` | Run repeated provider stability diagnostic | `safe` | Better suited for automation than UI-only diagnostics, but still lacks a public typed result surface | `provider.diagnostic.stability-run` (`exact`) |
| `notemd:export-provider-profiles` | Export provider profile snapshot | `safe` | Deterministic and machine-readable, but still writes into plugin-managed config path semantics | `provider.profile.export` |
| `notemd:import-provider-profiles` | Import provider profile snapshot | `safe` | Machine-readable, but mutates active provider state and plugin settings | `provider.profile.import` |
| `notemd:export-cli-capability-manifest` | Export command capability manifest | `safe` | Deterministic export, but still tied to plugin config-path write semantics | `cli.capability-manifest.export` |
| `notemd:export-cli-invocation-contract` | Export typed invocation contract | `safe` | Deterministic export, but still tied to plugin config-path write semantics | `cli.invocation-contract.export` |
| `notemd:notemd-generate-diagram` | Generate spec-first artifact from active file | `requires-active-file` | Depends on active file, plugin state, and save/open side effects | `diagram.generate` (`exact`, `defaultInput.outputMode=artifact`) |
| `notemd:notemd-summarize-as-mermaid` | Save Mermaid output for active file | `requires-active-file` | Depends on active file + plugin-managed save/output semantics | `diagram.generate` (`exact`, `defaultInput.outputMode=mermaid`) |
| `notemd:notemd-preview-diagram` | Preview saved/sourced diagram | `interactive-ui` | Preview modal is UI-only and not automation-stable | `diagram.preview` (`exact`) |
| `notemd:process-with-notemd` | Process current file and add links | `requires-active-file` | Structured file result now exists, but active-file dependency, concept-note creation, output-path policy, and vault mutation still block stable automation | `file.process-add-links` |
| `notemd:process-folder-with-notemd` | Batch process folder | `interactive-ui` | Structured batch result now exists with `savedCount` / `errors` / `cancelled`, but folder selection, mutating batch execution, and post-process Mermaid auto-fix remain host driven | `file.process-folder-add-links` |
| `notemd:generate-content-from-title` | Generate note content from title | `requires-active-file` | Structured result now exists, but active-file dependency, writeback semantics, and optional research side effects still bind it to the plugin host | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | Batch title generation | `interactive-ui` | Structured batch result now exists with complete-folder move semantics and aggregated errors, but folder selection, progress UI, and vault mutation still require host coordination | `content.batch-generate-from-titles` |
| `notemd:research-and-summarize-topic` | Research selected text / active note title | `requires-selection` | Depends on active editor or active note name | `research.summarize-topic` |
| `notemd:translate-file` | Translate current active note | `requires-active-file` | Structured result and host-owned success notice now exist, but active-file dependency, settings-driven output-path policy, and vault-write side effects still block stable automation | `translate.file` |
| `notemd:batch-translate-folder` | Batch translate a folder | `interactive-ui` | Folder selection remains interactive; structured batch results and host-owned success notices now exist, but folder-picker dependency and mutating batch execution still keep it out of stable automation | `translate.folder-batch` |
| `notemd:extract-concepts-from-current-file` | Extract concepts from active file | `requires-active-file` | Active file + note-creation side effects | `concept.extract-file` |
| `notemd:batch-extract-concepts-from-folder` | Extract concepts across folder | `interactive-ui` | Folder selection and progress UI still host-bound | `concept.extract-folder` |
| `notemd:extract-original-text` | Extract configured source snippets from active file | `requires-active-file` | Structured result now exists, but active-file dependency and output-path persistence remain host/settings bound | `content.extract-original-text` |
| `notemd:extract-concepts-and-generate-titles` | Compound extract+generate flow | `requires-active-file` | Composite workflow without explicit typed contract | `workflow.extract-and-generate` |
| `notemd:create-wiki-link-and-generate-from-selection` | Selection-driven concept note generation | `requires-selection` | Editor selection is intrinsic | `editor.create-link-and-generate` |
| `notemd:batch-mermaid-fix` | Batch Mermaid repair | `interactive-ui` | Folder selection + mutation + report side effects | `mermaid.batch-fix` |
| `notemd:fix-formula-formats` | Fix formulas in current file | `requires-active-file` | Structured file result now exists, but active-file dependency and inline vault mutation still block stable automation | `formula.fix-file` |
| `notemd:batch-fix-formula-formats` | Batch formula repair | `interactive-ui` | Structured batch result now exists, but folder selection and mutating batch execution still require interactive host semantics | `formula.batch-fix` |
| `notemd:check-for-duplicates` | Check current note duplicates | `requires-active-file` | Result is console/notice-oriented | `duplicate.check-file` |
| `notemd:check-and-remove-duplicate-concept-notes` | Remove duplicate concept notes | `interactive-ui` | Destructive flow requires stronger contract and confirmation model | `concept.dedupe` |

## Registry Status

- `src/operations/registry.ts` is now the central metadata source for extracted operations, command bindings, mapping kind, and selected input/result schemas.
- `src/operations/capabilityManifest.ts` now flattens those command bindings into the exported capability manifest.
- `src/cliContracts.ts` now builds the invocation contract from the same registry, which removes one major drift path between docs, command discovery, and contract export.
- The registry now includes the main note-processing, utility, selection, and export operation batches as well: `editor.create-link-and-generate`, `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, `research.summarize-topic`, `translate.file`, `translate.folder-batch`, `concept.extract-file`, `concept.extract-folder`, `content.extract-original-text`, `workflow.extract-and-generate`, `duplicate.check-file`, `concept.dedupe`, `mermaid.batch-fix`, `formula.fix-file`, `formula.batch-fix`, `provider.profile.export`, `provider.profile.import`, `cli.capability-manifest.export`, and `cli.invocation-contract.export`.
- `file.process-add-links`, `file.process-folder-add-links`, `content.generate-from-title`, `content.batch-generate-from-titles`, `translate.*`, `formula.*`, and `content.extract-original-text` now form the current proof set for write-heavy contract enrichment: utility cores return structured results, host adapters own localized success/no-file notices, and the registry exports the richer schemas directly.
- The next contract-deepening order is now explicit: finish the remaining `src/fileUtils.ts` tail first, the remaining direct-read/sidebar surfaces second, and packaging/semantic-verification convergence last.
- Legacy aliases remain registered for compatibility, but they are intentionally excluded from capability-manifest export.

## Next Extraction Targets

These are the best remaining candidates for registry-backed or more host-neutral operations.

| Priority | Candidate | Why First | Existing Building Blocks |
|---|---|---|---|
| P0 | Remaining `src/fileUtils.ts` tail tightening | Process/generate contracts are now landed; the remaining high-leverage gap is Mermaid batch repair plus destructive concept dedupe, alongside cross-family result-vocabulary stabilization | `src/fileUtils.ts`, `src/operations/noteProcessingCommandHostAdapter.ts`, `src/operations/utilityCommandHostAdapter.ts` |
| P1 | Remaining direct-read/sidebar surfaces | `src/main.ts` still owns long-tail direct execution and sidebar-only read paths; highest-value examples are `testLlmConnectionCommand`, `generateDiagramCommand`, and `previewExperimentalDiagramCommand` | remaining command surfaces in `src/main.ts`, `src/workflowButtons.ts` |
| P2 | Contract enrichment for selection/export and config flows | Export/selection operations are now modeled, but future operation invokers need richer path/context semantics than command-trigger parity alone | `src/operations/registry.ts`, `src/operations/configProfileCommands.ts`, `src/operations/noteProcessingCommandHostAdapter.ts` |
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
