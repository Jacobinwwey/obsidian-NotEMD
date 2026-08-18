import { validateDiagramSpec } from '../diagram/spec';
import { DiagramSpec } from '../diagram/types';

describe('diagram spec validation', () => {
    test('accepts a valid structural diagram spec', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'start', label: 'Start' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [
                { from: 'start', to: 'publish', label: 'continue' }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejects edges that reference missing nodes', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Broken Flow',
            nodes: [{ id: 'start', label: 'Start' }],
            edges: [{ from: 'start', to: 'missing' }]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/missing/i);
    });

    test('requires data series for chart-oriented specs', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Metrics',
            nodes: []
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/data series/i);
    });

    test('rejects unsupported chart layout hints for data charts', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Metrics',
            nodes: [],
            layoutHints: { chartType: 'radar' },
            dataSeries: [
                {
                    id: 'signups',
                    label: 'Signups',
                    points: [
                        { x: 'Week 1', y: 12 },
                        { x: 'Week 2', y: 19 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/unsupported chartType/i);
    });

    test('accepts supported chart layout hints for data charts', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Mix',
            nodes: [],
            layoutHints: { chartType: 'pie' },
            dataSeries: [
                {
                    id: 'traffic',
                    label: 'Traffic',
                    points: [
                        { x: 'Organic', y: 40 },
                        { x: 'Paid', y: 25 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(true);
    });

    test('rejects chart layout hints on non-chart intents', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'start', label: 'Start' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [{ from: 'start', to: 'publish' }],
            layoutHints: { chartType: 'pie' }
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/chartType/i);
        expect(result.errors.join(' ')).toMatch(/dataChart/i);
    });

    test('rejects unsupported diagram intents from model output', () => {
        const spec = {
            intent: 'radarChart',
            title: 'Weekly Metrics',
            nodes: [{ id: 'metrics', label: 'Metrics' }]
        } as unknown as DiagramSpec;

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/unsupported diagram intent/i);
    });

    test('rejects scatter charts when x values are not numeric', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Latency vs Throughput',
            nodes: [],
            layoutHints: { chartType: 'scatter' },
            dataSeries: [
                {
                    id: 'bench',
                    label: 'Benchmark',
                    points: [
                        { x: 'slow', y: 45 },
                        { x: 'fast', y: 70 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/scatter/i);
        expect(result.errors.join(' ')).toMatch(/numeric x/i);
    });

    test('rejects pie charts with multiple series', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Mix',
            nodes: [],
            layoutHints: { chartType: 'pie' },
            dataSeries: [
                {
                    id: 'current',
                    label: 'Current',
                    points: [{ x: 'Organic', y: 40 }]
                },
                {
                    id: 'previous',
                    label: 'Previous',
                    points: [{ x: 'Paid', y: 25 }]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/pie/i);
        expect(result.errors.join(' ')).toMatch(/single data series/i);
    });

    test('rejects pie charts with negative values', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Mix',
            nodes: [],
            layoutHints: { chartType: 'pie' },
            dataSeries: [
                {
                    id: 'traffic',
                    label: 'Traffic',
                    points: [
                        { x: 'Organic', y: 40 },
                        { x: 'Paid', y: -25 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/pie/i);
        expect(result.errors.join(' ')).toMatch(/non-negative/i);
    });

    test('accepts circuit specs without generic flowchart nodes', () => {
        const spec: DiagramSpec = {
            intent: 'circuit',
            title: 'CMOS Inverter',
            nodes: [],
            circuitSpec: {
                circuitKind: 'cmos-inverter',
                title: 'CMOS Inverter',
                goldenReferenceId: 'cmos-inverter-v1',
                style: {
                    package: 'circuitikz',
                    voltageConvention: 'american voltages'
                },
                nets: ['VDD', 'GND', 'vin', 'vout', 'shared_gate', 'shared_drain'],
                components: [
                    {
                        id: 'MP',
                        type: 'pmos',
                        label: '$M_P$',
                        terminals: { S: 'VDD', G: 'shared_gate', D: 'shared_drain' }
                    },
                    {
                        id: 'MN',
                        type: 'nmos',
                        label: '$M_N$',
                        terminals: { D: 'shared_drain', G: 'shared_gate', S: 'GND' }
                    }
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
                layoutHints: {
                    inputSide: 'left',
                    outputSide: 'right',
                    routingStyle: 'orthogonal'
                }
            }
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejects circuit intent without CircuitSpec topology', () => {
        const spec: DiagramSpec = {
            intent: 'circuit',
            title: 'Missing Circuit',
            nodes: []
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/CircuitSpec/i);
    });

    test('validates timeline payloads independently from generic nodes', () => {
        const valid: DiagramSpec = {
            intent: 'timeline',
            title: 'Roadmap',
            nodes: [],
            timelineEvents: [{ id: 'launch', date: '2026 Q3', label: 'Launch', details: ['Public release'] }]
        };
        expect(validateDiagramSpec(valid).valid).toBe(true);

        const invalid = {
            ...valid,
            timelineEvents: [{ id: 'launch', date: '', label: 'Launch' }]
        } as DiagramSpec;
        expect(validateDiagramSpec(invalid).errors.join(' ')).toMatch(/date/i);
    });

    test('rejects swimlane handoffs that escape their lane', () => {
        const result = validateDiagramSpec({
            intent: 'swimlane',
            title: 'Handoff',
            nodes: [],
            swimlaneLanes: [{
                id: 'authoring',
                label: 'Authoring',
                steps: [{ id: 'draft', label: 'Draft', nextStepId: 'publish' }]
            }]
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/outside its lane/i);
    });

    test('enforces bounded quadrant coordinates and axis labels', () => {
        const result = validateDiagramSpec({
            intent: 'quadrant',
            title: 'Priorities',
            nodes: [],
            quadrant: {
                xAxisLabel: ['Low effort', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest', 'Quick wins', 'Defer', 'Evaluate'],
                items: [{ id: 'invalid', label: 'Invalid', x: 1.2, y: 0.5 }]
            }
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/from 0 to 1/i);
    });

    test('accepts a bounded radar payload with complete axis coverage', () => {
        const result = validateDiagramSpec({
            intent: 'radar',
            title: 'Engineering profile',
            nodes: [],
            radarSpec: {
                axes: [
                    { id: 'reliability', label: 'Reliability', max: 10 },
                    { id: 'latency', label: 'Latency', max: 10 },
                    { id: 'cost', label: 'Cost', max: 10 }
                ],
                series: [{
                    id: 'current',
                    label: 'Current',
                    points: [
                        { axisId: 'reliability', value: 8 },
                        { axisId: 'latency', value: 6 },
                        { axisId: 'cost', value: 7 }
                    ]
                }]
            }
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejects radar series with missing or duplicate axis coverage', () => {
        const result = validateDiagramSpec({
            intent: 'radar',
            title: 'Incomplete profile',
            nodes: [],
            radarSpec: {
                axes: [
                    { id: 'a', label: 'A' },
                    { id: 'b', label: 'B' },
                    { id: 'c', label: 'C' }
                ],
                series: [{
                    id: 'current',
                    label: 'Current',
                    points: [
                        { axisId: 'a', value: 1 },
                        { axisId: 'a', value: 2 }
                    ]
                }]
            }
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/exactly one point per axis|duplicated axis/i);
    });

    test('accepts a bounded org chart with one root and reports-to edges', () => {
        const result = validateDiagramSpec({
            intent: 'orgChart',
            title: 'Support ownership',
            nodes: [],
            orgChartSpec: {
                nodes: [
                    { id: 'director', label: 'Support Director', role: 'Front door' },
                    { id: 'platform', label: 'Platform Team', reportsTo: 'director', scope: ['runtime', 'reliability'] },
                    { id: 'incident', label: 'Incident Response', reportsTo: 'director', status: 'planned' }
                ]
            }
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejects org charts with cycles, multiple roots, or too many direct reports', () => {
        const result = validateDiagramSpec({
            intent: 'orgChart',
            title: 'Invalid ownership',
            nodes: [],
            orgChartSpec: {
                nodes: [
                    { id: 'a', label: 'A', reportsTo: 'b' },
                    { id: 'b', label: 'B', reportsTo: 'a' },
                    { id: 'c', label: 'C' },
                    { id: 'd', label: 'D', reportsTo: 'c' },
                    { id: 'e', label: 'E', reportsTo: 'c' },
                    { id: 'f', label: 'F', reportsTo: 'c' },
                    { id: 'g', label: 'G', reportsTo: 'c' },
                    { id: 'h', label: 'H', reportsTo: 'c' },
                    { id: 'i', label: 'I', reportsTo: 'c' }
                ]
            }
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/root|cycle|direct reports/i);
    });
});
