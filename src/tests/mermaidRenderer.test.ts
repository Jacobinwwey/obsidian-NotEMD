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
});
