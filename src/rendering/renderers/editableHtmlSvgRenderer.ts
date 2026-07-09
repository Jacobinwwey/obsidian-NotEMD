import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import {
    buildSemanticFigureModel,
    SemanticFigureEdge,
    SemanticFigureModel,
    SemanticFigureNode
} from '../../diagram/adapters/editableSvg/semanticFigureModel';
import { DiagramRenderer, RenderArtifact } from '../types';

export const NOTEMD_EDITABLE_SVG_RENDERER_VERSION = 'notemd-editable-html-svg@0.1.0';

const SUPPORTED_EDITABLE_FIGURE_INTENTS = new Set<DiagramSpec['intent']>([
    'mindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram'
]);

const STANDALONE_SEMANTIC_FIGURE_SVG_STYLE = `.notemd-editable-svg-canvas {
    fill: var(--notemd-editable-svg-panel, #ffffff);
}
.notemd-editable-svg-title {
    fill: var(--notemd-editable-svg-text, #111827);
    font-size: 26px;
    font-weight: 700;
}
.notemd-editable-svg-summary {
    fill: var(--notemd-editable-svg-muted, #475569);
    font-size: 14px;
}
.notemd-editable-svg-node rect {
    fill: var(--notemd-editable-svg-node-fill, #eff6ff);
    stroke: var(--notemd-editable-svg-border, #cbd5e1);
    stroke-width: 1.5;
}
.notemd-editable-svg-node-label {
    fill: var(--notemd-editable-svg-text, #111827);
    font-size: 15px;
    font-weight: 650;
}
.notemd-editable-svg-node-role {
    fill: var(--notemd-editable-svg-accent, #2563eb);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
}
.notemd-editable-svg-edge path {
    fill: none;
    stroke: var(--notemd-editable-svg-edge, #334155);
    stroke-width: 1.8;
}
.notemd-editable-svg-edge-label {
    fill: var(--notemd-editable-svg-muted, #475569);
    paint-order: stroke;
    stroke: var(--notemd-editable-svg-panel, #ffffff);
    stroke-width: 4px;
    font-size: 12px;
    font-weight: 600;
}
marker path {
    fill: var(--notemd-editable-svg-edge, #334155);
}`;

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

function renderMultilineSvgText(value: string, x: number, y: number, lineHeight: number, maxCharsPerLine: number): string {
    const words = value.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length > maxCharsPerLine && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = candidate;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    const visibleLines = lines.slice(0, 3);
    const truncatedLines = lines.length > visibleLines.length
        ? [...visibleLines.slice(0, 2), `${visibleLines[2].slice(0, Math.max(0, maxCharsPerLine - 1))}...`]
        : visibleLines;

    return `<text data-drawio-ignore="part-of-parent-node" x="${x}" y="${y}" text-anchor="middle" class="notemd-editable-svg-node-label">
        ${truncatedLines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`).join('')}
    </text>`;
}

function renderNode(node: SemanticFigureNode): string {
    const centerX = node.x + node.width / 2;
    const labelY = node.y + 48;

    return `<g id="${escapeAttribute(node.id)}" class="notemd-editable-svg-node" data-drawio-type="node" data-drawio-role="${escapeAttribute(node.role)}" data-drawio-id="${escapeAttribute(node.id)}">
        <rect data-drawio-ignore="part-of-parent-node" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="14" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
        ${renderMultilineSvgText(node.label, centerX, labelY, 18, 24)}
        <text data-drawio-ignore="part-of-parent-node" x="${centerX}" y="${node.y + node.height - 18}" text-anchor="middle" class="notemd-editable-svg-node-role" fill="#2563eb">${escapeHtml(node.role)}</text>
    </g>`;
}

function renderEdgePath(edge: SemanticFigureEdge): string {
    const midX = (edge.startX + edge.endX) / 2;
    const path = `M ${edge.startX} ${edge.startY} C ${midX} ${edge.startY}, ${midX} ${edge.endY}, ${edge.endX} ${edge.endY}`;

    return `<g id="${escapeAttribute(edge.id)}" class="notemd-editable-svg-edge" data-drawio-type="edge" data-drawio-id="${escapeAttribute(edge.id)}" data-drawio-source="${escapeAttribute(edge.sourceId)}" data-drawio-target="${escapeAttribute(edge.targetId)}">
        <path data-drawio-ignore="part-of-parent-edge" d="${path}" fill="none" stroke="#334155" stroke-width="1.8" marker-end="url(#notemd-editable-svg-arrow)" />
    </g>`;
}

function renderEdgeLabel(edge: SemanticFigureEdge): string {
    const label = edge.label || edge.relation;
    if (!label) {
        return '';
    }

    return `<text data-drawio-ignore="part-of-parent-edge" x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle" class="notemd-editable-svg-edge-label" fill="#475569" stroke="#ffffff" stroke-width="4" paint-order="stroke">${escapeHtml(label)}</text>`;
}

function renderCallouts(model: SemanticFigureModel): string {
    if (model.callouts.length === 0) {
        return '';
    }

    return `<section class="notemd-editable-svg-callouts" aria-label="Figure callouts">
        ${model.callouts.map(callout => `<article>
            <h2>${escapeHtml(callout.label)}</h2>
            <p>${escapeHtml(callout.detail)}</p>
        </article>`).join('')}
    </section>`;
}

export function renderSemanticFigureSvg(model: SemanticFigureModel): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-labelledby="notemd-editable-svg-title notemd-editable-svg-desc" data-notemd-renderer="${NOTEMD_EDITABLE_SVG_RENDERER_VERSION}">
        <title id="notemd-editable-svg-title">${escapeHtml(model.title)}</title>
        <desc id="notemd-editable-svg-desc">${escapeHtml(model.summary ?? `${model.intent} figure`)}</desc>
        <style>${STANDALONE_SEMANTIC_FIGURE_SVG_STYLE}</style>
        <defs>
            <marker id="notemd-editable-svg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path data-drawio-ignore="marker-shape" d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
            </marker>
        </defs>
        <rect data-drawio-ignore="canvas-background" class="notemd-editable-svg-canvas" x="0" y="0" width="${model.width}" height="${model.height}" rx="18" fill="#ffffff" />
        <text data-drawio-ignore="document-title" x="72" y="48" class="notemd-editable-svg-title" fill="#111827">${escapeHtml(model.title)}</text>
        ${model.summary ? `<text data-drawio-ignore="document-summary" x="72" y="78" class="notemd-editable-svg-summary" fill="#475569">${escapeHtml(model.summary)}</text>` : ''}
        ${model.edges.map(renderEdgePath).join('')}
        ${model.nodes.map(renderNode).join('')}
        ${model.edges.map(renderEdgeLabel).join('')}
    </svg>`;
}

function readSvgViewBoxDimensions(svg: string): { width: number; height: number } | null {
    const viewBoxMatch = svg.match(/\bviewBox=["']([^"']+)["']/i);
    if (!viewBoxMatch) {
        return null;
    }

    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || !Number.isFinite(parts[2]) || !Number.isFinite(parts[3]) || parts[2] <= 0 || parts[3] <= 0) {
        return null;
    }

    return {
        width: parts[2],
        height: parts[3]
    };
}

function ensureSvgRootDimensions(svg: string): string {
    const rootMatch = svg.match(/<svg\b([^>]*)>/i);
    if (!rootMatch) {
        return svg;
    }

    const attrs = rootMatch[1];
    const hasWidth = /\bwidth=["']/i.test(attrs);
    const hasHeight = /\bheight=["']/i.test(attrs);
    if (hasWidth && hasHeight) {
        return svg;
    }

    const dimensions = readSvgViewBoxDimensions(svg);
    if (!dimensions) {
        return svg;
    }

    const dimensionAttrs = [
        hasWidth ? '' : ` width="${dimensions.width}"`,
        hasHeight ? '' : ` height="${dimensions.height}"`
    ].join('');
    const replacement = `<svg${dimensionAttrs}${attrs}>`;
    return svg.replace(rootMatch[0], replacement);
}

export function ensureSemanticFigureSvgStandaloneStyles(svg: string): string {
    if (!svg.includes(`data-notemd-renderer="${NOTEMD_EDITABLE_SVG_RENDERER_VERSION}"`)) {
        return svg;
    }

    let normalized = ensureSvgRootDimensions(svg);
    if (/<style\b/i.test(normalized)) {
        return normalized;
    }

    const style = `<style>${STANDALONE_SEMANTIC_FIGURE_SVG_STYLE}</style>`;
    if (/<desc\b[\s\S]*?<\/desc>/i.test(normalized)) {
        return normalized.replace(/(<desc\b[\s\S]*?<\/desc>)/i, `$1\n        ${style}`);
    }

    return normalized.replace(/(<svg\b[^>]*>)/i, `$1\n        ${style}`);
}

export function renderSemanticFigureHtmlDocument(model: SemanticFigureModel): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
    <meta name="notemd-renderer" content="${NOTEMD_EDITABLE_SVG_RENDERER_VERSION}" />
    <title>${escapeHtml(model.title)}</title>
    <style>
        :root {
            color-scheme: light dark;
            --notemd-editable-svg-bg: #f8fafc;
            --notemd-editable-svg-panel: #ffffff;
            --notemd-editable-svg-node-fill: #eff6ff;
            --notemd-editable-svg-text: #111827;
            --notemd-editable-svg-muted: #475569;
            --notemd-editable-svg-border: #cbd5e1;
            --notemd-editable-svg-accent: #2563eb;
            --notemd-editable-svg-edge: #334155;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --notemd-editable-svg-bg: #020617;
                --notemd-editable-svg-panel: #0f172a;
                --notemd-editable-svg-node-fill: #1e293b;
                --notemd-editable-svg-text: #e2e8f0;
                --notemd-editable-svg-muted: #94a3b8;
                --notemd-editable-svg-border: #334155;
                --notemd-editable-svg-accent: #93c5fd;
                --notemd-editable-svg-edge: #cbd5e1;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 24px;
            background: var(--notemd-editable-svg-bg);
            color: var(--notemd-editable-svg-text);
            font: 14px/1.5 "Segoe UI", Arial, sans-serif;
        }

        main {
            display: grid;
            gap: 16px;
            max-width: 1180px;
            margin: 0 auto;
        }

        .notemd-editable-svg-sheet {
            width: 100%;
            overflow: auto;
            border: 1px solid var(--notemd-editable-svg-border);
            border-radius: 8px;
            background: var(--notemd-editable-svg-panel);
        }

        svg {
            display: block;
            width: 100%;
            min-width: 680px;
            height: auto;
        }

        .notemd-editable-svg-canvas {
            fill: var(--notemd-editable-svg-panel);
        }

        .notemd-editable-svg-title {
            fill: var(--notemd-editable-svg-text);
            font-size: 26px;
            font-weight: 700;
        }

        .notemd-editable-svg-summary {
            fill: var(--notemd-editable-svg-muted);
            font-size: 14px;
        }

        .notemd-editable-svg-node rect {
            fill: color-mix(in srgb, var(--notemd-editable-svg-panel) 88%, var(--notemd-editable-svg-accent));
            stroke: var(--notemd-editable-svg-border);
            stroke-width: 1.5;
        }

        .notemd-editable-svg-node-label {
            fill: var(--notemd-editable-svg-text);
            font-size: 15px;
            font-weight: 650;
        }

        .notemd-editable-svg-node-role {
            fill: var(--notemd-editable-svg-accent);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .notemd-editable-svg-edge path {
            fill: none;
            stroke: var(--notemd-editable-svg-edge);
            stroke-width: 1.8;
        }

        .notemd-editable-svg-edge-label {
            fill: var(--notemd-editable-svg-muted);
            paint-order: stroke;
            stroke: var(--notemd-editable-svg-panel);
            stroke-width: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        marker path {
            fill: var(--notemd-editable-svg-edge);
        }

        .notemd-editable-svg-callouts {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .notemd-editable-svg-callouts article {
            border: 1px solid var(--notemd-editable-svg-border);
            border-radius: 8px;
            padding: 12px;
            background: var(--notemd-editable-svg-panel);
        }

        .notemd-editable-svg-callouts h2,
        .notemd-editable-svg-callouts p {
            margin: 0;
        }

        .notemd-editable-svg-callouts h2 {
            margin-bottom: 4px;
            font-size: 0.86rem;
        }
    </style>
</head>
<body>
    <main data-notemd-renderer="${NOTEMD_EDITABLE_SVG_RENDERER_VERSION}">
        <section class="notemd-editable-svg-sheet" aria-label="Editable SVG figure">
            ${renderSemanticFigureSvg(model)}
        </section>
        ${renderCallouts(model)}
    </main>
</body>
</html>`;
}

function readAttributes(source: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const attrRegex = /\s([:\w-]+)=["']([^"']*)["']/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(source)) !== null) {
        attrs.set(match[1], match[2]);
    }

    return attrs;
}

function describeSvgGroup(attrs: Map<string, string>): string {
    const id = attrs.get('id') || attrs.get('data-drawio-id');
    return id ? `g#${id}` : 'g';
}

export function collectEditableSvgAnnotationGaps(html: string): string[] {
    const gaps: string[] = [];
    const groupRegex = /<g\b([^>]*)>/gi;
    let match: RegExpExecArray | null;

    while ((match = groupRegex.exec(html)) !== null) {
        const attrs = readAttributes(match[1]);
        if (attrs.has('data-drawio-ignore')) {
            continue;
        }

        const drawioType = attrs.get('data-drawio-type');
        const groupLabel = describeSvgGroup(attrs);
        if (!drawioType) {
            gaps.push(`${groupLabel} is missing data-drawio-type`);
            continue;
        }

        if (drawioType === 'node') {
            if (!attrs.get('data-drawio-id')) {
                gaps.push(`${groupLabel} is missing data-drawio-id`);
            }
            if (!attrs.get('data-drawio-role')) {
                gaps.push(`${groupLabel} is missing data-drawio-role`);
            }
        }

        if (drawioType === 'edge') {
            if (!attrs.get('data-drawio-source')) {
                gaps.push(`${groupLabel} is missing data-drawio-source`);
            }
            if (!attrs.get('data-drawio-target')) {
                gaps.push(`${groupLabel} is missing data-drawio-target`);
            }
        }
    }

    return gaps;
}

export class EditableHtmlSvgRenderer implements DiagramRenderer {
    readonly id = 'editable-html-svg';
    readonly target = 'editable-html-svg' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_EDITABLE_FIGURE_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const model = buildSemanticFigureModel(spec);
        return {
            target: this.target,
            content: renderSemanticFigureHtmlDocument(model),
            mimeType: 'text/html',
            sourceIntent: spec.intent
        };
    }
}
