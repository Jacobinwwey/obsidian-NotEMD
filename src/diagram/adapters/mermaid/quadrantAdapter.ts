import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidText
} from './base';

function sanitizeQuadrantText(value: string): string {
    // A provider can mistake the JSON coordinate delimiter for part of the
    // human label (for example, `Docs gallery[`). Mermaid then renders that
    // delimiter as visible text. Strip only unmatched opening brackets at the
    // end of quadrant-owned labels; other Mermaid families may use brackets
    // legitimately and must keep the shared sanitizer unchanged.
    return sanitizeMermaidText(value).replace(/\s*\[+$/, '').trim();
}

function buildUniqueLabels(items: readonly { id: string; label: string; detail?: string }[]): Map<string, string> {
    const labels = new Map<string, string>();
    const used = new Set<string>();
    items.forEach(item => {
        const detail = item.detail?.trim() ? ` - ${sanitizeQuadrantText(item.detail)}` : '';
        const base = sanitizeQuadrantText(`${item.label}${detail}`) || sanitizeMermaidIdentifier(item.id);
        let candidate = base;
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base} (${suffix})`;
            suffix += 1;
        }
        used.add(candidate);
        labels.set(item.id, candidate);
    });
    return labels;
}

export function renderQuadrantMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['quadrant'], 'QuadrantMermaidAdapter');

    const quadrant = spec.quadrant;
    if (!quadrant) {
        throw new Error('QuadrantMermaidAdapter requires a validated quadrant payload.');
    }
    const lines = [
        'quadrantChart',
        `${indent(1)}title ${sanitizeMermaidText(spec.title)}`,
        `${indent(1)}x-axis ${sanitizeMermaidText(quadrant.xAxisLabel[0])} --> ${sanitizeMermaidText(quadrant.xAxisLabel[1])}`,
        `${indent(1)}y-axis ${sanitizeMermaidText(quadrant.yAxisLabel[0])} --> ${sanitizeMermaidText(quadrant.yAxisLabel[1])}`,
        `${indent(1)}quadrant-1 ${sanitizeMermaidText(quadrant.quadrantLabels[0])}`,
        `${indent(1)}quadrant-2 ${sanitizeMermaidText(quadrant.quadrantLabels[1])}`,
        `${indent(1)}quadrant-3 ${sanitizeMermaidText(quadrant.quadrantLabels[2])}`,
        `${indent(1)}quadrant-4 ${sanitizeMermaidText(quadrant.quadrantLabels[3])}`
    ];
    const labels = buildUniqueLabels(quadrant.items);
    quadrant.items.forEach(item => {
        const label = labels.get(item.id) ?? sanitizeMermaidIdentifier(item.id);
        lines.push(`${indent(1)}"${label}": [${item.x}, ${item.y}]`);
    });

    return mermaidFence(lines);
}
