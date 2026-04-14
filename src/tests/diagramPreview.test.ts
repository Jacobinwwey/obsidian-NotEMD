import { supportsInlineMermaidPreview, unwrapMermaidFence } from '../ui/diagramPreview';

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
});
