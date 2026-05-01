import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';

describe('diagram spec response parser', () => {
    test('parses plain JSON responses', () => {
        const raw = JSON.stringify({
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        });

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.intent).toBe('mindmap');
        expect(spec.title).toBe('Platform');
        expect(spec.nodes).toHaveLength(1);
    });

    test('parses fenced json payloads and unwraps diagramSpec envelope', () => {
        const raw = '```json\n{"diagramSpec":{"intent":"flowchart","title":"Release Flow","nodes":[{"id":"validate","label":"Validate"},{"id":"publish","label":"Publish"}],"edges":[{"from":"validate","to":"publish"}]}}\n```';

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.intent).toBe('flowchart');
        expect(spec.edges).toHaveLength(1);
    });

    test('normalizes chart series names into required ids and labels', () => {
        const raw = JSON.stringify({
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    name: 'Weekly Signups',
                    values: [
                        { label: 'Monday', value: '12' },
                        { label: 'Tuesday', value: 18 }
                    ]
                }
            ]
        });

        const spec = parseDiagramSpecResponse(raw);

        expect(spec.dataSeries).toEqual([
            {
                id: 'weekly-signups',
                label: 'Weekly Signups',
                points: [
                    { x: 'Monday', y: 12, series: 'Weekly Signups' },
                    { x: 'Tuesday', y: 18, series: 'Weekly Signups' }
                ]
            }
        ]);
    });

    test('throws when no valid json object can be extracted', () => {
        expect(() => parseDiagramSpecResponse('not valid json')).toThrow(/Unable to parse DiagramSpec/i);
    });
});
