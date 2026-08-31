# Ownership tree

Purpose: Use for a single-root parent-to-child hierarchy.

Requested diagram type: `tree`
Requested render target: `editable-html-svg`
Canonical payload kind: `tree`
Semantic intent: `tree`

## Source facts

- Canonical response shape: `{ "nodes": [], "edges": [], "payload": { "kind": "tree", "nodes": [{ "id": "root", "label": "..." }, { "id": "child", "label": "...", "parentId": "root" }] } }`.
- Top-level nodes and edges must remain empty arrays.
- payload.kind must be `tree`; put every tree node under payload.nodes and give each non-root node a valid parentId.

- spec.payload.nodes[1]: {"id":"platform","label":"Platform","focal":true}
- spec.payload.nodes[2]: {"id":"authoring","label":"Authoring","parentId":"platform"}
- spec.payload.nodes[3]: {"id":"rendering","label":"Rendering","parentId":"platform"}
- spec.payload.nodes[4]: {"id":"delivery","label":"Delivery","parentId":"platform"}
- spec.payload.nodes[5]: {"id":"preview","label":"Preview","parentId":"rendering"}
- spec.payload.nodes[6]: {"id":"export","label":"Export","parentId":"delivery"}
- spec.payload.kind: tree

## Reading cues

- Confirm that the tree output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.nodes[1]: {"id":"platform","label":"Platform","focal":true}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
