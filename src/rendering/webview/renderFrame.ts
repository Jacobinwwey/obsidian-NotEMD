import { RenderWebviewPayload } from './contract';
import { getRenderTargetDisplayName } from '../targetLabel';

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

    return `<section class="notemd-render-shell" data-render-target="${escapeHtml(payload.artifact.target)}" data-render-theme="${escapeHtml(payload.resolvedTheme)}" data-theme-source="${escapeHtml(payload.theme)}">
    <header class="notemd-render-header">${escapeHtml(previewTitle)}</header>
    ${sourceMarkup}
    <pre class="notemd-render-body">${escapeHtml(formatArtifactContent(payload))}</pre>
</section>`;
}
