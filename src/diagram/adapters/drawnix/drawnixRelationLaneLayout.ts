export interface DrawnixRelationLaneLabelSize {
    width: number;
    height: number;
}

export interface DrawnixRelationLaneLabelBounds extends DrawnixRelationLaneLabelSize {
    x: number;
    y: number;
}

export interface DrawnixRelationLaneRequest {
    relationId: string;
    sourceId: string;
    targetId: string;
    labelSize?: DrawnixRelationLaneLabelSize;
}

export interface DrawnixRelationLanePlacedNode {
    id: string;
    rootId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DrawnixRelationLaneGeometryInput {
    canvasWidth: number;
    reservations: readonly DrawnixRelationLaneReservation[];
    relations: readonly DrawnixRelationLaneRequest[];
    nodes: readonly DrawnixRelationLanePlacedNode[];
}

export interface DrawnixRelationLaneReservation {
    relationId: string;
}

export interface DrawnixRelationLane {
    relationId: string;
    leftTrackX: number;
    rightTrackX: number;
    y: number;
    labelCenterX: number;
    labelBounds?: DrawnixRelationLaneLabelBounds;
}

export interface DrawnixRelationLaneReservationLayout {
    forestOffsetX: number;
    width: number;
    reservations: DrawnixRelationLaneReservation[];
}

export interface DrawnixResolvedRelationLaneLayout {
    lanes: DrawnixRelationLane[];
    height: number;
}

export interface DrawnixRelationLaneReservationInput {
    forestWidth: number;
    relations: readonly DrawnixRelationLaneRequest[];
}

const CANVAS_EDGE_INSET = 44;
const NODE_TRACK_CLEARANCE = 28;
const LABEL_TRACK_CLEARANCE = 24;
const LANE_TOP_GAP = 40;
const LANE_BOTTOM_GAP = 72;
const LANE_VERTICAL_GAP = 28;
const LANE_LABEL_VERTICAL_CLEARANCE = 18;
const UNLABELLED_LANE_HEIGHT = 56;
const MINIMUM_RELATION_TRACK_SPAN = 56;

function finiteCanvasDimension(value: number): number {
    return Math.max(1, Math.ceil(value));
}

function assertLabelFitsCanvas(
    relationId: string,
    bounds: DrawnixRelationLaneLabelBounds,
    canvasWidth: number,
    canvasHeight: number
): void {
    const inset = CANVAS_EDGE_INSET + LABEL_TRACK_CLEARANCE;
    if (
        bounds.x < inset
        || bounds.x + bounds.width > canvasWidth - inset
        || bounds.y < 0
        || bounds.y + bounds.height > canvasHeight
    ) {
        throw new Error(`Drawnix relation lane "${relationId}" label cannot fit within the canvas.`);
    }
}

function relationTrackSpan(labelSize: DrawnixRelationLaneLabelSize | undefined): number {
    return Math.max(
        MINIMUM_RELATION_TRACK_SPAN,
        (labelSize?.width ?? 0) + LABEL_TRACK_CLEARANCE * 2
    );
}

function resolveEndpointSide(
    node: DrawnixRelationLanePlacedNode,
    other: DrawnixRelationLanePlacedNode,
    nodesById: ReadonlyMap<string, DrawnixRelationLanePlacedNode>
): 'left' | 'right' {
    const root = nodesById.get(node.rootId);
    const nodeCenter = node.x + node.width / 2;
    if (root && root.id !== node.id) {
        const rootCenter = root.x + root.width / 2;
        if (nodeCenter < rootCenter) {
            return 'left';
        }
        if (nodeCenter > rootCenter) {
            return 'right';
        }
    }
    return nodeCenter <= other.x + other.width / 2 ? 'left' : 'right';
}

function assertTracksFitCanvas(
    relationId: string,
    leftTrackX: number,
    rightTrackX: number,
    canvasWidth: number
): void {
    if (
        leftTrackX < CANVAS_EDGE_INSET
        || rightTrackX > canvasWidth - CANVAS_EDGE_INSET
        || leftTrackX >= rightTrackX
    ) {
        throw new Error(`Drawnix relation lane "${relationId}" cannot reserve a clear routing corridor.`);
    }
}

type DrawnixRelationLaneMode = 'left-side' | 'right-side' | 'cross-forest';

interface DrawnixRelationLanePlacement {
    reservation: DrawnixRelationLaneReservation;
    relation: DrawnixRelationLaneRequest;
    mode: DrawnixRelationLaneMode;
    leftTrackX: number;
    rightTrackX: number;
    labelCenterX: number;
    laneHeight: number;
    preferredY: number;
}

function relationLaneHeight(labelSize: DrawnixRelationLaneLabelSize | undefined): number {
    return Math.max(
        UNLABELLED_LANE_HEIGHT,
        (labelSize?.height ?? 0) + LANE_LABEL_VERTICAL_CLEARANCE * 2
    );
}

function centerY(node: DrawnixRelationLanePlacedNode): number {
    return node.y + node.height / 2;
}

function resolveRelationLaneMode(
    source: DrawnixRelationLanePlacedNode,
    target: DrawnixRelationLanePlacedNode,
    nodesById: ReadonlyMap<string, DrawnixRelationLanePlacedNode>
): DrawnixRelationLaneMode {
    const sourceSide = resolveEndpointSide(source, target, nodesById);
    const targetSide = resolveEndpointSide(target, source, nodesById);
    if (sourceSide !== targetSide) {
        return 'cross-forest';
    }
    return sourceSide === 'left' ? 'left-side' : 'right-side';
}

function assignSideLaneRows(
    placements: readonly DrawnixRelationLanePlacement[],
    forestTop: number
): ReadonlyMap<string, number> {
    const yByRelationId = new Map<string, number>();
    let previousBottom = Number.NEGATIVE_INFINITY;
    [...placements]
        .sort((left, right) => left.preferredY - right.preferredY || left.reservation.relationId.localeCompare(right.reservation.relationId))
        .forEach(placement => {
            const halfHeight = placement.laneHeight / 2;
            const y = Math.max(
                placement.preferredY,
                forestTop + halfHeight,
                previousBottom + LANE_VERTICAL_GAP + halfHeight
            );
            yByRelationId.set(placement.reservation.relationId, y);
            previousBottom = y + halfHeight;
        });
    return yByRelationId;
}

function assignCrossForestLaneRows(
    placements: readonly DrawnixRelationLanePlacement[],
    forestBottom: number
): { yByRelationId: ReadonlyMap<string, number>; bottom: number } {
    const yByRelationId = new Map<string, number>();
    let laneTop = forestBottom + LANE_TOP_GAP;
    placements.forEach(placement => {
        const y = laneTop + placement.laneHeight / 2;
        yByRelationId.set(placement.reservation.relationId, y);
        laneTop += placement.laneHeight + LANE_VERTICAL_GAP;
    });
    return {
        yByRelationId,
        bottom: placements.length > 0 ? laneTop - LANE_VERTICAL_GAP : forestBottom
    };
}

/**
 * Resolves relation geometry after the forest has been placed. The preliminary
 * reservation owns only horizontal canvas space and relation identity. This
 * phase derives each lane from the placed forest, reserving exterior
 * corridors that remain clear even when a wider sibling branch sits below an
 * endpoint. Same-side relations use a compact pair on one exterior side;
 * cross-side relations use the two forest sides.
 */
export function assignDrawnixRelationLaneGeometry(
    input: DrawnixRelationLaneGeometryInput
): DrawnixResolvedRelationLaneLayout {
    const nodesById = new Map(input.nodes.map(node => [node.id, node]));
    const relationsById = new Map(input.relations.map(relation => [relation.relationId, relation]));
    const forestLeft = Math.min(...input.nodes.map(node => node.x));
    const forestRight = Math.max(...input.nodes.map(node => node.x + node.width));
    const forestTop = Math.min(...input.nodes.map(node => node.y));
    const forestBottom = Math.max(...input.nodes.map(node => node.y + node.height));
    const placements = input.reservations.map(reservation => {
        const relation = relationsById.get(reservation.relationId);
        const source = relation ? nodesById.get(relation.sourceId) : undefined;
        const target = relation ? nodesById.get(relation.targetId) : undefined;
        if (!relation || !source || !target) {
            throw new Error(`Drawnix relation lane "${reservation.relationId}" has no placed endpoints.`);
        }

        const labelWidth = relation.labelSize?.width ?? 0;
        const trackSpan = relationTrackSpan(relation.labelSize);
        const westInnerTrackX = forestLeft - NODE_TRACK_CLEARANCE;
        const westOuterTrackX = westInnerTrackX - trackSpan;
        const eastInnerTrackX = forestRight + NODE_TRACK_CLEARANCE;
        const eastOuterTrackX = eastInnerTrackX + trackSpan;
        const mode = resolveRelationLaneMode(source, target, nodesById);
        const [leftTrackX, rightTrackX] = mode === 'left-side'
                ? [westOuterTrackX, westInnerTrackX]
            : mode === 'right-side'
                ? [eastInnerTrackX, eastOuterTrackX]
                : [westInnerTrackX, eastInnerTrackX];
        assertTracksFitCanvas(reservation.relationId, leftTrackX, rightTrackX, input.canvasWidth);
        return {
            reservation,
            relation,
            mode,
            leftTrackX,
            rightTrackX,
            labelCenterX: (leftTrackX + rightTrackX) / 2,
            laneHeight: relationLaneHeight(relation.labelSize),
            preferredY: (centerY(source) + centerY(target)) / 2
        };
    });
    const sideLaneYByRelationId = new Map<string, number>();
    (['left-side', 'right-side'] as const).forEach(mode => {
        assignSideLaneRows(
            placements.filter(placement => placement.mode === mode),
            forestTop
        ).forEach((y, relationId) => sideLaneYByRelationId.set(relationId, y));
    });
    const crossForestRows = assignCrossForestLaneRows(
        placements.filter(placement => placement.mode === 'cross-forest'),
        forestBottom
    );
    const yByRelationId = new Map<string, number>([
        ...sideLaneYByRelationId,
        ...crossForestRows.yByRelationId
    ]);
    const lowerLaneBoundary = Math.max(
        forestBottom,
        crossForestRows.bottom,
        ...placements.map(placement => (
            (yByRelationId.get(placement.reservation.relationId) ?? forestBottom) + placement.laneHeight / 2
        ))
    );
    const height = finiteCanvasDimension(lowerLaneBoundary + LANE_BOTTOM_GAP);
    const lanes = placements.map(placement => {
        const y = yByRelationId.get(placement.reservation.relationId);
        if (y === undefined) {
            throw new Error(`Drawnix relation lane "${placement.reservation.relationId}" has no allocated row.`);
        }
        const labelSize = placement.relation.labelSize;
        const labelBounds = labelSize
            ? {
                x: placement.labelCenterX - labelSize.width / 2,
                y: y - labelSize.height / 2,
                width: labelSize.width,
                height: labelSize.height
            }
            : undefined;
        if (labelBounds) {
            assertLabelFitsCanvas(placement.reservation.relationId, labelBounds, input.canvasWidth, height);
        }
        return {
            relationId: placement.reservation.relationId,
            leftTrackX: placement.leftTrackX,
            rightTrackX: placement.rightTrackX,
            y,
            labelCenterX: placement.labelCenterX,
            labelBounds
        };
    });

    return { lanes, height };
}

/**
 * Reserves the horizontal canvas space required by the widest relation label.
 * Final row and track geometry is resolved only after nodes are placed.
 */
export function reserveDrawnixRelationLaneSpace(
    input: DrawnixRelationLaneReservationInput
): DrawnixRelationLaneReservationLayout {
    const forestWidth = finiteCanvasDimension(input.forestWidth);
    if (input.relations.length === 0) {
        return {
            forestOffsetX: 0,
            width: forestWidth,
            reservations: []
        };
    }

    const maximumTrackSpan = Math.max(
        MINIMUM_RELATION_TRACK_SPAN,
        ...input.relations.map(relation => relationTrackSpan(relation.labelSize))
    );
    const forestSideReserve = CANVAS_EDGE_INSET + NODE_TRACK_CLEARANCE + maximumTrackSpan;
    const width = finiteCanvasDimension(forestWidth + forestSideReserve * 2);
    const forestOffsetX = Math.ceil((width - forestWidth) / 2);

    return {
        forestOffsetX,
        width,
        reservations: input.relations.map(({ relationId }) => ({ relationId }))
    };
}
