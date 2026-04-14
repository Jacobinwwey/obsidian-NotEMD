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

    test('renders sequence and er specs through the mermaid renderer', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry);

        const sequence = await service.render({
            intent: 'sequence',
            title: 'API flow',
            nodes: [
                { id: 'client', label: 'Client' },
                { id: 'api', label: 'API' }
            ],
            edges: [{ from: 'client', to: 'api', label: 'POST /summaries' }]
        });

        const er = await service.render({
            intent: 'erDiagram',
            title: 'Vault graph',
            nodes: [
                { id: 'note', label: 'NOTE' },
                { id: 'tag', label: 'TAG' }
            ],
            edges: [{ from: 'note', to: 'tag', relation: 'one-to-many', label: 'references' }]
        });

        expect(sequence.content).toContain('sequenceDiagram');
        expect(er.content).toContain('erDiagram');
    });

    test('renders class and state specs through the mermaid renderer', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const service = new RendererService(registry);

        const classDiagram = await service.render({
            intent: 'classDiagram',
            title: 'Vault model',
            nodes: [
                { id: 'note', label: 'Note' },
                { id: 'tag', label: 'Tag' }
            ],
            edges: [{ from: 'note', to: 'tag', label: 'references' }]
        });

        const stateDiagram = await service.render({
            intent: 'stateDiagram',
            title: 'Review flow',
            nodes: [
                { id: 'draft', label: 'Draft' },
                { id: 'review', label: 'Review' }
            ],
            edges: [{ from: 'draft', to: 'review', label: 'submit' }]
        });

        expect(classDiagram.content).toContain('classDiagram');
        expect(stateDiagram.content).toContain('stateDiagram-v2');
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

    test('reuses cached artifacts for repeated renders with the same target and theme', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const host: RenderHost = {
            render: jest.fn().mockResolvedValue({
                target: 'mermaid',
                content: 'cached',
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

        const first = await service.render(spec, { target: 'mermaid', theme: 'dark' } as any);
        const second = await service.render(spec, { target: 'mermaid', theme: 'dark' } as any);

        expect(first).toBe(second);
        expect(host.render).toHaveBeenCalledTimes(1);
    });

    test('does not reuse cached artifacts when preview theme changes', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const host: RenderHost = {
            render: jest.fn()
                .mockResolvedValueOnce({
                    target: 'mermaid',
                    content: 'dark',
                    mimeType: 'text/plain',
                    sourceIntent: 'mindmap'
                })
                .mockResolvedValueOnce({
                    target: 'mermaid',
                    content: 'light',
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

        const darkResult = await service.render(spec, { target: 'mermaid', theme: 'dark' } as any);
        const lightResult = await service.render(spec, { target: 'mermaid', theme: 'light' } as any);

        expect(darkResult.content).toBe('dark');
        expect(lightResult.content).toBe('light');
        expect(host.render).toHaveBeenCalledTimes(2);
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

    test('reuses cached artifact when preparing repeated preview sessions', async () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const host = {
            render: jest.fn().mockResolvedValue({
                target: 'mermaid',
                content: 'mindmap\n  root((Platform))',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            }),
            createSession: jest.fn((artifact, options) => ({
                htmlSrcdoc: '<!DOCTYPE html><html></html>',
                payload: {
                    artifact,
                    theme: options?.theme ?? 'system',
                    resolvedTheme: options?.theme === 'dark' ? 'dark' : 'light'
                }
            }))
        };
        const service = new RendererService(registry, host as any);
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        await service.preparePreviewSession(spec, { theme: 'dark' } as any);
        await service.preparePreviewSession(spec, { theme: 'dark' } as any);

        expect(host.render).toHaveBeenCalledTimes(1);
        expect(host.createSession).toHaveBeenCalledTimes(2);
    });
});
