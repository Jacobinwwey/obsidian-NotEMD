jest.mock('vega-lite', () => ({
    compile: jest.fn(() => ({ spec: { marks: [] } }))
}));

jest.mock('vega', () => ({
    parse: jest.fn(() => ({ runtime: true })),
    View: class {
        toSVG(): Promise<string> {
            return Promise.resolve('<svg><rect /></svg>');
        }

        finalize(): void {}
    }
}));

import { bootstrapRenderHostDocument } from '../rendering/runtime/renderHostEntry';

class MockDetailsElement {
    open = true;
}

describe('render host runtime entry', () => {
    const previousHtmlDetailsElement = (globalThis as Record<string, unknown>).HTMLDetailsElement;

    beforeAll(() => {
        (globalThis as Record<string, unknown>).HTMLDetailsElement = MockDetailsElement;
    });

    afterAll(() => {
        if (previousHtmlDetailsElement === undefined) {
            delete (globalThis as Record<string, unknown>).HTMLDetailsElement;
            return;
        }

        (globalThis as Record<string, unknown>).HTMLDetailsElement = previousHtmlDetailsElement;
    });

    test('renders mermaid payloads inside the dedicated render host document', async () => {
        const mount = { hidden: true, innerHTML: '' };
        const errorNode = { hidden: true, textContent: 'stale' };
        const fallback = new MockDetailsElement();
        const shell = {};
        const payloadNode = {
            textContent: JSON.stringify({
                artifact: {
                    target: 'mermaid',
                    content: '```mermaid\nflowchart TD\nA --> B\n```',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'flowchart'
                },
                theme: 'dark',
                resolvedTheme: 'dark'
            })
        };

        const doc = {
            getElementById(id: string) {
                switch (id) {
                    case 'notemd-render-host-payload':
                        return payloadNode;
                    case 'notemd-mermaid-mount':
                        return mount;
                    case 'notemd-mermaid-error':
                        return errorNode;
                    default:
                        return null;
                }
            },
            querySelector(selector: string) {
                switch (selector) {
                    case '[data-render-target="mermaid"]':
                        return shell;
                    case '.notemd-render-fallback':
                        return fallback;
                    default:
                        return null;
                }
            }
        };

        await bootstrapRenderHostDocument(doc as any);

        expect(mount.hidden).toBe(false);
        expect(mount.innerHTML).toContain('<svg');
        expect(errorNode.hidden).toBe(true);
        expect(errorNode.textContent).toBe('');
        expect(fallback.open).toBe(false);
    });
});
