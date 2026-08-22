import type { SupportedVegaLiteChartType } from './adapters/vega/schema';
import type { CircuitSpec } from './adapters/circuitikz/circuitSpec';
import type { DiagramPayload } from './payloads/types';

export type { DiagramPayload, DiagramPayloadKind } from './payloads/types';

export interface DiagramPresentation {
    format?: 'html' | 'svg' | 'png' | 'html+png';
    size?: 'doc-inline' | 'doc-wide' | 'slide-16x9' | 'social-og' | 'fit';
    detail?: 'simplified' | 'balanced' | 'faithful';
    audience?: 'technical' | 'mixed' | 'executive';
}

export const SUPPORTED_DIAGRAM_INTENTS = [
    'mindmap',
    'drawnixMindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram',
    'canvasMap',
    'circuit',
    'dataChart',
    'radar',
    'orgChart',
    'timeline',
    'swimlane',
    'quadrant',
    'architecture',
    'currentState',
    'integrationTopology',
    'dataFlow',
    'accessMatrix',
    'gantt',
    'layerStack',
    'setOverlap',
    'rankedFunnel',
    'loop',
    'nested',
    'tree',
    'process',
    'medallion',
    'highLevel'
] as const;

export type DiagramIntent = typeof SUPPORTED_DIAGRAM_INTENTS[number];

export const DIAGRAM_CATALOG_TYPE_IDS = [
    'mermaid-mindmap',
    'drawnix-knowledge-map',
    'flowchart',
    'sequence',
    'state',
    'class',
    'entity-relationship',
    'canvas-map',
    'data-chart',
    'radar-chart',
    'org-chart',
    'circuit',
    'timeline',
    'swimlane',
    'quadrant',
    'bar-chart',
    'line-chart',
    'scatter-plot',
    'architecture',
    'current-state',
    'integration-topology',
    'data-flow',
    'access-matrix',
    'gantt',
    'layer-stack',
    'venn',
    'ranked-funnel',
    'loop',
    'nested',
    'tree',
    'process',
    'medallion',
    'high-level'
] as const;

export type DiagramCatalogTypeId = typeof DIAGRAM_CATALOG_TYPE_IDS[number];

export function isSupportedDiagramIntent(value: unknown): value is DiagramIntent {
    return typeof value === 'string'
        && (SUPPORTED_DIAGRAM_INTENTS as readonly string[]).includes(value);
}

export const SUPPORTED_RENDER_TARGETS = [
    'mermaid',
    'json-canvas',
    'vega-lite',
    'html',
    'editable-html-svg',
    'drawio',
    'drawnix',
    'circuitikz'
] as const;

export type RenderTarget = typeof SUPPORTED_RENDER_TARGETS[number];

export function isSupportedRenderTarget(value: unknown): value is RenderTarget {
    return typeof value === 'string'
        && (SUPPORTED_RENDER_TARGETS as readonly string[]).includes(value);
}

export type MermaidDiagramType =
    | 'mindmap'
    | 'flowchart'
    | 'sequenceDiagram'
    | 'classDiagram'
    | 'erDiagram'
    | 'stateDiagram-v2'
    | 'timeline'
    | 'quadrantChart';

export interface DiagramNode {
    id: string;
    label: string;
    kind?: string;
    children?: DiagramNode[];
}

export interface DiagramEdge {
    from: string;
    to: string;
    label?: string;
    relation?: string;
}

export type DiagramSourceCoverageDiagnosticKind =
    | 'edge-remapped'
    | 'edge-dropped'
    | 'node-merged'
    | 'node-compressed';

export interface DiagramSourceCoverageDiagnostic {
    kind: DiagramSourceCoverageDiagnosticKind;
    message: string;
    sourceIds?: string[];
    targetId?: string;
}

export interface DiagramSection {
    id: string;
    label: string;
    summary?: string;
}

export interface DiagramCallout {
    label: string;
    detail: string;
}

export interface DiagramDataPoint {
    x: string | number;
    y: number;
    series?: string;
}

export interface DiagramDataSeries {
    id: string;
    label: string;
    points: DiagramDataPoint[];
}

/**
 * A radar axis owns its scale so every series is compared against the same
 * declared maximum. The maximum remains optional for older/generated payloads;
 * the adapter derives a deterministic maximum from observed values when absent.
 */
export interface DiagramRadarAxis {
    id: string;
    label: string;
    max?: number;
}

export interface DiagramRadarPoint {
    axisId: string;
    value: number;
}

export interface DiagramRadarSeries {
    id: string;
    label: string;
    points: DiagramRadarPoint[];
}

export interface DiagramRadarSpec {
    axes: DiagramRadarAxis[];
    series: DiagramRadarSeries[];
}

export type DiagramOrgChartStatus = 'active' | 'planned' | 'gap';

export interface DiagramOrgChartPerson {
    id: string;
    label: string;
    role?: string;
    scope?: string[];
    reportsTo?: string;
    status?: DiagramOrgChartStatus;
}

export interface DiagramOrgChartSpec {
    nodes: DiagramOrgChartPerson[];
}

export interface DiagramTimelineEvent {
    id: string;
    date: string | number;
    label: string;
    details?: string[];
}

export interface DiagramSwimlaneStep {
    id: string;
    label: string;
    nextStepId?: string;
}

export interface DiagramSwimlaneLane {
    id: string;
    label: string;
    steps: DiagramSwimlaneStep[];
}

export interface DiagramQuadrantItem {
    id: string;
    label: string;
    x: number;
    y: number;
    detail?: string;
}

export interface DiagramQuadrantSpec {
    xAxisLabel: [string, string];
    yAxisLabel: [string, string];
    quadrantLabels: [string, string, string, string];
    items: DiagramQuadrantItem[];
}

export interface DiagramSpec {
    /** v1 is the legacy projection; v2 adds the canonical payload boundary. */
    schemaVersion?: number;
    intent: DiagramIntent;
    title: string;
    summary?: string;
    nodes: DiagramNode[];
    edges?: DiagramEdge[];
    sections?: DiagramSection[];
    callouts?: DiagramCallout[];
    dataSeries?: DiagramDataSeries[];
    radarSpec?: DiagramRadarSpec;
    orgChartSpec?: DiagramOrgChartSpec;
    timelineEvents?: DiagramTimelineEvent[];
    swimlaneLanes?: DiagramSwimlaneLane[];
    quadrant?: DiagramQuadrantSpec;
    circuitSpec?: CircuitSpec;
    layoutHints?: Record<string, string | number | boolean>;
    sourceLanguage?: string;
    outputLanguage?: string;
    evidenceRefs?: string[];
    payload?: DiagramPayload;
    presentation?: DiagramPresentation;
    extensions?: Record<string, unknown>;
    /** Deterministic diagnostics added after LLM generation by Drawnix source coverage. */
    sourceCoverageDiagnostics?: DiagramSourceCoverageDiagnostic[];
}

export interface DiagramIntentResult {
    intent: DiagramIntent;
    confidence: number;
    reasons: string[];
}

export interface DiagramPlanOptions {
    compatibilityMode?: 'best-fit' | 'legacy-mermaid';
    requestedIntent?: DiagramIntent;
    requestedVariant?: string;
    requestedRenderTarget?: RenderTarget;
}

export interface DiagramPlan {
    intent: DiagramIntent;
    confidence: number;
    reasons: string[];
    renderTarget: RenderTarget;
    fallbackTargets: RenderTarget[];
    catalogTypeId?: DiagramCatalogTypeId;
    variant?: string;
    preferredChartType?: SupportedVegaLiteChartType;
    mermaidDiagramType: MermaidDiagramType | null;
    legacyCompatibilityMode: boolean;
}
