import { DiagramNode, DiagramSpec } from '../../types';
import { assertMermaidSpecIntent, indent, mermaidFence, sanitizeMermaidText } from './base';

function renderMindmapNode(node: DiagramNode, depth: number): string[] {
    const lines = [`${indent(depth)}${sanitizeMermaidText(node.label) || node.id}`];
    (node.children ?? []).forEach(child => {
        lines.push(...renderMindmapNode(child, depth + 1));
    });
    return lines;
}

export function renderMindmapMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['mindmap'], 'MindmapMermaidAdapter');

    const lines = [
        'mindmap',
        `${indent(1)}root(("${sanitizeMermaidText(spec.title)}"))`
    ];

    spec.nodes.forEach(node => {
        lines.push(...renderMindmapNode(node, 2));
    });

    return mermaidFence(lines);
}
