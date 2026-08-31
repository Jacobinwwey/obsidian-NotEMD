# Artifact request

Purpose: Use when order between independent participants matters.

Requested diagram type: `sequence`
Requested render target: `mermaid`
Canonical payload kind: `legacy`
Semantic intent: `sequence`

## Source facts

- spec.nodes[1]: {"id":"user","label":"User"}
- spec.nodes[2]: {"id":"plugin","label":"Plugin"}
- spec.nodes[3]: {"id":"renderer","label":"Renderer"}
- spec.edges[1]: {"from":"user","to":"plugin","label":"generate"}
- spec.edges[2]: {"from":"plugin","to":"renderer","label":"render"}
- spec.edges[3]: {"from":"renderer","to":"plugin","label":"artifact"}

## Reading cues

- Confirm that the sequence output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"user","label":"User"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
