import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import {
    buildDocumentRootedKnowledgeMap,
    buildSourceCoverageForest,
    mergeDrawnixSourceCoverage
} from '../diagram/adapters/drawnix/drawnixSourceCoverage';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';

function flattenNodes(nodes: DiagramSpec['nodes']): DiagramSpec['nodes'] {
    return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]);
}

describe('Drawnix source coverage', () => {
    test('keeps source sections and unmatched model branches as independent roots', () => {
        const enriched = buildSourceCoverageForest({
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [{ id: 'model-root', label: 'Unmatched model branch' }],
            edges: []
        }, [
            '# Architecture',
            '## Interface',
            '### Commands',
            '## Runtime'
        ].join('\n'), 'Notes/architecture.md');

        expect(enriched.nodes.map(node => node.label)).toEqual([
            'Interface',
            'Runtime',
            'Unmatched model branch'
        ]);

        const documentRooted = buildDocumentRootedKnowledgeMap(enriched, 'Architecture overview');
        expect(documentRooted.nodes).toEqual([
            expect.objectContaining({
                label: 'Architecture overview',
                children: expect.arrayContaining([
                    expect.objectContaining({ label: 'Interface' }),
                    expect.objectContaining({ label: 'Runtime' }),
                    expect.objectContaining({ label: 'Unmatched model branch' })
                ])
            })
        ]);
    });

    test('builds a source-rooted forest and remaps merged model edges', () => {
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
        const interfaceRoot = enriched.nodes.find(node => node.label === 'Interface');
        const renderingRoot = enriched.nodes.find(node => node.label === 'Rendering pipeline');
        const unmatchedRoot = enriched.nodes.find(node => node.label === 'Unmatched leaf');
        const flatten = flattenNodes(enriched.nodes);
        const labels = flatten.map(node => node.label);
        const ids = new Set(flatten.map(node => node.id));

        expect(enriched.nodes.map(node => node.label)).toEqual([
            'Interface',
            'Rendering pipeline',
            'Unmatched leaf'
        ]);
        expect(interfaceRoot?.children?.map(node => node.label)).toEqual(expect.arrayContaining([
            'Commands',
            'Mermaid flowchart 1'
        ]));
        expect(renderingRoot).toBeDefined();
        expect(labels).toEqual(expect.arrayContaining([
            'Commands',
            'Preview and export',
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Unmatched leaf'
        ]));
        expect(unmatchedRoot).toEqual(expect.objectContaining({ id: 'model-orphan' }));
        expect(enriched.edges).toEqual([
            expect.objectContaining({
                from: expect.not.stringMatching(/^model-/),
                to: 'model-orphan',
                label: 'uses'
            })
        ]);
        expect(enriched.sourceCoverageDiagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'node-merged', sourceIds: ['model-interface'] }),
            expect.objectContaining({ kind: 'edge-remapped', sourceIds: ['model-commands', 'model-orphan'] })
        ]));
        enriched.edges?.forEach(edge => {
            expect(ids.has(edge.from)).toBe(true);
            expect(ids.has(edge.to)).toBe(true);
            expect(edge.from).not.toBe(edge.to);
        });

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

    test('keeps deep source and model branches without remapping their edge endpoints', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Architecture',
            nodes: [
                {
                    id: 'model-root',
                    label: 'Model branch',
                    children: [{
                        id: 'model-level-1',
                        label: 'Model level 1',
                        children: [{
                            id: 'model-level-2',
                            label: 'Model level 2',
                            children: [{ id: 'model-leaf', label: 'Model leaf' }]
                        }]
                    }]
                },
                { id: 'model-target', label: 'External target' }
            ],
            edges: [{ from: 'model-leaf', to: 'model-target', label: 'depends on' }]
        };
        const sourceMarkdown = [
            '# Architecture',
            '## First section',
            '### Nested section',
            '#### Detail level',
            '##### Fifth level',
            '###### Sixth level',
            '- Source leaf',
            '## Second section',
            '```text',
            '## Not a section',
            '```'
        ].join('\n');

        const first = mergeDrawnixSourceCoverage(spec, sourceMarkdown);
        const second = mergeDrawnixSourceCoverage(spec, sourceMarkdown);
        const nodes = flattenNodes(first.nodes);
        const ids = nodes.map(node => node.id);
        const projection = buildDrawnixMindMapProjection(first);
        const firstSection = first.nodes.find(node => node.label === 'First section');
        const nestedSection = firstSection?.children?.find(node => node.label === 'Nested section');
        const detailLevel = nestedSection?.children?.find(node => node.label === 'Detail level');
        const fifthLevel = detailLevel?.children?.find(node => node.label === 'Fifth level');
        const sixthLevel = fifthLevel?.children?.find(node => node.label === 'Sixth level');

        expect(second).toEqual(first);
        expect(new Set(ids).size).toBe(ids.length);
        expect(sixthLevel?.children?.[0]).toMatchObject({
            label: 'Source details',
            children: [expect.objectContaining({ label: 'Source leaf' })]
        });
        expect(nodes.map(node => node.id)).toEqual(expect.arrayContaining([
            'model-root',
            'model-level-1',
            'model-level-2',
            'model-leaf',
            'model-target'
        ]));
        expect(first.edges).toEqual([{
            from: 'model-leaf',
            to: 'model-target',
            label: 'depends on'
        }]);
        expect((first.sourceCoverageDiagnostics ?? [])
            .some(diagnostic => diagnostic.kind === 'node-compressed')).toBe(false);
        expect(projection.nodes.map(node => node.id)).toEqual(expect.arrayContaining([
            'model-level-2',
            'model-leaf'
        ]));
        expect(projection.crossRelations).toEqual([
            expect.objectContaining({ sourceId: 'model-leaf', targetId: 'model-target' })
        ]);
        expect(nodes.some(node => node.label === 'Not a section')).toBe(false);
    });

    test('preserves section roots and scoped Mermaid coverage without synthesizing a document root', () => {
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
        const interfaceRoot = roots.find(node => node.label === 'Interface');
        const renderingRoot = roots.find(node => node.label === 'Rendering');
        const unmatchedRoot = roots.find(node => node.label === 'Unmatched model concept');
        const allNodes = flattenNodes(roots);

        expect(roots.map(node => node.label)).toEqual([
            'Interface',
            'Rendering',
            'Unmatched model concept'
        ]);
        expect(interfaceRoot?.children?.map(node => node.label)).toContain('Commands');
        expect(allNodes.map(node => node.label)).toEqual(expect.arrayContaining([
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Unmatched model concept'
        ]));
        const mermaidNode = allNodes.find(node => node.label === 'Mermaid flowchart 1');
        expect(mermaidNode).toBeDefined();
        expect(interfaceRoot?.children).toContain(mermaidNode);
        expect(renderingRoot).toBeDefined();
        expect(unmatchedRoot).toEqual(expect.objectContaining({ id: 'orphan-concept' }));

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

        const root = enriched.nodes.find(node => node.label === 'Shared section');
        const labels = flattenNodes(root?.children ?? []).map(node => node.label);

        expect(enriched.nodes.filter(node => node.label === 'Shared section')).toHaveLength(1);
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
        const api = enriched.nodes.find(node => node.label === 'API');
        const runtime = enriched.nodes.find(node => node.label === 'Runtime');

        expect(api?.id).not.toBe('model-api');
        expect(runtime?.id).not.toBe('model-runtime');
        expect(enriched.edges).toEqual([{
            from: api?.id,
            to: runtime?.id,
            label: 'calls'
        }]);
    });

    test('keeps unmatched model branches as roots while dropping placeholder leaves', () => {
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

        const sourceRoot = enriched.nodes.find(node => node.label === 'Source section');
        const modelBranch = enriched.nodes.find(node => node.label === 'Model branch');

        expect(enriched.nodes.map(node => node.label)).toEqual(['Source section', 'Model branch']);
        expect(sourceRoot).toBeDefined();
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
        expect(result.spec.nodes.map(node => node.label)).toEqual(['Interface', 'Summary']);
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

    test('surfaces deterministic diagnostics when coverage drops duplicate or owned edges', () => {
        const enriched = mergeDrawnixSourceCoverage({
            intent: 'drawnixMindmap',
            title: 'Document',
            nodes: [{
                id: 'section',
                label: 'Section',
                children: [{ id: 'child', label: 'Child' }]
            }],
            edges: [
                { from: 'section', to: 'child', label: 'owns' },
                { from: 'missing', to: 'child', label: 'invalid' },
                { from: 'section', to: 'child', label: 'owns' }
            ]
        }, '# Document\n## Section\n### Child', 'Notes/document.md');

        expect(enriched.edges).toEqual([]);
        expect(enriched.sourceCoverageDiagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('hierarchy ownership') }),
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('not present') }),
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('duplicate') })
        ]));
    });
});
