import { DiagramSpec } from '../diagram/types';
import { IframeRenderHost } from '../rendering/host/iframeRenderHost';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RenderHost } from '../rendering/host/renderHost';
import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { RendererService } from '../rendering/rendererService';

describe('renderer service', () => {
    test('renders a diagram through the resolved renderer', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry);
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            nodes: [
                { id: 'validate', label: 'Validate' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [{ from: 'validate', to: 'publish' }]
        };

        const result = await service.render(spec);

        expect(result.target).toBe('mermaid');
        expect(result.content).toContain('flowchart TD');
    });

    test('delegates rendering through the configured host', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const host: RenderHost = {
            render: jest.fn().mockResolvedValue({
                target: 'mermaid',
                content: 'stubbed',
                mimeType: 'text/plain',
                sourceIntent: 'mindmap'
            })
        };
        const service = new RendererService(registry, host);
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        const result = await service.render(spec);

        expect(host.render).toHaveBeenCalledTimes(1);
        expect(result.content).toBe('stubbed');
    });

    test('throws when the requested target is not supported', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry);
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        await expect(service.render(spec, { target: 'vega-lite' })).rejects.toThrow(/No renderer registered/i);
    });

    test('returns null preview session when the host does not support preview sessions', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry);
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        await expect(service.preparePreviewSession(spec)).resolves.toBeNull();
    });

    test('prepares a preview session through iframe-capable hosts', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry, new IframeRenderHost());
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        const session = await service.preparePreviewSession(spec);

        expect(session).not.toBeNull();
        expect(session?.htmlSrcdoc).toContain('<!DOCTYPE html>');
        expect(session?.payload.artifact.target).toBe('mermaid');
    });
});
