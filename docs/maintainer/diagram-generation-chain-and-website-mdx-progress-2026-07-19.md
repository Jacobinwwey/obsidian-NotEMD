# Diagram Generation Chain And Website MDX Progress

Language: **English** | [简体中文](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.zh-CN.md)

## CircuitikZ Root Cause

The current generation path does not reuse the legacy mind-map prompt when the user selects **Circuit diagram** and **CircuitikZ**. `applyDiagramIntentPreference()` pins `circuitikz` plus `best-fit`; `buildDiagramOperationInput()` preserves that pair; and `buildDiagramSpecPrompt()` restricts the provider to the `circuit` intent, requires structured `circuitSpec` JSON, and forbids raw TikZ output.

Two boundary gaps could still produce the reported failure:

1. command and maintainer-CLI input overrides carried `requestedIntent` but not an explicit `requestedRenderTarget`;
2. the constrained golden-template fallback ran only after JSON parsing, so a model response containing raw `\\begin{circuitikz}` failed before fallback was reached.

Both boundaries now preserve the explicit CircuitikZ target. Raw TeX or malformed JSON for a recognized supported circuit can fall back to the deterministic topology catalog before rendering. The prompt also includes the common-source NMOS topology contract; the renderer remains the sole owner of complete LaTeX document emission.

## Current Architecture

`UI / command / maintainer CLI` → `DiagramCommandInputOverrides` → `buildDiagramOperationInput()` → `runDiagramGenerateOperation()` → circuit-only `DiagramSpec` prompt → response parser or constrained circuit fallback → `CircuitikzRenderer` → complete `.tex` plus review SVG → preview/export/history.

This keeps topology decisions in `CircuitSpec`, syntax emission in the deterministic renderer, and visual review/export in the preview platform. Unsupported circuit families still fail instead of being silently replaced with an unrelated golden circuit.

The optional repair boundary is now explicit as well: `runCircuitikzRepairLoop()` accepts at most one model-produced `CircuitSpec`, rejects topology drift before export, and requires fresh compile plus render-smoke evidence before adoption. It does not run when a local renderer is unavailable, so the normal Obsidian generation path remains dependency-free and fail-closed.

Real TeX Live verification exposed and closed two additional runtime gaps. Every golden exporter now emits a standalone document beginning with `\\documentclass[border=8pt]{standalone}`, so standard `pdflatex` accepts the file and crops the PDF to the circuit bounds. Generated Obsidian wrapper notes are also resolved back to their linked `.tex` source before preview history is recorded; CircuitikZ no longer degrades to an `HTML / flowchart` history entry when its companion SVG is reopened.

## Managed LaTeX Environment And History Drawer

The plugin will not embed a complete TeX distribution or executable archive in `main.js`. The desktop enhancement instead has three ordered sources: a user-selected executable, a pinned managed Tectonic runtime, and a discovered system `tectonic` or `pdflatex`. Installation is an explicit user action in the CircuitikZ environment panel or command palette; ordinary preview, SVG, PNG, and preview-PDF export remain available without it.

The managed path pins Tectonic `0.16.9`, validates every redirect against an HTTPS host allowlist, bounds the download, verifies SHA-256, rejects unsafe archive paths and links, smoke-compiles six deterministic CircuitikZ fixtures in staging, and atomically activates the version. Cancellation, timeout, checksum failure, smoke failure, and write failure clean staging and preserve the previous active runtime. Desktop commands use argument arrays with `shell: false`, untrusted/no-shell-escape flags, bounded logs, timeout handling, and process-tree termination.

Managed-runtime discovery is now read-only. Mutating pointer recovery, legacy pointer ownership registration, activation, and removal execute under the filesystem lock. Existing same-byte directories are not adopted unless a valid Notemd pointer or install-local manifest proves ownership and the regular executable satisfies digest and POSIX execute checks. The environment panel also exposes explicit stale-lock recovery; it uses an exclusive contender claim plus stable-token and dead-owner rechecks, and preserves a replacement owner observed during cleanup.

The final ownership review closed two deletion races. Existing executable and install paths now have to remain inside the runtime root after canonical `realpath` resolution, so a symlink or Windows junction cannot redirect removal into an external user directory. Stale-lock cleanup now atomically moves the claimed directory to a token-qualified quarantine, then revalidates the owner, claim token, and dead-process state before deletion; a replacement arriving at the final commit boundary is not deleted.

The history-scroll failure was not caused by pagination or the history store. The right drawer was a Grid item whose default `min-height: auto` expanded its row to the full history content while the surrounding layer clipped overflow. The drawer now sets `min-height: 0`; its body owns `overflow: auto` and `overscroll-behavior: contain`. A CSS contract test locks this invariant.

## Website MDX Decision

The website currently has 21 canonical English MDX pages and 33 published locale mirrors, for 693 localized MDX files. Repository tests require every published locale to mirror the English route set, and Docusaurus consumes these files as tracked publication inputs. Deleting them or stopping synchronization now would break localized routes and the release contract.

Therefore:

- keep the existing MDX mirrors tracked until a separate build-time locale generation design replaces the current contract;
- update only canonical English and intentionally maintained locale pages when behavior changes;
- do not mechanically rewrite all locale mirrors for a small UI wording change;
- keep maintainer architecture and diagnostic detail under `docs/maintainer/`, while the public diagram page contains only concepts, steps, limitations, and troubleshooting.

The English and Simplified-Chinese public diagram pages now explain the optional managed environment in user terms only. The root README setting guide is synchronized across every supported README language; LM Studio `hy-mt2-7b` was used only for those documentation translations.

## Verification

- command-host target propagation has direct regression coverage;
- maintainer CLI schema, help, bridge, and examples expose `requestedRenderTarget`;
- raw CircuitikZ response fallback has regression coverage;
- prompt coverage verifies circuit-only structured generation;
- website documentation contracts verify concise English and Simplified-Chinese guidance.
- the bounded repair loop has positive and negative coverage for topology, parsing, second-pass acceptance, and renderer availability;
- the common-source golden template uses separated paths, lighter strokes, smaller text, and no redundant source label.
- environment tests cover compiler ordering, custom/system/managed discovery, mobile fail-closed behavior, pinned artifact metadata, secure download/extraction, cancellation cleanup, golden-fixture acceptance, and modal state rendering;
- managed-runtime regressions cover unowned same-byte preservation, POSIX execute permission, legacy pointer migration, read-only recovery interleavings, explicit stale-lock recovery and replacement preservation, exact removal ownership, and non-fatal post-commit cleanup diagnostics;
- final security regressions prove that a linked runtime ancestor cannot authorize deletion of an external user directory and that a replacement lock swapped in immediately before cleanup commit survives;
- the history drawer CSS contract verifies the Grid item and scroll body minimum-size/overflow invariants;
- all root README languages now document settings discovery, Vault-scoped history, safe batch-folder confirmation, and the optional CircuitikZ native environment;
- the maintainer CLI helper now prefers a compatible `obsidian-cli native eval` wrapper but falls back to official `obsidian eval` when the wrapper is absent; the real Study Vault read-only `local-knowledge.inspect` invocation completed through that fallback;
- TeX Live 2023 compiled the common-source output with zero errors and zero warnings, and the rasterized PDF showed a tight canvas with legible, non-overlapping labels;
- the final deployed Study Vault reports managed Tectonic 0.16.9 ready, registers all six diagram commands, and opens the common-source wrapper as `Circuitikz` preview without any popup or notice;
- the preview's right history drawer measures 671 px client height and 1,139 px scroll height, reaches the 468 px bottom offset, and keeps the pager visible; the standalone history view also owns vertical overflow;
- the strict frontend-law audit scores 100/100 with no failed or unknown principle, while the optional `dev:errors` and error-level `dev:console` host commands are recorded as unavailable because they returned exit code 1 without output;
- the final production build, 233-suite Jest run (1,977 passed, one POSIX-only test skipped on Windows), i18n audit, render-host audit, VitePress build, 34-locale Docusaurus build, website build audit, and independent Critical/Important review all pass.
