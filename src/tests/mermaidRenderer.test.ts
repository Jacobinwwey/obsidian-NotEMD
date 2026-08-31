import mermaid from 'mermaid';
import { DiagramSpec } from '../diagram/types';
import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';

jest.mock('mermaid');

describe('mermaid renderer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('validates emitted mermaid before returning the artifact', async () => {
        const renderer = new MermaidRenderer();
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'validate', label: 'Validate' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [{ from: 'validate', to: 'publish' }]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.content).toContain('```mermaid');
        expect(mermaid.parse).toHaveBeenCalledWith(expect.stringContaining('flowchart TD'));
    });

    test('surfaces explicit mermaid validation failures', async () => {
        const renderer = new MermaidRenderer();
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Broken Flow',
            nodes: [{ id: 'broken', label: 'Broken' }]
        };
        (mermaid.parse as jest.Mock).mockRejectedValueOnce(new Error('Parse error'));

        await expect(renderer.render(spec)).rejects.toThrow(/Generated Mermaid diagram failed validation/i);
    });

    test('renders timeline events through the Mermaid timeline contract', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'timeline',
            title: 'Roadmap',
            nodes: [],
            timelineEvents: [
                { id: 'research', date: '2026 Q1', label: 'Research', details: ['Define scope'] },
                { id: 'release', date: '2026 Q2', label: 'Release' }
            ]
        });

        expect(artifact.content).toContain('timeline');
        expect(artifact.content).toContain('2026 Q1 : Research');
        expect(mermaid.parse).toHaveBeenCalledWith(expect.stringContaining('timeline'));
    });

    test('renders swimlane steps as bounded Mermaid subgraphs', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'swimlane',
            title: 'Release handoff',
            nodes: [],
            swimlaneLanes: [{
                id: 'authoring',
                label: 'Authoring',
                steps: [{ id: 'draft', label: 'Draft' }, { id: 'review', label: 'Review' }]
            }]
        });

        expect(artifact.content).toContain('flowchart LR');
        expect(artifact.content).toContain('subgraph authoring');
        expect(artifact.content).toContain('draft -->|Authoring| review');
    });

    test('renders quadrant items with stable coordinates', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'quadrant',
            title: 'Priorities',
            nodes: [],
            quadrant: {
                xAxisLabel: ['Low effort', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest', 'Quick wins', 'Defer', 'Evaluate'],
                items: [{ id: 'adapter', label: 'Adapter registry', x: 0.8, y: 0.7 }]
            }
        });

        expect(artifact.content).toContain('quadrantChart');
        expect(artifact.content).toContain('"Adapter registry": [0.8, 0.7]');
    });

    test('removes an unmatched structural bracket from quadrant item labels', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'quadrant',
            title: 'Priorities',
            nodes: [],
            quadrant: {
                xAxisLabel: ['Low effort', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest', 'Quick wins', 'Defer', 'Evaluate'],
                items: [{ id: 'docs', label: 'Docs gallery[', x: 0.32, y: 0.68 }]
            }
        });

        expect(artifact.content).toContain('"Docs gallery": [0.32, 0.68]');
        expect(artifact.content).not.toContain('Docs gallery[');
    });

    test('preserves intentional brackets in quadrant metadata labels', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'quadrant',
            title: 'Priority [matrix]',
            nodes: [],
            quadrant: {
                xAxisLabel: ['Low effort [', 'High effort'],
                yAxisLabel: ['Low impact', 'High impact'],
                quadrantLabels: ['Invest [', 'Quick wins', 'Defer', 'Evaluate'],
                items: [{ id: 'adapter', label: 'Adapter registry', x: 0.8, y: 0.7 }]
            }
        });

        expect(artifact.content).toContain('title Priority [matrix]');
        expect(artifact.content).toContain('x-axis Low effort [ --> High effort');
        expect(artifact.content).toContain('quadrant-1 Invest [');
    });

    test('renders org chart ownership as a deterministic flowchart', async () => {
        const artifact = await new MermaidRenderer().render({
            intent: 'orgChart',
            title: 'Support ownership',
            nodes: [],
            orgChartSpec: {
                nodes: [
                    { id: 'director', label: 'Support Director', role: 'Front door' },
                    { id: 'platform', label: 'Platform Team', reportsTo: 'director', scope: ['runtime', 'reliability'] },
                    { id: 'incident', label: 'Incident Response', reportsTo: 'director', status: 'planned' }
                ]
            }
        });

        expect(artifact.content).toContain('flowchart TD');
        expect(artifact.content).toContain('director["Support Director<br/>Front door"]');
        expect(artifact.content).toContain('director --> platform');
        expect(artifact.content).toContain('style incident stroke-dasharray: 5 5');
        expect(mermaid.parse).toHaveBeenCalledWith(expect.stringContaining('flowchart TD'));
    });
});
