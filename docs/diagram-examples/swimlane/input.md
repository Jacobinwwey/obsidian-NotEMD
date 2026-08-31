# Release handoff

Purpose: Use when multiple owners hand work to one another across a process.

Requested diagram type: `swimlane`
Requested render target: `mermaid`

## Source facts

- spec.swimlaneLanes[1].steps[1]: draft -> review (next)
- spec.swimlaneLanes[2].steps[1]: build -> publish (next)
- spec.swimlaneLanes[1]: authoring (Authoring)
- spec.swimlaneLanes[1].id: authoring
- spec.swimlaneLanes[1].steps[1]: draft (Draft spec)
- spec.swimlaneLanes[1].steps[1].id: draft
- spec.swimlaneLanes[1].steps[1].nextStepId: review
- spec.swimlaneLanes[1].steps[2]: review (Review contract)
- spec.swimlaneLanes[1].steps[2].id: review
- spec.swimlaneLanes[2]: delivery (Delivery)
- spec.swimlaneLanes[2].id: delivery
- spec.swimlaneLanes[2].steps[1]: build (Build artifact)
- spec.swimlaneLanes[2].steps[1].id: build
- spec.swimlaneLanes[2].steps[1].nextStepId: publish
- spec.swimlaneLanes[2].steps[2]: publish (Publish release)
- spec.swimlaneLanes[2].steps[2].id: publish

## Reading cues

- Confirm that the swimlane output preserves the source facts and relationships.
- Check that the visual structure matches the declared mermaid render target.
- Inspect this evidence first: spec.swimlaneLanes[1].steps[1]: draft -> review (next)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
