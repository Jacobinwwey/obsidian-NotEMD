import { DiagramSpec } from '../diagram/types';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';

describe('html renderer', () => {
    test('renders a standalone html summary document for structured diagrams', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            summary: 'Validate, review, and publish the release.',
            nodes: [
                { id: 'validate', label: 'Validate' },
                { id: 'review', label: 'Review' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [
                { from: 'validate', to: 'review', label: 'checks pass' },
                { from: 'review', to: 'publish', label: 'approved' }
            ],
            callouts: [
                { label: 'Gate', detail: 'Manual approval required before publishing.' }
            ]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.target).toBe('html');
        expect(artifact.mimeType).toBe('text/html');
        expect(artifact.content).toContain('<!DOCTYPE html>');
        expect(artifact.content).toContain('Release Flow');
        expect(artifact.content).toContain('Validate');
        expect(artifact.content).toContain('Manual approval required before publishing.');
        expect(artifact.content).toContain('Content-Security-Policy');
    });

    test('renders chart specs as html data tables', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    id: 'signups',
                    label: 'Signups',
                    points: [
                        { x: 'Week 1', y: 12 },
                        { x: 'Week 2', y: 19 }
                    ]
                }
            ]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.content).toContain('<table');
        expect(artifact.content).toContain('Week 1');
        expect(artifact.content).toContain('19');
    });
});
