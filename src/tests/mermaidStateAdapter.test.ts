import { renderStateMermaid } from '../diagram/adapters/mermaid/stateAdapter';
import { DiagramSpec } from '../diagram/types';

describe('state mermaid adapter', () => {
    test('renders states and transitions into a fenced mermaid state block', () => {
        const spec: DiagramSpec = {
            intent: 'stateDiagram',
            title: 'Review flow',
            nodes: [
                { id: 'draft', label: 'Draft' },
                { id: 'review', label: 'In Review' },
                { id: 'published', label: 'Published' }
            ],
            edges: [
                { from: 'draft', to: 'review', label: 'submit' },
                { from: 'review', to: 'published', label: 'approve' }
            ]
        };

        const mermaid = renderStateMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('stateDiagram-v2');
        expect(mermaid).toContain('[*] --> draft');
        expect(mermaid).toContain('state "In Review" as review');
        expect(mermaid).toContain('draft --> review : submit');
        expect(mermaid).toContain('review --> published : approve');
    });
});
