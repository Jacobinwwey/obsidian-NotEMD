import { RenderArtifact } from '../types';
import { RenderWebviewTheme, resolveRenderTheme } from '../theme';
import {
    LAYOUT_SAFETY_VERSION,
    boxesOverlap,
    measureTextWidth,
    wrapMeasuredText
} from '../../diagram/layout/layoutSafety';

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

interface CanvasTextPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
    lines: string[];
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
const CANVAS_TEXT_LINE_HEIGHT = 18;
const CANVAS_MAX_TEXT_LINES = 6;
const CANVAS_MAX_EDGE_LABEL_WIDTH = 220;
const CANVAS_MAX_EDGE_LABEL_LINES = 2;

interface CanvasPreviewPalette {
    surface: string;
    nodeSurface: string;
    stroke: string;
    text: string;
    edgeLabelStroke: string;
}

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

        const width = Math.max(140, coerceNumber(item.width, 220));
        const requestedHeight = Math.max(72, coerceNumber(item.height, 90));
        const textBlock = wrapMeasuredText(text, Math.max(48, width - 32), CANVAS_MAX_TEXT_LINES);
        if (textBlock.truncated) {
            throw new Error(`JSON Canvas node "${text}" exceeds the preview text budget.`);
        }
        const height = Math.max(requestedHeight, textBlock.lines.length * CANVAS_TEXT_LINE_HEIGHT + 32);

        return {
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `node-${index + 1}`,
            type: typeof item.type === 'string' ? item.type : 'text',
            text,
            x: coerceNumber(item.x, index * 280),
            y: coerceNumber(item.y, index * 140),
            width,
            height
        };
    });
}

function normalizeEdges(edges: unknown[]): CanvasEdge[] {
    return edges.map((edge, index) => {
        const item = (edge && typeof edge === 'object') ? edge as Record<string, unknown> : {};
        const label = typeof item.label === 'string' ? item.label.trim() : undefined;
        if (label && wrapMeasuredText(label, CANVAS_MAX_EDGE_LABEL_WIDTH, CANVAS_MAX_EDGE_LABEL_LINES).truncated) {
            throw new Error(`JSON Canvas edge label "${label}" exceeds the preview text budget.`);
        }
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
            label
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

function getCanvasNodeTextPlacement(node: CanvasNode): CanvasTextPlacement {
    const block = wrapMeasuredText(node.text || node.id, Math.max(48, node.width - 32), CANVAS_MAX_TEXT_LINES);
    const startY = node.y + node.height / 2 - ((Math.max(block.lines.length, 1) - 1) * CANVAS_TEXT_LINE_HEIGHT) / 2;
    return {
        x: node.x + node.width / 2,
        y: startY,
        width: Math.min(node.width - 32, Math.max(...block.lines.map(measureTextWidth), 0)),
        height: Math.max(1, block.lines.length) * CANVAS_TEXT_LINE_HEIGHT,
        lines: block.lines
    };
}

function renderNodeText(node: CanvasNode): string {
    const placement = getCanvasNodeTextPlacement(node);

    return `<text class="notemd-canvas-node-text" data-layout-safety="${LAYOUT_SAFETY_VERSION}" x="${placement.x}" y="${placement.y}" text-anchor="middle">
${placement.lines.map((line, index) => `<tspan x="${placement.x}" y="${placement.y + index * CANVAS_TEXT_LINE_HEIGHT}">${escapeXml(line)}</tspan>`).join('')}
</text>`;
}

function renderCanvasNode(node: CanvasNode): string {
    return `<g class="notemd-canvas-node" data-drawio-type="node" data-drawio-id="${escapeXml(node.id)}" data-node-id="${escapeXml(node.id)}">
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="18" ry="18" />
    ${renderNodeText(node)}
</g>`;
}

function resolveCanvasEdgeLabelPlacement(
    labelBlock: ReturnType<typeof wrapMeasuredText>,
    start: Point,
    end: Point,
    occupied: CanvasNode[]
): { x: number; y: number } {
    const width = Math.max(24, Math.min(CANVAS_MAX_EDGE_LABEL_WIDTH, labelBlock.width + 12));
    const height = Math.max(1, labelBlock.lines.length) * CANVAS_TEXT_LINE_HEIGHT;
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2 - 10;
    const candidates = [
        { x: centerX, y: centerY },
        { x: centerX, y: centerY - 24 },
        { x: centerX, y: centerY + 24 },
        { x: centerX + 28, y: centerY - 24 },
        { x: centerX - 28, y: centerY - 24 },
        { x: centerX + 28, y: centerY + 24 },
        { x: centerX - 28, y: centerY + 24 }
    ];
    for (const candidate of candidates) {
        const labelBox = { x: candidate.x - width / 2, y: candidate.y - height, width, height };
        if (!occupied.some(node => boxesOverlap(labelBox, node, 4))) {
            return candidate;
        }
    }
    return { x: centerX, y: centerY - 24 };
}

function renderCanvasEdge(edge: CanvasEdge, nodeIndex: Map<string, CanvasNode>, occupied: CanvasNode[]): string {
    const fromNode = nodeIndex.get(edge.fromNode);
    const toNode = nodeIndex.get(edge.toNode);
    if (!fromNode || !toNode) {
        return '';
    }

    const start = getNodeAnchor(fromNode, edge.fromSide ?? 'right');
    const end = getNodeAnchor(toNode, edge.toSide ?? 'left');
    const labelBlock = edge.label
        ? wrapMeasuredText(edge.label, CANVAS_MAX_EDGE_LABEL_WIDTH, CANVAS_MAX_EDGE_LABEL_LINES)
        : undefined;
    const labelPlacement = labelBlock ? resolveCanvasEdgeLabelPlacement(labelBlock, start, end, occupied) : undefined;
    const markerEnd = edge.toEnd === 'arrow' ? ' marker-end="url(#notemd-canvas-arrow)"' : '';

    return `<g class="notemd-canvas-edge" data-drawio-type="edge" data-drawio-id="${escapeXml(edge.id || `${edge.fromNode}-${edge.toNode}`)}" data-edge-id="${escapeXml(edge.id || `${edge.fromNode}-${edge.toNode}`)}">
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"${markerEnd} />
    ${edge.label && labelBlock && labelPlacement ? `<text class="notemd-canvas-edge-label" data-layout-safety="${LAYOUT_SAFETY_VERSION}" x="${labelPlacement.x}" y="${labelPlacement.y}" text-anchor="middle">${labelBlock.lines.map((line, index) => `<tspan x="${labelPlacement.x}" y="${labelPlacement.y - (labelBlock.lines.length - 1 - index) * CANVAS_TEXT_LINE_HEIGHT}">${escapeXml(line)}</tspan>`).join('')}</text>` : ''}
</g>`;
}

function getCanvasPreviewPalette(theme: RenderWebviewTheme): CanvasPreviewPalette {
    return resolveRenderTheme(theme) === 'dark'
        ? {
            surface: '#0f172a',
            nodeSurface: '#111827',
            stroke: '#2dd4bf',
            text: '#e2e8f0',
            edgeLabelStroke: '#0f172a'
        }
        : {
            surface: '#f8fafc',
            nodeSurface: '#ffffff',
            stroke: '#0f766e',
            text: '#0f172a',
            edgeLabelStroke: '#f8fafc'
        };
}

export async function renderJsonCanvasArtifactSvg(
    artifact: RenderArtifact,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    if (artifact.target !== 'json-canvas') {
        throw new Error(`renderJsonCanvasArtifactSvg only supports json-canvas artifacts, received "${artifact.target}".`);
    }

    const document = parseJsonCanvasArtifactContent(artifact.content);
    const palette = getCanvasPreviewPalette(theme);
    const bounds = buildCanvasBounds(document.nodes);
    const viewBoxX = bounds.minX - PREVIEW_PADDING;
    const viewBoxY = bounds.minY - PREVIEW_PADDING;
    const viewBoxWidth = bounds.width + PREVIEW_PADDING * 2;
    const viewBoxHeight = bounds.height + PREVIEW_PADDING * 2;
    const nodeIndex = new Map(document.nodes.map(node => [node.id, node]));

    const edgeMarkup = document.edges.map(edge => renderCanvasEdge(edge, nodeIndex, document.nodes)).join('\n');
    const nodeMarkup = document.nodes.map(renderCanvasNode).join('\n');
    const emptyMarkup = document.nodes.length === 0
        ? `<text class="notemd-canvas-empty" x="${viewBoxX + viewBoxWidth / 2}" y="${viewBoxY + viewBoxHeight / 2}" text-anchor="middle">No canvas nodes available</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" role="img" aria-label="JSON Canvas preview" data-layout-safety="${LAYOUT_SAFETY_VERSION}">
<defs>
    <marker id="notemd-canvas-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M0,0 L12,6 L0,12 z" fill="${palette.stroke}" />
    </marker>
    <style>
        .notemd-canvas-surface { fill: ${palette.surface}; }
        .notemd-canvas-node rect { fill: ${palette.nodeSurface}; stroke: ${palette.stroke}; stroke-width: 2; }
        .notemd-canvas-node-text,
        .notemd-canvas-edge-label,
        .notemd-canvas-empty {
            fill: ${palette.text};
            font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
            font-size: 15px;
        }
        .notemd-canvas-edge line {
            stroke: ${palette.stroke};
            stroke-width: 2.25;
        }
        .notemd-canvas-edge-label {
            paint-order: stroke;
            stroke: ${palette.edgeLabelStroke};
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
