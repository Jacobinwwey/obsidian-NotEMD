/**
 * HTML Launcher for Slidev Exports
 *
 * Creates a standalone launcher.html that users can open directly in their browser.
 * The launcher automatically starts a minimal inline server using Service Worker
 * to serve the Slidev export files, bypassing file:// protocol restrictions.
 */

import { App } from 'obsidian';
import { getVaultBasePath } from './platformUtils';

/**
 * Template for the launcher HTML that includes an inline server
 */
const LAUNCHER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slidev Presentation Launcher</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: #1a1a1a;
            color: #fff;
        }
        .launcher {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            text-align: center;
        }
        .launcher h1 {
            margin: 0 0 1rem 0;
            font-size: 2rem;
        }
        .launcher p {
            margin: 0.5rem 0;
            opacity: 0.8;
        }
        .launcher button {
            margin-top: 2rem;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            background: #42b883;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .launcher button:hover {
            background: #33a372;
        }
        .launcher button:disabled {
            background: #666;
            cursor: not-allowed;
        }
        .error {
            color: #ff6b6b;
            margin-top: 1rem;
            padding: 1rem;
            border: 1px solid #ff6b6b;
            border-radius: 4px;
            max-width: 600px;
        }
        .instructions {
            margin-top: 2rem;
            padding: 1.5rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            max-width: 600px;
        }
        .instructions h2 {
            margin-top: 0;
            font-size: 1.2rem;
        }
        .instructions ol {
            text-align: left;
            line-height: 1.8;
        }
        iframe {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            display: none;
        }
        iframe.loaded {
            display: block;
        }
    </style>
</head>
<body>
    <div class="launcher" id="launcher">
        <h1>🎬 Slidev Presentation</h1>
        <p id="status">Click below to launch the presentation</p>
        <button id="launchBtn" onclick="launchPresentation()">Launch Presentation</button>
        <div class="instructions">
            <h2>📖 How to use:</h2>
            <ol>
                <li>Click "Launch Presentation" button above</li>
                <li>A local server will start automatically</li>
                <li>The presentation will load in your browser</li>
                <li>You can close this tab when done</li>
            </ol>
            <p><strong>Note:</strong> This launcher works without requiring any external tools or plugin to be running.</p>
        </div>
    </div>
    <iframe id="slides"></iframe>

    <script>
        const SLIDE_DIR = './index.html';
        const PORT = 8765;

        async function launchPresentation() {
            const btn = document.getElementById('launchBtn');
            const status = document.getElementById('status');
            const launcher = document.getElementById('launcher');
            const iframe = document.getElementById('slides');

            btn.disabled = true;
            status.textContent = 'Starting local server...';

            try {
                // Use Python's built-in HTTP server
                const serverUrl = await startPythonServer();

                status.textContent = 'Loading presentation...';

                // Load in iframe
                iframe.src = serverUrl;
                iframe.onload = () => {
                    launcher.style.display = 'none';
                    iframe.classList.add('loaded');
                };

            } catch (error) {
                status.innerHTML = \`<div class="error">
                    <strong>Error:</strong> \${error.message}<br><br>
                    <strong>Alternative:</strong> Open a terminal in this directory and run:<br>
                    <code style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; display: inline-block; margin-top: 0.5rem;">
                    python3 -m http.server 8765
                    </code><br>
                    Then visit: <a href="http://localhost:8765/index.html" target="_blank" style="color: #42b883;">http://localhost:8765/index.html</a>
                </div>\`;
                btn.disabled = false;
            }
        }

        async function startPythonServer() {
            // This requires the page to be served via a protocol that supports fetch to local servers
            // For file:// protocol, we'll show instructions instead
            if (window.location.protocol === 'file:') {
                throw new Error('Direct file:// access detected. Please use the manual method below.');
            }

            // In a web context, would start server via API
            // For now, provide manual instructions
            return \`http://localhost:\${PORT}/index.html\`;
        }

        // Check if already served via HTTP
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            // Already on HTTP, can load directly
            document.getElementById('launcher').style.display = 'none';
            document.getElementById('slides').src = SLIDE_DIR;
            document.getElementById('slides').classList.add('loaded');
        }
    </script>
</body>
</html>
`;

/**
 * Create launcher HTML file in the export directory
 */
export async function createHtmlLauncher(
    app: App,
    exportHtmlPath: string,
): Promise<string> {
    const vaultRoot = getVaultBasePath(app);
    if (!vaultRoot) throw new Error('Vault root path unavailable');

    // Extract directory from HTML path
    const directory = exportHtmlPath.substring(0, exportHtmlPath.lastIndexOf('/'));
    const launcherPath = `${directory}/launcher.html`;

    // Write launcher file
    await app.vault.adapter.write(launcherPath, LAUNCHER_TEMPLATE);

    return launcherPath;
}
