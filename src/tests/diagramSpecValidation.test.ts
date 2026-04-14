import { validateDiagramSpec } from '../diagram/spec';
import { DiagramSpec } from '../diagram/types';

describe('diagram spec validation', () => {
    test('accepts a valid structural diagram spec', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'start', label: 'Start' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [
                { from: 'start', to: 'publish', label: 'continue' }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejects edges that reference missing nodes', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Broken Flow',
            nodes: [{ id: 'start', label: 'Start' }],
            edges: [{ from: 'start', to: 'missing' }]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/missing/i);
    });

    test('requires data series for chart-oriented specs', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Metrics',
            nodes: []
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/data series/i);
    });

    test('rejects unsupported chart layout hints for data charts', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Metrics',
            nodes: [],
            layoutHints: { chartType: 'radar' },
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

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/unsupported chartType/i);
    });

    test('accepts supported chart layout hints for data charts', () => {
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

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(true);
    });
});
