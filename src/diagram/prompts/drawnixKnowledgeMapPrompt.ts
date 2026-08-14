export interface DrawnixKnowledgeMapPromptOptions {
    sourcePath?: string;
    targetLanguage?: string;
}

/**
 * Keep semantic production independent from Drawnix serialization and from
 * the static presentation planner. The model owns source-faithful concepts;
 * deterministic code owns geometry, colors, and the delivery form.
 */
export function buildDrawnixKnowledgeMapPromptRules(
    _options: DrawnixKnowledgeMapPromptOptions = {}
): string {
    return `Target: editable Drawnix knowledge map.

Drawnix knowledge-map rules:
- Set intent: drawnixMindmap.
- Multiple independent roots are allowed. Each root must name a real source scope such as a major section, subsystem, domain, or independently meaningful concept.
- Preserve the source hierarchy first. Use node.children for ownership and taxonomy. Do not invent a document wrapper merely to force a single root.
- Use node.kind to identify the semantic role when it is clear: root, domain, subsystem, component, evidence, external, or cross-relation.
- Keep labels concise. Put implementation detail and evidence in leaves instead of turning one root into a long paragraph.
- Use edges only for material cross-branch relationships. Do not duplicate parent-child relationships in edges. Preserve material relationships even when a graph has many branches or relations.
- Keep every meaningful depth required by the source. Do not flatten a taxonomy to meet an arbitrary depth or node budget.
- Preserve named components, participants, modules, and target formats from Mermaid blocks as leaves or branch labels. Do not discard source sections because exact Mermaid syntax is retained in companions.
- When a source section contains several listed or diagrammed items, retain them as separate children. The deterministic source-coverage layer supplements omissions, but the response still needs a complete semantic tree.
- Semantic example: "Identity and access" can be a domain root. Its "Authentication" subsystem can contain a "Token validation" component. A separate "Observability" root may use one edge labeled "monitors" to "Authentication" when that relationship is present in the source.
- Do not output renderer serialization, CSS, colors, coordinates, viewport decisions, or presentation-layout instructions. Return DiagramSpec fields only; the renderer owns projection and layout.`;
}
