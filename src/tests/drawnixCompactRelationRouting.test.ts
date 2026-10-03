import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { pointOnDrawnixPolyline } from '../diagram/adapters/drawnix/drawnixGeometry';

test('keeps nearby labeled relationships local and shares the exact native/SVG label position', () => {
    const projection = buildDrawnixMindMapProjection({
        intent: 'drawnixMindmap', title: '核心关系',
        nodes: [{ id: 'root', label: '文档', children: [
            { id: 'branch', label: '生物', children: [
                { id: 'dna', label: 'DNA' }, { id: 'rna', label: 'RNA' },
                { id: 'ribosome', label: '核糖体' }
            ] }, { id: 'other', label: '其他科学' }
        ] }],
        edges: [{ from: 'dna', to: 'rna', label: '产生短拷贝' }, { from: 'rna', to: 'ribosome', label: '携信息到达' }]
    });
    for (const relation of projection.crossRelations) {
        expect(relation.routeStrategy).toBe('local-lane');
        expect(relation.points.length).toBeLessThanOrEqual(6);
        const layout = relation.labelLayout!;
        const center = pointOnDrawnixPolyline(relation.points, relation.nativeTextPosition!);
        expect(center[0]).toBeCloseTo(layout.x + layout.width / 2, 6);
        expect(center[1]).toBeCloseTo(layout.y + layout.height / 2, 6);
    }
});
