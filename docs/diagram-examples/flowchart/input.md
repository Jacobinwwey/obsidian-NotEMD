# Release decision

Purpose: Use for an ordered process with an explicit decision point.

Requested diagram type: `flowchart`
Requested render target: `mermaid`
Canonical payload kind: `legacy`
Semantic intent: `flowchart`

## Source facts

- spec.nodes[1]: {"id":"build","label":"Build"}
- spec.nodes[2]: {"id":"tests","label":"Tests"}
- spec.nodes[3]: {"id":"release","label":"Release"}
- spec.edges[1]: {"from":"build","to":"tests"}
- spec.edges[2]: {"from":"tests","to":"release","label":"pass"}

## Reading cues

- Confirm that the flowchart output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"build","label":"Build"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
