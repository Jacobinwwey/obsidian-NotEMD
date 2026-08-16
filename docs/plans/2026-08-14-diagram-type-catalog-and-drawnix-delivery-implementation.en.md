# Diagram Type Catalog And Drawnix Implementation Record

> Updated: 2026-08-15
> Status: Superseded delivery design; native filename-rooted tree is shipped.

## Decision

The former `document-tree` / `full-board` / `presentation` matrix has been removed. It introduced a second semantic and persistence plane: the board could only be saved after replay metadata passed a separate validation path. That path failed in the real `E:\1Knowledge` run before any artifact was written.

Drawnix now has one contract. `DiagramSpec` stays the semantic boundary, source coverage creates a single document root, the native projection owns geometry, and `DrawnixRenderer` writes one board plus its SVG companion. There is no replay record, delivery selector, preview conversion, or presentation bundle.

## Current Contract

- `drawnixMindmap` remains the persisted intent and `drawnix-knowledge-map` remains the catalog ID.
- The root label is the source filename without its extension. For `architecture.zh-CN.md`, the native root is `architecture.zh-CN`.
- Markdown headings become nested branches. Model branches that do not match source structure are placed under `Additional concepts`; they are not discarded.
- The renderer exports `.drawnix`, `<source>_diagram.drawnix.svg`, and the Markdown wrapper used by Obsidian preview.
- Cross-branch relationships are native `arrow-line` elements. Layout reserves exterior corridors from measured label geometry, tries direct horizontal ingress first, then uses obstacle-aware grid routing. When every horizontal pair is sealed, the grid retry adds top and bottom ports while retaining the native label on its reserved lane. The grid retains exact finite endpoint coordinates; it does not quantize a subpixel node boundary out of the route graph.
- The allocator has no depth, node-count, or relation-count quota. Tests assert geometric invariants instead of prescribing one route shape.
- Mermaid `mindmap` remains on `MermaidRenderer`; its prompt, fallback, repair, cache, and command behavior are unchanged.

## Compatibility

`loadSettings()` removes the obsolete persisted `drawnixKnowledgeMapDelivery` field and persists the sanitized record on the first legacy load. The artifact CLI still accepts `--drawnix-delivery` so existing scripts do not fail argument parsing, but the value is ignored. New output never carries `metadata.notemd.knowledgeMap`.

This is intentionally a behavior change for users who relied on the withdrawn full-board or presentation artifacts. Keeping the switch would preserve the failure-prone second contract and make the default ambiguous. Existing `.drawnix` files remain ordinary Drawnix data; they are not rewritten or reconstructed.

## Root Cause And Resolution

The failing vault log reported `Drawnix knowledge-map replay record failed validation before export`. The failure was in the retired replay validator, before a filesystem write. It was not caused by the `E:\1Knowledge` path, vault permissions, or an Obsidian renderer limitation.

The replacement removes that validator from the generation path. Subsequent real-vault runs exposed two independent reserved-lane issues. The fallback grid rounded coordinates while looking up its source and lane terminals, so an otherwise valid fractional boundary could be treated as absent. A later 387-obstacle run then showed that horizontal node ports can both be sealed even when an exterior route remains available. The grid keeps exact finite coordinates and retries through top and bottom ports only after horizontal ingress fails. The regression suite covers subpixel routing, a 331-node same-side parent relation, a 383-node tree with 35 same-side relations, and the minimized vertical-port ingress case. Source coverage and native export remain the only Drawnix-specific stages after `DiagramSpec` validation. This returns the visual structure to the requested complex tree rooted by the document filename without introducing a depth, node, or relation quota.

The apparent `E:\1Knowledge` write failure had a separate configuration cause: the persisted custom Mermaid output directory still pointed to a prior runtime test folder. Diagram artifacts intentionally share that legacy destination setting. Resetting it restored source-sibling `.drawnix`, SVG, and wrapper output; no vault permission or frontend-path defect was involved.

The final real-vault reproduction exposed a separate liveness fault. A stalled provider request left the diagram command's `isBusy` guard set after the bridge client timed out; client process termination does not cancel the plugin's in-flight promise. `runDiagramGenerateOperation()` now owns a five-minute, reporter-backed abort controller and forwards its signal to every diagram LLM call, including structured retries and the legacy Mermaid fallback. It clears the controller in `finally` and suppresses fallback after cancellation. This is an external-provider deadline, not a topology limit.

## Verification

- `src/tests/drawnixSourceCoverage.test.ts` covers filename roots, heading coverage, unmatched branches, and edge remapping.
- `src/tests/drawnixMindMapRenderer.test.ts`, `src/tests/drawnixRelationLaneLayout.test.ts`, and `src/tests/drawnixMindMapRouting.test.ts` cover native hierarchy, labels, deterministic routing, exterior corridors, and complex cross-branch relations.
- `src/tests/diagramGenerateOperation.test.ts` covers deadline cancellation and reporter-controller release for stalled diagram calls.
- `src/tests/diagramExampleCatalog.test.ts` requires the shipped Drawnix catalog example to have one `architecture.zh-CN` root and no obsolete metadata.
- `src/tests/diagramArtifactExportCli.test.ts` checks the offline artifact CLI, including the compatibility no-op for legacy delivery input.
- A fresh build, full Jest run, Vault bundle verification, plugin reload, and `diagram.generate` invocation against `docs/architecture.zh-CN.md` are required before release. The final 2026-08-15 `E:\1Knowledge` run produced one `architecture.zh-CN` root with 332 native tree nodes and 9 `arrow-line` relations, plus the Drawnix SVG companion and Markdown wrapper. Model topology is intentionally data-dependent; the invariant is a single filename root with all accepted relations retained.

## Follow-up Boundary

The remaining integration proof is a real Drawnix consumer opening the native JSON, not another layout mode. Keep that check outside the production bundle. Any future delivery feature must identify a distinct user contract and must not recreate replay metadata as a prerequisite for writing the primary artifact.
