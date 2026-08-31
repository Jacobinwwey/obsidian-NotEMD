# Release plan

Purpose: Use for task overlap and milestones on a bounded delivery timeline.

Requested diagram type: `gantt`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.phases[1]: {"id":"foundation","label":"FOUNDATION"}
- spec.payload.phases[2]: {"id":"delivery","label":"DELIVERY"}
- spec.payload.tasks[1]: {"id":"contract","label":"Canonical contract","phaseId":"foundation","start":"W1","end":"W3"}
- spec.payload.tasks[2]: {"id":"renderer","label":"Native renderer","phaseId":"foundation","start":"W2","end":"W5","focal":true}
- spec.payload.tasks[3]: {"id":"preview","label":"Preview and gallery","phaseId":"delivery","start":"W4","end":"W6"}
- spec.payload.tasks[4]: {"id":"release","label":"Release gate","phaseId":"delivery","start":"W6","end":"W7"}
- spec.payload.milestones[1]: {"id":"gate","label":"consumer gate","date":"W5"}
- spec.payload.kind: schedule

## Reading cues

- Confirm that the gantt output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.phases[1]: {"id":"foundation","label":"FOUNDATION"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
