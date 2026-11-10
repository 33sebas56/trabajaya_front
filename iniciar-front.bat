@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 22 LTS o superior y vuelve a abrir la terminal.
  pause
  exit /b 1
)
echo TrabajaYA Frontend - http://localhost:5173
echo Abre esa direccion en tu navegador. Ctrl+C para detener.
node server.mjs
if errorlevel 1 pause
