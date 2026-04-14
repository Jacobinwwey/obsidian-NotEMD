import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    flattenNodes,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

export function renderSequenceMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['sequence'], 'SequenceMermaidAdapter');

    const participants = flattenNodes(spec.nodes);
    const lines = ['sequenceDiagram'];

    participants.forEach((node) => {
        lines.push(
            `${indent(1)}participant ${sanitizeMermaidIdentifier(node.id)} as ${sanitizeMermaidText(node.label)}`
        );
    });

    (spec.edges ?? []).forEach((edge) => {
        const fromId = sanitizeMermaidIdentifier(edge.from);
        const toId = sanitizeMermaidIdentifier(edge.to);
        const message = sanitizeMermaidText(edge.label ?? edge.relation ?? '');
        const suffix = message ? `: ${message}` : '';
        lines.push(`${indent(1)}${fromId}->>${toId}${suffix}`);
    });

    return mermaidFence(lines);
}
