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

    test('supports radar specs through the same Vega-Lite target contract', async () => {
        const renderer = new VegaLiteRenderer();
        const spec: DiagramSpec = {
            intent: 'radar',
            title: 'Engineering profile',
            nodes: [],
            radarSpec: {
                axes: [
                    { id: 'a', label: 'A' },
                    { id: 'b', label: 'B' },
                    { id: 'c', label: 'C' }
                ],
                series: [{
                    id: 'current',
                    label: 'Current',
                    points: [
                        { axisId: 'a', value: 1 },
                        { axisId: 'b', value: 2 },
                        { axisId: 'c', value: 3 }
                    ]
                }]
            }
        };

        expect(renderer.supports(spec)).toBe(true);
        const artifact = await renderer.render(spec);

        expect(artifact.sourceIntent).toBe('radar');
        expect(JSON.parse(artifact.content).layer).toBeDefined();
    });
});
