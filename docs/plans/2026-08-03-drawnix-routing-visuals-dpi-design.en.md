---
topic: drawnix-routing-visuals-dpi
status: implemented
---

# Drawnix Routing, Source Visuals, And DPI

## Scope

Drawnix knowledge maps may contain several top-level roots. Cross-root relations must remain readable even when an unrelated root is placed between the endpoints. Source Mermaid fences and Obsidian image embeds must survive artifact generation without entering the LLM semantic schema. Raster export must accept any integer DPI from 72 through 600, with 100, 300, and 600 exposed as common presets.

## Architecture

- Forest packing publishes deterministic `DrawnixRootRegion` rectangles and a stable `rootId` on every placed node.
- `DrawnixCrossRootRouter` performs deterministic orthogonal grid routing against unrelated root regions as hard obstacles. It falls back to an outer perimeter route with an explicit warning; the same relation points feed native Drawnix arrows and SVG paths.
- `scanSourceVisualReferences` is a pure Markdown scanner. It records ordered source ranges and hashes, ignores image syntax inside fenced blocks, and never places source bytes in `DiagramSpec` or the LLM prompt.
- The command host resolves vault-relative images through binary reads. Drawnix emits source Mermaid Markdown, rendered/safe SVG, image binaries, and a JSON manifest as validated companions. Unresolved references remain in the manifest with diagnostics.
- Render cache keys include the resolved visual manifest hash.
- Preview rasterization accepts any integer from 72 through 600 DPI, with 300 as the default and 100/300/600 exposed as common presets in the settings hint. Out-of-range values are clamped. PNG `pHYs` metadata and PDF raster dimensions use the normalized value; SVG and Drawnix geometry remain DPI-independent.

## Hardening Increment

- Cross-root routing is now fail-closed. The router never emits a direct segment after obstacle routing fails; it throws an explicit fallback error so the generation service can select a non-Drawnix target instead of producing a misleading relation that crosses an unrelated root.
- Parallel relations with identical endpoints receive deterministic offset lanes before grid routing. This keeps labels and arrow strokes legible without changing the semantic edge contract.
- Source visuals have a two-layer persistence contract. The native `.drawnix` JSON contains only a namespaced `metadata.notemd.sourceVisuals` index with hashes, resolution state, source paths, and relative companion names. Mermaid source, sanitized SVG, and binary image bytes remain in the scoped `.assets` directory. The Obsidian wrapper embeds those companions for review. No base64 payload or unverified Drawnix image element is injected into the native element stream.
- Artifact saving is transactional for both newly created and already existing files. Text and binary files are snapshotted before overwrite and restored when a later companion, artifact, or wrapper write fails.

## Verification

Focused tests cover obstacle avoidance, deterministic parallel routes (including duplicate endpoints), fail-closed routing, source scanning/resolution, sanitization, native attachment metadata, scoped companion path rewriting, transactional companion persistence, cache invalidation, PNG metadata and DPI normalization. Full Jest, TypeScript build, official Obsidian CLI validation, render-host audit, and `git diff --check` are release gates.
