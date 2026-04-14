import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    flattenNodes,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

export function renderStateMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['stateDiagram'], 'StateMermaidAdapter');

    const nodes = flattenNodes(spec.nodes);
    const stateIds = new Map(nodes.map((node) => [node.id, sanitizeMermaidIdentifier(node.id)]));
    const lines = ['stateDiagram-v2'];

    if (nodes.length > 0) {
        lines.push(`${indent(1)}[*] --> ${stateIds.get(nodes[0].id)}`);
    }

    nodes.forEach((node) => {
        const stateId = stateIds.get(node.id) ?? sanitizeMermaidIdentifier(node.id);
        const label = sanitizeMermaidText(node.label);
        if (label && label !== node.id) {
            lines.push(`${indent(1)}state "${label}" as ${stateId}`);
        }
    });

    (spec.edges ?? []).forEach((edge) => {
        const fromId = stateIds.get(edge.from) ?? sanitizeMermaidIdentifier(edge.from);
        const toId = stateIds.get(edge.to) ?? sanitizeMermaidIdentifier(edge.to);
        const label = sanitizeMermaidText(edge.label ?? edge.relation ?? '');
        const suffix = label ? ` : ${label}` : '';
        lines.push(`${indent(1)}${fromId} --> ${toId}${suffix}`);
    });

    return mermaidFence(lines);
}
