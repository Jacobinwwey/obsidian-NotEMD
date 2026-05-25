import mermaid from 'mermaid';
import * as vegaLiteModule from 'vega-lite';
import * as vegaModule from 'vega';
import { DiagramIntent } from '../../diagram/types';
import { normalizeMermaidDefinition } from '../preview/mermaidDefinitionShared';
import {
    MermaidPreviewDeps,
    renderNormalizedMermaidDefinitionSvgWithDeps
} from '../preview/mermaidPreviewShared';
import { RenderWebviewTheme } from '../theme';
import { VegaLitePreviewDeps, renderVegaLiteSpecSvgWithDeps } from '../preview/vegaLitePreviewShared';
import { RenderWebviewPayload } from '../webview/contract';

function resolveMermaidRuntimeExport(moduleExports: unknown): Record<string, unknown> {
    if (moduleExports && typeof moduleExports === 'object' && 'default' in moduleExports) {
        const defaultExport = (moduleExports as Record<string, unknown>).default;
        if (defaultExport && typeof defaultExport === 'object') {
            return defaultExport as Record<string, unknown>;
        }
    }

    return (moduleExports ?? {}) as Record<string, unknown>;
}

function createBundledMermaidPreviewDeps(): MermaidPreviewDeps {
    const mermaidRuntime = resolveMermaidRuntimeExport(mermaid);
    const initialize = mermaidRuntime.initialize;
    const parse = mermaidRuntime.parse;
    const render = mermaidRuntime.render;

    if (typeof initialize !== 'function' || typeof parse !== 'function' || typeof render !== 'function') {
        throw new Error('Mermaid preview runtime is unavailable.');
    }

    return {
        initialize: (config) => initialize(config),
        parse: (source) => parse(source),
        render: (id, source) => render(id, source)
    };
}

function createBundledVegaLitePreviewDeps(): VegaLitePreviewDeps {
    const compile = (vegaLiteModule as any).compile;
    const parse = (vegaModule as any).parse;
    const View = (vegaModule as any).View;

    if (typeof compile !== 'function' || typeof parse !== 'function' || typeof View !== 'function') {
        throw new Error('Vega-Lite preview runtime is unavailable.');
    }

    return {
        compile,
        parse,
        createView: (runtime) => new View(runtime, { renderer: 'svg' })
    };
}

function parseRenderHostPayload(source: string): RenderWebviewPayload {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Render host payload must be a JSON object.');
    }

    return parsed as RenderWebviewPayload;
}

async function renderVegaLitePayload(payload: RenderWebviewPayload, doc: Document): Promise<void> {
    const shell = doc.querySelector('[data-render-target="vega-lite"]');
    const mount = doc.getElementById('notemd-vega-lite-mount');
    const fallback = doc.querySelector('.notemd-render-fallback');
    const errorNode = doc.getElementById('notemd-vega-lite-error');

    if (!shell || !mount) {
        return;
    }

    const svg = await renderBundledVegaLiteToSvg(
        payload.artifact.content,
        payload.resolvedTheme ?? payload.theme,
        payload.artifact.sourceIntent
    );

    mount.innerHTML = svg;
    mount.hidden = false;
    if (fallback instanceof HTMLDetailsElement) {
        fallback.open = false;
    }
    if (errorNode) {
        errorNode.hidden = true;
        errorNode.textContent = '';
    }
}

async function renderMermaidPayload(payload: RenderWebviewPayload, doc: Document): Promise<void> {
    const shell = doc.querySelector('[data-render-target="mermaid"]');
    const mount = doc.getElementById('notemd-mermaid-mount');
    const fallback = doc.querySelector('.notemd-render-fallback');
    const errorNode = doc.getElementById('notemd-mermaid-error');

    if (!shell || !mount) {
        return;
    }

    const svg = await renderBundledMermaidToSvg(
        payload.artifact.content,
        payload.resolvedTheme ?? payload.theme
    );

    mount.innerHTML = svg;
    mount.hidden = false;
    if (fallback instanceof HTMLDetailsElement) {
        fallback.open = false;
    }
    if (errorNode) {
        errorNode.hidden = true;
        errorNode.textContent = '';
    }
}

export async function bootstrapRenderHostDocument(doc: Document = document): Promise<void> {
    const payloadNode = doc.getElementById('notemd-render-host-payload');
    if (!payloadNode?.textContent) {
        return;
    }

    const payload = parseRenderHostPayload(payloadNode.textContent);
    try {
        switch (payload.artifact.target) {
            case 'mermaid':
                await renderMermaidPayload(payload, doc);
                return;
            case 'vega-lite':
                await renderVegaLitePayload(payload, doc);
                return;
            default:
                return;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorNode = payload.artifact.target === 'mermaid'
            ? doc.getElementById('notemd-mermaid-error')
            : doc.getElementById('notemd-vega-lite-error');
        const fallback = doc.querySelector('.notemd-render-fallback');

        if (errorNode) {
            errorNode.hidden = false;
            errorNode.textContent = message;
        }
        if (fallback instanceof HTMLDetailsElement) {
            fallback.open = true;
        }
        console.error(`Notemd render host failed to render ${payload.artifact.target} preview.`, error);
    }
}

export function loadBundledVegaLitePreviewDeps(): VegaLitePreviewDeps {
    return createBundledVegaLitePreviewDeps();
}

export function loadBundledMermaidPreviewDeps(): MermaidPreviewDeps {
    return createBundledMermaidPreviewDeps();
}

export async function renderBundledMermaidToSvg(
    content: string,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    const definition = normalizeMermaidDefinition(content);
    if (!definition) {
        throw new Error('Mermaid preview runtime cannot render an empty definition.');
    }

    return renderNormalizedMermaidDefinitionSvgWithDeps(
        definition,
        createBundledMermaidPreviewDeps(),
        theme
    );
}

export async function renderBundledVegaLiteToSvg(
    content: string,
    theme: RenderWebviewTheme = 'system',
    sourceIntent: DiagramIntent = 'dataChart'
): Promise<string> {
    return renderVegaLiteSpecSvgWithDeps(
        content,
        createBundledVegaLitePreviewDeps(),
        theme
    );
}

if (typeof document !== 'undefined') {
    void bootstrapRenderHostDocument();
}
