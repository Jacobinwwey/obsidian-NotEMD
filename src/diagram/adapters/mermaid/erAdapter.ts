import { DiagramNode, DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

function renderEntityName(node: DiagramNode): string {
    const base = node.label.trim() || node.id;
    return sanitizeMermaidIdentifier(base).toUpperCase();
}

function renderEntityAttributes(node: DiagramNode): string[] {
    if (!node.children?.length) {
        return [`${indent(2)}string id`];
    }

    return node.children.map((child) => {
        const attributeType = child.kind ? sanitizeMermaidIdentifier(child.kind).toLowerCase() : 'string';
        const attributeName = sanitizeMermaidIdentifier(child.label || child.id).toLowerCase();
        return `${indent(2)}${attributeType} ${attributeName}`;
    });
}

function resolveErRelation(relation: string | undefined): string {
    switch ((relation ?? '').toLowerCase()) {
        case 'one-to-one':
            return '||--||';
        case 'many-to-one':
            return '}o--||';
        case 'many-to-many':
            return '}o--o{';
        case 'one-to-many':
        default:
            return '||--o{';
    }
}

export function renderErMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['erDiagram'], 'ErMermaidAdapter');

    const entityNames = new Map(spec.nodes.map((node) => [node.id, renderEntityName(node)]));
    const lines = ['erDiagram'];

    spec.nodes.forEach((node) => {
        lines.push(`${indent(1)}${renderEntityName(node)} {`);
        lines.push(...renderEntityAttributes(node));
        lines.push(`${indent(1)}}`);
    });

    (spec.edges ?? []).forEach((edge) => {
        const fromEntity = entityNames.get(edge.from) ?? renderEntityName({ id: edge.from, label: edge.from });
        const toEntity = entityNames.get(edge.to) ?? renderEntityName({ id: edge.to, label: edge.to });
        const relation = resolveErRelation(edge.relation);
        const label = sanitizeMermaidText(edge.label ?? edge.relation ?? 'relates_to') || 'relates_to';
        lines.push(`${indent(1)}${fromEntity} ${relation} ${toEntity} : ${label}`);
    });

    return mermaidFence(lines);
}
