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
            color-scheme: light dark;
            font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        }

        body {
            margin: 0;
            background: transparent;
            color: var(--text-normal, #d8dee9);
        }

        #app {
            min-height: 100vh;
            padding: 16px;
            box-sizing: border-box;
        }

        .notemd-render-shell {
            border: 1px solid rgba(127, 140, 141, 0.35);
            border-radius: 12px;
            background: rgba(28, 32, 36, 0.72);
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
            border-bottom: 1px solid rgba(127, 140, 141, 0.25);
        }

        .notemd-render-source {
            font-size: 12px;
            opacity: 0.8;
            border-bottom: 1px solid rgba(127, 140, 141, 0.2);
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
<body>
    <div id="app">${renderArtifactMarkup(payload)}</div>
</body>
</html>`;
}
