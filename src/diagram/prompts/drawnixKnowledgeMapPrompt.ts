export interface DrawnixKnowledgeMapPromptOptions {
    sourcePath?: string;
}

function sourceDocumentLabel(sourcePath: string | undefined): string | undefined {
    const basename = sourcePath?.split(/[\\/]/u).pop()?.trim();
    if (!basename) {
        return undefined;
    }
    return basename.replace(/\.[^.]+$/u, '') || basename;
}

/**
 * The model returns semantic hierarchy only. Source coverage, projection, and
 * routing own the filename root, native serialization, and geometry.
 */
export function buildDrawnixKnowledgeMapPromptRules(
    options: DrawnixKnowledgeMapPromptOptions = {}
): string {
    const documentLabel = sourceDocumentLabel(options.sourcePath);

    return `Target: editable Drawnix knowledge map.

Drawnix knowledge-map rules:
- Set intent: drawnixMindmap.
- Return exactly one top-level document root. Use the source document filename as the root label${documentLabel ? ` (recommended: "${documentLabel}")` : ''}.
- Organize H2/module/section concepts as first-level children of that document root, H3 concepts beneath their section, and concise details beneath those branches.
- Do not emit extra top-level nodes. If a concept does not fit a section, place it under a first-level "Additional concepts" branch.
- Use node.children for ownership and taxonomy. Do not duplicate parent-child relationships in edges.
- Keep the hierarchy as deep as the source requires. Keep detail in leaves and do not flatten a meaningful taxonomy to meet an arbitrary depth budget.
- Use edges only for the core directed relationships needed to explain the source. Aim for 3–6 relationships across the major branches, ordered from most important to least important. Use fewer when the source supports fewer; never invent relationships to fill the range.
- Every edge MUST have a concise, explicit predicate in label (for example "transcribes into", "inhibits", "provides evidence for"). A blank label or generic "related to" is not informative. Use the requested output language and preserve the source's uncertainty and historical context.
- Read every edge as "from --label--> to": the predicate must describe the source acting on or relating to the target, not the reverse. Only assert the directed relationship supported by the source; shared context does not establish causation. Omit an edge when its direction or predicate cannot be grounded.
- Do not repeat the hierarchy as cross-branch arrows, or add parallel arrows for incidental associations. Put supporting detail in nodes. The overview displays at most six relationships, with at most three touching one node; remaining relationships are retained in metadata rather than drawn as overlapping lines.
- Create concise labels. Put implementation detail in leaf nodes, not the root.
- For architecture notes, group the tree by subsystem first and place request/data flow in cross-branch relationships.
- Cover the source note rather than returning a tiny abstract summary: represent each major source section as a root or first-level branch when it contains distinct content.
- Preserve named components, participants, modules, and target formats from Mermaid blocks as leaf nodes or branch labels. Do not discard source sections merely because exact Mermaid syntax is preserved in companions.
- When a source section contains multiple listed or diagrammed items, include the items as separate children. The deterministic renderer adds a source-coverage safety net, but the model should still return a complete semantic tree.
- Semantic example: "Identity and access" contains "Authentication"; "Observability" monitors "Authentication" through a cross-branch edge when that runtime dependency appears in the source.
- Return DiagramSpec fields only. The renderer owns board serialization and layout.`;
}
