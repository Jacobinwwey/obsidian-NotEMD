# Diagram preview compatibility and Archify follow-through

[简体中文](./2026-10-18-diagram-preview-and-archify-follow-through.zh-CN.md)

## Scope and recovered checkpoint

Continue session `01a10926-6bdc-7691-a4f5-5a14c40900fe` from its last completed work, not an earlier PDF/export checkpoint. The session ended after the 1.9.14 release, native PDF acceptance, public-asset installation and Pages verification. The checkout starts at `84338108`. The new screenshot request had not been implemented.

Previously completed modules include `src/ui/DiagramPreviewViewport.ts`, `src/ui/PdfPreviewDetailRenderer.ts`, `src/ui/DiagramPreviewModal.ts`, `src/ui/BinaryDiagramPreviewModal.ts` and multi-format export selection. Relevant recorded commits are `4252fe94` (1.9.13 reliability), `11884b12` (1.9.14 PDF/detail and export work) and `84338108` (native acceptance documentation). Their file lists are available through `git show --stat <commit>`; this is not a claim that every historical repository edit belongs to this session.

Historical verification included `npm run build`, `npm test -- --runInBand`, lint regression checks, UI/render-host audits, official Obsidian CLI probes, four-asset release hash verification and Pages checks. Those results remain historical evidence and are not substituted for fresh acceptance. See [the native acceptance record](../maintainer/2026-10-07-pdf-preview-native-acceptance.md).

## Execution phases

| Phase | Complete operation | Acceptance |
| --- | --- | --- |
| P0 | Back up and recover the anomalous local test; establish current host and plugin identity | Restored test matches HEAD; build succeeds; no unexplained source drift |
| P1 | Correct presentation-clearance coordinate ownership without weakening SVG sanitization or collision gates | Observe failing regressions before the repair; unit and browser scale tests pass afterward |
| P2 | Validate the production build and the actual Vault consumer | Full Jest, lint ratchet, UI/render-host audits, installed-file hashes and live catalog previews; settings and existing files preserved |
| P3 | Compare the pinned fresh Archify checkout with existing NoteMD capabilities | Bilingual, source-located recommendations; distinguish implemented work, proposed work and unproven behavior |

P3 is a research/design deliverable, not authorization to import Archify's ten renderers or claim all future roadmap features are implemented. No release, tag, commit or push is part of this batch.

## Diagnosis and minimal repair

The live host reports Obsidian 1.14.4 and NoteMD 1.9.14. The separate `obsidian-cli` executable is unavailable; the official `Obsidian.com` CLI works. A standalone `require('obsidian')` inside CLI eval is not available, so host identity comes from CLI `version`, not from that module or the installer user-agent.

The selected Drawnix example successfully generated a 32,529-character SVG. Failure happened after mounting, in `collectSvgPresentationDiagnostics()`: the document title and summary had about 0.483 CSS pixels of actual vertical separation at a roughly 0.16 display scale. The checker compared screen-space DOM rectangles with unscaled 0.5-unit label margins, making a valid small preview fail. The evidence does not establish that the host upgrade caused the bug.

The repair keeps DOM geometry in screen space and projects the source-SVG clearance through `getScreenCTM()`. Horizontal and vertical margins use the corresponding absolute matrix-row sums. This handles uniform/non-uniform scaling and reflected axes without hard-coding Drawnix, a host version, a thumbnail width or an alternative validation mode. Untransformed test doubles retain identity scaling. Actual label intersection and later-painted shape occlusion remain errors. This does not turn axis-aligned bounding-box checks into exact rotated-glyph intersection tests.

Complexity remains `O(T² + T·S)` for T text elements and S shapes, with linear collected geometry storage. This bounded change does not introduce a new layout engine or spatial index.

## Local anomaly recovery

Before recovery, `src/tests/diagramHistoryRepository.test.ts` contained truncated output-selector UI code rather than its tracked tests. Git's ordinary status did not report that discrepancy. The file was copied to `.cache/preview-20261018/diagramHistoryRepository.test.before-recovery.ts` before restoring HEAD content with a patch. The mechanism of the unexpected local overwrite is not established; it is not attributed to Obsidian or this SVG defect.

An additional content audit compares tracked source/build-support files against index blobs instead of trusting only stat-based status. Existing line-ending differences are classified separately and are not rewritten. The recovery is local baseline repair, not an intentional change to history behavior.

## Safety constraints

- Use only CLI for the live application; no computer-use or desktop input automation.
- Prefer E:; C: access is limited to required installed tools and historical session evidence.
- Preserve original notes, existing artifacts, API configuration and exact persisted settings bytes. Back up installed plugin files before replacing the local candidate.
- Use catalog fixtures; do not call an LLM or translation API for verification.
- Keep SVG security, independent zoom, PPI and established export/recovery paths unchanged.
- Do not replace published assets, embed the full upstream Viewer or add fixed relationship quotas.

## Verification and final status

Fresh command results and live evidence are recorded in the paired [acceptance and reference report](../maintainer/2026-10-18-diagram-preview-and-archify.md). Phases are only complete when their actual results are available; future enhancement recommendations remain separate from this repair.

P0 and P1 are implemented; P3 research is delivered. P2 execution reached all 33 production native examples successfully and completed full Jest, but its overall acceptance is not green: the full suite had two failing suites, the isolated retry still failed the release-publisher fixture, and the earliest settings hash cannot be certified unchanged across the whole interactive session. The corrected matrix itself preserved both in-memory and persisted settings. All 67 original Vault-root files match their initial hashes. These limitations are retained in the report; no unrelated implementation or current user configuration was overwritten.
