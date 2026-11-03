# SVG preview compatibility acceptance and Archify comparison

[简体中文](./2026-10-18-diagram-preview-and-archify.zh-CN.md)

## Scope and recovered state

Date: 2026-10-18. Repository baseline: `84338108`. This continues session `01a10926-6bdc-7691-a4f5-5a14c40900fe` after its completed 1.9.14 release and native PDF acceptance. It does not redo the earlier PDF/detail, independent viewport, Alt selection or multi-format export implementation. See the [bilingual execution plan](../plans/2026-10-18-diagram-preview-and-archify-follow-through.en.md) and [previous acceptance](./2026-10-07-pdf-preview-native-acceptance.md).

This batch covers baseline recovery, the reported selected-type preview failure, consumer verification, and a source-grounded Archify comparison. The enhancement roadmap below is a future proposal, not a claim that new layout engines were implemented. No commit, push, tag, version bump or public release was performed.

## Root cause and implemented repair

The current consumer identifies itself as Obsidian 1.14.4; the plugin manifest remains 1.9.14. The Drawnix example generated a 32,529-character SVG, then failed the mounted presentation gate. At roughly 0.16 scale, its title and summary were separated by about 0.483 CSS pixels. The checker used screen-space DOM rectangles but a fixed, unscaled 0.5-unit clearance. It therefore invented overlap when a valid drawing was fitted into a thumbnail. The evidence does not establish that an Obsidian upgrade caused this defect.

`src/rendering/preview/svgSafety.ts` now projects the source-SVG clearance through the root SVG's `getScreenCTM()`: horizontal extent uses `|a| + |c|`, vertical extent uses `|b| + |d|`. The 0.5 label clearance and 1-unit shape clearance consequently scale with the scene. Identity fallback preserves DOM test doubles. Real intersections and later-painted shape occlusion still fail; SVG sanitization, zoom controls, PPI and export routes are unchanged. Complexity remains `O(T² + T·S)` for T labels and S shapes, with linear collected geometry storage. This is an axis-aligned rectangle check, not exact rotated-glyph intersection or a universal layout solver.

Changed product/test files:

- `src/rendering/preview/svgSafety.ts`: coordinate ownership correction.
- `src/tests/svgSafety.test.ts`: uniform and non-uniform scale regressions, with genuine overlap retained.
- `src/tests/svgPresentationSafety.playwright.test.ts`: real Chromium geometry at 0.05, 0.16, 1 and 4 scale; clear labels, real overlap and shape occlusion.

The targeted regressions were observed failing before the product repair, then passing afterward. The source-space invariant replaces a screen-width workaround; it has no Drawnix-only branch, host-version test or validation bypass. It is intended to tolerate future host sizing changes, not to promise compatibility with untested future host versions.

## Baseline recovery

The local `src/tests/diagramHistoryRepository.test.ts` contained truncated output-selector UI source instead of the tracked tests, despite ordinary Git status not reporting the discrepancy. It was backed up under `.cache/preview-20261018/diagramHistoryRepository.test.before-recovery.ts` and restored from HEAD through a patch. Its recovered content is not an intentional change in this diff. The overwrite mechanism is unknown and is not attributed to Obsidian.

A direct index/content audit covered 634 tracked source/build-support files. Ten apparent shell/PowerShell differences were line-ending-only and left untouched. The receipt is `.cache/preview-20261018/tracked-content-audit.json`. The production build passed after recovery.

## Verification evidence

Commands are run from the repository root. On this Windows environment, npm commands are launched using `rtk proxy powershell -NoProfile -Command "npm ..."`, because direct RTK/npm resolution did not work. A subagent configuration error prevented delegation; the remaining work ran inline.

| Check | Actual result |
| --- | --- |
| `npm run build` | Passed after baseline recovery |
| Targeted SVG safety/browser/example/security suites | 4 suites, 27 tests passed after the repair |
| `npm test -- --runInBand` | 315 suites passed, 2 failed; 3085 tests passed, 5 failed, 1 skipped; 317 suites / 3091 tests total |
| `npm run lint:regressions -- --base-ref origin/main` | Zero regressions for the three changed TypeScript files; recorded base `ba2399097204` |
| `npm run audit:i18n-ui` | Passed |
| `npm run audit:render-host` | Passed |
| Official Obsidian CLI help, version and eval | Usable output; host 1.14.4 |
| `obsidian-cli help` | Unavailable: executable not installed / ENOENT |
| Native production selected-type catalog | All 33 registered examples ready, each with positive mounted SVG geometry |
| Archify ten-type example validation | All ten commands exited 0 and reported `ok: true` |

Final verification after the documentation updates: a fresh production build passed; all ten selected SVG/security/example/documentation suites passed (76 tests), including the real-browser regressions. Both UI/render-host audits passed again and the lint ratchet still reported zero regressions. `git diff --check` passed. The focused result is stored in `.cache/preview-20261018/final-targeted.json`; it does not replace the full-suite failure record.

The full-suite failures are recorded, not hidden by the targeted results:

- `src/tests/githubReleaseWorkflow.test.ts`: four process-boundary cases returned null status from the fixture's 20-second subprocess timeout; several cleanup hooks also reported EBUSY. No public release was attempted: these use a fake local remote transport.
- `src/tests/localServerSecurity.test.ts`: the busy-port retry case encountered `listen EACCES: permission denied 127.0.0.1:6643`.

These modules are outside the SVG patch. An isolated rerun is recorded separately below; a retry must not erase the first failure or be presented as a clean full-suite run. No unrelated release/server implementation was changed to make this repair appear green.

### Isolated recheck

`npm test -- --runInBand --runTestsByPath src/tests/githubReleaseWorkflow.test.ts src/tests/localServerSecurity.test.ts --json --outputFile=.cache/preview-20261018/isolated-recheck.json` completed with 1 suite passed and 1 failed: 44 tests passed, 7 failed, 51 total. All six local-server security cases passed on this retry. The release workflow still returned null statuses and EBUSY cleanup errors in seven process cases. Retained fixture calls reached different local fake-transport stages (API, draft creation, upload or download), so this is not evidence of one SVG rendering failure, nor enough to attribute the timeout to a specific machine component. Both test files and the publisher/server source remain unchanged.

### Native consumer and preservation boundary

The working production build, based on 1.9.14 and not publicly released, was installed into `E:/1Knowledge/.obsidian/plugins/notemd` and reloaded through the official CLI. Previous main.js, manifest.json and styles.css were backed up under `.cache/preview-20261018/installed-before/`. The installation receipt and final integrity receipt confirm that all three installed files exactly match the repository candidate. The main.js SHA-256 is `cb92f97ee9267c3d73fff1323ad1100a610c95a647178eb3349d643193c3d8a7`.

The native matrix uses the existing `notemd-sidebar-view` leaf's actual preview controller and production renderer, iterates `EXECUTABLE_DIAGRAM_TYPES`, and restores its initial Drawnix preview. All 33 cases reached `ready`; none lacked positive SVG width or height. The document reported `visible` without spoofing visibility. In-memory settings and persisted settings bytes were identical immediately before and after the matrix. No LLM or translation API was called by the fixture, and no Vault note/export was written.

An earlier matrix attempt incorrectly used a settings-tab controller that became detached. It timed out with zero geometry and is rejected as fixture evidence, not counted as a passing product run. The corrected sidebar receipt replaces that failed attempt's output. The matrix tests the shipped examples, not arbitrary generated user documents, every export format, or attached-arrow behavior in the Drawnix application.

The initial integrity snapshot contains **67 Vault-root files plus the plugin settings file**, 68 paths total. All 67 original note/artifact hashes still match. The settings hash differs from that earlier session-wide snapshot, although it is unchanged across the corrected matrix. The persisted settings file's observed modification time was 2026-10-18 08:29:59 +08:00, before that matrix; a live screenshot also shows interactive preview activity. These facts do not identify the writer or changed fields. The initial record retained a hash, not original settings bytes, so session-wide exact-settings preservation cannot be certified. Current settings were deliberately left untouched rather than overwritten with guessed defaults or an older configuration. No credentials are included in these receipts.

Local evidence (ignored cache, not a release asset):

- `.cache/preview-20261018/before.json` and `drawnix-before.svg`: original failure and geometry.
- `.cache/preview-20261018/catalog-native.json`: 33-type result and restoration/settings checks.
- `.cache/preview-20261018/verify-catalog.cjs`: CLI fixture with controller lifecycle ownership.
- `.cache/preview-20261018/installation.json`, `vault-before.json`, `final-integrity.json`: installation and preservation receipts.
- `.cache/preview-20261018/native-sidebar.png`: genuine official-CLI window screenshot. An existing preview modal covers part of the sidebar; it is not a visual proof of every matrix case.

## Archify reference identity and method

Fresh full clone: `E:/convert/undo/archify-reference-20261018`. Reviewed commit: `9c4985a68b52ec7b54476d1ce5ab2192cc737ace`, author date 2026-10-18 01:52:30 +08:00. The checkout contains tag `v3.1.0`; CHANGELOG dates that release 2026-10-14. This report describes the pinned source, not an indefinitely current upstream identity. In particular, current Lifecycle examples/schema use version **3**; the older 3.0.0 changelog's v2 description is not the current schema contract.

Ten validated examples cover Architecture, Workflow, Sequence, Dataflow, Lifecycle, ERD, Class, Tree, Timeline and Waterfall. Exact input paths, candidate hashes, gate details and exit codes are retained in `.cache/preview-20261018/archify-validate.json`. Passing upstream checks does not establish perceptual quality, NoteMD host compatibility, or that all upstream examples and releases were tested.

The useful comparison is semantic coverage and layout ownership, not “10 versus 33.” NoteMD's 33 catalog entries include distinct semantic types, quantitative variants and shared renderers. Archify adds focused authoring/reading contracts that can improve existing categories without importing ten new backends or its full Viewer.

### Cross-cutting findings

All upstream paths in this section are relative to the pinned Archify clone.

| Source | Mechanism worth adopting | NoteMD boundary / caution |
| --- | --- | --- |
| `archify/renderers/dataflow/joint-label-routing.mjs:24` | Treat a moved label, its own bridge and affected blocking routes as one proposal; apply only after scene checks. Preserve endpoints, pinned geometry and other labels. Search limits are explicit. | Highest-value direction for dense topology/data-flow and Drawnix relation labels. Do not copy upstream thresholds as arbitrary NoteMD relationship quotas. |
| `archify/renderers/workflow/workflow-placement-repair.mjs:3` | Derive one isolated placement proposal, clone authored input, and let the compiler validate the complete drawing. | Optional derived-layout repair belongs to the layout owner, not an imperative caller-managed mutation sequence. Explicit coordinates remain authoritative. |
| `archify/renderers/shared/automatic-labels.mjs:6` | Find free near-route slots using obstacle boundaries; retry unresolved labels after other placements release space. | Improve `src/diagram/adapters/editableSvg/referenceLayoutRenderer.ts:86`, whose candidate exhaustion currently returns the original potentially colliding position. This weakness was identified, not changed in this repair. |
| `archify/renderers/shared/route-quality.mjs` | Bounded orthogonal search and detour/clearance checks. | Coordinate label and route geometry before presentation, rather than suppressing final diagnostics. Preserve genuine cross-branch relations. |
| `archify/renderers/shared/spatial-grid.mjs:7` | Conservative broad-phase grid; huge/unsafe cell ranges fall back to complete candidates. | Candidate indexing can reduce practical collision cost, but worst-case remains quadratic; prove parity against exhaustive checking and measure real fixtures first. |
| `archify/renderers/shared/layout-report.mjs:45` | Keep exact fractional route endpoints in repair inputs instead of rounding them into diagonal waypoints. | Give future diagnostics stable semantic IDs, source-coordinate rectangles/routes, renderer identity and transform metadata; presentation CSS pixels are a separate layer. |

### Recommendations by current diagram family

The NoteMD owner map is `src/diagram/diagramTypeCatalog.ts`; reference layouts are owned by `src/diagram/adapters/editableSvg/referenceLayoutRenderer.ts`. Existing renderer adapters and payload validators remain the extension points.

| Current NoteMD categories | Upstream reference | Recommended direction and acceptance |
| --- | --- | --- |
| architecture, current-state, integration-topology, high-level; data-flow, process, swimlane | Architecture routing, Workflow placement repair, Dataflow joint proposals | Rank main path/return/fan-out by topology, coordinate labels with corridors, protect containers and pins. Dense CJK and reciprocal-edge fixtures must retain every authored node/edge and never accept an unresolved collision as a clean layout. |
| drawnix-knowledge-map, mermaid-mindmap, tree, org-chart, canvas-map | Tree subtree sizing; Architecture port/route diagnostics | Keep hierarchy separate from material cross-relations, allocate subtree extents, expose congestion/unsupported-editability accurately. Pure Archify Tree has no cross-branch semantics; do not flatten Drawnix relations into a decorative tree or claim serialized arrows stay attached after editing. |
| sequence | `archify/renderers/sequence/README.md` | Test wrapped messages/notes, participant width and long-page navigation. Preserve order, async/sync and response semantics. Do not assume Archify's documented self-call limitation is acceptable in Mermaid; retain local capabilities. |
| state, loop | `archify/renderers/lifecycle/README.md` (v3) | Derive main path, branches and loop nesting from topology; retain initial/terminal and transition meaning. Add self-loop, skip, shared-exit and nested-state fixtures before new layout behavior. A phase narrative is not automatically a UML state machine. |
| class | `archify/renderers/class/README.md:49` | Preserve dependency/association/inheritance/realization/composition/aggregation marker semantics. Wrap full member signatures rather than silently truncate. Automatic hierarchy buses must fall back when they conflict with other groups. Test mixed solid/dashed relations and long generics. |
| entity-relationship | `archify/renderers/erd/README.md:36` | Require stated cardinalities; preserve PK/FK/UK roles and declared references; diagnose marker capacity and parallel-edge corridors. Do not invent missing schema facts or infer cardinality merely to draw a cleaner model. |
| timeline, gantt | Timeline and Waterfall READMEs | Keep point milestones distinct from duration/dependency schedules. A future trace Waterfall needs a new span payload: common time origin, units, parent/child timing and measured/illustrative provenance. Do not relabel Gantt or generic bars as performance traces. |
| data-chart, bar-chart, line-chart, scatter-plot, radar-chart, quadrant; ranked-funnel | Upstream evidence/readability discipline, not its graph router | Retain quantitative domains, units, data provenance and truthful axis/rank semantics; add long-label and dense-series tests through Vega/Mermaid or the existing ranked-segment owner. Routing improvements do not validate statistics. |
| access-matrix, layer-stack, medallion, venn, nested | Shared bounds, typography and source diagnostics | Retain matrix coverage, order, set membership and containment contracts. Avoid forcing these non-network semantics into an Architecture graph. Test many rows, tall text and nested scope clipping at multiple preview scales. |
| circuit | Shared diagnostics discipline only | Keep Circuitikz component/net/port and toolchain validation authoritative. Architecture lines are not electrical nets; preserve engineering semantics and native compile evidence. |

### Prioritized future implementation roadmap

These are proposed follow-up stages, **not unfinished work silently folded into this batch**:

1. **R1 — Reproducible layout diagnostics.** Extend the existing layout owner with structured source-space reports: stable node/edge IDs, exact routes, collisions, pinned constraints and exhausted search budgets. Acceptance: deterministic fixtures, no secret/source-note leakage, and failure receipts that distinguish renderer output from mounted presentation.
2. **R2 — Coordinated repair for topology and lane-grid.** Replace colliding label fallback with bounded complete-scene proposals; preserve authored payloads and every pinned coordinate. Acceptance: obstruction, CJK, reciprocal, fan-in/out and dense-scene cases; deterministic output, cancellation/budget termination and no new collisions elsewhere. An unresolvable case must remain an actionable failure, not lose an edge.
3. **R3 — Category semantics and reading.** Strengthen Class/ER/Sequence/State tests and then change their own adapters only where gaps are reproduced. Add viewport readability diagnostics rather than imposing one universal font floor. Acceptance: native preview plus relevant editable/vector export semantics, and explicit unsupported behavior.
4. **R4 — Measured scalability and optional reader polish.** Benchmark candidate indexing against exhaustive output; add branch focus/minimap only after scale and accessibility behavior is specified. Keep motion presentation-only, reduced-motion compatible, and canonical SVG/PNG/PDF geometry stable. New trace Waterfall requires separate schema approval and evidence fixtures.

Archify is MIT-licensed; its LICENSE includes tt-a1i and Cocoon AI notices. This batch copied no upstream renderer code. Any future copied implementation must preserve the applicable license/provenance, and be adapted to NoteMD's existing contracts rather than introducing pass-through managers, flag-driven modes or duplicated validation.

## Phase disposition and remaining limits

P0 baseline recovery and P1 repair are implemented. P3 source research and bilingual recommendations are delivered. P2 exercised the production native matrix and the complete test suite, but **is not a clean green acceptance** while the recorded full-suite failures and session-wide settings-integrity limitation remain. The local repair is installed; public 1.9.14 is unchanged. Do not call the future R1–R4 proposals implemented, and do not use a thumbnail matrix as proof of all generated diagrams, all exports or native Drawnix editability.
