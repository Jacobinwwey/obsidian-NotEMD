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
    const participantNames = new Map<string, string>();
    const usedNames = new Set<string>();
    participants.forEach((node, index) => {
        const candidate = sanitizeMermaidIdentifier(node.id);
        let name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate) && !usedNames.has(candidate) ? candidate : 'participant_' + (index + 1);
        while (usedNames.has(name)) name += '_';
        usedNames.add(name);
        participantNames.set(node.id, name);
    });
    const lines = ['sequenceDiagram'];

    participants.forEach((node) => {
        lines.push(
            `${indent(1)}participant ${participantNames.get(node.id)} as ${sanitizeMermaidText(node.label)}`
        );
    });

    (spec.edges ?? []).forEach((edge) => {
        const fromId = participantNames.get(edge.from)!;
        const toId = participantNames.get(edge.to)!;
        const message = sanitizeMermaidText(edge.label ?? edge.relation ?? '');
        const suffix = message ? `: ${message}` : '';
        lines.push(`${indent(1)}${fromId}->>${toId}${suffix}`);
    });

    return mermaidFence(lines);
}
