import { DiagramSpec } from '../diagram/types';
import { buildSemanticFigureModel } from '../diagram/adapters/editableSvg/semanticFigureModel';
import {
    collectEditableSvgAnnotationGaps,
    EditableHtmlSvgRenderer,
    NOTEMD_EDITABLE_SVG_RENDERER_VERSION
} from '../rendering/renderers/editableHtmlSvgRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { getRenderTargetDisplayName } from '../rendering/targetLabel';
import { buildRenderWebviewHtml } from '../rendering/webview/page';

function createArchitectureSpec(overrides: Partial<DiagramSpec> = {}): DiagramSpec {
    return {
        intent: 'flowchart',
        title: 'Runtime <Mechanism>',
        summary: 'Request handling from client to worker.',
        nodes: [
            { id: 'client', label: 'Client <App>', kind: 'actor' },
            { id: 'api', label: 'API Gateway', kind: 'boundary' },
            { id: 'worker', label: 'Worker', kind: 'processor' }
        ],
        edges: [
            { from: 'client', to: 'api', label: 'HTTPS <request>' },
            { from: 'api', to: 'worker', label: 'queue job' }
        ],
        callouts: [
            { label: 'SLO', detail: 'Queue wait stays below 30s.' }
        ],
        ...overrides
    };
}

describe('editable html/svg renderer', () => {
    test('keeps normalized semantic ids unique and preserves edge endpoints', () => {
        const model = buildSemanticFigureModel(createArchitectureSpec({
            nodes: [
                { id: 'client app', label: 'Client App' },
                { id: 'client-app', label: 'Client App Alias' }
            ],
            edges: [
                { from: 'client app', to: 'client-app', label: 'aliases' }
            ]
        }));

        expect(model.nodes.map(node => node.id)).toEqual(['client-app', 'client-app-2']);
        expect(model.edges).toHaveLength(1);
        expect(model.edges[0]).toMatchObject({
            sourceId: 'client-app',
            targetId: 'client-app-2'
        });
    });

    test('renders a self-contained editable html/svg artifact with drawio-style annotations', async () => {
        const renderer = new EditableHtmlSvgRenderer();
        const artifact = await renderer.render(createArchitectureSpec());

        expect(artifact.target).toBe('editable-html-svg');
        expect(artifact.mimeType).toBe('text/html');
        expect(artifact.sourceIntent).toBe('flowchart');
        expect(artifact.content).toContain('<!DOCTYPE html>');
        expect(artifact.content).toContain('<svg');
        expect(artifact.content).toContain(NOTEMD_EDITABLE_SVG_RENDERER_VERSION);
        expect(artifact.content).toContain('data-drawio-type="node"');
        expect(artifact.content).toContain('data-drawio-role="actor"');
        expect(artifact.content).toContain('data-drawio-id="client"');
        expect(artifact.content).toContain('data-drawio-type="edge"');
        expect(artifact.content).toContain('data-drawio-source="client"');
        expect(artifact.content).toContain('data-drawio-target="api"');
        expect(artifact.content).not.toContain('<script');
        expect(artifact.content).not.toContain('https://fonts.');
    });

    test('requires every meaningful svg group to carry drawio annotations or an explicit ignore reason', async () => {
        const renderer = new EditableHtmlSvgRenderer();
        const artifact = await renderer.render(createArchitectureSpec());

        expect(collectEditableSvgAnnotationGaps(artifact.content)).toEqual([]);

        const broken = artifact.content.replace(' data-drawio-type="node"', '');
        expect(collectEditableSvgAnnotationGaps(broken)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('g#client')
            ])
        );
    });

    test('escapes spec text instead of injecting raw html into the artifact', async () => {
        const renderer = new EditableHtmlSvgRenderer();
        const artifact = await renderer.render(createArchitectureSpec({
            nodes: [
                { id: 'unsafe', label: '<img src=x onerror=alert(1)>', kind: '<b>bad</b>' }
            ],
            edges: [],
            callouts: [
                { label: '<script>alert(1)</script>', detail: '<strong>unsafe</strong>' }
            ]
        }));

        expect(artifact.content).toContain('&lt;img src=x');
        expect(artifact.content).toContain('onerror=alert(1)&gt;');
        expect(artifact.content).toContain('&lt;b&gt;bad&lt;/b&gt;');
        expect(artifact.content).toContain('&lt;strong&gt;unsafe&lt;/strong&gt;');
        expect(artifact.content).not.toContain('<img src=x');
        expect(artifact.content).not.toContain('<strong>unsafe</strong>');
    });

    test('is explicitly resolvable without changing default html fallback semantics', () => {
        const renderer = new EditableHtmlSvgRenderer();
        const registry = new RendererRegistry([renderer]);
        const spec = createArchitectureSpec();

        expect(registry.resolve(spec, 'editable-html-svg')).toBe(renderer);
        expect(getRenderTargetDisplayName('editable-html-svg')).toBe('Editable HTML/SVG');
        expect(getRenderTargetDisplayName('circuitikz' as any)).toBe('Circuitikz');
        expect(getRenderTargetDisplayName('drawio' as any)).toBe('Draw.io');
        expect(getRenderTargetDisplayName('drawnix' as any)).toBe('Drawnix');
    });

    test('uses html preview passthrough instead of escaping editable svg artifacts as source text', () => {
        const html = buildRenderWebviewHtml({
            artifact: {
                target: 'editable-html-svg',
                content: '<!DOCTYPE html><html><head></head><body><main><svg><g data-drawio-type="node"></g></svg></main></body></html>',
                mimeType: 'text/html',
                sourceIntent: 'flowchart'
            },
            theme: 'system',
            resolvedTheme: 'dark'
        });

        expect(html).toContain('<svg><g data-drawio-type="node"></g></svg>');
        expect(html).toContain('<body data-render-theme="dark" data-theme-source="system">');
        expect(html).toContain('id="notemd-html-preview-theme-shim"');
        expect(html).not.toContain('&lt;svg&gt;');
    });
});
