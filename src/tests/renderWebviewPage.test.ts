import { buildRenderWebviewHtml } from '../rendering/webview/page';

describe('render webview page', () => {
    test('builds a self-contained srcdoc page for json-based artifacts', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'vega-lite',
                content: '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","mark":"bar"}',
                mimeType: 'application/json',
                sourceIntent: 'dataChart'
            },
            theme: 'dark',
            resolvedTheme: 'dark',
            sourcePath: 'Notes/Weekly Signups.md'
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('vega-lite preview');
        expect(html).toContain('Notes/Weekly Signups.md');
        expect(html).toContain('&quot;mark&quot;: &quot;bar&quot;');
    });

    test('escapes mermaid source content before embedding it into srcdoc', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'mermaid',
                content: 'flowchart TD\nA[<Unsafe>] --> B[Done]',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            },
            theme: 'system',
            resolvedTheme: 'light'
        });

        expect(html).toContain('&lt;Unsafe&gt;');
        expect(html).not.toContain('<Unsafe>');
    });

    test('does not hardcode dark shell colors for light themed sessions', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'vega-lite',
                content: '{"mark":"bar"}',
                mimeType: 'application/json',
                sourceIntent: 'dataChart'
            },
            theme: 'light',
            resolvedTheme: 'light'
        });

        expect(html).not.toContain('background: rgba(28, 32, 36, 0.72);');
    });

    test('passes through html artifacts for iframe preview instead of escaping them as source text', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'html',
                content: '<!DOCTYPE html><html><body><main>Preview</main></body></html>',
                mimeType: 'text/html',
                sourceIntent: 'flowchart'
            },
            theme: 'dark',
            resolvedTheme: 'dark'
        });

        expect(html).toContain('<main>Preview</main>');
        expect(html).not.toContain('&lt;main&gt;Preview&lt;/main&gt;');
    });
});
