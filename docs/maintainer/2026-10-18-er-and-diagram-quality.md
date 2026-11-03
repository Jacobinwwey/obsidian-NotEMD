# ER generation quality and cross-diagram comparison

[中文](./2026-10-18-er-and-diagram-quality.zh-CN.md)

## Scope and recovered state

This continues the completed preview/Slidev repairs, rather than repeating them. Their code, bilingual reports and local acceptance exports are retained. The new request is to compare Archify deeply, improve ER generation end to end, and then examine the remaining diagram families. This is unreleased working development, not an update to published 1.9.14 assets.

Constraints: preserve existing notes, exports, settings and .trellis; no provider/translation calls, package upgrades, embedded upstream runtime, commit, push or release. New generation tests use deterministic fake invokers. The existing Mermaid default and saved legacy ER format remain supported. No arbitrary data or missing SQL fields are fabricated.

## Pinned upstream evidence

A fresh clone is under .cache/archify-quality-reference-20261018. The examined revision is 869f4731dd822921945fc4a52d81e840da21e83d, committed October 18, 2026 at 10:09:08 +08:00. The changelog's latest released section in this snapshot is 3.1.0, October 14, 2026. These are different dates and different claims. The HEAD merge concerns clipboard receipts/website work; ER improvements must not all be attributed to the latest merge.

Primary sources at that revision:

- [ER semantic/layout contract](https://github.com/tt-a1i/archify/blob/869f4731dd822921945fc4a52d81e840da21e83d/archify/renderers/erd/README.md), erd.schema.json, render-erd.mjs, grid.mjs and ER rendering/i18n/capacity tests.
- [Class model](https://github.com/tt-a1i/archify/blob/869f4731dd822921945fc4a52d81e840da21e83d/archify/renderers/class/README.md): members, visibility, stereotypes and relationship-owned UML notation.
- [Sequence model](https://github.com/tt-a1i/archify/blob/869f4731dd822921945fc4a52d81e840da21e83d/archify/renderers/sequence/README.md): participants, segments, messages, activations and measured timeline capacity.
- [Tree contract](https://github.com/tt-a1i/archify/blob/869f4731dd822921945fc4a52d81e840da21e83d/archify/renderers/tree/README.md): one connected acyclic hierarchy, subtree-owned spans and non-truncating labels.
- Workflow/dataflow/lifecycle/timeline/waterfall READMEs, the architecture orthogonal router, SKILL.md and recent routing/readability commits were also examined. There are ten upstream renderer families; Notemd's 33 catalog entries include variants and chart types, so the counts are not equivalent capability measures.

The upstream orders.erd.json was actually rendered with its native render-erd.mjs and checked with check-render-output.mjs. Its checker reports zero errors/warnings, crossings and label-route-clearance issues. The artifact was opened and screenshot in Chromium. A six-table, 36-field, five-relationship Notemd counterpart retains the source grid's reading order and all fields, keys, references, cardinalities and upstream identifying defaults. This explicit fixture translation is not a shipped Archify importer. Domain grouping and explanatory cards were not implemented in Notemd or falsely counted as preserved renderer capabilities.

Local artifacts: .cache/er-quality-evidence/archify-orders.html and archify-orders.png; notemd-orders.html and notemd-orders.png. The Notemd scene is 1488 × 1038 source pixels. These are local investigation artifacts, not CI dependencies.

## Why the old ER chain looked worse

1. The ER prompt profile belonged to the generic legacy family and requested no typed attribute/key/reference contract. Better colors cannot recover facts the model was never asked to return.
2. erAdapter.ts used display labels as ASCII-sanitized, uppercased identities. Two Chinese names could both become __, merging unrelated entities and relationships.
3. Generic children did not encode PK+FK/UK roles, comments, verified FK references or independent endpoint optionality. The old missing-field fallback invented string id.
4. Editable SVG/Draw.io used the generic semanticFigureModel, which flattened fields into independent cards. It could not produce entity tables or native cardinality markers.
5. HTML, Mermaid and editable outputs followed different representations. Minimal two-table/one-field examples failed to expose the semantic loss.
6. The common fixed-card title budget could reject a valid wide measured ER scene and trigger an unexpected fallback to Mermaid. The ER renderer now owns its actual text capacity instead.

## Implemented chain

Source note → ER prompt profile v2 → JSON response parser → canonical entity-relationship payload → edge validation → shared measured ER scene → target serializer and canonical SVG preview.

- Entities retain stable ids independently of labels. Attributes retain original names/types/comments, multiple PK/FK/UK roles and references { entity, attribute }.
- The canonical boundary rejects duplicate identities/attributes, unknown key roles, missing FK targets, dangling references and missing relationship endpoints/cardinalities. ER payloads cannot claim a different intent.
- Each relationship declares one, zero-or-one, one-or-many, zero-or-many or unspecified independently at both ends. Identifying status is independent of cardinality.
- The scene measures key/name/type/detail columns, field rows and incident port capacity. Tables grow rather than cutting fields. Relationship spacing grows for labels; orthogonal A* routes avoid table interiors, spread endpoint ports and support self/parallel relationships.
- SVG draws table-edge crow's feet, optional circles, mandatory bars, explicit unknowns and a derived key legend. Native HTML adds a keyboard-operable, selectable field index and an offline CSP. Standalone HTML has light/dark styling and bounded downscaling with horizontal scrolling for wider diagrams.
- Mermaid keeps aliases, SQL punctuation, key lists, comments and FK targets; unsupported names/types are either rejected with an alternative format or explicitly preserved in comments, never silently discarded. Missing types are labelled unknown, not fabricated as string.
- Mermaid cannot express unspecified cardinality or identifying status faithfully. New canonical input with those unknowns produces an actionable capability error directing the caller to HTML/SVG or Draw.io; it is not guessed or claimed as a successful Mermaid conversion. Existing legacy relationship defaults remain a disclosed compatibility behavior.
- Draw.io contains real table/tableRow/cell objects, literal XML-preserved field line breaks, native ER endpoint markers and shared route waypoints. Mandatory one uses ERmandOne, confirmed against the upstream Draw.io ER palette, not the visually different ERone.
- Mermaid, HTML, editable HTML/SVG and Draw.io attach the same canonical table SVG. This preserves preview/export meaning; it does not promise pixel identity with Mermaid's own external renderer or a native Draw.io editor.
- ER instructions prohibit density-based field/comment omission. The richer three-table example covers composite keys, FK targets, types and independent relationship styles. Existing settings and the catalog's Mermaid default are unchanged.

## Additional defects reproduced and fixed

All five new comparison regressions failed before these fixes:

- Class diagrams merged translated class names into the same identifier. Collision-free identities and human-readable aliases now preserve distinct types.
- Sequence diagrams could merge api-gateway and api_gateway into one participant and turn a real request into a self-message. One participant identity map is now used by declarations and messages.
- Tree traversal hid disconnected/rootless cyclic relationships. Finite component traversal now preserves every source node and edge, including self-relations and forests; visible notices and orange dashed cycle edges disclose non-tree structure without blocking rendering.
- A ten-sibling tree used negative gaps in a fixed 1040px canvas: 170px nodes were only about 102.73px apart. Width now follows the widest level and reserves at least 24px between siblings.
- Lane-grid edges could end at empty space when a valid coordinate had no authored step. Referenced missing steps now render explicit “Not provided” placeholders, retaining original handoffs without invented business content. Visible caveats survive export. Unknown coordinates remain invalid. This applies to data-flow/process, not the separate legacy Mermaid swimlane model.

These fixes do not claim that class/sequence gained complete dedicated SVG/Draw.io semantics. Their generic editable card projection remains a known limitation.

## Review of all 33 catalog entries

Priority indicates next investment, not a promise that a new engine was shipped. P1 means semantic/readability work before cosmetic polish; P2 means refinement after semantic fidelity. Existing constrained types may intentionally reject over-budget inputs.

| Entry | Current owner and comparison finding | Direction / status |
|---|---|---|
| mermaid-mindmap | Mermaid hierarchy; source-text and whole-view fitting already exist. Not the same contract as Archify tree. | P2: leaf-run compaction and optional focus views without dropping labels. |
| drawnix-knowledge-map | Native Plait tree plus material cross-relations, supported saved reconstruction and attachments. | P1: native-editor cross-branch attachment/round-trip evidence; do not equate static arrows with attached native arrows. Prior preview fix retained. |
| flowchart | Mermaid handles normal flow; editable projection is generic cards/cubic connectors. | P1: decision/result roles, branch labels and dedicated orthogonal editables. |
| sequence | Mermaid participant/message chain; sanitization collision fixed here. Editable projection has no true lifelines. | P1: typed messages/returns/activations/alt-loop fragments, then dedicated SVG/Draw.io. |
| state | Mermaid states/transitions; generic editables lack lifecycle grouping. | P1: source-backed initial/final/superstates and transition notes; no invented happy path. |
| class | Label collision fixed; generic nodes do not represent attribute/method compartments. | P1: a typed class model with visibility/static/abstract members and six distinct UML relationship meanings. |
| entity-relationship | Typed model, measured tables, canonical previews and native table export implemented. | Remaining P1: domain/connected-component layout, route-crossing and label-versus-other-route diagnostics, native editor reopening. |
| canvas-map | JSON Canvas spatial contract, not a typed ER/UML substitute. | P2: group/domain-aware positioning, native reopen checks and faithful optional focus. |
| data-chart | Vega-Lite auto chart selection with source numeric constraints. Archify ER aesthetics do not replace a data visualization grammar. | P1: units, zero/baseline policies, missing values, uncertainty and accessible table alternatives. |
| radar-chart | Dedicated axis/series/scale model already exists. | P1: legible axes, comparable scales and dense-series accessibility; never imply unsupported precision. |
| org-chart | Dedicated ownership/reportsTo model with bounded tiers. | P2: subtree-based spacing and owner metadata retention; remain distinct from generic tree. |
| timeline | Mermaid dated event sequence is not a proportional time axis. | P1: typed timezone-aware instants, simultaneous-event packing and explicitly marked axis breaks. |
| swimlane | Legacy Mermaid lane/step model. | P1: explicit cross-lane handoff semantics; do not silently reinterpret it as a canonical lane-grid. |
| quadrant | Bounded x/y facts with four regions. | P2: dense point-label placement and accessible coordinates; do not move points for decoration. |
| circuit | Constrained CircuitSpec/Circuitikz golden topologies. | P2: extend only with a validated topology/reference and native TeX evidence; no unconstrained engineering claims. |
| bar-chart | Vega-Lite quantitative variant. | P1: category/unit preservation, sorting policy and source-backed scale; compare all text at export size. |
| line-chart | Vega-Lite ordered observations. | P1: missing-data gaps, time granularity and source order; no invented interpolation. |
| scatter-plot | Vega-Lite paired numeric observations. | P1: units, point overlap and honest trend/uncertainty; no unsupported causal annotation. |
| architecture | Canonical topology/zones; local midpoint routes are not a universal obstacle router. | P1: domain/obstacle-aware routing, boundary ports and crossing diagnostics. |
| current-state | Same topology owner with before-state semantics. | P1: retain manual/brittle interfaces and baseline evidence; do not imply a target architecture. |
| integration-topology | Topology owner and labelled protocols. | P1: connector types/protocol ownership, dense hub ports and external-system boundaries. |
| data-flow | Canonical lane-grid with payload chips; missing endpoint-cell bug fixed. | P1: measured corridor/label budgets, exact handoffs and source-backed data-store semantics. |
| access-matrix | Typed closed permission levels and matrix cells. | P1: distinguish absent/unknown from explicitly none in future versioning; add keyboard row/column reading. |
| gantt | Schedule payload with start/end and milestones; not an execution waterfall. | P1: time-unit parsing and truthful ordinal-vs-time axes; no invented dependencies/critical path. |
| layer-stack | Ordered layer model. | P2: preserve order/contracts and wrap details without turning thickness into an unstated quantity. |
| venn | Two/three sets and declared memberships. | P1: visibly disclose schematic areas; geometric area is not quantitative evidence. |
| ranked-funnel | Ranked segments with optional source values. | P1: distinguish ranked stages from measured conversion; label unavailable denominators. |
| loop | Cycle stations/hub and explicit return. | P2: legible spoke/return labels and true source-backed iteration semantics. |
| nested | Dedicated containment levels; prior occlusion layering repair retained. | P2: readable long scope labels and restrained emphasis; no false hierarchy by decorative nesting. |
| tree | Canonical hierarchy; annotated cycle/forest recovery and width-based sibling spacing fixed here. | P1: subtree-owned spans/parent centering and compact leaf lists, not merely a wider whole-view image. |
| process | Canonical lane-grid; missing endpoint-cell bug fixed. | P1: meaningful actor handoffs/branch outcomes, with no data-payload assumptions from data-flow. |
| medallion | Ordered quality tiers, not measured amounts. | P2: promotion/lineage contract labels without fictitious quantitative thickness. |
| high-level | Bounded topology overview. | P1: domain-first composition and optional focused views; preserve a truthful overview rather than hiding complexity. |

## Cross-family priorities and acceptance contracts

The recurring issue is semantic loss before layout. The useful lesson from the examined Archify family contracts is to give each notation its own facts and capacity rules, not to reuse its palette or force all 33 catalog entries through one card model. The following is a proposed next-investment order, not additional implemented functionality.

1. **Class and sequence first.** Class generation needs explicit attributes/methods, visibility and relationship kinds before SVG compartments can be faithful. Sequence generation needs an ordered message/event model, replies, activations and fragment scope before native lifelines can exist. The current identifier repairs prevent merging but do not add these facts. Acceptance: bilingual/colliding identities remain distinct; every authored member/message survives each supported target; unsupported notation fails explicitly rather than becoming an ordinary arrow. Include recursive calls, parallel fragments, empty classes and long signatures.
2. **Architecture and integration next.** Topology validation already owns nodes/zones, but dense-route quality requires boundary ports and obstacle-aware corridors rather than more midpoint offsets. Keep current-state facts separate from target-state recommendations. Acceptance: connectors do not traverse unrelated node interiors; port attachments survive native editing; crossings and label-route conflicts are measured and surfaced. Test hubs, reverse links, nested zones and disconnected components. A node-only overlap check is insufficient.
3. **Tree, organization and knowledge maps.** The broad-tree fix establishes nonnegative sibling spacing, not optimal hierarchy composition. Allocate width by subtree, center parents over descendants and offer explicit detail views without deleting branches. Organization ownership and Drawnix cross-links must keep their separate contracts. Acceptance: all nodes remain reachable exactly as declared, parent/child ownership survives export, and native cross-branch arrow attachment is verified in Drawnix rather than inferred from static SVG. Test asymmetric deep trees and wide leaf runs.
4. **Process, swimlane and data flow.** A valid endpoint cell is necessary but does not establish a correct actor handoff, decision outcome or payload movement. Keep process and data-flow meanings distinct even when their geometry shares lanes. Acceptance: every edge resolves to an authored step or explicitly unprovided placeholder at a declared coordinate; branch outcomes and cross-lane ownership remain visible; long labels fit measured corridors; no empty step, store or transfer is invented. Legacy swimlane migration requires an explicit conversion contract.
5. **Time and quantitative charts.** Timeline event order, Gantt duration and execution waterfall are different semantics. Similarly, radar, bars, lines and scatter plots need units, missing-value and scale policies before visual polish. Acceptance: exported values reconcile with the source; time-axis proportionality/ordinal behavior is disclosed; missing observations stay missing; no unprovided critical path, interpolation, uncertainty or causal claim appears. Add tabular alternatives and inspect final-size labels, not only viewBox bounds. Archify ER geometry is not a replacement for Vega-Lite.
6. **Matrices, sets and ranked/structural diagrams.** Access matrices should distinguish unknown from an explicit denial in a versioned contract. Venn areas and funnel widths must disclose when they are schematic rather than measured. Nested/layer/medallion diagrams must retain containment/order without implying quantity through thickness. Acceptance: source facts remain identifiable after export, absent facts are not converted to zero/none, and keyboard/text alternatives preserve row/column or membership context.

For each future family, gate the whole chain: source-backed prompt fixture → validated typed payload → measured scene → target capability check → canonical preview → exported/native-consumer evidence. Compare a single equivalent source across formats, including long Chinese labels, unknowns and density limits. Structural tests establish semantics; browser geometry establishes local readability; a native editor round trip establishes editability. None substitutes for the others. Existing completed preview and ER work should be reused, not rewritten to pursue this roadmap.

## Verification and evidence boundaries

This section records the previous checkpoint. The later nonblocking recovery, all-green full suite and actual 1Knowledge deployment supersede its remaining-state notes; see [acceptance and Vault deployment](./2026-10-18-acceptance-and-vault-deployment.en.md).

- Initial ER quality regression: 16 expected behavioral failures, including actual Chinese identity merging and invented fields. Additional route/annotation and five-family regressions were also observed failing and then repaired.
- Latest focused run: 8 suites / 102 tests passed; production build succeeded. Real Chromium tests run the installed Mermaid engine for canonical ER, empty legacy ER, class aliases and sequence identity collisions rather than the Jest mock.
- Light/dark standalone HTML measurements: two entities/four fields preserved; zero text outside the canvas or entity bounds; text remains selectable; field-index summary targets measure 60px high and open by keyboard.
- The source-equivalent six-table/36-field comparison was visually inspected in both implementations. A separate 32-table/31-link high-fanout routing probe took approximately 10ms locally (observational only, no universal performance guarantee).
- Frontend Law Auditor ran on measured evidence only: two visible disclosure choices and minimum target 60px. Twenty principle checks remain unknown, including p95 acknowledgment, full task completion and action reach. Its partial score is not a release-readiness score. No template sample metrics are presented as observations.
- The selected UI-UX Pro Max design-system generator could not run: the installed scripts path is a link-text placeholder whose target is absent. Accessibility/typography/spacing guidance was applied manually; no generated design-system result is claimed.
- Fresh full-suite, lint/audits and native integration results are recorded in the final verification section below. A previous untouched release-publisher fixture has a 20-second child-process timeout; it must be reported if it recurs rather than patched to hide a failure.

### Not claimed

Universal zero crossings, avoidance of every label-versus-other-route collision, domain grouping, subtree centering, all-33-type visual parity, native Draw.io reopening, universal 128-table readability, native PowerPoint semantic editing, full application UX law signoff or a live provider's generation quality. Canonical preview validation and XML structure do not establish native-editor fidelity. Saved outputs are immutable; regenerating from a source is necessary to obtain the new semantics.

### Final verification

- Fresh production build passed after the final example-title compatibility adjustment. The 33-entry examples check passes. Only the ER SVG/PNG/gallery manifest entry was refreshed; other archived examples and Vault artifacts were preserved.
- Final focused run: 7 suites / 52 tests passed, including real Mermaid rendering, ER geometry/layout, the 33-type example catalog, cross-family regressions and native drag selection. The selection test now gives browser launch, interaction and cleanup explicit bounded 30-second budgets; its selection assertions are unchanged. Report: .cache/archify-quality-final-focused-20261018.json.
- The completed unfiltered full run took 1600.055 seconds: 323/325 suites passed; 3141 tests passed, 7 failed and 1 skipped (3149 total). Six failures were the untouched release process fixture returning status null at its existing 20-second child timeout. The seventh was the selection browser test at Jest's default 5-second timeout, subsequently corrected and passing in focused runs. This full run was not green.
- A fresh isolated release/selection rerun took 642.123 seconds: selection passed; the untouched release suite had 40 passed and 5 failed, again status-null child timeouts and Windows EBUSY cleanup. No release code, assertions or timeout was changed. This is a remaining verification failure, not evidence that release behavior is correct.
- Final regression rerun excluding that separately exercised release fixture: 324/324 suites passed; 3103 passed and 1 skipped (3104 total), in 416.342 seconds. This includes the selection browser test and prior Slidev/native-preview/Mermaid workflow regressions. Report: .cache/archify-quality-final-regression-20261018.json. This is not an unfiltered all-green suite; the separate release failures above remain open.
- Fresh lint ratchet: 44 changed TypeScript files, zero regressions against ba2399097204. UI-string and render-host audits passed; git diff --check passed with line-ending warnings only.
- Gallery check still reports stale manifest content and five non-ER SVG archives: drawnix-knowledge-map-architecture, org-chart-support-ownership, timeline-roadmap, swimlane-release and quadrant-priorities. Current rendering passed its geometry/responsive gates, but archive identity did not. The comparison showed changed dimensions/serialized runtime styles; the precise baseline cause was not established. They were not bulk-regenerated to hide the mismatch. The refreshed ER entry no longer fails this check.
- Actual sanitized host SVG has zero presentation diagnostics and retains four fields. Actual PNG export produced 953 × 464 pixels at 96 PPI, 33,078 bytes; actual PDF export produced 75,814 bytes. PNG was visually inspected. Evidence is under .cache/er-quality-evidence, including actual-exports.json, er-export-96ppi.png and er-export.pdf.
- PDF export generation is established, not PDF visual/text reopening: the local pdftoppm wrapper lacks its runtime, and a read-only Obsidian PDF.js render attempt exceeded its 60-second CLI budget without a rendered image. Native Draw.io reopening also remains unverified.
- Official Obsidian CLI help returned usable output; the optional obsidian-cli wrapper is not installed. The new ER bundle has not been copied over the installed 1Knowledge candidate. Original settings/notes/exports were not replaced; saved output must be regenerated to acquire new ER semantics. No commit, release or dependency upgrade was performed.

Local command logs and JSON are under .cache/archify-quality-*; no committed test depends on that private cache.
