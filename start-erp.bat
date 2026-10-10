@echo off
title School ERP Launcher
echo ================================================================
echo           Starting School Management ERP System
echo ================================================================
echo.
echo Launching Backend Server on port 5000...
start "School ERP - Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Waiting for backend initialization...
timeout /t 4 /nobreak > nul

echo Launching Frontend App on port 5173...
start "School ERP - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================================================
echo Both services are now running:
echo   - Web Application: http://localhost:5173
echo   - Backend API:     http://localhost:5000/api/health
echo   - Default Login:   admin / Admin@12345
echo ================================================================
echo.
pause
