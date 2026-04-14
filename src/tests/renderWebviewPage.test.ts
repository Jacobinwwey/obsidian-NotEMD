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
        expect(html).toContain('Vega-Lite preview');
        expect(html).toContain('Notes/Weekly Signups.md');
        expect(html).toContain('&quot;mark&quot;: &quot;bar&quot;');
    });

    test('uses explicit localized preview titles when provided in the payload', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'mermaid',
                content: 'flowchart TD\nA --> B',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            },
            previewTitle: 'Mermaid 预览',
            theme: 'light',
            resolvedTheme: 'light'
        });

        expect(html).toContain('Mermaid 预览');
        expect(html).not.toContain('Mermaid preview');
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

    test('injects resolved theme markers into html artifact previews', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'html',
                content: '<!DOCTYPE html><html><head></head><body><main>Preview</main></body></html>',
                mimeType: 'text/html',
                sourceIntent: 'flowchart'
            },
            theme: 'system',
            resolvedTheme: 'dark'
        });

        expect(html).toContain('<body data-render-theme="dark" data-theme-source="system">');
        expect(html).toContain('id="notemd-html-preview-theme-shim"');
        expect(html).toContain('color-scheme: dark;');
    });

    test('wraps html fragments with theme-aware preview shell when no full document exists', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'html',
                content: '<section>Fragment</section>',
                mimeType: 'text/html',
                sourceIntent: 'flowchart'
            },
            theme: 'light',
            resolvedTheme: 'light'
        });

        expect(html).toContain('<body data-render-theme="light" data-theme-source="light">');
        expect(html).toContain('<section>Fragment</section>');
        expect(html).toContain('id="notemd-html-preview-theme-shim"');
    });
});
