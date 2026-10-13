@echo off
title School ERP Launcher
echo ================================================================
echo           Starting School Management ERP System
echo ================================================================
echo.

set "ROOT_DIR=%~dp0"

if not exist "%ROOT_DIR%backend\.env" (
    echo [.env] Setting up backend\.env from template...
    copy "%ROOT_DIR%backend\.env.example" "%ROOT_DIR%backend\.env" > nul
)

if not exist "%ROOT_DIR%backend\node_modules" (
    echo [Backend] Installing dependencies...
    cd /d "%ROOT_DIR%backend" && call npm install
    echo [Backend] Seeding initial database...
    call npm run seed
    call npm run seed:demo
)

if not exist "%ROOT_DIR%frontend\node_modules" (
    echo [Frontend] Installing dependencies...
    cd /d "%ROOT_DIR%frontend" && call npm install
)

echo Launching Backend Server on port 5000...
start "School ERP - Backend (Port 5000)" cmd /k "cd /d "%ROOT_DIR%backend" && npm run dev"

echo Waiting for backend initialization...
timeout /t 4 /nobreak > nul

echo Launching Frontend App on port 5173...
start "School ERP - Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ================================================================
echo Both services are now running:
echo   - Web Application: http://localhost:5173
echo   - Backend API:     http://localhost:5000/api/health
echo   - Default Login:   admin / Admin@12345
echo ================================================================
echo.
pause
