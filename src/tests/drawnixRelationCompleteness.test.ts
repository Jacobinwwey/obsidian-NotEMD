import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { buildDrawnixKnowledgeMapPromptRules } from '../diagram/prompts/drawnixKnowledgeMapPrompt';
import { DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE } from './fixtures/drawnixArchitectureDocumentTreeFixture';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { selectDrawnixCoreRelations } from '../diagram/adapters/drawnix/drawnixCoreRelations';
import { drawnixRectanglesOverlap } from '../diagram/adapters/drawnix/drawnixGeometry';

test('architecture exports preserve all labeled relationships in native and SVG output', async () => {
    const artifact = await new DrawnixRenderer().render(DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE);
    const native = JSON.parse(artifact.content);
    const arrows = native.elements.filter((element: { type: string }) => element.type === 'arrow-line');
    expect(arrows).toHaveLength(DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE.edges!.length);
    for (const edge of DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE.edges!) {
        expect(artifact.previewSvg!.content).toContain(edge.label);
        expect(arrows).toEqual(expect.arrayContaining([expect.objectContaining({
            source: expect.objectContaining({ id: edge.from }),
            target: expect.objectContaining({ id: edge.to })
        })]));
    }
    expect(native.metadata?.notemd.omittedRelations ?? []).toHaveLength(0);
});

test('high fan-out, distinct predicates and reciprocal claims keep separate measurable labels', () => {
    const input = {
        intent: 'drawnixMindmap' as const, title: '依赖关系',
        nodes: [{ id: 'root', label: '系统', children: Array.from({ length: 12 }, (_, index) => ({
            id: `node-${index}`, label: `组件 ${index}`
        })) }],
        edges: [
            ...Array.from({ length: 10 }, (_, index) => ({ from: 'node-0', to: `node-${index + 1}`, label: '提供输入' })),
            { from: 'node-0', to: 'node-1', label: '监测状态' },
            { from: 'node-1', to: 'node-0', label: '反馈结果' }
        ]
    };
    const selected = selectDrawnixCoreRelations(input);
    const projection = buildDrawnixMindMapProjection({ ...input, edges: selected.edges });
    expect(projection.crossRelations).toHaveLength(12);
    const labels = projection.crossRelations.map(relation => relation.labelLayout!);
    for (let index = 0; index < labels.length; index++) {
        expect(labels[index]).toBeDefined();
        for (const other of labels.slice(index + 1)) expect(drawnixRectanglesOverlap(labels[index], other)).toBe(false);
    }
});

test('generation prompt preserves source-supported relationships without an arbitrary numeric budget', () => {
    const prompt = buildDrawnixKnowledgeMapPromptRules();
    expect(prompt).not.toMatch(/3–6|at most six|at most three/);
    expect(prompt).toContain('Do not impose a fixed relationship count');
});
