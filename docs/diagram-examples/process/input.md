# Release process

Purpose: Use for a staged multi-actor process where handoffs matter more than payload types.

Requested diagram type: `process`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.lanes[1]: {"id":"author","label":"AUTHORING"}
- spec.payload.lanes[2]: {"id":"review","label":"REVIEW"}
- spec.payload.lanes[3]: {"id":"delivery","label":"DELIVERY"}
- spec.payload.steps[1]: {"id":"draft","label":"DRAFT"}
- spec.payload.steps[2]: {"id":"review","label":"REVIEW"}
- spec.payload.steps[3]: {"id":"build","label":"BUILD"}
- spec.payload.steps[4]: {"id":"publish","label":"PUBLISH"}
- spec.payload.cells[1]: {"laneId":"author","stepId":"draft","title":"Write spec","sub":"contract"}
- spec.payload.cells[2]: {"laneId":"review","stepId":"review","title":"Review","sub":"quality gate","focal":true}
- spec.payload.cells[3]: {"laneId":"delivery","stepId":"build","title":"Build","sub":"artifact"}
- spec.payload.cells[4]: {"laneId":"delivery","stepId":"publish","title":"Publish","sub":"mainline"}
- spec.payload.edges[1]: {"from":{"laneId":"author","stepId":"draft"},"to":{"laneId":"review","stepId":"review"},"style":"accent","label":"handoff"}
- spec.payload.edges[2]: {"from":{"laneId":"review","stepId":"review"},"to":{"laneId":"delivery","stepId":"build"},"style":"muted"}
- spec.payload.edges[3]: {"from":{"laneId":"delivery","stepId":"build"},"to":{"laneId":"delivery","stepId":"publish"},"style":"muted"}
- spec.payload.kind: lane-grid

## Reading cues

- Confirm that the process output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.lanes[1]: {"id":"author","label":"AUTHORING"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
