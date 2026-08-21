import { normalizeDiagramSpecPayload } from '../diagram/payloads/legacyPayload';
import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';
import { validateDiagramSpec } from '../diagram/spec';

describe('diagram canonical payload compatibility boundary', () => {
    test('maps a legacy data chart into the quantitative payload without removing legacy fields', () => {
        const spec = normalizeDiagramSpecPayload(parseDiagramSpecResponse(JSON.stringify({
            intent: 'dataChart',
            title: 'Weekly signups',
            nodes: [],
            layoutHints: { chartType: 'line' },
            dataSeries: [{
                id: 'signups',
                label: 'Signups',
                points: [{ x: 'Mon', y: 4 }]
            }]
        })));

        expect(spec.schemaVersion).toBe(2);
        expect(spec.payload).toEqual({
            kind: 'quantitative',
            chartType: 'line',
            series: spec.dataSeries
        });
        expect(spec.dataSeries?.[0].points[0].y).toBe(4);
    });

    test('preserves an explicit canonical payload and rejects unknown schema versions', () => {
        const canonical = normalizeDiagramSpecPayload({
            schemaVersion: 2,
            intent: 'flowchart',
            title: 'Release',
            nodes: [{ id: 'build', label: 'Build' }],
            payload: { kind: 'legacy', nodes: [{ id: 'build', label: 'Build' }], edges: [] }
        });
        expect(canonical.payload?.kind).toBe('legacy');
        expect(() => normalizeDiagramSpecPayload({
            schemaVersion: 3,
            intent: 'flowchart',
            title: 'Future',
            nodes: []
        })).toThrow(/Unsupported DiagramSpec schema version/i);
        expect(validateDiagramSpec({
            schemaVersion: 2,
            intent: 'flowchart',
            title: 'Missing payload',
            nodes: [{ id: 'build', label: 'Build' }]
        }).errors).toContain('DiagramSpec schema version 2 requires a canonical payload.');
    });
});
