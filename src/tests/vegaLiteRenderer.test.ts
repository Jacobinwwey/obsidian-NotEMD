import { DiagramSpec } from '../diagram/types';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';

describe('vega-lite renderer', () => {
    test('supports dataChart specs and returns json artifact', async () => {
        const renderer = new VegaLiteRenderer();
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    id: 'signups',
                    label: 'Signups',
                    points: [{ x: 'Week 1', y: 12 }]
                }
            ]
        };

        expect(renderer.supports(spec)).toBe(true);

        const artifact = await renderer.render(spec);

        expect(artifact.target).toBe('vega-lite');
        expect(artifact.mimeType).toBe('application/json');
        expect(artifact.content).toContain('"$schema"');
    });
});
