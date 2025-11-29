@echo off
echo Starting Test Backend Server...
echo Current directory: %cd%

echo Checking for Node.js...
node --version
if errorlevel 1 (
    echo Error: Node.js not found!
    pause
    exit /b 1
)

echo Starting server...
node test-server-start.js

pause
