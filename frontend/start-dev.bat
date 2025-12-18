@echo off
echo Starting CSL Management System Frontend...
echo.

cd /d "c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\frontend"

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo The application will be available at http://localhost:5173
echo.
echo Test credentials for development:
echo Email: admin@example.com
echo Password: admin123
echo.

call npm run dev

pause
