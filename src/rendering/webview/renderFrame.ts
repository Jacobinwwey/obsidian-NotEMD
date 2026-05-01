import { RenderWebviewPayload } from './contract';
import { getRenderTargetDisplayName } from '../targetLabel';
import { buildVegaLiteRenderBootstrap } from './bootstrap';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatArtifactContent(payload: RenderWebviewPayload): string {
    if (payload.artifact.mimeType !== 'application/json') {
        return payload.artifact.content;
    }

    try {
        return JSON.stringify(JSON.parse(payload.artifact.content), null, 2);
    } catch {
        return payload.artifact.content;
    }
}

export function renderArtifactMarkup(payload: RenderWebviewPayload): string {
    const sourceMarkup = payload.sourcePath
        ? `<div class="notemd-render-source">${escapeHtml(payload.sourcePath)}</div>`
        : '';
    const previewTitle = payload.previewTitle ?? `${getRenderTargetDisplayName(payload.artifact.target)} preview`;

    if (payload.artifact.target === 'vega-lite' && payload.artifact.mimeType === 'application/json') {
        return `<section class="notemd-render-shell notemd-render-shell--vega-lite" data-render-target="${escapeHtml(payload.artifact.target)}" data-render-theme="${escapeHtml(payload.resolvedTheme)}" data-theme-source="${escapeHtml(payload.theme)}" data-source-intent="${escapeHtml(payload.artifact.sourceIntent)}">
    <header class="notemd-render-header">${escapeHtml(previewTitle)}</header>
    ${sourceMarkup}
    <div class="notemd-render-host-body">
        <div id="notemd-vega-lite-mount" class="notemd-render-mount" hidden></div>
        <p id="notemd-vega-lite-error" class="notemd-render-error" hidden></p>
        <details class="notemd-render-fallback" open>
            <summary>JSON</summary>
            <pre id="notemd-vega-lite-spec" class="notemd-render-body">${escapeHtml(formatArtifactContent(payload))}</pre>
        </details>
    </div>
</section>
<script id="notemd-render-host-bootstrap">${buildVegaLiteRenderBootstrap()}</script>`;
    }

    return `<section class="notemd-render-shell" data-render-target="${escapeHtml(payload.artifact.target)}" data-render-theme="${escapeHtml(payload.resolvedTheme)}" data-theme-source="${escapeHtml(payload.theme)}">
    <header class="notemd-render-header">${escapeHtml(previewTitle)}</header>
    ${sourceMarkup}
    <pre class="notemd-render-body">${escapeHtml(formatArtifactContent(payload))}</pre>
</section>`;
}
