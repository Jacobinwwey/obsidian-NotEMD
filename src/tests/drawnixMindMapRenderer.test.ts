import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

function createKnowledgeMapSpec(): DiagramSpec {
    return {
        intent: 'drawnixMindmap' as DiagramSpec['intent'],
        title: 'Notemd Architecture',
        summary: 'Subsystem knowledge map.',
        nodes: [
            {
                id: 'notemd',
                label: 'Notemd',
                children: [
                    {
                        id: 'diagram',
                        label: 'Diagram pipeline',
                        children: [
                            { id: 'spec', label: 'DiagramSpec' },
                            { id: 'renderers', label: 'Renderers' }
                        ]
                    },
                    {
                        id: 'commands',
                        label: 'Command bridge',
                        children: [
                            { id: 'cli', label: 'CLI verification' }
                        ]
                    }
                ]
            }
        ],
        edges: [
            {
                from: 'diagram',
                to: 'commands',
                label: 'invokes',
                relation: 'runtime'
            }
        ]
    };
}

describe('Drawnix mind-map renderer', () => {
    test('accepts only the dedicated Drawnix knowledge-map contract', () => {
        const renderer = new DrawnixRenderer();

        expect(renderer.supports(createKnowledgeMapSpec())).toBe(true);
        expect(renderer.supports({
            ...createKnowledgeMapSpec(),
            intent: 'flowchart'
        })).toBe(false);
    });

    test('exports one native mind-map root with preserved child ownership', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec());
        const data = JSON.parse(artifact.content);

        expect(data.elements).toHaveLength(2);
        expect(data.elements[0]).toMatchObject({
            id: 'notemd',
            type: 'mindmap',
            data: {
                topic: {
                    type: 'paragraph',
                    children: [{ text: 'Notemd' }]
                }
            },
            children: [
                expect.objectContaining({
                    id: 'diagram',
                    type: 'mind_child',
                    children: [
                        expect.objectContaining({ id: 'spec', type: 'mind_child' }),
                        expect.objectContaining({ id: 'renderers', type: 'mind_child' })
                    ]
                }),
                expect.objectContaining({
                    id: 'commands',
                    type: 'mind_child',
                    children: [expect.objectContaining({ id: 'cli', type: 'mind_child' })]
                })
            ]
        });
        expect(data.elements[1]).toMatchObject({
            type: 'arrow-line',
            source: { id: 'diagram' },
            target: { id: 'commands' },
            data: { source: 'DrawnixMindMapProjection' }
        });
        expect(JSON.stringify(data)).not.toContain('SemanticFigureModel');
    });

    test('renders its SVG companion from the mind-map layout rather than the generic figure grid', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec());

        expect(artifact.previewSvg?.content).toContain('data-notemd-renderer="notemd-drawnix-mindmap-svg@1.0.0"');
        expect(artifact.previewSvg?.content).toContain('data-drawnix-mindmap-node-id="notemd"');
        expect(artifact.previewSvg?.content).toContain('data-drawnix-mindmap-node-id="diagram"');
        expect(artifact.previewSvg?.content).not.toContain('data-drawio-type="node"');
    });

    test('rejects invalid mind-map roots before exporting a flattened fallback', async () => {
        const invalidSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [
                { id: 'first-root', label: 'First root' },
                { id: 'second-root', label: 'Second root' }
            ],
            edges: []
        };

        await expect(new DrawnixRenderer().render(invalidSpec)).rejects.toThrow(/exactly one root/i);
    });

    test('produces deterministic layout without overlapping node rectangles', () => {
        const spec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [
                {
                    id: 'notemd',
                    label: 'Notemd architecture and delivery',
                    children: [
                        {
                            id: 'generation',
                            label: 'Diagram generation pipeline',
                            children: [
                                { id: 'prompt', label: 'Prompt profile' },
                                { id: 'planner', label: 'Render planner' }
                            ]
                        },
                        {
                            id: 'rendering',
                            label: 'Rendering boundary',
                            children: [
                                { id: 'drawnix-renderer', label: 'Drawnix renderer' },
                                { id: 'mermaid-renderer', label: 'Mermaid renderer' }
                            ]
                        },
                        { id: 'export', label: 'Artifact export' },
                        { id: 'preview', label: 'SVG preview' },
                        { id: 'tests', label: 'Regression tests' }
                    ]
                }
            ],
            edges: []
        };

        const first = buildDrawnixMindMapProjection(spec);
        const second = buildDrawnixMindMapProjection(spec);

        expect(second).toEqual(first);
        first.nodes.forEach((node, index) => {
            first.nodes.slice(index + 1).forEach(other => {
                const overlaps = node.x < other.x + other.width
                    && node.x + node.width > other.x
                    && node.y < other.y + other.height
                    && node.y + node.height > other.y;
                expect(overlaps).toBe(false);
            });
        });
    });

    test('rejects hierarchy depth beyond the native Drawnix contract', async () => {
        const invalidSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [
                {
                    id: 'depth-0',
                    label: 'Depth 0',
                    children: [
                        {
                            id: 'depth-1',
                            label: 'Depth 1',
                            children: [
                                {
                                    id: 'depth-2',
                                    label: 'Depth 2',
                                    children: [
                                        {
                                            id: 'depth-3',
                                            label: 'Depth 3',
                                            children: [{ id: 'depth-4', label: 'Depth 4' }]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            edges: []
        };

        await expect(new DrawnixRenderer().render(invalidSpec)).rejects.toThrow(/maximum depth of 3/i);
    });

    test('rejects cross relations that duplicate hierarchy ownership', async () => {
        const invalidSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            edges: [{ from: 'notemd', to: 'diagram', label: 'duplicate hierarchy' }]
        };

        await expect(new DrawnixRenderer().render(invalidSpec)).rejects.toThrow(/duplicates a parent-child relationship/i);
    });

    test('rejects more than four cross-branch relations', async () => {
        const invalidSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [
                {
                    id: 'root',
                    label: 'Root',
                    children: [
                        { id: 'a', label: 'A' },
                        { id: 'b', label: 'B' },
                        { id: 'c', label: 'C' },
                        { id: 'd', label: 'D' }
                    ]
                }
            ],
            edges: [
                { from: 'a', to: 'b' },
                { from: 'a', to: 'c' },
                { from: 'a', to: 'd' },
                { from: 'b', to: 'c' },
                { from: 'b', to: 'd' }
            ]
        };

        await expect(new DrawnixRenderer().render(invalidSpec)).rejects.toThrow(/at most 4 cross-branch relationships/i);
    });
});
