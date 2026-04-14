import { ValidationError } from '../types';
import { isSupportedVegaLiteChartType, SUPPORTED_VEGA_LITE_CHART_TYPES } from './adapters/vega/schema';
import { DiagramDataSeries, DiagramNode, DiagramSpec } from './types';

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

export function validateDiagramSpec(spec: DiagramSpec): DiagramSpecValidationResult {
    const errors: string[] = [];

    if (!spec.title?.trim()) {
        errors.push('Diagram spec title is required.');
    }

    const nodeIds = new Set<string>();
    collectNodeIds(spec.nodes ?? [], nodeIds, errors);

    if (spec.intent !== 'dataChart' && nodeIds.size === 0) {
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
