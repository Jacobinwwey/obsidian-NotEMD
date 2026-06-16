#!/bin/bash
PORT=8765
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🎬 Starting Slidev Presentation Server"
echo "📍 Server: http://localhost:$PORT"
echo "⏹  Press Ctrl+C to stop"
echo ""

if command -v python3 &> /dev/null; then
    echo "▶ Using Python 3..."
    cd "$DIR" && python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "▶ Using Python..."
    cd "$DIR" && python -m http.server $PORT
elif command -v npx &> /dev/null; then
    echo "▶ Using npx http-server..."
    cd "$DIR" && npx -y http-server -p $PORT --cors -c-1
else
    echo "❌ No HTTP server found!"
    echo "Install Python or Node.js, then run again."
    exit 1
fi
