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
    ['circuit', 'circuit', 'circuit', 'use only the constrained CircuitSpec topology contract']
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
    invalidExamples: ['Do not emit renderer syntax, arbitrary coordinates, fabricated numeric data, or undeclared relationships.']
}));

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
