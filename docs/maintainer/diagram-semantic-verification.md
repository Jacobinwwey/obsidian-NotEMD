# Notemd Diagram Semantic Verification (Maintainers)

Language: **English** | [简体中文](./diagram-semantic-verification.zh-CN.md)

This document defines the maintainer-local semantic verification layer for diagram-related changes. It complements repo-enforced checks; it does not replace them.

## 1. When This Runbook Is Required

Run this verification when a change touches any of the following:

- `src/diagram/**`
- `src/mermaidProcessor.ts`
- `src/rendering/**`
- command wiring that changes diagram generation, preview, save, or export behavior

If the change is limited to documentation, static copy, or unrelated provider logic, this runbook is not required.

## 2. What Repo CI Already Proves

The repository-level gates prove build integrity and targeted automated behavior:

```bash
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
git diff --check
```

These checks do **not** prove that a generated Mermaid artifact is visually valid in a real Obsidian session, or that JSON Canvas / Vega-Lite output still behaves correctly end-to-end in the desktop host.

## 3. Environment Rules

- Use a maintainer-owned local vault. Do not rely on tracked vault paths in the repository.
- Use maintainer-owned API credentials stored outside the repository when live LLM generation is needed.
- Do not commit secrets, vault-specific config, screenshots containing private notes, or ad-hoc live test files.
- Prefer the stable `obsidian-cli` wrapper for environment checks, but use the native `obsidian` CLI when you need the actual command surface exposed by the running desktop app.

Useful environment checks:

```bash
obsidian help
obsidian-cli help
obsidian vaults verbose
obsidian plugin id=notemd vault=<vault-name>
obsidian commands vault=<vault-name> filter=notemd
```

## 4. Required Semantic Surfaces

For qualifying changes, validate all impacted surfaces among these three:

### Mermaid

Validate at least one note that produces Mermaid output.

Check:

- generation completes without unexpected fallback failure
- saved artifact opens in Obsidian
- rendered graph is visually intact
- if Mermaid auto-fix is expected, the saved file reflects the repaired output

Recommended evidence:

- saved output file path
- screenshot of rendered Mermaid preview, or equivalent visual confirmation

### JSON Canvas

Validate at least one note that produces `.canvas` output.

Check:

- output file is created with expected extension
- canvas opens in Obsidian without load error
- nodes/edges appear instead of an empty or malformed graph

Recommended evidence:

- saved `.canvas` file path
- screenshot of opened canvas

### Vega-Lite

Validate at least one note that produces `vega-lite` output.

Check:

- saved artifact contains the expected fenced `vega-lite` block
- preview opens through the plugin preview path
- chart renders rather than showing blank or broken host output

Recommended evidence:

- saved file path
- screenshot of the preview modal or rendered chart

## 5. Minimum Verification Flow

Use this sequence unless the change is more narrowly scoped:

1. Run repo gates first.
2. Reload the plugin in the local test vault.
3. Confirm plugin availability and command exposure via CLI.
4. Exercise the affected diagram path(s) in real Obsidian.
5. Save evidence for each affected surface.
6. Record results in PR notes, release handoff, or maintainer log.

## 6. Evidence Format

At minimum, record:

- vault name used
- plugin version / branch / commit
- affected surface: Mermaid, JSON Canvas, Vega-Lite
- command used
- artifact path produced
- result: pass/fail
- screenshot path or note that a visual check was performed live

Example:

```text
Vault: test
Commit: <sha>
Surface: Vega-Lite
Command: notemd-preview-diagram
Artifact: Notes/Topic.md
Result: PASS
Evidence: screenshot saved locally at ~/tmp/notemd-vega-preview.png
```

## 7. Relationship To Release Workflow

Use this runbook together with `docs/maintainer/release-workflow.md`.

- `release-workflow.md` defines repo-enforced release gates and CI behavior.
- This runbook defines the local semantic layer required for renderer-affecting changes.

If a change touches diagram semantics and no semantic verification evidence exists, treat release readiness as incomplete even if all automated checks pass.
