# Notemd Note-Processing Registry Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the landed note-processing host adapters into the registry/capability/contract layer and continue tightening translation/extraction utility side-effect boundaries.

**Architecture:** Keep the four layers separate: trigger, host adapter, operation, contract. This plan does not repeat `src/main.ts` wrapper moves for their own sake. It first onboards the extracted note-processing flows into the operation registry, then makes `ProgressModal`, `Notice`, vault writes, and related host effects more explicit in utility cores.

**Tech Stack:** TypeScript, Obsidian Plugin API, Jest, Markdown docs, official `obsidian` CLI, capability manifest / invocation contract

---

## Current Baseline

- `src/operations/noteProcessingCommandHostAdapter.ts` already owns the process / generate / research / translate / extract wrappers.
- `src/main.ts` has already shrunk its translation/extraction command bodies to delegators.
- `src/fileUtils.ts` and `src/extractOriginalText.ts` already accept narrow runtime contexts instead of the concrete `NotemdPlugin` class.
- The remaining gap is no longer wrapper extraction. It is registry onboarding plus utility side-effect tightening.

### Task 1: Note-Processing Operation Registry Onboarding

**Files:**
- Modify: `src/operations/registry.ts`
- Modify: `src/operations/capabilityManifest.ts`
- Modify: `src/cliContracts.ts`
- Modify: `src/workflowButtons.ts`
- Test: `src/tests/operationsRegistry.test.ts`
- Test: extend CLI contract / capability-manifest coverage if needed

- [ ] **Step 1: Write failing tests for note-processing operation metadata**
Define `automationLevel`, `requiredContext`, `sideEffectClass`, and command bindings for `translate-current-file`, `batch-translate-folder`, `extract-concepts-current`, `extract-concepts-folder`, `extract-original-text`, and `extract-concepts-and-generate-titles`.

- [ ] **Step 2: Run the focused registry test**
Run: `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/operationsRegistry.test.ts`
Expected: FAIL on missing note-processing operation definitions.

- [ ] **Step 3: Land the minimum viable registry schema**
Start with minimal input/result schemas. Anything that depends on active file should be modeled honestly as `requires-active-file`, not promoted to `safe`.

- [ ] **Step 4: Update capability-manifest and invocation-contract export**
Expose only bindings that are actually explainable. Keep legacy aliases for compatibility, but do not include them in the capability manifest by default.

- [ ] **Step 5: Re-run the focused test**
Run: `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/operationsRegistry.test.ts`
Expected: PASS.

### Task 2: Translation And Extraction Utility Side-Effect Tightening

**Files:**
- Modify: `src/translate.ts`
- Modify: `src/fileUtils.ts`
- Modify: `src/extractOriginalText.ts`
- Modify: `src/operations/noteProcessingCommandHostAdapter.ts`
- Test: `src/tests/noteProcessingCommandHostAdapter.test.ts`
- Test: add focused `src/translate.ts` / `src/extractOriginalText.ts` coverage if signatures move

- [ ] **Step 1: Write failing tests for a no-UI path**
Add assertions around batch-translation reporter injection, notice shaping, or result-object boundaries so `ProgressModal` stops being treated as the only execution carrier.

- [ ] **Step 2: Run focused tests to confirm current coupling**
Run: `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/noteProcessingCommandHostAdapter.test.ts`
Expected: FAIL on the new host-effect expectations.

- [ ] **Step 3: Implement the smallest useful utility tightening**
Pull reporter/notice/file-write behavior into clearer host choices or result objects. Do not rewrite the entire utility surface into a service layer in one step.

- [ ] **Step 4: Backfill chained-command regression coverage**
Keep `extract-concepts-and-generate-titles` on the shared busy-state path and force batch generation to use the configured concept folder.

- [ ] **Step 5: Re-run the focused tests**
Run: `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs src/tests/noteProcessingCommandHostAdapter.test.ts src/tests/noteProcessingCommands.test.ts`
Expected: PASS.

### Task 3: Remaining `src/main.ts` Host-Adapter Extraction

**Files:**
- Modify: `src/main.ts`
- Modify: `src/operations/` (new or existing host-adapter modules as needed)
- Test: add focused command-surface delegation coverage

- [ ] **Step 1: Pick the next high-value commands**
Lock the order to duplicate cleanup -> batch Mermaid fix -> formula fix. Do not open multiple unrelated cross-file slices at once.

- [ ] **Step 2: Write delegator tests first**
Add command-surface tests proving the selected commands call host adapters instead of running utilities directly.

- [ ] **Step 3: Extract the minimum host adapter**
Reuse the existing pattern: busy guard, reporter lifecycle, and notice/error-log shaping stay in the host adapter; reusable execution stays in the utility core.

- [ ] **Step 4: Regress one slice at a time**
After each command family is extracted, rerun the relevant focused tests immediately instead of waiting for a large batch.

### Task 4: Mainline Sync And Doc Alignment

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/architecture.zh-CN.md`
- Modify: `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.md`
- Modify: `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md`
- Modify: `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md`
- Modify: `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.zh-CN.md`

- [ ] **Step 1: Align docs paragraph-by-paragraph**
State clearly which plan promises are now code reality, which gaps have moved, and which older statements must be deleted.

- [ ] **Step 2: Write the next direction explicitly**
Short term: registry onboarding. Mid term: utility side-effect tightening and remaining host-adapter extraction. Long term: richer CLI transport.

- [ ] **Step 3: Keep EN/ZH in sync**
Every change lands in both languages in the same slice.

## Short / Mid / Long Horizon

**Short term**
- note-processing registry onboarding
- translation/extraction utility side-effect tightening
- clean-worktree fast-forward of `main`

**Mid term**
- remaining `src/main.ts` host-adapter extraction
- fuller note-processing capability-manifest / invocation-contract coverage
- clearer dry-run and machine-readable result surfaces

**Long term**
- richer CLI transport evaluation (file bridge / local IPC / REST)
- finer-grained operation versioning
- write-heavy automation policy and rollback semantics

## Verification

- [ ] `npm run build`
- [ ] `npx jest --runInBand --config /tmp/notemd-worktree-jest.cjs`
- [ ] `npm run audit:i18n-ui`
- [ ] `npm run audit:render-host`
- [ ] `git diff --check`
- [ ] `git status --short` returns clean before final push

## Risks And Controls

- **Risk:** active-file flows get mislabeled as `safe`.
  **Control:** model real `requiredContext` first, then talk about CLI exposure.

- **Risk:** utility side-effect tightening breaks current Notice / modal UX.
  **Control:** keep UI shaping in host adapters; utilities tighten boundaries without deleting behavior first.

- **Risk:** work stops at wrapper moves again while the registry stays empty.
  **Control:** this plan makes registry onboarding the first task.
