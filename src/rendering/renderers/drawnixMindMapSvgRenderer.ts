import {
    DrawnixMindMapCrossRelation,
    DrawnixMindMapPlacedNode,
    DrawnixMindMapProjection,
    DrawnixPoint
} from '../../diagram/adapters/drawnix/drawnixMindMapProjection';
import type { SourceVisualPreview } from '../../diagram/sourceVisualArtifactBuilder';
import {
    normalizeSvgFontFamilyDeclarations,
    PREVIEW_FONT_FAMILY,
    PREVIEW_FONT_STACK
} from '../preview/previewTypography';

export const NOTEMD_DRAWNIX_MIND_MAP_SVG_RENDERER_VERSION = 'notemd-drawnix-mindmap-svg@1.0.0';

const BRANCH_COLORS = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1'];
const SOURCE_VISUAL_PANEL_WIDTH = 520;
const SOURCE_VISUAL_PANEL_GAP = 36;
const SOURCE_VISUAL_PANEL_PADDING = 18;
const SOURCE_VISUAL_HEADER_HEIGHT = 56;
const SOURCE_VISUAL_CONTENT_GAP = 8;
const SOURCE_VISUAL_VERTICAL_GAP = 24;
const SOURCE_VISUAL_MIN_HEIGHT = 160;
const SOURCE_VISUAL_RIGHT_MARGIN = 72;
const SOURCE_VISUAL_TOP_MARGIN = 24;
const RELATION_LABEL_TEXT_OFFSET_Y = 20;

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

function parsePositiveSvgNumber(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSvgCoordinate(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
}

interface SourceVisualSvgCanvas {
    innerMarkup: string;
    rootAttributes: string;
    viewBoxX: number;
    viewBoxY: number;
    width: number;
    height: number;
}

function parseSourceVisualSvgCanvas(svg: string): SourceVisualSvgCanvas | null {
    const match = svg.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
    if (!match) {
        return null;
    }

    const attributes = match[1] ?? '';
    const viewBox = attributes.match(/\bviewBox\s*=\s*["']\s*([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s*["']/i);
    const viewBoxX = parseSvgCoordinate(viewBox?.[1], 0);
    const viewBoxY = parseSvgCoordinate(viewBox?.[2], 0);
    const viewBoxWidth = parsePositiveSvgNumber(viewBox?.[3], 960);
    const viewBoxHeight = parsePositiveSvgNumber(viewBox?.[4], 540);

    return {
        innerMarkup: match[2] ?? '',
        rootAttributes: attributes,
        viewBoxX,
        viewBoxY,
        width: viewBox
            ? viewBoxWidth
            : parsePositiveSvgNumber(attributes.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1], viewBoxWidth),
        height: viewBox
            ? viewBoxHeight
            : parsePositiveSvgNumber(attributes.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1], viewBoxHeight)
    };
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function namespaceSourceVisualSvgIds(svg: string, visualId: string): string {
    const slug = visualId.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'visual';
    const idMap = new Map<string, string>();
    const namespaced = svg.replace(/<([A-Za-z][\w:.-]*)(?:\s[^<>]*)?>/g, tag => tag.replace(
        /(\s)(id|xml:id)(\s*=\s*)(["'])([^"']+)\4/g,
        (_match, whitespace: string, attribute: string, equals: string, quote: string, id: string) => {
            if (!idMap.has(id)) {
                idMap.set(id, `notemd-${slug}-${idMap.size}-${id}`);
            }
            return `${whitespace}${attribute}${equals}${quote}${idMap.get(id)}${quote}`;
        }
    ));

    let result = namespaced;
    idMap.forEach((namespacedId, originalId) => {
        const escapedId = escapeRegExp(originalId);
        result = result.replace(
            new RegExp(`url\\(\\s*(["']?)\\s*#${escapedId}\\s*\\1\\s*\\)`, 'g'),
            `url(#${namespacedId})`
        );
        result = result.replace(new RegExp(`(["'])#${escapedId}(["'])`, 'g'), `$1#${namespacedId}$2`);
    });
    result = result.replace(
        /\s+(aria-labelledby|aria-describedby|for|begin)\s*=\s*(["'])([^"']*)\2/gi,
        (match, attribute: string, quote: string, value: string) => {
            let rewrittenValue = value;
            idMap.forEach((namespacedId, originalId) => {
                const escapedId = escapeRegExp(originalId);
                rewrittenValue = rewrittenValue.replace(
                    new RegExp(`(^|[\\s;,])${escapedId}(?=$|[\\s;,.])`, 'g'),
                    `$1${namespacedId}`
                );
            });
            return match.replace(value, rewrittenValue);
        }
    );
    result = result.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_match, open: string, css: string, close: string) => {
        let rewrittenCss = css;
        idMap.forEach((namespacedId, originalId) => {
            const escapedId = escapeRegExp(originalId);
            rewrittenCss = rewrittenCss.replace(
                new RegExp(`#${escapedId}(?![A-Za-z0-9_-])`, 'g'),
                `#${namespacedId}`
            );
        });
        return `${open}${rewrittenCss}${close}`;
    });
    return result;
}

function preserveSourceSvgRootAttributes(attributes: string): string {
    return attributes
        .replace(/\s+(?:x|y|width|height|viewBox|preserveAspectRatio|overflow)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
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

function relationDataAttributes(relation: DrawnixMindMapCrossRelation): string {
    const warning = relation.routeWarning ? ` data-drawnix-mindmap-route-warning="${escapeAttribute(relation.routeWarning)}"` : '';
    return `data-drawnix-mindmap-relation-id="${escapeAttribute(relation.id)}" data-drawnix-mindmap-source="${escapeAttribute(relation.sourceId)}" data-drawnix-mindmap-target="${escapeAttribute(relation.targetId)}" data-drawnix-mindmap-source-root="${escapeAttribute(relation.sourceRootId)}" data-drawnix-mindmap-target-root="${escapeAttribute(relation.targetRootId)}" data-drawnix-mindmap-route-strategy="${escapeAttribute(relation.routeStrategy)}"${warning}`;
}

function renderCrossRelationPath(relation: DrawnixMindMapCrossRelation): string {
    return `<g ${relationDataAttributes(relation)} data-drawnix-mindmap-relation-layer="path" clip-path="url(#notemd-drawnix-mindmap-content-clip)">
        <path d="${pathFromPoints(relation.points)}" fill="none" stroke="#64748b" stroke-width="1.6" stroke-dasharray="6 5" marker-end="url(#notemd-drawnix-mindmap-arrow)" />
    </g>`;
}

function renderCrossRelationLabel(relation: DrawnixMindMapCrossRelation): string {
    const layout = relation.labelLayout;
    if (!relation.label || !layout) {
        return '';
    }
    const centerX = layout.x + layout.width / 2;
    const firstLineY = layout.y + RELATION_LABEL_TEXT_OFFSET_Y;
    const lines = layout.lines.map((line, index) => `<tspan x="${centerX}" dy="${index === 0 ? 0 : layout.lineHeight}">${escapeHtml(line)}</tspan>`).join('');
    return `<g ${relationDataAttributes(relation)} data-drawnix-mindmap-relation-layer="label" clip-path="url(#notemd-drawnix-mindmap-content-clip)">
        <rect data-drawnix-mindmap-relation-label-background="true" x="${layout.x}" y="${layout.y}" width="${layout.width}" height="${layout.height}" rx="6" fill="#ffffff" fill-opacity="0.97" stroke="#cbd5e1" stroke-width="0.8" />
        <text data-drawnix-mindmap-relation-label="true" x="${centerX}" y="${firstLineY}" text-anchor="middle" class="notemd-drawnix-mindmap-relation-label">${lines}</text>
    </g>`;
}

function sourceVisualMetadata(visual: SourceVisualPreview): string {
    const lineLabel = visual.lineStart === visual.lineEnd
        ? `Source line ${visual.lineStart}`
        : `Source lines ${visual.lineStart}-${visual.lineEnd}`;
    const pathLabel = visual.sourcePath ? ` | ${visual.sourcePath}` : '';
    return `${lineLabel}${pathLabel}`;
}

function renderSourceVisualPanel(
    visual: SourceVisualPreview,
    index: number,
    panelX: number,
    panelY: number
): { markup: string; height: number } {
    const namespacedSvg = namespaceSourceVisualSvgIds(visual.svg, visual.id);
    const canvas = parseSourceVisualSvgCanvas(namespacedSvg);
    const contentWidth = SOURCE_VISUAL_PANEL_WIDTH - SOURCE_VISUAL_PANEL_PADDING * 2;
    const contentHeight = canvas
        ? Math.max(SOURCE_VISUAL_MIN_HEIGHT, Math.round(contentWidth * canvas.height / canvas.width))
        : SOURCE_VISUAL_MIN_HEIGHT;
    const cardHeight = SOURCE_VISUAL_PANEL_PADDING
        + SOURCE_VISUAL_HEADER_HEIGHT
        + SOURCE_VISUAL_CONTENT_GAP
        + contentHeight
        + SOURCE_VISUAL_PANEL_PADDING;
    const panelId = escapeAttribute(visual.id);
    const title = escapeHtml(visual.title);
    const metadata = escapeHtml(sourceVisualMetadata(visual));
    const preservedRootAttributes = canvas
        ? preserveSourceSvgRootAttributes(canvas.rootAttributes)
        : '';
    const nestedSvg = canvas
        ? `<svg x="${panelX + SOURCE_VISUAL_PANEL_PADDING}" y="${panelY + SOURCE_VISUAL_PANEL_PADDING + SOURCE_VISUAL_HEADER_HEIGHT + SOURCE_VISUAL_CONTENT_GAP}" width="${contentWidth}" height="${contentHeight}" viewBox="${canvas.viewBoxX} ${canvas.viewBoxY} ${canvas.width} ${canvas.height}" preserveAspectRatio="xMidYMid meet" overflow="hidden"${preservedRootAttributes ? ` ${preservedRootAttributes}` : ''} data-drawnix-mindmap-source-visual-svg="${panelId}">${canvas.innerMarkup}</svg>`
        : `<text x="${panelX + SOURCE_VISUAL_PANEL_PADDING}" y="${panelY + SOURCE_VISUAL_PANEL_PADDING + SOURCE_VISUAL_HEADER_HEIGHT + 32}" class="notemd-drawnix-source-visual-unavailable">Preview unavailable for this source visual.</text>`;

    return {
        height: cardHeight,
        markup: `<g data-drawnix-mindmap-source-visual-id="${panelId}" data-drawnix-mindmap-source-visual-kind="${escapeAttribute(visual.kind)}" data-drawnix-mindmap-source-visual-index="${index + 1}">
        <rect x="${panelX}" y="${panelY}" width="${SOURCE_VISUAL_PANEL_WIDTH}" height="${cardHeight}" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" />
        <text x="${panelX + SOURCE_VISUAL_PANEL_PADDING}" y="${panelY + SOURCE_VISUAL_PANEL_PADDING + 24}" class="notemd-drawnix-source-visual-title">${title}</text>
        <text x="${panelX + SOURCE_VISUAL_PANEL_PADDING}" y="${panelY + SOURCE_VISUAL_PANEL_PADDING + 44}" class="notemd-drawnix-source-visual-meta">${metadata}</text>
        ${nestedSvg}
    </g>`
    };
}

function renderSourceVisualPanels(
    projectionWidth: number,
    sourceVisuals: readonly SourceVisualPreview[]
): { markup: string; width: number; height: number } {
    if (sourceVisuals.length === 0) {
        return { markup: '', width: projectionWidth, height: 0 };
    }

    const panelX = projectionWidth + SOURCE_VISUAL_PANEL_GAP;
    let panelY = SOURCE_VISUAL_TOP_MARGIN + SOURCE_VISUAL_HEADER_HEIGHT;
    const panels = sourceVisuals.map((visual, index) => {
        const panel = renderSourceVisualPanel(visual, index, panelX, panelY);
        panelY += panel.height + SOURCE_VISUAL_VERTICAL_GAP;
        return panel.markup;
    });
    const lastPanelBottom = panelY - SOURCE_VISUAL_VERTICAL_GAP;
    const height = lastPanelBottom + SOURCE_VISUAL_PANEL_PADDING;
    const width = panelX + SOURCE_VISUAL_PANEL_WIDTH + SOURCE_VISUAL_RIGHT_MARGIN;

    return {
        width,
        height,
        markup: `<g data-drawnix-mindmap-source-visual-panels="${sourceVisuals.length}">
        <text x="${panelX}" y="44" class="notemd-drawnix-source-visual-heading">Source visuals</text>
        ${panels.join('')}
    </g>`
    };
}

function renderCanvasHeader(projection: DrawnixMindMapProjection): string {
    const header = projection.header;
    const headerWidth = Math.max(0, projection.width - 96);
    const headerHeight = Math.max(0, header.safeHeight - 16);
    const summary = header.summaryLines.length > 0
        ? `<text x="72" y="${header.summaryFirstBaseline}" fill="#64748b" font-family="${PREVIEW_FONT_FAMILY}" font-size="14">${header.summaryLines.map((line, index) => `<tspan data-drawnix-mindmap-summary-line="true" x="72" dy="${index === 0 ? 0 : header.summaryLineHeight}">${escapeHtml(line)}</tspan>`).join('')}</text>`
        : '';
    return `<g data-drawnix-mindmap-layer="header">
        <rect data-drawnix-mindmap-header-safe-height="${header.safeHeight}" x="48" y="16" width="${headerWidth}" height="${headerHeight}" fill="#ffffff" fill-opacity="0.98" />
        <text x="72" y="${header.titleBaseline}" fill="#172033" font-family="${PREVIEW_FONT_FAMILY}" font-size="24" font-weight="700">${escapeHtml(projection.title)}</text>
        ${summary}
    </g>`;
}

export function renderDrawnixMindMapSvg(
    projection: DrawnixMindMapProjection,
    sourceVisuals: readonly SourceVisualPreview[] = []
): string {
    const sourceVisualLayout = renderSourceVisualPanels(projection.width, sourceVisuals);
    const canvasWidth = sourceVisualLayout.width;
    const canvasHeight = Math.max(projection.height, sourceVisualLayout.height);

    // The PDF embeds one regular font face, so node labels use the same weight
    // in-browser to keep their measured width identical across both formats.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" role="img" aria-labelledby="notemd-drawnix-mindmap-title notemd-drawnix-mindmap-desc" data-notemd-renderer="${NOTEMD_DRAWNIX_MIND_MAP_SVG_RENDERER_VERSION}">
        <title id="notemd-drawnix-mindmap-title">${escapeHtml(projection.title)}</title>
        <desc id="notemd-drawnix-mindmap-desc">${escapeHtml(projection.summary ?? 'Drawnix knowledge map')}</desc>
        <style>
            .notemd-drawnix-mindmap-label { font-family: ${PREVIEW_FONT_STACK}; font-size: 14px; font-weight: 400; }
            .notemd-drawnix-mindmap-relation-label { font-family: ${PREVIEW_FONT_STACK}; font-size: 12px; fill: #475569; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
            .notemd-drawnix-source-visual-heading { font-family: ${PREVIEW_FONT_STACK}; font-size: 19px; font-weight: 700; fill: #172033; }
            .notemd-drawnix-source-visual-title { font-family: ${PREVIEW_FONT_STACK}; font-size: 15px; font-weight: 700; fill: #172033; }
            .notemd-drawnix-source-visual-meta { font-family: ${PREVIEW_FONT_STACK}; font-size: 11px; fill: #64748b; }
            .notemd-drawnix-source-visual-unavailable { font-family: ${PREVIEW_FONT_STACK}; font-size: 13px; fill: #b45309; }
        </style>
        <defs>
            <marker id="notemd-drawnix-mindmap-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <clipPath id="notemd-drawnix-mindmap-content-clip">
                <rect x="0" y="${projection.header.safeHeight}" width="${canvasWidth}" height="${Math.max(0, canvasHeight - projection.header.safeHeight)}" />
            </clipPath>
        </defs>
        <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="#ffffff" />
        ${projection.hierarchyBranches.map(renderHierarchyBranch).join('')}
        ${projection.crossRelations.map(renderCrossRelationPath).join('')}
        ${projection.nodes.map(renderNode).join('')}
        ${projection.crossRelations.map(renderCrossRelationLabel).join('')}
        ${sourceVisualLayout.markup}
        ${renderCanvasHeader(projection)}
    </svg>`;
    return normalizeSvgFontFamilyDeclarations(svg);
}
