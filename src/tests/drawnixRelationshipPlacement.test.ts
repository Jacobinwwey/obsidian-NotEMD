import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DiagramSpec } from '../diagram/types';

function separatedRelationships(): DiagramSpec {
    return {
        intent: 'drawnixMindmap', title: 'Relationship placement',
        nodes: [{ id: 'root', label: 'Document', children: Array.from({ length: 10 }, (_, index) => ({
            id: `branch-${index}`, label: `Branch ${index}`, children: [{ id: `leaf-${index}`, label: `Topic ${index}` }]
        })) }],
        edges: [0, 1, 2, 3].map(index => ({ from: `leaf-${index}`, to: `leaf-${9 - index}`, label: 'depends on' }))
    };
}

test('brings strongly connected branches closer while preserving every node, relationship and hierarchy', () => {
    const spec = separatedRelationships();
    const original = JSON.stringify(spec);
    const sourceOrder = buildDrawnixMindMapProjection({ ...spec, edges: [] });
    const arranged = buildDrawnixMindMapProjection(spec);
    const distance = (nodes: typeof arranged.nodes) => spec.edges!.reduce((sum, edge) => {
        const a = nodes.find(node => node.id === edge.from)!;
        const b = nodes.find(node => node.id === edge.to)!;
        return sum + Math.abs(a.x + a.width / 2 - b.x - b.width / 2) + Math.abs(a.y + a.height / 2 - b.y - b.height / 2);
    }, 0);
    expect(distance(arranged.nodes)).toBeLessThan(distance(sourceOrder.nodes) * 0.65);
    expect(arranged.nodes.map(node => [node.id, node.parentId, node.label]).sort()).toEqual(sourceOrder.nodes.map(node => [node.id, node.parentId, node.label]).sort());
    expect(arranged.crossRelations.map(edge => [edge.sourceId, edge.targetId, edge.label])).toEqual(spec.edges!.map(edge => [edge.from, edge.to, edge.label]));
    expect(JSON.stringify(spec)).toBe(original);
    expect(buildDrawnixMindMapProjection(spec)).toEqual(arranged);
});

test('retains source sibling order when no relationships justify moving nodes', () => {
    const spec = separatedRelationships();
    const arranged = buildDrawnixMindMapProjection({ ...spec, edges: [] });
    expect(arranged.root.children.map(child => child.id)).toEqual(spec.nodes[0].children!.map(child => child.id));
});
