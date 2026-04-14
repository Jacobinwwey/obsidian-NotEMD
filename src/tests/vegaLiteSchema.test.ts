import { SUPPORTED_VEGA_LITE_CHART_TYPES, isSupportedVegaLiteChartType } from '../diagram/adapters/vega/schema';

describe('vega-lite schema contract', () => {
    test('exposes the controlled chart template list', () => {
        expect(SUPPORTED_VEGA_LITE_CHART_TYPES).toEqual([
            'bar',
            'line',
            'area',
            'point',
            'scatter',
            'pie',
            'table'
        ]);
    });

    test('recognizes supported chart types and rejects unsupported ones', () => {
        expect(isSupportedVegaLiteChartType('pie')).toBe(true);
        expect(isSupportedVegaLiteChartType('scatter')).toBe(true);
        expect(isSupportedVegaLiteChartType('radar')).toBe(false);
        expect(isSupportedVegaLiteChartType(undefined)).toBe(false);
    });
});
