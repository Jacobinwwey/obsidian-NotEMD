# Diagram type compatibility and multiple outputs

Status: proposed design; not implemented by the October 1 export fixes. [中文](2026-10-01-diagram-output-compatibility-design.zh-CN.md)

## Problem and recommendation

“Preferred Output Format” currently selects a `RenderTarget`. It mixes rendering engines, editable source formats, and HTML presentations. Settings and the sidebar repair incompatible selections by resetting another preference after the selection. Users cannot see the restriction beforehand and cannot request several artifacts from one generation.

Keep chart type as a single selection and replace the output dropdown with an **Output files** checkbox group. Both controls use one capability calculation. Disable incompatible choices before selection, explain why, and preserve explicit choices. Generate the semantic content once, then export all selected formats from that content.

This is a design for the diagram workflow. PPTX and MP4 remain part of the separate Slidev presentation workflow; their success in this demonstration does not establish support for every diagram renderer.

## What the two existing HTML options mean

| Existing option | Actual behavior | Proposed label |
| --- | --- | --- |
| HTML (`html`) | Structured reading page containing the node hierarchy, relationships, tables, and evidence. It does not preserve the chart's geometric layout and has no preview SVG/export-image capability in its descriptor. | HTML structured summary |
| Editable HTML/SVG (`editable-html-svg`) | HTML containing deterministic SVG geometry and semantic/editing metadata, including `data-drawio` attributes. It has a preview SVG and SVG/PNG/PDF exports. It is not a complete browser WYSIWYG editor. | HTML diagram preview; explain SVG/editing metadata in supporting text |

Both save `.html`. A filename extension alone does not define their meaning. The Drawnix HTML in this demonstration wraps the original SVG for viewing, zooming, and downloading. It does not switch the Drawnix chart to the generic `html` renderer. Product support for this derived HTML wrapper is part of the proposed implementation.

## Alternatives

1. **Recommended: separate delivery formats from render targets.** Keep targets internal to planning, expose meaningful output files, and derive compatibility from the existing catalogs. This directly addresses multiple exports and eliminates the current label ambiguity.
2. Add disabled entries and checkboxes to the existing target selector. Smaller UI change, but selecting two engines can produce different geometry, and selecting PDF/PNG still requires a second concept. It retains the underlying ambiguity.
3. Use independent chart and export dialogs. It accommodates complex exports but reveals incompatibility too late and makes persistent preferences harder to understand.

## Ownership and capability model

Reuse `diagramTypeCatalog.ts` as the owner of semantic type-to-target compatibility and `renderTargetCatalog.ts` as the owner of target capabilities. Extend their descriptors instead of copying a matrix into settings, sidebar, preview, and CLI code.

Stable output identifiers should distinguish `source:<target>`, `html-diagram`, `html-summary`, `svg`, `png`, and `pdf`. Source identifiers retain native semantics: `source:drawnix` is a `.drawnix` artifact, not a generic promise of editability. The internal renderer ID remains separate from the delivered file ID.

The compatibility calculation belongs with diagram preference planning. It returns admissible types, admissible outputs, and localized reason keys. The generation planner resolves a complete export plan using the same descriptors. UI components render this result; they do not infer compatibility from extensions or labels. The export executor owns dependency ordering, cancellation, writes, and per-artifact outcomes.

A route must be an explicitly supported derivation from a compatible renderer. SVG, PNG, PDF, and HTML diagram preview share that renderer's deterministic preview. An HTML structured summary uses the summary renderer only if that type explicitly permits it. Multiple native sources require an explicitly declared common plan; the initial implementation must not infer lossless native conversions or change chart type to obtain them.

Semantic support and environment readiness are different facts. Missing Chromium, FFmpeg, or a native compiler produces a prerequisite message at preflight; it must not silently change the compatibility matrix.

## Bidirectional selection contract

Let `P(t, S)` mean there is a declared plan for type `t` that produces every output in set `S` without changing semantic type or violating source-fidelity requirements.

- A type is enabled exactly when `P(type, selectedOutputs)` holds.
- With an explicit type, an unselected output is enabled exactly when `P(type, selectedOutputs ∪ {output})` holds.
- With Auto type, it is enabled if at least one executable type satisfies the same condition. Auto generation is then restricted to this candidate set.
- Selected outputs remain removable, including stale or conflicting saved selections. A disabled option must never prevent recovery.
- No explicit output selections means automatic default output, using the chosen type's existing default target. The UI says “Automatic output” and shows the resolved filename type before execution. It does not mean export nothing.
- Invalid legacy combinations remain visible as a conflict and block Generate until resolved. “Use automatic chart type” and “Clear output filters” are explicit recovery actions.
- Changing either control never silently deselects the other control. Switching to a disabled option first requires removing its conflict through an explicit action.

Examples:

| User selection | Enabled behavior | Disabled behavior |
| --- | --- | --- |
| Drawnix source | Drawnix knowledge map; additional SVG/PNG/PDF and proposed HTML diagram preview | Nested Scope and types without a Drawnix route; HTML summary unless an explicit compatible route is introduced |
| Nested Scope (`nested`) | HTML diagram preview, HTML structured summary, SVG/PNG/PDF through the compatible SVG renderer | Drawnix source and other incompatible native sources |
| Auto + SVG + PDF | Types having one compatible preview route for both outputs | Types offering only a structured reading page |
| Nested Scope + HTML summary + SVG | One semantic specification feeds the two declared compatible renderers; the summary label explains its different presentation | Any implied conversion of the summary DOM into the original diagram SVG |

All example capabilities must be mechanically verified against descriptors during implementation. The current Drawnix type declares only `drawnix`; Nested Scope declares `editable-html-svg` and `html`.

## Interaction and accessibility

Use native radio/select semantics for type and checkboxes for outputs, grouped into **Native source** and **View / image files**. Show disabled items with reduced emphasis plus a short reason such as “Nested Scope cannot produce Drawnix source.” Do not rely on color or hover alone. Provide an adjacent, keyboard-reachable compatibility explanation and `aria-describedby` associations. Checked items remain keyboard-removable. A polite live region announces compatibility changes without moving focus.

Settings stores defaults; the sidebar can override them for a run. Both consume the same selection operation and render the same reason strings. Preview export uses the generated session's fixed type/specification rather than unrelated settings changed after generation. CLI/API requests receive structured unsupported-combination errors with suggested removals, not silent fallback.

For multi-select counts, use labels such as “3 output files selected.” Show real filenames before writing. Display HTML summary versus HTML diagram preview as separate choices with separate filenames, such as `topic.summary.html` and `topic.diagram.html`.

## Execution, persistence, and recovery

1. Validate persisted settings and CLI/UI requests at their boundaries. Resolve the immutable type/output selection and preflight its prerequisites before any paid generation.
2. Generate one canonical specification, or one Slidev deck for the separate presentation workflow. Record its identity and selected outputs in the run.
3. Render shared intermediates once. Export dependent files with bounded concurrency; serialize external native applications that require it.
4. Write each artifact to a temporary sibling, verify it, then commit its path. Never overwrite a user's unrelated file. A stable run manifest records successful, failed, and cancelled formats, hashes, and errors without credentials.
5. Cancellation stops pending exports and supported active subprocesses. Keep completed files and clean only owned temporary files. Report partial completion explicitly.
6. Retry only failed outputs using the same stored specification/intermediates where valid. If a prerequisite or source changed, revalidate affected dependencies. Do not make another LLM request merely to retry PDF.

Persist a versioned output-ID array, for example `preferredDiagramOutputs`, alongside the semantic type preference. Keep legacy target data during migration for recovery and downgrade compatibility. Map old `html` to `html-summary`, old `editable-html-svg` to `html-diagram` with its compatible renderer constraint, and native targets to their native source IDs. Preserve Auto as the automatic default. Migration is idempotent and validates the combination once. Unknown IDs and incompatible legacy pairs are surfaced, not silently discarded or replaced. Delay saving a migration until the user changes settings or the existing normal persistence boundary commits it; do not rewrite settings during read-only inspection.

Existing `.drawnix.md` wrappers remain Obsidian previews; “Drawnix source” downloads the raw `.drawnix` artifact. Naming and manifests must distinguish wrappers, sources, and derivatives.

## Implementation sequence and acceptance

This sequence is proposed future work, not a claim that the UI has changed.

1. **Capability contract and migration:** extend descriptors; implement plan existence and selection transitions; test every catalog entry, unknown IDs, legacy Auto, idempotence, and conflicting saved pairs.
2. **Settings and sidebar:** replace single output selection, wire shared compatibility, localize reasons, and verify keyboard, focus, disabled explanation, Auto, deselection, and conflict recovery.
3. **Export execution:** shared specification/intermediates, derived HTML preview, collision-safe files, partial failure/cancellation, and retry. Test that multiple outputs and retry call the LLM once.
4. **Real consumers:** use the open test Vault via CLI; validate Drawnix source + HTML/SVG, Nested Scope HTML/SVG/PNG/PDF, persisted restart behavior, and unchanged unrelated settings. Test offline formulas/fonts and byte-split Unicode in user generation routes.

Required invariants include: type-first and format-first selection yield the same supported set; no enabled choice produces an impossible plan; a selected conflict is always removable; settings/sidebar/CLI agree; unknown outputs fail explicitly; absent tools do not rewrite semantic preferences; partial success remains accessible. PPTX/MP4 receive their own presentation capability tests rather than being advertised as general diagram exports.
