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
            theme: 'system'
        });

        expect(html).toContain('&lt;Unsafe&gt;');
        expect(html).not.toContain('<Unsafe>');
    });
});
