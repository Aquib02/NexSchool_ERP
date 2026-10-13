Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          Starting School Management ERP System" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

if (-not (Test-Path "$baseDir\backend\.env")) {
    Write-Host "[.env] Creating backend\.env from template..." -ForegroundColor Yellow
    Copy-Item "$baseDir\backend\.env.example" "$baseDir\backend\.env"
}

if (-not (Test-Path "$baseDir\backend\node_modules")) {
    Write-Host "[Backend] Installing packages..." -ForegroundColor Yellow
    npm --prefix "$baseDir\backend" install
    Write-Host "[Database] Seeding initial roles and users..." -ForegroundColor Yellow
    npm --prefix "$baseDir\backend" run seed
    npm --prefix "$baseDir\backend" run seed:demo
}

if (-not (Test-Path "$baseDir\frontend\node_modules")) {
    Write-Host "[Frontend] Installing packages..." -ForegroundColor Yellow
    npm --prefix "$baseDir\frontend" install
}

Write-Host "Launching Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\backend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Launching Frontend App on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Both services are running in separate terminal windows:" -ForegroundColor Green
Write-Host "  - Web Application: http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend API:     http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  - Default Login:   admin / Admin@12345" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Green
