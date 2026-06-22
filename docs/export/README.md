# Slidev Export Directory

This directory contains exported Slidev presentations from the NotEMD plugin.

## Export Modes

### Standalone Mode (Default)

**Output:** Single HTML file that works by double-clicking

**Example:**

```
export/presentation-slides/
└── index-standalone.html    (~727KB, double-click to view)
```

**Advantages:**

- ✅ No setup required
- ✅ Works offline forever
- ✅ Share as single file
- ✅ Opens in any browser via file:// protocol

**Use When:**

- Sharing presentations with non-technical users
- Need offline access
- Want maximum simplicity

### Server-Script Mode (Advanced)

**Output:** Multi-file structure with server scripts

**Example:**

```
export/presentation-slides/
├── index.html               (~200KB)
├── assets/                  (~700KB of JS/CSS files)
├── start-server.sh          (Unix/macOS launcher)
├── start-server.bat         (Windows launcher)
└── README.md                (User instructions)
```

**Advantages:**

- Smaller total file size
- Better for development
- Separate asset caching

**Use When:**

- Comfortable with command line
- Need to modify assets
- Hosting on web server

**How to Use:**

```bash
cd export/presentation-slides/
./start-server.sh          # macOS/Linux
start-server.bat           # Windows
# Open http://localhost:8765 in browser
```

## Configuration

Change export mode in **Obsidian Settings → Slide Export → HTML export mode**

## File Structure

```
docs/export/
├── presentation-1-slides/
│   └── index-standalone.html
├── presentation-2-slides/
│   ├── index.html
│   ├── assets/
│   ├── start-server.sh
│   ├── start-server.bat
│   └── README.md
└── README.md (this file)
```

## Technical Details

### Standalone Bundle

- **Size:** 727KB typical (includes all JS/CSS)
- **Modules:** 34 CommonJS modules inlined
- **Loader:** Custom `__require()` system
- **Protocol:** file://, http://, https://
- **Dependencies:** None

### Server-Script Bundle

- **Size:** ~900KB total across multiple files
- **Modules:** ES modules with dynamic imports
- **Server:** Python 3, Python 2, or Node.js
- **Protocol:** http:// only (requires local server)
- **Dependencies:** Python or Node.js

## Troubleshooting

### Standalone Mode

**Problem:** Double-clicking HTML shows blank page

**Solution:**

1. Check file size (~727KB) - if much smaller, re-export
2. Try different browser (Chrome, Firefox, Edge)
3. Check browser console for errors (F12)
4. Verify file is `index-standalone.html` not `index.html`

### Server-Script Mode

**Problem:** Server script won't run

**Solution:**

1. Check Python/Node.js is installed: `python3 --version`
2. Make script executable: `chmod +x start-server.sh`
3. Try different port if 8765 is busy
4. Check firewall/antivirus isn't blocking

**Problem:** Presentation shows blank page on localhost

**Solution:**

1. Check server is running (should show "Serving HTTP on...")
2. Verify URL is exactly `http://localhost:8765`
3. Check browser console (F12) for errors
4. Try clearing browser cache

## Browser Compatibility

| Browser | Standalone | Server-Script |
| ------- | ---------- | ------------- |
| Chrome  | ✅         | ✅            |
| Firefox | ✅         | ✅            |
| Edge    | ✅         | ✅            |
| Safari  | ✅         | ✅            |
| Mobile  | ✅\*       | ✅\*\*        |

\* May need to upload to cloud/server first  
\*\* Requires accessing `http://[your-ip]:8765` from mobile

## Security

**Standalone Mode:**

- Pure static HTML, no network access
- Safe to share publicly
- No external dependencies
- No execution of remote code

**Server-Script Mode:**

- Localhost only (127.0.0.1)
- No external network access
- User must manually start/stop
- Clean shutdown with Ctrl+C

## Related Documentation

- [STANDALONE_BUNDLE_FIX.md](../STANDALONE_BUNDLE_FIX.md) - Technical details and bug fix
- [SINGLE_FILE_BUNDLER.md](../SINGLE_FILE_BUNDLER.md) - Architecture overview
- [SLIDEV_SOLUTION.md](../SLIDEV_SOLUTION.md) - Server-script implementation
- [SLIDEV_HTML_FIX.md](../SLIDEV_HTML_FIX.md) - Original problem analysis

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section above
2. Verify you're using latest plugin version
3. Report issues at: https://github.com/Jacobinwwey/obsidian-NotEMD/issues

---

**Last Updated:** 2026-06-16
