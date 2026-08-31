# Release funnel

Purpose: Use for a ranked hierarchy or conversion drop-off with bounded segments.

Requested diagram type: `ranked-funnel`
Requested render target: `editable-html-svg`
Canonical payload kind: `ranked-segments`
Semantic intent: `rankedFunnel`

## Source facts

- spec.payload.segments[1]: {"id":"ideas","label":"Ideas","sub":"captured"}
- spec.payload.segments[2]: {"id":"specs","label":"Specs","sub":"approved"}
- spec.payload.segments[3]: {"id":"builds","label":"Builds","sub":"verified"}
- spec.payload.segments[4]: {"id":"releases","label":"Releases","sub":"published","focal":true}
- spec.payload.kind: ranked-segments
- spec.payload.orientation: funnel

## Reading cues

- Confirm that the ranked-funnel output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.segments[1]: {"id":"ideas","label":"Ideas","sub":"captured"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
