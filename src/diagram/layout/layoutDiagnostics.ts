import type { DiagramSpec } from '../types';
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
} from '../payloads/types';
import { wrapMeasuredText } from './layoutSafety';

export interface LayoutSafetyDiagnostic {
    severity: 'info' | 'warning' | 'error';
    kind: string;
    message: string;
    advice?: string;
}

interface TextBudget {
    path: string;
    value: string | undefined;
    maxWidth: number;
    maxLines: number;
    required: boolean;
}

function textBudget(path: string, value: string | undefined, maxWidth: number, maxLines: number, required = false): TextBudget {
    return { path, value, maxWidth, maxLines, required };
}

function textDiagnostics(budgets: readonly TextBudget[]): LayoutSafetyDiagnostic[] {
    const diagnostics: LayoutSafetyDiagnostic[] = [];
    for (const budget of budgets) {
        if (!budget.value?.trim()) continue;
        const block = wrapMeasuredText(budget.value, budget.maxWidth, budget.maxLines);
        if (!block.truncated) continue;
        diagnostics.push({
            severity: budget.required ? 'error' : 'warning',
            kind: 'layout-text-overflow',
            message: `${budget.path} cannot fit within the renderer text budget (${budget.maxLines} lines / ${budget.maxWidth}px).`,
            advice: budget.required
                ? 'Shorten the core label or choose a less dense diagram type; core labels are never silently discarded.'
                : 'Optional detail will be elided in the preview to preserve node and edge clarity.'
        });
    }
    return diagnostics;
}

function topologyBudgets(payload: DiagramTopologyPayload): TextBudget[] {
    return [
        ...payload.zones.flatMap((zone, index) => [
            textBudget(`payload.zones[${index}].label`, zone.label, 260, 2, true),
            textBudget(`payload.zones[${index}].sub`, zone.sub, 260, 2)
        ]),
        ...payload.nodes.flatMap((node, index) => [
            textBudget(`payload.nodes[${index}].label`, node.label, 240, 2, true),
            textBudget(`payload.nodes[${index}].sub`, node.sub, 240, 2)
        ]),
        ...payload.edges.map((edge, index) => textBudget(`payload.edges[${index}].label`, edge.label, 80, 1, true))
    ];
}

function laneGridBudgets(payload: DiagramLaneGridPayload): TextBudget[] {
    return [
        ...payload.steps.map((step, index) => textBudget(`payload.steps[${index}].label`, step.label, 112, 2, true)),
        ...payload.lanes.flatMap((lane, index) => [
            textBudget(`payload.lanes[${index}].label`, lane.label, 120, 2, true),
            textBudget(`payload.lanes[${index}].sub`, lane.sub, 120, 2)
        ]),
        ...payload.cells.flatMap((cell, index) => [
            textBudget(`payload.cells[${index}].title`, cell.title, 112, 2, true),
            textBudget(`payload.cells[${index}].sub`, cell.sub, 112, 1),
            textBudget(`payload.cells[${index}].tool`, cell.tool, 112, 1)
        ]),
        ...payload.edges.map((edge, index) => textBudget(`payload.edges[${index}].label`, edge.label, 112, 1, true))
    ];
}

function accessMatrixBudgets(payload: DiagramAccessMatrixPayload): TextBudget[] {
    return [
        ...payload.roles.flatMap((role, index) => [
            textBudget(`payload.roles[${index}].label`, role.label, 128, 2, true),
            textBudget(`payload.roles[${index}].code`, role.code, 128, 1)
        ]),
        ...payload.components.flatMap((component, index) => [
            textBudget(`payload.components[${index}].label`, component.label, 200, 2, true),
            textBudget(`payload.components[${index}].hint`, component.hint, 180, 1)
        ]),
        ...payload.cells.flatMap((cell, index) => [
            textBudget(`payload.cells[${index}].value`, cell.value, 128, 2, true),
            textBudget(`payload.cells[${index}].sub`, cell.sub, 128, 1)
        ])
    ];
}

function radarBudgets(spec: DiagramSpec): TextBudget[] {
    const radar = spec.radarSpec;
    if (!radar) return [];
    return [
        ...radar.axes.map((axis, index) => textBudget(`radarSpec.axes[${index}].label`, axis.label, 132, 2, true)),
        ...radar.series.flatMap((series, seriesIndex) => [
            textBudget(`radarSpec.series[${seriesIndex}].label`, series.label, 132, 2, true)
        ])
    ];
}

function orgChartBudgets(spec: DiagramSpec): TextBudget[] {
    const orgChart = spec.orgChartSpec;
    if (!orgChart) return [];
    return orgChart.nodes.flatMap((node, index) => [
        textBudget(`orgChartSpec.nodes[${index}].label`, node.label, 180, 2, true),
        textBudget(`orgChartSpec.nodes[${index}].role`, node.role, 180, 1),
        ...(node.scope ?? []).map((scope, scopeIndex) => textBudget(`orgChartSpec.nodes[${index}].scope[${scopeIndex}]`, scope, 180, 1))
    ]);
}

function timelineBudgets(spec: DiagramSpec): TextBudget[] {
    return (spec.timelineEvents ?? []).flatMap((event, index) => [
        textBudget(`timelineEvents[${index}].date`, String(event.date), 120, 1, true),
        textBudget(`timelineEvents[${index}].label`, event.label, 180, 2, true),
        ...(event.details ?? []).map((detail, detailIndex) => textBudget(`timelineEvents[${index}].details[${detailIndex}]`, detail, 180, 1))
    ]);
}

function swimlaneBudgets(spec: DiagramSpec): TextBudget[] {
    return (spec.swimlaneLanes ?? []).flatMap((lane, laneIndex) => [
        textBudget(`swimlaneLanes[${laneIndex}].label`, lane.label, 160, 2, true),
        ...lane.steps.flatMap((step, stepIndex) => [
            textBudget(`swimlaneLanes[${laneIndex}].steps[${stepIndex}].label`, step.label, 180, 2, true)
        ])
    ]);
}

function quadrantBudgets(spec: DiagramSpec): TextBudget[] {
    const quadrant = spec.quadrant;
    if (!quadrant) return [];
    return [
        ...quadrant.xAxisLabel.map((label, index) => textBudget(`quadrant.xAxisLabel[${index}]`, label, 150, 2, true)),
        ...quadrant.yAxisLabel.map((label, index) => textBudget(`quadrant.yAxisLabel[${index}]`, label, 150, 2, true)),
        ...quadrant.quadrantLabels.map((label, index) => textBudget(`quadrant.quadrantLabels[${index}]`, label, 160, 2, true)),
        ...quadrant.items.flatMap((item, index) => [
            textBudget(`quadrant.items[${index}].label`, item.label, 180, 2, true),
            textBudget(`quadrant.items[${index}].detail`, item.detail, 180, 1)
        ])
    ];
}

function scheduleBudgets(payload: DiagramSchedulePayload): TextBudget[] {
    return [
        ...payload.tasks.flatMap((task, index) => [
            textBudget(`payload.tasks[${index}].label`, task.label, 220, 2, true),
            textBudget(`payload.tasks[${index}].phaseId`, task.phaseId, 112, 1)
        ]),
        ...(payload.milestones ?? []).map((milestone, index) => textBudget(`payload.milestones[${index}].label`, milestone.label, 140, 2))
    ];
}

function orderedStackBudgets(payload: DiagramOrderedStackPayload): TextBudget[] {
    return payload.layers.flatMap((layer, index) => [
        textBudget(`payload.layers[${index}].label`, layer.label, 560, 2, true),
        textBudget(`payload.layers[${index}].sub`, layer.sub, 240, 2)
    ]);
}

function setOverlapBudgets(payload: DiagramSetOverlapPayload): TextBudget[] {
    return [
        ...payload.sets.flatMap((set, index) => [
            textBudget(`payload.sets[${index}].label`, set.label, 150, 2, true),
            textBudget(`payload.sets[${index}].sub`, set.sub, 150, 2)
        ]),
        ...payload.intersections.map((intersection, index) => textBudget(`payload.intersections[${index}].label`, intersection.label, 150, 2, true))
    ];
}

function rankedBudgets(payload: DiagramRankedSegmentsPayload): TextBudget[] {
    return payload.segments.flatMap((segment, index) => [
        textBudget(`payload.segments[${index}].label`, segment.label, 360, 1, true),
        textBudget(`payload.segments[${index}].sub`, segment.sub, 360, 1)
    ]);
}

function cycleBudgets(payload: DiagramCyclePayload): TextBudget[] {
    return [
        textBudget('payload.hub.label', payload.hub.label, 160, 2, true),
        textBudget('payload.hub.sub', payload.hub.sub, 160, 1),
        ...payload.stations.flatMap((station, index) => [
            textBudget(`payload.stations[${index}].label`, station.label, 118, 2, true),
            textBudget(`payload.stations[${index}].sub`, station.sub, 118, 1),
            textBudget(`payload.stations[${index}].spokeLabel`, station.spokeLabel, 120, 1)
        ])
    ];
}

function nestedBudgets(payload: DiagramNestedPayload): TextBudget[] {
    return payload.levels.flatMap((level, index) => [
        textBudget(`payload.levels[${index}].label`, level.label, 220, 1, true),
        textBudget(`payload.levels[${index}].sub`, level.sub, 220, 1)
    ]);
}

function treeBudgets(payload: DiagramTreePayload): TextBudget[] {
    return payload.nodes.flatMap((node, index) => [
        textBudget(`payload.nodes[${index}].label`, node.label, 140, 2, true),
        textBudget(`payload.nodes[${index}].sub`, node.sub, 140, 1)
    ]);
}

export function diagnoseDiagramLayout(spec: DiagramSpec): LayoutSafetyDiagnostic[] {
    const budgets: TextBudget[] = [
        textBudget('title', spec.title, 680, 1, true),
        textBudget('summary', spec.summary, 900, 2)
    ];
    const payload = spec.payload;
    if (payload) {
        switch (payload.kind) {
            case 'topology': budgets.push(...topologyBudgets(payload)); break;
            case 'lane-grid': budgets.push(...laneGridBudgets(payload)); break;
            case 'access-matrix': budgets.push(...accessMatrixBudgets(payload)); break;
            case 'schedule': budgets.push(...scheduleBudgets(payload)); break;
            case 'ordered-stack': budgets.push(...orderedStackBudgets(payload)); break;
            case 'set-overlap': budgets.push(...setOverlapBudgets(payload)); break;
            case 'ranked-segments': budgets.push(...rankedBudgets(payload)); break;
            case 'cycle': budgets.push(...cycleBudgets(payload)); break;
            case 'nested': budgets.push(...nestedBudgets(payload)); break;
            case 'tree': budgets.push(...treeBudgets(payload)); break;
            default: break;
        }
    } else {
        budgets.push(...spec.nodes.flatMap((node, index) => [
            textBudget(`nodes[${index}].label`, node.label, 210, 3, true),
            textBudget(`nodes[${index}].kind`, node.kind, 180, 1)
        ]));
        budgets.push(...(spec.edges ?? []).map((edge, edgeIndex) =>
            textBudget(`edges[${edgeIndex}].label`, edge.label ?? edge.relation, 180, 1, true)
        ));
    }
    if (spec.intent === 'radar') budgets.push(...radarBudgets(spec));
    if (spec.intent === 'orgChart') budgets.push(...orgChartBudgets(spec));
    if (spec.intent === 'timeline') budgets.push(...timelineBudgets(spec));
    if (spec.intent === 'swimlane') budgets.push(...swimlaneBudgets(spec));
    if (spec.intent === 'quadrant') budgets.push(...quadrantBudgets(spec));
    const diagnostics = textDiagnostics(budgets);
    const payloadSize = payload
        ? Object.values(payload).reduce((count, value) => count + (Array.isArray(value) ? value.length : 0), 0)
        : spec.nodes.length + (spec.edges?.length ?? 0);
    if (payloadSize > 48) {
        diagnostics.push({
            severity: 'warning',
            kind: 'layout-density-budget',
            message: `Diagram payload contains ${payloadSize} drawable items; labels may require optional detail elision.`,
            advice: 'Prefer a bounded sub-diagram or a less dense layout when the source contains multiple independent concerns.'
        });
    }
    return diagnostics;
}
