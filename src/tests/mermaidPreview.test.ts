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
        }, { initialize, render }, 'dark');

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({
            startOnLoad: false,
            theme: 'dark'
        }));
        expect(render).toHaveBeenCalledWith(expect.any(String), 'flowchart TD\nA --> B');
        expect(svg).toContain('<svg>');
    });

    test('uses default mermaid theme for light previews', async () => {
        const initialize = jest.fn();
        const render = jest.fn().mockResolvedValue({ svg: '<svg><g /></svg>' });

        await renderMermaidArtifactSvg({
            target: 'mermaid',
            content: 'mindmap\n  root((Core))',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        }, { initialize, render }, 'light');

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({
            theme: 'default'
        }));
    });

    test('repairs truncated erDiagram many-relations before rendering preview', async () => {
        const initialize = jest.fn();
        const render = jest.fn().mockResolvedValue({ svg: '<svg><g /></svg>' });

        await renderMermaidArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nerDiagram\n    CATEGORY\n        string id\n    DOCUMENT\n        string id\n    CATEGORY ||--o DOCUMENT : contains\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'erDiagram'
        }, { initialize, render }, 'light');

        expect(render).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('CATEGORY ||--o{ DOCUMENT : contains')
        );
    });

    test('repairs left-side truncated erDiagram many-relations before rendering preview', async () => {
        const initialize = jest.fn();
        const render = jest.fn().mockResolvedValue({ svg: '<svg><g /></svg>' });

        await renderMermaidArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nerDiagram\n    ORDER\n        string id\n    CUSTOMER\n        string id\n    ORDER o--|| CUSTOMER : belongs_to\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'erDiagram'
        }, { initialize, render }, 'light');

        expect(render).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('ORDER }o--|| CUSTOMER : belongs_to')
        );
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
