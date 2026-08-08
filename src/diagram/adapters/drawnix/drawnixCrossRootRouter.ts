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

/**
 * A non-node rectangle that a relation route must not cross.
 *
 * The projection uses this for the title/summary band. Keeping the obstacle
 * in the router contract means every fallback (local lane, grid, and outer
 * lane) obeys the same protected canvas regions.
 */
export interface DrawnixCrossRootRouteObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DrawnixCrossRootRouterInput {
    source: DrawnixMindMapPlacedNode;
    target: DrawnixMindMapPlacedNode;
    /** Every placed node is used as an obstacle so local relations cannot enter a target box. */
    nodes?: readonly DrawnixMindMapPlacedNode[];
    /** Protected canvas regions such as the title/summary header band. */
    additionalObstacles?: readonly DrawnixCrossRootRouteObstacle[];
    relationIndex: number;
    regions: readonly DrawnixRootRegion[];
    canvasWidth: number;
    canvasHeight: number;
}

const ROUTE_CLEARANCE = 28;
const OUTER_ROUTE_MARGIN = 64;
const BEND_PENALTY = 160;

type RouteRect = DrawnixCrossRootRouteObstacle;

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

function nodeRectangle(node: DrawnixMindMapPlacedNode, clearance: number): RouteRect {
    return {
        x: node.x - clearance,
        y: node.y - clearance,
        width: node.width + clearance * 2,
        height: node.height + clearance * 2
    };
}

function buildNodeObstacles(
    nodes: readonly DrawnixMindMapPlacedNode[],
    sourceId: string,
    targetId: string
): RouteRect[] {
    return nodes.map(node => nodeRectangle(
        node,
        node.id === sourceId || node.id === targetId ? 0 : ROUTE_CLEARANCE
    ));
}

function routeSegmentsAreClear(points: DrawnixPoint[], obstacles: readonly RouteRect[]): boolean {
    return points.slice(1).every((point, index) => segmentClear(points[index], point, obstacles));
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

function clampRouteX(value: number, canvasWidth: number): number {
    return Math.max(ROUTE_CLEARANCE, Math.min(canvasWidth - ROUTE_CLEARANCE, value));
}

function clampRouteY(value: number, canvasHeight: number): number {
    return Math.max(ROUTE_CLEARANCE, Math.min(canvasHeight - ROUTE_CLEARANCE, value));
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
        ? clampRouteX(Math.max(start[0], end[0]) + 42 + relationIndex * 18, canvasWidth)
        : clampRouteX(Math.min(start[0], end[0]) - 42 - relationIndex * 18, canvasWidth);
    return simplify([start, [laneX, start[1]], [laneX, end[1]], end]);
}

function buildBoundedOuterLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    if (obstacles.length === 0) {
        return null;
    }

    const left = Math.max(ROUTE_CLEARANCE, Math.min(...obstacles.map(rect => rect.x)) - ROUTE_CLEARANCE);
    const right = Math.min(canvasWidth - ROUTE_CLEARANCE, Math.max(...obstacles.map(rect => rect.x + rect.width)) + ROUTE_CLEARANCE);
    const top = Math.max(ROUTE_CLEARANCE, Math.min(...obstacles.map(rect => rect.y)) - ROUTE_CLEARANCE);
    const bottom = Math.min(canvasHeight - ROUTE_CLEARANCE, Math.max(...obstacles.map(rect => rect.y + rect.height)) + ROUTE_CLEARANCE);
    const sourceIsLeft = center(source)[0] < center(target)[0];
    const sourceLane = sourceIsLeft ? right : left;
    const targetLane = sourceIsLeft ? left : right;
    const candidates = [top, bottom].flatMap(laneY => [
        simplify([start, [sourceLane, start[1]], [sourceLane, laneY], [targetLane, laneY], [targetLane, end[1]], end]),
        simplify([start, [targetLane, start[1]], [targetLane, laneY], [sourceLane, laneY], [sourceLane, end[1]], end])
    ]);
    return candidates.find(points => points.length > 2 && routeSegmentsAreClear(points, obstacles)) ?? null;
}

function buildNodeAwareRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode,
    relationIndex: number,
    nodes: readonly DrawnixMindMapPlacedNode[],
    extraObstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    const nodeObstacles = buildNodeObstacles(nodes, source.id, target.id);
    const obstacles = [...nodeObstacles, ...extraObstacles];
    const sourceIsLeft = center(source)[0] < center(target)[0];
    const laneCandidates = sourceIsLeft
        ? [
            clampRouteX(target.x - ROUTE_CLEARANCE - relationIndex * 18, canvasWidth),
            clampRouteX(source.x + source.width + ROUTE_CLEARANCE + relationIndex * 18, canvasWidth)
        ]
        : [
            clampRouteX(target.x + target.width + ROUTE_CLEARANCE + relationIndex * 18, canvasWidth),
            clampRouteX(source.x - ROUTE_CLEARANCE - relationIndex * 18, canvasWidth)
        ];

    for (const laneX of laneCandidates) {
        const points = simplify([start, [laneX, start[1]], [laneX, end[1]], end]);
        if (points.length > 2 && routeSegmentsAreClear(points, obstacles)) {
            return points;
        }
    }

    const obstacleTop = Math.min(...obstacles.map(rect => rect.y));
    const obstacleBottom = Math.max(...obstacles.map(rect => rect.y + rect.height));
    const topLane = Math.max(ROUTE_CLEARANCE, obstacleTop - OUTER_ROUTE_MARGIN);
    const bottomLane = Math.min(canvasHeight - ROUTE_CLEARANCE, obstacleBottom + OUTER_ROUTE_MARGIN);
    const laneCandidatesY = [
        clampRouteY(topLane + relationIndex * 18, canvasHeight),
        clampRouteY(bottomLane - relationIndex * 18, canvasHeight)
    ];
    for (const laneY of laneCandidatesY) {
        const points = simplify([start, [start[0], laneY], [end[0], laneY], end]);
        if (points.length > 2 && routeSegmentsAreClear(points, obstacles)) {
            return points;
        }
    }

    const boundedOuterRoute = buildBoundedOuterLaneRoute(
        start,
        end,
        source,
        target,
        obstacles,
        canvasWidth,
        canvasHeight
    );
    if (boundedOuterRoute) {
        return boundedOuterRoute;
    }

    // A final bounded lane keeps the result deterministic when the supplied canvas
    // is smaller than the node extents. The caller still validates the route.
    const boundedLaneX = sourceIsLeft
        ? Math.min(canvasWidth - ROUTE_CLEARANCE, Math.max(start[0], end[0]) + ROUTE_CLEARANCE)
        : Math.max(ROUTE_CLEARANCE, Math.min(start[0], end[0]) - ROUTE_CLEARANCE);
    const boundedPoints = simplify([start, [boundedLaneX, start[1]], [boundedLaneX, end[1]], end]);
    return routeSegmentsAreClear(boundedPoints, obstacles) ? boundedPoints : null;
}

function buildParallelLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    relationIndex: number,
    obstacles: readonly RouteRect[],
    canvasHeight: number
): DrawnixPoint[] | null {
    if (relationIndex <= 0) {
        return null;
    }

    const laneSpacing = ROUTE_CLEARANCE + relationIndex * 18;
    const offsets = [
        laneSpacing,
        -laneSpacing,
        laneSpacing * 2,
        -laneSpacing * 2
    ];
    for (const offset of offsets) {
        const laneY = Math.max(ROUTE_CLEARANCE, Math.min(canvasHeight - ROUTE_CLEARANCE, start[1] + offset));
        const points = simplify([start, [start[0], laneY], [end[0], laneY], end]);
        if (points.length > 2 && points.slice(1).every((point, index) => segmentClear(points[index], point, obstacles))) {
            return points;
        }
    }
    return null;
}

function buildGridRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    // Keep fallback routes inside the exported canvas. A negative perimeter
    // coordinate is clipped by SVG/Drawnix and appears as a false dashed frame
    // along the page edge, which can obscure the title or summary.
    const outerLeft = ROUTE_CLEARANCE;
    const outerRight = Math.max(ROUTE_CLEARANCE, canvasWidth - ROUTE_CLEARANCE);
    const outerTop = ROUTE_CLEARANCE;
    const outerBottom = Math.max(ROUTE_CLEARANCE, canvasHeight - ROUTE_CLEARANCE);
    const xs = deduplicate([
        start[0],
        end[0],
        outerLeft,
        outerRight,
        ...obstacles.flatMap(rect => [rect.x - ROUTE_CLEARANCE, rect.x + rect.width + ROUTE_CLEARANCE])
    ]).filter(x => x >= ROUTE_CLEARANCE && x <= canvasWidth - ROUTE_CLEARANCE);
    const ys = deduplicate([
        start[1],
        end[1],
        outerTop,
        outerBottom,
        ...obstacles.flatMap(rect => [rect.y - ROUTE_CLEARANCE, rect.y + rect.height + ROUTE_CLEARANCE])
    ]).filter(y => y >= ROUTE_CLEARANCE && y <= canvasHeight - ROUTE_CLEARANCE);

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
    const left = ROUTE_CLEARANCE;
    const right = Math.max(ROUTE_CLEARANCE, canvasWidth - ROUTE_CLEARANCE);
    const top = ROUTE_CLEARANCE;
    const bottom = Math.max(ROUTE_CLEARANCE, canvasHeight - ROUTE_CLEARANCE);
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
    const protectedObstacles = input.additionalObstacles ?? [];
    const unrelatedObstacles = [
        ...input.regions
        .filter(region => region.rootId !== source.rootId && region.rootId !== target.rootId)
        .map(inflate),
        ...protectedObstacles
    ];

    if (input.nodes && input.nodes.length > 0) {
        const nodeAwareRoute = buildNodeAwareRoute(
            start,
            end,
            source,
            target,
            input.relationIndex,
            input.nodes,
            source.rootId === target.rootId ? protectedObstacles : unrelatedObstacles,
            input.canvasWidth,
            input.canvasHeight
        );
        if (nodeAwareRoute) {
            return {
                points: nodeAwareRoute,
                strategy: source.rootId === target.rootId ? 'local-lane' : 'grid'
            };
        }
    }

    if (source.rootId === target.rootId) {
        if (input.nodes && input.nodes.length > 0) {
            const nodeObstacles = [
                ...buildNodeObstacles(input.nodes, source.id, target.id),
                ...protectedObstacles
            ];
            const gridRoute = buildGridRoute(
                start,
                end,
                nodeObstacles,
                input.canvasWidth,
                input.canvasHeight
            );
            if (gridRoute) {
                return {
                    points: gridRoute,
                    strategy: 'grid',
                    warning: 'Same-root relation used the sparse obstacle grid because no local lane was available.'
                };
            }

            throw new Error(
                'Same-root relation could not find an obstacle-free node-aware route; '
                + 'Drawnix generation must fall back to a non-Drawnix target.'
            );
        }
        return {
            points: buildLocalLaneRoute(start, end, input.relationIndex, input.canvasWidth),
            strategy: 'local-lane'
        };
    }

    const parallelLaneRoute = buildParallelLaneRoute(
        start,
        end,
        input.relationIndex,
        unrelatedObstacles,
        input.canvasHeight
    );
    if (parallelLaneRoute) {
        return { points: parallelLaneRoute, strategy: 'grid' };
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

    throw new Error(
        'Cross-root relation could not find an obstacle-free orthogonal route; '
        + 'Drawnix generation must fall back to a non-Drawnix target.'
    );
}
