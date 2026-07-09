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

    test('throws when no valid json object can be extracted', () => {
        expect(() => parseDiagramSpecResponse('not valid json')).toThrow(/Unable to parse DiagramSpec/i);
    });
});
