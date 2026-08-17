import type { RenderArtifactTarget } from '../types';
import { getRenderTargetDescriptor } from '../renderTargetCatalog';
import { getRenderTargetDisplayName } from '../targetLabel';
import { buildMermaidRenderBootstrap, buildVegaLiteRenderBootstrap } from './bootstrap';
import type { RenderWebviewPayload } from './contract';

export type WebviewPresentationMode = 'host-shell' | 'html-document' | 'source-only';

export interface WebviewPresentation {
    readonly target: RenderArtifactTarget;
    readonly mode: WebviewPresentationMode;
    readonly requiresBridge: boolean;
    matches(payload: RenderWebviewPayload): boolean;
    renderMarkup(payload: RenderWebviewPayload): string;
}

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

function buildSourceMarkup(payload: RenderWebviewPayload): string {
    return payload.sourcePath
        ? `<div class="notemd-render-source">${escapeHtml(payload.sourcePath)}</div>`
        : '';
}

function buildPreviewTitle(payload: RenderWebviewPayload): string {
    return payload.previewTitle ?? `${getRenderTargetDisplayName(payload.artifact.target)} preview`;
}

function renderHostShell(
    payload: RenderWebviewPayload,
    target: 'mermaid' | 'vega-lite',
    sourceLabel: 'Source' | 'JSON',
    mountId: string,
    errorId: string,
    bootstrap: string
): string {
    return `<section class="notemd-render-shell notemd-render-shell--${target}" data-render-target="${escapeHtml(target)}" data-render-theme="${escapeHtml(payload.resolvedTheme)}" data-theme-source="${escapeHtml(payload.theme)}" data-source-intent="${escapeHtml(payload.artifact.sourceIntent)}">
    <header class="notemd-render-header">${escapeHtml(buildPreviewTitle(payload))}</header>
    ${buildSourceMarkup(payload)}
    <div class="notemd-render-host-body">
        <div id="${mountId}" class="notemd-render-mount" hidden></div>
        <p id="${errorId}" class="notemd-render-error" hidden></p>
        <details class="notemd-render-fallback" open>
            <summary>${sourceLabel}</summary>
            <pre id="notemd-${target === 'mermaid' ? 'mermaid-source' : 'vega-lite-spec'}" class="notemd-render-body">${escapeHtml(formatArtifactContent(payload))}</pre>
        </details>
    </div>
</section>
<script id="notemd-render-host-bootstrap">${bootstrap}</script>`;
}

export function renderSourceOnlyArtifactMarkup(payload: RenderWebviewPayload): string {
    return `<section class="notemd-render-shell" data-render-target="${escapeHtml(payload.artifact.target)}" data-render-theme="${escapeHtml(payload.resolvedTheme)}" data-theme-source="${escapeHtml(payload.theme)}">
    <header class="notemd-render-header">${escapeHtml(buildPreviewTitle(payload))}</header>
    ${buildSourceMarkup(payload)}
    <pre class="notemd-render-body">${escapeHtml(formatArtifactContent(payload))}</pre>
</section>`;
}

function createPresentation(
    target: RenderArtifactTarget,
    mode: WebviewPresentationMode,
    requiresBridge: boolean,
    mimeType: string,
    renderMarkup: (payload: RenderWebviewPayload) => string
): WebviewPresentation {
    return {
        target,
        mode,
        requiresBridge,
        matches: payload => payload.artifact.mimeType === mimeType,
        renderMarkup
    };
}

const SPECIALIZED_PRESENTATIONS: readonly WebviewPresentation[] = [
    createPresentation(
        'mermaid',
        'host-shell',
        true,
        'text/vnd.mermaid',
        payload => renderHostShell(
            payload,
            'mermaid',
            'Source',
            'notemd-mermaid-mount',
            'notemd-mermaid-error',
            buildMermaidRenderBootstrap()
        )
    ),
    createPresentation(
        'vega-lite',
        'host-shell',
        true,
        'application/json',
        payload => renderHostShell(
            payload,
            'vega-lite',
            'JSON',
            'notemd-vega-lite-mount',
            'notemd-vega-lite-error',
            buildVegaLiteRenderBootstrap()
        )
    ),
    createPresentation('html', 'html-document', false, 'text/html', renderSourceOnlyArtifactMarkup),
    createPresentation('editable-html-svg', 'html-document', false, 'text/html', renderSourceOnlyArtifactMarkup)
];

const SPECIALIZED_BY_TARGET = new Map(SPECIALIZED_PRESENTATIONS.map(presentation => [presentation.target, presentation]));

function assertKnownTarget(target: RenderArtifactTarget): void {
    try {
        getRenderTargetDescriptor(target as Parameters<typeof getRenderTargetDescriptor>[0]);
    } catch {
        throw new Error(`Unsupported webview render target "${String(target)}".`);
    }
}

export function getWebviewPresentation(target: RenderArtifactTarget): WebviewPresentation {
    assertKnownTarget(target);
    return SPECIALIZED_BY_TARGET.get(target) ?? {
        target,
        mode: 'source-only',
        requiresBridge: false,
        matches: () => true,
        renderMarkup: renderSourceOnlyArtifactMarkup
    };
}

export function shouldUseWebviewPresentation(payload: RenderWebviewPayload, presentation: WebviewPresentation): boolean {
    return presentation.matches(payload);
}
