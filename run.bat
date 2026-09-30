@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   CareQueue Assist - Local Development Launcher
echo   (Assistive Clinical Prioritization Radar)
echo ===================================================
echo.

:: Ensure we are at project root
cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "CareQueue Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
cd frontend
start "CareQueue Frontend (Vite)" cmd /k "npm run dev"

echo.
echo Both servers initiated in separate console windows.
echo - Backend API:  http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo - Web Dashboard: http://localhost:5173
echo.
pause
