import { SupportedVegaLiteChartType } from './adapters/vega/schema';

export const SUPPORTED_DIAGRAM_INTENTS = [
    'mindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram',
    'canvasMap',
    'dataChart'
] as const;

export type DiagramIntent = typeof SUPPORTED_DIAGRAM_INTENTS[number];

export function isSupportedDiagramIntent(value: unknown): value is DiagramIntent {
    return typeof value === 'string'
        && (SUPPORTED_DIAGRAM_INTENTS as readonly string[]).includes(value);
}

export type RenderTarget = 'mermaid' | 'json-canvas' | 'vega-lite' | 'html';

export type MermaidDiagramType =
    | 'mindmap'
    | 'flowchart'
    | 'sequenceDiagram'
    | 'classDiagram'
    | 'erDiagram'
    | 'stateDiagram-v2';

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

export interface DiagramSpec {
    intent: DiagramIntent;
    title: string;
    summary?: string;
    nodes: DiagramNode[];
    edges?: DiagramEdge[];
    sections?: DiagramSection[];
    callouts?: DiagramCallout[];
    dataSeries?: DiagramDataSeries[];
    layoutHints?: Record<string, string | number | boolean>;
    sourceLanguage?: string;
    outputLanguage?: string;
    evidenceRefs?: string[];
}

export interface DiagramIntentResult {
    intent: DiagramIntent;
    confidence: number;
    reasons: string[];
}

export interface DiagramPlanOptions {
    compatibilityMode?: 'best-fit' | 'legacy-mermaid';
    requestedIntent?: DiagramIntent;
}

export interface DiagramPlan {
    intent: DiagramIntent;
    confidence: number;
    reasons: string[];
    renderTarget: RenderTarget;
    fallbackTargets: RenderTarget[];
    preferredChartType?: SupportedVegaLiteChartType;
    mermaidDiagramType: MermaidDiagramType | null;
    legacyCompatibilityMode: boolean;
}
