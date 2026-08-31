import { DiagramCallout, DiagramEdge, DiagramNode, DiagramSpec } from '../../types';
import { measureTextWidth, wrapMeasuredText } from '../../layout/layoutSafety';

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
const NODE_MIN_HEIGHT = 104;
const HORIZONTAL_GAP = 92;
const VERTICAL_GAP = 76;
const PADDING_X = 72;
const HEADER_HEIGHT = 116;
const CALLOUT_HEIGHT = 88;
const MIN_WIDTH = 720;
const ASYNC_EDGE_RELATIONS = new Set(['async', 'asynchronous', 'queue', 'queued']);

interface FigureNodeProjection {
    nodes: SemanticFigureNode[];
    semanticIdBySourceId: Map<string, string>;
}

interface EdgeConnectionPoints {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
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

export function isAsyncSemanticFigureEdge(edge: Pick<SemanticFigureEdge, 'relation'>): boolean {
    const relation = edge.relation?.trim().toLowerCase();
    return Boolean(relation && ASYNC_EDGE_RELATIONS.has(relation));
}

function createFigureNodeProjection(spec: DiagramSpec): FigureNodeProjection {
    const sourceNodes = flattenNodes(spec.nodes);
    const columnCount = Math.max(1, Math.min(3, sourceNodes.length));
    const usedIds = new Set<string>();
    const semanticIdBySourceId = new Map<string, string>();
    const normalized = sourceNodes.map((node, index) => {
        const sourceId = normalizeLabel(node.id, `node-${index + 1}`);
        const id = reserveUniqueIdentifier(normalizeIdentifier(sourceId, `node-${index + 1}`), usedIds);
        semanticIdBySourceId.set(sourceId, id);
        const label = normalizeLabel(node.label, id);
        const role = inferNodeRole(node);
        const labelLines = wrapMeasuredText(label, NODE_WIDTH - 28, 3).lines.length;
        const roleWidth = measureTextWidth(role);
        const height = Math.max(NODE_MIN_HEIGHT, 52 + labelLines * 18 + 22 + (roleWidth > NODE_WIDTH - 28 ? 16 : 0));
        return { id, label, role, height };
    });
    const rowHeights: number[] = [];
    normalized.forEach((node, index) => {
        const row = Math.floor(index / columnCount);
        rowHeights[row] = Math.max(rowHeights[row] ?? NODE_MIN_HEIGHT, node.height);
    });
    const rowY: number[] = [];
    rowHeights.forEach((height, index) => {
        rowY[index] = HEADER_HEIGHT + rowHeights.slice(0, index).reduce((total, value) => total + value + VERTICAL_GAP, 0);
    });

    const nodes = normalized.map((node, index) => {
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);
        return {
            id: node.id,
            label: node.label,
            role: node.role,
            x: PADDING_X + column * (NODE_WIDTH + HORIZONTAL_GAP),
            y: rowY[row],
            width: NODE_WIDTH,
            height: node.height
        };
    });

    return {
        nodes,
        semanticIdBySourceId
    };
}

function resolveEdgeConnectionPoints(source: SemanticFigureNode, target: SemanticFigureNode): EdgeConnectionPoints {
    const sourceCenterX = source.x + source.width / 2;
    const sourceCenterY = source.y + source.height / 2;
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;
    const horizontalDistance = Math.abs(targetCenterX - sourceCenterX);
    const verticalDistance = Math.abs(targetCenterY - sourceCenterY);

    if (horizontalDistance >= verticalDistance) {
        if (sourceCenterX <= targetCenterX) {
            return {
                startX: source.x + source.width,
                startY: sourceCenterY,
                endX: target.x,
                endY: targetCenterY
            };
        }

        return {
            startX: source.x,
            startY: sourceCenterY,
            endX: target.x + target.width,
            endY: targetCenterY
        };
    }

    if (sourceCenterY <= targetCenterY) {
        return {
            startX: sourceCenterX,
            startY: source.y + source.height,
            endX: targetCenterX,
            endY: target.y
        };
    }

    return {
        startX: sourceCenterX,
        startY: source.y,
        endX: targetCenterX,
        endY: target.y + target.height
    };
}

function createFigureEdges(
    edges: DiagramEdge[],
    nodes: SemanticFigureNode[],
    semanticIdBySourceId: Map<string, string>
): SemanticFigureEdge[] {
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const occupied = nodes.map(node => ({ x: node.x, y: node.y, width: node.width, height: node.height }));

    return edges
        .map((edge, index): SemanticFigureEdge | null => {
            const sourceId = semanticIdBySourceId.get(edge.from.trim()) ?? normalizeIdentifier(edge.from, edge.from);
            const targetId = semanticIdBySourceId.get(edge.to.trim()) ?? normalizeIdentifier(edge.to, edge.to);
            const source = nodeById.get(sourceId);
            const target = nodeById.get(targetId);

            if (!source || !target) {
                return null;
            }

            const { startX, startY, endX, endY } = resolveEdgeConnectionPoints(source, target);
            const label = edge.label?.trim() || undefined;
            const relation = edge.relation?.trim() || undefined;
            const labelText = label || relation;
            let labelX = (startX + endX) / 2;
            let labelY = (startY + endY) / 2 - 10;
            if (labelText) {
                const labelWidth = Math.min(190, measureTextWidth(labelText) + 12);
                const candidates = [
                    { x: labelX, y: labelY },
                    { x: labelX, y: labelY - 24 },
                    { x: labelX, y: labelY + 24 },
                    { x: (startX + endX) / 2, y: Math.min(startY, endY) - 18 },
                    { x: (startX + endX) / 2, y: Math.max(startY, endY) + 24 },
                    { x: (startX + endX) / 2, y: Math.min(startY, endY) - 42 },
                    { x: (startX + endX) / 2, y: Math.max(startY, endY) + 48 },
                    { x: (startX + endX) / 2, y: Math.min(startY, endY) - 66 },
                    { x: (startX + endX) / 2, y: Math.max(startY, endY) + 72 }
                ];
                const candidate = candidates.find(position => {
                    const rect = { x: position.x - labelWidth / 2, y: position.y - 14, width: labelWidth, height: 18 };
                    return !occupied.some(box => box.x < rect.x + rect.width + 4
                        && box.x + box.width + 4 > rect.x
                        && box.y < rect.y + rect.height + 4
                        && box.y + box.height + 4 > rect.y);
                });
                if (candidate) {
                    labelX = candidate.x;
                    labelY = candidate.y;
                }
                occupied.push({ x: labelX - labelWidth / 2, y: labelY - 14, width: labelWidth, height: 18 });
            }

            return {
                id: `edge-${index + 1}-${sourceId}-to-${targetId}`,
                sourceId,
                targetId,
                label,
                relation,
                startX,
                startY,
                endX,
                endY,
                labelX,
                labelY
            };
        })
        .filter((edge): edge is SemanticFigureEdge => edge !== null);
}

export function buildSemanticFigureModel(spec: DiagramSpec): SemanticFigureModel {
    const { nodes, semanticIdBySourceId } = createFigureNodeProjection(spec);
    const columnCount = Math.max(1, Math.min(3, nodes.length));
    const width = Math.max(
        MIN_WIDTH,
        PADDING_X * 2 + columnCount * NODE_WIDTH + Math.max(0, columnCount - 1) * HORIZONTAL_GAP
    );
    const graphHeight = Math.max(HEADER_HEIGHT, ...nodes.map(node => node.y + node.height));
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
