import { assertValidDiagramSpec } from '../../spec';
import { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';

type CanvasNode = {
    id: string;
    type: 'text';
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

type CanvasEdge = {
    id: string;
    fromNode: string;
    fromSide: 'right' | 'left' | 'top' | 'bottom';
    toNode: string;
    toSide: 'right' | 'left' | 'top' | 'bottom';
    toEnd: 'arrow';
    label?: string;
};

type CanvasDocument = {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
};

function flattenNodes(
    nodes: DiagramNode[],
    depth = 0,
    items: Array<{ node: DiagramNode; depth: number }> = []
): Array<{ node: DiagramNode; depth: number }> {
    nodes.forEach(node => {
        items.push({ node, depth });
        if (node.children?.length) {
            flattenNodes(node.children, depth + 1, items);
        }
    });
    return items;
}

function sanitizeCanvasText(value: string): string {
    return value.replace(/\r?\n+/g, '\n').trim();
}

function estimateNodeWidth(label: string): number {
    return Math.max(220, Math.min(420, Math.ceil(label.length * 8 + 80)));
}

function estimateNodeHeight(label: string): number {
    const lines = label.split('\n').length;
    return Math.max(90, lines * 28 + 40);
}

function renderCanvasNodes(spec: DiagramSpec): CanvasNode[] {
    return flattenNodes(spec.nodes).map(({ node, depth }, index) => {
        const text = sanitizeCanvasText(node.label || node.id);
        return {
            id: node.id,
            type: 'text',
            text,
            x: depth * 420,
            y: index * 170,
            width: estimateNodeWidth(text),
            height: estimateNodeHeight(text)
        };
    });
}

function renderCanvasEdges(edges: DiagramEdge[] | undefined): CanvasEdge[] {
    return (edges ?? []).map((edge, index) => ({
        id: `edge-${index + 1}`,
        fromNode: edge.from,
        fromSide: 'right',
        toNode: edge.to,
        toSide: 'left',
        toEnd: 'arrow',
        label: edge.label
    }));
}

export function renderJsonCanvas(spec: DiagramSpec): string {
    if (spec.intent !== 'canvasMap') {
        throw new Error(`CanvasAdapter cannot render diagram intent "${spec.intent}".`);
    }

    assertValidDiagramSpec(spec);

    const document: CanvasDocument = {
        nodes: renderCanvasNodes(spec),
        edges: renderCanvasEdges(spec.edges)
    };

    return JSON.stringify(document, null, 2);
}
