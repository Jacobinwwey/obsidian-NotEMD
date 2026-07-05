import { DiagramCallout, DiagramEdge, DiagramNode, DiagramSpec } from '../../types';

export interface SemanticFigureNode {
    id: string;
    label: string;
    role: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SemanticFigureEdge {
    id: string;
    sourceId: string;
    targetId: string;
    label?: string;
    relation?: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    labelX: number;
    labelY: number;
}

export interface SemanticFigureModel {
    title: string;
    summary?: string;
    intent: DiagramSpec['intent'];
    nodes: SemanticFigureNode[];
    edges: SemanticFigureEdge[];
    callouts: DiagramCallout[];
    width: number;
    height: number;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 104;
const HORIZONTAL_GAP = 92;
const VERTICAL_GAP = 76;
const PADDING_X = 72;
const HEADER_HEIGHT = 116;
const CALLOUT_HEIGHT = 88;
const MIN_WIDTH = 720;

interface FigureNodeProjection {
    nodes: SemanticFigureNode[];
    semanticIdBySourceId: Map<string, string>;
}

function flattenNodes(nodes: DiagramNode[], flattened: DiagramNode[] = []): DiagramNode[] {
    for (const node of nodes) {
        flattened.push(node);
        if (node.children?.length) {
            flattenNodes(node.children, flattened);
        }
    }

    return flattened;
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
        return fallback;
    }

    return trimmed.replace(/\s+/g, '-');
}

function reserveUniqueIdentifier(baseId: string, usedIds: Set<string>): string {
    let candidate = baseId;
    let suffix = 2;

    while (usedIds.has(candidate)) {
        candidate = `${baseId}-${suffix}`;
        suffix += 1;
    }

    usedIds.add(candidate);
    return candidate;
}

function normalizeLabel(value: string | undefined, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed || fallback;
}

function inferNodeRole(node: DiagramNode): string {
    const kind = node.kind?.trim();
    return kind || 'process';
}

function createFigureNodeProjection(spec: DiagramSpec): FigureNodeProjection {
    const sourceNodes = flattenNodes(spec.nodes);
    const columnCount = Math.max(1, Math.min(3, sourceNodes.length));
    const usedIds = new Set<string>();
    const semanticIdBySourceId = new Map<string, string>();

    const nodes = sourceNodes.map((node, index) => {
        const sourceId = normalizeLabel(node.id, `node-${index + 1}`);
        const id = reserveUniqueIdentifier(normalizeIdentifier(sourceId, `node-${index + 1}`), usedIds);
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);

        semanticIdBySourceId.set(sourceId, id);

        return {
            id,
            label: normalizeLabel(node.label, id),
            role: inferNodeRole(node),
            x: PADDING_X + column * (NODE_WIDTH + HORIZONTAL_GAP),
            y: HEADER_HEIGHT + row * (NODE_HEIGHT + VERTICAL_GAP),
            width: NODE_WIDTH,
            height: NODE_HEIGHT
        };
    });

    return {
        nodes,
        semanticIdBySourceId
    };
}

function createFigureEdges(
    edges: DiagramEdge[],
    nodes: SemanticFigureNode[],
    semanticIdBySourceId: Map<string, string>
): SemanticFigureEdge[] {
    const nodeById = new Map(nodes.map(node => [node.id, node]));

    return edges
        .map((edge, index): SemanticFigureEdge | null => {
            const sourceId = semanticIdBySourceId.get(edge.from.trim()) ?? normalizeIdentifier(edge.from, edge.from);
            const targetId = semanticIdBySourceId.get(edge.to.trim()) ?? normalizeIdentifier(edge.to, edge.to);
            const source = nodeById.get(sourceId);
            const target = nodeById.get(targetId);

            if (!source || !target) {
                return null;
            }

            const startX = source.x + source.width;
            const startY = source.y + source.height / 2;
            const endX = target.x;
            const endY = target.y + target.height / 2;

            return {
                id: `edge-${index + 1}-${sourceId}-to-${targetId}`,
                sourceId,
                targetId,
                label: edge.label?.trim() || undefined,
                relation: edge.relation?.trim() || undefined,
                startX,
                startY,
                endX,
                endY,
                labelX: (startX + endX) / 2,
                labelY: (startY + endY) / 2 - 10
            };
        })
        .filter((edge): edge is SemanticFigureEdge => edge !== null);
}

export function buildSemanticFigureModel(spec: DiagramSpec): SemanticFigureModel {
    const { nodes, semanticIdBySourceId } = createFigureNodeProjection(spec);
    const rowCount = Math.max(1, Math.ceil(nodes.length / Math.max(1, Math.min(3, nodes.length))));
    const columnCount = Math.max(1, Math.min(3, nodes.length));
    const width = Math.max(
        MIN_WIDTH,
        PADDING_X * 2 + columnCount * NODE_WIDTH + Math.max(0, columnCount - 1) * HORIZONTAL_GAP
    );
    const graphHeight = HEADER_HEIGHT + rowCount * NODE_HEIGHT + Math.max(0, rowCount - 1) * VERTICAL_GAP;
    const calloutHeight = spec.callouts?.length ? CALLOUT_HEIGHT + spec.callouts.length * 34 : 0;

    return {
        title: normalizeLabel(spec.title, 'Generated Figure'),
        summary: spec.summary?.trim() || undefined,
        intent: spec.intent,
        nodes,
        edges: createFigureEdges(spec.edges ?? [], nodes, semanticIdBySourceId),
        callouts: spec.callouts ?? [],
        width,
        height: graphHeight + calloutHeight + 64
    };
}
