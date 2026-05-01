import { DiagramSpec } from '../diagram/types';
import { IframeRenderHost } from '../rendering/host/iframeRenderHost';

describe('iframe render host', () => {
    test('creates preview sessions with inline srcdoc html instead of external release assets', () => {
        const host = new IframeRenderHost();
        const session = host.createSession({
            target: 'vega-lite',
            content: '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }, {
            theme: 'dark',
            sourcePath: 'Notes/Weekly Signups.md',
            artifactSaved: true
        });

        expect(session.htmlSrcdoc).toContain('<!DOCTYPE html>');
        expect(session.htmlSrcdoc).toContain('Vega-Lite preview');
        expect(session.htmlSrcdoc).toContain('notemd-vega-lite-mount');
        expect(session.htmlSrcdoc).toContain('notemd-render-host-bootstrap');
        expect(session.payload.theme).toBe('dark');
        expect(session.payload.previewTitle).toBe('Vega-Lite preview');
        expect(session.payload.sourcePath).toBe('Notes/Weekly Signups.md');
        expect(session.payload.artifactSaved).toBe(true);
        expect(session.payload.artifact.target).toBe('vega-lite');
    });

    test('delegates artifact rendering before session preparation', async () => {
        const host = new IframeRenderHost();
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };
        const renderer = {
            id: 'stub',
            target: 'mermaid' as const,
            supports: () => true,
            render: jest.fn().mockResolvedValue({
                target: 'mermaid',
                content: 'mindmap\n  root((Platform))',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            })
        };

        const artifact = await host.render(renderer, spec);
        const session = host.createSession(artifact);

        expect(renderer.render).toHaveBeenCalledWith(spec);
        expect(session.htmlSrcdoc).toContain('mindmap');
        expect(session.payload.theme).toBe('system');
        expect(session.payload.previewTitle).toBe('Mermaid preview');
        expect(session.payload.artifact.content).toContain('mindmap');
    });
});
