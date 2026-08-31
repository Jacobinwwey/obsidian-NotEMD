# Artifact schema

Purpose: Use when entity attributes and cardinality carry the explanation.

Requested diagram type: `entity-relationship`
Requested render target: `mermaid`
Canonical payload kind: `legacy`
Semantic intent: `erDiagram`

## Source facts

- spec.nodes[1]: {"id":"artifact","label":"Artifact","children":[{"id":"artifact-id","label":"id","kind":"uuid"}]}
- spec.nodes[2]: {"id":"panel","label":"Panel","children":[{"id":"panel-id","label":"id","kind":"uuid"}]}
- spec.edges[1]: {"from":"artifact","to":"panel","relation":"one-to-many","label":"contains"}

## Reading cues

- Confirm that the entity-relationship output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"artifact","label":"Artifact","children":[{"id":"artifact-id","label":"id","kind":"uuid"}]}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
