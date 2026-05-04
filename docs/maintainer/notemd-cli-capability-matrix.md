# Notemd CLI Capability Matrix

> Updated: 2026-05-04

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

## Current Command Matrix

| Command ID | Current Purpose | Automation Level | Why It Is Not Yet a Stable Engineering API | Proposed Future Operation ID |
|---|---|---|---|---|
| `notemd:test-llm-connection` | Test active provider connectivity | `safe` | Current output is UI-oriented rather than contract-oriented | `provider.diagnostic.run` |
| `notemd:notemd-generate-diagram` | Generate spec-first artifact from active file | `requires-active-file` | Depends on active file, plugin state, and save/open side effects | `diagram.generate` |
| `notemd:notemd-summarize-as-mermaid` | Save Mermaid output for active file | `requires-active-file` | Depends on active file + plugin-managed save/output semantics | `diagram.generate-mermaid` |
| `notemd:notemd-preview-diagram` | Preview saved/sourced diagram | `interactive-ui` | Preview modal is UI-only and not automation-stable | `diagram.preview` |
| `notemd:process-with-notemd` | Process current file and add links | `requires-active-file` | Depends on active file and plugin-owned mutation flow | `file.process.add-links` |
| `notemd:process-folder-with-notemd` | Batch process folder | `interactive-ui` | Folder selection and batch UX remain plugin-host driven | `file.process-folder.add-links` |
| `notemd:generate-content-from-title` | Generate note content from title | `requires-active-file` | Uses active file and writeback flow | `content.generate-from-title` |
| `notemd:batch-generate-content-from-titles` | Batch title generation | `interactive-ui` | Folder selection, completion-folder behavior, progress UI | `content.batch-generate-from-titles` |
| `notemd:research-and-summarize-topic` | Research selected text / active note title | `requires-selection` | Depends on active editor or active note name | `research.summarize-topic` |
| `notemd:translate-file` | Translate current note/selection | `requires-selection` | Current command contract is editor-context first | `translate.file` |
| `notemd:batch-translate-folder` | Batch translate a folder | `interactive-ui` | Folder selection and progress UI need adapter separation | `translate.folder-batch` |
| `notemd:extract-concepts-from-current-file` | Extract concepts from active file | `requires-active-file` | Active file + note-creation side effects | `concept.extract-file` |
| `notemd:batch-extract-concepts-from-folder` | Extract concepts across folder | `interactive-ui` | Folder selection and progress UI still host-bound | `concept.extract-folder` |
| `notemd:extract-concepts-and-generate-titles` | Compound extract+generate flow | `requires-active-file` | Composite workflow without explicit typed contract | `workflow.extract-and-generate` |
| `notemd:create-wiki-link-and-generate-from-selection` | Selection-driven concept note generation | `requires-selection` | Editor selection is intrinsic | `editor.create-link-and-generate` |
| `notemd:batch-mermaid-fix` | Batch Mermaid repair | `interactive-ui` | Folder selection + mutation + report side effects | `mermaid.batch-fix` |
| `notemd:fix-formula-formats` | Fix formulas in current file | `requires-active-file` | Active file mutation contract not yet externalized | `formula.fix-file` |
| `notemd:batch-fix-formula-formats` | Batch formula repair | `interactive-ui` | Folder selection and progress/report side effects | `formula.batch-fix` |
| `notemd:check-for-duplicates` | Check current note duplicates | `requires-active-file` | Result is console/notice-oriented | `duplicate.check-file` |
| `notemd:check-and-remove-duplicate-concept-notes` | Remove duplicate concept notes | `interactive-ui` | Destructive flow requires stronger contract and confirmation model | `concept.dedupe` |

## First Extraction Targets

These are the best near-term candidates for host-neutral operations.

| Priority | Candidate | Why First | Existing Building Blocks |
|---|---|---|---|
| P0 | Provider diagnostics | Already close to operation shape; deterministic inputs/outputs | `src/providerDiagnostics.ts`, `src/llmUtils.ts` |
| P0 | Diagram generation | Spec-first core already exists | `src/diagram/diagramGenerationService.ts`, `src/diagram/*` |
| P1 | Capability discovery | Needed before expanding automation surface | `src/workflowButtons.ts`, command registry in `src/main.ts` |
| P1 | Config/profile export | Needed to make CLI usage reproducible | `src/types.ts`, `src/constants.ts`, provider settings |
| P2 | Batch execution state | Valuable, but needs adapter cleanup first | `src/batchProgressStore.ts`, batch flows in `src/main.ts` |

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

Promote it only when all of the following are true:

1. inputs are explicit
2. outputs are machine-readable
3. side effects are documented
4. progress/failure semantics are deterministic
5. no hidden dependency on active editor/UI state remains
