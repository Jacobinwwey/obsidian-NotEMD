# Platform fit

Purpose: Use when the explanation depends on overlap between two or three explicit sets.

Requested diagram type: `venn`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.kind: set-overlap
- spec.payload.sets[1]: reliable (Reliable)
- spec.payload.sets[1].id: reliable
- spec.payload.sets[2]: editable (Editable)
- spec.payload.sets[2].id: editable
- spec.payload.sets[3]: discoverable (Discoverable)
- spec.payload.sets[3].id: discoverable
- spec.payload.intersections[1]: core (Production capability)
- spec.payload.intersections[1].id: core
- spec.payload.intersections[1].setIds: reliable, editable, discoverable
- spec.payload.intersections[1].focal: true
- spec.payload.intersections[2]: re (Evidence)
- spec.payload.intersections[2].id: re
- spec.payload.intersections[2].setIds: reliable, editable

## Reading cues

- Confirm that the venn output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.kind: set-overlap

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
