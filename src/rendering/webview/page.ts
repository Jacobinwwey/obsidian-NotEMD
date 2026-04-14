import { RenderWebviewPayload } from './contract';
import { renderArtifactMarkup } from './renderFrame';

export function buildRenderWebviewHtml(payload: RenderWebviewPayload): string {
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
    </style>
</head>
<body data-render-theme="${payload.resolvedTheme}" data-theme-source="${payload.theme}">
    <div id="app">${renderArtifactMarkup(payload)}</div>
</body>
</html>`;
}
