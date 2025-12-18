@echo off
echo 🚀 Starting CSL Backend Server...
echo.

cd /d "C:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"

echo Starting emergency backend server...
start /B node emergency-backend.js

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Testing connection...
curl http://localhost:5001/health

echo.
echo ✅ Backend should now be running on: http://localhost:5001
echo 💡 Test students API: http://localhost:5001/api/v1/students
echo.
pause
