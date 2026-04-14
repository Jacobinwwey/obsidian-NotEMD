import { renderVegaLiteSpec } from '../diagram/adapters/vega/vegaLiteAdapter';
import { DiagramSpec } from '../diagram/types';

describe('vega-lite adapter', () => {
    test('renders a valid vega-lite spec from chart data series', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    id: 'signups',
                    label: 'Signups',
                    points: [
                        { x: 'Week 1', y: 12 },
                        { x: 'Week 2', y: 19 }
                    ]
                }
            ]
        };

        const output = renderVegaLiteSpec(spec);
        const parsed = JSON.parse(output);

        expect(parsed.$schema).toContain('vega-lite');
        expect(parsed.mark).toBe('bar');
        expect(parsed.data.values).toHaveLength(2);
        expect(parsed.encoding.x.field).toBe('x');
        expect(parsed.encoding.y.field).toBe('y');
    });

    test('supports multi-series charts with color encoding', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Sources',
            nodes: [],
            dataSeries: [
                {
                    id: 'organic',
                    label: 'Organic',
                    points: [{ x: 'Jan', y: 40 }]
                },
                {
                    id: 'paid',
                    label: 'Paid',
                    points: [{ x: 'Jan', y: 25 }]
                }
            ]
        };

        const output = renderVegaLiteSpec(spec);
        const parsed = JSON.parse(output);

        expect(parsed.encoding.color.field).toBe('series');
        expect(parsed.data.values).toHaveLength(2);
    });

    test('maps scatter chart hints onto point marks with quantitative axes', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Latency vs Throughput',
            nodes: [],
            layoutHints: { chartType: 'scatter' },
            dataSeries: [
                {
                    id: 'bench',
                    label: 'Benchmark',
                    points: [
                        { x: 120, y: 45 },
                        { x: 180, y: 70 }
                    ]
                }
            ]
        };

        const output = renderVegaLiteSpec(spec);
        const parsed = JSON.parse(output);

        expect(parsed.mark).toBe('point');
        expect(parsed.encoding.x.type).toBe('quantitative');
        expect(parsed.encoding.y.type).toBe('quantitative');
    });

    test('renders pie chart hints with theta and color encodings', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Mix',
            nodes: [],
            layoutHints: { chartType: 'pie' },
            dataSeries: [
                {
                    id: 'traffic',
                    label: 'Traffic',
                    points: [
                        { x: 'Organic', y: 40 },
                        { x: 'Paid', y: 25 }
                    ]
                }
            ]
        };

        const output = renderVegaLiteSpec(spec);
        const parsed = JSON.parse(output);

        expect(parsed.mark).toBe('arc');
        expect(parsed.encoding.theta.field).toBe('y');
        expect(parsed.encoding.color.field).toBe('x');
    });

    test('renders table chart hints with text marks and row ordering', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Top Issues',
            nodes: [],
            layoutHints: { chartType: 'table' },
            dataSeries: [
                {
                    id: 'issues',
                    label: 'Issues',
                    points: [
                        { x: 'Timeouts', y: 12 },
                        { x: 'Retries', y: 7 }
                    ]
                }
            ]
        };

        const output = renderVegaLiteSpec(spec);
        const parsed = JSON.parse(output);

        expect(parsed.mark.type).toBe('text');
        expect(parsed.encoding.row.field).toBe('x');
        expect(parsed.encoding.text.field).toBe('y');
        expect(parsed.config.axis).toBeUndefined();
    });
});
