# 2026-04-09 Language Support Baseline

This folder stores immutable **before-change** evidence for the language-support multiphase plan.

## Files

- `environment-before.txt`: Runtime and CLI environment snapshot (`node`, `npm`, `obsidian`, `obsidian-cli`).
- `build-before.txt`: Pre-change `npm run build` output.
- `targeted-tests-before.txt`: Pre-change targeted regression test output.

## Current Baseline Interpretation

- Targeted tests are PASS on this baseline.
- Build is FAIL on this baseline due to TypeScript `TS6059` triggered by cloned reference code under `ref/notebook-navigator` being included by `tsconfig` glob patterns.
- This build issue is treated as a known baseline constraint and must be resolved in planned Task 9 Step 1 (exclude `ref/**` from TypeScript compile scope if reference folder remains in repo).

## Usage Rule

For each implementation task, add matching `taskN-before.txt` and `taskN-after.txt` logs under this folder and perform a direct compare before merging.
