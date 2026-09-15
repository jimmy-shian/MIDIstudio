@echo off
REM Stop MIDIstudio dev servers (ports 3001 backend, 5173 frontend).
for %%P in (3001 5173) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
    echo Stopping PID %%a on port %%P...
    taskkill /PID %%a /F >nul 2>nul
  )
)
echo Done.
pause
