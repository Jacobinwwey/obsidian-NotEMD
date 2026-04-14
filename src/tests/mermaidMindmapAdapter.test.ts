import { renderMindmapMermaid } from '../diagram/adapters/mermaid/mindmapAdapter';
import { DiagramSpec } from '../diagram/types';

describe('mindmap mermaid adapter', () => {
    test('renders nested nodes into a fenced mermaid mindmap block', () => {
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Distributed Systems',
            nodes: [
                {
                    id: 'consistency',
                    label: 'Consistency',
                    children: [
                        { id: 'strong', label: 'Strong consistency' }
                    ]
                },
                {
                    id: 'availability',
                    label: 'Availability'
                }
            ]
        };

        const mermaid = renderMindmapMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('mindmap');
        expect(mermaid).toContain('root(("Distributed Systems"))');
        expect(mermaid).toContain('Consistency');
        expect(mermaid).toContain('Strong consistency');
    });
});
