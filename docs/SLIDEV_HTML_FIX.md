# Slidev HTML Export Fix - Testing Documentation

## Problem
Slidev HTML exports use ES modules with dynamic imports, which are blocked by browser CORS policy when opened via `file://` protocol. This causes the slides to fail loading in Edge, Firefox, Chrome when double-clicked.

## Solution
Generate standalone server scripts (`start-server.sh` and `start-server.bat`) along with the HTML export. Users can run these scripts to serve the presentation via HTTP, which bypasses the `file://` protocol restriction.

## Key Features
- **No plugin dependency**: Users can run presentations even when Obsidian/plugin is closed
- **No embedded HTTP server**: Plugin doesn't run any server, eliminating attack surface
- **Cross-platform**: Works on Windows, macOS, Linux
- **Auto-detection**: Scripts automatically detect Python or Node.js
- **User-friendly**: Simple one-command execution

## Implementation Files
- `src/slideExport/serverScripts.ts` - Generates server scripts and README
- `src/slideExport/slidevExporter.ts` - Calls script generator after HTML build
- `src/slideExport/localServer.ts` - (Optional) Auto-launch helper when plugin is active
- `src/main.ts` - Integration with plugin commands

## Testing

### 1. Build Plugin
```bash
cd ~/obsidian-NotEMD
npm run build
```

### 2. Export Slides via Obsidian
- Open Obsidian with NotEMD plugin
- Open a markdown file with Slidev frontmatter
- Run command: "Export Slides"
- Set format to "HTML"
- Export completes

### 3. Verify Generated Files
Check the export directory contains:
- `index.html` - Main presentation file
- `assets/` - JavaScript and CSS bundles
- `start-server.sh` - Unix/macOS server script
- `start-server.bat` - Windows server script
- `README.md` - User instructions

### 4. Test Server Script (Manual)
```bash
cd docs/export/<presentation-name>-slides
./start-server.sh
```

Expected output:
```
🎬 Starting Slidev Presentation Server
📍 Server: http://localhost:8765
⏹  Press Ctrl+C to stop

▶ Using Python 3...
```

### 5. Test in Browser
Open http://localhost:8765 in:
- Chrome
- Firefox
- Edge

Expected: Presentation loads and displays correctly with all slides navigable.

### 6. Test Without Plugin
1. Close Obsidian completely
2. Navigate to export directory in file manager
3. Run `start-server.sh` (or `.bat` on Windows)
4. Open http://localhost:8765
5. Verify presentation works

## Verification Checklist
- [ ] Plugin builds without errors
- [ ] HTML export generates all required files
- [ ] `start-server.sh` has execute permissions
- [ ] Server script auto-detects Python/Node.js
- [ ] Presentation loads at http://localhost:8765
- [ ] All slides are navigable
- [ ] Dynamic content (v-clicks, animations) works
- [ ] Works in Chrome, Firefox, Edge
- [ ] Works when Obsidian is closed
- [ ] README provides clear instructions
- [ ] No HTTP server embedded in plugin

## Security Notes
- Server runs only on localhost (127.0.0.1)
- No external network access
- User must manually start/stop server
- No persistent background process
- Plugin itself runs no server
- Clean architecture with no attack surface

## Future Enhancements (Optional)
1. Auto-detect available port if 8765 is busy
2. Add option to auto-open browser when plugin exports
3. Include QR code for mobile viewing
4. Add server status indicator

## Resolved Issues
- ✅ HTML exports work without plugin running
- ✅ No embedded HTTP server in plugin
- ✅ Cross-platform compatibility
- ✅ Simple user experience
- ✅ Secure by design
