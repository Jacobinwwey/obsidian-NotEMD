import type { DiagramSpec } from '../../types';
import type {
    DiagramAccessMatrixPayload,
    DiagramCyclePayload,
    DiagramLaneGridPayload,
    DiagramNestedPayload,
    DiagramOrderedStackPayload,
    DiagramRankedSegmentsPayload,
    DiagramSchedulePayload,
    DiagramSetOverlapPayload,
    DiagramTopologyPayload,
    DiagramTreePayload
} from '../../payloads/types';
import {
    LAYOUT_SAFETY_VERSION,
    boxesOverlap,
    measureTextWidth,
    wrapMeasuredText
} from '../../layout/layoutSafety';

export const REFERENCE_LAYOUT_RENDERER_VERSION = 'notemd-reference-layouts@1.1.0';

const COLORS = {
    paper: '#f8fafc',
    panel: '#ffffff',
    ink: '#172033',
    // Keep secondary labels above the WCAG AA normal-text threshold on both
    // paper and the light focal/soft fills. A lighter slate looked elegant in
    // isolation but dropped below 4.5:1 once labels were placed on cards.
    muted: '#475569',
    rule: '#cbd5e1',
    soft: '#e2e8f0',
    accent: '#c2410c',
    accentFill: '#fff7ed',
    link: '#1d4ed8',
    success: '#166534',
    warning: '#a16207',
    danger: '#b91c1c'
} as const;

function escapeXml(value: string): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function textBlock(
    value: string | undefined,
    x: number,
    y: number,
    maxChars: number,
    className: string,
    anchor = 'middle',
    maxLines = 2,
    lineHeight = 16
): string {
    if (!value?.trim()) return '';
    const block = wrapMeasuredText(value, Math.max(8, maxChars * 7), maxLines);
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}" data-layout-safety="${LAYOUT_SAFETY_VERSION}"${block.truncated ? ' data-layout-truncated="true"' : ''}>${block.lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

interface LabelPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
}

function placeEdgeLabel(
    label: string,
    x: number,
    baseY: number,
    maxWidth: number,
    occupied: LayoutRectLike[]
): LabelPlacement {
    const width = Math.min(maxWidth, Math.max(20, measureTextWidth(label) + 10));
    const height = 16;
    const candidates = [
        ...[0, -22, 22, -40, 40, -58, 58, -80, 80, -100, 100, -140, 140, -180, 180].map(offset => ({ x, y: baseY + offset })),
        { x: x + width / 2 + 12, y: baseY },
        { x: x - width / 2 - 12, y: baseY }
    ];
    for (const position of candidates) {
        const candidate = { x: position.x - width / 2, y: position.y - height + 3, width, height };
        if (!occupied.some(rect => boxesOverlap(candidate, rect, 4))) {
            occupied.push(candidate);
            return { x: position.x, y: position.y, width, height };
        }
    }
    const fallback = { x: x - width / 2, y: baseY - height + 3, width, height };
    occupied.push(fallback);
    return { x, y: baseY, width, height };
}

type LayoutRectLike = { x: number; y: number; width: number; height: number };

function markerDefinitions(): string {
    return `<defs>
        <marker id="notemd-reference-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="${COLORS.muted}" /></marker>
        <marker id="notemd-reference-arrow-accent" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="${COLORS.accent}" /></marker>
        <marker id="notemd-reference-arrow-link" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="${COLORS.link}" /></marker>
    </defs>`;
}

function commonStyles(): string {
    return `<style>
        .ref-canvas { fill: ${COLORS.paper}; }
        .ref-title { fill: ${COLORS.ink}; font: 700 26px "Segoe UI", Arial, sans-serif; }
        .ref-summary { fill: ${COLORS.muted}; font: 13px "Segoe UI", Arial, sans-serif; }
        .ref-zone { fill: #ffffff; stroke: ${COLORS.rule}; stroke-width: 1; }
        .ref-zone-label { fill: ${COLORS.muted}; font: 700 10px "Segoe UI", Arial, sans-serif; letter-spacing: 1.5px; }
        .ref-node { fill: ${COLORS.panel}; stroke: ${COLORS.rule}; stroke-width: 1.2; }
        .ref-node.focal { fill: ${COLORS.accentFill}; stroke: ${COLORS.accent}; stroke-width: 1.8; }
        .ref-node.external { stroke-dasharray: 5 4; }
        .ref-node-label { fill: ${COLORS.ink}; font: 600 13px "Segoe UI", Arial, sans-serif; }
        .ref-header-label { fill: ${COLORS.panel}; font: 600 11px "Segoe UI", Arial, sans-serif; }
        .ref-node-sub { fill: ${COLORS.muted}; font: 10px Consolas, monospace; }
        .ref-hub-label { fill: ${COLORS.paper}; font: 600 13px "Segoe UI", Arial, sans-serif; }
        .ref-hub-sub { fill: ${COLORS.soft}; font: 10px Consolas, monospace; }
        .ref-edge { fill: none; stroke: ${COLORS.muted}; stroke-width: 1.5; }
        .ref-edge.accent { stroke: ${COLORS.accent}; stroke-width: 2; marker-end: url(#notemd-reference-arrow-accent); }
        .ref-edge.link { stroke: ${COLORS.link}; marker-end: url(#notemd-reference-arrow-link); }
        .ref-edge.trigger { stroke-dasharray: 5 4; }
        .ref-edge.dashed { stroke-dasharray: 5 4; }
        .ref-edge-label { fill: ${COLORS.muted}; font: 10px Consolas, monospace; paint-order: stroke; stroke: ${COLORS.paper}; stroke-width: 5px; }
        .ref-axis { stroke: ${COLORS.rule}; stroke-width: 1; }
        .ref-axis-label { fill: ${COLORS.muted}; font: 10px Consolas, monospace; }
        .ref-chip { fill: ${COLORS.soft}; stroke: ${COLORS.rule}; stroke-width: .7; }
        .ref-chip-text { fill: ${COLORS.ink}; font: 700 8px Consolas, monospace; }
        .ref-focal-fill { fill: ${COLORS.accentFill}; stroke: ${COLORS.accent}; stroke-width: 1.8; }
        .ref-caption { fill: ${COLORS.muted}; font: 10px Consolas, monospace; letter-spacing: .8px; }
    </style>`;
}

function svgRoot(spec: DiagramSpec, width: number, height: number, body: string): string {
    const title = escapeXml(spec.title);
    const description = escapeXml(spec.summary ?? `${spec.intent} diagram`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="notemd-reference-title notemd-reference-desc" data-notemd-renderer="${REFERENCE_LAYOUT_RENDERER_VERSION}" data-layout-safety="${LAYOUT_SAFETY_VERSION}">
        <title id="notemd-reference-title">${title}</title>
        <desc id="notemd-reference-desc">${description}</desc>
        ${commonStyles()}
        ${markerDefinitions()}
        <rect class="ref-canvas" x="0" y="0" width="${width}" height="${height}" />
        ${textBlock(spec.title, 40, 42, Math.max(24, Math.floor((width - 80) / 7)), 'ref-title', 'start', 1, 22)}
        ${spec.summary ? textBlock(spec.summary, 40, 66, Math.max(24, Math.floor((width - 80) / 7)), 'ref-summary', 'start', 2, 14) : ''}
        ${body}
    </svg>`;
}

function nodeClass(node: { focal?: boolean; external?: boolean }): string {
    return ['ref-node', node.focal ? 'focal' : '', node.external ? 'external' : ''].filter(Boolean).join(' ');
}

function measuredNodeHeight(label: string | undefined, sub: string | undefined, width: number, minimum = 62): number {
    const labelLines = wrapMeasuredText(label, Math.max(24, width - 24), 2).lines.length;
    const subLines = sub?.trim() ? wrapMeasuredText(sub, Math.max(24, width - 24), 2).lines.length : 0;
    return Math.max(minimum, 18 + labelLines * 16 + (subLines > 0 ? 5 + subLines * 14 : 0) + 12);
}

function stackedNodeText(
    label: string | undefined,
    sub: string | undefined,
    centerX: number,
    topY: number,
    width: number,
    labelClass = 'ref-node-label',
    subClass = 'ref-node-sub'
): string {
    const maxWidth = Math.max(24, width - 24);
    const labelBlock = wrapMeasuredText(label, maxWidth, 2);
    const labelText = textBlock(label, centerX, topY + 20, Math.max(4, Math.floor(maxWidth / 7)), labelClass, 'middle', 2, 16);
    const subY = topY + 20 + labelBlock.lines.length * 16 + 4;
    const subText = sub?.trim()
        ? textBlock(sub, centerX, subY, Math.max(4, Math.floor(maxWidth / 7)), subClass, 'middle', 2, 14)
        : '';
    return `${labelText}${subText}`;
}

function topologySvg(spec: DiagramSpec, payload: DiagramTopologyPayload): string {
    const width = 1120;
    const margin = 40;
    const gap = 20;
    const zoneWidth = (width - margin * 2 - gap * Math.max(0, payload.zones.length - 1)) / Math.max(1, payload.zones.length);
    const zoneTop = 100;
    const columnsByZone = new Map<string, number>();
    const rowsByZone = new Map<string, number>();
    const nodeHeightsByZone = new Map<string, number[]>();
    const defaultZone = payload.zones[0]?.id;
    for (const zone of payload.zones) {
        const nodes = payload.nodes.filter(node => (node.zoneId && node.zoneId === zone.id) || (!node.zoneId && zone.id === defaultZone));
        const columns = nodes.length > 4 ? 2 : 1;
        columnsByZone.set(zone.id, columns);
        rowsByZone.set(zone.id, Math.ceil(nodes.length / columns));
        const nodeWidth = (zoneWidth - 32 - (columns - 1) * 16) / columns;
        const rowHeights: number[] = [];
        nodes.forEach((node, index) => {
            const row = Math.floor(index / columns);
            rowHeights[row] = Math.max(rowHeights[row] ?? 0, measuredNodeHeight(node.label, node.sub, nodeWidth));
        });
        nodeHeightsByZone.set(zone.id, rowHeights);
    }
    const zoneContentHeights = payload.zones.map(zone => {
        const rowHeights = nodeHeightsByZone.get(zone.id) ?? [];
        return 50 + rowHeights.reduce((total, value) => total + value, 0) + Math.max(0, rowHeights.length - 1) * 20 + 20;
    });
    const zoneHeight = Math.max(payload.footer?.length ? 450 : 500, ...zoneContentHeights);
    const footerHeight = payload.footer?.length ? 86 : 0;
    const height = zoneTop + zoneHeight + footerHeight + 40;
    const zoneMap = new Map(payload.zones.map((zone, index) => [zone.id, {
        ...zone,
        x: margin + index * (zoneWidth + gap),
        y: zoneTop,
        width: zoneWidth,
        height: zoneHeight
    }]));
    const nodeMap = new Map<string, { x: number; y: number; width: number; height: number }>();
    const nodesByZone = new Map<string, typeof payload.nodes>();
    for (const node of payload.nodes) {
        const zoneId = node.zoneId && zoneMap.has(node.zoneId) ? node.zoneId : defaultZone;
        if (!zoneId) continue;
        const list = nodesByZone.get(zoneId) ?? [];
        list.push(node);
        nodesByZone.set(zoneId, list);
    }
    for (const [zoneId, nodes] of nodesByZone) {
        const zone = zoneMap.get(zoneId)!;
        const columns = columnsByZone.get(zoneId) ?? 1;
        const nodeWidth = (zone.width - 32 - (columns - 1) * 16) / columns;
        const rowHeights = nodeHeightsByZone.get(zoneId) ?? [];
        nodes.forEach((node, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const yOffset = rowHeights.slice(0, row).reduce((total, value) => total + value + 20, 0);
            nodeMap.set(node.id, {
                x: zone.x + 16 + column * (nodeWidth + 16),
                y: zone.y + 50 + yOffset,
                width: nodeWidth,
                height: measuredNodeHeight(node.label, node.sub, nodeWidth)
            });
        });
    }
    const zones = payload.zones.map(zone => {
        const box = zoneMap.get(zone.id)!;
        return `<g id="reference-zone-${escapeXml(zone.id)}"><rect class="ref-zone" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="8" /><text class="ref-zone-label" x="${box.x + 16}" y="${box.y + 24}">${escapeXml(zone.label.toUpperCase())}</text>${textBlock(zone.sub, box.x + 16, box.y + 42, 28, 'ref-node-sub', 'start')}</g>`;
    }).join('');
    const occupiedEdgeLabels: LayoutRectLike[] = Array.from(nodeMap.values());
    const edges = payload.edges.map((edge, index) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return '';
        const startX = from.x + from.width;
        const startY = from.y + from.height / 2;
        const endX = to.x;
        const endY = to.y + to.height / 2;
        const midX = Math.round((startX + endX) / 2);
        const style = edge.style === 'accent' ? 'accent' : edge.style === 'link' ? 'link' : edge.style === 'trigger' ? 'trigger' : '';
        const dash = edge.dashed ? ' dashed' : '';
        const marker = style === 'accent' ? ' marker-end="url(#notemd-reference-arrow-accent)"' : style === 'link' ? ' marker-end="url(#notemd-reference-arrow-link)"' : ' marker-end="url(#notemd-reference-arrow)"';
        const edgeLabelPlacement = edge.label
            ? placeEdgeLabel(edge.label, midX, Math.min(startY, endY) - 10, Math.max(80, Math.abs(endX - startX) - 16), occupiedEdgeLabels)
            : undefined;
        const label = edge.label && edgeLabelPlacement
            ? `<text class="ref-edge-label" x="${edgeLabelPlacement.x}" y="${edgeLabelPlacement.y}" text-anchor="middle">${escapeXml(wrapMeasuredText(edge.label, edgeLabelPlacement.width, 1).lines[0])}</text>`
            : '';
        return `<g id="reference-edge-${index}" data-drawio-type="edge" data-drawio-source="${escapeXml(edge.from)}" data-drawio-target="${escapeXml(edge.to)}"><path class="ref-edge ${style}${dash}" d="M ${startX} ${startY} H ${midX - 8} Q ${midX} ${startY} ${midX} ${startY + (endY >= startY ? 8 : -8)} V ${endY - (endY >= startY ? 8 : -8)} Q ${midX} ${endY} ${midX + 8} ${endY} H ${endX}"${marker} />${label}</g>`;
    }).join('');
    const nodes = payload.nodes.map(node => {
        const box = nodeMap.get(node.id);
        if (!box) return '';
        const centerX = box.x + box.width / 2;
        return `<g id="reference-node-${escapeXml(node.id)}" data-drawio-type="node" data-drawio-id="${escapeXml(node.id)}" data-drawio-role="${escapeXml(node.kind ?? 'component')}"><rect class="${nodeClass(node)}" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="6" />${stackedNodeText(node.label, node.sub, centerX, box.y, box.width)}</g>`;
    }).join('');
    const footer = (payload.footer ?? []).map((item, index) => `<g id="reference-footer-${escapeXml(item.id)}"><rect class="ref-chip" x="${margin + index * ((width - margin * 2) / Math.max(1, payload.footer!.length))}" y="${zoneTop + zoneHeight + 30}" width="${(width - margin * 2) / Math.max(1, payload.footer!.length) - 12}" height="48" rx="5" /><text class="ref-node-label" x="${margin + index * ((width - margin * 2) / Math.max(1, payload.footer!.length)) + 12}" y="${zoneTop + zoneHeight + 51}">${escapeXml(item.label)}</text>${textBlock(item.sub, margin + index * ((width - margin * 2) / Math.max(1, payload.footer!.length)) + 12, zoneTop + zoneHeight + 67, 24, 'ref-node-sub', 'start')}</g>`).join('');
    return svgRoot(spec, width, height, `${zones}${edges}${nodes}${footer}`);
}

function laneGridSvg(spec: DiagramSpec, payload: DiagramLaneGridPayload): string {
    const labelWidth = 150;
    const stepWidth = 142;
    const headerHeight = 132;
    const laneHeight = 132;
    const width = labelWidth + payload.steps.length * stepWidth + 40;
    const height = headerHeight + payload.lanes.length * laneHeight + 46;
    const cellMap = new Map<string, { x: number; y: number; width: number; height: number }>();
    payload.lanes.forEach((lane, laneIndex) => payload.steps.forEach((step, stepIndex) => {
        cellMap.set(`${lane.id}:${step.id}`, {
            x: labelWidth + stepIndex * stepWidth + 12,
            y: headerHeight + laneIndex * laneHeight + 14,
            width: stepWidth - 24,
            height: 96
        });
    }));
    const header = payload.steps.map((step, index) => `<g id="reference-step-${escapeXml(step.id)}"><rect class="ref-chip" x="${labelWidth + index * stepWidth + 48}" y="78" width="46" height="20" rx="5" /><text class="ref-caption" x="${labelWidth + index * stepWidth + 71}" y="92" text-anchor="middle">${String(index + 1).padStart(2, '0')}</text>${textBlock(step.label, labelWidth + index * stepWidth + stepWidth / 2, 122, 16, 'ref-node-label', 'middle', 2, 14)}</g>`).join('');
    const lanes = payload.lanes.map((lane, index) => `<g id="reference-lane-${escapeXml(lane.id)}"><rect class="ref-zone" x="0" y="${headerHeight + index * laneHeight}" width="${width}" height="${laneHeight}" rx="0" /><text class="ref-zone-label" x="18" y="${headerHeight + index * laneHeight + 38}">${escapeXml(lane.label.toUpperCase())}</text>${textBlock(lane.sub, 18, headerHeight + index * laneHeight + 56, 16, 'ref-node-sub', 'start', 2, 14)}</g>`).join('');
    const edges = payload.edges.map((edge, index) => {
        const from = cellMap.get(`${edge.from.laneId}:${edge.from.stepId}`);
        const to = cellMap.get(`${edge.to.laneId}:${edge.to.stepId}`);
        if (!from || !to) return '';
        const sx = from.x + from.width;
        const sy = from.y + from.height / 2;
        const tx = to.x;
        const ty = to.y + to.height / 2;
        const mx = Math.round((sx + tx) / 2);
        const style = edge.style === 'accent' ? 'accent' : edge.style === 'link' ? 'link' : edge.style === 'trigger' ? 'trigger' : '';
        const marker = style === 'accent' ? 'url(#notemd-reference-arrow-accent)' : style === 'link' ? 'url(#notemd-reference-arrow-link)' : 'url(#notemd-reference-arrow)';
        return `<g id="reference-lane-edge-${index}"><path class="ref-edge ${style}${edge.dashed ? ' dashed' : ''}" marker-end="url(#${marker.slice(5, -1)})" d="M ${sx} ${sy} H ${mx - 8} Q ${mx} ${sy} ${mx} ${sy + (ty >= sy ? 8 : -8)} V ${ty - (ty >= sy ? 8 : -8)} Q ${mx} ${ty} ${mx + 8} ${ty} H ${tx}" />${edge.label ? `<text class="ref-edge-label" x="${mx}" y="${Math.min(sy, ty) - 9}" text-anchor="middle">${escapeXml(edge.label)}</text>` : ''}</g>`;
    }).join('');
    const cells = payload.cells.map(cell => {
        const box = cellMap.get(`${cell.laneId}:${cell.stepId}`);
        if (!box) return '';
        const cx = box.x + box.width / 2;
        const chips = cell.chips ? `<rect class="ref-chip" x="${box.x + 6}" y="${box.y + box.height - 17}" width="22" height="11" rx="3" /><text class="ref-chip-text" x="${box.x + 17}" y="${box.y + box.height - 9}" text-anchor="middle">${escapeXml(cell.chips.in ?? '')}</text><rect class="ref-chip" x="${box.x + box.width - 28}" y="${box.y + box.height - 17}" width="22" height="11" rx="3" /><text class="ref-chip-text" x="${box.x + box.width - 17}" y="${box.y + box.height - 9}" text-anchor="middle">${escapeXml(cell.chips.out ?? '')}</text>` : '';
        const titleLines = wrapMeasuredText(cell.title, box.width - 12, 2).lines.length;
        const subY = box.y + 22 + titleLines * 15;
        const subLines = cell.sub ? wrapMeasuredText(cell.sub, box.width - 12, 1).lines.length : 0;
        const toolY = subY + subLines * 13 + 4;
        return `<g id="reference-cell-${escapeXml(cell.laneId)}-${escapeXml(cell.stepId)}"><rect class="${nodeClass({ focal: cell.focal })}" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="5" />${textBlock(cell.title, cx, box.y + 22, 16, 'ref-node-label', 'middle', 2, 15)}${textBlock(cell.sub, cx, subY, 16, 'ref-node-sub', 'middle', 1, 13)}${textBlock(cell.tool, cx, toolY, 16, 'ref-node-sub', 'middle', 1, 13)}${chips}</g>`;
    }).join('');
    return svgRoot(spec, width, height, `${header}${lanes}${edges}${cells}`);
}

function accessMatrixSvg(spec: DiagramSpec, payload: DiagramAccessMatrixPayload): string {
    const left = 250;
    const roleWidth = 150;
    // Keep the role header below the document summary. The previous 112px
    // row origin put the header background at y=50, which occluded the
    // summary rendered at y=66 even though every individual text box fit its
    // own local budget.
    const headerHeight = 140;
    const rowHeight = 76;
    const width = left + payload.roles.length * roleWidth + 30;
    const height = headerHeight + payload.components.length * rowHeight + 40;
    const colors: Record<string, string> = { full: '#dcfce7', rw: '#dbeafe', read: '#fef3c7', none: '#f1f5f9' };
    const headers = payload.roles.map((role, index) => `<g id="reference-role-${escapeXml(role.id)}"><rect x="${left + index * roleWidth}" y="${headerHeight - 62}" width="${roleWidth - 8}" height="54" rx="4" fill="${COLORS.ink}" />${textBlock(role.label, left + index * roleWidth + (roleWidth - 8) / 2, headerHeight - 42, 19, 'ref-header-label', 'middle', 2, 12)}${role.code ? `<text x="${left + index * roleWidth + (roleWidth - 8) / 2}" y="${headerHeight - 10}" text-anchor="middle" fill="${COLORS.soft}" font-size="8" font-family="Consolas, monospace">${escapeXml(role.code)}</text>` : ''}</g>`).join('');
    const rows = payload.components.map((component, row) => `<g id="reference-component-${escapeXml(component.id)}"><rect x="16" y="${headerHeight + row * rowHeight}" width="${left - 30}" height="${rowHeight - 4}" fill="${row % 2 ? COLORS.paper : COLORS.panel}" stroke="${COLORS.rule}" />${textBlock(component.label, 28, headerHeight + row * rowHeight + 18, 28, 'ref-node-label', 'start', 2, 14)}${component.hint ? textBlock(component.hint, left - 26, headerHeight + row * rowHeight + 58, 22, 'ref-node-sub', 'end', 1, 12) : ''}</g>`).join('');
    const cells = payload.components.flatMap((_, row) => payload.roles.map((_, col) => {
        const cell = payload.cells.find(candidate => candidate.row === row && candidate.col === col);
        const value = cell?.value ?? payload.noneLabel ?? 'No access';
        const level = cell?.level ?? 'none';
        const x = left + col * roleWidth;
        const y = headerHeight + row * rowHeight;
        return `<g id="reference-access-cell-${row}-${col}"><rect x="${x}" y="${y}" width="${roleWidth - 8}" height="${rowHeight - 4}" rx="3" fill="${cell?.focal ? COLORS.accentFill : colors[level]}" stroke="${cell?.focal ? COLORS.accent : COLORS.rule}" stroke-width="${cell?.focal ? 1.8 : 1}" />${textBlock(value, x + (roleWidth - 8) / 2, y + 18, 16, 'ref-node-label', 'middle', 2, 13)}${cell?.sub ? textBlock(cell.sub, x + (roleWidth - 8) / 2, y + 46, 16, 'ref-node-sub', 'middle', 2, 12) : ''}</g>`;
    })).join('');
    return svgRoot(spec, width, height, `${headers}${rows}${cells}`);
}

function dateKeys(payload: DiagramSchedulePayload): string[] {
    const values = [...payload.tasks.flatMap(task => [task.start, task.end]), ...(payload.milestones ?? []).map(milestone => milestone.date)];
    const uniqueValues = Array.from(new Set(values.map(value => String(value))));
    return uniqueValues.sort((a, b) => {
        const aDate = Date.parse(a);
        const bDate = Date.parse(b);
        if (Number.isFinite(aDate) && Number.isFinite(bDate)) return aDate - bDate;
        return a.localeCompare(b);
    });
}

function scheduleSvg(spec: DiagramSpec, payload: DiagramSchedulePayload): string {
    const width = 1120;
    const left = 260;
    const top = 112;
    const rowHeight = 58;
    const keys = dateKeys(payload);
    const timelineWidth = width - left - 40;
    const step = timelineWidth / Math.max(1, keys.length - 1);
    const position = (value: string | number): number => left + (keys.indexOf(String(value)) < 0 ? 0 : keys.indexOf(String(value))) * step;
    const axis = keys.map((key, index) => `<g><line class="ref-axis" x1="${position(key)}" y1="${top - 28}" x2="${position(key)}" y2="${top + payload.tasks.length * rowHeight}" />${textBlock(key, position(key), top - 36, 14, 'ref-axis-label', 'middle', 2, 12)}</g>`).join('');
    const tasks = payload.tasks.map((task, index) => {
        const x = position(task.start);
        const end = position(task.end);
        const widthValue = Math.max(24, end - x + 18);
        const y = top + index * rowHeight;
        return `<g id="reference-task-${escapeXml(task.id)}">${textBlock(task.label, 18, y + 20, 30, 'ref-node-label', 'start', 2, 14)}<rect class="${task.focal ? 'ref-focal-fill' : 'ref-chip'}" x="${x}" y="${y + 7}" width="${widthValue}" height="34" rx="5" />${task.phaseId ? textBlock(task.phaseId, x + 8, y + 29, 16, 'ref-node-sub', 'start', 1, 12) : ''}</g>`;
    }).join('');
    const milestones = (payload.milestones ?? []).map(milestone => `<g id="reference-milestone-${escapeXml(milestone.id)}"><path class="ref-edge accent" d="M ${position(milestone.date)} ${top - 18} V ${top + payload.tasks.length * rowHeight + 8}" />${textBlock(milestone.label, position(milestone.date) + 8, top + payload.tasks.length * rowHeight + 28, 18, 'ref-edge-label', 'start', 2, 13)}</g>`).join('');
    return svgRoot(spec, width, top + payload.tasks.length * rowHeight + 70, `${axis}${tasks}${milestones}`);
}

function orderedStackSvg(spec: DiagramSpec, payload: DiagramOrderedStackPayload): string {
    const width = 920;
    const layerHeight = 82;
    const top = 110;
    const height = top + payload.layers.length * layerHeight + 50;
    const layers = payload.layers.map((layer, index) => {
        const y = top + index * layerHeight;
        return `<g id="reference-layer-${escapeXml(layer.id)}"><rect class="${layer.focal ? 'ref-focal-fill' : 'ref-node'}" x="60" y="${y}" width="800" height="${layerHeight - 5}" rx="5" /><text class="ref-caption" x="82" y="${y + 28}">${String(index + 1).padStart(2, '0')}</text>${textBlock(layer.label, 130, y + 27, 70, 'ref-node-label', 'start', 2, 15)}${textBlock(layer.sub, 820, y + 28, 30, 'ref-node-sub', 'end', 2, 14)}</g>`;
    }).join('');
    const direction = payload.direction === 'up' ? 'abstraction ↑' : 'packets ↓';
    return svgRoot(spec, width, height, `<text class="ref-caption" x="60" y="94">${escapeXml(direction)}</text>${layers}`);
}

function setOverlapSvg(spec: DiagramSpec, payload: DiagramSetOverlapPayload): string {
    const width = 920;
    const height = 620;
    const centerY = 330;
    const radius = clamp(Math.min(180, 240 - payload.sets.length * 16), 120, 180);
    const centers = payload.sets.length === 2
        ? [330, 550]
        : payload.sets.map((_, index) => 460 + Math.cos(-Math.PI / 2 + index * 2 * Math.PI / payload.sets.length) * 145);
    const circles = payload.sets.map((set, index) => `<g id="reference-set-${escapeXml(set.id)}"><circle cx="${centers[index]}" cy="${centerY}" r="${set.radius ?? radius}" fill="${index === 0 ? '#dbeafe' : index === 1 ? '#dcfce7' : '#fef3c7'}" fill-opacity=".55" stroke="${COLORS.muted}" stroke-width="1.4" />${textBlock(set.label, centers[index], centerY - radius - 24, 18, 'ref-node-label', 'middle', 2, 14)}${textBlock(set.sub, centers[index], centerY - radius - 4, 20, 'ref-node-sub', 'middle', 2, 13)}</g>`).join('');
    const intersections = payload.intersections.map((intersection, index) => {
        const selected = intersection.setIds.map(id => payload.sets.findIndex(set => set.id === id)).filter(indexValue => indexValue >= 0);
        const x = selected.reduce((sum, selectedIndex) => sum + centers[selectedIndex], 0) / Math.max(1, selected.length);
        return `<g id="reference-intersection-${escapeXml(intersection.id)}"><text class="${intersection.focal ? 'ref-node-label' : 'ref-caption'}" x="${x}" y="${centerY + index * 22 - 8}" text-anchor="middle" fill="${intersection.focal ? COLORS.accent : COLORS.ink}" data-layout-safety="${LAYOUT_SAFETY_VERSION}">${escapeXml(wrapMeasuredText(intersection.label, 150, 2).lines.join(' '))}</text></g>`;
    }).join('');
    return svgRoot(spec, width, height, `${circles}${intersections}`);
}

function rankedSegmentsSvg(spec: DiagramSpec, payload: DiagramRankedSegmentsPayload): string {
    const width = 920;
    const height = 110 + payload.segments.length * 70;
    const center = width / 2;
    const maxWidth = 700;
    const segments = payload.segments.map((segment, index) => {
        const y = 96 + index * 66;
        const ratio = payload.orientation === 'pyramid' ? (payload.segments.length - index) / payload.segments.length : (index + 1) / payload.segments.length;
        const currentWidth = maxWidth * (0.38 + ratio * 0.62);
        const nextRatio = payload.orientation === 'pyramid' ? (payload.segments.length - index - 1) / payload.segments.length : (index + 2) / payload.segments.length;
        const nextWidth = maxWidth * (0.38 + clamp(nextRatio, 0, 1) * 0.62);
        const points = `${center - currentWidth / 2},${y} ${center + currentWidth / 2},${y} ${center + nextWidth / 2},${y + 58} ${center - nextWidth / 2},${y + 58}`;
        return `<g id="reference-segment-${escapeXml(segment.id)}"><polygon class="${segment.focal ? 'ref-focal-fill' : 'ref-node'}" points="${points}" />${textBlock(segment.label, center, y + 24, Math.max(16, Math.floor(currentWidth / 7)), 'ref-node-label', 'middle', 1, 14)}${textBlock(segment.sub ?? (segment.value === undefined ? undefined : String(segment.value)), center, y + 44, Math.max(16, Math.floor(currentWidth / 7)), 'ref-node-sub', 'middle', 1, 13)}</g>`;
    }).join('');
    return svgRoot(spec, width, height, `<text class="ref-caption" x="${center}" y="82" text-anchor="middle">${payload.orientation === 'pyramid' ? 'FOUNDATION → FOCAL APEX' : 'AUDIENCE → CONVERSION'}</text>${segments}`);
}

function cycleSvg(spec: DiagramSpec, payload: DiagramCyclePayload): string {
    const width = 920;
    const height = 720;
    const cx = width / 2;
    const cy = 390;
    const radius = 235;
    const stationWidth = 146;
    const stationHeight = 78;
    const positions = payload.stations.map((station, index) => {
        const angle = -Math.PI / 2 + index * 2 * Math.PI / payload.stations.length;
        return { station, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    });
    const arcs = positions.map((position, index) => {
        const next = positions[(index + 1) % positions.length];
        const path = `M ${position.x} ${position.y} A ${radius} ${radius} 0 0 1 ${next.x} ${next.y}`;
        return `<path class="ref-edge" d="${path}" marker-end="url(#notemd-reference-arrow)" />${position.station.spokeLabel ? `<text class="ref-edge-label" x="${cx + (position.x - cx) * .55}" y="${cy + (position.y - cy) * .55}" text-anchor="middle">${escapeXml(position.station.spokeLabel)}</text>` : ''}`;
    }).join('');
    const stations = positions.map(({ station, x, y }) => `<g id="reference-station-${escapeXml(station.id)}"><rect class="${station.focal ? 'ref-focal-fill' : 'ref-node'}" x="${x - stationWidth / 2}" y="${y - stationHeight / 2}" width="${stationWidth}" height="${stationHeight}" rx="6" />${textBlock(station.label, x, y - 18, 16, 'ref-node-label', 'middle', 2, 14)}${textBlock(station.sub, x, y + 20, 16, 'ref-node-sub', 'middle', 1, 13)}</g>`).join('');
    const hub = `<g id="reference-cycle-hub"><rect x="${cx - 100}" y="${cy - 48}" width="200" height="96" rx="8" fill="${COLORS.ink}" />${textBlock(payload.hub.label, cx, cy - 18, 22, 'ref-hub-label', 'middle', 2, 14)}${textBlock(payload.hub.sub, cx, cy + 28, 22, 'ref-hub-sub', 'middle', 1, 13)}</g>`;
    return svgRoot(spec, width, height, `${arcs}${stations}${hub}`);
}

function nestedSvg(spec: DiagramSpec, payload: DiagramNestedPayload): string {
    const width = 920;
    const height = 640;
    const levels = payload.levels.map((level, index) => {
        const inset = index * 42;
        const x = 50 + inset;
        const y = 98 + inset;
        const w = width - 100 - inset * 2;
        const h = height - 150 - inset * 2;
        const tagWidth = Math.min(260, Math.max(150, measureTextWidth(level.label) + 34));
        return `<g id="reference-nested-${escapeXml(level.id)}"><rect class="${level.focal ? 'ref-focal-fill' : 'ref-node'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill-opacity="${Math.max(.02, .09 - index * .012)}" /><rect x="${x + 14}" y="${y + 7}" width="${Math.min(tagWidth, w - 28)}" height="22" fill="${COLORS.paper}" />${textBlock(level.label.toUpperCase(), x + 22, y + 23, Math.max(10, Math.floor((Math.min(tagWidth, w - 28) - 16) / 7)), 'ref-caption', 'start', 1, 13)}${level.sub ? textBlock(level.sub, x + 22, y + 45, 26, 'ref-node-sub', 'start', 1, 12) : ''}</g>`;
    }).join('');
    return svgRoot(spec, width, height, levels);
}

function treeSvg(spec: DiagramSpec, payload: DiagramTreePayload): string {
    const width = 1040;
    const height = 680;
    const nodeWidth = 170;
    const nodeHeight = 76;
    const levels = new Map<string, number>();
    const children = new Map<string, string[]>();
    for (const node of payload.nodes) {
        if (node.parentId) children.set(node.parentId, [...(children.get(node.parentId) ?? []), node.id]);
    }
    const root = payload.nodes.find(node => !node.parentId);
    const assignDepth = (id: string, depth: number): void => {
        levels.set(id, depth);
        for (const child of children.get(id) ?? []) assignDepth(child, depth + 1);
    };
    if (root) assignDepth(root.id, 0);
    const byDepth = new Map<number, typeof payload.nodes>();
    for (const node of payload.nodes) {
        const depth = levels.get(node.id) ?? 0;
        byDepth.set(depth, [...(byDepth.get(depth) ?? []), node]);
    }
    const positions = new Map<string, { x: number; y: number }>();
    for (const [depth, nodes] of byDepth) {
        const gap = (width - 80 - nodes.length * nodeWidth) / Math.max(1, nodes.length + 1);
        nodes.forEach((node, index) => positions.set(node.id, { x: 40 + gap * (index + 1) + nodeWidth * index, y: 100 + depth * 130 }));
    }
    const edges = payload.nodes.filter(node => node.parentId).map((node, index) => {
        const from = positions.get(node.parentId!);
        const to = positions.get(node.id);
        if (!from || !to) return '';
        const sx = from.x + nodeWidth / 2;
        const sy = from.y + nodeHeight;
        const tx = to.x + nodeWidth / 2;
        const ty = to.y;
        const midY = (sy + ty) / 2;
        return `<path id="reference-tree-edge-${index}" class="ref-edge" d="M ${sx} ${sy} V ${midY} H ${tx} V ${ty}" marker-end="url(#notemd-reference-arrow)" />`;
    }).join('');
    const nodes = payload.nodes.map(node => {
        const position = positions.get(node.id);
        if (!position) return '';
        return `<g id="reference-tree-node-${escapeXml(node.id)}"><rect class="${nodeClass({ focal: node.focal })}" x="${position.x}" y="${position.y}" width="${nodeWidth}" height="${nodeHeight}" rx="6" />${textBlock(node.label, position.x + nodeWidth / 2, position.y + 24, 18, 'ref-node-label', 'middle', 2, 14)}${textBlock(node.sub, position.x + nodeWidth / 2, position.y + 54, 18, 'ref-node-sub', 'middle', 1, 12)}</g>`;
    }).join('');
    return svgRoot(spec, width, height, `${edges}${nodes}`);
}

export function isReferenceLayoutDiagram(spec: DiagramSpec): boolean {
    return ['topology', 'lane-grid', 'access-matrix', 'schedule', 'ordered-stack', 'set-overlap', 'ranked-segments', 'cycle', 'nested', 'tree'].includes(spec.payload?.kind ?? '');
}

export function renderReferenceLayoutSvg(spec: DiagramSpec): string {
    switch (spec.payload?.kind) {
        case 'topology': return topologySvg(spec, spec.payload);
        case 'lane-grid': return laneGridSvg(spec, spec.payload);
        case 'access-matrix': return accessMatrixSvg(spec, spec.payload);
        case 'schedule': return scheduleSvg(spec, spec.payload);
        case 'ordered-stack': return orderedStackSvg(spec, spec.payload);
        case 'set-overlap': return setOverlapSvg(spec, spec.payload);
        case 'ranked-segments': return rankedSegmentsSvg(spec, spec.payload);
        case 'cycle': return cycleSvg(spec, spec.payload);
        case 'nested': return nestedSvg(spec, spec.payload);
        case 'tree': return treeSvg(spec, spec.payload);
        default: throw new Error(`No native reference-layout renderer is registered for payload kind "${String(spec.payload?.kind)}".`);
    }
}

export function renderReferenceLayoutHtmlDocument(spec: DiagramSpec): string {
    const svg = renderReferenceLayoutSvg(spec);
    return `<!DOCTYPE html><html lang="${escapeXml(spec.outputLanguage ?? 'en')}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" /><title>${escapeXml(spec.title)}</title><style>html,body{margin:0;padding:0;background:#f1f5f9;color:#172033;font:14px/1.5 "Segoe UI",Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:24px}.sheet{overflow:auto;border:1px solid #cbd5e1;border-radius:8px;background:#fff}.sheet svg{display:block;width:100%;height:auto;min-width:680px}</style></head><body><main><section class="sheet" aria-label="${escapeXml(spec.title)}">${svg}</section></main></body></html>`;
}
