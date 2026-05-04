# Notemd CLI Operation Extraction Plan

> **For agentic workers:** Execute in a clean worktree. Treat the official `obsidian` CLI as a command-trigger substrate, not as a complete plugin automation contract.

**Goal:** Turn Notemd from a plugin-command bundle into an operation-oriented system that can be invoked safely from the official Obsidian CLI, future `obsidian-cli` wrappers, and maintainer automation without duplicating orchestration logic.

**Architecture:** Keep four layers distinct:

1. trigger layer (`obsidian command id=...`, command palette, sidebar, workflow DSL)
2. host adapter layer (plugin UI / official CLI / maintainer script)
3. operation layer (typed inputs, typed outputs, explicit side effects)
4. contract layer (capability discovery, argument schema, result schema, progress semantics)

**Tech Stack:** TypeScript, Obsidian Plugin API, official Obsidian CLI, Jest, Markdown documentation, optional JSON-schema-style typing discipline

---

## Problem Frame

The official `obsidian` CLI can already list and execute plugin-registered commands. That is useful, but insufficient:

- current Notemd commands still depend heavily on `src/main.ts` orchestration
- many flows require `App`, `Editor`, `MarkdownView`, notices, modals, or active-file assumptions
- command triggering has no typed parameter surface, no stable result contract, and no capability metadata

If Notemd stops at "CLI can trigger command IDs", automation will stay brittle. The engineering target is therefore not more command IDs. It is a stable operation surface below the command layer.

## Requirement Traceability

Source documents:

- `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md`
- `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.md`
- `docs/architecture.md`
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- `docs/maintainer/notemd-cli-capability-matrix.md`

Carried-forward constraints:

- do not treat current command IDs as stable engineering APIs
- preserve existing user-facing plugin command behavior during extraction
- keep UI-only flows out of the first CLI-grade contract
- keep `src/main.ts` shrinking, not growing, as the CLI direction advances

## Short-Term Delivery (0-2 weeks)

### Objective

Create the first CLI-grade seams without changing product behavior.

### Work Items

- Define an operation taxonomy and automation-level vocabulary.
- Extract provider diagnostics into a host-neutral operation surface.
- Freeze a capability matrix for all current `notemd:*` commands.
- Define the first typed result contracts for non-interactive capabilities.

### Implementation Units

**ST1. Operation contract primitives**
- Create `src/operations/types.ts`
- Define:
  - `OperationDefinition`
  - `OperationContext`
  - `OperationResult`
  - `ProgressSink`
  - `AutomationLevel`
- Keep these free of Obsidian UI classes

**ST2. Provider diagnostic operation**
- Extract the current `src/providerDiagnostics.ts` surface behind a stable operation entry
- Expected input fields:
  - provider name
  - model override
  - call mode
  - timeout
  - stability runs
  - optional output path
- Expected result fields:
  - success
  - report path/text
  - elapsed time
  - warnings
  - debug summary

**ST3. Capability matrix as source-of-truth**
- Classify all current plugin commands into:
  - `safe`
  - `requires-active-file`
  - `requires-selection`
  - `interactive-ui`
- Explicitly mark which ones are acceptable for official CLI triggering today and which are not

### Verification

- `npm run build`
- full Jest run
- contract tests for provider diagnostics remain green
- no user-facing command regression

### Best Practices

- prefer file-backed evidence outputs over UI notices
- prefer explicit input objects over reading global plugin state
- keep the first extracted operation narrow and boring

### Pitfalls

- extracting logic but still passing `App` everywhere
- letting operation results leak UI wording
- treating "callable from CLI" as "automation-ready"

## Mid-Term Delivery (2-6 weeks)

### Objective

Build a reusable operation layer for the most valuable Notemd capabilities.

### Work Items

- Extract diagram generation into a typed operation contract.
- Introduce host adapters for plugin UI and official CLI invocation.
- Refactor workflow metadata into a reusable registry instead of a sidebar-only construct.
- Define config/profile semantics for CLI reuse.

### Implementation Units

**MT1. Diagram generation operation**
- Wrap `src/diagram/diagramGenerationService.ts` in a stable operation
- Support:
  - source markdown input
  - source file path input
  - requested intent
  - compatibility mode
  - output mode (`artifact` / `mermaid`)
  - save/dry-run behavior
- Return:
  - plan
  - spec
  - artifact metadata
  - saved path
  - render warnings

**MT2. Host adapter split**
- Add a plugin adapter that resolves active file, vault state, and settings
- Add a CLI adapter that resolves file paths, vault targeting, output paths, and stdout/stderr behavior
- Keep both adapters thin; business logic stays in operations

**MT3. Workflow/action registry hardening**
- Promote `src/workflowButtons.ts` into metadata source, not just button configuration
- Add per-action metadata:
  - automation level
  - required context
  - side-effect class
  - parameter expectations

**MT4. Config/profile boundary**
- Separate plugin-owned state from exportable/importable automation profile state
- First candidates:
  - provider/model selection
  - `preferredDiagramIntent`
  - diagnostic mode/timeouts
  - workflow definitions
- Keep `localOnly` semantics explicit in every export/import design

### Verification

- full build and full Jest
- contract checks for diagram generation outputs
- no regression in official CLI command triggering for existing command IDs

### Best Practices

- define output schemas before exposing automation entrypoints
- keep preview concerns separate from generation concerns
- build capability discovery before adding more invocable operations

### Pitfalls

- mixing preview/UI side effects into generation operations
- exposing workflow DSL as public API before metadata is normalized
- conflating command IDs with operation IDs

## Long-Term Delivery (6+ weeks)

### Objective

Expose a mature, automation-grade Notemd integration surface above the official command-trigger layer.

### Work Items

- Introduce a capability-discovery command or manifest surface.
- Add typed invocation contracts for selected operations.
- Support machine-readable progress and result emission.
- Evaluate whether the final transport should stay command-based, become file-based, or grow into a local bridge.

### Implementation Units

**LT1. Capability discovery**
- Publish stable capability metadata:
  - operation ID
  - version
  - required context
  - accepted input schema
  - result schema

**LT2. Typed invocation layer**
- Build a stable "invoke operation" contract above raw command IDs
- Support deterministic exit codes and machine-readable errors

**LT3. Optional richer transport**
- Evaluate whether command-trigger-only integration remains enough
- Only consider local REST / IPC / file-bridge after operation contracts stabilize

### Verification

- end-to-end maintainer automation smoke tests
- backward-compatible command trigger support retained
- explicit documentation for unsupported interactive flows

### Best Practices

- version operation contracts independently from command labels
- keep transport choice secondary to contract stability
- optimize for maintainable automation, not cleverness

### Pitfalls

- building a transport before stabilizing contracts
- hard-coding one maintainer machine's wrapper behavior into repo architecture
- leaking plugin-internal object shapes as public automation APIs

## Ordered Landing Sequence

1. provider diagnostic operation
2. capability matrix + automation levels
3. diagram generation operation
4. workflow/action registry hardening
5. config/profile extraction
6. typed invocation layer
7. optional richer transport

## Exit Criteria

- at least one non-interactive Notemd capability is callable through a host-neutral operation contract
- command IDs remain compatible, but are no longer the only integration story
- maintainers can identify which capabilities are safe for official CLI triggering and why
- the repository has a stable implementation plan for continuing operation extraction without reopening architecture ambiguity
