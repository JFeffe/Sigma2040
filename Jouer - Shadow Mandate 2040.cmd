@echo off
setlocal
title Shadow Mandate 2040

cd /d "%~dp0" || goto :failure
where node.exe >nul 2>&1
if errorlevel 1 (
    echo Node.js est introuvable. Installez Node.js, puis relancez ce fichier.
    goto :failure
)

if not exist "node_modules\vite\bin\vite.js" (
    echo Installation des composants du jeu...
    call npm.cmd ci --no-audit --no-fund
    if errorlevel 1 goto :failure
)

echo Ouverture de Shadow Mandate 2040 dans votre navigateur...
echo Laissez cette fenetre ouverte pendant la partie.
node "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo Le jeu n'a pas pu demarrer. Consultez le message ci-dessus.
pause
exit /b 1
