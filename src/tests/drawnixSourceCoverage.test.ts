import { DiagramSpec } from '../diagram/types';
import { mergeDrawnixSourceCoverage } from '../diagram/adapters/drawnix/drawnixSourceCoverage';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';

function flattenNodes(nodes: DiagramSpec['nodes']): DiagramSpec['nodes'] {
    return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]);
}

describe('Drawnix source coverage', () => {
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

        expect(enriched.edges).toEqual(sparseSpec.edges);
        expect(labels).toEqual(expect.arrayContaining([
            'Summary',
            'User interface',
            'Command panel',
            'Opens the diagram preview.',
            'Mermaid flowchart 1',
            'User interface',
            'Command panel',
            'Notemd sidebar',
            'Rendering pipeline',
            'Source visuals',
            'Mermaid companions remain reviewable.'
        ]));
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
