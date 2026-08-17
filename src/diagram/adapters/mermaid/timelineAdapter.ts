import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    indent,
    mermaidFence,
    sanitizeMermaidText
} from './base';

function sanitizeTimelineDate(value: string | number): string {
    return sanitizeMermaidText(String(value)).replace(/:/g, '-');
}

export function renderTimelineMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['timeline'], 'TimelineMermaidAdapter');

    const lines = [
        'timeline',
        `${indent(1)}title ${sanitizeMermaidText(spec.title)}`
    ];
    (spec.timelineEvents ?? []).forEach(event => {
        lines.push(`${indent(1)}${sanitizeTimelineDate(event.date)} : ${sanitizeMermaidText(event.label)}`);
        (event.details ?? []).forEach(detail => {
            lines.push(`${indent(2)}: ${sanitizeMermaidText(detail)}`);
        });
    });

    return mermaidFence(lines);
}
