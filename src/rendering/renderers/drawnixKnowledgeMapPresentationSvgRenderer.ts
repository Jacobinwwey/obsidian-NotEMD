import type {
    DrawnixKnowledgeMapPresentationNode,
    DrawnixKnowledgeMapPresentationRelation,
    DrawnixKnowledgeMapPresentationSlice,
    DrawnixKnowledgeMapVisualRole
} from '../../diagram/adapters/drawnix/drawnixKnowledgeMapPresentationTypes';
import {
    normalizeSvgFontFamilyDeclarations,
    PREVIEW_FONT_FAMILY,
    PREVIEW_FONT_STACK
} from '../preview/previewTypography';

export const NOTEMD_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_SVG_RENDERER_VERSION =
    'notemd-drawnix-knowledge-map-presentation-svg@1.0.0';

interface RoleStyle {
    fill: string;
    stroke: string;
    text: string;
    branch: string;
}

const ROLE_STYLES: Record<DrawnixKnowledgeMapVisualRole, RoleStyle> = {
    root: { fill: '#152238', stroke: '#152238', text: '#ffffff', branch: '#31516f' },
    domain: { fill: '#e8f4f3', stroke: '#0f766e', text: '#143a38', branch: '#0f766e' },
    subsystem: { fill: '#eef4ff', stroke: '#2563eb', text: '#1e3a6f', branch: '#2563eb' },
    component: { fill: '#ffffff', stroke: '#64748b', text: '#172033', branch: '#64748b' },
    evidence: { fill: '#fff7e6', stroke: '#b45309', text: '#6b3410', branch: '#b45309' },
    external: { fill: '#f1f5f9', stroke: '#94a3b8', text: '#475569', branch: '#94a3b8' },
    'cross-relation': { fill: '#fceef3', stroke: '#be123c', text: '#7f1233', branch: '#be123c' }
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function branchPath(start: [number, number], end: [number, number]): string {
    const controlX = start[0] + (end[0] - start[0]) * 0.48;
    return `M ${start[0]} ${start[1]} C ${controlX} ${start[1]}, ${controlX} ${end[1]}, ${end[0]} ${end[1]}`;
}

function relationPath(
    relation: DrawnixKnowledgeMapPresentationRelation,
    source: DrawnixKnowledgeMapPresentationNode,
    target: DrawnixKnowledgeMapPresentationNode
): string {
    if (relation.route && relation.route.length >= 2) {
        return relation.route.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    }
    const sourceCenterY = source.y + source.height / 2;
    const targetCenterY = target.y + target.height / 2;
    const sourceRight = source.x + source.width;
    const targetLeft = target.x;
    const sourceLeft = source.x;
    const targetRight = target.x + target.width;
    const flowsRight = targetLeft >= sourceRight;
    const startX = flowsRight ? sourceRight : sourceLeft;
    const endX = flowsRight ? targetLeft : targetRight;
    const elbowX = startX + (endX - startX) / 2;
    return `M ${startX} ${sourceCenterY} L ${elbowX} ${sourceCenterY} L ${elbowX} ${targetCenterY} L ${endX} ${targetCenterY}`;
}

function renderNode(node: DrawnixKnowledgeMapPresentationNode): string {
    const style = ROLE_STYLES[node.role];
    const radius = node.role === 'root' ? 10 : 7;
    const continuationBorder = node.summary && !node.context && node.role !== 'root'
        ? ' stroke-dasharray="5 3"'
        : '';
    const centerX = node.x + node.width / 2;
    const firstLineY = node.y + node.height / 2 - ((node.textLines.length - 1) * 20) / 2 + 6;
    const lines = node.textLines.map((line, index) => (
        `<tspan x="${centerX}" dy="${index === 0 ? 0 : 20}">${escapeHtml(line)}</tspan>`
    )).join('');
    return `<g data-drawnix-knowledge-map-node-id="${escapeHtml(node.semanticNodeId)}" data-drawnix-knowledge-map-role="${node.role}" data-drawnix-knowledge-map-summary="${node.summary}" data-drawnix-knowledge-map-context="${node.context}">
        <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${radius}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="${node.role === 'root' ? 2 : 1.5}"${continuationBorder} />
        <text x="${centerX}" y="${firstLineY}" text-anchor="middle" fill="${style.text}" class="notemd-drawnix-knowledge-map-label">${lines}</text>
    </g>`;
}

function renderRelation(
    relation: DrawnixKnowledgeMapPresentationRelation,
    nodesById: ReadonlyMap<string, DrawnixKnowledgeMapPresentationNode>
): string {
    const source = nodesById.get(relation.sourceNodeId);
    const target = nodesById.get(relation.targetNodeId);
    if (!source || !target) {
        return '';
    }
    const path = relationPath(relation, source, target);
    const centerX = (source.x + source.width / 2 + target.x + target.width / 2) / 2;
    const centerY = (source.y + source.height / 2 + target.y + target.height / 2) / 2;
    const labelLines = relation.labelLines ?? (relation.label?.trim() ? [relation.label.trim()] : []);
    const [labelX, labelY] = relation.labelPosition ?? [centerX, centerY - 8];
    const label = labelLines.length > 0
        ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="notemd-drawnix-knowledge-map-relation-label">${labelLines.map((line, index) => (
            `<tspan x="${labelX}" dy="${index === 0 ? 0 : 16}">${escapeHtml(line)}</tspan>`
        )).join('')}</text>`
        : '';
    return `<g data-drawnix-knowledge-map-relation-id="${escapeHtml(relation.semanticRelationId)}" data-drawnix-knowledge-map-relation-summary="${relation.summary}">
        <path d="${path}" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="6 5" marker-end="url(#notemd-drawnix-knowledge-map-arrow)" />
        ${label}
    </g>`;
}

function renderSliceHeader(slice: DrawnixKnowledgeMapPresentationSlice): string {
    const subtitle = slice.summary?.trim() || (slice.kind === 'overview'
        ? 'Overview of root scopes and material cross-scope relations'
        : 'Detail slice with source-faithful hierarchy and relation endpoints');
    return `<g data-drawnix-knowledge-map-layer="header">
        <rect x="0" y="0" width="${slice.width}" height="76" fill="#ffffff" />
        <text x="56" y="36" class="notemd-drawnix-knowledge-map-title">${escapeHtml(slice.title)}</text>
        <text x="56" y="60" class="notemd-drawnix-knowledge-map-subtitle">${escapeHtml(subtitle)}</text>
    </g>`;
}

export function renderDrawnixKnowledgeMapPresentationSvg(
    slice: DrawnixKnowledgeMapPresentationSlice
): string {
    const nodesById = new Map(slice.nodes.map(node => [node.id, node]));
    const branches = slice.branches.map(branch => {
        const parent = nodesById.get(branch.parentNodeId);
        const child = nodesById.get(branch.childNodeId);
        if (!parent || !child) {
            return '';
        }
        const style = ROLE_STYLES[child.role];
        return `<path data-drawnix-knowledge-map-parent="${escapeHtml(parent.semanticNodeId)}" data-drawnix-knowledge-map-child="${escapeHtml(child.semanticNodeId)}" d="${branchPath(branch.start, branch.end)}" fill="none" stroke="${style.branch}" stroke-width="2" stroke-linecap="round" />`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${slice.width}" height="${slice.height}" viewBox="0 0 ${slice.width} ${slice.height}" role="img" aria-labelledby="${slice.id}-title ${slice.id}-description" data-notemd-renderer="${NOTEMD_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_SVG_RENDERER_VERSION}">
        <title id="${slice.id}-title">${escapeHtml(slice.title)}</title>
        <desc id="${slice.id}-description">${escapeHtml(slice.summary ?? 'Drawnix knowledge-map presentation slice')}</desc>
        <style>
            .notemd-drawnix-knowledge-map-title { font-family: ${PREVIEW_FONT_STACK}; font-size: 23px; font-weight: 700; fill: #172033; }
            .notemd-drawnix-knowledge-map-subtitle { font-family: ${PREVIEW_FONT_STACK}; font-size: 13px; fill: #64748b; }
            .notemd-drawnix-knowledge-map-label { font-family: ${PREVIEW_FONT_STACK}; font-size: 14px; font-weight: 500; }
            .notemd-drawnix-knowledge-map-relation-label { font-family: ${PREVIEW_FONT_STACK}; font-size: 12px; fill: #334155; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
        </style>
        <defs>
            <marker id="notemd-drawnix-knowledge-map-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
        </defs>
        <rect x="0" y="0" width="${slice.width}" height="${slice.height}" fill="#fbfcfe" />
        ${branches}
        ${slice.relations.map(relation => renderRelation(relation, nodesById)).join('')}
        ${slice.nodes.map(renderNode).join('')}
        ${renderSliceHeader(slice)}
    </svg>`;
    return normalizeSvgFontFamilyDeclarations(svg).replace(PREVIEW_FONT_FAMILY, PREVIEW_FONT_FAMILY);
}
