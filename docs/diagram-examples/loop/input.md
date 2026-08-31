# Operating loop

Purpose: Use for a true reinforcing cycle whose stations write durable state to one hub.

Requested diagram type: `loop`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.kind: cycle
- spec.payload.hub.label: Shared record
- spec.payload.hub.sub: one durable operating memory
- spec.payload.stations[1]: capture (Capture)
- spec.payload.stations[1].id: capture
- spec.payload.stations[1].sub: signals
- spec.payload.stations[2]: research (Research)
- spec.payload.stations[2].id: research
- spec.payload.stations[2].sub: evidence
- spec.payload.stations[3]: decide (Decide)
- spec.payload.stations[3].id: decide
- spec.payload.stations[3].sub: approve
- spec.payload.stations[3].focal: true
- spec.payload.stations[4]: act (Act)
- spec.payload.stations[4].id: act
- spec.payload.stations[4].sub: ship
- spec.payload.stations[5]: measure (Measure)
- spec.payload.stations[5].id: measure
- spec.payload.stations[5].sub: outcomes
- spec.payload.stations[6]: learn (Learn)
- spec.payload.stations[6].id: learn
- spec.payload.stations[6].sub: update playbook

## Reading cues

- Confirm that the loop output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.kind: cycle

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
