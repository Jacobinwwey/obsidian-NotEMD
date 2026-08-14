import type { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';
import { assertValidDrawnixMindMapSpec } from './drawnixMindMapProjection';
import type {
    DrawnixKnowledgeMapFidelityDecision,
    DrawnixKnowledgeMapFidelityLedger,
    DrawnixKnowledgeMapPresentation,
    DrawnixKnowledgeMapPresentationBranch,
    DrawnixKnowledgeMapPresentationContract,
    DrawnixKnowledgeMapPresentationNode,
    DrawnixKnowledgeMapPresentationRelation,
    DrawnixKnowledgeMapPresentationSlice,
    DrawnixKnowledgeMapVisualRole
} from './drawnixKnowledgeMapPresentationTypes';

const HEADER_HEIGHT = 92;
const PAGE_MARGIN = 56;
const TREE_HORIZONTAL_GAP = 72;
const TREE_VERTICAL_GAP = 24;
const OVERVIEW_HORIZONTAL_GAP = 32;
const OVERVIEW_VERTICAL_GAP = 28;
const NODE_HORIZONTAL_PADDING = 28;
const NODE_VERTICAL_PADDING = 20;
const NODE_MIN_WIDTH = 156;
const NODE_MAX_WIDTH = 316;
const NODE_MIN_HEIGHT = 56;
const NODE_LINE_HEIGHT = 20;
const MAX_NODE_TEXT_WIDTH = NODE_MAX_WIDTH - NODE_HORIZONTAL_PADDING;

export const DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT: DrawnixKnowledgeMapPresentationContract = {
    viewportWidth: 1600,
    viewportHeight: 900,
    minimumNodeFontSize: 14,
    audience: 'presentation'
};

interface PresentationTreeNode {
    source: DiagramNode;
    id: string;
    rootId: string;
    label: string;
    role: DrawnixKnowledgeMapVisualRole;
    depth: number;
    children: PresentationTreeNode[];
    textLines: string[];
    width: number;
    height: number;
    summary: boolean;
    subtreeHeight: number;
    x: number;
    y: number;
}

interface LayoutResult {
    nodes: DrawnixKnowledgeMapPresentationNode[];
    branches: DrawnixKnowledgeMapPresentationBranch[];
    width: number;
    height: number;
}

interface OverviewGridLayout {
    nodes: DrawnixKnowledgeMapPresentationNode[];
    routePortXByNodeId: ReadonlyMap<string, number>;
    contentBottom: number;
    width: number;
    height: number;
}

const VISUAL_ROLES = new Set<DrawnixKnowledgeMapVisualRole>([
    'root',
    'domain',
    'subsystem',
    'component',
    'evidence',
    'external',
    'cross-relation'
]);

function normalizeLabel(value: string | undefined, fallback: string): string {
    return value?.trim() || fallback;
}

function estimateCharacterWidth(character: string): number {
    if (/\s/.test(character)) return 4;
    if ((character.codePointAt(0) ?? 0) > 0x7f) return 15;
    if (/[MW@%]/.test(character)) return 14;
    if (/[mw#&]/.test(character)) return 12;
    if (/[A-Z0-9]/.test(character)) return 11;
    return 8;
}

function visualLength(value: string): number {
    return Array.from(value).reduce((total, character) => total + estimateCharacterWidth(character), 0);
}

function wrapLabel(value: string, maxWidth: number): string[] {
    const label = value.trim() || 'Untitled';
    const words = label.split(/\s+/u);
    const lines: string[] = [];
    let line = '';

    const flush = (): void => {
        if (line) {
            lines.push(line);
            line = '';
        }
    };
    const appendWord = (word: string): void => {
        if (visualLength(word) <= maxWidth) {
            line = word;
            return;
        }
        let part = '';
        for (const character of Array.from(word)) {
            const candidate = part + character;
            if (part && visualLength(candidate) > maxWidth) {
                lines.push(part);
                part = character;
            } else {
                part = candidate;
            }
        }
        line = part;
    };

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (visualLength(candidate) <= maxWidth) {
            line = candidate;
            continue;
        }
        flush();
        appendWord(word);
    }
    flush();
    return lines;
}

function resolveVisualRole(node: DiagramNode, depth: number): DrawnixKnowledgeMapVisualRole {
    if (node.kind && VISUAL_ROLES.has(node.kind as DrawnixKnowledgeMapVisualRole)) {
        return node.kind as DrawnixKnowledgeMapVisualRole;
    }
    if (depth === 0) return 'root';
    if (depth === 1) return 'domain';
    if (depth === 2) return 'subsystem';
    if (depth === 3) return 'component';
    return 'evidence';
}

function createPresentationTree(
    source: DiagramNode,
    rootId: string,
    depth = 0,
    summaryNodeIds: ReadonlySet<string> = new Set()
): PresentationTreeNode {
    const label = normalizeLabel(source.label, source.id || 'Untitled');
    const textLines = wrapLabel(label, MAX_NODE_TEXT_WIDTH);
    const largestLine = Math.max(...textLines.map(visualLength));
    const node: PresentationTreeNode = {
        source,
        id: source.id,
        rootId,
        label,
        role: resolveVisualRole(source, depth),
        depth,
        children: [],
        textLines,
        width: Math.max(NODE_MIN_WIDTH, Math.min(NODE_MAX_WIDTH, Math.ceil(largestLine + NODE_HORIZONTAL_PADDING))),
        height: Math.max(NODE_MIN_HEIGHT, textLines.length * NODE_LINE_HEIGHT + NODE_VERTICAL_PADDING),
        summary: summaryNodeIds.has(source.id),
        subtreeHeight: 0,
        x: 0,
        y: 0
    };
    node.children = (source.children ?? []).map(child => createPresentationTree(
        child,
        rootId,
        depth + 1,
        summaryNodeIds
    ));
    return node;
}

function calculateSubtreeHeight(node: PresentationTreeNode): number {
    if (node.children.length === 0) {
        node.subtreeHeight = node.height;
        return node.subtreeHeight;
    }
    const childrenHeight = node.children.reduce((total, child) => total + calculateSubtreeHeight(child), 0)
        + TREE_VERTICAL_GAP * Math.max(0, node.children.length - 1);
    node.subtreeHeight = Math.max(node.height, childrenHeight);
    return node.subtreeHeight;
}

function placeTree(
    node: PresentationTreeNode,
    x: number,
    centerY: number,
    branches: DrawnixKnowledgeMapPresentationBranch[]
): void {
    node.x = x;
    node.y = centerY - node.height / 2;
    if (node.children.length === 0) {
        return;
    }

    const childrenHeight = node.children.reduce((total, child) => total + child.subtreeHeight, 0)
        + TREE_VERTICAL_GAP * Math.max(0, node.children.length - 1);
    let childTop = centerY - childrenHeight / 2;
    for (const child of node.children) {
        const childCenterY = childTop + child.subtreeHeight / 2;
        placeTree(child, node.x + node.width + TREE_HORIZONTAL_GAP, childCenterY, branches);
        branches.push({
            parentNodeId: node.id,
            childNodeId: child.id,
            start: [node.x + node.width, node.y + node.height / 2],
            end: [child.x, child.y + child.height / 2]
        });
        childTop += child.subtreeHeight + TREE_VERTICAL_GAP;
    }
}

function collectPresentationNodes(tree: PresentationTreeNode): DrawnixKnowledgeMapPresentationNode[] {
    return [
        {
            id: tree.id,
            semanticNodeId: tree.source.id,
            rootId: tree.rootId,
            label: tree.label,
            role: tree.role,
            depth: tree.depth,
            x: tree.x,
            y: tree.y,
            width: tree.width,
            height: tree.height,
            textLines: tree.textLines,
            context: false,
            summary: tree.summary
        },
        ...tree.children.flatMap(collectPresentationNodes)
    ];
}

function layoutDetailTree(
    root: DiagramNode,
    semanticRootId = root.id,
    summaryNodeIds: ReadonlySet<string> = new Set()
): LayoutResult {
    const tree = createPresentationTree(root, semanticRootId, 0, summaryNodeIds);
    calculateSubtreeHeight(tree);
    const branches: DrawnixKnowledgeMapPresentationBranch[] = [];
    placeTree(tree, PAGE_MARGIN, HEADER_HEIGHT + tree.subtreeHeight / 2, branches);
    const nodes = collectPresentationNodes(tree);
    const right = Math.max(...nodes.map(node => node.x + node.width));
    const bottom = Math.max(...nodes.map(node => node.y + node.height));
    return {
        nodes,
        branches,
        width: Math.ceil(right + PAGE_MARGIN),
        height: Math.ceil(bottom + PAGE_MARGIN)
    };
}

function cloneRootWithChildren(root: DiagramNode, children: readonly DiagramNode[]): DiagramNode {
    return {
        ...root,
        children: children.map(child => ({ ...child, children: child.children?.map(grandchild => ({ ...grandchild })) }))
    };
}

function fitsDetailViewport(root: DiagramNode, contract: DrawnixKnowledgeMapPresentationContract): boolean {
    const layout = layoutDetailTree(root);
    return layout.width <= contract.viewportWidth && layout.height <= contract.viewportHeight;
}

function buildDetailSlice(
    root: DiagramNode,
    children: readonly DiagramNode[],
    sliceId: string,
    title: string,
    semanticRootId = root.id,
    summaryNodeIds: ReadonlySet<string> = new Set()
): DrawnixKnowledgeMapPresentationSlice {
    const layout = layoutDetailTree(
        cloneRootWithChildren(root, children),
        semanticRootId,
        summaryNodeIds
    );
    return {
        id: sliceId,
        kind: 'detail',
        title,
        rootId: semanticRootId,
        nodes: layout.nodes,
        branches: layout.branches,
        relations: [],
        width: layout.width,
        height: layout.height
    };
}

interface DetailChildPlan {
    visibleChild: DiagramNode;
    continuationRoot?: DiagramNode;
    summaryNodeId?: string;
}

function createCollapsedDetailNode(node: DiagramNode): DiagramNode {
    return { ...node, children: undefined };
}

function planDetailChild(
    root: DiagramNode,
    child: DiagramNode,
    contract: DrawnixKnowledgeMapPresentationContract
): DetailChildPlan {
    if (child.children?.length === 0 || fitsDetailViewport(cloneRootWithChildren(root, [child]), contract)) {
        return { visibleChild: child };
    }

    return {
        visibleChild: createCollapsedDetailNode(child),
        continuationRoot: child,
        summaryNodeId: child.id
    };
}

function detailSliceBaseId(root: DiagramNode, semanticRootId: string): string {
    return root.id === semanticRootId
        ? `detail-${root.id}`
        : `detail-${semanticRootId}-${root.id}`;
}

function buildDetailSlicesForRoot(
    root: DiagramNode,
    contract: DrawnixKnowledgeMapPresentationContract,
    decisions: DrawnixKnowledgeMapFidelityDecision[],
    semanticRootId = root.id,
    detailPath: readonly string[] = [root.label]
): DrawnixKnowledgeMapPresentationSlice[] {
    const children = root.children ?? [];
    const title = `Details: ${detailPath.join(' / ')}`;
    const baseId = detailSliceBaseId(root, semanticRootId);
    const complete = buildDetailSlice(root, children, baseId, title, semanticRootId);
    if (complete.width <= contract.viewportWidth && complete.height <= contract.viewportHeight || children.length === 0) {
        return [complete];
    }

    const childPlans = children.map(child => planDetailChild(root, child, contract));
    const partitions: DetailChildPlan[][] = [];
    let current: DetailChildPlan[] = [];
    childPlans.forEach(childPlan => {
        const candidate = [...current, childPlan];
        if (current.length > 0 && !fitsDetailViewport(
            cloneRootWithChildren(root, candidate.map(plan => plan.visibleChild)),
            contract
        )) {
            partitions.push(current);
            current = [childPlan];
            return;
        }
        current = candidate;
    });
    if (current.length > 0) {
        partitions.push(current);
    }

    const localSlices = partitions.map((partition, index) => {
        const summaryNodeIds = new Set(partition.flatMap(plan => plan.summaryNodeId ? [plan.summaryNodeId] : []));
        const slice = buildDetailSlice(
            root,
            partition.map(plan => plan.visibleChild),
            partitions.length === 1 ? baseId : `${baseId}-${index + 1}`,
            partitions.length === 1 ? title : `${title} (${index + 1}/${partitions.length})`,
            semanticRootId,
            summaryNodeIds
        );
        decisions.push({
            kind: 'detail-partition',
            sliceId: slice.id,
            message: summaryNodeIds.size > 0
                ? `Detail slice "${slice.id}" keeps continuation anchors for geometry-bounded child hierarchies; their descendants continue in later detail slices.`
                : `Partitioned root "${root.id}" by measured presentation geometry; no semantic node or relation was discarded.`
        });
        return slice;
    });

    const continuationSlices = childPlans.flatMap(plan => plan.continuationRoot
        ? buildDetailSlicesForRoot(
            plan.continuationRoot,
            contract,
            decisions,
            semanticRootId,
            [...detailPath, plan.continuationRoot.label]
        )
        : []);

    return [...localSlices, ...continuationSlices];
}

function collectNodeRoots(nodes: readonly DiagramNode[], rootId?: string, map = new Map<string, string>()): Map<string, string> {
    nodes.forEach(node => {
        const resolvedRootId = rootId ?? node.id;
        map.set(node.id, resolvedRootId);
        collectNodeRoots(node.children ?? [], resolvedRootId, map);
    });
    return map;
}

function collectNodesById(nodes: readonly DiagramNode[], map = new Map<string, DiagramNode>()): Map<string, DiagramNode> {
    nodes.forEach(node => {
        map.set(node.id, node);
        collectNodesById(node.children ?? [], map);
    });
    return map;
}

function relationId(edge: DiagramEdge, index: number): string {
    return `relation-${index + 1}-${edge.from}-to-${edge.to}`;
}

function measureOverviewNode(root: DiagramNode): DrawnixKnowledgeMapPresentationNode {
    const textLines = wrapLabel(normalizeLabel(root.label, root.id), MAX_NODE_TEXT_WIDTH);
    const largestLine = Math.max(...textLines.map(visualLength));
    const width = Math.max(NODE_MIN_WIDTH, Math.min(NODE_MAX_WIDTH, Math.ceil(largestLine + NODE_HORIZONTAL_PADDING)));
    const height = Math.max(NODE_MIN_HEIGHT, textLines.length * NODE_LINE_HEIGHT + NODE_VERTICAL_PADDING);
    return {
        id: `overview-${root.id}`,
        semanticNodeId: root.id,
        rootId: root.id,
        label: normalizeLabel(root.label, root.id),
        role: 'root',
        depth: 0,
        x: 0,
        y: 0,
        width,
        height,
        textLines,
        context: false,
        summary: true
    };
}

function rootPairKey(left: string, right: string): string {
    return left < right ? `${left}\u0000${right}` : `${right}\u0000${left}`;
}

function buildCrossRootRelationshipWeights(
    edges: readonly DiagramEdge[],
    rootByNodeId: ReadonlyMap<string, string>
): ReadonlyMap<string, number> {
    const weights = new Map<string, number>();
    for (const edge of edges) {
        const sourceRootId = rootByNodeId.get(edge.from);
        const targetRootId = rootByNodeId.get(edge.to);
        if (!sourceRootId || !targetRootId || sourceRootId === targetRootId) {
            continue;
        }
        const key = rootPairKey(sourceRootId, targetRootId);
        weights.set(key, (weights.get(key) ?? 0) + 1);
    }
    return weights;
}

function rootRelationshipWeight(
    sourceRootId: string,
    targetRootId: string,
    weights: ReadonlyMap<string, number>
): number {
    return weights.get(rootPairKey(sourceRootId, targetRootId)) ?? 0;
}

function orderRootsByRelationshipAffinity(
    roots: readonly DiagramNode[],
    weights: ReadonlyMap<string, number>
): DiagramNode[] {
    const rootIndexById = new Map(roots.map((root, index) => [root.id, index]));
    const weightedDegree = (rootId: string): number => roots.reduce(
        (total, candidate) => total + rootRelationshipWeight(rootId, candidate.id, weights),
        0
    );
    const remaining = new Map(roots.map(root => [root.id, root]));
    const ordered: DiagramNode[] = [];
    const choose = (candidates: readonly DiagramNode[]): DiagramNode => [...candidates].sort((left, right) => {
        const affinityDifference = ordered.reduce(
            (difference, placed) => difference
                + rootRelationshipWeight(right.id, placed.id, weights)
                - rootRelationshipWeight(left.id, placed.id, weights),
            0
        );
        if (affinityDifference !== 0) return affinityDifference;
        const degreeDifference = weightedDegree(right.id) - weightedDegree(left.id);
        if (degreeDifference !== 0) return degreeDifference;
        return (rootIndexById.get(left.id) ?? 0) - (rootIndexById.get(right.id) ?? 0);
    })[0];

    while (remaining.size > 0) {
        const next = choose([...remaining.values()]);
        ordered.push(next);
        remaining.delete(next.id);
    }
    return ordered;
}

function buildOverviewGrid(
    roots: readonly DiagramNode[],
    columnCount: number
): OverviewGridLayout {
    const measured = roots.map(measureOverviewNode);
    const rowCount = Math.ceil(measured.length / columnCount);
    const columnWidths = Array.from({ length: columnCount }, () => 0);
    const rowHeights = Array.from({ length: rowCount }, () => 0);

    measured.forEach((node, index) => {
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);
        columnWidths[column] = Math.max(columnWidths[column], node.width);
        rowHeights[row] = Math.max(rowHeights[row], node.height);
    });

    const columnX: number[] = [];
    let nextX = PAGE_MARGIN;
    columnWidths.forEach(width => {
        columnX.push(nextX);
        nextX += width + OVERVIEW_HORIZONTAL_GAP;
    });
    const rowY: number[] = [];
    let nextY = HEADER_HEIGHT;
    rowHeights.forEach(height => {
        rowY.push(nextY);
        nextY += height + OVERVIEW_VERTICAL_GAP;
    });

    const routePortXByNodeId = new Map<string, number>();
    const nodes = measured.map((node, index) => {
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);
        routePortXByNodeId.set(node.id, columnX[column] + columnWidths[column] + OVERVIEW_HORIZONTAL_GAP / 2);
        return {
            ...node,
            x: columnX[column],
            y: rowY[row]
        };
    });
    const contentBottom = nodes.length > 0
        ? Math.max(...nodes.map(node => node.y + node.height))
        : HEADER_HEIGHT;

    return {
        nodes,
        routePortXByNodeId,
        contentBottom,
        width: Math.ceil(nextX - OVERVIEW_HORIZONTAL_GAP + PAGE_MARGIN),
        height: Math.ceil(contentBottom + PAGE_MARGIN)
    };
}

function scoreOverviewGrid(
    layout: OverviewGridLayout,
    relationshipWeights: ReadonlyMap<string, number>,
    contract: DrawnixKnowledgeMapPresentationContract
): number {
    const nodesBySemanticId = new Map(layout.nodes.map(node => [node.semanticNodeId, node]));
    let weightedRelationDistance = 0;
    relationshipWeights.forEach((weight, key) => {
        const [sourceRootId, targetRootId] = key.split('\u0000');
        const source = nodesBySemanticId.get(sourceRootId);
        const target = nodesBySemanticId.get(targetRootId);
        if (!source || !target) return;
        const sourceCenterX = source.x + source.width / 2;
        const sourceCenterY = source.y + source.height / 2;
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;
        weightedRelationDistance += weight * (Math.abs(sourceCenterX - targetCenterX) + Math.abs(sourceCenterY - targetCenterY));
    });
    const targetAspectRatio = contract.viewportWidth / contract.viewportHeight;
    const layoutAspectRatio = layout.width / Math.max(1, layout.height);
    const aspectPenalty = Math.abs(Math.log(layoutAspectRatio / targetAspectRatio)) * 420;
    const overflowPenalty = Math.max(0, layout.width - contract.viewportWidth) * 0.8
        + Math.max(0, layout.height - contract.viewportHeight) * 0.8;
    return weightedRelationDistance * 0.12 + aspectPenalty + overflowPenalty;
}

function selectOverviewGrid(
    roots: readonly DiagramNode[],
    relationshipWeights: ReadonlyMap<string, number>,
    contract: DrawnixKnowledgeMapPresentationContract
): OverviewGridLayout {
    const orderedRoots = orderRootsByRelationshipAffinity(roots, relationshipWeights);
    let selected: OverviewGridLayout | undefined;
    let selectedScore = Number.POSITIVE_INFINITY;

    for (let columnCount = 1; columnCount <= orderedRoots.length; columnCount += 1) {
        const candidate = buildOverviewGrid(orderedRoots, columnCount);
        const score = scoreOverviewGrid(candidate, relationshipWeights, contract);
        if (score < selectedScore - Number.EPSILON) {
            selected = candidate;
            selectedScore = score;
        }
    }

    if (!selected) {
        throw new Error('Drawnix knowledge-map presentation requires at least one root node.');
    }
    return selected;
}

function centerOverviewGridWithinViewport(
    grid: OverviewGridLayout,
    contract: DrawnixKnowledgeMapPresentationContract
): OverviewGridLayout {
    const horizontalOffset = Math.max(0, (contract.viewportWidth - grid.width) / 2);
    if (horizontalOffset === 0) {
        return grid;
    }

    return {
        ...grid,
        nodes: grid.nodes.map(node => ({ ...node, x: node.x + horizontalOffset })),
        routePortXByNodeId: new Map(
            [...grid.routePortXByNodeId.entries()].map(([nodeId, x]) => [nodeId, x + horizontalOffset])
        )
    };
}

function buildOverviewRelations(params: {
    spec: DiagramSpec;
    rootByNodeId: ReadonlyMap<string, string>;
    grid: OverviewGridLayout;
    decisions: DrawnixKnowledgeMapFidelityDecision[];
}): { relations: DrawnixKnowledgeMapPresentationRelation[]; routeBottom: number } {
    const nodesBySemanticId = new Map(params.grid.nodes.map(node => [node.semanticNodeId, node]));
    let nextLaneY = params.grid.contentBottom + 36;
    const relations = (params.spec.edges ?? []).flatMap((edge, index) => {
        const sourceRootId = params.rootByNodeId.get(edge.from);
        const targetRootId = params.rootByNodeId.get(edge.to);
        if (!sourceRootId || !targetRootId || sourceRootId === targetRootId) {
            return [];
        }
        const source = nodesBySemanticId.get(sourceRootId);
        const target = nodesBySemanticId.get(targetRootId);
        if (!source || !target) {
            return [];
        }
        const sourcePortX = params.grid.routePortXByNodeId.get(source.id);
        const targetPortX = params.grid.routePortXByNodeId.get(target.id);
        if (sourcePortX === undefined || targetPortX === undefined) {
            throw new Error(`Missing Drawnix knowledge-map overview route port for relation "${edge.from}" -> "${edge.to}".`);
        }

        const id = relationId(edge, index);
        const label = edge.label?.trim() || edge.relation?.trim() || undefined;
        const sourceCenterX = source.x + source.width / 2;
        const targetCenterX = target.x + target.width / 2;
        const availableLabelWidth = Math.max(
            120,
            Math.min(MAX_NODE_TEXT_WIDTH, Math.abs(sourceCenterX - targetCenterX) - 32)
        );
        const labelLines = label ? wrapLabel(label, availableLabelWidth) : undefined;
        const labelHeight = (labelLines?.length ?? 0) * 16;
        const laneY = nextLaneY + Math.max(24, labelHeight + 12);
        nextLaneY = laneY + 32;
        params.decisions.push({
            kind: 'overview-summary',
            sliceId: 'overview',
            message: `Overview represents relation "${id}" through its root scopes "${sourceRootId}" and "${targetRootId}".`
        });
        const route: Array<[number, number]> = [
            [source.x + source.width, source.y + source.height / 2],
            [sourcePortX, source.y + source.height / 2],
            [sourcePortX, laneY],
            [targetPortX, laneY],
            [targetPortX, target.y + target.height / 2],
            [target.x + target.width, target.y + target.height / 2]
        ];
        return [{
            id,
            semanticRelationId: id,
            sourceSemanticNodeId: edge.from,
            targetSemanticNodeId: edge.to,
            sourceNodeId: source.id,
            targetNodeId: target.id,
            label,
            ...(labelLines ? {
                labelLines,
                labelPosition: [
                    (sourcePortX + targetPortX) / 2,
                    laneY - 10 - Math.max(0, labelLines.length - 1) * 16
                ] as [number, number]
            } : {}),
            route,
            summary: true
        }];
    });

    return { relations, routeBottom: relations.length > 0 ? nextLaneY : params.grid.contentBottom };
}

function buildOverview(
    spec: DiagramSpec,
    contract: DrawnixKnowledgeMapPresentationContract,
    rootByNodeId: ReadonlyMap<string, string>,
    decisions: DrawnixKnowledgeMapFidelityDecision[]
): DrawnixKnowledgeMapPresentationSlice {
    const relationshipWeights = buildCrossRootRelationshipWeights(spec.edges ?? [], rootByNodeId);
    const grid = centerOverviewGridWithinViewport(
        selectOverviewGrid(spec.nodes, relationshipWeights, contract),
        contract
    );
    const { relations, routeBottom } = buildOverviewRelations({ spec, rootByNodeId, grid, decisions });
    return {
        id: 'overview',
        kind: 'overview',
        title: spec.title.trim() || 'Knowledge map overview',
        summary: spec.summary?.trim() || undefined,
        nodes: grid.nodes,
        branches: [],
        relations,
        width: Math.max(contract.viewportWidth, grid.width),
        height: Math.max(contract.viewportHeight, Math.ceil(routeBottom + PAGE_MARGIN))
    };
}

function createExternalEndpointNode(params: {
    slice: DrawnixKnowledgeMapPresentationSlice;
    semanticNode: DiagramNode;
    contract: DrawnixKnowledgeMapPresentationContract;
}): DrawnixKnowledgeMapPresentationNode {
    const maximumNodeWidth = Math.max(1, params.contract.viewportWidth - PAGE_MARGIN * 2);
    const maximumTextWidth = Math.max(1, Math.min(MAX_NODE_TEXT_WIDTH, maximumNodeWidth - NODE_HORIZONTAL_PADDING));
    const textLines = wrapLabel(normalizeLabel(params.semanticNode.label, params.semanticNode.id), maximumTextWidth);
    const largestLine = Math.max(...textLines.map(visualLength));
    const width = Math.min(
        maximumNodeWidth,
        Math.max(Math.min(NODE_MIN_WIDTH, maximumNodeWidth), Math.ceil(largestLine + NODE_HORIZONTAL_PADDING))
    );
    const height = Math.max(NODE_MIN_HEIGHT, textLines.length * NODE_LINE_HEIGHT + NODE_VERTICAL_PADDING);
    return {
        id: `${params.slice.id}-external-${params.semanticNode.id}`,
        semanticNodeId: params.semanticNode.id,
        rootId: params.slice.rootId ?? params.semanticNode.id,
        label: normalizeLabel(params.semanticNode.label, params.semanticNode.id),
        role: 'external',
        depth: 0,
        x: 0,
        y: 0,
        width,
        height,
        textLines,
        context: true,
        summary: true
    };
}

function placeExternalEndpointNodes(
    slice: DrawnixKnowledgeMapPresentationSlice,
    nodes: readonly DrawnixKnowledgeMapPresentationNode[],
    contract: DrawnixKnowledgeMapPresentationContract
): void {
    if (nodes.length === 0) {
        return;
    }

    const contentRightBoundary = Math.max(PAGE_MARGIN, contract.viewportWidth - PAGE_MARGIN);
    const mainBottom = Math.max(HEADER_HEIGHT, ...slice.nodes.map(node => node.y + node.height));
    let nextX = PAGE_MARGIN;
    let nextY = mainBottom + TREE_VERTICAL_GAP * 2;
    let rowHeight = 0;

    for (const node of nodes) {
        if (nextX > PAGE_MARGIN && nextX + node.width > contentRightBoundary) {
            nextX = PAGE_MARGIN;
            nextY += rowHeight + TREE_VERTICAL_GAP;
            rowHeight = 0;
        }
        node.x = nextX;
        node.y = nextY;
        nextX += node.width + TREE_HORIZONTAL_GAP;
        rowHeight = Math.max(rowHeight, node.height);
    }

    slice.nodes.push(...nodes);
    const contentRight = Math.max(...slice.nodes.map(node => node.x + node.width));
    const contentBottom = Math.max(...slice.nodes.map(node => node.y + node.height));
    slice.width = Math.max(slice.width, Math.ceil(contentRight + PAGE_MARGIN));
    slice.height = Math.max(slice.height, Math.ceil(contentBottom + PAGE_MARGIN));
}

function attachDetailRelations(
    slice: DrawnixKnowledgeMapPresentationSlice,
    edges: readonly DiagramEdge[],
    semanticNodes: ReadonlyMap<string, DiagramNode>,
    contract: DrawnixKnowledgeMapPresentationContract,
    decisions: DrawnixKnowledgeMapFidelityDecision[]
): void {
    const visible = new Map(slice.nodes.map(node => [node.semanticNodeId, node]));
    const semanticNodeIdsInHierarchy = new Set(visible.keys());
    const relationsForSlice = edges.flatMap((edge, index) => (
        semanticNodeIdsInHierarchy.has(edge.from) || semanticNodeIdsInHierarchy.has(edge.to)
            ? [{ edge, index }]
            : []
    ));
    const externalSemanticNodeIds: string[] = [];
    const externalSemanticNodeIdSet = new Set<string>();
    const registerExternalEndpoint = (semanticNodeId: string): void => {
        if (!visible.has(semanticNodeId) && semanticNodes.has(semanticNodeId) && !externalSemanticNodeIdSet.has(semanticNodeId)) {
            externalSemanticNodeIdSet.add(semanticNodeId);
            externalSemanticNodeIds.push(semanticNodeId);
        }
    };

    for (const { edge } of relationsForSlice) {
        if (!semanticNodeIdsInHierarchy.has(edge.from)) {
            registerExternalEndpoint(edge.from);
        }
        if (!semanticNodeIdsInHierarchy.has(edge.to)) {
            registerExternalEndpoint(edge.to);
        }
    }

    const externalNodes = externalSemanticNodeIds.map(semanticNodeId => {
        const semanticNode = semanticNodes.get(semanticNodeId);
        if (!semanticNode) {
            throw new Error(`Missing Drawnix knowledge-map external endpoint "${semanticNodeId}".`);
        }
        decisions.push({
            kind: 'external-relation-endpoint',
            sliceId: slice.id,
            message: `Detail slice "${slice.id}" retains remote endpoint "${semanticNodeId}" in its context band.`
        });
        return createExternalEndpointNode({ slice, semanticNode, contract });
    });
    placeExternalEndpointNodes(slice, externalNodes, contract);
    externalNodes.forEach(node => visible.set(node.semanticNodeId, node));

    relationsForSlice.forEach(({ edge, index }) => {
        const relationIdentifier = relationId(edge, index);
        const source = visible.get(edge.from);
        const target = visible.get(edge.to);
        if (!source && !target) {
            return;
        }
        if (!source || !target) {
            throw new Error(`Drawnix knowledge-map relation "${relationIdentifier}" has an unresolved endpoint.`);
        }
        slice.relations.push({
            id: relationIdentifier,
            semanticRelationId: relationIdentifier,
            sourceSemanticNodeId: edge.from,
            targetSemanticNodeId: edge.to,
            sourceNodeId: source.id,
            targetNodeId: target.id,
            label: edge.label?.trim() || edge.relation?.trim() || undefined,
            summary: source.context || target.context
        });
    });
}

function appendUnique(values: string[], value: string): void {
    if (!values.includes(value)) {
        values.push(value);
    }
}

function buildFidelityLedger(
    spec: DiagramSpec,
    slices: readonly DrawnixKnowledgeMapPresentationSlice[],
    decisions: DrawnixKnowledgeMapFidelityDecision[]
): DrawnixKnowledgeMapFidelityLedger {
    const nodeLocations = new Map<string, string[]>();
    collectNodesById(spec.nodes).forEach((_node, id) => nodeLocations.set(id, []));
    const relationLocations = new Map<string, string[]>();
    (spec.edges ?? []).forEach((edge, index) => relationLocations.set(relationId(edge, index), []));

    slices.forEach(slice => {
        slice.nodes.forEach(node => {
            const locations = nodeLocations.get(node.semanticNodeId);
            if (locations) {
                appendUnique(locations, slice.id);
            }
        });
        slice.relations.forEach(relation => {
            const locations = relationLocations.get(relation.semanticRelationId);
            if (locations) {
                appendUnique(locations, slice.id);
            }
        });
    });

    return {
        nodeLocations: [...nodeLocations.entries()].map(([nodeId, sliceIds]) => ({ nodeId, sliceIds })),
        relationLocations: [...relationLocations.entries()].map(([relationId, sliceIds]) => ({ relationId, sliceIds })),
        decisions
    };
}

/**
 * Builds a static delivery from semantic data. It deliberately has no branch
 * count or hierarchy-depth rejection rule: a dense root is partitioned only
 * after measured geometry exceeds the requested delivery viewport.
 */
export function buildDrawnixKnowledgeMapPresentation(
    spec: DiagramSpec,
    contract: DrawnixKnowledgeMapPresentationContract
): DrawnixKnowledgeMapPresentation {
    assertValidDrawnixMindMapSpec(spec);
    const decisions: DrawnixKnowledgeMapFidelityDecision[] = [];
    const rootByNodeId = collectNodeRoots(spec.nodes);
    const overview = buildOverview(spec, contract, rootByNodeId, decisions);
    const details = spec.nodes.flatMap(root => buildDetailSlicesForRoot(root, contract, decisions));
    const semanticNodes = collectNodesById(spec.nodes);
    details.forEach(slice => attachDetailRelations(slice, spec.edges ?? [], semanticNodes, contract, decisions));
    const ledger = buildFidelityLedger(spec, [overview, ...details], decisions);

    return { contract: { ...contract }, overview, details, ledger };
}
