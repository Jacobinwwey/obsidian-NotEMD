import { DiagramOrgChartPerson, DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

function buildNodeIdMap(nodes: DiagramOrgChartPerson[]): Map<string, string> {
    const ids = new Map<string, string>();
    const used = new Set<string>();

    nodes.forEach(node => {
        const base = sanitizeMermaidIdentifier(node.id);
        let candidate = base;
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base}_${suffix}`;
            suffix += 1;
        }
        used.add(candidate);
        ids.set(node.id, candidate);
    });

    return ids;
}

function buildNodeLabel(node: DiagramOrgChartPerson): string {
    const scope = node.scope?.length ? node.scope.join(', ') : undefined;
    return sanitizeMermaidText([node.label, node.role, scope].filter(Boolean).join('<br/>'));
}

export function renderOrgChartMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['orgChart'], 'OrgChartMermaidAdapter');

    const nodes = spec.orgChartSpec?.nodes ?? [];
    const nodeIdMap = buildNodeIdMap(nodes);
    const lines = ['flowchart TD'];

    nodes.forEach(node => {
        const nodeId = nodeIdMap.get(node.id) ?? sanitizeMermaidIdentifier(node.id);
        lines.push(`${indent(1)}${nodeId}["${buildNodeLabel(node)}"]`);
    });

    nodes.forEach(node => {
        if (!node.reportsTo) {
            return;
        }
        const childId = nodeIdMap.get(node.id) ?? sanitizeMermaidIdentifier(node.id);
        const parentId = nodeIdMap.get(node.reportsTo) ?? sanitizeMermaidIdentifier(node.reportsTo);
        lines.push(`${indent(1)}${parentId} --> ${childId}`);
    });

    nodes.forEach(node => {
        if (node.status && node.status !== 'active') {
            const nodeId = nodeIdMap.get(node.id) ?? sanitizeMermaidIdentifier(node.id);
            lines.push(`${indent(1)}style ${nodeId} stroke-dasharray: 5 5`);
        }
    });

    return mermaidFence(lines);
}
