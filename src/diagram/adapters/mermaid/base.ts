import { assertValidDiagramSpec } from '../../spec';
import { DiagramNode, DiagramSpec, DiagramIntent } from '../../types';

const INDENT = '    ';

export function sanitizeMermaidText(value: string): string {
    return value
        .replace(/\r?\n+/g, ' ')
        .replace(/`/g, "'")
        .replace(/"/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export function sanitizeMermaidPipeEdgeLabel(value: string): string {
    return sanitizeMermaidText(value).replace(/\|/g, '&#124;');
}

export function sanitizeMermaidIdentifier(value: string): string {
    const normalized = value.replace(/[^A-Za-z0-9_]/g, '_');
    return normalized || 'node';
}

export function assertMermaidSpecIntent(spec: DiagramSpec, allowedIntents: DiagramIntent[], adapterName: string): void {
    assertValidDiagramSpec(spec);
    if (!allowedIntents.includes(spec.intent)) {
        throw new Error(`${adapterName} cannot render diagram intent "${spec.intent}".`);
    }
}

export function mermaidFence(lines: string[]): string {
    return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\`\n\n\n`;
}

export function indent(level: number): string {
    return INDENT.repeat(level);
}

export function flattenNodes(nodes: DiagramNode[]): DiagramNode[] {
    return nodes.flatMap(node => [node, ...(node.children ? flattenNodes(node.children) : [])]);
}
