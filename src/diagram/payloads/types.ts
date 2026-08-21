import type { SupportedVegaLiteChartType } from '../adapters/vega/schema';
import type {
    DiagramDataSeries,
    DiagramEdge,
    DiagramNode,
    DiagramOrgChartSpec,
    DiagramQuadrantSpec,
    DiagramRadarSpec,
    DiagramSwimlaneLane,
    DiagramTimelineEvent
} from '../types';

export const DIAGRAM_PAYLOAD_KINDS = [
    'legacy',
    'drawnix-knowledge-map',
    'canvas-map',
    'quantitative',
    'radar',
    'org-chart',
    'timeline',
    'swimlane',
    'quadrant',
    'circuit',
    'topology',
    'lane-grid',
    'access-matrix',
    'schedule',
    'ordered-stack',
    'set-overlap',
    'ranked-segments',
    'cycle',
    'nested',
    'tree'
] as const;

export type DiagramPayloadKind = typeof DIAGRAM_PAYLOAD_KINDS[number];

export interface DiagramTopologyZone {
    id: string;
    label: string;
    sub?: string;
}

export interface DiagramTopologyNode {
    id: string;
    label: string;
    zoneId?: string;
    sub?: string;
    kind?: string;
    focal?: boolean;
    external?: boolean;
}

export interface DiagramTopologyEdge {
    from: string;
    to: string;
    label?: string;
    style?: 'muted' | 'accent' | 'link' | 'trigger';
    dashed?: boolean;
}

export interface DiagramTopologyFooter {
    id: string;
    label: string;
    sub?: string;
}

export interface DiagramTopologyPayload {
    kind: 'topology';
    orientation?: 'horizontal' | 'vertical';
    zones: DiagramTopologyZone[];
    nodes: DiagramTopologyNode[];
    edges: DiagramTopologyEdge[];
    footer?: DiagramTopologyFooter[];
}

export interface DiagramLane {
    id: string;
    label: string;
    sub?: string;
}

export interface DiagramLaneStep {
    id: string;
    label: string;
}

export interface DiagramLaneCell {
    laneId: string;
    stepId: string;
    title: string;
    sub?: string;
    tool?: string;
    focal?: boolean;
    chips?: { in?: string; out?: string };
}

export interface DiagramLaneEdge {
    from: { laneId: string; stepId: string };
    to: { laneId: string; stepId: string };
    label?: string;
    style?: 'muted' | 'accent' | 'link' | 'trigger';
    dashed?: boolean;
}

export interface DiagramLaneGridPayload {
    kind: 'lane-grid';
    lanes: DiagramLane[];
    steps: DiagramLaneStep[];
    cells: DiagramLaneCell[];
    edges: DiagramLaneEdge[];
}

export type DiagramAccessLevel = 'full' | 'rw' | 'read' | 'none';

export interface DiagramMatrixRole {
    id: string;
    label: string;
    code?: string;
}

export interface DiagramMatrixComponent {
    id: string;
    label: string;
    hint?: string;
}

export interface DiagramAccessCell {
    row: number;
    col: number;
    value: string;
    level: DiagramAccessLevel;
    sub?: string;
    focal?: boolean;
}

export interface DiagramAccessMatrixPayload {
    kind: 'access-matrix';
    roles: DiagramMatrixRole[];
    components: DiagramMatrixComponent[];
    cells: DiagramAccessCell[];
    noneLabel?: string;
}

export interface DiagramSchedulePhase {
    id: string;
    label: string;
}

export interface DiagramScheduleTask {
    id: string;
    label: string;
    phaseId?: string;
    start: string | number;
    end: string | number;
    focal?: boolean;
}

export interface DiagramScheduleMilestone {
    id: string;
    label: string;
    date: string | number;
}

export interface DiagramSchedulePayload {
    kind: 'schedule';
    phases: DiagramSchedulePhase[];
    tasks: DiagramScheduleTask[];
    milestones?: DiagramScheduleMilestone[];
}

export interface DiagramStackLayer {
    id: string;
    label: string;
    sub?: string;
    focal?: boolean;
}

export interface DiagramOrderedStackPayload {
    kind: 'ordered-stack';
    layers: DiagramStackLayer[];
    direction?: 'up' | 'down';
}

export interface DiagramOverlapSet {
    id: string;
    label: string;
    sub?: string;
    radius?: number;
}

export interface DiagramOverlapIntersection {
    id: string;
    label: string;
    setIds: string[];
    focal?: boolean;
}

export interface DiagramSetOverlapPayload {
    kind: 'set-overlap';
    sets: DiagramOverlapSet[];
    intersections: DiagramOverlapIntersection[];
}

export interface DiagramRankedSegment {
    id: string;
    label: string;
    sub?: string;
    value?: number;
    focal?: boolean;
}

export interface DiagramRankedSegmentsPayload {
    kind: 'ranked-segments';
    orientation: 'pyramid' | 'funnel';
    segments: DiagramRankedSegment[];
}

export interface DiagramCycleHub {
    label: string;
    sub?: string;
}

export interface DiagramCycleStation {
    id: string;
    label: string;
    sub?: string;
    focal?: boolean;
    spokeLabel?: string;
}

export interface DiagramCyclePayload {
    kind: 'cycle';
    hub: DiagramCycleHub;
    stations: DiagramCycleStation[];
}

export interface DiagramNestedLevel {
    id: string;
    label: string;
    sub?: string;
    focal?: boolean;
}

export interface DiagramNestedPayload {
    kind: 'nested';
    levels: DiagramNestedLevel[];
}

export interface DiagramTreeNode {
    id: string;
    label: string;
    parentId?: string;
    sub?: string;
    focal?: boolean;
}

export interface DiagramTreePayload {
    kind: 'tree';
    nodes: DiagramTreeNode[];
}

export interface LegacyDiagramPayload {
    kind: 'legacy';
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    specialized?: {
        dataSeries?: DiagramDataSeries[];
        radarSpec?: DiagramRadarSpec;
        orgChartSpec?: DiagramOrgChartSpec;
        timelineEvents?: DiagramTimelineEvent[];
        swimlaneLanes?: DiagramSwimlaneLane[];
        quadrant?: DiagramQuadrantSpec;
        circuitSpec?: unknown;
    };
}

export interface QuantitativeDiagramPayload {
    kind: 'quantitative';
    chartType: SupportedVegaLiteChartType;
    series: DiagramDataSeries[];
}

export interface UnsupportedDiagramPayload {
    kind: Exclude<DiagramPayloadKind,
        | 'legacy'
        | 'quantitative'
        | 'topology'
        | 'lane-grid'
        | 'access-matrix'
        | 'schedule'
        | 'ordered-stack'
        | 'set-overlap'
        | 'ranked-segments'
        | 'cycle'
        | 'nested'
        | 'tree'>;
    /** Reserved for a later batch; parser preserves but current renderers do not interpret it. */
    value: unknown;
}

export type DiagramPayload =
    | LegacyDiagramPayload
    | QuantitativeDiagramPayload
    | DiagramTopologyPayload
    | DiagramLaneGridPayload
    | DiagramAccessMatrixPayload
    | DiagramSchedulePayload
    | DiagramOrderedStackPayload
    | DiagramSetOverlapPayload
    | DiagramRankedSegmentsPayload
    | DiagramCyclePayload
    | DiagramNestedPayload
    | DiagramTreePayload
    | UnsupportedDiagramPayload;
