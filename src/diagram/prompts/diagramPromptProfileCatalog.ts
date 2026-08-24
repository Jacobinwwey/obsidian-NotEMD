import type { DiagramIntent } from '../types';
import type { DiagramPayloadKind } from '../payloads/types';

export interface DiagramPromptProfile {
    id: string;
    version: number;
    intent: DiagramIntent;
    variant?: string;
    payloadKind: DiagramPayloadKind;
    requiredFields: readonly string[];
    hardLimits: readonly string[];
    semanticRules: readonly string[];
    targetRules: readonly string[];
    invalidExamples: readonly string[];
    densityBudget: DiagramDensityBudget;
}

/** Numeric generation budget shared by prompt, validator, and deterministic renderer. */
export interface DiagramDensityBudget {
    maxNodes?: number;
    maxEdges?: number;
    maxZones?: number;
    maxRows?: number;
    maxColumns?: number;
    maxLabelWidth?: number;
    maxSummaryWidth?: number;
    maxLabelLines?: number;
    allowOptionalDetailElision: boolean;
}

const PROFILE_LIMITS = [
    'Keep the payload within the renderer-owned complexity budget.',
    'Use stable ASCII identifiers and reference only declared entities.'
] as const;

const PROFILE_SEEDS: readonly [string, DiagramIntent, DiagramPayloadKind, string][] = [
    ['mermaid-mindmap', 'mindmap', 'legacy', 'one rooted hierarchy; do not add unrelated roots'],
    ['drawnix-knowledge-map', 'drawnixMindmap', 'drawnix-knowledge-map', 'one filename-rooted hierarchy; preserve material cross-branch relations'],
    ['flowchart', 'flowchart', 'legacy', 'represent decisions and outcomes as explicit directed edges'],
    ['sequence', 'sequence', 'legacy', 'preserve participant order and request/response direction'],
    ['state', 'stateDiagram', 'legacy', 'use named states and explicit transitions'],
    ['class', 'classDiagram', 'legacy', 'represent type ownership and associations without implementation detail'],
    ['entity-relationship', 'erDiagram', 'legacy', 'keep entity attributes and cardinality explicit'],
    ['canvas-map', 'canvasMap', 'canvas-map', 'group related concepts spatially without inventing coordinates'],
    ['data-chart', 'dataChart', 'quantitative', 'choose a supported chart variant only when source data supports it'],
    ['radar-chart', 'radar', 'radar', 'use one point per declared axis and one shared scale'],
    ['org-chart', 'orgChart', 'org-chart', 'use dedicated ownership nodes and reportsTo references'],
    ['timeline', 'timeline', 'timeline', 'use dated events in source order'],
    ['swimlane', 'swimlane', 'swimlane', 'use explicit lanes and handoff steps; leave empty cells absent'],
    ['quadrant', 'quadrant', 'quadrant', 'use bounded x/y values in the inclusive 0..1 range'],
    ['circuit', 'circuit', 'circuit', 'use only the constrained CircuitSpec topology contract'],
    ['bar-chart', 'dataChart', 'quantitative', 'emit a quantitative payload with chartType bar and one value per category'],
    ['line-chart', 'dataChart', 'quantitative', 'emit a quantitative payload with chartType line and ordered observations'],
    ['scatter-plot', 'dataChart', 'quantitative', 'emit a quantitative payload with chartType scatter and paired numeric observations'],
    ['architecture', 'architecture', 'topology', 'group components into bounded zones and preserve explicit relationships'],
    ['current-state', 'currentState', 'topology', 'show the before-state landscape and label manual or brittle handoffs'],
    ['integration-topology', 'integrationTopology', 'topology', 'show source/platform/consumer integration surfaces and protocol labels'],
    ['data-flow', 'dataFlow', 'lane-grid', 'use role lanes, pipeline steps, explicit payload chips, and one focal handoff'],
    ['access-matrix', 'accessMatrix', 'access-matrix', 'use roles, components, and closed permission levels full/rw/read/none'],
    ['gantt', 'gantt', 'schedule', 'use explicit task start/end values and do not invent dependency arrows'],
    ['layer-stack', 'layerStack', 'ordered-stack', 'use four to six ordered abstraction layers and one focal layer'],
    ['venn', 'setOverlap', 'set-overlap', 'use two or three named sets and explicit intersection membership'],
    ['ranked-funnel', 'rankedFunnel', 'ranked-segments', 'use four to six ranked segments and only proportional values present in the source'],
    ['loop', 'loop', 'cycle', 'use five to eight stations, one hub, and a true return to the first station'],
    ['nested', 'nested', 'nested', 'use three to five containment levels with consistent scope semantics'],
    ['tree', 'tree', 'tree', 'use exactly one root and stable parent references'],
    ['process', 'process', 'lane-grid', 'use actor lanes and staged handoffs without data-payload assumptions'],
    ['medallion', 'medallion', 'ordered-stack', 'use four to six quality tiers and explicit promotion semantics'],
    ['high-level', 'highLevel', 'topology', 'show a bounded end-to-end platform overview without low-level ports']
];

export const DIAGRAM_PROMPT_PROFILES: readonly DiagramPromptProfile[] = PROFILE_SEEDS.map(([id, intent, payloadKind, semanticRule]) => ({
    id,
    version: 1,
    intent,
    payloadKind,
    requiredFields: ['intent', 'title'],
    hardLimits: PROFILE_LIMITS,
    semanticRules: [semanticRule],
    targetRules: ['The renderer owns geometry, styles, coordinates, and serialization.'],
    invalidExamples: ['Do not emit renderer syntax, arbitrary coordinates, fabricated numeric data, or undeclared relationships.'],
    densityBudget: densityBudgetForPayload(payloadKind)
}));

function densityBudgetForPayload(payloadKind: DiagramPayloadKind): DiagramDensityBudget {
    switch (payloadKind) {
        case 'topology':
            return { maxNodes: 24, maxEdges: 40, maxZones: 6, maxLabelWidth: 240, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'lane-grid':
            return { maxNodes: 24, maxEdges: 24, maxRows: 4, maxColumns: 6, maxLabelWidth: 112, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'access-matrix':
            return { maxRows: 14, maxColumns: 6, maxLabelWidth: 128, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'schedule':
            return { maxNodes: 12, maxLabelWidth: 220, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'ordered-stack':
            return { maxNodes: 6, maxLabelWidth: 560, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'set-overlap':
            return { maxNodes: 3, maxLabelWidth: 150, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'ranked-segments':
            return { maxNodes: 6, maxLabelWidth: 360, maxLabelLines: 1, allowOptionalDetailElision: true };
        case 'cycle':
            return { maxNodes: 8, maxLabelWidth: 118, maxLabelLines: 2, allowOptionalDetailElision: true };
        case 'nested':
            return { maxNodes: 5, maxLabelWidth: 220, maxLabelLines: 1, allowOptionalDetailElision: true };
        case 'tree':
            return { maxNodes: 32, maxLabelWidth: 140, maxLabelLines: 2, allowOptionalDetailElision: true };
        default:
            return { maxNodes: 24, maxEdges: 40, maxLabelWidth: 210, maxLabelLines: 3, allowOptionalDetailElision: true };
    }
}

const PROFILE_BY_ID = new Map(DIAGRAM_PROMPT_PROFILES.map(profile => [profile.id, profile]));

function assertPromptProfileCatalog(): void {
    if (PROFILE_BY_ID.size !== DIAGRAM_PROMPT_PROFILES.length) {
        throw new Error('Diagram prompt profiles must use unique identifiers.');
    }
    for (const profile of DIAGRAM_PROMPT_PROFILES) {
        if (profile.version < 1 || profile.requiredFields.length === 0 || profile.hardLimits.length === 0) {
            throw new Error(`Diagram prompt profile "${profile.id}" is incomplete.`);
        }
    }
}

assertPromptProfileCatalog();

export function getDiagramPromptProfile(id: string): DiagramPromptProfile {
    const profile = PROFILE_BY_ID.get(id);
    if (!profile) {
        throw new Error(`No diagram prompt profile is registered for "${id}".`);
    }
    return profile;
}

export function listDiagramPromptProfiles(): readonly DiagramPromptProfile[] {
    return DIAGRAM_PROMPT_PROFILES;
}
