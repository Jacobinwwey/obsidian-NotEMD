import { ValidationError } from '../../../types';
import {
    CircuitComponent,
    CircuitConnection,
    CircuitSpec,
    isSupportedCircuitComponentType,
    isSupportedCircuitKind,
    SUPPORTED_CIRCUIT_KINDS
} from './circuitSpec';

export interface CircuitSpecValidationResult {
    valid: boolean;
    errors: string[];
}

interface CanonicalCircuitTopology {
    circuitKind: string;
    goldenReferenceId: string;
    nets: string[];
    components: Array<{
        id: string;
        type: string;
        terminals: Array<[string, string]>;
    }>;
    connections: Array<[string, string]>;
}

function normalizeLabel(value: string | undefined, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed || fallback;
}

function normalizeIdentifier(value: string): string {
    return value.trim();
}

function layoutSide(value: 'left' | 'right' | undefined, fallback: 'left' | 'right'): 'left' | 'right' {
    return value ?? fallback;
}

function commonPortX(side: 'left' | 'right'): string {
    return side === 'left' ? '0.8' : '5';
}

function extendedPortX(side: 'left' | 'right'): string {
    return side === 'left' ? '0.8' : '5.2';
}

function canonicalConnection(connection: CircuitConnection): [string, string] {
    const endpoints = [
        normalizeIdentifier(connection.from),
        normalizeIdentifier(connection.to)
    ].sort();
    return [endpoints[0], endpoints[1]];
}

function canonicalCircuitTopology(spec: CircuitSpec): CanonicalCircuitTopology {
    return {
        circuitKind: spec.circuitKind,
        goldenReferenceId: spec.goldenReferenceId,
        nets: [...new Set((spec.nets ?? []).map(normalizeIdentifier).filter(Boolean))].sort(),
        components: (spec.components ?? [])
            .map(component => ({
                id: normalizeIdentifier(component.id),
                type: component.type,
                terminals: Object.entries(component.terminals ?? {})
                    .map(([terminal, net]) => [normalizeIdentifier(terminal), normalizeIdentifier(net)] as [string, string])
                    .sort(([leftTerminal], [rightTerminal]) => leftTerminal.localeCompare(rightTerminal))
            }))
            .sort((left, right) => left.id.localeCompare(right.id)),
        connections: (spec.connections ?? [])
            .map(canonicalConnection)
            .sort(([leftFrom, leftTo], [rightFrom, rightTo]) =>
                `${leftFrom}\u0000${leftTo}`.localeCompare(`${rightFrom}\u0000${rightTo}`)
            )
    };
}

export function createCircuitTopologySignature(spec: CircuitSpec): string {
    assertValidCircuitSpec(spec);
    return JSON.stringify(canonicalCircuitTopology(spec));
}

export function assertCircuitTopologyUnchanged(reference: CircuitSpec, candidate: CircuitSpec): CircuitSpec {
    const referenceSignature = createCircuitTopologySignature(reference);
    const candidateSignature = createCircuitTopologySignature(candidate);
    if (referenceSignature !== candidateSignature) {
        throw new ValidationError(
            'Circuit topology drift detected. Repair candidates may change labels or layout hints, but not circuit kind, golden reference, nets, components, terminals, or connections.',
            'INVALID_INPUT'
        );
    }
    return candidate;
}

function collectComponentIds(components: CircuitComponent[], errors: string[]): Map<string, CircuitComponent> {
    const componentById = new Map<string, CircuitComponent>();

    for (const component of components) {
        const id = component.id?.trim();
        if (!id) {
            errors.push('Circuit component is missing an id.');
            continue;
        }
        if (componentById.has(id)) {
            errors.push(`Circuit component id "${id}" is duplicated.`);
            continue;
        }
        if (!isSupportedCircuitComponentType(component.type)) {
            errors.push(`Circuit component "${id}" uses unsupported type "${String(component.type)}".`);
        }
        if (!component.terminals || Object.keys(component.terminals).length === 0) {
            errors.push(`Circuit component "${id}" is missing terminals.`);
        }
        componentById.set(id, component);
    }

    return componentById;
}

function parseTerminalReference(reference: string): { componentId: string; terminal: string } | null {
    const trimmed = reference.trim();
    const separatorIndex = trimmed.indexOf('.');
    if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
        return null;
    }

    return {
        componentId: trimmed.slice(0, separatorIndex),
        terminal: trimmed.slice(separatorIndex + 1)
    };
}

function validateReference(
    reference: string,
    componentById: Map<string, CircuitComponent>,
    nets: Set<string>,
    errors: string[]
): void {
    const terminalReference = parseTerminalReference(reference);
    if (!terminalReference) {
        if (!nets.has(reference.trim())) {
            errors.push(`Circuit connection references unknown net "${reference}".`);
        }
        return;
    }

    const component = componentById.get(terminalReference.componentId);
    if (!component) {
        errors.push(`Circuit connection references unknown component "${terminalReference.componentId}".`);
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(component.terminals, terminalReference.terminal)) {
        errors.push(
            `Circuit connection references missing terminal "${terminalReference.terminal}" `
            + `on component "${terminalReference.componentId}".`
        );
    }
}

function hasConnection(connections: CircuitConnection[], first: string, second: string): boolean {
    return connections.some(connection =>
        (connection.from === first && connection.to === second)
        || (connection.from === second && connection.to === first)
    );
}

function requireComponent(
    componentById: Map<string, CircuitComponent>,
    id: string,
    type: CircuitComponent['type'],
    errors: string[]
): void {
    const component = componentById.get(id);
    if (!component) {
        errors.push(`Circuit kind requires component "${id}".`);
        return;
    }
    if (component.type !== type) {
        errors.push(`Circuit component "${id}" must use type "${type}".`);
    }
}

function validateCommonSourceTemplate(
    spec: CircuitSpec,
    componentById: Map<string, CircuitComponent>,
    errors: string[]
): void {
    if (spec.goldenReferenceId !== 'common-source-nmos-v1') {
        errors.push('Common-source amplifier requires goldenReferenceId "common-source-nmos-v1".');
    }

    requireComponent(componentById, 'M1', 'nmos', errors);
    requireComponent(componentById, 'RD', 'resistor', errors);

    if (!hasConnection(spec.connections, 'vin', 'M1.G')) {
        errors.push('Common-source amplifier requires vin to connect to M1.G.');
    }
    if (!hasConnection(spec.connections, 'M1.D', 'vout')) {
        errors.push('Common-source amplifier requires M1.D to connect to vout.');
    }
    if (!hasConnection(spec.connections, 'M1.S', 'GND')) {
        errors.push('Common-source amplifier requires M1.S to connect to GND.');
    }
    if (!hasConnection(spec.connections, 'VDD', 'RD.top') || !hasConnection(spec.connections, 'RD.bottom', 'M1.D')) {
        errors.push('Common-source amplifier requires VDD -> RD -> M1.D drain path.');
    }
}

function validateCmosInverterTemplate(
    spec: CircuitSpec,
    componentById: Map<string, CircuitComponent>,
    errors: string[]
): void {
    if (spec.goldenReferenceId !== 'cmos-inverter-v1') {
        errors.push('CMOS inverter requires goldenReferenceId "cmos-inverter-v1".');
    }

    requireComponent(componentById, 'MP', 'pmos', errors);
    requireComponent(componentById, 'MN', 'nmos', errors);

    if (!hasConnection(spec.connections, 'MP.D', 'MN.D')) {
        errors.push('CMOS inverter requires MP.D and MN.D to share the output drain path.');
    }
    if (!hasConnection(spec.connections, 'vin', 'MP.G') || !hasConnection(spec.connections, 'vin', 'MN.G')) {
        errors.push('CMOS inverter requires vin to drive both MP.G and MN.G.');
    }
    if (!hasConnection(spec.connections, 'VDD', 'MP.S')) {
        errors.push('CMOS inverter requires VDD to connect to MP.S.');
    }
    if (!hasConnection(spec.connections, 'MN.S', 'GND')) {
        errors.push('CMOS inverter requires MN.S to connect to GND.');
    }
    if (!hasConnection(spec.connections, 'MP.D', 'vout') || !hasConnection(spec.connections, 'MN.D', 'vout')) {
        errors.push('CMOS inverter requires both transistor drains to connect to vout.');
    }
}

export function validateCircuitSpec(spec: CircuitSpec): CircuitSpecValidationResult {
    const errors: string[] = [];

    if (!isSupportedCircuitKind(spec.circuitKind)) {
        errors.push(
            `Circuit spec uses unsupported circuitKind "${String(spec.circuitKind)}". `
            + `Supported kinds: ${SUPPORTED_CIRCUIT_KINDS.join(', ')}.`
        );
    }

    if (!spec.title?.trim()) {
        errors.push('Circuit spec title is required.');
    }
    if (spec.style?.package !== 'circuitikz') {
        errors.push('Circuit spec style.package must be "circuitikz".');
    }
    if (spec.style?.voltageConvention !== 'american voltages' && spec.style?.voltageConvention !== 'european voltages') {
        errors.push('Circuit spec style.voltageConvention must be "american voltages" or "european voltages".');
    }
    if (spec.layoutHints?.routingStyle && spec.layoutHints.routingStyle !== 'orthogonal') {
        errors.push('CircuitSpec circuitikz prototype only supports orthogonal routing.');
    }

    const nets = new Set((spec.nets ?? []).map(net => net.trim()).filter(Boolean));
    for (const requiredNet of ['VDD', 'GND', 'vin', 'vout']) {
        if (!nets.has(requiredNet)) {
            errors.push(`Circuit spec requires net "${requiredNet}".`);
        }
    }

    const componentById = collectComponentIds(spec.components ?? [], errors);
    for (const connection of spec.connections ?? []) {
        validateReference(connection.from, componentById, nets, errors);
        validateReference(connection.to, componentById, nets, errors);
    }

    if (spec.circuitKind === 'common-source-amplifier') {
        validateCommonSourceTemplate(spec, componentById, errors);
    } else if (spec.circuitKind === 'cmos-inverter') {
        validateCmosInverterTemplate(spec, componentById, errors);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function assertValidCircuitSpec(spec: CircuitSpec): CircuitSpec {
    const result = validateCircuitSpec(spec);
    if (!result.valid) {
        throw new ValidationError(result.errors.join(' '), 'INVALID_INPUT');
    }
    return spec;
}

function renderCommonSourceTemplate(spec: CircuitSpec): string {
    const m1 = spec.components.find(component => component.id === 'M1');
    const rd = spec.components.find(component => component.id === 'RD');
    const m1Label = normalizeLabel(m1?.label, '$M_1$');
    const rdLabel = normalizeLabel(rd?.label, '$R_D$');
    const inputSide = layoutSide(spec.layoutHints?.inputSide, 'left');
    const outputSide = layoutSide(spec.layoutHints?.outputSide, 'right');
    const inputRoute = inputSide === 'left'
        ? `  (M1.G) to [short, -o] (0.8,2.2)
  node[left]{$v_{in}$};`
        : `  (M1.G) to [short] (1.5,2.2)
  to [short] (1.5,1.4)
  to [short, -o] (${extendedPortX(inputSide)},1.4)
  node[${inputSide}]{$v_{in}$};`;

    return `\\usepackage{circuitikz}
\\begin{document}
\\begin{circuitikz}[${spec.style.voltageConvention}]
\\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [R, l=${rdLabel}] (3,3)
  to [short, *-o] (${commonPortX(outputSide)},3) node[${outputSide}]{$v_{out}$}
  (3,3) to [short] (3,2.2)
  node[nmos, anchor=D] (M1) {${m1Label}}
  (M1.S) to [short] (3,0.5)
  node[ground]{}
${inputRoute}
\\draw
  (3,0.5) node[below right]{$S$};
\\end{circuitikz}
\\end{document}
`;
}

function renderCmosInverterTemplate(spec: CircuitSpec): string {
    const mp = spec.components.find(component => component.id === 'MP');
    const mn = spec.components.find(component => component.id === 'MN');
    const mpLabel = normalizeLabel(mp?.label, '$M_P$');
    const mnLabel = normalizeLabel(mn?.label, '$M_N$');
    const inputSide = layoutSide(spec.layoutHints?.inputSide, 'left');
    const outputSide = layoutSide(spec.layoutHints?.outputSide, 'right');
    const inputRoute = inputSide === 'left'
        ? `  (MP.G) to [short] (1.5,3.5)
  (MN.G) to [short] (1.5,2.0)
  (1.5,3.5) to [short] (1.5,2.0)
  to [short, -o] (0.8,2.75)
  node[left]{$v_{in}$};`
        : `  (MP.G) to [short] (1.5,3.5)
  (MN.G) to [short] (1.5,2.0)
  (1.5,3.5) to [short] (1.5,2.0)
  (1.5,2.75) to [short] (1.5,1.2)
  to [short, -o] (${extendedPortX(inputSide)},1.2)
  node[${inputSide}]{$v_{in}$};`;

    return `\\usepackage{circuitikz}
\\begin{document}
\\begin{circuitikz}[${spec.style.voltageConvention}]
\\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [short] (3,4.4)
  node[pmos, anchor=S] (MP) {${mpLabel}}
  (MP.D) to [short] (3,2.75)
  to [short] (3,2.6)
  node[nmos, anchor=D] (MN) {${mnLabel}}
  (MN.S) to [short] (3,0.8)
  node[ground]{};
\\draw
${inputRoute}
\\draw
  (3,2.75) to [short, *-o] (${commonPortX(outputSide)},2.75) node[${outputSide}]{$v_{out}$};
\\end{circuitikz}
\\end{document}
`;
}

export function exportCircuitSpecToCircuitikz(spec: CircuitSpec): string {
    assertValidCircuitSpec(spec);

    switch (spec.circuitKind) {
        case 'common-source-amplifier':
            return renderCommonSourceTemplate(spec);
        case 'cmos-inverter':
            return renderCmosInverterTemplate(spec);
        default:
            throw new ValidationError('Unsupported circuitKind.', 'INVALID_INPUT');
    }
}
