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
    mark: string;
    encoding: Record<string, any>;
};

function normalizeMark(spec: DiagramSpec): string {
    const chartType = spec.layoutHints?.chartType;
    if (typeof chartType === 'string' && ['bar', 'line', 'area', 'point'].includes(chartType)) {
        return chartType;
    }
    return 'bar';
}

function isQuantitativeX(values: VegaLiteValue[]): boolean {
    return values.every(value => typeof value.x === 'number');
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

    if ((spec.dataSeries ?? []).length > 1) {
        encoding.color = {
            field: 'series',
            type: 'nominal',
            title: 'Series'
        };
    }

    const vegaLiteSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: spec.summary || spec.title,
        data: { values },
        mark: normalizeMark(spec),
        encoding
    };

    return JSON.stringify(vegaLiteSpec, null, 2);
}
