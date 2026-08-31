# Render time trend

Purpose: Use for an ordered time or release trend.

Requested diagram type: `line-chart`
Requested render target: `vega-lite`

## Source facts

- spec.payload.kind: quantitative
- spec.payload.chartType: line
- spec.payload.series[1]: render-time (Render time)
- spec.payload.series[1].id: render-time
- spec.payload.series[1].points[1].x: v1
- spec.payload.series[1].points[1].y: 22
- spec.payload.series[1].points[2].x: v2
- spec.payload.series[1].points[2].y: 19
- spec.payload.series[1].points[3].x: v3
- spec.payload.series[1].points[3].y: 16
- spec.payload.series[1].points[4].x: v4
- spec.payload.series[1].points[4].y: 12
- spec.dataSeries[1]: render-time (Render time)
- spec.dataSeries[1].id: render-time
- spec.dataSeries[1].points[1].x: v1
- spec.dataSeries[1].points[1].y: 22
- spec.dataSeries[1].points[2].x: v2
- spec.dataSeries[1].points[2].y: 19
- spec.dataSeries[1].points[3].x: v3
- spec.dataSeries[1].points[3].y: 16
- spec.dataSeries[1].points[4].x: v4
- spec.dataSeries[1].points[4].y: 12

## Reading cues

- Confirm that the line-chart output preserves the source facts and relationships.
- Check that the visual structure matches the declared vega-lite render target.
- Inspect this evidence first: spec.payload.kind: quantitative

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
