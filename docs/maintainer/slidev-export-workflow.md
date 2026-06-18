# Slidev Export Workflow Verification

Language: **English** | [简体中文](./slidev-export-workflow.zh-CN.md)

This document is for maintainers. It defines the verification workflow for the NoteMD Slidev export UI path.

## Why This Workflow Exists

Directly running `slidev build` proves the local Slidev CLI can build a deck, but it does not prove the NoteMD export buttons work.

The NoteMD workflow must verify all of these steps together:

1. The active Markdown note is converted into a real Slidev deck before export.
2. The full Slidev skill directory is discovered, including `references/*.md`, not only `SKILL.md`.
3. The local Slidev fork is preferred when present.
4. Existing Slidev decks are copied into a prepared working file before verification so patch/retry never mutates the source note directly.
5. The output directory is recreated before each HTML build so stale chunks cannot survive.
6. Generated deck guardrails normalize theme, slide frontmatter, and seed large Mermaid diagram zoom only when the slide does not already declare its own zoom.
7. HTML export attempts native standalone first and falls back to server-script-compatible HTML when the generated standalone bundle misses slide loader bindings.
8. The final HTML output is opened by a real browser check, auditing the full deck by default.
9. Generated inspection artifacts remain visible to Git and are not accidentally hidden by `.gitignore`.

## Maintainer Command

Run the real workflow against the docs vault and the architecture note:

```bash
npm run verify:slidev-export
```

The default source is:

```text
docs/architecture.zh-CN.md
```

The command writes the same kind of artifacts the UI writes:

```text
docs/export/_slidev-sources/architecture.zh-CN.slidev.md
docs/export/architecture.zh-CN-slides/index-standalone.html
or docs/export/architecture.zh-CN-slides/index.html when standalone falls back
docs/export/architecture.zh-CN-slides/slide-*-workflow.png
```

For a quieter machine-readable run:

```bash
npm run verify:slidev-export -- --no-screenshots --json
```

To test another vault-relative source:

```bash
npm run verify:slidev-export -- --source path/to/source.md
```

For a live desktop-session smoke against the real Obsidian command path:

```bash
obsidian open path=architecture.zh-CN.md vault=/home/jacob/obsidian-NotEMD/docs
obsidian command id=notemd:export-slides vault=/home/jacob/obsidian-NotEMD/docs
```

On 2026-06-18 this command executed successfully in Jacob's docs vault. It is a real host-command smoke, not a DOM click automation pass.

## Passing Criteria

Treat the command as passing only when the final JSON report has:

1. `ok: true`
2. `environment.capabilities.html: true`
3. `environment.slidev.version` showing the local fork path when the fork is installed
4. `slideSource.skillRootPath` set to the resolved Slidev skill directory
5. `slideSource.skillReferenceCount` greater than zero
6. `deck.theme` equal to the configured theme, normally `default`
7. `deck.containsKnownStaleText: false`
8. `deck.containsMissingTheme: false`
9. every `playwright[].failed` value equal to `false`
10. `ignoredOutputs: []`
11. `layoutAuditSummary.overflowCount: 0`
12. `layoutAuditSummary.unreadableCount: 0`

If any check fails, fix the NoteMD workflow before relying on the exported files.

## Rendered Layout Quality Gate

The current workflow proves that the UI-equivalent export path creates a deck and that the full prepared deck can open in a browser. That is necessary because dense architecture notes can still build successfully while Mermaid diagrams, tables, code blocks, or long text are clipped by Slidev's fixed 16:9 canvas.

The current implementation now includes a shared render-feedback gate after deck generation, used by maintainer verification and by the real product export command whenever Playwright is available:

1. wait for `document.fonts.ready`, image decode, and Mermaid rendering before measuring;
2. inspect every audited slide for DOM bounding boxes outside the actual visible slide root, scroll overflow, Mermaid container overflow, table natural width overflow, and code block overflow;
3. classify each finding as `overflow`, `unreadable-scale`, `stale-output`, or `render-error`;
4. patch and retry the prepared working deck with bounded rendered-evidence rewrites, currently up to 6 passes;
5. fail closed with an audit report when the visible slide root still clips content after those retries.

Use `ref/infinite-canvas` only as a clean-room design reference. The useful idea is not to embed an infinite canvas in Slidev export; it is to model generated slide elements as measurable world rectangles, compute union bounds, derive a fit camera for the fixed Slidev safe rectangle, and split content when fitting would make it unreadable. Do not copy AGPL-3.0 implementation code into this MIT project.

The planned report shape should add fields equivalent to:

```text
layoutAudit[].slide
layoutAudit[].findings[]
layoutAudit[].safeRect
layoutAudit[].contentBounds
layoutAudit[].recommendedPatch
layoutAuditSummary.overflowCount
layoutAuditSummary.unreadableCount
layoutAuditSummary.retryCount
```

Current landed truth as of 2026-06-18:

1. default HTML verification audits the full prepared deck when `--sample-slides` is not provided;
2. the patcher derives `zoom` from measured overflow instead of fixed export constants;
3. the patcher escalates to structural splitting for supported Mermaid diagrams (`flowchart`, `graph`, `mindmap`, `sequenceDiagram`), Markdown tables, pathological width-heavy tables through record-list fallback, non-Mermaid fenced code blocks, simple heading + paragraph/list slides, generic slot-marked layouts (including explicit `::default::`), and first-slide deck headmatter content when structural splitting is possible;
4. large Mermaid guardrails no longer overwrite a slide that already declares its own `zoom`;
5. existing Slidev decks are verified through prepared working copies instead of direct source-file mutation;
6. the shared `convergeSlidevDeckLayout()` workflow now runs inside `exportSlidesCommand()` and the maintainer verifier, so HTML/PDF/PNG/MP4 export all reuse the same converged prepared deck;
7. the HTML exporter now rejects known-bad native standalone bundles and falls back to `index.html + start-server.* + README.md`;
8. the real `docs/architecture.zh-CN.md` workflow now closes with `ok: true`, `28` audited slides, and zero `overflow` / `unreadable-scale` findings with `retryCount = 4`;
9. `PDF` and `PNG` verification on the same source also return `ok: true`, and now export from the same converged deck instead of the raw prepared source.

Current limitation:

1. richer custom/component-heavy Slidev layouts beyond the current supported structural set remain conservative/manual-review paths;
2. standalone export correctness currently depends on native bundle sanity detection plus server-script fallback rather than on a fully reliable standalone bundling strategy of its own;
3. full-deck Playwright verification is deliberately slower than representative sampling, so future work should improve convergence rather than weaken the audit;
4. `obsidian command id=notemd:export-slides` is still only a dispatch-level smoke because the Obsidian CLI does not expose an export-complete handshake.

## Output Policy

The generated files under `docs/export/` are maintainer inspection artifacts. They are intentionally useful for local visual review, but they should not be committed unless a release or documentation task explicitly asks for that artifact.

Before committing Slidev-export work, inspect:

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

Expected maintainer-local state:

1. generated files may appear as untracked;
2. `git check-ignore` should print nothing for the current verification artifacts;
3. the final commit should include source/workflow/docs changes, not ad hoc generated test output.

## UI Contract

The command palette export action and the sidebar export action both enter `exportSlidesCommand()`.

That method must keep the order:

1. probe environment;
2. prepare a Slidev export source;
3. export the prepared source in the selected format;
4. report the concrete output path.

Settings must expose the default export format (`HTML`, `PDF`, `PNG`, `MP4`) and the HTML mode when HTML is selected. A UI change that hides format selection regresses the export workflow.

## When To Run

Run `npm run verify:slidev-export` whenever a change touches:

1. `src/main.ts` export command wiring;
2. `src/ui/NotemdSidebarView.ts` or Slidev export controls;
3. `src/ui/NotemdSettingTab.ts` Slidev settings;
4. `src/slideExport/*`;
5. local Slidev fork resolution;
6. Slidev skill loading or prompt preparation;
7. output cleanup, bundling, or browser-launch behavior.

For code changes, also run:

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
npm run build
git diff --check
```

## Slidev Skill PR Assessment

A PR to the shared Slidev skill is worthwhile only for generic guidance that applies beyond NoteMD.

Good upstream skill candidates:

1. when converting long-form technical documents into Slidev decks, use the full skill reference set instead of relying only on the top-level `SKILL.md`;
2. prefer built-in or configured themes unless the project explicitly declares an installed custom theme;
3. close per-slide frontmatter before slide body content;
4. use `zoom` or `Transform` for large Mermaid diagrams, tables, and dense code blocks;
5. verify exported decks by building and opening rendered slides in a browser, not only by checking that Markdown was generated;
6. clear or recreate output directories before rebuilds when stale assets can affect browser output.

Keep these project-local instead of upstreaming:

1. `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` fork discovery;
2. NoteMD's vault-relative output paths;
3. the exact `architecture.zh-CN.md` smoke fixture;
4. NoteMD-specific stale text checks such as `快速定位`.

Recommendation: prepare a small upstream Slidev skill PR for the generic deck-conversion/export guardrails after this NoteMD workflow stabilizes. Do not upstream NoteMD-specific path or vault behavior.
