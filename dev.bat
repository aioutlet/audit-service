@echo off
:loop
echo.
echo ============================================
echo Starting audit service...
echo ============================================
echo.

REM Check if port 9000 is in use and kill the process
echo Checking port 9000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9000 ^| findstr LISTENING') do (
    echo Port 9000 is in use by PID %%a, killing process...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 >nul
)

echo Starting service on port 9000...
npm run dev

echo.
echo ============================================
echo Service stopped. Press any key to restart or Ctrl+C to exit.
echo ============================================
pause > nul
goto loop
