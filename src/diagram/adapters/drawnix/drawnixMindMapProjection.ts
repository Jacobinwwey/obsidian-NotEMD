import { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';
import { routeDrawnixCrossRootRelation } from './drawnixCrossRootRouter';
import type {
    DrawnixCrossRootRouteObstacle,
    DrawnixCrossRootRouteStrategy
} from './drawnixCrossRootRouter';

export type DrawnixPoint = [number, number];

export interface DrawnixMindMapTopic {
    type: 'paragraph';
    children: Array<{ text: string }>;
}

export interface DrawnixMindMapData {
    topic: DrawnixMindMapTopic;
}

export interface DrawnixMindMapElement {
    id: string;
    type: 'mindmap' | 'mind_child';
    children: DrawnixMindMapElement[];
    data: DrawnixMindMapData;
    layout?: 'standard';
    rightNodeCount?: number;
    points?: DrawnixPoint[];
}

export interface DrawnixMindMapArrowElement {
    id: string;
    type: 'arrow-line';
    /** Native Plait shape for an explicitly supplied polyline route. */
    shape: 'straight';
    points: DrawnixPoint[];
    source: { id: string; marker: 'none' };
    target: { id: string; marker: 'arrow' };
    /** Native Plait arrow-line text contract. */
    texts: Array<{
        text: DrawnixMindMapTopic;
        position: number;
    }>;
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: 'dashed';
    opacity: 1;
    /** Legacy fields are retained for older Drawnix readers. */
    text: { children: Array<{ text: string }> };
    style: { stroke: string; dashed: true };
    data: {
        source: 'DrawnixMindMapProjection';
    };
}

export interface DrawnixMindMapPlacedNode {
    id: string;
    rootId: string;
    label: string;
    role: string;
    parentId?: string;
    depth: number;
    branchIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    textLines: string[];
}

export interface DrawnixMindMapHierarchyBranch {
    parentId: string;
    childId: string;
    branchIndex: number;
    start: DrawnixPoint;
    end: DrawnixPoint;
}

export interface DrawnixMindMapCrossRelation {
    id: string;
    sourceId: string;
    targetId: string;
    sourceRootId: string;
    targetRootId: string;
    label?: string;
    labelLayout?: DrawnixMindMapRelationLabelLayout;
    points: DrawnixPoint[];
    routeStrategy: DrawnixCrossRootRouteStrategy;
    routeWarning?: string;
    /** Position used by Plait to center the native text rectangle on the route. */
    nativeTextPosition?: number;
}

export interface DrawnixMindMapRelationLabelLayout {
    x: number;
    y: number;
    width: number;
    height: number;
    lines: string[];
    lineHeight: number;
}

export interface DrawnixMindMapHeaderLayout {
    /** The y-coordinate below which nodes, routes, and labels may be placed. */
    safeHeight: number;
    /** Summary lines after applying the same deterministic width estimate as node labels. */
    summaryLines: string[];
    summaryLineHeight: number;
    titleBaseline: number;
    summaryFirstBaseline: number;
}

export interface DrawnixRootRegion {
    rootId: string;
    rowIndex: number;
    columnIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DrawnixMindMapProjection {
    title: string;
    summary?: string;
    header: DrawnixMindMapHeaderLayout;
    roots: DrawnixMindMapElement[];
    /**
     * Backward-compatible alias for the first root. New consumers should use roots.
     */
    root: DrawnixMindMapElement;
    nodes: DrawnixMindMapPlacedNode[];
    hierarchyBranches: DrawnixMindMapHierarchyBranch[];
    crossRelations: DrawnixMindMapCrossRelation[];
    rootRegions: DrawnixRootRegion[];
    width: number;
    height: number;
}

interface MindMapTreeNode {
    id: string;
    rootId: string;
    label: string;
    role: string;
    source: DiagramNode;
    parent?: MindMapTreeNode;
    children: MindMapTreeNode[];
    depth: number;
    branchIndex: number;
    textLines: string[];
    width: number;
    height: number;
    subtreeHeight: number;
    x: number;
    y: number;
}

const MAX_MIND_MAP_DEPTH = 3;
const MAX_CROSS_RELATIONS = 4;
const ROOT_HORIZONTAL_GAP = 132;
const CHILD_HORIZONTAL_GAP = 92;
const SIBLING_VERTICAL_GAP = 30;
const HORIZONTAL_MARGIN = 72;
const TOP_MARGIN = 118;
const BOTTOM_MARGIN = 72;
const ROOT_MIN_WIDTH = 180;
const NODE_MIN_WIDTH = 136;
const MAX_NODE_WIDTH = 292;
const NODE_HORIZONTAL_PADDING = 32;
const NODE_VERTICAL_PADDING = 22;
const LINE_HEIGHT = 19;
const ROOT_LINE_HEIGHT = 22;
const NODE_MIN_HEIGHT = 56;
const ROOT_MIN_HEIGHT = 68;
const MAX_TEXT_LINE_WIDTH = MAX_NODE_WIDTH - NODE_HORIZONTAL_PADDING;
const RELATION_LABEL_MAX_TEXT_WIDTH = 264;
const RELATION_LABEL_HORIZONTAL_PADDING = 12;
const RELATION_LABEL_VERTICAL_PADDING = 8;
const RELATION_LABEL_LINE_HEIGHT = 16;
const RELATION_LABEL_NODE_CLEARANCE = 10;
const RELATION_LABEL_GAP = 12;
const RELATION_LABEL_SEARCH_STEP = 12;

/**
 * The title and summary are page-level annotations, not mind-map nodes. The
 * router and label placer reserve this band so long routes cannot turn the
 * header into an accidental relation lane.
 */
export const DRAWNIX_MIND_MAP_HEADER_SAFE_HEIGHT = 108;
const DRAWNIX_MIND_MAP_HEADER_HORIZONTAL_PADDING = 72;
const DRAWNIX_MIND_MAP_HEADER_TITLE_BASELINE = 44;
const DRAWNIX_MIND_MAP_HEADER_SUMMARY_BASELINE = 72;
const DRAWNIX_MIND_MAP_HEADER_SUMMARY_LINE_HEIGHT = 20;
const DRAWNIX_MIND_MAP_HEADER_BOTTOM_PADDING = 20;
const DRAWNIX_MIND_MAP_HEADER_MIN_TEXT_WIDTH = 120;

function normalizedText(value: string | undefined, fallback: string): string {
    return value?.trim() || fallback;
}

function estimateCharacterWidth(character: string): number {
    if (/\s/.test(character)) {
        return 4;
    }
    if ((character.codePointAt(0) ?? 0) > 0x7f) {
        return 15;
    }
    if (/[MW@%]/.test(character)) {
        return 14;
    }
    if (/[mw#&]/.test(character)) {
        return 12;
    }
    if (/[A-Z0-9]/.test(character)) {
        return 11;
    }
    return 8;
}

function visualLength(value: string): number {
    return Array.from(value).reduce((total, character) => total + estimateCharacterWidth(character), 0);
}

function splitLabel(label: string, maxLineWidth: number): string[] {
    const trimmed = label.trim();
    if (!trimmed) {
        return ['Untitled'];
    }

    const words = trimmed.split(/\s+/);
    const lines: string[] = [];
    let line = '';

    const flushLine = (): void => {
        if (line) {
            lines.push(line);
            line = '';
        }
    };

    const appendLongWord = (word: string): void => {
        let chunk = '';
        for (const character of Array.from(word)) {
            const candidate = chunk + character;
            if (chunk && visualLength(candidate) > maxLineWidth) {
                lines.push(chunk);
                chunk = character;
            } else {
                chunk = candidate;
            }
        }
        line = chunk;
    };

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (visualLength(candidate) <= maxLineWidth) {
            line = candidate;
            continue;
        }

        flushLine();
        if (visualLength(word) <= maxLineWidth) {
            line = word;
            continue;
        }

        appendLongWord(word);
    }

    flushLine();

    return lines;
}

function buildHeaderLayout(summary: string | undefined, canvasWidth: number): DrawnixMindMapHeaderLayout {
    const normalizedSummary = summary?.trim();
    const summaryLines = normalizedSummary
        ? splitLabel(
            normalizedSummary,
            Math.max(
                DRAWNIX_MIND_MAP_HEADER_MIN_TEXT_WIDTH,
                canvasWidth - DRAWNIX_MIND_MAP_HEADER_HORIZONTAL_PADDING * 2
            )
        )
        : [];
    const lastSummaryBaseline = summaryLines.length > 0
        ? DRAWNIX_MIND_MAP_HEADER_SUMMARY_BASELINE
            + (summaryLines.length - 1) * DRAWNIX_MIND_MAP_HEADER_SUMMARY_LINE_HEIGHT
        : DRAWNIX_MIND_MAP_HEADER_TITLE_BASELINE;
    const safeHeight = Math.max(
        DRAWNIX_MIND_MAP_HEADER_SAFE_HEIGHT,
        lastSummaryBaseline + DRAWNIX_MIND_MAP_HEADER_BOTTOM_PADDING
    );

    return {
        safeHeight,
        summaryLines,
        summaryLineHeight: DRAWNIX_MIND_MAP_HEADER_SUMMARY_LINE_HEIGHT,
        titleBaseline: DRAWNIX_MIND_MAP_HEADER_TITLE_BASELINE,
        summaryFirstBaseline: DRAWNIX_MIND_MAP_HEADER_SUMMARY_BASELINE
    };
}

function buildTreeNode(
    source: DiagramNode,
    parent: MindMapTreeNode | undefined,
    depth: number,
    branchIndex: number,
    rootId: string
): MindMapTreeNode {
    const label = normalizedText(source.label, source.id || 'Untitled');
    const isRoot = depth === 0;
    const textLines = splitLabel(label, MAX_TEXT_LINE_WIDTH);
    const largestLineWidth = Math.max(...textLines.map(visualLength));
    const minWidth = isRoot ? ROOT_MIN_WIDTH : NODE_MIN_WIDTH;
    const minHeight = isRoot ? ROOT_MIN_HEIGHT : NODE_MIN_HEIGHT;
    const lineHeight = isRoot ? ROOT_LINE_HEIGHT : LINE_HEIGHT;

    const node: MindMapTreeNode = {
        id: source.id.trim(),
        rootId,
        label,
        role: normalizedText(source.kind, 'concept'),
        source,
        parent,
        children: [],
        depth,
        branchIndex,
        textLines,
        width: Math.min(MAX_NODE_WIDTH, Math.max(minWidth, Math.ceil(largestLineWidth + NODE_HORIZONTAL_PADDING))),
        height: Math.max(minHeight, textLines.length * lineHeight + NODE_VERTICAL_PADDING),
        subtreeHeight: 0,
        x: 0,
        y: 0
    };

    node.children = (source.children ?? []).map(child => buildTreeNode(child, node, depth + 1, branchIndex, rootId));
    return node;
}

function collectTreeNodes(root: MindMapTreeNode): MindMapTreeNode[] {
    const nodes: MindMapTreeNode[] = [];
    const visit = (node: MindMapTreeNode): void => {
        nodes.push(node);
        node.children.forEach(visit);
    };
    visit(root);
    return nodes;
}

function collectMindMapValidationErrors(spec: DiagramSpec): string[] {
    const errors: string[] = [];
    if (spec.intent !== 'drawnixMindmap') {
        errors.push('Drawnix native export requires the "drawnixMindmap" intent.');
    }
    if (spec.nodes.length === 0) {
        errors.push('Drawnix mind-map export requires at least one root node.');
        return errors;
    }

    const ids = new Set<string>();
    const parentChildPairs = new Set<string>();
    const activeReferences = new Set<DiagramNode>();
    const visit = (node: DiagramNode, depth: number, parentId?: string): void => {
        if (activeReferences.has(node)) {
            errors.push('Drawnix mind-map node hierarchy contains a cycle.');
            return;
        }
        activeReferences.add(node);

        const id = node.id?.trim();
        if (!id) {
            errors.push('Drawnix mind-map node is missing an id.');
        } else if (ids.has(id)) {
            errors.push(`Drawnix mind-map node id "${id}" is duplicated.`);
        } else {
            ids.add(id);
            if (parentId) {
                parentChildPairs.add([parentId, id].sort().join('\u0000'));
            }
        }

        if (depth > MAX_MIND_MAP_DEPTH) {
            errors.push(`Drawnix mind-map exceeds the maximum depth of ${MAX_MIND_MAP_DEPTH}.`);
        }

        (node.children ?? []).forEach(child => visit(child, depth + 1, id));
        activeReferences.delete(node);
    };
    spec.nodes.forEach(root => visit(root, 0));

    const edges = spec.edges ?? [];
    if (edges.length > MAX_CROSS_RELATIONS) {
        errors.push(`Drawnix mind-map supports at most ${MAX_CROSS_RELATIONS} cross-branch relationships.`);
    }

    edges.forEach((edge, index) => {
        const sourceId = edge.from?.trim();
        const targetId = edge.to?.trim();
        if (!ids.has(sourceId) || !ids.has(targetId)) {
            errors.push(`Drawnix mind-map relationship ${index + 1} references an unknown node.`);
            return;
        }
        if (parentChildPairs.has([sourceId, targetId].sort().join('\u0000'))) {
            errors.push(`Drawnix mind-map relationship ${index + 1} duplicates a parent-child relationship.`);
        }
    });

    return errors;
}

export function validateDrawnixMindMapSpec(spec: DiagramSpec): string[] {
    return collectMindMapValidationErrors(spec);
}

export function assertValidDrawnixMindMapSpec(spec: DiagramSpec): void {
    const errors = validateDrawnixMindMapSpec(spec);
    if (errors.length > 0) {
        throw new Error(errors.join(' '));
    }
}

function calculateSubtreeHeight(node: MindMapTreeNode): number {
    if (node.children.length === 0) {
        node.subtreeHeight = node.height;
        return node.subtreeHeight;
    }

    const childrenHeight = node.children.reduce((total, child) => total + calculateSubtreeHeight(child), 0)
        + SIBLING_VERTICAL_GAP * Math.max(0, node.children.length - 1);
    node.subtreeHeight = Math.max(node.height, childrenHeight);
    return node.subtreeHeight;
}

function placeSubtree(
    node: MindMapTreeNode,
    direction: 'left' | 'right',
    x: number,
    centerY: number,
    hierarchyBranches: DrawnixMindMapHierarchyBranch[]
): void {
    node.x = x;
    node.y = centerY - node.height / 2;
    if (node.children.length === 0) {
        return;
    }

    const childrenHeight = node.children.reduce((total, child) => total + child.subtreeHeight, 0)
        + SIBLING_VERTICAL_GAP * Math.max(0, node.children.length - 1);
    let childTop = centerY - childrenHeight / 2;

    for (const child of node.children) {
        const childX = direction === 'right'
            ? node.x + node.width + CHILD_HORIZONTAL_GAP
            : node.x - CHILD_HORIZONTAL_GAP - child.width;
        const childCenterY = childTop + child.subtreeHeight / 2;
        placeSubtree(child, direction, childX, childCenterY, hierarchyBranches);
        hierarchyBranches.push({
            parentId: node.id,
            childId: child.id,
            branchIndex: child.branchIndex,
            start: direction === 'right'
                ? [node.x + node.width, node.y + node.height / 2]
                : [node.x, node.y + node.height / 2],
            end: direction === 'right'
                ? [child.x, child.y + child.height / 2]
                : [child.x + child.width, child.y + child.height / 2]
        });
        childTop += child.subtreeHeight + SIBLING_VERTICAL_GAP;
    }
}

function shiftPoint(point: DrawnixPoint, offsetX: number, offsetY: number): DrawnixPoint {
    return [point[0] + offsetX, point[1] + offsetY];
}

function shiftLayout(
    nodes: MindMapTreeNode[],
    hierarchyBranches: DrawnixMindMapHierarchyBranch[]
): { width: number; height: number } {
    const minX = Math.min(...nodes.map(node => node.x));
    const minY = Math.min(...nodes.map(node => node.y));
    const maxX = Math.max(...nodes.map(node => node.x + node.width));
    const maxY = Math.max(...nodes.map(node => node.y + node.height));
    const offsetX = HORIZONTAL_MARGIN - minX;
    const offsetY = TOP_MARGIN - minY;

    nodes.forEach(node => {
        node.x += offsetX;
        node.y += offsetY;
    });
    hierarchyBranches.forEach(branch => {
        branch.start = shiftPoint(branch.start, offsetX, offsetY);
        branch.end = shiftPoint(branch.end, offsetX, offsetY);
    });

    return {
        width: Math.ceil(maxX - minX + HORIZONTAL_MARGIN * 2),
        height: Math.ceil(maxY - minY + TOP_MARGIN + BOTTOM_MARGIN)
    };
}

function toPlacedNode(node: MindMapTreeNode): DrawnixMindMapPlacedNode {
    return {
        id: node.id,
        rootId: node.rootId,
        label: node.label,
        role: node.role,
        parentId: node.parent?.id,
        depth: node.depth,
        branchIndex: node.branchIndex,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        textLines: node.textLines
    };
}

function toDrawnixMindElement(node: MindMapTreeNode, isRoot: boolean, rightNodeCount: number): DrawnixMindMapElement {
    const element: DrawnixMindMapElement = {
        id: node.id,
        type: isRoot ? 'mindmap' : 'mind_child',
        children: node.children.map(child => toDrawnixMindElement(child, false, 0)),
        data: {
            topic: {
                type: 'paragraph',
                children: [{ text: node.textLines.join('\n') }]
            }
        }
    };

    if (isRoot) {
        element.layout = 'standard';
        element.rightNodeCount = rightNodeCount;
        element.points = [[node.x + node.width / 2, node.y + node.height / 2]];
    }

    return element;
}

function createCrossRelations(
    edges: DiagramEdge[],
    placedNodes: DrawnixMindMapPlacedNode[],
    rootRegions: readonly DrawnixRootRegion[],
    canvasWidth: number,
    canvasHeight: number,
    protectedObstacles: readonly DrawnixCrossRootRouteObstacle[]
): DrawnixMindMapCrossRelation[] {
    const nodeById = new Map(placedNodes.map(node => [node.id, node]));
    return edges.map((edge, index) => {
        const sourceId = edge.from.trim();
        const targetId = edge.to.trim();
        const source = nodeById.get(sourceId);
        const target = nodeById.get(targetId);
        if (!source || !target) {
            throw new Error(`Drawnix mind-map relationship ${index + 1} references an unknown node.`);
        }

        const route = routeDrawnixCrossRootRelation({
            source,
            target,
            nodes: placedNodes,
            relationIndex: index,
            regions: rootRegions,
            canvasWidth,
            canvasHeight,
            additionalObstacles: protectedObstacles
        });

        return {
            id: `cross-${index + 1}-${sourceId}-to-${targetId}`,
            sourceId,
            targetId,
            sourceRootId: source.rootId,
            targetRootId: target.rootId,
            label: normalizedText(edge.label, normalizedText(edge.relation, '')) || undefined,
            points: route.points,
            routeStrategy: route.strategy,
            routeWarning: route.warning
        };
    });
}

interface RelationLabelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RelationRouteSegment {
    start: DrawnixPoint;
    end: DrawnixPoint;
    index: number;
    length: number;
    horizontal: boolean;
}

function inflateLabelObstacle(
    node: DrawnixMindMapPlacedNode,
    clearance: number
): RelationLabelRect {
    return {
        x: node.x - clearance,
        y: node.y - clearance,
        width: node.width + clearance * 2,
        height: node.height + clearance * 2
    };
}

function rectanglesOverlap(left: RelationLabelRect, right: RelationLabelRect): boolean {
    return left.x < right.x + right.width
        && left.x + left.width > right.x
        && left.y < right.y + right.height
        && left.y + left.height > right.y;
}

function relationRouteSegments(points: DrawnixPoint[]): RelationRouteSegment[] {
    return points.slice(1).map((end, index) => {
        const start = points[index];
        return {
            start,
            end,
            index,
            length: Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]),
            horizontal: start[1] === end[1]
        };
    }).filter(segment => segment.length > 0);
}

function relationLabelRectForSegment(
    segment: RelationRouteSegment,
    width: number,
    height: number,
    offset: number
): RelationLabelRect {
    const centerX = (segment.start[0] + segment.end[0]) / 2;
    const centerY = (segment.start[1] + segment.end[1]) / 2;
    if (segment.horizontal) {
        return {
            x: centerX - width / 2,
            y: centerY + offset - height / 2,
            width,
            height
        };
    }
    return {
        x: centerX + offset - width / 2,
        y: centerY - height / 2,
        width,
        height
    };
}

function isLabelRectAvailable(
    rect: RelationLabelRect,
    nodes: readonly DrawnixMindMapPlacedNode[],
    occupiedLabels: readonly RelationLabelRect[],
    protectedObstacles: readonly RelationLabelRect[],
    canvasWidth: number,
    canvasHeight: number
): boolean {
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > canvasWidth || rect.y + rect.height > canvasHeight) {
        return false;
    }

    if (nodes.some(node => rectanglesOverlap(rect, inflateLabelObstacle(node, RELATION_LABEL_NODE_CLEARANCE)))) {
        return false;
    }

    if (protectedObstacles.some(obstacle => rectanglesOverlap(rect, obstacle))) {
        return false;
    }

    return occupiedLabels.every(label => !rectanglesOverlap(rect, {
        x: label.x - RELATION_LABEL_GAP,
        y: label.y - RELATION_LABEL_GAP,
        width: label.width + RELATION_LABEL_GAP * 2,
        height: label.height + RELATION_LABEL_GAP * 2
    }));
}

function findFallbackRelationLabelRect(
    width: number,
    height: number,
    relation: DrawnixMindMapCrossRelation,
    nodes: readonly DrawnixMindMapPlacedNode[],
    occupiedLabels: readonly RelationLabelRect[],
    protectedObstacles: readonly RelationLabelRect[],
    canvasWidth: number,
    canvasHeight: number
): RelationLabelRect | null {
    const midpoint = relation.points[Math.floor(relation.points.length / 2)] ?? [canvasWidth / 2, canvasHeight / 2];
    const candidates: RelationLabelRect[] = [];
    for (let y = 0; y <= Math.max(0, canvasHeight - height); y += RELATION_LABEL_SEARCH_STEP) {
        for (let x = 0; x <= Math.max(0, canvasWidth - width); x += RELATION_LABEL_SEARCH_STEP) {
            candidates.push({ x, y, width, height });
        }
    }
    candidates.sort((left, right) => {
        const leftDistance = Math.hypot(left.x + left.width / 2 - midpoint[0], left.y + left.height / 2 - midpoint[1]);
        const rightDistance = Math.hypot(right.x + right.width / 2 - midpoint[0], right.y + right.height / 2 - midpoint[1]);
        return leftDistance - rightDistance || left.y - right.y || left.x - right.x;
    });
    return candidates.find(candidate => isLabelRectAvailable(
        candidate,
        nodes,
        occupiedLabels,
        protectedObstacles,
        canvasWidth,
        canvasHeight
    )) ?? null;
}

function layoutCrossRelationLabels(
    relations: DrawnixMindMapCrossRelation[],
    nodes: readonly DrawnixMindMapPlacedNode[],
    canvasWidth: number,
    canvasHeight: number,
    protectedObstacles: readonly RelationLabelRect[]
): void {
    const occupiedLabels: RelationLabelRect[] = [];
    relations.forEach(relation => {
        if (!relation.label) {
            return;
        }

        const lines = splitLabel(relation.label, RELATION_LABEL_MAX_TEXT_WIDTH);
        const largestLineWidth = Math.max(...lines.map(visualLength));
        const width = Math.max(
            96,
            Math.min(
                RELATION_LABEL_MAX_TEXT_WIDTH + RELATION_LABEL_HORIZONTAL_PADDING * 2,
                largestLineWidth + RELATION_LABEL_HORIZONTAL_PADDING * 2
            )
        );
        const height = lines.length * RELATION_LABEL_LINE_HEIGHT + RELATION_LABEL_VERTICAL_PADDING * 2;
        const segments = relationRouteSegments(relation.points).sort((left, right) => {
            const orientationDelta = Number(right.horizontal) - Number(left.horizontal);
            return orientationDelta || right.length - left.length || left.index - right.index;
        });
        const offsetsForSegment = (segment: RelationRouteSegment): number[] => {
            const distance = segment.horizontal ? height / 2 + 10 : width / 2 + 10;
            return [
                -distance,
                distance,
                0,
                -distance * 1.75,
                distance * 1.75
            ];
        };

        let selected: RelationLabelRect | undefined;
        for (const segment of segments) {
            for (const offset of offsetsForSegment(segment)) {
                const candidate = relationLabelRectForSegment(segment, width, height, offset);
                if (isLabelRectAvailable(
                    candidate,
                    nodes,
                    occupiedLabels,
                    protectedObstacles,
                    canvasWidth,
                    canvasHeight
                )) {
                    selected = candidate;
                    break;
                }
            }
            if (selected) {
                break;
            }
        }
        const rect = selected ?? findFallbackRelationLabelRect(
            width,
            height,
            relation,
            nodes,
            occupiedLabels,
            protectedObstacles,
            canvasWidth,
            canvasHeight
        );
        if (!rect) {
            throw new Error(
                `Drawnix relation label "${relation.id}" could not find a collision-free position `
                + 'inside the generated canvas.'
            );
        }
        relation.labelLayout = {
            ...rect,
            lines,
            lineHeight: RELATION_LABEL_LINE_HEIGHT
        };
        occupiedLabels.push(rect);
    });
}

function pointOnPolyline(points: readonly DrawnixPoint[], position: number): DrawnixPoint {
    if (points.length === 0) {
        return [0, 0];
    }
    if (points.length === 1) {
        return points[0];
    }

    const lengths = points.slice(1).map((point, index) => {
        const start = points[index];
        return Math.abs(point[0] - start[0]) + Math.abs(point[1] - start[1]);
    });
    const totalLength = lengths.reduce((total, length) => total + length, 0);
    if (totalLength <= 0) {
        return points[0];
    }

    let remaining = totalLength * Math.max(0, Math.min(1, position));
    for (const [index, length] of lengths.entries()) {
        if (remaining <= length || index === lengths.length - 1) {
            const start = points[index];
            const end = points[index + 1];
            if (length <= 0) {
                return start;
            }
            const ratio = Math.max(0, Math.min(1, remaining / length));
            return [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio
            ];
        }
        remaining -= length;
    }
    return points[points.length - 1];
}

function nativeRelationLabelRect(
    relation: DrawnixMindMapCrossRelation,
    position: number
): RelationLabelRect | null {
    const layout = relation.labelLayout;
    if (!layout) {
        return null;
    }
    const center = pointOnPolyline(relation.points, position);
    return {
        x: center[0] - layout.width / 2,
        y: center[1] - layout.height / 2,
        width: layout.width,
        height: layout.height
    };
}

function layoutNativeRelationLabelPositions(
    relations: DrawnixMindMapCrossRelation[],
    nodes: readonly DrawnixMindMapPlacedNode[],
    canvasWidth: number,
    canvasHeight: number,
    protectedObstacles: readonly RelationLabelRect[]
): void {
    const occupiedNativeLabels: RelationLabelRect[] = [];
    relations.forEach(relation => {
        if (!relation.label || !relation.labelLayout) {
            return;
        }

        const preferredPosition = arrowTextPosition(relation);
        const candidates = Array.from({ length: 19 }, (_, index) => (index + 1) / 20)
            .sort((left, right) => Math.abs(left - preferredPosition) - Math.abs(right - preferredPosition));
        const selectedPosition = candidates.find(candidate => {
            const rect = nativeRelationLabelRect(relation, candidate);
            return rect && isLabelRectAvailable(
                rect,
                nodes,
                occupiedNativeLabels,
                protectedObstacles,
                canvasWidth,
                canvasHeight
            );
        });

        relation.nativeTextPosition = selectedPosition ?? preferredPosition;
        const selectedRect = nativeRelationLabelRect(relation, relation.nativeTextPosition);
        if (selectedRect) {
            occupiedNativeLabels.push(selectedRect);
        }
    });
}

function clampArrowTextPosition(value: number): number {
    return Math.max(0.05, Math.min(0.95, value));
}

function arrowTextPosition(relation: DrawnixMindMapCrossRelation): number {
    const points = relation.points;
    const layout = relation.labelLayout;
    if (points.length < 2 || !layout) {
        return 0.5;
    }

    const targetX = layout.x + layout.width / 2;
    const targetY = layout.y + layout.height / 2;
    const lengths = points.slice(1).map((point, index) => {
        const start = points[index];
        return Math.abs(point[0] - start[0]) + Math.abs(point[1] - start[1]);
    });
    const totalLength = lengths.reduce((total, length) => total + length, 0);
    if (totalLength <= 0) {
        return 0.5;
    }

    let distanceBefore = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestDistanceAlongPath = totalLength / 2;
    points.slice(1).forEach((end, index) => {
        const start = points[index];
        const length = lengths[index];
        if (length <= 0) {
            return;
        }
        const horizontal = start[1] === end[1];
        const projected = horizontal
            ? [Math.max(Math.min(targetX, Math.max(start[0], end[0])), Math.min(start[0], end[0])), start[1]] as DrawnixPoint
            : [start[0], Math.max(Math.min(targetY, Math.max(start[1], end[1])), Math.min(start[1], end[1]))] as DrawnixPoint;
        const candidateDistance = Math.hypot(projected[0] - targetX, projected[1] - targetY);
        if (candidateDistance < bestDistance) {
            bestDistance = candidateDistance;
            bestDistanceAlongPath = distanceBefore + Math.abs(projected[0] - start[0]) + Math.abs(projected[1] - start[1]);
        }
        distanceBefore += length;
    });
    return clampArrowTextPosition(bestDistanceAlongPath / totalLength);
}

interface RootLayout {
    root: MindMapTreeNode;
    treeNodes: MindMapTreeNode[];
    hierarchyBranches: DrawnixMindMapHierarchyBranch[];
    rightNodeCount: number;
    width: number;
    height: number;
}

const ROOT_LAYOUT_GAP = 144;
const ROOT_ROW_GAP = 180;
export const DRAWNIX_MIND_MAP_FOREST_ROW_MAX_WIDTH = 6400;

interface RootLayoutRow {
    layouts: RootLayout[];
    width: number;
    height: number;
}

function packRootLayouts(rootLayouts: RootLayout[]): {
    rows: RootLayoutRow[];
    width: number;
    height: number;
} {
    const rows: RootLayoutRow[] = [];
    let currentRow: RootLayoutRow | undefined;

    rootLayouts.forEach(layout => {
        const nextWidth = currentRow && currentRow.layouts.length > 0
            ? currentRow.width + ROOT_LAYOUT_GAP + layout.width
            : layout.width;

        if (
            currentRow
            && currentRow.layouts.length > 0
            && nextWidth > DRAWNIX_MIND_MAP_FOREST_ROW_MAX_WIDTH
        ) {
            rows.push(currentRow);
            currentRow = undefined;
        }

        if (!currentRow) {
            currentRow = { layouts: [], width: 0, height: 0 };
        }

        currentRow.layouts.push(layout);
        currentRow.width = currentRow.layouts.length === 1
            ? layout.width
            : currentRow.width + ROOT_LAYOUT_GAP + layout.width;
        currentRow.height = Math.max(currentRow.height, layout.height);
    });

    if (currentRow && currentRow.layouts.length > 0) {
        rows.push(currentRow);
    }

    return {
        rows,
        width: Math.max(...rows.map(row => row.width)),
        height: rows.reduce(
            (total, row) => total + row.height,
            ROOT_ROW_GAP * Math.max(0, rows.length - 1)
        )
    };
}

function buildRootLayout(source: DiagramNode): RootLayout {
    const root = buildTreeNode(source, undefined, 0, -1, source.id.trim());
    const directChildren = root.children;
    const rightNodeCount = Math.ceil(directChildren.length / 2);
    directChildren.forEach((child, index) => {
        child.branchIndex = index;
        const propagateBranchIndex = (node: MindMapTreeNode): void => {
            node.children.forEach(grandchild => {
                grandchild.branchIndex = index;
                propagateBranchIndex(grandchild);
            });
        };
        propagateBranchIndex(child);
    });

    calculateSubtreeHeight(root);
    root.x = 0;
    root.y = -root.height / 2;
    const hierarchyBranches: DrawnixMindMapHierarchyBranch[] = [];
    const rightChildren = directChildren.slice(0, rightNodeCount);
    const leftChildren = directChildren.slice(rightNodeCount);
    const placeRootChildren = (children: MindMapTreeNode[], direction: 'left' | 'right'): void => {
        const totalHeight = children.reduce((total, child) => total + child.subtreeHeight, 0)
            + SIBLING_VERTICAL_GAP * Math.max(0, children.length - 1);
        let top = -totalHeight / 2;

        for (const child of children) {
            const childX = direction === 'right'
                ? root.x + root.width + ROOT_HORIZONTAL_GAP
                : root.x - ROOT_HORIZONTAL_GAP - child.width;
            const centerY = top + child.subtreeHeight / 2;
            placeSubtree(child, direction, childX, centerY, hierarchyBranches);
            hierarchyBranches.push({
                parentId: root.id,
                childId: child.id,
                branchIndex: child.branchIndex,
                start: direction === 'right'
                    ? [root.x + root.width, root.y + root.height / 2]
                    : [root.x, root.y + root.height / 2],
                end: direction === 'right'
                    ? [child.x, child.y + child.height / 2]
                    : [child.x + child.width, child.y + child.height / 2]
            });
            top += child.subtreeHeight + SIBLING_VERTICAL_GAP;
        }
    };

    placeRootChildren(rightChildren, 'right');
    placeRootChildren(leftChildren, 'left');

    const treeNodes = collectTreeNodes(root);
    const dimensions = shiftLayout(treeNodes, hierarchyBranches);
    return {
        root,
        treeNodes,
        hierarchyBranches,
        rightNodeCount,
        width: dimensions.width,
        height: dimensions.height
    };
}

function shiftRootLayout(layout: RootLayout, offsetX: number, offsetY: number): void {
    layout.treeNodes.forEach(node => {
        node.x += offsetX;
        node.y += offsetY;
    });
    layout.hierarchyBranches.forEach(branch => {
        branch.start = shiftPoint(branch.start, offsetX, offsetY);
        branch.end = shiftPoint(branch.end, offsetX, offsetY);
    });
}

export function buildDrawnixMindMapProjection(spec: DiagramSpec): DrawnixMindMapProjection {
    assertValidDrawnixMindMapSpec(spec);

    const rootLayouts = spec.nodes.map(buildRootLayout);
    const packedForest = packRootLayouts(rootLayouts);
    const header = buildHeaderLayout(spec.summary, packedForest.width);
    const headerOffsetY = Math.max(0, header.safeHeight - TOP_MARGIN);
    const roots: DrawnixMindMapElement[] = [];
    const treeNodes: MindMapTreeNode[] = [];
    const hierarchyBranches: DrawnixMindMapHierarchyBranch[] = [];
    const rootRegions: DrawnixRootRegion[] = [];

    let offsetY = headerOffsetY;
    packedForest.rows.forEach((row, rowIndex) => {
        let offsetX = 0;
        row.layouts.forEach((layout, columnIndex) => {
            shiftRootLayout(layout, offsetX, offsetY);
            roots.push(toDrawnixMindElement(layout.root, true, layout.rightNodeCount));
            treeNodes.push(...layout.treeNodes);
            hierarchyBranches.push(...layout.hierarchyBranches);
            const minX = Math.min(...layout.treeNodes.map(node => node.x));
            const minY = Math.min(...layout.treeNodes.map(node => node.y));
            const maxX = Math.max(...layout.treeNodes.map(node => node.x + node.width));
            const maxY = Math.max(...layout.treeNodes.map(node => node.y + node.height));
            rootRegions.push({
                rootId: layout.root.id,
                rowIndex,
                columnIndex,
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            });
            offsetX += layout.width + ROOT_LAYOUT_GAP;
        });
        offsetY += row.height + ROOT_ROW_GAP;
    });

    const placedNodes = treeNodes.map(toPlacedNode);
    const protectedObstacles: DrawnixCrossRootRouteObstacle[] = [{
        x: 0,
        y: 0,
        width: packedForest.width,
        height: header.safeHeight
    }];
    const crossRelations = createCrossRelations(
        spec.edges ?? [],
        placedNodes,
        rootRegions,
        packedForest.width,
        packedForest.height,
        protectedObstacles
    );
    layoutCrossRelationLabels(
        crossRelations,
        placedNodes,
        packedForest.width,
        packedForest.height,
        protectedObstacles
    );
    layoutNativeRelationLabelPositions(
        crossRelations,
        placedNodes,
        packedForest.width,
        packedForest.height,
        protectedObstacles
    );

    return {
        title: normalizedText(spec.title, 'Generated knowledge map'),
        summary: spec.summary?.trim() || undefined,
        header,
        roots,
        root: roots[0],
        nodes: placedNodes,
        hierarchyBranches,
        crossRelations,
        rootRegions,
        width: packedForest.width,
        height: packedForest.height + headerOffsetY
    };
}

export function createDrawnixMindMapArrowElements(
    relations: DrawnixMindMapCrossRelation[]
): DrawnixMindMapArrowElement[] {
    return relations.map(relation => {
        const label = relation.labelLayout?.lines.join('\n') ?? relation.label ?? '';
        const paragraph: DrawnixMindMapTopic = {
            type: 'paragraph',
            children: [{ text: label }]
        };
        return {
            id: relation.id,
            type: 'arrow-line',
            shape: 'straight',
            points: relation.points,
            source: { id: relation.sourceId, marker: 'none' },
            target: { id: relation.targetId, marker: 'arrow' },
            texts: [{ text: paragraph, position: relation.nativeTextPosition ?? arrowTextPosition(relation) }],
            strokeColor: '#64748b',
            strokeWidth: 1.6,
            strokeStyle: 'dashed',
            opacity: 1,
            text: { children: [{ text: label }] },
            style: { stroke: '#64748b', dashed: true },
            data: { source: 'DrawnixMindMapProjection' }
        };
    });
}
