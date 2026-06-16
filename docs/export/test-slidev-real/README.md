# 🎬 Slidev Presentation

## 🚀 Quick Start

This Slidev presentation cannot be opened directly by double-clicking `index.html` due to browser security restrictions. You need to serve it via HTTP.

### ✅ Easiest Method: Run the Server Script

**macOS/Linux:**
```bash
./start-server.sh
```

**Windows:**
```cmd
start-server.bat
```

The script will automatically:
- Detect available HTTP server (Python or Node.js)
- Start server on http://localhost:8765
- Open the URL in your browser (you may need to open it manually)

Press `Ctrl+C` to stop the server when done.

### 📝 Manual Methods

If the script doesn't work, run any of these in this directory:

```bash
# Python 3 (most common)
python3 -m http.server 8765

# Python 2
python -m SimpleHTTPServer 8765

# Node.js
npx -y http-server -p 8765
```

Then visit: **http://localhost:8765**

## ❓ Why is a server needed?

Slidev uses ES modules with dynamic imports. Modern browsers block these under `file://` protocol for security. A local HTTP server solves this.

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
