import { renderMermaidArtifactSvg } from '../rendering/preview/mermaidPreview';

describe('mermaid preview renderer', () => {
    test('renders mermaid artifacts into svg markup using injected deps', async () => {
        const initialize = jest.fn();
        const render = jest.fn().mockResolvedValue({ svg: '<svg><g /></svg>' });

        const svg = await renderMermaidArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nflowchart TD\nA --> B\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        }, { initialize, render });

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ startOnLoad: false }));
        expect(render).toHaveBeenCalledWith(expect.any(String), 'flowchart TD\nA --> B');
        expect(svg).toContain('<svg>');
    });

    test('rejects non-mermaid artifacts', async () => {
        await expect(renderMermaidArtifactSvg({
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, { initialize: jest.fn(), render: jest.fn() })).rejects.toThrow(/mermaid/i);
    });
});
