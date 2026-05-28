# Notemd Diagram Semantic Verification (Maintainers)

Language: **English** | [简体中文](./diagram-semantic-verification.zh-CN.md)

This document defines the maintainer-local semantic verification layer for diagram-related changes. It complements repo-enforced checks; it does not replace them.

Template helper:

```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```

The helper is secret-free. It generates a Markdown checklist template plus vault-aware CLI commands, explicit packaging-boundary, render-host audit, render-host runtime-consumption, implementation-readiness, packaging-contract, contract-promotion-boundary, and Stage-C gate sections, plus surface evidence sections; it does not launch Obsidian, read local secrets, or rely on tracked vault paths.
Its packaging boundary line is derived from current `entryPoints` / `outfile` / `outdir` values in `esbuild.config.mjs`; if parsing fails, the helper emits explicit placeholder wording so boundary drift is visible.
If `entryPoints` are parsed but output target detection cannot resolve either `outfile` or `outdir`, the checklist now adds an explicit manual-confirmation line before packaging claims can be made.
When output target detection succeeds, the checklist line now records whether the current truth came from `outfile` or `outdir` so packaging claims remain explicit.
If both `outfile` and `outdir` are detected together, the checklist now treats that as ambiguous and requires explicit manual confirmation before packaging claims.
The packaging-boundary section now also inspects `src/rendering/preview/renderHostRuntimeClient.ts` so current-main truth stays executable: on the current single-entry lane, `resolveBundledRenderHostRuntimeModuleSpecifier()` must remain fail-closed by exposing only an explicitly configured module specifier and otherwise returning `null`, without synthesizing a default `render-host.mjs` path.
The render-host audit section is derived from `scripts/audit-render-host-bundle.js` and keeps the shipped `main.js` bundle markers plus standalone-output bans executable instead of rhetorical.
The runtime-consumption section keeps the command-entry → preview-modal → iframe `srcdoc` → webview bridge chain explicit through `src/main.ts`, `src/ui/DiagramPreviewModal.ts`, `src/rendering/webview/page.ts`, and `src/rendering/webview/renderFrame.ts`.
The implementation-readiness section keeps the current packaging lane and release evidence bounded to what main actually ships today.
Its packaging-contract section tracks release-asset, release-tag, publish-mode, and release-notes contract truth from `scripts/release/publish-github-release.js`, and release-trigger/tag-guard contract truth from `.github/workflows/release.yml`, so Stage-B contract definition stays aligned with release enforcement.
Its contract-promotion-boundary section reads current operation metadata from `src/operations/registry.ts` for workflow/settings/export-adjacent operations, so capability-promotion claims remain tied to actual `automationLevel` / `requiredContext` / `sideEffectClass` truth.
Its Stage-C gate section keeps future topology widening blocked until packaging boundary, render-host audit, runtime-consumption, release contract, and contract-promotion boundary truth all move together.

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

They also do **not** prove that heavy runtimes are already isolated into a separate packaged asset. `npm run audit:render-host` currently proves only the enforced shipping truth: the inline `srcdoc` host remains self-contained inside `main.js`, and stray `render-host.mjs` assets or references are rejected on current `main`. The helper's packaging-boundary section adds one more explicit anti-drift check on top of that: latent runtime helpers must not silently reintroduce a default standalone runtime-module path on the current single-entry lane.

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

## Public CLI Surface Contract

The current public-safe CLI slice remains intentionally narrow. The exact current command IDs are:

- `notemd:export-provider-profiles-redacted`
- `notemd:export-cli-capability-manifest`
- `notemd:export-cli-invocation-contract`
- `notemd:export-cli-public-surface`

Exclusion rule:

- `notemd:export-provider-profiles` remains outside the public-safe slice because it carries `outputHandlingTags=contains-provider-credentials`
- the public-safe slice is documented in `docs/maintainer/notemd-cli-capability-matrix.md` and exported from the same registry-backed metadata as the current capability/contract artifacts

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
   Or generate a ready-to-fill checklist first:
   ```bash
   npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
   ```
2. Reload the plugin in the local test vault.
3. Confirm plugin availability and command exposure via CLI.
4. Exercise the affected diagram path(s) in real Obsidian.
5. Save evidence for each affected surface.
6. Record results in PR notes, release handoff, or maintainer log.

The generated helper template now also includes packaging-boundary, render-host audit, render-host runtime-consumption, implementation-readiness, packaging-contract, contract-promotion-boundary, and Stage-C gate sections. Do not skip these sections when the change touches render-host, preview, workflow/settings, or heavier runtime behavior: they are explicit reminders that today's packaging model and command-entry runtime chain must stay in sync with release and operation-promotion constraints.

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
