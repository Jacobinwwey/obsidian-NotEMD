import {
    supportsDiagramPreviewModal,
    supportsInlineCanvasPreview,
    supportsInlineMermaidPreview,
    supportsInlineVegaLitePreview,
    unwrapMermaidFence
} from '../ui/diagramPreview';

describe('diagram preview helpers', () => {
    test('unwraps mermaid fenced blocks for inline mermaid rendering', () => {
        expect(unwrapMermaidFence('```mermaid\nflowchart TD\nA --> B\n```')).toBe('flowchart TD\nA --> B');
    });

    test('leaves non-fenced source unchanged', () => {
        expect(unwrapMermaidFence('flowchart TD\nA --> B')).toBe('flowchart TD\nA --> B');
    });

    test('only uses inline rendering for mermaid artifacts', () => {
        expect(supportsInlineMermaidPreview({
            target: 'mermaid',
            content: '```mermaid\nmindmap\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        })).toBe(true);

        expect(supportsInlineMermaidPreview({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).toBe(false);
    });

    test('uses inline preview path for json-canvas artifacts', () => {
        expect(supportsInlineCanvasPreview({
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).toBe(true);

        expect(supportsInlineCanvasPreview({
            target: 'html',
            content: '<div>Preview</div>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        })).toBe(false);
    });

    test('uses inline preview path for vega-lite json artifacts', () => {
        expect(supportsInlineVegaLitePreview({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).toBe(true);

        expect(supportsInlineVegaLitePreview({
            target: 'json-canvas',
            content: '{"nodes":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).toBe(false);
    });

    test('only marks shipped preview targets as preview-capable', () => {
        expect(supportsDiagramPreviewModal({
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).toBe(true);

        expect(supportsDiagramPreviewModal({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).toBe(true);

        expect(supportsDiagramPreviewModal({
            target: 'html',
            content: '<div>Preview</div>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        })).toBe(false);
    });
});
