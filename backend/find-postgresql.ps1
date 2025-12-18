Write-Host "🔍 PostgreSQL Service Discovery and Startup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Check all services that might be PostgreSQL
Write-Host "`n1️⃣ Looking for PostgreSQL services..." -ForegroundColor Yellow
$pgServices = Get-Service | Where-Object {$_.Name -like "*postgres*" -or $_.DisplayName -like "*PostgreSQL*"}

if ($pgServices) {
    Write-Host "Found PostgreSQL services:" -ForegroundColor Green
    foreach ($service in $pgServices) {
        Write-Host "   Name: $($service.Name) - Status: $($service.Status) - Display: $($service.DisplayName)" -ForegroundColor White
        
        if ($service.Status -eq "Stopped") {
            Write-Host "   Attempting to start $($service.Name)..." -ForegroundColor Yellow
            try {
                Start-Service -Name $service.Name
                Write-Host "   ✅ Service started successfully" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
            }
        } elseif ($service.Status -eq "Running") {
            Write-Host "   ✅ Service is already running" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ No PostgreSQL services found" -ForegroundColor Red
}

# Check for PostgreSQL installations
Write-Host "`n2️⃣ Looking for PostgreSQL installations..." -ForegroundColor Yellow

$possiblePaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:LOCALAPPDATA\PostgreSQL",
    "$env:APPDATA\PostgreSQL"
)

$foundInstallations = @()
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $versions = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue
        foreach ($version in $versions) {
            $binPath = Join-Path $version.FullName "bin"
            $psqlPath = Join-Path $binPath "psql.exe"
            if (Test-Path $psqlPath) {
                $foundInstallations += @{
                    Version = $version.Name
                    Path = $version.FullName
                    BinPath = $binPath
                    PsqlPath = $psqlPath
                }
                Write-Host "   ✅ Found PostgreSQL $($version.Name) at: $($version.FullName)" -ForegroundColor Green
            }
        }
    }
}

if ($foundInstallations.Count -eq 0) {
    Write-Host "❌ No PostgreSQL installations found" -ForegroundColor Red
    Write-Host "`n💡 Please verify PostgreSQL installation:" -ForegroundColor Yellow
    Write-Host "   1. Check if PostgreSQL was installed correctly" -ForegroundColor White
    Write-Host "   2. Look for PostgreSQL in Start Menu" -ForegroundColor White
    Write-Host "   3. Try reinstalling PostgreSQL" -ForegroundColor White
    exit 1
}

# Use the first found installation
$pgInstall = $foundInstallations[0]
Write-Host "`n3️⃣ Using PostgreSQL installation:" -ForegroundColor Yellow
Write-Host "   Version: $($pgInstall.Version)" -ForegroundColor White
Write-Host "   Path: $($pgInstall.Path)" -ForegroundColor White

# Add to PATH temporarily
$env:PATH = "$env:PATH;$($pgInstall.BinPath)"

# Test PostgreSQL
Write-Host "`n4️⃣ Testing PostgreSQL..." -ForegroundColor Yellow
try {
    $versionOutput = & "$($pgInstall.PsqlPath)" --version 2>$null
    Write-Host "   ✅ Version: $versionOutput" -ForegroundColor Green
    
    # Test connection (assuming default password)
    Write-Host "`n5️⃣ Testing database connection..." -ForegroundColor Yellow
    $env:PGPASSWORD = "postgres"
    
    $testResult = & "$($pgInstall.PsqlPath)" -U postgres -d postgres -c "SELECT 'Connection successful!' as status;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful!" -ForegroundColor Green
        Write-Host "   PostgreSQL is ready for use" -ForegroundColor Green
        
        # Update PATH permanently
        Write-Host "`n6️⃣ Updating system PATH..." -ForegroundColor Yellow
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
        if ($currentPath -notlike "*$($pgInstall.BinPath)*") {
            $newPath = "$currentPath;$($pgInstall.BinPath)"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::User)
            Write-Host "   ✅ PostgreSQL added to user PATH" -ForegroundColor Green
        } else {
            Write-Host "   ✅ PostgreSQL already in PATH" -ForegroundColor Green
        }
        
        Write-Host "`n🎉 PostgreSQL Setup Complete!" -ForegroundColor Green
        Write-Host "=============================" -ForegroundColor Green
        Write-Host "✅ PostgreSQL found and working" -ForegroundColor Green
        Write-Host "✅ Database connection verified" -ForegroundColor Green
        Write-Host "✅ PATH updated" -ForegroundColor Green
        
        Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Close and reopen PowerShell/Command Prompt" -ForegroundColor White
        Write-Host "2. Run: node flexible-database-setup.js" -ForegroundColor White
        Write-Host "3. Start server: node database-production-server.js" -ForegroundColor White
        
        Write-Host "`n🔗 Connection Details:" -ForegroundColor Cyan
        Write-Host "   Host: localhost" -ForegroundColor White
        Write-Host "   Port: 5432" -ForegroundColor White
        Write-Host "   Username: postgres" -ForegroundColor White
        Write-Host "   Password: postgres" -ForegroundColor White
        
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "   This might be due to:" -ForegroundColor Yellow
        Write-Host "   - Incorrect password" -ForegroundColor White
        Write-Host "   - PostgreSQL service not running" -ForegroundColor White
        Write-Host "   - Connection settings" -ForegroundColor White
        
        Write-Host "`n💡 Try these solutions:" -ForegroundColor Yellow
        Write-Host "1. Set postgres user password:" -ForegroundColor White
        Write-Host "   ALTER USER postgres PASSWORD 'postgres';" -ForegroundColor Gray
        Write-Host "2. Check PostgreSQL service is running" -ForegroundColor White
        Write-Host "3. Verify pg_hba.conf allows local connections" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ❌ PostgreSQL test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✨ PostgreSQL discovery completed!" -ForegroundColor Magenta
