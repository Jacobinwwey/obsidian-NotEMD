import type { DiagramIntent, DiagramSpec } from '../types';
import type {
    DiagramAccessMatrixPayload,
    DiagramCyclePayload,
    DiagramPayloadKind,
    DiagramLaneGridPayload,
    DiagramNestedPayload,
    DiagramOrderedStackPayload,
    DiagramRankedSegmentsPayload,
    DiagramSchedulePayload,
    DiagramSetOverlapPayload,
    DiagramTopologyPayload,
    DiagramTreePayload,
    QuantitativeDiagramPayload
} from './types';

function nonEmpty(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function unique(values: unknown[], label: string, errors: string[]): void {
    const seen = new Set<string>();
    for (const rawValue of values) {
        const value = typeof rawValue === 'string' ? rawValue : '';
        if (!nonEmpty(value)) {
            errors.push(`${label} contains an empty id.`);
        } else if (seen.has(value)) {
            errors.push(`${label} contains duplicate id "${value}".`);
        }
        seen.add(value);
    }
}

const REQUIRED_ARRAY_FIELDS: Partial<Record<DiagramPayloadKind, readonly string[]>> = {
    topology: ['zones', 'nodes', 'edges'],
    'lane-grid': ['lanes', 'steps', 'cells', 'edges'],
    'access-matrix': ['roles', 'components', 'cells'],
    quantitative: ['series'],
    schedule: ['phases', 'tasks'],
    'ordered-stack': ['layers'],
    'set-overlap': ['sets', 'intersections'],
    'ranked-segments': ['segments'],
    cycle: ['stations'],
    nested: ['levels'],
    tree: ['nodes']
};

function validatePayloadShape(payload: unknown, errors: string[]): boolean {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        errors.push('Canonical payload must be an object.');
        return false;
    }

    const kind = (payload as { kind?: unknown }).kind;
    if (typeof kind !== 'string') {
        errors.push('Canonical payload is missing a string kind.');
        return false;
    }

    const requiredFields = REQUIRED_ARRAY_FIELDS[kind as DiagramPayloadKind] ?? [];
    let valid = true;
    for (const field of requiredFields) {
        if (!Array.isArray((payload as Record<string, unknown>)[field])) {
            errors.push(`Canonical payload "${kind}" field "${field}" must be an array.`);
            valid = false;
        }
    }
    return valid;
}

function validateScheduleValue(value: unknown, label: string, errors: string[]): value is string | number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return true;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return true;
    }
    errors.push(`Schedule ${label} must be a non-empty string or finite number.`);
    return false;
}

function validateTopology(payload: DiagramTopologyPayload, errors: string[]): void {
    if (payload.zones.length < 1 || payload.zones.length > 6) {
        errors.push('Topology payload requires 1 to 6 zones.');
    }
    if (payload.nodes.length < 1 || payload.nodes.length > 24) {
        errors.push('Topology payload requires 1 to 24 nodes.');
    }
    if (payload.edges.length > 40) {
        errors.push('Topology payload supports at most 40 edges.');
    }
    unique(payload.zones.map(zone => zone.id), 'Topology zones', errors);
    unique(payload.nodes.map(node => node.id), 'Topology nodes', errors);
    const zoneIds = new Set(payload.zones.map(zone => zone.id));
    const nodeIds = new Set(payload.nodes.map(node => node.id));
    let focalCount = 0;
    for (const node of payload.nodes) {
        if (!nonEmpty(node.label)) errors.push(`Topology node "${node.id}" is missing a label.`);
        if (node.zoneId && !zoneIds.has(node.zoneId)) errors.push(`Topology node "${node.id}" references missing zone "${node.zoneId}".`);
        if (node.focal) focalCount += 1;
    }
    if (focalCount > 2) errors.push('Topology payload supports at most two focal nodes.');
    for (const edge of payload.edges) {
        if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
            errors.push(`Topology edge "${edge.from}" -> "${edge.to}" references a missing node.`);
        }
    }
}

function validateLaneGrid(payload: DiagramLaneGridPayload, errors: string[]): void {
    if (payload.lanes.length < 1 || payload.lanes.length > 4) errors.push('Lane-grid payload requires 1 to 4 lanes.');
    if (payload.steps.length < 1 || payload.steps.length > 6) errors.push('Lane-grid payload requires 1 to 6 steps.');
    if (payload.cells.length > payload.lanes.length * payload.steps.length) errors.push('Lane-grid payload contains too many cells.');
    unique(payload.lanes.map(lane => lane.id), 'Lane-grid lanes', errors);
    unique(payload.steps.map(step => step.id), 'Lane-grid steps', errors);
    const laneIds = new Set(payload.lanes.map(lane => lane.id));
    const stepIds = new Set(payload.steps.map(step => step.id));
    const cells = new Set<string>();
    let focalCount = 0;
    for (const cell of payload.cells) {
        const key = `${cell.laneId}:${cell.stepId}`;
        if (cells.has(key)) errors.push(`Lane-grid cell "${key}" is duplicated.`);
        cells.add(key);
        if (!laneIds.has(cell.laneId) || !stepIds.has(cell.stepId)) errors.push(`Lane-grid cell "${key}" references an unknown lane or step.`);
        if (!nonEmpty(cell.title)) errors.push(`Lane-grid cell "${key}" is missing a title.`);
        if (cell.focal) focalCount += 1;
    }
    if (focalCount > 1) errors.push('Lane-grid payload supports at most one focal cell.');
    for (const edge of payload.edges) {
        if (!laneIds.has(edge.from.laneId) || !stepIds.has(edge.from.stepId)
            || !laneIds.has(edge.to.laneId) || !stepIds.has(edge.to.stepId)) {
            errors.push('Lane-grid edge references an unknown cell coordinate.');
        }
    }
}

function validateAccessMatrix(payload: DiagramAccessMatrixPayload, errors: string[]): void {
    if (payload.roles.length < 2 || payload.roles.length > 6) errors.push('Access matrix requires 2 to 6 roles.');
    if (payload.components.length < 2 || payload.components.length > 14) errors.push('Access matrix requires 2 to 14 components.');
    unique(payload.roles.map(role => role.id), 'Access matrix roles', errors);
    unique(payload.components.map(component => component.id), 'Access matrix components', errors);
    const cells = new Set<string>();
    let focalCount = 0;
    for (const cell of payload.cells) {
        const key = `${cell.row}:${cell.col}`;
        if (cell.row < 0 || cell.row >= payload.components.length || cell.col < 0 || cell.col >= payload.roles.length) {
            errors.push(`Access matrix cell "${key}" is outside the declared grid.`);
        }
        if (cells.has(key)) errors.push(`Access matrix cell "${key}" is duplicated.`);
        cells.add(key);
        if (!['full', 'rw', 'read', 'none'].includes(cell.level)) errors.push(`Access matrix cell "${key}" uses an unsupported level.`);
        if (!nonEmpty(cell.value)) errors.push(`Access matrix cell "${key}" is missing display text.`);
        if (cell.focal) focalCount += 1;
    }
    if (focalCount > 1) errors.push('Access matrix supports at most one focal cell.');
}

function validateQuantitative(payload: QuantitativeDiagramPayload, errors: string[]): void {
    if (!['bar', 'line', 'scatter', 'pie', 'table'].includes(payload.chartType)) errors.push('Quantitative payload uses an unsupported chart type.');
    if (payload.series.length < 1 || payload.series.length > 5) errors.push('Quantitative payload requires 1 to 5 series.');
    unique(payload.series.map(series => series.id), 'Quantitative series', errors);
    for (const series of payload.series) {
        if (!nonEmpty(series.label)) errors.push(`Quantitative series "${series.id}" is missing a label.`);
        if (series.points.length === 0) errors.push(`Quantitative series "${series.id}" is missing points.`);
        for (const point of series.points) {
            if (point.x === '' || point.x === undefined || point.x === null || !Number.isFinite(point.y)) {
                errors.push(`Quantitative series "${series.id}" contains an invalid point.`);
            }
        }
    }
}

function validateSchedule(payload: DiagramSchedulePayload, errors: string[]): void {
    if (payload.tasks.length < 1 || payload.tasks.length > 12) errors.push('Schedule payload requires 1 to 12 tasks.');
    if (payload.phases.length > 6) errors.push('Schedule payload supports at most 6 phases.');
    unique(payload.phases.map(phase => phase.id), 'Schedule phases', errors);
    unique(payload.tasks.map(task => task.id), 'Schedule tasks', errors);
    const phaseIds = new Set(payload.phases.map(phase => phase.id));
    for (const task of payload.tasks) {
        if (!nonEmpty(task.label)) errors.push(`Schedule task "${task.id}" is missing a label.`);
        if (task.phaseId && !phaseIds.has(task.phaseId)) errors.push(`Schedule task "${task.id}" references a missing phase.`);
        const hasStart = validateScheduleValue(task.start, `task "${task.id}" start`, errors);
        const hasEnd = validateScheduleValue(task.end, `task "${task.id}" end`, errors);
        if (hasStart && hasEnd) {
            if (typeof task.start === 'number' && typeof task.end === 'number' && task.end < task.start) {
                errors.push(`Schedule task "${task.id}" ends before it starts.`);
            }
            const startDate = typeof task.start === 'string' ? Date.parse(task.start) : NaN;
            const endDate = typeof task.end === 'string' ? Date.parse(task.end) : NaN;
            if (Number.isFinite(startDate) && Number.isFinite(endDate) && endDate < startDate) {
                errors.push(`Schedule task "${task.id}" ends before it starts.`);
            }
        }
    }
}

function validateStack(payload: DiagramOrderedStackPayload, errors: string[]): void {
    if (payload.layers.length < 4 || payload.layers.length > 6) errors.push('Ordered stack requires 4 to 6 layers.');
    unique(payload.layers.map(layer => layer.id), 'Ordered stack layers', errors);
    if (payload.layers.filter(layer => layer.focal).length > 1) errors.push('Ordered stack supports at most one focal layer.');
}

function validateOverlap(payload: DiagramSetOverlapPayload, errors: string[]): void {
    if (payload.sets.length < 2 || payload.sets.length > 3) errors.push('Set-overlap payload requires 2 or 3 sets.');
    unique(payload.sets.map(set => set.id), 'Set-overlap sets', errors);
    const setIds = new Set(payload.sets.map(set => set.id));
    if (payload.intersections.some(intersection => intersection.setIds.length < 2 || intersection.setIds.some(id => !setIds.has(id)))) {
        errors.push('Set-overlap intersections must reference at least two declared sets.');
    }
    if (payload.intersections.filter(intersection => intersection.focal).length > 1) errors.push('Set-overlap supports at most one focal intersection.');
}

function validateRanked(payload: DiagramRankedSegmentsPayload, errors: string[]): void {
    if (payload.segments.length < 4 || payload.segments.length > 6) errors.push('Ranked segments require 4 to 6 segments.');
    unique(payload.segments.map(segment => segment.id), 'Ranked segments', errors);
    if (payload.segments.filter(segment => segment.focal).length > 1) errors.push('Ranked segments support at most one focal segment.');
    if (payload.segments.some(segment => segment.value !== undefined && (!Number.isFinite(segment.value) || segment.value < 0))) errors.push('Ranked segment values must be finite and non-negative.');
}

function validateCycle(payload: DiagramCyclePayload, errors: string[]): void {
    if (payload.stations.length < 5 || payload.stations.length > 8) errors.push('Cycle payload requires 5 to 8 stations.');
    unique(payload.stations.map(station => station.id), 'Cycle stations', errors);
    if (payload.stations.filter(station => station.focal).length > 1) errors.push('Cycle supports at most one focal station.');
}

function validateNested(payload: DiagramNestedPayload, errors: string[]): void {
    if (payload.levels.length < 3 || payload.levels.length > 5) errors.push('Nested payload requires 3 to 5 levels.');
    unique(payload.levels.map(level => level.id), 'Nested levels', errors);
    if (payload.levels.filter(level => level.focal).length > 1) errors.push('Nested payload supports at most one focal level.');
}

function validateTree(payload: DiagramTreePayload, errors: string[]): void {
    if (payload.nodes.length < 2 || payload.nodes.length > 32) errors.push('Tree payload requires 2 to 32 nodes.');
    unique(payload.nodes.map(node => node.id), 'Tree nodes', errors);
    const nodeIds = new Set(payload.nodes.map(node => node.id));
    const roots = payload.nodes.filter(node => !node.parentId);
    if (roots.length !== 1) errors.push('Tree payload requires exactly one root.');
    for (const node of payload.nodes) {
        if (node.parentId && !nodeIds.has(node.parentId)) errors.push(`Tree node "${node.id}" references a missing parent.`);
    }
}

const EXPECTED_PAYLOAD_KIND: Partial<Record<DiagramIntent, string>> = {
    architecture: 'topology',
    currentState: 'topology',
    integrationTopology: 'topology',
    highLevel: 'topology',
    dataFlow: 'lane-grid',
    process: 'lane-grid',
    accessMatrix: 'access-matrix',
    gantt: 'schedule',
    layerStack: 'ordered-stack',
    medallion: 'ordered-stack',
    setOverlap: 'set-overlap',
    rankedFunnel: 'ranked-segments',
    loop: 'cycle',
    nested: 'nested',
    tree: 'tree',
    dataChart: 'quantitative'
};

export function validateCanonicalDiagramPayload(spec: DiagramSpec): string[] {
    const errors: string[] = [];
    const payload = spec.payload;
    const expectedKind = EXPECTED_PAYLOAD_KIND[spec.intent];
    if (expectedKind && spec.schemaVersion === 2 && (!payload || payload.kind !== expectedKind)) {
        errors.push(`Diagram intent "${spec.intent}" requires payload kind "${expectedKind}".`);
        return errors;
    }
    if (!payload) return errors;
    if (!validatePayloadShape(payload, errors)) {
        return errors;
    }

    try {
        switch (payload.kind) {
            case 'topology': validateTopology(payload, errors); break;
            case 'lane-grid': validateLaneGrid(payload, errors); break;
            case 'access-matrix': validateAccessMatrix(payload, errors); break;
            case 'quantitative': validateQuantitative(payload, errors); break;
            case 'schedule': validateSchedule(payload, errors); break;
            case 'ordered-stack': validateStack(payload, errors); break;
            case 'set-overlap': validateOverlap(payload, errors); break;
            case 'ranked-segments': validateRanked(payload, errors); break;
            case 'cycle': validateCycle(payload, errors); break;
            case 'nested': validateNested(payload, errors); break;
            case 'tree': validateTree(payload, errors); break;
            default: break;
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Canonical payload "${payload.kind}" is malformed: ${message}`);
    }
    return errors;
}
