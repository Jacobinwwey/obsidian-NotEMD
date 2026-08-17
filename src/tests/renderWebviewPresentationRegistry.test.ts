import { getWebviewPresentation } from '../rendering/webview/presentationRegistry';

describe('render webview presentation registry', () => {
    test('resolves specialized target contracts without target switches', () => {
        expect(getWebviewPresentation('mermaid')).toMatchObject({
            mode: 'host-shell',
            requiresBridge: true
        });
        expect(getWebviewPresentation('vega-lite')).toMatchObject({
            mode: 'host-shell',
            requiresBridge: true
        });
        expect(getWebviewPresentation('html')).toMatchObject({
            mode: 'html-document',
            requiresBridge: false
        });
        expect(getWebviewPresentation('drawio')).toMatchObject({
            mode: 'source-only',
            requiresBridge: false
        });
    });

    test('matches mime contracts and fails closed for unknown targets', () => {
        const mermaid = getWebviewPresentation('mermaid');
        expect(mermaid.matches({
            artifact: {
                target: 'mermaid',
                content: 'flowchart TD\nA --> B',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            },
            theme: 'light',
            resolvedTheme: 'light'
        })).toBe(true);
        expect(mermaid.matches({
            artifact: {
                target: 'mermaid',
                content: 'flowchart TD\nA --> B',
                mimeType: 'text/plain',
                sourceIntent: 'flowchart'
            },
            theme: 'light',
            resolvedTheme: 'light'
        })).toBe(false);
        expect(() => getWebviewPresentation('unknown' as never)).toThrow(/unsupported webview render target/i);
    });
});
