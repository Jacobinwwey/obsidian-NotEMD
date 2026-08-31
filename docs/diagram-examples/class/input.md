# Diagram domain

Purpose: Use for type-level ownership and association.

Requested diagram type: `class`
Requested render target: `mermaid`
Canonical payload kind: `legacy`
Semantic intent: `classDiagram`

## Source facts

- spec.nodes[1]: {"id":"spec","label":"DiagramSpec"}
- spec.nodes[2]: {"id":"renderer","label":"DiagramRenderer"}
- spec.edges[1]: {"from":"spec","to":"renderer","label":"renders with"}

## Reading cues

- Confirm that the class output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"spec","label":"DiagramSpec"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
