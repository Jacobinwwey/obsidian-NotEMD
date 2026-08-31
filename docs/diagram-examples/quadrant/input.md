# Priority matrix

Purpose: Use for bounded two-axis prioritization with comparable item positions.

Requested diagram type: `quadrant`
Requested render target: `mermaid`
Canonical payload kind: `quadrant`
Semantic intent: `quadrant`

## Source facts

- spec.quadrant.items[1]: {"id":"adapter","label":"Adapter registry","x":0.78,"y":0.84,"detail":"high leverage"}
- spec.quadrant.items[2]: {"id":"docs","label":"Docs gallery","x":0.32,"y":0.68}
- spec.quadrant.items[3]: {"id":"cleanup","label":"Cleanup pass","x":0.24,"y":0.28}
- spec.quadrant.xAxisLabel: Low effort, High effort
- spec.quadrant.yAxisLabel: Low impact, High impact
- spec.quadrant.quadrantLabels: Invest, Quick wins, Defer, Evaluate

## Reading cues

- Confirm that the quadrant output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.quadrant.items[1]: {"id":"adapter","label":"Adapter registry","x":0.78,"y":0.84,"detail":"high leverage"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
