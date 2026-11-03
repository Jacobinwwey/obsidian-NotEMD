import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    flattenNodes,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

export function renderClassMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['classDiagram'], 'ClassMermaidAdapter');

    const nodes = flattenNodes(spec.nodes);
    const classNames = new Map<string, string>();
    const usedNames = new Set<string>();
    for (const node of nodes) {
        const label = node.label.trim();
        let name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(label) && !/^(class|end|direction|namespace|style)$/i.test(label)
            ? label : 'class_' + sanitizeMermaidIdentifier(node.id);
        while (usedNames.has(name)) name += '_';
        usedNames.add(name);
        classNames.set(node.id, name);
    }
    const lines = ['classDiagram'];

    nodes.forEach((node) => {
        const name = classNames.get(node.id)!;
        const alias = name !== node.label ? '["' + node.label.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\r\n]/g, ' ') + '"]' : '';
        lines.push(`${indent(1)}class ${name}${alias}`);
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
