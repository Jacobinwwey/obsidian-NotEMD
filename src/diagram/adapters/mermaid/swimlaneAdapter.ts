import { DiagramSpec } from '../../types';
import {
    assertMermaidSpecIntent,
    indent,
    mermaidFence,
    sanitizeMermaidIdentifier,
    sanitizeMermaidPipeEdgeLabel,
    sanitizeMermaidText
} from './base';

function buildUniqueIdMap(ids: readonly string[]): Map<string, string> {
    const result = new Map<string, string>();
    const used = new Set<string>();
    ids.forEach(id => {
        const base = sanitizeMermaidIdentifier(id);
        let candidate = base;
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base}_${suffix}`;
            suffix += 1;
        }
        used.add(candidate);
        result.set(id, candidate);
    });
    return result;
}

export function renderSwimlaneMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['swimlane'], 'SwimlaneMermaidAdapter');

    const lanes = spec.swimlaneLanes ?? [];
    const ids = buildUniqueIdMap([
        ...lanes.map(lane => lane.id),
        ...lanes.flatMap(lane => lane.steps.map(step => step.id))
    ]);
    const lines = ['flowchart LR'];
    lanes.forEach(lane => {
        const laneId = ids.get(lane.id) ?? sanitizeMermaidIdentifier(lane.id);
        lines.push(`${indent(1)}subgraph ${laneId}["${sanitizeMermaidText(lane.label)}"]`);
        lane.steps.forEach(step => {
            const stepId = ids.get(step.id) ?? sanitizeMermaidIdentifier(step.id);
            lines.push(`${indent(2)}${stepId}["${sanitizeMermaidText(step.label)}"]`);
        });
        lane.steps.forEach((step, index) => {
            const nextId = step.nextStepId ?? lane.steps[index + 1]?.id;
            if (!nextId) {
                return;
            }
            const fromId = ids.get(step.id) ?? sanitizeMermaidIdentifier(step.id);
            const toId = ids.get(nextId) ?? sanitizeMermaidIdentifier(nextId);
            lines.push(`${indent(2)}${fromId} -->|${sanitizeMermaidPipeEdgeLabel(lane.label)}| ${toId}`);
        });
        lines.push(`${indent(1)}end`);
    });

    return mermaidFence(lines);
}
