import { DiagramSpec } from '../diagram/types';
import { mergeDrawnixSourceCoverage } from '../diagram/adapters/drawnix/drawnixSourceCoverage';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';

function flattenNodes(nodes: DiagramSpec['nodes']): DiagramSpec['nodes'] {
    return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]);
}

describe('Drawnix source coverage', () => {
    test('builds one filename-rooted taxonomy and remaps merged model edges', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [
                {
                    id: 'model-interface',
                    label: 'Interface',
                    children: [{ id: 'model-commands', label: 'Commands' }]
                },
                { id: 'model-orphan', label: 'Unmatched leaf' }
            ],
            edges: [{ from: 'model-commands', to: 'model-orphan', label: 'uses' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '',
            '## Interface',
            '### Commands',
            '- Preview and export',
            '',
            '```mermaid',
            'flowchart TB',
            '    CMD["Command"]',
            '    CMD --> EXPORT["Export"]',
            '```',
            '',
            '## Rendering pipeline',
            '### Source visuals',
            '- Mermaid companions remain reviewable.'
        ].join('\n');

        const enriched = mergeDrawnixSourceCoverage(
            spec,
            sourceMarkdown,
            'Notes/architecture.zh-CN.md'
        );
        const root = enriched.nodes[0];
        const flatten = flattenNodes(enriched.nodes);
        const labels = flatten.map(node => node.label);
        const ids = new Set(flatten.map(node => node.id));

        expect(enriched.nodes).toHaveLength(1);
        expect(root.label).toBe('architecture.zh-CN');
        expect(root.children?.map(node => node.label)).toEqual(expect.arrayContaining([
            'Interface',
            'Rendering pipeline',
            'Additional concepts'
        ]));
        expect(labels).toEqual(expect.arrayContaining([
            'Commands',
            'Preview and export',
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Unmatched leaf'
        ]));
        expect(root.children?.find(node => node.label === 'Additional concepts')?.children)
            .toEqual([expect.objectContaining({ label: 'Unmatched leaf', id: 'model-orphan' })]);
        expect(enriched.edges).toEqual([
            expect.objectContaining({
                from: expect.not.stringMatching(/^model-/),
                to: 'model-orphan',
                label: 'uses'
            })
        ]);
        enriched.edges?.forEach(edge => {
            expect(ids.has(edge.from)).toBe(true);
            expect(ids.has(edge.to)).toBe(true);
            expect(edge.from).not.toBe(edge.to);
        });

        const visit = (nodes: DiagramSpec['nodes'], depth: number): void => {
            nodes.forEach(node => {
                expect(depth).toBeLessThanOrEqual(3);
                visit(node.children ?? [], depth + 1);
            });
        };
        visit(enriched.nodes, 0);
    });

    test('supplements a sparse model response with the source document tree and Mermaid labels', () => {
        const sparseSpec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [{ id: 'summary', label: 'Summary', children: [{ id: 'overview', label: 'Overview' }] }],
            edges: [{ from: 'summary', to: 'overview', label: 'owns' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '',
            '## User interface',
            '### Command panel',
            '- Opens the diagram preview.',
            '',
            '```mermaid',
            'flowchart TB',
            '    subgraph UI["User interface"]',
            '        CMD["Command panel"]',
            '        SIDEBAR["Notemd sidebar"]',
            '    end',
            '    CMD --> SIDEBAR',
            '```',
            '',
            '## Rendering pipeline',
            '### Source visuals',
            '- Mermaid companions remain reviewable.'
        ].join('\n');

        const enriched = mergeDrawnixSourceCoverage(sparseSpec, sourceMarkdown);
        const nodes = flattenNodes(enriched.nodes);
        const labels = nodes.map(node => node.label);

        expect(enriched.edges).toEqual([]);
        expect(labels).toEqual(expect.arrayContaining([
            'User interface',
            'Command panel',
            'Opens the diagram preview.',
            'Mermaid flowchart 1',
            'User interface',
            'User interface: Command panel',
            'User interface: Notemd sidebar',
            'Rendering pipeline',
            'Source visuals',
            'Mermaid companions remain reviewable.'
        ]));
        expect(labels).toEqual(expect.arrayContaining(['Summary', 'Overview']));
        expect(nodes.length).toBeGreaterThan(sparseSpec.nodes.length + 4);
    });

    test('keeps the source-derived forest deterministic, unique, and within native depth', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [{ id: 'existing', label: 'Existing' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '## First section',
            '### Nested section',
            '#### Detail',
            '- A detail',
            '## Second section',
            '```text',
            '## Not a section',
            '```'
        ].join('\n');

        const first = mergeDrawnixSourceCoverage(spec, sourceMarkdown);
        const second = mergeDrawnixSourceCoverage(spec, sourceMarkdown);
        const nodes = flattenNodes(first.nodes);
        const ids = nodes.map(node => node.id);

        expect(second).toEqual(first);
        expect(new Set(ids).size).toBe(ids.length);
        const walk = (current: DiagramSpec['nodes'], depth: number): void => {
            current.forEach(node => {
                expect(depth).toBeLessThanOrEqual(3);
                walk(node.children ?? [], depth + 1);
            });
        };
        walk(first.nodes, 0);
        expect(nodes.some(node => node.label === 'Not a section')).toBe(false);
    });

    test('builds one document root with section branches and scoped Mermaid coverage', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Model summary',
            nodes: [
                {
                    id: 'model-interface',
                    label: 'Interface',
                    children: [{ id: 'model-command', label: 'Commands' }]
                },
                { id: 'orphan-concept', label: 'Unmatched model concept' }
            ],
            edges: [{ from: 'model-interface', to: 'model-command', label: 'contains' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '## Interface',
            '### Commands',
            '- Preview and export',
            '',
            '```mermaid',
            'flowchart TB',
            '    CMD["Command"]',
            '    CMD --> EXPORT["Export"]',
            '```',
            '',
            '## Rendering',
            '### Pipeline',
            '- Render source visuals'
        ].join('\n');

        const enriched = mergeDrawnixSourceCoverage(spec, sourceMarkdown, 'Knowledge/architecture.zh-CN.md');
        const roots = enriched.nodes;
        const root = roots[0];
        const allNodes = flattenNodes(roots);

        expect(roots).toHaveLength(1);
        expect(root.label).toBe('architecture.zh-CN');
        expect(root.children?.map(node => node.label)).toEqual(expect.arrayContaining([
            'Interface',
            'Rendering',
            'Additional concepts'
        ]));
        const interfaceNode = root.children?.find(node => node.label === 'Interface');
        expect(interfaceNode?.children?.map(node => node.label)).toContain('Commands');
        expect(allNodes.map(node => node.label)).toEqual(expect.arrayContaining([
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Unmatched model concept'
        ]));
        const mermaidNode = allNodes.find(node => node.label === 'Mermaid flowchart 1');
        expect(mermaidNode).toBeDefined();
        expect(interfaceNode?.children).toContain(mermaidNode);
        const additional = root.children?.find(node => node.label === 'Additional concepts');
        expect(additional?.children?.map(node => node.label)).toContain('Unmatched model concept');

        expect(enriched.edges).toEqual([]);
    });

    test('keeps details and Mermaid visuals attached after duplicate H2 sections merge', () => {
        const enriched = mergeDrawnixSourceCoverage({
            intent: 'drawnixMindmap',
            title: 'Document',
            nodes: [],
            edges: []
        }, [
            '# Document',
            '## Shared section',
            '- First detail',
            '## Shared section',
            '- Second detail',
            '',
            '```mermaid',
            'flowchart TB',
            '    A["Second visual"]',
            '```'
        ].join('\n'), 'Notes/document.md');

        const root = enriched.nodes[0];
        const sections = root.children?.filter(node => node.label === 'Shared section') ?? [];
        const labels = flattenNodes(root.children ?? []).map(node => node.label);

        expect(sections).toHaveLength(1);
        expect(labels).toEqual(expect.arrayContaining([
            'First detail',
            'Second detail',
            'Mermaid flowchart 1',
            'Second visual'
        ]));
    });

    test('preserves Mermaid subgraph identity for repeated labels', () => {
        const enriched = mergeDrawnixSourceCoverage({
            intent: 'drawnixMindmap',
            title: 'Document',
            nodes: [],
            edges: []
        }, [
            '# Document',
            '## Runtime',
            '',
            '```mermaid',
            'flowchart TB',
            '    subgraph Client["Client"]',
            '        SHARED["Shared"]',
            '    end',
            '    subgraph Server["Server"]',
            '        SHARED_SERVER["Shared"]',
            '    end',
            '```'
        ].join('\n'), 'Notes/document.md');

        const labels = flattenNodes(enriched.nodes).map(node => node.label);

        expect(labels).toEqual(expect.arrayContaining([
            'Client',
            'Client: Shared',
            'Server',
            'Server: Shared'
        ]));
    });

    test('remaps model edges when duplicate labels merge into source nodes', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [
                { id: 'model-api', label: 'API', children: [{ id: 'model-client', label: 'Client' }] },
                { id: 'model-runtime', label: 'Runtime' }
            ],
            edges: [{ from: 'model-api', to: 'model-runtime', label: 'calls' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '## API',
            '### Gateway',
            '## Runtime'
        ].join('\n');

        const enriched = mergeDrawnixSourceCoverage(spec, sourceMarkdown, 'architecture.md');
        const root = enriched.nodes[0];
        const api = root.children?.find(node => node.label === 'API');
        const runtime = root.children?.find(node => node.label === 'Runtime');

        expect(api?.id).not.toBe('model-api');
        expect(runtime?.id).not.toBe('model-runtime');
        expect(enriched.edges).toEqual([{
            from: api?.id,
            to: runtime?.id,
            label: 'calls'
        }]);
    });

    test('collapses unmatched model branches and drops placeholder leaves from the document root', () => {
        const enriched = mergeDrawnixSourceCoverage({
            intent: 'drawnixMindmap',
            title: 'Document',
            nodes: [
                {
                    id: 'model-branch',
                    label: 'Model branch',
                    children: [
                        { id: 'model-child', label: 'Model child' },
                        { id: 'model-detail', label: 'Model detail' }
                    ]
                },
                { id: 'placeholder', label: 'Untitled 0-0' }
            ],
            edges: []
        }, '# Document\n\n## Source section', 'Notes/document.md');

        const root = enriched.nodes[0];
        const additional = root.children?.find(node => node.label === 'Additional concepts');
        const modelBranch = additional?.children?.find(node => node.label === 'Model branch');

        expect(root.children?.map(node => node.label)).toEqual(['Source section', 'Additional concepts']);
        expect(additional?.children?.map(node => node.label)).toEqual(['Model branch']);
        expect(modelBranch?.children?.map(node => node.label)).toEqual(['Model child', 'Model detail']);
        expect(flattenNodes(enriched.nodes).some(node => node.label === 'Untitled 0-0')).toBe(false);
    });

    test('removes nested placeholder leaves without leaving dangling model edges', () => {
        const enriched = mergeDrawnixSourceCoverage({
            intent: 'drawnixMindmap',
            title: 'Document',
            nodes: [
                {
                    id: 'model-branch',
                    label: 'Model branch',
                    children: [
                        { id: 'model-kept', label: 'Kept concept' },
                        { id: 'model-placeholder', label: 'Untitled 0-1' }
                    ]
                },
                { id: 'model-other', label: 'Other concept' }
            ],
            edges: [
                { from: 'model-kept', to: 'model-other', label: 'keeps' },
                { from: 'model-placeholder', to: 'model-other', label: 'drops' }
            ]
        }, '# Document\n\n## Source section', 'Notes/document.md');

        const labels = flattenNodes(enriched.nodes).map(node => node.label);
        const branch = labels.includes('Model branch')
            ? flattenNodes(enriched.nodes).find(node => node.label === 'Model branch')
            : undefined;

        expect(labels).not.toContain('Untitled 0-1');
        expect(branch?.children?.map(node => node.label)).toEqual(['Kept concept']);
        expect(enriched.edges).toEqual([
            expect.objectContaining({ from: 'model-kept', to: 'model-other', label: 'keeps' })
        ]);
    });

    test('does not alter non-Drawnix specs or empty source notes', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Flow',
            nodes: [{ id: 'a', label: 'A' }]
        };

        expect(mergeDrawnixSourceCoverage(spec, '# ignored')).toBe(spec);
        expect(mergeDrawnixSourceCoverage({ ...spec, intent: 'drawnixMindmap' }, '   ')).toEqual({
            ...spec,
            intent: 'drawnixMindmap'
        });
    });

    test('applies source coverage inside the production Drawnix generation path', async () => {
        const sourceMarkdown = [
            '# Architecture',
            '## Interface',
            '### Commands',
            '- Preview and export',
            '',
            '```mermaid',
            'flowchart TB',
            '    CMD["Command"]',
            '    CMD --> EXPORT["Export"]',
            '```'
        ].join('\n');
        const result = await generateDiagramArtifact(sourceMarkdown, {
            compatibilityMode: 'best-fit',
            requestedRenderTarget: 'drawnix',
            sourcePath: 'Notes/architecture.zh-CN.md',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'drawnixMindmap',
                title: 'Sparse summary',
                nodes: [{ id: 'summary', label: 'Summary' }],
                edges: []
            })
        });

        const labels = flattenNodes(result.spec.nodes).map(node => node.label);
        const exportedLabels = JSON.stringify(JSON.parse(result.artifact.content));

        expect(result.artifact.target).toBe('drawnix');
        expect(result.spec.nodes).toHaveLength(1);
        expect(result.spec.nodes[0].label).toBe('architecture.zh-CN');
        expect(labels).toEqual(expect.arrayContaining([
            'Interface',
            'Commands',
            'Preview and export',
            'Mermaid flowchart 1',
            'Command',
            'Export'
        ]));
        expect(exportedLabels).toContain('source-section-');
        expect(result.artifact.previewSvg?.content).toContain('data-drawnix-mindmap-node-id');
    });
});
