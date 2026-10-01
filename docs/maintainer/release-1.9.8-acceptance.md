# Release 1.9.8 Acceptance

Language: **English** | [简体中文](./release-1.9.8-acceptance.zh-CN.md)

## Candidate status

Local candidate acceptance completed on 2026-10-01. Remote Linux/Windows Node 20 CI, mainline integration, public Release, chronicle refresh and live Pages verification remain pending. This record does not treat local checks as public delivery.

The [candidate receipt](./evidence/2026-10-01/candidate.json) retains asset hashes, test totals and log hashes. Its [source manifest](./evidence/2026-10-01/candidate-source-hashes.json) identifies the verified working files; a null hash denotes a removed file. The public binary must come from the clean Linux Node 20 release workflow, so its hash is verified separately from the Windows build used below.

## Local gates

| Gate | Evidence |
|---|---|
| Plugin | Fresh typecheck/build; 289 Jest suites, 2703 passing tests, zero failures and one POSIX-only skip on Windows; UI strings, render-host packaging and lint regression checks passed |
| Website | Node 24.14.0 build and strict audit passed for 24 English documents plus 792 authored translations; all 34 homepage/navigation sets present |
| Keyboard and accessibility | [816 scenarios](./evidence/2026-10-01/website-navigation.json), eight destinations at 390/768/1440 px per locale, zero failures; real bounded Tab traversal, keyboard Enter, overflow, serious/critical axe, visible header paint and RTL identifier glyph order checked |
| Documentation | 31 README fronts and affected instructions completed; 155 focused tests and 464 authored-clause checks passed; paired-document contracts, VitePress build and both diagram archive checks passed |
| Native exports | Ten-slide PowerPoint export and unchanged visual-match gate passed; six CircuitikZ golden fixtures and five orientation variants compiled successfully |

Representative final [Chinese homepage](./evidence/2026-10-01/zh-CN-390-home.png) and [Persian Agent guide](./evidence/2026-10-01/fa-390-agents.png) were visually inspected. Earlier browser runs using forced focus are historical layout evidence only; the final receipt uses actual Tab navigation. Translations were authored/reviewed with Codex, without translation endpoints; this is not independent native-human review.

Negative coverage rejects wrong release versions, absent assets/locales, broken audience links, stale default-workflow claims, unsafe public-CLI claims, prevented Tab, focus cycles and unbounded changing focus. These are included in the passing Jest gates; native negative results are retained below.

## Obsidian CLI in 1Knowledge

The user explicitly selected the already-open `1Knowledge` Vault and CLI-only execution. Official `Obsidian.com` commands executed against Obsidian 1.13.7 / Electron 39.8.3 / Chromium 142 on Windows. The separate `obsidian-cli` executable was unavailable. Only uniquely named fixture directories were used; the user's Vault was never marked disposable. Settings backups remain private and are excluded from tracked evidence.

- [Host receipt](./evidence/2026-10-01/obsidian-host.json): two concurrent loopback requests cancelled in 44 ms, no generated/moved files, zero active tasks, delayed responses did not mutate source; external edits and recovery preimages survived, and the next save succeeded. Five Mermaid/Vega/Drawnix previews passed.
- [Workflow receipt](./evidence/2026-10-01/obsidian-workflow.json): the real default `One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix` executed with two local fixture model calls. Source was unchanged, the processed wikilink copy and generated `concepts_complete` note were correct. All four registered public export callbacks executed and the redacted export omitted the fixture key. Original settings were restored and the plugin was idle.
- [Persistence receipt](./evidence/2026-10-01/obsidian-persistence.json): atomic/legacy/binary write-move and compensation move/replacement races rejected unsafe writes, preserved moved content/recovery preimages and left the queue usable. Settings bytes were unchanged.
- F19: native Escape initially closed both the history drawer and its parent preview ([failure](./evidence/2026-10-01/obsidian-keyboard-before.json)). Obsidian handles its keyboard scope before DOM bubbling; the DOM-only test missed this. The drawer now owns an independent `Scope` while open and releases it on close/destroy. The new Chromium regression failed before the fix and passed after it; eleven keyboard tests now pass.
- [Native keyboard recheck](./evidence/2026-10-01/obsidian-keyboard-after.json): consecutive `abc`, twelve Tab presses, Escape closing only history with trigger focus restored, and a second Escape closing the preview all passed using CLI `dev:cdp` input events. [Reload receipt](./evidence/2026-10-01/obsidian-installed-candidate.json) verifies the fixed installed bundle and unchanged settings bytes.

The host/workflow probes preceded the isolated F19 fix and used bundle `dbccc6d3…`; persistence and native keyboard rechecks used `3cb3b066…`. Full build/Jest/lint/audits passed after that fix. Activation p95 was 549.8 ms in the populated user Vault; it is not comparable to an empty disposable-Vault budget. Heap samples were not forced-GC retention proof. The separate frozen retrieval benchmark measured 12 files/16 sections, build p95 1.453 ms and Top-3 query p95 0.119 ms; these observations do not promise arbitrary-Vault performance.

## Native consumer results

[PowerPoint 16.0 build 14332](./evidence/2026-10-01/office-export.json) passed complete export and visual comparison. The first run exported successfully but reported an unavailable Slidev probe; a fresh full rerun detected Slidev 52.16.0 and passed without changing thresholds. The [editable export](./evidence/2026-10-01/office-export.pptx) and [saved/reopened file](./evidence/2026-10-01/office-roundtrip.pptx) are retained. [Roundtrip evidence](./evidence/2026-10-01/office-roundtrip.json) confirms one edited cell, ten slides, two native tables and six CJK table cells before/after. The merged separator passed on both [exported](./evidence/2026-10-01/office-border.json) and [reopened](./evidence/2026-10-01/office-reopened-border.json) files. The historical broken file was [rejected again](./evidence/2026-10-01/office-before-negative.json) for missing/mixed separator paint.

[Six CircuitikZ templates](./evidence/2026-10-01/circuitikz-golden.json) and [five orientation variants](./evidence/2026-10-01/circuitikz-orientations.json) compiled into nonempty PDFs with the cached Tectonic executable. Orientation variants preserved topology and used offline/untrusted compilation. Windows emitted a Fontconfig configuration warning; successful compilation does not imply a warning-free environment.

## Release ledger and remaining delivery

The [plan ledger](../plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.en.md#every-commit-since-197) accounts for all fourteen commits from `1.9.7` to `291ea45`, including merges. `71a1f32` subsequently added strict candidate provenance, draft/download-hash checks and a reproducible release workflow. The current candidate adds final-I/O cancellation checks, translation directory-race handling, history keyboard/focus fixes, source-owned release facts, audience routes, all locale/README authoring and strict website/publication gates. Merge records do not add duplicate feature claims.

Remote candidate identities, successful Linux/Windows run URLs, numeric tag, public four-asset hashes, chronicle commit and deployed revision will be added after their actual execution. V5/V6 remain open until those checks pass.

## Limits

Physical mobile and Obsidian 0.15.0 remain unverified. Drawnix attached cross-branch arrows remain unsupported after rearrangement. PPTX can retain Mermaid/SVG image fallback. Frozen lexical Top-3 positive recall is 7/9 and is not semantic-search evidence. Cancellation does not promise rollback or upstream billing cancellation. Search indexing/citations have not been measured and are not a release gate.
