@echo off
REM Slidev Presentation Server
SET PORT=8765

echo 🎬 Starting Slidev Presentation Server
echo 📍 Server: http://localhost:%PORT%
echo ⏹  Press Ctrl+C to stop
echo.

where python3 >/dev/null 2>/dev/null
if %ERRORLEVEL% EQU 0 (
    echo ▶ Using Python 3...
    python3 -m http.server %PORT%
    goto :end
)

where python >/dev/null 2>/dev/null
if %ERRORLEVEL% EQU 0 (
    echo ▶ Using Python...
    python -m http.server %PORT%
    goto :end
)

where npx >/dev/null 2>/dev/null
if %ERRORLEVEL% EQU 0 (
    echo ▶ Using npx http-server...
    npx -y http-server -p %PORT% --cors -c-1
    goto :end
)

echo ❌ No HTTP server found!
echo Install Python or Node.js, then run again.
pause
exit /b 1

:end
