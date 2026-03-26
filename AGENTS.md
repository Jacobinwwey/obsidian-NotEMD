# AGENTS.md - Notemd Obsidian Plugin

This is the project-level execution guide for Codex and other repository agents. Treat this file as the authority for build, verification, release, and repository workflow rules. [`GEMINI.md`](./GEMINI.md) remains as a background project overview and should not be rewritten to mirror this file.

## Project Overview

Notemd is an Obsidian plugin written in TypeScript. It enhances note workflows with LLM-powered processing, concept extraction, Mermaid generation/fixing, translation, web research, and custom one-click workflows.

## High-Risk Areas

These files and modules have the highest regression risk and should be treated as coupled surfaces during implementation:

- `src/main.ts`: plugin entrypoint, commands, settings loading, and task routing.
- `src/llmProviders.ts`: single source of truth for provider presets, metadata, ordering, and provider-side validation.
- `src/llmUtils.ts`: provider transport dispatch, request shaping, retry logic, and connection testing.
- `src/fileUtils.ts` and `src/searchUtils.ts`: task flows that depend on `callLLM()` behavior.
- `src/ui/NotemdSettingTab.ts`: provider settings, workflow builder, and test-connection UI.
- `src/workflowButtons.ts` and `src/ui/NotemdSidebarView.ts`: sidebar actions and custom workflow composition.
- `src/mermaidProcessor.ts`: Mermaid fix and error-detection logic.

When changing one of these areas, check whether a sibling module must also be updated.

## Build And Verification

Use these commands from repository root:

```bash
npm install
npm run build
npm test -- --runInBand
```

Verification requirements:

- Do not claim work is complete without fresh build and test output.
- Prefer `npm test -- --runInBand` for reliable local verification in this repository.
- Run targeted Jest tests first when doing TDD, then rerun the full suite before commit or release.
- Run `git diff --check` before committing to catch whitespace and patch-format issues.

### Obsidian CLI Checks

When release or integration verification is requested:

```bash
obsidian help
obsidian-cli help
```

Rules:

- Try both commands when the user asks for Obsidian CLI validation.
- If `obsidian-cli` is not installed or `obsidian` is blocked by desktop/X11 constraints, report that explicitly.
- Do not claim successful CLI validation unless the command actually executed and produced usable output.

## TDD Rules

For behavior changes, bug fixes, or new providers:

1. Write the failing test first.
2. Run the targeted test and confirm it fails for the expected reason.
3. Implement the minimal change.
4. Re-run the targeted test.
5. Re-run the full test suite.

New providers or provider-behavior changes must include tests in the relevant files:

- `src/tests/llmProviders.test.ts`
- `src/tests/llmUtilsProviderSupport.test.ts`
- Additional focused tests when adding local validation or UI-facing provider rules

## Provider Extension Rules

All new LLM providers must follow these rules:

- Add the preset to `src/llmProviders.ts`.
- Prefer transport-driven support in `src/llmUtils.ts`; do not add provider-name branching unless the transport genuinely differs.
- Set provider metadata for:
  - transport
  - category
  - API key mode
  - API test mode
  - default base URL and model
  - setup hint and description
- Update documentation in both `README.md` and `README_zh.md`.
- Add or update tests for provider registry coverage, runtime routing, and connection testing.

For OpenAI-compatible endpoints, default to the shared runtime unless the provider requires a dedicated protocol.

## UI, Workflow, And Mermaid Rules

If you touch workflow or sidebar behavior:

- Verify button wiring and workflow chaining tests still pass.
- Preserve the default `One-Click Extract` workflow unless intentionally changing product behavior.

If you touch Mermaid-related behavior:

- Re-check batch Mermaid fix coverage.
- Re-check workflow paths that can generate Mermaid output.
- Keep Mermaid repair logic scoped to Mermaid code blocks.

## Documentation Rules

Documentation is part of the feature. If behavior, provider support, or release workflow changes, update the docs in the same branch.

At minimum, evaluate whether these files need updates:

- `README.md`
- `README_zh.md`
- `change.md`
- `AGENTS.md`

## Release Rules

Before creating a release:

1. Sync version references in repository metadata.
   - `package.json`
   - `manifest.json`
   - `versions.json`
   - any version text in `README.md` and `README_zh.md`
2. Run `npm run build`.
3. Run `npm test -- --runInBand`.
4. Confirm `git status` is clean after the release commit.
5. Create/push the Git tag.
6. Create the GitHub Release with release notes.

### Required GitHub Release Assets

Every GitHub release for this plugin must upload all of the following assets:

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

This is mandatory. Do not publish a release that omits `README.md`.

## Git Safety Rules

- Use non-interactive git commands.
- Never use destructive resets or reverts unless explicitly requested.
- Do not overwrite or discard unrelated user changes.
- If the working tree contains unexpected edits you did not make and cannot explain, stop and ask.
- Prefer feature branches or worktrees for substantial work.

## Repository Notes

- `main.js` is gitignored and is expected to be generated during builds and uploaded as a release asset.
- This repository already has broad Jest coverage; treat test regressions as meaningful unless proven otherwise.
