import { assertValidDiagramSpec } from '../../spec';
import { DiagramSpec } from '../../types';

type VegaLiteValue = {
    x: string | number;
    y: number;
    series: string;
};

type VegaLiteSpec = {
    $schema: string;
    description: string;
    data: {
        values: VegaLiteValue[];
    };
    mark: string | Record<string, unknown>;
    encoding: Record<string, any>;
    config?: Record<string, unknown>;
};

type SupportedChartType = 'bar' | 'line' | 'area' | 'point' | 'scatter' | 'pie' | 'table';

function normalizeChartType(spec: DiagramSpec): SupportedChartType {
    const chartType = spec.layoutHints?.chartType;
    if (
        typeof chartType === 'string'
        && ['bar', 'line', 'area', 'point', 'scatter', 'pie', 'table'].includes(chartType)
    ) {
        return chartType as SupportedChartType;
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

export function renderVegaLiteSpec(spec: DiagramSpec): string {
    if (spec.intent !== 'dataChart') {
        throw new Error(`VegaLiteAdapter cannot render diagram intent "${spec.intent}".`);
    }

    assertValidDiagramSpec(spec);

    const values: VegaLiteValue[] = (spec.dataSeries ?? []).flatMap(series =>
        series.points.map(point => ({
            x: point.x,
            y: point.y,
            series: series.label
        }))
    );
    const chartType = normalizeChartType(spec);
    const includeSeriesColor = (spec.dataSeries ?? []).length > 1;
    const isTable = chartType === 'table';

    const encoding = chartType === 'pie'
        ? buildPieEncoding()
        : chartType === 'table'
            ? buildTableEncoding(values, includeSeriesColor)
            : buildCartesianEncoding(values, includeSeriesColor);

    const vegaLiteSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: spec.summary || spec.title,
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
