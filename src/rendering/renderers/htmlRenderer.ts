import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramEdge, DiagramNode, DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderOptionalText(label: string, value?: string): string {
    if (!value?.trim()) {
        return '';
    }

    return `<p class="notemd-html-renderer-meta"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value.trim())}</p>`;
}

function renderNodeTree(nodes: DiagramNode[]): string {
    if (nodes.length === 0) {
        return '<p class="notemd-html-renderer-empty">No structural nodes were generated for this diagram.</p>';
    }

    return `<ul class="notemd-html-renderer-node-tree">${nodes.map(renderNode).join('')}</ul>`;
}

function renderNode(node: DiagramNode): string {
    const children = node.children?.length ? renderNodeTree(node.children) : '';
    const kind = node.kind?.trim()
        ? `<span class="notemd-html-renderer-chip">${escapeHtml(node.kind.trim())}</span>`
        : '';

    return `<li>
        <div class="notemd-html-renderer-node-row">
            <span class="notemd-html-renderer-node-label">${escapeHtml(node.label)}</span>
            ${kind}
        </div>
        ${children}
    </li>`;
}

function renderEdge(edge: DiagramEdge, labels: Map<string, string>): string {
    const from = labels.get(edge.from) ?? edge.from;
    const to = labels.get(edge.to) ?? edge.to;
    const relation = edge.relation?.trim() ? ` <span class="notemd-html-renderer-chip">${escapeHtml(edge.relation.trim())}</span>` : '';
    const label = edge.label?.trim() ? ` <span class="notemd-html-renderer-edge-label">${escapeHtml(edge.label.trim())}</span>` : '';

    return `<li><strong>${escapeHtml(from)}</strong> → <strong>${escapeHtml(to)}</strong>${relation}${label}</li>`;
}

function renderEdges(edges: DiagramEdge[], labels: Map<string, string>): string {
    if (edges.length === 0) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>Relationships</h2>
        <ul class="notemd-html-renderer-list">${edges.map(edge => renderEdge(edge, labels)).join('')}</ul>
    </section>`;
}

function renderCallouts(spec: DiagramSpec): string {
    if (!spec.callouts?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>Callouts</h2>
        <ul class="notemd-html-renderer-list">${spec.callouts.map(callout => `
            <li><strong>${escapeHtml(callout.label)}</strong>: ${escapeHtml(callout.detail)}</li>
        `).join('')}</ul>
    </section>`;
}

function renderEvidenceRefs(spec: DiagramSpec): string {
    if (!spec.evidenceRefs?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>Evidence</h2>
        <ul class="notemd-html-renderer-list">${spec.evidenceRefs.map(reference => `<li>${escapeHtml(reference)}</li>`).join('')}</ul>
    </section>`;
}

function renderDataSeries(spec: DiagramSpec): string {
    if (!spec.dataSeries?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>Data</h2>
        ${spec.dataSeries.map(series => `
            <article class="notemd-html-renderer-series">
                <h3>${escapeHtml(series.label)}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>X</th>
                            <th>Y</th>
                            <th>Series</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${series.points.map(point => `
                            <tr>
                                <td>${escapeHtml(String(point.x))}</td>
                                <td>${escapeHtml(String(point.y))}</td>
                                <td>${escapeHtml(point.series ?? series.label)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </article>
        `).join('')}
    </section>`;
}

function collectNodeLabels(nodes: DiagramNode[], labels: Map<string, string> = new Map<string, string>()): Map<string, string> {
    for (const node of nodes) {
        labels.set(node.id, node.label);
        if (node.children?.length) {
            collectNodeLabels(node.children, labels);
        }
    }

    return labels;
}

function renderHtmlDocument(spec: DiagramSpec): string {
    const nodeLabels = collectNodeLabels(spec.nodes);

    return `<!DOCTYPE html>
<html lang="${escapeHtml(spec.outputLanguage || 'en')}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
    <title>${escapeHtml(spec.title)}</title>
    <style>
        :root {
            color-scheme: light dark;
            --notemd-html-bg: #f8fafc;
            --notemd-html-panel: rgba(255, 255, 255, 0.96);
            --notemd-html-text: #0f172a;
            --notemd-html-muted: #475569;
            --notemd-html-border: rgba(148, 163, 184, 0.32);
            --notemd-html-chip: rgba(59, 130, 246, 0.14);
            --notemd-html-accent: #2563eb;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --notemd-html-bg: #020617;
                --notemd-html-panel: rgba(15, 23, 42, 0.96);
                --notemd-html-text: #e2e8f0;
                --notemd-html-muted: #94a3b8;
                --notemd-html-border: rgba(148, 163, 184, 0.24);
                --notemd-html-chip: rgba(96, 165, 250, 0.18);
                --notemd-html-accent: #93c5fd;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 24px;
            background: radial-gradient(circle at top, rgba(37, 99, 235, 0.10), transparent 40%), var(--notemd-html-bg);
            color: var(--notemd-html-text);
            font: 15px/1.6 "IBM Plex Sans", "Segoe UI", sans-serif;
        }

        main {
            max-width: 980px;
            margin: 0 auto;
            padding: 24px;
            border: 1px solid var(--notemd-html-border);
            border-radius: 20px;
            background: var(--notemd-html-panel);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
        }

        h1, h2, h3 {
            margin: 0 0 12px;
            line-height: 1.2;
        }

        h1 {
            font-size: 2rem;
        }

        h2 {
            font-size: 1.05rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--notemd-html-muted);
        }

        p {
            margin: 0 0 12px;
        }

        .notemd-html-renderer-hero {
            display: grid;
            gap: 12px;
            margin-bottom: 24px;
        }

        .notemd-html-renderer-intent {
            display: inline-flex;
            width: fit-content;
            padding: 4px 10px;
            border-radius: 999px;
            background: var(--notemd-html-chip);
            color: var(--notemd-html-accent);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .notemd-html-renderer-meta,
        .notemd-html-renderer-empty,
        .notemd-html-renderer-edge-label {
            color: var(--notemd-html-muted);
        }

        .notemd-html-renderer-section {
            margin-top: 28px;
        }

        .notemd-html-renderer-list,
        .notemd-html-renderer-node-tree {
            margin: 0;
            padding-left: 20px;
        }

        .notemd-html-renderer-node-tree {
            display: grid;
            gap: 10px;
        }

        .notemd-html-renderer-node-row {
            display: inline-flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .notemd-html-renderer-node-label {
            font-weight: 600;
        }

        .notemd-html-renderer-chip {
            display: inline-flex;
            padding: 2px 8px;
            border-radius: 999px;
            background: var(--notemd-html-chip);
            color: var(--notemd-html-accent);
            font-size: 0.72rem;
            font-weight: 600;
        }

        .notemd-html-renderer-series {
            margin-top: 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid var(--notemd-html-border);
            border-radius: 12px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.02);
        }

        th,
        td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--notemd-html-border);
            text-align: left;
        }

        th {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--notemd-html-muted);
        }

        tr:last-child td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <main>
        <section class="notemd-html-renderer-hero">
            <span class="notemd-html-renderer-intent">${escapeHtml(spec.intent)}</span>
            <h1>${escapeHtml(spec.title)}</h1>
            ${spec.summary?.trim() ? `<p>${escapeHtml(spec.summary.trim())}</p>` : ''}
            ${renderOptionalText('Source language', spec.sourceLanguage)}
            ${renderOptionalText('Output language', spec.outputLanguage)}
        </section>

        <section class="notemd-html-renderer-section">
            <h2>Structure</h2>
            ${renderNodeTree(spec.nodes)}
        </section>

        ${renderEdges(spec.edges ?? [], nodeLabels)}
        ${renderDataSeries(spec)}
        ${renderCallouts(spec)}
        ${renderEvidenceRefs(spec)}
    </main>
</body>
</html>`;
}

export class HtmlRenderer implements DiagramRenderer {
    readonly id = 'html';
    readonly target = 'html' as const;

    supports(_spec: DiagramSpec): boolean {
        return true;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        return {
            target: this.target,
            content: renderHtmlDocument(spec),
            mimeType: 'text/html',
            sourceIntent: spec.intent
        };
    }
}
