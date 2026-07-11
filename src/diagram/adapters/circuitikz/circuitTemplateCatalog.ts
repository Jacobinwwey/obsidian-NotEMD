import { CircuitSpec } from './circuitSpec';

type CircuitTemplateFactory = () => CircuitSpec;

interface CircuitTemplateMatcher {
    matches: RegExp;
    create: CircuitTemplateFactory;
}

function findLastMatchIndex(markdown: string, pattern: RegExp): number {
    const globalPattern = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    );
    let lastMatchIndex = -1;
    let match = globalPattern.exec(markdown);

    while (match) {
        lastMatchIndex = match.index;
        match = globalPattern.exec(markdown);
    }

    return lastMatchIndex;
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
    };
}

function createCommonSourceSpec(): CircuitSpec {
    return {
        circuitKind: 'common-source-amplifier',
        title: 'Common-Source NMOS Amplifier',
        goldenReferenceId: 'common-source-nmos-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'vin', 'vout', 'drain'],
        components: [
            {
                id: 'RD',
                type: 'resistor',
                label: '$R_D$',
                terminals: { top: 'VDD', bottom: 'drain' }
            },
            {
                id: 'M1',
                type: 'nmos',
                label: '$M_1$',
                terminals: { D: 'drain', G: 'vin', S: 'GND' }
            }
        ],
        connections: [
            { from: 'VDD', to: 'RD.top' },
            { from: 'RD.bottom', to: 'M1.D' },
            { from: 'M1.D', to: 'vout' },
            { from: 'M1.G', to: 'vin' },
            { from: 'M1.S', to: 'GND' }
        ],
        layoutHints: {
            inputSide: 'left',
            outputSide: 'right',
            routingStyle: 'orthogonal'
        }
    };
}

function createCmosBufferSpec(): CircuitSpec {
    return {
        circuitKind: 'cmos-buffer',
        title: 'CMOS Buffer',
        goldenReferenceId: 'cmos-buffer-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'vin', 'vmid', 'vout'],
        components: [
            {
                id: 'MP1',
                type: 'pmos',
                label: '$M_{P1}$',
                terminals: { S: 'VDD', G: 'vin', D: 'vmid' }
            },
            {
                id: 'MN1',
                type: 'nmos',
                label: '$M_{N1}$',
                terminals: { D: 'vmid', G: 'vin', S: 'GND' }
            },
            {
                id: 'MP2',
                type: 'pmos',
                label: '$M_{P2}$',
                terminals: { S: 'VDD', G: 'vmid', D: 'vout' }
            },
            {
                id: 'MN2',
                type: 'nmos',
                label: '$M_{N2}$',
                terminals: { D: 'vout', G: 'vmid', S: 'GND' }
            }
        ],
        connections: [
            { from: 'VDD', to: 'MP1.S' },
            { from: 'MP1.D', to: 'MN1.D' },
            { from: 'MN1.S', to: 'GND' },
            { from: 'vin', to: 'MP1.G' },
            { from: 'vin', to: 'MN1.G' },
            { from: 'MP1.D', to: 'vmid' },
            { from: 'MN1.D', to: 'vmid' },
            { from: 'VDD', to: 'MP2.S' },
            { from: 'MP2.D', to: 'MN2.D' },
            { from: 'MN2.S', to: 'GND' },
            { from: 'vmid', to: 'MP2.G' },
            { from: 'vmid', to: 'MN2.G' },
            { from: 'MP2.D', to: 'vout' },
            { from: 'MN2.D', to: 'vout' }
        ],
        layoutHints: {
            inputSide: 'left',
            outputSide: 'right',
            routingStyle: 'orthogonal'
        }
    };
}

function createCmosTransmissionGateSpec(): CircuitSpec {
    return {
        circuitKind: 'cmos-transmission-gate',
        title: 'CMOS Transmission Gate',
        goldenReferenceId: 'cmos-transmission-gate-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['vin', 'vout', 'phi', 'phib'],
        components: [
            {
                id: 'MP',
                type: 'pmos',
                label: '$M_P$',
                terminals: { S: 'vin', G: 'phib', D: 'vout' }
            },
            {
                id: 'MN',
                type: 'nmos',
                label: '$M_N$',
                terminals: { D: 'vin', G: 'phi', S: 'vout' }
            }
        ],
        connections: [
            { from: 'vin', to: 'MP.S' },
            { from: 'MP.D', to: 'vout' },
            { from: 'vin', to: 'MN.D' },
            { from: 'MN.S', to: 'vout' },
            { from: 'phib', to: 'MP.G' },
            { from: 'phi', to: 'MN.G' },
            { from: 'MP.S', to: 'MN.D' },
            { from: 'MP.D', to: 'MN.S' }
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
            {
                id: 'MPA',
                type: 'pmos',
                label: '$M_{PA}$',
                terminals: { S: 'VDD', G: 'va', D: 'vout' }
            },
            {
                id: 'MPB',
                type: 'pmos',
                label: '$M_{PB}$',
                terminals: { S: 'VDD', G: 'vb', D: 'vout' }
            },
            {
                id: 'MNA',
                type: 'nmos',
                label: '$M_{NA}$',
                terminals: { D: 'vout', G: 'va', S: 'pull_down_mid' }
            },
            {
                id: 'MNB',
                type: 'nmos',
                label: '$M_{NB}$',
                terminals: { D: 'pull_down_mid', G: 'vb', S: 'GND' }
            }
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

function createCmosNor2Spec(): CircuitSpec {
    return {
        circuitKind: 'cmos-nor2',
        title: 'Two Input CMOS NOR Gate',
        goldenReferenceId: 'cmos-nor2-v1',
        style: {
            package: 'circuitikz',
            voltageConvention: 'american voltages'
        },
        nets: ['VDD', 'GND', 'va', 'vb', 'vout', 'pull_up_mid'],
        components: [
            {
                id: 'MPA',
                type: 'pmos',
                label: '$M_{PA}$',
                terminals: { S: 'VDD', G: 'va', D: 'pull_up_mid' }
            },
            {
                id: 'MPB',
                type: 'pmos',
                label: '$M_{PB}$',
                terminals: { S: 'pull_up_mid', G: 'vb', D: 'vout' }
            },
            {
                id: 'MNA',
                type: 'nmos',
                label: '$M_{NA}$',
                terminals: { D: 'vout', G: 'va', S: 'GND' }
            },
            {
                id: 'MNB',
                type: 'nmos',
                label: '$M_{NB}$',
                terminals: { D: 'vout', G: 'vb', S: 'GND' }
            }
        ],
        connections: [
            { from: 'VDD', to: 'MPA.S' },
            { from: 'MPA.D', to: 'MPB.S' },
            { from: 'MPB.D', to: 'vout' },
            { from: 'MNA.D', to: 'vout' },
            { from: 'MNB.D', to: 'vout' },
            { from: 'MNA.S', to: 'GND' },
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

const CIRCUIT_TEMPLATE_MATCHERS: CircuitTemplateMatcher[] = [
    {
        matches: /\btransmission[\s-]+gate\b|传输门|傳輸閘|傳輸門/i,
        create: createCmosTransmissionGateSpec
    },
    {
        matches: /\bnand(?:2)?\b|与非门|與非閘|與非門/i,
        create: createCmosNand2Spec
    },
    {
        matches: /\bnor(?:2)?\b|或非门|或非閘|或非門/i,
        create: createCmosNor2Spec
    },
    {
        matches: /\bcmos[\s-]*buffer\b|\bbuffer\b|缓冲器|緩衝器/i,
        create: createCmosBufferSpec
    },
    {
        matches: /\bcmos[\s-]*inverter\b|\binverter\b|反相器|反相閘/i,
        create: createCmosInverterSpec
    },
    {
        matches: /\bcommon[\s-]+source\b|共源/i,
        create: createCommonSourceSpec
    }
];

export function resolveCircuitTemplateFromMarkdown(markdown: string): CircuitSpec | null {
    let selectedTemplate: CircuitTemplateMatcher | null = null;
    let selectedMatchIndex = -1;

    for (const template of CIRCUIT_TEMPLATE_MATCHERS) {
        const matchIndex = findLastMatchIndex(markdown, template.matches);
        if (matchIndex < 0) {
            continue;
        }
        if (matchIndex === selectedMatchIndex) {
            return null;
        }
        if (matchIndex > selectedMatchIndex) {
            selectedTemplate = template;
            selectedMatchIndex = matchIndex;
        }
    }

    return selectedTemplate?.create() ?? null;
}
