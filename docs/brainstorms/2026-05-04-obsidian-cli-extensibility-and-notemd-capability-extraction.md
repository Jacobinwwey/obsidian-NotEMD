---
date: 2026-05-04
topic: obsidian-cli-extensibility-and-notemd-capability-extraction
---

# Obsidian CLI Extensibility and Notemd Capability Extraction

## Problem Frame

Notemd already contains several capabilities that are larger than a single Obsidian UI surface:

- provider diagnostics with reproducible runtime modes
- spec-first diagram generation
- batch progress persistence
- structured workflow action IDs and serializable workflow definitions
- per-provider local-only storage semantics

At the same time, the current host reality is narrower than the product ambition. On this machine, `obsidian-cli` is a stable desktop/debug wrapper with `help`, `version`, `vaults`, `vault`, `doctor`, `native`, `gui`, and `debug` subcommands. It is **not** yet a plugin-command host, and it does not expose a stable extension protocol for third-party plugin capabilities.

That means the next durable move is not "add some Notemd commands to `obsidian-cli`" directly. The next move is to define:

1. which Notemd capabilities are worth extracting into host-agnostic operations
2. which settings and execution contracts can survive outside the plugin UI
3. what `obsidian-cli` would need before those operations can be exposed as first-class CLI commands

Without that boundary work, CLI ambitions will keep collapsing back into `src/main.ts` orchestration, UI-only assumptions, and machine-specific wrapper behavior.

## Requirements

**Capability Classification**
- R1. The repository must explicitly distinguish between Notemd capabilities that are host-agnostic and CLI-suitable versus capabilities that remain tied to Obsidian UI/runtime surfaces.
- R2. The classification must be grounded in current code, not aspiration. In particular, any CLI-suitable claim must reflect whether the current implementation still depends directly on `App`, `Editor`, `MarkdownView`, `Notice`, modal flows, or plugin-owned file-selection UX.
- R3. Progress and architecture documents must state plainly that `obsidian-cli` on this host is currently a debug/desktop wrapper, not a general plugin execution host.

**CLI-Suitable Capability Extraction Targets**
- R4. The next architecture seam must prioritize extracting reusable operations for:
  - provider diagnostics
  - diagram generation core
  - workflow/action registry metadata
  - batch-progress persistence and resumability metadata
  - provider/settings serialization rules such as `localOnly`
- R5. The extracted capability set must prefer stable inputs/outputs over UI callbacks. The intended long-term contract is operation-oriented and data-oriented, not "simulate sidebar button clicks from the CLI".
- R6. Any candidate CLI capability that still requires direct Obsidian editor mutations, modal prompts, file-pickers, or preview windows must be documented as a deferred extraction target until a host-neutral operation boundary exists.

**Obsidian CLI Integration Direction**
- R7. The repository must define `obsidian-cli` integration as a phased extensibility program:
  - Phase 1: extract host-agnostic Notemd operations
  - Phase 2: define a plugin/operation invocation contract that `obsidian-cli` could call
  - Phase 3: expose selected operations as stable CLI commands or subcommands
- R8. The repository must explicitly avoid assuming that current `obsidian-cli` wrappers can already load arbitrary plugin commands. Any document that implies this today must be corrected.
- R9. The first CLI-oriented integration targets should be non-interactive and evidence-friendly: diagnostics, artifact generation, config inspection/export, and dry-run style capability reports before editor-mutating flows.

**Settings and Extensibility Model**
- R10. The repository must identify which Notemd settings are promising for CLI reuse versus which remain plugin-local UI settings. At minimum, this distinction must cover:
  - provider selection and model selection
  - `preferredDiagramIntent`
  - `localOnly` provider persistence semantics
  - workflow DSL and action IDs
  - developer diagnostic mode/timeouts/stability-run settings
- R11. The next-stage architecture must move toward a reusable operation/config layer that can be consumed by the plugin UI, future CLI entrypoints, and maintainer tooling without duplicating orchestration logic inside `src/main.ts`.

**Documentation and Progress Control**
- R12. Current progress documents must be updated section by section so they show that command-surface stabilization is no longer the only boundary-hardening theme; CLI-capability extraction is now a parallel architectural direction, but only after host-neutral operation seams are established.
- R13. The roadmap and architecture overview must describe CLI extensibility as an extension of service-boundary hardening, not as a shortcut around it.

## Success Criteria

- A maintainer can point to a written capability matrix and explain which Notemd features are ready for future CLI exposure, which are blocked by plugin-host coupling, and why.
- The docs no longer imply that `obsidian-cli` already supports plugin-command execution beyond its current wrapper/debug scope.
- The next planning phase can decompose a concrete operation-extraction batch without inventing product behavior or CLI scope from scratch.
- The repository continues to keep local machine wrappers, plugin command surfaces, and future CLI extensibility as separate layers rather than collapsing them into one unstable interface.

## Scope Boundaries

- This requirements pass does not implement new `obsidian-cli` subcommands.
- This requirements pass does not modify the system-level `/usr/local/sbin/obsidian-cli` wrapper on this machine.
- This requirements pass does not refactor `src/main.ts` into services yet.
- This requirements pass does not declare all current Notemd commands CLI-ready.
- This requirements pass does not treat sidebar actions or workflow DSL lines as a stable public CLI API by themselves.

## Key Decisions

- Treat current `obsidian-cli` as a host constraint, not as proof that plugin operations are already CLI-exposable.
- Extract operations before exposing commands. Otherwise the project will duplicate orchestration logic across plugin UI and CLI surfaces.
- Prefer non-interactive, deterministic, artifact-producing capabilities as the first CLI-fit targets.
- Keep editor-bound, preview-bound, and modal-bound flows behind the plugin host until explicit host-neutral contracts exist.

## Dependencies / Assumptions

- Current host evidence comes from `obsidian-cli help`, `obsidian-cli doctor`, and the local wrapper scripts `/usr/local/sbin/obsidian-cli` plus `/usr/local/libexec/obsidian-launch`.
- Current code evidence shows that `src/main.ts` still owns command registration, busy-state orchestration, reporter lifecycle, and many `App`/`Editor`/`MarkdownView`-bound flows.
- Reusable lower-level building blocks already exist in places such as `src/providerDiagnostics.ts`, `src/diagram/diagramGenerationService.ts`, `src/workflowButtons.ts`, `src/batchProgressStore.ts`, and parts of `src/llmUtils.ts`, but they are not yet assembled into a host-neutral operation layer.

## Outstanding Questions

### Deferred to Planning
- [Affects R4][Technical] Which operation family should be extracted first from `src/main.ts`: diagnostics, diagram generation, or workflow execution?
- [Affects R5][Technical] What is the smallest host-neutral operation interface that can express inputs, outputs, progress, and failure without depending on Obsidian UI classes?
- [Affects R7][Needs research] Should future `obsidian-cli` integration be plugin-discovered, manifest-declared, or explicitly adapter-driven from the CLI side?
- [Affects R10][Technical] Which settings should remain vault/plugin-owned state versus exportable/importable CLI profiles?

## Next Steps

-> /ce:plan for a concrete operation-extraction and CLI-extensibility implementation batch
