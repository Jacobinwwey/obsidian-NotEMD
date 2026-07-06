import { CircuitSpec } from '../diagram/adapters/circuitikz/circuitSpec';
import { createCircuitTopologySignature } from '../diagram/adapters/circuitikz/circuitikzExporter';
import { createCircuitikzRepairBrief } from '../diagram/adapters/circuitikz/circuitikzRepairBrief';
import { CircuitikzCompileDiagnosticReport } from '../diagram/adapters/circuitikz/circuitikzDiagnostics';

function createCmosInverterSpec(): CircuitSpec {
    return {
        circuitKind: 'cmos-inverter',
        title: 'CMOS Inverter',
        goldenReferenceId: 'cmos-inverter-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
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
        layoutHints: {
            inputSide: 'left',
            outputSide: 'right',
            routingStyle: 'orthogonal'
        }
    };
}

describe('circuitikz repair brief', () => {
    test('creates a topology-preserving repair brief from render diagnostics', () => {
        const referenceSpec = createCmosInverterSpec();
        const sourceSpec = createCmosInverterSpec();
        sourceSpec.title = 'CMOS inverter with crowded label';
        sourceSpec.layoutHints = {
            inputSide: 'right',
            outputSide: 'left',
            routingStyle: 'orthogonal'
        };
        const diagnostics: CircuitikzCompileDiagnosticReport = {
            ok: false,
            summary: '1 error(s), 0 warning(s)',
            diagnostics: [{
                severity: 'error',
                kind: 'render-svg-label-overlap',
                message: 'Expected SVG render artifact text label overlaps a drawing element: VIN / line',
                excerpt: 'cmos.svg',
                advice: 'Keep topology fixed and move labels away from wires or components before accepting the artifact.'
            }]
        };

        const brief = createCircuitikzRepairBrief({
            referenceSpec,
            sourceSpec,
            diagnostics
        });

        expect(brief).toEqual({
            schemaVersion: 'notemd.circuitikz.repair-brief.v1',
            repairObjective: 'Repair circuitikz layout or labels while preserving the electrical topology exactly.',
            circuitKind: 'cmos-inverter',
            goldenReferenceId: 'cmos-inverter-v1',
            topologySignature: createCircuitTopologySignature(referenceSpec),
            topologyInvariant: {
                allowedChanges: [
                    'title',
                    'component labels',
                    'connection labels',
                    'layout hints',
                    'routing coordinates inside the same golden template'
                ],
                prohibitedChanges: [
                    'circuitKind',
                    'goldenReferenceId',
                    'nets',
                    'component ids',
                    'component types',
                    'component terminals',
                    'connections'
                ]
            },
            sourceSpec,
            diagnostics,
            nextSteps: [
                'Apply the smallest layout or label change that resolves the listed diagnostics.',
                'Re-export with --topology-reference pointing at the original reference spec.',
                'Re-run compile diagnostics and render-smoke checks before accepting the repair.'
            ]
        });
    });

    test('rejects repair briefs whose source spec changes topology', () => {
        const referenceSpec = createCmosInverterSpec();
        const sourceSpec = createCmosInverterSpec();
        sourceSpec.connections = [
            ...sourceSpec.connections,
            { from: 'VDD', to: 'MN.D' }
        ];

        expect(() => createCircuitikzRepairBrief({
            referenceSpec,
            sourceSpec,
            diagnostics: {
                ok: false,
                summary: '1 error(s), 0 warning(s)',
                diagnostics: []
            }
        })).toThrow(/Circuit topology drift detected/);
    });
});
