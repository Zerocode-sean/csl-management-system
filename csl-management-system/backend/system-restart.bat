@echo off
cls
echo ===============================================
echo 🔧 CSL System Diagnostic and Restart Tool
echo ===============================================
echo.

echo 📋 System Status Check:
echo ------------------------

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js
    pause
    exit /b 1
)

echo.
echo Checking current directory...
cd /d "C:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"
echo Current directory: %CD%

echo.
echo Checking if port 5001 is in use...
netstat -an | findstr 5001
if %errorlevel% equ 0 (
    echo ⚠️  Port 5001 is already in use
    echo Attempting to kill existing processes...
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Port 5001 is available
)

echo.
echo 🚀 Starting Backend Server...
echo -----------------------------

echo Starting emergency backend server on port 5001...
node emergency-backend.js &

echo Waiting for server startup...
timeout /t 8 /nobreak >nul

echo.
echo 🧪 Testing Connection...
echo -----------------------

echo Testing health endpoint...
curl -s http://localhost:5001/health
if %errorlevel% equ 0 (
    echo ✅ Health check passed!
) else (
    echo ❌ Health check failed!
)

echo.
echo Testing students API...
curl -s http://localhost:5001/api/v1/students
if %errorlevel% equ 0 (
    echo ✅ Students API working!
) else (
    echo ❌ Students API failed!
)

echo.
echo ===============================================
echo 🎉 Backend Server Status
echo ===============================================
echo Server URL: http://localhost:5001
echo Health Check: http://localhost:5001/health
echo Students API: http://localhost:5001/api/v1/students
echo.
echo Press any key to continue...
pause >nul
