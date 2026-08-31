# Role-scoped data flow

Purpose: Use for a typed data pipeline where each role owns a stage and payload handoff.

Requested diagram type: `data-flow`
Requested render target: `editable-html-svg`
Canonical payload kind: `lane-grid`
Semantic intent: `dataFlow`

## Source facts

- spec.payload.lanes[1]: {"id":"admin","label":"ADMINS"}
- spec.payload.lanes[2]: {"id":"engineer","label":"ENGINEERS"}
- spec.payload.lanes[3]: {"id":"scientist","label":"SCIENTISTS"}
- spec.payload.lanes[4]: {"id":"consumer","label":"CONSUMERS"}
- spec.payload.steps[1]: {"id":"collect","label":"COLLECT"}
- spec.payload.steps[2]: {"id":"store","label":"STORE"}
- spec.payload.steps[3]: {"id":"transform","label":"TRANSFORM"}
- spec.payload.steps[4]: {"id":"analyze","label":"ANALYZE"}
- spec.payload.steps[5]: {"id":"publish","label":"PUBLISH"}
- spec.payload.cells[1]: {"laneId":"admin","stepId":"collect","title":"Project setup","sub":"roles","tool":"console"}
- spec.payload.cells[2]: {"laneId":"admin","stepId":"store","title":"Access policy","sub":"RBAC","tool":"identity"}
- spec.payload.cells[3]: {"laneId":"engineer","stepId":"collect","title":"Source ingest","sub":"raw files","tool":"API · SFTP","chips":{"out":"DB"}}
- spec.payload.cells[4]: {"laneId":"engineer","stepId":"store","title":"Raw store","sub":"landing zone","tool":"object store","chips":{"in":"DB","out":"DB"}}
- spec.payload.cells[5]: {"laneId":"engineer","stepId":"transform","title":"Clean & stage","sub":"raw → table","tool":"SQL · ETL","chips":{"in":"DB","out":"TB"}}
- spec.payload.cells[6]: {"laneId":"scientist","stepId":"analyze","title":"Explore & model","sub":"insights","tool":"notebook","focal":true,"chips":{"in":"TB","out":"FL"}}
- spec.payload.cells[7]: {"laneId":"scientist","stepId":"publish","title":"Publish findings","sub":"dashboards","tool":"BI","chips":{"in":"FL","out":"FL"}}
- spec.payload.cells[8]: {"laneId":"consumer","stepId":"publish","title":"Query insights","sub":"read-only","tool":"SQL","chips":{"in":"TB","out":"TB"}}
- spec.payload.edges[1]: {"from":{"laneId":"admin","stepId":"collect"},"to":{"laneId":"admin","stepId":"store"},"style":"muted"}
- spec.payload.edges[2]: {"from":{"laneId":"admin","stepId":"collect"},"to":{"laneId":"engineer","stepId":"collect"},"style":"trigger","dashed":true}
- spec.payload.edges[3]: {"from":{"laneId":"engineer","stepId":"collect"},"to":{"laneId":"engineer","stepId":"store"},"style":"muted"}
- spec.payload.edges[4]: {"from":{"laneId":"engineer","stepId":"store"},"to":{"laneId":"engineer","stepId":"transform"},"style":"muted"}
- spec.payload.edges[5]: {"from":{"laneId":"engineer","stepId":"transform"},"to":{"laneId":"scientist","stepId":"analyze"},"label":"anon table","style":"accent"}
- spec.payload.edges[6]: {"from":{"laneId":"scientist","stepId":"analyze"},"to":{"laneId":"scientist","stepId":"publish"},"style":"muted"}
- spec.payload.edges[7]: {"from":{"laneId":"scientist","stepId":"publish"},"to":{"laneId":"consumer","stepId":"publish"},"style":"link"}

## Reading cues

- Confirm that the data-flow output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.lanes[1]: {"id":"admin","label":"ADMINS"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
