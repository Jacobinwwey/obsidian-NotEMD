import { renderClassMermaid } from '../diagram/adapters/mermaid/classAdapter';
import { DiagramSpec } from '../diagram/types';

describe('class mermaid adapter', () => {
    test('renders classes and labeled relations into a fenced mermaid class block', () => {
        const spec: DiagramSpec = {
            intent: 'classDiagram',
            title: 'Vault model',
            nodes: [
                { id: 'note', label: 'Note' },
                { id: 'tag', label: 'Tag' }
            ],
            edges: [
                { from: 'note', to: 'tag', label: 'references' }
            ]
        };

        const mermaid = renderClassMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('classDiagram');
        expect(mermaid).toContain('class Note');
        expect(mermaid).toContain('class Tag');
        expect(mermaid).toContain('Note --> Tag : references');
    });
});
