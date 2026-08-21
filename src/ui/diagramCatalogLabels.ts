import {
    EXECUTABLE_DIAGRAM_TYPES,
    type DiagramTypeFamily
} from '../diagram/diagramTypeCatalog';
import type { DiagramIntent } from '../diagram/types';

export interface DiagramCatalogLabelCopy {
    intentMindmap: string;
    intentDrawnixKnowledgeMap: string;
    intentFlowchart: string;
    intentSequence: string;
    intentClassDiagram: string;
    intentErDiagram: string;
    intentStateDiagram: string;
    intentCanvasMap: string;
    intentCircuit: string;
    intentDataChart: string;
    intentRadar: string;
    intentOrgChart: string;
    intentTimeline: string;
    intentSwimlane: string;
    intentQuadrant: string;
    intentArchitecture?: string;
    intentCurrentState?: string;
    intentIntegrationTopology?: string;
    intentDataFlow?: string;
    intentAccessMatrix?: string;
    intentGantt?: string;
    intentLayerStack?: string;
    intentSetOverlap?: string;
    intentRankedFunnel?: string;
    intentLoop?: string;
    intentNested?: string;
    intentTree?: string;
    intentProcess?: string;
    intentMedallion?: string;
    intentHighLevel?: string;
}

export interface DiagramCatalogFamilyLabelCopy {
    knowledge: string;
    behavior: string;
    structure: string;
    quantitative: string;
    engineering: string;
}

export function getLocalizedDiagramIntentLabel(
    intent: DiagramIntent,
    copy: DiagramCatalogLabelCopy
): string {
    switch (intent) {
        case 'mindmap': return copy.intentMindmap;
        case 'drawnixMindmap': return copy.intentDrawnixKnowledgeMap;
        case 'flowchart': return copy.intentFlowchart;
        case 'sequence': return copy.intentSequence;
        case 'classDiagram': return copy.intentClassDiagram;
        case 'erDiagram': return copy.intentErDiagram;
        case 'stateDiagram': return copy.intentStateDiagram;
        case 'canvasMap': return copy.intentCanvasMap;
        case 'circuit': return copy.intentCircuit;
        case 'dataChart': return copy.intentDataChart;
        case 'radar': return copy.intentRadar;
        case 'orgChart': return copy.intentOrgChart;
        case 'timeline': return copy.intentTimeline;
        case 'swimlane': return copy.intentSwimlane;
        case 'quadrant': return copy.intentQuadrant;
        case 'architecture': return copy.intentArchitecture ?? 'Architecture';
        case 'currentState': return copy.intentCurrentState ?? 'Current state';
        case 'integrationTopology': return copy.intentIntegrationTopology ?? 'Integration topology';
        case 'dataFlow': return copy.intentDataFlow ?? 'Data flow';
        case 'accessMatrix': return copy.intentAccessMatrix ?? 'Access matrix';
        case 'gantt': return copy.intentGantt ?? 'Gantt';
        case 'layerStack': return copy.intentLayerStack ?? 'Layer stack';
        case 'setOverlap': return copy.intentSetOverlap ?? 'Venn overlap';
        case 'rankedFunnel': return copy.intentRankedFunnel ?? 'Pyramid / funnel';
        case 'loop': return copy.intentLoop ?? 'Loop';
        case 'nested': return copy.intentNested ?? 'Nested scope';
        case 'tree': return copy.intentTree ?? 'Tree';
        case 'process': return copy.intentProcess ?? 'Process';
        case 'medallion': return copy.intentMedallion ?? 'Medallion';
        case 'highLevel': return copy.intentHighLevel ?? 'High-level overview';
    }
}

export function getExecutableDiagramIntentOptions(copy: DiagramCatalogLabelCopy): Array<{
    value: DiagramIntent;
    label: string;
}> {
    const seen = new Set<DiagramIntent>();
    return EXECUTABLE_DIAGRAM_TYPES
        .filter(type => {
            if (seen.has(type.intent)) return false;
            seen.add(type.intent);
            return true;
        })
        .map(type => ({
            value: type.intent,
            label: getLocalizedDiagramIntentLabel(type.intent, copy)
        }));
}

export function getLocalizedDiagramFamilyLabel(
    family: DiagramTypeFamily,
    copy: DiagramCatalogFamilyLabelCopy
): string {
    return copy[family];
}
