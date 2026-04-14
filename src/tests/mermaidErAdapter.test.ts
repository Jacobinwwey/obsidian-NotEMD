import { renderErMermaid } from '../diagram/adapters/mermaid/erAdapter';
import { DiagramSpec } from '../diagram/types';

describe('er mermaid adapter', () => {
    test('renders entities and relations into a fenced mermaid er block', () => {
        const spec: DiagramSpec = {
            intent: 'erDiagram',
            title: 'Vault graph',
            nodes: [
                { id: 'note', label: 'NOTE' },
                { id: 'tag', label: 'TAG' }
            ],
            edges: [
                { from: 'note', to: 'tag', relation: 'one-to-many', label: 'references' }
            ]
        };

        const mermaid = renderErMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('erDiagram');
        expect(mermaid).toContain('NOTE {');
        expect(mermaid).toContain('TAG {');
        expect(mermaid).toContain('NOTE ||--o{ TAG : references');
    });
});
