Write-Host "🚀 PostgreSQL Direct Installation for CSL Management System" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

Write-Host "`n🔍 Checking system requirements..." -ForegroundColor Yellow
Write-Host "   Admin privileges: $(if($isAdmin) {'✅ Yes'} else {'❌ No (required)'})" -ForegroundColor $(if($isAdmin) {'Green'} else {'Red'})
Write-Host "   Operating System: $((Get-WmiObject -class Win32_OperatingSystem).Caption)" -ForegroundColor White
Write-Host "   Architecture: $env:PROCESSOR_ARCHITECTURE" -ForegroundColor White

if (-not $isAdmin) {
    Write-Host "`n❌ Administrator privileges required for installation" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway (installation may fail)"
}

# Configuration
$pgVersion = "16.4"
$downloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-$pgVersion-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"
$installDir = "C:\Program Files\PostgreSQL\16"
$password = "postgres"

Write-Host "`n📋 Installation Configuration:" -ForegroundColor Cyan
Write-Host "   Version: PostgreSQL $pgVersion" -ForegroundColor White
Write-Host "   Download URL: $downloadUrl" -ForegroundColor White
Write-Host "   Install Directory: $installDir" -ForegroundColor White
Write-Host "   Default Password: $password" -ForegroundColor White

# Step 1: Check if already installed
Write-Host "`n1️⃣ Checking for existing installation..." -ForegroundColor Yellow

if (Test-Path "$installDir\bin\psql.exe") {
    Write-Host "   ✅ PostgreSQL already installed at $installDir" -ForegroundColor Green
    $pgBinPath = "$installDir\bin"
} else {
    # Check other common locations
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files\PostgreSQL\13\bin",
        "C:\Program Files (x86)\PostgreSQL\16\bin"
    )
    
    $pgBinPath = $null
    foreach ($path in $commonPaths) {
        if (Test-Path "$path\psql.exe") {
            Write-Host "   ✅ Found PostgreSQL at $path" -ForegroundColor Green
            $pgBinPath = $path
            break
        }
    }
    
    if (-not $pgBinPath) {
        Write-Host "   ❌ PostgreSQL not found, proceeding with installation..." -ForegroundColor Red
        
        # Step 2: Download PostgreSQL
        Write-Host "`n2️⃣ Downloading PostgreSQL..." -ForegroundColor Yellow
        
        try {
            Write-Host "   Downloading from: $downloadUrl" -ForegroundColor White
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($downloadUrl, $installerPath)
            Write-Host "   ✅ Download completed: $installerPath" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "`n💡 Manual download option:" -ForegroundColor Yellow
            Write-Host "   1. Visit: https://www.postgresql.org/download/windows/" -ForegroundColor White
            Write-Host "   2. Download PostgreSQL 16.x for Windows x64" -ForegroundColor White
            Write-Host "   3. Run the installer as Administrator" -ForegroundColor White
            exit 1
        }
        
        # Step 3: Install PostgreSQL
        Write-Host "`n3️⃣ Installing PostgreSQL..." -ForegroundColor Yellow
        
        try {
            $installArgs = @(
                "--mode", "unattended",
                "--unattendedmodeui", "minimal",
                "--superpassword", $password,
                "--enable-components", "server,pgAdmin,stackbuilder,commandlinetools",
                "--datadir", "$installDir\data",
                "--servicename", "postgresql-x64-16",
                "--serviceaccount", "NT AUTHORITY\NetworkService",
                "--locale", "English, United States"
            )
            
            Write-Host "   Running installer with unattended mode..." -ForegroundColor White
            $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
            
            if ($process.ExitCode -eq 0) {
                Write-Host "   ✅ PostgreSQL installation completed" -ForegroundColor Green
                $pgBinPath = "$installDir\bin"
            } else {
                Write-Host "   ❌ Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
                throw "Installation failed"
            }
            
        } catch {
            Write-Host "   ❌ Installation error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "`n💡 Manual installation required:" -ForegroundColor Yellow
            Write-Host "   1. Run the downloaded installer: $installerPath" -ForegroundColor White
            Write-Host "   2. Use these settings:" -ForegroundColor White
            Write-Host "      - Password: $password" -ForegroundColor White
            Write-Host "      - Port: 5432" -ForegroundColor White
            Write-Host "      - Install all components" -ForegroundColor White
            Read-Host "Press Enter after manual installation is complete"
            
            # Check again after manual installation
            if (Test-Path "$installDir\bin\psql.exe") {
                $pgBinPath = "$installDir\bin"
            } else {
                Write-Host "   ❌ Installation verification failed" -ForegroundColor Red
                exit 1
            }
        }
        
        # Clean up installer
        try {
            Remove-Item $installerPath -ErrorAction SilentlyContinue
        } catch {}
    }
}

# Step 4: Configure PostgreSQL
Write-Host "`n4️⃣ Configuring PostgreSQL..." -ForegroundColor Yellow

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
if ($currentPath -notlike "*$pgBinPath*") {
    try {
        Write-Host "   Adding PostgreSQL to system PATH..." -ForegroundColor White
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$pgBinPath", [EnvironmentVariableTarget]::Machine)
        $env:PATH = "$env:PATH;$pgBinPath"
        Write-Host "   ✅ PostgreSQL added to PATH" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not update system PATH (requires admin rights)" -ForegroundColor Yellow
        Write-Host "   Adding to session PATH temporarily..." -ForegroundColor White
        $env:PATH = "$env:PATH;$pgBinPath"
    }
} else {
    Write-Host "   ✅ PostgreSQL already in PATH" -ForegroundColor Green
}

# Step 5: Start PostgreSQL Service
Write-Host "`n5️⃣ Starting PostgreSQL service..." -ForegroundColor Yellow

$serviceNames = @("postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14", "PostgreSQL")
$serviceStarted = $false

foreach ($serviceName in $serviceNames) {
    try {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Write-Host "   Found service: $serviceName (Status: $($service.Status))" -ForegroundColor White
            if ($service.Status -ne "Running") {
                Start-Service -Name $serviceName
                Write-Host "   ✅ Service started: $serviceName" -ForegroundColor Green
            } else {
                Write-Host "   ✅ Service already running: $serviceName" -ForegroundColor Green
            }
            $serviceStarted = $true
            break
        }
    } catch {
        Write-Host "   ❌ Failed to start service $serviceName`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $serviceStarted) {
    Write-Host "   ⚠️  No PostgreSQL service found or could not be started" -ForegroundColor Yellow
    Write-Host "   You may need to start it manually from Services.msc" -ForegroundColor Yellow
}

# Step 6: Test PostgreSQL
Write-Host "`n6️⃣ Testing PostgreSQL installation..." -ForegroundColor Yellow

try {
    # Test version
    $versionOutput = & "$pgBinPath\psql.exe" --version 2>$null
    Write-Host "   ✅ PostgreSQL Version: $versionOutput" -ForegroundColor Green
    
    # Test connection
    $env:PGPASSWORD = $password
    $connectionTest = & "$pgBinPath\psql.exe" -U postgres -d postgres -c "SELECT 'Connection successful!' as status;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful!" -ForegroundColor Green
        $dbReady = $true
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "   This might be due to:" -ForegroundColor Yellow
        Write-Host "   - Service not running" -ForegroundColor White
        Write-Host "   - Incorrect password" -ForegroundColor White
        Write-Host "   - Configuration issues" -ForegroundColor White
        $dbReady = $false
    }
    
} catch {
    Write-Host "   ❌ PostgreSQL test failed: $($_.Exception.Message)" -ForegroundColor Red
    $dbReady = $false
}

# Step 7: Setup CSL Database
if ($dbReady) {
    Write-Host "`n7️⃣ Setting up CSL Management System database..." -ForegroundColor Yellow
    
    try {
        Write-Host "   Running CSL database setup script..." -ForegroundColor White
        node flexible-database-setup.js
        Write-Host "   ✅ CSL database setup completed" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ CSL database setup failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   You can run it manually later: node flexible-database-setup.js" -ForegroundColor Yellow
    }
}

# Final Summary
Write-Host "`n🎉 PostgreSQL Setup Summary" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

if ($pgBinPath -and (Test-Path "$pgBinPath\psql.exe")) {
    Write-Host "✅ Installation: SUCCESS" -ForegroundColor Green
    Write-Host "✅ Location: $pgBinPath" -ForegroundColor Green
    Write-Host "✅ PATH: Configured" -ForegroundColor Green
    Write-Host "$(if($serviceStarted) {'✅'} else {'⚠️ '}) Service: $(if($serviceStarted) {'Running'} else {'Check manually'})" -ForegroundColor $(if($serviceStarted) {'Green'} else {'Yellow'})
    Write-Host "$(if($dbReady) {'✅'} else {'⚠️ '}) Database: $(if($dbReady) {'Ready'} else {'Needs configuration'})" -ForegroundColor $(if($dbReady) {'Green'} else {'Yellow'})
    
    Write-Host "`n📋 Connection Details:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 5432" -ForegroundColor White
    Write-Host "   Username: postgres" -ForegroundColor White
    Write-Host "   Password: $password" -ForegroundColor White
    
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
    if ($dbReady) {
        Write-Host "1. Start CSL server: node database-production-server.js" -ForegroundColor White
        Write-Host "2. Test API: curl http://localhost:5001/health" -ForegroundColor White
        Write-Host "3. View API docs: http://localhost:5001/api-docs" -ForegroundColor White
    } else {
        Write-Host "1. Fix database connection (check service and password)" -ForegroundColor White
        Write-Host "2. Run: node flexible-database-setup.js" -ForegroundColor White
        Write-Host "3. Start server: node database-production-server.js" -ForegroundColor White
    }
    
} else {
    Write-Host "❌ Installation: FAILED" -ForegroundColor Red
    Write-Host "`n💡 Manual installation required:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Run as Administrator" -ForegroundColor White
    Write-Host "3. Use password: $password" -ForegroundColor White
    Write-Host "4. Run this script again after installation" -ForegroundColor White
}

Write-Host "`n✨ Setup script completed!" -ForegroundColor Magenta
Write-Host "Press Enter to continue..." -ForegroundColor White
Read-Host
