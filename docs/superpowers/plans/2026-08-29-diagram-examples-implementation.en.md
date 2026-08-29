# Diagram Examples And Real-Vault Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a catalog-driven bilingual learning tree that captures provider-backed diagram artifacts from the running `E:\1Knowledge` Vault for all 33 executable diagram types.

**Architecture:** Keep the existing static fixture gallery untouched and add a pure runtime library for catalog enumeration, input rendering, path safety, redaction, manifest validation, and cleanup planning. A thin Node CLI orchestrator creates temporary Vault notes, invokes the existing maintainer `diagram.generate` operation through the official Obsidian CLI, copies only verified outputs into `docs/diagram-examples/<type-id>/`, and removes its temporary Vault scope in `finally`.

**Tech Stack:** Node.js CommonJS scripts, TypeScript/Jest tests, existing `src/diagram` catalog and fixtures, official Obsidian CLI `create/delete/eval`, SHA-256 hashes, VitePress navigation, Playwright/export artifacts already supplied by the plugin.

## Global Constraints

- Preserve all unrelated user changes in the dirty worktree; modify only files needed for this feature.
- Use the runtime catalog and executable fixture catalog as the only type/semantic sources; never maintain a second 33-row type list.
- Keep real-vault evidence separate from `docs/assets/diagrams` fixture gallery assets.
- Store only repository-relative docs paths, Vault-relative logical source paths, provider/model names, bounded diagnostics, and SHA-256 hashes; never store credentials, headers, raw provider responses, or absolute local paths.
- Use a dedicated temporary Vault prefix and delete only files created under that prefix; cleanup must be idempotent and run in `finally`.
- A provider failure or unavailable target is recorded explicitly and cannot be silently replaced by a fixture result.
- Every Markdown addition has English and Simplified Chinese sibling files.
- Prefix repository commands with `rtk`; use `apply_patch` for manual edits.
- Follow TDD: each pure behavior gets a failing test before implementation, then focused tests, then full regression/build/docs gates.

---

### Task 1: Add the pure evidence runtime contract

**Files:**
- Create: `scripts/lib/diagram-examples-runtime.js`
- Test: `src/tests/diagramExamplesRuntime.test.ts`

**Interfaces:**
- Consumes: catalog summaries, fixture metadata, filesystem paths, CLI result metadata.
- Produces: `buildExamplePlans()`, `renderExampleInput()`, `sanitizeDiagnostic()`, `resolveSafeVaultPath()`, `collectCleanupPaths()`, `buildManifestEntry()`, `validateManifest()`.

- [ ] **Step 1: Write failing tests** for catalog-to-directory planning, bilingual input headings, absolute-path rejection, secret redaction, cleanup scope, manifest hash/path validation, and failure aggregation.

```ts
import {
    buildExamplePlans,
    renderExampleInput,
    resolveSafeVaultPath,
    sanitizeDiagnostic,
    validateManifest
} from '../../scripts/lib/diagram-examples-runtime';

test('plans one stable directory and bilingual input path per catalog row', () => {
    const plans = buildExamplePlans([
        { typeId: 'flowchart', fixtureId: 'flowchart-release', title: 'Release decision', intent: 'flowchart', target: 'mermaid' }
    ], 'docs/diagram-examples', 'notemd-real-diagram-examples');
    expect(plans).toEqual([expect.objectContaining({
        typeId: 'flowchart',
        directory: 'docs/diagram-examples/flowchart',
        inputPath: 'notemd-real-diagram-examples/flowchart.md',
        inputZhPath: 'notemd-real-diagram-examples/flowchart.zh-CN.md'
    })]);
});

test('rejects a vault path that escapes the dedicated prefix', () => {
    expect(() => resolveSafeVaultPath('notemd-real-diagram-examples', '../user.md'))
        .toThrow('outside the dedicated diagram examples prefix');
});

test('redacts secret-shaped diagnostics and absolute paths', () => {
    expect(sanitizeDiagnostic('https://x.test?api_key=secret C:\\Users\\jacob\\vault\\note.md'))
        .toBe('https://x.test?api_key=[REDACTED] <absolute-path>');
});
```

- [ ] **Step 2: Run the focused test and verify the expected RED state.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts`

Expected: FAIL because `scripts/lib/diagram-examples-runtime.js` does not exist.

- [ ] **Step 3: Implement the minimal pure functions.**

Use POSIX-normalized repository paths, reject duplicate catalog IDs, derive the two input paths from the stable `typeId`, and validate all paths with `path.relative` against their intended root. Redact `api_key`, `apikey`, `token`, `secret`, `authorization`, Windows drive paths, and POSIX absolute paths; cap diagnostics at 500 characters. `validateManifest()` must verify schema version, expected count, unique IDs, allowed statuses, in-root paths, file existence, and SHA-256 values supplied by the caller.

- [ ] **Step 4: Re-run the focused test and add edge cases.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts`

Expected: PASS, including duplicate IDs, missing files, stale hash, and cleanup prefix cases.

- [ ] **Step 5: Commit the pure contract.**

```bash
rtk git add scripts/lib/diagram-examples-runtime.js src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): add real-vault evidence runtime contract"
```

### Task 2: Add catalog extraction and bilingual input generation

**Files:**
- Create: `scripts/diagram-examples-catalog-entry.ts`
- Create: `scripts/lib/diagram-examples-catalog.js`
- Test: `src/tests/diagramExamplesCatalog.test.ts`

**Interfaces:**
- Consumes: `getExecutableDiagramExamples()`, `getExecutableDiagramType()`, and Task 1 input rendering.
- Produces: `loadExecutableDiagramExampleSummaries(repoRoot)`, stable English/Chinese source-note content, and 33 catalog summaries without hand-maintained IDs.

- [ ] **Step 1: Write failing tests** asserting the bundled catalog returns 33 unique rows, fixture IDs match runtime type IDs, targets match descriptors, and English/Chinese inputs preserve the same type/target and semantic fact tokens.

- [ ] **Step 2: Run the test to confirm RED.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesCatalog.test.ts`

Expected: FAIL because the catalog entry and loader are absent.

- [ ] **Step 3: Implement the Node-readable catalog bundle.**

Create a tiny TypeScript entry that imports the existing fixture catalog and exports JSON-safe summaries: `typeId`, `fixtureId`, `title`, `selectionRationale`, `sourceIntent`, `target`, and a normalized semantic fact summary derived from `spec`. Bundle it with the repository's installed `esbuild` to a temporary CommonJS file under `.cache/diagram-examples`; never write the bundle into `docs`.

- [ ] **Step 4: Implement bilingual input rendering.**

Render a stable Markdown template with title, purpose, requested type, requested target, source facts, and two or three reading cues. Keep identifiers/numeric values from the fixture unchanged in both languages. Translate explanatory headings and rationale through a focused 33-title/rationale dictionary in the runtime library; if a translation is missing, fail generation instead of silently mixing languages.

- [ ] **Step 5: Re-run focused tests and verify GREEN.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesCatalog.test.ts src/tests/diagramExamplesRuntime.test.ts`

Expected: PASS with exactly 33 catalog summaries and equivalent bilingual fact tokens.

- [ ] **Step 6: Commit the catalog/input boundary.**

```bash
rtk git add scripts/diagram-examples-catalog-entry.ts scripts/lib/diagram-examples-catalog.js src/tests/diagramExamplesCatalog.test.ts scripts/lib/diagram-examples-runtime.js src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): derive bilingual example inputs from catalog"
```

### Task 3: Implement the real-Vault generator and cleanup

**Files:**
- Create: `scripts/generate-diagram-examples.js`
- Modify: `package.json`
- Test: `src/tests/diagramExamplesGenerator.test.ts`

**Interfaces:**
- Consumes: Task 1 runtime functions, Task 2 catalog summaries, `scripts/invoke-maintainer-cli-operation.js` conventions, and Obsidian CLI.
- Produces: `npm run diagram:examples`, `npm run diagram:examples:check`, and a complete `docs/diagram-examples/manifest.json`.

- [ ] **Step 1: Write failing orchestration tests** using injected `createVaultFile`, `invokeDiagramGenerate`, `readVaultFile`, `copyFile`, and `deleteVaultFile` functions. Cover successful output discovery, target mismatch, provider error, timeout, stale output rejection, and `finally` cleanup.

```ts
test('records a failed example but cleans every temporary path', async () => {
    const calls: string[] = [];
    const result = await runExampleBatch({
        plans: [fakePlan('flowchart')],
        createVaultFile: async path => calls.push(`create:${path}`),
        invokeDiagramGenerate: async () => ({ kind: 'error', errorMessage: 'provider timeout' }),
        readVaultFile: async () => { throw new Error('must not read output after failure'); },
        copyFile: async () => { throw new Error('must not copy after failure'); },
        deleteVaultFile: async path => calls.push(`delete:${path}`)
    });
    expect(result.entries[0].status).toBe('failed');
    expect(calls).toEqual([
        'create:notemd-real-diagram-examples/flowchart.md',
        'delete:notemd-real-diagram-examples/flowchart.md'
    ]);
});
```

- [ ] **Step 2: Run the focused test and verify RED.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesGenerator.test.ts`

Expected: FAIL because the generator orchestration function is absent.

- [ ] **Step 3: Implement the side-effect-free batch runner.**

Expose `runExampleBatch(dependencies)` from the script/library boundary. For each plan, create the temporary English note, invoke the official maintainer operation with `{ sourcePath, executionMode: 'save-artifact', requestedTypeId, requestedRenderTarget: target, compatibilityMode: 'best-fit', targetLanguage: 'en' }`, resolve the returned `outputPath` and `followThrough.artifactTarget`, read the artifact and `.svg` companion plus any available `.png` export, copy them into the type directory, hash copied bytes, and write `machine-test.json`. Verify the returned target equals the plan target before copying. Continue to the next type after a failure and return a non-zero process status when any entry is not `passed`.

- [ ] **Step 4: Implement the CLI adapter and guarded cleanup.**

Use `spawnSync`/`spawn` to call `node scripts/invoke-maintainer-cli-operation.js --vault "E:\\1Knowledge" --operation diagram.generate --input-file <request> --pretty`, parse JSON stdout, and use `obsidian create`/`obsidian delete` only for the dedicated temporary prefix. Resolve all Vault paths under `E:\\1Knowledge` before reading/copying. Delete wrapper, artifact, companion files, and empty dedicated folders created by this run in `finally`; never delete a path that existed before the run.

- [ ] **Step 5: Implement `--check` without provider calls.**

Load `docs/diagram-examples/manifest.json`, enumerate the catalog, and call `validateManifest()` against committed files. Check that each `passed` entry has at least one artifact/visual file and that every machine-test file agrees with its manifest row. `--check` must exit non-zero on catalog drift, stale hashes, duplicate IDs, missing bilingual inputs, path escape, or secret-shaped metadata.

- [ ] **Step 6: Add package scripts and rerun focused tests.**

Add:

```json
"diagram:examples": "node scripts/generate-diagram-examples.js",
"diagram:examples:check": "node scripts/generate-diagram-examples.js --check"
```

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesRuntime.test.ts`

Expected: PASS with injected dependencies and no Vault mutation.

- [ ] **Step 7: Commit the generator.**

```bash
rtk git add scripts/generate-diagram-examples.js scripts/lib/diagram-examples-runtime.js scripts/lib/diagram-examples-catalog.js package.json src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): add real-vault examples generator"
```

### Task 4: Add bilingual README pages and navigation

**Files:**
- Create: `docs/diagram-examples/README.md`
- Create: `docs/diagram-examples/README.zh-CN.md`
- Modify: `docs/.vitepress/config.mts`
- Modify: `docs/index.md`
- Modify: `docs/index.zh-CN.md`
- Test: `src/tests/diagramExamplesDocs.test.ts`

**Interfaces:**
- Consumes: Task 3 manifest paths and status vocabulary.
- Produces: user-discoverable bilingual learning entry points and links for all 33 examples.

- [ ] **Step 1: Write failing docs contract tests** checking both README files exist, link the manifest and all catalog IDs, use the same language-specific path convention, and appear in both VitePress nav/sidebar and index pages.

- [ ] **Step 2: Run the test to verify RED.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesDocs.test.ts`

Expected: FAIL because the new README files and navigation entries are absent.

- [ ] **Step 3: Add README content.**

Explain the distinction between static fixture gallery and real-vault evidence, how to read each input/result pair, status values, provider metadata limitations, and cleanup guarantees. Generate one linked row per manifest entry; show `result.png` when available and state when a target has no PNG/SVG companion. Keep English and Chinese prose independently readable.

- [ ] **Step 4: Add navigation/index links.**

Add English and Simplified Chinese nav entries beside the existing gallery entries, plus matching sidebar entries in each language group and links from both docs index pages. Use the existing VitePress rewrite conventions; do not rename existing pages.

- [ ] **Step 5: Re-run docs contract and docs build.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesDocs.test.ts`

Run: `rtk npm.cmd run docs:build`

Expected: PASS; VitePress builds both README routes without broken links.

- [ ] **Step 6: Commit bilingual docs/navigation.**

```bash
rtk git add docs/diagram-examples docs/.vitepress/config.mts docs/index.md docs/index.zh-CN.md src/tests/diagramExamplesDocs.test.ts
rtk git commit -m "docs(diagrams): add bilingual real-vault examples guide"
```

### Task 5: Generate the evidence set and run all gates

**Files:**
- Create/modify generated: `docs/diagram-examples/manifest.json`, `docs/diagram-examples/<type-id>/*`
- Test: existing focused and full suites

**Interfaces:**
- Consumes: the running `E:\\1Knowledge` Vault, enabled `notemd` bundle, configured provider, and Tasks 1-4.
- Produces: 33 attempted real-vault records, copied result artifacts, and a clean evidence check.

- [ ] **Step 1: Verify the Vault and provider state read-only.**

Run: `rtk obsidian vault=\"E:\\1Knowledge\" plugin id=notemd`

Run: `rtk npm.cmd run cli:invoke -- --vault \"E:\\1Knowledge\" --operation provider.profile.export-redacted --pretty`

Expected: the vault resolves, `notemd` is enabled, and the redacted provider profile is usable without exposing secrets in captured output.

- [ ] **Step 2: Run the real generation.**

Run: `rtk npm.cmd run diagram:examples`

Expected: every catalog ID is attempted in order; each result is `passed`, `failed`, or `unavailable`; the command performs cleanup before exit and writes no absolute local path or secret-shaped metadata.

- [ ] **Step 3: Inspect generated evidence and Vault cleanup.**

Run: `rtk npm.cmd run diagram:examples:check`

Run: `rtk obsidian vault=\"E:\\1Knowledge\" search query=notemd-real-diagram-examples limit=100`

Expected: the check reports no drift; the search returns no temporary source notes or generated artifacts under the dedicated prefix.

- [ ] **Step 4: Run focused and full verification.**

Run: `rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts src/tests/diagramExamplesCatalog.test.ts src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesDocs.test.ts`

Run: `rtk npm.cmd test -- --runInBand`

Run: `rtk npm.cmd run build`

Run: `rtk npm.cmd run docs:build`

Run: `rtk npm.cmd run diagram:gallery:check`

Run: `rtk npm.cmd run verify:vault-bundle`

Run: `rtk git diff --check`

Expected: all commands pass; any provider-unavailable evidence remains explicitly represented in the manifest rather than hidden.

- [ ] **Step 5: Review generated files and commit the evidence set.**

Inspect the manifest count, all 33 directories, representative Mermaid/Vega-Lite/editable-SVG/Drawnix/Circuitikz artifacts, and both README render routes. Then commit only the generated evidence and any required docs updates:

```bash
rtk git add docs/diagram-examples
rtk git commit -m "docs(diagrams): capture real-vault diagram examples"
```

