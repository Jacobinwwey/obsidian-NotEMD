# Reading-first corrections for cases 4, 6 and 7

[中文](./2026-10-18-diagram-reading-density.zh-CN.md)

## Root cause and correction

The previous acceptance confused source-identity recovery and exportability with improved readability. They are separate properties. Retaining distinct identities remains required; extra visual structure must be justified by the reader’s task, not assumed to be an improvement. The latest user choice to retain Case 4 takes precedence over the initial simplification proposal.

- Case 4: the user explicitly requested the reviewed presentation remain unchanged. Restore default mirrored bottom actors for every sequence, while retaining the already completed distinct-identity repair and original messages. The proposed footer simplification is withdrawn.
- Case 6: cyclic peers share a level, rather than implying a false parent/child order. Adjacent reciprocal relations use short opposing arrows. The canvas follows content; the non-tree caveat is a secondary caption. All source nodes and edges remain.
- Case 7: missing endpoint content remains explicit, not fabricated. One neutral dashed placeholder uses the requested output language. Duplicate bilingual warning text and its reserved header space are removed. Lane height follows title, subtitle, tool and chip content.

The source-structure boundary owns connectivity; the existing reference renderer owns presentation. No new routing framework, configuration mode, dependency or model call was added. Structural/security validation remains; recoverable source caveats never become diagnostic-only images.

## Reviewed-v1 versus revised-v2 evidence

The original gallery is preserved at E:/1Knowledge/Notemd-Acceptance/diagram-recovery-2026-10-18T05-44-23-884Z/index.html. The focused review is E:/1Knowledge/Notemd-Acceptance/reading-first-cases-4-6-7-20261018/index.html. Left panels are the exact previously reviewed after-exports, not Git HEAD. Right panels are the revised exports. Original case numbers 4/6/7 remain visible. Input JSON bytes match in all three pairs; PNG, SVG, source hashes and measurements are in manifest.json.

| Observation, SVG source units | Reviewed v1 | Revised v2 |
|---|---:|---:|
| Case 4 actor boxes | 4 | 4 (unchanged) |
| Case 4 canvas | 450 × 223 | 450 × 223 (unchanged) |
| Case 6 nodes / edges | 3 / 2 | 3 / 2 |
| Case 6 canvas | 1040 × 680 | 686 × 224 |
| Case 6 total relationship route length | 755.67 | 48 |
| Case 7 canvas | 474 × 400 | 474 × 248 |
| Case 7 missing endpoints | 1 | 1 |

Case 4 PNG and SVG hashes match the reviewed version exactly, not just their dimensions. These are fixture measurements, not a claim about arbitrary graphs or human reading speed. Dense nonadjacent cycles can still need a more general routing algorithm. Preserved author-provided bilingual titles are not silently rewritten. The seven-case generator still provides the wider Git-baseline comparison; it is not the v1/v2 evidence above.

## Frontend-law review

- Fast gate: desktop 1440px/mobile 390px targets measure at least 44px. Twenty synthetic click-to-two-frame samples per viewport yield a worst p95 of 29.8ms on this machine. The data is in frontend-evidence.json; unmeasured critical-action placement, closure and validation metrics remain unknown. No overall UX signoff is claimed.
- Occam / Gestalt similarity: redundancy is a review prompt, not authority to override the user. The user chose the familiar Case 4 presentation; keep it. No actor-footer simplification is shipped.
- Continuity / proximity: long orthogonal cycle detours and artificial depth obscure a direct peer relationship; keep peers aligned and routes short.
- Figure-ground / Von Restorff: an orange warning and repeated bilingual caveat dominated the actual handoff; retain one quiet unknown endpoint so the relation remains foreground.
- Priority P1 completed: remove visual redundancy without deleting facts. Recheck by exact input equality, actor/node/edge counts and real-browser text bounds.
- Priority P2 advisory: the comparison page exposes up to nine concurrent visible links/actions in the measured first viewport. The heuristic flags this choice density, but this is not evidence that the three exported diagrams are harder to read. Do not add more controls to the diagrams to address it.
- Recheck: inspect native-size PNG/SVG, whole-fit and keyboard/Escape/focus behavior at 1440px/390px. Human comprehension, user completion time and generation latency remain unknown; the auditor's default example scores were cleared before actual evidence was inserted.

## Verification and deployment

Fresh TypeScript/esbuild build, 51-file lint ratchet (zero regressions), UI-string/render-host audits and diff hygiene passed. The complete discovered inventory ran: 330 suites, 329 passed, one failed; 3175 tests passed, four failed and one skipped. Every diagram suite passed. The unchanged githubReleaseWorkflow.test.ts publisher fixture failed at its child-process boundary (null status under a 20-second spawn budget) and reported EBUSY cleanup errors. An isolated, unchanged rerun also failed: 39 passed and six failed. Reports: .cache/reading-density-final-tests.json and .cache/reading-density-release-recheck.json. No release logic, assertions or timeout limits were changed to hide that result; the full run is not green.

The touched ER screenshot suite now uses local 30-second screenshot/cleanup budgets, consistent with its existing Mermaid browser budget. Geometry assertions are unchanged; these are not latency benchmarks. The final Case 4 preservation contract was observed failing before its implementation, then passed with the real Mermaid engine.

This is a local, unreleased 1.9.14 bundle update, not a release qualification. Deployment backs up the three installed assets and current data.json on E:, copies only main.js/styles.css/manifest.json, then verifies asset hashes and unchanged settings bytes. The receipt is deployment.json in the focused acceptance folder. The official CLI could not find a running Obsidian, and obsidian-cli is absent; no native reload or native-host smoke is claimed. The updated files take effect at the next Obsidian startup. No C-drive profile was launched to work around that constraint.

Deployment completed at 2026-10-18 07:34 UTC. The installed three-asset hashes match the repository bundle; verify:vault-bundle passed. Current settings bytes match their pre-deployment backup exactly. The backup path and hashes are in deployment.json.

The fixture cleanup reported these occupied directories under .cache/release-tests: candidate-5botG3, candidate-jCA339, candidate-gxwFxh, candidate-duL4qM and candidate-uSJsmG. No locks were removed or bypassed and no manual recursive cleanup was attempted. The publisher-process test failure remains outside this diagram correction. No commit, release, provider call, dependency upgrade, original-note overwrite or settings-history rewrite occurred.
