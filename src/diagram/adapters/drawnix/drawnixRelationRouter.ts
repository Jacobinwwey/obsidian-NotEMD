import type {
    DrawnixMindMapPlacedNode,
    DrawnixPoint,
    DrawnixRootRegion
} from './drawnixMindMapProjection';
import type { DrawnixRelationLane } from './drawnixRelationLaneLayout';
import { inflateDrawnixRect } from './drawnixGeometry';
import type { DrawnixRect } from './drawnixGeometry';

export type DrawnixCrossRootRouteStrategy = 'grid' | 'local-lane' | 'outer-lane' | 'reserved-lane';

export interface DrawnixCrossRootRoute {
    points: DrawnixPoint[];
    strategy: DrawnixCrossRootRouteStrategy;
    warning?: string;
}

export interface DrawnixRelationLabelSize {
    width: number;
    height: number;
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
    /**
     * The native arrow text is centered on the route. Supplying its measured
     * box lets lane selection reserve the same geometry that SVG/Drawnix will
     * render instead of discovering an overlap after routing.
     */
    labelSize?: DrawnixRelationLabelSize;
}

export interface DrawnixReservedRelationLaneRouterInput {
    source: DrawnixMindMapPlacedNode;
    target: DrawnixMindMapPlacedNode;
    nodes: readonly DrawnixMindMapPlacedNode[];
    lane: DrawnixRelationLane;
    canvasWidth: number;
    canvasHeight: number;
    /** Header bounds and labels allocated to other relation lanes. */
    additionalObstacles?: readonly DrawnixCrossRootRouteObstacle[];
}

export interface DrawnixReservedRelationLaneRoute extends DrawnixCrossRootRoute {
    nativeTextPosition: number;
}

const ROUTE_CLEARANCE = 28;
const OUTER_ROUTE_MARGIN = 64;
const BEND_PENALTY = 160;

type RouteRect = DrawnixRect;

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

function alternateHorizontalEndpoints(
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode,
    primary: { start: DrawnixPoint; end: DrawnixPoint }
): Array<{ start: DrawnixPoint; end: DrawnixPoint }> {
    const sourceCenterY = source.y + source.height / 2;
    const targetCenterY = target.y + target.height / 2;
    const candidates = [
        { start: [source.x + source.width, sourceCenterY] as DrawnixPoint, end: [target.x, targetCenterY] as DrawnixPoint },
        { start: [source.x, sourceCenterY] as DrawnixPoint, end: [target.x + target.width, targetCenterY] as DrawnixPoint },
        { start: [source.x + source.width, sourceCenterY] as DrawnixPoint, end: [target.x + target.width, targetCenterY] as DrawnixPoint },
        { start: [source.x, sourceCenterY] as DrawnixPoint, end: [target.x, targetCenterY] as DrawnixPoint }
    ];
    const primaryKey = `${primary.start.join(':')}-${primary.end.join(':')}`;
    const seen = new Set<string>([primaryKey]);

    return candidates.filter(candidate => {
        const key = `${candidate.start.join(':')}-${candidate.end.join(':')}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function inflate(region: DrawnixRootRegion): RouteRect {
    return inflateDrawnixRect(region, ROUTE_CLEARANCE);
}

function nodeRectangle(node: DrawnixMindMapPlacedNode, clearance: number): RouteRect {
    return inflateDrawnixRect(node, clearance);
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
    return Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b);
}

function clampRouteX(value: number, canvasWidth: number, labelHalfWidth = 0): number {
    const inset = ROUTE_CLEARANCE + labelHalfWidth;
    return Math.max(inset, Math.min(canvasWidth - inset, value));
}

function clampRouteY(value: number, canvasHeight: number, labelHalfHeight = 0): number {
    const inset = ROUTE_CLEARANCE + labelHalfHeight;
    return Math.max(inset, Math.min(canvasHeight - inset, value));
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
    canvasWidth: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] {
    const labelHalfWidth = (labelSize?.width ?? 0) / 2;
    const sourceIsLeft = start[0] <= end[0];
    const laneX = sourceIsLeft
        ? clampRouteX(Math.max(start[0], end[0]) + 42 + relationIndex * 18, canvasWidth, labelHalfWidth)
        : clampRouteX(Math.min(start[0], end[0]) - 42 - relationIndex * 18, canvasWidth, labelHalfWidth);
    return simplify([start, [laneX, start[1]], [laneX, end[1]], end]);
}

function buildBoundedOuterLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    source: DrawnixMindMapPlacedNode,
    target: DrawnixMindMapPlacedNode,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] | null {
    if (obstacles.length === 0) {
        return null;
    }

    const labelHalfWidth = (labelSize?.width ?? 0) / 2;
    const labelHalfHeight = (labelSize?.height ?? 0) / 2;
    const left = clampRouteX(Math.min(...obstacles.map(rect => rect.x)) - ROUTE_CLEARANCE, canvasWidth, labelHalfWidth);
    const right = clampRouteX(Math.max(...obstacles.map(rect => rect.x + rect.width)) + ROUTE_CLEARANCE, canvasWidth, labelHalfWidth);
    const top = clampRouteY(Math.min(...obstacles.map(rect => rect.y)) - ROUTE_CLEARANCE, canvasHeight, labelHalfHeight);
    const bottom = clampRouteY(Math.max(...obstacles.map(rect => rect.y + rect.height)) + ROUTE_CLEARANCE, canvasHeight, labelHalfHeight);
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
    canvasHeight: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] | null {
    const nodeObstacles = buildNodeObstacles(nodes, source.id, target.id);
    const obstacles = [...nodeObstacles, ...extraObstacles];
    const labelHalfWidth = (labelSize?.width ?? 0) / 2;
    const labelHalfHeight = (labelSize?.height ?? 0) / 2;
    const sourceIsLeft = center(source)[0] < center(target)[0];
    const laneCandidates = sourceIsLeft
        ? [
            clampRouteX(target.x - ROUTE_CLEARANCE - relationIndex * 18, canvasWidth, labelHalfWidth),
            clampRouteX(source.x + source.width + ROUTE_CLEARANCE + relationIndex * 18, canvasWidth, labelHalfWidth)
        ]
        : [
            clampRouteX(target.x + target.width + ROUTE_CLEARANCE + relationIndex * 18, canvasWidth, labelHalfWidth),
            clampRouteX(source.x - ROUTE_CLEARANCE - relationIndex * 18, canvasWidth, labelHalfWidth)
        ];

    const obstacleTop = Math.min(...obstacles.map(rect => rect.y));
    const obstacleBottom = Math.max(...obstacles.map(rect => rect.y + rect.height));
    const topLane = Math.max(ROUTE_CLEARANCE + labelHalfHeight, obstacleTop - OUTER_ROUTE_MARGIN - labelHalfHeight);
    const bottomLane = Math.min(canvasHeight - ROUTE_CLEARANCE - labelHalfHeight, obstacleBottom + OUTER_ROUTE_MARGIN + labelHalfHeight);
    const laneCandidatesY = [
        clampRouteY(topLane + relationIndex * 18, canvasHeight, labelHalfHeight),
        clampRouteY(bottomLane - relationIndex * 18, canvasHeight, labelHalfHeight)
    ];

    // A native text box is centered on the route. Prefer a long horizontal
    // corridor when a label is present so short endpoint segments cannot trap
    // the box against the source or target node.
    const laneRoutes = [
        ...(labelSize
            ? laneCandidatesY.map(laneY => simplify([start, [start[0], laneY], [end[0], laneY], end]))
            : []),
        ...(labelSize
            ? []
            : laneCandidates.map(laneX => simplify([start, [laneX, start[1]], [laneX, end[1]], end]))),
        ...(labelSize
            ? laneCandidates.map(laneX => simplify([start, [laneX, start[1]], [laneX, end[1]], end]))
            : laneCandidatesY.map(laneY => simplify([start, [start[0], laneY], [end[0], laneY], end])))
    ];
    for (const points of laneRoutes) {
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
        canvasHeight,
        labelSize
    );
    if (boundedOuterRoute) {
        return boundedOuterRoute;
    }

    // A final bounded lane keeps the result deterministic when the supplied canvas
    // is smaller than the node extents. The caller still validates the route.
    const boundedLaneX = sourceIsLeft
        ? clampRouteX(Math.max(start[0], end[0]) + ROUTE_CLEARANCE, canvasWidth, labelHalfWidth)
        : clampRouteX(Math.min(start[0], end[0]) - ROUTE_CLEARANCE, canvasWidth, labelHalfWidth);
    const boundedPoints = simplify([start, [boundedLaneX, start[1]], [boundedLaneX, end[1]], end]);
    return routeSegmentsAreClear(boundedPoints, obstacles) ? boundedPoints : null;
}

function buildParallelLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    relationIndex: number,
    obstacles: readonly RouteRect[],
    canvasHeight: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] | null {
    if (relationIndex <= 0) {
        return null;
    }

    // Repeated relations are laid out against the obstacle envelope, not the
    // source center. Node-aware routing often selects the first clear bottom
    // lane below that envelope; using the same base for later relations keeps
    // their native text boxes separated even when labels are multi-line.
    const obstacleTop = Math.min(start[1], end[1], ...obstacles.map(rect => rect.y));
    const obstacleBottom = Math.max(start[1], end[1], ...obstacles.map(rect => rect.y + rect.height));
    const labelHeight = labelSize?.height ?? 0;
    const labelHalfHeight = labelHeight / 2;
    const labelGap = labelHeight > 0 ? labelHeight + 24 : 96;
    const laneStep = Math.max(OUTER_ROUTE_MARGIN, labelGap + ROUTE_CLEARANCE);
    const bottomBase = obstacleBottom + OUTER_ROUTE_MARGIN;
    const topBase = obstacleTop - OUTER_ROUTE_MARGIN;
    const offsets = Array.from({ length: 8 }, (_, index) => index + relationIndex)
        .flatMap(multiplier => [
            bottomBase + multiplier * laneStep,
            topBase - multiplier * laneStep
        ]);
    for (const candidateY of offsets) {
        const laneY = clampRouteY(candidateY, canvasHeight, labelHalfHeight);
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
    canvasHeight: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] | null {
    // Keep fallback routes inside the exported canvas. A negative perimeter
    // coordinate is clipped by SVG/Drawnix and appears as a false dashed frame
    // along the page edge, which can obscure the title or summary.
    const labelHalfWidth = (labelSize?.width ?? 0) / 2;
    const labelHalfHeight = (labelSize?.height ?? 0) / 2;
    const outerLeft = ROUTE_CLEARANCE + labelHalfWidth;
    const outerRight = Math.max(outerLeft, canvasWidth - ROUTE_CLEARANCE - labelHalfWidth);
    const outerTop = ROUTE_CLEARANCE + labelHalfHeight;
    const outerBottom = Math.max(outerTop, canvasHeight - ROUTE_CLEARANCE - labelHalfHeight);
    const xs = deduplicate([
        start[0],
        end[0],
        outerLeft,
        outerRight,
        ...obstacles.flatMap(rect => [rect.x - ROUTE_CLEARANCE, rect.x + rect.width + ROUTE_CLEARANCE])
    ]).filter(x => x >= outerLeft && x <= outerRight);
    const ys = deduplicate([
        start[1],
        end[1],
        outerTop,
        outerBottom,
        ...obstacles.flatMap(rect => [rect.y - ROUTE_CLEARANCE, rect.y + rect.height + ROUTE_CLEARANCE])
    ]).filter(y => y >= outerTop && y <= outerBottom);

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

function endpointsTowardTrack(
    node: DrawnixMindMapPlacedNode,
    trackX: number
): DrawnixPoint[] {
    const centerY = node.y + node.height / 2;
    const left: DrawnixPoint = [node.x, centerY];
    const right: DrawnixPoint = [node.x + node.width, centerY];
    return trackX < node.x + node.width / 2 ? [left, right] : [right, left];
}

function endpointsForReservedLaneGrid(
    node: DrawnixMindMapPlacedNode,
    trackX: number,
    laneY: number
): DrawnixPoint[] {
    // Dense trees can seal both side ports while leaving a valid exterior egress above or below the node.
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;
    const top: DrawnixPoint = [centerX, node.y];
    const bottom: DrawnixPoint = [centerX, node.y + node.height];
    const verticalPorts = laneY < centerY ? [top, bottom] : [bottom, top];
    const candidates = [...endpointsTowardTrack(node, trackX), ...verticalPorts];

    return candidates.filter((point, index) => (
        candidates.findIndex(candidate => candidate[0] === point[0] && candidate[1] === point[1]) === index
    ));
}

function routeLength(points: readonly DrawnixPoint[]): number {
    return points.slice(1).reduce(
        (total, point, index) => total + Math.abs(point[0] - points[index][0]) + Math.abs(point[1] - points[index][1]),
        0
    );
}

function reservedLaneLabelPosition(
    points: readonly DrawnixPoint[],
    lane: DrawnixRelationLane
): number | null {
    const totalLength = routeLength(points);
    if (totalLength <= 0) {
        return null;
    }

    let distanceBefore = 0;
    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const segmentLength = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]);
        const spansLane = start[1] === lane.y
            && end[1] === lane.y
            && Math.min(start[0], end[0]) <= lane.leftTrackX
            && Math.max(start[0], end[0]) >= lane.rightTrackX;
        if (spansLane) {
            const distanceToLabel = Math.abs(lane.labelCenterX - start[0]);
            return Math.max(0, Math.min(1, (distanceBefore + distanceToLabel) / totalLength));
        }
        distanceBefore += segmentLength;
    }

    return null;
}

function findClearEndpointLaneLeg(
    endpoint: DrawnixPoint,
    node: DrawnixMindMapPlacedNode,
    trackX: number,
    laneY: number,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number
): DrawnixPoint[] | null {
    const endpointUsesLeftPort = Math.abs(endpoint[0] - node.x)
        <= Math.abs(endpoint[0] - (node.x + node.width));
    const outwardEscapeX = endpointUsesLeftPort
        ? node.x - ROUTE_CLEARANCE
        : node.x + node.width + ROUTE_CLEARANCE;
    const escapeColumns = [
        endpoint[0],
        clampRouteX(outwardEscapeX, canvasWidth)
    ].filter((value, index, values) => values.indexOf(value) === index);
    const candidateYs = deduplicate([
        endpoint[1],
        laneY,
        ...obstacles.flatMap(obstacle => [
            obstacle.y - ROUTE_CLEARANCE,
            obstacle.y + obstacle.height + ROUTE_CLEARANCE
        ])
    ])
        .map(y => clampRouteY(y, canvasHeight))
        .sort((left, right) => {
            const leftCost = Math.abs(left - endpoint[1]) + Math.abs(left - laneY);
            const rightCost = Math.abs(right - endpoint[1]) + Math.abs(right - laneY);
            return leftCost - rightCost || left - right;
        });

    for (const escapeX of escapeColumns) {
        for (const escapeY of candidateYs) {
            const points = simplify([
                endpoint,
                [escapeX, endpoint[1]],
                [escapeX, escapeY],
                [trackX, escapeY],
                [trackX, laneY]
            ]);
            if (routeSegmentsAreClear(points, obstacles)) {
                return points;
            }
        }
    }

    return null;
}

/**
 * Finds the shortest route that can enter a projection-reserved lane without
 * invoking the grid router. Most relations use this inexpensive path; the
 * caller owns the more expensive fallback when obstacles block every ingress.
 */
export function findDrawnixDirectReservedLaneRoute(
    input: DrawnixReservedRelationLaneRouterInput
): DrawnixReservedRelationLaneRoute | null {
    const { source, target, lane } = input;
    const obstacles = [
        ...buildNodeObstacles(input.nodes, source.id, target.id),
        ...(input.additionalObstacles ?? [])
    ];
    const laneDirections = [
        { sourceTrackX: lane.leftTrackX, targetTrackX: lane.rightTrackX },
        { sourceTrackX: lane.rightTrackX, targetTrackX: lane.leftTrackX }
    ];
    const candidates: Array<{ points: DrawnixPoint[]; nativeTextPosition: number }> = [];

    for (const direction of laneDirections) {
        const targetLanePoint: DrawnixPoint = [direction.targetTrackX, lane.y];
        for (const start of endpointsTowardTrack(source, direction.sourceTrackX)) {
            const sourceLaneLeg = findClearEndpointLaneLeg(
                start,
                source,
                direction.sourceTrackX,
                lane.y,
                obstacles,
                input.canvasWidth,
                input.canvasHeight
            );
            if (!sourceLaneLeg) {
                continue;
            }

            for (const end of endpointsTowardTrack(target, direction.targetTrackX)) {
                const targetLaneLeg = findClearEndpointLaneLeg(
                    end,
                    target,
                    direction.targetTrackX,
                    lane.y,
                    obstacles,
                    input.canvasWidth,
                    input.canvasHeight
                );
                if (targetLaneLeg) {
                    const points = simplify([
                        ...sourceLaneLeg,
                        targetLanePoint,
                        ...targetLaneLeg.slice().reverse().slice(1)
                    ]);
                    if (routeSegmentsAreClear(points, obstacles)) {
                        const nativeTextPosition = reservedLaneLabelPosition(points, lane);
                        if (nativeTextPosition !== null) {
                            candidates.push({ points, nativeTextPosition });
                        }
                    }
                }
            }
        }
    }

    candidates.sort((left, right) => {
        const lengthDelta = routeLength(left.points) - routeLength(right.points);
        return lengthDelta || left.points.length - right.points.length;
    });
    const selected = candidates[0];
    if (!selected) {
        return null;
    }

    return {
        points: selected.points,
        nativeTextPosition: selected.nativeTextPosition,
        strategy: 'reserved-lane'
    };
}

/**
 * Connects a relation to a lane reserved by the projection. The allocator
 * keeps same-side lanes in exterior gutters and cross-forest lanes below the
 * forest, so routing only needs to find clear ingress paths from the node
 * boundaries.
 */
export function routeDrawnixRelationThroughReservedLane(
    input: DrawnixReservedRelationLaneRouterInput
): DrawnixReservedRelationLaneRoute {
    const directRoute = findDrawnixDirectReservedLaneRoute(input);
    if (directRoute) {
        return directRoute;
    }

    const { source, target, lane } = input;
    const obstacles = [
        ...buildNodeObstacles(input.nodes, source.id, target.id),
        ...(input.additionalObstacles ?? [])
    ];
    const laneDirections = [
        { sourceTrackX: lane.leftTrackX, targetTrackX: lane.rightTrackX },
        { sourceTrackX: lane.rightTrackX, targetTrackX: lane.leftTrackX }
    ];
    const candidates: Array<{ points: DrawnixPoint[]; nativeTextPosition: number }> = [];

    for (const direction of laneDirections) {
        const sourceLanePoint: DrawnixPoint = [direction.sourceTrackX, lane.y];
        const targetLanePoint: DrawnixPoint = [direction.targetTrackX, lane.y];
        const sourceGridLegs = endpointsForReservedLaneGrid(source, direction.sourceTrackX, lane.y)
            .map(start => buildGridRoute(
                start,
                sourceLanePoint,
                obstacles,
                input.canvasWidth,
                input.canvasHeight
            ))
            .filter((points): points is DrawnixPoint[] => points !== null);
        const targetGridLegs = endpointsForReservedLaneGrid(target, direction.targetTrackX, lane.y)
            .map(end => buildGridRoute(
                targetLanePoint,
                end,
                obstacles,
                input.canvasWidth,
                input.canvasHeight
            ))
            .filter((points): points is DrawnixPoint[] => points !== null);

        for (const sourceGridLeg of sourceGridLegs) {
            for (const targetGridLeg of targetGridLegs) {
                const points = simplify([
                    ...sourceGridLeg,
                    targetLanePoint,
                    ...targetGridLeg.slice(1)
                ]);
                if (!routeSegmentsAreClear(points, obstacles)) {
                    continue;
                }

                const nativeTextPosition = reservedLaneLabelPosition(points, lane);
                if (nativeTextPosition !== null) {
                    candidates.push({ points, nativeTextPosition });
                }
            }
        }
    }

    candidates.sort((left, right) => {
        const lengthDelta = routeLength(left.points) - routeLength(right.points);
        return lengthDelta || left.points.length - right.points.length;
    });
    const selected = candidates[0];
    if (!selected) {
        throw new Error(
            `Reserved Drawnix relation lane "${lane.relationId}" (${source.id} -> ${target.id}) `
            + `could not find obstacle-free ingress paths at tracks ${lane.leftTrackX}/${lane.rightTrackX}, `
            + `row ${lane.y}, with ${obstacles.length} obstacles.`
        );
    }

    return {
        points: selected.points,
        nativeTextPosition: selected.nativeTextPosition,
        strategy: 'reserved-lane'
    };
}

function buildOuterLaneRoute(
    start: DrawnixPoint,
    end: DrawnixPoint,
    obstacles: readonly RouteRect[],
    canvasWidth: number,
    canvasHeight: number,
    labelSize?: DrawnixRelationLabelSize
): DrawnixPoint[] | null {
    const labelHalfWidth = (labelSize?.width ?? 0) / 2;
    const labelHalfHeight = (labelSize?.height ?? 0) / 2;
    const left = ROUTE_CLEARANCE + labelHalfWidth;
    const right = Math.max(left, canvasWidth - ROUTE_CLEARANCE - labelHalfWidth);
    const top = ROUTE_CLEARANCE + labelHalfHeight;
    const bottom = Math.max(top, canvasHeight - ROUTE_CLEARANCE - labelHalfHeight);
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

/**
 * @deprecated Retained for compatibility and focused router tests only. The
 * production projection routes through `routeDrawnixRelationThroughReservedLane`,
 * because the projection allocator owns lane geometry and native label
 * placement. Do not add new production callers to this fallback API.
 */
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

    // Duplicate same-root relations must receive distinct lanes before the
    // general node-aware shortcut runs. Otherwise both arrows can share one
    // polyline and their native text rectangles become indistinguishable.
    if (source.rootId === target.rootId && input.nodes && input.nodes.length > 0 && input.relationIndex > 0) {
        const parallelObstacles = [
            ...buildNodeObstacles(input.nodes, source.id, target.id),
            ...protectedObstacles
        ];
        const parallelLaneRoute = buildParallelLaneRoute(
            start,
            end,
            input.relationIndex,
            parallelObstacles,
            input.canvasHeight,
            input.labelSize
        );
        if (parallelLaneRoute) {
            return { points: parallelLaneRoute, strategy: 'local-lane' };
        }
    }

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
            input.canvasHeight,
            input.labelSize
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
                input.canvasHeight,
                input.labelSize
            );
            if (gridRoute) {
                return {
                    points: gridRoute,
                    strategy: 'grid',
                    warning: 'Same-root relation used the sparse obstacle grid because no local lane was available.'
                };
            }

            for (const endpoints of alternateHorizontalEndpoints(source, target, { start, end })) {
                const alternateNodeAwareRoute = buildNodeAwareRoute(
                    endpoints.start,
                    endpoints.end,
                    source,
                    target,
                    input.relationIndex,
                    input.nodes,
                    protectedObstacles,
                    input.canvasWidth,
                    input.canvasHeight,
                    input.labelSize
                );
                if (alternateNodeAwareRoute) {
                    return {
                        points: alternateNodeAwareRoute,
                        strategy: 'local-lane',
                        warning: 'Same-root relation used alternate node ports to avoid branch-internal obstacles.'
                    };
                }

                const alternateGridRoute = buildGridRoute(
                    endpoints.start,
                    endpoints.end,
                    nodeObstacles,
                    input.canvasWidth,
                    input.canvasHeight,
                    input.labelSize
                );
                if (alternateGridRoute) {
                    return {
                        points: alternateGridRoute,
                        strategy: 'grid',
                        warning: 'Same-root relation used alternate node ports and the sparse obstacle grid.'
                    };
                }
            }

            throw new Error(
                'Same-root relation could not find an obstacle-free node-aware route; '
                + 'Drawnix generation must fall back to a non-Drawnix target.'
            );
        }
        return {
            points: buildLocalLaneRoute(start, end, input.relationIndex, input.canvasWidth, input.labelSize),
            strategy: 'local-lane'
        };
    }

    const parallelLaneRoute = buildParallelLaneRoute(
        start,
        end,
        input.relationIndex,
        unrelatedObstacles,
        input.canvasHeight,
        input.labelSize
    );
    if (parallelLaneRoute) {
        return { points: parallelLaneRoute, strategy: 'grid' };
    }

    const gridRoute = buildGridRoute(
        start,
        end,
        unrelatedObstacles,
        input.canvasWidth,
        input.canvasHeight,
        input.labelSize
    );
    if (gridRoute) {
        return { points: gridRoute, strategy: 'grid' };
    }

    const outerRoute = buildOuterLaneRoute(
        start,
        end,
        unrelatedObstacles,
        input.canvasWidth,
        input.canvasHeight,
        input.labelSize
    );
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
