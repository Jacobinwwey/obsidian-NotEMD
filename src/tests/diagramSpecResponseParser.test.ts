import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';

describe('diagram spec response parser', () => {
    test('parses plain JSON responses', () => {
        const raw = JSON.stringify({
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        });

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.intent).toBe('mindmap');
        expect(spec.title).toBe('Platform');
        expect(spec.nodes).toHaveLength(1);
    });

    test('parses fenced json payloads and unwraps diagramSpec envelope', () => {
        const raw = '```json\n{"diagramSpec":{"intent":"flowchart","title":"Release Flow","nodes":[{"id":"validate","label":"Validate"},{"id":"publish","label":"Publish"}],"edges":[{"from":"validate","to":"publish"}]}}\n```';

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.intent).toBe('flowchart');
        expect(spec.edges).toHaveLength(1);
    });

    test('normalizes chart series names into required ids and labels', () => {
        const raw = JSON.stringify({
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    name: 'Weekly Signups',
                    values: [
                        { label: 'Monday', value: '12' },
                        { label: 'Tuesday', value: 18 }
                    ]
                }
            ]
        });

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.dataSeries).toEqual([
            {
                id: 'weekly-signups',
                label: 'Weekly Signups',
                points: [
                    { x: 'Monday', y: 12, series: 'Weekly Signups' },
                    { x: 'Tuesday', y: 18, series: 'Weekly Signups' }
                ]
            }
        ]);
    });

    test('preserves embedded CircuitSpec payloads for circuitikz rendering', () => {
        const raw = JSON.stringify({
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
        });

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.intent).toBe('circuit');
        expect(spec.circuitSpec?.circuitKind).toBe('cmos-inverter');
        expect(spec.circuitSpec?.goldenReferenceId).toBe('cmos-inverter-v1');
    });

    test('round-trips specialized timeline, swimlane, and quadrant payloads', () => {
        const spec = parseDiagramSpecResponse(JSON.stringify({
            intent: 'swimlane',
            title: 'Release handoff',
            nodes: [],
            timelineEvents: [{ id: 'release', date: '2026 Q3', label: 'Release' }],
            swimlaneLanes: [{
                id: 'delivery',
                label: 'Delivery',
                steps: [{ id: 'build', label: 'Build', next: 'publish' }, { id: 'publish', label: 'Publish' }]
            }],
            quadrant: {
                xAxisLabel: ['Low effort', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest', 'Quick wins', 'Defer', 'Evaluate'],
                items: [{ id: 'adapter', label: 'Adapter', x: 0.8, y: 0.7, detail: 'high leverage' }]
            }
        }));

        expect(spec.timelineEvents?.[0]).toMatchObject({ id: 'release', date: '2026 Q3' });
        expect(spec.swimlaneLanes?.[0].steps[0].nextStepId).toBe('publish');
        expect(spec.quadrant?.items[0]).toMatchObject({ id: 'adapter', x: 0.8, y: 0.7 });
    });

    test('normalizes radar axes and series points without collapsing them into dataSeries', () => {
        const spec = parseDiagramSpecResponse(JSON.stringify({
            intent: 'radar',
            title: 'Capability profile',
            nodes: [],
            radarSpec: {
                axes: [
                    { id: 'reliability', label: 'Reliability', max: '10' },
                    { id: 'latency', label: 'Latency' },
                    { id: 'cost', label: 'Cost' }
                ],
                series: [{
                    name: 'Current',
                    values: {
                        reliability: '8',
                        latency: 6,
                        cost: 7
                    }
                }]
            }
        }));

        expect(spec.intent).toBe('radar');
        expect(spec.dataSeries).toEqual([]);
        expect(spec.radarSpec?.axes[0]).toMatchObject({ id: 'reliability', label: 'Reliability', max: 10 });
        expect(spec.radarSpec?.series[0]).toMatchObject({ id: 'current', label: 'Current' });
        expect(spec.radarSpec?.series[0].points).toEqual([
            { axisId: 'reliability', value: 8 },
            { axisId: 'latency', value: 6 },
            { axisId: 'cost', value: 7 }
        ]);
    });

    test('normalizes org chart ownership fields into a dedicated payload', () => {
        const spec = parseDiagramSpecResponse(JSON.stringify({
            intent: 'orgChart',
            title: 'Support ownership',
            nodes: [],
            orgChartSpec: {
                people: [
                    { id: 'director', name: 'Support Director', title: 'Front door' },
                    { id: 'platform', name: 'Platform Team', managerId: 'director', scope: 'runtime, reliability' }
                ]
            }
        }));

        expect(spec.intent).toBe('orgChart');
        expect(spec.orgChartSpec?.nodes).toEqual([
            { id: 'director', label: 'Support Director', role: 'Front door', scope: undefined, reportsTo: undefined, status: undefined },
            { id: 'platform', label: 'Platform Team', role: undefined, scope: ['runtime', 'reliability'], reportsTo: 'director', status: undefined }
        ]);
    });

    test('does not duplicate title-only owners into both label and role', () => {
        const spec = parseDiagramSpecResponse(JSON.stringify({
            intent: 'orgChart',
            title: 'Leadership',
            nodes: [],
            orgChartSpec: {
                people: [{ title: 'Chief Technology Officer' }]
            }
        }));

        expect(spec.orgChartSpec?.nodes[0]).toMatchObject({
            label: 'Chief Technology Officer',
            role: undefined
        });
    });

    test('throws when no valid json object can be extracted', () => {
        expect(() => parseDiagramSpecResponse('not valid json')).toThrow(/Unable to parse DiagramSpec/i);
    });
});
