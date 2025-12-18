@echo off
echo Starting backend server...
cd /d "c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo Node.js not found in PATH
    exit /b 1
)

echo Starting minimal CORS server...
node minimal-cors-server.js
echo Server process ended
pause
