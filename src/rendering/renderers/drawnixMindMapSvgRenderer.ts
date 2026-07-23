import {
    DrawnixMindMapCrossRelation,
    DrawnixMindMapPlacedNode,
    DrawnixMindMapProjection,
    DrawnixPoint
} from '../../diagram/adapters/drawnix/drawnixMindMapProjection';

export const NOTEMD_DRAWNIX_MIND_MAP_SVG_RENDERER_VERSION = 'notemd-drawnix-mindmap-svg@1.0.0';

const BRANCH_COLORS = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1'];

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
    return escapeHtml(value);
}

function branchColor(branchIndex: number): string {
    return BRANCH_COLORS[Math.max(0, branchIndex) % BRANCH_COLORS.length];
}

function nodeFill(node: DrawnixMindMapPlacedNode): string {
    if (node.depth === 0) {
        return '#0f172a';
    }
    return node.depth === 1 ? '#ffffff' : '#f8fafc';
}

function nodeTextColor(node: DrawnixMindMapPlacedNode): string {
    return node.depth === 0 ? '#ffffff' : '#172033';
}

function renderNodeLabel(node: DrawnixMindMapPlacedNode): string {
    const centerX = node.x + node.width / 2;
    const lineHeight = node.depth === 0 ? 22 : 19;
    const firstLineY = node.y + node.height / 2 - ((node.textLines.length - 1) * lineHeight) / 2 + 6;
    return `<text x="${centerX}" y="${firstLineY}" text-anchor="middle" class="notemd-drawnix-mindmap-label" fill="${nodeTextColor(node)}">
        ${node.textLines.map((line, index) => `<tspan x="${centerX}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`).join('')}
    </text>`;
}

function renderNode(node: DrawnixMindMapPlacedNode): string {
    const color = branchColor(node.branchIndex);
    const stroke = node.depth === 0 ? '#0f172a' : color;
    const strokeWidth = node.depth === 0 ? 0 : node.depth === 1 ? 2 : 1.4;
    const radius = node.depth === 0 ? 18 : 12;
    return `<g data-drawnix-mindmap-node-id="${escapeAttribute(node.id)}" data-drawnix-mindmap-depth="${node.depth}" data-drawnix-mindmap-branch="${node.branchIndex}">
        <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${radius}" fill="${nodeFill(node)}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        ${renderNodeLabel(node)}
    </g>`;
}

function buildHierarchyPath(start: DrawnixPoint, end: DrawnixPoint): string {
    const controlX = (start[0] + end[0]) / 2;
    return `M ${start[0]} ${start[1]} C ${controlX} ${start[1]}, ${controlX} ${end[1]}, ${end[0]} ${end[1]}`;
}

function renderHierarchyBranch(branch: DrawnixMindMapProjection['hierarchyBranches'][number]): string {
    return `<path data-drawnix-mindmap-parent="${escapeAttribute(branch.parentId)}" data-drawnix-mindmap-child="${escapeAttribute(branch.childId)}" d="${buildHierarchyPath(branch.start, branch.end)}" fill="none" stroke="${branchColor(branch.branchIndex)}" stroke-width="2.2" stroke-linecap="round" />`;
}

function pathFromPoints(points: DrawnixPoint[]): string {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ');
}

function renderCrossRelation(relation: DrawnixMindMapCrossRelation): string {
    const labelPoint = relation.points[Math.floor(relation.points.length / 2)];
    const label = relation.label
        ? `<text x="${labelPoint[0] + 8}" y="${labelPoint[1] - 8}" class="notemd-drawnix-mindmap-relation-label">${escapeHtml(relation.label)}</text>`
        : '';
    return `<g data-drawnix-mindmap-relation-id="${escapeAttribute(relation.id)}" data-drawnix-mindmap-source="${escapeAttribute(relation.sourceId)}" data-drawnix-mindmap-target="${escapeAttribute(relation.targetId)}">
        <path d="${pathFromPoints(relation.points)}" fill="none" stroke="#64748b" stroke-width="1.6" stroke-dasharray="6 5" marker-end="url(#notemd-drawnix-mindmap-arrow)" />
        ${label}
    </g>`;
}

export function renderDrawnixMindMapSvg(projection: DrawnixMindMapProjection): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${projection.width}" height="${projection.height}" viewBox="0 0 ${projection.width} ${projection.height}" role="img" aria-labelledby="notemd-drawnix-mindmap-title notemd-drawnix-mindmap-desc" data-notemd-renderer="${NOTEMD_DRAWNIX_MIND_MAP_SVG_RENDERER_VERSION}">
        <title id="notemd-drawnix-mindmap-title">${escapeHtml(projection.title)}</title>
        <desc id="notemd-drawnix-mindmap-desc">${escapeHtml(projection.summary ?? 'Drawnix knowledge map')}</desc>
        <style>
            .notemd-drawnix-mindmap-label { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; font-weight: 650; }
            .notemd-drawnix-mindmap-relation-label { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; fill: #475569; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
        </style>
        <defs>
            <marker id="notemd-drawnix-mindmap-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
        </defs>
        <rect x="0" y="0" width="${projection.width}" height="${projection.height}" fill="#ffffff" />
        <text x="72" y="44" fill="#172033" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700">${escapeHtml(projection.title)}</text>
        ${projection.summary ? `<text x="72" y="72" fill="#64748b" font-family="Segoe UI, Arial, sans-serif" font-size="14">${escapeHtml(projection.summary)}</text>` : ''}
        ${projection.hierarchyBranches.map(renderHierarchyBranch).join('')}
        ${projection.crossRelations.map(renderCrossRelation).join('')}
        ${projection.nodes.map(renderNode).join('')}
    </svg>`;
}
