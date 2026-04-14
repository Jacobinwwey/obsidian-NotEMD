import { renderFlowchartMermaid } from '../diagram/adapters/mermaid/flowchartAdapter';
import { DiagramSpec } from '../diagram/types';

describe('flowchart mermaid adapter', () => {
    test('renders nodes and labeled edges into a fenced mermaid flowchart block', () => {
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'validate', label: 'Validate version' },
                { id: 'publish', label: 'Publish release' }
            ],
            edges: [
                { from: 'validate', to: 'publish', label: 'pass' }
            ]
        };

        const mermaid = renderFlowchartMermaid(spec);

        expect(mermaid).toContain('```mermaid');
        expect(mermaid).toContain('flowchart TD');
        expect(mermaid).toContain('validate["Validate version"]');
        expect(mermaid).toContain('publish["Publish release"]');
        expect(mermaid).toContain('validate -->|pass| publish');
    });
});
