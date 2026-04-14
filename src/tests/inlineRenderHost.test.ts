import { DiagramSpec } from '../diagram/types';
import { InlineRenderHost } from '../rendering/host/inlineRenderHost';
import { DiagramRenderer } from '../rendering/types';

describe('inline render host', () => {
    test('delegates rendering to the renderer directly', async () => {
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };
        const renderer: DiagramRenderer = {
            id: 'test-renderer',
            target: 'mermaid',
            supports: () => true,
            render: jest.fn().mockResolvedValue({
                target: 'mermaid',
                content: '```mermaid\nmindmap\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            })
        };

        const host = new InlineRenderHost();
        const result = await host.render(renderer, spec);

        expect(renderer.render).toHaveBeenCalledWith(spec);
        expect(result.content).toContain('mindmap');
    });
});
