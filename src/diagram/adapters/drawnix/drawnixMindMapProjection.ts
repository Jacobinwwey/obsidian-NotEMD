import { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';
import { routeDrawnixRelationThroughReservedLane } from './drawnixRelationRouter';
import type {
    DrawnixCrossRootRouteObstacle,
    DrawnixCrossRootRouteStrategy,
    DrawnixRelationLabelSize
} from './drawnixRelationRouter';
import {
    assignDrawnixRelationLaneGeometry,
    reserveDrawnixRelationLaneSpace
} from './drawnixRelationLaneLayout';
import type { DrawnixRelationLane } from './drawnixRelationLaneLayout';
import {
    drawnixRectanglesOverlap,
    inflateDrawnixRect,
    pointOnDrawnixPolyline
} from './drawnixGeometry';
import type { DrawnixPoint, DrawnixRect } from './drawnixGeometry';
import { measureDrawnixText, wrapDrawnixText } from './drawnixTextLayout';

// Keep the historical projection export stable while geometry owns the primitive.
export type { DrawnixPoint } from './drawnixGeometry';

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

function buildHeaderLayout(summary: string | undefined, canvasWidth: number): DrawnixMindMapHeaderLayout {
    const normalizedSummary = summary?.trim();
    const summaryLines = normalizedSummary
        ? wrapDrawnixText(
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
    const textLines = wrapDrawnixText(label, MAX_TEXT_LINE_WIDTH);
    const largestLineWidth = Math.max(...textLines.map(measureDrawnixText));
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
    const visit = (node: DiagramNode, parentId?: string): void => {
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

        (node.children ?? []).forEach(child => visit(child, id));
        activeReferences.delete(node);
    };
    spec.nodes.forEach(root => visit(root));

    const edges = spec.edges ?? [];
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

function crossRelationId(index: number, sourceId: string, targetId: string): string {
    return `cross-${index + 1}-${sourceId}-to-${targetId}`;
}

function createCrossRelations(
    edges: DiagramEdge[],
    placedNodes: DrawnixMindMapPlacedNode[],
    relationLanes: readonly DrawnixRelationLane[],
    canvasWidth: number,
    canvasHeight: number,
    protectedObstacles: readonly DrawnixCrossRootRouteObstacle[]
): DrawnixMindMapCrossRelation[] {
    const nodeById = new Map(placedNodes.map(node => [node.id, node]));
    const laneByRelationId = new Map(relationLanes.map(lane => [lane.relationId, lane]));
    return edges.map((edge, index) => {
        const sourceId = edge.from.trim();
        const targetId = edge.to.trim();
        const source = nodeById.get(sourceId);
        const target = nodeById.get(targetId);
        if (!source || !target) {
            throw new Error(`Drawnix mind-map relationship ${index + 1} references an unknown node.`);
        }

        const id = crossRelationId(index, sourceId, targetId);
        const lane = laneByRelationId.get(id);
        if (!lane) {
            throw new Error(`Drawnix mind-map relationship ${index + 1} has no reserved relation lane.`);
        }
        const label = normalizedText(edge.label, normalizedText(edge.relation, '')) || undefined;
        const labelMetrics = label ? relationLabelMetrics(label) : undefined;
        const labelLayout = labelMetrics && lane.labelBounds
            ? {
                ...lane.labelBounds,
                lines: labelMetrics.lines,
                lineHeight: RELATION_LABEL_LINE_HEIGHT
            }
            : undefined;
        if (labelMetrics && !labelLayout) {
            throw new Error(`Drawnix relation label "${id}" has no reserved label geometry.`);
        }
        const route = routeDrawnixRelationThroughReservedLane({
            source,
            target,
            nodes: placedNodes,
            lane,
            canvasWidth,
            canvasHeight,
            additionalObstacles: [
                ...protectedObstacles,
                ...relationLanes
                    .filter(otherLane => otherLane.relationId !== id)
                    .flatMap(otherLane => otherLane.labelBounds ? [otherLane.labelBounds] : [])
            ]
        });

        return {
            id,
            sourceId,
            targetId,
            sourceRootId: source.rootId,
            targetRootId: target.rootId,
            label,
            labelLayout,
            points: route.points,
            routeStrategy: route.strategy,
            routeWarning: route.warning,
            nativeTextPosition: route.nativeTextPosition
        };
    });
}

interface RelationLabelMetrics extends DrawnixRelationLabelSize {
    lines: string[];
}

function relationLabelMetrics(label: string): RelationLabelMetrics {
    const lines = wrapDrawnixText(label, RELATION_LABEL_MAX_TEXT_WIDTH);
    const largestLineWidth = Math.max(...lines.map(measureDrawnixText));
    const width = Math.max(
        96,
        Math.min(
            RELATION_LABEL_MAX_TEXT_WIDTH + RELATION_LABEL_HORIZONTAL_PADDING * 2,
            largestLineWidth + RELATION_LABEL_HORIZONTAL_PADDING * 2
        )
    );
    const height = lines.length * RELATION_LABEL_LINE_HEIGHT + RELATION_LABEL_VERTICAL_PADDING * 2;
    return { lines, width, height };
}

function inflateLabelObstacle(
    node: DrawnixMindMapPlacedNode,
    clearance: number
): DrawnixRect {
    return inflateDrawnixRect(node, clearance);
}

function isLabelRectAvailable(
    rect: DrawnixRect,
    nodes: readonly DrawnixMindMapPlacedNode[],
    occupiedLabels: readonly DrawnixRect[],
    protectedObstacles: readonly DrawnixRect[],
    canvasWidth: number,
    canvasHeight: number
): boolean {
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > canvasWidth || rect.y + rect.height > canvasHeight) {
        return false;
    }

    if (nodes.some(node => drawnixRectanglesOverlap(rect, inflateLabelObstacle(node, RELATION_LABEL_NODE_CLEARANCE)))) {
        return false;
    }

    if (protectedObstacles.some(obstacle => drawnixRectanglesOverlap(rect, obstacle))) {
        return false;
    }

    return occupiedLabels.every(label => !drawnixRectanglesOverlap(rect, {
        x: label.x - RELATION_LABEL_GAP,
        y: label.y - RELATION_LABEL_GAP,
        width: label.width + RELATION_LABEL_GAP * 2,
        height: label.height + RELATION_LABEL_GAP * 2
    }));
}

function nativeRelationLabelRect(
    relation: DrawnixMindMapCrossRelation,
    position: number
): DrawnixRect | null {
    const layout = relation.labelLayout;
    if (!layout) {
        return null;
    }
    const center = pointOnDrawnixPolyline(relation.points, position);
    return {
        x: center[0] - layout.width / 2,
        y: center[1] - layout.height / 2,
        width: layout.width,
        height: layout.height
    };
}

function assertNativeRelationLabelLayouts(
    relations: DrawnixMindMapCrossRelation[],
    nodes: readonly DrawnixMindMapPlacedNode[],
    canvasWidth: number,
    canvasHeight: number,
    protectedObstacles: readonly DrawnixRect[]
): void {
    const occupiedLabels: DrawnixRect[] = [];
    relations.forEach(relation => {
        if (!relation.label || !relation.labelLayout) {
            return;
        }

        const selectedPosition = relation.nativeTextPosition;
        const selectedRect = selectedPosition === undefined
            ? null
            : nativeRelationLabelRect(relation, selectedPosition);
        if (!selectedRect || !isLabelRectAvailable(
            selectedRect,
            nodes,
            occupiedLabels,
            protectedObstacles,
            canvasWidth,
            canvasHeight
        )) {
            throw new Error(
                `Drawnix relation label "${relation.id}" could not find a collision-free native position `
                + 'matching the SVG geometry.'
            );
        }
        const expected = relation.labelLayout;
        const geometryMatches = Math.abs(expected.x - selectedRect.x) < 0.001
            && Math.abs(expected.y - selectedRect.y) < 0.001
            && Math.abs(expected.width - selectedRect.width) < 0.001
            && Math.abs(expected.height - selectedRect.height) < 0.001;
        if (!geometryMatches) {
            throw new Error(
                `Drawnix relation label "${relation.id}" diverged from its reserved native lane geometry.`
            );
        }
        relation.labelLayout = { ...relation.labelLayout, ...selectedRect };
        occupiedLabels.push(selectedRect);
    });
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
    const relationLaneRequests = (spec.edges ?? []).map((edge, index) => {
        const sourceId = edge.from.trim();
        const targetId = edge.to.trim();
        const label = normalizedText(edge.label, normalizedText(edge.relation, '')) || undefined;
        const metrics = label ? relationLabelMetrics(label) : undefined;
        return {
            relationId: crossRelationId(index, sourceId, targetId),
            sourceId,
            targetId,
            labelSize: metrics ? { width: metrics.width, height: metrics.height } : undefined
        };
    });
    const relationLaneSpace = reserveDrawnixRelationLaneSpace({
        forestWidth: packedForest.width,
        relations: relationLaneRequests
    });
    const header = buildHeaderLayout(spec.summary, relationLaneSpace.width);
    const headerOffsetY = Math.max(0, header.safeHeight - TOP_MARGIN);
    const roots: DrawnixMindMapElement[] = [];
    const treeNodes: MindMapTreeNode[] = [];
    const hierarchyBranches: DrawnixMindMapHierarchyBranch[] = [];
    const rootRegions: DrawnixRootRegion[] = [];

    let offsetY = headerOffsetY;
    packedForest.rows.forEach((row, rowIndex) => {
        let offsetX = relationLaneSpace.forestOffsetX;
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
    const resolvedRelationLaneLayout = assignDrawnixRelationLaneGeometry({
        canvasWidth: relationLaneSpace.width,
        reservations: relationLaneSpace.reservations,
        relations: relationLaneRequests,
        nodes: placedNodes
    });
    const protectedObstacles: DrawnixCrossRootRouteObstacle[] = [{
        x: 0,
        y: 0,
        width: relationLaneSpace.width,
        height: header.safeHeight
    }];
    const crossRelations = createCrossRelations(
        spec.edges ?? [],
        placedNodes,
        resolvedRelationLaneLayout.lanes,
        relationLaneSpace.width,
        resolvedRelationLaneLayout.height,
        protectedObstacles
    );
    assertNativeRelationLabelLayouts(
        crossRelations,
        placedNodes,
        relationLaneSpace.width,
        resolvedRelationLaneLayout.height,
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
        width: relationLaneSpace.width,
        height: resolvedRelationLaneLayout.height
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
            texts: [{ text: paragraph, position: relation.nativeTextPosition ?? 0.5 }],
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
