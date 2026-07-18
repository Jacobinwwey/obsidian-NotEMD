import { DiagramIntent } from '../../diagram/types';
import { normalizeMermaidDefinition } from '../preview/mermaidDefinitionShared';
import { MermaidPreviewDeps, renderNormalizedMermaidDefinitionSvgWithDeps } from '../preview/mermaidPreviewShared';
import { RenderWebviewTheme } from '../theme';
import { VegaLitePreviewDeps, renderVegaLiteSpecSvgWithDeps } from '../preview/vegaLitePreviewShared';
import { RenderWebviewPayload } from '../webview/contract';
import { getBundledMermaidPreviewDeps, getBundledVegaLitePreviewDeps } from '../webview/bundledPreviewDeps';

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
    return getBundledVegaLitePreviewDeps();
}

export function loadBundledMermaidPreviewDeps(): MermaidPreviewDeps {
    return getBundledMermaidPreviewDeps();
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
        getBundledMermaidPreviewDeps(),
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
        getBundledVegaLitePreviewDeps(),
        theme
    );
}

if (typeof document !== 'undefined') {
    void bootstrapRenderHostDocument();
}
