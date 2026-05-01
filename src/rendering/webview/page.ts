import { RenderWebviewPayload } from './contract';
import { renderArtifactMarkup } from './renderFrame';
import { ensureRenderHostBridge } from './bootstrap';

function buildHtmlPreviewThemeShim(payload: RenderWebviewPayload): string {
    const colorScheme = payload.resolvedTheme === 'dark' ? 'dark' : 'light';

    return `<style id="notemd-html-preview-theme-shim">
html, body {
    margin: 0;
    min-height: 100%;
}

body[data-render-theme="light"] {
    color-scheme: light;
    background: #f8fafc;
    color: #0f172a;
    --notemd-html-bg: #f8fafc;
    --notemd-html-panel: rgba(255, 255, 255, 0.96);
    --notemd-html-text: #0f172a;
    --notemd-html-muted: #475569;
    --notemd-html-border: rgba(148, 163, 184, 0.32);
    --notemd-html-chip: rgba(59, 130, 246, 0.14);
    --notemd-html-accent: #2563eb;
}

body[data-render-theme="dark"] {
    color-scheme: dark;
    background: #020617;
    color: #e2e8f0;
    --notemd-html-bg: #020617;
    --notemd-html-panel: rgba(15, 23, 42, 0.96);
    --notemd-html-text: #e2e8f0;
    --notemd-html-muted: #94a3b8;
    --notemd-html-border: rgba(148, 163, 184, 0.24);
    --notemd-html-chip: rgba(96, 165, 250, 0.18);
    --notemd-html-accent: #93c5fd;
}

body[data-render-theme] {
    color-scheme: ${colorScheme};
}
</style>`;
}

function applyHtmlBodyThemeAttributes(html: string, payload: RenderWebviewPayload): string {
    const bodyTagRegex = /<body\b([^>]*)>/i;
    if (!bodyTagRegex.test(html)) {
        return html;
    }

    return html.replace(bodyTagRegex, (_match, attrs: string) => {
        const attrsWithoutTheme = attrs
            .replace(/\sdata-render-theme=(["']).*?\1/gi, '')
            .replace(/\sdata-theme-source=(["']).*?\1/gi, '');
        return `<body${attrsWithoutTheme} data-render-theme="${payload.resolvedTheme}" data-theme-source="${payload.theme}">`;
    });
}

function injectHtmlPreviewThemeShim(html: string, payload: RenderWebviewPayload): string {
    const themeShim = buildHtmlPreviewThemeShim(payload);
    const themedHtml = applyHtmlBodyThemeAttributes(html, payload);

    if (/<style\b[^>]*id=(["'])notemd-html-preview-theme-shim\1/i.test(themedHtml)) {
        return themedHtml;
    }

    if (/<\/head>/i.test(themedHtml)) {
        return themedHtml.replace(/<\/head>/i, `${themeShim}\n</head>`);
    }

    if (/<html\b[^>]*>/i.test(themedHtml)) {
        return themedHtml.replace(/<html\b([^>]*)>/i, `<html$1><head>${themeShim}</head>`);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
${themeShim}
</head>
<body data-render-theme="${payload.resolvedTheme}" data-theme-source="${payload.theme}">
${themedHtml}
</body>
</html>`;
}

export function buildRenderWebviewHtml(payload: RenderWebviewPayload): string {
    if (payload.artifact.target === 'html' && payload.artifact.mimeType === 'text/html') {
        const trimmed = payload.artifact.content.trim();
        if (/^<!DOCTYPE html>/i.test(trimmed)) {
            return injectHtmlPreviewThemeShim(trimmed, payload);
        }

        return injectHtmlPreviewThemeShim(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
${payload.artifact.content}
</body>
</html>`, payload);
    }

    if (payload.artifact.target === 'vega-lite') {
        ensureRenderHostBridge();
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Notemd Render Host</title>
    <style>
        :root {
            font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
            --notemd-render-bg: transparent;
            --notemd-render-text: #0f172a;
            --notemd-render-border: rgba(148, 163, 184, 0.4);
            --notemd-render-divider: rgba(148, 163, 184, 0.28);
            --notemd-render-panel-bg: rgba(248, 250, 252, 0.96);
            --notemd-render-source-text: rgba(15, 23, 42, 0.76);
        }

        body {
            margin: 0;
            background: var(--notemd-render-bg);
            color: var(--notemd-render-text);
        }

        #app {
            min-height: 100vh;
            padding: 16px;
            box-sizing: border-box;
        }

        body[data-render-theme="dark"] {
            color-scheme: dark;
            --notemd-render-text: #e2e8f0;
            --notemd-render-border: rgba(148, 163, 184, 0.3);
            --notemd-render-divider: rgba(148, 163, 184, 0.22);
            --notemd-render-panel-bg: rgba(15, 23, 42, 0.88);
            --notemd-render-source-text: rgba(226, 232, 240, 0.72);
        }

        body[data-render-theme="light"] {
            color-scheme: light;
        }

        .notemd-render-shell {
            border: 1px solid var(--notemd-render-border);
            border-radius: 12px;
            background: var(--notemd-render-panel-bg);
            overflow: hidden;
        }

        .notemd-render-header,
        .notemd-render-source {
            padding: 10px 14px;
        }

        .notemd-render-header {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1px solid var(--notemd-render-divider);
        }

        .notemd-render-source {
            font-size: 12px;
            color: var(--notemd-render-source-text);
            border-bottom: 1px solid var(--notemd-render-divider);
        }

        .notemd-render-body {
            margin: 0;
            padding: 14px;
            overflow: auto;
            font: 12px/1.5 "IBM Plex Mono", "SFMono-Regular", monospace;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .notemd-render-host-body {
            padding: 14px;
        }

        .notemd-render-mount {
            overflow: auto;
        }

        .notemd-render-mount svg {
            display: block;
            max-width: 100%;
            height: auto;
        }

        .notemd-render-error {
            margin: 0 0 12px;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(248, 113, 113, 0.28);
            background: rgba(248, 113, 113, 0.1);
            color: inherit;
            font: 12px/1.5 "IBM Plex Mono", "SFMono-Regular", monospace;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .notemd-render-fallback {
            border-top: 1px solid var(--notemd-render-divider);
            padding-top: 12px;
        }

        .notemd-render-fallback > summary {
            cursor: pointer;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--notemd-render-source-text);
        }

        .notemd-render-fallback[open] > summary {
            margin-bottom: 10px;
        }

        .notemd-render-fallback .notemd-render-body {
            padding: 0;
        }
    </style>
</head>
<body data-render-theme="${payload.resolvedTheme}" data-theme-source="${payload.theme}">
    <div id="app">${renderArtifactMarkup(payload)}</div>
</body>
</html>`;
}
