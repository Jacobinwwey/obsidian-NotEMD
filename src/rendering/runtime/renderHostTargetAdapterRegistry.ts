import { isSupportedRenderTarget } from '../../diagram/types';
import type { DiagramIntent } from '../../diagram/types';
import { normalizeMermaidDefinition } from '../../diagram/adapters/mermaid/normalize';
import {
    MermaidPreviewDeps,
    renderNormalizedMermaidDefinitionSvgWithDeps
} from '../preview/mermaidPreviewShared';
import {
    VegaLitePreviewDeps,
    renderVegaLiteSpecSvgWithDeps
} from '../preview/vegaLitePreviewShared';
import type { RenderArtifactTarget } from '../types';
import type { RenderWebviewPayload } from '../webview/contract';
import { getBundledMermaidPreviewDeps, getBundledVegaLitePreviewDeps } from '../webview/bundledPreviewDeps';
import { TargetAdapterRegistry } from '../targetAdapterRegistry';
import type { TargetAdapter } from '../targetAdapterRegistry';
import { RenderWebviewTheme } from '../theme';
import { assertMountedSvgPresentationSafety } from '../preview/svgSafety';

export interface RenderHostTargetAdapter extends TargetAdapter {
    errorElementId: string;
    render(payload: RenderWebviewPayload, doc: Document): Promise<void>;
}

function mountSvgWithPresentationSafety(mount: HTMLElement, svg: string, source: string): void {
    // The render host initially keeps the mount hidden while the fallback is
    // visible. Geometry APIs return zero for hidden subtrees, so expose the
    // mount before measuring and roll it back if the final presentation is
    // unsafe. An unsafe SVG must never remain visible behind the error state.
    mount.innerHTML = svg;
    mount.hidden = false;
    try {
        assertMountedSvgPresentationSafety(mount, source);
    } catch (error) {
        mount.innerHTML = '';
        mount.hidden = true;
        throw error;
    }
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

    mountSvgWithPresentationSafety(mount, svg, 'Vega-Lite');
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

    mountSvgWithPresentationSafety(mount, svg, 'Mermaid');
    if (fallback instanceof HTMLDetailsElement) {
        fallback.open = false;
    }
    if (errorNode) {
        errorNode.hidden = true;
        errorNode.textContent = '';
    }
}

const RENDER_HOST_TARGET_ADAPTERS = new TargetAdapterRegistry<RenderHostTargetAdapter>([
    {
        target: 'mermaid',
        errorElementId: 'notemd-mermaid-error',
        render: renderMermaidPayload
    },
    {
        target: 'vega-lite',
        errorElementId: 'notemd-vega-lite-error',
        render: renderVegaLitePayload
    }
]);

export function listRenderHostTargetAdapters(): readonly RenderHostTargetAdapter[] {
    return RENDER_HOST_TARGET_ADAPTERS.list();
}

export function getRenderHostTargetAdapter(target: RenderArtifactTarget): RenderHostTargetAdapter | null {
    return isSupportedRenderTarget(target)
        ? RENDER_HOST_TARGET_ADAPTERS.resolve(target)
        : null;
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
    _sourceIntent: DiagramIntent = 'dataChart'
): Promise<string> {
    return renderVegaLiteSpecSvgWithDeps(
        content,
        getBundledVegaLitePreviewDeps(),
        theme
    );
}
