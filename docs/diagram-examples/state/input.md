# Artifact lifecycle

Purpose: Use when a system changes among named states.

Requested diagram type: `state`
Requested render target: `mermaid`
Canonical payload kind: `legacy`
Semantic intent: `stateDiagram`

## Source facts

- spec.nodes[1]: {"id":"draft","label":"Draft"}
- spec.nodes[2]: {"id":"validated","label":"Validated"}
- spec.nodes[3]: {"id":"published","label":"Published"}
- spec.edges[1]: {"from":"draft","to":"validated","label":"validate"}
- spec.edges[2]: {"from":"validated","to":"published","label":"publish"}

## Reading cues

- Confirm that the state output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"draft","label":"Draft"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
