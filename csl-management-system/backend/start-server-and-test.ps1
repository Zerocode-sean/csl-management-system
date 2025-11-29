#!/usr/bin/env pwsh

Write-Host "🚀 Starting CSL Backend Server and Running Tests" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Kill any existing node processes on port 5001
Write-Host "Checking for existing processes on port 5001..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($existingProcess) {
    $pid = $existingProcess.OwningProcess
    Write-Host "Killing existing process with PID: $pid" -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start the enhanced production server
Write-Host "Starting enhanced production server..." -ForegroundColor Green
$serverJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"
    node enhanced-production-start.js
}

Write-Host "Server job started with ID: $($serverJob.Id)" -ForegroundColor Green

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if server is running
$serverRunning = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "✅ Server is running on port 5001!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Attempt $i: Server not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $serverRunning) {
    Write-Host "❌ Failed to start server after 10 attempts" -ForegroundColor Red
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
    exit 1
}

# Run the test suites
Write-Host "`n🧪 Running Test Suites" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

Write-Host "`n1️⃣ Connection Test:" -ForegroundColor Yellow
try {
    node connection-test.js
} catch {
    Write-Host "Connection test failed: $_" -ForegroundColor Red
}

Write-Host "`n2️⃣ Comprehensive Test:" -ForegroundColor Yellow
try {
    node comprehensive-test.js
} catch {
    Write-Host "Comprehensive test failed: $_" -ForegroundColor Red
}

Write-Host "`n3️⃣ Enhanced Test Suite:" -ForegroundColor Yellow
try {
    node enhanced-test-suite.js
} catch {
    Write-Host "Enhanced test suite failed: $_" -ForegroundColor Red
}

Write-Host "`n4️⃣ Quick Test:" -ForegroundColor Yellow
try {
    node quick-test.js
} catch {
    Write-Host "Quick test failed: $_" -ForegroundColor Red
}

# Keep server running for manual testing
Write-Host "`n🎯 Tests completed! Server is still running for manual testing." -ForegroundColor Green
Write-Host "Server URL: http://localhost:5001" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:5001/health" -ForegroundColor Cyan
Write-Host "Swagger Docs: http://localhost:5001/api-docs" -ForegroundColor Cyan
Write-Host "`nTo stop the server, run: Stop-Job -Id $($serverJob.Id); Remove-Job -Id $($serverJob.Id)" -ForegroundColor Yellow

# Display server job info
Get-Job -Id $serverJob.Id
