# Feature adoption

Purpose: Use for discrete category comparison with one numeric value per category.

Requested diagram type: `bar-chart`
Requested render target: `vega-lite`

## Source facts

- spec.payload.kind: quantitative
- spec.payload.chartType: bar
- spec.payload.series[1]: adoption (Adoption)
- spec.payload.series[1].id: adoption
- spec.payload.series[1].points[1].x: Search
- spec.payload.series[1].points[1].y: 82
- spec.payload.series[1].points[2].x: Preview
- spec.payload.series[1].points[2].y: 64
- spec.payload.series[1].points[3].x: Export
- spec.payload.series[1].points[3].y: 47
- spec.payload.series[1].points[4].x: History
- spec.payload.series[1].points[4].y: 31
- spec.dataSeries[1]: adoption (Adoption)
- spec.dataSeries[1].id: adoption
- spec.dataSeries[1].points[1].x: Search
- spec.dataSeries[1].points[1].y: 82
- spec.dataSeries[1].points[2].x: Preview
- spec.dataSeries[1].points[2].y: 64
- spec.dataSeries[1].points[3].x: Export
- spec.dataSeries[1].points[3].y: 47
- spec.dataSeries[1].points[4].x: History
- spec.dataSeries[1].points[4].y: 31

## Reading cues

- Confirm that the bar-chart output preserves the source facts and relationships.
- Check that the visual structure matches the declared vega-lite render target.
- Inspect this evidence first: spec.payload.kind: quantitative

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
