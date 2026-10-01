# Release 1.9.8 Acceptance

Language: **English** | [简体中文](./release-1.9.8-acceptance.zh-CN.md)

## Public delivery

V0–V6 are complete. Release [1.9.8](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.8) is public at `4ac48b59e6f95b4cfa737f1c86b542673ecd1e56`. Both candidate Linux/Windows Node 20 jobs and the mainline recheck passed. Four downloaded assets match the publisher's canonical Linux build hashes, and both complete language sections match the tagged notes. Pages [run 36825274177](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36825274177) deployed `31811dffe0c60f70358f504d975ed9fa9ac61497`; 850 live HTML files across 34 locales and 4 discovery files matched that workflow artifact byte for byte. All 102 linked scripts and stylesheets also matched the artifact. The repository homepage and official Obsidian catalog were verified.

The release workflow's first attempt stopped after draft creation; the expected empty draft was subsequently visible. Attempt 2 resumed the same provenance, verified uploaded/downloaded bytes, published and refreshed the chronicle. No tag or public asset was replaced. The normal pre-release Pages run was cancelled; the explicit post-release run is the deployment receipt. The post-release chronicle is `31811dffe0c60f70358f504d975ed9fa9ac61497`; it changes README/SVG documentation and leaves website/runtime sources unchanged.

The official downloaded runtime files were installed in the user-selected 1Knowledge Vault. CLI keyboard and all five persistence races passed again, with original settings bytes preserved. Physical mobile, minimum-host compatibility and the known native-output/retrieval limits below remain qualified.

The [candidate receipt](./evidence/2026-10-01/candidate.json) retains local source hashes and accepted remote identity. [public-release.json](./evidence/2026-10-01/public-release.json) owns the public asset hashes.

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

## Release ledger and delivery receipts

The [plan ledger](../plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.en.md#every-commit-since-197) accounts for all fourteen commits from `1.9.7` to `291ea45`, including merges. `71a1f32` subsequently added strict candidate provenance, draft/download-hash checks and a reproducible release workflow. The current candidate adds final-I/O cancellation checks, translation directory-race handling, history keyboard/focus fixes, source-owned release facts, audience routes, all locale/README authoring and strict website/publication gates. Merge records do not add duplicate feature claims.

The complete [16-commit release ledger](./evidence/2026-10-01/release-ledger.json) includes `71a1f32` and `4ac48b5` after the fourteen-commit baseline. [Candidate CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36823159948) passed 289 suites on each platform: Linux 2706 tests; Windows 2705 tests and one POSIX-only skip. The [mainline recheck](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36823959893) also passed. The [Release workflow](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36824052373), [Pages workflow](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36825274177), [live hashes](./evidence/2026-10-01/live-pages.json) and [deployment identity](./evidence/2026-10-01/pages-deployment.json) close V5/V6. The chronological receipts preserve failed preparation and draft-discovery outcomes instead of calling them successful first attempts.

## Limits

Physical mobile and Obsidian 0.15.0 remain unverified. Drawnix attached cross-branch arrows remain unsupported after rearrangement. PPTX can retain Mermaid/SVG image fallback. Frozen lexical Top-3 positive recall is 7/9 and is not semantic-search evidence. Cancellation does not promise rollback or upstream billing cancellation. Search indexing/citations have not been measured and are not a release gate.
