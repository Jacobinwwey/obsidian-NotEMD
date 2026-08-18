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
    /** Default target selected by the planner for this semantic type. */
    defaultTarget: RenderTarget;
    /** Targets with a renderer contract for this semantic type. */
    compatibleTargets: readonly RenderTarget[];
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
        visualRoles: ['root', 'topic', 'detail'],
        exampleFixtureId: 'mermaid-mindmap-basics'
    },
    {
        id: 'drawnix-knowledge-map',
        intent: 'drawnixMindmap',
        family: 'knowledge',
        semanticPattern: 'Filename-rooted knowledge tree with material cross-branch relationships',
        promptProfileId: 'drawnix-knowledge-map',
        rendererOperationId: 'drawnix-knowledge-map-tree',
        rendererTarget: 'drawnix',
        defaultTarget: 'drawnix',
        compatibleTargets: ['drawnix'],
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
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
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'editable-html-svg', 'drawio', 'html'],
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
        defaultTarget: 'json-canvas',
        compatibleTargets: ['json-canvas'],
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
        defaultTarget: 'vega-lite',
        compatibleTargets: ['vega-lite', 'html'],
        visualRoles: ['series', 'measure', 'comparison'],
        exampleFixtureId: 'data-chart-trend'
    },
    {
        id: 'radar-chart',
        intent: 'radar',
        family: 'quantitative',
        semanticPattern: 'Multi-axis profile comparison',
        promptProfileId: 'radar-chart',
        rendererOperationId: 'vega-lite-radar',
        rendererTarget: 'vega-lite',
        defaultTarget: 'vega-lite',
        compatibleTargets: ['vega-lite', 'html'],
        visualRoles: ['axis', 'profile', 'value'],
        exampleFixtureId: 'radar-capability-profile'
    },
    {
        id: 'org-chart',
        intent: 'orgChart',
        family: 'structure',
        semanticPattern: 'Ownership hierarchy with accountable reporting paths',
        promptProfileId: 'org-chart',
        rendererOperationId: 'mermaid-org-chart',
        rendererTarget: 'mermaid',
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid', 'html'],
        visualRoles: ['root-owner', 'team', 'accountable-owner', 'scope', 'coverage-gap'],
        exampleFixtureId: 'org-chart-support-ownership'
    },
    {
        id: 'timeline',
        intent: 'timeline',
        family: 'behavior',
        semanticPattern: 'Ordered milestones over time',
        promptProfileId: 'timeline',
        rendererOperationId: 'mermaid-timeline',
        rendererTarget: 'mermaid',
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid'],
        visualRoles: ['date', 'event', 'detail'],
        exampleFixtureId: 'timeline-roadmap'
    },
    {
        id: 'swimlane',
        intent: 'swimlane',
        family: 'behavior',
        semanticPattern: 'Cross-functional responsibility flow',
        promptProfileId: 'swimlane',
        rendererOperationId: 'mermaid-swimlane',
        rendererTarget: 'mermaid',
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid'],
        visualRoles: ['lane', 'step', 'handoff'],
        exampleFixtureId: 'swimlane-release'
    },
    {
        id: 'quadrant',
        intent: 'quadrant',
        family: 'quantitative',
        semanticPattern: 'Two-axis prioritization matrix',
        promptProfileId: 'quadrant',
        rendererOperationId: 'mermaid-quadrant',
        rendererTarget: 'mermaid',
        defaultTarget: 'mermaid',
        compatibleTargets: ['mermaid'],
        visualRoles: ['axis', 'quadrant', 'item'],
        exampleFixtureId: 'quadrant-priorities'
    },
    {
        id: 'circuit',
        intent: 'circuit',
        family: 'engineering',
        semanticPattern: 'Electrical components and nets',
        promptProfileId: 'circuit',
        rendererOperationId: 'circuitikz-circuit',
        rendererTarget: 'circuitikz',
        defaultTarget: 'circuitikz',
        compatibleTargets: ['circuitikz'],
        visualRoles: ['component', 'net', 'port'],
        exampleFixtureId: 'circuit-cmos-inverter'
    }
] as const;

const DIAGRAM_TYPE_BY_ID = new Map(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.id, type]));
const DIAGRAM_TYPE_BY_INTENT = new Map(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.intent, type]));

function assertExecutableDiagramTypeCatalog(): void {
    if (DIAGRAM_TYPE_BY_ID.size !== EXECUTABLE_DIAGRAM_TYPES.length
        || DIAGRAM_TYPE_BY_INTENT.size !== EXECUTABLE_DIAGRAM_TYPES.length) {
        throw new Error('Executable diagram types must use unique ids and intents.');
    }
    for (const type of EXECUTABLE_DIAGRAM_TYPES) {
        if (type.defaultTarget !== type.rendererTarget || !type.compatibleTargets.includes(type.defaultTarget)) {
            throw new Error(`Diagram type "${type.id}" has an invalid default render target contract.`);
        }
        if (new Set(type.compatibleTargets).size !== type.compatibleTargets.length) {
            throw new Error(`Diagram type "${type.id}" lists a compatible target more than once.`);
        }
    }
}

assertExecutableDiagramTypeCatalog();

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
