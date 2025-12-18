@echo off
echo.
echo ===============================================
echo CSL Management System - PostgreSQL Quick Setup
echo ===============================================
echo.

echo Step 1: Looking for PostgreSQL installation...
echo.

:: Check common PostgreSQL installation paths
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    echo [FOUND] PostgreSQL 16 at C:\Program Files\PostgreSQL\16\
    set PG_PATH=C:\Program Files\PostgreSQL\16\bin
    goto :setup
)

if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo [FOUND] PostgreSQL 15 at C:\Program Files\PostgreSQL\15\
    set PG_PATH=C:\Program Files\PostgreSQL\15\bin
    goto :setup
)

if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    echo [FOUND] PostgreSQL 14 at C:\Program Files\PostgreSQL\14\
    set PG_PATH=C:\Program Files\PostgreSQL\14\bin
    goto :setup
)

echo [NOT FOUND] PostgreSQL in standard locations
echo.
echo Please locate your PostgreSQL installation:
echo 1. Check Start Menu for PostgreSQL
echo 2. Look in C:\Program Files\PostgreSQL\
echo 3. Check if PostgreSQL service is in Services.msc
echo.
echo If not installed, download from:
echo https://www.postgresql.org/download/windows/
echo.
pause
exit /b 1

:setup
echo [OK] Using PostgreSQL at: %PG_PATH%
echo.

:: Add to PATH temporarily for this session
set PATH=%PATH%;%PG_PATH%

echo Step 2: Testing PostgreSQL...
"%PG_PATH%\psql.exe" --version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PostgreSQL test failed
    pause
    exit /b 1
)

echo [OK] PostgreSQL is accessible
echo.

echo Step 3: Starting PostgreSQL service...
:: Try different service names
net start postgresql-x64-16 2>nul
if %ERRORLEVEL% == 0 goto :service_started

net start postgresql-x64-15 2>nul  
if %ERRORLEVEL% == 0 goto :service_started

net start postgresql-x64-14 2>nul
if %ERRORLEVEL% == 0 goto :service_started

echo [WARNING] Could not start PostgreSQL service automatically
echo Please start it manually using Services.msc
echo.
goto :test_connection

:service_started
echo [OK] PostgreSQL service started
echo.

:test_connection
echo Step 4: Testing database connection...
set PGPASSWORD=postgres
"%PG_PATH%\psql.exe" -U postgres -d postgres -c "SELECT 'Connection successful!' as status;" 2>nul
if %ERRORLEVEL% == 0 (
    echo [OK] Database connection successful!
    goto :run_setup
) else (
    echo [WARNING] Database connection failed
    echo This might be due to:
    echo - Incorrect password (try: postgres, admin, or blank)
    echo - PostgreSQL service not running
    echo - Connection settings
    echo.
    echo You can still proceed with the setup...
)

:run_setup
echo.
echo Step 5: Running CSL database setup...
echo.
echo Running flexible database setup script...
node flexible-database-setup.js

echo.
echo ===============================================
echo Setup completed!
echo ===============================================
echo.
echo To start the CSL backend server with real database:
echo   node database-production-server.js
echo.
echo To test the integration:
echo   node test-database-integration.js  
echo.
echo Server will be available at:
echo   http://localhost:5001
echo.
echo Health check:
echo   http://localhost:5001/health
echo.
echo API endpoints:
echo   http://localhost:5001/api/students
echo   http://localhost:5001/api/courses
echo   http://localhost:5001/api/certificates
echo.
pause
