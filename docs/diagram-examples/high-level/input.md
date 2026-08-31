# High-level platform

Purpose: Use for a bounded end-to-end overview before drilling into topology detail.

Requested diagram type: `high-level`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.edges[1]: users -> api
- spec.payload.edges[2]: api -> jobs
- spec.payload.edges[3]: jobs -> store
- spec.payload.edges[4]: policy -> api
- spec.payload.kind: topology
- spec.payload.zones[1]: experience (Experience)
- spec.payload.zones[1].id: experience
- spec.payload.zones[2]: services (Services)
- spec.payload.zones[2].id: services
- spec.payload.zones[3]: data (Data)
- spec.payload.zones[3].id: data
- spec.payload.zones[4]: governance (Governance)
- spec.payload.zones[4].id: governance
- spec.payload.nodes[1]: users (Users)
- spec.payload.nodes[1].id: users
- spec.payload.nodes[1].zoneId: experience
- spec.payload.nodes[1].external: true
- spec.payload.nodes[2]: api (API)
- spec.payload.nodes[2].id: api
- spec.payload.nodes[2].zoneId: services
- spec.payload.nodes[2].focal: true
- spec.payload.nodes[3]: jobs (Jobs)
- spec.payload.nodes[3].id: jobs
- spec.payload.nodes[3].zoneId: services

## Reading cues

- Confirm that the high-level output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.edges[1]: users -> api

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
