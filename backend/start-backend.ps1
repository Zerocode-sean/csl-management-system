# PowerShell script to start CSL backend
Write-Host "🚀 Starting CSL Backend Server..." -ForegroundColor Green

# Change to backend directory
$backendPath = "C:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"
Set-Location $backendPath

# Start the emergency backend server
Write-Host "Starting emergency backend with mock data..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "emergency-backend.js" -WindowStyle Normal

# Wait and test
Start-Sleep -Seconds 5

Write-Host "Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing
    Write-Host "✅ Backend is running! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n💡 Backend should now be running on: http://localhost:5001" -ForegroundColor Blue
Write-Host "💡 Test students API: http://localhost:5001/api/v1/students" -ForegroundColor Blue

# Keep window open
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
