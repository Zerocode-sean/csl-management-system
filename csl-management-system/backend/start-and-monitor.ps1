# Start Test Server and Monitor
Write-Host "🚀 Starting Test Backend Server..." -ForegroundColor Green

# Kill any existing process on port 5001
try {
    $processes = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        Write-Host "🔄 Killed existing process on port 5001" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "ℹ️  No existing process found on port 5001" -ForegroundColor Cyan
}

# Start the server
Write-Host "📡 Starting Node.js server..." -ForegroundColor Cyan
$job = Start-Job -ScriptBlock {
    Set-Location "c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"
    node test-server-start.js
}

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Check if server is running
Write-Host "🔍 Checking server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running successfully!" -ForegroundColor Green
        Write-Host "📊 Response: $($response.Content)" -ForegroundColor Cyan
        
        # Test CORS
        Write-Host "🔗 Testing CORS..." -ForegroundColor Yellow
        $corsHeaders = @{
            'Origin' = 'http://localhost:3000'
        }
        $corsResponse = Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET -Headers $corsHeaders -TimeoutSec 5
        Write-Host "✅ CORS test successful!" -ForegroundColor Green
        Write-Host "📋 CORS Headers: $($corsResponse.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Cyan
        
        Write-Host "`n🎉 Backend server is ready for frontend integration!" -ForegroundColor Green
        Write-Host "🌐 Server URL: http://localhost:5001" -ForegroundColor Cyan
        Write-Host "🔗 CORS enabled for: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "`n💡 Press Ctrl+C to stop the server" -ForegroundColor Yellow
        
        # Keep the job running
        Write-Host "`n⏳ Server running... (Job ID: $($job.Id))" -ForegroundColor Magenta
        
    } else {
        Write-Host "❌ Server responded with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to connect to server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Checking job status..." -ForegroundColor Yellow
    Get-Job $job.Id | Receive-Job
}
