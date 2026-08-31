# Scope cascade

Purpose: Use for containment boundaries such as policy, workspace, and artifact scope.

Requested diagram type: `nested`
Requested render target: `editable-html-svg`

## Source facts

- spec.payload.kind: nested
- spec.payload.levels[1]: org (Organization)
- spec.payload.levels[1].id: org
- spec.payload.levels[1].sub: global policy
- spec.payload.levels[2]: workspace (Workspace)
- spec.payload.levels[2].id: workspace
- spec.payload.levels[2].sub: team defaults
- spec.payload.levels[3]: project (Project)
- spec.payload.levels[3].id: project
- spec.payload.levels[3].sub: local contract
- spec.payload.levels[3].focal: true
- spec.payload.levels[4]: artifact (Artifact)
- spec.payload.levels[4].id: artifact
- spec.payload.levels[4].sub: single output

## Reading cues

- Confirm that the nested output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.kind: nested

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
