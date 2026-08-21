import { ValidationError } from '../types';
import { validateCircuitSpec } from './adapters/circuitikz/circuitikzExporter';
import { isSupportedVegaLiteChartType, SUPPORTED_VEGA_LITE_CHART_TYPES } from './adapters/vega/schema';
import {
    DiagramDataSeries,
    DiagramNode,
    DiagramOrgChartSpec,
    DiagramRadarSpec,
    DiagramSpec,
    isSupportedDiagramIntent,
    SUPPORTED_DIAGRAM_INTENTS
} from './types';

export interface DiagramSpecValidationResult {
    valid: boolean;
    errors: string[];
}

function collectNodeIds(nodes: DiagramNode[], ids: Set<string>, errors: string[]): void {
    nodes.forEach(node => {
        const id = node.id?.trim();
        if (!id) {
            errors.push('Diagram node is missing an id.');
            return;
        }
        if (ids.has(id)) {
            errors.push(`Diagram node id "${id}" is duplicated.`);
        } else {
            ids.add(id);
        }

        if (!node.label?.trim()) {
            errors.push(`Diagram node "${id}" is missing a label.`);
        }

        if (node.children?.length) {
            collectNodeIds(node.children, ids, errors);
        }
    });
}

function validateDataSeries(dataSeries: DiagramDataSeries[] | undefined, errors: string[]): void {
    if (!dataSeries || dataSeries.length === 0) {
        errors.push('Diagram intent "dataChart" requires at least one data series.');
        return;
    }

    dataSeries.forEach(series => {
        if (!series.id?.trim()) {
            errors.push('Chart data series is missing an id.');
        }
        if (!series.label?.trim()) {
            errors.push(`Chart data series "${series.id || 'unknown'}" is missing a label.`);
        }
        if (!series.points?.length) {
            errors.push(`Chart data series "${series.id || 'unknown'}" is missing points.`);
            return;
        }

        series.points.forEach((point, index) => {
            if (point.x === '' || point.x === null || point.x === undefined) {
                errors.push(`Chart data series "${series.id || 'unknown'}" point ${index + 1} is missing x.`);
            }
            if (typeof point.y !== 'number' || Number.isNaN(point.y)) {
                errors.push(`Chart data series "${series.id || 'unknown'}" point ${index + 1} is missing a numeric y.`);
            }
        });
    });
}

function validateDiagramIntent(spec: DiagramSpec, errors: string[]): void {
    if (!isSupportedDiagramIntent(spec.intent)) {
        errors.push(
            `Diagram spec uses unsupported diagram intent "${String(spec.intent)}". `
            + `Supported intents: ${SUPPORTED_DIAGRAM_INTENTS.join(', ')}.`
        );
    }
}

function validateDataChartLayoutHints(spec: DiagramSpec, errors: string[]): void {
    const chartType = spec.layoutHints?.chartType;
    if (chartType === undefined) {
        return;
    }

    if (!isSupportedVegaLiteChartType(chartType)) {
        errors.push(
            `Diagram intent "dataChart" uses unsupported chartType "${String(chartType)}". `
            + `Supported chart types: ${SUPPORTED_VEGA_LITE_CHART_TYPES.join(', ')}.`
        );
        return;
    }

    if (chartType === 'scatter') {
        spec.dataSeries?.forEach(series => {
            series.points.forEach((point, index) => {
                if (typeof point.x !== 'number' || Number.isNaN(point.x)) {
                    errors.push(
                        `Scatter chart series "${series.id || 'unknown'}" point ${index + 1} requires a numeric x value.`
                    );
                }
            });
        });
    }

    if (chartType === 'pie') {
        if ((spec.dataSeries?.length ?? 0) !== 1) {
            errors.push('Pie chart layoutHints.chartType requires a single data series.');
        }

        spec.dataSeries?.forEach(series => {
            series.points.forEach((point, index) => {
                if (point.y < 0) {
                    errors.push(
                        `Pie chart series "${series.id || 'unknown'}" point ${index + 1} must use a non-negative y value.`
                    );
                }
            });
        });
    }
}

function validateNonChartLayoutHints(spec: DiagramSpec, errors: string[]): void {
    if (spec.layoutHints?.chartType !== undefined) {
        errors.push(`Diagram spec uses layoutHints.chartType but intent "${spec.intent}" is not "dataChart".`);
    }
}

function validateCanonicalPayloadBoundary(spec: DiagramSpec, errors: string[]): void {
    if (spec.schemaVersion !== undefined && spec.schemaVersion !== 1 && spec.schemaVersion !== 2) {
        errors.push(`DiagramSpec uses unsupported schema version "${String(spec.schemaVersion)}".`);
    }
    if (spec.schemaVersion === 2 && !spec.payload) {
        errors.push('DiagramSpec schema version 2 requires a canonical payload.');
    }
    if (spec.payload?.kind === 'quantitative') {
        if (spec.intent !== 'dataChart') {
            errors.push('Quantitative canonical payloads are only valid for intent "dataChart".');
        }
        if (!Array.isArray(spec.payload.series)) {
            errors.push('Quantitative canonical payload requires a series array.');
        }
    }
}

function validateRadarPayload(radarSpec: DiagramRadarSpec | undefined, errors: string[]): void {
    if (!radarSpec) {
        errors.push('Diagram intent "radar" requires a radarSpec payload.');
        return;
    }

    const axes = radarSpec.axes;
    if (!Array.isArray(axes) || axes.length < 3 || axes.length > 12) {
        errors.push('Radar payload requires between 3 and 12 axes.');
        return;
    }

    const axisIds = new Set<string>();
    axes.forEach((axis, index) => {
        const axisId = typeof axis?.id === 'string' ? axis.id.trim() : '';
        if (!axisId) {
            errors.push(`Radar axis ${index + 1} is missing an id.`);
        } else if (axisIds.has(axisId)) {
            errors.push(`Radar axis id "${axisId}" is duplicated.`);
        } else {
            axisIds.add(axisId);
        }

        if (typeof axis?.label !== 'string' || !axis.label.trim()) {
            errors.push(`Radar axis "${axisId || index + 1}" is missing a label.`);
        }

        if (axis?.max !== undefined
            && (typeof axis.max !== 'number' || !Number.isFinite(axis.max) || axis.max <= 0)) {
            errors.push(`Radar axis "${axisId || index + 1}" max must be a finite number greater than 0.`);
        }
    });

    if (!Array.isArray(radarSpec.series) || radarSpec.series.length === 0 || radarSpec.series.length > 8) {
        errors.push('Radar payload requires between 1 and 8 series.');
        return;
    }

    const seriesIds = new Set<string>();
    radarSpec.series.forEach((series, seriesIndex) => {
        const seriesId = typeof series?.id === 'string' ? series.id.trim() : '';
        if (!seriesId) {
            errors.push(`Radar series ${seriesIndex + 1} is missing an id.`);
        } else if (seriesIds.has(seriesId)) {
            errors.push(`Radar series id "${seriesId}" is duplicated.`);
        } else {
            seriesIds.add(seriesId);
        }

        if (typeof series?.label !== 'string' || !series.label.trim()) {
            errors.push(`Radar series "${seriesId || seriesIndex + 1}" is missing a label.`);
        }

        if (!Array.isArray(series?.points) || series.points.length !== axes.length) {
            errors.push(`Radar series "${seriesId || seriesIndex + 1}" requires exactly one point per axis.`);
            return;
        }

        const pointAxisIds = new Set<string>();
        series.points.forEach((point, pointIndex) => {
            const axisId = typeof point?.axisId === 'string' ? point.axisId.trim() : '';
            if (!axisId) {
                errors.push(`Radar series "${seriesId || seriesIndex + 1}" point ${pointIndex + 1} is missing axisId.`);
            } else if (!axisIds.has(axisId)) {
                errors.push(`Radar series "${seriesId || seriesIndex + 1}" references unknown axis "${axisId}".`);
            } else if (pointAxisIds.has(axisId)) {
                errors.push(`Radar series "${seriesId || seriesIndex + 1}" axis "${axisId}" is duplicated.`);
            } else {
                pointAxisIds.add(axisId);
            }

            if (typeof point?.value !== 'number' || !Number.isFinite(point.value) || point.value < 0) {
                errors.push(`Radar series "${seriesId || seriesIndex + 1}" point ${pointIndex + 1} value must be a finite non-negative number.`);
                return;
            }

            const axis = axes.find(candidate => candidate.id?.trim() === axisId);
            if (axis?.max !== undefined && point.value > axis.max) {
                errors.push(`Radar series "${seriesId || seriesIndex + 1}" point ${pointIndex + 1} exceeds axis "${axisId}" max.`);
            }
        });
    });
}

const ORG_CHART_MAX_NODES = 12;
const ORG_CHART_MAX_DEPTH = 4;
const ORG_CHART_MAX_DIRECT_REPORTS = 5;

function validateOrgChartPayload(orgChartSpec: DiagramOrgChartSpec | undefined, errors: string[]): void {
    if (!orgChartSpec || !Array.isArray(orgChartSpec.nodes)
        || orgChartSpec.nodes.length === 0 || orgChartSpec.nodes.length > ORG_CHART_MAX_NODES) {
        errors.push(`Org chart payload requires between 1 and ${ORG_CHART_MAX_NODES} owners.`);
        return;
    }

    const nodesById = new Map<string, DiagramOrgChartSpec['nodes'][number]>();
    const parentById = new Map<string, string>();
    const childrenById = new Map<string, number>();

    orgChartSpec.nodes.forEach((node, index) => {
        const nodeId = typeof node?.id === 'string' ? node.id.trim() : '';
        if (!nodeId) {
            errors.push(`Org chart owner ${index + 1} is missing an id.`);
        } else if (nodesById.has(nodeId)) {
            errors.push(`Org chart owner id "${nodeId}" is duplicated.`);
        } else {
            nodesById.set(nodeId, node);
        }

        if (typeof node?.label !== 'string' || !node.label.trim()) {
            errors.push(`Org chart owner "${nodeId || index + 1}" is missing a label.`);
        }

        if (node?.role !== undefined && (typeof node.role !== 'string' || !node.role.trim())) {
            errors.push(`Org chart owner "${nodeId || index + 1}" has an invalid role.`);
        }

        if (node?.scope !== undefined && (!Array.isArray(node.scope)
            || node.scope.length > 4
            || node.scope.some(scope => typeof scope !== 'string' || !scope.trim()))) {
            errors.push(`Org chart owner "${nodeId || index + 1}" has an invalid scope list.`);
        }

        if (node?.status !== undefined && !['active', 'planned', 'gap'].includes(node.status)) {
            errors.push(`Org chart owner "${nodeId || index + 1}" has an unsupported status.`);
        }

        const reportsTo = typeof node?.reportsTo === 'string' ? node.reportsTo.trim() : '';
        if (reportsTo) {
            if (reportsTo === nodeId) {
                errors.push(`Org chart owner "${nodeId || index + 1}" cannot report to itself.`);
            }
            parentById.set(nodeId, reportsTo);
            childrenById.set(reportsTo, (childrenById.get(reportsTo) ?? 0) + 1);
        }
    });

    parentById.forEach((parentId, nodeId) => {
        if (!nodesById.has(parentId)) {
            errors.push(`Org chart owner "${nodeId}" references unknown manager "${parentId}".`);
        }
    });

    const roots = orgChartSpec.nodes.filter(node => {
        const nodeId = typeof node?.id === 'string' ? node.id.trim() : '';
        return nodeId.length > 0 && !parentById.has(nodeId);
    });
    if (roots.length !== 1) {
        errors.push(`Org chart requires exactly one root owner; found ${roots.length}.`);
    }

    childrenById.forEach((count, parentId) => {
        if (count > ORG_CHART_MAX_DIRECT_REPORTS) {
            errors.push(`Org chart owner "${parentId}" exceeds the ${ORG_CHART_MAX_DIRECT_REPORTS}-direct-report limit.`);
        }
    });

    const visitState = new Map<string, 'visiting' | 'visited'>();
    const visit = (nodeId: string, depth: number): void => {
        const state = visitState.get(nodeId);
        if (state === 'visiting') {
            errors.push(`Org chart contains a reporting cycle involving "${nodeId}".`);
            return;
        }
        if (state === 'visited') {
            return;
        }
        visitState.set(nodeId, 'visiting');
        if (depth > ORG_CHART_MAX_DEPTH) {
            errors.push(`Org chart exceeds the maximum depth of ${ORG_CHART_MAX_DEPTH} tiers.`);
        }
        const children = orgChartSpec.nodes.filter(node => node.reportsTo?.trim() === nodeId);
        children.forEach(child => {
            const childId = typeof child.id === 'string' ? child.id.trim() : '';
            if (childId) {
                visit(childId, depth + 1);
            }
        });
        visitState.set(nodeId, 'visited');
    };

    nodesById.forEach((_node, nodeId) => {
        if (!visitState.has(nodeId)) {
            visit(nodeId, 1);
        }
    });
}

function validateTimelinePayload(spec: DiagramSpec, errors: string[]): void {
    const events = spec.timelineEvents;
    if (!Array.isArray(events) || events.length === 0) {
        errors.push('Diagram intent "timeline" requires at least one timeline event.');
        return;
    }

    const ids = new Set<string>();
    events.forEach((event, index) => {
        const eventId = typeof event?.id === 'string' ? event.id.trim() : '';
        if (!eventId) {
            errors.push(`Timeline event ${index + 1} is missing an id.`);
        } else if (ids.has(eventId)) {
            errors.push(`Timeline event id "${eventId}" is duplicated.`);
        } else {
            ids.add(eventId);
        }

        const dateIsValid = (typeof event?.date === 'string' && event.date.trim().length > 0)
            || (typeof event?.date === 'number' && Number.isFinite(event.date));
        if (!dateIsValid) {
            errors.push(`Timeline event "${eventId || index + 1}" requires a string or numeric date.`);
        }
        if (typeof event?.label !== 'string' || !event.label.trim()) {
            errors.push(`Timeline event "${eventId || index + 1}" is missing a label.`);
        }
        if (event?.details !== undefined && (!Array.isArray(event.details)
            || event.details.some(detail => typeof detail !== 'string' || !detail.trim()))) {
            errors.push(`Timeline event "${eventId || index + 1}" contains an invalid details list.`);
        }
    });
}

function validateSwimlanePayload(spec: DiagramSpec, errors: string[]): void {
    const lanes = spec.swimlaneLanes;
    if (!Array.isArray(lanes) || lanes.length === 0) {
        errors.push('Diagram intent "swimlane" requires at least one swimlane.');
        return;
    }

    const laneIds = new Set<string>();
    const stepIds = new Set<string>();
    const stepsByLane = new Map<string, Set<string>>();
    lanes.forEach((lane, laneIndex) => {
        const laneId = typeof lane?.id === 'string' ? lane.id.trim() : '';
        if (!laneId) {
            errors.push(`Swimlane ${laneIndex + 1} is missing an id.`);
        } else if (laneIds.has(laneId)) {
            errors.push(`Swimlane id "${laneId}" is duplicated.`);
        } else {
            laneIds.add(laneId);
        }
        if (typeof lane?.label !== 'string' || !lane.label.trim()) {
            errors.push(`Swimlane "${laneId || laneIndex + 1}" is missing a label.`);
        }
        if (!Array.isArray(lane?.steps) || lane.steps.length === 0) {
            errors.push(`Swimlane "${laneId || laneIndex + 1}" requires at least one step.`);
            return;
        }

        const laneStepIds = new Set<string>();
        stepsByLane.set(laneId, laneStepIds);
        lane.steps.forEach((step, stepIndex) => {
            const stepId = typeof step?.id === 'string' ? step.id.trim() : '';
            if (!stepId) {
                errors.push(`Swimlane "${laneId || laneIndex + 1}" step ${stepIndex + 1} is missing an id.`);
            } else {
                if (stepIds.has(stepId)) {
                    errors.push(`Swimlane step id "${stepId}" is duplicated.`);
                }
                if (!laneStepIds.has(stepId)) {
                    laneStepIds.add(stepId);
                    stepIds.add(stepId);
                }
            }
            if (typeof step?.label !== 'string' || !step.label.trim()) {
                errors.push(`Swimlane step "${stepId || stepIndex + 1}" is missing a label.`);
            }
        });
    });

    lanes.forEach(lane => {
        const laneId = typeof lane?.id === 'string' ? lane.id.trim() : '';
        const laneStepIds = stepsByLane.get(laneId) ?? new Set<string>();
        lane?.steps?.forEach(step => {
            const nextStepId = typeof step?.nextStepId === 'string' ? step.nextStepId.trim() : '';
            if (nextStepId && !laneStepIds.has(nextStepId)) {
                errors.push(`Swimlane step "${step.id || 'unknown'}" points to a step outside its lane.`);
            }
        });
    });
}

function validateQuadrantPayload(spec: DiagramSpec, errors: string[]): void {
    const quadrant = spec.quadrant;
    if (!quadrant) {
        errors.push('Diagram intent "quadrant" requires a quadrant payload.');
        return;
    }
    if (!Array.isArray(quadrant.xAxisLabel) || quadrant.xAxisLabel.length !== 2
        || quadrant.xAxisLabel.some(label => typeof label !== 'string' || !label.trim())) {
        errors.push('Quadrant payload requires two non-empty xAxisLabel values.');
    }
    if (!Array.isArray(quadrant.yAxisLabel) || quadrant.yAxisLabel.length !== 2
        || quadrant.yAxisLabel.some(label => typeof label !== 'string' || !label.trim())) {
        errors.push('Quadrant payload requires two non-empty yAxisLabel values.');
    }
    if (!Array.isArray(quadrant.quadrantLabels) || quadrant.quadrantLabels.length !== 4
        || quadrant.quadrantLabels.some(label => typeof label !== 'string' || !label.trim())) {
        errors.push('Quadrant payload requires exactly four non-empty quadrantLabels.');
    }
    if (!Array.isArray(quadrant.items) || quadrant.items.length === 0) {
        errors.push('Quadrant payload requires at least one item.');
        return;
    }

    const ids = new Set<string>();
    quadrant.items.forEach((item, index) => {
        const itemId = typeof item?.id === 'string' ? item.id.trim() : '';
        if (!itemId) {
            errors.push(`Quadrant item ${index + 1} is missing an id.`);
        } else if (ids.has(itemId)) {
            errors.push(`Quadrant item id "${itemId}" is duplicated.`);
        } else {
            ids.add(itemId);
        }
        if (typeof item?.label !== 'string' || !item.label.trim()) {
            errors.push(`Quadrant item "${itemId || index + 1}" is missing a label.`);
        }
        if (typeof item?.x !== 'number' || !Number.isFinite(item.x) || item.x < 0 || item.x > 1) {
            errors.push(`Quadrant item "${itemId || index + 1}" x must be a finite number from 0 to 1.`);
        }
        if (typeof item?.y !== 'number' || !Number.isFinite(item.y) || item.y < 0 || item.y > 1) {
            errors.push(`Quadrant item "${itemId || index + 1}" y must be a finite number from 0 to 1.`);
        }
    });
}

function validateSpecializedPayload(spec: DiagramSpec, errors: string[]): void {
    switch (spec.intent) {
        case 'radar':
            validateRadarPayload(spec.radarSpec, errors);
            break;
        case 'orgChart':
            validateOrgChartPayload(spec.orgChartSpec, errors);
            break;
        case 'timeline':
            validateTimelinePayload(spec, errors);
            break;
        case 'swimlane':
            validateSwimlanePayload(spec, errors);
            break;
        case 'quadrant':
            validateQuadrantPayload(spec, errors);
            break;
        default:
            break;
    }
}

function validateCircuitPayload(spec: DiagramSpec, errors: string[]): void {
    if (spec.circuitSpec && spec.intent !== 'circuit') {
        errors.push('DiagramSpec.circuitSpec is only valid when intent is "circuit".');
        return;
    }

    if (spec.intent !== 'circuit') {
        return;
    }

    if (!spec.circuitSpec) {
        errors.push('Diagram intent "circuit" requires a CircuitSpec payload.');
        return;
    }

    const circuitValidation = validateCircuitSpec(spec.circuitSpec);
    for (const error of circuitValidation.errors) {
        errors.push(`CircuitSpec: ${error}`);
    }
}

function validateRadarOwnership(spec: DiagramSpec, errors: string[]): void {
    if (spec.radarSpec && spec.intent !== 'radar') {
        errors.push('DiagramSpec.radarSpec is only valid when intent is "radar".');
    }
}

function validateOrgChartOwnership(spec: DiagramSpec, errors: string[]): void {
    if (spec.orgChartSpec && spec.intent !== 'orgChart') {
        errors.push('DiagramSpec.orgChartSpec is only valid when intent is "orgChart".');
    }
}

export function validateDiagramSpec(spec: DiagramSpec): DiagramSpecValidationResult {
    const errors: string[] = [];

    validateDiagramIntent(spec, errors);
    validateCanonicalPayloadBoundary(spec, errors);

    if (!spec.title?.trim()) {
        errors.push('Diagram spec title is required.');
    }

    const nodeIds = new Set<string>();
    collectNodeIds(spec.nodes ?? [], nodeIds, errors);

    const usesSpecializedPayload = spec.intent === 'dataChart'
        || spec.intent === 'radar'
        || spec.intent === 'orgChart'
        || spec.intent === 'circuit'
        || spec.intent === 'timeline'
        || spec.intent === 'swimlane'
        || spec.intent === 'quadrant';
    if (!usesSpecializedPayload && nodeIds.size === 0) {
        errors.push(`Diagram intent "${spec.intent}" requires at least one node.`);
    }

    (spec.edges ?? []).forEach((edge, index) => {
        if (!nodeIds.has(edge.from)) {
            errors.push(`Diagram edge ${index + 1} references missing source node "${edge.from}".`);
        }
        if (!nodeIds.has(edge.to)) {
            errors.push(`Diagram edge ${index + 1} references missing target node "${edge.to}".`);
        }
    });

    if (spec.intent === 'dataChart') {
        validateDataSeries(spec.dataSeries, errors);
        validateDataChartLayoutHints(spec, errors);
    } else {
        validateNonChartLayoutHints(spec, errors);
    }

    validateCircuitPayload(spec, errors);
    validateRadarOwnership(spec, errors);
    validateOrgChartOwnership(spec, errors);
    validateSpecializedPayload(spec, errors);

    return {
        valid: errors.length === 0,
        errors
    };
}

export function assertValidDiagramSpec(spec: DiagramSpec): DiagramSpec {
    const result = validateDiagramSpec(spec);
    if (!result.valid) {
        throw new ValidationError(result.errors.join(' '), 'INVALID_INPUT');
    }
    return spec;
}
