import { DiagramIntent } from '../../diagram/types';
import { RenderWebviewTheme } from '../theme';
import { renderVegaLiteArtifactSvg } from '../preview/vegaLitePreview';

export const RENDER_HOST_BRIDGE_GLOBAL = '__NOTEMD_RENDER_BRIDGE__';

export interface RenderHostBridge {
    renderVegaLiteToSvg(content: string, theme?: RenderWebviewTheme, sourceIntent?: DiagramIntent): Promise<string>;
}

type RenderHostGlobal = typeof globalThis & {
    [RENDER_HOST_BRIDGE_GLOBAL]?: RenderHostBridge;
};

function createRenderHostBridge(): RenderHostBridge {
    return {
        renderVegaLiteToSvg(content, theme = 'system', sourceIntent = 'dataChart') {
            return renderVegaLiteArtifactSvg({
                target: 'vega-lite',
                content,
                mimeType: 'application/json',
                sourceIntent
            }, undefined, theme);
        }
    };
}

export function ensureRenderHostBridge(root: RenderHostGlobal = globalThis as RenderHostGlobal): RenderHostBridge {
    if (!root[RENDER_HOST_BRIDGE_GLOBAL]) {
        root[RENDER_HOST_BRIDGE_GLOBAL] = createRenderHostBridge();
    }

    return root[RENDER_HOST_BRIDGE_GLOBAL] as RenderHostBridge;
}

export function buildVegaLiteRenderBootstrap(): string {
    return String.raw`(async () => {
    const shell = document.querySelector('[data-render-target="vega-lite"]');
    const mount = document.getElementById('notemd-vega-lite-mount');
    const specNode = document.getElementById('notemd-vega-lite-spec');
    const fallback = document.querySelector('.notemd-render-fallback');
    const errorNode = document.getElementById('notemd-vega-lite-error');

    if (!shell || !mount || !specNode) {
        return;
    }

    const bridge = window.parent && window.parent.__NOTEMD_RENDER_BRIDGE__;
    if (!bridge || typeof bridge.renderVegaLiteToSvg !== 'function') {
        throw new Error('Vega-Lite render bridge is unavailable.');
    }

    const theme = shell.getAttribute('data-render-theme') || 'light';
    const sourceIntent = shell.getAttribute('data-source-intent') || 'dataChart';
    const svg = await bridge.renderVegaLiteToSvg(specNode.textContent || '{}', theme, sourceIntent);

    mount.innerHTML = svg;
    mount.hidden = false;
    if (fallback instanceof HTMLDetailsElement) {
        fallback.open = false;
    }
    if (errorNode) {
        errorNode.hidden = true;
        errorNode.textContent = '';
    }
})().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const errorNode = document.getElementById('notemd-vega-lite-error');
    const fallback = document.querySelector('.notemd-render-fallback');

    if (errorNode) {
        errorNode.hidden = false;
        errorNode.textContent = message;
    }
    if (fallback instanceof HTMLDetailsElement) {
        fallback.open = true;
    }
    console.error('Notemd render host failed to render Vega-Lite preview.', error);
});`;
}
