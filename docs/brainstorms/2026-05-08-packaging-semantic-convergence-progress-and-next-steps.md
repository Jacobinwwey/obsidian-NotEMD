---
date: 2026-05-08
last_updated: 2026-06-06
topic: packaging-semantic-convergence-progress-and-next-steps
---

# Packaging / Semantic Convergence Deep Comparison And Next-Step Plan

## 1. Scope And Baseline

This document now has an additional job after the 2026-05-24 remote `main` force rewrite:

1. describe the **current shipped truth on `origin/main`**;
2. prevent older later-branch progress from being misread as still shipped on the rewritten mainline;
3. keep the packaging / semantic-verification lane as the authoritative architecture-critical path.

Primary comparison sources:

1. `.trellis/tasks/05-08-packaging-semantic-verification-convergence/prd.md`
2. `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.*`
4. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*`
5. current code on `origin/main`
6. local audit-only reference branch `backup/main-before-origin-force-20260524`

Working rule:

- **Current shipped truth** comes only from the live rewritten `origin/main`.
- **Backup-branch truth** may guide reintegration planning, but it must not be described as currently shipped code.

## 2. Requirement Mapping Against Current `origin/main`

### PRD R1-R6 Mapping

| Requirement | Current evidence on rewritten `main` | Status | Notes |
|---|---|---|---|
| R1 Preserve architecture truth and avoid overclaiming isolation | `esbuild.config.mjs`, `scripts/audit-render-host-bundle.js`, `docs/maintainer/release-workflow*.md`, `docs/maintainer/diagram-semantic-verification*.md` | Met | Current truth is still single-entry `main.js` with inline `srcdoc`, not a shipped dedicated runtime asset |
| R2 Do not reopen `diagram.generate` / `diagram.preview` / `provider.connection.test` contract depth in this lane | Current semantic changes stay in helper/docs/tests, while operation surfaces remain separately owned | Met | Packaging work remains contract-definition work, not operation-boundary churn |
| R3 Keep a durable packaging-boundary checklist | `scripts/diagram-semantic-verification.js` | Met | The helper still derives packaging facts from the real build config and release workflow |
| R4 Keep release / semantic docs aligned | `docs/maintainer/diagram-semantic-verification*.md`, `docs/maintainer/release-workflow*.md` | Met | Current docs consistently describe the single-entry `srcdoc` contract |
| R5 Add regression coverage to prevent silent drift | `src/tests/diagramSemanticVerificationScript.test.ts`, `src/tests/renderHostBundleAuditScript.test.ts`, `src/tests/iframeRenderHost.test.ts` | Met | Regression coverage still locks parser shape plus inline render-host consumption truth |
| R6 Keep host/CLI claims honest | Helper/docs still require actual `obsidian help` and `obsidian-cli help` evidence rather than inferred success | Met | No widened desktop-session claim is made without real command evidence |

### Acceptance Criteria Mapping

| Criterion | Evidence | Status |
|---|---|---|
| Template includes explicit packaging-boundary section with current truth | `npm run verify:diagram-semantics` | Met |
| Maintainer docs remain aligned with template truth | `docs/maintainer/*` wording | Met |
| Tests lock helper/docs/runtime-consumption shape | focused semantic + render-host tests | Met |
| No command/operation semantic drift | current diff scope + operation files untouched by this track | Met |

## 3. 2026-05-24 Correction: What Current Mainline Actually Ships

### 3.1 Current code truth

Current `origin/main` ships:

1. `esbuild.config.mjs` with a single `entryPoints: ["src/main.ts"]` and `outfile: "main.js"`;
2. `IframeRenderHost` sessions that embed a self-contained `htmlSrcdoc` payload;
3. `scripts/audit-render-host-bundle.js` that audits bundled `main.js` markers for the inline render-host contract;
4. maintainer docs that explicitly say `audit:render-host` proves only the self-contained `main.js + inline srcdoc` boundary.

### 3.2 What must no longer be stated as current shipped truth

The following should now be treated as **backup-branch evidence, not current `main` truth**:

1. a shipped `main.js + render-host.mjs` dual-asset runtime lane;
2. any claim that Stage-C dedicated runtime assets are already present on the rewritten `origin/main`;
3. any progress wording that assumes current release assets or current build output include `render-host.mjs`.

### 3.3 Why this correction matters

If we keep the later branch wording after the force rewrite, the docs become actively misleading:

1. maintainers will believe packaging topology is farther along than the code proves;
2. future reintegration work will skip required contract gates because the docs imply they already passed;
3. release verification can silently stop checking the real current single-entry boundary.

## 4. Deep Comparison Versus Prior Plans

### 4.1 What genuinely remains landed on current `main`

1. The semantic helper is still a real anti-drift control surface.
2. Packaging-boundary wording is still explicit and correctly narrow.
3. The inline render-host path is still regression-locked by code and tests.
4. The next architecture-critical path is still packaging/runtime topology, not general UI churn.

### 4.2 What did not survive onto current `main`

Compared with the local backup branch:

1. the later dedicated runtime-asset lane did not survive;
2. the later unified follow-through progress docs did not survive;
3. later maintainer-bridge help-truth closure did not survive;
4. later Stage-C progress wording must therefore be treated as reintegration input, not current-state evidence.

### 4.3 Interpretation

The correct reading of rewritten `main` is:

1. Stage-B packaging / semantic convergence remains the authoritative live lane;
2. current runtime truth is narrower than the later backup branch;
3. any future widening must be re-landed on top of the rewritten mainline with fresh code, tests, audits, and docs.

## 5. Concrete Next-Step Plan

### Priority 0: keep truth synchronized with the rewritten mainline

1. Keep this document, the maintainer docs, and the new unified follow-through matrix aligned to the current single-entry `srcdoc` truth.
2. Do not reuse backup-branch wording verbatim unless the corresponding code is actually reintegrated.
3. Re-check `change.md` and any current progress doc whenever the packaging wording changes.

### Priority 0.5: restore clean-state guardrails

1. Ignore local vault/runtime-generated artifacts so local Obsidian verification does not dirty the repo after every run.
2. Keep release-quality verification ending with a genuinely clean `git status --short --branch`.

### Priority 1: resume bounded packaging follow-through

1. Keep helper/parser/test/doc alignment stable on current `main`.
2. Only widen packaging topology when the build graph, release assets, and runtime-consumption path all move together in the same batch.
3. If a later reintegration wants `render-host.mjs` again, treat it as a new current-main implementation slice, not as already-landed background truth.
4. Keep latent runtime helpers fail-closed on the current single-entry lane: do not let helper code synthesize a default `render-host.mjs` runtime path unless the dedicated asset is explicitly configured and actually shipped in the same batch.

### 2026-05-28 Delta: helper truth now covers fail-closed latent runtime helpers explicitly

This current-main anti-drift gap is now closed in code, tests, and maintainer docs:

1. `src/rendering/preview/renderHostRuntimeClient.ts` no longer synthesizes any default standalone runtime URL/path; it returns only an explicitly configured module specifier or `null`.
2. `scripts/diagram-semantic-verification.js` now reads `src/rendering/preview/renderHostRuntimeClient.ts` directly and emits packaging-boundary checklist lines that make this fail-closed truth executable.
3. `src/tests/diagramSemanticVerificationScript.test.ts` now regression-locks both:
   - the current repo truth (`resolveBundledRenderHostRuntimeModuleSpecifier()` returns `null` without explicit config), and
   - the fallback wording when the helper source cannot be inspected.
4. Maintainer runbooks now cite this additional truth source so release/semantic verification no longer stop at build-output + audit truth alone.

### 2026-06-06 Delta: render-host packaging contract now has a single code truth source

Another anti-drift gap is now closed at the source/build/audit boundary itself:

1. `scripts/lib/packaging-contract.js` now defines the shared packaging contract constants for:
   - the current main bundle output file;
   - the required inline render-host audit markers;
   - the disallowed standalone render-host output files on the current single-entry lane;
   - the disallowed standalone render-host reference patterns inside the built bundle.
2. `esbuild.config.mjs` now reuses that shared contract when removing stale standalone render-host outputs before build.
3. `scripts/audit-render-host-bundle.js` now reuses the same shared contract instead of carrying a second hand-maintained copy of render-host markers, standalone output filenames, or standalone reference regexes.
4. `scripts/diagram-semantic-verification.js` now falls back to the same shared contract constants when direct audit-script inspection is unavailable, instead of keeping a third disconnected default copy.
5. Focused regression coverage now locks this ownership boundary explicitly:
   - `src/tests/renderHostBundleAuditScript.test.ts` verifies the audit helper reuses the shared contract constants, including reference regexes;
   - `src/tests/diagramSemanticVerificationScript.test.ts` verifies helper-derived audit facts stay aligned with the same shared contract.

Interpretation:

1. current shipped topology is unchanged;
2. the important change is ownership discipline: future render-host packaging-boundary edits now have one canonical constant source instead of three partially duplicated ones.

### 2026-06-06 Later Delta: semantic packaging facts now track the real bundle-config owner

The ownership cleanup exposed one more real anti-drift problem and this batch closes it:

1. current `esbuild.config.mjs` no longer keeps top-level literal `entryPoints` / `outfile` values; it delegates to `scripts/lib/esbuild-bundle-config.js`.
2. `scripts/diagram-semantic-verification.js` now reflects that architecture truth instead of assuming the literals still live only in `esbuild.config.mjs`.
3. Packaging-fact resolution now works in two bounded steps:
   - parse `esbuild.config.mjs` directly when literal entry/output fields still exist there;
   - fall back to `scripts/lib/esbuild-bundle-config.js` when the top-level config delegates to the shared helper.
4. `src/tests/diagramSemanticVerificationScript.test.ts` now regression-locks both the current repo shape and the helper-fallback shape, preventing the semantic verifier from drifting behind the real build owner again.

Interpretation:

1. this batch still does not widen packaging topology;
2. it does tighten the source/build/helper contract so the semantic verifier now follows the actual build owner instead of a stale file-shape assumption.

### 2026-06-06 Final Delta: release tag and release-notes truth now live in the same shared packaging contract

One more packaging/release anti-drift gap is now closed:

1. `scripts/lib/packaging-contract.js` now also owns:
   - the numeric release-tag regex source;
   - the canonical release-notes directory and bilingual filename suffixes;
   - a helper that resolves the expected English / Simplified Chinese release-note paths for any tag.
2. `scripts/release/publish-github-release.js` now derives both:
   - `OBSIDIAN_RELEASE_TAG_PATTERN`, and
   - the `<tag>.md` / `<tag>.zh-CN.md` note paths
   from that same shared packaging contract instead of hand-maintaining a local second copy.
3. `scripts/diagram-semantic-verification.js` now uses the same shared release-tag pattern and release-notes path resolver when it emits packaging-contract checklist truth.
4. Focused regression coverage now locks that contract in both places:
   - `src/tests/githubReleaseWorkflow.test.ts` verifies the release helper reuses the shared release-asset and release-tag contracts;
   - `src/tests/diagramSemanticVerificationScript.test.ts` verifies the semantic helper's release-contract facts and release-notes checklist lines stay aligned with the same shared contract.

Interpretation:

1. current release behavior is unchanged;
2. the ownership model is tighter: release assets, release tag policy, and release-notes path truth now move together instead of drifting across helper, tests, and docs.

### 2026-06-06 Workflow Delta: CI tag validation now reuses the checked-in helper path

One more release-truth duplication is now removed:

1. `.github/workflows/release.yml` no longer carries an inline shell regex as the only authoritative release-tag validator.
2. The publish workflow now checks out the repository's workflow sources first, then runs `node scripts/release/validate-release-tag.js "$TAG_NAME"` before checking out the release ref.
3. That wrapper delegates to `validateReleaseTag(...)` in `scripts/release/publish-github-release.js`, which already derives its regex truth from `scripts/lib/packaging-contract.js`.
4. `src/tests/githubReleaseWorkflow.test.ts` now locks both:
   - the workflow's use of the checked-in tag-validation helper, and
   - the wrapper's own pass/fail behavior for numeric vs. `v`-prefixed tags.

Interpretation:

1. release behavior is still the same from a maintainer perspective;
2. the important change is that CI now consumes the same repo-owned tag-validation entrypoint as the release helper, instead of shadowing it with a YAML-local regex.

### 2026-06-06 Branch-Target Delta: workflow source and chronicle targets now share release contract truth

The next release/chronicle anti-drift gap is now closed without changing the shipping topology:

1. `scripts/lib/packaging-contract.js` now owns both:
   - `RELEASE_WORKFLOW_SOURCE_BRANCH`;
   - `RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH`.
2. `.github/workflows/release.yml` now exposes those two branch roles through explicit workflow env names:
   - `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH`;
   - `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH`.
3. `scripts/release/commit-chronicle-refresh.js` now derives its default push target from the shared contract and accepts `--target-branch` for explicit repair flows.
4. `scripts/diagram-semantic-verification.js` now validates the workflow-source checkout and chronicle refresh path against the configured branch contract instead of hard-coding `main` checks internally.
5. Regression coverage now locks this in:
   - `src/tests/githubReleaseWorkflow.test.ts` checks the workflow env contract and target-branch handoff;
   - `src/tests/commitChronicleRefreshScript.test.ts` checks the chronicle helper's shared default plus explicit override parsing;
   - `src/tests/diagramSemanticVerificationScript.test.ts` checks the semantic helper's configured-branch facts and docs references.

Interpretation:

1. current release behavior remains `main`-targeted;
2. the useful change is ownership: workflow-source and chronicle-target branch truth now move with the same release contract as assets, tags, and release notes.
3. GitHub Actions still needs bootstrap env values before the first checkout, so the workflow cannot literally import repo JavaScript at that point; the repo-owned contract and tests are what prevent YAML-local drift.

### 2026-06-06 Trigger-Glob Delta: release workflow tag triggers are now contract-backed too

The previous branch-target slice left one small but real release workflow duplication behind: the YAML trigger list still owned the tag wildcard literal.

That gap is now closed in a bounded way:

1. `scripts/lib/packaging-contract.js` now owns:
   - `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB`;
   - `RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS`.
2. `.github/workflows/release.yml` still carries the literal `*.*.*`, because GitHub Actions has to parse event triggers before repository JavaScript can be checked out.
3. `scripts/diagram-semantic-verification.js` now derives workflow trigger facts from the shared contract and detects disallowed `v*.*.*` / `V*.*.*` trigger drift.
4. Regression coverage now checks both directions:
   - `src/tests/githubReleaseWorkflow.test.ts` verifies the workflow bootstrap literal matches the shared contract and does not include the disallowed trigger globs;
   - `src/tests/diagramSemanticVerificationScript.test.ts` verifies helper output, fallback facts, and a drift fixture stay aligned with the same contract.
5. Maintainer docs now explicitly distinguish trigger-start behavior from release admission:
   - the wildcard only decides whether the release workflow starts;
   - the checked-in tag validator remains the numeric `x.x.x` enforcement point.

Interpretation:

1. current release behavior remains unchanged;
2. this closes another ownership gap without pretending GitHub Actions YAML can dynamically import repository JavaScript before checkout;
3. release workflow trigger, tag validation, release notes, release assets, workflow-source branch, and chronicle-target branch now all sit under the same repo-side anti-drift contract.

### 2026-06-06 Production-Build Delta: render-host build helper remains candidate-only

The next source/build ambiguity is now locked by code, helper output, and docs:

1. `src/tests/esbuildBundleConfig.test.ts` now proves the production `esbuild.config.mjs` path consumes `createMainBundleBuildOptions()` but not `createRenderHostBundleBuildOptions()`.
2. The same test verifies that the candidate render-host output file remains listed under `RENDER_HOST_STANDALONE_OUTPUT_FILES` and absent from `REQUIRED_RELEASE_ASSET_FILES`.
3. `scripts/diagram-semantic-verification.js` now emits a packaging-boundary checklist item requiring `createRenderHostBundleBuildOptions()` to stay candidate-only unless standalone render-host release assets, audit logic, and docs move in the same batch.
4. Maintainer semantic-verification and release-workflow docs now describe that helper split explicitly, so future reviewers do not infer a shipped standalone runtime merely from candidate source code.

Interpretation:

1. current shipped topology is still unchanged: `main.js` plus inline `srcdoc`;
2. the useful change is that source-only render-host build helper status is now executable contract, not just planning prose;
3. if a future batch promotes `render-host.mjs`, it must do so by changing production build, release assets, audit rules, and docs together.

### 2026-06-09 Helper-Entrypoint Delta: real semantic-verification CLI behavior is now process-level proof

The helper contract is now locked one layer higher than module-internal functions:

1. `src/tests/diagramSemanticVerificationScript.test.ts` now executes the real `node scripts/diagram-semantic-verification.js ...` entrypoint instead of only importing helper functions.
2. That process-level coverage now proves three concrete maintainer-facing behaviors:
   - stdout mode still emits the full checklist when `--output` is omitted;
   - `--output <path>` still writes the rendered checklist file and preserves requested surface filtering;
   - unsupported `--surface` values still fail fast with a non-zero exit instead of silently emitting a misleading partial template.
3. Maintainer runbooks now state that stdout mode is valid for quick review while explicit file output remains the durable handoff path.

Interpretation:

1. this still does not widen packaging topology;
2. it does remove another drift seam by proving the checked-in helper's actual CLI behavior, not only its internal formatting helpers.

### 2026-06-09 Release-Helper Entrypoint Delta: release helper and tag validator now also have process-level proof

The release lane now closes the same class of drift one step higher than module-internal tests:

1. `src/tests/githubReleaseWorkflow.test.ts` now executes the real checked-in script entrypoints for:
   - `node scripts/release/validate-release-tag.js`
   - `node scripts/release/publish-github-release.js <tag> --dry-run`
2. That process-level coverage now proves:
   - numeric tags pass while `v`-prefixed tags and missing tags fail fast through the real wrapper entrypoints;
   - release dry-run still validates required assets and checked-in bilingual release notes before composing commands;
   - the helper still selects the correct create vs repair command shape based on `gh release view`;
   - temporary composed release-notes files are still cleaned up after dry-run output.
3. Maintainer release docs now record `--dry-run` as the checked-in no-network proof path rather than leaving it as an implicit helper feature.

Interpretation:

1. current release behavior is still unchanged;
2. the useful change is stronger proof of the checked-in release helper's real CLI behavior, not only its internal planning helpers.

### Priority 2: treat backup-branch Stage-C work as reintegration candidates

Candidate later slices may still be valuable, but they must be re-proved on current `main`:

1. dedicated runtime asset follow-through;
2. maintainer-bridge help-truth convergence;
3. any broader CLI/public-surface hardening that depends on the later packaging lane.

## 6. Risks And Controls

1. **Risk:** docs drift back into later-branch wording.
   **Control:** every “landed” packaging claim must cite current `esbuild.config.mjs`, current maintainer docs, and current tests.
2. **Risk:** later reintegration assumes missing code still exists.
   **Control:** distinguish “current `main` truth” from “backup-branch evidence” in every roadmap/progress update.
3. **Risk:** local verification keeps dirtying the repo and obscuring real diffs.
   **Control:** keep local vault/runtime-generated artifacts ignored and verify clean status at the end of the batch.

## 7. Conclusion

Current rewritten `main` is still in a valid and testable packaging / semantic-verification state, but it is **narrower** than the later backup branch:

1. the live shipping boundary is single-entry `main.js` + inline `srcdoc`;
2. the semantic/helper/doc anti-drift control plane remains real;
3. the next meaningful architecture step is still packaging-boundary follow-through, now with stricter mainline-truth discipline after the force rewrite.
