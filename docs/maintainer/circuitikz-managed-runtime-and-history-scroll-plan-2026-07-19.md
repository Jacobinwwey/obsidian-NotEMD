---
date: 2026-07-19
topic: circuitikz-managed-runtime-and-history-scroll-plan
---

# CircuitikZ Managed Runtime And History Scroll Plan

Language: **English** | [简体中文](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.zh-CN.md)

## Decision

Notemd will not embed TeX Live, MiKTeX, TinyTeX, or any executable archive in `main.js`. Diagram generation and companion-SVG preview/export remain dependency-free. Native LaTeX is an explicit desktop-only enhancement for compile diagnostics, native PDF evidence, and the guarded CircuitikZ repair acceptance path.

The first managed runtime is pinned Tectonic `0.16.9`. It is small enough for an optional download, publishes platform-specific release archives with SHA-256 digests, supports an untrusted compilation mode, and can fetch TeX resources on demand. Existing system `tectonic` and `pdflatex` installations remain preferred reusable candidates. MiKTeX and TeX Live are discovered as system environments instead of being bundled.

## User Experience

The experimental diagram settings expose one compact row, **CircuitikZ native compile environment (optional)**, with a button that opens a dedicated environment sheet. The same sheet is available from the command palette.

The sheet must show:

- the selected compiler source, version, executable path, and readiness;
- the difference between dependency-free preview exports and native LaTeX compilation;
- platform, architecture, pinned runtime version, download size, install path, and license link;
- check, install or repair, cancel, retry, remove-managed-runtime, and explicit stale-install-lock recovery actions;
- live download bytes, current phase, bounded logs, and an explicit completion or failure state;
- a capability summary for compile diagnostics, native PDF, and repair acceptance.

Routine failures stay inline. They must not create generic error popups. Installation is always user initiated and never runs in the background without consent.

## Runtime Architecture

```text
settings / command palette
  -> CircuitikzEnvironmentModal
  -> probeCircuitikzEnvironment()
       -> custom executable
       -> managed Tectonic
       -> system Tectonic
       -> system pdflatex
  -> installManagedTectonic()
       -> allowlisted HTTPS redirect chain
       -> size-limited streamed download
       -> SHA-256 verification
       -> traversal-safe executable extraction
       -> staging compile smoke with --untrusted / -no-shell-escape
       -> atomic version activation
  -> fresh environment probe
```

Desktop process execution uses direct argument arrays with `shell: false`, bounded output, timeout handling, cancellation, and process-tree termination. UI code does not assemble arbitrary shell strings.

Managed files live in the operating-system application-data directory by default, not in the Vault. An advanced custom runtime root can move the managed directory to another disk. The Vault stores only preference values; it does not receive `node_modules`, package-manager files, compiler archives, or TeX caches.

## Security And Failure Contracts

- Only pinned assets from approved HTTPS hosts are accepted.
- Redirects are revalidated; compressed size is bounded before and during download.
- Every archive must match its pinned SHA-256 digest.
- Extraction accepts only the expected `tectonic` executable and rejects absolute paths, `..`, symlinks, and hard links.
- Downloads and extraction use sibling staging paths. Cancellation, timeout, checksum mismatch, smoke failure, and write failure remove staging state and preserve the previous active version.
- Runtime discovery is read-only. Pointer normalization and legacy ownership registration run only while holding the managed-runtime lock. Existing directories are reused only when a valid Notemd pointer or install-local ownership manifest proves ownership, the executable digest matches, and POSIX execute permission is present.
- Ownership paths must pass both lexical containment and canonical `realpath` containment. A symlink or Windows junction under the runtime root cannot turn a Notemd pointer into authority to inspect or recursively remove an external user directory.
- Automatic stale-lock deletion is forbidden. The environment panel offers an explicit recovery action that clears a lock only after an exclusive cleanup claim, a stable owner token, and repeated dead-process checks. The claimed directory is atomically renamed to a token-qualified quarantine and revalidated there before deletion; a lock replaced at the final commit boundary is restored or preserved rather than deleted.
- Tectonic uses `--untrusted`; `pdflatex` uses `-no-shell-escape`.
- Smoke compilation uses a deterministic Notemd-owned CircuitikZ fixture, not arbitrary user-provided TeX.
- Mobile keeps the current companion-SVG path and reports native compilation as unsupported without loading desktop process code.

## History Drawer Root Cause And Fix

The drawer is a CSS Grid item. Its default `min-height: auto` expands the implicit grid row to the history content height. The body therefore has no internal overflow, while the layer clips the expanded drawer with `overflow: hidden`.

The root fix is to set `min-height: 0` on `.notemd-diagram-history-drawer`. The existing body `min-height: 0` and `overflow: auto` remain, with `overscroll-behavior: contain` to prevent scroll chaining into the preview. The shared standalone history modal keeps its own scroll model.

## Test Plan

1. Add a failing CSS contract test for the drawer minimum-size invariant, then apply the minimal style fix.
2. Unit-test platform/architecture selection, PATH discovery, compiler preference, capability reporting, and mobile behavior.
3. Unit-test streamed download progress, cancellation, timeout, redirect allowlisting, size limits, checksums, archive traversal rejection, staging cleanup, and atomic activation.
4. Unit-test direct process execution and the exact untrusted/no-shell-escape argument arrays.
5. Use local HTTP fixtures for installer tests; Jest must not depend on public network availability.
6. Test the modal states and settings/command wiring in English and Simplified Chinese.
7. Run the complete plugin build, Jest suite, i18n audit, render-host audit, website build, and documentation contracts.
8. Deploy `main.js`, `manifest.json`, `styles.css`, and `README.md` to the Study Vault, reload Obsidian, verify long-history scrolling and native-LaTeX smoke, confirm that the tested flows create no error popup/notice, and record whether the host exposes the optional developer-console CLI commands.

## Phase Exit Criteria

This work adds Phase F to the CircuitikZ roadmap. Phase F is complete only when the optional environment can be probed from the UI, a supported managed artifact can be installed with integrity verification and cancellation, a real common-source fixture compiles through the selected environment, the history drawer scrolls in the real preview, documentation is synchronized, all gates pass, and `main` is pushed with a clean worktree.

## Implementation Progress

- Complete in code: compiler discovery and preference ordering, ownership-scoped managed installation/removal, read-only recovery discovery, canonical-path containment, token-quarantined stale-lock recovery, six-fixture acceptance, desktop process cancellation/timeout, environment settings and modal, command-palette entry, mobile lazy boundary, history Grid/overflow fix, and regression tests for both linked-ancestor deletion and final-boundary lock replacement.
- Complete in documentation: English/Simplified-Chinese user diagram guidance, every root README language, the CircuitikZ roadmap, this bilingual plan/progress record, and the MDX repository policy analysis.
- Complete in repository verification: production build; 233 Jest suites with 1,977 passing tests and one Windows-skipped POSIX-only process test; i18n and render-host audits; VitePress build; all-34-locale Docusaurus build; `git diff --check`; and a final independent review with no remaining Critical or Important finding.
- Complete in the Study Vault: deployed assets match the repository byte-for-byte; Notemd 1.9.3 and all diagram commands are registered; managed Tectonic 0.16.9 reports ready; the preview history drawer measures 671 px client height versus 1,139 px scroll height, reaches its 468 px bottom offset, and exposes the pager; no popup or notice appeared in the tested flows. The optional `dev:errors` / `dev:console` host commands returned exit code 1 without output, so they are recorded as unavailable host diagnostics rather than treated as proof of a plugin error.
- Frontend-law strict gate: 100/100, zero fast-gate failures, zero principle failures, and zero unknown checks. This mainline commit closes Phase F once push and clean-worktree equality with `origin/main` are confirmed.
