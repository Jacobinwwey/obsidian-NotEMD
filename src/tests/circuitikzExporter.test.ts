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

function createCmosNand2Spec(): CircuitSpec {
    return {
        circuitKind: 'cmos-nand2',
        title: 'Two Input CMOS NAND Gate',
        goldenReferenceId: 'cmos-nand2-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'va', 'vb', 'vout', 'pull_down_mid'],
        components: [
            { id: 'MPA', type: 'pmos', label: '$M_{PA}$', terminals: { S: 'VDD', G: 'va', D: 'vout' } },
            { id: 'MPB', type: 'pmos', label: '$M_{PB}$', terminals: { S: 'VDD', G: 'vb', D: 'vout' } },
            { id: 'MNA', type: 'nmos', label: '$M_{NA}$', terminals: { D: 'vout', G: 'va', S: 'pull_down_mid' } },
            { id: 'MNB', type: 'nmos', label: '$M_{NB}$', terminals: { D: 'pull_down_mid', G: 'vb', S: 'GND' } }
        ],
        connections: [
            { from: 'VDD', to: 'MPA.S' },
            { from: 'VDD', to: 'MPB.S' },
            { from: 'MPA.D', to: 'vout' },
            { from: 'MPB.D', to: 'vout' },
            { from: 'MNA.D', to: 'vout' },
            { from: 'MNA.S', to: 'MNB.D' },
            { from: 'MNB.S', to: 'GND' },
            { from: 'va', to: 'MPA.G' },
            { from: 'va', to: 'MNA.G' },
            { from: 'vb', to: 'MPB.G' },
            { from: 'vb', to: 'MNB.G' }
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

    test('validates and exports a constrained two-input CMOS NAND template deterministically', () => {
        const spec = createCmosNand2Spec();
        const output = exportCircuitSpecToCircuitikz(spec);

        expect(assertValidCircuitSpec(spec)).toBe(spec);
        expect(output).toContain('\\begin{circuitikz}[american voltages]');
        expect(output).toContain('node[pmos, anchor=S] (MPA) {$M_{PA}$}');
        expect(output).toContain('node[pmos, anchor=S] (MPB) {$M_{PB}$}');
        expect(output).toContain('node[nmos, anchor=D] (MNA) {$M_{NA}$}');
        expect(output).toContain('node[nmos, anchor=D] (MNB) {$M_{NB}$}');
        expect(output).toContain('(MNA.S) to [short] (3,1.8)');
        expect(output).toContain('(MNB.S) to [short] (3,0.7)');
        expect(output).toContain('(3,3.2) to [short, *-o] (5,3.2) node[right]{$v_{out}$};');
        expect(output).toContain('node[left]{$v_A$}');
        expect(output).toContain('node[left]{$v_B$};');
    });

    test('projects CMOS NAND layout hints into deterministic input and output ports', () => {
        const reference = createCmosNand2Spec();
        const spec = createCmosNand2Spec();
        spec.layoutHints = {
            inputSide: 'right',
            outputSide: 'left',
            routingStyle: 'orthogonal'
        };

        const output = exportCircuitSpecToCircuitikz(spec);

        expect(createCircuitTopologySignature(spec)).toBe(createCircuitTopologySignature(reference));
        expect(output).toContain('(3,3.2) to [short, *-o] (0.8,3.2) node[left]{$v_{out}$};');
        expect(output).toContain('to [short, -o] (5.2,4.15)');
        expect(output).toContain('node[right]{$v_A$}');
        expect(output).toContain('to [short, -o] (5.2,1.85)');
        expect(output).toContain('node[right]{$v_B$};');
    });

    test('rejects CMOS NAND specs that do not keep the NMOS pull-down stack in series', () => {
        const spec = createCmosNand2Spec();
        spec.connections = spec.connections.filter(connection => connection.from !== 'MNA.S' || connection.to !== 'MNB.D');

        expect(validateCircuitSpec(spec).errors).toContain(
            'CMOS NAND requires MNA.S to connect to MNB.D for the series pull-down stack.'
        );
        expect(() => exportCircuitSpecToCircuitikz(spec)).toThrow(/series pull-down stack/);
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
