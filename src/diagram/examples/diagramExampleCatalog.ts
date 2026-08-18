import type { DiagramSpec } from '../types';
import {
    EXECUTABLE_DIAGRAM_TYPES,
    getExecutableDiagramType
} from '../diagramTypeCatalog';
import type { DiagramCatalogTypeId, DiagramIntent } from '../types';
import type { RenderArtifact, RenderOptions } from '../../rendering/types';
import { DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE } from './drawnixKnowledgeMapExamples';

export interface DiagramExampleDefinition {
    typeId: DiagramCatalogTypeId;
    fixtureId: string;
    title: string;
    selectionRationale: string;
    sourceIntent: DiagramIntent;
    spec: DiagramSpec;
}

export interface DiagramExampleArtifactRenderer {
    render(spec: DiagramSpec, options: RenderOptions): Promise<RenderArtifact>;
}

const CMOS_INVERTER_EXAMPLE: DiagramSpec = {
    intent: 'circuit',
    title: 'CMOS Inverter',
    nodes: [],
    circuitSpec: {
        circuitKind: 'cmos-inverter',
        title: 'CMOS Inverter',
        goldenReferenceId: 'cmos-inverter-v1',
        style: { package: 'circuitikz', voltageConvention: 'american voltages' },
        nets: ['VDD', 'GND', 'vin', 'vout', 'shared_gate', 'shared_drain'],
        components: [
            { id: 'MP', type: 'pmos', label: '$M_P$', terminals: { S: 'VDD', G: 'shared_gate', D: 'shared_drain' } },
            { id: 'MN', type: 'nmos', label: '$M_N$', terminals: { D: 'shared_drain', G: 'shared_gate', S: 'GND' } }
        ],
        connections: [
            { from: 'VDD', to: 'MP.S' },
            { from: 'MP.D', to: 'MN.D' },
            { from: 'MN.S', to: 'GND' },
            { from: 'vin', to: 'MP.G' },
            { from: 'vin', to: 'MN.G' },
            { from: 'MP.D', to: 'vout' },
            { from: 'MN.D', to: 'vout' }
        ],
        layoutHints: { inputSide: 'left', outputSide: 'right', routingStyle: 'orthogonal' }
    }
};

const EXECUTABLE_DIAGRAM_EXAMPLES: readonly DiagramExampleDefinition[] = [
    {
        typeId: 'mermaid-mindmap',
        fixtureId: 'mermaid-mindmap-basics',
        title: 'Research themes',
        selectionRationale: 'Use for a single topic hierarchy that readers inspect as a tree.',
        sourceIntent: 'mindmap',
        spec: {
            intent: 'mindmap',
            title: 'Research themes',
            nodes: [{
                id: 'research',
                label: 'Research',
                children: [
                    { id: 'methods', label: 'Methods', children: [{ id: 'evaluation', label: 'Evaluation' }] },
                    { id: 'evidence', label: 'Evidence' }
                ]
            }]
        }
    },
    {
        typeId: 'drawnix-knowledge-map',
        fixtureId: 'drawnix-knowledge-map-architecture',
        title: 'Diagram delivery architecture',
        selectionRationale: 'Use when hierarchy and material cross-branch relations must remain editable.',
        sourceIntent: 'drawnixMindmap',
        spec: DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE
    },
    {
        typeId: 'flowchart',
        fixtureId: 'flowchart-release',
        title: 'Release decision',
        selectionRationale: 'Use for an ordered process with an explicit decision point.',
        sourceIntent: 'flowchart',
        spec: {
            intent: 'flowchart',
            title: 'Release decision',
            nodes: [
                { id: 'build', label: 'Build' },
                { id: 'tests', label: 'Tests' },
                { id: 'release', label: 'Release' }
            ],
            edges: [
                { from: 'build', to: 'tests' },
                { from: 'tests', to: 'release', label: 'pass' }
            ]
        }
    },
    {
        typeId: 'sequence',
        fixtureId: 'sequence-request',
        title: 'Artifact request',
        selectionRationale: 'Use when order between independent participants matters.',
        sourceIntent: 'sequence',
        spec: {
            intent: 'sequence',
            title: 'Artifact request',
            nodes: [
                { id: 'user', label: 'User' },
                { id: 'plugin', label: 'Plugin' },
                { id: 'renderer', label: 'Renderer' }
            ],
            edges: [
                { from: 'user', to: 'plugin', label: 'generate' },
                { from: 'plugin', to: 'renderer', label: 'render' },
                { from: 'renderer', to: 'plugin', label: 'artifact' }
            ]
        }
    },
    {
        typeId: 'state',
        fixtureId: 'state-lifecycle',
        title: 'Artifact lifecycle',
        selectionRationale: 'Use when a system changes among named states.',
        sourceIntent: 'stateDiagram',
        spec: {
            intent: 'stateDiagram',
            title: 'Artifact lifecycle',
            nodes: [
                { id: 'draft', label: 'Draft' },
                { id: 'validated', label: 'Validated' },
                { id: 'published', label: 'Published' }
            ],
            edges: [
                { from: 'draft', to: 'validated', label: 'validate' },
                { from: 'validated', to: 'published', label: 'publish' }
            ]
        }
    },
    {
        typeId: 'class',
        fixtureId: 'class-domain',
        title: 'Diagram domain',
        selectionRationale: 'Use for type-level ownership and association.',
        sourceIntent: 'classDiagram',
        spec: {
            intent: 'classDiagram',
            title: 'Diagram domain',
            nodes: [
                { id: 'spec', label: 'DiagramSpec' },
                { id: 'renderer', label: 'DiagramRenderer' }
            ],
            edges: [{ from: 'spec', to: 'renderer', label: 'renders with' }]
        }
    },
    {
        typeId: 'entity-relationship',
        fixtureId: 'entity-relationship-schema',
        title: 'Artifact schema',
        selectionRationale: 'Use when entity attributes and cardinality carry the explanation.',
        sourceIntent: 'erDiagram',
        spec: {
            intent: 'erDiagram',
            title: 'Artifact schema',
            nodes: [
                { id: 'artifact', label: 'Artifact', children: [{ id: 'artifact-id', label: 'id', kind: 'uuid' }] },
                { id: 'panel', label: 'Panel', children: [{ id: 'panel-id', label: 'id', kind: 'uuid' }] }
            ],
            edges: [{ from: 'artifact', to: 'panel', relation: 'one-to-many', label: 'contains' }]
        }
    },
    {
        typeId: 'canvas-map',
        fixtureId: 'canvas-map-domains',
        title: 'Diagram domains',
        selectionRationale: 'Use for a spatial overview of related domains.',
        sourceIntent: 'canvasMap',
        spec: {
            intent: 'canvasMap',
            title: 'Diagram domains',
            nodes: [
                { id: 'authoring', label: 'Authoring' },
                { id: 'rendering', label: 'Rendering' },
                { id: 'delivery', label: 'Delivery' }
            ],
            edges: [
                { from: 'authoring', to: 'rendering' },
                { from: 'rendering', to: 'delivery' }
            ]
        }
    },
    {
        typeId: 'data-chart',
        fixtureId: 'data-chart-trend',
        title: 'Rendering trend',
        selectionRationale: 'Use only when the source provides values suitable for comparison.',
        sourceIntent: 'dataChart',
        spec: {
            intent: 'dataChart',
            title: 'Rendering trend',
            nodes: [],
            dataSeries: [{
                id: 'render-time',
                label: 'Render time',
                points: [
                    { x: 'baseline', y: 12 },
                    { x: 'board', y: 16 },
                    { x: 'presentation', y: 19 }
                ]
            }],
            layoutHints: { chartType: 'line' }
        }
    },
    {
        typeId: 'radar-chart',
        fixtureId: 'radar-capability-profile',
        title: 'Capability profile',
        selectionRationale: 'Use when several comparable dimensions form a bounded multi-axis profile.',
        sourceIntent: 'radar',
        spec: {
            intent: 'radar',
            title: 'Capability profile',
            summary: 'Current and target capability scores across five dimensions.',
            nodes: [],
            radarSpec: {
                axes: [
                    { id: 'reliability', label: 'Reliability', max: 10 },
                    { id: 'latency', label: 'Latency', max: 10 },
                    { id: 'operability', label: 'Operability', max: 10 },
                    { id: 'cost', label: 'Cost', max: 10 },
                    { id: 'coverage', label: 'Coverage', max: 10 }
                ],
                series: [
                    {
                        id: 'current',
                        label: 'Current',
                        points: [
                            { axisId: 'reliability', value: 7 },
                            { axisId: 'latency', value: 5 },
                            { axisId: 'operability', value: 6 },
                            { axisId: 'cost', value: 8 },
                            { axisId: 'coverage', value: 6 }
                        ]
                    },
                    {
                        id: 'target',
                        label: 'Target',
                        points: [
                            { axisId: 'reliability', value: 9 },
                            { axisId: 'latency', value: 8 },
                            { axisId: 'operability', value: 9 },
                            { axisId: 'cost', value: 7 },
                            { axisId: 'coverage', value: 9 }
                        ]
                    }
                ]
            }
        }
    },
    {
        typeId: 'org-chart',
        fixtureId: 'org-chart-support-ownership',
        title: 'Support ownership',
        selectionRationale: 'Use when the reader needs accountable owners, reporting paths, and visible coverage gaps.',
        sourceIntent: 'orgChart',
        spec: {
            intent: 'orgChart',
            title: 'Support ownership',
            summary: 'A bounded ownership hierarchy with one front door and two accountable teams.',
            nodes: [],
            orgChartSpec: {
                nodes: [
                    {
                        id: 'director',
                        label: 'Support Director',
                        role: 'Front door',
                        scope: ['triage', 'escalation']
                    },
                    {
                        id: 'platform',
                        label: 'Platform Team',
                        role: 'Runtime owner',
                        scope: ['reliability', 'deployments'],
                        reportsTo: 'director'
                    },
                    {
                        id: 'incident',
                        label: 'Incident Response',
                        role: 'Escalation owner',
                        scope: ['incidents', 'postmortems'],
                        reportsTo: 'director',
                        status: 'planned'
                    }
                ]
            }
        }
    },
    {
        typeId: 'timeline',
        fixtureId: 'timeline-roadmap',
        title: 'Delivery roadmap',
        selectionRationale: 'Use for dated milestones where sequence and timing are the primary meaning.',
        sourceIntent: 'timeline',
        spec: {
            intent: 'timeline',
            title: 'Delivery roadmap',
            nodes: [],
            timelineEvents: [
                { id: 'discovery', date: '2024 Q1', label: 'Discovery', details: ['Define the contract'] },
                { id: 'preview', date: '2024 Q2', label: 'Preview', details: ['Ship deterministic examples'] },
                { id: 'release', date: '2024 Q3', label: 'Release' }
            ]
        }
    },
    {
        typeId: 'swimlane',
        fixtureId: 'swimlane-release',
        title: 'Release handoff',
        selectionRationale: 'Use when multiple owners hand work to one another across a process.',
        sourceIntent: 'swimlane',
        spec: {
            intent: 'swimlane',
            title: 'Release handoff',
            nodes: [],
            swimlaneLanes: [
                {
                    id: 'authoring',
                    label: 'Authoring',
                    steps: [
                        { id: 'draft', label: 'Draft spec', nextStepId: 'review' },
                        { id: 'review', label: 'Review contract' }
                    ]
                },
                {
                    id: 'delivery',
                    label: 'Delivery',
                    steps: [
                        { id: 'build', label: 'Build artifact', nextStepId: 'publish' },
                        { id: 'publish', label: 'Publish release' }
                    ]
                }
            ]
        }
    },
    {
        typeId: 'quadrant',
        fixtureId: 'quadrant-priorities',
        title: 'Priority matrix',
        selectionRationale: 'Use for bounded two-axis prioritization with comparable item positions.',
        sourceIntent: 'quadrant',
        spec: {
            intent: 'quadrant',
            title: 'Priority matrix',
            nodes: [],
            quadrant: {
                xAxisLabel: ['Low effort', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest', 'Quick wins', 'Defer', 'Evaluate'],
                items: [
                    { id: 'adapter', label: 'Adapter registry', x: 0.78, y: 0.84, detail: 'high leverage' },
                    { id: 'docs', label: 'Docs gallery', x: 0.32, y: 0.68 },
                    { id: 'cleanup', label: 'Cleanup pass', x: 0.24, y: 0.28 }
                ]
            }
        }
    },
    {
        typeId: 'circuit',
        fixtureId: 'circuit-cmos-inverter',
        title: 'CMOS inverter',
        selectionRationale: 'Use for electrical topology expressed through supported circuit templates.',
        sourceIntent: 'circuit',
        spec: CMOS_INVERTER_EXAMPLE
    }
];

function assertExecutableExampleCatalog(): void {
    const examplesByType = new Map(EXECUTABLE_DIAGRAM_EXAMPLES.map(example => [example.typeId, example]));
    if (examplesByType.size !== EXECUTABLE_DIAGRAM_TYPES.length) {
        throw new Error('Executable diagram example fixtures must use unique type identifiers.');
    }

    for (const type of EXECUTABLE_DIAGRAM_TYPES) {
        const example = examplesByType.get(type.id);
        if (!example || example.fixtureId !== type.exampleFixtureId || example.sourceIntent !== type.intent) {
            throw new Error(`Executable diagram type "${type.id}" is missing its owned example fixture.`);
        }
    }
}

export function getExecutableDiagramExamples(): readonly DiagramExampleDefinition[] {
    assertExecutableExampleCatalog();
    return EXECUTABLE_DIAGRAM_EXAMPLES;
}

/** Runs the fixture through the same target selection users receive. */
export async function renderExecutableDiagramExample(
    example: DiagramExampleDefinition,
    renderer: DiagramExampleArtifactRenderer
): Promise<RenderArtifact> {
    const type = getExecutableDiagramType(example.typeId);
    if (example.fixtureId !== type.exampleFixtureId || example.sourceIntent !== type.intent) {
        throw new Error(`Diagram example "${example.fixtureId}" does not match type "${example.typeId}".`);
    }
    return renderer.render(example.spec, { target: type.rendererTarget });
}
