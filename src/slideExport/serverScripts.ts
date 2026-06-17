/**
 * Server script generator for Slidev HTML exports
 *
 * Creates a standalone start-server.sh script that users can run
 * to serve their Slidev presentation, making it work properly
 * without the plugin being active.
 */

import { App } from 'obsidian';
import { getVaultBasePath } from './platformUtils';

const SERVER_SCRIPT_TEMPLATE = `#!/bin/bash
# Slidev Presentation Server
# This script starts a local HTTP server to view your Slidev presentation
# Run this script: ./start-server.sh

PORT=8765
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Slidev presentation server..."
echo "Server will be available at: http://localhost:\$PORT"
echo "Press Ctrl+C to stop the server"
echo ""

# Try different server options in order of preference
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server..."
    cd "$DIR" && python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server..."
    cd "$DIR" && python -m http.server $PORT
elif command -v npx &> /dev/null; then
    echo "Using npx http-server..."
    cd "$DIR" && npx -y http-server -p $PORT --cors -c-1
else
    echo "❌ Error: No HTTP server available!"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi
`;

const SERVER_BAT_TEMPLATE = `@echo off
REM Slidev Presentation Server
REM This script starts a local HTTP server to view your Slidev presentation
REM Run this script: start-server.bat

set PORT=8765

echo Starting Slidev presentation server...
echo Server will be available at: http://localhost:%PORT%
echo Press Ctrl+C to stop the server
echo.

REM Try different server options
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python 3 HTTP server...
    python3 -m http.server %PORT%
    goto :end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python HTTP server...
    python -m http.server %PORT%
    goto :end
)

where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using npx http-server...
    npx -y http-server -p %PORT% --cors -c-1
    goto :end
)

echo Error: No HTTP server available!
echo.
echo Please install one of the following:
echo   - Python 3: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo After installation, run this script again.
pause
exit /b 1

:end
`;

const README_TEMPLATE = `# 🎬 Slidev Presentation

## 🚀 Quick Start

This Slidev presentation cannot be opened directly by double-clicking \`index.html\` due to browser security restrictions. You need to serve it via HTTP.

### ✅ Easiest Method: Run the Server Script

**macOS/Linux:**
\`\`\`bash
./start-server.sh
\`\`\`

**Windows:**
\`\`\`cmd
start-server.bat
\`\`\`

The script will automatically:
- Detect available HTTP server (Python or Node.js)
- Start server on http://localhost:8765
- Open the URL in your browser (you may need to open it manually)

Press \`Ctrl+C\` to stop the server when done.

### 📝 Manual Methods

If the script doesn't work, run any of these in this directory:

\`\`\`bash
# Python 3 (most common)
python3 -m http.server 8765

# Python 2
python -m SimpleHTTPServer 8765

# Node.js
npx -y http-server -p 8765
\`\`\`

Then visit: **http://localhost:8765**

## ❓ Why is a server needed?

Slidev uses ES modules with dynamic imports. Modern browsers block these under \`file://\` protocol for security. A local HTTP server solves this.

## 🔐 Security Note

The server only runs locally on your machine (localhost). No external access is allowed. Stop the server (Ctrl+C) when you're done viewing.

## 🎯 Keyboard Shortcuts (in presentation)

- **Space / Arrow Keys**: Navigate slides
- **F**: Toggle fullscreen
- **O**: Toggle overview
- **D**: Toggle dark mode
- **G**: Go to specific slide

---

Generated with NotEMD Obsidian Plugin
`;

/**
 * Create server scripts and README in the export directory
 */
export async function createServerScripts(
    app: App,
    exportHtmlPath: string,
): Promise<void> {
    const vaultRoot = getVaultBasePath(app);
    if (!vaultRoot) throw new Error('Vault root path unavailable');

    // Extract directory from HTML path
    const directory = exportHtmlPath.substring(0, exportHtmlPath.lastIndexOf('/'));

    // Write server scripts
    await app.vault.adapter.write(`${directory}/start-server.sh`, SERVER_SCRIPT_TEMPLATE);
    await app.vault.adapter.write(`${directory}/start-server.bat`, SERVER_BAT_TEMPLATE);
    await app.vault.adapter.write(`${directory}/README.md`, README_TEMPLATE);

    // Make shell script executable on Unix systems
    try {
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(vaultRoot, directory, 'start-server.sh');
        fs.chmodSync(scriptPath, 0o755);
    } catch (error) {
        // Silently ignore on Windows or if chmod fails
        console.warn('Could not make script executable:', error);
    }
}
