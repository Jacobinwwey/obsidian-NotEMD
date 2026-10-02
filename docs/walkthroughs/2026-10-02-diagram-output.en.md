# Diagram output implementation and validation

[中文](2026-10-02-diagram-output.zh-CN.md)

Status: implementation and local acceptance complete. Base commit: `eebf4fb1da8b872e40a0b996314461954b8762b9`. This is an unreleased mainline change; the published 1.9.8 tag and assets are unchanged. Match the delivery commit to its [Verify plugin workflow](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/workflows/verify-plugin.yml) for remote Linux/Windows acceptance.

## Delivered behavior

The diagram preference planner owns capability resolution and selection precedence. Settings and Workbench share its selector. Requested outputs remain persisted when inactive; supported choices appear first and the latest explicit choice coordinates type/output compatibility. There is no reset/exit requirement. Presentation export keeps independent configuration, dependencies and execution.

`html-diagram` delivers a zoomable graphic preview; `html-summary` delivers structure and evidence from the same specification. Neither label promises an embedded native editor. Source formats retain their own editing applications. Each batch selects one native renderer plus compatible derivatives; additional native requests stay visible as inactive.

The export run stores one specification, artifact, companions, requested/effective outputs, cached SVG/summary and per-file SHA-256 receipts. New files are verified before publication. Partial failure/cancellation retains successful outputs; retry skips them after integrity checks and needs no LLM. Preview and history show paths, inactive outputs, fallback and partial status. The CLI returns the same contract.

## Changed boundaries

- `src/diagram/diagramOutputPreferences.ts`: versioned migration, selection transitions and effective plans.
- `src/ui/diagramOutputSelector.ts`: shared supported-first control, current-settings reads, focus preservation and serialized persistence.
- `src/diagram/diagramExportRun.ts`: durable batches, verified file publication, caching, cancellation and recovery.
- `src/operations/diagramCommandExecution.ts`, host adapter, generation input and `src/main.ts`: snapshot requests, execute/reopen/retry runs, share the history write queue.
- Preview/history UI and the maintainer CLI schemas expose actual delivery state. English, Simplified Chinese and Traditional Chinese strings describe the same behavior.
- The response parser normalizes quoted evidence at its boundary; the Nested Scope prompt supplies the levels contract and the summary renderer includes those levels.

## Verification

Repository commands, all prefixed with `rtk` on this Windows host:

```powershell
rtk proxy npm.cmd test -- --runInBand src/tests/diagramOutputPreferences.test.ts src/tests/diagramOutputSelector.playwright.test.ts src/tests/diagramExportRun.test.ts src/tests/diagramPreviewModal.test.ts
rtk proxy npm.cmd test -- --runInBand --json --outputFile=.cache/diagram-output-jest-final.json
rtk proxy npm.cmd run build
rtk proxy npm.cmd run lint:regressions -- --base-ref origin/main
rtk proxy npm.cmd run audit:i18n-ui
rtk proxy npm.cmd run audit:render-host
rtk git diff --check
```

Focused boundary regression: 103 tests passed. Coverage includes unknown-version field preservation, delayed/failed rapid saves, settings-object replacement, native-companion cancellation/recovery, edited output/manifest protection, and successful exports surviving a history-index failure. Final full suite: **294 suites passed; 2818 tests passed, 1 skipped, 0 failed; 557.739 seconds**. Build, UI-string audit, render-host audit, lint ratchet (40 changed TypeScript files, zero regressions against the base commit) and diff whitespace checks passed. CLI documentation/help alignment was also checked after the final help-metadata update. Remote CI remains the independent cross-platform integration gate.

## Real Obsidian evidence

The standalone `obsidian-cli` executable is unavailable on this machine. The official `C:/Program Files/Obsidian/Obsidian.com` CLI executed against the open `1Knowledge` vault via the existing CLI bridge. No computer-use automation was used. The latest compiled plugin was loaded before final recovery/history verification.

Scratch evidence is under `.cache/diagram-output-live-20261002/`; no credentials or original settings snapshots are committed. The following scripts ran through the CLI:

```powershell
rtk proxy node .cache/diagram-output-live-20261002/final-host-verification.cjs
rtk proxy node .cache/diagram-output-live-20261002/verify-settings.cjs
rtk proxy node .cache/diagram-output-live-20261002/restore-user-settings.cjs
```

- Drawnix batch `5a9792d8-05f6-4f9d-adec-634dee23dabe`: native Drawnix, diagram HTML, SVG, PNG and PDF all completed.
- Nested Scope batch `ddd0cd5e-531e-4c3f-8285-b413b13dd515`: diagram HTML, structured summary HTML and SVG completed. The overall status deliberately remains `partial` because `source:drawnix` is retained as incompatible.
- Both batches live under `Notemd Verification/diagram-output-20261002/` in the vault. Final recovery reopened history previews, exposed all successful file links, made zero provider lookups and left every successful delivery's hash unchanged.
- Live DOM settings checks passed for both selection directions, visible inactive requests, supported-first ordering, multi-selection save/reload and unchanged presentation settings.
- Earlier checks of these same outputs verified offline HTML zoom/fit and Unicode without script errors. PDFium extracted 286 characters, including 193 Han characters and zero replacement characters, from the one-page Drawnix PDF. These checks are not a universal font or native-editor guarantee.
- The two original `full_processed*.md` inputs were preserved. Final user `data.json` was restored byte-for-byte after checking that only verification history and the new empty preference field differed; original history and unrelated settings are preserved. The current development bundle and generated examples remain installed/on disk.

## Limits and rollout

Unavailable dependencies do not erase successful exports; if no requested output succeeds, the executor attempts the effective renderer's default source and reports the failed requests. This cannot guarantee delivery when the vault itself is unwritable. Unknown preference schema versions remain preserved and unexecuted, with a visible warning and default route. Manifest updates use the Obsidian adapter's serialized compare/update contract, not a filesystem-wide transaction or power-loss guarantee.

Release the complete selector/planner/executor/recovery path together. Do not publish a selector that implies unsupported conversions or treat partial status as success. Preserve one native renderer per batch unless future cross-renderer semantic equivalence is independently specified and tested. Integration targets remote `main` after verification; no release/tag mutation is part of this work.
