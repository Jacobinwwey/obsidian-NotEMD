import type { DiagramCatalogTypeId, DiagramIntent, RenderTarget } from './types';

export type DiagramTypeFamily = 'knowledge' | 'behavior' | 'structure' | 'quantitative' | 'engineering';

export interface ExecutableDiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    semanticPattern: string;
    promptProfileId: string;
    rendererOperationId: string;
    rendererTarget: RenderTarget;
    visualRoles: readonly string[];
    exampleFixtureId: string;
}

export const EXECUTABLE_DIAGRAM_TYPES: readonly ExecutableDiagramTypeDefinition[] = [
    {
        id: 'mermaid-mindmap',
        intent: 'mindmap',
        family: 'knowledge',
        semanticPattern: 'Concept hierarchy',
        promptProfileId: 'mermaid-mindmap',
        rendererOperationId: 'mermaid-mindmap',
        rendererTarget: 'mermaid',
        visualRoles: ['root', 'topic', 'detail'],
        exampleFixtureId: 'mermaid-mindmap-basics'
    },
    {
        id: 'drawnix-knowledge-map',
        intent: 'drawnixMindmap',
        family: 'knowledge',
        semanticPattern: 'Multi-root knowledge graph with material cross-relations',
        promptProfileId: 'drawnix-knowledge-map',
        rendererOperationId: 'drawnix-knowledge-map-board',
        rendererTarget: 'drawnix',
        visualRoles: ['root', 'domain', 'subsystem', 'component', 'evidence', 'external', 'cross-relation'],
        exampleFixtureId: 'drawnix-knowledge-map-architecture'
    },
    {
        id: 'flowchart',
        intent: 'flowchart',
        family: 'behavior',
        semanticPattern: 'Control flow and decision path',
        promptProfileId: 'flowchart',
        rendererOperationId: 'mermaid-flowchart',
        rendererTarget: 'mermaid',
        visualRoles: ['start', 'step', 'decision', 'outcome'],
        exampleFixtureId: 'flowchart-release'
    },
    {
        id: 'sequence',
        intent: 'sequence',
        family: 'behavior',
        semanticPattern: 'Ordered participant interaction',
        promptProfileId: 'sequence',
        rendererOperationId: 'mermaid-sequence',
        rendererTarget: 'mermaid',
        visualRoles: ['participant', 'request', 'response'],
        exampleFixtureId: 'sequence-request'
    },
    {
        id: 'state',
        intent: 'stateDiagram',
        family: 'behavior',
        semanticPattern: 'State transition lifecycle',
        promptProfileId: 'state',
        rendererOperationId: 'mermaid-state',
        rendererTarget: 'mermaid',
        visualRoles: ['initial', 'state', 'transition', 'terminal'],
        exampleFixtureId: 'state-lifecycle'
    },
    {
        id: 'class',
        intent: 'classDiagram',
        family: 'structure',
        semanticPattern: 'Type relationship and ownership',
        promptProfileId: 'class',
        rendererOperationId: 'mermaid-class',
        rendererTarget: 'mermaid',
        visualRoles: ['type', 'member', 'association'],
        exampleFixtureId: 'class-domain'
    },
    {
        id: 'entity-relationship',
        intent: 'erDiagram',
        family: 'structure',
        semanticPattern: 'Entity cardinality and attributes',
        promptProfileId: 'entity-relationship',
        rendererOperationId: 'mermaid-er',
        rendererTarget: 'mermaid',
        visualRoles: ['entity', 'attribute', 'relationship'],
        exampleFixtureId: 'entity-relationship-schema'
    },
    {
        id: 'canvas-map',
        intent: 'canvasMap',
        family: 'structure',
        semanticPattern: 'Spatially grouped concepts',
        promptProfileId: 'canvas-map',
        rendererOperationId: 'json-canvas-map',
        rendererTarget: 'json-canvas',
        visualRoles: ['domain', 'concept', 'connection'],
        exampleFixtureId: 'canvas-map-domains'
    },
    {
        id: 'data-chart',
        intent: 'dataChart',
        family: 'quantitative',
        semanticPattern: 'Measured comparison over a shared axis',
        promptProfileId: 'data-chart',
        rendererOperationId: 'vega-lite-chart',
        rendererTarget: 'vega-lite',
        visualRoles: ['series', 'measure', 'comparison'],
        exampleFixtureId: 'data-chart-trend'
    },
    {
        id: 'circuit',
        intent: 'circuit',
        family: 'engineering',
        semanticPattern: 'Electrical components and nets',
        promptProfileId: 'circuit',
        rendererOperationId: 'circuitikz-circuit',
        rendererTarget: 'circuitikz',
        visualRoles: ['component', 'net', 'port'],
        exampleFixtureId: 'circuit-cmos-inverter'
    }
] as const;

const DIAGRAM_TYPE_BY_ID = new Map(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.id, type]));
const DIAGRAM_TYPE_BY_INTENT = new Map(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.intent, type]));

export function getExecutableDiagramType(id: DiagramCatalogTypeId): ExecutableDiagramTypeDefinition {
    const type = DIAGRAM_TYPE_BY_ID.get(id);
    if (!type) {
        throw new Error(`Unsupported diagram catalog type "${id}".`);
    }
    return type;
}

export function findDiagramTypeByIntent(intent: DiagramIntent): ExecutableDiagramTypeDefinition {
    const type = DIAGRAM_TYPE_BY_INTENT.get(intent);
    if (!type) {
        throw new Error(`No executable diagram catalog type is registered for intent "${intent}".`);
    }
    return type;
}
