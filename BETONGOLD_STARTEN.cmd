@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  powershell.exe -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Zum Starten fehlt Node.js. Bitte Node.js installieren oder den manuellen Start aus README.md verwenden.','Betongold Tycoon')" >nul
  exit /b 1
)

set "BETONGOLD_ROOT=%CD%"
powershell.exe -NoProfile -WindowStyle Hidden -Command "try { Start-Process -FilePath 'node.exe' -ArgumentList @('tools/start-game.mjs') -WorkingDirectory $env:BETONGOLD_ROOT -WindowStyle Hidden -ErrorAction Stop } catch { Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(('Betongold Tycoon konnte nicht gestartet werden: ' + $_.Exception.Message),'Betongold Tycoon') | Out-Null; exit 1 }"
endlocal
