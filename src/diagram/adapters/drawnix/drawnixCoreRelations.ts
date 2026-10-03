import type { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';

export interface DrawnixOmittedRelation {
    edge: DiagramEdge;
    reason: 'no-label' | 'hierarchy' | 'duplicate' | 'parallel' | 'density';
}

// A knowledge-map overview is not a complete dependency graph. The model orders
// semantic relationships by importance; these limits protect the reading surface.
const MAX_VISIBLE_RELATIONS = 6;
const MAX_RELATIONS_PER_NODE = 3;
const GENERIC_RELATION = /^(related(?: to)?|relates to|connected(?: to)?|connects|link(?:s)?|关联|相关|相关联|关系|關係|關聯|相關|连接|連接)$/iu;

export function selectDrawnixCoreRelations(spec: DiagramSpec): { edges: DiagramEdge[]; omitted: DrawnixOmittedRelation[] } {
    const parents = new Map<string, string>();
    const visit = (node: DiagramNode): void => {
        for (const child of node.children ?? []) { parents.set(child.id, node.id); visit(child); }
    };
    spec.nodes.forEach(visit);
    const edges: DiagramEdge[] = [];
    const omitted: DrawnixOmittedRelation[] = [];
    const pairs = new Map<string, string>();
    const degrees = new Map<string, number>();
    for (const edge of spec.edges ?? []) {
        const label = edge.label?.trim() || edge.relation?.trim() || '';
        const pair = JSON.stringify([edge.from, edge.to]);
        let reason: DrawnixOmittedRelation['reason'] | undefined;
        if (!label || GENERIC_RELATION.test(label)) reason = 'no-label';
        else if (parents.get(edge.from) === edge.to || parents.get(edge.to) === edge.from) reason = 'hierarchy';
        else if (pairs.has(pair)) reason = pairs.get(pair) === label ? 'duplicate' : 'parallel';
        else if (edges.length >= MAX_VISIBLE_RELATIONS || (degrees.get(edge.from) ?? 0) >= MAX_RELATIONS_PER_NODE
            || (degrees.get(edge.to) ?? 0) >= MAX_RELATIONS_PER_NODE) reason = 'density';
        if (reason) { omitted.push({ edge: { ...edge }, reason }); continue; }
        pairs.set(pair, label);
        edges.push({ ...edge, label });
        for (const id of [edge.from, edge.to]) degrees.set(id, (degrees.get(id) ?? 0) + 1);
    }
    return { edges, omitted };
}
