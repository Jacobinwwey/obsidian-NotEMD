# Support ownership

Purpose: Use when the reader needs accountable owners, reporting paths, and visible coverage gaps.

Requested diagram type: `org-chart`
Requested render target: `mermaid`

## Source facts

- spec.orgChartSpec.nodes[1]: director (Support Director)
- spec.orgChartSpec.nodes[1].id: director
- spec.orgChartSpec.nodes[1].role: Front door
- spec.orgChartSpec.nodes[1].scope: triage, escalation
- spec.orgChartSpec.nodes[2]: platform (Platform Team)
- spec.orgChartSpec.nodes[2].id: platform
- spec.orgChartSpec.nodes[2].role: Runtime owner
- spec.orgChartSpec.nodes[2].scope: reliability, deployments
- spec.orgChartSpec.nodes[2].reportsTo: director
- spec.orgChartSpec.nodes[3]: incident (Incident Response)
- spec.orgChartSpec.nodes[3].id: incident
- spec.orgChartSpec.nodes[3].role: Escalation owner
- spec.orgChartSpec.nodes[3].scope: incidents, postmortems
- spec.orgChartSpec.nodes[3].reportsTo: director
- spec.orgChartSpec.nodes[3].status: planned

## Reading cues

- Confirm that the org-chart output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.orgChartSpec.nodes[1]: director (Support Director)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
