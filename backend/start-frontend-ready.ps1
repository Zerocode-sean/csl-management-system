# Frontend-Ready Backend Startup Script
# Run this script to start the backend server for React frontend integration

Write-Host "🚀 Starting Frontend-Ready Backend Server..." -ForegroundColor Green
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Change to backend directory
$backendDir = "c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend"
Set-Location $backendDir

Write-Host "📂 Changed to: $backendDir" -ForegroundColor Yellow

# Check if the backend file exists
if (Test-Path "frontend-ready-backend.js") {
    Write-Host "✅ Found frontend-ready-backend.js" -ForegroundColor Green
    Write-Host "🔄 Starting Node.js server..." -ForegroundColor Cyan
    
    # Start the backend server
    node frontend-ready-backend.js
} else {
    Write-Host "❌ Error: frontend-ready-backend.js not found!" -ForegroundColor Red
    Write-Host "📋 Available files:" -ForegroundColor Yellow
    Get-ChildItem *.js | Select-Object Name
}

Write-Host "⚠️  Press any key to continue..." -ForegroundColor Magenta
Read-Host
