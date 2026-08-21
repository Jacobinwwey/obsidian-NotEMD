import { inferDiagramIntent } from '../diagram/intent';

describe('diagram intent inference', () => {
    test('infers flowchart intent for procedural notes', () => {
        const markdown = `# Release Checklist

1. Validate manifest version
2. If checks fail, stop the release
3. If checks pass, publish the package
4. Then notify users
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('flowchart');
        expect(result.reasons.join(' ')).toMatch(/step|if|then/i);
    });

    test('infers sequence intent for request-response interactions', () => {
        const markdown = `# API Login Flow

Client sends login request to gateway.
Gateway forwards the request to auth service.
Auth service returns a token response to gateway.
Gateway returns the response to client.
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('sequence');
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('infers dataChart intent for percentage share summaries', () => {
        const markdown = `# Traffic Mix

Organic share: 40%
Paid share: 25%
Referral share: 35%
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/share|percentage/i);
    });

    test('infers dataChart intent for paired numeric comparisons', () => {
        const markdown = `# Latency vs Throughput

Run A: latency 120 ms, throughput 45 req/s
Run B: latency 180 ms, throughput 70 req/s
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/comparison|numeric/i);
    });

    test('infers dataChart intent for ranked issue counts', () => {
        const markdown = `# Top Issues

- Timeouts: 12
- Retries: 7
- Rate limits: 4
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/ranked|numeric/i);
    });

    test('infers circuit intent for CMOS circuit notes', () => {
        const markdown = `# CMOS Inverter

Draw a circuitikz schematic with a PMOS pull-up, NMOS pull-down, VDD, GND, vin, and vout.
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('circuit');
        expect(result.reasons.join(' ')).toMatch(/circuit|cmos|mos/i);
    });

    test('infers timeline intent for dated roadmap notes', () => {
        const result = inferDiagramIntent(`# Delivery roadmap

2026 Q1: discovery milestone
2026 Q2: preview milestone
`);

        expect(result.intent).toBe('timeline');
    });

    test('infers swimlane intent for cross-functional ownership notes', () => {
        const result = inferDiagramIntent(`# Release handoff

This cross-functional swimlane assigns the draft to Authoring, the build to Engineering, and the verification handoff to QA.
`);

        expect(result.intent).toBe('swimlane');
    });

    test('infers quadrant intent for two-axis prioritization notes', () => {
        const result = inferDiagramIntent(`# Priority matrix

Use a 2x2 effort versus impact quadrant for the backlog.
`);

        expect(result.intent).toBe('quadrant');
    });

    test('infers radar intent for explicit multi-axis profile notes', () => {
        const result = inferDiagramIntent(`# Capability profile

Render a radar chart comparing reliability, latency, and cost across the current and target profiles.
`);

        expect(result.intent).toBe('radar');
        expect(result.reasons.join(' ')).toMatch(/radar|profile/i);
    });

    test('infers org-chart intent for explicit ownership hierarchies', () => {
        const result = inferDiagramIntent(`# Support org chart

The support director owns the platform team and the incident response team.
Each team has a direct owner and a reporting structure with escalation paths.
`);

        expect(result.intent).toBe('orgChart');
        expect(result.reasons.join(' ')).toMatch(/org|report|ownership/i);
    });

    test.each([
        ['architecture', 'Show an architecture diagram with trust boundaries and service topology.'],
        ['currentState', 'Document the legacy IT current-state before the platform migration.'],
        ['integrationTopology', 'Map the integration topology from source systems to consumers.'],
        ['dataFlow', 'Render a typed data flow diagram across role-scoped pipeline stages.'],
        ['accessMatrix', 'Create an RBAC permission matrix for who can access what.'],
        ['gantt', 'Create a Gantt task schedule for the release.'],
        ['layerStack', 'Show the platform as an abstraction layer stack.'],
        ['setOverlap', 'Use a Venn set overlap for the three capabilities.'],
        ['rankedFunnel', 'Show the conversion funnel from idea to release.'],
        ['loop', 'Show the reinforcing operating loop and shared state.'],
        ['nested', 'Show nested scope boundaries from organization to artifact.'],
        ['tree', 'Show the parent-to-child tree hierarchy.'],
        ['process', 'Create a staged handoff process diagram.'],
        ['medallion', 'Show medallion data-quality tiers.'],
        ['highLevel', 'Create a high-level platform overview.']
    ] as const)('infers explicit reference layout intent %s', (intent, markdown) => {
        expect(inferDiagramIntent(markdown).intent).toBe(intent);
    });

    test('falls back to mindmap for general hierarchical notes', () => {
        const markdown = `# Distributed Systems

## Consistency
- Strong consistency
- Eventual consistency

## Availability
- Fault tolerance
- Replication
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('mindmap');
    });
});
