import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import { CircuitSpec } from '../../diagram/adapters/circuitikz/circuitSpec';
import {
    exportCircuitSpecToCircuitikz,
    validateCircuitSpec
} from '../../diagram/adapters/circuitikz/circuitikzExporter';
import { ValidationError } from '../../types';
import { DiagramRenderer, RenderArtifact } from '../types';

export const NOTEMD_CIRCUITIKZ_PREVIEW_SVG_RENDERER_VERSION = 'notemd-circuitikz-preview-svg@0.1.0';

type Point = {
    x: number;
    y: number;
};

type SvgFragment = string;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeMathLabel(value: string): string {
    return value
        .replace(/^\$|\$$/g, '')
        .replace(/\\bar\{([^}]+)\}/g, '$1_bar')
        .replace(/\\/g, '');
}

function componentLabel(spec: CircuitSpec, id: string, fallback: string): string {
    return normalizeMathLabel(spec.components.find(component => component.id === id)?.label ?? fallback);
}

function line(start: Point, end: Point, extra = ''): SvgFragment {
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"${extra} />`;
}

function wire(points: Point[]): SvgFragment {
    return `<polyline points="${points.map(point => `${point.x},${point.y}`).join(' ')}" />`;
}

function text(value: string, at: Point, extra = ''): SvgFragment {
    return `<text x="${at.x}" y="${at.y}"${extra}>${escapeHtml(value)}</text>`;
}

function port(label: string, at: Point, side: 'left' | 'right' | 'top' | 'bottom' = 'right'): SvgFragment {
    const textOffset = {
        left: { x: -12, y: 4, anchor: 'end' },
        right: { x: 12, y: 4, anchor: 'start' },
        top: { x: 0, y: -10, anchor: 'middle' },
        bottom: { x: 0, y: 18, anchor: 'middle' }
    }[side];

    return `<circle cx="${at.x}" cy="${at.y}" r="4" class="notemd-circuit-port" />
        ${text(label, { x: at.x + textOffset.x, y: at.y + textOffset.y }, ` text-anchor="${textOffset.anchor}" class="notemd-circuit-label"`)}
    `;
}

function junction(at: Point): SvgFragment {
    return `<circle cx="${at.x}" cy="${at.y}" r="4" class="notemd-circuit-junction" />`;
}

function ground(at: Point): SvgFragment {
    return `<g class="notemd-circuit-ground">
        ${line({ x: at.x, y: at.y - 18 }, at)}
        ${line({ x: at.x - 18, y: at.y }, { x: at.x + 18, y: at.y })}
        ${line({ x: at.x - 12, y: at.y + 8 }, { x: at.x + 12, y: at.y + 8 })}
        ${line({ x: at.x - 6, y: at.y + 16 }, { x: at.x + 6, y: at.y + 16 })}
    </g>`;
}

function vdd(at: Point): SvgFragment {
    return `<g class="notemd-circuit-vdd">
        ${line(at, { x: at.x, y: at.y + 18 })}
        ${text('VDD', { x: at.x, y: at.y - 8 }, ' text-anchor="middle" class="notemd-circuit-label"')}
    </g>`;
}

function resistor(id: string, at: Point, label: string): SvgFragment {
    const top = { x: at.x, y: at.y - 46 };
    const bottom = { x: at.x, y: at.y + 46 };
    const zigzag = [
        `${at.x},${at.y - 30}`,
        `${at.x - 14},${at.y - 20}`,
        `${at.x + 14},${at.y}`,
        `${at.x - 14},${at.y + 20}`,
        `${at.x},${at.y + 30}`
    ].join(' ');

    return `<g id="${escapeHtml(id)}" class="notemd-circuit-component notemd-circuit-resistor" data-component-id="${escapeHtml(id)}">
        ${line(top, { x: at.x, y: at.y - 30 })}
        <polyline points="${zigzag}" />
        ${line({ x: at.x, y: at.y + 30 }, bottom)}
        ${text(label, { x: at.x + 28, y: at.y + 4 }, ' class="notemd-circuit-label"')}
    </g>`;
}

function mos(id: string, type: 'pmos' | 'nmos', at: Point, label: string): SvgFragment {
    const bubble = type === 'pmos'
        ? `<circle cx="${at.x - 26}" cy="${at.y}" r="5" class="notemd-circuit-mos-bubble" />`
        : '';

    return `<g id="${escapeHtml(id)}" class="notemd-circuit-component notemd-circuit-mos notemd-circuit-${type}" data-component-id="${escapeHtml(id)}">
        <rect x="${at.x - 22}" y="${at.y - 40}" width="44" height="80" rx="6" />
        ${line({ x: at.x, y: at.y - 62 }, { x: at.x, y: at.y - 40 })}
        ${line({ x: at.x, y: at.y + 40 }, { x: at.x, y: at.y + 62 })}
        ${line({ x: at.x - 48, y: at.y }, { x: at.x - 22, y: at.y })}
        ${bubble}
        ${text(label, { x: at.x + 34, y: at.y + 5 }, ' class="notemd-circuit-label"')}
    </g>`;
}

function connectionLabel(value: string, at: Point): SvgFragment {
    return text(value, at, ' text-anchor="middle" class="notemd-circuit-net-label"');
}

function renderCommonSource(spec: CircuitSpec): SvgFragment {
    const m1Label = componentLabel(spec, 'M1', 'M1');
    const rdLabel = componentLabel(spec, 'RD', 'RD');

    return `
        ${vdd({ x: 360, y: 78 })}
        ${resistor('RD', { x: 360, y: 170 }, rdLabel)}
        ${line({ x: 360, y: 216 }, { x: 360, y: 258 })}
        ${mos('M1', 'nmos', { x: 360, y: 320 }, m1Label)}
        ${ground({ x: 360, y: 416 })}
        ${wire([{ x: 104, y: 320 }, { x: 312, y: 320 }])}
        ${port('v_{in}', { x: 104, y: 320 }, 'left')}
        ${wire([{ x: 360, y: 236 }, { x: 604, y: 236 }])}
        ${junction({ x: 360, y: 236 })}
        ${port('v_{out}', { x: 604, y: 236 }, 'right')}
        ${connectionLabel('common-source-amplifier', { x: 360, y: 488 })}
    `;
}

function renderCmosInverter(spec: CircuitSpec): SvgFragment {
    const mpLabel = componentLabel(spec, 'MP', 'MP');
    const mnLabel = componentLabel(spec, 'MN', 'MN');

    return `
        ${vdd({ x: 360, y: 72 })}
        ${mos('MP', 'pmos', { x: 360, y: 178 }, mpLabel)}
        ${line({ x: 360, y: 90 }, { x: 360, y: 116 })}
        ${line({ x: 360, y: 240 }, { x: 360, y: 270 })}
        ${mos('MN', 'nmos', { x: 360, y: 332 }, mnLabel)}
        ${ground({ x: 360, y: 428 })}
        ${wire([{ x: 106, y: 255 }, { x: 206, y: 255 }, { x: 206, y: 178 }, { x: 312, y: 178 }])}
        ${wire([{ x: 206, y: 255 }, { x: 206, y: 332 }, { x: 312, y: 332 }])}
        ${port('v_{in}', { x: 106, y: 255 }, 'left')}
        ${wire([{ x: 360, y: 255 }, { x: 604, y: 255 }])}
        ${junction({ x: 360, y: 255 })}
        ${port('v_{out}', { x: 604, y: 255 }, 'right')}
    `;
}

function renderCmosBuffer(spec: CircuitSpec): SvgFragment {
    const mp1Label = componentLabel(spec, 'MP1', 'MP1');
    const mn1Label = componentLabel(spec, 'MN1', 'MN1');
    const mp2Label = componentLabel(spec, 'MP2', 'MP2');
    const mn2Label = componentLabel(spec, 'MN2', 'MN2');

    return `
        ${vdd({ x: 260, y: 72 })}
        ${vdd({ x: 500, y: 72 })}
        ${mos('MP1', 'pmos', { x: 260, y: 178 }, mp1Label)}
        ${mos('MN1', 'nmos', { x: 260, y: 332 }, mn1Label)}
        ${mos('MP2', 'pmos', { x: 500, y: 178 }, mp2Label)}
        ${mos('MN2', 'nmos', { x: 500, y: 332 }, mn2Label)}
        ${line({ x: 260, y: 240 }, { x: 260, y: 270 })}
        ${line({ x: 500, y: 240 }, { x: 500, y: 270 })}
        ${ground({ x: 260, y: 428 })}
        ${ground({ x: 500, y: 428 })}
        ${wire([{ x: 84, y: 255 }, { x: 132, y: 255 }, { x: 132, y: 178 }, { x: 212, y: 178 }])}
        ${wire([{ x: 132, y: 255 }, { x: 132, y: 332 }, { x: 212, y: 332 }])}
        ${port('v_{in}', { x: 84, y: 255 }, 'left')}
        ${wire([{ x: 260, y: 255 }, { x: 382, y: 255 }, { x: 382, y: 178 }, { x: 452, y: 178 }])}
        ${wire([{ x: 382, y: 255 }, { x: 382, y: 332 }, { x: 452, y: 332 }])}
        ${junction({ x: 260, y: 255 })}
        ${connectionLabel('v_{mid}', { x: 382, y: 244 })}
        ${wire([{ x: 500, y: 255 }, { x: 652, y: 255 }])}
        ${junction({ x: 500, y: 255 })}
        ${port('v_{out}', { x: 652, y: 255 }, 'right')}
    `;
}

function renderTransmissionGate(spec: CircuitSpec): SvgFragment {
    const mpLabel = componentLabel(spec, 'MP', 'MP');
    const mnLabel = componentLabel(spec, 'MN', 'MN');

    return `
        ${port('v_{in}', { x: 118, y: 260 }, 'left')}
        ${wire([{ x: 118, y: 260 }, { x: 240, y: 260 }, { x: 240, y: 196 }])}
        ${wire([{ x: 240, y: 260 }, { x: 240, y: 324 }])}
        ${mos('MP', 'pmos', { x: 330, y: 196 }, mpLabel)}
        ${mos('MN', 'nmos', { x: 330, y: 324 }, mnLabel)}
        ${wire([{ x: 330, y: 258 }, { x: 500, y: 258 }, { x: 500, y: 196 }])}
        ${wire([{ x: 500, y: 258 }, { x: 500, y: 324 }])}
        ${port('v_{out}', { x: 610, y: 258 }, 'right')}
        ${wire([{ x: 500, y: 258 }, { x: 610, y: 258 }])}
        ${wire([{ x: 282, y: 196 }, { x: 330, y: 128 }, { x: 378, y: 196 }])}
        ${wire([{ x: 282, y: 324 }, { x: 330, y: 392 }, { x: 378, y: 324 }])}
        ${port('phi_bar', { x: 330, y: 112 }, 'top')}
        ${port('phi', { x: 330, y: 410 }, 'bottom')}
    `;
}

function renderCmosNand2(spec: CircuitSpec): SvgFragment {
    const mpaLabel = componentLabel(spec, 'MPA', 'MPA');
    const mpbLabel = componentLabel(spec, 'MPB', 'MPB');
    const mnaLabel = componentLabel(spec, 'MNA', 'MNA');
    const mnbLabel = componentLabel(spec, 'MNB', 'MNB');

    return `
        ${vdd({ x: 360, y: 64 })}
        ${wire([{ x: 360, y: 82 }, { x: 360, y: 112 }, { x: 268, y: 112 }, { x: 268, y: 140 }])}
        ${wire([{ x: 360, y: 112 }, { x: 452, y: 112 }, { x: 452, y: 140 }])}
        ${mos('MPA', 'pmos', { x: 268, y: 202 }, mpaLabel)}
        ${mos('MPB', 'pmos', { x: 452, y: 202 }, mpbLabel)}
        ${wire([{ x: 268, y: 264 }, { x: 452, y: 264 }, { x: 604, y: 264 }])}
        ${port('v_{out}', { x: 604, y: 264 }, 'right')}
        ${mos('MNA', 'nmos', { x: 360, y: 326 }, mnaLabel)}
        ${mos('MNB', 'nmos', { x: 360, y: 432 }, mnbLabel)}
        ${wire([{ x: 360, y: 264 }, { x: 360, y: 264 }])}
        ${ground({ x: 360, y: 528 })}
        ${wire([{ x: 94, y: 250 }, { x: 178, y: 250 }, { x: 178, y: 202 }, { x: 220, y: 202 }])}
        ${wire([{ x: 178, y: 250 }, { x: 178, y: 326 }, { x: 312, y: 326 }])}
        ${port('v_A', { x: 94, y: 250 }, 'left')}
        ${wire([{ x: 94, y: 354 }, { x: 204, y: 354 }, { x: 204, y: 202 }, { x: 404, y: 202 }])}
        ${wire([{ x: 204, y: 354 }, { x: 204, y: 432 }, { x: 312, y: 432 }])}
        ${port('v_B', { x: 94, y: 354 }, 'left')}
    `;
}

function renderCmosNor2(spec: CircuitSpec): SvgFragment {
    const mpaLabel = componentLabel(spec, 'MPA', 'MPA');
    const mpbLabel = componentLabel(spec, 'MPB', 'MPB');
    const mnaLabel = componentLabel(spec, 'MNA', 'MNA');
    const mnbLabel = componentLabel(spec, 'MNB', 'MNB');

    return `
        ${vdd({ x: 360, y: 64 })}
        ${mos('MPA', 'pmos', { x: 360, y: 156 }, mpaLabel)}
        ${mos('MPB', 'pmos', { x: 360, y: 262 }, mpbLabel)}
        ${wire([{ x: 360, y: 218 }, { x: 360, y: 200 }])}
        ${wire([{ x: 360, y: 324 }, { x: 360, y: 342 }, { x: 604, y: 342 }])}
        ${port('v_{out}', { x: 604, y: 342 }, 'right')}
        ${mos('MNA', 'nmos', { x: 268, y: 420 }, mnaLabel)}
        ${mos('MNB', 'nmos', { x: 452, y: 420 }, mnbLabel)}
        ${wire([{ x: 360, y: 342 }, { x: 268, y: 358 }, { x: 268, y: 358 }])}
        ${wire([{ x: 360, y: 342 }, { x: 452, y: 358 }, { x: 452, y: 358 }])}
        ${wire([{ x: 268, y: 482 }, { x: 452, y: 482 }, { x: 360, y: 482 }])}
        ${ground({ x: 360, y: 528 })}
        ${wire([{ x: 92, y: 232 }, { x: 190, y: 232 }, { x: 190, y: 156 }, { x: 312, y: 156 }])}
        ${wire([{ x: 190, y: 232 }, { x: 190, y: 420 }, { x: 220, y: 420 }])}
        ${port('v_A', { x: 92, y: 232 }, 'left')}
        ${wire([{ x: 92, y: 322 }, { x: 214, y: 322 }, { x: 214, y: 262 }, { x: 312, y: 262 }])}
        ${wire([{ x: 214, y: 322 }, { x: 214, y: 420 }, { x: 404, y: 420 }])}
        ${port('v_B', { x: 92, y: 322 }, 'left')}
    `;
}

function renderCircuitBody(spec: CircuitSpec): SvgFragment {
    switch (spec.circuitKind) {
        case 'common-source-amplifier':
            return renderCommonSource(spec);
        case 'cmos-inverter':
            return renderCmosInverter(spec);
        case 'cmos-buffer':
            return renderCmosBuffer(spec);
        case 'cmos-transmission-gate':
            return renderTransmissionGate(spec);
        case 'cmos-nand2':
            return renderCmosNand2(spec);
        case 'cmos-nor2':
            return renderCmosNor2(spec);
        default:
            return '';
    }
}

function renderCircuitMetadata(spec: CircuitSpec): SvgFragment {
    const componentSummary = spec.components
        .map(component => `${component.id}:${component.type}`)
        .join('  ');
    return `<g class="notemd-circuit-metadata">
        ${text(spec.title, { x: 56, y: 48 }, ' class="notemd-circuit-title"')}
        ${text(`${spec.circuitKind} / ${spec.goldenReferenceId}`, { x: 56, y: 76 }, ' class="notemd-circuit-subtitle"')}
        ${text(componentSummary, { x: 56, y: 548 }, ' class="notemd-circuit-footnote"')}
    </g>`;
}

export function renderCircuitSpecPreviewSvg(spec: CircuitSpec): string {
    const validation = validateCircuitSpec(spec);
    if (!validation.valid) {
        throw new ValidationError(`CircuitSpec preview validation failed: ${validation.errors.join(' ')}`, 'INVALID_INPUT');
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="580" viewBox="0 0 720 580" role="img" aria-labelledby="notemd-circuit-title notemd-circuit-desc" data-notemd-renderer="${NOTEMD_CIRCUITIKZ_PREVIEW_SVG_RENDERER_VERSION}">
        <title id="notemd-circuit-title">${escapeHtml(spec.title)}</title>
        <desc id="notemd-circuit-desc">${escapeHtml(`${spec.circuitKind} circuitikz preview companion for ${spec.goldenReferenceId}`)}</desc>
        <style>
            .notemd-circuit-canvas { fill: #ffffff; }
            .notemd-circuit-stage { fill: none; stroke: #111827; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
            .notemd-circuit-component rect { fill: #ffffff; stroke: #111827; stroke-width: 2; }
            .notemd-circuit-pmos rect { fill: #fff7ed; }
            .notemd-circuit-nmos rect { fill: #eff6ff; }
            .notemd-circuit-mos-bubble { fill: #ffffff; stroke: #111827; stroke-width: 2; }
            .notemd-circuit-port { fill: #ffffff; stroke: #111827; stroke-width: 2; }
            .notemd-circuit-junction { fill: #111827; stroke: none; }
            .notemd-circuit-label { fill: #111827; font: 600 16px "Segoe UI", Arial, sans-serif; }
            .notemd-circuit-net-label { fill: #334155; font: 600 14px "Segoe UI", Arial, sans-serif; }
            .notemd-circuit-title { fill: #111827; font: 700 24px "Segoe UI", Arial, sans-serif; }
            .notemd-circuit-subtitle { fill: #475569; font: 600 13px "Segoe UI", Arial, sans-serif; }
            .notemd-circuit-footnote { fill: #64748b; font: 12px "Segoe UI", Arial, sans-serif; }
        </style>
        <rect class="notemd-circuit-canvas" x="0" y="0" width="720" height="580" fill="#ffffff" />
        ${renderCircuitMetadata(spec)}
        <g class="notemd-circuit-stage">
            ${renderCircuitBody(spec)}
        </g>
    </svg>`;
}

function resolveCircuitSpec(spec: DiagramSpec): CircuitSpec {
    assertValidDiagramSpec(spec);
    if (spec.intent !== 'circuit' || !spec.circuitSpec) {
        throw new ValidationError('Circuitikz rendering requires DiagramSpec intent "circuit" with a CircuitSpec payload.', 'INVALID_INPUT');
    }
    return spec.circuitSpec;
}

export class CircuitikzRenderer implements DiagramRenderer {
    readonly id = 'circuitikz';
    readonly target = 'circuitikz' as const;

    supports(spec: DiagramSpec): boolean {
        return spec.intent === 'circuit'
            && Boolean(spec.circuitSpec)
            && validateCircuitSpec(spec.circuitSpec as CircuitSpec).valid;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        const circuitSpec = resolveCircuitSpec(spec);
        const content = exportCircuitSpecToCircuitikz(circuitSpec);

        return {
            target: this.target,
            content,
            mimeType: 'text/x-tex',
            sourceIntent: spec.intent,
            previewSvg: {
                content: renderCircuitSpecPreviewSvg(circuitSpec),
                mimeType: 'image/svg+xml'
            }
        };
    }
}
