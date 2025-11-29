@echo off
title CSL Backend Server
cls

echo ===============================================
echo 🚀 CSL Backend Server Startup
echo ===============================================
echo.

REM Change to backend directory
cd /d "C:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"

echo 📂 Current directory: %CD%
echo.

REM Check if port is in use and kill if necessary
echo 🔍 Checking port 5001...
netstat -ano | findstr :5001 | findstr LISTENING
if %errorlevel% equ 0 (
    echo ⚠️  Port 5001 is in use. Killing existing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do taskkill /pid %%a /f 2>nul
    timeout /t 2 /nobreak >nul
    echo ✅ Port cleared
) else (
    echo ✅ Port 5001 is available
)

echo.
echo 🚀 Starting simple backend server...
echo.

REM Start the server
node simple-backend.js

REM This will keep the window open if the server crashes
echo.
echo ❌ Server stopped or crashed!
echo Press any key to restart...
pause >nul
goto :eof
