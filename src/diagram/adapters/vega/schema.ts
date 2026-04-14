export const SUPPORTED_VEGA_LITE_CHART_TYPES = [
    'bar',
    'line',
    'area',
    'point',
    'scatter',
    'pie',
    'table'
] as const;

export type SupportedVegaLiteChartType = typeof SUPPORTED_VEGA_LITE_CHART_TYPES[number];

export function isSupportedVegaLiteChartType(value: unknown): value is SupportedVegaLiteChartType {
    return typeof value === 'string'
        && (SUPPORTED_VEGA_LITE_CHART_TYPES as readonly string[]).includes(value);
}
