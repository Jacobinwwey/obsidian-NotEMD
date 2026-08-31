# Capability profile

Purpose: Use when several comparable dimensions form a bounded multi-axis profile.

Requested diagram type: `radar-chart`
Requested render target: `vega-lite`

## Source facts

- spec.radarSpec.axes[1]: reliability (Reliability)
- spec.radarSpec.axes[1].id: reliability
- spec.radarSpec.axes[1].max: 10
- spec.radarSpec.axes[2]: latency (Latency)
- spec.radarSpec.axes[2].id: latency
- spec.radarSpec.axes[2].max: 10
- spec.radarSpec.axes[3]: operability (Operability)
- spec.radarSpec.axes[3].id: operability
- spec.radarSpec.axes[3].max: 10
- spec.radarSpec.axes[4]: cost (Cost)
- spec.radarSpec.axes[4].id: cost
- spec.radarSpec.axes[4].max: 10
- spec.radarSpec.axes[5]: coverage (Coverage)
- spec.radarSpec.axes[5].id: coverage
- spec.radarSpec.axes[5].max: 10
- spec.radarSpec.series[1]: current (Current)
- spec.radarSpec.series[1].id: current
- spec.radarSpec.series[1].points[1].axisId: reliability
- spec.radarSpec.series[1].points[1].value: 7
- spec.radarSpec.series[1].points[2].axisId: latency
- spec.radarSpec.series[1].points[2].value: 5
- spec.radarSpec.series[1].points[3].axisId: operability
- spec.radarSpec.series[1].points[3].value: 6
- spec.radarSpec.series[1].points[4].axisId: cost

## Reading cues

- Confirm that the radar-chart output preserves the source facts and relationships.
- Check that the visual structure matches the declared vega-lite render target.
- Inspect this evidence first: spec.radarSpec.axes[1]: reliability (Reliability)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
