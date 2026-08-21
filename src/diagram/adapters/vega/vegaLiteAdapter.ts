import { assertValidDiagramSpec } from '../../spec';
import { DiagramRadarSpec, DiagramSpec } from '../../types';
import { isSupportedVegaLiteChartType, SupportedVegaLiteChartType } from './schema';

type VegaLiteValue = {
    x: string | number;
    y: number;
    series: string;
};

type VegaLiteSpec = {
    $schema: string;
    description: string;
    width: number;
    height: number;
    data: {
        values: VegaLiteValue[];
    };
    mark: string | Record<string, unknown>;
    encoding: Record<string, any>;
    config?: Record<string, unknown>;
};

type VegaLiteLayer = Record<string, unknown>;

type VegaLiteRadarSpec = {
    $schema: string;
    description: string;
    width: number;
    height: number;
    title: { text: string; anchor: 'start' };
    layer: VegaLiteLayer[];
    config: Record<string, unknown>;
};

const DEFAULT_VEGA_LITE_WIDTH = 640;
const DEFAULT_VEGA_LITE_HEIGHT = 360;
const DEFAULT_RADAR_SIZE = 560;
const RADAR_LABEL_RADIUS = 1.14;
const RADAR_DOMAIN_RADIUS = 1.25;
const RADAR_GRID_LEVELS = [0.25, 0.5, 0.75, 1] as const;

function normalizeChartType(spec: DiagramSpec): SupportedVegaLiteChartType {
    if (spec.payload?.kind === 'quantitative' && isSupportedVegaLiteChartType(spec.payload.chartType)) {
        return spec.payload.chartType;
    }
    const chartType = spec.layoutHints?.chartType;
    if (isSupportedVegaLiteChartType(chartType)) {
        return chartType;
    }
    return 'bar';
}

function isQuantitativeX(values: VegaLiteValue[]): boolean {
    return values.every(value => typeof value.x === 'number');
}

function buildCartesianEncoding(values: VegaLiteValue[], includeSeriesColor: boolean): VegaLiteSpec['encoding'] {
    const encoding: VegaLiteSpec['encoding'] = {
        x: {
            field: 'x',
            type: isQuantitativeX(values) ? 'quantitative' : 'ordinal',
            title: 'Category'
        },
        y: {
            field: 'y',
            type: 'quantitative',
            title: 'Value'
        }
    };

    if (includeSeriesColor) {
        encoding.color = {
            field: 'series',
            type: 'nominal',
            title: 'Series'
        };
    }

    return encoding;
}

function buildPieEncoding(): VegaLiteSpec['encoding'] {
    return {
        theta: {
            field: 'y',
            type: 'quantitative',
            title: 'Value'
        },
        color: {
            field: 'x',
            type: 'nominal',
            title: 'Category'
        }
    };
}

function buildTableEncoding(values: VegaLiteValue[], includeSeriesColumn: boolean): VegaLiteSpec['encoding'] {
    const encoding: VegaLiteSpec['encoding'] = {
        row: {
            field: 'x',
            type: isQuantitativeX(values) ? 'quantitative' : 'ordinal',
            title: null
        },
        text: {
            field: 'y',
            type: 'quantitative'
        }
    };

    if (includeSeriesColumn) {
        encoding.column = {
            field: 'series',
            type: 'nominal',
            title: null
        };
    }

    return encoding;
}

interface RadarCoordinate {
    x: number;
    y: number;
    order: number;
}

function roundCoordinate(value: number): number {
    return Number(value.toFixed(6));
}

function buildRadarCoordinate(axisIndex: number, axisCount: number, radius: number, order: number): RadarCoordinate {
    const angle = (Math.PI * 2 * axisIndex) / axisCount - Math.PI / 2;
    return {
        x: roundCoordinate(Math.cos(angle) * radius),
        y: roundCoordinate(Math.sin(angle) * radius),
        order
    };
}

function resolveRadarAxisMaxes(radarSpec: DiagramRadarSpec): Map<string, number> {
    const maxes = new Map<string, number>();
    for (const axis of radarSpec.axes) {
        if (axis.max !== undefined) {
            maxes.set(axis.id, axis.max);
            continue;
        }

        const observedMax = radarSpec.series
            .flatMap(series => series.points)
            .filter(point => point.axisId === axis.id)
            .reduce((maximum, point) => Math.max(maximum, point.value), 0);
        maxes.set(axis.id, observedMax > 0 ? observedMax : 1);
    }
    return maxes;
}

function radarPositionEncoding(): Record<string, unknown> {
    return {
        x: {
            field: 'x',
            type: 'quantitative',
            scale: { domain: [-RADAR_DOMAIN_RADIUS, RADAR_DOMAIN_RADIUS] },
            axis: null
        },
        y: {
            field: 'y',
            type: 'quantitative',
            scale: { domain: [-RADAR_DOMAIN_RADIUS, RADAR_DOMAIN_RADIUS] },
            axis: null
        }
    };
}

function buildRadarVegaLiteSpec(spec: DiagramSpec): VegaLiteRadarSpec {
    const radarSpec = spec.radarSpec as DiagramRadarSpec;
    const axisMaxes = resolveRadarAxisMaxes(radarSpec);
    const axisCount = radarSpec.axes.length;
    const gridValues = RADAR_GRID_LEVELS.flatMap(level => {
        const points = radarSpec.axes.map((_axis, axisIndex) => ({
            ...buildRadarCoordinate(axisIndex, axisCount, level, axisIndex),
            gridId: `grid-${level}`
        }));
        return [...points, { ...points[0], order: axisCount, gridId: `grid-${level}` }];
    });
    const axisValues = radarSpec.axes.flatMap((axis, axisIndex) => {
        const start = { x: 0, y: 0, order: 0, axisId: axis.id };
        const end = {
            ...buildRadarCoordinate(axisIndex, axisCount, 1, 1),
            axisId: axis.id
        };
        return [start, end];
    });
    const labelValues = radarSpec.axes.map((axis, axisIndex) => ({
        ...buildRadarCoordinate(axisIndex, axisCount, RADAR_LABEL_RADIUS, 0),
        label: axis.label,
        axisId: axis.id
    }));
    const seriesValues = radarSpec.series.flatMap(series => {
        const points = radarSpec.axes.map((axis, axisIndex) => {
            const point = series.points.find(candidate => candidate.axisId === axis.id)!;
            const normalizedValue = point.value / (axisMaxes.get(axis.id) ?? 1);
            return {
                ...buildRadarCoordinate(axisIndex, axisCount, normalizedValue, axisIndex),
                series: series.label,
                seriesId: series.id,
                axisId: axis.id,
                value: point.value
            };
        });
        return [...points, { ...points[0], order: axisCount }];
    });

    return {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: spec.summary || spec.title,
        width: DEFAULT_RADAR_SIZE,
        height: DEFAULT_RADAR_SIZE,
        title: { text: spec.title, anchor: 'start' },
        layer: [
            {
                data: { values: gridValues },
                mark: { type: 'line', color: '#cbd5e1', strokeDash: [3, 3], strokeWidth: 1 },
                encoding: {
                    ...radarPositionEncoding(),
                    detail: { field: 'gridId', type: 'nominal' },
                    order: { field: 'order', type: 'quantitative' }
                }
            },
            {
                data: { values: axisValues },
                mark: { type: 'line', color: '#94a3b8', strokeWidth: 1 },
                encoding: {
                    ...radarPositionEncoding(),
                    detail: { field: 'axisId', type: 'nominal' },
                    order: { field: 'order', type: 'quantitative' }
                }
            },
            {
                data: { values: seriesValues },
                mark: { type: 'line', strokeWidth: 2 },
                encoding: {
                    ...radarPositionEncoding(),
                    color: { field: 'series', type: 'nominal', title: 'Profile' },
                    detail: { field: 'seriesId', type: 'nominal' },
                    order: { field: 'order', type: 'quantitative' }
                }
            },
            {
                data: { values: seriesValues.filter(point => point.order < axisCount) },
                mark: { type: 'point', filled: true, size: 56 },
                encoding: {
                    ...radarPositionEncoding(),
                    color: { field: 'series', type: 'nominal', title: 'Profile' }
                }
            },
            {
                data: { values: labelValues },
                mark: { type: 'text', align: 'center', baseline: 'middle', fontSize: 12 },
                encoding: {
                    ...radarPositionEncoding(),
                    text: { field: 'label', type: 'nominal' }
                }
            }
        ],
        config: {
            view: { stroke: null },
            axis: { grid: false, domain: false, ticks: false, labels: false },
            legend: { orient: 'bottom' }
        }
    };
}

export function renderVegaLiteSpec(spec: DiagramSpec): string {
    if (spec.intent !== 'dataChart' && spec.intent !== 'radar') {
        throw new Error(`VegaLiteAdapter cannot render diagram intent "${spec.intent}".`);
    }

    assertValidDiagramSpec(spec);

    if (spec.intent === 'radar') {
        return JSON.stringify(buildRadarVegaLiteSpec(spec), null, 2);
    }

    const dataSeries = spec.payload?.kind === 'quantitative'
        ? spec.payload.series
        : spec.dataSeries ?? [];
    const values: VegaLiteValue[] = dataSeries.flatMap(series =>
        series.points.map(point => ({
            x: point.x,
            y: point.y,
            series: series.label
        }))
    );
    const chartType = normalizeChartType(spec);
    const includeSeriesColor = dataSeries.length > 1;
    const isTable = chartType === 'table';

    const encoding = chartType === 'pie'
        ? buildPieEncoding()
        : chartType === 'table'
            ? buildTableEncoding(values, includeSeriesColor)
            : buildCartesianEncoding(values, includeSeriesColor);

    const vegaLiteSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: spec.summary || spec.title,
        width: DEFAULT_VEGA_LITE_WIDTH,
        height: DEFAULT_VEGA_LITE_HEIGHT,
        data: { values },
        mark: chartType === 'scatter'
            ? 'point'
            : chartType === 'pie'
                ? 'arc'
                : isTable
                    ? { type: 'text', align: 'left', baseline: 'middle' }
                    : chartType,
        encoding,
        config: isTable ? {} : undefined
    };

    return JSON.stringify(vegaLiteSpec, null, 2);
}
