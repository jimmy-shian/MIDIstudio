@echo off
REM MIDIstudio one-click start (Windows). Double-click this file.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js 20+ from https://nodejs.org/ first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/4] Installing dependencies - first run, may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [1/4] Dependencies OK, skip install.
)

if not exist "backend\.env" (
  echo [2/4] Creating backend\.env from example...
  copy "backend\.env.example" "backend\.env" >nul
) else (
  echo [2/4] backend\.env exists.
)

echo [3/4] Starting backend (:3001) + frontend (:5173)...
start "MIDIstudio Server" /D "%~dp0" cmd /k npm run dev

echo [4/4] Waiting for servers, then opening browser...
timeout /t 12 /nobreak >nul
start "" http://localhost:5173

echo.
echo MIDIstudio is starting. Keep the "MIDIstudio Server" window open.
echo Frontend: http://localhost:5173   Backend health: http://localhost:3001/api/health
echo To stop everything, double-click stop.bat
echo.
pause
