import {
    assertCircuitTopologyUnchanged,
    assertValidCircuitSpec,
    createCircuitTopologySignature,
    exportCircuitSpecToCircuitikz,
    validateCircuitSpec
} from '../diagram/adapters/circuitikz/circuitikzExporter';
import { CircuitSpec } from '../diagram/adapters/circuitikz/circuitSpec';

function createCommonSourceSpec(): CircuitSpec {
    return {
        circuitKind: 'common-source-amplifier',
        title: 'Common Source Amplifier',
        goldenReferenceId: 'common-source-nmos-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'vin', 'vout', 'drain', 'source'],
        components: [
            { id: 'M1', type: 'nmos', label: '$M_1$', terminals: { D: 'drain', G: 'vin', S: 'source' } },
            { id: 'RD', type: 'resistor', label: '$R_D$', terminals: { top: 'VDD', bottom: 'drain' } }
        ],
        connections: [
            { from: 'VDD', to: 'RD.top' },
            { from: 'RD.bottom', to: 'M1.D' },
            { from: 'M1.D', to: 'vout' },
            { from: 'M1.S', to: 'GND' },
            { from: 'vin', to: 'M1.G' }
        ],
        layoutHints: {
            inputSide: 'left',
            outputSide: 'right',
            routingStyle: 'orthogonal'
        }
    };
}

function createCmosInverterSpec(): CircuitSpec {
    return {
        circuitKind: 'cmos-inverter',
        title: 'CMOS Inverter',
        goldenReferenceId: 'cmos-inverter-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'vin', 'vout', 'p_source', 'n_source', 'shared_gate', 'shared_drain'],
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

describe('circuitikz exporter', () => {
    test('validates and exports the common-source golden reference template deterministically', () => {
        const spec = createCommonSourceSpec();

        expect(validateCircuitSpec(spec)).toEqual({ valid: true, errors: [] });
        expect(exportCircuitSpecToCircuitikz(spec)).toBe(`\\usepackage{circuitikz}
\\begin{document}
\\begin{circuitikz}[american voltages]
\\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [R, l=$R_D$] (3,3)
  to [short, *-o] (5,3) node[right]{$v_{out}$}
  (3,3) to [short] (3,2.2)
  node[nmos, anchor=D] (M1) {$M_1$}
  (M1.S) to [short] (3,0.5)
  node[ground]{}
  (M1.G) to [short, -o] (0.8,2.2)
  node[left]{$v_{in}$};
\\draw
  (3,0.5) node[below right]{$S$};
\\end{circuitikz}
\\end{document}
`);
    });

    test('validates and exports a constrained CMOS inverter template deterministically', () => {
        const spec = createCmosInverterSpec();
        const output = exportCircuitSpecToCircuitikz(spec);

        expect(assertValidCircuitSpec(spec)).toBe(spec);
        expect(output).toContain('\\begin{circuitikz}[american voltages]');
        expect(output).toContain('(3,5) node[vcc]{$V_{DD}$}');
        expect(output).toContain('node[pmos, anchor=S] (MP) {$M_P$}');
        expect(output).toContain('node[nmos, anchor=D] (MN) {$M_N$}');
        expect(output).toContain('(MP.G) to [short] (1.5,3.5)');
        expect(output).toContain('(MN.G) to [short] (1.5,2.0)');
        expect(output).toContain('(3,2.75) to [short, *-o] (5,2.75) node[right]{$v_{out}$};');
        expect(output).toContain('node[left]{$v_{in}$};');
        expect(output).toContain('node[ground]{};');
    });

    test('projects CMOS inverter layout hints into deterministic input and output ports', () => {
        const reference = createCmosInverterSpec();
        const spec = createCmosInverterSpec();
        spec.layoutHints = {
            inputSide: 'right',
            outputSide: 'left',
            routingStyle: 'orthogonal'
        };

        const output = exportCircuitSpecToCircuitikz(spec);

        expect(createCircuitTopologySignature(spec)).toBe(createCircuitTopologySignature(reference));
        expect(output).toContain('(3,2.75) to [short, *-o] (0.8,2.75) node[left]{$v_{out}$};');
        expect(output).toContain('(1.5,2.75) to [short] (1.5,1.2)');
        expect(output).toContain('to [short, -o] (5.2,1.2)');
        expect(output).toContain('node[right]{$v_{in}$};');
    });

    test('projects common-source layout hints into deterministic input and output ports', () => {
        const reference = createCommonSourceSpec();
        const spec = createCommonSourceSpec();
        spec.layoutHints = {
            inputSide: 'right',
            outputSide: 'left',
            routingStyle: 'orthogonal'
        };

        const output = exportCircuitSpecToCircuitikz(spec);

        expect(createCircuitTopologySignature(spec)).toBe(createCircuitTopologySignature(reference));
        expect(output).toContain('to [short, *-o] (0.8,3) node[left]{$v_{out}$}');
        expect(output).toContain('(M1.G) to [short] (1.5,2.2)');
        expect(output).toContain('to [short, -o] (5.2,1.4)');
        expect(output).toContain('node[right]{$v_{in}$};');
    });

    test('rejects CMOS inverter specs that do not lock shared drain topology', () => {
        const spec = createCmosInverterSpec();
        spec.connections = spec.connections.filter(connection => connection.from !== 'MP.D' || connection.to !== 'MN.D');

        expect(validateCircuitSpec(spec).errors).toContain(
            'CMOS inverter requires MP.D and MN.D to share the output drain path.'
        );
        expect(() => exportCircuitSpecToCircuitikz(spec)).toThrow(/MP\.D and MN\.D/);
    });

    test('rejects common-source specs that do not connect the input to the NMOS gate', () => {
        const spec = createCommonSourceSpec();
        spec.connections = spec.connections.filter(connection => connection.to !== 'M1.G');

        expect(validateCircuitSpec(spec).errors).toContain(
            'Common-source amplifier requires vin to connect to M1.G.'
        );
    });

    test('keeps topology signatures stable across layout-only repair changes', () => {
        const reference = createCmosInverterSpec();
        const candidate = createCmosInverterSpec();
        candidate.title = 'CMOS inverter after visual repair';
        candidate.components = candidate.components.map(component => ({
            ...component,
            label: component.id === 'MP' ? '$P_1$' : '$N_1$'
        }));
        candidate.connections = [...candidate.connections].reverse();
        candidate.layoutHints = {
            inputSide: 'right',
            outputSide: 'left',
            routingStyle: 'orthogonal'
        };

        expect(createCircuitTopologySignature(candidate)).toBe(createCircuitTopologySignature(reference));
        expect(assertCircuitTopologyUnchanged(reference, candidate)).toBe(candidate);
    });

    test('rejects repair candidates that add electrical topology even when the template still validates', () => {
        const reference = createCmosInverterSpec();
        const candidate = createCmosInverterSpec();
        candidate.connections = [
            ...candidate.connections,
            { from: 'VDD', to: 'MN.D', label: 'invalid repair short' }
        ];

        expect(validateCircuitSpec(candidate)).toEqual({ valid: true, errors: [] });
        expect(() => assertCircuitTopologyUnchanged(reference, candidate)).toThrow(
            /Circuit topology drift detected/
        );
    });
});
