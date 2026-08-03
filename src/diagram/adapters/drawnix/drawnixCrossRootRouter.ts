import type {
    DrawnixMindMapPlacedNode,
    DrawnixPoint,
    DrawnixRootRegion
} from './drawnixMindMapProjection';

export type DrawnixCrossRootRouteStrategy = 'grid' | 'local-lane' | 'outer-lane';

export interface DrawnixCrossRootRoute {
    points: DrawnixPoint[];
    strategy: DrawnixCrossRootRouteStrategy;
    warning?: string;
}

export interface DrawnixCrossRootRouterInput {
    source: DrawnixMindMapPlacedNode;
    target: DrawnixMindMapPlacedNode;
    relationIndex: number;
    regions: readonly DrawnixRootRegion[];
    canvasWidth: number;
    canvasHeight: number;
}

const ROUTE_CLEARANCE = 28;
const OUTER_ROUTE_MARGIN = 64;
const BEND_PENALTY = 160;

interface RouteRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface QueueEntry {
    state: string;
    nodeIndex: number;
    direction: 0 | 1 | 2;
    cost: number;
}

function center(node: DrawnixMindMapPlacedNode): DrawnixPoint {
    return [node.x + node.width / 2, node.y + node.height / 2];
}

function relationEndpoint(
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode
): { start: DrawnixPoint; end: DrawnixPoint } {
    const sourceIsLeft = center(source)[0] < center(target)[0];
    return {
        start: sourceIsLeft
            ? [source.x + source.width, source.y + source.height / 2]
            : [source.x, source.y + source.height / 2],
        end: sourceIsLeft
            ? [target.x, target.y + target.height / 2]
            : [target.x + target.width, target.y + target.height / 2]
    };
}

function inflate(region: DrawnixRootRegion): RouteRect {
    return {
        x: region.x - ROUTE_CLEARANCE,
        y: region.y - ROUTE_CLEARANCE,
        width: region.width + ROUTE_CLEARANCE * 2,
        height: region.height + ROUTE_CLEARANCE * 2
    };
}

function pointInside(point: DrawnixPoint, rect: RouteRect): boolean {
    return point[0] > rect.x
        && point[0] < rect.x + rect.width
        && point[1] > rect.y
        && point[1] < rect.y + rect.height;
}

function segmentClear(start: DrawnixPoint, end: DrawnixPoint, obstacles: readonly RouteRect[]): boolean {
    if (start[0] !== end[0] && start[1] !== end[1]) {
        return false;
    }

    return obstacles.every(rect => {
        if (pointInside(start, rect) || pointInside(end, rect)) {
            return false;
        }

        if (start[0] === end[0]) {
            return start[0] <= rect.x
                || start[0] >= rect.x + rect.width
                || Math.max(Math.min(start[1], end[1]), rect.y)
                    >= Math.min(Math.max(start[1], end[1]), rect.y + rect.height);
        }

        return start[1] <= rect.y
            || start[1] >= rect.y + rect.height
            || Math.max(Math.min(start[0], end[0]), rect.x)
                >= Math.min(Math.max(start[0], end[0]), rect.x + rect.width);
    });
}

function deduplicate(values: number[]): number[] {
    return Array.from(new Set(values.filter(Number.isFinite).map(value => Math.round(value * 100) / 100))).sort((a, b) => a - b);
}

function simplify(points: DrawnixPoint[]): DrawnixPoint[] {
    const simplified: DrawnixPoint[] = [];
    points.forEach(point => {
        const previous = simplified[simplified.length - 1];
        if (previous && previous[0] === point[0] && previous[1] === point[1]) {
            return;
        }

        const beforePrevious = simplified[simplified.length - 2];
        const sameVerticalLine = Boolean(
            beforePrevious
            && previous
            && beforePrevious[0] === previous[0]
            && previous[0] === point[0]
        );
        const sameHorizontalLine = Boolean(
            beforePrevious
            && previous
            && beforePrevious[1] === previous[1]
            && previous[1] === point[1]
        );
        if (sameVerticalLine || sameHorizontalLine) {
            simplified[simplified.length - 1] = point;
            return;
        }
        simplified.push(point);
    });
    return simplified;
}

function buildLocalLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    relationIndex: number,
    canvasWidth: number
): DrawnixPoint[] {
    const sourceIsLeft = start[0] <= end[0];
    const laneX = sourceIsLeft
        ? Math.min(canvasWidth - ROUTE_CLEARANCE, Math.max(start[0], end[0]) + 42 + relationIndex * 18)
        : Math.max(ROUTE_CLEARANCE, Math.min(start[0], end[0]) - 42 - relationIndex * 18);
    return simplify([start, [laneX, start[1]], [laneX, end[1]], end]);
}

function buildGridRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    const outerLeft = Math.min(0, ...obstacles.map(rect => rect.x)) - OUTER_ROUTE_MARGIN;
    const outerRight = Math.max(canvasWidth, ...obstacles.map(rect => rect.x + rect.width)) + OUTER_ROUTE_MARGIN;
    const outerTop = Math.min(0, ...obstacles.map(rect => rect.y)) - OUTER_ROUTE_MARGIN;
    const outerBottom = Math.max(canvasHeight, ...obstacles.map(rect => rect.y + rect.height)) + OUTER_ROUTE_MARGIN;
    const xs = deduplicate([
        start[0],
        end[0],
        outerLeft,
        outerRight,
        ...obstacles.flatMap(rect => [rect.x - ROUTE_CLEARANCE, rect.x + rect.width + ROUTE_CLEARANCE])
    ]);
    const ys = deduplicate([
        start[1],
        end[1],
        outerTop,
        outerBottom,
        ...obstacles.flatMap(rect => [rect.y - ROUTE_CLEARANCE, rect.y + rect.height + ROUTE_CLEARANCE])
    ]);

    const points: DrawnixPoint[] = [];
    const nodeByCoordinate = new Map<string, number>();
    xs.forEach(x => ys.forEach(y => {
        const point: DrawnixPoint = [x, y];
        if (!obstacles.some(rect => pointInside(point, rect))) {
            nodeByCoordinate.set(`${x}:${y}`, points.length);
            points.push(point);
        }
    }));

    const startIndex = nodeByCoordinate.get(`${start[0]}:${start[1]}`);
    const endIndex = nodeByCoordinate.get(`${end[0]}:${end[1]}`);
    if (startIndex === undefined || endIndex === undefined) {
        return null;
    }

    const neighborsByNode = points.map(() => [] as Array<{ nodeIndex: number; direction: 1 | 2; distance: number }>);
    const connectAdjacent = (groups: Map<number, number[]>, direction: 1 | 2): void => {
        groups.forEach(group => {
            group.sort((left, right) => (direction === 1 ? points[left][1] - points[right][1] : points[left][0] - points[right][0]) || left - right);
            for (let index = 1; index < group.length; index += 1) {
                const leftIndex = group[index - 1];
                const rightIndex = group[index];
                const leftPoint = points[leftIndex];
                const rightPoint = points[rightIndex];
                if (!segmentClear(leftPoint, rightPoint, obstacles)) {
                    continue;
                }
                const distance = direction === 1
                    ? Math.abs(rightPoint[1] - leftPoint[1])
                    : Math.abs(rightPoint[0] - leftPoint[0]);
                neighborsByNode[leftIndex].push({ nodeIndex: rightIndex, direction, distance });
                neighborsByNode[rightIndex].push({ nodeIndex: leftIndex, direction, distance });
            }
        });
    };

    const verticalGroups = new Map<number, number[]>();
    const horizontalGroups = new Map<number, number[]>();
    points.forEach((point, nodeIndex) => {
        const vertical = verticalGroups.get(point[0]) ?? [];
        vertical.push(nodeIndex);
        verticalGroups.set(point[0], vertical);
        const horizontal = horizontalGroups.get(point[1]) ?? [];
        horizontal.push(nodeIndex);
        horizontalGroups.set(point[1], horizontal);
    });
    connectAdjacent(verticalGroups, 1);
    connectAdjacent(horizontalGroups, 2);
    neighborsByNode.forEach(found => found.sort((left, right) => left.nodeIndex - right.nodeIndex || left.direction - right.direction));

    const distances = new Map<string, number>();
    const previous = new Map<string, { state: string; nodeIndex: number }>();
    const queue: QueueEntry[] = [{ state: `${startIndex}:0`, nodeIndex: startIndex, direction: 0, cost: 0 }];
    distances.set(queue[0].state, 0);

    while (queue.length > 0) {
        queue.sort((left, right) => left.cost - right.cost || left.nodeIndex - right.nodeIndex || left.direction - right.direction);
        const current = queue.shift()!;
        if (current.cost !== distances.get(current.state)) {
            continue;
        }
        if (current.nodeIndex === endIndex) {
            const path: DrawnixPoint[] = [];
            let state = current.state;
            let nodeIndex = current.nodeIndex;
            path.push(points[nodeIndex]);
            while (previous.has(state)) {
                const previousState = previous.get(state)!;
                nodeIndex = previousState.nodeIndex;
                state = previousState.state;
                path.push(points[nodeIndex]);
            }
            return simplify(path.reverse());
        }

        for (const neighbor of neighborsByNode[current.nodeIndex]) {
            const nextDirection = neighbor.direction;
            const nextState = `${neighbor.nodeIndex}:${nextDirection}`;
            const nextCost = current.cost + neighbor.distance + (current.direction !== 0 && current.direction !== nextDirection ? BEND_PENALTY : 0);
            if (nextCost < (distances.get(nextState) ?? Number.POSITIVE_INFINITY)) {
                distances.set(nextState, nextCost);
                previous.set(nextState, { state: current.state, nodeIndex: current.nodeIndex });
                queue.push({ state: nextState, nodeIndex: neighbor.nodeIndex, direction: nextDirection, cost: nextCost });
            }
        }
    }

    return null;
}

function buildOuterLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    const left = Math.min(0, ...obstacles.map(rect => rect.x)) - OUTER_ROUTE_MARGIN;
    const right = Math.max(canvasWidth, ...obstacles.map(rect => rect.x + rect.width)) + OUTER_ROUTE_MARGIN;
    const top = Math.min(0, ...obstacles.map(rect => rect.y)) - OUTER_ROUTE_MARGIN;
    const bottom = Math.max(canvasHeight, ...obstacles.map(rect => rect.y + rect.height)) + OUTER_ROUTE_MARGIN;
    const candidates: DrawnixPoint[][] = [
        [start, [left, start[1]], [left, top], [right, top], [right, end[1]], end],
        [start, [right, start[1]], [right, top], [left, top], [left, end[1]], end],
        [start, [left, start[1]], [left, bottom], [right, bottom], [right, end[1]], end],
        [start, [right, start[1]], [right, bottom], [left, bottom], [left, end[1]], end]
    ];
    return candidates
        .map(simplify)
        .find(points => points.slice(1).every((point, index) => segmentClear(points[index], point, obstacles))) ?? null;
}

export function routeDrawnixCrossRootRelation(input: DrawnixCrossRootRouterInput): DrawnixCrossRootRoute {
    const { source, target } = input;
    const { start, end } = relationEndpoint(source, target);
    const unrelatedObstacles = input.regions
        .filter(region => region.rootId !== source.rootId && region.rootId !== target.rootId)
        .map(inflate);

    if (source.rootId === target.rootId) {
        return {
            points: buildLocalLaneRoute(start, end, input.relationIndex, input.canvasWidth),
            strategy: 'local-lane'
        };
    }

    const gridRoute = buildGridRoute(start, end, unrelatedObstacles, input.canvasWidth, input.canvasHeight);
    if (gridRoute) {
        return { points: gridRoute, strategy: 'grid' };
    }

    const outerRoute = buildOuterLaneRoute(start, end, unrelatedObstacles, input.canvasWidth, input.canvasHeight);
    if (outerRoute) {
        return {
            points: outerRoute,
            strategy: 'outer-lane',
            warning: 'Cross-root relation used the outer perimeter lane because no interior corridor was available.'
        };
    }

    return {
        points: [start, end],
        strategy: 'outer-lane',
        warning: 'Cross-root relation could not find an obstacle-free orthogonal route; direct points were retained for diagnostics.'
    };
}
