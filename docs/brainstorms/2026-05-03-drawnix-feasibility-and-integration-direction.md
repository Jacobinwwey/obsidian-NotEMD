---
date: 2026-05-03
topic: drawnix-feasibility-integration-direction
---

# Drawnix Feasibility and Integration Direction Audit

## Audit Scope

- Upstream project: `plait-board/drawnix`
- Verified baseline: `develop@e28ba80`
- Goal: determine what Drawnix is actually useful for in Notemd, and separate reusable boundaries from host-level complexity that conflicts with the Obsidian plugin model

## Repository Snapshot

Drawnix is not a lightweight renderer. It is a full whiteboard application stack:

- Nx monorepo
- React 19 + Vite
- `packages/drawnix`, `packages/react-board`, `packages/react-text`
- Plait stack: `@plait/core`, `@plait/draw`, `@plait/layouts`, `@plait/mind`, `@plait/text-plugins`
- Slate rich-text stack
- `browser-fs-access`, `localforage`, `mobile-detect`

In practice it behaves like a browser-native product whiteboard SaaS, not like a small renderer library that can be dropped into an Obsidian plugin main bundle.

## Confirmed Strengths

### 1. Clear data boundary

`packages/drawnix/src/data/types.ts` defines a stable export shape:

- `type: 'drawnix'`
- `version`
- `source: 'web'`
- `elements: PlaitElement[]`
- `viewport`
- `theme`

That means the most useful Drawnix asset is its **board data model**, not a specific UI widget.

`packages/drawnix/src/data/json.ts` reinforces that conclusion: the JSON path is a first-class import/export boundary, not an incidental debug format.

### 2. Conversion capabilities are isolated and lazy-loaded

`markdown-to-drawnix.tsx` and `mermaid-to-drawnix.tsx` both dynamically import:

- `@plait-board/markdown-to-drawnix`
- `@plait-board/mermaid-to-drawnix`

That is an important signal: even Drawnix treats conversion as a heavy optional capability, not as an always-on mainline dependency.

Those dialogs also convert into live board elements inside the app shell, which means they are designed for an interactive browser product boundary, not for a lightweight background adapter embedded in another host.

### 3. Layering is worth studying

Its separation between app shell, board, text renderer, and conversion dialogs is a good architectural reference for Notemd:

- separate host UI from conversion logic
- separate data format from interaction host
- isolate heavy runtime features behind explicit boundaries

## Structural Misfit with Notemd

### 1. Host assumptions are browser-app assumptions, not Obsidian-plugin assumptions

The Drawnix codebase directly depends on:

- `window`
- `document`
- `localStorage`
- `browser-fs-access`
- `MobileDetect`

Concrete evidence:

- `packages/drawnix/src/drawnix.tsx` builds a full React board shell with toolbars, popups, dialogs, and `window.navigator.userAgent` detection.
- `packages/drawnix/src/data/filesystem.ts` hard-depends on `browser-fs-access`.
- `packages/drawnix/src/data/json.ts` routes `.drawnix` open/save through browser file-picker flows.

That assumes a full browser host with file pickers, DOM overlays, browser storage, and rich interactive menus. Notemd's controlled boundary is much narrower:

- Obsidian plugin main thread
- limited iframe / `srcdoc` render hosts
- desktop and mobile plugin compatibility concerns

Embedding the full Drawnix host would turn today's contained preview boundary into a full front-end application hosting problem.

### 2. Drawnix solves a different product problem

Drawnix centers on interactive board editing:

- mind map editing
- flowchart editing
- freehand drawing
- open/save file flows
- image export
- toolbars, popovers, menus

Notemd's mainline goal is different:

- generate structured diagrams from notes
- save them as Obsidian-friendly artifacts
- preview/export them inside a plugin

So the mainline gap is not "we need a full whiteboard editor". It is "we need stronger spec-first generation, runtime boundaries, and sustainable verification".

### 3. Reusing Drawnix converters directly does not solve the core architecture problem

`mermaid-to-drawnix` and `markdown-to-drawnix` are interesting, but if Notemd routes through:

`DiagramSpec -> Mermaid/Markdown string -> Drawnix converter -> PlaitElement[]`

it creates two regressions:

1. the new `DiagramSpec` semantic layer gets downgraded back into strings
2. conversion quality becomes tied to Mermaid/Markdown text quality instead of spec quality

That would undercut the most important improvement in the current roadmap: **LLMs should emit structured semantics first, then target-specific adapters should render from that structure.**

### 4. Robustness depends on geometry/layout ownership, not only schema compatibility

The `.drawnix` container format is straightforward JSON, but practical compatibility still depends on who owns:

- Plait element selection
- point generation / board geometry
- viewport defaults
- theme translation

So "we can emit JSON" is not enough. A robust Notemd integration would need an adapter that owns semantic-to-board projection explicitly. Reusing the file format without owning that projection would create fragile, hard-to-debug exports.

## Feasibility Matrix

| Direction | Feasibility | Risk | Conclusion |
|---|---|---|---|
| Embed the full Drawnix host/UI | Low | Very high | Do not do this |
| Reuse Drawnix as a new preview host | Low | Very high | Do not do this |
| Borrow the app/board/text layering ideas | High | Low | Yes |
| Use `.drawnix` as a future export target | Medium | Medium | Reasonable future option |
| Prototype isolated `mermaid-to-drawnix` / `markdown-to-drawnix` use | Medium-low | Medium-high | Experimental only |
| Build a native `DiagramSpec -> PlaitElement[]` adapter | Medium | Medium | Best long-term option if board export ever matters |
| Emit `DiagramSpec -> DrawnixExportedData` directly | Medium | Medium | Stronger than host embed, but still requires owned geometry/layout decisions |

## Recommended Direction for Notemd

### What not to do

1. Do not pull the Drawnix host, toolbar system, file-system flows, or whiteboard UI into Notemd.
2. Do not turn the current renderer boundary into a second hosted front-end application just to claim more diagram formats.
3. Do not let `DiagramSpec` regress back into Mermaid/Markdown as the primary intermediate representation.

### What is worth doing

1. Treat Drawnix as an **external reference project**, not as a dependency bundle to absorb wholesale.
2. If Notemd ever needs editable board export, prefer:
   `DiagramSpec -> DrawnixExportedData (.drawnix)`
3. If Drawnix converters are ever tested, keep them:
   - on an isolated experimental path
   - lazy-loaded
   - out of the default mainline flow

## Relationship to Current Priorities

The Drawnix audit does not challenge the current roadmap. It reinforces it:

1. command surface consolidation
2. sustainable live verification runbook
3. heavy-runtime packaging isolation
4. MermaidProcessor decomposition
5. only then consider new export targets or board-style artifacts

Drawnix is therefore not "the next feature to integrate". It is evidence that the roadmap is already pointing in the right direction: absorb the data boundary and conversion boundary, not the full host complexity.
