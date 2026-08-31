# Data quality tiers

Purpose: Use for ordered data quality tiers with explicit promotion semantics.

Requested diagram type: `medallion`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.kind: ordered-stack
- spec.payload.direction: down
- spec.payload.layers[1]: raw (Raw)
- spec.payload.layers[1].id: raw
- spec.payload.layers[1].sub: landed source
- spec.payload.layers[2]: clean (Clean)
- spec.payload.layers[2].id: clean
- spec.payload.layers[2].sub: validated
- spec.payload.layers[2].focal: true
- spec.payload.layers[3]: curated (Curated)
- spec.payload.layers[3].id: curated
- spec.payload.layers[3].sub: joined and documented
- spec.payload.layers[4]: aggregate (Aggregate)
- spec.payload.layers[4].id: aggregate
- spec.payload.layers[4].sub: consumer-ready
- spec.payload.layers[5]: archive (Archive)
- spec.payload.layers[5].id: archive
- spec.payload.layers[5].sub: retention

## Reading cues

- Confirm that the medallion output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.kind: ordered-stack

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
