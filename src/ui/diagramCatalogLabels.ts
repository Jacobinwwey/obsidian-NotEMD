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
    }
}

export function getExecutableDiagramIntentOptions(copy: DiagramCatalogLabelCopy): Array<{
    value: DiagramIntent;
    label: string;
}> {
    return EXECUTABLE_DIAGRAM_TYPES.map(type => ({
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
