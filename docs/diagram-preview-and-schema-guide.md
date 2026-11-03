# Diagram preview and schema guide — 1.9.15

[中文](diagram-preview-and-schema-guide.zh-CN.md)

## Read and copy

Open a saved .drawnix directly with **Diagram preview**. The main board appears first; Mermaid attachments follow in source order. A Mermaid-only attachment must not replace the board. History reopening uses the same full-diagram starting view. Use Fit to return to the overview before zooming or panning. Preview zoom does not set PNG PPI.

Drag over export receipts to copy filenames or errors for searching. Canvas dragging remains available in the diagram surface. Existing Alt/lock controls still apply to selecting text inside interactive SVG/HTML/PDF surfaces; PNG has no selectable text layer.

## Preserve schema meaning

Provide entity and field names, SQL types, PK/FK/UK keys, comments, references and endpoint cardinalities explicitly in the source. Notemd carries supported typed fields through its ER model and uses shared table measurements for HTML/SVG and Draw.io. Mermaid uses the same semantic schema but has its own grammar and layout limits. Legacy string fields remain supported; no diagram can infer missing domain constraints with certainty.

## Recover without hiding the diagram

Recoverable cyclic trees and forests retain their nodes and relationships through a readable fallback. Missing lane endpoints get one neutral placeholder instead of repeated warnings or invented domain entities. Read diagnostics alongside the visual; recovery is not domain validation. Unsafe SVG and unrecoverable input can still require repair.

## Compare outputs

Run npm run diagram:acceptance to generate real PNG/SVG before-and-after exports and an HTML comparison page under the repository cache. Keep the original reviewed gallery unchanged. The reading-first review keeps case4 unchanged, including the bottom actors; cases6/7 reduce detours and unused space. The gallery is a regression aid, not evidence that every exported format was tested in its native editor.

For Slidev, use the required Jacobinwwey fork. Rebuild exports from the source after reloading; old already-exported standalone files are not silently rewritten. Missing native Mermaid components or absent rendered diagrams now produce specific diagnostics instead of a falsely successful empty result.

## Upgrade safely

Install matching main.js, manifest.json and styles.css from the same release and reload. Do not replace data.json or delete legacy companions still referenced by saved artifacts. Test a representative source and its SVG/PNG/PDF exports before batch use. Drawnix cross-branch arrows remain static after external rearrangement.
