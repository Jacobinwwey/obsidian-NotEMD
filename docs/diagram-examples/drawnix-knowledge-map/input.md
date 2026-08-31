# Diagram delivery architecture

Purpose: Use when hierarchy and material cross-branch relations must remain editable.

Requested diagram type: `drawnix-knowledge-map`
Requested render target: `drawnix`
Canonical payload kind: `drawnix-knowledge-map`
Semantic intent: `drawnixMindmap`

## Source facts

- spec.nodes[1]: {"id":"architecture-zh-cn","label":"architecture.zh-CN","kind":"document","children":[{"id":"ui-entrypoints","label":"Obsidian UI","kind":"subsystem","children":[{"id":"command-palette","label":"Command...
- spec.edges[1]: {"from":"command-palette","to":"command-dispatch","label":"starts"}
- spec.edges[2]: {"from":"sidebar","to":"command-dispatch","label":"starts"}
- spec.edges[3]: {"from":"settings","to":"settings-store","label":"updates"}
- spec.edges[4]: {"from":"command-dispatch","to":"diagram-operation","label":"routes"}
- spec.edges[5]: {"from":"diagram-operation","to":"source-coverage","label":"covers source"}
- spec.edges[6]: {"from":"source-coverage","to":"diagram-spec","label":"builds"}
- spec.edges[7]: {"from":"diagram-spec","to":"drawnix-renderer","label":"renders"}
- spec.edges[8]: {"from":"drawnix-renderer","to":"drawnix-file","label":"writes"}
- spec.edges[9]: {"from":"drawnix-renderer","to":"svg-companion","label":"previews"}
- spec.edges[10]: {"from":"drawnix-file","to":"markdown-wrapper","label":"links"}
- spec.edges[11]: {"from":"obsidian-cli","to":"maintainer-bridge","label":"executes"}
- spec.edges[12]: {"from":"maintainer-bridge","to":"diagram-operation","label":"invokes"}

## Reading cues

- Confirm that the drawnix-knowledge-map output preserves the source facts and relationships.
- Check that the visual structure matches the declared drawnix render target.
- Inspect this evidence first: spec.nodes[1]: {"id":"architecture-zh-cn","label":"architecture.zh-CN","kind":"document","children":[{"id":"ui-entrypoints","label":"Obsidian UI","kind":"subsystem","children":[{"id":"command-palette","label":"Command...

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
