import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { pointOnDrawnixPolyline } from '../diagram/adapters/drawnix/drawnixGeometry';
import { findDrawnixCompactRelationRoute, routeDrawnixRelationThroughReservedLane } from '../diagram/adapters/drawnix/drawnixRelationRouter';
import type { DrawnixPoint } from '../diagram/adapters/drawnix/drawnixGeometry';

const routeNodes = [100, 600].map((x, index) => ({
    id: `node-${index}`, rootId: 'root', label: 'Topic', role: 'concept', depth: 1, branchIndex: index,
    x, y: 100, width: 140, height: 56, textLines: ['Topic']
}));

function sharedLength(first: DrawnixPoint[], second: DrawnixPoint[]): number {
    let length = 0;
    for (let i = 1; i < first.length; i++) for (let j = 1; j < second.length; j++) {
        const a = first[i - 1], b = first[i], c = second[j - 1], d = second[j];
        const axis = a[1] === b[1] ? 0 : 1;
        if (a[1 - axis] !== c[1 - axis] || c[1 - axis] !== d[1 - axis]) continue;
        length += Math.max(0, Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]))
            - Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis])));
    }
    return length;
}

test('allows a clean perpendicular crossing instead of forcing a long exterior detour', () => {
    const relation = findDrawnixCompactRelationRoute({
        source: routeNodes[0], target: routeNodes[1], nodes: routeNodes,
        canvasWidth: 1000, canvasHeight: 700, labelSize: { width: 100, height: 32 }, additionalObstacles: [],
        previousRoutes: [[[450, 0], [450, 700]]]
    });
    expect(relation).not.toBeNull();
    expect(relation!.points.length).toBeLessThanOrEqual(4);
    expect(sharedLength(relation!.points, [[450, 0], [450, 700]])).toBe(0);
});

test('uses separate ingress for exterior relations sharing endpoints', () => {
    const input = {
        source: routeNodes[0], target: routeNodes[1], nodes: routeNodes, canvasWidth: 1000, canvasHeight: 700,
        lane: { relationId: 'first', leftTrackX: 30, rightTrackX: 900, y: 500, labelCenterX: 465 }
    };
    const first = routeDrawnixRelationThroughReservedLane(input);
    const second = routeDrawnixRelationThroughReservedLane({ ...input,
        lane: { relationId: 'second', leftTrackX: 50, rightTrackX: 920, y: 580, labelCenterX: 485 },
        previousRoutes: [first.points]
    });
    expect(sharedLength(first.points, second.points)).toBeLessThan(1);
});

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
