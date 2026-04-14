import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    flattenNodes,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

function renderClassName(label: string, id: string): string {
    return sanitizeMermaidIdentifier(label.trim() || id);
}

export function renderClassMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['classDiagram'], 'ClassMermaidAdapter');

    const nodes = flattenNodes(spec.nodes);
    const classNames = new Map(nodes.map((node) => [node.id, renderClassName(node.label, node.id)]));
    const lines = ['classDiagram'];

    nodes.forEach((node) => {
        lines.push(`${indent(1)}class ${renderClassName(node.label, node.id)}`);
    });

    (spec.edges ?? []).forEach((edge) => {
        const fromId = classNames.get(edge.from) ?? sanitizeMermaidIdentifier(edge.from);
        const toId = classNames.get(edge.to) ?? sanitizeMermaidIdentifier(edge.to);
        const label = sanitizeMermaidText(edge.label ?? edge.relation ?? '');
        const suffix = label ? ` : ${label}` : '';
        lines.push(`${indent(1)}${fromId} --> ${toId}${suffix}`);
    });

    return mermaidFence(lines);
}
