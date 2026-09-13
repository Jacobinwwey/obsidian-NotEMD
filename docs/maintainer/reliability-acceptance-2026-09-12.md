---
date: 2026-09-12
last_updated: 2026-09-13
status: current
plan: ../plans/2026-09-12-mainline-reliability-and-evidence.en.md
---

# Mainline Reliability: Implementation And Acceptance

Language: **English** | [简体中文](./reliability-acceptance-2026-09-12.zh-CN.md)

The [implementation plan](../plans/2026-09-12-mainline-reliability-and-evidence.en.md) follows the `7638cec` audit. This record owns execution evidence. The [initial measurements and hashes](./evidence/2026-09-12/verification.json) identify their measured bundles; the [subsequent U8 record](./evidence/2026-09-13/pptx-collapsed-row-borders.json) identifies the corrected exporter and its new production bundle. Version metadata remains `1.9.7`; this batch does not create a release or tag.

## Disposition

| Unit | Implemented / measured outcome | Acceptance boundary |
|---|---|---|
| U1 | Scheduler settlement, live child cancellation, effective signals through five transports and retries; completed writes retain their count | Real Obsidian cancellation passed; non-abortable `requestUrl` still cannot stop server-side work |
| U2 | Complete output reservation, per-Vault overlap serialization, atomic text compensation, recovery copies and explicit failures | No cross-process/crash transaction promise; retain creations/binaries when ownership cannot be proved |
| U3 | Linux/Windows Node 20 verification and diagnostic-level lint ratchet | Normal PR passed; isolated negative PR failed only the intended assertion on both platforms and was closed unmerged |
| U4 | PNG hashes, canonical SVG text comparison, structural docs tests | Archive integrity is separate from pixel equivalence and consumer acceptance |
| U5 | Named host timing, repeated preview/GC control, desktop/mobile-emulation checks | Keep inline; physical mobile and Obsidian 0.15.0 remain unverified |
| U6 | Drawnix and diagrams.net edit/save/reopen; six compiler fixtures plus five orientation variants | Drawnix node roundtrip passed, attached cross-branch arrows failed; its runtime now reports that limitation |
| U7 | Immutable batch snapshots, removed/moved-file handling, frozen corpus and real Vault timing | Lexical quality has measured misses; this is not semantic-search acceptance |
| U8 | Correct DrawingML ordering, per-edge alpha and both sides of collapsed row separators, including merged headers | Actual PowerPoint edit/save/reopen and native border assertions passed; native fonts are not pixel-identical to Chromium |

## Cancellation And Persistence

`callApiWithRetry` owns or inherits one signal across attempts. It only clears a controller it created. `requestUrl` cancellation settles the logical request and consumes late fulfillment/rejection; desktop HTTP/fetch abort their connection where supported. The scheduler awaits every worker, including cancellation before the first timer. Batch child reporters read live state instead of copying a boolean.

Artifact saves reserve the complete primary/SVG/wrapper/companion path set synchronously. Conflicting saves serialize within one Vault; independent outputs can progress concurrently. Text preimages are captured through `Vault.process`. Compensation changes a file only when its identity and current contents still match this operation. Legacy hosts without that atomic API receive recovery copies instead of unsafe read-then-write rollback.

Path identity is checked inside the host's atomic transform, and after legacy text/binary snapshot reads. Checking before an asynchronous `Vault.process` call was insufficient: a queued callback could act on a renamed/replaced file. Five new red/green cases cover those schedules. All five also passed in real Obsidian on the initial reliability bundle, including recovery-copy contents and subsequent queue usability: [host evidence](./evidence/2026-09-12/obsidian-persistence.json). The separate `verify:obsidian-persistence` probe requires the disposable-Vault marker and performs no window timing measurements.

There is no atomic binary restore or compare-and-delete API. Partial creations and binary outputs are retained and reported; recovery filenames end in `.notemd-recovery-<id>` so Markdown batches do not consume them. Old Drawnix companion folders are retained for inspection: generated names and a manifest do not establish ownership after editor/sync changes. Cancellation is checked again after snapshot reads and before subsequent directory creation.

Real Obsidian 1.13.7, installer 1.12.7, Electron 39.8.3 / Chromium 142.0.7444.265, Windows x64:

- Two concurrent loopback-provider calls cancelled in approximately **5 ms** after the cancellation request; zero generated/moved notes, zero active tasks. Both late responses were subsequently delivered and the source notes remained unchanged.
- An injected wrapper failure preserved an external edit and wrote the recoverable preimage. A later save succeeded, demonstrating that failure did not poison the output queue.
- The official `obsidian` CLI ran successfully. `obsidian-cli` was absent. Long multiline CLI parameters triggered a host JSON parsing error; the committed probe loads a local script through a short expression and fails on missing structured output.

## Verification And CI

The initial completion audit's fresh build and full Jest passed: **282 suites, 2593 tests, 1 skipped**. The skipped case requires POSIX descendant-process termination. Its three changed TypeScript test files add **zero lint regressions** against `090098f`; the earlier 25-file implementation comparison remains in the original evidence. UI-string and render-host audits, 33 gallery fixtures, and 33 archived real-Vault examples passed. The [U8 follow-up receipt](./evidence/2026-09-13/pptx-collapsed-row-borders.json) records a fresh build, **282 suites / 2598 passing tests / one POSIX skip**, zero lint regressions across two TypeScript files, both audits and the VitePress build. Full lint still has historical debt. Bilingual coverage includes untracked repository documents, and the Office fixture has a separate Chinese counterpart.

The workflow uses `npm ci`, Node 20 on Linux and Windows, and installs the browser revisions resolved by both `playwright` 1.61.0 and `playwright-chromium` 1.61.1. It has read-only repository permission, no provider secrets and no publication step. The ratchet matches path/rule/severity/message/column and mapped original line, consumes duplicate diagnostics one-to-one, handles renames and fails closed on tool/configuration failure. Removed debt cannot hide a different new error. Branch protection remains a separate administrative setting.

```bash
npm run build
npm test -- --runInBand
npm run lint:regressions -- --base-ref origin/main
npm run audit:i18n-ui
npm run audit:render-host
npm run benchmark:local-kb
npm run diagram:gallery:check
npm run diagram:examples:check
git diff --check
```

Use `rtk proxy npm.cmd` / `rtk proxy git` on this Windows workstation. The fresh-install CI gate is the cross-platform verification source, not local Node 22 alone.

VitePress 1.6.4 and the 34-locale Docusaurus website build/audit passed. Paired Markdown documents have valid local links and matching plan/finding IDs; the register covers all 19 historical formal plans and 32 brainstorm records. Native evidence downloads are published at their relative URLs with byte equality checked; scoped Git attributes preserve archived bytes across Windows/POSIX checkouts.

The [positive PR run](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/34716224065) verified `805bda2` with **282 suites / 2590 tests on Linux**, and **282 suites / 2589 tests plus one POSIX skip on Windows**; build, audits, lint and diff hygiene all passed. The [negative PR run](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/34716310309) rejected only the deliberate `ciGateNegative` assertion on each platform. [PR 13](https://github.com/Jacobinwwey/obsidian-NotEMD/pull/13) is closed and unmerged; its remote branch was removed. Independent local compiler and lint probes rejected TS2322 and `no-debugger` respectively. The [machine receipt](./evidence/2026-09-12/ci-verification.json) retains revision/job URLs and counts, including the first CI-discovered bilingual-fixture gap and its correction. No gate was weakened to obtain acceptance.

## Completion Audit Against The Original Plan

The [initial completion audit](./evidence/2026-09-12/completion-audit.json) maps every unit to passing tests and retained evidence. It closed two evidence gaps without changing production behavior: same-basename/shared-companion failure schedules in U2, and controlled retained heap plus context-token estimates in U7. Its bundle at `607c35d` was byte-identical to the real-host-tested bundle. The subsequent audit reproduced U8's partial merged-header separator in that accepted PowerPoint file and corrected the DOM exporter. Its new bundle, native negative/positive checks and archived PPTX files are recorded separately; the original host observations are not relabeled as tests of the new bundle.

| Unit | Requirement and evidence | Disposition |
|---|---|---|
| U1 | Scheduler settlement, live child state, five-transport/retry cancellation, cached/late outcomes; loopback and real Obsidian smoke | Verified within the declared cancellation boundary |
| U2 | Both failure orders for distinct notes sharing a basename/output directory; shared companion contention; moved/replaced files, recovery failures and next-save usability | Stateful regressions pass; failed persistence never reaches the completed preview/history handoff |
| U3 | Actual positive/negative Linux/Windows PR runs, compiler/lint rejection and read-only workflow permissions | Verified; the added cost step preserves the existing failure boundary |
| U4 | PNG substitution rejection, normalized SVG checks, bilingual/catalog contracts and archived byte hashes | Verified; structural, visual and application evidence remain separate |
| U5 | Named host activation/preview/GC budget and keep-inline decision | Original timeboxed exit satisfied; physical mobile/0.15.0 remain explicitly unverified |
| U6 | Native edit/save/reopen and pinned compiler/PDFium records | Original target-specific admission completed; failed Drawnix attachment is not promoted |
| U7 | Frozen relevance labels, snapshots, context cost, build/query distributions, real-Vault I/O and GC-controlled retained/released heap | Verified; no tuning to held-out labels |
| U8 | Native table-paint fixes, CJK/missing-font/merge/layer fixture, actual PowerPoint roundtrip, unchanged visible-native gate and explicit merged-border rejection/acceptance | Selected defect family verified; raster equivalence remains unclaimed |

## Host Cost And Packaging Decision

Measured on an i5-12600K with 64 GiB RAM. The initial reliability bundle was **10,059,753 bytes**, gzip **3,730,433 bytes**; the U8 follow-up is **10,060,011 bytes**, gzip **3,730,501 bytes**. Recorded activation is an eight-sample disable/enable measurement in an already running renderer, not complete OS process startup. The performance and persistence observations below retain their original tested bundle hashes; the follow-up changes only table extraction.

| Foreground path | First use (ms) | Warm p50 / p95 (ms), n=8 |
|---|---:|---:|
| Plugin activation | — | 226.7 / 289.3 |
| Mermaid, 5 CJK nodes | 54.8 | 23.4 / 27.4 |
| Mermaid, 40 CJK nodes | 95.8 | 92.1 / 120.0 |
| Vega, 8 CJK categories | 76.4 | 29.1 / 31.0 |
| Vega, 80 CJK categories | 38.5 | 42.8 / 55.2 |
| Drawnix architecture preview | 35.4 | 25.6 / 70.2 |

After a fresh Vault reload and explicit CDP GC, heap was 62.92 MB. After 30 catalog-preview cycles it was 66.30 MB; after another 30, 66.58 MB, with no residual preview modals. Thirty mobile-emulation cycles also completed; emulation is not physical-device evidence. Hidden-window scheduling is excluded from timing acceptance. Repeated development hot reloads retained much more memory and required a full Vault reload; this deserves a separate lifecycle investigation, not an automatic asset-loader rewrite.

**Decision: keep inline.** Use a provisional budget on this named host of activation p95 ≤500 ms, dense preview p95 ≤250 ms and ≤10 MB additional retained heap per 30 warmed preview cycles. Re-measure on lower-powered/physical mobile devices before generalizing. An isolation project must demonstrate a measurable benefit and update packaging/loader/release assets together.

## External Consumers

- **diagrams.net 31.4.5 / Chrome 152.0.7977.83:** imported the production XML exporter result, edited `API Gateway 已验证`, downloaded, reopened, and retained three native vertices and two edges. [Reopened source](./evidence/2026-09-12/native-roundtrip-edited.drawio) and [screenshot](./evidence/2026-09-12/drawio-reopened.png).
- **Drawnix source commit `9939f452745c3f401766d378f98faa5d26bcc48a`, package 0.0.2, Plait 0.93.1:** native node edit/save/reopen retained 38 nodes, 12 semantic relation records and one root. Its application layout detached the fixed-coordinate arrows. `source.id` / `target.id` are Notemd references, not Plait `boundId` handles. The upstream shape-binding contract excludes Mind nodes; substituting field names would not fix this. The renderer exposes `drawnix-static-cross-relations`, and the Plait gate explicitly limits its claim to hierarchy/static-arrow serialization. [Actual reopen screenshot](./evidence/2026-09-12/drawnix-reopened.png) records the failure. Prefer the existing SVG for connectivity; attached editable cross-links require a separately evaluated upstream capability or a different native target.
- **Tectonic 0.16.9**, pinned archive SHA verified; **Circuitikz 1.4.6**, PGF 3.1.9a, LaTeX 2021-11-15 patch 1: six golden templates and five mirrored/same-side variants compiled with `--only-cached`, with unchanged topology signatures. PDFium (`pypdfium2` 5.12.1) review found and led to fixes for NAND/NOR crossed gate wiring and mirrored component text, and transmission-gate S/D/control routing. Initial cold-cache downloads required a separate bootstrap. [Golden-template sheet](./evidence/2026-09-12/circuitikz/compiled-contact-sheet.png), [orientation sheet](./evidence/2026-09-12/circuitikz/orientation-contact-sheet.png), source/PDF/PNG hashes and logs are retained. A Fontconfig configuration warning remained in Windows output; the fonts rendered successfully.

These application checks used generated fixtures in isolated contexts. They do not promote every Drawnix layout, every external application version, or the oldest manifest support declaration.

## Retrieval Quality And Batch Semantics

The frozen corpus contains **13 files / 13 queries**, with synonyms, Chinese compounds, navigation, duplicate titles, long sections, mixed file/folder scopes and no-answer cases. It was authored independently from the earlier fixture; it is synthetic engineering material, not an externally labeled benchmark. Scores were not used to tune the retriever.

| Configuration | Positive-query recall | Macro source precision, abstention=0 | Context characters p50 / p95 | Estimated tokens p50 / p95 |
|---|---:|---:|---:|---:|
| Top-1 | 6/9 (66.7%) | 66.7% | 272 / 566 | 68 / 142 |
| Top-3 | 7/9 (77.8%) | 51.9% | 313 / 1106 | 79 / 277 |

The [full quality report](./evidence/2026-09-12/local-knowledge-held-out.json) uses the existing `estimateTokens()` character-based approximation, not a provider tokenizer or billing count. Corpus identity is normalized UTF-8/LF SHA-256 `d737b72f09bc7008aff3249ceca3bfcdd0218244666fdf3f16eded8a62871e87`; Windows checkout line endings no longer change the identity. Queries/relevance labels and ranking remain unchanged.

The payment synonym and continuous Chinese query miss. Navigation and current-file-exclusion cases can still return unrelated sources. Top-3 improves recall at an explicit precision/context cost. A real Obsidian inspect run performed 65 rebuilds: total p50/p95 **8.6/23.8 ms**, file-read p95 **16.5 ms**, enumeration p95 **0.1 ms**. This small corpus uses a warm OS cache. Normal title batches reuse one retriever; these inspect timings must not be multiplied into the batch query path.

Candidate paths/titles are captured before asynchronous reads. A file moved during its read is omitted; a disappeared file does not discard other knowledge; unrelated I/O errors still propagate. Once built, the batch snapshot retains acquired text even if the Vault changes. A new operation rebuilds it. This is a per-file read snapshot, not an atomic whole-Vault snapshot. Use narrow task scopes now; evaluate CJK tokenization/ranking on a new validation split before considering embeddings.

The [controlled cost report](./evidence/2026-09-12/local-knowledge-cost.json) measures the production retrieval core in a fresh Node 22.19.0 process on the named Windows host. Twelve eligible files produce 16 sections. After 20 warm builds, 50 builds give total p50/p95 **0.376/0.832 ms**; parsing/indexing/bookkeeping p95 is **0.829 ms**, with fixture lookup accounted separately. After warming both Top-K cases, 650 calls each in alternating order give query p50/p95 **0.0505/0.0976 ms** (Top-1) and **0.0511/0.0986 ms** (Top-3). These are in-memory costs, distinct from the real-Vault timings above.

Five baseline/live/released rounds invoke two full GCs after an event-loop turn at each boundary. One live retriever retains a median **205,560 bytes**; 64 simultaneous retrievers retain **201,478 bytes per copy** at the median. Median heap delta after releasing them is **648 bytes** and **4,048 bytes** respectively; the 64-copy release p95 is **97,584 bytes**, retained in the raw report. This measures marginal V8 heap over a shared corpus/module baseline, excluding UI/RSS/disk cache. It neither establishes large-Vault scaling nor proves absence of every leak. CI uploads this measurement without treating hardware-dependent timings as universal pass thresholds.

```bash
npm run evaluate:local-kb
npm run benchmark:local-kb
npm test -- --runInBand src/tests/localKnowledgeSnapshot.test.ts
```

The evaluator's tests assert scope/budget/schema behavior. Its score report can contain poor recall; a passing test is not a search-quality endorsement.

## PowerPoint Fidelity

The [bilingual content fixture](./fixtures/pptx-office-fidelity.md) produced 10 slides, 18 editable text boxes and two native tables. PowerPoint **16.0 build 14332** edited a native cell, saved a separate PPTX, reopened it and rendered all ten slides. The edited cell and all six CJK-bearing table grid cells survived. [Latest roundtrip report](./evidence/2026-09-13/office-roundtrip.json).

The fix family is table paint: DrawingML line properties now precede the fill group, each edge retains its opacity, collapsed row separators reach native cells, and merged continuation cells carry only the external border. Before/after table-slide RMSE improved from **0.192665 to 0.159463**. The repository's existing visible-native profile passed (max 0.25, mean 0.145); the additional raster-strict experiment (0.12/0.08) remains failed. No thresholds were changed. Font shaping, CJK baselines and complex CSS still differ between Chromium and Office; Mermaid/SVG geometry remains explicit image fallback.

The subsequent completion audit found that this aggregate gate had missed a half-width merged-header separator. `pptxDomExtractor.ts` now includes the opposite edge of adjoining rows when resolving collapsed row paint, preserving hidden-edge precedence, equal-width upper-row precedence, rowspan outer boundaries and separate-table behavior. Eight focused cases pass. A native PowerPoint check rejects the archived baseline's mixed/invisible border and accepts the corrected export and reopened PPTX: all three touching edges are visible with color `9CA3AF`, transparency `0.8` and width approximately `0.97827 pt`. The table-slide RMSE remains **0.159463** at reported precision, which demonstrates why this localized contract needs a native assertion in addition to a whole-slide score. [Full receipt and artifact hashes](./evidence/2026-09-13/pptx-collapsed-row-borders.json).

![Before the shared-edge fix: Chromium reference and PowerPoint](./evidence/2026-09-13/office-table-before.png)

![After the shared-edge fix: Chromium reference and PowerPoint](./evidence/2026-09-13/office-table-after.png)

```bash
npm run verify:slidev-export -- --vault docs/maintainer/fixtures --source pptx-office-fidelity.md --format pptx --output-subfolder export --sample-slides all --require-pptx-visual-match --pptx-visual-renderer powerpoint --json
powershell -NoProfile -File scripts/verify-powerpoint-merged-border.ps1 -InputPptx docs/maintainer/evidence/2026-09-13/office-roundtrip.pptx -ReportPath .cache/office-merged-border.json
```

Use a fresh report path for each native-border run. The archived `office-before.pptx` must fail the same check; `office-after.pptx` and `office-roundtrip.pptx` must pass. The read-only probe refuses an existing PowerPoint session and waits for its COM references/process to finish before returning.

Download the [baseline PPTX](./evidence/2026-09-13/office-before.pptx), [corrected export](./evidence/2026-09-13/office-after.pptx) and [saved/reopened PPTX](./evidence/2026-09-13/office-roundtrip.pptx) to rerun the native acceptance independently.

For native editing acceptance on Windows, run `scripts/verify-powerpoint-roundtrip.ps1` with `-InputPptx` and a new `-OutputDirectory`; it refuses an already running PowerPoint session and never overwrites the input. For Obsidian, use `npm run verify:obsidian-host -- --vault <disposable-vault> --cli <obsidian-cli-executable>` after copying the built plugin and creating the explicit marker. No committed gate depends on `.trellis/` or an untracked cache report.

For the focused rename/replacement acceptance, run `npm run verify:obsidian-persistence -- <disposable-vault> <obsidian-cli-executable> <report.json>`. Reload the copied plugin first; bundle hashes must match. This command is independent of foreground-window profiling and restores every injected Vault method and in-memory setting before returning.
