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
    'cycle'
] as const;

export type DiagramPayloadKind = typeof DIAGRAM_PAYLOAD_KINDS[number];

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
    kind: Exclude<DiagramPayloadKind, 'legacy' | 'quantitative'>;
    /** Reserved for a later batch; parser preserves but current renderers do not interpret it. */
    value: unknown;
}

export type DiagramPayload = LegacyDiagramPayload | QuantitativeDiagramPayload | UnsupportedDiagramPayload;
