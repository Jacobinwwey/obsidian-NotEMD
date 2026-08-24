import { diagnoseDiagramLayout } from '../diagram/layout/layoutDiagnostics';
import { DiagramSpec } from '../diagram/types';

describe('diagram layout diagnostics', () => {
    test('rejects a core label that the deterministic renderer would have to truncate', () => {
        const spec: DiagramSpec = {
            schemaVersion: 2,
            intent: 'architecture',
            title: 'Architecture',
            nodes: [],
            payload: {
                kind: 'topology',
                zones: [{ id: 'z', label: 'Zone' }],
                nodes: [{ id: 'n', label: 'A'.repeat(80), zoneId: 'z' }],
                edges: []
            }
        };
        expect(diagnoseDiagramLayout(spec)).toEqual(expect.arrayContaining([
            expect.objectContaining({ severity: 'error', kind: 'layout-text-overflow' })
        ]));
    });

    test('keeps optional detail advisory while allowing the core layout to render', () => {
        const spec: DiagramSpec = {
            schemaVersion: 2,
            intent: 'architecture',
            title: 'Architecture',
            nodes: [],
            payload: {
                kind: 'topology',
                zones: [{ id: 'z', label: 'Zone', sub: 'A'.repeat(80) }],
                nodes: [{ id: 'n', label: 'Node', zoneId: 'z' }],
                edges: []
            }
        };
        expect(diagnoseDiagramLayout(spec)).toEqual(expect.arrayContaining([
            expect.objectContaining({ severity: 'warning', kind: 'layout-text-overflow' })
        ]));
        expect(diagnoseDiagramLayout(spec).some(diagnostic => diagnostic.severity === 'error')).toBe(false);
    });
});
