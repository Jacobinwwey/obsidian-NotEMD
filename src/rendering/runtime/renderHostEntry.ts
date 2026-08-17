import type { RenderWebviewPayload } from '../webview/contract';
import { getRenderHostTargetAdapter } from './renderHostTargetAdapterRegistry';

function parseRenderHostPayload(source: string): RenderWebviewPayload {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Render host payload must be a JSON object.');
    }

    return parsed as RenderWebviewPayload;
}

export async function bootstrapRenderHostDocument(doc: Document = document): Promise<void> {
    const payloadNode = doc.getElementById('notemd-render-host-payload');
    if (!payloadNode?.textContent) {
        return;
    }

    const payload = parseRenderHostPayload(payloadNode.textContent);
    const adapter = getRenderHostTargetAdapter(payload.artifact.target);
    if (!adapter) {
        return;
    }

    try {
        await adapter.render(payload, doc);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorNode = doc.getElementById(adapter.errorElementId);
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

export {
    loadBundledMermaidPreviewDeps,
    loadBundledVegaLitePreviewDeps,
    renderBundledMermaidToSvg,
    renderBundledVegaLiteToSvg
} from './renderHostTargetAdapterRegistry';

if (typeof document !== 'undefined') {
    void bootstrapRenderHostDocument();
}
