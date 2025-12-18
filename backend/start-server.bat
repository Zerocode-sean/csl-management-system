@echo off
echo Starting CSL Backend Server...
echo ================================

echo.
echo Checking Node.js version...
node --version

echo.
echo Starting enhanced production server on port 5001...
echo Press Ctrl+C to stop the server when done testing
echo.

node enhanced-production-start.js
