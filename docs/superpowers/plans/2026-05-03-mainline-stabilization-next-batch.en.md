# Notemd Mainline Stabilization Next-Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current repo-truth audit into a stable execution batch that consolidates the diagram command surface, adds a sustainable maintainer-local semantic verification runbook, and defines the real packaging boundary for heavy render runtimes without regressing legacy Mermaid behavior.

**Architecture:** Treat this batch as a boundary-hardening pass, not a renderer-expansion pass. Keep `src/main.ts` orchestration-compatible for shipped commands, move command-surface decisions toward one canonical diagram pathway, document semantic verification outside CI, and keep heavy preview runtime isolation explicit until the build system actually enforces it.

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, npm scripts, GitHub Actions release workflow, Markdown documentation

---

## Problem Frame

The codebase now has a real diagram platform, but the remaining risks are boundary risks:

- command surfaces still expose three partially overlapping diagram entrypoints
- maintainer verification expectations still mix repo-enforced gates with historical one-off live proofs
- heavy runtime packaging is still described in terms of intent, not in terms of a delivered asset boundary
- Drawnix is now understood well enough to constrain scope, but not yet turned into an execution-level non-goal

This batch should therefore stabilize what already exists instead of expanding into new engines or host integrations.

## Requirement Traceability

Source documents:

- `docs/brainstorms/2026-05-03-mainline-stabilization-and-ci-hardening-requirements.md`
- `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.md`
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`

Carried-forward constraints:

- preserve legacy Mermaid usability while consolidating command surfaces
- do not describe heavy runtime isolation as complete until packaging boundaries are real
- keep Drawnix as a reference boundary, not a shipped dependency or embedded host
- keep `ref/` and other local analysis artifacts out of shipped scope

## Implementation Units

### Task 1: Command Surface Consolidation Plan

**Files:**
- Modify: `src/main.ts`
- Modify: `src/ui/NotemdSidebarView.ts`
- Modify: `src/workflowButtons.ts`
- Modify: `src/ui/NotemdSettingTab.ts`
- Test: `src/tests/sidebarDomButtonClicks.test.ts`
- Test: `src/tests/sidebarButtonTriggerChains.test.ts`
- Test: `src/tests/workflowButtons.test.ts`

- [ ] **Step 1: Write failing tests for the intended stable command model**
Add coverage that describes the canonical command mapping, alias behavior, and the expected relationship between sidebar/workflow IDs and plugin command IDs.

- [ ] **Step 2: Verify the focused failures**
Run:
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts src/tests/workflowButtons.test.ts
```
Expected: FAIL for the new canonical-surface expectations.

- [ ] **Step 3: Implement the smallest orchestration change**
Keep old IDs as compatibility aliases where needed, but route user-facing labeling and internal execution toward one coherent diagram surface.

- [ ] **Step 4: Re-run focused tests**
Run the same command and confirm the new surface contract passes.

- [ ] **Step 5: Re-check command documentation drift**
Update any user-facing strings or maintainer notes that still imply three independent long-term diagram commands.

### Task 2: Maintainer-Local Semantic Verification Runbook

**Files:**
- Create: `docs/maintainer/diagram-semantic-verification.md`
- Create: `docs/maintainer/diagram-semantic-verification.zh-CN.md`
- Modify: `docs/maintainer/release-workflow.md`
- Modify: `docs/maintainer/release-workflow.zh-CN.md`
- Test/Verify: `README.md`, `README_zh.md` only if wording needs alignment

- [ ] **Step 1: Define the maintained semantic verification scope**
Document what must be checked locally when changes touch `src/diagram/`, `src/mermaidProcessor.ts`, or renderer behavior: Mermaid, JSON Canvas, and Vega-Lite sample flows.

- [ ] **Step 2: Keep the runbook secret-free**
The runbook must not require tracked credentials, checked-in vault paths, or committed live test files. It should describe operator-owned setup and evidence capture, not automate unsafe local secrets.

- [ ] **Step 3: Define evidence expectations**
Specify what counts as sufficient evidence: output file checks, screenshots, or saved artifacts, and how maintainers should record that evidence in release handoff or PR context.

- [ ] **Step 4: Cross-link release workflow**
Make the release workflow document explicitly distinguish repo-enforced gates from maintainer-local semantic verification.

### Task 3: Runtime Packaging Boundary Audit

**Files:**
- Modify: `esbuild.config.mjs`
- Modify: `scripts/audit-render-host-bundle.js`
- Test: `src/tests/renderHostBundleAuditScript.test.ts`
- Test: any packaging-focused test already covering render host delivery
- Docs: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`

- [ ] **Step 1: Write failing audit coverage for the intended boundary**
Describe the packaging fact you want to be true next, such as explicit heavy-runtime asset ownership or a clearer single-bundle guarantee.

- [ ] **Step 2: Verify failure**
Run the focused packaging audit tests before changing build logic.

- [ ] **Step 3: Implement the minimal packaging clarification or isolation step**
Either tighten the current single-bundle contract or introduce the first real multi-entry boundary. Do not claim more isolation than the build now proves.

- [ ] **Step 4: Re-run audit and build checks**
At minimum:
```bash
npm run build
npm test -- --runInBand src/tests/renderHostBundleAuditScript.test.ts
npm run audit:render-host
```

- [ ] **Step 5: Update roadmap wording to match the new reality**
If packaging remains single-entry, say so plainly. If the first isolated boundary is real, document the exact asset boundary that now exists.

### Task 4: Drawnix Boundary Capture As A Stable Non-Goal

**Files:**
- Modify: `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.md`
- Modify: `docs/brainstorms/2026-05-03-drawnix-feasibility-and-integration-direction.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md`
- Modify: `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`

- [ ] **Step 1: Keep the code-backed conclusions explicit**
Preserve the verified evidence: Drawnix export model, browser file-system boundary, browser persistence, app-shell UI complexity, and lazy-loaded conversion modules.

- [ ] **Step 2: Turn the research result into scope control**
Make the documents explicit that Drawnix integration is not the next batch, and that the only plausible near-future work is adapter/data-boundary experimentation after command/runtime stabilization.

- [ ] **Step 3: Avoid accidental host creep**
Remove or rewrite any wording that implies full-host embedding is under active consideration for the next release batch.

## Test Strategy

Repo-enforced gates for this batch:

- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:i18n-ui`
- `npm run audit:render-host`
- `git diff --check`

Focused regression surfaces:

- `src/tests/sidebarDomButtonClicks.test.ts`
- `src/tests/sidebarButtonTriggerChains.test.ts`
- `src/tests/workflowButtons.test.ts`
- `src/tests/renderHostBundleAuditScript.test.ts`

Maintainer-local semantic verification remains a separate recorded layer, not a CI replacement.

## Risks And Controls

- **Risk:** command consolidation accidentally breaks user muscle memory or workflow button bindings.
  **Control:** preserve alias behavior where needed and test sidebar/workflow routing explicitly.

- **Risk:** documentation claims outrun implementation again.
  **Control:** update plan, brainstorm, and maintainer docs in the same batch as code or audit changes.

- **Risk:** heavy-runtime packaging is described too optimistically.
  **Control:** only document boundaries that are enforced by build output and audit scripts.

- **Risk:** Drawnix scope creep distracts from stabilization work.
  **Control:** treat Drawnix only as a reference boundary until Tasks 1-3 are complete.

## Exit Criteria

- command-surface direction is encoded in tests and reflected in shipped command wiring
- a maintainer-local semantic verification runbook exists in both English and Simplified Chinese
- runtime packaging wording is aligned with what build output actually proves
- Drawnix is documented as a constrained future adapter/export reference, not an immediate host integration target
- full repo verification gates pass on the resulting branch
