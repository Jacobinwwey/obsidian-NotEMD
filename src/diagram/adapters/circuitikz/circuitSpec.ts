export const SUPPORTED_CIRCUIT_KINDS = [
    'common-source-amplifier',
    'cmos-inverter'
] as const;

export type CircuitKind = typeof SUPPORTED_CIRCUIT_KINDS[number];

export const SUPPORTED_CIRCUIT_COMPONENT_TYPES = [
    'nmos',
    'pmos',
    'resistor'
] as const;

export type CircuitComponentType = typeof SUPPORTED_CIRCUIT_COMPONENT_TYPES[number];

export type CircuitVoltageConvention = 'american voltages' | 'european voltages';

export interface CircuitComponent {
    id: string;
    type: CircuitComponentType;
    label?: string;
    terminals: Record<string, string>;
}

export interface CircuitConnection {
    from: string;
    to: string;
    label?: string;
}

export interface CircuitStyle {
    package: 'circuitikz';
    voltageConvention: CircuitVoltageConvention;
}

export interface CircuitLayoutHints {
    inputSide?: 'left' | 'right';
    outputSide?: 'left' | 'right';
    routingStyle?: 'orthogonal';
}

export interface CircuitSpec {
    circuitKind: CircuitKind;
    title: string;
    goldenReferenceId: string;
    style: CircuitStyle;
    nets: string[];
    components: CircuitComponent[];
    connections: CircuitConnection[];
    layoutHints?: CircuitLayoutHints;
}

export function isSupportedCircuitKind(value: unknown): value is CircuitKind {
    return typeof value === 'string'
        && (SUPPORTED_CIRCUIT_KINDS as readonly string[]).includes(value);
}

export function isSupportedCircuitComponentType(value: unknown): value is CircuitComponentType {
    return typeof value === 'string'
        && (SUPPORTED_CIRCUIT_COMPONENT_TYPES as readonly string[]).includes(value);
}
