import { selectDrawnixCoreRelations } from '../diagram/adapters/drawnix/drawnixCoreRelations';
import type { DiagramSpec } from '../diagram/types';

const spec = (edges: DiagramSpec['edges']): DiagramSpec => ({
    intent: 'drawnixMindmap', title: '核心关系',
    nodes: [{ id: 'root', label: '主题', children: Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, label: `节点${i}` })) }], edges
});

test('keeps explicit predicates and filters unlabeled, generic and hierarchy arrows without inventing claims', () => {
    const selection = selectDrawnixCoreRelations(spec([
        { from: 'n0', to: 'n1' }, { from: 'n1', to: 'n2', label: '相关' },
        { from: 'root', to: 'n0', label: '包含' }, { from: 'n0', to: 'n2', relation: '抑制' }
    ]));
    expect(selection.edges).toEqual([{ from: 'n0', to: 'n2', relation: '抑制', label: '抑制' }]);
    expect(selection.omitted).toHaveLength(3);
});

test('retains every explicit relationship without a global count limit or input mutation', () => {
    const input = spec(Array.from({ length: 9 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}`, label: `推动阶段${i + 1}` })));
    const before = JSON.stringify(input);
    const selection = selectDrawnixCoreRelations(input);
    expect(selection.edges).toHaveLength(9);
    expect(selection.edges.map(edge => edge.from)).toEqual(input.edges!.map(edge => edge.from));
    expect(selection.omitted).toHaveLength(0);
    expect(JSON.stringify(input)).toBe(before);
});

test('deduplicates identical claims while preserving distinct predicates and high fan-out', () => {
    const selection = selectDrawnixCoreRelations(spec([
        { from: 'n0', to: 'n1', label: '驱动' }, { from: 'n0', to: 'n1', label: '驱动' },
        { from: 'n0', to: 'n1', label: '监测' }, { from: 'n0', to: 'n2', label: '驱动' },
        { from: 'n0', to: 'n3', label: '驱动' }, { from: 'n0', to: 'n4', label: '驱动' },
        { from: 'n4', to: 'n5', label: '抑制' }
    ]));
    expect(selection.edges).toHaveLength(6);
    expect(selection.omitted.map(item => item.reason)).toEqual(['duplicate']);
});

test('deduplicates repeated predicates even when another predicate intervenes, preserving direction', () => {
    const selection = selectDrawnixCoreRelations(spec([
        { from: 'n0', to: 'n1', label: '驱动' }, { from: 'n0', to: 'n1', label: '监测' },
        { from: 'n0', to: 'n1', label: '驱动' }, { from: 'n1', to: 'n0', label: '驱动' }
    ]));
    expect(selection.edges).toHaveLength(3);
    expect(selection.omitted.map(item => item.reason)).toEqual(['duplicate']);
});
