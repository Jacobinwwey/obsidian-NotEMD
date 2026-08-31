# Platform layers

Purpose: Use for ordered abstraction levels such as application, services, and storage.

Requested diagram type: `layer-stack`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.kind: ordered-stack
- spec.payload.direction: up
- spec.payload.layers[1]: storage (Storage)
- spec.payload.layers[1].id: storage
- spec.payload.layers[1].sub: durable state
- spec.payload.layers[2]: data (Data services)
- spec.payload.layers[2].id: data
- spec.payload.layers[2].sub: query and transform
- spec.payload.layers[3]: runtime (Runtime)
- spec.payload.layers[3].id: runtime
- spec.payload.layers[3].sub: orchestration
- spec.payload.layers[3].focal: true
- spec.payload.layers[4]: experience (Experience)
- spec.payload.layers[4].id: experience
- spec.payload.layers[4].sub: users and agents

## Reading cues

- Confirm that the layer-stack output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.kind: ordered-stack

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
