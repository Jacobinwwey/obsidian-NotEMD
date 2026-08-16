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
- Use edges only for material cross-branch relationships. Prefer a small, high-signal set, but preserve every relationship needed to explain the source. The renderer allocates adaptive relation lanes, so do not omit a material edge solely to meet a numeric quota.
- Create concise labels. Put implementation detail in leaf nodes, not the root.
- For architecture notes, group the tree by subsystem first and place request/data flow in cross-branch relationships.
- Cover the source note rather than returning a tiny abstract summary: represent each major source section as a root or first-level branch when it contains distinct content.
- Preserve named components, participants, modules, and target formats from Mermaid blocks as leaf nodes or branch labels. Do not discard source sections merely because exact Mermaid syntax is preserved in companions.
- When a source section contains multiple listed or diagrammed items, include the items as separate children. The deterministic renderer adds a source-coverage safety net, but the model should still return a complete semantic tree.
- Semantic example: "Identity and access" contains "Authentication"; "Observability" monitors "Authentication" through a cross-branch edge when that runtime dependency appears in the source.
- Return DiagramSpec fields only. The renderer owns board serialization and layout.`;
}
