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

    test('rejects chart layout hints on non-chart intents', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'start', label: 'Start' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [{ from: 'start', to: 'publish' }],
            layoutHints: { chartType: 'pie' }
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/chartType/i);
        expect(result.errors.join(' ')).toMatch(/dataChart/i);
    });

    test('rejects scatter charts when x values are not numeric', () => {
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
                        { x: 'slow', y: 45 },
                        { x: 'fast', y: 70 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/scatter/i);
        expect(result.errors.join(' ')).toMatch(/numeric x/i);
    });

    test('rejects pie charts with multiple series', () => {
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Traffic Mix',
            nodes: [],
            layoutHints: { chartType: 'pie' },
            dataSeries: [
                {
                    id: 'current',
                    label: 'Current',
                    points: [{ x: 'Organic', y: 40 }]
                },
                {
                    id: 'previous',
                    label: 'Previous',
                    points: [{ x: 'Paid', y: 25 }]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/pie/i);
        expect(result.errors.join(' ')).toMatch(/single data series/i);
    });

    test('rejects pie charts with negative values', () => {
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
                        { x: 'Paid', y: -25 }
                    ]
                }
            ]
        };

        const result = validateDiagramSpec(spec);

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toMatch(/pie/i);
        expect(result.errors.join(' ')).toMatch(/non-negative/i);
    });
});
