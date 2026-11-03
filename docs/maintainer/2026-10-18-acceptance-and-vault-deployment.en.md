# Source-faithful recovery, acceptance exports and Vault deployment

[中文](./2026-10-18-acceptance-and-vault-deployment.zh-CN.md)

## Continuation and root cause

This continues the existing preview/Slidev/Drawnix/ER work, without rewriting completed repairs. The latest user requirement supersedes the earlier proposal to reject cyclic tree sources and missing lane endpoint content. A diagnostic-only image is not a successful diagram.

Tree layout previously traversed only the first root and recursively assumed an acyclic hierarchy. Other components could be hidden or collapsed into depth zero. The replacement uses finite parent-chain cycle discovery and component traversal, retaining every original node and relationship, including rootless cycles, self-relations and forests. A shared source-structure description owns renderer placement and warning diagnostics. Cyclic edges are visibly dashed and the non-tree caveat is inside the SVG.

Lane geometry already existed for every declared coordinate, but only authored cells were painted. This produced arrows ending in unexplained empty space. Referenced missing cells now become dashed “Not provided” placeholders; no business operation is fabricated. They participate in routing obstacles, and the header reserves space for the visible source caveat. Input objects remain unchanged. Unknown coordinates, duplicate identities and security boundary failures are not silently accepted.

## Acceptance package

- Run: npm run diagram:acceptance. Generator: scripts/generate-diagram-acceptance.js; offline page/case contracts: scripts/lib/diagram-acceptance-*.js.
- Seven pairs / fourteen genuine 144-PPI PNG exports, plus SVG, source JSON, optional Mermaid source, SHA256 hashes, measurements and an offline bilingual HTML viewer.
- Cases: legacy ER layout, typed ER semantics, translated class identity, sequence identity collision, broad-tree spacing, disconnected cycles and missing lane steps. Every after panel is an actual diagram, never a validation panel.
- Baseline source: ba2399097204df0d7464de48d433512e52ec0ae4. Both versions use the current dependencies and PNG exporter. Six cases have identical inputs; ER semantics explicitly compares an old projection with a typed payload from equivalent facts. No live model/provider quality is claimed.
- Vault entry: E:/1Knowledge/Notemd-Acceptance/diagram-recovery-2026-10-18T05-44-23-884Z/index.html. Local reproducible run: .cache/diagram-acceptance/run-2026-10-18T05-39-23-086Z-0c4b1e.
- Desktop 1440px/mobile 390px: all images decode, no page overflow, keyboard opening/Escape/focus return and Fit/1:1 work. Critical touch targets measure at least 44px. Twenty synthetic click-to-two-frame samples measured p95 44.3ms on this machine; this is not a field-latency claim. Other UX-law metrics remain unknown.

## Deployment and evidence boundaries

Only main.js, styles.css and manifest.json were installed, after backing up the previous bundle and settings outside the plugin directory on E:. data.json was not copied into the gallery or replaced by deployment. The two native saved-file preview probes added only their own history entries; after proving that all pre-existing entries and every other setting were unchanged, those two test entries were removed from memory and the original file bytes restored. Final SHA256 is identical to the pre-deployment backup. Bundle verification matched all three repository files. Official Obsidian plugin:reload succeeded; the optional obsidian-cli wrapper is absent. This is an unreleased working deployment retaining version 1.9.14, not a new published release.

The live ER thumbnail and modal contain three entities/nine fields. Native DOM measurements establish initial whole-fit. native-er.svg is serialized from the live Obsidian modal; native-er.png is rasterized from it with the exporter. The CLI main-window screenshot did not capture this modal and is explicitly not preview evidence. Only the newly opened acceptance modal was closed. Original notes, saved exports, settings, existing windows and .trellis were preserved.

The original root architecture.zh-CN_diagram.drawnix was also opened through the deployed plugin command: target drawnix, a real drawnix-primary panel plus three source-visual attachments, with all four SVG viewports initially fitted. A separate older saved fixture passed the same primary-panel check. No provider call was needed. Receipts: native-drawnix-root.json and native-drawnix.json.

Native Draw.io editing/round-trip, PDF visual reopening, universal crossing-free routing and all-33-type semantic parity remain outside the established evidence. The existing cross-family roadmap is still a roadmap, not falsely marked implemented. No commit, release, dependency upgrade or provider call occurred.

## Final verification

The final unfiltered run passed all 328 suites: 3167 passed, one skipped (3168 total), in 576.172 seconds, including the previously problematic release-publisher fixture. Report: .cache/diagram-acceptance-final-tests-20261018.json. The first fresh full run passed 327/328 suites and 3164 tests, with one skipped and one environment-induced failure: placing TEMP inside the repository made an external-Vault fixture internal. Moving TEMP/TMP to E:/DevCache/notemd-runtime-temp fixed the unchanged five-test fixture. No test assertion was weakened. Fresh build, 37 focused tests, zero lint regressions across 49 changed TypeScript files, UI-string/render-host audits and diff hygiene passed. The later mobile target-size regression failed before its CSS repair and both browser cases now pass.
