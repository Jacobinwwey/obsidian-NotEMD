import type { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';

export interface DrawnixOmittedRelation {
    edge: DiagramEdge;
    reason: 'no-label' | 'hierarchy' | 'duplicate' | 'parallel' | 'density';
}

const GENERIC_RELATION = /^(related(?: to)?|relates to|connected(?: to)?|connects|link(?:s)?|关联|相关|相关联|关系|關係|關聯|相關|连接|連接)$/iu;

export function selectDrawnixCoreRelations(spec: DiagramSpec): { edges: DiagramEdge[]; omitted: DrawnixOmittedRelation[] } {
    const parents = new Map<string, string>();
    const visit = (node: DiagramNode): void => {
        for (const child of node.children ?? []) { parents.set(child.id, node.id); visit(child); }
    };
    spec.nodes.forEach(visit);
    const edges: DiagramEdge[] = [];
    const omitted: DrawnixOmittedRelation[] = [];
    const claims = new Set<string>();
    for (const edge of spec.edges ?? []) {
        const label = edge.label?.trim() || edge.relation?.trim() || '';
        const claim = JSON.stringify([edge.from, edge.to, label]);
        let reason: DrawnixOmittedRelation['reason'] | undefined;
        if (!label || GENERIC_RELATION.test(label)) reason = 'no-label';
        else if (parents.get(edge.from) === edge.to || parents.get(edge.to) === edge.from) reason = 'hierarchy';
        else if (claims.has(claim)) reason = 'duplicate';
        if (reason) { omitted.push({ edge: { ...edge }, reason }); continue; }
        claims.add(claim);
        edges.push({ ...edge, label });
    }
    return { edges, omitted };
}
