import { DiagramNode, DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    flattenNodes,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

function buildNodeIdMap(nodes: DiagramNode[]): Map<string, string> {
    return new Map(
        flattenNodes(nodes).map(node => [node.id, sanitizeMermaidIdentifier(node.id)])
    );
}

export function renderFlowchartMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['flowchart'], 'FlowchartMermaidAdapter');

    const directionHint = spec.layoutHints?.direction;
    const direction = typeof directionHint === 'string' && ['TD', 'LR', 'RL', 'BT'].includes(directionHint)
        ? directionHint
        : 'TD';

    const nodeIdMap = buildNodeIdMap(spec.nodes);
    const lines = [`flowchart ${direction}`];

    flattenNodes(spec.nodes).forEach(node => {
        const nodeId = nodeIdMap.get(node.id) ?? sanitizeMermaidIdentifier(node.id);
        lines.push(`${indent(1)}${nodeId}["${sanitizeMermaidText(node.label)}"]`);
    });

    (spec.edges ?? []).forEach(edge => {
        const fromId = nodeIdMap.get(edge.from) ?? sanitizeMermaidIdentifier(edge.from);
        const toId = nodeIdMap.get(edge.to) ?? sanitizeMermaidIdentifier(edge.to);
        const label = edge.label ? `|${sanitizeMermaidText(edge.label)}| ` : '';
        lines.push(`${indent(1)}${fromId} -->${label}${toId}`);
    });

    return mermaidFence(lines);
}
