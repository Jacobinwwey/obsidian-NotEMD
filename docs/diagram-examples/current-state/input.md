# Legacy current state

Purpose: Use to expose the before-state landscape, manual handoffs, and bottlenecks.

Requested diagram type: `current-state`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.edges[1]: forms -> drive (CSV)
- spec.payload.edges[2]: drive -> analyst (COPY)
- spec.payload.edges[3]: analyst -> portal (XLSX)
- spec.payload.edges[4]: portal -> partners (download)
- spec.payload.kind: topology
- spec.payload.zones[1]: collect (Collection)
- spec.payload.zones[1].id: collect
- spec.payload.zones[1].sub: siloed inputs
- spec.payload.zones[2]: process (Processing)
- spec.payload.zones[2].id: process
- spec.payload.zones[2].sub: manual transformation
- spec.payload.zones[3]: publish (Dissemination)
- spec.payload.zones[3].id: publish
- spec.payload.zones[3].sub: fragile outputs
- spec.payload.nodes[1]: forms (Survey forms)
- spec.payload.nodes[1].id: forms
- spec.payload.nodes[1].zoneId: collect
- spec.payload.nodes[1].sub: CSV exports
- spec.payload.nodes[2]: drive (Shared drive)
- spec.payload.nodes[2].id: drive
- spec.payload.nodes[2].zoneId: process
- spec.payload.nodes[2].sub: no version control
- spec.payload.nodes[2].focal: true
- spec.payload.nodes[3]: analyst (Analyst machines)

## Reading cues

- Confirm that the current-state output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.edges[1]: forms -> drive (CSV)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
