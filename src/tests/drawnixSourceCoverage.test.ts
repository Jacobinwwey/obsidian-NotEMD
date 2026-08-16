import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { mergeDrawnixSourceCoverage } from '../diagram/adapters/drawnix/drawnixSourceCoverage';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';

function flattenNodes(nodes: DiagramSpec['nodes']): DiagramSpec['nodes'] {
    return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]);
}

function findNode(nodes: DiagramSpec['nodes'], label: string): DiagramSpec['nodes'][number] | undefined {
    return flattenNodes(nodes).find(node => node.label === label);
}

describe('Drawnix source coverage', () => {
    test('builds one filename-rooted tree and places unmatched model branches under Additional concepts', () => {
        const enriched = mergeDrawnixSourceCoverage({
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

        expect(enriched.nodes).toHaveLength(1);
        const documentRoot = enriched.nodes[0];
        const additionalConcepts = findNode(enriched.nodes, 'Additional concepts');

        expect(documentRoot.label).toBe('architecture');
        expect(documentRoot.children?.map(node => node.label)).toEqual(expect.arrayContaining([
            'Interface',
            'Runtime',
            'Additional concepts'
        ]));
        expect(additionalConcepts?.children).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'model-root', label: 'Unmatched model branch' })
        ]));
    });

    test('merges source-matched nodes, retains source details, and remaps material cross-branch edges', () => {
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
        const enriched = mergeDrawnixSourceCoverage(spec, [
            '# Architecture',
            '## Interface',
            '### Commands',
            '- Preview and export',
            '```mermaid',
            'flowchart TB',
            '    CMD["Command"]',
            '    CMD --> EXPORT["Export"]',
            '```',
            '## Rendering pipeline',
            '### Source visuals',
            '- Mermaid companions remain reviewable.'
        ].join('\n'), 'Notes/architecture.zh-CN.md');

        const documentRoot = enriched.nodes[0];
        const interfaceNode = findNode(enriched.nodes, 'Interface');
        const commandsNode = findNode(enriched.nodes, 'Commands');
        const orphanNode = findNode(enriched.nodes, 'Unmatched leaf');
        const labels = flattenNodes(enriched.nodes).map(node => node.label);

        expect(documentRoot.label).toBe('architecture.zh-CN');
        expect(labels).toEqual(expect.arrayContaining([
            'Preview and export',
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Rendering pipeline',
            'Unmatched leaf'
        ]));
        expect(interfaceNode?.children).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: commandsNode?.id, label: 'Commands' })
        ]));
        expect(orphanNode?.id).toBe('model-orphan');
        expect(enriched.edges).toEqual([{
            from: commandsNode?.id,
            to: 'model-orphan',
            label: 'uses'
        }]);
        expect(enriched.sourceCoverageDiagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'node-merged', sourceIds: ['model-interface'] }),
            expect.objectContaining({ kind: 'edge-remapped', sourceIds: ['model-commands', 'model-orphan'] })
        ]));
    });

    test('keeps deep source and model branches with a routable relationship', () => {
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

        const first = mergeDrawnixSourceCoverage(spec, sourceMarkdown, 'Notes/architecture.md');
        const second = mergeDrawnixSourceCoverage(spec, sourceMarkdown, 'Notes/architecture.md');
        const nodes = flattenNodes(first.nodes);
        const projection = buildDrawnixMindMapProjection(first);

        expect(second).toEqual(first);
        expect(first.nodes).toHaveLength(1);
        expect(findNode(first.nodes, 'Sixth level')?.children?.[0]).toMatchObject({
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
        expect(projection.crossRelations).toEqual([
            expect.objectContaining({ sourceId: 'model-leaf', targetId: 'model-target' })
        ]);
        expect(nodes.some(node => node.label === 'Not a section')).toBe(false);
    });

    test('preserves scoped Mermaid labels and rejects only invalid or hierarchy-owned edges', () => {
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
        }, [
            '# Document',
            '## Section',
            '### Child',
            '## Runtime',
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
        expect(enriched.edges).toEqual([]);
        expect(enriched.sourceCoverageDiagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('hierarchy ownership') }),
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('not present') }),
            expect.objectContaining({ kind: 'edge-dropped', message: expect.stringContaining('duplicate') })
        ]));
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

    test('applies filename-rooted source coverage in the production Drawnix generation path', async () => {
        const sourceMarkdown = [
            '# Architecture',
            '## Interface',
            '### Commands',
            '- Preview and export',
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
        expect(result.spec.nodes).toEqual([expect.objectContaining({ label: 'architecture.zh-CN' })]);
        expect(labels).toEqual(expect.arrayContaining([
            'Interface',
            'Commands',
            'Preview and export',
            'Mermaid flowchart 1',
            'Command',
            'Export',
            'Summary'
        ]));
        expect(exportedLabels).toContain('source-section-');
        expect(result.artifact.previewSvg?.content).toContain('data-drawnix-mindmap-node-id');
    });
});
