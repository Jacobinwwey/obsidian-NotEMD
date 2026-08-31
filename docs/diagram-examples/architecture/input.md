# Platform architecture

Purpose: Use for bounded components grouped by trust or system boundary.

Requested diagram type: `architecture`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.edges[1]: web -> api (request)
- spec.payload.edges[2]: api -> worker (dispatch)
- spec.payload.edges[3]: worker -> store (write)
- spec.payload.edges[4]: worker -> history (record)
- spec.payload.kind: topology
- spec.payload.zones[1]: experience (Experience)
- spec.payload.zones[1].id: experience
- spec.payload.zones[1].sub: public and operator surfaces
- spec.payload.zones[2]: services (Services)
- spec.payload.zones[2].id: services
- spec.payload.zones[2].sub: orchestration and policy
- spec.payload.zones[3]: data (Data)
- spec.payload.zones[3].id: data
- spec.payload.zones[3].sub: durable state
- spec.payload.nodes[1]: web (Web client)
- spec.payload.nodes[1].id: web
- spec.payload.nodes[1].zoneId: experience
- spec.payload.nodes[1].sub: HTTPS
- spec.payload.nodes[1].external: true
- spec.payload.nodes[2]: api (API gateway)
- spec.payload.nodes[2].id: api
- spec.payload.nodes[2].zoneId: services
- spec.payload.nodes[2].sub: REST / auth
- spec.payload.nodes[2].focal: true

## Reading cues

- Confirm that the architecture output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.edges[1]: web -> api (request)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
