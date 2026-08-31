# Quality and latency

Purpose: Use for paired numeric observations where correlation or outliers matter.

Requested diagram type: `scatter-plot`
Requested render target: `vega-lite`

## Source facts

- spec.payload.kind: quantitative
- spec.payload.chartType: scatter
- spec.payload.series[1]: samples (Samples)
- spec.payload.series[1].id: samples
- spec.payload.series[1].points[1].x: 1
- spec.payload.series[1].points[1].y: 12
- spec.payload.series[1].points[2].x: 2
- spec.payload.series[1].points[2].y: 15
- spec.payload.series[1].points[3].x: 3
- spec.payload.series[1].points[3].y: 18
- spec.payload.series[1].points[4].x: 4
- spec.payload.series[1].points[4].y: 20
- spec.payload.series[1].points[5].x: 5
- spec.payload.series[1].points[5].y: 23
- spec.payload.series[1].points[6].x: 6
- spec.payload.series[1].points[6].y: 29
- spec.dataSeries[1]: samples (Samples)
- spec.dataSeries[1].id: samples
- spec.dataSeries[1].points[1].x: 1
- spec.dataSeries[1].points[1].y: 12
- spec.dataSeries[1].points[2].x: 2
- spec.dataSeries[1].points[2].y: 15
- spec.dataSeries[1].points[3].x: 3
- spec.dataSeries[1].points[3].y: 18

## Reading cues

- Confirm that the scatter-plot output preserves the source facts and relationships.
- Check that the visual structure matches the declared vega-lite render target.
- Inspect this evidence first: spec.payload.kind: quantitative

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
