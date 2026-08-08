import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { routeDrawnixCrossRootRelation } from '../diagram/adapters/drawnix/drawnixCrossRootRouter';
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

    test('keeps duplicate endpoint relations on separate lanes', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Duplicate endpoints',
            nodes: [
                { id: 'left', label: 'Left', children: [{ id: 'left-child', label: 'Left child' }] },
                { id: 'right', label: 'Right', children: [{ id: 'right-child', label: 'Right child' }] }
            ],
            edges: [
                { from: 'left-child', to: 'right-child', label: 'first relation' },
                { from: 'left-child', to: 'right-child', label: 'second relation' }
            ]
        };

        const projection = buildDrawnixMindMapProjection(spec);

        expect(projection.crossRelations[0].points).not.toEqual(projection.crossRelations[1].points);
    });

    test('keeps same-root routes outside the target node before the arrow terminates', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Target clearance',
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [
                    { id: 'source', label: 'Source' },
                    { id: 'target', label: 'Target' }
                ]
            }],
            edges: [{ from: 'source', to: 'target', label: 'feeds target' }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const target = projection.nodes.find(node => node.id === 'target');

        expect(target).toBeDefined();
        relation.points.slice(1).forEach((point, index) => {
            expect(intersectsInterior(relation.points[index], point, target!)).toBe(false);
        });
    });

    test('uses the sparse grid fallback for dense same-root branches without entering any node', () => {
        const children = Array.from({ length: 30 }, (_, branchIndex) => ({
            id: `branch-${branchIndex}`,
            label: `Branch ${branchIndex}`,
            children: Array.from({ length: 5 }, (_, childIndex) => ({
                id: `branch-${branchIndex}-child-${childIndex}`,
                label: `Child ${branchIndex}-${childIndex}`,
                children: [{
                    id: `branch-${branchIndex}-leaf-${childIndex}`,
                    label: `Leaf ${branchIndex}-${childIndex}`
                }]
            }))
        }));
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Dense same-root routing',
            nodes: [{ id: 'root', label: 'Root', children }],
            edges: [{
                from: 'branch-0-child-0',
                to: 'branch-1-child-0',
                label: 'dense branch relation'
            }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const source = projection.nodes.find(node => node.id === relation.sourceId);
        const target = projection.nodes.find(node => node.id === relation.targetId);

        expect(relation.routeStrategy).toBe('grid');
        expect(source).toBeDefined();
        expect(target).toBeDefined();
        relation.points.slice(1).forEach((point, index) => {
            projection.nodes.forEach(node => {
                if (node.id === source?.id || node.id === target?.id) {
                    return;
                }
                expect(intersectsInterior(relation.points[index], point, node)).toBe(false);
            });
        });
    });

    test('fails closed instead of returning a direct route when no obstacle-free route exists', () => {
        expect(() => routeDrawnixCrossRootRelation({
            source: {
                id: 'source',
                rootId: 'source-root',
                label: 'Source',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 100,
                y: 100,
                width: 80,
                height: 60,
                textLines: ['Source']
            },
            target: {
                id: 'target',
                rootId: 'target-root',
                label: 'Target',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 1000,
                y: 100,
                width: 80,
                height: 60,
                textLines: ['Target']
            },
            relationIndex: 0,
            regions: [{
                rootId: 'unrelated-root',
                rowIndex: 0,
                columnIndex: 0,
                x: 0,
                y: 0,
                width: 1200,
                height: 300
            }],
            canvasWidth: 1200,
            canvasHeight: 400
        })).toThrow(/must fall back to a non-Drawnix target/i);
    });

    test('fails closed instead of emitting a clipped off-canvas perimeter route', () => {
        const source = {
            id: 'source',
            rootId: 'source-root',
            label: 'Source',
            role: 'concept',
            depth: 0,
            branchIndex: -1,
            x: 100,
            y: 200,
            width: 80,
            height: 60,
            textLines: ['Source']
        };
        const target = {
            id: 'target',
            rootId: 'target-root',
            label: 'Target',
            role: 'concept',
            depth: 0,
            branchIndex: -1,
            x: 900,
            y: 200,
            width: 80,
            height: 60,
            textLines: ['Target']
        };

        expect(() => routeDrawnixCrossRootRelation({
            source,
            target,
            nodes: [source, target],
            additionalObstacles: [{ x: 200, y: 0, width: 680, height: 600 }],
            relationIndex: 0,
            regions: [],
            canvasWidth: 1080,
            canvasHeight: 600
        })).toThrow(/must fall back to a non-Drawnix target/i);
    });
});
