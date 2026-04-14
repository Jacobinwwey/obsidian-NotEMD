import { renderSequenceMermaid } from '../diagram/adapters/mermaid/sequenceAdapter';
import { DiagramSpec } from '../diagram/types';

describe('sequence mermaid adapter', () => {
    test('renders participants and messages into a fenced mermaid sequence block', () => {
        const spec: DiagramSpec = {
            intent: 'sequence',
            title: 'API flow',
            nodes: [
                { id: 'client', label: 'Client App' },
                { id: 'api', label: 'API Service' }
            ],
            edges: [
                { from: 'client', to: 'api', label: 'POST /summaries' },
                { from: 'api', to: 'client', label: '201 Created' }
            ]
        };

        const mermaid = renderSequenceMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('sequenceDiagram');
        expect(mermaid).toContain('participant client as Client App');
        expect(mermaid).toContain('participant api as API Service');
        expect(mermaid).toContain('client->>api: POST /summaries');
        expect(mermaid).toContain('api->>client: 201 Created');
    });
});
