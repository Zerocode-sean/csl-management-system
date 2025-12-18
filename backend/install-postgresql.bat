@echo off
echo Installing PostgreSQL for CSL Management System
echo ==============================================

echo.
echo Checking for existing PostgreSQL installation...

:: Check common installation paths
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    echo PostgreSQL 16 found at C:\Program Files\PostgreSQL\16\
    set PG_PATH=C:\Program Files\PostgreSQL\16\bin
    goto :configure
)

if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo PostgreSQL 15 found at C:\Program Files\PostgreSQL\15\
    set PG_PATH=C:\Program Files\PostgreSQL\15\bin
    goto :configure
)

if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    echo PostgreSQL 14 found at C:\Program Files\PostgreSQL\14\
    set PG_PATH=C:\Program Files\PostgreSQL\14\bin
    goto :configure
)

echo PostgreSQL not found. Attempting installation...
echo.

:: Try winget first
echo Trying winget installation...
winget install PostgreSQL.PostgreSQL --accept-package-agreements --accept-source-agreements
if %ERRORLEVEL% == 0 (
    echo PostgreSQL installed successfully via winget
    goto :find_installation
)

:: Try chocolatey if available
echo Trying chocolatey installation...
where choco >nul 2>nul
if %ERRORLEVEL% == 0 (
    choco install postgresql --confirm
    if %ERRORLEVEL% == 0 (
        echo PostgreSQL installed successfully via chocolatey
        goto :find_installation
    )
)

:: Manual installation instructions
echo.
echo Automatic installation failed. Please install manually:
echo.
echo 1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
echo 2. Run the installer as Administrator
echo 3. Use default settings with these options:
echo    - Password: postgres
echo    - Port: 5432
echo    - Install all components
echo 4. After installation, run this script again
echo.
pause
exit /b 1

:find_installation
echo.
echo Looking for PostgreSQL installation...
timeout /t 3 >nul

:: Check again after installation
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\16\bin
) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\15\bin
) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\14\bin
) else (
    echo PostgreSQL installation not found after installation attempt
    echo Please check the installation and try again
    pause
    exit /b 1
)

:configure
echo.
echo Found PostgreSQL at: %PG_PATH%
echo.

:: Add to PATH temporarily
set PATH=%PATH%;%PG_PATH%

:: Test PostgreSQL version
echo Testing PostgreSQL installation...
"%PG_PATH%\psql.exe" --version
if %ERRORLEVEL% neq 0 (
    echo Failed to get PostgreSQL version
    pause
    exit /b 1
)

:: Check PostgreSQL service
echo.
echo Checking PostgreSQL service...
sc query postgresql-x64-16 >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo PostgreSQL service found: postgresql-x64-16
    sc start postgresql-x64-16
) else (
    sc query postgresql-x64-15 >nul 2>nul
    if %ERRORLEVEL% == 0 (
        echo PostgreSQL service found: postgresql-x64-15
        sc start postgresql-x64-15
    ) else (
        echo PostgreSQL service not found, trying generic name...
        net start postgresql*
    )
)

:: Test database connection
echo.
echo Testing database connection...
set PGPASSWORD=postgres
"%PG_PATH%\psql.exe" -U postgres -d postgres -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Database connection successful!
) else (
    echo Database connection failed. You may need to:
    echo 1. Set the postgres user password
    echo 2. Start the PostgreSQL service manually
    echo 3. Check firewall settings
)

echo.
echo PostgreSQL setup completed!
echo.
echo Next steps:
echo 1. Run: node setup-database.js
echo 2. Start server: node database-production-server.js
echo.
echo Connection details:
echo   Host: localhost
echo   Port: 5432
echo   Username: postgres
echo   Password: postgres
echo.
pause
