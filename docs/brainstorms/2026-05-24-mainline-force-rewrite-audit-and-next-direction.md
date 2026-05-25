---
date: 2026-05-24
last_updated: 2026-05-25
topic: mainline-force-rewrite-audit-and-next-direction
---

# Mainline Force-Rewrite Audit And Next Direction

## 1. Scope And Baseline

This audit exists because the repository changed shape materially on 2026-05-24:

1. `git fetch origin` showed a forced update on `origin/main`;
2. the live remote mainline no longer matched the richer local branch state developed earlier;
3. continuing to describe the later branch state as “current main” would now be inaccurate.

This document compares:

1. current rewritten `origin/main`;
2. prior active planning documents;
3. local audit-only evidence from `backup/main-before-origin-force-20260524`.

Core rule:

- live `origin/main` defines shipped truth;
- backup-branch evidence only defines reintegration opportunities.

## 2. Current Code Truth Snapshot

### 2.1 Packaging / runtime truth

Current `origin/main` still proves a single-entry packaging boundary:

1. `esbuild.config.mjs` builds only `main.js`;
2. `IframeRenderHost` consumes inline `htmlSrcdoc`;
3. `scripts/audit-render-host-bundle.js` audits bundled `main.js` markers rather than a detached runtime asset;
4. maintainer docs continue to describe `main.js + inline srcdoc` as the real current boundary.

### 2.2 Current automation / CLI truth

Current mainline still contains useful extracted automation surfaces:

1. provider profile export/import operations;
2. capability manifest export;
3. invocation contract export;
4. registry-backed operation metadata for those surfaces.

However, current mainline does **not** contain the later backup-branch maintainer bridge/help stack:

1. no `scripts/invoke-maintainer-cli-operation.js`;
2. no shared `scripts/lib/maintainer-cli-operation-help.js`;
3. no current-main tests for later bridge/public-surface hardening such as `cliPublicSurface`, `invokeMaintainerCliOperationScript`, or `repoSagaExecutionLock`.

### 2.3 Current user-facing truth

Current mainline still retains:

1. preview artifact save/export helpers;
2. welcome-modal release digest;
3. provider diagnostics;
4. canonical diagram wording and current preview path infrastructure.

But later user-facing closure from the backup branch is not currently proven on rewritten main:

1. settings reset;
2. concept-note path guard modal;
3. file-selection profiles and folder-task filter UX;
4. local-KB retrieval;
5. chapter split;
6. sidebar API liveness/activity hardening beyond the current live branch.

### 2.4 Clean-state truth

The rewritten mainline also exposed a real hygiene gap:

1. local generated vault artifacts in `docs/` were not ignored;
2. a root-level `render-host.mjs` build artifact from earlier work could dirty the repo;
3. that meant local verification could end in a misleading non-clean state even when the code diff itself was correct.

## 3. Deep Comparison Against Prior Plan Requirements

### 3.1 Against the packaging / semantic track

What still matches current code:

1. packaging-boundary honesty;
2. helper-driven anti-drift verification;
3. maintainer-doc alignment with current code truth.

What no longer matches current code:

1. later documentation that assumed a shipped `render-host.mjs` lane;
2. later Stage-C wording that assumed dedicated runtime assets still existed on main.

Conclusion:

- the packaging / semantic track remains live, but its current truth is narrower again.

### 3.2 Against the CLI-next-phase planning track

What still matches current code:

1. extracted operation contracts matter more than command-count growth;
2. capability/export/config surfaces are legitimate current-main automation seams.

What no longer matches current code:

1. later bounded maintainer-bridge work is absent from rewritten main;
2. later public-safe wording and help-truth closure are absent from rewritten main.

Conclusion:

- current main can still support bounded automation work, but it must not inherit the later maintainer-bridge claims for free.

### 3.3 Against the local-KB / chapter-split task PRD

The PRD and backup branch prove real later work happened, but current rewritten main does not carry it:

1. missing tests: `chapterSplit`, `localKnowledgeBase`, `localKnowledgeTaskIntegration`, `folderTaskFileSelector`, `settingsReset`;
2. missing follow-through docs: the earlier unified matrix and 05-13/05-20 progress surfaces were not present on rewritten main;
3. current main therefore cannot honestly be described as already shipping those product capabilities.

Conclusion:

- these features should be treated as reintegration candidates, not current-main completion.

## 4. Architecture Advancement Assessment

### 4.1 What current main has genuinely advanced

1. packaging/semantic contract honesty;
2. registry-backed export/config automation seams;
3. release-digest/onboarding continuity;
4. preview artifact handling and current inline preview host flow.

### 4.2 What current main has not preserved

1. later dedicated runtime-asset work;
2. later maintainer-bridge/public-surface hardening;
3. later product-facing retrieval/splitting/profile slices;
4. later repo-saga serial anti-error enforcement.

### 4.3 Correct interpretation

The rewritten mainline is not “broken,” but it is a **rollback in breadth** relative to the local backup branch. That means the right next move is not to pretend the lost breadth is still shipped. The right next move is:

1. restore current-main truth in docs;
2. restore clean-state guardrails;
3. then choose reintegration lanes deliberately.

## 5. Concrete Next Direction

### Priority 0: current-main truth repair

1. keep the packaging progress doc aligned to single-entry `srcdoc` truth;
2. add a unified follow-through matrix that distinguishes live main from backup-branch evidence;
3. stop citing missing current-main files as if they still define the live roadmap state.

### Priority 0: clean-state closure

1. ignore generated vault/runtime artifacts;
2. end every verification batch with clean status proof;
3. keep the clean-state rule documented so local testing does not masquerade as product regressions.

### Priority 1: bounded reintegration planning

1. decide whether the next reintegration slice is packaging/runtime follow-through, CLI/maintainer-surface hardening, or product-surface recovery;
2. keep each reintegration slice narrow enough that code/tests/docs can move together;
3. do not merge backup-branch claims wholesale without re-verifying them on rewritten main.

### Priority 2: later product-surface recovery

If the user still wants the later product features back on main, recover them in bounded order:

1. clean-state + repo-saga/release guardrails;
2. CLI/help/public-surface truth;
3. settings/sidebar guardrails;
4. file-selection/profile control;
5. local-KB retrieval and chapter split.

## 6. Verification Gate

Any batch that changes the current-state interpretation should run:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. final clean `git status --short --branch`

## 7. Conclusion

Current rewritten `main` is still coherent, but only if we describe it accurately:

1. it currently ships the single-entry packaging / semantic lane;
2. it does not currently ship the later backup-branch breadth;
3. the next-level move is disciplined reintegration, not narrative drift.

## 8. Incremental Recovery Update (2026-05-25)

This section does **not** replace the 2026-05-24 baseline above. It records what has since been re-landed on current main.

### 8.1 Product slices now re-proved on current main

The following items should no longer be described as “missing on current main”:

1. settings reset (`complete` + `partial` while preserving provider settings where intended);
2. concept-note prerequisite guidance modal for concept-generating flows;
3. concept synonym-suppression toggle for add-links / extract-concepts prompts;
4. file-selection profiles plus folder-task regex/glob filtering with `relativePath` / `basename` targets and explicit subfolder-scope control;
5. local knowledge retrieval for `Batch generate from titles`, `Research & Summarize`, and `Generate diagram`;
6. chapter split with heading-based output, TOC generation, and stale-file cleanup;
7. saved-artifact-aware diagram preview recovery for Mermaid, Vega-Lite, JSON Canvas, and HTML artifacts.

### 8.2 Automation / maintainership slices now re-proved on current main

The following bounded automation work is also now present again on current main:

1. redacted provider export plus public-safe CLI surface export;
2. repo-local maintainer help/invoke scripts for bounded path-based operations (`content.batch-generate-from-titles`, `content.split-note-by-chapters`, `research.summarize-topic`, `diagram.generate`) plus export operations;
3. repo-saga serial execution lock, associated tests, and maintainer-doc guidance.

### 8.3 Revised interpretation after recovery

The accurate post-recovery interpretation is now:

1. the 2026-05-24 audit remains valid as a baseline snapshot of the force-rewritten branch at that time;
2. current main has since regained a bounded but meaningful subset of the backup-branch breadth;
3. release-facing version truth is again synchronized at `1.8.9` across package metadata, welcome digest, and the README family;
4. source-level render-host runtime candidates have reappeared, but build/audit truth still proves `main.js`-only shipping;
5. it is still inaccurate to overclaim dedicated runtime assets or an unbounded maintainer mutation surface.

This changes the correct next move slightly:

1. recovery work is no longer mainly about “prove the missing product slice exists”;
2. the next-level question is whether to keep the runtime-candidate source tree explicitly dormant or promote it into a real packaged boundary;
3. in parallel, the maintainer helper must not be confused with a widened public CLI surface.
