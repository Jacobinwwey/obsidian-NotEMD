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
});
