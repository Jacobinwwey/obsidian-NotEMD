import { RenderArtifact } from '../types';

type CanvasSide = 'right' | 'left' | 'top' | 'bottom';

interface CanvasNode {
    id: string;
    type?: string;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CanvasEdge {
    id?: string;
    fromNode: string;
    fromSide?: CanvasSide;
    toNode: string;
    toSide?: CanvasSide;
    toEnd?: string;
    label?: string;
}

interface CanvasDocument {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

interface Point {
    x: number;
    y: number;
}

const PREVIEW_PADDING = 48;
const PREVIEW_MIN_SIZE = 240;

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function coerceNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeNodes(nodes: unknown[]): CanvasNode[] {
    return nodes.map((node, index) => {
        const item = (node && typeof node === 'object') ? node as Record<string, unknown> : {};
        const text = typeof item.text === 'string' && item.text.trim()
            ? item.text.trim()
            : typeof item.id === 'string' && item.id.trim()
                ? item.id.trim()
                : `Node ${index + 1}`;

        return {
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `node-${index + 1}`,
            type: typeof item.type === 'string' ? item.type : 'text',
            text,
            x: coerceNumber(item.x, index * 280),
            y: coerceNumber(item.y, index * 140),
            width: Math.max(140, coerceNumber(item.width, 220)),
            height: Math.max(72, coerceNumber(item.height, 90))
        };
    });
}

function normalizeEdges(edges: unknown[]): CanvasEdge[] {
    return edges.map((edge, index) => {
        const item = (edge && typeof edge === 'object') ? edge as Record<string, unknown> : {};
        return {
            id: typeof item.id === 'string' ? item.id : `edge-${index + 1}`,
            fromNode: typeof item.fromNode === 'string' ? item.fromNode : '',
            fromSide: item.fromSide === 'left' || item.fromSide === 'right' || item.fromSide === 'top' || item.fromSide === 'bottom'
                ? item.fromSide
                : 'right',
            toNode: typeof item.toNode === 'string' ? item.toNode : '',
            toSide: item.toSide === 'left' || item.toSide === 'right' || item.toSide === 'top' || item.toSide === 'bottom'
                ? item.toSide
                : 'left',
            toEnd: typeof item.toEnd === 'string' ? item.toEnd : 'arrow',
            label: typeof item.label === 'string' ? item.label.trim() : undefined
        };
    });
}

function parseJsonCanvasArtifactContent(content: string): CanvasDocument {
    try {
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Artifact payload must be a JSON object.');
        }

        const record = parsed as Record<string, unknown>;
        if (!Array.isArray(record.nodes)) {
            throw new Error('Artifact payload must contain a "nodes" array.');
        }

        return {
            nodes: normalizeNodes(record.nodes),
            edges: Array.isArray(record.edges) ? normalizeEdges(record.edges) : []
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON Canvas artifact JSON: ${message}`);
    }
}

function getNodeAnchor(node: CanvasNode, side: CanvasSide): Point {
    switch (side) {
        case 'left':
            return { x: node.x, y: node.y + node.height / 2 };
        case 'top':
            return { x: node.x + node.width / 2, y: node.y };
        case 'bottom':
            return { x: node.x + node.width / 2, y: node.y + node.height };
        case 'right':
        default:
            return { x: node.x + node.width, y: node.y + node.height / 2 };
    }
}

function buildCanvasBounds(nodes: CanvasNode[]) {
    if (nodes.length === 0) {
        return {
            minX: 0,
            minY: 0,
            width: PREVIEW_MIN_SIZE,
            height: PREVIEW_MIN_SIZE
        };
    }

    const minX = Math.min(...nodes.map(node => node.x));
    const minY = Math.min(...nodes.map(node => node.y));
    const maxX = Math.max(...nodes.map(node => node.x + node.width));
    const maxY = Math.max(...nodes.map(node => node.y + node.height));

    return {
        minX,
        minY,
        width: Math.max(PREVIEW_MIN_SIZE, maxX - minX),
        height: Math.max(PREVIEW_MIN_SIZE, maxY - minY)
    };
}

function renderNodeText(node: CanvasNode): string {
    const lines = (node.text || node.id).split(/\r?\n/).filter(Boolean);
    const lineHeight = 18;
    const startY = node.y + node.height / 2 - ((Math.max(lines.length, 1) - 1) * lineHeight) / 2;

    return `<text class="notemd-canvas-node-text" x="${node.x + node.width / 2}" y="${startY}" text-anchor="middle">
${lines.map((line, index) => `<tspan x="${node.x + node.width / 2}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`).join('')}
</text>`;
}

function renderCanvasNode(node: CanvasNode): string {
    return `<g class="notemd-canvas-node" data-node-id="${escapeXml(node.id)}">
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="18" ry="18" />
    ${renderNodeText(node)}
</g>`;
}

function renderCanvasEdge(edge: CanvasEdge, nodeIndex: Map<string, CanvasNode>): string {
    const fromNode = nodeIndex.get(edge.fromNode);
    const toNode = nodeIndex.get(edge.toNode);
    if (!fromNode || !toNode) {
        return '';
    }

    const start = getNodeAnchor(fromNode, edge.fromSide ?? 'right');
    const end = getNodeAnchor(toNode, edge.toSide ?? 'left');
    const labelX = (start.x + end.x) / 2;
    const labelY = (start.y + end.y) / 2 - 10;
    const markerEnd = edge.toEnd === 'arrow' ? ' marker-end="url(#notemd-canvas-arrow)"' : '';

    return `<g class="notemd-canvas-edge" data-edge-id="${escapeXml(edge.id || `${edge.fromNode}-${edge.toNode}`)}">
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"${markerEnd} />
    ${edge.label ? `<text class="notemd-canvas-edge-label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeXml(edge.label)}</text>` : ''}
</g>`;
}

export async function renderJsonCanvasArtifactSvg(artifact: RenderArtifact): Promise<string> {
    if (artifact.target !== 'json-canvas') {
        throw new Error(`renderJsonCanvasArtifactSvg only supports json-canvas artifacts, received "${artifact.target}".`);
    }

    const document = parseJsonCanvasArtifactContent(artifact.content);
    const bounds = buildCanvasBounds(document.nodes);
    const viewBoxX = bounds.minX - PREVIEW_PADDING;
    const viewBoxY = bounds.minY - PREVIEW_PADDING;
    const viewBoxWidth = bounds.width + PREVIEW_PADDING * 2;
    const viewBoxHeight = bounds.height + PREVIEW_PADDING * 2;
    const nodeIndex = new Map(document.nodes.map(node => [node.id, node]));

    const edgeMarkup = document.edges.map(edge => renderCanvasEdge(edge, nodeIndex)).join('\n');
    const nodeMarkup = document.nodes.map(renderCanvasNode).join('\n');
    const emptyMarkup = document.nodes.length === 0
        ? `<text class="notemd-canvas-empty" x="${viewBoxX + viewBoxWidth / 2}" y="${viewBoxY + viewBoxHeight / 2}" text-anchor="middle">No canvas nodes available</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" role="img" aria-label="JSON Canvas preview">
<defs>
    <marker id="notemd-canvas-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M0,0 L12,6 L0,12 z" fill="#0f766e" />
    </marker>
    <style>
        .notemd-canvas-surface { fill: #f8fafc; }
        .notemd-canvas-node rect { fill: #ffffff; stroke: #0f766e; stroke-width: 2; }
        .notemd-canvas-node-text,
        .notemd-canvas-edge-label,
        .notemd-canvas-empty {
            fill: #0f172a;
            font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
            font-size: 15px;
        }
        .notemd-canvas-edge line {
            stroke: #0f766e;
            stroke-width: 2.25;
        }
        .notemd-canvas-edge-label {
            paint-order: stroke;
            stroke: #f8fafc;
            stroke-width: 6;
            stroke-linejoin: round;
        }
    </style>
</defs>
<rect class="notemd-canvas-surface" x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxWidth}" height="${viewBoxHeight}" rx="24" ry="24" />
${edgeMarkup}
${nodeMarkup}
${emptyMarkup}
</svg>`;
}
