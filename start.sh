#!/usr/bin/env bash
# CareQueue Assist - Local Startup Script for Unix/macOS/Git Bash

set -e

# Change to script directory (project root)
cd "$(dirname "$0")"

echo "==================================================="
echo "  CareQueue Assist - Local Development Launcher"
echo "  (Assistive Clinical Prioritization Radar)"
echo "==================================================="
echo ""

echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Starting Vite Frontend on http://localhost:5173 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "CareQueue Assist is running:"
echo " - Backend API:  http://127.0.0.1:8000"
echo " - Swagger Docs: http://127.0.0.1:8000/docs"
echo " - Web UI:       http://localhost:5173"
echo ""
echo "Press Ctrl+C to terminate both servers."

wait
