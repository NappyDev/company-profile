@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Pasang Node.js LTS dari https://nodejs.org lalu buka file ini lagi.
  pause
  exit /b 1
)
node dashboard/server.mjs --open
pause
