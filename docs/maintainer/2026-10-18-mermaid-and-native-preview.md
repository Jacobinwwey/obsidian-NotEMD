# Mermaid export and native diagram preview repair

[中文版](./2026-10-18-mermaid-and-native-preview.zh-CN.md)

## Recovered scope and constraints

The previous session repaired scale-dependent SVG collision-clearance false positives in `svgSafety.ts`, with unit/browser regressions and bilingual Archify recommendations. Its README, changelog, tests and reports remain intact. This continuation does not repeat that repair or change the published 1.9.14 release.

This task addresses the reported blank Mermaid diagrams in `slidev-acceptance-fork-main-20261006`, nonselectable preview receipts, missing saved Drawnix primary diagrams and inconsistent initial Mermaid fitting. Original notes, existing acceptance exports, credentials, settings and local `.trellis` state must remain untouched. No LLM, translation API, commit, push, package upgrade or release is required.

## Root causes

1. **Windows component discovery:** the local Slidev fork uses `unplugin-vue-components` with `tinyglobby@0.2.16`. When the Vault workspace and client directory only share the drive root, its normalized traversal root becomes `E:` rather than `E:/`. Windows resolves that as the current directory on that drive. Captured compiler output contains `_resolveComponent("Mermaid")`; auto-import discovers zero components and leaves the call unresolved. Production emits a literal `<mermaid code-lz>` element, not a rendered diagram. The same minimal deck works inside the repository and fails outside it. MDC and single-file bundling are not the cause.
2. **Acceptance gap:** preserving three source fences did not establish rendered presence. Previous receipts reported zero Mermaid slides while remaining green.
3. **Saved Drawnix:** the preview loader previously only found `filename.drawnix.svg`. Without that companion, it added attachment panels but omitted the primary native mind map.
4. **Different preview dispatch:** history Mermaid panels with canonical SVG were rerendered asynchronously through iframes, while saved visual attachments followed a static SVG path. They did not share the same initial measurement boundary.
5. **Text selection:** modal receipts inherited the desktop host's nonselectable cascade; unlocking graph navigation did not enable metadata selection.

## Implementation phases

1. Reproduce each failing path before implementation. Initial preview regressions failed in three places; source preparation and rendered-presence regressions failed in two places.
2. Prepare a workspace-local `components/Mermaid.ts` re-export of Slidev's actual builtin component. It adapts dependency discovery, not rendering. Preserve existing user Mermaid components, configuration, original fences and the pinned fork identity. Both HTML builds and native exporters use the prepared workspace.
3. Compare expected per-slide Mermaid fences with rendered, nonempty SVGs, including native shadow roots. Wait for asynchronous diagrams before measurement; unresolved components and missing diagrams fail acceptance. Retain full fence lengths so nested Markdown examples cannot shift source-to-slide expectations.
4. Reconstruct known saved Drawnix mind-map hierarchies and cross-relations with the existing projection/SVG renderer when the exact companion is unavailable. Keep the primary panel before attachments, including an explicit source-only primary for unsupported native data. Future attachment metadata does not invalidate the known native hierarchy. Reconstruction is disclosed as derived layout, not native-editor geometry.
5. Prefer canonical SVGs for all preview panels before iframe fallback. Existing viewport fit remains the default; zoom, pan, lock and source exports are unchanged. Allow native receipt/diagnostic selection outside graph navigation; preserve pan versus Alt/lock selection inside it.
6. Run focused/full tests, fresh build, lint ratchet, UI/render-host audits, real exports and official Obsidian CLI verification. Detailed results and remaining limitations are recorded below.

## Changed surfaces

- `src/slideExport/slidevSourcePreparer.ts`: prepare the native Mermaid component import without changing user overrides or source fences.
- `src/slideExport/slidevLayoutAudit.ts` and `src/slideExport/slidevLayoutWorkflow.ts`: source-to-render presence checks, asynchronous SVG readiness and nested-fence parsing.
- `src/rendering/renderers/savedDrawnixPreview.ts` and `src/operations/diagramCommandHostAdapter.ts`: validate/reconstruct supported saved hierarchies, retain the native primary before attachments, and preserve source-only fallback.
- `src/ui/DiagramPreviewModal.ts` and `styles.css`: canonical SVG priority, consistent initial fitting and selectable metadata.
- Nine focused test suites cover these boundaries, including real-browser selection/fitting. README translations and the changelog describe the corrected behavior. Earlier SVG safety changes remain preserved.

## Commands and evidence

Shell commands use the repository's `rtk` prefix. Examples below omit it only inside existing npm script descriptions.

- Targeted Jest: preview modal/host, native reconstruction, real-browser selection/full-fit, Slidev preparation, rendered measurements and source-versus-DOM gate.
- `rtk proxy npm.cmd run build`; `rtk proxy npm.cmd test -- --runInBand --silent`; `rtk proxy npm.cmd run lint:regressions -- --base-ref origin/main`; `rtk proxy npm.cmd run audit:i18n-ui`; `rtk proxy npm.cmd run audit:render-host`; `rtk git diff --check`. On this Windows installation RTK cannot launch `npm` directly, so the explicit `npm.cmd` proxy is required.
- `obsidian help` succeeds. `obsidian-cli help` was attempted and the optional wrapper is not installed.
- Real all-format regeneration uses the preserved acceptance deck as input and a new `slidev-mermaid-fixed-20261018` output folder. The original acceptance directory is not overwritten.
- Local diagnostic fixtures and verification logs are under `.cache/`; committed tests do not depend on those private fixtures.

## Verification status

- Final focused verification: **9 suites / 140 tests passed**, followed by a successful fresh production build.
- Full verification initially passed before the last unsupported-relation fallback (321 suites, 3,110 tests passed, one skipped). After that change, a full run passed 320 suites but hit four process timeouts in the untouched release-publisher fixture, with Windows `EBUSY` cleanup failures. Its independent rerun passed **all 45 tests**. The final serial full run finished with **320 suites passed / one failed; 3,110 tests passed / one failed / one skipped**. The remaining failure is `does not overwrite public assets on identical retries` at `src/tests/githubReleaseWorkflow.test.ts:233`: the child returned `status: null` under the fixture's 20-second process limit. The changed feature suites pass, but the complete repository run is **not globally green**. No release implementation or timeout was modified to conceal this unrelated process-boundary instability.
- Lint ratchet: **18 changed TypeScript files, zero regressions** against merge-base `ba2399097204`; UI-string audit, render-host bundle audit and diff whitespace checks passed. This is not a claim that historical lint debt was removed.
- Real regeneration: **36/36 slides passed**, all **three Mermaid diagrams rendered**, and all three source fences remained byte-identical. Render errors, overflow and unreadable counts are zero. HTML, PDF, PNG, PPTX and MP4 completed. Actual browser SVGs, PNGs, rendered PDF pages, extracted PPTX media and an MP4 frame were inspected, not only output receipts.
- Official Obsidian CLI reloaded the final locally installed plugin. Direct preview of `architecture.zh-CN_diagram.drawnix` shows its **250-node native hierarchy plus three attachments**; the reported historical run shows its own **178-node hierarchy plus three attachments**. All eight panels initially fit completely, with zero initial scroll offsets and no iframe rerendering. Different source/history content is not falsely presented as the same graph.
- Native mouse press/move/release through official CLI CDP selected the export receipt text. Metadata selection is `text`; graph pan/zoom behavior remains separate. Only tagged verification modals were closed; pre-existing user modals were retained.
- The final installed and working `main.js` SHA-256 match: `b679a559494109643ad37b73b81b69b9f2d567ce0b890c7207b000945097c6e9`. The 67 original Vault-root files checked against the baseline are unchanged. Settings stayed unchanged during installation/native verification; persisted SHA-256 is `615eaf9868971d85eb76aa0a9805d1af56dcea632f23cb580f5e8c5ad01ef0ee`. Original acceptance exports were not overwritten.

## Repaired outputs and limitations

New exports are under `E:/1Knowledge/slidev-mermaid-fixed-20261018/`:

- `architecture.zh-CN.slidev-slides/index-standalone.html`
- `architecture.zh-CN.slidev.pdf`
- `architecture.zh-CN.slidev-slides-png/01.png` through `36.png`
- `architecture.zh-CN.slidev.pptx` and its `.report.json`
- `architecture.zh-CN.slidev.mp4`

Old exported HTML/PDF/images are immutable artifacts: installing the fix cannot retroactively repair their embedded blank diagrams; use the regenerated outputs. Close and reopen already-open preview windows to use the updated code; existing user modals were deliberately not dismissed. Supported Drawnix hierarchy reconstruction is a derived layout, not a guarantee of native-editor coordinate fidelity. Unsupported native versions/shapes/relationships retain source-only preview instead of being silently dropped or throwing. Mermaid diagrams in PPTX use the existing raster fallback rather than editable native nodes; no native PowerPoint reopen test is claimed. The optional `obsidian-cli` wrapper is unavailable, while official `obsidian` CLI validation did run. No version bump, commit, push or release was performed. All six implementation/verification phases were executed; release-fixture stability remains a separately disclosed follow-up, not a claim of release readiness.

Local evidence: `.cache/diagram-mermaid-serial-final-jest-20261018.json`, `.cache/slidev-mermaid-fixed-20261018.log`, and `.cache/mermaid-preview-native-20261018/{native,integrity}.json`. These private fixtures are not runtime or CI dependencies.
