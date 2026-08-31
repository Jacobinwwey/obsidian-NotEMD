# Diagram domains

Purpose: Use for a spatial overview of related domains.

Requested diagram type: `canvas-map`
Requested render target: `json-canvas`

## Source facts

- spec.edges[1]: authoring -> rendering
- spec.edges[2]: rendering -> delivery
- spec.nodes[1]: authoring (Authoring)
- spec.nodes[1].id: authoring
- spec.nodes[2]: rendering (Rendering)
- spec.nodes[2].id: rendering
- spec.nodes[3]: delivery (Delivery)
- spec.nodes[3].id: delivery

## Reading cues

- Confirm that the canvas-map output preserves the source facts and relationships.
- Check that the visual structure matches the declared json-canvas render target.
- Inspect this evidence first: spec.edges[1]: authoring -> rendering

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
