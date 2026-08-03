import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

function intersectsInterior(
    start: [number, number],
    end: [number, number],
    rectangle: { x: number; y: number; width: number; height: number }
): boolean {
    const left = rectangle.x;
    const right = rectangle.x + rectangle.width;
    const top = rectangle.y;
    const bottom = rectangle.y + rectangle.height;
    if (start[0] === end[0]) {
        return start[0] > left && start[0] < right
            && Math.max(Math.min(start[1], end[1]), top) < Math.min(Math.max(start[1], end[1]), bottom);
    }
    if (start[1] === end[1]) {
        return start[1] > top && start[1] < bottom
            && Math.max(Math.min(start[0], end[0]), left) < Math.min(Math.max(start[0], end[0]), right);
    }
    return false;
}

describe('Drawnix cross-root routing', () => {
    test('routes around unrelated roots instead of crossing their rectangles', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Forest',
            nodes: [
                { id: 'root-a', label: 'Root A', children: [{ id: 'a-child', label: 'A child' }] },
                { id: 'root-b', label: 'Root B', children: [{ id: 'b-child', label: 'B child' }] },
                { id: 'root-c', label: 'Root C', children: [{ id: 'c-child', label: 'C child' }] }
            ],
            edges: [{ from: 'a-child', to: 'c-child', label: 'crosses forest' }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const middleRegion = projection.rootRegions.find(region => region.rootId === 'root-b');

        expect(middleRegion).toBeDefined();
        expect(relation.sourceRootId).toBe('root-a');
        expect(relation.targetRootId).toBe('root-c');
        expect(relation.routeStrategy).toBeDefined();
        relation.points.slice(1).forEach((point, index) => {
            expect(intersectsInterior(relation.points[index], point, middleRegion!)).toBe(false);
        });
    });

    test('uses the same routed points in native JSON and SVG output', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Shared route',
            nodes: [
                { id: 'a', label: 'A', children: [{ id: 'a-child', label: 'A child' }] },
                { id: 'b', label: 'B' },
                { id: 'c', label: 'C', children: [{ id: 'c-child', label: 'C child' }] }
            ],
            edges: [{ from: 'a-child', to: 'c-child' }]
        };
        const projection = buildDrawnixMindMapProjection(spec);
        const artifact = await new DrawnixRenderer().render(spec);
        const data = JSON.parse(artifact.content);
        const nativeArrow = data.elements.find((element: { type: string }) => element.type === 'arrow-line');

        expect(nativeArrow.points).toEqual(projection.crossRelations[0].points);
        expect(artifact.previewSvg?.content).toContain(`data-drawnix-mindmap-route-strategy="${projection.crossRelations[0].routeStrategy}"`);
        expect(artifact.previewSvg?.content).toContain(`data-drawnix-mindmap-source-root="a"`);
    });

    test('keeps parallel relations deterministic and separated', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Parallel',
            nodes: [
                { id: 'left', label: 'Left', children: [{ id: 'left-a', label: 'Left A' }, { id: 'left-b', label: 'Left B' }] },
                { id: 'right', label: 'Right', children: [{ id: 'right-a', label: 'Right A' }, { id: 'right-b', label: 'Right B' }] }
            ],
            edges: [
                { from: 'left-a', to: 'right-a' },
                { from: 'left-b', to: 'right-b' }
            ]
        };

        const first = buildDrawnixMindMapProjection(spec);
        const second = buildDrawnixMindMapProjection(spec);

        expect(second.crossRelations).toEqual(first.crossRelations);
        expect(first.crossRelations[0].points).not.toEqual(first.crossRelations[1].points);
    });
});
