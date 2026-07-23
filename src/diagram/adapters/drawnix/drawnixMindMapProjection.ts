import { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';

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
    points: DrawnixPoint[];
    source: { id: string };
    target: { id: string };
    text: { children: Array<{ text: string }> };
    style: {
        stroke: string;
        dashed: true;
    };
    data: {
        source: 'DrawnixMindMapProjection';
    };
}

export interface DrawnixMindMapPlacedNode {
    id: string;
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
    label?: string;
    points: DrawnixPoint[];
}

export interface DrawnixMindMapProjection {
    title: string;
    summary?: string;
    root: DrawnixMindMapElement;
    nodes: DrawnixMindMapPlacedNode[];
    hierarchyBranches: DrawnixMindMapHierarchyBranch[];
    crossRelations: DrawnixMindMapCrossRelation[];
    width: number;
    height: number;
}

interface MindMapTreeNode {
    id: string;
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
const TEXT_LINE_CHARACTER_LIMIT = 24;
const ROOT_TEXT_LINE_CHARACTER_LIMIT = 18;

function normalizedText(value: string | undefined, fallback: string): string {
    return value?.trim() || fallback;
}

function estimateCharacterWidth(character: string): number {
    return /[\u1100-\u11ff\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(character) ? 14 : 7.4;
}

function visualLength(value: string): number {
    return Array.from(value).reduce((total, character) => total + estimateCharacterWidth(character), 0);
}

function splitLabel(label: string, maxCharacters: number): string[] {
    const trimmed = label.trim();
    if (!trimmed) {
        return ['Untitled'];
    }

    const words = trimmed.split(/\s+/);
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (Array.from(candidate).length <= maxCharacters) {
            line = candidate;
            continue;
        }

        if (line) {
            lines.push(line);
            line = '';
        }

        const characters = Array.from(word);
        while (characters.length > maxCharacters) {
            lines.push(characters.splice(0, maxCharacters).join(''));
        }
        line = characters.join('');
    }

    if (line) {
        lines.push(line);
    }

    return lines.slice(0, 3);
}

function buildTreeNode(
    source: DiagramNode,
    parent: MindMapTreeNode | undefined,
    depth: number,
    branchIndex: number
): MindMapTreeNode {
    const label = normalizedText(source.label, source.id || 'Untitled');
    const isRoot = depth === 0;
    const textLines = splitLabel(
        label,
        isRoot ? ROOT_TEXT_LINE_CHARACTER_LIMIT : TEXT_LINE_CHARACTER_LIMIT
    );
    const largestLineWidth = Math.max(...textLines.map(visualLength));
    const minWidth = isRoot ? ROOT_MIN_WIDTH : NODE_MIN_WIDTH;
    const minHeight = isRoot ? ROOT_MIN_HEIGHT : NODE_MIN_HEIGHT;
    const lineHeight = isRoot ? ROOT_LINE_HEIGHT : LINE_HEIGHT;

    const node: MindMapTreeNode = {
        id: source.id.trim(),
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

    node.children = (source.children ?? []).map(child => buildTreeNode(child, node, depth + 1, branchIndex));
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
    if (spec.nodes.length !== 1) {
        errors.push('Drawnix mind-map export requires exactly one root node.');
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
    visit(spec.nodes[0], 0);

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

function createCrossRelationPoints(
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode,
    index: number,
    canvasWidth: number
): DrawnixPoint[] {
    const sourceIsLeft = source.x + source.width / 2 < target.x + target.width / 2;
    const start: DrawnixPoint = sourceIsLeft
        ? [source.x + source.width, source.y + source.height / 2]
        : [source.x, source.y + source.height / 2];
    const end: DrawnixPoint = sourceIsLeft
        ? [target.x, target.y + target.height / 2]
        : [target.x + target.width, target.y + target.height / 2];
    const laneX = sourceIsLeft
        ? Math.min(canvasWidth - HORIZONTAL_MARGIN / 2, Math.max(start[0], end[0]) + 42 + index * 18)
        : Math.max(HORIZONTAL_MARGIN / 2, Math.min(start[0], end[0]) - 42 - index * 18);

    return [start, [laneX, start[1]], [laneX, end[1]], end];
}

function toPlacedNode(node: MindMapTreeNode): DrawnixMindMapPlacedNode {
    return {
        id: node.id,
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
                children: [{ text: node.label }]
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
    canvasWidth: number
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

        return {
            id: `cross-${index + 1}-${sourceId}-to-${targetId}`,
            sourceId,
            targetId,
            label: normalizedText(edge.label, normalizedText(edge.relation, '')) || undefined,
            points: createCrossRelationPoints(source, target, index, canvasWidth)
        };
    });
}

export function buildDrawnixMindMapProjection(spec: DiagramSpec): DrawnixMindMapProjection {
    assertValidDrawnixMindMapSpec(spec);

    const root = buildTreeNode(spec.nodes[0], undefined, 0, -1);
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
    const placedNodes = treeNodes.map(toPlacedNode);
    const crossRelations = createCrossRelations(spec.edges ?? [], placedNodes, dimensions.width);

    return {
        title: normalizedText(spec.title, 'Generated knowledge map'),
        summary: spec.summary?.trim() || undefined,
        root: toDrawnixMindElement(root, true, rightNodeCount),
        nodes: placedNodes,
        hierarchyBranches,
        crossRelations,
        width: dimensions.width,
        height: dimensions.height
    };
}

export function createDrawnixMindMapArrowElements(
    relations: DrawnixMindMapCrossRelation[]
): DrawnixMindMapArrowElement[] {
    return relations.map(relation => ({
        id: relation.id,
        type: 'arrow-line',
        points: relation.points,
        source: { id: relation.sourceId },
        target: { id: relation.targetId },
        text: { children: [{ text: relation.label ?? '' }] },
        style: { stroke: '#64748b', dashed: true },
        data: { source: 'DrawnixMindMapProjection' }
    }));
}
