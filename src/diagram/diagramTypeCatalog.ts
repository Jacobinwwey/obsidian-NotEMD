import type { DiagramCatalogTypeId, DiagramIntent, RenderTarget } from './types';
import type { DiagramPayloadKind } from './payloads/types';
import { getDiagramPromptProfile } from './prompts/diagramPromptProfileCatalog';

export type DiagramTypeFamily = 'knowledge' | 'behavior' | 'structure' | 'quantitative' | 'engineering';

export interface ExecutableDiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    semanticPattern: string;
    promptProfileId: string;
    variant?: string;
    payloadKind: DiagramPayloadKind;
    layoutProfileId: string;
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-mindmap',
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
        payloadKind: 'drawnix-knowledge-map',
        layoutProfileId: 'drawnix-knowledge-map',
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-flowchart',
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-sequence',
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-state',
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-class',
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
        payloadKind: 'legacy',
        layoutProfileId: 'mermaid-er',
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
        payloadKind: 'canvas-map',
        layoutProfileId: 'json-canvas-map',
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
        variant: 'auto',
        payloadKind: 'quantitative',
        layoutProfileId: 'vega-lite-quantitative',
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
        payloadKind: 'radar',
        layoutProfileId: 'vega-lite-radar',
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
        payloadKind: 'org-chart',
        layoutProfileId: 'mermaid-org-chart',
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
        payloadKind: 'timeline',
        layoutProfileId: 'mermaid-timeline',
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
        payloadKind: 'swimlane',
        layoutProfileId: 'mermaid-swimlane',
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
        payloadKind: 'quadrant',
        layoutProfileId: 'mermaid-quadrant',
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
        payloadKind: 'circuit',
        layoutProfileId: 'circuitikz',
        rendererOperationId: 'circuitikz-circuit',
        rendererTarget: 'circuitikz',
        defaultTarget: 'circuitikz',
        compatibleTargets: ['circuitikz'],
        visualRoles: ['component', 'net', 'port'],
        exampleFixtureId: 'circuit-cmos-inverter'
    },
    {
        id: 'bar-chart',
        intent: 'dataChart',
        variant: 'bar',
        family: 'quantitative',
        semanticPattern: 'Discrete category comparison',
        promptProfileId: 'bar-chart',
        payloadKind: 'quantitative',
        layoutProfileId: 'vega-lite-bar',
        rendererOperationId: 'vega-lite-chart',
        rendererTarget: 'vega-lite',
        defaultTarget: 'vega-lite',
        compatibleTargets: ['vega-lite', 'html'],
        visualRoles: ['category', 'bar', 'value'],
        exampleFixtureId: 'bar-chart-adoption'
    },
    {
        id: 'line-chart',
        intent: 'dataChart',
        variant: 'line',
        family: 'quantitative',
        semanticPattern: 'Continuous trend over an ordered axis',
        promptProfileId: 'line-chart',
        payloadKind: 'quantitative',
        layoutProfileId: 'vega-lite-line',
        rendererOperationId: 'vega-lite-chart',
        rendererTarget: 'vega-lite',
        defaultTarget: 'vega-lite',
        compatibleTargets: ['vega-lite', 'html'],
        visualRoles: ['axis', 'series', 'trend'],
        exampleFixtureId: 'line-chart-render-time'
    },
    {
        id: 'scatter-plot',
        intent: 'dataChart',
        variant: 'scatter',
        family: 'quantitative',
        semanticPattern: 'Correlation and distribution between paired values',
        promptProfileId: 'scatter-plot',
        payloadKind: 'quantitative',
        layoutProfileId: 'vega-lite-scatter',
        rendererOperationId: 'vega-lite-chart',
        rendererTarget: 'vega-lite',
        defaultTarget: 'vega-lite',
        compatibleTargets: ['vega-lite', 'html'],
        visualRoles: ['x-axis', 'y-axis', 'point'],
        exampleFixtureId: 'scatter-plot-quality'
    },
    {
        id: 'architecture',
        intent: 'architecture',
        family: 'engineering',
        semanticPattern: 'System components grouped by boundary and connected by topology',
        promptProfileId: 'architecture',
        payloadKind: 'topology',
        layoutProfileId: 'editable-svg-topology',
        rendererOperationId: 'editable-svg-topology',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['zone', 'component', 'boundary', 'connection', 'focal'],
        exampleFixtureId: 'architecture-platform'
    },
    {
        id: 'current-state',
        intent: 'currentState',
        family: 'engineering',
        semanticPattern: 'Legacy landscape with explicit handoffs and bottlenecks',
        promptProfileId: 'current-state',
        payloadKind: 'topology',
        layoutProfileId: 'editable-svg-current-state',
        rendererOperationId: 'editable-svg-topology',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['phase', 'legacy-component', 'handoff', 'pain-point'],
        exampleFixtureId: 'current-state-legacy-pipeline'
    },
    {
        id: 'integration-topology',
        intent: 'integrationTopology',
        family: 'engineering',
        semanticPattern: 'Sources and consumers connected to a platform core by protocol',
        promptProfileId: 'integration-topology',
        payloadKind: 'topology',
        layoutProfileId: 'editable-svg-integration-topology',
        rendererOperationId: 'editable-svg-topology',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['source', 'platform', 'consumer', 'protocol', 'footer'],
        exampleFixtureId: 'integration-topology-platform'
    },
    {
        id: 'data-flow',
        intent: 'dataFlow',
        family: 'engineering',
        semanticPattern: 'Role-scoped data movement through explicit pipeline stages',
        promptProfileId: 'data-flow',
        payloadKind: 'lane-grid',
        layoutProfileId: 'editable-svg-data-flow',
        rendererOperationId: 'editable-svg-lane-grid',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['lane', 'step', 'payload', 'handoff', 'focal'],
        exampleFixtureId: 'data-flow-platform'
    },
    {
        id: 'access-matrix',
        intent: 'accessMatrix',
        family: 'engineering',
        semanticPattern: 'Role-to-component permission matrix with one critical rule',
        promptProfileId: 'access-matrix',
        payloadKind: 'access-matrix',
        layoutProfileId: 'editable-svg-access-matrix',
        rendererOperationId: 'editable-svg-access-matrix',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['role', 'component', 'permission', 'focal-cell'],
        exampleFixtureId: 'access-matrix-platform'
    },
    {
        id: 'gantt',
        intent: 'gantt',
        family: 'behavior',
        semanticPattern: 'Tasks and milestones positioned on an execution timeline',
        promptProfileId: 'gantt',
        payloadKind: 'schedule',
        layoutProfileId: 'editable-svg-gantt',
        rendererOperationId: 'editable-svg-schedule',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['phase', 'task', 'milestone', 'focal-task'],
        exampleFixtureId: 'gantt-release-plan'
    },
    {
        id: 'layer-stack',
        intent: 'layerStack',
        family: 'structure',
        semanticPattern: 'Ordered abstraction layers with one focal layer',
        promptProfileId: 'layer-stack',
        payloadKind: 'ordered-stack',
        layoutProfileId: 'editable-svg-layer-stack',
        rendererOperationId: 'editable-svg-ordered-stack',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['index', 'layer', 'direction', 'focal-layer'],
        exampleFixtureId: 'layer-stack-platform'
    },
    {
        id: 'venn',
        intent: 'setOverlap',
        family: 'structure',
        semanticPattern: 'Overlap between two or three explicit sets',
        promptProfileId: 'venn',
        payloadKind: 'set-overlap',
        layoutProfileId: 'editable-svg-set-overlap',
        rendererOperationId: 'editable-svg-set-overlap',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['set', 'intersection', 'focal-intersection'],
        exampleFixtureId: 'venn-platform'
    },
    {
        id: 'ranked-funnel',
        intent: 'rankedFunnel',
        family: 'structure',
        semanticPattern: 'Ranked hierarchy or conversion drop-off',
        promptProfileId: 'ranked-funnel',
        payloadKind: 'ranked-segments',
        layoutProfileId: 'editable-svg-ranked-segments',
        rendererOperationId: 'editable-svg-ranked-segments',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['segment', 'rank', 'drop-off', 'focal-segment'],
        exampleFixtureId: 'ranked-funnel-release'
    },
    {
        id: 'loop',
        intent: 'loop',
        family: 'behavior',
        semanticPattern: 'Reinforcing cycle writing durable state to one hub',
        promptProfileId: 'loop',
        payloadKind: 'cycle',
        layoutProfileId: 'editable-svg-cycle',
        rendererOperationId: 'editable-svg-cycle',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['hub', 'station', 'cycle-edge', 'write-back'],
        exampleFixtureId: 'loop-operating-model'
    },
    {
        id: 'nested',
        intent: 'nested',
        family: 'structure',
        semanticPattern: 'Scope and containment through nested boundaries',
        promptProfileId: 'nested',
        payloadKind: 'nested',
        layoutProfileId: 'editable-svg-nested',
        rendererOperationId: 'editable-svg-nested',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['scope', 'boundary', 'focal-scope'],
        exampleFixtureId: 'nested-scope'
    },
    {
        id: 'tree',
        intent: 'tree',
        family: 'structure',
        semanticPattern: 'Parent-to-child hierarchy',
        promptProfileId: 'tree',
        payloadKind: 'tree',
        layoutProfileId: 'editable-svg-tree',
        rendererOperationId: 'editable-svg-tree',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['root', 'parent', 'child', 'focal'],
        exampleFixtureId: 'tree-ownership'
    },
    {
        id: 'process',
        intent: 'process',
        family: 'behavior',
        semanticPattern: 'Multi-actor staged process with handoffs',
        promptProfileId: 'process',
        payloadKind: 'lane-grid',
        layoutProfileId: 'editable-svg-process',
        rendererOperationId: 'editable-svg-lane-grid',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['actor', 'stage', 'input', 'output', 'handoff'],
        exampleFixtureId: 'process-release'
    },
    {
        id: 'medallion',
        intent: 'medallion',
        family: 'engineering',
        semanticPattern: 'Data quality tiers and promotion paths',
        promptProfileId: 'medallion',
        payloadKind: 'ordered-stack',
        layoutProfileId: 'editable-svg-medallion',
        rendererOperationId: 'editable-svg-ordered-stack',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['tier', 'payload', 'promotion', 'focal-tier'],
        exampleFixtureId: 'medallion-data-quality'
    },
    {
        id: 'high-level',
        intent: 'highLevel',
        family: 'engineering',
        semanticPattern: 'End-to-end platform overview across stack tiers',
        promptProfileId: 'high-level',
        payloadKind: 'topology',
        layoutProfileId: 'editable-svg-high-level',
        rendererOperationId: 'editable-svg-topology',
        rendererTarget: 'editable-html-svg',
        defaultTarget: 'editable-html-svg',
        compatibleTargets: ['editable-html-svg', 'html'],
        visualRoles: ['tier', 'component', 'flow', 'focal'],
        exampleFixtureId: 'high-level-platform'
    }
] as const;

const DIAGRAM_TYPE_BY_ID = new Map(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.id, type]));
const DIAGRAM_TYPES_BY_INTENT = new Map<DiagramIntent, ExecutableDiagramTypeDefinition[]>();
for (const type of EXECUTABLE_DIAGRAM_TYPES) {
    const entries = DIAGRAM_TYPES_BY_INTENT.get(type.intent) ?? [];
    entries.push(type);
    DIAGRAM_TYPES_BY_INTENT.set(type.intent, entries);
}

function assertExecutableDiagramTypeCatalog(): void {
    if (DIAGRAM_TYPE_BY_ID.size !== EXECUTABLE_DIAGRAM_TYPES.length
        || new Set(EXECUTABLE_DIAGRAM_TYPES.map(type => type.layoutProfileId)).size !== EXECUTABLE_DIAGRAM_TYPES.length) {
        throw new Error('Executable diagram types must use unique ids and layout profiles.');
    }
    for (const type of EXECUTABLE_DIAGRAM_TYPES) {
        if (type.defaultTarget !== type.rendererTarget || !type.compatibleTargets.includes(type.defaultTarget)) {
            throw new Error(`Diagram type "${type.id}" has an invalid default render target contract.`);
        }
        if (new Set(type.compatibleTargets).size !== type.compatibleTargets.length) {
            throw new Error(`Diagram type "${type.id}" lists a compatible target more than once.`);
        }
        if (!type.promptProfileId || !type.payloadKind || !type.layoutProfileId) {
            throw new Error(`Diagram type "${type.id}" is missing a profile, payload kind, or layout profile.`);
        }
        if (getDiagramPromptProfile(type.promptProfileId).payloadKind !== type.payloadKind) {
            throw new Error(`Diagram type "${type.id}" does not agree with its prompt profile payload family.`);
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

export function findDiagramType(intent: DiagramIntent, variant?: string): ExecutableDiagramTypeDefinition {
    const candidates = DIAGRAM_TYPES_BY_INTENT.get(intent) ?? [];
    const matches = variant === undefined
        ? candidates
        : candidates.filter(type => type.variant === variant);
    if (matches.length === 0) {
        throw new Error(`No executable diagram catalog type is registered for intent "${intent}".`);
    }
    if (matches.length > 1) {
        throw new Error(`AMBIGUOUS_DIAGRAM_INTENT: intent "${intent}" requires an explicit variant.`);
    }
    return matches[0];
}

export function findDefaultDiagramType(intent: DiagramIntent): ExecutableDiagramTypeDefinition {
    const candidates = DIAGRAM_TYPES_BY_INTENT.get(intent) ?? [];
    const defaultType = candidates.find(type => type.variant === undefined || type.variant === 'auto');
    if (!defaultType) {
        throw new Error(`No default executable diagram catalog type is registered for intent "${intent}".`);
    }
    return defaultType;
}

export function findDiagramTypeByIntent(intent: DiagramIntent): ExecutableDiagramTypeDefinition {
    return findDiagramType(intent);
}
