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

function buildPayloadExample(
    intent: DiagramIntent,
    title: string,
    payload: NonNullable<DiagramSpec['payload']>,
    summary?: string
): DiagramSpec {
    return {
        schemaVersion: 2,
        intent,
        title,
        summary,
        nodes: [],
        edges: [],
        payload
    };
}

const REFERENCE_LAYOUT_EXAMPLES: readonly DiagramExampleDefinition[] = [
    {
        typeId: 'bar-chart', fixtureId: 'bar-chart-adoption', title: 'Feature adoption',
        selectionRationale: 'Use for discrete category comparison with one numeric value per category.', sourceIntent: 'dataChart',
        spec: {
            ...buildPayloadExample('dataChart', 'Feature adoption', {
                kind: 'quantitative', chartType: 'bar', series: [{ id: 'adoption', label: 'Adoption', points: [
                    { x: 'Search', y: 82 }, { x: 'Preview', y: 64 }, { x: 'Export', y: 47 }, { x: 'History', y: 31 }
                ] }]
            }),
            dataSeries: [{ id: 'adoption', label: 'Adoption', points: [
                { x: 'Search', y: 82 }, { x: 'Preview', y: 64 }, { x: 'Export', y: 47 }, { x: 'History', y: 31 }
            ] }],
            layoutHints: { chartType: 'bar' }
        }
    },
    {
        typeId: 'line-chart', fixtureId: 'line-chart-render-time', title: 'Render time trend',
        selectionRationale: 'Use for an ordered time or release trend.', sourceIntent: 'dataChart',
        spec: {
            ...buildPayloadExample('dataChart', 'Render time trend', {
                kind: 'quantitative', chartType: 'line', series: [{ id: 'render-time', label: 'Render time', points: [
                    { x: 'v1', y: 22 }, { x: 'v2', y: 19 }, { x: 'v3', y: 16 }, { x: 'v4', y: 12 }
                ] }]
            }),
            dataSeries: [{ id: 'render-time', label: 'Render time', points: [
                { x: 'v1', y: 22 }, { x: 'v2', y: 19 }, { x: 'v3', y: 16 }, { x: 'v4', y: 12 }
            ] }],
            layoutHints: { chartType: 'line' }
        }
    },
    {
        typeId: 'scatter-plot', fixtureId: 'scatter-plot-quality', title: 'Quality and latency',
        selectionRationale: 'Use for paired numeric observations where correlation or outliers matter.', sourceIntent: 'dataChart',
        spec: {
            ...buildPayloadExample('dataChart', 'Quality and latency', {
                kind: 'quantitative', chartType: 'scatter', series: [{ id: 'samples', label: 'Samples', points: [
                    { x: 1, y: 12 }, { x: 2, y: 15 }, { x: 3, y: 18 }, { x: 4, y: 20 }, { x: 5, y: 23 }, { x: 6, y: 29 }
                ] }]
            }),
            dataSeries: [{ id: 'samples', label: 'Samples', points: [
                { x: 1, y: 12 }, { x: 2, y: 15 }, { x: 3, y: 18 }, { x: 4, y: 20 }, { x: 5, y: 23 }, { x: 6, y: 29 }
            ] }],
            layoutHints: { chartType: 'scatter' }
        }
    },
    {
        typeId: 'architecture', fixtureId: 'architecture-platform', title: 'Platform architecture',
        selectionRationale: 'Use for bounded components grouped by trust or system boundary.', sourceIntent: 'architecture',
        spec: buildPayloadExample('architecture', 'Platform architecture', {
            kind: 'topology', zones: [
                { id: 'experience', label: 'Experience', sub: 'public and operator surfaces' },
                { id: 'services', label: 'Services', sub: 'orchestration and policy' },
                { id: 'data', label: 'Data', sub: 'durable state' }
            ],
            nodes: [
                { id: 'web', label: 'Web client', zoneId: 'experience', sub: 'HTTPS', external: true },
                { id: 'api', label: 'API gateway', zoneId: 'services', sub: 'REST / auth', focal: true },
                { id: 'worker', label: 'Worker', zoneId: 'services', sub: 'async jobs' },
                { id: 'store', label: 'Artifact store', zoneId: 'data', sub: 'object + index' },
                { id: 'history', label: 'History index', zoneId: 'data', sub: 'queryable metadata' }
            ],
            edges: [
                { from: 'web', to: 'api', label: 'request', style: 'link' },
                { from: 'api', to: 'worker', label: 'dispatch', style: 'accent' },
                { from: 'worker', to: 'store', label: 'write' },
                { from: 'worker', to: 'history', label: 'record' }
            ]
        }, 'A bounded service topology with one focal integration point.')
    },
    {
        typeId: 'current-state', fixtureId: 'current-state-legacy-pipeline', title: 'Legacy current state',
        selectionRationale: 'Use to expose the before-state landscape, manual handoffs, and bottlenecks.', sourceIntent: 'currentState',
        spec: buildPayloadExample('currentState', 'Legacy current state', {
            kind: 'topology', zones: [
                { id: 'collect', label: 'Collection', sub: 'siloed inputs' },
                { id: 'process', label: 'Processing', sub: 'manual transformation' },
                { id: 'publish', label: 'Dissemination', sub: 'fragile outputs' }
            ],
            nodes: [
                { id: 'forms', label: 'Survey forms', zoneId: 'collect', sub: 'CSV exports' },
                { id: 'drive', label: 'Shared drive', zoneId: 'process', sub: 'no version control', focal: true },
                { id: 'analyst', label: 'Analyst machines', zoneId: 'process', sub: 'copy / paste' },
                { id: 'portal', label: 'Legacy portal', zoneId: 'publish', sub: 'manual bottleneck', focal: true },
                { id: 'partners', label: 'Partner downloads', zoneId: 'publish', sub: 'file handoff', external: true }
            ],
            edges: [
                { from: 'forms', to: 'drive', label: 'CSV', style: 'link' },
                { from: 'drive', to: 'analyst', label: 'COPY', style: 'accent', dashed: true },
                { from: 'analyst', to: 'portal', label: 'XLSX', style: 'accent' },
                { from: 'portal', to: 'partners', label: 'download', style: 'link', dashed: true }
            ]
        }, 'A before-state topology with visible manual friction.')
    },
    {
        typeId: 'integration-topology', fixtureId: 'integration-topology-platform', title: 'Integration topology',
        selectionRationale: 'Use when source systems and consumer surfaces connect to a shared platform by protocol.', sourceIntent: 'integrationTopology',
        spec: buildPayloadExample('integrationTopology', 'Integration topology', {
            kind: 'topology', zones: [
                { id: 'sources', label: 'Sources' },
                { id: 'platform', label: 'Data platform', sub: 'core integration layer' },
                { id: 'consumers', label: 'Consumers' }
            ],
            nodes: [
                { id: 'db', label: 'Databases', zoneId: 'sources', sub: 'JDBC' },
                { id: 'sftp', label: 'SFTP drops', zoneId: 'sources', sub: 'scheduled' },
                { id: 'ingest', label: 'Ingest', zoneId: 'platform', sub: 'NiFi', focal: true },
                { id: 'store', label: 'Object store', zoneId: 'platform', sub: 'S3' },
                { id: 'query', label: 'Query service', zoneId: 'platform', sub: 'SQL' },
                { id: 'bi', label: 'BI reports', zoneId: 'consumers', sub: 'JDBC' },
                { id: 'api', label: 'Public API', zoneId: 'consumers', sub: 'REST' }
            ],
            edges: [
                { from: 'db', to: 'ingest', label: 'JDBC', style: 'link' },
                { from: 'sftp', to: 'ingest', label: 'SFTP', style: 'link' },
                { from: 'ingest', to: 'store', label: 'WRITE', style: 'accent' },
                { from: 'store', to: 'query', label: 'READ' },
                { from: 'query', to: 'bi', label: 'JDBC', style: 'link' },
                { from: 'query', to: 'api', label: 'REST', style: 'link' }
            ],
            footer: [{ id: 'identity', label: 'Identity', sub: 'SSO · group policy' }]
        }, 'A source-to-platform-to-consumer integration surface.')
    },
    {
        typeId: 'data-flow', fixtureId: 'data-flow-platform', title: 'Role-scoped data flow',
        selectionRationale: 'Use for a typed data pipeline where each role owns a stage and payload handoff.', sourceIntent: 'dataFlow',
        spec: buildPayloadExample('dataFlow', 'Role-scoped data flow', {
            kind: 'lane-grid',
            lanes: [{ id: 'admin', label: 'ADMINS' }, { id: 'engineer', label: 'ENGINEERS' }, { id: 'scientist', label: 'SCIENTISTS' }, { id: 'consumer', label: 'CONSUMERS' }],
            steps: [{ id: 'collect', label: 'COLLECT' }, { id: 'store', label: 'STORE' }, { id: 'transform', label: 'TRANSFORM' }, { id: 'analyze', label: 'ANALYZE' }, { id: 'publish', label: 'PUBLISH' }],
            cells: [
                { laneId: 'admin', stepId: 'collect', title: 'Project setup', sub: 'roles', tool: 'console' },
                { laneId: 'admin', stepId: 'store', title: 'Access policy', sub: 'RBAC', tool: 'identity' },
                { laneId: 'engineer', stepId: 'collect', title: 'Source ingest', sub: 'raw files', tool: 'API · SFTP', chips: { out: 'DB' } },
                { laneId: 'engineer', stepId: 'store', title: 'Raw store', sub: 'landing zone', tool: 'object store', chips: { in: 'DB', out: 'DB' } },
                { laneId: 'engineer', stepId: 'transform', title: 'Clean & stage', sub: 'raw → table', tool: 'SQL · ETL', chips: { in: 'DB', out: 'TB' } },
                { laneId: 'scientist', stepId: 'analyze', title: 'Explore & model', sub: 'insights', tool: 'notebook', focal: true, chips: { in: 'TB', out: 'FL' } },
                { laneId: 'scientist', stepId: 'publish', title: 'Publish findings', sub: 'dashboards', tool: 'BI', chips: { in: 'FL', out: 'FL' } },
                { laneId: 'consumer', stepId: 'publish', title: 'Query insights', sub: 'read-only', tool: 'SQL', chips: { in: 'TB', out: 'TB' } }
            ],
            edges: [
                { from: { laneId: 'admin', stepId: 'collect' }, to: { laneId: 'admin', stepId: 'store' }, style: 'muted' },
                { from: { laneId: 'admin', stepId: 'collect' }, to: { laneId: 'engineer', stepId: 'collect' }, style: 'trigger', dashed: true },
                { from: { laneId: 'engineer', stepId: 'collect' }, to: { laneId: 'engineer', stepId: 'store' }, style: 'muted' },
                { from: { laneId: 'engineer', stepId: 'store' }, to: { laneId: 'engineer', stepId: 'transform' }, style: 'muted' },
                { from: { laneId: 'engineer', stepId: 'transform' }, to: { laneId: 'scientist', stepId: 'analyze' }, label: 'anon table', style: 'accent' },
                { from: { laneId: 'scientist', stepId: 'analyze' }, to: { laneId: 'scientist', stepId: 'publish' }, style: 'muted' },
                { from: { laneId: 'scientist', stepId: 'publish' }, to: { laneId: 'consumer', stepId: 'publish' }, style: 'link' }
            ]
        }, 'A bounded pipeline with explicit role and payload transitions.')
    },
    {
        typeId: 'access-matrix', fixtureId: 'access-matrix-platform', title: 'Platform access matrix',
        selectionRationale: 'Use to audit which roles can perform which actions on platform components.', sourceIntent: 'accessMatrix',
        spec: buildPayloadExample('accessMatrix', 'Platform access matrix', {
            kind: 'access-matrix',
            roles: [{ id: 'admin', label: 'Administrators', code: 'DL-ADMINS' }, { id: 'engineer', label: 'Engineers', code: 'DL-ENG' }, { id: 'scientist', label: 'Scientists', code: 'DL-SCI' }, { id: 'consumer', label: 'Consumers', code: 'DL-CON' }],
            components: [{ id: 'identity', label: 'Identity service', hint: 'SSO' }, { id: 'raw', label: 'Raw bucket', hint: 'S3' }, { id: 'staging', label: 'Staging catalog', hint: 'SQL' }, { id: 'aggregate', label: 'Aggregated catalog', hint: 'SQL' }, { id: 'notebook', label: 'Notebook runtime', hint: 'compute' }],
            cells: [
                { row: 0, col: 0, value: 'Admin', level: 'full' }, { row: 0, col: 1, value: 'Login', level: 'read' }, { row: 0, col: 2, value: 'Login', level: 'read' }, { row: 0, col: 3, value: 'Login', level: 'read' },
                { row: 1, col: 0, value: 'Full', level: 'full' }, { row: 1, col: 1, value: 'R/W', level: 'rw' }, { row: 1, col: 2, value: 'No access', level: 'none' }, { row: 1, col: 3, value: 'No access', level: 'none' },
                { row: 2, col: 0, value: 'Full', level: 'full' }, { row: 2, col: 1, value: 'R/W', level: 'rw' }, { row: 2, col: 2, value: 'Read', level: 'read' }, { row: 2, col: 3, value: 'No access', level: 'none' },
                { row: 3, col: 0, value: 'Full', level: 'full' }, { row: 3, col: 1, value: 'R/W', level: 'rw' }, { row: 3, col: 2, value: 'SELECT', level: 'read' }, { row: 3, col: 3, value: 'SELECT only', level: 'read', focal: true, sub: 'sole consumer access' },
                { row: 4, col: 0, value: 'Full', level: 'full' }, { row: 4, col: 1, value: 'R/W', level: 'rw' }, { row: 4, col: 2, value: 'R/W', level: 'rw' }, { row: 4, col: 3, value: 'No access', level: 'none' }
            ],
            noneLabel: 'No access'
        }, 'A closed-vocabulary permission contract with one critical cell.')
    },
    {
        typeId: 'gantt', fixtureId: 'gantt-release-plan', title: 'Release plan',
        selectionRationale: 'Use for task overlap and milestones on a bounded delivery timeline.', sourceIntent: 'gantt',
        spec: buildPayloadExample('gantt', 'Release plan', {
            kind: 'schedule', phases: [{ id: 'foundation', label: 'FOUNDATION' }, { id: 'delivery', label: 'DELIVERY' }],
            tasks: [
                { id: 'contract', label: 'Canonical contract', phaseId: 'foundation', start: 'W1', end: 'W3' },
                { id: 'renderer', label: 'Native renderer', phaseId: 'foundation', start: 'W2', end: 'W5', focal: true },
                { id: 'preview', label: 'Preview and gallery', phaseId: 'delivery', start: 'W4', end: 'W6' },
                { id: 'release', label: 'Release gate', phaseId: 'delivery', start: 'W6', end: 'W7' }
            ],
            milestones: [{ id: 'gate', label: 'consumer gate', date: 'W5' }]
        }, 'A schedule with parallel work and one release gate.')
    },
    {
        typeId: 'layer-stack', fixtureId: 'layer-stack-platform', title: 'Platform layers',
        selectionRationale: 'Use for ordered abstraction levels such as application, services, and storage.', sourceIntent: 'layerStack',
        spec: buildPayloadExample('layerStack', 'Platform layers', { kind: 'ordered-stack', direction: 'up', layers: [
            { id: 'storage', label: 'Storage', sub: 'durable state' }, { id: 'data', label: 'Data services', sub: 'query and transform' }, { id: 'runtime', label: 'Runtime', sub: 'orchestration', focal: true }, { id: 'experience', label: 'Experience', sub: 'users and agents' }
        ] }, 'Four abstraction layers with one runtime pivot.')
    },
    {
        typeId: 'venn', fixtureId: 'venn-platform', title: 'Platform fit',
        selectionRationale: 'Use when the explanation depends on overlap between two or three explicit sets.', sourceIntent: 'setOverlap',
        spec: buildPayloadExample('setOverlap', 'Platform fit', { kind: 'set-overlap', sets: [
            { id: 'reliable', label: 'Reliable' }, { id: 'editable', label: 'Editable' }, { id: 'discoverable', label: 'Discoverable' }
        ], intersections: [
            { id: 'core', label: 'Production capability', setIds: ['reliable', 'editable', 'discoverable'], focal: true }, { id: 're', label: 'Evidence', setIds: ['reliable', 'editable'] }
        ] }, 'The useful center is where reliability, editability, and discoverability overlap.')
    },
    {
        typeId: 'ranked-funnel', fixtureId: 'ranked-funnel-release', title: 'Release funnel',
        selectionRationale: 'Use for a ranked hierarchy or conversion drop-off with bounded segments.', sourceIntent: 'rankedFunnel',
        spec: buildPayloadExample('rankedFunnel', 'Release funnel', { kind: 'ranked-segments', orientation: 'funnel', segments: [
            { id: 'ideas', label: 'Ideas', sub: 'captured' }, { id: 'specs', label: 'Specs', sub: 'approved' }, { id: 'builds', label: 'Builds', sub: 'verified' }, { id: 'releases', label: 'Releases', sub: 'published', focal: true }
        ] }, 'A bounded conversion funnel from idea to published release.')
    },
    {
        typeId: 'loop', fixtureId: 'loop-operating-model', title: 'Operating loop',
        selectionRationale: 'Use for a true reinforcing cycle whose stations write durable state to one hub.', sourceIntent: 'loop',
        spec: buildPayloadExample('loop', 'Operating loop', { kind: 'cycle', hub: { label: 'Shared record', sub: 'one durable operating memory' }, stations: [
            { id: 'capture', label: 'Capture', sub: 'signals' }, { id: 'research', label: 'Research', sub: 'evidence' }, { id: 'decide', label: 'Decide', sub: 'approve', focal: true }, { id: 'act', label: 'Act', sub: 'ship' }, { id: 'measure', label: 'Measure', sub: 'outcomes' }, { id: 'learn', label: 'Learn', sub: 'update playbook' }
        ] }, 'The final station returns to capture and updates shared state.')
    },
    {
        typeId: 'nested', fixtureId: 'nested-scope', title: 'Scope cascade',
        selectionRationale: 'Use for containment boundaries such as policy, workspace, and artifact scope.', sourceIntent: 'nested',
        spec: buildPayloadExample('nested', 'Scope cascade', { kind: 'nested', levels: [
            { id: 'org', label: 'Organization', sub: 'global policy' }, { id: 'workspace', label: 'Workspace', sub: 'team defaults' }, { id: 'project', label: 'Project', sub: 'local contract', focal: true }, { id: 'artifact', label: 'Artifact', sub: 'single output' }
        ] }, 'Containment narrows from global policy to one artifact.')
    },
    {
        typeId: 'tree', fixtureId: 'tree-ownership', title: 'Ownership tree',
        selectionRationale: 'Use for a single-root parent-to-child hierarchy.', sourceIntent: 'tree',
        spec: buildPayloadExample('tree', 'Ownership tree', { kind: 'tree', nodes: [
            { id: 'platform', label: 'Platform', focal: true }, { id: 'authoring', label: 'Authoring', parentId: 'platform' }, { id: 'rendering', label: 'Rendering', parentId: 'platform' }, { id: 'delivery', label: 'Delivery', parentId: 'platform' }, { id: 'preview', label: 'Preview', parentId: 'rendering' }, { id: 'export', label: 'Export', parentId: 'delivery' }
        ] }, 'A single ownership root with bounded child branches.')
    },
    {
        typeId: 'process', fixtureId: 'process-release', title: 'Release process',
        selectionRationale: 'Use for a staged multi-actor process where handoffs matter more than payload types.', sourceIntent: 'process',
        spec: buildPayloadExample('process', 'Release process', { kind: 'lane-grid', lanes: [{ id: 'author', label: 'AUTHORING' }, { id: 'review', label: 'REVIEW' }, { id: 'delivery', label: 'DELIVERY' }], steps: [{ id: 'draft', label: 'DRAFT' }, { id: 'review', label: 'REVIEW' }, { id: 'build', label: 'BUILD' }, { id: 'publish', label: 'PUBLISH' }], cells: [
            { laneId: 'author', stepId: 'draft', title: 'Write spec', sub: 'contract' }, { laneId: 'review', stepId: 'review', title: 'Review', sub: 'quality gate', focal: true }, { laneId: 'delivery', stepId: 'build', title: 'Build', sub: 'artifact' }, { laneId: 'delivery', stepId: 'publish', title: 'Publish', sub: 'mainline' }
        ], edges: [
            { from: { laneId: 'author', stepId: 'draft' }, to: { laneId: 'review', stepId: 'review' }, style: 'accent', label: 'handoff' }, { from: { laneId: 'review', stepId: 'review' }, to: { laneId: 'delivery', stepId: 'build' }, style: 'muted' }, { from: { laneId: 'delivery', stepId: 'build' }, to: { laneId: 'delivery', stepId: 'publish' }, style: 'muted' }
        ] }, 'A process view separates authoring, review, and delivery ownership.')
    },
    {
        typeId: 'medallion', fixtureId: 'medallion-data-quality', title: 'Data quality tiers',
        selectionRationale: 'Use for ordered data quality tiers with explicit promotion semantics.', sourceIntent: 'medallion',
        spec: buildPayloadExample('medallion', 'Data quality tiers', { kind: 'ordered-stack', direction: 'down', layers: [
            { id: 'raw', label: 'Raw', sub: 'landed source' }, { id: 'clean', label: 'Clean', sub: 'validated', focal: true }, { id: 'curated', label: 'Curated', sub: 'joined and documented' }, { id: 'aggregate', label: 'Aggregate', sub: 'consumer-ready' }, { id: 'archive', label: 'Archive', sub: 'retention' }
        ] }, 'A medallion-style quality stack with one analytical pivot.')
    },
    {
        typeId: 'high-level', fixtureId: 'high-level-platform', title: 'High-level platform',
        selectionRationale: 'Use for a bounded end-to-end overview before drilling into topology detail.', sourceIntent: 'highLevel',
        spec: buildPayloadExample('highLevel', 'High-level platform', { kind: 'topology', zones: [
            { id: 'experience', label: 'Experience' }, { id: 'services', label: 'Services' }, { id: 'data', label: 'Data' }, { id: 'governance', label: 'Governance' }
        ], nodes: [
            { id: 'users', label: 'Users', zoneId: 'experience', external: true }, { id: 'api', label: 'API', zoneId: 'services', focal: true }, { id: 'jobs', label: 'Jobs', zoneId: 'services' }, { id: 'store', label: 'Store', zoneId: 'data' }, { id: 'policy', label: 'Policy', zoneId: 'governance' }
        ], edges: [
            { from: 'users', to: 'api', style: 'link' }, { from: 'api', to: 'jobs', style: 'accent' }, { from: 'jobs', to: 'store' }, { from: 'policy', to: 'api', style: 'trigger', dashed: true }
        ] }, 'A compact end-to-end platform overview.')
    }
];

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
    },
    ...REFERENCE_LAYOUT_EXAMPLES
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
