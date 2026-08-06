import { DiagramSpec } from '../diagram/types';
import {
    buildDrawnixMindMapProjection,
    DRAWNIX_MIND_MAP_FOREST_ROW_MAX_WIDTH
} from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { renderDrawnixMindMapSvg } from '../rendering/renderers/drawnixMindMapSvgRenderer';

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
        expect(artifact.previewSvg?.content).toContain('font-family: "NotoSansSC", "Segoe UI", Arial, sans-serif;');
        expect(artifact.previewSvg?.content).toContain('font-weight: 400;');
        expect(artifact.previewSvg?.content).toContain('font-family="NotoSansSC"');
        expect(artifact.previewSvg?.content).not.toContain('font-family=""');
    });

    test('persists source Mermaid visuals inline in Drawnix metadata', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec(), {
            sourceVisuals: [{
                id: 'source-visual-1',
                kind: 'mermaid',
                sourceHash: 'abc12345',
                lineStart: 1,
                lineEnd: 3,
                language: 'mermaid',
                definition: 'flowchart TD\nA --> B',
                status: 'resolved',
                content: 'flowchart TD\nA --> B'
            }]
        });

        const data = JSON.parse(artifact.content);
        expect(artifact.companions).toEqual([]);
        expect(artifact.sourceVisualManifest?.[0]).toMatchObject({ id: 'source-visual-1', status: 'resolved' });
        expect(data.metadata.notemd.sourceVisuals).toEqual([
            expect.objectContaining({
                id: 'source-visual-1',
                kind: 'mermaid',
                status: 'resolved',
                companionPaths: [],
                embeddedSvg: expect.stringContaining('<svg'),
                sourceContent: 'flowchart TD\nA --> B'
            })
        ]);
    });

    test('embeds resolved Mermaid visuals in the Drawnix mind-map preview', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec(), {
            sourceVisuals: [{
                id: 'source-visual-1',
                kind: 'mermaid',
                sourceHash: 'abc12345',
                lineStart: 1,
                lineEnd: 3,
                language: 'mermaid',
                definition: 'flowchart TD\nA --> B',
                status: 'resolved',
                content: 'flowchart TD\nA --> B'
            }]
        });

        const previewSvg = artifact.previewSvg?.content ?? '';
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-id="source-visual-1"');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-kind="mermaid"');
        expect(previewSvg).toContain('Mermaid source visual 1');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-svg="source-visual-1"');
        expect(previewSvg).toContain('data-drawnix-mindmap-node-id="notemd"');
    });

    test('renders every Mermaid visual in separate panels with isolated SVG ids', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec(), {
            sourceVisuals: [
                {
                    id: 'source-visual-1',
                    kind: 'mermaid',
                    sourceHash: 'abc12345',
                    lineStart: 1,
                    lineEnd: 3,
                    language: 'mermaid',
                    definition: 'flowchart TD\nA --> B',
                    status: 'resolved',
                    content: 'flowchart TD\nA --> B'
                },
                {
                    id: 'source-visual-2',
                    kind: 'mermaid',
                    sourceHash: 'def67890',
                    lineStart: 5,
                    lineEnd: 7,
                    language: 'mermaid',
                    definition: 'flowchart LR\nB --> C',
                    status: 'resolved',
                    content: 'flowchart LR\nB --> C'
                }
            ]
        });

        const previewSvg = artifact.previewSvg?.content ?? '';
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-panels="2"');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-id="source-visual-1"');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-id="source-visual-2"');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-svg="source-visual-1"');
        expect(previewSvg).toContain('data-drawnix-mindmap-source-visual-svg="source-visual-2"');
        const width = Number(previewSvg.match(/^<svg\b[^>]*\bwidth="([0-9.]+)"/)?.[1]);
        expect(width).toBeGreaterThan(0);
        expect(width).toBeGreaterThan(buildDrawnixMindMapProjection(createKnowledgeMapSpec()).width);
    });

    test('namespaces nested Mermaid SVG ids independently for each source visual', () => {
        const projection = buildDrawnixMindMapProjection(createKnowledgeMapSpec());
        const previewSvg = renderDrawnixMindMapSvg(projection, [
            {
                id: 'source-visual-1',
                kind: 'mermaid',
                title: 'Mermaid source visual 1',
                lineStart: 1,
                lineEnd: 3,
                svg: '<svg viewBox="0 0 100 50"><defs><marker id="arrow" /></defs><path marker-end="url(#arrow)" /></svg>'
            },
            {
                id: 'source-visual-2',
                kind: 'mermaid',
                title: 'Mermaid source visual 2',
                lineStart: 5,
                lineEnd: 7,
                svg: '<svg viewBox="0 0 100 50"><defs><marker id="arrow" /></defs><path marker-end="url(#arrow)" /></svg>'
            }
        ]);

        expect(previewSvg).toContain('id="notemd-source-visual-1-0-arrow"');
        expect(previewSvg).toContain('url(#notemd-source-visual-1-0-arrow)');
        expect(previewSvg).toContain('id="notemd-source-visual-2-0-arrow"');
        expect(previewSvg).toContain('url(#notemd-source-visual-2-0-arrow)');
    });

    test('preserves nested Mermaid root attributes and rewrites CSS id selectors', () => {
        const projection = buildDrawnixMindMapProjection(createKnowledgeMapSpec());
        const previewSvg = renderDrawnixMindMapSvg(projection, [{
            id: 'source-visual-css',
            kind: 'mermaid',
            title: 'Mermaid source visual',
            lineStart: 1,
            lineEnd: 3,
            svg: '<svg id="mermaid-root" class="mermaid" viewBox="0 0 100 50"><style>#mermaid-root .node { fill: #334155; }</style><g class="node" /></svg>'
        }]);

        expect(previewSvg).toContain('id="notemd-source-visual-css-0-mermaid-root"');
        expect(previewSvg).toContain('#notemd-source-visual-css-0-mermaid-root .node');
        expect(previewSvg).not.toContain('#mermaid-root .node');
    });

    test('normalizes embedded source visual font declarations to the shared preview family', () => {
        const projection = buildDrawnixMindMapProjection(createKnowledgeMapSpec());
        const previewSvg = renderDrawnixMindMapSvg(projection, [{
            id: 'source-visual-font',
            kind: 'mermaid',
            title: 'Mermaid source visual',
            lineStart: 1,
            lineEnd: 3,
            svg: '<svg font-family=""><style>.label { font-family: "trebuchet ms", verdana, sans-serif; }</style><text class="label" style="font-family: Trebuchet MS; fill: red">Node</text></svg>'
        }]);

        expect(previewSvg).not.toContain('font-family=""');
        expect(previewSvg).not.toContain('trebuchet ms');
        expect(previewSvg).toContain('font-family="NotoSansSC"');
        expect(previewSvg).toContain('font-family: "NotoSansSC", "Segoe UI", Arial, sans-serif');
        expect(previewSvg).toContain('style="font-family: &quot;NotoSansSC&quot;, &quot;Segoe UI&quot;, Arial, sans-serif; fill: red"');
    });

    test('exposes the primary Drawnix visual and every Mermaid visual as ordered preview panels', async () => {
        const artifact = await new DrawnixRenderer().render(createKnowledgeMapSpec(), {
            sourceVisuals: [
                {
                    id: 'visual-1', kind: 'mermaid', sourceHash: 'hash-1', lineStart: 1, lineEnd: 3,
                    status: 'resolved', content: 'flowchart TD\nA --> B'
                },
                {
                    id: 'visual-2', kind: 'mermaid', sourceHash: 'hash-2', lineStart: 5, lineEnd: 7,
                    status: 'resolved', content: 'sequenceDiagram\nAlice->>Bob: Hello'
                }
            ]
        });

        expect(artifact.previewPanels?.map(panel => panel.id)).toEqual(['drawnix-primary', 'visual-1', 'visual-2']);
        expect(artifact.previewPanels?.[0].artifact.target).toBe('drawnix');
        expect(artifact.previewPanels?.[1].artifact).toMatchObject({ target: 'mermaid', sourceIntent: 'flowchart' });
        expect(artifact.previewPanels?.[2].artifact).toMatchObject({ target: 'mermaid', sourceIntent: 'sequence' });
    });

    test('namespaces only real SVG ids and rewrites whitespace-tolerant references', () => {
        const projection = buildDrawnixMindMapProjection(createKnowledgeMapSpec());
        const previewSvg = renderDrawnixMindMapSvg(projection, [{
            id: 'source-visual-attributes',
            kind: 'mermaid',
            title: 'Mermaid source visual',
            lineStart: 1,
            lineEnd: 3,
            svg: '<svg id="mermaid-root" data-id="keep" aria-labelledby="mermaid-root"><style>#mermaid-root .node { fill: url( #gradient ); }</style><defs><linearGradient id="gradient" /></defs><g class="node" fill="url( #gradient )" /></svg>'
        }]);

        expect(previewSvg).toContain('data-id="keep"');
        expect(previewSvg).toContain('aria-labelledby="notemd-source-visual-attributes-0-mermaid-root"');
        expect(previewSvg).toContain('id="notemd-source-visual-attributes-0-mermaid-root"');
        expect(previewSvg).toContain('id="notemd-source-visual-attributes-1-gradient"');
        expect(previewSvg).toContain('url(#notemd-source-visual-attributes-1-gradient)');
        expect(previewSvg).not.toContain('url( #gradient )');
    });

    test('preserves multiple top-level roots without flattening the forest', async () => {
        const forestSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [
                {
                    id: 'first-root',
                    label: 'First root',
                    children: [{ id: 'first-child', label: 'First child' }]
                },
                {
                    id: 'second-root',
                    label: 'Second root',
                    children: [{ id: 'second-child', label: 'Second child' }]
                }
            ],
            edges: []
        };

        const projection = buildDrawnixMindMapProjection(forestSpec);
        const artifact = await new DrawnixRenderer().render(forestSpec);
        const data = JSON.parse(artifact.content);

        expect(data.elements).toHaveLength(2);
        expect(projection.roots).toHaveLength(2);
        projection.nodes.forEach((node, index) => {
            projection.nodes.slice(index + 1).forEach(other => {
                const overlaps = node.x < other.x + other.width
                    && node.x + node.width > other.x
                    && node.y < other.y + other.height
                    && node.y + node.height > other.y;
                expect(overlaps).toBe(false);
            });
        });
        expect(data.elements[0]).toMatchObject({
            id: 'first-root',
            type: 'mindmap',
            children: [expect.objectContaining({ id: 'first-child', type: 'mind_child' })]
        });
        expect(data.elements[1]).toMatchObject({
            id: 'second-root',
            type: 'mindmap',
            children: [expect.objectContaining({ id: 'second-child', type: 'mind_child' })]
        });
    });

    test('wraps large forests into deterministic rows instead of creating an unbounded canvas width', () => {
        const forestSpec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: Array.from({ length: 24 }, (_, index) => ({
                id: `root-${index + 1}`,
                label: `Subsystem ${index + 1}`
            })),
            edges: []
        };

        const projection = buildDrawnixMindMapProjection(forestSpec);

        expect(projection.roots).toHaveLength(24);
        expect(projection.width).toBeLessThanOrEqual(DRAWNIX_MIND_MAP_FOREST_ROW_MAX_WIDTH);
        expect(projection.height).toBeGreaterThan(projection.nodes[0].height + 180);
        projection.nodes.forEach((node, index) => {
            projection.nodes.slice(index + 1).forEach(other => {
                const overlaps = node.x < other.x + other.width
                    && node.x + node.width > other.x
                    && node.y < other.y + other.height
                    && node.y + node.height > other.y;
                expect(overlaps).toBe(false);
            });
        });
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

    test('wraps mixed Chinese and identifier labels without splitting identifiers or overflowing the node width', () => {
        const spec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [{
                    id: 'token-limit',
                    label: 'LLM 调用管道: 令牌解析 (resolveProviderTokenLimit)'
                }]
            }],
            edges: []
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const node = projection.nodes.find(candidate => candidate.id === 'token-limit');

        expect(node).toBeDefined();
        expect(node?.textLines).toEqual([
            'LLM 调用管道: 令牌解析',
            '(resolveProviderTokenLimit)'
        ]);
        expect(node?.textLines.length).toBeLessThanOrEqual(3);
    });

    test('retains complete long labels and shares explicit line breaks with native Drawnix', async () => {
        const longLabel = 'A very long architecture label with enough words to require more than three lines in the rendered Drawnix node and preserve every word';
        const spec: DiagramSpec = {
            ...createKnowledgeMapSpec(),
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [{ id: 'long-label', label: longLabel }]
            }],
            edges: []
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const node = projection.nodes.find(candidate => candidate.id === 'long-label');
        const artifact = await new DrawnixRenderer().render(spec);
        const exported = JSON.parse(artifact.content) as {
            elements: Array<{ children?: Array<{ data?: { topic?: { children?: Array<{ text?: string }> } } }> }>;
        };
        const nativeText = exported.elements[0]?.children?.[0]?.data?.topic?.children?.[0]?.text;
        const previewSvg = artifact.previewSvg?.content ?? '';
        const svgNodeMarkup = previewSvg.match(/<g data-drawnix-mindmap-node-id="long-label"[\s\S]*?<\/g>/)?.[0] ?? '';
        const svgLines = Array.from(svgNodeMarkup.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g), match => match[1]);

        expect(node?.textLines.length).toBeGreaterThan(3);
        expect(node?.textLines.join(' ')).toBe(longLabel);
        expect(nativeText).toBe(node?.textLines.join('\n'));
        expect(svgLines).toEqual(node?.textLines);
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
