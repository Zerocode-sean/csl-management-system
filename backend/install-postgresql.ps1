# PostgreSQL Installation Script for Windows
# This script will install PostgreSQL using various methods

Write-Host "🗄️ PostgreSQL Installation Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green

# PostgreSQL Configuration
$pgVersion = "16"
$pgPassword = "postgres"
$installPath = "C:\Program Files\PostgreSQL\$pgVersion"

Write-Host "`n📋 Installation Configuration:" -ForegroundColor Yellow
Write-Host "   Version: PostgreSQL $pgVersion" -ForegroundColor White
Write-Host "   Install Path: $installPath" -ForegroundColor White
Write-Host "   Default Password: $pgPassword" -ForegroundColor White

# Method 1: Try winget
Write-Host "`n1️⃣ Attempting installation via winget..." -ForegroundColor Cyan
try {
    $wingetResult = winget list PostgreSQL.PostgreSQL 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PostgreSQL already installed via winget" -ForegroundColor Green
    } else {
        Write-Host "   Installing PostgreSQL via winget..." -ForegroundColor Yellow
        winget install PostgreSQL.PostgreSQL --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ PostgreSQL installed successfully via winget" -ForegroundColor Green
            $installSuccess = $true
        } else {
            Write-Host "   ❌ winget installation failed" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ winget not available or failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: Try chocolatey if winget failed
if (-not $installSuccess) {
    Write-Host "`n2️⃣ Attempting installation via chocolatey..." -ForegroundColor Cyan
    try {
        $chocoCheck = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoCheck) {
            Write-Host "   Installing PostgreSQL via chocolatey..." -ForegroundColor Yellow
            choco install postgresql --confirm --params "/Password:$pgPassword"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ PostgreSQL installed successfully via chocolatey" -ForegroundColor Green
                $installSuccess = $true
            } else {
                Write-Host "   ❌ Chocolatey installation failed" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Chocolatey not available" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Chocolatey installation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Method 3: Direct download if package managers failed
if (-not $installSuccess) {
    Write-Host "`n3️⃣ Attempting direct download installation..." -ForegroundColor Cyan
    
    $downloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
    $installerPath = "$env:TEMP\postgresql-installer.exe"
    
    try {
        Write-Host "   Downloading PostgreSQL installer..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        
        Write-Host "   Running installer..." -ForegroundColor Yellow
        $installArgs = @(
            "--mode", "unattended",
            "--unattendedmodeui", "none", 
            "--superpassword", $pgPassword,
            "--enable-components", "server,pgAdmin,stackbuilder,commandlinetools"
        )
        
        Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait
        
        if (Test-Path "$installPath\bin\psql.exe") {
            Write-Host "   ✅ PostgreSQL installed successfully via direct download" -ForegroundColor Green
            $installSuccess = $true
        } else {
            Write-Host "   ❌ Direct installation failed" -ForegroundColor Red
        }
        
        # Clean up installer
        Remove-Item $installerPath -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "   ❌ Direct download failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verify installation
Write-Host "`n🔍 Verifying PostgreSQL installation..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin", 
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin"
)

$pgBinPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $pgBinPath = $path
        Write-Host "   ✅ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $pgBinPath) {
    Write-Host "   ❌ PostgreSQL installation not found" -ForegroundColor Red
    Write-Host "`n🔧 Manual Installation Required:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "   2. Run the installer as Administrator" -ForegroundColor White
    Write-Host "   3. Set password to: $pgPassword" -ForegroundColor White
    Write-Host "   4. Install all components (Server, pgAdmin, Command Line Tools)" -ForegroundColor White
    exit 1
}

# Add PostgreSQL to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
if ($currentPath -notlike "*$pgBinPath*") {
    Write-Host "   Adding PostgreSQL to system PATH..." -ForegroundColor Yellow
    $newPath = "$currentPath;$pgBinPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::Machine)
    $env:PATH = "$env:PATH;$pgBinPath"
    Write-Host "   ✅ PostgreSQL added to PATH" -ForegroundColor Green
}

# Test PostgreSQL version
try {
    $psqlPath = "$pgBinPath\psql.exe"
    $versionOutput = & $psqlPath --version 2>$null
    if ($versionOutput) {
        Write-Host "   ✅ PostgreSQL Version: $versionOutput" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not get PostgreSQL version" -ForegroundColor Yellow
}

# Check PostgreSQL service
Write-Host "`n🔧 Configuring PostgreSQL service..." -ForegroundColor Cyan

$pgServices = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgServices) {
    foreach ($service in $pgServices) {
        Write-Host "   Found service: $($service.Name) - Status: $($service.Status)" -ForegroundColor White
        if ($service.Status -ne "Running") {
            try {
                Write-Host "   Starting PostgreSQL service..." -ForegroundColor Yellow
                Start-Service -Name $service.Name
                Write-Host "   ✅ PostgreSQL service started" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ✅ PostgreSQL service is already running" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ⚠️  No PostgreSQL service found" -ForegroundColor Yellow
}

# Test database connection
Write-Host "`n🔗 Testing database connection..." -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $pgPassword
    $testResult = & $psqlPath -U postgres -d postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        Write-Host "   Database is ready for CSL Management System" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "   You may need to set up the postgres user password" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary and next steps
Write-Host "`n🎉 PostgreSQL Installation Summary" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

if ($pgBinPath) {
    Write-Host "✅ Installation: SUCCESS" -ForegroundColor Green
    Write-Host "✅ Location: $pgBinPath" -ForegroundColor Green
    Write-Host "✅ PATH: Updated" -ForegroundColor Green
    Write-Host "✅ Service: Configured" -ForegroundColor Green
    
    Write-Host "`n📋 Connection Details:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 5432" -ForegroundColor White
    Write-Host "   Username: postgres" -ForegroundColor White
    Write-Host "   Password: $pgPassword" -ForegroundColor White
    
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Close and reopen PowerShell/Command Prompt" -ForegroundColor White
    Write-Host "2. Run: node setup-database.js" -ForegroundColor White
    Write-Host "3. Start the enhanced server: node database-production-server.js" -ForegroundColor White
    
} else {
    Write-Host "❌ Installation: FAILED" -ForegroundColor Red
    Write-Host "Please install PostgreSQL manually from:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor White
}

Write-Host "`n✨ Installation script completed!" -ForegroundColor Magenta
